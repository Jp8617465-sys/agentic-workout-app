# Synchronization Checkpoints — 6-Day Parallel Refactoring
**Version:** 1.0
**Date:** March 7, 2026
**Status:** Active Coordination
**Coordinator:** System Architect
**Merge Window:** 9am-12pm PST each day (daily standup)

---

## Executive Summary

This document defines **daily checkpoints**, **merge order**, **team dependencies**, and **rollback procedures** for 6 parallel issues. The critical path is:

```
Day 1: [Issue #1 starts] [Issues #3, #6 start]
        ↓
Day 2: [Issue #1 GATES #2] [Issue #3 GATES #4 benchmark]
        ↓
Day 3-4: [Issue #2 progresses] [Issue #4 decision] [Issue #5 drafts migration]
        ↓
Day 5: [Issue #2 GATES #5] [Battery test GATES deploy] [Issue #6 finishes]
        ↓
Day 6: [All merged, CI passing, build green]
```

**Key principle:** No issue merges until its blocking dependencies are satisfied.

---

## Team Assignments & Streams

### Stream 1: Network & Sync (Critical Path)
- **Team:** 2 developers
- **Issues**: #1 (AbortController), #2 (SyncEngine)
- **Timeline**: 22h total (2h + 20h)
- **Blocker**: #1 must merge before #2 starts

### Stream 2: Frontend Refactoring (Isolated)
- **Team:** 2 developers
- **Issues**: #3 (ActiveWorkoutScreen), #4 (State Management benchmark)
- **Timeline**: 17-20h total (12h + 5-8h)
- **Blocker**: #3 must complete before #4 decision

### Stream 3: Testing & Backend (Parallel)
- **Team:** 1 developer
- **Issues**: #6 (Test suite), #5 (UUID migration)
- **Timeline**: 22h total (16h + 6h)
- **Blocker**: #5 must not deploy until #2 stable

---

## Dependency Graph

```
                    ISSUE #1 (AbortController)
                    2h, CRITICAL
                            |
                            ↓
                    ISSUE #2 (SyncEngine)
                    20h, CRITICAL
                     /              \
                    /                \
         (blocks #5)              (test blocks #2)
                /                      \
               ↓                        ↓
        ISSUE #5                  ISSUE #6
        (UUID Migration)           (Test Suite)
        6h, DEFERRED              16h, PARALLEL
               |                       |
               |                       |
        (depends on #2)          (all tiers)
               |                       |
               └───────┬──────────────┘
                       ↓
                [Issue #3, #4 independent]
                       |
        ┌──────────────┴──────────────┐
        ↓                             ↓
    ISSUE #3              ISSUE #4 (conditional)
    (ActiveWorkout)       (State benchmark)
    12h, ISOLATED         5-8h, ISOLATED
        |                     |
        |         [#3 completes] → [#4 benchmark]
        |                     |
        └─────────┬───────────┘
                  ↓
           [DAY 3-4: DECISION]
           Zustand consolidate?

MERGE ORDER (strict):
  1. Issue #1 (Day 2 EOD)
  2. Issue #3 (Day 3 EOD)
  3. Issue #4 (Day 4, conditional)
  4. Issue #2 (Day 5 EOD)
  5. Issue #5 (Day 6, if #2 stable)
  6. Issue #6 (Day 6, anytime)
```

---

## Daily Checkpoints

### Day 1: Friday, March 7 (9am - 5pm PST)

#### Morning Standup (9am)

**Kickoff Checklist:**
- [ ] All 3 streams have dev environments set up
- [ ] Issue #1, #3, #6 PRs open (draft status)
- [ ] GitHub project board created with 6 issues assigned
- [ ] Risk register reviewed (ARCHITECTURE-RISKS.md)

**Stream Leads Confirm:**
- [ ] Stream 1: AbortController fix scope locked, unit tests written
- [ ] Stream 2: ActiveWorkoutScreen refactor scope locked, hooks list finalized
- [ ] Stream 3: Test suite structure designed, UUIDs migration drafted

**Exit Criteria (5pm):**
- [ ] Issue #1: First commit pushed, AbortController tests running
- [ ] Issue #3: Component extraction started, no conflicts with main
- [ ] Issue #6: Test harness set up, first test file created
- [ ] No blockers reported → on schedule

