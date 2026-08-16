# roadmap state

> arbi's memory. `/arbi` refreshes the snapshot and the queue each wake; `/arbi-close`
> reconciles what landed and appends to the decision log. Every figure here traces to a
> probe (`npm run probes`) or a cited file — never to recollection.

## Reconciled position

The app is **~16,400 lines of real, type-clean, well-factored code that does not run**.
`tsc` passes, ESLint reports 0 errors, 94/94 tests pass, and `src/` contains **zero**
TODO/FIXME markers. The workout engine, periodization domain logic, injury service, AI
chat + caching layer, custom SVG charts and agentic-memory module are genuine
implementations, not scaffolding.

What is missing is plumbing, not features. The activation gate fails at step 2 of 6:
no user identity is ever established, so every screen's `if (!userId) return` guard
fires and the app renders empty shells after onboarding. `npm run probes` reports
**11 blockers, 6 defects, 16 drift items** as of 2026-08-16.

`ROADMAP.md` is stale and should be treated as a claim, not a source — it is dated
2026-03-07, marks Sprint 4 "Not Started" although commit `97462e0` shipped it, lists
TanStack Query "✅ ADOPTED" although `b7ee9e5` removed it, and marks `seed.ts` ✅
although nothing calls it. The `roadmap-claims` probe exists specifically to keep that
kind of claim measurable.

## In flight

| item | branch/PR | owner | started | status |
|---|---|---|---|---|
| arbi/Guilfoyle install + audit | `claude/project-audit-chief-of-staff-01f466` | main loop | 2026-08-16 | in progress — CI, guards and probes landed; boundary docs blocked (see inbox) |

## Blocked

| item | blocked on | who can unblock |
|---|---|---|
| I6a merge grant becoming a real constraint | branch protection on `main` with required status checks | James (repo admin) |
| The four boundary docs + CLAUDE.md routing | `authority-guard` now denies those paths; they were not written before the guard was registered | James (merge a PR, or temporarily unregister the hook) |
| arbi tie-breaking by defensibility layer | `north-star.md` does not exist — arbi reads it and never authors it | James |
| `npm run db:generate` | drizzle journal lists 1 migration, the app runs 5; regenerating would corrupt the chain | any mission, once scoped |
| Cloud sync of any kind | backend deliberately unprovisioned; 3 local tables have no Postgres equivalent | James (decision already taken: stay local-only) |

## Ranked next-action queue

> Seeded from the 2026-08-16 audit. **arbi re-ranks this at first wake — it is a
> starting position, not a verdict.** THE ONE THING is arbi's call to make, and
> pre-loading an answer would defeat the point of installing a prioritiser.

1. Establish user identity — mint an id in onboarding, persist a `users` row, write the
   Supabase session into the store, and delete the `?? generateId()` mask at
   `src/features/workouts/hooks/useWorkoutLifecycle.ts:68`. (activation gate: step 2;
   owner: `/arbi-mission`)
2. Call `seedDatabase()` after migrations succeed. (activation gate: step 3; ~1 line;
   owner: `/arbi-mission`)
3. Wire an entry point to `MesocycleOverview`, restoring reach to `GoalReassessment` and
   `ProgressCharts`; fix the `Auth` navigation from `ProfileScreen.tsx:133`; replace the
   5 `navigate("X" as never)` casts. (owner: `frontend-architect` → `/arbi-mission`)
4. Decide the rest timer's fate — `RestTimerCompact`, `RestTimerFullScreen` and
   `useRestTimer` are all orphaned though ROADMAP marks the feature ✅. Either wire it in
   or delete it; it cannot stay claimed-and-absent.
5. Resolve the sync engine — implement `createSyncJobs()` using the six orphaned
   adapters, or gate the inert UI off. The `pushEntity` self-recursion at
   `sync-engine.ts:255` is a stack overflow waiting for its first caller either way.

## Deferred index

| slug | what | why deferred | revisit when |
|---|---|---|---|
| supabase-provision | Create a real workout Supabase project, apply RLS to the 5 newer tables | James chose local-only on 2026-08-16 | cloud sync or multi-device is wanted |
| jest30-migration | Expo 55/RN 0.83 need Jest 30; repo pins jest ^29, so `jest.config.js` cannot run | zero component tests exist, so nothing is skipped | the first `*.test.tsx` is written |
| prettier-format-pass | 89 files fail `format:check`; the CI gate is advisory until they are fixed | a repo-wide reformat would bury the real diff | a quiet moment between missions |

## Decision log

Canonical and append-only in **`docs/product/decision-log.md`** — kept there rather than
duplicated here so `arbi-red-team` challenge #1 has a single file to read. `/arbi-close`
appends; nothing rewrites.

## Last wake snapshot

```
branch:            claude/project-audit-chief-of-staff-01f466
open PRs:          none yet
last commit:       dd6bf12 feat: six deterministic probes
tests:             94 passed, 0 failed (6 suites)
typecheck:         clean
lint:              0 errors, 47 warnings
guards:            49 passed, 0 failed
probes:            11 blockers · 6 defects · 16 drift
activation gate:   1/4 statically checkable steps pass; steps 5-6 need a device
migrations:        app runs 5, drizzle journal lists 1  (db:generate is UNSAFE)
service health:    n/a — nothing is deployed, by design
data freshness:    n/a — no server-side data, by design
captured:          2026-08-16
```
