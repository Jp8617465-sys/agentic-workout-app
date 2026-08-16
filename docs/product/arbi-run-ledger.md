# arbi run ledger

Every dispatch and every mission. `/arbi-close` fills `episode_score` per
`arbi-scorecard.md`.

**A `—` left in the score column means the session did not count.** The pack names this
explicitly as a failure mode: an unscored row contributes nothing to the track record.
`.claude/hooks/session-close-reminder.sh` warns on session end when a `—` is still here.

| date | task_type | objective | agents dispatched | outcome | PR | episode_score |
|---|---|---|---|---|---|---|
| 2026-08-16 | run | Audit the project and install the arbi/Guilfoyle pack | 2× Explore (feature inventory, automation infrastructure) | partial — CI, guards and probes landed; boundary docs + CLAUDE.md blocked by the authority guard | `claude/project-audit-chief-of-staff-01f466` | — |