---

### Day 2: Saturday, March 8 (9am - 5pm PST)

#### Morning Standup (9am)

**Critical Gate: Issue #1 Ready for Merge**

```
BLOCKLIST for #2:
- [ ] Issue #1 PR has ≥2 reviews approved
- [ ] All AbortController unit tests passing (timeout fires, error caught)
- [ ] No regressions in useAI hook (AI service still calls Supabase)
- [ ] AIService.test.ts has 100% coverage
- [ ] CI green: TypeScript, Jest, Lint
```

**If #1 NOT ready:**
- **Impact**: Issue #2 (SyncEngine) cannot start implementation
- **Contingency**: Stream 1 continues debugging #1, estimated delay = 2-4h
- **Decision**: Proceed with #3/#6 at full speed, #2 starts when #1 merges

**If #1 ready:**
- [ ] Merge Issue #1 to main at 12pm PST sharp
- [ ] Issue #2 team rebase on main, start SyncEngine implementation

#### Parallel Work (while waiting for #1)

**Stream 2 (ActiveWorkout):** Continue extraction
- [ ] useRestTimer hook extracted, tested separately
- [ ] useNumpadInput hook extracted, tested separately
- [ ] SetRow component props reduced from 15 → 5

**Stream 3 (Testing):** Baseline benchmark
- [ ] Test infrastructure set up (Jest config, fixtures)
- [ ] First unit test suite written (WorkoutEngine logic)
- [ ] UUID migration plan drafted

#### Benchmark Collection (Issue #3 + #4)

**By 4pm:** Stream 2 must provide benchmark data to Stream 1:
- [ ] SetRow re-render time with Legend State (baseline)
- [ ] numpad keystroke → value update latency (P99)
- [ ] Component mount time

**Decision made (5pm)?** No, need more data. Decision gate = Day 3 EOD.

**Exit Criteria (5pm):**
- [ ] Issue #1 merged to main (or decision: continue debugging)
- [ ] Issue #3: 50% extraction complete
- [ ] Issue #6: Test harness verified, 2-3 test files written
- [ ] No critical blockers

---

### Day 3: Sunday, March 9 (9am - 5pm PST)

#### Morning Standup (9am)

**Critical Gate: Issue #3 Ready for Merge**

```
BLOCKLIST for #3:
- [ ] All 5 hooks extracted (useActiveWorkout, useRestTimer, useNumpadInput, useUI, useLocalState)
- [ ] SetRow component props: 4 or fewer
- [ ] ActiveWorkoutScreen lines: ≤200 (down from 791)
- [ ] Screenshot test: visual identical to main
- [ ] All 17 callbacks working (integration test)
- [ ] No performance regression on list scroll
- [ ] CI green: TypeScript, Jest, screenshot test
```

**If #3 NOT ready:**
- **Impact**: Issue #4 benchmark delayed by 1 day
- **Contingency**: Stream 2 continues debugging, estimated delay = 4h
- **Decision**: Proceed with #1/#2 at full speed, #4 decision deferred to Day 4 EOD

**If #3 ready:**
- [ ] Merge Issue #3 to main at 12pm PST sharp
- [ ] Issue #4 team can now analyze benchmark data and finalize decision

#### Critical Gate: Issue #4 Decision Made

**Decision matrix (by 5pm):**
- **Option A: Keep Legend State** (low jank, high consolidation cost)
  - Action: Document why, add comment in code
  - PR: 1-2 lines (config only), opens and merges immediately
- **Option B: Migrate to Zustand** (acceptable jank, full consolidation)
  - Action: Implement error boundary, benchmark confirms <5ms
  - PR: 50-100 lines (store consolidation), 1 review, merges Day 4
- **Option C: Hybrid** (conditional consolidation)
  - Action: Keep Legend State for SetRow, Zustand for UI state
  - PR: 20-30 lines (store wrapper), 1 review, merges Day 4

**Benchmark data due (4pm):** Stream 2 provides final numbers to Stream 1:
- SetRow render time Legend State: _____ ms
- Zustand proposal render time: _____ ms
- Decision: _____ (A/B/C)

**Risk AR-1 Status:** Accepted risk, decision documented

