---
description: Phase 2 - System, backend, and frontend architecture design using architect agents
model: claude-sonnet-4-5
---

# Phase 2: Architecture Design

Design the complete system architecture for the Intelligent Training Companion using 3 architect agents. The system-architect runs first to establish the overall design, then backend-architect and frontend-architect run in parallel to detail their domains.

## Prerequisites

This phase requires outputs from Phase 1:
- `docs/01-PRD.md` (requirements)
- `docs/02-TECH-STACK-DECISIONS.md` (technology choices)
- `docs/03-RESEARCH-FINDINGS.md` (implementation patterns)
- `docs/PROJECT_BRIEF.md` (source of truth)

## Arguments

$ARGUMENTS

---

## Step 1: System Architect (runs first)

Use the `system-architect` agent.

### Task

Design the overall system architecture for a React Native offline-first workout tracking app with AI intelligence layer.

### Architecture Requirements

From the PRD and brief, the system must support:

1. **Local-first data flow**: SQLite is the primary store. All core features work offline.
2. **AI integration**: Claude API for mesocycle generation, workout prescription, analysis. Some algorithms (progression calculator, RPE alerts) are deterministic and run locally.
3. **Dual computation model**: Deterministic algorithms (progression, rest time, injury risk) run on-device. AI reasoning (mesocycle design, pattern analysis, natural language) calls Claude API.
4. **State management**: Active workout state (Zustand), cached server state (React Query), persistent data (SQLite), agentic memory (vector store).
5. **Sync layer (Phase 2)**: Supabase for auth + cloud backup + cross-device sync.

### Required Output (`docs/04-SYSTEM-ARCHITECTURE.md`)

1. **System Context Diagram**
   - User ↔ React Native App ↔ Local SQLite ↔ Supabase (optional sync)
   - React Native App ↔ Claude API (via edge function proxy)
   - React Native App ↔ Apple Watch (HealthKit)

2. **Container Diagram**
   ```
   React Native App
   ├── Presentation Layer (Screens, Components)
   ├── State Layer (Zustand stores, React Query)
   ├── Service Layer (AI, Database, Memory, Injury)
   ├── Data Layer (SQLite, AsyncStorage, Vector Store)
   └── Platform Layer (Notifications, HealthKit, Haptics)
   ```

3. **Data Flow Diagrams**
   - Workout logging flow (user input → state → SQLite → sync)
   - AI prescription flow (user opens app → fetch history → Claude API → display)
   - Mid-workout adaptation flow (RPE input → deviation check → alert → user choice → memory update)
   - Agentic memory flow (pattern detection → embedding → store → retrieval → application)

4. **Module Boundary Definitions**
   - What each module owns, exposes, and depends on
   - Clear interfaces between modules (TypeScript interfaces)

5. **Technology Integration Map**
   - How each technology fits into the architecture
   - Data flow between technologies

6. **Error Handling Strategy**
   - Network failure handling (queue and retry)
   - SQLite failure recovery
   - Claude API timeout/error fallbacks
   - Crash recovery (preserve in-progress workout)

7. **Security Architecture**
   - API key flow (never in client bundle → Supabase Edge Function proxy)
   - Data encryption at rest (SQLite encryption)
   - Auth flow (Supabase Auth)

---

## Step 2: Backend Architect + Frontend Architect (run in parallel)

After the system architecture is complete, launch both in parallel.

### Backend Architect

Use the `backend-architect` agent.

#### Task

Design the complete data and service layer for the workout app.

#### Required Output (`docs/05-BACKEND-ARCHITECTURE.md`)

1. **SQLite Schema Design**
   - Refined schema from brief (with proper indexes, constraints, foreign keys)
   - Migration strategy (versioned migrations, rollback support)
   - Seed data design (exercise library: 100+ exercises with risk matrices)
   - Query optimization (common query patterns pre-analyzed)

2. **Repository Pattern**
   ```typescript
   // Design the data access layer
   interface WorkoutRepository {
     create(workout: InsertWorkout): Promise<Workout>;
     getById(id: string): Promise<Workout | null>;
     getHistory(userId: string, options: HistoryOptions): Promise<Workout[]>;
     getLastWithExercise(userId: string, exerciseName: string): Promise<Workout | null>;
     // ...
   }
   ```
   - One repository per domain entity (WorkoutRepo, ExerciseRepo, MemoryRepo, etc.)
   - Transaction support for multi-table operations
   - Batch insert optimization for set logs

3. **Claude API Service Design**
   - Prompt template system (mesocycle, daily workout, analysis, Q&A)
   - Response parsing and validation (Zod schemas for AI responses)
   - Error handling (timeout, rate limit, malformed response)
   - Cost tracking (token usage per user)
   - Caching strategy (cache mesocycle for duration, cache daily workout for 24h)
   - Edge function proxy design (Supabase Edge Function that calls Claude)

4. **Agentic Memory Storage**
   - Vector embedding strategy (which model, dimensions, local vs remote)
   - Similarity search implementation (cosine similarity, threshold tuning)
   - Memory lifecycle (creation, reinforcement, decay, deletion)
   - Storage budget (max memories per user, pruning strategy)

5. **Offline Queue Design**
   - Queue structure for pending sync operations
   - Conflict resolution rules (last-write-wins vs merge)
   - Priority ordering (workout data > preferences > analytics)
   - Retry strategy (exponential backoff, max retries)

