# Intelligent Training Companion — Project Roadmap

> **Last Updated:** 2026-03-07
> **Current Status:** Sprint 4 (Agentic Memory) — Not Started
> **Overall Progress:** ~60–65% complete

---

## Quick Status Legend

```
✅ Complete       — Built, tested, on device
🔧 In Progress    — Work has started
⚠️  Partial       — Exists but incomplete or needs work
❌ Not Started    — Planned, not yet built
📋 Planned        — Future phase, not yet scheduled
```

---

## Project Overview

A React Native (iOS/Android) workout tracker combining Strong's 10-second set logging UX with Claude-powered AI programming, real-time RPE adaptation, injury management, and an agentic memory system that learns individual patterns.

**Target user:** James (32, advanced lifter, concurrent strength + running, chronic ankle instability, frequent travel gaps).

---

## Infrastructure & Services Setup

> These must be configured before certain sprints can run. Check these off as you provision each service.

| # | Service | Purpose | Required By | Status |
|---|---------|---------|-------------|--------|
| 1 | **Supabase project** | Auth, PostgreSQL, Edge Functions, RLS | Sprint 2 | ❌ |
| 2 | **ANTHROPIC_API_KEY** | Claude API — set as Supabase Edge Function secret (NEVER in app bundle) | Sprint 2 | ❌ |
| 3 | **Supabase RLS migrations** | Row-level security on all user-owned tables | Sprint 2 | ❌ |
| 4 | **EAS (Expo Application Services)** | Cloud builds for iOS + Android; required for sqlite-vec custom dev client | Sprint 1 | ❌ |
| 5 | **pgvector extension** (Supabase) | Cloud vector search for agentic memories in Phase 2 | Sprint 4 | ❌ |
| 6 | **PowerSync** (optional) | Real-time offline sync engine for SQLite ↔ Supabase (custom sync engine already built as alternative) | Sprint 4 | ❌ |

### Required Environment Variables

```bash
# Supabase Edge Function secrets (NEVER in app bundle):
ANTHROPIC_API_KEY=sk-ant-...

# App config — safe to include (RLS enforces security):
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_POWERSYNC_URL=https://...   # only if using PowerSync
```

### MCPs Configured
> None currently. No MCP servers are defined in `.claude/settings.template.json`.

---

## Tech Stack Decisions

> Finalized. Do not change without consulting `docs/02-TECH-STACK-DECISIONS.md`.

| Technology | Version | Decision | Notes |
|------------|---------|----------|-------|
| React Native + Expo | SDK 55 | ✅ ADOPTED | New Architecture mandatory on SDK 55 |
| TypeScript strict | ~5.9.2 | ✅ ADOPTED | `no any`, `noUncheckedIndexedAccess` |
| expo-sqlite + Drizzle ORM | `~15.1.2` + `~0.40.0` | ✅ ADOPTED | Type-safe queries, versioned migrations |
| Supabase | `^2.98.0` | ✅ ADOPTED | Auth + cloud sync + Edge Functions |
| Zustand | `^5.0.0` | ✅ ADOPTED | Global app state |
| Legend State | `^2.1.15` | ✅ ADOPTED | Active workout session only (near-zero re-renders) |
| NativeWind | `^4.1.23` + Tailwind `~3.4.17` | ⚠️ ADOPTED (pinned) | Test on every SDK upgrade |
| React Navigation | `^7.x` | ✅ ADOPTED | Expo Router rejected — no `transparentModal` control |
| Reanimated | `~3.17.4` | ✅ ADOPTED | **DO NOT upgrade to v4** — NativeWind v4 incompatibility |
| Claude API | via Edge Function proxy | ✅ ADOPTED | Never called directly from React Native |
| sqlite-vec | Phase 2 | ❌ PLANNED | Fallback: TypeScript dot-product for <500 memories |
| TanStack Query | `^5.0.0` | ✅ ADOPTED | Server state only (not client state) |
| FAISS | — | ❌ REJECTED | No React Native bindings |
| Expo Router | — | ❌ REJECTED | Insufficient gesture/animation control for workout screens |
| Reanimated 2 | — | ❌ REJECTED | EOL |
| WatermelonDB | — | ❌ REJECTED | Incompatible with RN 0.76+ JSI mode |

