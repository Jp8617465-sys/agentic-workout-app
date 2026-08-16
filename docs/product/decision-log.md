# decision log

Append-only. One row per settled ranked call. `arbi-red-team` reads this to detect
recency overfit (challenge #1), and arbi reads it at the start of every wake to check
whether its last call actually held up before making the next one.

**This file carries more weight here than in the source pack.** James's configuration
makes the red team advisory rather than blocking, so a CHALLENGE no longer stops a
distorted call at the moment it fires. The **"did it work?"** column is the only
correction left in the loop. It fills only when `/arbi-close` runs — a session that ends
without one is a session arbi cannot learn from.

| date | THE ONE THING arbi named | what was actually done | outcome | did it work? |
|---|---|---|---|---|
| 2026-08-16 | *(pre-arbi)* Audit the project, then install a program-manager agent | Repaired the test instrument (62→94 tests), added the first CI this repo has had, installed the arbi/Guilfoyle pack with four adaptations, built 6 guard hooks (49 tests) and 6 probes (10 acceptance tests) | partial | unknown — the boundary docs and CLAUDE.md routing are blocked pending the inbox rows; first `/arbi` wake has not run |
| 2026-08-16 | arbi's first wake (dispatched via `/arbi-run`, not the full `/arbi` brief ritual — no red-team pass ran on this dispatch, consistent with `/arbi-run`'s thinner flow, unlike `/arbi`'s): "Make local identity the app's primary, offline-first path" (Mission 1), plus two more NEXT PROMPTs (seed wiring, mesocycle nav) not yet executed | Mission 1 built, reviewed (security-engineer clean; refactoring-expert found a real blocking gap — the fail-loud `throw` never reached the ErrorBoundary because its caller never awaited it — fixed and re-reviewed clean), committed, pushed, [PR #11](https://github.com/Jp8617465-sys/agentic-workout-app/pull/11) opened as draft. **Landed on the session branch shortly after** — not via a reviewed `gh pr merge`, via a branch-checkout mistake that pushed the mission commit directly onto the shared branch, auto-closing the PR as merged with no required-checks gate ever evaluating it (`risk-register.md` #10). James's call: leave it as landed. Mission 3 stays deferred per arbi's own sequencing call | landed (irregularly) | **it worked** — content held up: CI green on the resulting state, activation gate step 2 confirmed fixed by the `activation` probe on the session branch. The process gate around it did not hold; the fix for the exact failure shape is drafted and awaiting James (`inbox.md`) |
| 2026-08-16 | Mission 2 (queue item 2, from arbi's original wake): "Call `seedDatabase()` after migrations succeed" | Built, reviewed by refactoring-expert alone (proportionate — no auth/trust-boundary surface). Found one real, non-hypothetical issue: the seed call re-fired on every re-render via `useSyncEngine`'s render cascade. Fixed with a module-level `hasSeeded` guard mirroring the existing `hasRun` pattern in `custom-migrations.ts`; re-reviewed clean. Committed, pushed, [PR #12](https://github.com/Jp8617465-sys/agentic-workout-app/pull/12) opened as draft — correctly, this time, with the main loop manually re-verifying branch state before every push | landed on its own branch, PR open, not merged | not yet known — on its own branch, activation reaches 4/4 statically checkable steps; not yet true on the session branch until this PR merges |

## Red-team verdicts

Logged here rather than acted on, per the advisory configuration. A CHALLENGE that was
proceeded past belongs in this table so the next wake can see whether it was right.

| date | call challenged | failure mode | verdict | proceeded? | was the challenge right? |
|---|---|---|---|---|---|
| — | — | — | — | — | — |
