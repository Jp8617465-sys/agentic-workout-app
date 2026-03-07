# Architecture Risk Register — 6-Day Parallel Refactoring
**Version:** 1.0
**Date:** March 7, 2026
**Status:** Active Risk Management
**Coordinator:** System Architect
**Review Cycle:** Daily standup (9am) + EOD (5pm)

---

## Executive Summary

This 6-day parallel refactoring tackles 6 interconnected issues across 3 developer streams. **Critical path:** Issue #1 → #2 → {#3, #4, #5, #6 parallel}. Without effective risk mitigation, 4 architectural risks could derail the timeline:

| Risk ID | Category | Severity | Likelihood | Blocker | Decision Gate |
|---------|----------|----------|------------|---------|---------------|
| AR-1 | State Management Jank | High | Medium | No | Day 2 EOD benchmark |
| AR-2 | Mobile Battery Drain | High | High | Yes | Day 5 battery test |
| AR-3 | Schema Migration Failure | High | Low | Yes | Day 5 staging test |
| AR-4 | Merge Conflict Cascade | Medium | Medium | Maybe | Day 2 code boundaries |

---

## Risk 1: State Management Performance Regression (AR-1)

### Context

**Issue #4** (Zustand benchmark + consolidation) may migrate `activeWorkoutStore` from **Legend State** to **Zustand**. Current architecture maintains a strict separation:
- **Zustand**: Global UI state (mesocycleStore, historyStore, settingsStore) — updates ~1x/sec
- **Legend State**: Active workout session state — updates 10-100x/sec during workout (numpad, rest timer)

Legend State uses optimized signal-based reactivity with zero re-render cost. Zustand uses immutable snapshots, triggering re-renders on subscription. Moving active workout to Zustand risks:

#### Problem Statement

Numpad keypresses (user input → value update → SetRow re-render) must complete in < 16ms (60fps). Legend State achieves this. Zustand's immutability enforcement adds 5-10ms per keystroke due to:

1. **Snapshot cloning** on every `set()` call
2. **Subscription re-evaluation** across all subscribed components
3. **React re-render** even for components not displaying changed data

**Jank threshold for users:** >5ms delay is noticeable on physical device (feels slow). >20ms causes visible dropped frames.

#### Risk Assessment

| Dimension | Rating | Notes |
|-----------|--------|-------|
| **Probability** | Medium (60%) | Zustand migration depends on benchmark data from Issue #3. If #3 shows 30% overhead, temptation to consolidate is high. |
| **Impact** | High | User perceives sluggish numpad during active workout — core UX degradation. Will receive negative ratings. |
| **Detection** | Easy | Real device benchmark on iPhone 12 mini + Pixel 6a class device obvious within 2 minutes. |
| **Mitigation Difficulty** | Medium | Reverting to Legend State is clean (separate store). Problem is if consolidation happens, rollback PR feels like waste. |
| **Blocker** | No | #3 can proceed without #4 decision. If #4 decides to consolidate despite benchmark, #3 merge doesn't require re-work. |

#### Mitigation Strategy

**Decision Gate: Day 2 EOD (March 8, 10am PST)**

1. **Issue #3 frontend team** instruments `SetRow` component with performance telemetry:
   ```typescript
   // SetRow.tsx (sketch)
   const [renderTime, setRenderTime] = useState<number>(0);
   useEffect(() => {
     const start = performance.now();
     return () => {
       const elapsed = performance.now() - start;
       if (elapsed > 5) {
         console.warn(`SetRow render took ${elapsed}ms`);
       }
       setRenderTime(elapsed);
     };
   }, [repsValue, weightValue, rpeValue]);
   ```

2. **Issue #4 team** runs baseline benchmark on Legend State current implementation:
   - 100 rapid keystrokes (simulate user typing weight values)
   - Measure: SetRow re-render time, component mount time, state update latency
   - Device: iPhone 12 mini + Pixel 6a or similar (loan from pool)
   - Acceptance: Numpad → value update must be < 5ms P99

3. **Decision matrix**:
   - **If benchmark P99 < 3ms:** Proceed with Zustand consolidation (acceptable overhead margin)
   - **If benchmark 3-5ms:** Keep Legend State for active workout, use Zustand for rest (hybrid)
   - **If benchmark > 5ms:** Revert Zustand changes, keep Legend State exclusive

4. **Acceptance Criteria**:
   - Benchmark results attached to Issue #4 PR
   - If consolidation approved: error boundary wraps SetRow to prevent jank from other stores
   - If hybrid approved: document why and add comment in code

