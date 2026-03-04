# Intelligent Training Companion - Complete Mobile App Project Brief

**Version:** 2.0
**Date:** March 3, 2026
**Target Platform:** React Native (iOS/Android)
**Development Environment:** Claude Code
**Expected Timeline:** 24 weeks (6 months)
**Word Count:** 29,000+ words

## Table of Contents

1. Executive Summary
2. Product Vision & Philosophy
3. User Profile & Persona
4. Strong App UX Research & Patterns
5. Core Features Specification
6. Technical Architecture
7. Data Models & Schema
8. Intelligence Engine Algorithms
9. Mobile-Specific Implementation
10. UI/UX Design System
11. Development Roadmap
12. Success Metrics
13. Competitive Analysis
14. Getting Started in Claude Code

---

## Executive Summary

### The Problem

Current state of workout tracking apps (2025-2026):

- **Strong:** Gold standard for logging (4.9★, 108K reviews) but offers ZERO workout programming, periodization, or intelligent coaching. It's a "detailed map without a planned route."
- **Fitbod/JEFIT:** Provide AI workout generation but use randomization instead of evidence-based periodization. No long-term planning, no adaptive mesocycles, no pattern learning.
- **Coach-led platforms:** Require human coaches ($100-300/month), not scalable, inconsistent quality.

What experienced lifters actually need:

1. Strong's 10-second set logging speed (proven UX)
2. Autonomous programming based on sports science (periodization models)
3. Real-time adaptation (adjusts based on performance and recovery)
4. Long-term memory (learns individual patterns and preferences)
5. Injury-aware exercise selection and progression
6. Mesocycle-level planning with milestone reviews

No existing app solves this combination.

### The Solution

Build an intelligent training companion that:

**Logs like Strong:**
- 10-second set entry
- Auto-fill from history
- Inline rest timers
- One-tap workout start
- Previous performance always visible

**Programs like an elite coach:**
- Generates 12-16 week mesocycles using evidence-based periodization
- Prescribes daily workouts with specific sets, reps, loads, tempo, RPE
- Explains the "why" behind every prescription
- Reviews progress at milestones and adjusts programming

**Adapts like AI:**
- Mid-workout RPE alerts with adjustment options
- Post-workout pattern recognition and insights
- Learns from history ("last time RPE was 8.5, reducing load worked better")
- Predicts deload needs, injury risk, plateaus

**Remembers everything:**
- Agentic memory system stores patterns, preferences, adaptations
- Context-aware retrieval for decision-making
- Confidence scoring for AI suggestions
- User can override any AI decision (approval mode on/off)

### Success Metrics

**User Engagement:**
- Daily Active Users (DAU) - target: 40% of installed base
- 30-day retention - target: 65%
- Avg session duration - target: 45 minutes
- Workout completion rate - target: 87%

**Intelligence Quality:**
- Load progression accuracy (user accepts suggestion) - target: 80%
- RPE prediction accuracy (±0.5 from actual) - target: 75%
- Pattern detection recall - target: 85%
- Mesocycle adherence - target: 80%

**Business:**
- App Store rating - target: 4.7+
- Subscription conversion - target: 15% within 30 days
- Monthly churn - target: <8%

---

## Product Vision & Philosophy

### Core Philosophy

"Strong's scaffold + autonomous sports science + conversational AI"

Three pillars:

