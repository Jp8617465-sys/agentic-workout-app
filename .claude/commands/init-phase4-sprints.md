---
description: Phase 4 - Sprint planning using /new-task and /feature-plan for all core features
model: claude-sonnet-4-5
---

# Phase 4: Sprint Planning

Create detailed sprint plans for all development phases using the `/new-task` and `/feature-plan` workflows. This phase converts architecture documents into actionable development tasks.

## Prerequisites

This phase requires all outputs from Phases 1-3:
- `docs/01-PRD.md` through `docs/08-PERFORMANCE-PLAN.md`
- `docs/PROJECT_BRIEF.md`

## Arguments

$ARGUMENTS

---

## Step 1: Master Task Breakdown

Analyze the complete project as a `/new-task`:

### Task

Build the Intelligent Training Companion - a React Native (Expo) workout tracking app with AI-powered programming, real-time adaptation, injury management, and agentic memory.

Reference the 7-phase, 24-week roadmap from `docs/PROJECT_BRIEF.md`:
- Phase 1: Core Logging (Weeks 1-4)
- Phase 2: Intelligence Layer (Weeks 5-8)
- Phase 3: Mesocycle Programming (Weeks 9-12)
- Phase 4: Agentic Memory (Weeks 13-16)
- Phase 5: Advanced Features (Weeks 17-20)
- Phase 6: Polish & Beta (Weeks 21-22)
- Phase 7: Launch Prep (Weeks 23-24)

### Output

A high-level task breakdown with:
- Complexity assessment per phase
- Dependencies between phases
- Risk assessment per phase
- Critical path through the project

---

## Step 2: Feature Plans (one per core feature)

Create detailed feature plans using the `/feature-plan` approach for each of the 4 core features.

### Feature Plan 1: Strong-Inspired Logging UX

**Scope:** The complete workout logging experience

**Components to build:**
- `ExerciseCard` - Card containing exercise name, set table, actions
- `SetRow` - Individual set row with weight/reps/checkbox
- `RestTimer` - Inline compact + full-screen expanded timer
- `RPEModal` - Post-set RPE rating (5.0-9.5)
- `NumericInput` - Specialized weight/reps input with stepper
- `ActiveWorkoutScreen` - Full workout session screen
- `PostWorkoutScreen` - Summary after completion
- `HistoryScreen` - Past workout list with calendar

**Key interactions to implement:**
1. Auto-fill from last session (SQLite query → pre-populate)
2. Set completion flow (checkbox → RPE modal → rest timer → next set)
3. Swipe gestures (left=delete, right=duplicate, down=reorder)
4. Rest timer (auto-start, per-exercise duration, background notifications)
5. Finish workout flow (confirm → stats → save → history)

**Technical considerations:**
- FlatList/FlashList virtualization for exercise cards
- Keyboard management for numeric inputs
- Gesture handler configuration for swipe actions
- Timer reliability in background (push notifications)
- Haptic feedback on set completion

**Acceptance criteria:**
- [ ] Can log a 5-exercise, 3-sets-each workout in <60 seconds
- [ ] Auto-fill pre-populates from last identical workout
- [ ] Rest timer auto-starts on set completion
- [ ] RPE captured for every working set
- [ ] Workout saved to SQLite with all set logs
- [ ] History shows past workouts with date, exercises, volume
- [ ] Swipe gestures work for delete/duplicate sets
- [ ] Works fully offline

**Sprint breakdown:**
- Sprint 1 (Week 1): Project setup, navigation, SQLite schema, exercise seed data
- Sprint 2 (Week 2): ExerciseCard, SetRow, NumericInput components
- Sprint 3 (Week 3): Active workout flow, auto-fill, set completion
- Sprint 4 (Week 4): RestTimer, RPEModal, history view, polish

---

### Feature Plan 2: Agentic Intelligence Layer

**Scope:** AI-powered workout programming and real-time adaptation

**Services to build:**
- `ProgressionCalculator` - Deterministic load progression (local)
- `DailyWorkoutGenerator` - Generate today's session (Claude API)
- `MesocycleProgrammer` - Generate 12-16 week training blocks (Claude API)
- `WorkoutAdaptation` - Mid-workout RPE-based adjustments (local + Claude API)
- `PostWorkoutAnalysis` - Post-session insights and patterns (Claude API)
- `ClaudeAPIService` - API client with prompt templates, caching, error handling

**Components to build:**
- `AdaptationAlert` - Mid-workout adjustment suggestion modal
- `WorkoutPrescription` - AI-generated workout display on home screen
- `InsightCard` - Post-workout AI insight display
- `MesocycleView` - Training block overview with phase timeline

**Key algorithms:**
1. Progression calculator (RPE × readiness × time gap × phase → new load)
2. Session type determination (lower/upper/full based on history + 48hr rule)
3. RPE deviation detection (threshold: ±1.5 from target)
4. Rest time calculation (category × phase × fatigue × RPE deviation)

**Technical considerations:**
- Claude API proxy via Supabase Edge Function (API key security)
- Prompt engineering for structured JSON responses
- Zod schemas for AI response validation
- Caching strategy (mesocycle: duration, daily workout: 24h)
- Fallback when API unavailable (use last prescription + deterministic progression)
- Streaming responses for post-workout analysis

**Acceptance criteria:**
- [ ] Progression calculator suggests accurate loads (±5% of coach recommendation)
- [ ] Daily workout generated with exercises, sets, reps, loads, RPE targets
- [ ] Each prescription includes human-readable rationale
- [ ] Mid-workout RPE alert fires when deviation >1.5
- [ ] Adaptation options presented with confidence levels
- [ ] Post-workout summary shows patterns, insights, next session preview
- [ ] Works without internet (fallback to deterministic progression)

