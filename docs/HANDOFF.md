# Handoff Document — Intelligent Training Companion

**Date:** March 4, 2026
**Branch:** `claude/setup-edmund-io-dWMVi`
**Status:** All 4 sprints implemented and pushed

---

## Project State

All 4 sprints are complete. The app has a full offline-first workout tracking system with AI-powered coaching, periodized training programs, and agentic memory.

### Completed Sprints

| Sprint | Weeks | Theme | Key Deliverables |
|--------|-------|-------|-----------------|
| 1 | 1-4 | Core Logging | SQLite schema (7 tables), workout/exercise/set CRUD, auto-fill, rest timer, history screen, profile, exercise library |
| 2 | 5-8 | Intelligence Layer | Progression calculator (Epley 1RM, RPE-to-load), Banister fitness-fatigue model, RPE modal, adaptation alerts, PR detection, AI service (edge function + deterministic fallback), injury system, Supabase auth |
| 3 | 9-12 | Mesocycle Programming | Onboarding flow, periodization selector, mesocycle/microcycle repos, mesocycle store, AI-generated training plans, daily prescriptions, phase management, deload scheduling, volume tracking, milestone reviews, progress charts, goal reassessment |
| 4 | 13-16 | Agentic Memory | Pattern detection (RPE ranges, fatigue trends, exercise preferences, recovery timeline), confidence scoring, memory repository, auto-extract post-workout, AI context assembly, disagreement tracking, override learning (3+ overrides → preference memory), memory dashboard, pattern detail |

---

## Database Schema (4 Migrations)

| Migration | Tag | Tables | Notes |
|-----------|-----|--------|-------|
| 0000 | light_ghost_rider | exercises, exercise_performances, injuries, injury_risks, set_logs, users, workouts | Core schema |
| 0001 | intelligence_layer | personal_records, ai_cache | PR tracking, AI response cache |
| 0002 | mesocycle_programming | mesocycles, microcycles | + workouts.mesocycle_id/microcycle_id, users.available_equipment/weekly_frequency |
| 0003 | agentic_memory | agentic_memories, user_disagreements | 4 indexes on memories, 1 on disagreements |

**Total: 12 tables**

---

## Architecture

```
React Native (Expo SDK 54) + TypeScript strict
├── Screens (15 total)
│   Home, ActiveWorkout, PostWorkout, History, Exercises,
│   Profile, Auth, InjuryManagement, Onboarding,
│   MesocycleGeneration, MesocycleOverview, GoalReassessment,
│   ProgressCharts, MemoryDashboard, PatternDetail
├── Stores (Zustand + AsyncStorage persist)
│   userStore, mesocycleStore
├── Features
│   workouts/  — repository, progression-calculator,
│                fitness-fatigue-model, personal-records-repo
│   ai/       — AIService, deterministic-fallback, ai-cache
│   programs/ — mesocycle/microcycle repos, periodization,
│               phase-manager, deload-scheduler, volume-tracker
│   memory/   — memory-repository, pattern-detector,
│               memory-service, confidence-calculator,
│               override-learning, useMemoryContext
│   injuries/ — repository, injury-aware adaptations
│   exercises/ — repository, search
├── SQLite (expo-sqlite + Drizzle migrations)
│   12 tables, WAL mode, offline-first
└── Supabase Edge Function (ai-coach: 5 modes)
    daily_prescription, post_workout_analysis,
    mesocycle_generation, milestone_review
    (all via Anthropic Claude API)
```

---

## Key Patterns

### Repository Pattern
All repositories use `expoDb` raw SQL (synchronous):
- `expoDb.getFirstSync<RowType>(sql, params)` → single row or null
- `expoDb.getAllSync<RowType>(sql, params)` → array
- `expoDb.runSync(sql, params)` → mutation
- `expoDb.withTransactionSync(fn)` → atomic transaction

Each repo exports a plain object with:
- Snake_case `RowType` + `rowToX()` mapper → camelCase domain type
- `generateId()` from `src/lib/uuid.ts` for UUIDs
- `new Date().toISOString()` for timestamps

### Migration Pattern
Inline SQL strings in `src/lib/migrate.ts`. Each migration has:
- Journal entry: `{ idx, when (unix ms), tag, breakpoints: true }`
- SQL string with `\n\t` escaping and `--> statement-breakpoint` separators

