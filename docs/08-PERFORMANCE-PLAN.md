# Performance Plan — Intelligent Training Companion

**Version:** 1.0
**Date:** March 3, 2026
**Status:** Reviewed
**Inputs:** 04-SYSTEM-ARCHITECTURE.md, 05-BACKEND-ARCHITECTURE.md, 06-FRONTEND-ARCHITECTURE.md, 03-RESEARCH-FINDINGS.md

---

## Table of Contents

1. [Performance Budgets](#1-performance-budgets)
2. [Rendering Optimization](#2-rendering-optimization)
3. [Database Performance](#3-database-performance)
4. [Animation Performance](#4-animation-performance)
5. [Memory Management](#5-memory-management)
6. [Network Optimization](#6-network-optimization)
7. [Startup Performance](#7-startup-performance)
8. [Monitoring Plan](#8-monitoring-plan)
9. [Anti-Patterns to Avoid](#9-anti-patterns-to-avoid)

---

## 1. Performance Budgets

### 1.1 Interaction Latency

| Interaction | Budget | Measurement |
|------------|--------|-------------|
| Numpad key → value update | < 16ms (1 frame) | Legend State mutation + SetRow re-render |
| "Log Set" tap → visual confirmation | < 100ms | Zod validate + SQLite write + haptic + animation start |
| Exercise search (FTS5) | < 50ms | Keystroke to results |
| Rest timer arc | 60fps (16.6ms/frame) | Reanimated worklet on UI thread |
| RPE modal present | < 300ms | Spring animation complete |
| Workout start | < 500ms | Load prescription + hydrate Legend State |

### 1.2 App-Level Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| Time to Interactive (TTI) | < 2s | Cold start on mid-range Android (Pixel 6a class) |
| First Meaningful Paint | < 1s | Splash → home screen skeleton |
| JS Bundle Size | < 2MB | Hermes bytecode |
| APK Size | < 30MB | Including seed data and assets |
| RAM Usage (active workout) | < 150MB | Including SQLite + Legend State + UI |
| Frame drops per workout | < 5 | Measured via Sentry performance |

### 1.3 Database Budgets

| Query | Budget | Approach |
|-------|--------|----------|
| `findLastWithExercise` | < 10ms | Composite index `(exercise_name, user_id)` |
| `findRecent(14 days)` | < 15ms | Index `(user_id, date DESC)` |
| `setLogs` batch insert (5 sets) | < 20ms | Transaction + batch |
| FTS5 exercise search | < 30ms | Trigram tokenizer, < 500 records |
| sqlite-vec ANN search (top 5) | < 50ms | < 500 vectors |

---

## 2. Rendering Optimization

### 2.1 FlashList for Exercise Cards

```typescript
// FlashList recycles view instances — critical for workout with 5-8 exercises
<FlashList
  data={exercises}
  renderItem={renderExerciseCard}
  estimatedItemSize={300}     // average height in px — MUST be accurate
  keyExtractor={(item) => item.id}
  drawDistance={300}            // pre-render 300px above/below viewport
  overrideItemLayout={(layout, item) => {
    // Provide exact height if known (avoids measurement pass)
    layout.size = 80 + item.sets.length * 52; // header + set rows
  }}
/>
```

**Why not FlatList:** FlatList creates/destroys views on scroll. With 8 exercises × 4 sets = 32 SetRows, FlatList allocates new views aggressively. FlashList recycles, maintaining ~12 mounted views regardless of list size.

### 2.2 Memo Boundaries

```
ActiveWorkoutScreen (re-renders: prescription load, workout lifecycle)
  │
  ├── FlashList (re-renders: exercise add/remove only)
  │   └── ExerciseCard [React.memo] (re-renders: when exercise's set count changes)
  │       ├── ExerciseHeader [React.memo] (re-renders: never during workout)
  │       └── SetRow [React.memo] (re-renders: only when THIS set's data changes)
  │           └── NumericInput [React.memo] (re-renders: value or isActive change)
  │
  ├── CustomNumpad (separate tree — digit taps never re-render exercise list)
  │
  └── RestTimerCompact [observer] (Legend State — timer ticks never cascade)
```

**Key rule:** `SetRow` receives only primitive props (`weight: number`, `reps: number`, `rpe: number`). No object props that would break shallow comparison.

### 2.3 Legend State for Active Workout

```typescript
// Legend State fine-grained observables eliminate cascade re-renders

// BAD — Zustand: updating timer re-renders every component that reads workout state
const useWorkoutStore = create((set) => ({
  workout: { exercises: [], timer: { remaining: 120 } },
  tick: () => set(s => ({ workout: { ...s.workout, timer: { remaining: s.workout.timer.remaining - 1 } } })),
}));
// Every component subscribing to `workout` re-renders on every tick

// GOOD — Legend State: timer ticks only re-render TimerDisplay
const workoutSession$ = observable({
  exercises: [...],
  restTimer: { endTimestamp: 0, totalSeconds: 0 },
});

// TimerDisplay observes restTimer only
const TimerDisplay = observer(() => {
  const end = workoutSession$.restTimer.endTimestamp.get();
  // Only THIS component re-renders when endTimestamp changes
});

// SetRow observes its specific set only
const SetRow = observer(({ exerciseIdx, setIdx }) => {
  const weight = workoutSession$.exercises[exerciseIdx].sets[setIdx].weight.get();
  const reps = workoutSession$.exercises[exerciseIdx].sets[setIdx].reps.get();
  // Only THIS SetRow re-renders when its weight or reps change
});
```

### 2.4 Custom Numpad — No System Keyboard

The custom numpad eliminates two performance issues:
1. **Android numeric keyboard lag** — New Architecture `keyboardType="numeric"` has documented input lag
2. **Keyboard show/hide animation** — ~300ms per field focus change with system keyboard

```
With system keyboard:
  Tap weight → 300ms keyboard animate → type → tap reps → 300ms dismiss → 300ms show
  Total overhead: ~900ms per exercise

With custom numpad:
  Tap weight → instant focus → type → tap reps → instant focus → type
  Total overhead: 0ms (numpad already mounted)
```

---

## 3. Database Performance

### 3.1 WAL Mode

```typescript
// Enabled at database initialization
expoDb.execSync('PRAGMA journal_mode = WAL');
```

WAL mode provides:
- Concurrent reads during write transactions (critical for UI reads while saving sets)
- ~3x faster writes for single-user workloads
- No reader blocking during `saveCompleteWorkout` transaction

### 3.2 Index Strategy

```sql
-- Hot path: "what did I do last time for this exercise?"
CREATE INDEX idx_ep_exercise_name ON exercise_performances(exercise_name);
-- + JOIN with workouts via idx_workouts_user_date

-- Hot path: "show my recent workouts"
CREATE INDEX idx_workouts_user_date ON workouts(user_id, date DESC);

-- Hot path: "get sets for this exercise performance"
CREATE INDEX idx_sets_ep ON set_logs(exercise_performance_id);

-- Active workout recovery
CREATE INDEX idx_workouts_status ON workouts(user_id, status);

-- Memory retrieval by type
CREATE INDEX idx_memories_type_user ON agentic_memories(user_id, type);

-- AI cache lookup
-- Primary key on cache_key — no additional index needed
```

**Index overhead:** 7 indexes on 14 tables. With < 10,000 total rows in Phase 1, index maintenance cost is negligible (< 1ms per insert).

### 3.3 Query Optimization Patterns

```typescript
// GOOD — pagination with cursor (no OFFSET for large datasets)
async findRecentPaginated(userId: string, cursor: number, limit: number) {
  return db.query.workouts.findMany({
    where: and(
      eq(workouts.userId, userId),
      lt(workouts.date, cursor), // cursor = last item's date
      isNull(workouts.deletedAt),
    ),
    orderBy: [desc(workouts.date)],
    limit,
  });
}

// GOOD — select only needed columns for list views
async findRecent(userId: string, limit: number) {
  return db.query.workouts.findMany({
    columns: {
      id: true, date: true, type: true,
      durationMinutes: true, totalVolume: true, averageRpe: true,
    },
    // NOT loading ai_insights, notes, readiness fields for list
  });
}

// GOOD — batch insert sets in transaction
async saveWorkoutSets(sets: SetLogInsert[]) {
  await db.transaction(async (tx) => {
    for (const batch of chunk(sets, 50)) {
      await tx.insert(setLogs).values(batch);
    }
  });
}
// Single transaction = single WAL checkpoint = ~5ms for 20 sets
```

### 3.4 FTS5 Search Performance

```sql
-- Trigram tokenizer handles typos and partial matches
-- "bench" → matches "Barbell Bench Press", "Dumbbell Bench Press", "Incline Bench"
-- "squ" → matches "Squat", "Split Squat", "Goblet Squat"

-- With ~150 exercises, FTS5 search completes in < 5ms
-- With ~2000 exercises (future), still < 30ms

-- Optimization: rebuild FTS index only on seed data update, not on every search
```

---

## 4. Animation Performance

### 4.1 UI Thread Animations (Reanimated 3)

All interactive animations MUST run on the UI thread via Reanimated worklets. JS thread animations drop frames during SQLite writes or state updates.

```typescript
// GOOD — UI thread animation (60fps guaranteed)
const progress = useSharedValue(0);
progress.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) });

const animatedStyle = useAnimatedStyle(() => ({
  opacity: progress.value,
  transform: [{ scale: interpolate(progress.value, [0, 1], [0.95, 1]) }],
}));

// BAD — JS thread animation (drops frames during DB writes)
Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: false }).start();
```

### 4.2 Rest Timer Arc — 60fps Target

```typescript
// Timer arc runs continuously for 30-300 seconds
// MUST NOT cause frame drops even during set logging

// Approach: single withTiming from current to 0, linear easing
// Reanimated runs this entirely on UI thread — no JS thread involvement

function useTimerArc(endTimestamp: number, totalSeconds: number) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const remainingMs = endTimestamp - Date.now();
    const startFraction = 1 - (remainingMs / (totalSeconds * 1000));

    progress.value = startFraction;
    progress.value = withTiming(1, {
      duration: Math.max(0, remainingMs),
      easing: Easing.linear, // constant rate for timer
    });

    return () => cancelAnimation(progress);
  }, [endTimestamp]);

  return progress; // drives SVG arc strokeDashoffset
}

// Key: timer does NOT use setInterval or requestAnimationFrame
// It's a single declarative animation from Reanimated
```

### 4.3 Set Completion Animation

```
Tap "Log Set"
  ├── [0ms]   Haptic fires (native, no frame cost)
  ├── [0ms]   Checkbox fill starts (Reanimated, UI thread)
  ├── [0ms]   Row background color starts (Reanimated, UI thread)
  ├── [0-16ms] SQLite write (JSI, synchronous but fast)
  ├── [16ms]  First animated frame visible
  └── [200ms] Animation complete
```

The SQLite write and the animation start concurrently — the write doesn't block the animation because Reanimated runs on a separate thread.

### 4.4 Gesture Performance

```typescript
// Swipeable from RNGH runs on native thread
// No JS bridge calls during gesture — smooth 60fps

// Key: avoid onGestureEvent callbacks that trigger JS logic during gesture
// Only trigger JS (delete/duplicate) AFTER gesture completes (onSwipeableOpen)
```

---

## 5. Memory Management

### 5.1 Agentic Memory Budget

```
Max 500 memories per user (MEMORY_BUDGET constant)
  × ~200 bytes per memory text
  × ~1536 bytes per embedding (384 × f32)
  = ~870KB per user for all memory data

sqlite-vec index: ~500 × 384 × 4 bytes = ~768KB
Total memory footprint: ~1.6MB — well within mobile constraints
```

Pruning runs after every new memory insertion:
```typescript
if (count > MEMORY_BUDGET) {
  // Soft-delete lowest confidence memories
  pruneExpired(userId, MEMORY_BUDGET);
}
```

### 5.2 Workout History Pagination

Never load full workout history into memory:
```typescript
// historyStore holds last 14 days in memory (~20 workouts × ~5 exercises × ~4 sets)
// Estimated: ~50KB — negligible

// Older history loaded on-demand with cursor pagination
// Each page: 20 workouts, loaded as user scrolls
```

### 5.3 Image Caching

```typescript
// expo-image with tiered caching
import { Image } from 'expo-image';

<Image
  source={exerciseThumbUrl}
  style={{ width: 48, height: 48 }}
  contentFit="cover"
  cachePolicy="memory-disk" // check memory first, then disk
  transition={200}
  placeholder={blurhash}
/>

// Memory cache: ~50 recent exercise thumbnails × 10KB = ~500KB
// Disk cache: all viewed thumbnails, auto-evicted by OS
```

### 5.4 Store Hydration Memory

```
App launch memory progression:
  [0ms]   Base RN runtime: ~30MB
  [200ms] Zustand stores hydrate from SQLite: +5MB
  [400ms] Legend State workout recovery (if active): +2MB
  [500ms] Exercise seed data loaded: +3MB (500 exercises)
  [Idle]  Stable: ~40-50MB

Active workout adds:
  CustomNumpad mounted: +1MB
  FlashList + ExerciseCards: +5-10MB (depending on exercise count)
  Reanimated animations: +2MB
  Timer: negligible (single shared value)

  Total during workout: ~55-65MB (well under 150MB budget)
```

---

## 6. Network Optimization

### 6.1 PowerSync Sync Throttling

```typescript
const powerSyncConfig = {
  crudUploadThrottleMs: 200,   // batch uploads every 200ms (not per-record)
  retryDelayMs: 1000,          // initial retry delay
  maxRetryDelayMs: 30_000,     // max backoff: 30s
};
```

During active workout, sets are written to SQLite immediately but synced in background batches. No network call blocks the set logging path.

### 6.2 AI Response Caching

| Request Type | Cache TTL | Est. API Calls Saved |
|-------------|-----------|---------------------|
| Daily prescription | 8 hours | ~70% (user checks multiple times/day) |
| Mesocycle generation | 14 days | ~95% (generated once per cycle) |
| Post-workout analysis | No cache | 0% (unique per workout) |

### 6.3 Edge Function Response Times

| Request Type | Model | Expected Latency | Timeout |
|-------------|-------|------------------|---------|
| Daily prescription | claude-sonnet-4-6 | 2-4s | 10s |
| Mesocycle generation | claude-opus-4-6 | 5-15s | 30s |
| Post-workout analysis | claude-sonnet-4-6 | 3-5s | 10s |
| Embedding generation | Embedding API | 0.5-1s | 5s |

### 6.4 Offline-First Reduces API Calls

```
Total Claude API calls per user per week (estimated):
  Daily prescription: 7 per week (1 cache miss per day)
  Post-workout analysis: 4 per week (after each workout)
  Mesocycle generation: 0.07 per week (once per 14 weeks)
  Embedding generation: ~5 per week (new memories)

  ≈ 16 API calls per user per week
  ≈ 70 API calls per user per month

Without caching:
  ≈ 200+ API calls per user per month (3x more expensive)
```

---

## 7. Startup Performance

### 7.1 Startup Sequence

```
[0ms]     App process starts
[100ms]   Hermes bytecode loaded
[200ms]   React tree mounts, splash screen visible
[300ms]   SQLiteProvider renders → Suspense boundary shows loading
[350ms]   Drizzle migrations check (< 50ms if no new migrations)
[400ms]   Custom migrations (FTS5, sqlite-vec) — CREATE IF NOT EXISTS (< 20ms)
[450ms]   Seed data check — skip if already seeded (< 5ms)
[500ms]   Zustand stores hydrate from SQLite (parallel reads)
[600ms]   Check for active workout recovery
[700ms]   JWT validation (expo-secure-store read)
[800ms]   Navigation tree renders
[1000ms]  Home screen visible with today's prescription (from cache or skeleton)
[1200ms]  Background: PowerSync connection (if online)
[2000ms]  Background: AI prescription fetch (if cache miss)
```

### 7.2 Splash Screen Budget

- **Target:** Splash screen visible for < 1s
- **Migrations:** If a new migration runs (rare), allow up to 2s with progress indicator
- **Seed data:** First launch only — 150 exercises + injury matrix = ~500ms (batch insert in transactions of 50)
- **Subsequent launches:** < 100ms for migration check (no new migrations)

### 7.3 Lazy Loading

```typescript
// Screens loaded lazily — only import when navigated to
const ExerciseLibraryScreen = React.lazy(() => import('./screens/ExerciseLibrary'));
const ProfileScreen = React.lazy(() => import('./screens/Profile'));
const ProgressChartsScreen = React.lazy(() => import('./screens/ProgressCharts'));

// Heavy libraries loaded on demand
// Victory (charts) — only imported in ProgressChartsScreen
// react-native-svg (timer arc) — only imported in workout screen
```

---

## 8. Monitoring Plan

### 8.1 What to Measure

| Category | Metric | Tool | Alert Threshold |
|----------|--------|------|----------------|
| **Interaction** | Set logging latency (tap → SQLite write) | Custom span | > 100ms |
| **Interaction** | Numpad key → value render | Custom span | > 16ms |
| **Rendering** | Slow frames (> 16ms) | Sentry Performance | > 5 per workout |
| **Rendering** | Frozen frames (> 700ms) | Sentry Performance | Any occurrence |
| **Database** | SQLite query time (p95) | Custom span | > 50ms |
| **Database** | Migration duration | Custom span | > 5s |
| **Network** | AI response latency (p95) | Sentry HTTP | > 10s |
| **Network** | PowerSync sync failures | PowerSync callbacks | > 5 consecutive |
| **Memory** | JS heap size | Sentry | > 200MB |
| **Startup** | TTI | Sentry App Start | > 3s |
| **Crashes** | Crash-free rate | Sentry | < 99.5% |

### 8.2 Custom Performance Spans

```typescript
// Wrap critical paths with Sentry spans
import * as Sentry from '@sentry/react-native';

async function logSet(exerciseId: string, setData: SetInput) {
  return Sentry.startSpan({ name: 'logSet', op: 'db.write' }, async (span) => {
    // Validation
    const validated = SetInputSchema.parse(setData);

    // SQLite write
    const dbSpan = span.startChild({ op: 'db.insert', description: 'set_logs' });
    await db.insert(setLogs).values(validated);
    dbSpan.finish();

    // Haptic
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  });
}
```

### 8.3 Development Profiling

| Tool | Use Case |
|------|---------|
| React DevTools Profiler | Identify unnecessary re-renders |
| Flipper + React Native Performance | Frame timing, bridge calls |
| Drizzle Studio (Expo plugin) | Query inspection, schema validation |
| Reanimated DevTools | Verify animations run on UI thread |
| expo-sqlite `enableChangeListener` | Monitor write frequency |

---

## 9. Anti-Patterns to Avoid

### 9.1 Rendering Anti-Patterns

```typescript
// ❌ BAD — Object props break React.memo
<SetRow set={{ weight: 100, reps: 5, rpe: 7 }} />
// Creates new object every render → memo never works

// ✅ GOOD — Primitive props enable React.memo
<SetRow weight={100} reps={5} rpe={7} />

// ❌ BAD — Inline function props
<SetRow onPress={() => handlePress(set.id)} />
// New function every render

// ✅ GOOD — Stable callback reference
const handlePress = useCallback((setId: string) => { ... }, []);
<SetRow onPressId={set.id} onPress={handlePress} />

// ❌ BAD — Reading entire Zustand store
const workout = useWorkoutStore(s => s.workout);
// Re-renders on ANY workout field change

// ✅ GOOD — Select specific field
const timerEnd = useWorkoutStore(s => s.workout.restTimer.endTimestamp);
// Only re-renders when this specific value changes
```

### 9.2 Database Anti-Patterns

```typescript
// ❌ BAD — Individual inserts in loop
for (const set of sets) {
  await db.insert(setLogs).values(set);
}
// N separate WAL checkpoints = slow

// ✅ GOOD — Transaction batch
await db.transaction(async (tx) => {
  for (const set of sets) {
    await tx.insert(setLogs).values(set);
  }
});
// Single WAL checkpoint = fast

// ❌ BAD — SELECT * when you need 3 columns
const workouts = await db.select().from(workouts);

// ✅ GOOD — Select only what you need
const workouts = await db.select({
  id: workouts.id,
  date: workouts.date,
  type: workouts.type,
}).from(workouts);

// ❌ BAD — OFFSET pagination for large datasets
.offset(page * 20).limit(20)
// OFFSET scans and discards N rows = O(N)

// ✅ GOOD — Cursor pagination
.where(lt(workouts.date, lastSeenDate)).limit(20)
// Starts from index position = O(1)
```

### 9.3 Animation Anti-Patterns

```typescript
// ❌ BAD — JS thread timer
useEffect(() => {
  const interval = setInterval(() => {
    setRemainingSeconds(prev => prev - 1);
  }, 1000);
  return () => clearInterval(interval);
}, []);
// setState every second → re-renders → frame drops during DB writes

// ✅ GOOD — Reanimated timer (UI thread)
const progress = useSharedValue(0);
progress.value = withTiming(1, { duration: totalMs, easing: Easing.linear });
// Zero JS thread involvement, 60fps guaranteed

// ❌ BAD — useNativeDriver: false
Animated.timing(value, { useNativeDriver: false }).start();
// Runs on JS thread, drops frames

// ✅ GOOD — Reanimated worklet
const style = useAnimatedStyle(() => ({
  transform: [{ translateY: withSpring(offset.value) }],
}));
// Runs on UI thread
```

### 9.4 Network Anti-Patterns

```typescript
// ❌ BAD — Blocking UI on AI response
const prescription = await aiService.getDailyPrescription(context);
// User stares at spinner for 2-10 seconds

// ✅ GOOD — Show cached/skeleton, fetch in background
const cached = await aiCacheRepository.get(cacheKey);
if (cached) {
  showPrescription(cached); // instant
} else {
  showSkeleton();
  aiService.getDailyPrescription(context).then(showPrescription);
}

// ❌ BAD — Sync on every set log
await powerSync.upload(); // after each set

// ✅ GOOD — PowerSync handles throttled background sync
// crudUploadThrottleMs: 200 — batches automatically
```