**Sprint breakdown:**
- Sprint 5 (Week 5): Claude API service, edge function proxy, prompt templates
- Sprint 6 (Week 6): Progression calculator, daily workout generator
- Sprint 7 (Week 7): RPE adaptation engine, AdaptationAlert component
- Sprint 8 (Week 8): Post-workout analysis, InsightCard, polish

---

### Feature Plan 3: Injury Management System

**Scope:** Proactive injury risk management throughout the app

**Services to build:**
- `InjuryRiskAssessor` - Evaluate exercise risk for user's injuries
- `ExerciseSelector` - Filter exercises by safety + preference
- `KillSwitchMonitor` - Real-time safety threshold monitoring
- `InjuryScreeningService` - Onboarding injury questionnaire logic

**Components to build:**
- `InjuryScreeningFlow` - Onboarding screens for injury input
- `InjuryBadge` - Risk level indicator on exercise cards
- `KillSwitchAlert` - Safety stop alert (pain, form breakdown)
- `ExerciseSubstitution` - Safe alternative exercise picker
- `InjuryManagementScreen` - Profile section for managing injuries

**Data to seed:**
- Exercise risk matrix (100+ exercises × common injury types)
- Risk levels (LOW/MODERATE/HIGH) with notes
- Contraindications and modifications for each combination
- Movement pattern classifications

**Key algorithms:**
1. Risk assessment (user injuries × exercise risk matrix → overall risk)
2. Exercise filtering (exclude HIGH risk, flag MODERATE)
3. Kill switch triggers (pain >2/10, form breakdown, RPE >9 non-peak)
4. Safe alternative selection (same pattern, lower risk)

**Acceptance criteria:**
- [ ] Onboarding captures injury type, status, severity, date
- [ ] HIGH risk exercises excluded from workout generation
- [ ] MODERATE risk exercises flagged with warning badge
- [ ] Kill switch fires on pain >2/10 during workout
- [ ] Substitute exercise picker shows safe alternatives
- [ ] Return-from-break protocol reduces loads appropriately
- [ ] Injury data persists and can be updated in profile

**Sprint breakdown:**
- Sprint 9 (Week 9): Injury screening flow, data model, seed data
- Sprint 10 (Week 10): Risk assessor, exercise filtering integration
- Sprint 11 (Week 11): Kill switch monitor, safety alerts
- Sprint 12 (Week 12): Substitution picker, return protocols, polish

---

### Feature Plan 4: Agentic Memory System

**Scope:** Long-term pattern learning and personalized adaptation

**Services to build:**
- `PatternDetector` - Identify patterns from workout history
- `MemoryStore` - Store and retrieve memories with vector search
- `MemoryRetrieval` - Context-aware memory retrieval for decisions
- `MemoryApplication` - Apply memories to modify AI decisions
- `FeedbackLearning` - Learn from user overrides of AI suggestions

**Components to build:**
- `MemoryDashboard` - View all learned patterns and preferences
- `MemoryInsight` - Individual pattern display with evidence
- `ConfidenceIndicator` - Visual confidence score for AI suggestions
- `OverrideTracker` - Show when user disagrees with AI

**Pattern types to detect:**
1. Optimal RPE ranges per exercise
2. Day-of-week fatigue patterns
3. Exercise preferences (swap patterns)
4. Recovery timelines between sessions
5. Load progression sweet spots
6. Injury risk indicators
7. Deload timing preferences
8. Return protocol success rates

**Technical considerations:**
- Vector embedding generation (local or remote?)
- Similarity search performance on mobile
- Memory lifecycle (creation → reinforcement → decay → deletion)
- Confidence scoring (observations × success rate × recency)
- Storage limits (max memories per user, pruning strategy)
- Privacy (all memory data stays on device by default)

**Acceptance criteria:**
- [ ] Detects ≥5 pattern types from 12+ weeks of history
- [ ] Memories stored with confidence scores
- [ ] Relevant memories retrieved during workout generation
- [ ] Memories influence AI prescriptions (visible in rationale)
- [ ] User can view all learned patterns in dashboard
- [ ] System learns from user overrides (≥3 consistent overrides → new pattern)
- [ ] Memory confidence decays without reinforcement

**Sprint breakdown:**
- Sprint 13 (Week 13): Pattern detector, basic pattern types
- Sprint 14 (Week 14): Memory store, vector embedding, retrieval
- Sprint 15 (Week 15): Memory application, confidence scoring
- Sprint 16 (Week 16): Feedback learning, dashboard, polish

---

## Output

Compile all sprint plans into `docs/09-SPRINT-PLANS.md` with:

1. **Sprint calendar** (24-week Gantt-style overview)
2. **Per-sprint task lists** (with checkboxes)
3. **Dependencies between sprints** (which must complete before others start)
4. **Risk items per sprint** (what could block progress)
5. **Definition of done per sprint** (acceptance criteria)
6. **Testing strategy per sprint** (what to test, how)

---

## Checkpoint

```
PHASE 4 COMPLETE
─────────────────

Sprint Plans Created:
- 24 weeks across 7 development phases
- X total tasks identified
- 4 core features fully planned
- Dependencies mapped
- Risk register populated

Feature Complexity:
- Logging UX: [complexity] (4 sprints)
- Intelligence Layer: [complexity] (4 sprints)
- Injury Management: [complexity] (4 sprints)
- Agentic Memory: [complexity] (4 sprints)

Ready to begin development? [Y/N]
```