### AI Waterfall
`AIService.getDailyPrescription()`: SQLite cache → Supabase Edge Function → deterministic fallback. Always returns a result, works 100% offline.

### Confidence Scoring
`confidence = 0.30 * observationScore + 0.40 * successRate + 0.30 * recencyScore`
- observationScore: `observations / (observations + 10)` (asymptotic)
- recencyScore: `2^(-(daysSinceObserved / 60))` (60-day half-life)

### Override Learning
When user overrides AI adaptation suggestion 3+ times for same exercise/suggestion combo, system auto-creates a `"preference"` memory that influences future prescriptions.

---

## Sprint 4 Files (Agentic Memory)

### Created
| File | Purpose |
|------|---------|
| `src/types/memory.ts` | MemoryType, AgenticMemory, UserDisagreement, NewMemoryInput, ConfidenceFactors |
| `src/features/memory/confidence-calculator.ts` | calculateConfidence(), clampConfidence(), daysBetweenIso(), MEMORY_BUDGET |
| `src/features/memory/memory-repository.ts` | CRUD + findRelevant (metadata-based) + reinforceMemory + recordOutcome + pruneExpired + disagreements |
| `src/features/memory/pattern-detector.ts` | detectPatterns() — RPE ranges, fatigue trends, exercise preferences, recovery timeline |
| `src/features/memory/memory-service.ts` | storeMemory (dedup), extractAndStorePatterns, buildAIContext |
| `src/features/memory/useMemoryContext.ts` | React hook for memoized AI context string |
| `src/features/memory/override-learning.ts` | recordAdaptationChoice, checkAndLearnFromOverrides, getHistoricalContext |
| `src/features/memory/MemoryDashboardScreen.tsx` | FlashList of memories with type badges, confidence bars, empty state |
| `src/features/memory/PatternDetailScreen.tsx` | Full evidence view: confidence, stats, timeline, trigger/response |

### Modified
| File | Changes |
|------|---------|
| `src/lib/migrate.ts` | Added migration 0003_agentic_memory |
| `src/types/index.ts` | Re-export memory types |
| `src/features/workouts/PostWorkoutScreen.tsx` | Fire-and-forget pattern extraction after AI analysis |
| `src/features/ai/AIService.ts` | Optional memoryContext param for getDailyPrescription |
| `supabase/functions/ai-coach/index.ts` | Inject memoryContext into daily_prescription prompt |
| `src/components/workout/AdaptationAlert.tsx` | historicalContext prop, italic hint text |
| `src/features/workouts/ActiveWorkoutScreen.tsx` | Override recording, historical context lookup |
| `src/navigation/types.ts` | MemoryDashboard, PatternDetail routes |
| `src/navigation/RootNavigator.tsx` | Registered both screens with headers |
| `src/features/home/HomeScreen.tsx` | "What I've Learned" card with top-2 memories |

---

## What's NOT Implemented (Out of Scope)

- **sqlite-vec** vector search — skipped for Expo compatibility (per Sprint 4 risks)
- **PowerSync** sync integration (task 4.16) — deferred
- **End-to-end integration tests** (task 4.17) — deferred
- **Embedding generation** Edge Function — not needed without sqlite-vec

---

## How to Continue

### Running the App
```bash
npx expo start
```

### Type Checking
```bash
npx tsc --noEmit
```

### Key Extension Points

1. **Add more pattern detectors** — extend `pattern-detector.ts` with new analysis functions
2. **Improve memory retrieval** — when sqlite-vec becomes Expo-compatible, add vector similarity search to `memory-repository.ts`
3. **Add PowerSync** — configure sync rules in `src/lib/sync.ts` for `agentic_memories` and `user_disagreements` tables (LWW conflict resolution)
4. **More AI modes** — add new modes to `supabase/functions/ai-coach/index.ts` following the existing pattern
5. **Memory types** — extend `MemoryType` union in `src/types/memory.ts` and add corresponding detection logic

### Commit History (Sprint 4)
1. `58ce504` — Schema + types + confidence scoring
2. `aaa0365` — Memory repository
3. `be58954` — Pattern detector
4. `bafe45a` — Memory service + auto-extract
5. `b6e9c40` — Context assembly + AI prescription
6. `660ef37` — Disagreement tracking + override learning
7. `f34e18f` — Memory dashboard + pattern detail screens
8. `f659f4e` — Navigation registration + HomeScreen insights