**Exit Criteria (5pm):**
- [ ] Issue #3 merged to main
- [ ] Issue #4 decision made (A/B/C documented)
- [ ] Issue #2 SyncEngine: 50% progress (websocket + queue)
- [ ] Issue #6 test coverage: >50% of target

---

### Day 4: Monday, March 10 (9am - 5pm PST)

#### Morning Standup (9am)

**Issue #4 PR Opens (if not already merged)**

```
BLOCKLIST for #4 (conditional):
- [ ] Benchmark data attached to PR comment
- [ ] Decision documented (A/B/C + rationale)
- [ ] If consolidating: error boundary wraps SetRow
- [ ] If hybrid: store adapter pattern explained
- [ ] No new merge conflicts
- [ ] CI green
```

**Merge timing:**
- If Option A (config only): Merge immediately (Day 4 9am)
- If Option B/C (code changes): 1 review + test, merge by Day 4 EOD

#### Critical Work: Issue #2 Progress Check

**SyncEngine milestone (50% complete):**
- [ ] Websocket connection established
- [ ] Offline queue persists to SQLite
- [ ] PowerSync subscription listening to Supabase changes
- [ ] Conflict resolution logic drafted (last-write-wins or explicit?)

**By 5pm:**
- [ ] Issue #2: 75% complete (all major components coded)
- [ ] Issue #5: Migration script finalized (waiting for #2 merge)
- [ ] Issue #6: Test coverage on target (70%+)

**Risk AR-2 status:** Battery test setup in progress, not yet executed

**Exit Criteria (5pm):**
- [ ] Issue #4 merged (or decision to defer for next sprint)
- [ ] Issue #2 in code review phase
- [ ] Issue #5 ready to stage-test migration
- [ ] Issue #6 test harness verified

---

### Day 5: Tuesday, March 11 (9am - 5pm PST)

#### Morning Standup (9am)

**CRITICAL: Issue #2 Ready for Merge**

```
BLOCKLIST for #2:
- [ ] Issue #1 baseline passing (AbortController working)
- [ ] Offline queue persists to SQLite ✓
- [ ] Exponential backoff working (mock test) ✓
- [ ] Websocket subscriptions established ✓
- [ ] PowerSync conflict resolution tested ✓
- [ ] 2+ code reviews approved ✓
- [ ] CI green: TypeScript, Jest, integration tests ✓
```

**Battery test (AR-2) starts NOW (9am-11am):**
- Device: iPhone 12 mini + Pixel 6a
- Scenario: App with SyncEngine active for 2 hours
- Measurement: Battery drain per hour
- **Decision gate: 11am PT (before merge decision)**
  - <1%/hour → Merge Issue #2 immediately
  - 1-2%/hour → Merge, but disable real-time by default
  - >2%/hour → Hold Issue #2, create Issue #7 for optimization

**If battery test PASSES (< 2%/hr):**
- [ ] Issue #2 merged to main at 12pm PST
- [ ] Issue #5 can now stage-test UUID migration
- [ ] Record decision in ARCHITECTURE-RISKS.md

**If battery test FAILS (> 2%/hr):**
- [ ] Issue #2 held for optimization
- [ ] Issue #5 deferred (blocked by stable #2)
- [ ] Create Issue #7: "Optimize SyncEngine battery usage"
- [ ] Timeline impact: -2 days for this sprint

#### Schema Migration Staging Test (Issue #5)

**Starting at 9am (parallel to battery test):**
- [ ] Copy production Supabase schema to staging
- [ ] Run Drizzle migration script
- [ ] Verify: All exercises migrated, no orphan rows, FTS5 works
- [ ] Verify: Manual rollback script tested

**Exit condition (2pm):** Migration script verified safe on staging

#### Test Suite Finalization (Issue #6)

**Target coverage:**
- [ ] WorkoutEngine: >85% coverage
- [ ] Progression calculator: >85% coverage
- [ ] Sync logic: >80% coverage
- [ ] UI components: >70% coverage (integration tests)

**By 5pm:** Issue #6 ready for final code review

**Exit Criteria (5pm):**
- [ ] Issue #2 merged (battery test passed) OR Issue #2 held (battery test failed + Issue #7 created)
- [ ] Issue #5 staging test complete, migration verified safe
- [ ] Issue #6 test suite >80% coverage, ready to merge
- [ ] Risk AR-2 decision documented