### Critical Version Pins — Do Not Upgrade Without Testing

```json
"nativewind": "4.1.23",
"tailwindcss": "3.4.17",
"react-native-reanimated": "~3.17.4"
```

---

## Sprint Progress

### Sprint 1: Core Logging (Weeks 1–4) — ✅ COMPLETE

**Goal:** Replicate Strong's 10-second set logging. Log a 5-exercise workout in < 60 seconds.

#### Foundation (Weeks 1–2)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1.1 | Expo project setup — SDK 55, TypeScript strict, NativeWind, Reanimated, RNGH | `app.json`, `tsconfig.json`, `package.json`, `tailwind.config.js` | ✅ |
| 1.2 | SQLite + Drizzle setup — database init, WAL mode, schema | `src/lib/database.ts`, `src/lib/schema.ts` | ✅ |
| 1.3 | Drizzle migrations — initial migration, `useMigrations` hook, `SQLiteProvider` | `drizzle/0000_light_ghost_rider.sql`, `src/lib/migrate.ts` | ✅ |
| 1.4 | Custom migrations — FTS5 virtual table, triggers | `src/lib/custom-migrations.ts` | ✅ |
| 1.5 | Exercise seed data — 100+ exercises, injury risk matrix, seed loader | `src/constants/exercises/seed-data.json`, `src/constants/exercises/injury-risk-matrix.json`, `src/lib/seed.ts` | ✅ |
| 1.6 | Navigation setup — React Navigation v7, RootStack, MainTabs | `src/navigation/RootNavigator.tsx`, `src/navigation/TabNavigator.tsx` | ✅ |
| 1.7 | Design system constants — colors, typography, spacing | `src/constants/colors.ts`, `src/constants/typography.ts`, `src/constants/spacing.ts` | ✅ |
| 1.8 | Zustand stores — userStore, settingsStore, historyStore | `src/stores/userStore.ts`, `src/stores/settingsStore.ts`, `src/stores/historyStore.ts` | ✅ |
| 1.9 | Exercise repository — `search()` (FTS5), `findByName()`, `findByPattern()` | `src/features/exercises/exercise-repository.ts` | ✅ |
| 1.10 | Exercise Library screen — searchable list, category filters | `src/features/exercises/ExerciseLibraryScreen.tsx` | ✅ |

#### Workout Logging (Weeks 3–4)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 1.11 | Legend State setup — `workoutSession$` observable | `src/stores/activeWorkoutStore.ts` | ✅ |
| 1.12 | Workout repository — insert, findRecent, findLastWithExercise, saveCompleteWorkout | `src/features/workouts/workout-repository.ts` | ✅ |
| 1.13 | Custom Numpad — bottom sheet, digit/backspace/decimal, haptic feedback | `src/components/workout/CustomNumpad.tsx` | ✅ |
| 1.14 | SetRow component — weight/reps/RPE display, completion checkbox, swipe gestures | `src/components/workout/SetRow.tsx` | ✅ |
| 1.15 | ExerciseCard component — header + SetRow list + "Add Set" button | `src/components/workout/ExerciseCard.tsx` | ✅ |
| 1.16 | ActiveWorkoutScreen — FlashList of ExerciseCards, numpad, lifecycle | `src/features/workouts/ActiveWorkoutScreen.tsx` | ✅ |
| 1.17 | Auto-fill from history — query last workout, pre-fill weight/reps | `src/features/workouts/auto-fill.ts` | ✅ |
| 1.18 | Rest timer — compact inline + fullscreen modal, background notification | `src/components/workout/RestTimerCompact.tsx`, `src/components/workout/RestTimerFullScreen.tsx` | ✅ |
| 1.19 | Set completion animation — checkbox fill + row background (Reanimated 3) | Within `SetRow.tsx` | ✅ |
| 1.20 | Rest timer arc animation — circular SVG arc, 60fps (Reanimated 3) | Within `RestTimerFullScreen.tsx` | ✅ |
| 1.21 | Home screen — "Start Workout" button, last workout summary | `src/features/home/HomeScreen.tsx` | ✅ |
| 1.22 | History screen — workout list, basic detail view | `src/features/history/HistoryScreen.tsx` | ✅ |
| 1.23 | Workout recovery — detect active workout on launch, resume or discard | `src/features/workouts/workout-recovery.ts` | ✅ |
| 1.24 | Profile screen — user info, settings (units, haptics, rest timer defaults) | `src/features/profile/ProfileScreen.tsx` | ✅ |

