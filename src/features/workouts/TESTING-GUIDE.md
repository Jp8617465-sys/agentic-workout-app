# ActiveWorkoutScreen Refactoring - Testing Guide

## Overview

This document outlines the manual and automated testing strategy for the refactored `ActiveWorkoutScreen` component and its extracted hooks.

## Architecture Changes

### Before Refactoring
- **Size:** 791 lines in single file
- **Complexity:** 9 useState calls, 10+ event handlers, 29+ hook invocations
- **Testability:** Difficult to isolate logic
- **Maintainability:** Hard to reason about data flow

### After Refactoring
- **Size:** 197 lines in main component
- **Structure:** 4 custom hooks + 4 extracted components
- **Testability:** Each hook can be tested in isolation
- **Maintainability:** Clear separation of concerns

## Extracted Components

### 1. `WorkoutHeader.tsx`
- **Responsibility:** Elapsed timer display, back/finish buttons
- **Props:** `elapsed`, `onBack`, `onFinish`
- **Test Coverage:**
  - Timer formats correctly (HH:MM:SS vs MM:SS)
  - Back button triggers navigation alert
  - Finish button shows confirmation dialog

### 2. `ExerciseListContainer.tsx`
- **Responsibility:** Exercise list rendering, empty state
- **Props:** exercises, exerciseMeta, activeField, handlers
- **Test Coverage:**
  - Empty state shows when exercises.length === 0
  - ExerciseCard renders with correct props for each exercise
  - Add exercise button works in both empty and populated states

### 3. `PRBanner.tsx`
- **Responsibility:** Personal record celebration display
- **Props:** `exerciseName` (null to hide)
- **Test Coverage:**
  - Shows when exerciseName is not null
  - Hides when exerciseName is null
  - Displays correct exercise name

### 4. `ModalsOverlay.tsx`
- **Responsibility:** RPE modal and adaptation alert rendering
- **Props:** Modal states, handlers
- **Test Coverage:**
  - RPEModal renders when rpeModalState exists
  - AdaptationAlert renders when adaptationState exists
  - Only one modal visible at a time

## Custom Hooks

### 1. `useNumpadController`
**Purpose:** Manages numpad input state and validation

**Key Behaviors:**
```typescript
// Field selection
handleFieldPress(0, 0, "weight") // Activates numpad for weight field

// Input handling
handleNumpadInput("1")            // Appends "1" to buffer
handleNumpadInput("8")            // Buffer now "18"
handleNumpadInput("5")            // Buffer now "185"

// Decimal support
handleNumpadDecimal()             // Buffer now "185."
handleNumpadInput("5")            // Buffer now "185.5"

// Backspace
handleNumpadBackspace()           // Buffer now "185."
handleNumpadBackspace()           // Buffer now "185"

// Submit
submitValue()                     // Sends final value, clears activeField
```

**Test Cases:**

