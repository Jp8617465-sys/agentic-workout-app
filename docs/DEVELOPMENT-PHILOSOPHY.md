# Development Philosophy & Lifecycle Summary

## The Philosophy: "Plan Before You Build, Verify Before You Move On"

The project follows a **6-phase gated lifecycle** where each phase must complete and be validated before the next begins. This prevents the #1 cause of broken e2e logic: **implementing features in isolation without understanding how they connect**.

### The 6 Phases (in strict order)

| Phase | Purpose | Key Principle |
|-------|---------|---------------|
| 1. Discovery & Research | Understand requirements, validate tech choices, research patterns | "Ask why before how" |
| 2. Architecture Design | System architecture, data flow, module boundaries | "Think 10x growth, loose coupling, clear boundaries" |
| 3. Security & Performance Review | Audit the architecture before writing code | "Measure first, optimize second" |
| 4. Sprint Planning | Break architecture into actionable sprints | Sequential, dependency-aware task breakdown |
| 5. Scaffolding | Define component/service specs | Type-first, interface-first development |
| 6. Documentation | Developer docs and onboarding | Document decisions, not just code |

**Critical pattern:** Each phase has a **checkpoint** - you pause, present findings, and confirm before proceeding. This is where most teams skip and where e2e breakdowns originate.

---

## Why E2E Logic Breaks (and How This Prevents It)

| Common Failure | This Project's Prevention |
|----------------|--------------------------|
| Features built in isolation, don't integrate | Phase 2 defines module boundaries and data flow *between* features before any code |
| State management inconsistencies | Hybrid state architecture documented upfront (Legend State for high-frequency, Zustand for app state) |
| No testing strategy until late | Phase 4 includes testing strategy per feature; multi-layer testing (unit, integration, visual, performance) |
| Performance issues discovered late | Phase 3 sets performance budgets *before* code (10s set logging, 60fps, <2s cold start) |
| Unclear data flow between layers | Phase 2 explicitly maps: User Input -> Local DB -> AI Processing -> Display |
| "It works in isolation" syndrome | Success criteria defined per task: feature works, tests pass, no regressions, documented |

---

## Key Development Principles

1. **Feature-based folder structure** - Group by feature (workouts/, exercises/), not file type (components/, hooks/). Keeps related logic together and makes e2e flows traceable.

2. **Co-located tests** - `Component.tsx` + `Component.test.tsx` side by side.

3. **TypeScript strict mode, no `any`** - Type safety catches integration issues at compile time.

4. **Functions under 50 lines** - Keeps logic focused and testable.

5. **Incremental commits and testing** - Test incrementally, commit often.

6. **Risk assessment per task** - Every `/new-task` requires identifying: unknown dependencies, API limitations, breaking changes, third-party issues.

---

## The Task Framework (`/new-task`)

Every implementation task goes through:
1. **Task Breakdown** - Requirements, dependencies, affected files, complexity estimate
2. **Risk Assessment** - Blockers, unknowns, breaking changes
3. **Implementation Steps** - Sequential phases: setup -> backend -> frontend -> testing -> docs
4. **Success Criteria** - "Done" means: works as specified, tests pass, no regressions, documented

---

## Testing Layers (Multi-Layer Verification)

| Layer | What It Catches |
|-------|-----------------|
| Unit tests | Individual function/hook correctness |
| Integration tests | State sync between stores, data flow between layers |
| Visual regression | UI drift, layout breakdowns |
| Performance tests | Frame rate drops, memory leaks, latency spikes |
| Manual test scripts | Full user flow validation (e2e) |

Coverage targets: >90% statements, >85% branches, >90% functions.

---

## Agent-Based Quality Gates

Specialized agents review at different stages:
- **requirements-analyst** - Before building: "Is this the right thing to build?"
- **system-architect** - Before coding: "Will the pieces fit together?"
- **security-engineer** - Before shipping: "Is it safe?"
- **performance-engineer** - Before shipping: "Is it fast enough?"
- **refactoring-expert** - During maintenance: "Is complexity growing?"

---

## Applying to Other Projects

To apply this philosophy to an app with consistent e2e breakdowns:

1. **Map your data flow end-to-end** before fixing individual features. Document: where does data enter? How does it transform? Where does it exit?

2. **Add integration tests at module boundaries** - If module A talks to module B, test that interface explicitly.

3. **Adopt the checkpoint pattern** - Before merging any feature, verify it against the full user flow, not just its own tests.

4. **Use `/new-task` style analysis** for every change - even small ones. The risk assessment step alone catches most integration issues.

5. **Feature-based organization** - If your code is organized by file type, refactor to feature-based. This makes broken e2e flows obvious because all related code is in one place.
