# dark-launch exit plan

Built-but-not-released surfaces. Every wake, arbi checks nothing is past its expiry.

**A dark-launched surface is never counted as delivered.** The pack calls this the single
biggest source of "we shipped it" self-deception, and this project is a live example: the
rest timer, exercise swap and sync status badge are all complete, all marked ✅ in
`ROADMAP.md`, and all imported by nothing.

These are not gated behind a feature flag — they are gated behind *nothing at all*, which
is worse, because there is no flag to find and flip. They are listed here so they stop
being counted as shipped.

| surface | gate/flag | verdict | expiry | owner |
|---|---|---|---|---|
| Rest timer (`RestTimerCompact`, `RestTimerFullScreen`, `useRestTimer`) | none — simply unimported | **UNDECIDED** — wire in or delete | 2026-09-15 | inbox row 5 |
| `ExerciseSwapModal` | none — unimported | **UNDECIDED** | 2026-09-15 | — |
| `SyncStatusBadge` | none — unimported, and the engine behind it is a stub | **KEEP-DARK** until the sync decision lands | 2026-09-15 | inbox row 6 |
| `MesocycleOverviewScreen` (+ `GoalReassessment`, `ProgressCharts` behind it) | registered but no inbound navigation | **SHIP** — needs one entry point | 2026-09-15 | queue item 3 |
| `milestone-review.ts`, `volume-tracker.ts`, `deload-scheduler.ts` | none — unimported | **UNDECIDED** | 2026-09-15 | — |
| `AIService.getDailyPrescription` | dead code — only its own test calls it; `HomeScreen` uses `daily-brief-service` instead | **UNDECIDED** — reconcile the two paths or delete one | 2026-09-15 | — |