---

### Day 6: Wednesday, March 12 (9am - 5pm PST)

#### Morning Standup (9am)

**Final Merge Window**

All remaining issues ready for final merge (if not already done):

```
MERGE CHECKLIST (execute in order):
1. [ ] Issue #5 deploy: UUID migration to production (if #2 stable for 24h+)
       - Run migration script
       - Verify exercises found, search works
       - Monitor Supabase logs for errors
2. [ ] Issue #6 merge: Test suite complete
       - 100% CI passing
       - All test files co-located
       - Coverage reports attached
3. [ ] Final integration test: All 6 issues together
       - Build app
       - Run full test suite
       - No type errors
       - No merge conflicts in final build
```

**Deployment order (10am-12pm):**
1. Issue #5 to production (1h)
2. Issue #6 to main (0.5h)
3. Full build + test suite (0.5h)

#### Final Verification (12pm-5pm)

**Acceptance Criteria:**

✅ **All 6 Issues Merged:**
- Issue #1: AbortController timeout fixed, tests passing
- Issue #2: SyncEngine syncing, battery <1%/hour
- Issue #3: ActiveWorkout refactored, UX identical
- Issue #4: State management consolidated (decision A/B/C)
- Issue #5: UUID migration deployed, no data loss
- Issue #6: Test suite >80% coverage, all tiers

✅ **Build & CI:**
- TypeScript: 0 errors
- Jest: 0 failures
- Lint: 0 warnings (or documented exceptions)
- Build time: <5 minutes
- App size: <30MB

✅ **Functional Tests:**
- Offline workout logging works
- SyncEngine syncs after coming online
- Rest timer smooth (60fps)
- Numpad responsive (<16ms keystroke latency)
- Exercise search works (post-UUID migration)

✅ **No Regressions:**
- All 17 callbacks in ActiveWorkoutScreen working
- AI service calls Supabase (AbortController in place)
- Tests cover critical paths (WorkoutEngine, progression)

