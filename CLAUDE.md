# Agentic Workout App — Claude Code
> Stack: React Native (Expo) / TypeScript / Supabase / Zustand / NativeWind
> Full project brief: @docs/PROJECT_BRIEF.md
---
## Stack Quick Reference
| Layer | Tech | Dev command |
|-------|------|-------------|
| Mobile | React Native 0.83 / Expo 55 | `expo start` |
| Language | TypeScript (strict, no `any`) | `npm run tsc` |
| Database | Supabase (PostgreSQL + Auth + Realtime) | Supabase MCP |
| Local DB | Drizzle ORM + expo-sqlite | `npm run db:generate && npm run db:push` |
| State | Zustand (global) + React Context (scoped) | — |
| Styling | NativeWind (Tailwind CSS for RN) | — |
| Navigation | React Navigation (native-stack + bottom-tabs) | — |
| Testing | Jest + React Native Testing Library | `npm test` |
---
## Project Domain — READ THIS FIRST
This is an **Intelligent Training Companion** — a workout tracking app that combines Strong's logging UX with AI-powered programming, real-time adaptation, injury management, and agentic memory.

**Core Concepts:**
- **Exercises** — Individual movements (bench press, squat, running, etc.)
- **Workouts** — A session containing a collection of exercises with sets/reps/weight
- **Programs** — Multi-week structured training plans
- **Progress** — Historical data, personal records, charts
- **AI Training** — Intelligent workout recommendations and adaptation
- **Injuries** — Injury tracking and exercise modification suggestions
- **Sync Engine** — Offline-first data sync with Supabase

**Key Features:**
- Workout logging (sets, reps, weight, duration)
- Exercise library with categories (strength, cardio, flexibility)
- Progress charts and personal records
- Workout templates and program scheduling
- Rest timer and workout timer
- Offline-first data sync with Supabase
- AI-powered workout programming and adaptation

