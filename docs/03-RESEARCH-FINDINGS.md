# Research Findings: Intelligent Training Companion

**Phase:** 1 - Discovery & Research
**Date:** 2026-03-03
**Scope:** Implementation patterns for React Native workout app with AI-powered coaching

---

## Table of Contents

1. [Key Findings](#1-key-findings)
2. [Implementation Recommendations](#2-implementation-recommendations)
   - 2.1 [React Native Workout App Architecture](#21-react-native-workout-app-architecture)
   - 2.2 [Sports Science Algorithms](#22-sports-science-algorithms)
   - 2.3 [Offline-First Architecture](#23-offline-first-architecture)
   - 2.4 [AI Integration on Mobile](#24-ai-integration-on-mobile)
   - 2.5 [Vector Search Strategy](#25-vector-search-strategy)
   - 2.6 [Strong App UX Patterns](#26-strong-app-ux-patterns)
3. [Risks and Mitigations](#3-risks-and-mitigations)
4. [References](#4-references)
5. [Open Questions](#5-open-questions)

---

## 1. Key Findings

### Architecture

- **Drizzle ORM + expo-sqlite is the 2025 gold standard** for offline-first React Native apps. The `useLiveQuery` hook gives automatic UI reactivity on local data changes. The Drizzle Studio Expo plugin enables direct database inspection during development. Use `SQLiteProvider` wrapped in `Suspense` so the app never renders before migrations complete.
- **WAL mode is mandatory** for write performance: `PRAGMA journal_mode = 'wal'` dramatically improves concurrent read/write on SQLite. For 10,000+ workout records, add composite indexes on `(user_id, date)` and `(exercise_id, user_id)` immediately.
- **OP-SQLite outperforms expo-sqlite by ~5x** for large datasets and complex queries. The performance gap matters when scanning full workout history for pattern detection. Evaluate whether to start on expo-sqlite and migrate, or begin with OP-SQLite.
- **The Android new architecture (Expo 52+) has a known input lag bug** with `keyboardType="numeric"`. The workaround is a custom bottom sheet number pad (not a system keyboard) — which is also better UX for workout logging anyway.

### Sports Science Algorithms

- **The core RPE load adjustment formula is well-established**: for every 0.5 RPE deviation from target, adjust load by 2%. This is validated in peer-reviewed research (Zourdos et al.) and can be implemented directly.
- **Epley 1RM formula** (`weight × (1 + reps/30)`) is the industry standard for estimated 1RM, most accurate at 1-10 reps. Use it to normalize progress across different rep ranges and to set percentage-based loading targets.
- **The Banister Fitness-Fatigue Model** (two-factor theory) explains why an athlete's readiness is the net of accumulated fitness minus current fatigue. For practical implementation, track a rolling Training Load score (volume × RPE intensity) and apply exponential decay curves for fitness (longer decay ~45 days) and fatigue (shorter decay ~15 days).
- **Periodization model selection** should be algorithm-driven based on user profile: Linear for beginners, Block for concurrent training (matches James's use case), DUP for intermediate hypertrophy, Conjugate for advanced powerlifters. The PROJECT_BRIEF's `selectModel()` skeleton is correct and aligned with sports science literature.
- **SRA curve timescales differ by adaptation**: neurological adaptations (24-48h), hypertrophy (48-72h), connective tissue (72h+). Deload triggers should consider which adaptation types have been most stressed.

### Offline-First

- **PowerSync is the production-proven solution for Supabase + offline sync**. It maintains a local SQLite database synced bidirectionally with Supabase Postgres. The upload queue is built-in. For a workout app, this is significantly less custom code than rolling your own sync engine.
- **UUID primary keys are non-negotiable** for offline-first. Auto-incrementing integer PKs cause guaranteed conflicts when multiple devices create records offline. Use ULIDs (sortable by time) or UUID v4 everywhere.
- **Last-Write-Wins (LWW) with server timestamp is sufficient** for workout data — workouts are user-owned and rarely edited from multiple devices simultaneously. CRDT complexity is not warranted unless supporting team/coach access patterns.
- **Soft deletes are required**. Hard deletes cannot be synced to devices that were offline during the delete. Every entity needs `deleted_at TIMESTAMP` and sync logic must filter and propagate deletions.
- **The sync queue needs exponential backoff** with a maximum retry age (72 hours). After 5 failed attempts, items should be moved to a permanent failure state and surfaced to the user.

### AI Integration

- **Never call the Claude API directly from the mobile client.** Always proxy through Supabase Edge Functions. This keeps the Anthropic API key server-side, enables per-user rate limiting, and allows usage logging without blocking the response.
- **Claude now supports native Structured Outputs** (as of November 2025, in beta for Sonnet 4.5 and Opus 4.1). Use Zod schemas to define expected response shapes and get guaranteed JSON compliance via constrained decoding — eliminates retry logic for malformed responses.
- **Prompt caching** cuts token costs significantly for repeated context (system prompts, user profile, injury list). Anthropic caches prefixes for up to 5 minutes; structure prompts so the stable context (profile, injuries, periodization model) comes first.
- **Semantic caching** at the edge function level can eliminate 30-70% of Claude API calls for similar queries (e.g., "explain my progression" asked daily).
- **Streaming via SSE from Supabase Edge Functions** is production-ready. The client receives `text/event-stream` and can update UI in real time during AI analysis — critical for the post-workout summary and coaching chat.

### Vector Search

- **Full vector search on-device is premature for this app.** The exercise library (~500-2000 exercises) does not require it. SQLite FTS5 with the trigram tokenizer handles fuzzy search, typo tolerance, and prefix matching efficiently and without external dependencies.
- **For workout pattern matching (AI memory retrieval)**, Supabase's pgvector with HNSW indexing is the right choice. Patterns are analyzed server-side where compute is unconstrained. Generate embeddings via a Supabase Edge Function calling a remote embedding API, store in Postgres, and retrieve via semantic similarity queries.
- **EmbeddingGemma (Google, September 2025)** is a 308M parameter on-device embedding model that runs in under 200MB RAM. If truly local pattern retrieval becomes a V2 requirement, this is the first viable option. For V1, keep embeddings server-side.
- **`sqlite-vec` (SQLite extension)** enables vector storage and ANN search directly in SQLite without FAISS. Combined with FTS5, this is the hybrid search path if on-device semantic search is ever needed.

### Strong App UX

- **The 10-second set logging target is achievable** with: pre-filled weight/reps from last session, a custom bottom sheet numpad (stays open across field transitions), tap-to-confirm checkbox, and haptic feedback on completion.
- **The "fewer taps" principle** is the top differentiator in 2025. Reducing from 5 taps (Strong's documented flow) to 3 taps (type/confirm weight, type/confirm reps, tap checkbox) is the UX target.
- **Swipe gestures** are now standard in competitor apps: swipe left to delete set, swipe right to duplicate set. These are expected, not differentiating.
- **Rest timers must survive app backgrounding** on both platforms. The solution is to store the timer end timestamp (not remaining seconds) in SQLite, then calculate remaining time on foreground. Do NOT depend on JavaScript interval timers for correctness.

---

## 2. Implementation Recommendations

### 2.1 React Native Workout App Architecture

#### Recommended Stack

```
expo-sqlite (or OP-SQLite for >50k records)
  + Drizzle ORM (type-safe queries + migrations)
  + PowerSync (Supabase sync layer)
  + TanStack Query (server state + cache)
  + Zustand (UI state, active workout session)
  + NativeWind (styling)
```

#### Numeric Input Pattern

Avoid system keyboard for weight/reps. Use a persistent custom bottom sheet numpad that stays open when focus moves between fields:

```typescript
// Custom numpad stays mounted, only active field changes
// Prevents keyboard dismiss/re-open animation on each field tap

function WorkoutNumpad({ activeField, onValueChange }: NumpadProps) {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

  return (
    <BottomSheet snapPoints={['25%']} enablePanDownToClose={false}>
      <View style={styles.numpadGrid}>
        {digits.map(digit => (
          <TouchableOpacity
            key={digit}
            onPress={() => onValueChange(activeField, digit)}
            style={styles.numpadKey}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.numpadDigit}>{digit}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </BottomSheet>
  );
}
```

**Note:** For Android new architecture compatibility, this custom numpad approach sidesteps the `keyboardType="numeric"` lag bug entirely.

#### Rest Timer (Backgrounding-Safe)

Store end timestamp, not remaining duration:

```typescript
// On set completion:
async function startRestTimer(durationSeconds: number) {
  const endTime = Date.now() + durationSeconds * 1000;

  // Persist to SQLite so it survives app termination
  await db.update(activeWorkoutTable)
    .set({ restTimerEndsAt: endTime })
    .where(eq(activeWorkoutTable.id, currentWorkoutId));

  // Schedule local notification as backup (works when app is backgrounded)
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Rest Complete',
      body: 'Time for your next set',
      sound: true,
    },
    trigger: { seconds: durationSeconds },
  });
}

// On app foreground:
function useRestTimer(workoutId: string) {
  const [remainingMs, setRemainingMs] = useState(0);
  const { data: workout } = useLiveQuery(
    db.select().from(activeWorkoutTable).where(eq(activeWorkoutTable.id, workoutId))
  );

  useEffect(() => {
    if (!workout?.restTimerEndsAt) return;

    const tick = () => {
      const remaining = workout.restTimerEndsAt - Date.now();
      setRemainingMs(Math.max(0, remaining));
    };

    // Recalculate from stored end timestamp — correct regardless of suspension
    const interval = setInterval(tick, 100);
    return () => clearInterval(interval);
  }, [workout?.restTimerEndsAt]);

  return remainingMs;
}
```

This pattern is correct even if the app was killed and restarted mid-rest.

#### Haptic Feedback Patterns

```typescript
import * as Haptics from 'expo-haptics';

// Set completion (primary success signal)
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

// Weight/rep field selection
await Haptics.selectionAsync();

// Personal record achieved
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
// Then a second success after 400ms for double-pulse PR feel
setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 400);

// RPE too high alert
await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

// Set deleted
await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
```

Provide a user setting to disable haptics for accessibility. Check Low Power Mode via `expo-battery` before triggering — haptics are disabled by iOS automatically in that state.

#### SQLite Schema for 10k+ Workouts

```sql
-- Core indexes for performance
CREATE INDEX idx_workouts_user_date ON workouts (user_id, date DESC);
CREATE INDEX idx_workout_exercises_workout ON workout_exercises (workout_id);
CREATE INDEX idx_sets_workout_exercise ON sets (workout_exercise_id);
CREATE INDEX idx_sets_exercise_user ON sets (exercise_id, user_id, completed_at DESC);

-- Soft delete pattern (required for sync)
ALTER TABLE workouts ADD COLUMN deleted_at INTEGER; -- Unix timestamp or NULL
ALTER TABLE exercises ADD COLUMN deleted_at INTEGER;

-- Sync tracking
ALTER TABLE workouts ADD COLUMN sync_status TEXT DEFAULT 'pending';
ALTER TABLE workouts ADD COLUMN server_updated_at INTEGER;
ALTER TABLE workouts ADD COLUMN client_updated_at INTEGER;

-- FTS5 for exercise search
CREATE VIRTUAL TABLE exercises_fts USING fts5(
  name,
  aliases,
  muscle_groups,
  content='exercises',
  content_rowid='id',
  tokenize='trigram'
);
```

---

### 2.2 Sports Science Algorithms

#### RPE-Based Load Adjustment (Validated Formula)

Source: Zourdos et al. — for every 0.5 RPE deviation from target, adjust load by 2%:

```typescript
/**
 * Calculate load adjustment based on actual vs target RPE.
 * Formula: (RPE_actual - RPE_target) * 4% per full RPE point
 * = 2% per 0.5 RPE unit
 *
 * Reference: Zourdos et al. (2016), Reactive Strength Lab research
 */
function calculateRPELoadAdjustment(
  targetRPE: number,
  actualRPE: number,
  missedReps: number = 0
): number {
  const rpeDeviation = actualRPE - targetRPE;

  // 2% per 0.5 RPE unit = 4% per full RPE point
  let adjustmentPercent = rpeDeviation * 0.04;

  // Penalty for missed reps: each missed rep = additional -4%
  // (treat as 1 full RPE point per missed rep)
  adjustmentPercent += missedReps * (-0.04);

  // Clamp to prevent extreme adjustments in single session
  return Math.max(-0.15, Math.min(0.10, adjustmentPercent));
}

// Example usage:
// Target RPE 7, Actual RPE 8.5 -> adjustment = (8.5-7) * 0.04 = -0.06 (-6%)
// Target RPE 7, Actual RPE 5   -> adjustment = (5-7) * 0.04  = +0.08 (+8%)
```

#### 1RM Estimation (Epley Formula)

```typescript
/**
 * Epley Formula: most accurate at 1-10 reps.
 * Used for normalizing progress across rep ranges and setting %1RM targets.
 */
function estimateOneRepMax(weight: number, reps: number): number {
  if (reps === 1) return weight;
  if (reps > 10) {
    // Epley becomes less accurate above 10 reps; use Brzycki as fallback
    return weight / (1.0278 - 0.0278 * reps);
  }
  return weight * (1 + reps / 30);
}

/**
 * Convert target %1RM to working weight, rounded to nearest plate increment.
 */
function percentageToWorkingWeight(
  estimated1RM: number,
  targetPercent: number,
  barWeight: number = 20,
  plateIncrement: number = 2.5
): number {
  const rawWeight = estimated1RM * targetPercent;
  // Round to nearest plate increment on each side
  const loadPerSide = (rawWeight - barWeight) / 2;
  const roundedPerSide = Math.round(loadPerSide / plateIncrement) * plateIncrement;
  return barWeight + roundedPerSide * 2;
}
```

#### Periodization Model Algorithms

```typescript
type Phase = 'accumulation' | 'intensification' | 'realization' | 'deload';

interface PeriodizationWeek {
  weekNumber: number;
  phase: Phase;
  repRange: [number, number];
  targetRPE: number;
  volumeMultiplier: number; // relative to base volume
}

/**
 * LINEAR PERIODIZATION
 * Volume decreases weekly, intensity increases weekly.
 * Best for: beginners, return from break (James's travel scenario)
 */
function linearMicrocycles(totalWeeks: number): PeriodizationWeek[] {
  const weeks: PeriodizationWeek[] = [];

  for (let i = 0; i < totalWeeks; i++) {
    const progress = i / (totalWeeks - 1); // 0 to 1

    weeks.push({
      weekNumber: i + 1,
      phase: i % 4 === 3 ? 'deload' : progress < 0.5 ? 'accumulation' : 'intensification',
      repRange: [Math.round(10 - progress * 6), Math.round(12 - progress * 8)],
      targetRPE: 6.5 + progress * 2,
      volumeMultiplier: i % 4 === 3 ? 0.5 : 1 - progress * 0.3,
    });
  }

  return weeks;
}

/**
 * BLOCK PERIODIZATION
 * Sequential blocks of hypertrophy -> strength -> peaking.
 * Best for: concurrent training (James's use case), intermediate+
 */
function blockMicrocycles(totalWeeks: number): PeriodizationWeek[] {
  const blocks = [
    { name: 'accumulation',     weeks: Math.floor(totalWeeks * 0.4), repRange: [8, 12] as [number, number], rpe: 7.0, volume: 1.0 },
    { name: 'transmutation',    weeks: Math.floor(totalWeeks * 0.35), repRange: [4, 6] as [number, number], rpe: 8.0, volume: 0.8 },
    { name: 'realization',      weeks: Math.floor(totalWeeks * 0.15), repRange: [1, 3] as [number, number], rpe: 9.0, volume: 0.5 },
    { name: 'deload',           weeks: Math.floor(totalWeeks * 0.1),  repRange: [8, 12] as [number, number], rpe: 6.0, volume: 0.4 },
  ];

  const weeks: PeriodizationWeek[] = [];
  let weekNum = 1;

  for (const block of blocks) {
    for (let i = 0; i < block.weeks; i++) {
      weeks.push({
        weekNumber: weekNum++,
        phase: block.name as Phase,
        repRange: block.repRange,
        targetRPE: block.rpe,
        volumeMultiplier: block.volume,
      });
    }
  }

  return weeks;
}

/**
 * DAILY UNDULATING PERIODIZATION (DUP)
 * Varies stimulus session-to-session within each week.
 * Best for: intermediate lifters, hypertrophy goals, avoiding accommodation
 */
const DUP_ROTATION = [
  { focus: 'power',       sets: 5, repRange: [1, 3]  as [number, number], pctOneRM: 0.90, rpe: 8.5 },
  { focus: 'strength',    sets: 4, repRange: [4, 6]  as [number, number], pctOneRM: 0.82, rpe: 8.0 },
  { focus: 'hypertrophy', sets: 3, repRange: [8, 12] as [number, number], pctOneRM: 0.68, rpe: 7.0 },
];

function getDUPSession(sessionIndex: number, weekNumber: number) {
  const base = DUP_ROTATION[sessionIndex % 3];
  // Progressive overload: add ~2% load each full rotation
  const cyclesCompleted = Math.floor(sessionIndex / 3);
  return {
    ...base,
    pctOneRM: Math.min(0.97, base.pctOneRM + cyclesCompleted * 0.01),
  };
}
```

#### Fitness-Fatigue Model (Banister Impulse-Response)

```typescript
interface TrainingLoad {
  date: Date;
  load: number; // volume × RPE-derived intensity (e.g., sets × reps × weight × RPE_factor)
}

const FITNESS_DECAY_DAYS = 45;   // Fitness effect decays over ~45 days
const FATIGUE_DECAY_DAYS = 15;   // Fatigue dissipates faster, ~15 days

/**
 * Calculate current fitness and fatigue levels from training history.
 * Based on Banister et al. (1975) Impulse-Response Model.
 *
 * fitness(t)  = Σ load(i) * exp(-(t - t_i) / τ_fitness)
 * fatigue(t)  = Σ load(i) * exp(-(t - t_i) / τ_fatigue)
 * readiness   = fitness - fatigue
 */
function calculateFitnessFatigue(
  trainingHistory: TrainingLoad[],
  targetDate: Date = new Date()
): { fitness: number; fatigue: number; readiness: number } {
  const targetTime = targetDate.getTime();

  let fitness = 0;
  let fatigue = 0;

  for (const session of trainingHistory) {
    const daysSince = (targetTime - session.date.getTime()) / (1000 * 60 * 60 * 24);

    fitness += session.load * Math.exp(-daysSince / FITNESS_DECAY_DAYS);
    fatigue += session.load * Math.exp(-daysSince / FATIGUE_DECAY_DAYS);
  }

  return {
    fitness,
    fatigue,
    readiness: fitness - fatigue, // Positive = good to train hard
  };
}

/**
 * Estimate training load for a session.
 * Simplified TRIMP (Training Impulse) calculation.
 */
function calculateSessionLoad(sets: CompletedSet[]): number {
  return sets.reduce((total, set) => {
    if (!set.weight || !set.reps || !set.rpe) return total;
    const rpeFactor = set.rpe / 10; // Normalize RPE to 0-1
    return total + set.weight * set.reps * rpeFactor;
  }, 0);
}
```

#### Deload Detection

```typescript
/**
 * Determine if a deload is warranted based on accumulated fatigue.
 * Triggers: high fatigue, declining RPE accuracy, or RPE consistently above target.
 */
function shouldDeload(
  recentWorkouts: Workout[],
  fitnessFatigue: { fitness: number; fatigue: number }
): { recommend: boolean; reason: string } {
  // Rule 1: Fatigue > 1.5x fitness (fitness obscured by fatigue)
  if (fitnessFatigue.fatigue > fitnessFatigue.fitness * 1.5) {
    return { recommend: true, reason: 'Accumulated fatigue exceeds fitness by 50%' };
  }

  // Rule 2: Average RPE trending >0.5 above target for 3+ consecutive sessions
  const last3 = recentWorkouts.slice(-3);
  const consistentlyHigh = last3.every(w =>
    w.averageRPE !== null && w.targetRPE !== null &&
    w.averageRPE - w.targetRPE > 0.5
  );
  if (consistentlyHigh && last3.length === 3) {
    return { recommend: true, reason: 'RPE consistently above target for 3 sessions' };
  }

  // Rule 3: Scheduled deload (every 4th week in accumulation phases)
  const currentWeekInBlock = recentWorkouts.length % 4;
  if (currentWeekInBlock === 0 && recentWorkouts.length > 0) {
    return { recommend: true, reason: 'Scheduled 4-week deload' };
  }

  return { recommend: false, reason: '' };
}
```

---

### 2.3 Offline-First Architecture

#### Recommended Stack

Use **PowerSync** as the sync layer over Supabase instead of building custom sync logic:

```
Local: expo-sqlite + Drizzle ORM + PowerSync SDK
Remote: Supabase (Postgres + Auth)
Sync: PowerSync (manages upload queue, conflict resolution, retry)
```

PowerSync installation:

```bash
npx expo install @powersync/react-native @journeyapps/react-native-quick-sqlite
```

#### Sync Queue Pattern (if building custom)

For cases where PowerSync is not used, implement a manual queue:

```typescript
interface SyncQueueItem {
  id: string;
  tableName: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  payload: Record<string, unknown>;
  createdAt: number;
  attempts: number;
  lastAttemptAt: number | null;
  status: 'pending' | 'in_flight' | 'failed' | 'synced';
}

const MAX_RETRIES = 5;
const MAX_AGE_MS = 72 * 60 * 60 * 1000; // 72 hours

async function processSyncQueue(supabase: SupabaseClient) {
  const pendingItems = await db
    .select()
    .from(syncQueueTable)
    .where(
      and(
        eq(syncQueueTable.status, 'pending'),
        lt(syncQueueTable.attempts, MAX_RETRIES),
        gt(sql`${syncQueueTable.createdAt} + ${MAX_AGE_MS}`, Date.now())
      )
    )
    .orderBy(asc(syncQueueTable.createdAt));

  for (const item of pendingItems) {
    try {
      await db.update(syncQueueTable)
        .set({ status: 'in_flight', lastAttemptAt: Date.now() })
        .where(eq(syncQueueTable.id, item.id));

      await syncItem(supabase, item);

      await db.update(syncQueueTable)
        .set({ status: 'synced' })
        .where(eq(syncQueueTable.id, item.id));

    } catch (error) {
      const backoffMs = Math.min(
        1000 * Math.pow(2, item.attempts), // Exponential backoff
        30 * 60 * 1000                      // Cap at 30 minutes
      );

      await db.update(syncQueueTable)
        .set({
          status: 'pending',
          attempts: item.attempts + 1,
          lastAttemptAt: Date.now() + backoffMs,
        })
        .where(eq(syncQueueTable.id, item.id));
    }
  }
}
```

#### Conflict Resolution Strategy

For workout data (user-owned, single-device primary):

```typescript
type ConflictResolution = 'server_wins' | 'client_wins' | 'last_write_wins';

function resolveConflict(
  localRecord: WorkoutRecord,
  serverRecord: WorkoutRecord
): WorkoutRecord {
  // For completed workouts: Last-Write-Wins based on updated_at timestamp
  if (localRecord.updatedAt > serverRecord.updatedAt) {
    return localRecord; // Client wins
  }
  return serverRecord; // Server wins

  // For active workout sessions: client always wins (in-progress data is authoritative)
  // This special case is handled by flagging records with status='active'
}
```

#### Schema Migration Pattern

```typescript
// migrations/0001_initial.sql
CREATE TABLE IF NOT EXISTS workouts (
  id TEXT PRIMARY KEY,           -- UUID, never auto-increment
  user_id TEXT NOT NULL,
  started_at INTEGER NOT NULL,   -- Unix milliseconds
  completed_at INTEGER,
  deleted_at INTEGER,            -- NULL = not deleted (soft delete)
  sync_status TEXT DEFAULT 'pending',
  client_updated_at INTEGER NOT NULL,
  server_updated_at INTEGER
);

-- Always add indexes in migration, not afterthought
CREATE INDEX idx_workouts_user_date ON workouts (user_id, started_at DESC)
  WHERE deleted_at IS NULL;
```

```typescript
// In _layout.tsx
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import migrations from '../drizzle/migrations'; // bundled SQL files

export default function RootLayout() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <SQLiteProvider
        databaseName="workout_app.db"
        options={{ enableChangeListener: true }}
        useSuspense
      >
        <DatabaseProvider>
          <App />
        </DatabaseProvider>
      </SQLiteProvider>
    </Suspense>
  );
}

function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const sqlite = useSQLiteContext();
  const db = drizzle(sqlite);
  const { success, error } = useMigrations(db, migrations);

  // Enable WAL mode on first open
  useEffect(() => {
    sqlite.execAsync("PRAGMA journal_mode = 'wal'");
  }, []);

  if (error) return <ErrorScreen error={error} />;
  if (!success) return <LoadingScreen />;

  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
}
```

---

### 2.4 AI Integration on Mobile

#### Architecture: Never Call Claude Directly from Client

```
React Native App
    ↓ supabase.functions.invoke('ai-coach', { body: payload })
Supabase Edge Function (ai-coach/index.ts)
    ↓ checks Auth header (user must be authenticated)
    ↓ checks rate limit (per-user token budget)
    ↓ checks semantic cache (embedding similarity)
    ↓ Anthropic API (Claude claude-sonnet-4-6)
    ↑ SSE stream or complete JSON
Supabase Edge Function
    ↑ logs usage asynchronously (non-blocking)
React Native App (renders streaming response)
```

#### Supabase Edge Function: Claude Streaming Proxy

```typescript
// supabase/functions/ai-coach/index.ts
import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js';

const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

Deno.serve(async (req) => {
  // 1. Auth check
  const authHeader = req.headers.get('Authorization');
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader! } } }
  );
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return new Response('Unauthorized', { status: 401 });

  // 2. Rate limiting: check monthly token budget
  const tokenUsage = await getUserMonthlyTokens(supabase, user.id);
  const MONTHLY_LIMIT = 500_000; // ~500 analysis sessions/month
  if (tokenUsage > MONTHLY_LIMIT) {
    return new Response('Rate limit exceeded', { status: 429 });
  }

  // 3. Parse request
  const { analysisType, workoutData, userProfile } = await req.json();

  // 4. Build structured prompt
  const systemPrompt = buildSystemPrompt(userProfile);
  const userMessage = buildAnalysisMessage(analysisType, workoutData);

  // 5. Stream response
  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  // Log usage after stream completes (non-blocking)
  stream.finalMessage().then(msg => {
    logTokenUsage(supabase, user.id, msg.usage).catch(console.error);
  });

  return new Response(stream.toReadableStream(), {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
});
```

#### Structured Output for Workout Prescriptions

Claude's native structured output (November 2025 beta) with Zod:

```typescript
import { z } from 'zod';

// Define expected response shape
const WorkoutPrescriptionSchema = z.object({
  exercises: z.array(z.object({
    name: z.string(),
    sets: z.number().int().min(1).max(10),
    repRange: z.tuple([z.number(), z.number()]),
    targetRPE: z.number().min(5).max(10),
    weightKg: z.number().positive(),
    rationale: z.string().max(200),
  })),
  sessionRationale: z.string().max(500),
  estimatedDurationMinutes: z.number().int().min(15).max(120),
  warnings: z.array(z.string()),
});

type WorkoutPrescription = z.infer<typeof WorkoutPrescriptionSchema>;

// In Edge Function - use structured outputs API
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 2048,
  system: systemPrompt,
  messages: [{ role: 'user', content: prescriptionRequest }],
  // Structured outputs: guaranteed JSON schema compliance
  // Requires beta header: 'anthropic-beta: structured-outputs-2025-11-13'
  tools: [{
    name: 'generate_workout_prescription',
    description: 'Generate a structured workout prescription',
    input_schema: z.toJSONSchema(WorkoutPrescriptionSchema),
  }],
  tool_choice: { type: 'tool', name: 'generate_workout_prescription' },
}, {
  headers: { 'anthropic-beta': 'structured-outputs-2025-11-13' },
});

// Response is guaranteed to match schema — no try/catch needed for parsing
const prescription = WorkoutPrescriptionSchema.parse(
  response.content[0].input
);
```

#### Client-Side Streaming Consumption

```typescript
async function streamWorkoutAnalysis(
  workoutId: string,
  onChunk: (text: string) => void
): Promise<void> {
  const { data, error } = await supabase.functions.invoke('ai-coach', {
    body: { analysisType: 'post_workout', workoutId },
  });

  // For streaming, use fetch directly (supabase.functions.invoke buffers)
  const response = await fetch(
    `${supabase.supabaseUrl}/functions/v1/ai-coach`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabase.supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ analysisType: 'post_workout', workoutId }),
    }
  );

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.slice(6));
        if (data.type === 'content_block_delta') {
          onChunk(data.delta.text);
        }
      }
    }
  }
}
```

#### AI Response Caching Strategy

```typescript
// Cache workout prescriptions locally in SQLite
// Key: hash(userId + mesocycleWeek + sessionType + date_YYYYMMDD)

interface CachedAIResponse {
  cacheKey: string;
  responseJson: string;
  generatedAt: number;
  ttlMs: number;
}

async function getCachedOrFetch(
  cacheKey: string,
  fetcher: () => Promise<WorkoutPrescription>,
  ttlMs: number = 8 * 60 * 60 * 1000 // 8 hours default
): Promise<WorkoutPrescription> {
  // Check local cache
  const cached = await db.select()
    .from(aiCacheTable)
    .where(
      and(
        eq(aiCacheTable.cacheKey, cacheKey),
        gt(sql`${aiCacheTable.generatedAt} + ${aiCacheTable.ttlMs}`, Date.now())
      )
    )
    .limit(1);

  if (cached.length > 0) {
    return JSON.parse(cached[0].responseJson) as WorkoutPrescription;
  }

  // Fetch fresh
  const result = await fetcher();

  // Cache locally
  await db.insert(aiCacheTable).values({
    cacheKey,
    responseJson: JSON.stringify(result),
    generatedAt: Date.now(),
    ttlMs,
  });

  return result;
}
```

---

### 2.5 Vector Search Strategy

#### Decision Matrix

| Use Case | Dataset Size | Recommendation |
|----------|-------------|----------------|
| Exercise library search | ~500-2000 exercises | SQLite FTS5 (trigram tokenizer) |
| Workout history pattern matching | 10k-100k sessions | Supabase pgvector (server-side) |
| Similar user recommendations | All users | Supabase pgvector (server-side) |
| On-device AI memory retrieval | User's own patterns | SQLite + sqlite-vec (V2) |

#### Exercise Search: SQLite FTS5 with Trigram Tokenizer

```typescript
// Schema: FTS5 virtual table for exercise search
const CREATE_FTS = `
  CREATE VIRTUAL TABLE IF NOT EXISTS exercises_fts USING fts5(
    name,
    aliases,          -- "bench press, chest press, flat bench"
    muscle_groups,    -- "chest, triceps, anterior deltoid"
    equipment,        -- "barbell, dumbbell, cable"
    content='exercises',
    content_rowid='rowid',
    tokenize='trigram'  -- enables substring/fuzzy matching
  );
`;

// Query: fuzzy exercise search
async function searchExercises(query: string, limit: number = 20): Promise<Exercise[]> {
  const sanitized = query.replace(/[^a-zA-Z0-9\s]/g, '');

  const results = await db.run(sql`
    SELECT e.*, exercises_fts.rank
    FROM exercises e
    JOIN exercises_fts ON e.rowid = exercises_fts.rowid
    WHERE exercises_fts MATCH ${sanitized}
    ORDER BY exercises_fts.rank  -- BM25 ranking
    LIMIT ${limit}
  `);

  return results.rows as Exercise[];
}

// Also handle common synonyms in the aliases column:
// "squat" -> "back squat, front squat, goblet squat, air squat"
// "press"  -> "bench press, overhead press, shoulder press, military press"
```

#### Workout Pattern Storage in Supabase (pgvector)

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Store workout embeddings for pattern matching
CREATE TABLE workout_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  workout_id UUID NOT NULL REFERENCES workouts(id),
  embedding VECTOR(1536),              -- OpenAI/remote embedding dimensions
  summary TEXT,                        -- Human-readable summary of the workout
  metadata JSONB,                      -- {exercises, totalVolume, avgRPE, phase}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW index for fast approximate nearest neighbor search
CREATE INDEX workout_embeddings_hnsw_idx
  ON workout_embeddings
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- RLS: users can only see their own embeddings
ALTER TABLE workout_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own embeddings" ON workout_embeddings
  FOR ALL USING (auth.uid() = user_id);
```

```typescript
// Find workouts similar to a given description (AI memory retrieval)
async function findSimilarWorkouts(
  userId: string,
  queryEmbedding: number[],
  limit: number = 5
): Promise<WorkoutPattern[]> {
  const { data } = await supabase.rpc('match_workout_patterns', {
    user_id: userId,
    query_embedding: queryEmbedding,
    match_threshold: 0.7,
    match_count: limit,
  });

  return data;
}

// Supabase function (in SQL):
// CREATE OR REPLACE FUNCTION match_workout_patterns(...)
// AS $$ SELECT ... ORDER BY embedding <=> query_embedding LIMIT match_count $$
```

---

### 2.6 Strong App UX Patterns

#### Set Logging Flow (Target: 3-tap, <8 seconds)

```
1. Tap weight field → numpad bottom sheet reveals (stays open)
   - Value is pre-selected (highlighted) for immediate replacement
   - Previous session weight shown in gray above field ("Last: 65kg")

2. Type weight → numpad sends characters to active field
   Tap reps field → active field switches, numpad stays open
   Type reps → value updates

3. Tap checkbox → SUCCESS haptic, row marks complete, rest timer starts
   RPE prompt appears (inline, not modal) for 3 seconds
   Next set row auto-activates
```

#### Set Table Component Structure

```typescript
interface SetRowProps {
  setNumber: number;
  setTag?: 'W' | 'F' | 'D';     // Warmup, Failure, Dropset
  previousWeight: number | null;
  previousReps: number | null;
  weight: number;
  reps: number;
  isCompleted: boolean;
  isActive: boolean;
  onWeightFocus: () => void;
  onRepsFocus: () => void;
  onComplete: (rpe: number) => void;
}

function SetRow({
  setNumber, setTag, previousWeight, previousReps,
  weight, reps, isCompleted, isActive,
  onWeightFocus, onRepsFocus, onComplete
}: SetRowProps) {
  return (
    <View style={[styles.setRow, isActive && styles.activeRow, isCompleted && styles.completedRow]}>
      {/* Col 1: Set number badge */}
      <View style={styles.setBadge}>
        <Text style={styles.setNumber}>{setNumber}</Text>
        {setTag && <Text style={styles.setTag}>{setTag}</Text>}
      </View>

      {/* Col 2: Previous (reference data, subdued) */}
      <Text style={styles.previousData}>
        {previousWeight && previousReps
          ? `${previousWeight}×${previousReps}`
          : '—'}
      </Text>

      {/* Col 3: Weight input */}
      <TouchableOpacity
        style={styles.inputField}
        onPress={onWeightFocus}
        // Minimum 44x44 touch target
        hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
      >
        <Text style={[styles.inputValue, isCompleted && styles.completedValue]}>
          {weight}
        </Text>
      </TouchableOpacity>

      {/* Col 4: Reps input */}
      <TouchableOpacity
        style={styles.inputField}
        onPress={onRepsFocus}
        hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
      >
        <Text style={[styles.inputValue, isCompleted && styles.completedValue]}>
          {reps}
        </Text>
      </TouchableOpacity>

      {/* Col 5: Completion checkbox */}
      <SetCompleteCheckbox
        isCompleted={isCompleted}
        onComplete={onComplete}
      />
    </View>
  );
}
```

#### Auto-Fill Logic

```typescript
function getAutoFillValues(
  exercise: Exercise,
  workoutHistory: WorkoutHistory[],
  aiPrescription: ExercisePrescription | null
): { weight: number; reps: number; source: 'ai' | 'history' | 'default' } {
  // Priority 1: AI prescription (if within current mesocycle)
  if (aiPrescription?.weight && aiPrescription?.reps) {
    return {
      weight: aiPrescription.weight,
      reps: aiPrescription.reps,
      source: 'ai',
    };
  }

  // Priority 2: Last session for this exercise
  const lastSession = workoutHistory
    .flatMap(w => w.exercises)
    .filter(e => e.exerciseId === exercise.id)
    .sort((a, b) => b.date - a.date)[0];

  if (lastSession) {
    return {
      weight: lastSession.weight,
      reps: lastSession.reps,
      source: 'history',
    };
  }

  // Priority 3: Conservative defaults by category
  const defaults: Record<string, { weight: number; reps: number }> = {
    compound_lower: { weight: 60, reps: 8 },
    compound_upper: { weight: 40, reps: 8 },
    isolation:      { weight: 20, reps: 12 },
    bodyweight:     { weight: 0,  reps: 10 },
  };

  return { ...defaults[exercise.category] || { weight: 20, reps: 10 }, source: 'default' };
}
```

#### Swipe Gesture Implementation

```typescript
import Swipeable from 'react-native-gesture-handler/Swipeable';

function SwipeableSetRow({ onDelete, onDuplicate, ...props }: SwipeableSetRowProps) {
  const renderLeftActions = () => (
    <TouchableOpacity
      style={styles.swipeActionDuplicate}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onDuplicate();
      }}
    >
      <Text style={styles.swipeActionText}>Duplicate</Text>
    </TouchableOpacity>
  );

  const renderRightActions = () => (
    <TouchableOpacity
      style={styles.swipeActionDelete}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onDelete();
      }}
    >
      <Text style={styles.swipeActionText}>Delete</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      friction={2}
      overshootLeft={false}
      overshootRight={false}
    >
      <SetRow {...props} />
    </Swipeable>
  );
}
```

---

## 3. Risks and Mitigations

### High Risk

**Risk: iOS background timer unreliability**
- iOS terminates background processes after ~30 seconds. Rest timers that depend on JavaScript intervals will break when the app is backgrounded.
- Mitigation: Store `restTimerEndsAt` (end timestamp) in SQLite on set completion. Recalculate remaining time from this timestamp on every foreground. Schedule a local notification as a fallback for when the app is fully terminated. Never use `setInterval` as the source of truth for timer state.

**Risk: Sync conflicts from multiple devices**
- A user who trains on both iPhone and Apple Watch (or two phones) could create conflicting workout records.
- Mitigation: UUID primary keys eliminate ID conflicts. Use `client_updated_at` + `server_updated_at` for LWW resolution. Flag active workout sessions as immutable until `completed_at` is set — only one device can have an "active" session at a time. Use PowerSync to handle the sync protocol rather than implementing it manually.

**Risk: AI cost explosion**
- Without rate limiting, a single power user triggering many AI analyses could rack up significant Claude API costs.
- Mitigation: Implement per-user monthly token budget (e.g., 500K tokens/month for premium, 50K for free). Cache AI prescriptions for the day (same session type on same date returns cached result). Use prompt caching for stable system prompt content. Route simple requests (RPE calculation, rest time) to deterministic algorithms, not Claude.

**Risk: Android new architecture input lag**
- `keyboardType="numeric"` on Android with the new architecture (Expo 52+) exhibits noticeable keystroke lag.
- Mitigation: Use a custom bottom sheet numpad instead of native keyboard for all weight/rep inputs. This is also better UX (numpad stays open between fields). If native keyboard is required anywhere else, test carefully on new architecture builds.

### Medium Risk

**Risk: SQLite performance degradation at scale**
- Queries scanning full workout history (1RM trends, pattern detection) can become slow at 10k+ records without proper indexing.
- Mitigation: Create composite indexes at migration time. Enable WAL mode. Use FTS5 for text search, not LIKE queries. Consider migrating from expo-sqlite to OP-SQLite if query times exceed 100ms on mid-range Android devices (OP-SQLite is ~5x faster). Add `EXPLAIN QUERY PLAN` checks to CI for critical queries.

**Risk: Supabase Edge Function cold start latency**
- Edge Functions can have cold starts of 500ms-2s when not recently invoked.
- Mitigation: Keep Edge Functions warm with periodic health-check pings from the app (or a scheduled cron). For latency-sensitive operations (post-workout analysis), use optimistic UI updates — show a loading state immediately while the request is in flight.

**Risk: LLM structured output hallucinations despite schema enforcement**
- Even with constrained decoding, Claude may generate structurally valid but semantically wrong prescriptions (e.g., 200kg for a first-timer).
- Mitigation: Add application-layer validation after parsing. Define hard bounds per exercise category (e.g., compound lower max 250kg, isolation max 80kg). Surface AI confidence score and allow one-tap override. Log all prescriptions for monitoring.

**Risk: EmbeddingGemma / on-device ML maturity**
- On-device embedding models (EmbeddingGemma, react-native-transformers) are still early-stage in React Native. react-native-transformers was abandoned in July 2025.
- Mitigation: Keep all V1 embeddings server-side via Supabase Edge Functions. Do not take a dependency on on-device ML frameworks until they have 12+ months of production React Native usage. Treat local vector search as a V2 research spike.

### Low Risk

**Risk: FTS5 trigram tokenizer limitations**
- Trigram search requires at least 3 characters and can return noisy results for very short queries.
- Mitigation: Show recently used exercises as a default list when query is <3 characters. Use synonym aliases in the exercises table to boost recall (e.g., searching "bench" matches "bench press, flat bench, chest press").

**Risk: PowerSync vendor dependency**
- PowerSync is a third-party service. If it changes pricing or availability, the sync layer would need to be replaced.
- Mitigation: PowerSync's SDK is built on top of expo-sqlite with well-defined interfaces. The data model (Supabase Postgres + local SQLite) is standard. Migration to WatermelonDB or custom sync is feasible if needed. Evaluate WatermelonDB as a fallback option during architecture review.

---

## 4. References

### Libraries

- [expo-sqlite documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Drizzle ORM for Expo SQLite](https://orm.drizzle.team/docs/connect-expo-sqlite)
- [PowerSync for Supabase](https://www.powersync.com/blog/bringing-offline-first-to-supabase)
- [expo-haptics](https://docs.expo.dev/versions/latest/sdk/haptics/)
- [expo-background-task](https://docs.expo.dev/versions/latest/sdk/background-task/)
- [react-native-gesture-handler (Swipeable)](https://docs.swmansion.com/react-native-gesture-handler/)
- [Supabase pgvector documentation](https://supabase.com/docs/guides/database/extensions/pgvector)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [SQLite FTS5 Extension](https://sqlite.org/fts5.html)
- [sqlite-vec: Vector search in SQLite](https://alexgarcia.xyz/blog/2024/sqlite-vec-hybrid-search/index.html)
- [Expo local-first architecture guide](https://docs.expo.dev/guides/local-first/)
- [Offline-first apps with Expo and Legend State](https://expo.dev/blog/offline-first-apps-with-expo-and-legend-state)
- [Modern SQLite for React Native apps (Expo blog)](https://expo.dev/blog/modern-sqlite-for-react-native-apps)
- [Building offline-first with Drizzle ORM + SQLite](https://medium.com/@detl/building-an-offline-first-production-ready-expo-app-with-drizzle-orm-and-sqlite-f156968547a2)

### Sports Science

- [Autoregulation in Resistance Training: Addressing the Inconsistencies (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC7575491/)
- [Auto-Regulation Method vs. Fixed-Loading Method Meta-Analysis (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC7994759/)
- [RPE vs. Percentage 1RM Loading Study (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC5877330/)
- [The Science of Autoregulation - Stronger by Science](https://www.strongerbyscience.com/autoregulation/)
- [Barbell Medicine: What is RPE in Lifting?](https://www.barbellmedicine.com/blog/autoregulation-and-rpe-part-i/)
- [Fitness & Fatigue Model (CalIntellect)](https://www.calintellect.com/articles/fitness-and-fatigue-model)
- [Periodization: Linear vs Block vs Undulating vs Conjugate - Set For Set](https://www.setforset.com/blogs/news/periodization-training-models)
- [One-repetition maximum - Wikipedia](https://en.wikipedia.org/wiki/One-repetition_maximum)
- [Output Sports: Developing an Autoregulation Framework](https://www.outputsports.com/blog/developing-an-autoregulation-framework)
- [NSCA: Central Concepts Related to Periodization](https://www.nsca.com/education/articles/kinetic-select/central-concepts-related-to-periodization/)
- [Mathematical Modelling of Athletic Performance (arxiv)](https://arxiv.org/html/2505.20859v1)

### AI Integration

- [Claude Structured Outputs documentation](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
- [Claude Agent SDK - Structured Outputs](https://platform.claude.com/docs/en/agent-sdk/structured-outputs)
- [Vercel AI SDK - Generating Structured Data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data)
- [Building Claude Streaming with Edge Runtime](https://dev.to/bydaewon/building-a-production-ready-claude-streaming-api-with-nextjs-edge-runtime-3e7)
- [LLM Cost Optimization Guide 2025](https://futureagi.com/blogs/llm-cost-optimization-2025)
- [Supabase + React Native with Claude AI](https://designcode.io/react-native-ai-setting-up-the-supabase-client/)

### Vector Search

- [Supabase AI & Vectors documentation](https://supabase.com/docs/guides/ai)
- [pgvector: Embeddings and vector similarity](https://supabase.com/docs/guides/database/extensions/pgvector)
- [EmbeddingGemma: On-device embeddings (Google)](https://developers.googleblog.com/introducing-embeddinggemma/)
- [FastEmbed ONNX for lightweight inference](https://johal.in/fastembed-onnx-lightweight-embedding-inference-2025/)
- [Edge AI: TFLite vs ONNX Runtime vs PyTorch Mobile](https://dzone.com/articles/edge-ai-tensorflow-lite-vs-onnx-runtime-vs-pytorch)
- [Hybrid FTS5 + vector search with SQLite](https://alexgarcia.xyz/blog/2024/sqlite-vec-hybrid-search/index.html)

### Strong App / UX

- [Best Strong App Alternatives 2025](https://setgraph.app/articles/best-strong-app-alternatives-(2025))
- [Best Workout Tracking Apps 2025 (Setgraph)](https://setgraph.app/ai-blog/best-workout-tracking-apps)
- [Fast workout tracking with swipe actions](https://setgraph.app/articles/fast-workout-tracking-with-swipe-actions-in-setgraph)
- [Fitness App UX/UI best practices](https://stormotion.io/blog/fitness-app-ux/)
- [How to Design a Fitness App - ZFort](https://www.zfort.com/blog/How-to-Design-a-Fitness-App-UX-UI-Best-Practices-for-Engagement-and-Retention)

---

## 5. Open Questions

These require prototyping or further investigation before final architecture decisions:

1. **PowerSync vs. WatermelonDB vs. custom sync**: PowerSync is newer (2024-2025) but purpose-built for Supabase. WatermelonDB has 3+ years of React Native production history. Does PowerSync's simpler setup justify the vendor dependency risk? Recommendation: build a 1-week spike with PowerSync; if integration is smooth, proceed. Fall back to WatermelonDB if issues arise.

2. **OP-SQLite vs. expo-sqlite performance threshold**: At what exact record count does expo-sqlite become unacceptably slow? Build a benchmark with 1k, 5k, 10k, 50k synthetic workout records and measure query times for: last session per exercise, 1RM trend calculation, full workout history scan. This determines whether to start on expo-sqlite or OP-SQLite from day one.

3. **Custom numpad vs. system keyboard UX**: Does a persistent custom bottom sheet numpad (recommended) feel native enough to iOS and Android users, or does it feel foreign? This needs user testing with the primary persona (James, 32, experienced lifter). Run a 2-screen prototype test before committing.

4. **Anthropic Structured Outputs beta stability**: The November 2025 structured outputs feature is in beta. Is it stable enough for production workout prescriptions, or should the app use tool-use JSON extraction as a fallback? Monitor the beta docs and Anthropic developer community for stability announcements before V1 launch.

5. **AI prescription frequency and cost model**: How often should Claude generate workout prescriptions? Options: (a) once per mesocycle week (cached for all 7 days), (b) daily regeneration, (c) on-demand when user opens the app. Option (a) minimizes cost but reduces adaptability. Need to model token costs per option against the pricing model to determine sustainable free/premium tiers.

6. **Deload detection sensitivity**: The proposed Banister model with 45-day fitness decay and 15-day fatigue decay are literature values. Individual variation is high. Should the decay constants be learnable per user (requires enough data), or fixed with RPE-based override triggers? Requires 4-8 weeks of real user data to validate before shipping adaptive decay.

7. **Offline AI responses**: When the user is offline mid-workout and asks the AI coach a question, what happens? Options: (a) show "offline, try again when connected," (b) use cached responses from similar recent queries, (c) use a tiny on-device model. Option (b) requires semantic cache lookup; option (c) requires on-device ML which is premature. Clarify acceptable offline degradation with product before implementation.

8. **Apple Watch integration**: The PROJECT_BRIEF mentions Apple Watch (James's wearable). Strong shows rest timer countdowns on the wrist. Is watchOS integration in scope for V1? If yes, it requires a separate watchOS native target and adds significant complexity. Recommend deferring to V2 unless it is a launch requirement.

---

*Research conducted: 2026-03-03*
*Next step: 04-SYSTEM-ARCHITECTURE.md (Phase 2)*
