# Parallel Execution Diagram — 6-Day Refactoring
**Version:** 1.0
**Date:** March 7, 2026

---

## Timeline Gantt Chart (6 Days)

```
MARCH 7-12, 2026 (Friday-Wednesday)

Day 1 FRI │ Day 2 SAT │ Day 3 SUN │ Day 4 MON │ Day 5 TUE │ Day 6 WED
──────────┼──────────┼──────────┼──────────┼──────────┼──────────

Issue #1: AbortController (2h, CRITICAL)
████      │          │          │          │          │
GATE #1   │          │          │          │          │
          ↓          │          │          │          │
Issue #2: SyncEngine (20h, CRITICAL)
          │ ██████████████████ │          │          │
          │          GATE #4   │          │          │
          │ Battery Test       │          │          │
          │          (AR-2)    │          │          │
          │                    │GATE #2   │          │
          │                    ↓          │          │
          │                                          │
Issue #3: ActiveWorkout (12h, ISOLATED)
████████████ │          │          │          │          │
          GATE #3      │          │          │          │
          ↓            │          │          │          │
Issue #4: Zustand Benchmark (5-8h, CONDITIONAL)
          │            ██████ │          │          │
          │                   ↓          │          │
          │                              │          │
Issue #5: UUID Migration (6h, DEFERRED)
          │            │          │          │ ██ │
          │            │          │          │    GATE #4
          │            │          │          │    ↓
          │            │          │          │          │ MERGE
          │            │          │          │          │ #5
Issue #6: Test Suite (16h, PARALLEL)
████████████████ │          │          │          │          │
          │            │          │          │          │
          │            │          │          │          │ MERGE #6

CRITICAL  ████ (2h) ──────► ██████████████████ (20h) ──────► ██ (6h)
PATH      #1          GATE   #2                 GATE       #5
          │           #1     │                  #2         │
          └────────────────────────────────────────────────┘
                      28 hours blocking work

PARALLEL  ████████████ (12h) ────► ██████ (8h)
TRACK 1   #3                      #4
          │                       │
          └───────┬───────────────┘
                  ↓
                GATE #3

PARALLEL  ████████████████ (16h)
TRACK 2   #6
          └──────────────────────────→ MERGE #6

TOTAL: 61-64 hours across 6 days = ~10.6 hours/day across 3 streams
CRITICAL PATH: 28 hours (cannot parallelize)
PARALLELIZABLE: 28 hours (#3, #4, #6)
```

---

## Dependency DAG (Directed Acyclic Graph)

```
                         START
                           │
            ┌──────────────┼──────────────┐
            │              │              │
            ▼              ▼              ▼
        ┌────────┐     ┌────────┐   ┌──────────┐
        │Issue #1│     │Issue #3│   │Issue #6  │
        │AbortCtl│     │ActiveWO│   │TestSuite │
        │(2h)    │     │(12h)   │   │(16h)     │
        └────┬───┘     └───┬────┘   └──────────┘
             │             │              │
      GATE #1│             │ Benchmark    │
      PASS?  │             ▼              │
             │         ┌────────┐         │
             │         │Issue #4│         │
             │         │Zustand │         │
             │         │(5-8h)  │         │
             │         └────────┘         │
             │                            │
             ▼                            │
        ┌────────┐                        │
        │Issue #2│                        │
        │SyncEng │                        │
        │(20h)   │                        │
        └───┬────┘                        │
            │                             │
     Battery │ GATE #2                    │
     Test AR-│ PASS?                      │
     2       │                            │
            ▼                             │
        ┌────────┐                        │
        │Issue #5│                        │
        │UUID    │                        │
        │(6h)    │                        │
        └────┬───┘                        │
             │                            │
             └────────────┬───────────────┘
                          │
                          ▼
                      ┌────────┐
                      │  BUILD │
                      │ & TEST │
                      │  PASS  │
                      └────────┘
                          │
                          ▼
                       SUCCESS ✅
```

---

## Stream Assignment

