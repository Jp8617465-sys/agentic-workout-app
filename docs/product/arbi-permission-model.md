# arbi permission model — the blast-radius ladder

**Status:** current
**Owner:** James (governor); changing a grant is a boundary change and requires his merge
**Adapted from:** the asxos arbi pack, with grants set by James's explicit decision on
2026-08-16 (standing autonomy on all reversible work, plus auto-merge of the agent's own
PRs once required checks are green).

The organising principle is **reversible vs irreversible**, not "autonomous vs not." arbi
has broad standing autonomy for reversible work. Irreversible tiers are James's, forever,
regardless of track record. The scorecard circuit breakers are the hard floor beneath all
of it.

## One ladder, not two

The pack ships two ladders — infrastructure (I0–I6) and domain (D0–D6) — so that a project
whose software *acts on the world* can never reach that capacity through its build tier.

**The domain ladder is deleted here.** arbi does not prescribe training; the app does. arbi
only builds the app. A second ladder would be decorative, and the pack is explicit that
*"a fake second ladder is worse than none."*

One tier is **added**. The pack's I6 covers merge/deploy/CI but does not name shipping a
build to real devices, which this project will do via EAS. That is strictly more
irreversible than a merge and gets its own tier.

## Infrastructure ladder

| Tier | Capability | Reversible? | Grant | Enforcement |
|---|---|---|---|---|
| I0 | Read repo / docs / probe snapshot | yes | **standing** | read-only tools |
| I1 | Summarise · prioritise · detect drift · draft NEXT PROMPT | yes | **standing** | — |
| I2 | Write docs (roadmap-state, handoffs, ledgers) | yes (git-revertible) | **standing, incl. unattended** | docs-scoped |
| I3 | Open a docs-only draft PR | yes | **standing** | `pr-draft-guard.sh` |
| I4 | Dispatch a mission; specialist produces a code PR | yes (draft) | **standing, unattended** | `unattended-guard.sh` |
| I5 | Migrations · DB writes · infra · secrets | **no** | **STOP — James only, never standing** | `unattended-guard.sh` deny |
| I6a | **Merge own PR to `main`, required checks green** | no, but bounded | **standing** | branch protection |
| I6b | Deploy · CI-config change · force-push `main` · `--admin` merge | **no** | **STOP — James only** | `push-guard.sh` deny |
| I7 | EAS build submit · TestFlight · App Store release | **no** | **STOP — James only, never standing** | `unattended-guard.sh` deny |

**Never promotable:** I5, I6b, I7. No track record unlocks them.

### What the I6a grant depends on

The grant is conditional — *"merge once required checks are green."* Three things have to
hold for that condition to mean anything:

1. **CI must exist.** `.github/workflows/quality-gates.yml` runs tsc, eslint and the
   94-test jest suite. Without it, "merge when green" degrades to "merge."
2. **Branch protection on `main` must require those checks.** This is the only thing that
   makes the condition a *capability* constraint rather than a promise the agent makes to
   itself. It needs repo admin. **Until James enables it, I6a is prompt-enforced only** —
   tracked as an open row in `inbox.md`.
3. **`--admin` must stay denied.** `gh pr merge --admin` bypasses required checks, which
   would convert I6a into an unconditional merge. `push-guard.sh` hard-denies it, and that
   is the single most load-bearing line in the guard set.

### What bounds I6a

`.github/CODEOWNERS` excludes the governance surface from auto-merge: `docs/product/`,
`.claude/`, `.github/`, `CLAUDE.md`, `supabase/migrations/`, `drizzle/`, `eas.json`. A PR
touching any of those blocks on James's review no matter how green CI is.

Without this, auto-merge would let the agent merge a change to its own constitution,
permission ladder, or guard hooks — which is circuit breaker #7, and auto-merge is what
makes it reachable in the first place.

## Scheduled / unattended runs

Unattended is the **normal** mode under these grants, not an exception. A scheduled `/arbi`
wake performs I0–I2 on its own authority: it probes, briefs, and refreshes
`roadmap-state.md`. `/arbi-mission` runs unattended through I4, and merges under I6a.

The pack's read-only-dry-run restriction for scheduled runs is **removed**, because it
existed only to avoid borrowing an interactive human's authorisation for an I2 write — and
I2 is now granted outright.

`unattended-guard.sh` is therefore **always armed**, not gated behind an env var, and
fail-closed default-denies the I5 / I6b / I7 categories.

## Circuit breakers (hard floor, always on)

Independent of tier. Any one **voids the run** and pauses arbi:

1. Unapproved migration · DB write · infra change · deploy.
2. **A merge that bypassed required status checks** (`--admin`, or protection disabled).
   *(Amended from the pack's "unapproved merge" — ordinary merge is now granted, so the
   breaker moved to the bypass rather than the act.)*
3. Secret exposure.
4. Branch-only state treated as `main` truth.
5. An externally-binding action, or a memo that implies an order rather than a proposal
   James decides on.
6. A recommendation derived from a quarantined source.
7. Self-editing the constitution, this permission model, or any other boundary file
   without James's review.
8. Acting above the granted tier.
9. A memory or consolidated-lesson conclusion overriding repo truth or live state.
10. Presenting an unsourced claim as current truth.

Hitting one means **stop and surface it**, never route around it.

## Runtime enforcement honesty

Every grant above is **prompt + doc enforced** except where a mechanical layer backs it.
What actually exists in this repo:

| Layer | File | Status |
|---|---|---|
| Permission `deny` rules | `.claude/settings.json` | built |
| Authority-file write guard | `.claude/hooks/authority-guard.sh` | built |
| Dangerous git/gh shapes | `.claude/hooks/push-guard.sh` | built |
| Draft-PR sequencing | `.claude/hooks/pr-draft-guard.sh` | built |
| Unattended I5/I6b/I7 deny | `.claude/hooks/unattended-guard.sh` | built |
| Review loop before commit | `.claude/hooks/review-gate.sh` | built |
| CI required checks | `.github/workflows/quality-gates.yml` | built |
| Governance review requirement | `.github/CODEOWNERS` | built, **inert without branch protection** |
| Branch protection on `main` | GitHub settings | **NOT SET — James** |

**The hooks are deny-only, never allow-emitting.** The risk is asymmetric: a false negative
in a *deny* rule falls through to the normal permission prompt, while a false negative in an
*allow* rule silently executes a dangerous action with no human check. Every regex in the
guard set is imperfect — variable indirection (`r=main; git push origin HEAD:$r`), command
substitution, and git aliases can defeat them. Only the fail-safe direction is acceptable.

**A subagent's `tools:` list is not a containment boundary.** An `Agent(...)` allowlist
inside a subagent definition is ignored at runtime. That is why `arbi` and `guilfoyle` are
read-only planners and the slash command's main loop performs every side effect — the
charter narrows intent, the hooks narrow capability, and only the second one is enforcement.
