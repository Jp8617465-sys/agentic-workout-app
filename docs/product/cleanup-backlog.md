# cleanup backlog

Real work, but **not the product**. `arbi-red-team` challenge #3 exists to catch a
cleanup item being promoted to THE ONE THING while the activation gate is still failing.
Nothing here outranks the activation gate.

| item | detail | cost | notes |
|---|---|---|---|
| Prettier format pass | 89 files fail `npm run format:check`. The CI step is `continue-on-error: true` until this lands, then the flag flips to blocking | small but touches ~89 files | Do it in an otherwise-empty commit — a repo-wide reformat mixed with real work makes the diff unreviewable |
| Jest 30 migration | `jest.config.js` (jest-expo) cannot run: Expo 55 / RN 0.83 need Jest 30, the repo pins `jest ^29.7.0`. jest-expo was aligned 52→55 to shrink the migration | medium | Zero component tests exist, so nothing is currently skipped. Becomes blocking the moment the first `*.test.tsx` is written |
| Drizzle journal rebuild | `drizzle/meta/_journal.json` lists 1 migration; `src/lib/migrate.ts` runs 5. Migrations `0002` and `0004` exist only as inline strings with no `.sql` file and no snapshot | medium | **`npm run db:generate` is unsafe until this is fixed** — it would diff against a one-migration baseline and corrupt the chain |
| `agentic_memories` / `user_disagreements` missing from `schema.ts` | Created by migration 0004 but absent from the Drizzle schema, so every query against them is raw SQL and none is type-checked | small | Surfaced by the `schema-drift` probe |
| `authority-guard` write-shape false positives | The heuristic flags read-only commands that merely mention an authority path alongside any write-shaped token. Cost is a spurious permission prompt | small | Deliberately fail-safe: a miss in a deny rule costs a prompt, a miss in an allow rule executes silently. Tighten only in that direction |
| `push-guard` scans whole command strings | A commit message quoting a denied flag is itself denied. Worked around by `git commit -F <file>` | small | Same fail-safe reasoning. Fixing it means parsing the command rather than grepping it |
| `src/lib/supabase.ts` throws at import time | Calls `createClient()` at module scope; supabase-js throws `supabaseUrl is required` on an empty string, so a missing `.env` crashes at import rather than degrading | small | Matters more now that the backend is deliberately unprovisioned. Tests work around it via `test/setup.unit.js` |
| Sync engine worker leak | `npm run test:unit` reports "a worker process failed to exit gracefully" — `startNetworkMonitoring()` sets an interval that is never cleared in tests | small | Cosmetic today; will mask a real leak later |
| 47 ESLint warnings | Mostly `Array<T>` vs `T[]` and unused vars, concentrated in `sync-engine.ts` | small | 14 are `--fix`-able |
| Root markdown sprawl | 3,262 lines across 9 root docs, of which 1,396 describe the sync engine as working when `createSyncJobs()` returns `[]` | medium | Collapse the three SYNC_ENGINE_*.md into one honest doc. `IMPLEMENTATION_SUMMARY.md`, `ISSUES_3_4_COMPLETION.md` and `REFACTORING_SUMMARY.md` are point-in-time snapshots superseded by this directory |
| `README.md` is 2 lines | The real entry doc is `CLAUDE.md` | small | — |