```
┌─────────────────────────────────────────────────────────────────┐
│ STREAM 1: NETWORK & SYNC (2 developers)                         │
│ Critical path: Issues #1, #2                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Day 1-2:  Issue #1 (AbortController fix)          [2h]        │
│            - Unit tests: timeout fires              [1h]        │
│            - Integration: AI service stable         [1h]        │
│            - Code review + merge                    [0.5h]      │
│                                                                  │
│  Day 2 EOD: ✅ GATE #1 PASS → Issue #2 UNBLOCKED               │
│                                                                  │
│  Day 2-5:  Issue #2 (SyncEngine + websockets)      [20h]       │
│            - Websocket connection setup             [4h]        │
│            - Offline queue (SQLite)                 [4h]        │
│            - PowerSync integration                  [4h]        │
│            - Exponential backoff + heartbeat        [3h]        │
│            - Unit + integration tests               [2h]        │
│            - Code review + fixes                    [3h]        │
│                                                                  │
│  Day 5 EOD: ✅ Battery test (AR-2)                              │
│            - <1%/hour required to merge             [2h test]   │
│            - If pass: Merge Issue #2                            │
│            - If fail: Create Issue #7, defer        [pivot]     │
│                                                                  │
│  Day 5-6:  Issue #2 stabilizes                      [2h wait]   │
│            - Monitoring for sync regressions                    │
│            - Ready for Issue #5 deployment                      │
│                                                                  │
│ TOTAL: 22+ hours (2 dev team)                                   │
│ Dependencies: None (can start immediately)                      │
│ Blocks: Issue #2 must merge before Issue #5                     │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STREAM 2: FRONTEND REFACTORING (2 developers)                   │
│ Isolated issues: #3, #4                                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Day 1-3:  Issue #3 (ActiveWorkoutScreen refactor) [12h]       │
│            - Extract useRestTimer hook              [2h]        │
│            - Extract useNumpadInput hook            [2h]        │
│            - Extract useActiveWorkout hook          [2h]        │
│            - Extract useUI hook                     [2h]        │
│            - Reduce SetRow props (15 → 5)           [2h]        │
│            - Screenshot test (visual regression)    [1h]        │
│            - Integration tests (17 callbacks)       [1h]        │
│            - Code review + fixes                    [2h]        │
│                                                                  │
│  Day 3 EOD: ✅ GATE #2 PASS → Issue #4 UNBLOCKED               │
│                                                                  │
│  Day 3-4:  Issue #4 (Zustand consolidation)        [5-8h]      │
│            - Collect benchmark data from #3         [2h]        │
│            - Decision: Option A/B/C?                [0.5h]      │
│            - Implement decision                     [2-4h]      │
│              (Option A: 0.5h, B: 3h, C: 2h)                    │
│            - Tests (if consolidating)               [1h]        │
│            - Code review + merge                    [1h]        │
│                                                                  │
│  Day 4 EOD: ✅ Issue #4 merged (decision PR)                    │
│                                                                  │
│ TOTAL: 17-20 hours (2 dev team)                                 │
│ Dependencies: None (can start immediately)                      │
│ Blocks: None (independent track)                                │
│ Unblocks: None                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ STREAM 3: TESTING & BACKEND (1 developer)                       │
│ Parallel & deferred: #6, #5                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Day 1-6:  Issue #6 (Test suite build-out)         [16h]       │
│            - Jest config + fixtures                 [2h]        │
│            - WorkoutEngine tests                    [5h]        │
│            - Progression calculator tests           [3h]        │
│            - Sync logic tests                       [3h]        │
│            - UI component tests                     [2h]        │
│            - Coverage reports + merge               [1h]        │
│                                                                  │
│  Day 6 EOD: ✅ Issue #6 merged (>80% coverage)                  │
│                                                                  │
│  Day 4-5:  Issue #5 (UUID migration)                [6h]        │
│            - Draft Drizzle migration script         [1.5h]      │
│            - Create rollback SQL script             [1h]        │
│            - Test on staging schema copy            [1.5h]      │
│            - Verify: No orphan rows, refs intact    [1h]        │
│            - Edge Function implementation           [1h]        │
│                                                                  │
│  Day 5 EOD: ✅ GATE #4 PASS (Issue #2 stable)                   │
│             Migration verified safe, ready to deploy             │
│                                                                  │
│  Day 6 EOD: ✅ Issue #5 deployed to staging then prod           │
│             (only if Issue #2 has been stable 24h+)             │
│                                                                  │
│ TOTAL: 22 hours (1 dev team)                                    │
│ Dependencies: Issue #5 blocked by Issue #2 (sync stability)     │
│ Blocks: None (independent except #5 → #2 dependency)           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Integration Points

```
┌──────────────────────────────────────────────────────────────────┐
│ HANDOFF 1: Stream 1 → Stream 1 (Day 2 EOD)                      │
│ Issue #1 merge → Issue #2 unblocked                             │
├──────────────────────────────────────────────────────────────────┤
│ Trigger: GATE #1 PASS (AbortController working)                 │
│ Action: Issue #2 team rebases on main, starts websocket code    │
│ Risk: If GATE #1 fails, Issue #2 delayed +2-4h                  │
│ Mitigation: Issue #1 team starts early, gets 2 reviews by EOD   │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ HANDOFF 2: Stream 2 → Stream 2 (Day 3 EOD)                      │
│ Issue #3 benchmark data → Issue #4 decision                     │
├──────────────────────────────────────────────────────────────────┤
│ Trigger: GATE #2 PASS (ActiveWorkout refactored)                │
│ Data needed:                                                     │
│   - SetRow render time (Legend State): ___ ms                   │
│   - Numpad keystroke latency (P99): ___ ms                      │
│   - Component mount time: ___ ms                                │
│ Action: Issue #4 team receives data, makes A/B/C decision       │
│ Risk: If benchmark data missing, default to Option A (safe)     │
│ Mitigation: Benchmark instrumentation written by Day 2          │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ HANDOFF 3: Stream 1 → Stream 3 (Day 5 EOD)                      │
│ Issue #2 merge (stable) → Issue #5 deploy (safe)                │
├──────────────────────────────────────────────────────────────────┤
│ Trigger: GATE #4 PASS (Battery test <1%/hour)                   │
│ Condition: Issue #2 must be stable for 24h+ before #5 deploys   │
│ Action: Issue #5 team deploys UUID migration to Supabase        │
│ Risk: If #2 unstable, #5 remains blocked (schema changes risky) │
│ Mitigation: Issue #2 team monitors sync for regression          │
│            Issue #5 team has rollback SQL ready                 │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│ HANDOFF 4: All → Coordinator (Day 6 EOD)                        │
│ All 6 issues merged → Final build & release                     │
├──────────────────────────────────────────────────────────────────┤
│ Trigger: All 6 PRs merged, all tests passing                    │
│ Final checklist:                                                 │
│   - ✅ Issue #1: AbortController stable                         │
│   - ✅ Issue #2: SyncEngine battery tested                      │
│   - ✅ Issue #3: ActiveWorkout refactored                       │
│   - ✅ Issue #4: State management decision implemented          │
│   - ✅ Issue #5: UUID migration deployed                        │
│   - ✅ Issue #6: Test suite >80% coverage                       │
│   - ✅ Build: TypeScript 0 errors, Jest 0 failures              │
│ Action: Release to staging/production                            │
│ Risk: If any issue breaks, revert that issue only               │
│ Mitigation: Rollback procedure documented for each issue        │
└──────────────────────────────────────────────────────────────────┘
```

---

## Critical Path Analysis

```
CRITICAL PATH (longest dependency chain):
┌─────────────────────────────────────────────────────────────┐
│ Issue #1 (2h)  →  Issue #2 (20h)  →  Issue #5 (6h)         │
│ AbortCtl      →   SyncEngine      →   UUID Migration       │
│ Day 1-2       →   Day 2-5        →   Day 6                 │
│ Total: 28 hours blocking work (cannot parallelize)         │
└─────────────────────────────────────────────────────────────┘

