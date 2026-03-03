---
description: Master project initialization - orchestrate all agents and planning workflows
model: claude-sonnet-4-5
---

# Intelligent Training Companion - Full Project Initialization

You are orchestrating the complete project initialization for the **Intelligent Training Companion** app. This command runs all 11 AI agents and planning workflows in the correct sequence to produce a fully planned, architecturally designed, sprint-ready project.

## Source of Truth

Read `docs/PROJECT_BRIEF.md` for the complete 29,000+ word project brief. All agent work must reference this document.

## Arguments

$ARGUMENTS

## Orchestration Sequence

Execute the following 6 phases in order. Each phase produces deliverables saved to `docs/`. Pause between phases to present results and confirm before proceeding.

---

### PHASE 1: Discovery & Research (3 agents - run in parallel)

Launch these three agents simultaneously:

**Agent 1: `requirements-analyst`**
- Input: The full project brief from `docs/PROJECT_BRIEF.md`
- Task: Distill the 29k-word brief into a structured Product Requirements Document (PRD)
- Output requirements:
  - Prioritized user stories (MoSCoW: Must/Should/Could/Won't)
  - Functional requirements grouped by feature (Logging UX, Intelligence Layer, Injury Management, Agentic Memory)
  - Non-functional requirements (performance: 10s set logging, 60fps animations, offline-first)
  - Acceptance criteria for each user story
  - Dependencies between features
  - MVP scope vs full scope
- Save to: `docs/01-PRD.md`

**Agent 2: `tech-stack-researcher`**
- Input: Tech stack from brief (React Native + Expo + TypeScript + SQLite + Supabase + Claude API + Zustand + NativeWind + Reanimated 2)
- Task: Validate each technology choice against project requirements
- Research areas:
  - expo-sqlite vs WatermelonDB vs Realm for offline-first workout logging
  - Vector storage options for agentic memory (local FAISS vs Pinecone vs pgvector in Supabase)
  - NativeWind v4 compatibility with Expo SDK 52+
  - React Navigation vs Expo Router for this app's navigation patterns
  - Zustand vs Jotai vs Legend State for workout session state
  - Reanimated 2 vs Moti for timer animations
  - Claude API integration patterns for React Native (direct vs edge function proxy)
- Output: Technology decision matrix with recommendations and trade-offs
- Save to: `docs/02-TECH-STACK-DECISIONS.md`

**Agent 3: `deep-research-agent`**
- Input: Competitive analysis section from brief + Strong app UX patterns
- Task: Deep research on implementation patterns
- Research areas:
  - React Native workout app architecture patterns (2025-2026)
  - RPE-based auto-regulation algorithms in sports science literature
  - Evidence-based periodization models (Linear, Block, DUP, Conjugate) implementation
  - Offline-first sync strategies for mobile fitness apps
  - Vector similarity search on mobile devices (local embedding models)
  - Apple Watch integration with React Native (expo-health, react-native-health)
  - Strong app's specific UX patterns and how to replicate in React Native
- Output: Research findings with implementation recommendations
- Save to: `docs/03-RESEARCH-FINDINGS.md`

**Checkpoint 1:** Present summaries of all three outputs. Confirm before proceeding to Phase 2.

---

### PHASE 2: System Architecture (1 agent, then 2 in parallel)

**Step 1: `system-architect`** (runs first)
- Input: PRD from Phase 1 + tech stack decisions + research findings
- Task: Design the overall system architecture
- Must cover:
  - High-level architecture diagram (local-first with optional cloud sync)
  - Data flow: User input → Local DB → AI Processing → Display
  - Offline-first architecture (SQLite as primary, Supabase as sync layer)
  - AI integration architecture (which calls are local deterministic vs Claude API)
  - State management architecture (Zustand stores, React Query cache, SQLite persistence)
  - Navigation architecture (tab + stack + modal patterns)
  - Module boundaries and dependency graph
  - Error handling and recovery strategy
  - Security architecture (API key management, user data encryption)
- Save to: `docs/04-SYSTEM-ARCHITECTURE.md`

**Step 2: Run in parallel after system architecture is complete:**

**Agent: `backend-architect`**
- Input: System architecture + data models from brief + SQLite schema
- Task: Design the complete data layer
- Must cover:
  - SQLite schema refinement (indexes, constraints, migrations strategy)
  - Supabase schema design (for Phase 2 cloud sync)
  - Data access layer (repository pattern with TypeScript)
  - Claude API service design (prompt templates, response parsing, error handling, rate limiting)
  - Agentic memory storage design (vector embeddings, similarity search)
  - Data migration strategy (schema versioning)
  - Offline queue design (pending sync operations)
  - Backup and restore strategy
- Save to: `docs/05-BACKEND-ARCHITECTURE.md`

**Agent: `frontend-architect`**
- Input: System architecture + UI/UX patterns from brief + Strong app research
- Task: Design the complete frontend architecture
- Must cover:
  - Component hierarchy (atomic design: atoms → molecules → organisms → screens)
  - Screen inventory with navigation map
  - Design system specification (colors, typography, spacing, components)
  - Gesture system design (swipe actions, long press, haptic feedback)
  - Animation specifications (rest timer, set completion, workout transitions)
  - Form handling patterns (numeric inputs, RPE selector, weight/reps fields)
  - Accessibility requirements (VoiceOver, Dynamic Type, minimum tap targets)
  - Performance budget (bundle size, render performance, memory limits)
  - Responsive layout strategy (iPhone SE → iPad, portrait + landscape)
- Save to: `docs/06-FRONTEND-ARCHITECTURE.md`

**Checkpoint 2:** Present architecture summaries. Confirm before proceeding.

---

### PHASE 3: Security & Performance Review (2 agents - run in parallel)

**Agent: `security-engineer`**
- Input: All architecture documents from Phases 1-2
- Task: Security audit of the planned architecture
- Must review:
  - API key management (Claude API key must never be in client bundle)
  - User data protection (workout data, injury information, health data)
  - Authentication flow security (Supabase Auth best practices)
  - Input validation (RPE values, weight/reps, user-generated content)
  - Offline data encryption (SQLite encryption at rest)
  - Network security (HTTPS, certificate pinning)
  - Third-party dependency audit strategy
  - GDPR/privacy compliance (health data classification)
  - App Store review requirements (health app guidelines)
- Output: Security requirements document with severity ratings
- Save to: `docs/07-SECURITY-REVIEW.md`

**Agent: `performance-engineer`**
- Input: All architecture documents from Phases 1-2
- Task: Performance review and optimization plan
- Must review:
  - Set logging speed target (10 seconds) - interaction bottleneck analysis
  - SQLite query performance (indexes, query optimization, batch operations)
  - React Native render performance (FlatList virtualization, memo boundaries)
  - Animation performance (rest timer at 60fps, gesture handlers on UI thread)
  - Bundle size budget (initial load, code splitting, lazy loading)
  - Memory management (workout session lifecycle, image caching, vector storage)
  - Network performance (Claude API call latency, offline queue processing)
  - Battery optimization (background timers, location services, sync frequency)
  - Cold start time target (<2 seconds)
- Output: Performance requirements and optimization plan
- Save to: `docs/08-PERFORMANCE-PLAN.md`

**Checkpoint 3:** Present security and performance findings. Confirm before proceeding.

---

### PHASE 4: Sprint Planning (use /new-task and /feature-plan commands)

Using the architecture and requirements from Phases 1-3, create detailed sprint plans:

**Step 1: Overall task breakdown with `/new-task`**
- Task: "Build the complete Intelligent Training Companion app following the 7-phase, 24-week roadmap in docs/PROJECT_BRIEF.md"
- Save the task analysis output

**Step 2: Feature plans with `/feature-plan` (run for each core feature)**

Feature Plan 1: **Strong-Inspired Logging UX**
- Scope: ExerciseCard, SetRow, RestTimer, RPEModal, AdaptationAlert, auto-fill, swipe gestures
- Reference: Feature 1 in `docs/PROJECT_BRIEF.md`

Feature Plan 2: **Agentic Intelligence Layer**
- Scope: Claude API integration, ProgressionCalculator, DailyWorkoutGenerator, MesocycleProgrammer, WorkoutAdaptation, PostWorkoutAnalysis
- Reference: Feature 2 in `docs/PROJECT_BRIEF.md`

Feature Plan 3: **Injury Management System**
- Scope: InjuryScreening, ExerciseRiskMatrix, InjuryRiskAssessor, ExerciseSelector, KillSwitchMonitor
- Reference: Feature 3 in `docs/PROJECT_BRIEF.md`

Feature Plan 4: **Agentic Memory System**
- Scope: PatternDetector, MemoryStore, MemoryRetrieval, MemoryApplication, FeedbackLearning
- Reference: Feature 4 in `docs/PROJECT_BRIEF.md`

- Save all plans to: `docs/09-SPRINT-PLANS.md`

**Checkpoint 4:** Present sprint plans for review.

---

### PHASE 5: Initial Scaffolding Plan (commands)

Generate specifications for the first sprint's deliverables:

**Components (adapt `/component-new` for React Native):**
1. `ExerciseCard` - Workout exercise card with set table, auto-fill, completion checkboxes
2. `SetRow` - Individual set row with weight/reps inputs, previous performance, checkbox
3. `RestTimer` - Inline + full-screen rest timer with countdown, skip, adjust controls
4. `RPEModal` - RPE rating modal (5.0-9.5 scale) with large tap targets
5. `AdaptationAlert` - Mid-workout AI adaptation alert with options

**Services:**
1. Claude API service - Prompt templates for mesocycle generation, daily workouts, analysis
2. Progression Calculator - Deterministic load progression algorithm
3. Database service - SQLite setup, migrations, CRUD operations

**Types (use `/types-gen` approach):**
1. Generate TypeScript types matching the SQLite schema
2. Create shared types for Workout, Exercise, SetLog, Memory interfaces

- Save scaffolding specs to: `docs/10-SCAFFOLDING-SPECS.md`

---

### PHASE 6: Documentation (2 agents - run in parallel)

**Agent: `technical-writer`**
- Input: All documents from Phases 1-5
- Task: Create the developer documentation package
- Must produce:
  - `docs/ARCHITECTURE.md` - Architecture overview for contributors
  - `docs/API-REFERENCE.md` - Internal service API documentation
  - `docs/DATA-MODELS.md` - Database schema documentation with ERD
  - `docs/AI-INTEGRATION.md` - Claude API integration guide (prompts, responses, error handling)
  - Updated `README.md` with setup instructions, project overview, contributing guide

**Agent: `learning-guide`**
- Input: All documents from Phases 1-5
- Task: Create onboarding materials
- Must produce:
  - `docs/GETTING-STARTED.md` - Step-by-step developer setup guide
  - `docs/DOMAIN-GUIDE.md` - Exercise science concepts explained (RPE, periodization, mesocycles, etc.)
  - Key concept explanations for the codebase (agentic memory, progression algorithms, injury risk matrix)

**Final Checkpoint:** Present complete documentation index.

---

## Deliverables Summary

After all 6 phases complete, the `docs/` directory should contain:

```
docs/
├── PROJECT_BRIEF.md          (source of truth - already exists)
├── 01-PRD.md                 (Phase 1: requirements-analyst)
├── 02-TECH-STACK-DECISIONS.md (Phase 1: tech-stack-researcher)
├── 03-RESEARCH-FINDINGS.md   (Phase 1: deep-research-agent)
├── 04-SYSTEM-ARCHITECTURE.md (Phase 2: system-architect)
├── 05-BACKEND-ARCHITECTURE.md (Phase 2: backend-architect)
├── 06-FRONTEND-ARCHITECTURE.md (Phase 2: frontend-architect)
├── 07-SECURITY-REVIEW.md     (Phase 3: security-engineer)
├── 08-PERFORMANCE-PLAN.md    (Phase 3: performance-engineer)
├── 09-SPRINT-PLANS.md        (Phase 4: feature plans)
├── 10-SCAFFOLDING-SPECS.md   (Phase 5: component/service specs)
├── ARCHITECTURE.md           (Phase 6: technical-writer)
├── API-REFERENCE.md          (Phase 6: technical-writer)
├── DATA-MODELS.md            (Phase 6: technical-writer)
├── AI-INTEGRATION.md         (Phase 6: technical-writer)
├── GETTING-STARTED.md        (Phase 6: learning-guide)
└── DOMAIN-GUIDE.md           (Phase 6: learning-guide)
```

## Execution Notes

- **Parallel execution:** Where noted, launch agents simultaneously for speed
- **Checkpoints:** Pause after each phase to present findings and get user confirmation
- **Cross-referencing:** Each phase builds on previous outputs - agents should read prior docs
- **React Native adaptation:** Commands designed for Next.js (component-new, page-new) must be adapted for React Native screens and components
- **Save everything:** All outputs saved to `docs/` for future reference and agent context
