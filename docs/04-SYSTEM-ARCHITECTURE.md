# System Architecture — Intelligent Training Companion

**Version:** 1.0
**Date:** March 3, 2026
**Status:** Approved
**Inputs:** PROJECT_BRIEF.md, 02-TECH-STACK-DECISIONS.md, 03-RESEARCH-FINDINGS.md

---

## Table of Contents

1. [System Context](#1-system-context)
2. [Layered Architecture](#2-layered-architecture)
3. [Data Flow Diagrams](#3-data-flow-diagrams)
4. [Module Boundaries](#4-module-boundaries)
5. [AI Integration Architecture](#5-ai-integration-architecture)
6. [State Management](#6-state-management)
7. [Error Handling](#7-error-handling)
8. [Security](#8-security)

---

## 1. System Context

The app operates across three deployment zones: the mobile device (fully offline-capable), the Supabase platform (auth, database, edge functions), and the Anthropic API (Claude LLM). The Claude API is never called directly from the client.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          USER DEVICE                                    │
│                                                                         │
│   ┌──────────────────────────────────────────────────────────────┐     │
│   │                    React Native App (Expo SDK 54)             │     │
│   │                                                               │     │
│   │  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐ │     │
│   │  │  Presentation │  │ State Layer  │  │   Service Layer    │ │     │
│   │  │  (Screens,   │  │  (Zustand +  │  │ (WorkoutEngine,    │ │     │
│   │  │  Components) │  │  LegendState)│  │  AIService, etc.)  │ │     │
│   │  └──────┬───────┘  └──────┬───────┘  └────────┬───────────┘ │     │
│   │         │                 │                    │             │     │
│   │  ┌──────▼─────────────────▼────────────────────▼───────────┐ │     │
│   │  │                    Data Layer                            │ │     │
│   │  │         Drizzle ORM + expo-sqlite (WAL mode)             │ │     │
│   │  │         sqlite-vec (Phase 1 vector search)               │ │     │
│   │  └──────────────────────────────┬───────────────────────────┘ │     │
│   └─────────────────────────────────│─────────────────────────────┘     │
│                                     │                                    │
│              SQLite DB              │  PowerSync SDK                     │
│        intelligent_trainer.db       │  (bidirectional sync)              │
└─────────────────────────────────────│────────────────────────────────────┘
                                      │
              ┌───────────────────────▼──────────────────────────────┐
              │                    SUPABASE PLATFORM                  │
              │                                                        │
              │  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │
              │  │  Supabase   │  │  PostgreSQL   │  │    Edge     │ │
              │  │    Auth     │  │ + pgvector    │  │  Functions  │ │
              │  │  (JWT)      │  │  (Phase 2)    │  │  (Deno)     │ │
              │  └─────────────┘  └──────────────┘  └──────┬──────┘ │
              │                                             │         │
              └─────────────────────────────────────────────│─────────┘
                                                            │
                                              HTTPS + Bearer Token
                                                            │
              ┌─────────────────────────────────────────────▼─────────┐
              │                    ANTHROPIC API                        │
              │              Claude claude-sonnet-4-6                   │
              │         (mesocycle gen, post-workout analysis,          │
              │          daily prescription, pattern explanation)       │
              └────────────────────────────────────────────────────────┘
```

**Key constraints:**
- The Claude API key lives only in the Edge Function environment variable. It is never bundled in the mobile app.
- Core workout logging (set entry, rest timer, exercise selection) works 100% offline. No Supabase dependency.
- PowerSync handles bidirectional sync with automatic conflict resolution and retry queuing.
- Phase 1 ships without Supabase. Phase 2 introduces the sync layer and cloud AI calls.

---

## 2. Layered Architecture

Five layers with strict downward dependency: each layer may only depend on layers below it. No layer references a layer above it.

```
┌──────────────────────────────────────────────────────────────────────┐
│  LAYER 5 — PRESENTATION                                              │
│  React Native screens and components                                 │
│  • Screens: WorkoutScreen, HistoryScreen, ExercisesScreen, Profile   │
│  • Shared components: ExerciseCard, SetRow, RestTimerWidget,         │
│    RPEModal, CustomNumpad, ProgressChart                             │
│  • Navigation: React Navigation v7 (Tab + Stack + Modal)             │
│  • Animations: Reanimated 3 (gestures, timer arc), Moti (UI states) │
│  • Styling: NativeWind v4 (static screens) + StyleSheet (workout)    │
└───────────────────────────────────┬──────────────────────────────────┘
                                    │ reads/dispatches
┌───────────────────────────────────▼──────────────────────────────────┐
│  LAYER 4 — STATE                                                     │
│  In-memory reactive state; no persistence logic here                 │
│  • Zustand stores: userStore, mesocycleStore, historyStore,          │
│    settingsStore, syncStatusStore                                    │
│  • Legend State: activeWorkoutStore$ (timer, sets, RPE, exercises)   │
│  • TanStack Query: AI response cache, server sync status             │
│  • Hydration: stores load from SQLite on app launch                  │
└───────────────────────────────────┬──────────────────────────────────┘
                                    │ calls
┌───────────────────────────────────▼──────────────────────────────────┐
│  LAYER 3 — SERVICE                                                   │
│  Domain logic; orchestrates data reads/writes and AI calls           │
│  • WorkoutEngine: set logging, RPE tracking, rest timer management   │
│  • AIService: prescription request, post-workout analysis, fallback  │
│  • InjuryService: exercise substitution, load modifiers              │
│  • MemoryService: pattern storage, vector retrieval, context build   │
│  • ProgressionCalculator: 1RM, load suggestions, deload detection    │
│  • SyncService: PowerSync coordination, conflict resolution policy   │
└───────────────────────────────────┬──────────────────────────────────┘
                                    │ reads/writes
┌───────────────────────────────────▼──────────────────────────────────┐
│  LAYER 2 — DATA                                                      │
│  SQLite access via Drizzle ORM; all persistence here                 │
│  • Drizzle schema: workouts, exercises, sets, mesocycles, memories   │
│  • Repositories: WorkoutRepository, ExerciseRepository,             │
│    MesocycleRepository, MemoryRepository, AIResponseCache            │
│  • Migrations: drizzle-kit generated, applied via useMigrations      │
│  • Indexes: (user_id, date DESC), (exercise_id, user_id),            │
│    FTS5 virtual table for exercise search                            │
│  • sqlite-vec virtual table: memory_vectors for Phase 1 retrieval   │
└───────────────────────────────────┬──────────────────────────────────┘
                                    │ uses
┌───────────────────────────────────▼──────────────────────────────────┐
│  LAYER 1 — PLATFORM                                                  │
│  React Native and Expo primitives                                    │
│  • expo-sqlite (JSI bindings, WAL mode, extension loading)           │
│  • expo-notifications (rest timer background alerts)                 │
│  • expo-haptics (set completion, PR feedback, RPE warning)           │
│  • expo-secure-store (JWT token storage)                             │
│  • expo-battery (disable haptics in Low Power Mode)                  │
│  • NetInfo (connectivity detection for sync gating)                  │
│  • @powersync/react-native (sync coordinator with Supabase)          │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Flow Diagrams

### 3.1 Set Logging (Input to Persistence)

The critical path: a user taps a weight field, enters a value via the custom numpad, and logs a set. Target: under 100ms from tap to visual confirmation, zero frame drops.

```
User taps weight field on SetRow
        │
        ▼
CustomNumpad (BottomSheet)
  • Field type: weight | reps | rpe
  • Digit append / backspace / decimal
  • No native keyboard — eliminates Android numeric input lag
        │
        ▼
Legend State mutation (synchronous, UI thread)
  workoutSession$.exercises[i].sets[j].weight.set(value)
  workoutSession$.exercises[i].sets[j].reps.set(value)
        │
        ▼ SetRow re-renders via fine-grained observation (no parent re-render)
        │
User taps "Log Set" button
        │
        ▼
WorkoutEngine.logSet(exerciseId, setData)
  1. Validate inputs (Zod schema)
  2. Calculate RPE deviation (actualRPE - targetRPE)
  3. Check deviation threshold (>= 1.0 RPE) → trigger adaptation alert
  4. Record personal record check (compareWith1RM)
        │
        ├─── [RPE deviation >= 1.0] ──→ AdaptationAlert modal
        │                               User selects: adjust / ignore / note
        │
        ▼
SQLite write (Drizzle, synchronous JSI)
  db.insert(setsTable).values({
    id: uuid(),
    workoutExerciseId,
    setNumber,
    weight, reps, rpe,
    completedAt: Date.now(),
    syncStatus: 'pending',   ← PowerSync picks up on next sync cycle
  })
        │
        ▼
Rest timer start
  1. endTime = Date.now() + prescribedRestSeconds * 1000
  2. SQLite write: activeWorkout.restTimerEndsAt = endTime
  3. Legend State: restTimer$.endTime.set(endTime)
  4. expo-notifications: schedule background alert at endTime
  5. Reanimated 3 arc animation begins on UI thread
        │
        ▼
Haptic feedback: Haptics.notificationAsync(Success)
Personal record? → double haptic pulse (400ms apart)
```

### 3.2 AI Prescription (App Open to Cached Prescription)

Claude is never called during an active workout. Prescriptions are generated before the user's next session and cached locally.

```
App foreground / onAppStateChange = 'active'
        │
        ▼
AIService.checkPrescriptionFreshness(userId, todayDate)
  • Query aiResponseCache table
  • Cache key: hash(userId + mesocycleWeek + sessionType + YYYYMMDD)
        │
        ├─── [Cache HIT, TTL < 8h] ──→ return cached prescription
        │                               (renders immediately, no network)
        │
        ├─── [Cache MISS, online] ───→ Continue below
        │
        └─── [Cache MISS, offline] ──→ DeterministicFallback.getPrescription()
                                        (last week's prescription adjusted by
                                         ProgressionCalculator.nextLoad())
                                              │
                                              ▼ (offline fallback exits here)

Online path continues:
        │
        ▼
MemoryService.buildContext(userId)
  1. Query recent workouts (last 14 days, SQLite)
  2. sqlite-vec similarity search: retrieve top-5 relevant memories
  3. InjuryService.getActiveRestrictions(userId)
  4. MesocycleStore: current week, phase, target RPE, volume

Context object assembled:
  { recentWorkouts[], relevantMemories[], injuries[], mesocycleContext }
        │
        ▼
AIService.requestPrescription(context)
  → supabase.functions.invoke('ai-coach', { body: { type: 'prescription', context } })
        │
        ▼
Edge Function: ai-coach/index.ts  (Deno runtime)
  1. JWT validation (Supabase auth.getUser())
  2. Rate limit check (monthly token budget per user)
  3. Prompt construction (system prompt + user context)
  4. anthropic.messages.create({ model: 'claude-sonnet-4-6', ... })
     with structured output tool (WorkoutPrescriptionSchema)
  5. Zod parse of response (guaranteed schema compliance)
  6. Log token usage async (non-blocking)
        │
        ▼
React Native receives WorkoutPrescription JSON
  → AIService.cachePrescription(cacheKey, prescription, ttlMs: 8h)
  → SQLite write to aiResponseCache table
  → mesocycleStore.setTodayPrescription(prescription)
        │
        ▼
WorkoutScreen renders prescription
  (exercises, sets, rep ranges, target RPE, session rationale)
```

### 3.3 Mid-Workout Adaptation (RPE Deviation to Memory Update)

```
User logs set with actualRPE input
        │
        ▼
WorkoutEngine.evaluateRPEDeviation(set)
  deviation = actualRPE - targetRPE
        │
        ├─── [deviation < 1.0] ──→ no action, log normally
        │
        └─── [deviation >= 1.0] ──→

AdaptationAlert triggered
  Haptics.notificationAsync(Warning)
  RPE deviation modal slides up (transparentModal, workout not unmounted)
  Shows: "Your RPE is 1.5 above target. Adjust load?"
  Options:
    A) "Reduce load (-6%)"  → ProgressionCalculator.adjustLoad(deviation)
    B) "Keep going"         → log note, continue
    C) "End workout"        → graceful early termination
        │
        ▼  (User selects option)

Option A — Load adjustment:
  1. newWeight = currentWeight * (1 + calculateRPELoadAdjustment(target, actual))
  2. Round to nearest 2.5kg plate increment
  3. workoutSession$.currentExercise.suggestedWeight.set(newWeight)
  4. Update remaining sets in Legend State
  5. Show adjustment confirmation ("Load reduced to 82.5kg")

Option B — Log and continue:
  No weight change

All paths:
        │
        ▼
MemoryService.storeAdaptation(event)
  event = {
    exerciseId,
    date: Date.now(),
    deviationType: 'rpe_high' | 'rpe_low' | 'missed_reps',
    targetRPE, actualRPE, actualWeight,
    userResponse: 'reduced_load' | 'ignored',
    outcome: 'pending'   ← updated post-workout
  }
  → SQLite write to agenticMemories table
  → [online] Generate embedding via Claude API, store in sqlite-vec
  → syncStatus: 'pending' (PowerSync will replicate to Supabase pgvector)

Post-workout:
  AIService.analyzeWorkout(workoutId)
  → Claude post-workout analysis includes adaptation events
  → MemoryService.updateOutcome(adaptationId, outcome)
  → outcome confidence score updated based on next session performance
```

### 3.4 Offline Sync (SQLite to Supabase via PowerSync)

```
User completes set / workout / notes change
        │
        ▼
SQLite write (Drizzle)
  • Record written with syncStatus = 'pending'
  • client_updated_at = Date.now()
        │
        ▼
PowerSync SDK (background process)
  Monitors SQLite WAL log for changes to synced tables
  Builds upload queue from pending records
        │
        ├─── [offline / no connectivity] ───→ queue persists in SQLite
        │                                      NetInfo onChange listener
        │                                      waits for reconnect
        │
        └─── [online] ──→

PowerSync upload cycle:
  1. Read pending records from upload queue
  2. HTTPS POST to Supabase PowerSync endpoint
     (Bearer token = Supabase JWT from expo-secure-store)
  3. Supabase applies records via RLS-enforced upsert
  4. Server returns server_updated_at timestamp
  5. PowerSync updates local syncStatus = 'synced'
  6. PowerSync updates server_updated_at in local SQLite
        │
        ▼
Conflict resolution (PowerSync built-in, LWW):
  if server_updated_at > client_updated_at:
    server record wins (rare: multi-device or server correction)
  else:
    client record wins (normal case: single-device user)

  Active workout records: client always wins
    (PowerSync config: filter active workouts from server-wins policy)
        │
        ▼
Download cycle (server → client):
  PowerSync streams Supabase Realtime changes to local SQLite
  Drizzle useLiveQuery hooks pick up changes automatically
  UI re-renders with merged data (no manual invalidation needed)

Sync status exposed via:
  syncStatusStore (Zustand) ← updated by PowerSync event callbacks
  SyncIndicator component shows: synced / syncing / offline / error
```

---

## 4. Module Boundaries

Each module owns a vertical slice. Modules communicate only through their exported interfaces, never by importing each other's internal implementations.

```typescript
// ─────────────────────────────────────────────────────────────
// MODULE: WorkoutEngine
// Owns: active workout lifecycle, set state, RPE evaluation, rest timer
// Exposes: IWorkoutEngine
// Depends on: DataLayer (WorkoutRepository), PlatformServices (notifications, haptics)
// ─────────────────────────────────────────────────────────────

interface IWorkoutEngine {
  // Lifecycle
  startWorkout(prescriptionId: string): Promise<ActiveWorkout>;
  endWorkout(workoutId: string): Promise<CompletedWorkout>;
  pauseWorkout(workoutId: string): Promise<void>;

  // Set management
  logSet(workoutExerciseId: string, set: SetInput): Promise<LoggedSet>;
  deleteSet(setId: string): Promise<void>;
  updateSet(setId: string, updates: Partial<SetInput>): Promise<LoggedSet>;

  // RPE evaluation
  evaluateRPEDeviation(set: SetInput, targetRPE: number): RPEEvaluation;

  // Rest timer
  startRestTimer(durationSeconds: number): Promise<void>;
  cancelRestTimer(): Promise<void>;

  // Recovery (crash-safe)
  recoverActiveWorkout(): Promise<ActiveWorkout | null>;
}

interface RPEEvaluation {
  deviation: number;           // actualRPE - targetRPE
  requiresAlert: boolean;      // deviation >= 1.0
  suggestedLoadAdjustment: number;  // e.g., -0.06 for -6%
}

// ─────────────────────────────────────────────────────────────
// MODULE: AIService
// Owns: Claude API communication, prescription caching, fallback chain
// Exposes: IAIService
// Depends on: DataLayer (AIResponseCache, MemoryRepository), MemoryService
// ─────────────────────────────────────────────────────────────

interface IAIService {
  // Prescription
  getDailyPrescription(context: AIContext): Promise<WorkoutPrescription>;
  generateMesocycle(userProfile: UserProfile): Promise<Mesocycle>;

  // Analysis
  analyzeWorkout(workoutId: string): Promise<WorkoutAnalysis>;
  explainAdaptation(adaptationId: string): Promise<string>;

  // Cache control
  invalidatePrescriptionCache(userId: string): Promise<void>;
  getCacheStatus(cacheKey: string): Promise<CacheStatus>;
}

interface AIContext {
  userProfile: UserProfile;
  mesocycleContext: MesocycleContext;
  recentWorkouts: RecentWorkout[];    // last 14 days
  relevantMemories: AgenticMemory[];  // top-5 by similarity
  activeInjuries: InjuryRestriction[];
}

interface WorkoutPrescription {
  exercises: PrescribedExercise[];
  sessionRationale: string;
  estimatedDurationMinutes: number;
  warnings: string[];
  generatedAt: number;
  source: 'claude' | 'cache' | 'deterministic' | 'last_prescription';
}

// ─────────────────────────────────────────────────────────────
// MODULE: InjuryService
// Owns: injury records, exercise substitution logic, load modifiers
// Exposes: IInjuryService
// Depends on: DataLayer (InjuryRepository, ExerciseRepository)
// ─────────────────────────────────────────────────────────────

interface IInjuryService {
  // Injury management
  recordInjury(injury: InjuryInput): Promise<Injury>;
  resolveInjury(injuryId: string): Promise<void>;
  getActiveRestrictions(userId: string): Promise<InjuryRestriction[]>;

  // Exercise safety
  getSubstitutions(
    exerciseId: string,
    restrictions: InjuryRestriction[]
  ): Promise<Exercise[]>;

  isExerciseSafe(
    exerciseId: string,
    restrictions: InjuryRestriction[]
  ): boolean;

  // Load modification
  getLoadModifier(
    exerciseId: string,
    restrictions: InjuryRestriction[]
  ): number;  // e.g., 0.8 = reduce to 80% of prescribed load
}

// ─────────────────────────────────────────────────────────────
// MODULE: MemoryService
// Owns: agentic memory storage, embedding generation, context retrieval
// Exposes: IMemoryService
// Depends on: DataLayer (MemoryRepository), PlatformServices (sqlite-vec)
// ─────────────────────────────────────────────────────────────

interface IMemoryService {
  // Storage
  storeMemory(memory: MemoryInput): Promise<AgenticMemory>;
  storeAdaptation(event: AdaptationEvent): Promise<AgenticMemory>;
  updateMemoryOutcome(memoryId: string, outcome: MemoryOutcome): Promise<void>;

  // Retrieval
  retrieveRelevant(
    query: string,
    userId: string,
    topK: number
  ): Promise<AgenticMemory[]>;

  // Context assembly
  buildAIContext(userId: string): Promise<AIContext>;
}

interface AgenticMemory {
  id: string;
  userId: string;
  type: 'adaptation' | 'preference' | 'pattern' | 'injury' | 'personal_record';
  content: string;          // Human-readable description
  metadata: Record<string, unknown>;
  embedding: number[] | null;  // null until generated
  confidence: number;       // 0.0 – 1.0
  createdAt: number;
  expiresAt: number | null;
}

// ─────────────────────────────────────────────────────────────
// MODULE: DataLayer
// Owns: all SQLite reads/writes via Drizzle ORM
// Exposes: repository interfaces
// Depends on: PlatformServices (expo-sqlite)
// ─────────────────────────────────────────────────────────────

interface IWorkoutRepository {
  findById(id: string): Promise<Workout | null>;
  findRecent(userId: string, limit: number): Promise<Workout[]>;
  findByDateRange(userId: string, from: number, to: number): Promise<Workout[]>;
  insert(workout: WorkoutInsert): Promise<Workout>;
  update(id: string, updates: Partial<WorkoutInsert>): Promise<Workout>;
  softDelete(id: string): Promise<void>;
}

interface IExerciseRepository {
  search(query: string, limit?: number): Promise<Exercise[]>;  // FTS5
  findById(id: string): Promise<Exercise | null>;
  findByMuscleGroup(group: string): Promise<Exercise[]>;
  findSubstitutes(exerciseId: string): Promise<Exercise[]>;
}

interface IAIResponseCache {
  get(cacheKey: string): Promise<WorkoutPrescription | null>;
  set(cacheKey: string, prescription: WorkoutPrescription, ttlMs: number): Promise<void>;
  invalidate(userId: string): Promise<void>;
}

// ─────────────────────────────────────────────────────────────
// MODULE: PlatformServices
// Owns: Expo/RN primitives wrapped for testability
// Exposes: IPlatformServices
// Depends on: nothing (leaf node)
// ─────────────────────────────────────────────────────────────

interface IPlatformServices {
  haptics: {
    success(): Promise<void>;
    warning(): Promise<void>;
    selection(): Promise<void>;
    impact(style: 'light' | 'medium' | 'heavy'): Promise<void>;
  };
  notifications: {
    scheduleRestComplete(endTimestamp: number): Promise<string>;
    cancel(notificationId: string): Promise<void>;
  };
  secureStore: {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<void>;
    delete(key: string): Promise<void>;
  };
  network: {
    isConnected(): Promise<boolean>;
    onConnectivityChange(handler: (connected: boolean) => void): () => void;
  };
}
```

---

## 5. AI Integration Architecture

### 5.1 Decision Boundary: Local vs. Claude API

The boundary is strict: Claude is never called during an active workout session. All local computations are deterministic and instant.

```
┌─────────────────────────────────────────────────────────────────┐
│  LOCAL DETERMINISTIC (always available, <5ms)                   │
│                                                                  │
│  • ProgressionCalculator                                         │
│    - estimateOneRepMax(weight, reps)      Epley / Brzycki        │
│    - calculateNextLoad(history, program)  Linear / DUP / Block   │
│    - calculateRPELoadAdjustment(target, actual)  Zourdos formula │
│    - calculateFitnessFatigue(history)     Banister model         │
│    - shouldDeload(recentWorkouts, ff)     Rule-based detection   │
│    - prescribedRestTime(exercise, rpe)    Lookup table           │
│                                                                  │
│  • InjuryService                                                 │
│    - getSubstitutions(exerciseId, restrictions)                  │
│    - isExerciseSafe(exerciseId, restrictions)                    │
│    - getLoadModifier(exerciseId, restrictions)                   │
│                                                                  │
│  • RPE Alerts                                                    │
│    - deviation >= 1.0 → alert with load suggestion              │
│    - 3 consecutive high RPE sessions → deload recommendation    │
│                                                                  │
│  • DeterministicFallback (offline AI substitute)                │
│    - Takes last prescription, applies ProgressionCalculator      │
│    - Outputs a valid WorkoutPrescription with source='deterministic'
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  CLAUDE API (online only, via Edge Function)                     │
│                                                                  │
│  • Mesocycle generation  (12-16 week plan)                       │
│    - Trigger: onboarding complete, mesocycle expired             │
│    - Model: claude-opus-4-6 (complex multi-step reasoning)       │
│    - Streaming response, cache 14 days                           │
│                                                                  │
│  • Daily prescription  (next session plan)                       │
│    - Trigger: app foreground, cache miss or expired (>8h)        │
│    - Model: claude-sonnet-4-6 (faster, sufficient for daily)     │
│    - Structured output (WorkoutPrescriptionSchema via tool use)  │
│    - Cache key: hash(userId+week+sessionType+YYYYMMDD)           │
│                                                                  │
│  • Post-workout analysis  (insights after completion)            │
│    - Trigger: workout ended                                      │
│    - Model: claude-sonnet-4-6                                    │
│    - Non-blocking (queued, runs in background)                   │
│    - Updates agentic memory with outcome + pattern annotations   │
│                                                                  │
│  • Embedding generation  (for agentic memory retrieval)          │
│    - Trigger: new memory stored while online                     │
│    - Queued when offline, generated on next connectivity         │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 Edge Function Design

```typescript
// supabase/functions/ai-coach/index.ts
// Single function, action discriminated by request body type

type AIRequestType =
  | 'daily_prescription'
  | 'mesocycle_generation'
  | 'post_workout_analysis'
  | 'generate_embedding';

Deno.serve(async (req: Request): Promise<Response> => {

  // ── Step 1: JWT validation ────────────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 });
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return new Response('Unauthorized', { status: 401 });

  // ── Step 2: Rate limiting ─────────────────────────────────────
  const monthlyTokens = await getUserMonthlyTokenUsage(supabase, user.id);
  const MONTHLY_LIMIT = 500_000;
  if (monthlyTokens > MONTHLY_LIMIT) {
    return new Response(
      JSON.stringify({ error: 'monthly_limit_exceeded' }),
      { status: 429 }
    );
  }

  // ── Step 3: Parse and validate request ────────────────────────
  const body = await req.json();
  const parsed = AIRequestSchema.safeParse(body);  // Zod validation
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'invalid_request' }), { status: 400 });
  }
  const { type, context } = parsed.data;

  // ── Step 4: Build prompt ──────────────────────────────────────
  const { systemPrompt, userMessage, schema } = buildPrompt(type, context);

  // ── Step 5: Claude call ───────────────────────────────────────
  const response = await anthropic.messages.create({
    model: type === 'mesocycle_generation' ? 'claude-opus-4-6' : 'claude-sonnet-4-6',
    max_tokens: type === 'mesocycle_generation' ? 4096 : 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    ...(schema && {
      tools: [{ name: 'respond', description: '...', input_schema: schema }],
      tool_choice: { type: 'tool', name: 'respond' },
    }),
  });

  // ── Step 6: Parse and validate response ──────────────────────
  const parsed_response = parseClaudeResponse(type, response);
  // Throws ZodError if schema mismatch — 500 triggers client fallback

  // ── Step 7: Log usage (async, non-blocking) ───────────────────
  supabase.from('ai_usage_log').insert({
    user_id: user.id,
    request_type: type,
    input_tokens: response.usage.input_tokens,
    output_tokens: response.usage.output_tokens,
    created_at: new Date().toISOString(),
  }).catch(console.error);

  return Response.json(parsed_response);
});
```

### 5.3 Fallback Chain

Evaluated left-to-right. First successful source wins.

```
Request for daily prescription
        │
        ▼
[1] SQLite cache (aiResponseCache)
    • HIT if: cacheKey matches AND generatedAt + ttlMs > now
    • source = 'cache'
    • Fast: <5ms, works offline
        │
        ├── MISS ──▼
        │
[2] Claude API via Edge Function
    • Timeout: 10 seconds
    • On timeout → 1 retry (same request)
    • On retry timeout or non-retryable error → continue to [3]
    • source = 'claude'
        │
        ├── FAIL ──▼
        │
[3] DeterministicFallback
    • Takes: last stored prescription from SQLite
    • Applies: ProgressionCalculator.nextLoad() to each exercise
    • Applies: mesocycleContext.currentWeek phase adjustments
    • Returns valid WorkoutPrescription
    • source = 'deterministic'
        │
        ├── No prior prescription exists ──▼
        │
[4] Last stored prescription (raw)
    • Query: SELECT * FROM aiResponseCache ORDER BY generatedAt DESC LIMIT 1
    • source = 'last_prescription'
    • Show banner: "Using last week's plan — connect to update"
        │
        ├── No prescriptions ever stored ──▼
        │
[5] Default starter prescription
    • Hardcoded beginner full-body template
    • source = 'default'
    • Only on truly first use before mesocycle generation
```

---

## 6. State Management

### 6.1 Store Map and Ownership

```
┌─────────────────────────────────────────────────────────────────┐
│  ZUSTAND — global persistent state                              │
│  Persisted to AsyncStorage via zustand/middleware/persist        │
│                                                                  │
│  userStore                                                       │
│    userId, email, displayName, avatarUrl                        │
│    unitSystem: 'metric' | 'imperial'                            │
│    isAuthenticated, isOnboardingComplete                        │
│                                                                  │
│  mesocycleStore                                                  │
│    currentMesocycle: Mesocycle | null                            │
│    currentWeek, currentPhase, weeklyVolume                      │
│    todayPrescription: WorkoutPrescription | null                 │
│    lastPrescriptionFetchedAt: number                            │
│                                                                  │
│  historyStore                                                    │
│    recentWorkouts: Workout[]  (last 14 days, in-memory cache)   │
│    personalRecords: Map<exerciseId, PersonalRecord>             │
│    lastHydratedAt: number                                        │
│                                                                  │
│  settingsStore                                                   │
│    hapticsEnabled, restTimerSoundEnabled                        │
│    defaultRestSeconds: number                                   │
│    approvalMode: boolean  (AI suggestion approval required)     │
│    weightIncrement: 1.25 | 2.5 | 5                             │
│                                                                  │
│  syncStatusStore                                                 │
│    status: 'synced' | 'syncing' | 'offline' | 'error'          │
│    lastSyncedAt: number | null                                   │
│    pendingUploadCount: number                                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  LEGEND STATE — active workout session (high-frequency)         │
│  Fine-grained observables; only changed fields trigger renders   │
│                                                                  │
│  workoutSession$ = observable({                                  │
│    workoutId: string | null,                                    │
│    isActive: boolean,                                           │
│    startedAt: number | null,                                    │
│    elapsedSeconds: number,  ← ticks every second               │
│                                                                  │
│    restTimer: {                                                  │
│      isRunning: boolean,                                        │
│      endTimestamp: number | null,  ← absolute time             │
│      remainingMs: number,          ← derived, ticks 10x/sec   │
│      notificationId: string | null,                            │
│    },                                                           │
│                                                                  │
│    exercises: ExerciseState[],   ← array of observables        │
│    currentExerciseIndex: number,                               │
│    currentSetIndex: number,                                     │
│                                                                  │
│    pendingRPEAlert: RPEAlert | null,                            │
│  })                                                             │
│                                                                  │
│  ExerciseState = observable({                                   │
│    exerciseId: string,                                          │
│    sets: SetState[],                                            │
│    isComplete: boolean,                                         │
│  })                                                             │
│                                                                  │
│  SetState = observable({                                        │
│    weight: number | null,                                       │
│    reps: number | null,                                         │
│    rpe: number | null,                                         │
│    isLogged: boolean,                                           │
│    setId: string | null,  ← populated after SQLite write       │
│  })                                                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  TANSTACK QUERY — server/async state cache                      │
│                                                                  │
│  Key: ['prescription', userId, weekKey]                         │
│    staleTime: 8h, gcTime: 24h                                   │
│    Source: AIService.getDailyPrescription()                     │
│                                                                  │
│  Key: ['mesocycle', userId]                                     │
│    staleTime: 24h, gcTime: 7 days                               │
│    Source: AIService.generateMesocycle() or Supabase fetch      │
│                                                                  │
│  Key: ['workoutHistory', userId, page]                          │
│    staleTime: 0 (always fresh after mutation)                   │
│    Source: WorkoutRepository.findRecent()                       │
│    Invalidated: on every workout completion                     │
│                                                                  │
│  Key: ['syncStatus']                                            │
│    Polled every 30s when online                                 │
│    Source: PowerSync.getSyncStatus()                            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  SQLITE — persistent truth (source of record)                   │
│                                                                  │
│  App launch hydration sequence:                                 │
│  1. SQLiteProvider opens DB, applies pending migrations         │
│  2. PRAGMA journal_mode = 'wal'                                 │
│  3. userStore ← SELECT * FROM users WHERE id = storedUserId     │
│  4. mesocycleStore ← SELECT current mesocycle                   │
│  5. historyStore ← SELECT workouts, last 14 days               │
│  6. settingsStore ← SELECT * FROM user_settings                 │
│  7. workoutSession$ ← SELECT active workout (crash recovery)    │
│  8. TanStack Query hydrates from SQLite aiResponseCache         │
│                                                                  │
│  Drizzle useLiveQuery: auto-updates Zustand/Legend State when   │
│  underlying SQLite rows change (e.g., sync writes new data)     │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 State Transition: Workout Lifecycle

```
            App Launch
                │
                ▼
        recoverActiveWorkout()
                │
    ┌───────────┴────────────┐
    │                        │
  (no active workout)   (active workout found)
    │                        │
    ▼                        ▼
mesocycleStore           Restore workoutSession$
loads prescription       Show "Resume Workout?" modal
    │                        │
    ▼                        ▼
WorkoutScreen            Resume from last logged set
(idle state)                 │
    │                        ▼
    ▼ (user taps "Start") Same flow below
workoutSession$.isActive = true
workoutSession$.startedAt = Date.now()
SQLite: INSERT INTO workouts (status = 'active')
    │
    ▼ (user logs sets)
See flow 3.1
    │
    ▼ (user taps "Finish Workout")
WorkoutEngine.endWorkout(workoutId)
  1. SQLite UPDATE workouts SET status='completed', completedAt=now
  2. workoutSession$.isActive = false (reset observable)
  3. Zustand historyStore.invalidate() → TanStack Query refetch
  4. AIService.analyzeWorkout(workoutId) [queued, background]
  5. Navigation: pop to PostWorkoutSummaryScreen
  6. PowerSync sync cycle triggered
```

---

## 7. Error Handling

### 7.1 Network Errors (Sync)

PowerSync handles all retry logic for workout data sync. The app never blocks on sync.

```typescript
// PowerSync configuration: exponential backoff with jitter
const powersyncConfig = {
  retryDelay: {
    initial: 1_000,       // 1 second
    max: 30 * 60_000,     // 30 minutes cap
    multiplier: 2,
    jitter: 0.2,
  },
  uploadBatchSize: 50,    // records per upload batch
};

// syncStatusStore reflects PowerSync state for UI feedback
powersync.on('statusChange', (status) => {
  syncStatusStore.setState({
    status: status.connected
      ? (status.uploading ? 'syncing' : 'synced')
      : 'offline',
    lastSyncedAt: status.lastSyncedAt,
    pendingUploadCount: status.pendingUploadCount,
  });
});
```

For AI requests specifically:

```typescript
// AIService: custom retry with fallback chain
async function fetchPrescriptionWithRetry(
  context: AIContext,
  timeoutMs = 10_000
): Promise<WorkoutPrescription> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await Promise.race([
        callEdgeFunction('ai-coach', context),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), timeoutMs)
        ),
      ]);
      return result;
    } catch (err) {
      if (attempt === 0 && isRetryable(err)) continue;
      break;  // Exhausted retries or non-retryable error
    }
  }

  // Fallback chain (see Section 5.3)
  return DeterministicFallback.getPrescription(context);
}

function isRetryable(err: unknown): boolean {
  if (err instanceof Error && err.message === 'timeout') return true;
  if (err instanceof Response && err.status >= 500) return true;
  return false;  // 401, 429, 400 are NOT retried
}
```

### 7.2 Claude API Errors

```
Error Type            Action
─────────────────     ──────────────────────────────────────────────
Timeout (>10s)        1 retry → deterministic fallback
HTTP 429 (rate limit) no retry → cached prescription + user banner
HTTP 401 (auth)       no retry → re-auth flow → then retry
HTTP 500 (server)     1 retry → deterministic fallback
ZodError (bad JSON)   no retry → deterministic fallback + log error
Network offline       skip call → deterministic fallback immediately
```

User-facing messages for AI degradation:

```typescript
const AI_DEGRADED_MESSAGES = {
  offline:        "Using offline plan — connect to get today's personalized prescription",
  rate_limited:   "Daily AI limit reached — showing your cached plan",
  error:          "AI coaching unavailable — showing smart default",
  deterministic:  "Personalized by your history — AI will update when connected",
} as const;
```

### 7.3 Crash Recovery (Active Workout)

The active workout is persisted to SQLite on every set log. App termination mid-workout loses at most one in-progress set (not yet tapped "Log Set").

```typescript
// Every logSet call writes to SQLite before updating UI
async function logSet(workoutExerciseId: string, set: SetInput): Promise<LoggedSet> {
  // 1. Validate
  const validated = SetInputSchema.parse(set);  // throws ZodError if invalid

  // 2. SQLite write FIRST (crash-safe)
  const logged = await db.insert(setsTable).values({
    id: uuid(),
    workoutExerciseId,
    ...validated,
    completedAt: Date.now(),
    syncStatus: 'pending',
  }).returning();

  // 3. Update Legend State (optimistic, in-memory)
  workoutSession$.exercises[exerciseIndex].sets[setIndex].isLogged.set(true);
  workoutSession$.exercises[exerciseIndex].sets[setIndex].setId.set(logged[0].id);

  // 4. Update rest timer end time in SQLite
  await db.update(activeWorkoutsTable)
    .set({ restTimerEndsAt: Date.now() + prescribedRestMs })
    .where(eq(activeWorkoutsTable.id, currentWorkoutId));

  return logged[0];
}

// On app cold start — check for abandoned active workout
async function recoverActiveWorkout(): Promise<ActiveWorkout | null> {
  const active = await db.select().from(workoutsTable)
    .where(
      and(
        eq(workoutsTable.status, 'active'),
        eq(workoutsTable.userId, currentUserId)
      )
    )
    .limit(1);

  if (active.length === 0) return null;

  // Restore Legend State from SQLite
  const workout = active[0];
  const exercises = await db.select().from(workoutExercisesTable)
    .where(eq(workoutExercisesTable.workoutId, workout.id));

  workoutSession$.workoutId.set(workout.id);
  workoutSession$.isActive.set(true);
  workoutSession$.startedAt.set(workout.startedAt);

  // Restore rest timer if still active
  if (workout.restTimerEndsAt && workout.restTimerEndsAt > Date.now()) {
    workoutSession$.restTimer.endTimestamp.set(workout.restTimerEndsAt);
    workoutSession$.restTimer.isRunning.set(true);
  }

  return workout;
}
```

---

## 8. Security

### 8.1 API Key Protection

The `ANTHROPIC_API_KEY` is an environment variable accessible only in the Supabase Edge Function runtime. It is never present in the mobile app bundle, never in `app.json`, never in any `EXPO_PUBLIC_` variable (which are baked into the JS bundle).

```
Mobile App bundle
  ├── EXPO_PUBLIC_SUPABASE_URL       ← safe (public)
  ├── EXPO_PUBLIC_SUPABASE_ANON_KEY  ← safe (public, restricted by RLS)
  └── (no ANTHROPIC_API_KEY)

Supabase Edge Function environment (server-side only)
  ├── ANTHROPIC_API_KEY              ← secret, never leaves Deno runtime
  ├── SUPABASE_URL                   ← internal
  └── SUPABASE_SERVICE_ROLE_KEY      ← secret
```

### 8.2 Authentication Flow

```typescript
// Auth token storage — never AsyncStorage, always SecureStore
import * as SecureStore from 'expo-secure-store';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      getItem: (key) => SecureStore.getItemAsync(key),
      setItem: (key, value) => SecureStore.setItemAsync(key, value),
      removeItem: (key) => SecureStore.deleteItemAsync(key),
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,  // mobile: no URL-based OAuth callbacks
  },
});
```

Row Level Security enforced on all Supabase tables. Every query is scoped to `auth.uid()`:

```sql
-- Example RLS policy (applied to all user-owned tables)
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own workouts"
  ON workouts
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

### 8.3 Input Validation (Zod)

All inputs are validated with Zod before reaching service or data layers. All AI responses from Claude are validated against their schema before being stored or displayed.

```typescript
// Workout input validation
const SetInputSchema = z.object({
  weight: z.number().positive().max(1000),   // kg, max realistic barbell load
  reps: z.number().int().min(1).max(100),
  rpe: z.number().min(5).max(10).multipleOf(0.5).optional(),
  tempo: z.string().regex(/^\d{4}$/).optional(),  // e.g., "3010"
});

// AI response validation (applied after every Claude call)
const WorkoutPrescriptionSchema = z.object({
  exercises: z.array(z.object({
    name: z.string().max(100),
    sets: z.number().int().min(1).max(10),
    repRange: z.tuple([z.number().int(), z.number().int()]),
    targetRPE: z.number().min(5).max(10),
    weightKg: z.number().positive(),
    rationale: z.string().max(200),
  })).max(12),
  sessionRationale: z.string().max(500),
  estimatedDurationMinutes: z.number().int().min(15).max(180),
  warnings: z.array(z.string().max(200)).max(5),
});

// AI response validation wrapper
function parseAIResponse<T>(
  schema: z.ZodSchema<T>,
  rawResponse: unknown,
  fallbackFn: () => T
): T {
  const result = schema.safeParse(rawResponse);
  if (result.success) return result.data;

  // Log for debugging — do not surface raw Zod error to user
  console.error('[AIService] Invalid response schema:', result.error.issues);
  return fallbackFn();
}
```

### 8.4 Security Summary

| Concern | Mitigation |
|---|---|
| API key in client bundle | Edge Function only; never in RN bundle |
| Auth token storage | expo-secure-store (iOS Keychain / Android Keystore) |
| User data isolation | Supabase RLS on all tables, scoped to auth.uid() |
| Input tampering | Zod validation on all service layer inputs |
| AI response injection | Zod validation on all Claude outputs before use |
| Session hijacking | Supabase short-lived JWTs with auto-refresh |
| Offline data at rest | SQLite encrypted via expo-sqlite encryption option (Phase 2) |
| Rate limit abuse | Per-user monthly token budget enforced in Edge Function |

---

## Appendix: Key Interfaces at a Glance

```typescript
// The contracts between layers. Never import concrete implementations
// across module boundaries — depend only on these interfaces.

export type {
  // WorkoutEngine
  IWorkoutEngine, ActiveWorkout, CompletedWorkout, LoggedSet, SetInput, RPEEvaluation,

  // AIService
  IAIService, WorkoutPrescription, Mesocycle, WorkoutAnalysis, AIContext,

  // InjuryService
  IInjuryService, Injury, InjuryRestriction,

  // MemoryService
  IMemoryService, AgenticMemory, AdaptationEvent, MemoryOutcome,

  // DataLayer
  IWorkoutRepository, IExerciseRepository, IAIResponseCache,

  // PlatformServices
  IPlatformServices,
} from '@/types/contracts';
```

All interfaces are declared in `/src/types/contracts.ts`. Concrete implementations live in their feature directories (`/src/features/workouts/`, `/src/features/ai/`, etc.) and are injected via React Context or direct instantiation — never imported across feature boundaries.

---

*Document generated: March 3, 2026*
*Next: 05-BACKEND-ARCHITECTURE.md (data schema, RLS policies, Edge Function specs)*
