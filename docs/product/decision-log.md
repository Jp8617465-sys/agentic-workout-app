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

## Red-team verdicts

Logged here rather than acted on, per the advisory configuration. A CHALLENGE that was
proceeded past belongs in this table so the next wake can see whether it was right.

| date | call challenged | failure mode | verdict | proceeded? | was the challenge right? |
|---|---|---|---|---|---|
| — | — | — | — | — | — |