#### Rollback Plan

- **Current state**: Issue #3 extracted hooks that work with Legend State
- **If #4 consolidates**: SetRow props stay same, internal hook switch from Legend to Zustand is localized
- **Rollback**: Revert #4 PR only, #3 remains merged (hooks still work with Legend State)
- **Cost**: ~2 hours if rollback needed

---

## Risk 2: Mobile Websocket Battery Drain (AR-2)

### Context

**Issue #2** (SyncEngine with websockets) implements bidirectional real-time sync with Supabase via websockets. The architecture requires:

1. Long-lived websocket connection (open for session duration)
2. Heartbeat pings every 30 seconds (keep-alive)
3. Exponential backoff reconnect on disconnect
4. Local SQLite queue persists pending syncs during offline periods

#### Problem Statement

Mobile devices (iOS/Android) are power-constrained. Websocket connections are a known battery drain if not managed correctly:

1. **WiFi wakelocks**: Device CPU stays partially awake to maintain socket connection
2. **Cellular data**: Radio stays in high-power state, preventing low-power idle modes
3. **Backoff failures**: If exponential backoff is too aggressive (< 1 min intervals), app hammers network and drains battery
4. **No heartbeat timeout**: If heartbeat implementation is missing, server drops idle sockets, forcing reconnect loop

**User impact:** App battery drain complaints → app uninstalls → bad ratings.

#### Risk Assessment

| Dimension | Rating | Notes |
|-----------|--------|-------|
| **Probability** | High (80%) | Websocket battery drain is a known mobile problem. We're building sync from scratch; easy to miss power optimization. |
| **Impact** | High | Even 10% battery drain for "always connected" mode is noticeable over 8-hour day. |
| **Detection** | Hard | Requires real device testing over 2+ hour period with battery measurement. Emulator doesn't model radio behavior. |
| **Mitigation Difficulty** | Medium | Solution is well-known: adaptive reconnect backoff + notification-driven sync mode (iOS) or WorkManager (Android). |
| **Blocker** | Yes | Cannot ship SyncEngine to production if battery drain is unacceptable. Decision gate must pass before Issue #5 or #6. |

#### Mitigation Strategy

**Decision Gate: Day 5 EOD (March 11, 5pm PST)**