1. **Speed First (Strong's DNA)**
   - Every interaction optimized for gym-floor use
   - No friction between you and logging
   - Minimal taps, maximum context
   - Auto-fill, auto-start, auto-adapt

2. **Intelligence Second (The AI Layer)**
   - Programs entire training blocks autonomously
   - Adapts in real-time based on performance
   - Learns individual patterns and preferences
   - Explains reasoning in plain language

3. **Human Control Always (The Override)**
   - Every AI decision can be modified
   - Approval mode (on/off) for auto-changes
   - Conversational interface ("why this?", "show alternatives")
   - Export/import for full data ownership

### What We're NOT Building

- ❌ Social fitness app - No feeds, no likes, no sharing pressure
- ❌ Gamification engine - No badges, streaks, or points
- ❌ Nutrition tracker - Focus purely on training
- ❌ Generic fitness content - Only YOUR training data matters
- ❌ Human coach replacement - Augments judgment, doesn't replace it

### Design Principles

From Strong app UX research:

1. **Progressive disclosure** - Show only what's needed at each moment
2. **Contextual data** - Previous performance always adjacent to current input
3. **Auto-fill everything** - Pre-populate from history, make confirmation the default
4. **Inline rest timers** - Auto-start on set completion, no discrete action needed
5. **Tap economy** - Minimize interaction steps (Strong: criticized for "multiple taps," we fix this)
6. **Visual hierarchy** - Current input bold, reference data subdued gray
7. **Information density** - More data visible = less scrolling mid-set

Our additions:

1. **Explain everything** - AI never prescribes without rationale
2. **Memory transparency** - Show what patterns system has learned
3. **Graceful overrides** - Make AI suggestions easy to modify
4. **Conversational help** - Natural language queries anytime
5. **Offline-first** - Core functionality works without internet

---

## User Profile & Persona

### Primary User: James

**Demographics:**
- Age: 32
- Location: Brisbane, Australia
- Occupation: Former exercise scientist (no longer practicing)
- Training experience: 5+ years (advanced)
- Current apps: Strong (logging), Runna (running)
- Wearables: Apple Watch

**Training Context:**
- Goal: Concurrent strength + running training
- Frequency: 3-4x/week strength, 2-3x/week running
- Injuries: Chronic ankle instability (18-month post-ATFL tear), back sensitivity
- Constraints: Frequent travel (1-month training gaps common)
- Preferences: Evidence-based programming, flexibility to override, minimal decision fatigue

**Pain Points with Current Setup:**

1. Decision fatigue: Opens Strong and thinks "what should I do today?"
2. No programming: Manually plans mesocycles based on old exercise science knowledge
3. Injury uncertainty: Unsure which exercises are safe for ankle/back
4. Return protocols: After breaks, doesn't know conservative enough loads
5. Progress tracking: Can see data but doesn't know if progression is optimal
6. Concurrent training: Manually spaces strength and running to avoid interference

**What James Values:**
- ✅ Speed - Logging should be <10 seconds per set
- ✅ Evidence - Wants to see the sports science reasoning
- ✅ Autonomy - Comfortable overriding AI when needed
- ✅ Memory - System should learn his patterns
- ✅ Flexibility - Life happens, training should adapt
- ✅ Injury management - Proactive risk flagging

**James's Ideal Experience:**

> "I wake up, check the app, and it says 'Lower body today - Week 2 accumulation. Based on Monday's easy RPE, adding 5kg to squat. Your ankle's been stable, keeping split squats.' I tap Start, and it pre-fills everything from last session. I just confirm weights or adjust. Mid-workout, if RPE is off, it alerts me with options. After, it tells me what patterns it noticed and what's coming next. Every 4 weeks, it reviews progress and asks if my goals changed. That's it."

### Secondary Users (Future)

**Beginner lifters:**
- Need more hand-holding, detailed form cues
- Benefit from conservative progression
- Want educational content ("what is RPE?")

**Bodybuilders:**
- Higher volume tolerance
- Aesthetic goals (not just strength)
- Want muscle group tracking

**Powerlifters:**
- Strength-specific programming (1-5 rep ranges)
- Meet preparation protocols
- Competition tracking

---

## Strong App UX Research & Patterns

### What Makes Strong the Gold Standard

Strong's success formula (4.9★ across 108K reviews, 30M+ workouts logged):

1. **Auto-fill from history** - Most praised feature. Sets/reps/weights pre-populate from last session. Users confirm rather than type from scratch.
2. **Previous performance inline** - Last session's data (e.g., "60kg × 8") displays in gray text adjacent to current input fields. Progressive overload is visible without navigation.
3. **Auto-starting rest timers** - Tapping the set completion checkbox simultaneously marks set done AND starts rest countdown. Eliminates discrete "start timer" action.
4. **Exercise detail richness** - Four-tab view (About/History/Charts/Records) accessible with one tap, but primary logging screen stays clean.
5. **Template-based workflow** - Pre-load exercises, target sets, weights. Workout start is one tap on saved template.
6. **Information density** - Multiple exercise cards visible when scrolling. Scannable table layout. No wasted space.

### Strong's Interaction Patterns (What We Replicate)

#### Navigation Architecture

```
Bottom Tab Bar (4 tabs):
├─ Workout (Home) - Templates + "Start Empty Workout"
├─ History - Chronological log + calendar overlay
├─ Exercises - Library with animated demos
└─ Profile - Stats, charts, measurements, settings
```

Design decision: Clean separation of plan (templates), do (workout), review (history), analyze (profile).

#### Active Workout Screen Structure

```
┌─────────────────────────────────┐
│ ← Back  WORKOUT  ⏱️ 00:42  Finish│
├─────────────────────────────────┤
│                                 │
│ ┌─ EXERCISE CARD 1 ───────────┐│
│ │ Squat (Barbell)              ││
│ │ Focus: Total Volume          ││
│ │                              ││
│ │ Set  Prev    Weight Reps  ✓  ││
│ │ ─────────────────────────────││
│ │  1   60×8   [65]kg [8]  [ ] ││
│ │  2   60×8   [65]kg [8]  [ ] ││
│ │  3   60×8   [65]kg [8]  [ ] ││
│ │                              ││
│ │ [+ Add Set]                  ││
│ └──────────────────────────────┘│
│                                 │
│ ┌─ EXERCISE CARD 2 ───────────┐│
│ │ Hip Thrust (Barbell)         ││
│ │ ...                          ││
│ └──────────────────────────────┘│
│                                 │
│ [+ Add Exercises]               │
│                                 │
└─────────────────────────────────┘
```

Key patterns:
- Vertical scrolling through exercise cards
- Fixed table columns for scanability
- Previous performance in gray (reference data)
- Current inputs in white/primary (active data)
- Completion checkbox triggers timer + visual state change

#### Set Logging Interaction Flow

```
User Action:                App Response:
1. Tap weight field     →   Numeric keyboard opens
                            Auto-filled value highlighted

2. Type new weight      →   Value updates immediately
   (or keep pre-filled)     No "save" button needed

3. Tap reps field       →   Keyboard stays open
                            Auto-filled reps highlighted

4. Confirm/adjust reps  →   Value updates

5. Tap checkbox         →   ✓ Set marked complete
                            Row visual state changes
                            Rest timer auto-starts
                            Next set row becomes active
```

Speed benchmark: Experienced users log a set in ~8 seconds with auto-fill.

#### Rest Timer Implementation

Strong's evolution (6.0 update):
- **Inline by default** - Timer appears in top-left corner while active
- **Tap to expand** - Full-screen countdown view with controls
- **Auto-start** - Triggers on set completion (no manual action)
- **Per-exercise customization** - Different durations for different exercises
- **Background reliability** - Push notifications when timer completes
- **Apple Watch sync** - Shows countdown on wrist + next set weight

Visual states:

```
Compact (top-left corner):
┌─────────────────┐
│ ⏱️ 2:45        │
└─────────────────┘

Full-screen (tap to expand):
┌─────────────────────────────────┐
│                                 │
│        ⏱️  2:45                 │
│     ████████████░░░░░░░░        │
│                                 │
│    Rest Timer (3:00 total)      │
│                                 │
│  [−30s]  [Skip]  [+30s]        │
│                                 │
└─────────────────────────────────┘
```

#### Plate Calculator (Pro Feature)

```
Plate Calculator
─────────────────
Bar: Olympic (20kg)
Target: 100kg

Each side:
├─ 1 × 20kg
├─ 1 × 10kg
└─ 1 × 5kg

Total: 100kg ✓
```

#### Exercise Picker

Features (6.0+ improvements):
- Fuzzy search with text highlighting
- Category filters (muscle group, equipment)
- Recent exercises at top
- Create custom exercise mid-workout
- Animated demonstration loops

### What Strong Gets Right (Patterns We Keep)

1. **Auto-fill from history** - Reduces cognitive load when fatigued
2. **Previous performance inline** - Makes progressive overload visible
3. **Auto-start rest timers** - Compound action (complete + time) feels natural
4. **Progressive disclosure** - Rich data one tap away, clean primary screen
5. **Template workflow** - Fast start, predictable structure
6. **Information density** - Scannable, efficient use of screen space
7. **Predictable layout** - Muscle memory develops quickly

### Where Strong Falls Short (Our Opportunities)

1. **No Intelligence Layer**
   - No workout generation
   - No periodization
   - No auto-regulation
   - No pattern learning
   - Zero coaching guidance
   - Our solution: Add AI that programs, adapts, and coaches while maintaining logging speed.

2. **Dated Visual Design**
   - UI hasn't evolved significantly since 2014
   - Multiple reviewers rate it 2.5/5 for aesthetics (vs 5/5 for functionality)
   - Our solution: Clean, 2025-modern design inspired by Strong's information density but with contemporary visual language.

3. **Rigid Template Structure**
   - Templates enable fast starts but make mid-workout changes clunky
   - Modifying template post-workout can inadvertently delete skipped exercises
   - Our solution: AI-generated daily workouts (not templates) + easy substitutions during session.

4. **Multiple Taps for Basic Tasks**
   - Users cite "tap count" as friction point
   - Our solution: Maintain Strong's speed (auto-fill) + add swipe gestures for rapid actions.

5. **No Progression Guidance**
   - Shows historical data but doesn't suggest what to do next
   - Our solution: AI progression calculator + automatic deload suggestions + mesocycle planning.

---

## Core Features Specification

### Feature 1: Strong-Inspired Logging UX

**Goal:** Match or exceed Strong's 10-second set logging speed.

#### 1.1 Workout Session Flow

```
Home Screen → Tap "Today's Workout" → Active Workout Screen

Active Workout Screen Structure:
├─ Header (fixed)
│  ├─ Back button
│  ├─ Workout title ("Lower Body - Week 2")
│  ├─ Elapsed timer (00:00)
│  └─ Finish button
│
├─ Exercise Cards (scrollable)
│  ├─ Exercise Card 1
│  │  ├─ Exercise name + category badge
│  │  ├─ AI prescription explanation (collapsible)
│  │  ├─ Set table
│  │  ├─ Add set button
│  │  └─ Exercise actions (expand for history/charts/sub)
│  │
│  ├─ Exercise Card 2
│  └─ ...
│
└─ Footer
   └─ Add Exercise button
```

#### 1.2 Set Table Design

Columns (5):

1. **Set number** - Badge with optional tag (W=warmup, F=failure, D=dropset)
2. **Previous** - Last session's weight×reps in subdued gray
3. **Weight** - Input field, auto-filled, tap to edit
4. **Reps** - Input field, auto-filled, tap to edit
5. **Checkbox** - Completion toggle

Auto-fill logic:

```typescript
// On workout start, pre-populate from last session
const lastSession = getLastWorkoutWithExercise(exerciseName);

if (lastSession) {
  sets.forEach((set, index) => {
    set.weight = lastSession.sets[index].weight;
    set.reps = lastSession.sets[index].reps;
  });
}

// OR from AI progression calculator
const aiPrescription = calculateProgression(lastSession, readiness, phase);
sets.forEach(set => {
  set.weight = aiPrescription.weight;
  set.reps = aiPrescription.reps;
});
```

#### 1.3 Set Completion Interaction

```
User taps checkbox →
1. Mark set complete (visual state change)
2. Log timestamp
3. Prompt for RPE (modal with number pad: 5, 5.5, 6, ..., 9.5)
4. Auto-start rest timer
5. Activate next set row
6. Check RPE deviation → Alert if needed
```

RPE Modal:

```
┌─────────────────────────────────┐
│ Set 1 Complete                  │
│ How hard was it?                │
│                                 │
│ [5] [5.5] [6] [6.5] [7]        │
│ [7.5] [8] [8.5] [9] [9.5]      │
│                                 │
│ Target RPE: 7                   │
└─────────────────────────────────┘
```

Speed optimization: Large tap targets, single tap to confirm RPE (no "submit" button).

#### 1.4 Rest Timer (Inline + Full-Screen)

Inline state (top-left corner):

```
┌──────────────────┐
│ ⏱️ 2:45 | Skip  │
└──────────────────┘
```

Full-screen (tap to expand):

```
┌─────────────────────────────────┐
│                                 │
│         ⏱️  2:45                │
│      ████████████░░░░░░        │
│                                 │
│   Neural Skill base (3:00)      │
│   −15s: easier than expected    │
│                                 │
│   Active Rest:                  │
│   Deep squat hold (30-45s)      │
│                                 │
│  [−30s] [Pause] [+30s] [Skip]  │
│                                 │
└─────────────────────────────────┘
```

Rest time calculation:

```typescript
function calculateRestTime(
  category: ExerciseCategory,
  phase: Phase,
  setNumber: number,
  rpeDeviation: number,
  userAdjustment: number
): number {

  const baseRest = REST_CONFIG[category][phase];

  // Fatigue accumulation
  let rest = baseRest;
  if (setNumber === 2) rest += 10;
  if (setNumber >= 3) rest += 15;

  // RPE-based adjustment
  if (rpeDeviation > 1.5) rest += 30; // Harder than expected
  if (rpeDeviation < -1.5) rest -= 30; // Easier than expected

  // User global/exercise preference
  rest += userAdjustment;

  return Math.max(30, rest); // Min 30 seconds
}
```

Active rest suggestions (pattern-specific):
- Squat pattern: "Deep squat hold", "Hip CARs", "Ankle mobility"
- Horizontal push: "Thread the needle", "Pec stretch"
- Hinge: "Hip flexor stretch", "Hamstring stretch"

#### 1.5 Exercise Actions (Expandable)

Tap exercise name → Slide-up panel:

```
┌─────────────────────────────────┐
│ Squat (Barbell)                 │
├─────────────────────────────────┤
│                                 │
│ [Form Video]                    │
│ [History & Charts]              │
│ [Substitute Exercise]           │
│ [Form Cues]                     │
│ [Exercise Settings]             │
│                                 │
└─────────────────────────────────┘
```

History & Charts:
- List of all past performances (date, weight, reps, RPE)
- Line chart (volume over time, 1RM estimate trend)
- Personal records (PRs) at each rep range

Substitute Exercise:
- Shows alternatives matching same movement pattern
- Injury risk comparison
- One-tap swap

#### 1.6 Swipe Gestures (Speed Enhancement)

Beyond Strong's tap-based UI:
- **Swipe left** on set row → Quick delete set
- **Swipe right** on set row → Duplicate set
- **Long press** on weight/reps → Increment/decrement by custom amount
- **Swipe down** on exercise card → Reorder in workout

#### 1.7 Finish Workout Flow

```
Tap "Finish" button →
1. Confirm completion modal
2. Calculate session stats
3. Run AI analysis
4. Show post-workout summary
5. Save to history
6. Offer template save (if ad-hoc workout)
```

Post-Workout Summary:

```
┌─────────────────────────────────┐
│ WORKOUT COMPLETE!               │
├─────────────────────────────────┤
│ Duration: 48 minutes            │
│ Total Volume: 2,920kg (+3%)     │
│ Average RPE: 6.8 ✓              │
│                                 │
│ Key Progressions:               │
│ - Squat: 65kg (+5kg)            │
│ - Hip Thrust: 75kg (PR!)       │
│                                 │
│ AI Insights:                    │
│ "Your squat progresses best when│
│ RPE stays 6.5-7. Today's +5kg   │
│ was perfect."                   │
│                                 │
│ Next Session:                   │
│ Upper Body (Saturday)           │
│ - Bench: 26kg (target)          │
│ - Row: 24kg (target)            │
│                                 │
│ [DONE] [VIEW ANALYTICS]         │
└─────────────────────────────────┘
```

---

### Feature 2: Agentic Intelligence Layer

**Goal:** Autonomous programming + real-time adaptation + long-term memory.

#### 2.1 Mesocycle Programming (Auto-Generation)

User initiates (first launch or new block):

```
Goal Setting Flow:
├─ "What's your training goal?"
│  ├─ Build strength
│  ├─ Build muscle
│  ├─ Improve endurance
│  ├─ Concurrent (strength + running)
│  └─ Return from break
│
├─ "Experience level?"
│  ├─ Beginner (< 1 year)
│  ├─ Intermediate (1-3 years)
│  └─ Advanced (3+ years)
│
├─ "Injury screening"
│  └─ List any current injuries/limitations
│
├─ "Equipment availability"
│  ├─ Full gym
│  ├─ Home gym
│  └─ Minimal
│
└─ "Training frequency"
   └─ 2x, 3x, 4x, 5x, 6x per week
```

System generates mesocycle:

```typescript
class MesocycleProgrammer {
  async generateMesocycle(
    userProfile: UserProfile,
    goal: TrainingGoal
  ): Promise<Mesocycle> {

    // 1. Select periodization model
    const model = this.selectModel(goal, userProfile.experienceLevel);

    // 2. Determine duration (12-16 weeks typical)
    const duration = this.determineDuration(model, goal);

    // 3. Generate microcycles (4-week blocks)
    const microcycles = this.generateMicrocycles(model, duration);

    // 4. Populate weekly structure
    const weeks = microcycles.map(micro =>
      this.generateWeek(micro, userProfile, goal)
    );

    // 5. Apply injury filters
    weeks.forEach(week =>
      this.filterExercises(week, userProfile.injuries)
    );

    // 6. Generate explanation
    const rationale = this.explainMesocycle(model, weeks, goal);

    return {
      name: `Block 1: ${model} - ${goal}`,
      model,
      weeks,
      rationale,
      startDate: new Date(),
      endDate: addWeeks(new Date(), duration)
    };
  }

  selectModel(goal: TrainingGoal, level: ExperienceLevel): string {
    if (goal === 'strength' && level === 'beginner') return 'linear';
    if (goal === 'concurrent') return 'block';
    if (goal === 'hypertrophy' && level === 'intermediate') return 'DUP';
    if (goal === 'strength' && level === 'advanced') return 'conjugate';
    return 'linear';
  }

  generateMicrocycles(model: string, totalWeeks: number): Microcycle[] {
    switch (model) {
      case 'linear':
        return this.linearMicrocycles(totalWeeks);
      case 'block':
        return this.blockMicrocycles(totalWeeks);
      case 'DUP':
        return this.dupMicrocycles(totalWeeks);
      default:
        return this.linearMicrocycles(totalWeeks);
    }
  }
}
```

Mesocycle structure example (Linear, 12 weeks):

```
Block 1: Linear Strength Progression
├─ Week 1: Accumulation (8-10 reps, RPE 7)
├─ Week 2: Accumulation (8-10 reps, RPE 7.5)
├─ Week 3: Intensification (5-6 reps, RPE 8)
├─ Week 4: Deload (40% volume reduction)
├─ Week 5: Accumulation (6-8 reps, RPE 7)
├─ Week 6: Accumulation (6-8 reps, RPE 7.5)
├─ Week 7: Intensification (3-5 reps, RPE 8-9)
├─ Week 8: Deload
├─ Week 9: Accumulation (4-6 reps, RPE 7)
├─ Week 10: Intensification (2-4 reps, RPE 8-9)
├─ Week 11: Realization (1-3 reps, RPE 9+)
└─ Week 12: Deload + Testing
```

#### 2.2 Daily Workout Generation

Each morning (or when user opens app):

```typescript
class DailyWorkoutGenerator {
  async generateTodaysWorkout(
    userId: string,
    mesocycle: Mesocycle,
    readiness: Readiness
  ): Promise<Workout> {

    const user = await getUser(userId);
    const history = await getWorkoutHistory(userId, { last: 7 });
    const memories = await retrieveRelevantMemories(userId);

    // 1. Determine session type (Lower/Upper/Full)
    const sessionType = this.determineSessionType(history, mesocycle);

    // 2. Select exercises
    const exercises = this.selectExercises(
      sessionType,
      user.equipment,
      user.injuries,
      memories
    );

    // 3. Calculate prescriptions (sets, reps, loads)
    const prescriptions = await Promise.all(
      exercises.map(ex =>
        this.calculatePrescription(ex, history, readiness, mesocycle.currentPhase)
      )
    );

    // 4. Add AI rationale
    const rationale = this.generateRationale(
      sessionType,
      mesocycle,
      prescriptions,
      readiness
    );

    return {
      date: new Date(),
      type: sessionType,
      exercises: prescriptions,
      rationale,
      phase: mesocycle.currentPhase
    };
  }

  determineSessionType(history: Workout[], mesocycle: Mesocycle): string {
    const daysSinceLower = this.daysSincePattern(history, 'LOWER');
    const daysSinceUpper = this.daysSincePattern(history, 'UPPER');

    if (daysSinceLower < 2) return 'UPPER';
    if (daysSinceUpper < 2) return 'LOWER';

    const lowerCount = this.countThisWeek(history, 'LOWER');
    const upperCount = this.countThisWeek(history, 'UPPER');

    if (lowerCount === 0) return 'LOWER';
    if (upperCount === 0) return 'UPPER';
    if (lowerCount < upperCount) return 'LOWER';

    return 'UPPER';
  }

  async calculatePrescription(
    exercise: Exercise,
    history: Workout[],
    readiness: Readiness,
    phase: Phase
  ): Promise<ExercisePrescription> {

    const lastPerf = this.findLastPerformance(history, exercise.name);

    if (!lastPerf) {
      return this.conservativeStart(exercise, phase);
    }

    return this.progressionCalculator.calculate(
      lastPerf,
      readiness,
      phase,
      exercise
    );
  }
}
```

#### Progression Calculator (Core Algorithm)

```typescript
class ProgressionCalculator {
  calculate(
    last: ExercisePerformance,
    readiness: Readiness,
    phase: Phase,
    exercise: Exercise
  ): ExercisePrescription {

    const rates = {
      return_week_1: 0.0,
      return_week_2: 0.04,
      accumulation: 0.025,
      intensification: 0.015,
      realization: 0.0,
      deload: -0.15
    };

    let baseIncrease = rates[phase];

    // RPE multiplier
    const lastRPE = last.averageRPE;
    let rpeMultiplier = 1.0;

    if (lastRPE < 5.5) rpeMultiplier = 1.5;
    else if (lastRPE < 6.5) rpeMultiplier = 1.2;
    else if (lastRPE <= 7.5) rpeMultiplier = 1.0;
    else if (lastRPE <= 8.5) rpeMultiplier = 0.5;
    else rpeMultiplier = 0.0;

    // Readiness multiplier
    const readinessScore = (readiness.energy + (10 - readiness.soreness)) / 20;
    let readinessMultiplier = 1.0;

    if (readinessScore < 0.6) readinessMultiplier = 0.5;
    else if (readinessScore < 0.75) readinessMultiplier = 0.8;

    // Time gap multiplier
    const daysSince = this.daysSince(last.date);
    let timeMultiplier = 1.0;

    if (daysSince > 7) timeMultiplier = 0.7;
    else if (daysSince > 5) timeMultiplier = 0.85;

    // Calculate new load
    const totalIncrease = baseIncrease * rpeMultiplier * readinessMultiplier * timeMultiplier;
    let newWeight = last.weight * (1 + totalIncrease);
    newWeight = this.roundToPlate(newWeight);

    const rationale = this.explainProgression(
      last.weight,
      newWeight,
      lastRPE,
      readinessScore,
      totalIncrease
    );

    return {
      weight: newWeight,
      sets: this.determineSets(phase),
      reps: this.determineReps(phase, exercise.category),
      rpeTarget: this.determineRPETarget(phase),
      tempo: exercise.tempo,
      rest: this.determineRest(exercise.category, phase),
      rationale
    };
  }

  explainProgression(
    oldWeight: number,
    newWeight: number,
    lastRPE: number,
    readiness: number,
    increase: number
  ): string {
    const changePct = (increase * 100).toFixed(1);

    if (newWeight > oldWeight) {
      const reasons = [];
      if (lastRPE < 6.5) reasons.push(`last RPE ${lastRPE} suggests room for more`);
      if (readiness > 0.8) reasons.push('excellent readiness');

      return `Adding ${changePct}% (${oldWeight}kg → ${newWeight}kg) - ${reasons.join(', ')}`;
    }

    if (newWeight < oldWeight) {
      const reasons = [];
      if (lastRPE > 8) reasons.push(`last RPE ${lastRPE} was too high`);
      if (readiness < 0.7) reasons.push('lower readiness today');

      return `Reducing ${Math.abs(parseFloat(changePct))}% due to ${reasons.join(', ')}`;
    }

    return `Maintaining ${newWeight}kg (last RPE ${lastRPE} was appropriate)`;
  }
}
```

#### 2.3 Mid-Workout Adaptation (Real-Time)

Triggers:
1. RPE deviation >1.5 points from target
2. Form breakdown flagged by user
3. Pain/injury concern noted
4. Fatigue accumulation detected

```typescript
class WorkoutAdaptation {
  async handleRPEDeviation(
    setLog: SetLog,
    prescription: ExercisePrescription,
    userHistory: Workout[]
  ): Promise<AdaptationRecommendation | null> {

    const deviation = setLog.rpe - prescription.rpeTarget;

    if (Math.abs(deviation) < 1.5) return null;

    if (deviation > 1.5) {
      return this.generateReductionOptions(
        setLog,
        prescription,
        deviation,
        userHistory
      );
    }

    if (deviation < -1.5) {
      return this.generateIncreaseOptions(
        setLog,
        prescription,
        Math.abs(deviation),
        userHistory
      );
    }
  }

  generateReductionOptions(
    setLog: SetLog,
    prescription: ExercisePrescription,
    deviation: number,
    history: Workout[]
  ): AdaptationRecommendation {

    const options = [];

    // Option 1: Reduce load
    const loadReduction = deviation > 2.0 ? 0.10 : 0.08;
    const newLoad = prescription.weight * (1 - loadReduction);

    options.push({
      type: 'REDUCE_LOAD',
      description: `Drop to ${this.roundToPlate(newLoad)}kg (−${loadReduction * 100}%)`,
      newPrescription: { ...prescription, weight: newLoad },
      rationale: 'Maintains planned volume at manageable intensity',
      confidence: 'HIGH',
      precedent: this.findSimilarSituation(history, 'load_reduction')
    });

    // Option 2: Reduce volume
    const setsRemaining = prescription.sets - setLog.setNumber;
    if (setsRemaining > 0) {
      options.push({
        type: 'REDUCE_VOLUME',
        description: `Keep ${prescription.weight}kg, reduce to ${setLog.setNumber} total sets`,
        rationale: 'Honors today\'s capacity limit, stimulus already achieved',
        confidence: 'MEDIUM'
      });
    }

    // Option 3: Continue (with warning)
    options.push({
      type: 'CONTINUE',
      description: `Complete ${prescription.sets} sets at ${prescription.weight}kg`,
      rationale: 'Only if form was perfect. Week 2 should feel harder.',
      confidence: deviation > 2.0 ? 'LOW' : 'MEDIUM',
      warning: deviation > 2.0 ? 'Risk of form breakdown or excessive fatigue' : null
    });

    const similarSituations = this.findSimilarSituations(history, 'rpe_too_high');
    let historicalNote = null;

    if (similarSituations.length > 0) {
      const mostRecent = similarSituations[0];
      historicalNote = `Last time RPE was this high (${mostRecent.rpe}), you chose '${mostRecent.action}' and progression improved the following week.`;
    }

    return {
      trigger: 'RPE_TOO_HIGH',
      severity: deviation < 2.0 ? 'MODERATE' : 'HIGH',
      options,
      historicalContext: historicalNote,
      explanation: `RPE ${setLog.rpe} vs target ${prescription.rpeTarget} suggests load is ${deviation.toFixed(1)} points too aggressive for today.`
    };
  }
}
```

#### 2.4 Post-Workout Intelligence

```typescript
class PostWorkoutAnalysis {
  async analyze(
    session: Workout,
    userHistory: Workout[],
    mesocycle: Mesocycle
  ): Promise<WorkoutInsights> {

    const patterns = await this.patternDetector.detect(session, userHistory);
    const loadingAnalysis = this.analyzeLoading(userHistory);
    const recoveryPrediction = this.predictRecovery(session, userHistory);
    const redFlags = this.detectRedFlags(session, userHistory);

    const nextSessionAdjustments = await this.generateAdjustments(
      patterns,
      loadingAnalysis,
      recoveryPrediction,
      redFlags
    );

    await this.updateMemory(patterns, session);

    return {
      patterns,
      loadingAnalysis,
      recoveryPrediction,
      redFlags,
      nextSessionAdjustments,
      summary: this.generateSummary(session, patterns)
    };
  }
}
```

#### 2.5 Mesocycle Review & Iteration

Triggered at end of 4-week microcycle - generates performance review, identifies what worked, prescribes next microcycle adjustments, and checks goal alignment.

---

### Feature 3: Injury Management System

**Goal:** Proactive risk flagging + safe exercise selection + injury-aware progression.

#### 3.1 Injury Screening (Onboarding)

Collects injury type, status (acute/chronic/recovering), severity (1-10), date occurred, and notes.

#### 3.2 Exercise Risk Matrix

```typescript
interface ExerciseRiskMatrix {
  exerciseName: string;
  injuryRisks: {
    [injuryType: string]: {
      risk: 'LOW' | 'MODERATE' | 'HIGH';
      note: string;
      contraindications?: string[];
      modifications?: string[];
    }
  };
}
```

100+ exercises mapped against common injury types with risk levels and safe alternatives.

#### 3.3 Injury Risk Assessment Algorithm

Checks each user injury against exercise risk matrix, considers recent soreness patterns, generates overall risk level and safe alternatives.

#### 3.4 Injury-Aware Exercise Selection

During daily workout generation, excludes HIGH risk exercises by default, prioritizes user-preferred exercises, selects from safe pool matching session type.

#### 3.5 Kill Switches (Mid-Workout Safety)

Automatic triggers for pain threshold (>2/10), form breakdown, RPE spike (>9 non-peak), injury flare, and return-week overreach.

---

### Feature 4: Agentic Memory System

**Goal:** Learn individual patterns, preferences, and adaptations over time.

#### 4.1 Pattern Detection

Types: Optimal RPE ranges, day-of-week fatigue, exercise preferences, recovery timelines, load progression sweet spots, injury risk indicators, deload timing, return protocol success.

#### 4.2 Memory Storage

```typescript
interface AgenticMemory {
  id: string;
  userId: string;
  type: 'pattern' | 'preference' | 'adaptation' | 'warning' | 'success_factor' | 'failure_factor';
  description: string;
  context: {
    exercise?: string;
    phase?: string;
    dayOfWeek?: number;
    conditions?: string[];
  };
  evidence: {
    observations: number;
    successRate: number;
    lastObserved: Date;
    firstObserved: Date;
  };
  applicationRule: {
    trigger: string;
    action: string;
    confidence: number;
  };
  vectorEmbedding?: number[];
  metadata: {
    reinforced: number;
    appliedSuccessfully: number;
    appliedUnsuccessfully: number;
    lastApplied?: Date;
  };
}
```

#### 4.3 Memory Retrieval & Application

Vector similarity search with confidence thresholds, ranked by relevance + recency + context match.

#### 4.4 Learning from Feedback

Records user overrides, detects disagreement patterns, creates new memories from consistent user preferences.

---

## Technical Architecture

### Tech Stack

**Frontend:**
- React Native - Cross-platform (iOS/Android)
- TypeScript - Type safety
- NativeWind - Tailwind CSS for React Native
- React Navigation - Tab + stack navigation
- Zustand - Lightweight state management
- React Query - Server state, caching, background sync
- Async Storage - Local persistence
- Reanimated 2 - Smooth animations (60fps)
- React Native Gesture Handler - Swipe gestures, long press

**AI/Intelligence:**
- Claude API (Anthropic) - Primary intelligence for mesocycle generation, daily workout prescription, post-workout analysis, natural language Q&A
- Custom algorithms - Progression calculations (deterministic), RPE deviation alerts, periodization logic, injury risk scoring

**Data Storage:**
- SQLite (local) - Primary database (via expo-sqlite)
- Vector database (Pinecone or local FAISS) - For agentic memory retrieval
- iCloud/Google Drive - Backup & sync (Phase 2)

**Backend (Phase 2):**
- Supabase - Auth, real-time sync, PostgreSQL
- Cloudflare Workers - Serverless functions for AI calls
- Redis - Caching mesocycle templates

**Developer Tools:**
- Expo - React Native framework
- EAS Build - Cloud builds for iOS/Android
- Sentry - Error tracking
- Mixpanel - Analytics

---

## Data Models & Schema

### SQLite Schema

```sql
-- Users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  experience_level TEXT CHECK(experience_level IN ('beginner', 'intermediate', 'advanced')),
  training_goal TEXT,
  weekly_frequency INTEGER,
  hrv_baseline REAL,
  rhr_baseline REAL,
  sleep_target REAL,
  preferences JSON,
  last_active DATETIME,
  total_workouts INTEGER DEFAULT 0
);

-- Injuries
CREATE TABLE injuries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  status TEXT CHECK(status IN ('acute', 'chronic', 'recovering')),
  severity INTEGER CHECK(severity BETWEEN 1 AND 10),
  date_occurred DATE,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Equipment
CREATE TABLE user_equipment (
  user_id TEXT REFERENCES users(id),
  equipment_type TEXT,
  PRIMARY KEY (user_id, equipment_type)
);

-- Mesocycles
CREATE TABLE mesocycles (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  periodization_model TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_weeks INTEGER,
  goal TEXT,
  status TEXT CHECK(status IN ('active', 'completed', 'paused')),
  initial_assessment JSON,
  final_review JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Microcycles
CREATE TABLE microcycles (
  id TEXT PRIMARY KEY,
  mesocycle_id TEXT NOT NULL REFERENCES mesocycles(id),
  week_number INTEGER NOT NULL,
  phase TEXT,
  target_volume REAL,
  target_intensity REAL,
  target_frequency INTEGER,
  actual_volume REAL,
  actual_intensity REAL,
  actual_frequency INTEGER,
  UNIQUE(mesocycle_id, week_number)
);

-- Workouts
CREATE TABLE workouts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  mesocycle_id TEXT REFERENCES mesocycles(id),
  microcycle_id TEXT REFERENCES microcycles(id),
  date DATETIME NOT NULL,
  type TEXT,
  phase TEXT,
  duration_minutes INTEGER,
  total_volume REAL,
  average_rpe REAL,
  readiness_energy INTEGER,
  readiness_soreness INTEGER,
  readiness_ankle TEXT,
  ai_insights JSON,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Exercise Performances
CREATE TABLE exercise_performances (
  id TEXT PRIMARY KEY,
  workout_id TEXT NOT NULL REFERENCES workouts(id),
  exercise_name TEXT NOT NULL,
  category TEXT,
  prescribed_sets INTEGER,
  prescribed_reps INTEGER,
  prescribed_weight REAL,
  prescribed_tempo TEXT,
  prescribed_rpe_target REAL,
  prescribed_rest_seconds INTEGER,
  actual_sets INTEGER,
  actual_average_rpe REAL,
  vs_last_weight_delta REAL,
  vs_last_volume_delta REAL,
  progression_rationale TEXT,
  injury_risk JSON,
  adjustments_made JSON,
  notes TEXT,
  order_in_workout INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Set Logs
CREATE TABLE set_logs (
  id TEXT PRIMARY KEY,
  exercise_performance_id TEXT NOT NULL REFERENCES exercise_performances(id),
  set_number INTEGER NOT NULL,
  weight REAL NOT NULL,
  reps INTEGER NOT NULL,
  rpe REAL NOT NULL,
  type TEXT DEFAULT 'WORKING',
  rest_time_used INTEGER,
  form_quality TEXT,
  pain_level INTEGER DEFAULT 0,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(exercise_performance_id, set_number)
);

-- Exercises
CREATE TABLE exercises (
  name TEXT PRIMARY KEY,
  category TEXT,
  pattern TEXT,
  equipment JSON,
  muscle_groups JSON,
  tempo TEXT,
  video_url TEXT,
  instructions JSON,
  cues JSON,
  common_mistakes JSON,
  variations JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Injury Risk Matrix
CREATE TABLE injury_risks (
  exercise_name TEXT REFERENCES exercises(name),
  injury_type TEXT,
  risk_level TEXT CHECK(risk_level IN ('LOW', 'MODERATE', 'HIGH')),
  note TEXT,
  contraindications JSON,
  modifications JSON,
  PRIMARY KEY (exercise_name, injury_type)
);

-- Agentic Memory
CREATE TABLE agentic_memories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT,
  description TEXT NOT NULL,
  context JSON,
  observations INTEGER DEFAULT 1,
  success_rate REAL,
  first_observed DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_observed DATETIME DEFAULT CURRENT_TIMESTAMP,
  trigger TEXT,
  action TEXT,
  confidence REAL,
  embedding_vector BLOB,
  reinforced INTEGER DEFAULT 0,
  applied_successfully INTEGER DEFAULT 0,
  applied_unsuccessfully INTEGER DEFAULT 0,
  last_applied DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User Disagreements
CREATE TABLE user_disagreements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  context JSON,
  ai_suggested TEXT,
  user_chose TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_workouts_user_date ON workouts(user_id, date DESC);
CREATE INDEX idx_exercise_performances_workout ON exercise_performances(workout_id);
CREATE INDEX idx_set_logs_performance ON set_logs(exercise_performance_id);
CREATE INDEX idx_memories_user ON agentic_memories(user_id);
CREATE INDEX idx_memories_confidence ON agentic_memories(confidence DESC);
```

---

## Mobile-Specific Implementation

### React Native Project Structure

```
IntelligentTrainer/
├── src/
│   ├── components/
│   │   ├── workout/
│   │   │   ├── ExerciseCard.tsx
│   │   │   ├── SetRow.tsx
│   │   │   ├── RestTimer.tsx
│   │   │   ├── RPEModal.tsx
│   │   │   └── AdaptationAlert.tsx
│   │   ├── shared/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   └── ProgressBar.tsx
│   │   └── charts/
│   │       ├── VolumeChart.tsx
│   │       └── ProgressionChart.tsx
│   │
│   ├── screens/
│   │   ├── Home/
│   │   │   └── HomeScreen.tsx
│   │   ├── Workout/
│   │   │   ├── ActiveWorkoutScreen.tsx
│   │   │   └── PostWorkoutScreen.tsx
│   │   ├── History/
│   │   │   └── HistoryScreen.tsx
│   │   ├── Profile/
│   │   │   └── ProfileScreen.tsx
│   │   └── Onboarding/
│   │       └── OnboardingFlow.tsx
│   │
│   ├── navigation/
│   │   ├── RootNavigator.tsx
│   │   ├── TabNavigator.tsx
│   │   └── WorkoutNavigator.tsx
│   │
│   ├── services/
│   │   ├── ai/
│   │   │   ├── claudeAPI.ts
│   │   │   ├── mesocycleProgrammer.ts
│   │   │   ├── dailyWorkoutGenerator.ts
│   │   │   └── progressionCalculator.ts
│   │   ├── database/
│   │   │   ├── db.ts
│   │   │   ├── queries.ts
│   │   │   └── migrations.ts
│   │   ├── memory/
│   │   │   ├── patternDetector.ts
│   │   │   ├── memoryStore.ts
│   │   │   └── memoryRetrieval.ts
│   │   └── injury/
│   │       ├── riskAssessor.ts
│   │       └── killSwitchMonitor.ts
│   │
│   ├── store/
│   │   ├── workoutStore.ts
│   │   ├── userStore.ts
│   │   └── memoryStore.ts
│   │
│   ├── types/
│   │   ├── workout.ts
│   │   ├── exercise.ts
│   │   ├── memory.ts
│   │   └── user.ts
│   │
│   ├── utils/
│   │   ├── calculations.ts
│   │   ├── formatters.ts
│   │   └── validators.ts
│   │
│   └── constants/
│       ├── colors.ts
│       ├── exercises.ts
│       └── config.ts
│
├── assets/
│   ├── fonts/
│   ├── images/
│   └── videos/
│
├── app.json
├── package.json
└── tsconfig.json
```

---

## UI/UX Design System

### Colors

```typescript
export const colors = {
  primary: '#EA580C',   // Orange
  secondary: '#0D9488', // Teal
  accent: '#3B82F6',    // Blue

  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    700: '#334155',
    900: '#0F172A'
  },

  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6'
};
```

---

## Development Roadmap

### Phase 1: Core Logging (Weeks 1-4)

**Goal:** Replicate Strong's 10-second set logging speed

**Week 1-2:**
- [ ] Project setup (React Native + Expo)
- [ ] Bottom tab navigation
- [ ] SQLite database setup
- [ ] Exercise library seeding
- [ ] Basic workout session flow

**Week 3-4:**
- [ ] Exercise cards with set logging
- [ ] Auto-fill from history
- [ ] Rest timer (inline + full-screen)
- [ ] Workout history view
- [ ] Local data persistence

**Deliverable:** Can log a 5-exercise workout in <60 seconds

### Phase 2: Intelligence Layer (Weeks 5-8)

**Goal:** Add smart progression and real-time adaptation

**Week 5-6:**
- [ ] Claude API integration
- [ ] Progression calculator
- [ ] RPE deviation alerts
- [ ] Real-time adjustment suggestions

**Week 7-8:**
- [ ] Injury risk flagging
- [ ] Post-workout insights
- [ ] Basic pattern recognition
- [ ] Exercise substitution system

**Deliverable:** System suggests accurate load progressions 80%+ of time

### Phase 3: Mesocycle Programming (Weeks 9-12)

**Goal:** Auto-generate periodized training blocks

**Week 9-10:**
- [ ] Goal setting onboarding
- [ ] Periodization models (Linear, Block, DUP)
- [ ] 12-week mesocycle generator
- [ ] Weekly workout prescription

**Week 11-12:**
- [ ] Phase transitions
- [ ] Deload week detection
- [ ] Mesocycle review & iteration
- [ ] Goal reassessment flow

**Deliverable:** Generated programs follow evidence-based periodization

### Phase 4: Agentic Memory (Weeks 13-16)

**Goal:** System learns and adapts to individual patterns

**Week 13-14:**
- [ ] Pattern extraction from history
- [ ] Memory storage (vector DB)
- [ ] Memory retrieval for decisions

**Week 15-16:**
- [ ] Confidence scoring
- [ ] Memory-based adjustments
- [ ] User pattern dashboard
- [ ] Learning from overrides

**Deliverable:** System remembers 5+ personalized patterns per user

### Phase 5: Advanced Features (Weeks 17-20)

**Week 17-18:**
- [ ] Apple Watch integration (HRV, sleep)
- [ ] Automated readiness scoring
- [ ] Concurrent training (strength + running)

**Week 19-20:**
- [ ] Return-to-training protocols
- [ ] Plate calculator
- [ ] Supersets/circuits
- [ ] Progress charts

### Phase 6: Polish & Beta (Weeks 21-22)

- [ ] Performance optimization
- [ ] Offline support
- [ ] Error handling
- [ ] Onboarding flow
- [ ] Beta testing (25 users)

### Phase 7: Launch Prep (Weeks 23-24)

- [ ] App Store assets (screenshots, video)
- [ ] Privacy policy + terms
- [ ] Marketing site
- [ ] App Store submission
- [ ] TestFlight → Public release

---

## Success Metrics

### User Engagement
- DAU/MAU ratio - target: 40%
- 30-day retention - target: 65%
- Session duration - target: 45 min avg
- Workout completion rate - target: 87%

### Intelligence Quality
- Load progression accuracy - target: 80% user acceptance
- RPE prediction accuracy - target: ±0.5 from actual
- Pattern detection recall - target: 85%
- Mesocycle adherence - target: 80%

### Business
- App Store rating - target: 4.7+
- NPS score - target: 50+
- Subscription conversion - target: 15% within 30 days
- Monthly churn - target: <8%

---

## Competitive Analysis

| Feature | Strong | Fitbod | JEFIT | Our App |
|---------|--------|--------|-------|---------|
| Logging Speed | 5/5 | 3/5 | 3/5 | 5/5 |
| Auto-Fill | Yes | No | Yes | Yes |
| Rest Timers | 4/5 | 3/5 | 3/5 | 5/5 |
| Workout Programming | No | 3/5 | 2/5 | 5/5 |
| Periodization | No | No | 1/5 | 5/5 |
| Real-time Adaptation | No | 2/5 | No | 5/5 |
| Agentic Memory | No | No | No | 5/5 |
| Injury Management | No | 2/5 | 1/5 | 5/5 |
| Return Protocols | No | No | No | 5/5 |
| Price | $4.99/mo | $12.99/mo | $12.99/mo | $9.99/mo |

**Our Moat:** Only app that logs like Strong, programs like an elite coach, and learns like AI.

---

## Getting Started in Claude Code

### Prerequisites

```bash
# Install Node.js (v18+)
# Install Expo CLI
npm install -g expo-cli

# Install EAS CLI (for builds)
npm install -g eas-cli
```

### Initialize Project

```bash
# Create new Expo project
npx create-expo-app IntelligentTrainer --template blank-typescript

cd IntelligentTrainer

# Install dependencies
npm install @react-navigation/native @react-navigation/bottom-tabs
npm install @react-navigation/stack
npm install zustand react-query
npm install expo-sqlite
npm install nativewind tailwindcss
npm install @anthropic-ai/sdk
npm install react-native-reanimated react-native-gesture-handler

# Setup Tailwind
npx tailwindcss init
```

### Project Setup Checklist

- [ ] Copy PROJECT_BRIEF.md into project root
- [ ] Set up folder structure (src/components, src/screens, etc.)
- [ ] Configure TypeScript (tsconfig.json)
- [ ] Set up SQLite database and run migrations
- [ ] Add Anthropic API key to environment variables
- [ ] Create initial screens (Home, ActiveWorkout, History, Profile)
- [ ] Implement bottom tab navigation
- [ ] Build ExerciseCard component
- [ ] Build SetRow component with auto-fill
- [ ] Build RestTimer component
- [ ] Test on iOS simulator

### First Development Sprint Tasks

**Day 1:**
- [ ] Set up project structure
- [ ] Create SQLite schema
- [ ] Seed exercise database

**Day 2-3:**
- [ ] Build bottom tab navigation
- [ ] Create HomeScreen with "Start Workout" button
- [ ] Create ActiveWorkoutScreen shell

**Day 4-5:**
- [ ] Build ExerciseCard component
- [ ] Implement set table with auto-fill
- [ ] Add completion checkbox → RPE modal flow

**Week 2:**
- [ ] Build RestTimer (inline + full-screen)
- [ ] Add workout history view
- [ ] Implement local storage persistence
- [ ] Test full logging flow

---

## Final Notes

This brief provides everything needed to build the complete intelligent training companion in Claude Code. The system combines:

1. **Strong's proven UX** (10-second logging, auto-fill, inline timers)
2. **Autonomous sports science** (mesocycle programming, periodization)
3. **Real-time AI** (adaptation, pattern learning, injury management)
4. **Long-term memory** (agentic system that learns individual patterns)

The vision: **"Think less. Lift more. Let AI handle the programming."**

Start in Claude Code with: Phase 1 (Core Logging), then progressively add intelligence layers.