**Additions beyond plan:**
- `src/features/workouts/components/` — workout screen decomposed into `ExerciseListContainer`, `ModalsOverlay`, `PRBanner`, `WorkoutHeader`
- `src/features/workouts/hooks/` — logic split into `useExerciseManager`, `useNumpadController`, `useSetLogger`, `useWorkoutLifecycle`
- `src/components/workout/ExerciseHeader.tsx`, `RPEBadge.tsx` — additional atomic components

---

### Sprint 2: Intelligence Layer (Weeks 5–8) — ✅ COMPLETE

**Goal:** Smart progression + real-time adaptation. Load suggestions accurate 80%+ of the time.

#### Progression & Adaptation (Weeks 5–6)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 2.1 | ProgressionCalculator — Epley 1RM, Zourdos RPE adjustment, deload detection | `src/features/workouts/progression-calculator.ts` | ✅ |
| 2.2 | RPE evaluator — `evaluateRPEDeviation()`, threshold detection (>= 1.0), load suggestion | `src/features/workouts/rpe-evaluator.ts` | ✅ |
| 2.3 | RPEModal — post-set RPE input, spring slide-up animation | `src/components/workout/RPEModal.tsx` | ✅ |
| 2.4 | AdaptationAlert — RPE deviation options, historical context | `src/components/workout/AdaptationAlert.tsx` | ✅ |
| 2.5 | WorkoutEngine — orchestrates logSet → RPE check → SQLite write → rest timer → haptic | `src/features/workouts/WorkoutEngine.ts` | ✅ |
| 2.6 | Integrate RPE flow into ActiveWorkoutScreen | `ActiveWorkoutScreen.tsx` updates | ✅ |
| 2.7 | Personal records detection — PR badge, double haptic | `src/features/workouts/personal-records-service.ts`, `src/features/workouts/personal-records-repository.ts` | ✅ |
| 2.8 | Fitness-Fatigue model — Banister model, fitness decay (45d), fatigue decay (15d) | `src/features/workouts/fitness-fatigue-model.ts` | ✅ |
| 2.9 | Deload detection — 3 consecutive high-RPE sessions, fatigue index threshold | (within `fitness-fatigue-model.ts` / `deload-scheduler.ts`) | ✅ |

#### AI Integration & Injury (Weeks 7–8)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 2.10 | Supabase setup — project creation, Auth config, RLS policies | `supabase/` config, migration SQL | ❌ Provisioning needed |
| 2.11 | Edge Function: ai-coach — JWT auth, rate limiting, Zod schemas, Claude API call | `supabase/functions/ai-coach/index.ts` | ✅ Code written |
| 2.12 | Client AIService — `getDailyPrescription`, cache → Claude → deterministic fallback chain | `src/features/ai/AIService.ts` | ✅ |
| 2.13 | AI cache repository — get, set, invalidateForUser with TTL | `src/features/ai/ai-cache-repository.ts` | ✅ |
| 2.14 | DeterministicFallback — apply ProgressionCalculator when offline | `src/features/ai/deterministic-fallback.ts` | ✅ |
| 2.15 | InjuryService — `getActiveRestrictions`, `getSubstitutions`, `isExerciseSafe`, `getLoadModifier` | `src/features/injuries/InjuryService.ts` | ✅ |
| 2.16 | Injury management UI — add/edit/resolve injuries, severity slider | `src/features/injuries/InjuryManagementScreen.tsx` | ✅ |
| 2.17 | Exercise substitution UI — "Swap" button, safe alternatives filtered by injuries | `src/components/workout/ExerciseSwapModal.tsx` | ✅ |
| 2.18 | Post-workout screen — summary stats, AI analysis, PR celebrations, insights | `src/features/workouts/PostWorkoutScreen.tsx` | ✅ |
| 2.19 | Post-workout analysis — Edge Function prompt + schema, background fetch after workout | Extend `ai-coach` Edge Function | ✅ Code written |
| 2.20 | Auth flow — Supabase Auth, login/signup screens, expo-secure-store JWT storage | `src/features/auth/AuthScreen.tsx`, `src/features/auth/useAuth.ts` | ✅ |