**Data integrity — non-negotiable:**
- Offline-first architecture — workouts MUST be loggable without connectivity
- Local SQLite (via expo-sqlite + Drizzle) is source of truth during offline
- Supabase sync happens when connectivity is restored
- Never lose user workout data — conflict resolution favors local changes
---
## Architecture
```
src/
  features/         ← Feature modules
    workouts/       # Workout logging and history
      components/   # Feature-specific UI
      hooks/        # Feature-specific hooks
      services/     # Business logic
      types/        # Feature types
    exercises/      # Exercise library and details
    programs/       # Training program management
    progress/       # Charts, stats, personal records
    profile/        # User profile and settings
    auth/           # Authentication flows
    ai/             # AI-powered recommendations
    injuries/       # Injury tracking and modifications
    history/        # Workout history
    home/           # Home screen features
    onboarding/     # User onboarding flow
  components/       # Shared UI components
  hooks/            # Shared custom hooks
  lib/              # Utilities, Supabase client, helpers
  stores/           # Zustand stores
  types/            # Shared TypeScript types
  constants/        # App constants and config
  navigation/       # Navigation configuration
supabase/           # Supabase migrations, edge functions, types
drizzle/            # Drizzle ORM schema and migrations
docs/               # Discovery, architecture, sprints, guides
models/             # AI/ML model artefacts (if applicable)
```
---
## Commands
> Every feature follows: `DISCOVER → PLAN → BUILD → TEST → QUALITY → HARDEN → DOCUMENT`
| Command | Agent | What it does |
|---------|-------|-------------|
| `/discover $FEATURE` | requirements-analyst | Discovery doc → `docs/discovery/` |
| `/user-stories $FEATURE` | requirements-analyst | Story map with priorities |
| `/sprint-plan $N` | system-architect | Sprint plan + contracts |
| `/db-design $FEATURE` | backend-architect | Migration SQL + RLS |
| `/architect $FEATURE` | system-architect | ADR + data flow + trade-offs |
| `/feature-plan $FEATURE` | — | Detailed feature implementation plan |
| `/new-task` | — | Analyze task complexity + plan |
| `/harden $SPRINT` | security + performance | OWASP + perf audit |
| `/security-scan` | security-engineer | Auth, RLS, secrets |
| `/perf-audit` | performance-engineer | Queries, bundle, animations, p95 |
| `/error-boundaries` | — | Missing error handling audit |
| `/docs-generate $FEATURE` | technical-writer | Feature documentation |
| `/component-new $NAME` | — | React Native component scaffold |
| `/edge-function-new $NAME` | — | Supabase Edge Function scaffold |
| `/types-gen` | — | Regenerate Supabase TypeScript types |
| `/code-explain $FILE` | — | Explain code structure and logic |
| `/code-optimize $FILE` | — | Performance optimization suggestions |
| `/code-cleanup $FILE` | — | Refactoring and clean code fixes |
| `/lint` | — | Run linting and fix issues |
---
## Quality Gates
### Mobile App (enforced by CI)
| Gate | Command | Blocks |
|------|---------|--------|
| TypeScript strict | `npm run tsc` | Commit |
| ESLint | `npx eslint src/` | Commit |
| Prettier | `npx prettier --check src/` | Commit |
| Jest tests | `npm test` | Push |
| Expo build | `expo export` | Release |
### Supabase (enforced by CI)
| Gate | Check | Blocks |
|------|-------|--------|
| Migrations numbered | Sequential SQL files | PR merge |
| RLS policies | All user tables have RLS | PR merge |
| Types current | `types-gen` matches schema | PR merge |
---
## Project Conventions
| Convention | Rule |
|------------|------|
| Commits | `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`, `perf:`, `security:` |
| Branches | `feature/name`, `fix/name`, `hotfix/name`, `sprint/sprint-N` |
| Shared types | Define in `src/types/` — never duplicate across features |
| Input validation | Zod on all user inputs |
| Soft deletes | `deleted_at TIMESTAMPTZ` — never `DELETE FROM` user data |
| Test fixtures | Proper UUIDs — never `'user-1'` shorthand |
| Migrations | Apply via Supabase MCP, then regenerate types with `/types-gen` |
| New features | Go in `src/features/{domain}/`, not loose in `src/` |
| Feature structure | Each feature folder contains: `components/`, `hooks/`, `services/`, `types/` |
| State management | Zustand for global; React Context for feature-scoped; avoid prop drilling |
| Styling | NativeWind classes preferred; StyleSheet for complex animations |
| Navigation | React Navigation — screens registered in `src/navigation/` |
| Co-located tests | `Component.tsx` + `Component.test.tsx` in same directory |
| Comments | Only for "why", not "what" — code should be self-documenting |
| Functions | Keep focused, under 50 lines where practical |
---
## Mobile-First Design
- Touch targets minimum 44x44px
- Support portrait and landscape
- Optimize for variable network conditions
- Offline-first architecture — workouts must be loggable without connectivity
- Smooth 60fps animations for timers and transitions
- Haptic feedback for key interactions (expo-haptics)
---
## Gotchas
- **Offline-first sync** — Local SQLite is source of truth; Supabase syncs when online. Conflict resolution favors local changes. See `SYNC_ENGINE_README.md`
- **Drizzle + expo-sqlite** — Use Drizzle ORM for local DB schema; migrations via `npm run db:generate`
- **NativeWind v4** — className prop works on RN components; check compatibility for third-party libs
- **React Navigation vs Expo Router** — This project uses React Navigation (native-stack + bottom-tabs), NOT Expo Router
- **Reanimated** — Use `react-native-reanimated` for 60fps animations; avoid Animated API for complex gestures
- **Secure Store** — Use `expo-secure-store` for auth tokens; never AsyncStorage for sensitive data
- **FlashList** — Use `@shopify/flash-list` instead of FlatList for long exercise/workout lists
- **Supabase Auth** — JWT tokens stored in SecureStore; refresh logic in `src/features/auth/`
- **Legend State** — `@legendapp/state` is installed but Zustand is the primary state manager; avoid mixing
- **Bundle size** — Monitor with `expo export`; lazy-load heavy screens (progress charts, AI features)
---
## Installed Plugin: edmunds-claude-code
This project includes the [edmunds-claude-code](https://github.com/edmund-io/edmunds-claude-code) plugin with 14 slash commands and 11 AI agents.
### AI Agents
**Architecture:** tech-stack-researcher, system-architect, backend-architect, frontend-architect, requirements-analyst
**Code Quality:** refactoring-expert, performance-engineer, security-engineer
**Documentation:** technical-writer, learning-guide, deep-research-agent
> **Note:** Some commands (`api-new`, `page-new`, `component-new`) are optimized for Next.js. Adapt their output for React Native screens and components as needed. The Supabase commands (`types-gen`, `edge-function-new`) work as-is.
---
## Docs Structure
```
docs/
├── PROJECT_BRIEF.md           # Source of truth (29k words)
├── 01-PRD.md                  # Requirements
├── 02-TECH-STACK-DECISIONS.md # Technology choices
├── 03-RESEARCH-FINDINGS.md    # Implementation research
├── 04-SYSTEM-ARCHITECTURE.md  # Overall architecture
├── 05-BACKEND-ARCHITECTURE.md # Data & service layer
├── 06-FRONTEND-ARCHITECTURE.md# Component & UI architecture
├── 07-SECURITY-REVIEW.md      # Security audit
├── 08-PERFORMANCE-PLAN.md     # Performance optimization
├── 09-SPRINT-PLANS.md         # Development sprints
├── 11-DESIGN-SPECIFICATIONS.md# Design specs
├── 12-DESIGN-IMPLEMENTATION-GUIDE.md # Design guide
├── 13-COMPONENT-INVENTORY.md  # Component catalog
├── discovery/                 # /discover outputs (one file per feature)
```
---
## Project Initialization Workflow
Use `/init-project` to run the full 6-phase initialization, or run individual phases:
| Command | Phase | Agents Used | Output |
|---------|-------|-------------|--------|
| `/init-project` | All 6 phases | All 11 agents | Complete project planning |
| `/init-phase1-discovery` | 1: Discovery | requirements-analyst, tech-stack-researcher, deep-research-agent | PRD, tech decisions, research |
| `/init-phase2-architecture` | 2: Architecture | system-architect, backend-architect, frontend-architect | System, backend, frontend architecture |
| `/init-phase3-review` | 3: Review | security-engineer, performance-engineer | Security audit, performance plan |
| `/init-phase4-sprints` | 4: Sprints | (uses /new-task + /feature-plan) | Sprint plans for all features |
### Phase Execution Order
```
Phase 1: Discovery & Research (3 agents parallel)
    ↓
Phase 2: Architecture Design (1 then 2 parallel)
    ↓
Phase 3: Security & Performance Review (2 agents parallel)
    ↓
Phase 4: Sprint Planning (feature plans)
    ↓
Phase 5: Scaffolding Specs (component/service specs)
    ↓
Phase 6: Documentation (technical-writer + learning-guide)
```
---
## Getting Started
1. `/init-project` — Run the full project initialization workflow
2. Or run phases individually: `/init-phase1-discovery`, `/init-phase2-architecture`, etc.
3. `/new-task` — Plan individual implementation tasks
4. `/feature-plan` — Design a feature in detail
5. Use the `requirements-analyst` agent to refine app requirements
6. Use the `tech-stack-researcher` agent to finalize technology choices
7. Use the `system-architect` agent to design overall architecture
