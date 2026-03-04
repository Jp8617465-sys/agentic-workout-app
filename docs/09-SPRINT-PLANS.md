# Sprint Plans — Intelligent Training Companion

**Version:** 1.0
**Date:** March 3, 2026
**Status:** Approved
**Inputs:** PROJECT_BRIEF.md (Development Roadmap), 01-PRD.md, 04–08 Architecture Docs

---

## Table of Contents

1. [Sprint Overview](#1-sprint-overview)
2. [Sprint 1: Core Logging (Weeks 1–4)](#2-sprint-1-core-logging-weeks-14)
3. [Sprint 2: Intelligence Layer (Weeks 5–8)](#3-sprint-2-intelligence-layer-weeks-58)
4. [Sprint 3: Mesocycle Programming (Weeks 9–12)](#4-sprint-3-mesocycle-programming-weeks-912)
5. [Sprint 4: Agentic Memory (Weeks 13–16)](#5-sprint-4-agentic-memory-weeks-1316)
6. [Definition of Done](#6-definition-of-done)

---

## 1. Sprint Overview

Each sprint is 4 weeks (2 × 2-week iterations). Sprints map to the PROJECT_BRIEF's Phases 1–4.

```
Sprint 1: Core Logging        (Weeks 1-4)   ← Must ship FIRST
Sprint 2: Intelligence Layer   (Weeks 5-8)   ← Depends on Sprint 1 data
Sprint 3: Mesocycle Programming (Weeks 9-12)  ← Depends on Sprint 2 AI service
Sprint 4: Agentic Memory       (Weeks 13-16) ← Depends on Sprint 2+3 patterns
```

**Deliverable per sprint:** Working app that can be tested on a real device at the gym.

---

## 2. Sprint 1: Core Logging (Weeks 1–4)

**Goal:** Replicate Strong's 10-second set logging speed. User can log a 5-exercise workout in < 60 seconds.

**Success Criteria:**
- Set logging in 3 taps (weight → reps → checkbox)
- Rest timer survives app backgrounding
- Auto-fill from last workout's data
- Works 100% offline (no backend dependency)

### Week 1–2: Foundation

| # | Task | Files | Estimate | Dependencies |
|---|------|-------|----------|-------------|
| 1.1 | **Expo project setup** — SDK 54, TypeScript strict, NativeWind v4, Reanimated 3, RNGH | `app.json`, `tsconfig.json`, `package.json`, `tailwind.config.js` | 4h | None |
| 1.2 | **SQLite + Drizzle setup** — Database initialization, WAL mode, schema definition | `src/lib/database.ts`, `src/lib/schema.ts` | 6h | 1.1 |
| 1.3 | **Drizzle migrations** — Initial migration, `useMigrations` hook, `SQLiteProvider` | `drizzle/migrations/`, `src/lib/migrate.ts` | 3h | 1.2 |
| 1.4 | **Custom migrations** — FTS5 virtual table, triggers | `src/lib/custom-migrations.ts` | 2h | 1.3 |
| 1.5 | **Exercise seed data** — 100+ exercises JSON, injury risk matrix, seed loader | `src/constants/exercise-seed-data.json`, `src/constants/injury-risk-matrix.json`, `src/lib/seed.ts` | 8h | 1.3 |
| 1.6 | **Navigation setup** — React Navigation v7, RootStack, MainTabs, basic screens | `src/navigation/RootNavigator.tsx`, `src/navigation/TabNavigator.tsx` | 4h | 1.1 |
| 1.7 | **Design system constants** — Colors, typography, spacing, component base styles | `src/constants/colors.ts`, `src/constants/typography.ts`, `src/constants/spacing.ts` | 3h | 1.1 |
| 1.8 | **Zustand stores** — userStore, settingsStore, historyStore (basic) | `src/stores/userStore.ts`, `src/stores/settingsStore.ts`, `src/stores/historyStore.ts` | 4h | 1.2 |
| 1.9 | **Repository: exercises** — `search()` (FTS5), `findByName()`, `findByPattern()` | `src/features/exercises/exercise-repository.ts` | 4h | 1.4, 1.5 |
| 1.10 | **Exercise Library screen** — Searchable list with FTS5, category filters | `src/features/exercises/ExerciseLibraryScreen.tsx` | 6h | 1.6, 1.9 |

**Week 1–2 total: ~44h**

### Week 3–4: Workout Logging

| # | Task | Files | Estimate | Dependencies |
|---|------|-------|----------|-------------|
| 1.11 | **Legend State setup** — `workoutSession$` observable, exercise/set structure | `src/stores/activeWorkoutStore.ts` | 4h | 1.1 |
| 1.12 | **Repository: workouts** — `insert`, `findRecent`, `findLastWithExercise`, `getActiveWorkout`, `saveCompleteWorkout` | `src/features/workouts/workout-repository.ts` | 8h | 1.2 |
| 1.13 | **Custom Numpad** — Persistent bottom sheet, digit/backspace/decimal, haptic feedback | `src/components/workout/CustomNumpad.tsx` | 6h | 1.1 |
| 1.14 | **SetRow component** — Weight/reps/RPE display, completion checkbox, swipe gestures, React.memo | `src/components/workout/SetRow.tsx` | 8h | 1.13 |
| 1.15 | **ExerciseCard component** — Header + SetRow list + "Add Set" button | `src/components/workout/ExerciseCard.tsx` | 6h | 1.14 |
| 1.16 | **ActiveWorkoutScreen** — FlashList of ExerciseCards, numpad integration, start/end lifecycle | `src/features/workouts/ActiveWorkoutScreen.tsx` | 10h | 1.11, 1.12, 1.15 |
| 1.17 | **Auto-fill from history** — Query last workout for each exercise, pre-fill weight/reps | `src/features/workouts/auto-fill.ts` | 4h | 1.12 |
| 1.18 | **Rest timer** — Compact inline + fullscreen modal, background notification, timestamp-based survival | `src/components/workout/RestTimerCompact.tsx`, `src/components/workout/RestTimerFullScreen.tsx` | 8h | 1.11 |
| 1.19 | **Set completion animation** — Checkbox fill + row background (Reanimated 3) | Within `SetRow.tsx` | 3h | 1.14 |
| 1.20 | **Rest timer arc animation** — Circular SVG arc, 60fps (Reanimated 3) | Within `RestTimerFullScreen.tsx` | 4h | 1.18 |
| 1.21 | **Home screen** — "Start Workout" button, last workout summary | `src/features/home/HomeScreen.tsx` | 4h | 1.12 |
| 1.22 | **History screen** — Workout list, basic detail view | `src/features/history/HistoryScreen.tsx` | 6h | 1.12 |
| 1.23 | **Workout recovery** — Detect active workout on app launch, offer to resume or discard | `src/features/workouts/workout-recovery.ts` | 3h | 1.12, 1.16 |
| 1.24 | **Profile screen** — Basic user info, settings (units, haptics, rest timer defaults) | `src/features/profile/ProfileScreen.tsx` | 4h | 1.8 |

**Week 3–4 total: ~78h**

**Sprint 1 total: ~122h (~30h/week)**

### Sprint 1 Risks

| Risk | Mitigation |
|------|-----------|
| NativeWind v4 + Expo SDK 54 compatibility | Pin NativeWind 4.1.x; fallback to StyleSheet for workout screen |
| Custom numpad bottom sheet performance | Test on mid-range Android early; profile with Flipper |
| SQLite seed loading slow on first launch | Batch inserts in transactions of 50; show progress indicator |

---

## 3. Sprint 2: Intelligence Layer (Weeks 5–8)

**Goal:** Add smart progression and real-time adaptation. System suggests accurate load progressions 80%+ of the time.

**Success Criteria:**
- RPE deviation alerts fire within 1 set of threshold breach
- ProgressionCalculator suggests loads within 5% of expert prescription
- Post-workout insights generated (online)
- Deterministic fallback works fully offline

### Week 5–6: Progression & Adaptation

| # | Task | Files | Estimate | Dependencies |
|---|------|-------|----------|-------------|
| 2.1 | **ProgressionCalculator** — `estimateOneRepMax` (Epley), `calculateNextLoad`, `calculateRPELoadAdjustment` (Zourdos), `shouldDeload` | `src/features/workouts/progression-calculator.ts` | 8h | Sprint 1 |
| 2.2 | **RPE evaluation** — `evaluateRPEDeviation()`, threshold detection (>= 1.0 RPE), load adjustment suggestion | `src/features/workouts/rpe-evaluator.ts` | 4h | 2.1 |
| 2.3 | **RPEModal** — Post-set RPE input, spring slide-up animation | `src/components/workout/RPEModal.tsx` | 4h | Sprint 1 |
| 2.4 | **AdaptationAlert** — RPE deviation options (reduce load/volume/continue), historical context | `src/components/workout/AdaptationAlert.tsx` | 6h | 2.2 |
| 2.5 | **WorkoutEngine service** — Orchestrates `logSet` → validate → RPE check → SQLite write → rest timer → haptic | `src/features/workouts/workout-engine.ts` | 8h | 2.1, 2.2, Sprint 1 |
| 2.6 | **Integrate RPE flow** — Wire RPEModal + AdaptationAlert into ActiveWorkoutScreen | `ActiveWorkoutScreen.tsx` updates | 4h | 2.3, 2.4, 2.5 |
| 2.7 | **Personal records detection** — Compare logged sets against best-ever, double haptic, PR badge | `src/features/workouts/personal-records.ts` | 4h | 2.5 |
| 2.8 | **Fitness-Fatigue model** — Banister model with training load, fitness decay (45d), fatigue decay (15d) | `src/features/workouts/fitness-fatigue.ts` | 6h | Sprint 1 data |
| 2.9 | **Deload detection** — Rule-based: 3 consecutive high-RPE sessions, fatigue index threshold | `src/features/workouts/deload-detector.ts` | 3h | 2.8 |

**Week 5–6 total: ~47h**

### Week 7–8: AI Integration & Injury

| # | Task | Files | Estimate | Dependencies |
|---|------|-------|----------|-------------|
| 2.10 | **Supabase setup** — Project creation, Auth config, RLS policies for all tables | `supabase/` config, migration SQL | 6h | None |
| 2.11 | **Edge Function: ai-coach** — Entry point, JWT auth, rate limiting, Zod schemas, Claude API call | `supabase/functions/ai-coach/index.ts`, `schemas.ts`, `prompts.ts` | 10h | 2.10 |
| 2.12 | **Client AIService** — `getDailyPrescription`, cache check → Claude → deterministic fallback chain | `src/features/ai/ai-service.ts` | 6h | 2.11 |
| 2.13 | **AI cache repository** — `get`, `set`, `invalidateForUser` with TTL | `src/features/ai/ai-cache-repository.ts` | 3h | Sprint 1 schema |
| 2.14 | **DeterministicFallback** — Take last prescription, apply ProgressionCalculator, output valid prescription | `src/features/ai/deterministic-fallback.ts` | 4h | 2.1, 2.12 |
| 2.15 | **InjuryService** — `getActiveRestrictions`, `getSubstitutions`, `isExerciseSafe`, `getLoadModifier` | `src/features/injuries/injury-service.ts` | 6h | Sprint 1 seed data |
| 2.16 | **Injury management UI** — Add/edit/resolve injuries, severity slider, status picker | `src/features/injuries/InjuryManagementScreen.tsx` | 6h | 2.15 |
| 2.17 | **Exercise substitution UI** — "Swap" button on ExerciseHeader, show safe alternatives filtered by injuries | `src/components/workout/ExerciseSwapModal.tsx` | 4h | 2.15 |
| 2.18 | **Post-workout screen** — Summary stats, AI analysis (loading state), PR celebrations, insights | `src/features/workouts/PostWorkoutScreen.tsx` | 6h | 2.5, 2.12 |
| 2.19 | **Post-workout analysis** — Edge Function prompt + schema, background fetch after workout end | Extend `ai-coach` Edge Function | 4h | 2.11 |
| 2.20 | **Auth flow** — Supabase Auth, login/signup screens, expo-secure-store JWT storage | `src/features/auth/`, Supabase client config | 8h | 2.10 |

**Week 7–8 total: ~63h**

**Sprint 2 total: ~110h**

### Sprint 2 Risks

| Risk | Mitigation |
|------|-----------|
| Claude response format mismatch | Zod validation + tool_choice constraint; fallback chain handles failures |
| Edge Function cold start latency | Warm function with keep-alive; 10s client timeout |
| RPE evaluation formula accuracy | Validate against PROJECT_BRIEF's Zourdos formula; unit test edge cases |

---

## 4. Sprint 3: Mesocycle Programming (Weeks 9–12)

**Goal:** Auto-generate periodized training blocks. Generated programs follow evidence-based periodization.

**Success Criteria:**
- Mesocycle generation produces valid 4–16 week plan
- Phase transitions (accumulation → intensification → realization → deload) follow periodization model
- Daily prescription reflects current week/phase context
- Mesocycle review at milestone weeks

### Week 9–10: Mesocycle Generation

| # | Task | Files | Estimate | Dependencies |
|---|------|-------|----------|-------------|
| 3.1 | **Onboarding flow** — Multi-step: goals, experience, equipment, injuries, weekly frequency | `src/features/onboarding/OnboardingScreen.tsx` (5 sub-screens) | 10h | Sprint 2 auth |
| 3.2 | **Periodization model selection** — Algorithm: beginner→linear, concurrent→block, intermediate→DUP, advanced→conjugate | `src/features/programs/periodization-selector.ts` | 4h | None |
| 3.3 | **Mesocycle repository** — `insert`, `findActive`, `update`, `findByUser` | `src/features/programs/mesocycle-repository.ts` | 4h | Sprint 1 schema |
| 3.4 | **Microcycle repository** — `insert`, `findByMesocycle`, `updateActuals` | `src/features/programs/microcycle-repository.ts` | 3h | Sprint 1 schema |
| 3.5 | **Edge Function: mesocycle generation** — Claude Opus prompt, MesocycleSchema response, 30s timeout | Extend `ai-coach` Edge Function | 6h | Sprint 2 Edge Function |
| 3.6 | **Mesocycle generation UI** — Loading state (Opus can take 15s), progress indicators, result preview | `src/features/programs/MesocycleGenerationScreen.tsx` | 6h | 3.5 |
| 3.7 | **Mesocycle store** — Zustand: `currentMesocycle`, `currentWeek`, `currentPhase`, `todayPrescription` | `src/stores/mesocycleStore.ts` | 3h | 3.3 |
| 3.8 | **Home screen: prescription view** — Show today's prescribed workout, "Start" button pre-loads prescription | Update `HomeScreen.tsx` | 4h | 3.7, Sprint 2 AI |

**Week 9–10 total: ~40h**

### Week 11–12: Phase Management & Review

| # | Task | Files | Estimate | Dependencies |
|---|------|-------|----------|-------------|
| 3.9 | **Phase transition logic** — Detect week boundaries, update phase, adjust volume/intensity targets | `src/features/programs/phase-manager.ts` | 6h | 3.7 |
| 3.10 | **Deload week scheduling** — Auto-insert deload after accumulation block, per periodization model | `src/features/programs/deload-scheduler.ts` | 4h | 3.9, 2.9 |
| 3.11 | **Volume tracking** — Weekly volume per muscle group, vs target comparison, overreach detection | `src/features/programs/volume-tracker.ts` | 5h | Sprint 1 data |
| 3.12 | **Mesocycle overview screen** — Phase timeline, weekly progress bars, current position indicator | `src/features/programs/MesocycleOverviewScreen.tsx` | 6h | 3.7 |
| 3.13 | **Milestone review** — End-of-microcycle review prompt, AI analysis of 4-week block, goal check | `src/features/programs/milestone-review.ts` | 6h | 3.5 |
| 3.14 | **Goal reassessment flow** — UI for adjusting goals mid-cycle, triggers mesocycle recalculation | `src/features/programs/GoalReassessmentScreen.tsx` | 4h | 3.13 |
| 3.15 | **Daily prescription integration** — Home screen shows prescribed exercises with rationale, warm-up guidance | Update `HomeScreen.tsx`, `ActiveWorkoutScreen.tsx` | 6h | 3.8 |
| 3.16 | **Progress charts** — Volume over time, 1RM estimates, RPE trends (Victory Native) | `src/features/progress/ProgressChartsScreen.tsx` | 8h | Sprint 1+2 data |

**Week 11–12 total: ~45h**

**Sprint 3 total: ~85h**

### Sprint 3 Risks

| Risk | Mitigation |
|------|-----------|
| Claude Opus latency (15s+) for mesocycle | Show streaming progress; cache aggressively (14 days) |
| Periodization model complexity | Start with Linear and Block only; add DUP/Conjugate in Sprint 5 |
| Phase transition edge cases | Comprehensive unit tests for boundary conditions |

---

## 5. Sprint 4: Agentic Memory (Weeks 13–16)

**Goal:** System learns and adapts to individual patterns. System remembers 5+ personalized patterns per user.

**Success Criteria:**
- Patterns detected from workout history (RPE trends, exercise preferences, fatigue patterns)
- Memories influence AI prescriptions via context assembly
- User can view learned patterns in a dashboard
- Confidence scoring differentiates strong vs weak patterns

### Week 13–14: Pattern Detection & Storage

| # | Task | Files | Estimate | Dependencies |
|---|------|-------|----------|-------------|
| 4.1 | **Memory repository** — `insert`, `searchByVector`, `reinforceMemory`, `recordOutcome`, `pruneExpired` | `src/features/memory/memory-repository.ts` | 6h | Sprint 1 schema |
| 4.2 | **sqlite-vec setup** — Load extension, create virtual table, vector insert/query | `src/lib/sqlite-vec-setup.ts` | 4h | 4.1 |
| 4.3 | **Pattern detector** — Analyze workout history for: optimal RPE ranges, fatigue patterns, exercise preferences, recovery timelines | `src/features/memory/pattern-detector.ts` | 10h | Sprint 1+2 data |
| 4.4 | **Memory service** — `storeMemory`, `storeAdaptation`, `updateOutcome`, `retrieveRelevant`, `buildAIContext` | `src/features/memory/memory-service.ts` | 6h | 4.1, 4.2 |
| 4.5 | **Confidence scoring** — Formula: observations (30%) + success rate (40%) + recency (30%), 60-day half-life | `src/features/memory/confidence.ts` | 3h | 4.4 |
| 4.6 | **Embedding generation** — Edge Function endpoint for embedding requests, queue when offline | Extend `ai-coach` Edge Function + `src/features/memory/embedding-service.ts` | 6h | Sprint 2 Edge Function |
| 4.7 | **Automatic pattern extraction** — Post-workout hook: run pattern detector, store new memories | `src/features/memory/auto-extract.ts` | 4h | 4.3, 4.4 |

**Week 13–14 total: ~39h**

### Week 15–16: Memory Application & UI

| # | Task | Files | Estimate | Dependencies |
|---|------|-------|----------|-------------|
| 4.8 | **Context assembly** — Build AIContext with top-5 relevant memories for prescription requests | Update `memory-service.ts` | 4h | 4.4, 4.6 |
| 4.9 | **AI prescription with memories** — Include memory context in daily prescription prompt, reference patterns | Update `ai-service.ts`, `prompts.ts` | 4h | 4.8, Sprint 2 |
| 4.10 | **User disagreement tracking** — Record when user overrides AI suggestions, detect disagreement patterns | `src/features/memory/disagreement-tracker.ts` | 4h | Sprint 2 |
| 4.11 | **Learning from overrides** — After 3+ consistent overrides, create preference memory | `src/features/memory/override-learner.ts` | 4h | 4.10 |
| 4.12 | **Memory dashboard** — List of learned patterns with confidence bars, type badges, memory count | `src/features/memory/MemoryDashboardScreen.tsx` | 6h | 4.4 |
| 4.13 | **Pattern explanation** — Tap a memory to see evidence (which workouts, what observations) | `src/features/memory/PatternDetailScreen.tsx` | 4h | 4.12 |
| 4.14 | **Memory pruning** — Enforce 500-memory budget, soft-delete lowest confidence, show pruning in dashboard | Update `memory-repository.ts` | 3h | 4.1, 4.5 |
| 4.15 | **Historical context in adaptations** — Show "Last time RPE was this high, you chose X and it worked" in AdaptationAlert | Update `AdaptationAlert.tsx`, `memory-service.ts` | 4h | 4.4, Sprint 2 |
| 4.16 | **PowerSync integration** — Configure sync for memory tables, conflict resolution (LWW) | `src/lib/sync.ts` | 6h | Sprint 2 Supabase |
| 4.17 | **End-to-end testing** — Full workout flow: start → log sets → RPE alert → adaptation → complete → AI analysis → memory storage | Integration tests | 8h | All above |

**Week 15–16 total: ~47h**

**Sprint 4 total: ~86h**

### Sprint 4 Risks

| Risk | Mitigation |
|------|-----------|
| sqlite-vec compatibility with Expo | Test early in week 13; fallback to metadata-only retrieval |
| Pattern detection false positives | High confidence threshold (0.7) before applying memories |
| Memory budget explosion | Hard cap at 500; prune aggressively by confidence |

---

## 6. Definition of Done

Every task is "done" when:

1. **Code** — Implemented, TypeScript strict (no `any`), follows project conventions
2. **Tests** — Unit tests for business logic (calculators, services, repositories); component tests for key UI
3. **Device test** — Runs on physical device (iOS or Android) without crashes
4. **Performance** — Meets budgets defined in `08-PERFORMANCE-PLAN.md`
5. **Accessibility** — VoiceOver labels on interactive elements
6. **Dark mode** — All new screens/components styled for dark theme

### Test Coverage Targets

| Layer | Coverage Target | What to Test |
|-------|----------------|--------------|
| Services (business logic) | 90% | ProgressionCalculator, RPE evaluation, deload detection, confidence scoring |
| Repositories | 80% | CRUD operations, edge cases (empty results, large datasets) |
| Components (critical) | 70% | SetRow, CustomNumpad, RestTimer, ExerciseCard |
| Screens | 50% | Navigation flows, loading/error states |
| Edge Functions | 90% | Auth, rate limiting, schema validation, error handling |

### Code Review Checklist

- [ ] No `any` types
- [ ] No secrets in code
- [ ] Accessibility labels on interactive elements
- [ ] React.memo on list item components
- [ ] SQLite writes in transactions where appropriate
- [ ] Zod validation at system boundaries
- [ ] Error states handled (loading → error → retry)