**Additions beyond plan:**
- `src/lib/supabase.ts` — Supabase client config
- `src/features/exercises/exercise-performance-sync.ts`, `src/features/workouts/set-log-sync.ts`, `src/features/workouts/workout-sync.ts` — sync layer
- `src/features/ai/AIService.test.ts` — test coverage

---

### Sprint 3: Mesocycle Programming (Weeks 9–12) — ✅ COMPLETE

**Goal:** Auto-generate periodized training blocks following evidence-based periodization models.

#### Mesocycle Generation (Weeks 9–10)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 3.1 | Onboarding flow — goals, experience, equipment, injuries, weekly frequency | `src/features/onboarding/OnboardingScreen.tsx` | ✅ |
| 3.2 | Periodization model selection — beginner→linear, concurrent→block, intermediate→DUP, advanced→conjugate | `src/features/programs/periodization-selector.ts` | ✅ |
| 3.3 | Mesocycle repository — insert, findActive, update, findByUser | `src/features/programs/mesocycle-repository.ts` | ✅ |
| 3.4 | Microcycle repository — insert, findByMesocycle, updateActuals | `src/features/programs/microcycle-repository.ts` | ✅ |
| 3.5 | Edge Function: mesocycle generation — Claude Opus prompt, MesocycleSchema response | Extend `ai-coach` Edge Function | ✅ Code written |
| 3.6 | Mesocycle generation UI — loading states (Opus can take 15s), result preview | `src/features/programs/MesocycleGenerationScreen.tsx` | ✅ |
| 3.7 | Mesocycle store — Zustand: currentMesocycle, currentWeek, currentPhase, todayPrescription | `src/stores/mesocycleStore.ts` | ✅ |
| 3.8 | Home screen: prescription view — today's prescribed workout, "Start" pre-loads prescription | `src/features/home/HomeScreen.tsx` updated | ✅ |

#### Phase Management & Review (Weeks 11–12)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 3.9 | Phase transition logic — detect week boundaries, update phase, adjust volume/intensity targets | `src/features/programs/phase-manager.ts` | ✅ |
| 3.10 | Deload week scheduling — auto-insert deload after accumulation block | `src/features/programs/deload-scheduler.ts` | ✅ |
| 3.11 | Volume tracking — weekly volume per muscle group, vs target, overreach detection | `src/features/programs/volume-tracker.ts` | ✅ |
| 3.12 | Mesocycle overview screen — phase timeline, weekly progress bars | `src/features/programs/MesocycleOverviewScreen.tsx` | ✅ |
| 3.13 | Milestone review — end-of-microcycle AI analysis, goal check | `src/features/programs/milestone-review.ts` | ✅ |
| 3.14 | Goal reassessment flow — adjust goals mid-cycle, trigger mesocycle recalculation | `src/features/programs/GoalReassessmentScreen.tsx` | ✅ |
| 3.15 | Daily prescription integration — home screen shows prescribed exercises with rationale | `HomeScreen.tsx`, `ActiveWorkoutScreen.tsx` updated | ✅ |
| 3.16 | Progress charts — volume over time, 1RM estimates, RPE trends | `src/features/progress/ProgressChartsScreen.tsx` | ✅ |

**Additions beyond plan:**
- `src/features/programs/mesocycle-sync.ts`, `src/features/programs/microcycle-sync.ts` — cloud sync for programs
- `src/features/progress/personal-record-sync.ts`, `src/features/progress/progress-data-service.ts` — progress data layer
- `src/lib/sync-engine.ts`, `src/lib/sync-engine.test.ts`, `src/hooks/useSyncEngine.ts`, `src/components/SyncStatusBadge.tsx` — custom sync engine (alternative to PowerSync)

---

### Sprint 4: Agentic Memory (Weeks 13–16) — ❌ NOT STARTED

**Goal:** System learns and adapts to individual patterns. Detects 5+ personalized patterns per user.