PARALLELIZABLE (can run simultaneously with critical path):
┌─────────────────────────────────────────────────────────────┐
│ Issue #3 (12h) + Issue #4 (5-8h) + Issue #6 (16h)          │
│ ActiveWorkout + Zustand + TestSuite                        │
│ Day 1-6                                                    │
│ Total: 28 hours independent work                           │
└─────────────────────────────────────────────────────────────┘

TOTAL EFFORT: 28 (critical) + 28 (parallel) = 56 hours
3 STREAMS: 56 / 3 ≈ 18.7 hours per stream average
6 DAYS: 18.7 / 6 ≈ 3.1 hours per day per stream

ACTUAL ALLOCATION:
  Stream 1: 22 hours critical (Issue #1, #2)
  Stream 2: 17-20 hours (Issue #3, #4)
  Stream 3: 22 hours (Issue #5, #6)
  Total: 61-64 hours across 3 streams over 6 days

KEY INSIGHT: Critical path (Issue #1→#2→#5) is 28h.
             Parallelizable work (Issue #3,#4,#6) is 28h.
             Perfect balance: one team works critical path,
             two teams work parallel tracks.
```

---

## Merge Sequence (Strict Order)

```
┌─────────────────────────────────────────────────────────────────┐
│ MERGE SEQUENCE (cannot deviate)                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ 1️⃣  DAY 2 EOD (March 8, 12pm PST)                              │
│     ┌──────────────────────────────────┐                       │
│     │ Issue #1: AbortController        │                       │
│     │ Status: BLOCKED_ON(tests)        │                       │
│     │ Size: <50 lines                  │                       │
│     │ Reviews: 2/2 approved            │                       │
│     │ Test coverage: 100%              │                       │
│     │ CI: Green (TS, Jest, Lint)       │                       │
│     └──────────────────────────────────┘                       │
│                                                                  │
│ 2️⃣  DAY 3 EOD (March 9, 12pm PST)                              │
│     ┌──────────────────────────────────┐                       │
│     │ Issue #3: ActiveWorkoutScreen    │                       │
│     │ Status: BLOCKED_ON(refactor)     │                       │
│     │ Size: 791 → 200 lines            │                       │
│     │ Reviews: 2/2 approved            │                       │
│     │ Screenshot test: PASS            │                       │
│     │ CI: Green (TS, Jest, Screenshot) │                       │
│     └──────────────────────────────────┘                       │
│                                                                  │
│ 3️⃣  DAY 4 EOD (March 10, 12pm PST)                             │
│     ┌──────────────────────────────────┐                       │
│     │ Issue #4: Zustand Decision PR    │                       │
│     │ Status: BLOCKED_ON(decision)     │                       │
│     │ Size: 1-100 lines (A/B/C)        │                       │
│     │ Reviews: 1+ approved             │                       │
│     │ Decision: A/B/C documented       │                       │
│     │ CI: Green (TS, Jest)             │                       │
│     └──────────────────────────────────┘                       │
│                                                                  │
│ 4️⃣  DAY 5 EOD (March 11, 5pm PST)                              │
│     ┌──────────────────────────────────┐                       │
│     │ Issue #2: SyncEngine             │                       │
│     │ Status: BLOCKED_ON(battery test) │                       │
│     │ Size: 200-300 lines (core)       │                       │
│     │ Reviews: 2/2 approved            │                       │
│     │ Battery test: <1%/hr PASS        │                       │
│     │ CI: Green (TS, Jest, Integration)│                       │
│     └──────────────────────────────────┘                       │
│                                                                  │
│ 5️⃣  DAY 6 EOD (March 12, 5pm PST)                              │
│     ┌──────────────────────────────────┐                       │
│     │ Issue #5: UUID Migration         │                       │
│     │ Status: BLOCKED_ON(#2 stable)    │                       │
│     │ Size: Schema only (migrations)   │                       │
│     │ Reviews: 1+ approved             │                       │
│     │ Staging test: PASS               │                       │
│     │ Rollback script: Ready           │                       │
│     │ Deployment: To prod              │                       │
│     └──────────────────────────────────┘                       │
│                                                                  │
│ 6️⃣  DAY 6 EOD (March 12, 5pm PST)                              │
│     ┌──────────────────────────────────┐                       │
│     │ Issue #6: Test Suite             │                       │
│     │ Status: INDEPENDENT              │                       │
│     │ Size: 16 files, ~1000 lines      │                       │
│     │ Reviews: 1+ approved             │                       │
│     │ Coverage: >80%                   │                       │
│     │ CI: Green (TS, Jest)             │                       │
│     └──────────────────────────────────┘                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

MERGE GATES:
  #1 → blocks #2
  #2 → blocks #5
  #3 → blocks #4 (benchmark data)
  All → final build + release

ANTI-PATTERN: Do NOT merge out of order.
              Do NOT skip gates.
              Do NOT merge during 9-10am standup.
```

---

## File Ownership Map

```
ISSUE #1 (AbortController)
├─ src/lib/aiService.ts ✅ ONLY #1
├─ src/hooks/useAI.ts ✅ ONLY #1
└─ src/lib/aiService.test.ts ✅ ONLY #1

ISSUE #2 (SyncEngine)
├─ src/lib/syncEngine.ts (NEW) ✅ ONLY #2
├─ src/hooks/useSync.ts ✅ ONLY #2
├─ src/stores/syncStatusStore.ts ✅ ONLY #2
└─ tests/syncEngine.test.ts ✅ ONLY #2

ISSUE #3 (ActiveWorkout)
├─ src/screens/ActiveWorkoutScreen.tsx ✅ ONLY #3
├─ src/components/SetRow.tsx ✅ ONLY #3
├─ src/hooks/useActiveWorkout.ts ✅ ONLY #3
├─ src/hooks/useRestTimer.ts ✅ ONLY #3
├─ src/hooks/useNumpadInput.ts ✅ ONLY #3
└─ tests/ActiveWorkoutScreen.test.tsx ✅ ONLY #3

ISSUE #4 (Zustand)
├─ src/stores/activeWorkoutStore.ts (CONDITIONAL)
│  └─ If consolidating from Legend State
├─ src/stores/ (MAY ADD new store if hybrid)
└─ Config only (1-2 lines)

ISSUE #5 (UUID)
├─ src/lib/schema.ts ✅ ONLY #5 (UUID migration)
├─ src/types/index.ts (UUID type updates) ✅ ONLY #5
├─ supabase/migrations/YYYY_uuid_migration.sql ✅ ONLY #5
└─ Edge Function deno code

ISSUE #6 (Tests)
├─ src/**/*.test.tsx (ALL new test files)
├─ jest.config.js ✅ ONLY #6
├─ tests/fixtures/ ✅ ONLY #6
└─ .github/workflows/test.yml ✅ ONLY #6

CONFLICT RISK:
❌ src/hooks/ — Multiple issues touch (mitigate with ownership)
❌ src/stores/ — #2, #4 may touch (clear separation: syncStatus vs activeWorkout)
❌ src/types/index.ts — #5 updates UUID types only
✅ Everything else isolated
```

---

## Decision Gate Flowchart

```
START (Day 1)
  │
  ├─→ Issue #1 Development
  │   │
  │   └─→ GATE #1: AbortController working?
  │       │
  │       ├─→ YES: Merge Issue #1 (Day 2)
  │       │   └─→ Unblock Issue #2
  │       │
  │       └─→ NO: Delay +2-4h, continue debugging
  │           └─→ Issue #2 blocked
  │
  ├─→ Issue #3 Development (parallel)
  │   │
  │   └─→ GATE #2: ActiveWorkout refactored correctly?
  │       │
  │       ├─→ YES: Merge Issue #3 (Day 3)
  │       │   └─→ Unblock Issue #4
  │       │       └─→ Provide benchmark data
  │       │
  │       └─→ NO: Delay +1 day, fix visual bugs
  │           └─→ Issue #4 benchmark delayed
  │
  ├─→ Issue #6 Development (parallel)
  │   │
  │   └─→ Tests written, >80% coverage?
  │       │
  │       ├─→ YES: Ready to merge anytime
  │       │
  │       └─→ NO: Continue writing tests
  │
  └─→ GATE #3: Benchmark data ready for Issue #4?
      │
      ├─→ YES: Issue #4 makes A/B/C decision (Day 4)
      │   │
      │   ├─→ Option A (keep Legend): Merge config PR
      │   ├─→ Option B (migrate): Implement + merge
      │   └─→ Option C (hybrid): Implement + merge
      │
      └─→ NO: Default to Option A (safe)
          │
          └─→ GATE #4: Issue #2 stable + battery tested?
              │
              ├─→ YES (<1%/hr): Merge Issue #2 (Day 5)
              │   └─→ Unblock Issue #5
              │       └─→ Stabilize 24h+ before deploying
              │
              └─→ NO (>1%/hr): Create Issue #7
                  └─→ Defer Issue #5 to next sprint

END (Day 6)
  │
  └─→ All 6 issues merged?
      ├─→ YES: Build green ✅
      └─→ NO: Investigate failures, rollback if needed
```

---

## Risk Heat Map (by day)

```
DAY 1: 🟢 GREEN (mostly setup, low risk)
  - File ownership assigned
  - Dev environments ready
  - All PRs opened (draft status)
  Risk: None imminent

DAY 2: 🟡 YELLOW (Issue #1 merge, #4 begins benchmark)
  - GATE #1: AbortController ready?
  - Benchmark data collection starts
  Risk: If #1 fails, #2 blocked +2-4h

DAY 3: 🟡 YELLOW (Issue #3 merge, Issue #4 decision)
  - GATE #2: ActiveWorkout refactored?
  - Benchmark data provided to #4
  - GATE #3: Decision made (A/B/C)
  Risk: If #3 fails, #4 delayed. If decision unclear, default to A.

DAY 4: 🟡 YELLOW (Issue #4 merge, Issue #2 code review)
  - Issue #4 PR opens and merges
  - Issue #2 reaches code review phase
  - PowerSync integration tested
  Risk: AR-5 (PowerSync integration), conflicts in code review

DAY 5: 🔴 RED (Issue #2 battery test + merge, Issue #5 deploy)
  - GATE #4: Battery test passed (<1%/hr)?
  - Issue #2 merge decision critical
  - Issue #5 UUID migration to production
  Risk: AR-2 (battery), AR-3 (schema), if #2 fails, #5 blocked

DAY 6: 🟢 GREEN (final build, release)
  - All 6 issues merged
  - Full test suite passes
  - CI passing, build clean
  Risk: Low (all hard decisions made)
```

---

## Success Indicators (Daily)

```
DAY 1: ✅ All streams started, no blockers
DAY 2: ✅ Issue #1 merged, benchmarking began
DAY 3: ✅ Issue #3 merged, #4 decision made
DAY 4: ✅ Issue #4 merged, #2 in review
DAY 5: ✅ Battery test passed, Issue #2 merged
DAY 6: ✅ All 6 merged, build green, release ready
```

---

## File Reference

- Detailed risks: `/home/user/agentic-workout-app/docs/ARCHITECTURE-RISKS.md`
- Daily checkpoints: `/home/user/agentic-workout-app/docs/SYNC-CHECKPOINTS.md`
- Coordination summary: `/home/user/agentic-workout-app/docs/COORDINATION-SUMMARY.md`
- This file: `/home/user/agentic-workout-app/docs/PARALLEL-EXECUTION-DIAGRAM.md`