| Case | Input | Expected Output | Importance |
|------|-------|-----------------|------------|
| Basic Input | Field press → "1" "2" "5" | activeField set, displays "125" | Critical |
| Leading Zero | Field press → "0" "0" "5" | displays "5" (not "005") | High |
| Decimal Weight | "185" → decimal → "5" | displays "185.5" | High |
| Decimal Reps | reps field → decimal | blocked (reps can't have decimals) | Critical |
| Multi-Decimal | "1" → decimal → "." → decimal | only 1 decimal allowed | High |
| Backspace | "185" → backspace | displays "18" | Critical |
| Empty Submit | Field press → submit (no input) | value set to null | Medium |
| Field Switch | Field A → "123" → Field B | Field A buffer cleared, Field B data shows | Critical |

**Integration Points:**
- Calls `onValueChange` callback when digits are entered
- Updates `activeField` state for UI highlighting
- Uses input buffer to allow editing before commit

**Manual Testing:**
1. Open active workout
2. Tap a weight field → numpad should appear, showing current value
3. Enter "225" → field updates to 225 in real-time
4. Tap decimal → shows "225."
5. Continue typing "5" → shows "225.5"
6. Tap backspace twice → shows "225"
7. Tap another field → buffer clears, shows new field's value
8. Close numpad (tap outside) → value is submitted

### 2. `useExerciseManager`
**Purpose:** CRUD operations on exercises and sets

**Key Behaviors:**
```typescript
// Add set
handleAddSet(0)
// Adds new set at end with:
// - Incremented setNumber
// - Inherited weight from previous set
// - RPE/reps null initially
// - isCompleted = false

// Delete set
handleDeleteSet(0, 1)
// Removes set and renumbers remaining sets

// Duplicate set
handleDuplicateSet(0, 0)
// Creates copy with new ID, incremented setNumber

// Update field
updateExerciseSet(0, 0, "weight", 195)
// Updates single field, maintains other fields
```

**Test Cases:**

| Case | Action | Expected Result | Importance |
|------|--------|-----------------|------------|
| Add Set | Exercise 0 has 2 sets → addSet | Now has 3 sets, set 3 numbered correctly | Critical |
| Inherit Weight | Set 1 weight 185 → add set | Set 2 weight also 185 | High |
| Delete Middle | 3 sets, delete set 2 | Remaining sets renumbered 1,2 | Critical |
| Duplicate | Set 1 (w:185, r:5) → duplicate | Set 2 identical but id:null, isCompleted:false | High |
| Update Field | Set 1 weight 185 → update to 195 | Weight is 195, other fields unchanged | Critical |
| Multiple Updates | Update weight, reps, rpe sequentially | All updates apply correctly | Medium |

**Integration Points:**
- Manages `WorkoutExercise[]` state
- Persists changes through `setExercises` callback
- Coordinates with `useSetLogger` for completion tracking

**Manual Testing:**
1. Add exercise → appears in list
2. Add set → new set appears with inherited weight
3. Modify weight in numpad → set row updates
4. Tap checkmark → set marked complete
5. Duplicate set → identical set appears below
6. Delete set → set removed, others renumbered
7. Finish workout → all changes persisted

### 3. `useSetLogger`
**Purpose:** Coordinates with WorkoutEngine to log completed sets

**Key Behaviors:**
```typescript
// Toggle completion
handleToggleComplete(0, 0)
// - Marks set as isCompleted
// - Calls WorkoutEngine.logSet
// - Shows RPE modal if needed
// - Shows adaptation alert if RPE deviation high
// - Shows PR banner if new PR detected

// Submit RPE
handleRPESubmit(8)
// - Updates RPE in local state
// - Calls WorkoutEngine.updateSetRPE
// - May show adaptation alert
// - May show PR banner
```

**Test Cases:**

| Case | Action | Expected Result | Importance |
|------|--------|-----------------|------------|
| Mark Complete | Set unchecked → toggle → check | Set marked complete, WorkoutEngine called | Critical |
| PR Detection | Log set, result has isNewPR | PR banner shows exercise name | High |
| RPE Modal | shouldShowRPEModal flag set | RPE modal appears | High |
| Adaptation Alert | RPE deviation > threshold | Adaptation alert shows adjustment | Medium |
| RPE Submit | Modal open → enter RPE 8 → submit | RPE persisted, modal closed | Critical |
| Multiple Modals | PR and adaptation both set | Only one shows (adaptation priority) | Medium |

**Integration Points:**
- Reads exercises state
- Calls WorkoutEngine async operations
- Updates exercise state with DB IDs
- Manages modal visibility state

**Manual Testing:**
1. Complete a set → checkmark appears
2. If PR detected → banner shows "New PR — Exercise Name"
3. If RPE modal needed → modal appears after 500ms
4. Enter RPE value → updates set in real-time
5. Close modal → exercises list shows updated RPE
6. If adaptation needed → alert shows adjustment recommendation

### 4. `useWorkoutLifecycle`
**Purpose:** Manages workout initialization, exercise loading, and completion

**Key Behaviors:**
```typescript
// Initialize (resume or new)
initWorkout()
// - Checks for active session in Legend State
// - If found: resume with existing exercises, startedAt
// - If not: create new, set workoutId, startedAt
// - If prescription: load prescribed exercises

// Add prescribed exercise
addPrescribedExercise("Bench Press", 3, 5, 185, 8)
// - Creates exercise performance record
// - Auto-fills sets with history data
// - Appends to exercises list

// Finish
finishWorkout(summary)
// - Saves complete workout data
// - Clears Legend State
// - Resets local state
```

**Test Cases:**

| Case | Action | Expected Result | Importance |
|------|--------|-----------------|------------|
| New Workout | App open → initWorkout | workoutId created, startedAt set, exercises empty | Critical |
| Resume Workout | Session active → initWorkout | workoutId/exercises loaded from session | Critical |
| Add Prescribed | Load prescription → auto-adds exercises | Exercises loaded with correct prescribed values | High |
| Auto-fill | Add exercise with history → sets created | Sets auto-filled from previous performance | Medium |
| Elapsed Timer | startedAt set → 5 seconds pass → elapsed updates | elapsed increases by ~5000ms | Critical |
| Finish | Call finishWorkout → navigation | Session cleared, navigates to PostWorkout | Critical |
| Summary Calc | 3 exercises with mixed completion | Volume/RPE calculated correctly | High |

**Integration Points:**
- Initializes Legend State session
- Syncs exercises to Legend State after changes
- Reads mesocycle/microcycle context
- Integrates with auto-fill history logic

**Manual Testing:**
1. Open ActiveWorkout → timer starts, session initialized
2. Force background/return → exercises should persist
3. Complete sets → observe elapsed timer incrementing
4. Finish workout → should show summary, navigate to PostWorkout

## Visual Regression Testing

### Before/After Screenshots

The refactored screen should be **pixel-identical** to the original:

1. **Empty State**
   - Barbell icon centered
   - "Add exercises to begin" text
   - Blue add button

2. **Exercise List**
   - Exercise cards with prescribed values
   - Set rows with weight/reps/rpe fields
   - Completion checkmarks
   - Add/duplicate/delete buttons

3. **Numpad Active**
   - Numpad appears at bottom
   - Correct field highlighted
   - Decimal button state (enabled for weight/rpe, disabled for reps)

4. **Modals**
   - RPE modal has correct appearance
   - Adaptation alert shows adjustment recommendation
   - PR banner animation smooth

**How to Verify:**
1. Checkout original commit
2. Screenshot app at key states
3. Checkout refactored version
4. Take same screenshots
5. Compare pixel-by-pixel (use diff tool or manual inspection)

## Performance Testing

### Metrics to Monitor

During a simulated 30-minute workout:

| Metric | Target | How to Measure |
|--------|--------|-----------------|
| Timer Jank | 0 frame drops at 60 FPS | React Native Profiler |
| Re-render Count | <5/sec during timer | React DevTools |
| Memory Growth | <5MB over session | Xcode Memory Debugger |
| Numpad Response | <100ms input-to-render | Touch latency logging |
| Exercise Mutations | <100ms add/delete/duplicate | Performance.now() |

### How to Run Performance Tests

1. **Enable React DevTools Profiler**
   ```
   // In ActiveWorkoutScreen
   import { Profiler } from "react";

   <Profiler onRender={(id, phase, actualDuration) => {
     console.log(`${id} (${phase}): ${actualDuration}ms`);
   }}>
     {/* Screen content */}
   </Profiler>
   ```

2. **Monitor with React Native DevTools**
   - Connect debugger
   - Open Performance tab
   - Start workout simulation
   - Record for 2 minutes
   - Analyze frame rate graph

3. **Use Timeline Profiling (Xcode)**
   - Run on device
   - Xcode → Debug → Profile → Core Animation
   - Simulate workout actions
   - Look for green bar consistency

## State Sync Verification

### Legend State ↔ Zustand Sync

**Test Pattern:**
```typescript
// 1. Verify Zustand reads apply to Legend State actions
const defaultRest = useSettingsStore(s => s.defaultRestSeconds); // 180
handleAddSet() // Uses defaultRest from Zustand
// → Set rest timer inherits value

// 2. Verify Legend State changes sync to persistent storage
updateExerciseSet(0, 0, "weight", 195)
workoutSession$.exercises.get() // Should have updated value
// → After sync, DB should have new weight

// 3. Verify no race conditions during simultaneous updates
Promise.all([
  handleToggleComplete(0, 0),  // Updates Legend State + DB
  updateExerciseSet(0, 0, "rpe", 8), // Updates Legend State + display
])
// → Both updates should apply consistently
```

## Testing Checklist

### Pre-Launch Checklist

- [ ] **Functional Testing**
  - [ ] Timer increments correctly
  - [ ] Numpad input works for all field types
  - [ ] Exercises add/remove/duplicate
  - [ ] Sets add/remove/duplicate
  - [ ] Completion tracking works
  - [ ] RPE modal appears when needed
  - [ ] Adaptation alerts show correctly
  - [ ] PR banner displays and auto-hides
  - [ ] Finish workout saves summary

- [ ] **Edge Cases**
  - [ ] Empty exercise list behavior
  - [ ] Rapid numpad input (hold digit)
  - [ ] Field switching with incomplete input
  - [ ] Backspace at empty buffer
  - [ ] Resume after background/kill
  - [ ] Complete all sets vs partial
  - [ ] Network failure during save

- [ ] **Visual Verification**
  - [ ] Screenshot diff shows no regressions
  - [ ] Layout matches original on all screen sizes
  - [ ] Touch targets are ≥44x44pt
  - [ ] Text is readable (contrast, size)
  - [ ] Modals appear on top of content

- [ ] **Performance**
  - [ ] 60 FPS during timer countdown
  - [ ] <100ms numpad input latency
  - [ ] <100ms exercise list mutations
  - [ ] No memory leaks after 30min session
  - [ ] Memoization prevents unnecessary re-renders

- [ ] **Code Quality**
  - [ ] No TypeScript errors
  - [ ] No console warnings
  - [ ] All hooks follow React rules
  - [ ] Callbacks properly memoized
  - [ ] Dependencies arrays complete

## Integration Test Script

Run this manual test sequence to verify all functionality:

```
1. INITIALIZATION
   - Open app
   - Navigate to Start Workout
   - Observe: workoutId generated, timer starts at 00:00

2. ADD EXERCISE
   - Tap "Add Exercise"
   - Select "Barbell Bench Press"
   - Observe: exercise added with prescribed values

3. MODIFY SETS
   - Tap weight field → numpad appears
   - Enter "195"
   - Tap another field → numpad updates
   - Tap reps field → enter "6"
   - Verify: weight=195, reps=6

4. ADD SET
   - Tap "+ Add Set" on exercise
   - Observe: new set with inherited weight

5. COMPLETE SET
   - Tap checkmark on first set
   - Observe: set marked complete, becomes slightly faded

6. RPE INPUT (if modal triggers)
   - Modal appears after set completion
   - Enter RPE "8"
   - Tap "Submit"
   - Verify: RPE saved in set row

7. DUPLICATE SET
   - Tap "..." menu → "Duplicate Set"
   - Observe: identical set appears below

8. DELETE SET
   - Tap "..." menu → "Delete Set"
   - Observe: set removed, renumbered correctly

9. FINISH
   - Tap "Finish" button
   - Confirm in alert
   - Observe: summary calculated, navigation to PostWorkout
   - Verify: Duration, volume, RPE calculated correctly

10. RESUME
    - Return to ActiveWorkout
    - Observe: previous workout resumed with same exercises
```

---

## Implementation Notes

### Why These Hooks?

1. **useNumpadController**: Isolates all input buffering logic, making it testable without UI
2. **useExerciseManager**: Centralizes exercise/set CRUD, easy to verify mutations
3. **useSetLogger**: Coordinates complex workflows (logging, modals, PR detection)
4. **useWorkoutLifecycle**: Manages initialization and completion ceremonies

### Why These Components?

1. **WorkoutHeader**: Pure presentation, stateless
2. **ExerciseListContainer**: List rendering with empty state
3. **PRBanner**: Simple conditional rendering
4. **ModalsOverlay**: Avoids prop drilling for modals

## Future Test Infrastructure

When Jest is configured:

```bash
# Run all hook tests
npm test -- src/features/workouts/hooks

# Watch mode during development
npm test -- --watch

# Coverage report
npm test -- --coverage
```

Expected coverage targets:
- Statements: >90%
- Branches: >85%
- Functions: >90%
- Lines: >90%