**Blocker:** Requires EAS custom dev client for sqlite-vec extension loading (Expo Go won't work).

#### Pattern Detection & Storage (Weeks 13–14)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 4.1 | Memory repository — insert, searchByVector, reinforceMemory, recordOutcome, pruneExpired | `src/features/memory/memory-repository.ts` | ❌ |
| 4.2 | sqlite-vec setup — load extension, create virtual table, vector insert/query | `src/lib/sqlite-vec-setup.ts` | ❌ |
| 4.3 | Pattern detector — RPE ranges, fatigue patterns, exercise preferences, recovery timelines | `src/features/memory/pattern-detector.ts` | ❌ |
| 4.4 | Memory service — storeMemory, storeAdaptation, updateOutcome, retrieveRelevant, buildAIContext | `src/features/memory/memory-service.ts` | ❌ |
| 4.5 | Confidence scoring — observations (30%) + success rate (40%) + recency (30%), 60-day half-life | `src/features/memory/confidence.ts` | ❌ |
| 4.6 | Embedding generation — Edge Function endpoint, queue when offline | Extend `ai-coach` + `src/features/memory/embedding-service.ts` | ❌ |
| 4.7 | Automatic pattern extraction — post-workout hook, store new memories | `src/features/memory/auto-extract.ts` | ❌ |

#### Memory Application & UI (Weeks 15–16)

| # | Task | File(s) | Status |
|---|------|---------|--------|
| 4.8 | Context assembly — top-5 relevant memories for each prescription request | Update `memory-service.ts` | ❌ |
| 4.9 | AI prescription with memories — include memory context in daily prescription prompt | Update `AIService.ts`, `prompts.ts` | ❌ |
| 4.10 | User disagreement tracking — record user overrides of AI suggestions | `src/features/memory/disagreement-tracker.ts` | ❌ |
| 4.11 | Learning from overrides — after 3+ consistent overrides, create preference memory | `src/features/memory/override-learner.ts` | ❌ |
| 4.12 | Memory Dashboard — list of learned patterns, confidence bars, type badges | `src/features/memory/MemoryDashboardScreen.tsx` | ❌ |
| 4.13 | Pattern detail — tap memory to see evidence (which workouts, observations) | `src/features/memory/PatternDetailScreen.tsx` | ❌ |
| 4.14 | Memory pruning — enforce 500-memory budget, soft-delete lowest confidence | Update `memory-repository.ts` | ❌ |
| 4.15 | Historical context in AdaptationAlert — "Last time RPE was this high, you chose X" | Update `AdaptationAlert.tsx`, `memory-service.ts` | ❌ |
| 4.16 | PowerSync integration (or extend custom sync engine) for memory table sync | `src/lib/sync.ts` | ❌ |
| 4.17 | End-to-end testing — full workout → RPE alert → adaptation → complete → memory storage | Integration tests | ❌ |

**Pattern types to detect:**
- [ ] Optimal RPE ranges per exercise
- [ ] Day-of-week fatigue patterns
- [ ] Exercise preferences (swap patterns)
- [ ] Recovery timelines between sessions
- [ ] Load progression sweet spots
- [ ] Injury risk indicators
- [ ] Deload timing preferences
- [ ] Return protocol success rates

---

### Phase 5: Advanced Features (Weeks 17–20) — 📋 PLANNED

| Feature | Notes |
|---------|-------|
| Apple Watch integration | `expo-health`, HealthKit, HRV data |
| Plate calculator | Weight breakdown by available plates |
| Additional periodization models | DUP, Conjugate (Linear + Block already done in Sprint 3) |
| Video exercise demos | WebP thumbnails, lazy load |
| Barcode scanner for supplement tracking | Out of scope for now |

---

### Phase 6: Polish & Beta (Weeks 21–22) — 📋 PLANNED

| Task | Notes |
|------|-------|
| Accessibility audit | VoiceOver, Dynamic Type, 44px touch targets |
| Dark mode consistency pass | All screens |
| Performance profiling | Flipper, React DevTools profiler |
| Beta TestFlight / Google Play internal test | EAS Submit |
| Crash reporting | Sentry or Expo's built-in crash reporting |

---

### Phase 7: Launch Prep (Weeks 23–24) — 📋 PLANNED

| Task | Notes |
|------|-------|
| App Store screenshots + metadata | |
| Privacy policy (required — injury data = GDPR special category) | Legal |
| Terms of Service | Legal |
| Final security audit | See P0 checklist below |
| Subscription paywall (if applicable) | RevenueCat or Expo IAP |
| App Store submission | EAS Submit |

---

## Security Checklist

### P0 — Must Complete Before Launch

- [ ] Supabase RLS policies applied on ALL user-owned tables (`workouts`, `set_logs`, `injuries`, `mesocycles`, `microcycles`, `agentic_memories`, `user_disagreements`, `ai_usage_log`, `exercise_performances`)
- [ ] JWT storage uses `expo-secure-store` (NOT AsyncStorage) — verify in `src/lib/supabase.ts`
- [ ] `ANTHROPIC_API_KEY` is ONLY in Supabase Edge Function env vars — never in app bundle
- [ ] Zod-validate all Claude API responses in `ai-coach` Edge Function
- [ ] Zod-validate all request bodies in Edge Function
- [ ] Request body size limit (50KB) enforced in Edge Function
- [ ] Monthly token budget (500K tokens/user) enforced in Edge Function
- [ ] Privacy policy + GDPR health data consent in onboarding
- [ ] GDPR data export and deletion endpoints implemented
- [ ] `.gitignore` includes `.env`, secrets, keystores

### P1 — Before Beta

- [ ] CI secret scanning (`secretlint`)
- [ ] Dependency audit in CI (`audit-ci --high`)
- [ ] Exclude SQLite from device backups (`excludeFromBackup: true`)
- [ ] Sanitize user notes before AI prompt inclusion
- [ ] Rate limit mesocycle generation (1 per day per user)
- [ ] Log all Edge Function auth failures

### P2 — Post-Launch / v2

- [ ] SQLite encryption (SQLCipher / OP-SQLite) if Apple HealthKit added
- [ ] Certificate pinning for Supabase connection
- [ ] Biometric auth for app unlock (`expo-local-authentication`)
- [ ] SOC 2 compliance review

---

## Performance Targets

| Metric | Target | Priority |
|--------|--------|----------|
| Set logging (auto-fill → checkbox) | < 10 seconds | P0 |
| App cold start | < 2 seconds | P0 |
| Rest timer | 60fps, ±100ms accuracy | P0 |
| Screen transitions | < 300ms | P1 |
| SQLite history query (30 workouts) | < 50ms | P1 |
| Claude API response (daily workout) | < 3s | P1 |
| Memory usage (active workout) | < 150MB | P1 |
| Bundle size (initial) | < 30MB | P2 |
| Battery drain (1hr workout) | < 5% | P2 |

---

## Key Docs Reference

| Document | Contents |
|----------|---------|
| `docs/PROJECT_BRIEF.md` | 29,000+ word source of truth |
| `docs/01-PRD.md` | Product Requirements, MoSCoW user stories, MVP scope |
| `docs/02-TECH-STACK-DECISIONS.md` | Full decision matrix, rejection rationale, version pins |
| `docs/03-RESEARCH-FINDINGS.md` | Implementation patterns, sports science algorithms, offline-first research |
| `docs/04-SYSTEM-ARCHITECTURE.md` | Layered architecture, data flow diagrams, module boundaries |
| `docs/05-BACKEND-ARCHITECTURE.md` | SQLite schema, repository pattern, Claude API service design |
| `docs/06-FRONTEND-ARCHITECTURE.md` | Component hierarchy, navigation map, design system, gesture system |
| `docs/07-SECURITY-REVIEW.md` | STRIDE threat model, RLS policies, secrets management |
| `docs/08-PERFORMANCE-PLAN.md` | Performance budgets, critical path analysis, anti-patterns |
| `docs/09-SPRINT-PLANS.md` | Detailed per-sprint task lists with estimates |
| `src/features/workouts/TESTING-GUIDE.md` | Workout feature test guide |
| `src/lib/STATE-MANAGEMENT.md` | Zustand vs Legend State boundary documentation |

---

## Changelog

| Date | Update |
|------|--------|
| 2026-03-07 | Initial roadmap created. Sprints 1–3 marked complete based on codebase audit. Sprint 4 not started. Infrastructure (Supabase, EAS, API keys) not yet provisioned. |
