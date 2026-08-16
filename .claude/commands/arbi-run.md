# arbi run — attended multi-agent dispatch — `/arbi-run`

`$ARGUMENTS` = the objective (e.g. `clean up the roadmap docs`, `audit module X for policy
leaks`), or empty = arbi's current #1 next action from `roadmap-state.md`.

**This is how you get arbi to call agents today.** The `arbi` subagent cannot spawn subagents —
but the main loop can. So `/arbi-run` has arbi **plan** the work and name the specialists, then
the main loop **fans them out in parallel** and collects the results. It is **attended** (you
invoked it) and **reversible** — the governor-directed bridge to real self-dispatch,
deliberately distinct from *standing unattended* dispatch, which stays gated.

## Step 1 — arbi plans

Dispatch the `arbi` subagent with `$ARGUMENTS` (or "use your current #1 next action from
roadmap-state.md"). It returns the ranked work and, for each item to dispatch, a scoped **NEXT
PROMPT**: *mission · owner (which specialist agent) · success criteria · what must NOT be
touched · required citations*. arbi resolves conflicts via its authority ladder and honours the
circuit breakers — it will **refuse to plan** anything irreversible, surfacing it for
James instead.

## Step 2 — the main loop fans out the specialists

For each NEXT PROMPT arbi produced, dispatch the named specialist agent **IN PARALLEL** (single
message), scoped exactly to that prompt. Owner → roster (adapt to your project's agent set):

| Owner | Agent | Mutates? |
|---|---|---|
| Drizzle schema / migrations / repository write-paths / sync design | `backend-architect` | no (advisory) |
| secrets / RLS / auth / tool blast radius | `security-engineer` | no |
| behaviour-preserving code cleanup | `refactoring-expert` | **code** (runs tests) |
| docs / runbooks / handoffs | `technical-writer` | **docs** |
| module boundaries / structural change | `system-architect` | no |
| React Native screens, navigation, NativeWind, component structure | `frontend-architect` | no |
| 60fps timers, cold start, FlashList, SQLite query latency, bundle size | `performance-engineer` | no |
| scoped build node from a Guilfoyle plan | `reversible-work-builder` | **code** (branch only) |

All eight exist in `.claude/agents/`. The remaining four project agents
(`requirements-analyst`, `tech-stack-researcher`, `learning-guide`,
`deep-research-agent`) are available but are not part of the default mission roster —
name them explicitly if a mission needs one.

**Rule: only REVERSIBLE work is dispatched autonomously** (read · analyse · draft · docs ·
draft-PR). If arbi's plan implies an **irreversible** step — merge, deploy, migration, DB
write, secret handling, anything externally binding — **STOP and surface it for James; do
not dispatch it.** If an agent reports "can't do this without X," record the gap; don't invent
a substitute.

## Step 3 — collect, synthesize, record

Wait for all specialists. Synthesize their outputs into: what was found/done, the concrete
diffs proposed, and the refreshed NEXT PROMPT. For reversible doc/code edits, apply them **only
after the review loop** (`security-engineer` / `refactoring-expert` / `technical-writer` on the
staged diff); for anything larger, present the plan. Append the run to
`docs/product/arbi-run-ledger.md` and, if it settled a ranked call, to
`docs/product/decision-log.md`.

## Boundaries

- **Unattended dispatch is granted** (tiers I0–I4 standing; see
  `docs/product/arbi-permission-model.md`). Merge-on-green belongs to `/arbi-mission`, not
  here — `/arbi-run` is the thin fan-out and stops at the PR.
- **Never dispatch or perform:** deploy · migration · DB write · secret handling · policy
  change · CI-config change · `--admin` merge · EAS/TestFlight/App Store release ·
  anything externally binding. Those stop for James.
- Every specialist output cites evidence; arbi's synthesis carries the citations. No unsourced
  claim presented as current truth (circuit breaker).
