# CLAUDE.md - Agentic Workout App

## Project Overview

A personal workout tracking application for mobile. Built with React Native (Expo) + TypeScript + Supabase. Users can plan, log, and track workout routines, monitor progress, and achieve fitness goals.

## Tech Stack

- **Mobile Framework:** React Native with Expo
- **Language:** TypeScript (strict mode, no `any` types)
- **Backend/Database:** Supabase (PostgreSQL + Auth + Realtime + Edge Functions)
- **State Management:** Zustand for global state, React Context for scoped state
- **Styling:** NativeWind (Tailwind CSS for React Native) or StyleSheet
- **Testing:** Jest + React Native Testing Library
- **Navigation:** Expo Router or React Navigation

## Installed Plugin: edmunds-claude-code

This project includes the [edmunds-claude-code](https://github.com/edmund-io/edmunds-claude-code) plugin with 14 slash commands and 11 AI agents.

### Slash Commands

**Development:**
`/new-task` `/code-explain` `/code-optimize` `/code-cleanup` `/feature-plan` `/lint` `/docs-generate`

**API:** `/api-new` `/api-test` `/api-protect`

**UI:** `/component-new` `/page-new`

**Supabase:** `/types-gen` `/edge-function-new`

### AI Agents

**Architecture:** tech-stack-researcher, system-architect, backend-architect, frontend-architect, requirements-analyst

**Code Quality:** refactoring-expert, performance-engineer, security-engineer

**Documentation:** technical-writer, learning-guide, deep-research-agent

> **Note:** Some commands (`api-new`, `page-new`, `component-new`) are optimized for Next.js. Adapt their output for React Native screens and components as needed. The Supabase commands (`types-gen`, `edge-function-new`) work as-is.

## App Domain

### Core Concepts
- **Exercises** - Individual movements (bench press, squat, running, etc.)
- **Workouts** - A session containing a collection of exercises
- **Sets/Reps/Weight** - Tracking units for strength training
- **Programs** - Multi-week structured training plans
- **Progress** - Historical data and personal records
- **User Profile** - Personal stats, goals, preferences

### Key Features
- Workout logging (sets, reps, weight, duration)
- Exercise library with categories (strength, cardio, flexibility)
- Progress charts and personal records
- Workout templates and program scheduling
- Rest timer and workout timer
- Offline-first data sync with Supabase

## Code Conventions

- TypeScript strict mode, no `any` types
- Functional components with hooks
- Feature-based folder structure (group by feature, not file type)
- Co-locate tests with source files (`Component.tsx` + `Component.test.tsx`)
- Descriptive names, self-documenting code
- Comments only for "why", not "what"
- Keep functions focused, under 50 lines where practical

## Project Structure

```
src/
  features/
    workouts/       # Workout logging and history
    exercises/      # Exercise library and details
    programs/       # Training program management
    progress/       # Charts, stats, personal records
    profile/        # User profile and settings
    auth/           # Authentication flows
  components/       # Shared UI components
  hooks/            # Shared custom hooks
  lib/              # Utilities, Supabase client, helpers
  stores/           # Zustand stores
  types/            # Shared TypeScript types
  constants/        # App constants and config
app/                # Expo Router screens (or navigation config)
supabase/           # Supabase migrations, edge functions, types
```

## Mobile-First Design

- Touch targets minimum 44x44px
- Support portrait and landscape
- Optimize for variable network conditions
- Offline-first architecture - workouts must be loggable without connectivity
- Smooth 60fps animations for timers and transitions

## Project Brief

The complete 29,000+ word project brief is at `docs/PROJECT_BRIEF.md`. This describes the **Intelligent Training Companion** - a workout tracking app that combines Strong's logging UX with AI-powered programming, real-time adaptation, injury management, and agentic memory.

## Project Initialization Workflow

Use `/init-project` to run the full 6-phase initialization, or run individual phases:

| Command | Phase | Agents Used | Output |
|---------|-------|-------------|--------|
| `/init-project` | All 6 phases | All 11 agents | Complete project planning |
| `/init-phase1-discovery` | 1: Discovery | requirements-analyst, tech-stack-researcher, deep-research-agent | PRD, tech decisions, research |
| `/init-phase2-architecture` | 2: Architecture | system-architect, backend-architect, frontend-architect | System, backend, frontend architecture |
| `/init-phase3-review` | 3: Review | security-engineer, performance-engineer | Security audit, performance plan |
| `/init-phase4-sprints` | 4: Sprints | (uses /new-task + /feature-plan) | Sprint plans for all 4 features |

### Phase Execution Order

```
Phase 1: Discovery & Research (3 agents parallel)
    ↓
Phase 2: Architecture Design (1 then 2 parallel)
    ↓
Phase 3: Security & Performance Review (2 agents parallel)
    ↓
Phase 4: Sprint Planning (4 feature plans)
    ↓
Phase 5: Scaffolding Specs (component/service specs)
    ↓
Phase 6: Documentation (technical-writer + learning-guide)
```

### Output Directory

All planning documents are saved to `docs/`:

```
docs/
├── PROJECT_BRIEF.md           # Source of truth (29k words)
├── 01-PRD.md                  # Requirements (Phase 1)
├── 02-TECH-STACK-DECISIONS.md # Technology choices (Phase 1)
├── 03-RESEARCH-FINDINGS.md    # Implementation research (Phase 1)
├── 04-SYSTEM-ARCHITECTURE.md  # Overall architecture (Phase 2)
├── 05-BACKEND-ARCHITECTURE.md # Data & service layer (Phase 2)
├── 06-FRONTEND-ARCHITECTURE.md# Component & UI architecture (Phase 2)
├── 07-SECURITY-REVIEW.md      # Security audit (Phase 3)
├── 08-PERFORMANCE-PLAN.md     # Performance optimization (Phase 3)
├── 09-SPRINT-PLANS.md         # Development sprints (Phase 4)
└── 10-SCAFFOLDING-SPECS.md    # Initial component specs (Phase 5)
```

## Getting Started

1. `/init-project` - Run the full project initialization workflow
2. Or run phases individually: `/init-phase1-discovery`, `/init-phase2-architecture`, etc.
3. `/new-task` - Plan individual implementation tasks
4. `/feature-plan` - Design a feature in detail
5. Use the `requirements-analyst` agent to refine app requirements
6. Use the `tech-stack-researcher` agent to finalize technology choices
7. Use the `system-architect` agent to design overall architecture