**Rollback Plan (if final build fails):**
- Identify failing issue (is it #5 UUID? #2 sync? #6 tests?)
- Revert that issue only, keep others merged
- Re-run build, verify green
- Document what went wrong in retrospective

**Exit Criteria (5pm):**
- [ ] All 6 issues merged
- [ ] CI passing (TypeScript, Jest, Lint, Build)
- [ ] No blockers for shipping to staging/production
- [ ] Coordinator sign-off ✅

---

## Issue Status Template (Daily Update)

Use this template in standup to report progress:

```
ISSUE #X: [Name]
Timeline: [X/Y hours spent]
Status: [On Track / At Risk / Blocked]
Blockers: [None / List]
Next milestone: [Day X EOD: specific deliverable]
Decision gates: [None / List with ETA]
Risk level: [Low / Medium / High]
```

---

## Rollback Procedures

### Issue #1 Rollback (If #2 integration fails)
**Timeline:** 15 min
**Steps:**
1. Revert PR #1 commit
2. `git rebase main`
3. Re-run tests, confirm main is stable
4. Issue #2 team debugs root cause
5. Re-open Issue #1 after fix (or defer to next sprint)

### Issue #2 Rollback (If sync causes data loss)
**Timeline:** 30 min
**Steps:**
1. Revert PR #2 commit
2. SQLite local changes isolated, no Supabase dependency
3. PowerSync cleanup (unsubscribe all listeners)
4. Re-run local tests, confirm app still works offline
5. Issue #5 remains blocked until new Issue #2 attempt
6. Create Issue #7: "Re-architect sync layer" for next sprint

### Issue #3 Rollback (If visual regression detected)
**Timeline:** 20 min
**Steps:**
1. Revert PR #3 commit
2. Screenshot test fails → easy to detect
3. Issue #4 team re-runs benchmark on old code (if needed)
4. Identify which hook extraction caused regression
5. Re-open Issue #3 after fix

### Issue #4 Rollback (If state consolidation causes jank)
**Timeline:** 10 min
**Steps:**
1. Revert PR #4 commit
2. Keep Legend State (original decision)
3. No cascading impacts (isolated to state layer)
4. Re-run benchmark, document why consolidation didn't work
5. Continue with Legend State for rest of project

### Issue #5 Rollback (If migration corrupts data)
**Timeline:** 45 min
**Steps:**
1. Run manual rollback SQL on Supabase
2. Restore from `exercises_backup` table
3. Revert PR #5 (back to INTEGER exercise IDs)
4. PowerSync syncs old data back to devices
5. Issue #5 deferred to next sprint with investigation task

### Issue #6 Rollback (If tests break build)
**Timeline:** 20 min
**Steps:**
1. Revert PR #6 commit
2. Remove problematic test files from CI config
3. Re-run build, confirm clean
4. Issue #6 team fixes test, re-opens PR

---

## Merge Decision Criteria

Each issue must satisfy ALL criteria before merge:

### Code Quality
- ✅ 2+ code reviews approved
- ✅ TypeScript strict mode, 0 errors
- ✅ Jest tests passing, target coverage met
- ✅ Lint passing (prettier, eslint)
- ✅ No merge conflicts with main

### Functional
- ✅ Unit tests for new logic
- ✅ Integration tests if touching multiple layers
- ✅ No regressions in existing features
- ✅ Manual testing on device (iOS + Android)
- ✅ Documentation updated (comments, types, CLAUDE.md)

### Risk
- ✅ All architectural risks mitigated (see ARCHITECTURE-RISKS.md)
- ✅ Decision gates passed (benchmarks, migrations tested, battery tested)
- ✅ Rollback plan documented
- ✅ Blocking dependencies satisfied

---

## Team Communication

### Daily Standup (9am PST)
- 10 min per stream (30 min total)
- Format: Status update, blockers, next 24h plan
- Owner: Coordinator (System Architect)
- Decision point: Any merge decisions or priority shifts

### Async Updates (EOD, 5pm PST)
- Slack message in #dev-parallel-refactor
- Format: [STREAM] [ISSUE] [STATUS] [BLOCKER?]
- Example: `[Stream 1] [#2] SyncEngine at 75%, no blockers. Battery test scheduled Day 5.`

### Code Review
- Request: Assign 2 reviewers from different streams (avoid group think)
- Timeline: 4h response time, merge within 24h of approval
- Rule: Cannot merge during standup (9-10am PST, 5-6pm PST)

### Risk Escalation
- If blocked >2 hours: Notify coordinator immediately
- If decision gate at risk: Call stand-by meeting (30 min)
- If risk materializes: Update ARCHITECTURE-RISKS.md + incident log

---

## Completion Definition

**Refactoring complete when:**
1. All 6 PRs merged to main
2. CI: TypeScript, Jest, Lint all passing
3. Build: <5 minutes, <30MB APK
4. Tests: >80% coverage on critical modules
5. Risk register: All decision gates passed, no open blockers
6. Documentation: ARCHITECTURE-RISKS.md + SYNC-CHECKPOINTS.md updated with final status
7. Coordinator sign-off: All streams report stable

**Retrospective scheduled:** Day 7, 10am PST
- What went well?
- What risks materialized (and why)?
- What would we do differently next time?
- Lessons for future parallel work

---

## Quick Reference: Merge Order

```
┌──────────────────────────────────────────┐
│ STRICT MERGE SEQUENCE (no exceptions)    │
├──────────────────────────────────────────┤
│ 1. Issue #1 (Day 2 EOD) ← GATE for #2   │
│ 2. Issue #3 (Day 3 EOD) ← GATE for #4   │
│ 3. Issue #4 (Day 4 EOD) ← Decision PR   │
│ 4. Issue #2 (Day 5 EOD) ← GATE for #5   │
│ 5. Issue #5 (Day 6 EOD) ← After #2      │
│ 6. Issue #6 (Day 6 EOD) ← Independent   │
└──────────────────────────────────────────┘

If any issue blocked:
→ Report in standup
→ Coordinate contingency
→ Update timeline
→ Document in risk log
```

---

## Final Notes

- **Coordinator responsibility**: Enforce merge order, catch dependencies early, escalate blockers
- **Team responsibility**: Report status honestly, ask for help if stuck, test thoroughly before merge
- **Success metric**: All 6 merged with 0 regressions and all decision gates passed
- **Failure mode**: If any issue can't merge, document in retrospective for process improvement

Good luck! 🚀