6. **Seed Data Specification**
   - Exercise library structure (100+ exercises with categories, patterns, equipment, muscle groups)
   - Injury risk matrix entries (exercise × injury type mappings)
   - Default rest time configurations
   - Periodization model templates

---

### Frontend Architect

Use the `frontend-architect` agent.

#### Task

Design the complete presentation layer for the workout app, optimized for gym-floor use.

#### Required Output (`docs/06-FRONTEND-ARCHITECTURE.md`)

1. **Component Architecture**
   ```
   Atoms (primitive):
   ├── NumericInput (weight/reps field with +/- stepper)
   ├── RPEBadge (color-coded RPE display)
   ├── TimerDisplay (mm:ss countdown)
   ├── ProgressBar (linear/circular)
   ├── Badge (set type: W/F/D)
   └── IconButton (action buttons)

   Molecules (composed):
   ├── SetRow (set# + prev + weight + reps + checkbox)
   ├── RestTimerCompact (inline timer in header)
   ├── ExerciseHeader (name + category + expand action)
   ├── RPESelector (grid of RPE values 5-9.5)
   └── AdaptationOption (icon + description + rationale)

   Organisms (complex):
   ├── ExerciseCard (header + set table + add set + actions)
   ├── RestTimerFullScreen (countdown + progress + controls + active rest)
   ├── RPEModal (set info + RPE selector + target comparison)
   ├── AdaptationAlert (trigger + options + history context)
   ├── PostWorkoutSummary (stats + progressions + insights + next)
   └── MesocycleReview (performance + what worked + adjustments)

   Screens:
   ├── HomeScreen (today's workout card + quick start)
   ├── ActiveWorkoutScreen (exercise cards + timer + finish)
   ├── PostWorkoutScreen (summary + analytics link)
   ├── HistoryScreen (calendar + workout list)
   ├── ExerciseLibraryScreen (search + filter + exercise cards)
   ├── ProfileScreen (stats + settings + injury management)
   ├── OnboardingScreen (goal + experience + injuries + equipment)
   └── MesocycleScreen (current block + phase + calendar)
   ```

2. **Navigation Map**
   ```
   RootNavigator (Stack)
   ├── OnboardingFlow (Stack - shown once)
   │   ├── Welcome
   │   ├── GoalSetting
   │   ├── ExperienceLevel
   │   ├── InjuryScreening
   │   ├── EquipmentSetup
   │   └── MesocyclePreview
   │
   ├── MainTabs (Bottom Tab)
   │   ├── Home Tab (Stack)
   │   │   ├── HomeScreen
   │   │   └── MesocycleDetail
   │   │
   │   ├── History Tab (Stack)
   │   │   ├── HistoryScreen
   │   │   └── WorkoutDetail
   │   │
   │   ├── Exercises Tab (Stack)
   │   │   ├── ExerciseLibrary
   │   │   └── ExerciseDetail
   │   │
   │   └── Profile Tab (Stack)
   │       ├── ProfileScreen
   │       ├── InjuryManagement
   │       ├── MemoryDashboard
   │       └── Settings
   │
   └── Modals (presented over tabs)
       ├── ActiveWorkoutScreen (full-screen modal)
       ├── RPEModal
       ├── AdaptationAlert
       ├── ExercisePicker
       ├── RestTimerFullScreen
       └── PostWorkoutSummary
   ```

3. **Design System Specification**
   - Color palette (from brief: orange primary, teal secondary, blue accent)
   - Typography scale (headings, body, labels, numeric inputs)
   - Spacing system (4px base grid)
   - Component variants (primary/secondary/danger buttons, card styles)
   - Dark mode support (gym-friendly dark theme)
   - Touch targets (minimum 44x44px, 48x48px preferred for primary actions)

4. **Gesture System**
   - Swipe left on SetRow → delete set (with undo)
   - Swipe right on SetRow → duplicate set
   - Long press on weight/reps → increment/decrement stepper
   - Swipe down on ExerciseCard → reorder
   - Pull to refresh on HistoryScreen
   - Implementation: react-native-gesture-handler + Reanimated

5. **Animation Specifications**
   - Set completion: checkbox fill + row background transition (200ms ease-out)
   - Rest timer: circular progress animation (requestAnimationFrame, 60fps)
   - RPE modal: slide up from bottom (300ms spring)
   - Adaptation alert: slide in from right (250ms ease-in-out)
   - Workout finish: confetti/celebration animation
   - Screen transitions: shared element transitions where appropriate

6. **Performance Considerations**
   - FlatList for exercise cards (virtualized, keyExtractor, getItemLayout)
   - Memo boundaries (SetRow, ExerciseCard header)
   - Keyboard handling (avoid keyboard covering input fields)
   - Image optimization (exercise demo thumbnails: WebP, lazy load)

---

## Checkpoint

After all three architects complete:

```
PHASE 2 COMPLETE
─────────────────

System Architecture:
- Architecture pattern: [offline-first + cloud sync]
- X modules defined
- Data flow diagrams created
- Error handling strategy documented

Backend Architecture:
- SQLite schema: X tables, Y indexes
- Repository interfaces: X repositories
- Claude API: X prompt templates
- Memory storage: [approach chosen]

Frontend Architecture:
- X atoms, Y molecules, Z organisms
- Navigation: X screens, Y modals
- Design system: colors, typography, spacing defined
- X gesture interactions specified
- X animations specified

Proceed to Phase 3 (Security & Performance Review)? [Y/N]
```
