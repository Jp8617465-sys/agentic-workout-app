# arbi mission — Guilfoyle mission-control execution — `/arbi-mission`

`$ARGUMENTS` = a mission envelope (or a path/ref to one), or empty = build one from arbi's
current #1 next action (`roadmap-state.md`) by running `/arbi` first.

**This is the structured, graph-driven successor to `/arbi-run`.** Where `/arbi-run` is a thin
ad-hoc fan-out, `/arbi-mission` adds an execution-discipline layer — **Guilfoyle** — that turns
an approved mission into a task graph with dependency order, no-task-switching discipline, and
one readiness verdict before the draft PR. It is **attended + reversible**: governor/arbi
invoked, draft-PR-ceiling, never standing/unattended.

## Why a command, not the agent

A Claude Code subagent cannot spawn subagents, and a subagent's `Agent(...)` allowlist is
ignored at runtime — so a "Guilfoyle that spawns" would be an *uncontained* spawner, not a safe
one. So Guilfoyle is a **read-only planner** and the **main loop** does every side-effecting
step.

## The mission envelope

The unit `/arbi-mission` executes — a superset of arbi's NEXT PROMPT:

```
mission_id            slug + date (e.g. job-repair-2026-07-13)
source                who authorised it (arbi's ranked #1, or James directly)
objective             one sentence — the definition of success
scope                 files/modules/surfaces that MAY be touched
allowed_actions       reversible tiers permitted (read · analyse · draft docs · draft code PR)
forbidden_boundaries  I5/I6 (migration/DB/infra/secret/merge/deploy/main/CI), policy tiers,
                      standing policy rules, authority files
stop_condition        definition-of-done (tests green + review loop run + draft PR open +
                      readiness READY) + the hard stops (boundary hit / red-team CHALLENGE /
                      state-thin / 2× not-ready)
required_citations    carried from arbi's NEXT PROMPT; the implementer preserves them
```

## Flow

**0 — Envelope in.** From James directly, or wrap arbi's `/arbi` NEXT PROMPT into the
envelope. **Vet it first:** run `arbi-red-team` on the envelope (Guilfoyle can't
reprioritise, so the mission is challenged *before* execution). **The verdict is advisory
by James's decision (2026-08-16):** on CHALLENGE, append the verdict to
`docs/product/decision-log.md`, state it in the run report, and **proceed**. Do not wait
for a ruling. A CHALLENGE that crosses a *standing boundary* is different — that is a hard
stop under Boundaries below, not a challenge to note and move past.

**1 — Guilfoyle plans.** Dispatch the `guilfoyle` subagent with the envelope. It returns the
task graph (nodes + edges), per-node specialist + scoped sub-prompt, the execution order, and
the mission's readiness criteria. It refuses to plan anything crossing `forbidden_boundaries`,
escalating instead.

**2 — Main loop executes the graph.** Fan out independent nodes **in parallel** (single
message); wait for upstream before downstream. Use the `/arbi-run` owner→agent roster verbatim.
**Only reversible work is dispatched** — if a node implies an irreversible tier, STOP and
surface for James; never dispatch it.

**3 — Collect + verify.** Run the project's full check (tests + lint + types). Route every
code/doc edit through the review loop (`security-engineer` / `refactoring-expert` /
`technical-writer`); the review-gate hook enforces it before any commit.

**4 — PR.** Open/update a **draft** PR on the `claude/**` branch, classified docs/code.

**5 — Readiness pass (exactly one).** Guilfoyle scores the collected work against the readiness
criteria — the **mission-completeness** checks on top of the hard safety gates: objective met
within scope · tests green · review loop run · PR open + correctly classified · citations
preserved · no forbidden boundary crossed · follow-ups recorded, not pursued. READY → step 6.
NOT-READY twice → stop, hand James the gap list (don't grind).

**5b — Merge on green (I6a).** Mark the PR ready, wait for the required checks from
`quality-gates.yml`, and merge with an ordinary `gh pr merge` once they pass. **Never
`--admin`** — it bypasses the very checks this grant is conditioned on. A red or pending
check means the mission is not finished; go back to step 3. A PR touching a `CODEOWNERS`
path (`docs/product/`, `.claude/`, `.github/`, `CLAUDE.md`, `supabase/migrations/`,
`drizzle/`, `eas.json`) will block on James's review — leave it open, say so, and continue.

**6 — Stop + record.** Append the mission row to `docs/product/arbi-run-ledger.md`
(`task_type: mission`) and, if it settled a ranked call, to `decision-log.md`. Hand back to
arbi via `/arbi-close`.

## Boundaries

- **Unattended + reversible, plus merge-on-green.** Standing dispatch is granted; see
  `docs/product/arbi-permission-model.md`.
- **Never dispatch or perform:** deploy · migration · DB write · infra mutation · secret
  handling · policy change · CI-config change · `--admin` merge · EAS/TestFlight/App Store
  release · anything externally binding. Those STOP for James.
- **Guilfoyle plans; it never prioritises.** Its only pushback is executability evidence to
  `arbi-red-team` / arbi — never a competing priority call.
- **No permission broadening.** `/arbi-mission` runs on the existing tool permissions +
  interactive prompts + branch protection + the review gate. It adds no `allow` rules and never
  runs unattended.

## Routing to a team mission

**Large parallel missions** — whole-project mining, product reality sweeps, cross-layer
features, competing debug hypotheses, large parallel reviews — route to an agent-teams variant
with a plan-approval gate and max 4 teammates. Everything else — single features, bounded
fixes, 1–2-PR missions — stays here. Never team-ify small or sequential work.
