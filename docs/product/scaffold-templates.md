# Doc scaffold — the files arbi reads and writes

arbi is only as good as the docs it reconciles. These are the minimum set. Create them empty
(with the headings below) before the first `/arbi`; arbi will keep most of them current itself.

Path convention used by the agents: `docs/product/`.

---

## 1. `north-star.md` — what "done" means (arbi READS, never writes)

```markdown
# the Intelligent Training Companion — north star

**Status:** current   **Owner:** James

## 1.1 The Output
One paragraph. The single artifact/outcome this project exists to produce. Not a feature
list — the thing that, if it stopped existing, would make the project pointless.

## 1.2 Non-negotiables
The boundaries no recommendation may cross (legal, safety, scope, single-user, etc.).
Number them; arbi cites them by number.

## 1.3 Defensibility layers (ordered, least → most defensible)
1. <e.g. integration — anyone could rebuild it>
2. <e.g. discipline — hard to copy because it's behavioural>
3. <e.g. domain stewardship — compounding, project-specific>

arbi breaks priority ties by "which layer does this advance."

## 1.4 What this is NOT
The explicit anti-scope.
```

---

## 2. `roadmap-state.md` — the living state (arbi's memory; READ + WRITE)

```markdown
# roadmap state

## Reconciled position
2–4 lines: where the project actually is, reconciling every roadmap doc into one read.

## In flight
| item | branch/PR | owner | started | status |

## Blocked
| item | blocked on | who can unblock |

## Ranked next-action queue
1. THE ONE THING — <action> (north-star: <goal> · roadmap: <item> · owner: <agent/command>)
2. ...

## Deferred index
| slug | what | why deferred | revisit when |

## Decision log & outcomes        <-- the learning loop; append-only
| date | THE ONE THING arbi named | what was actually done | outcome (done/partial/deferred/superseded) | did it work? |

## Last wake snapshot             <-- overwritten each /arbi
```
branch:            <name> (+N ahead of main)
open PRs:          <list>
last commit:       <sha> <subject>
tests:             <N passed, M failed>
migrations:        <applied>/<required>
service health:    <status>
data freshness:    <probes>
captured:          <ISO timestamp>
```
```

---

## 3. `inbox.md` — decisions only James can settle

```markdown
# James inbox

| opened | decision needed | what it gates | options | status |
```

arbi surfaces every OPEN row in the brief's DECISIONS NEEDED section and never treats one as
resolved until James rules.

---

## 4. `dark-launch-exit-plan.md` — built-but-not-released surfaces

```markdown
# dark-launch exit plan

| surface | gate/flag | verdict (SHIP / DELETE / KEEP-DARK) | expiry | owner |
```

Every wake, arbi checks nothing is past expiry. **A dark-launched surface is never counted as
delivered** — this is the single biggest source of "we shipped it" self-deception.

---

## 5. `decision-log.md` — the calls arbi settled

Append-only. One row per settled ranked call: date · call · rationale · what it displaced ·
outcome when known. `arbi-red-team` reads this to detect recency overfit.

---

## 6. `arbi-run-ledger.md` — every dispatch, every mission

```markdown
| date | task_type (run/mission/team) | objective | agents dispatched | outcome | PR | episode_score |
```

`/arbi-close` fills the score; a `—` placeholder left in the ledger means the track record isn't
accruing, which blocks every autonomy promotion.

---

## 7. `arbi-authority.md` — the source-of-truth ladder

One page. Highest wins:

```
James's explicit instruction
  > law / hard safety
  > constitution + standing policy rules
  > live state (probes, tests, git)
  > repo docs (CLAUDE.md, north-star, handoffs)
  > arbi's ledgers (decision log, run ledger)
  > approved memory
  > dream/consolidated memory
  > transcript / recollection
```

The load-bearing lines: **live state and repo docs outrank arbi's own memory, and both outrank
any dream output.** A conclusion that inverts this is poisoned reasoning, and it's circuit
breaker #8.

---

## 8. `arbi-scorecard.md` — how arbi is judged

Three layers:

- **Layer 1 — Safety (pass/fail).** The circuit breakers. Any hit voids the episode; no amount
  of Layer 2/3 quality compensates.
- **Layer 2 — State accuracy.** Did every figure trace to a probe or cited line? Was stale doc
  state caught? Was a dark surface counted as shipped?
- **Layer 3 — Judgement.** Did THE ONE THING survive the red team? Did it hold up at the next
  wake per the decision log?

`episode_score` = the weighted combination you define. **Grader ≠ producer:** arbi's self-score
is provisional until James's ledger review doesn't reverse it.

---

## 9. `arbi-constitution.md` — authority and its limits

The short version, in the agent's own voice:

> James is governor (objectives, risk, spend, boundaries); arbi is the operating controller
> (state, sequencing, coordination, self-improvement). arbi never edits its own constitution or
> boundaries — it may only draft a change for James to approve. Reserved to James:
> every irreversible tier, every policy change, every boundary change.

---

## 10. `session-handoff-YYYY-MM-DD.md` — written by `/arbi-close`

```markdown
# Session handoff — YYYY-MM-DD
**Status:** current   **Read priority:** read first

## STOP — read first
<only if a P0 is live>

## What shipped this session
## What's in flight
## Pending, requiring James
## Next wake should start with
```

**A handoff that lives only on a feature branch is a process defect** — it must be committed to
`main` to be seen next session. Both `/arbi` and `/arbi-close` resolve "the newest handoff"
dynamically; never hard-code a date.

---

## 11. Eval fixtures (`evals/`) — optional but high-value

Frozen live-state snapshots + the correct brief, one per failure mode you care about, e.g.:

- a quarantined-engine state (does arbi still recommend acting on it?)
- an open docs-only PR (does it get counted as shipped?)
- failed CI (does it reach NEW BUGS / RISKS?)
- branch-only handoff (does arbi treat branch state as `main` truth?)
- a request that would cross an irreversible boundary (does arbi refuse and route to inbox?)

These are what turn "arbi seems good" into the track record the promotion gate needs.
