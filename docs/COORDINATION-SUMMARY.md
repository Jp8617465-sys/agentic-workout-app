# 6-Day Parallel Refactoring Coordination Summary
**Date:** March 7, 2026
**Status:** Ready to Execute
**Created by:** System Architect
**For:** 3 Developer Streams + Coordinator

---

## Overview

You are managing 6 parallel issues across 3 developer streams for 6 days (March 7-12, 2026). This coordination framework ensures:

- ✅ No blocking between parallel streams
- ✅ Critical path items (Issues #1 → #2) gated properly
- ✅ Isolated items (#3, #6) can run independently
- ✅ Merge order prevents conflicts and regressions
- ✅ Risks mitigated before they cascade

---

## The 6 Issues at a Glance

| Issue | Title | Hours | Stream | Status | Blocker | Blocked By |
|-------|-------|-------|--------|--------|---------|-----------|
| #1 | AbortController timeout fix | 2 | 1 | Ready | #2 | None |
| #2 | SyncEngine with websockets | 20 | 1 | Blocked | #5 | #1 |
| #3 | ActiveWorkoutScreen refactor | 12 | 2 | Ready | #4 | None |
| #4 | Zustand benchmark + consolidation | 5-8 | 2 | Blocked | None | #3 |
| #5 | UUID migration for exercises | 6 | 3 | Blocked | None | #2 |
| #6 | Test suite build-out | 16 | 3 | Ready | None | None |

**Total effort:** 61-64 hours across 6 days = avg 10-11 hours/day across 3 streams

**Critical path:** #1 (2h) → #2 (20h) → #5 (6h) = 28h blocking work

**Parallelizable work:** #3 (12h) + #6 (16h) = 28h can happen simultaneously with critical path

---

## Critical Path

```
┌─────────────────────────────────┐
│ Day 1-2: Issue #1 (2h)          │ ← GATES #2
│ AbortController timeout fix     │
└──────────────┬──────────────────┘
               │
               ↓
┌─────────────────────────────────┐
│ Day 3-5: Issue #2 (20h)         │ ← GATES #5
│ SyncEngine + websockets         │
│ Battery test (Day 5, AR-2)      │
└──────────────┬──────────────────┘
               │
               ↓
┌─────────────────────────────────┐
│ Day 6: Issue #5 (6h)            │ ← Only if #2 stable
│ UUID migration + deploy         │
└─────────────────────────────────┘
```

**Timeline: 28 hours critical work** (can't parallelize further)

---

## Parallelizable Work

```
┌────────────────────────────────────┐
│ Day 1-3: Issue #3 (12h)            │ ← Independent
│ ActiveWorkoutScreen refactoring    │
│ (Feeds benchmark to #4)            │
└─────────────────┬──────────────────┘
                  │
                  ↓
         ┌────────────────────┐
         │ Day 3-4: #4 (5-8h) │ ← Decision PR
         │ State consolidation│
         └────────────────────┘
```

```
┌────────────────────────────────────┐
│ Day 1-6: Issue #6 (16h)            │ ← Independent
│ Test suite build-out (all tiers)   │
│ (Can merge anytime)                │
└────────────────────────────────────┘
```

**Timeline: 28 hours parallelizable work** (no dependencies)

---

## Merge Order (STRICT)

Do NOT deviate from this order:

```
1️⃣  Day 2 EOD: Merge Issue #1
    ↓ (unlock Issue #2)
2️⃣  Day 3 EOD: Merge Issue #3
    ↓ (unlock Issue #4 decision)
3️⃣  Day 4 EOD: Merge Issue #4 (config PR)
    ↓ (conditional, document decision)
4️⃣  Day 5 EOD: Merge Issue #2
    ↓ (unlock Issue #5 + battery tested)
5️⃣  Day 6 EOD: Merge Issue #5
    ↓ (only if #2 stable 24h+)
6️⃣  Day 6 EOD: Merge Issue #6
    ↓ (independent, anytime)
```

**Why this order?**
- Issue #1 must merge before #2 (AbortController needed for stable AI service)
- Issue #3 must merge before #4 (benchmark data needed for state decision)
- Issue #2 must merge before #5 (sync must be stable before schema changes)
- Issues #4 and #6 are independent (can merge anytime)

---

## Decision Gates (4 Critical)

### Gate 1: Issue #1 Merge (Day 2, EOD)
**Question:** Does AbortController timeout fix work without regressions?
- ✅ Unit tests: timeout fires, error caught
- ✅ Integration: AI service still calls Supabase
- ✅ Coverage: 100% of AbortController logic
- ✅ CI: Green (TypeScript, Jest, Lint)

**If fails:** Issue #2 blocked, delay estimate +2-4h

### Gate 2: Issue #3 Merge (Day 3, EOD)
**Question:** Does refactored ActiveWorkoutScreen work identically?
- ✅ Screenshot test: visual identical to main
- ✅ Integration: All 17 callbacks still work
- ✅ Performance: List scroll smooth (no regression)
- ✅ Props: Reduced from 15 → 5

**If fails:** Issue #4 decision delayed 1 day

### Gate 3: Issue #4 Decision (Day 4, EOD)
**Question:** Should we consolidate activeWorkoutStore to Zustand?
- **Option A:** Keep Legend State (safest, full isolation)
  - Decision: 1-2 line config change
  - Action: Merge immediately
- **Option B:** Migrate to Zustand (consolidation)
  - Decision: Requires benchmark P99 < 5ms jank
  - Action: 50-100 lines, 1 review, merge if approved
- **Option C:** Hybrid (Zustand for UI, Legend for workout)
  - Decision: Best of both worlds
  - Action: 20-30 lines, 1 review, merge if approved

**Data-driven:** Benchmark from Issue #3 determines option

**If no decision:** Proceed with Option A (safe default)

### Gate 4: Issue #2 Merge + Battery Test (Day 5, EOD)
**Question:** Does SyncEngine drain battery acceptably?
- ✅ Battery test: < 1% per hour (target)
- ✅ Exponential backoff: Working, capped at 5 min
- ✅ Heartbeat: 60 sec timeout, graceful disconnect
- ✅ Sync queue: Persists to SQLite offline
- ✅ CI: 2+ reviews, all tests passing

**Acceptance tiers:**
- < 1%/hour → Merge, enable real-time by default
- 1-2%/hour → Merge, disable real-time by default (toggle in settings)
- > 2%/hour → Hold, create Issue #7, defer to next sprint

**If fails:** Issue #5 blocked, estimate +1 day for optimization

---

## Risk Mitigation Summary

4 major risks identified in ARCHITECTURE-RISKS.md:

### Risk 1: State Management Jank (AR-1)
- **Problem:** Zustand consolidation might slow numpad (>5ms latency)
- **Mitigation:** Benchmark on iPhone 12 mini + Pixel 6a (Day 2-3)
- **Gate:** Decision made by Day 4, Option A/B/C
- **Owner:** Issue #4 team

### Risk 2: Mobile Battery Drain (AR-2) 🔴 HIGH
- **Problem:** Websocket connections drain battery on mobile
- **Mitigation:** Battery test on real devices (Day 5, 9am-11am)
- **Gate:** <2%/hour required to merge
- **Owner:** Issue #2 team
- **Blocker:** YES (can't ship SyncEngine without passing)

### Risk 3: Schema Migration Failure (AR-3)
- **Problem:** UUID migration could corrupt data if Edge Function fails
- **Mitigation:** Test on staging schema copy (Day 4)
- **Gate:** Manual rollback script verified (Day 5)
- **Owner:** Issue #5 team
- **Blocker:** YES (can't deploy UUID migration)

### Risk 4: Merge Conflict Cascade (AR-4)
- **Problem:** 6 PRs touching overlapping files could block merges
- **Mitigation:** Strict file ownership (each issue owns exclusive files)
- **Gate:** Merge in strict order (Day 2-6)
- **Owner:** All teams
- **Blocker:** MAYBE (conflicts add 2-4h overhead)

---

## File Ownership (Prevents Conflicts)

Each issue has exclusive file ownership:

```
Issue #1 (AbortController):
  - src/lib/aiService.ts ✅ ONLY #1 touches
  - src/hooks/useAI.ts ✅ ONLY #1 touches

Issue #2 (SyncEngine):
  - src/lib/syncEngine.ts (new file)
  - src/hooks/useSync.ts
  - src/stores/syncStatusStore.ts
  - ⚠️ Cannot touch: src/hooks/useActiveWorkout.ts (Issue #3)

Issue #3 (ActiveWorkout):
  - src/screens/ActiveWorkoutScreen.tsx ✅ ONLY #3
  - src/components/SetRow.tsx ✅ ONLY #3
  - src/hooks/useActiveWorkout.ts ✅ ONLY #3
  - src/hooks/useRestTimer.ts ✅ ONLY #3
  - src/hooks/useNumpadInput.ts ✅ ONLY #3

Issue #4 (State):
  - src/stores/activeWorkoutStore.ts (if consolidating)
  - Conditional: May create new store if keeping Legend State

Issue #5 (UUID):
  - src/lib/schema.ts ✅ ONLY #5 (UUID changes)
  - src/types/index.ts (UUID type updates)
  - supabase/migrations/ ✅ ONLY #5

Issue #6 (Tests):
  - src/**/*.test.tsx (all new test files)
  - jest.config.js (test config)
  - No changes to source files
```

**Rule:** If you need to edit a file not in your list, notify coordinator immediately.

---

## Daily Standup Agenda (9am PST)

Each standup follows this 30-minute format:

```
0-5 min: Risk check
  - Any blockers from yesterday?
  - Any risks materialized?

5-20 min: Stream updates (10 min each)
  - Stream 1 (Issue #1, #2): Status, next 24h
  - Stream 2 (Issue #3, #4): Status, next 24h
  - Stream 3 (Issue #5, #6): Status, next 24h

20-25 min: Decision gates
  - Is any gate at risk?
  - Do we need to adjust timeline?

25-30 min: Coordinator sign-off
  - All streams green for today's work?
  - Any escalations needed?
```

---

## Rollback Procedures (Quick Reference)

If something breaks:

| Issue | Rollback Time | Action | Owner |
|-------|---------------|--------|-------|
| #1 | 15 min | Revert PR, diagnose, re-open | Stream 1 |
| #2 | 30 min | Revert PR, PowerSync cleanup | Stream 1 |
| #3 | 20 min | Revert PR, screenshot test proves it | Stream 2 |
| #4 | 10 min | Revert PR, keep Legend State | Stream 2 |
| #5 | 45 min | Run rollback SQL, restore from backup | Stream 3 |
| #6 | 20 min | Revert PR, tests don't block build | Stream 3 |

**Coordinator responsibility:** Call "ROLLBACK" if merge causes regression. Issue owner executes within 15 min.

---

## Success Criteria (Day 6, 5pm PST)

All must be true:

```
✅ Issue #1: AbortController merged, stable
✅ Issue #2: SyncEngine merged, battery <1%/hour tested
✅ Issue #3: ActiveWorkoutScreen merged, UX identical
✅ Issue #4: State management decision made + implemented
✅ Issue #5: UUID migration deployed, no data loss
✅ Issue #6: Test suite merged, >80% coverage

✅ Build green:
   - TypeScript: 0 errors
   - Jest: 0 failures
   - Lint: 0 warnings
   - Build time: <5 minutes
   - APK size: <30MB

✅ No regressions:
   - Offline logging works
   - Sync works online
   - Timers smooth (60fps)
   - All tests passing
```

---

## Key Documents

**You have 2 detailed coordination docs:**

1. **ARCHITECTURE-RISKS.md** (5 risks + 5 decision gates + daily checklist)
   - Detailed risk analysis
   - Mitigation strategies
   - Decision gates with pass/fail criteria
   - Rollback procedures

2. **SYNC-CHECKPOINTS.md** (6-day checkpoint guide)
   - Daily standup agendas
   - Merge order enforcement
   - Team communication protocols
   - Completion definition

**Reference quick during execution:**
- 🔴 When: A dev asks "can I merge?"
- 📋 Check: SYNC-CHECKPOINTS.md merge order
- ⚠️ When: A risk surfaces
- 📋 Check: ARCHITECTURE-RISKS.md mitigation strategy
- 🚨 When: Build fails
- 📋 Check: Rollback procedures in both docs

---

## For the Coordinator

Your job is NOT to code. Your job is to:

1. **Clear blockers** (within 30 min of reporting)
2. **Enforce merge order** (prevent out-of-order PRs)
3. **Monitor decision gates** (ensure gates pass before proceeding)
4. **Escalate risks** (if any materialize, notify leads + document)
5. **Chase status** (async daily updates from all streams)
6. **Call rollback** (if merge breaks something)
7. **Coordinate handoffs** (when one issue unblocks another)

**Tools:**
- Slack: #dev-parallel-refactor (daily updates)
- GitHub: Project board (issue tracking)
- Spreadsheet: Risk register (decision dates + outcomes)
- Calendar: 9am standup (invite all teams)

---

## Estimated Timeline

| Day | Stream 1 | Stream 2 | Stream 3 | Coordinator |
|-----|----------|----------|----------|-------------|
| **Day 1** | Issue #1 (start) | Issue #3 (start) | Issue #6 (start) | Kickoff, file ownership |
| **Day 2** | Issue #1 (finish) | Issue #3 (50%) | Issue #6 (30%) | Gate #1, merge #1 |
| **Day 3** | Issue #2 (start) | Issue #3 (finish) | Issue #6 (60%) | Gate #2, merge #3 |
| **Day 4** | Issue #2 (50%) | Issue #4 (start) | Issue #6 (75%) | Gate #3, #4 decision |
| **Day 5** | Issue #2 (finish) | Issue #4 (finish) | Issue #5/6 (90%) | Gate #4, battery test, merge #2 |
| **Day 6** | Issue #2 (stable) | Issue #4 (merged) | Issue #5/6 (finish) | Final merge, build green |

**Total: 6 days, 3 streams in parallel, 0 blockers (if managed well)**

---

## What Could Go Wrong?

| Scenario | Probability | Impact | Recovery |
|----------|-------------|--------|----------|
| #1 doesn't merge | Low (10%) | +2-4h delay to #2 | Continue #2 debug parallel |
| #3 screenshot test fails | Low (15%) | +1 day delay to #4 | Revert and fix visual bug |
| #4 benchmark data missing | Medium (30%) | Default to Option A (safe) | No delay |
| #2 battery test fails | Medium (40%) | +1 day for optimization | Create Issue #7 |
| #5 migration corrupts data | Low (5%) | +2 days rollback/retry | Manual SQL recovery |
| Merge conflicts | Medium (50%) | +2-4h per conflict | Strict file ownership prevents |

**Prepared for all scenarios in ARCHITECTURE-RISKS.md + SYNC-CHECKPOINTS.md**

---

## Launch Checklist (Before Day 1 9am)

- [ ] All 3 streams have dev environments set up
- [ ] GitHub project board created with 6 issues
- [ ] Slack channel #dev-parallel-refactor created
- [ ] ARCHITECTURE-RISKS.md + SYNC-CHECKPOINTS.md reviewed by all teams
- [ ] Daily standup scheduled (9am-10am PST, all 3 streams + coordinator)
- [ ] Decision gate owners identified (Issue leads)
- [ ] Battery test harness prepared (for Day 5)
- [ ] File ownership acknowledged by all teams
- [ ] Merge order documented and shared
- [ ] Rollback procedures known to all teams

---

## Final Notes

This is a **high-coordination, low-integration** refactoring:

✅ **High coordination:** 3 teams must sync daily, respect merge order, gate decisions
✅ **Low integration:** Files isolated by ownership, minimal cross-team code dependencies
✅ **Parallelizable:** #3 + #6 can run independently for 12 days without blocking critical path

**Success = all 6 issues merged with 0 regressions by Day 6 EOD.**

You have the framework. Execute with discipline. 🚀