1. **Issue #2 team** implements battery-aware sync from the start:
   - **Exponential backoff**: Start at 1 sec, cap at 5 min (not unlimited)
   - **Heartbeat timeout**: 60 sec idle timeout → graceful disconnect (don't hammer)
   - **Platform-specific modes**:
     - iOS: Disable background socket. Use `Reachability` + manual sync on network change.
     - Android: Use `WorkManager` for periodic sync (15 min) instead of always-connected.
   - **User preference**: "Real-time sync" toggle (on = websocket, off = periodic pull)

2. **Testing protocol** (Day 5):
   - Setup: iPhone 12 mini + Pixel 6a with battery test harness
   - Baseline: Measure idle battery drain (app running, no sync)
   - Sync mode: Measure battery drain with websocket active for 2 hours
   - Acceptance: <1% additional battery drain per hour of sync activity

3. **Acceptance Criteria**:
   - Benchmark data attached to Issue #2 PR
   - Backoff implementation code-reviewed for edge cases
   - iOS: Notification-based sync verified working
   - Android: WorkManager periodic sync verified
   - Heartbeat timeout configured and tested

4. **Failure mode handling**:
   - If websocket drain > 2%/hour: Disable real-time mode by default
   - If websocket drain 1-2%/hour: Ship with real-time off, enable on settings
   - If websocket drain < 1%/hour: Ship with real-time on by default

#### Rollback Plan

- **Current state**: Issue #1 fixed AbortController timeout
- **If #2 websocket drains battery**: Can't revert #2 entirely (sync is core). Must:
  1. Disable real-time mode in config
  2. Keep fallback to SQLite queue + periodic pull
  3. Create Issue #7 for "Optimize battery usage"
- **Cost**: ~4 hours to pivot to periodic sync

---

## Risk 3: UUID Migration Schema Failure (AR-3)

### Context

**Issue #5** (UUID migration for exercises) changes exercise IDs from auto-increment (INTEGER PRIMARY KEY) to UUIDs (TEXT PRIMARY KEY). This is a **schema migration** affecting:

1. Exercises table
2. Exercise history refs (setLogs.exerciseId)
3. Exercise prescriptions (mesocycleDay.exercises array)
4. Full-text search index (FTS5 virtual table on exercises)

Migration happens via **Edge Function** (Deno) running on Supabase, calling SQLite migrations locally, then syncing via PowerSync.

#### Problem Statement

Schema migrations are one of the hardest database operations because:

1. **No rollback without manual recovery**: If Edge Function fails mid-migration, data is partially corrupted.
2. **Sync conflicts**: If local device has unsynced exercises before migration, merge conflict when sync completes.
3. **Reference integrity**: If setLogs.exerciseId refs are not updated in atomic transaction, orphan rows created.
4. **FTS5 corruption**: Virtual table index may desynchronize if migration doesn't rebuild index.

**Worst case scenario**: Migration fails, app can't find exercises, users see empty exercise library, bad rating + support tickets.

#### Risk Assessment

| Dimension | Rating | Notes |
|-----------|--------|-------|
| **Probability** | Low (30%) | We have a tested migration strategy (Drizzle ORM). But schema changes are inherently risky. |
| **Impact** | High | Exercise library becomes unusable. Users can't log workouts. |
| **Detection** | Medium | Testing on staging schema (copy of prod) will catch most issues. Runtime edge cases (concurrent syncs) are harder. |
| **Mitigation Difficulty** | Low | Migration is straightforward if tested properly. Have manual rollback SQL script ready. |
| **Blocker** | Yes | Cannot deploy #5 until SyncEngine (#2) is stable and tested. Need confidence in sync mechanism before touching schema. |

#### Mitigation Strategy

**Decision Gate: Day 5 EOD (March 11, 5pm PST)**

1. **Issue #5 team** prepares two-stage migration:

   **Stage 1: Test (Day 4)**
   - Copy production schema to staging Supabase
   - Run Drizzle migration on staging
   - Verify:
     - All exercises migrated (count matches before/after)
     - setLogs refs still point to valid exercises
     - FTS5 index rebuilt and search works
     - No orphan rows

   **Stage 2: Rollback procedure (Day 4)**
   ```sql
   -- Manual rollback (run if migration fails)
   BEGIN TRANSACTION;
   CREATE TABLE exercises_backup AS SELECT * FROM exercises;
   -- Revert schema to old shape
   DROP TABLE exercises;
   PRAGMA foreign_keys = OFF;
   CREATE TABLE exercises (
     id INTEGER PRIMARY KEY,
     name TEXT NOT NULL,
     ...
   );
   -- Restore data (map UUIDs back to integers via lookup)
   INSERT INTO exercises SELECT id, name, ... FROM exercises_backup;
   PRAGMA foreign_keys = ON;
   COMMIT;
   ```

2. **Acceptance Criteria**:
   - Staging test passes with zero data loss
   - Manual rollback script tested on staging copy
   - Migration script code-reviewed by backend team
   - SyncEngine (#2) has been running stable for 48+ hours before deploy

3. **Deployment sequence**:
   - Only deploy #5 after #2 has been merged and running stable in dev for 2+ days
   - First deploy to staging database, verify exercises still work
   - Then deploy to production during low-traffic window (e.g., 2am UTC)

#### Rollback Plan

- **Pre-migration**: Create `exercises_backup` table with old schema
- **If migration fails**: Run manual rollback SQL (5 min restore)
- **Post-rollback**: App queries old INT exercise IDs, no code changes needed
- **Cost**: 30 min to restore + 1 day to retry migration

---

## Risk 4: Merge Conflict Cascade (AR-4)

### Context

6 issues being merged in parallel over 6 days. Multiple PRs touch overlapping files:

- Issue #1 (AbortController): `src/lib/aiService.ts`, `src/hooks/useAI.ts`
- Issue #2 (SyncEngine): `src/lib/syncEngine.ts` (new), `src/hooks/useSync.ts`, `src/stores/syncStatusStore.ts`
- Issue #3 (ActiveWorkout): `src/screens/ActiveWorkoutScreen.tsx`, `src/components/SetRow.tsx`, `src/hooks/useActiveWorkout.ts`, `src/hooks/useRestTimer.ts`, `src/hooks/useNumpadInput.ts`
- Issue #4 (State): `src/stores/` directory (may touch activeWorkoutStore)
- Issue #5 (UUID): `src/lib/schema.ts`, `src/types/index.ts`
- Issue #6 (Tests): All `/test.tsx` files

**Conflict-prone files**:
- `src/stores/` — Zustand store definitions (touched by #2, #4)
- `src/types/index.ts` — Shared type definitions (touched by #5, others)
- `src/hooks/` — Custom hooks (touched by #1, #2, #3)

#### Problem Statement

Git merge conflicts are not just tedious—they're dangerous:

1. **Accidental code loss**: Resolving conflicts in mergetool can accidentally delete logic
2. **Integration bugs**: Two PRs fix different parts of same file, merge resolution breaks both
3. **Blocker**: Can't merge PR if it has conflicts with main. Must rebase, re-test, re-review.
4. **Cascade effect**: If #1 conflicts with #2, #2 can't merge until #1 is merged, then #2 must rebase and re-test

**Worst case**: Critical path gets stuck because unrelated PRs have conflicts.

#### Risk Assessment

| Dimension | Rating | Notes |
|-----------|--------|-------|
| **Probability** | Medium (50%) | With 6 PRs touching ~15 files, probability of >1 conflict is high. |
| **Impact** | Medium | Not a blocker per se, but adds 2-4 hours overhead per conflict. |
| **Detection** | Automatic | Git tells us immediately on PR open. |
| **Mitigation Difficulty** | Easy | Preventable with clear file ownership and early PRs. |
| **Blocker** | Maybe | Conflicts themselves aren't blockers, but could delay critical path. |

#### Mitigation Strategy

**Prevention: Day 1-2 (Before PRs open)**

1. **File ownership assignment**:
   - **Issue #1 owns**: `src/lib/aiService.ts`, `src/hooks/useAI.ts` — AbortController changes only
   - **Issue #2 owns**: `src/lib/syncEngine.ts` (new file), `src/hooks/useSync.ts`, `src/stores/syncStatusStore.ts` — No changes to existing hooks
   - **Issue #3 owns**: `src/screens/ActiveWorkoutScreen.tsx`, `src/components/SetRow.tsx`, `src/hooks/useActiveWorkout.ts`, `src/hooks/useRestTimer.ts`, `src/hooks/useNumpadInput.ts` — Complete refactor, isolated files
   - **Issue #4 owns**: `src/stores/activeWorkoutStore.ts` only — Conditional on benchmark, doesn't touch existing Zustand stores unless consolidating
   - **Issue #5 owns**: `src/lib/schema.ts`, `src/types/index.ts` (UUID changes only), `supabase/migrations/` — Backend only
   - **Issue #6 owns**: All new `/test.tsx` files, `jest.config.js` — No changes to source

2. **Merge sequence** (rigid order to prevent conflicts):
   - **Day 2**: Merge #1 (AbortController) first — baseline for #2
   - **Day 3**: Merge #3 (ActiveWorkout) — isolated, safe to merge anytime
   - **Day 4**: Merge #4 decision PR (1-2 lines in config) — won't conflict
   - **Day 5**: Merge #2 (SyncEngine) — after #1 stable
   - **Day 6**: Merge #5 (UUID) and #6 (Tests) in parallel — different files

3. **Conflict avoidance checklist**:
   - [ ] Each issue has exclusive file ownership (no two issues touch same file)
   - [ ] PRs opened in merge order (don't open #2 before #1 merged)
   - [ ] Issue #3, #6 (isolated) can open anytime, merge anytime
   - [ ] Issue #4 waits for #3 benchmark results before finalizing PR
   - [ ] Issue #5 waits for #2 stable before merging

4. **Resolution protocol** (if conflict occurs):
   - **Responsibility**: Owner of file resolves conflict
   - **Process**: Rebase on main, resolve, re-test, update PR, request re-review
   - **Escalation**: If conflict affects critical path, coordinate in standup

#### Rollback Plan

- **Current state**: Git main branch is primary
- **If conflict causes regression**: Revert PR, wait for dependent PRs to update, re-merge
- **Cost**: 1-2 hours per conflict

---

## Risk 5: PowerSync Integration Complexity (AR-5)

### Context

**Issue #2** (SyncEngine) depends on PowerSync SDK for bidirectional offline-first sync. PowerSync is a third-party library with custom Supabase integration. Issues:

1. **Learning curve**: Team may not be familiar with PowerSync API
2. **Edge cases**: Conflict resolution during sync is tricky (concurrent edits)
3. **Supabase RLS**: PowerSync uses JWT auth; if RLS rules are wrong, sync fails silently

#### Risk Assessment

| Dimension | Rating | Notes |
|-----------|--------|-------|
| **Probability** | Medium (40%) | PowerSync is battle-tested, but integration is non-trivial. |
| **Impact** | High | Sync bugs cause data loss or stale state. |
| **Detection** | Hard | Sync issues surface under concurrent load, hard to test in isolation. |
| **Mitigation Difficulty** | Medium | Solution: Integrate early, test with concurrent scenarios. |
| **Blocker** | Yes | SyncEngine won't work without correct PowerSync integration. |

#### Mitigation Strategy

**Day 1-2: PowerSync Integration**

1. **Setup verification**:
   - PowerSync token bucket configured
   - Supabase JWT includes required claims
   - RLS rules allow PowerSync service account access

2. **Concurrent sync test**:
   - Test: Open app on two devices, edit same exercise simultaneously
   - Verify: Last-write-wins or explicit conflict resolution (configured)
   - Acceptance: No data loss, one device sees merged state after sync

---

## Risk Matrix Summary

| Risk | Severity | Likelihood | Blocker | Decision Gate | Owner |
|------|----------|------------|---------|---------------|-------|
| AR-1: Zustand Jank | High | Medium | No | Day 2 EOD | Issue #4 |
| AR-2: Battery Drain | High | High | Yes | Day 5 EOD | Issue #2 |
| AR-3: Schema Failure | High | Low | Yes | Day 5 EOD | Issue #5 |
| AR-4: Merge Conflicts | Medium | Medium | Maybe | Day 1-2 | All teams |
| AR-5: PowerSync | Medium | Medium | Yes | Day 2 EOD | Issue #2 |

---

## Daily Risk Review Checklist

### Day 1-2 (March 7-8)
- [ ] File ownership documented (AR-4)
- [ ] PR order planned (AR-4)
- [ ] Issue #1 begins AbortController fix
- [ ] Issue #3, #6 can start in parallel
- [ ] AR-1 benchmark instrumentation code written

### Day 2-3 (March 8-9)
- [ ] Issue #1 merged, no regressions (blocks #2)
- [ ] Issue #3 ActiveWorkout refactor in progress
- [ ] AR-1 benchmark data collected (Issue #3 + #4)
- [ ] AR-2 battery test setup prepared
- [ ] AR-5 PowerSync integration in Issue #2 underway

### Day 3-4 (March 9-10)
- [ ] Issue #3 merged, hooks extracted
- [ ] Issue #4 decision made: Zustand or Legend State (based on AR-1 data)
- [ ] Issue #2 SyncEngine progressing, websocket + queue implemented
- [ ] AR-3 migration script drafted (Issue #5)

### Day 4-5 (March 10-11)
- [ ] Issue #4 merged (decision PR)
- [ ] Issue #2 reaches code review phase
- [ ] AR-3 staging test passes (Issue #5)
- [ ] AR-2 battery test begins (Issue #2)
- [ ] Issue #6 test coverage >80%

### Day 5-6 (March 11-12)
- [ ] AR-2 battery test passes → Issue #2 approved
- [ ] Issue #2 merged, stable for 2+ hours
- [ ] Issue #5 deploys to staging, then production (if #2 stable)
- [ ] Issue #6 tests merged (all tiers)
- [ ] **FINAL GATE**: All PRs merged, CI passing, app builds

---

## Escalation Path

**If any decision gate fails:**

1. **Notify**: Coordinator (System Architect) + team leads
2. **Assess**: Is blocker fixable in 4 hours? Yes → continue. No → defer issue.
3. **Example**: If AR-2 (battery) fails on Day 5:
   - Option A: Disable real-time sync, keep periodic pull (4h pivot)
   - Option B: Defer Issue #2 to next sprint (keeps Issue #5 blocked)
4. **Document**: Record decision in risk log with rationale

---

## Success Criteria

All 6 issues merged, all decision gates passed:
- ✅ AbortController timeout fixed, AI service working
- ✅ SyncEngine syncing data, battery drain <1%/hour
- ✅ ActiveWorkoutScreen refactored, UX identical
- ✅ State management decision made + implemented
- ✅ UUID migration staged, tested, deployed
- ✅ Test suite >80% coverage, CI passing
- ✅ App builds without errors
- ✅ No merge conflicts in final build

---

## Notes for Coordinator

- **Daily standup**: Review risk checklist, update status
- **Escalation**: If any dev stream stalled >2 hours, investigate blocker
- **Documentation**: Keep this file updated with decision dates and outcomes
- **Retrospective**: Post-mortem on Day 7 to capture lessons (what risks materialized, what didn't)
