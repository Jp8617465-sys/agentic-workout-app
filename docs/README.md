# agentic-workout-app docs map

**Status:** current
**Scope:** navigation index / source-of-truth map
**Last verified:** 2026-07-11

Where truth lives. If a document contradicts this map, trust the authoritative source named here and fix the stale document.

## Read first, in order

1. `../CLAUDE.md` — existing project guide, stack, conventions, commands and gotchas.
2. `PROJECT_BRIEF.md` — current product brief, if present.
3. `product/north-star.md` — product output and training boundaries.
4. `product/roadmap-state.md` — living state, blockers, ranked queue and last wake snapshot.
5. `product/arbi-harness.md` — arbi operating contract.

## Authoritative source by area

| Area | Authoritative source |
|---|---|
| Repo overview / stack | `../CLAUDE.md` |
| Product goal | `product/north-star.md` + `PROJECT_BRIEF.md` |
| Current state / next action | `product/roadmap-state.md` |
| arbi authority + limits | `product/arbi-constitution.md` |
| Conflict resolution | `product/arbi-authority.md` |
| Permission tiers | `product/arbi-permission-model.md` |
| arbi operating contract | `product/arbi-harness.md` |
| Mobile architecture | existing architecture docs under `docs/` |
| Database / sync | `../CLAUDE.md` + backend architecture docs |

## If you are about to...

| About to... | Read first |
|---|---|
| Start a session / decide what to work on | `/arbi` and `product/roadmap-state.md` |
| Change a training recommendation or plan policy | `product/north-star.md` and `product/arbi-permission-model.md` |
| Touch production data, Supabase, secrets, deploys or CI | `product/arbi-permission-model.md` and `../CLAUDE.md` |
| Trust a memory/dream/session note over repo truth | Stop — `product/arbi-authority.md` says live state and repo docs win |

## Branch-only / living state

Any handoff, roadmap update, or arbi memory that future sessions need must be committed to `main`; branch-only operating state is a process defect unless explicitly scoped to that branch.