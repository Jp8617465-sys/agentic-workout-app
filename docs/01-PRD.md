# Product Requirements Document
# Intelligent Training Companion

**Version:** 1.0
**Date:** March 3, 2026
**Author:** Requirements Analyst
**Status:** Approved for Development
**Source Brief:** `docs/PROJECT_BRIEF.md` (v2.0, 29,000+ words)

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [User Stories (MoSCoW Prioritized)](#2-user-stories-moscow-prioritized)
3. [Functional Requirements](#3-functional-requirements)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [Feature Dependency Graph](#5-feature-dependency-graph)
6. [MVP Scope Definition](#6-mvp-scope-definition)

---

## 1. Product Overview

The Intelligent Training Companion is a React Native (iOS/Android) mobile application that combines Strong's proven 10-second set logging UX with an AI-powered coaching layer, delivering a product that logs workouts with zero friction, autonomously generates evidence-based 12-16 week mesocycles, adapts prescriptions in real time based on RPE feedback, manages injury risk proactively, and accumulates a persistent agentic memory that learns each user's individual patterns over time. The primary user is an advanced lifter with concurrent strength and running goals, chronic injury history, and frequent travel disruptions who needs a system that eliminates daily programming decisions while preserving complete override authority over every AI recommendation. No existing app combines Strong-level logging speed with autonomous periodization, real-time adaptation, and long-term individual pattern learning, making this the first product to serve experienced self-coached athletes with a true end-to-end intelligent training solution.

---

## 2. User Stories (MoSCoW Prioritized)

### Must Have (v1.0 Launch)

These stories define the minimum experience that differentiates the app from Strong and makes it viable for daily use by the primary persona, James.

**Logging Core**

- US-01: As James, I want to tap a set completion checkbox and have weight/reps auto-filled from my last session so that I spend less than 10 seconds per set on data entry.
- US-02: As James, I want to see my previous session's weight and reps displayed in subdued text beside each current input field so that I always know if I am progressing without navigating away from the logging screen.
- US-03: As James, I want the rest timer to start automatically the moment I mark a set complete so that I never need to take a separate action to begin timing my rest.
- US-04: As James, I want to enter my RPE for each set via a fast modal with large tap targets immediately after marking the set done so that I capture effort data without interrupting my flow.
- US-05: As James, I want to add, delete, and reorder sets within a workout using swipe gestures so that I can modify my plan mid-session without navigating sub-menus.
- US-06: As James, I want to start today's prescribed workout in one tap from the home screen so that I spend zero time deciding what to do.
- US-07: As James, I want offline access to all logging functionality so that I can train in gyms with no connectivity and have my data sync when I reconnect.

**Intelligence Core**

- US-08: As James, I want the system to auto-fill my next set's weight based on my last performance and current readiness rather than a fixed repeat of history so that progression is always calibrated to how I am actually feeling.
- US-09: As James, I want a real-time alert when my logged RPE deviates more than 1.5 points from the prescription, with three concrete options (reduce load, reduce volume, or continue with warning) so that I can make an informed mid-set adjustment rather than guessing.
- US-10: As James, I want a post-workout summary screen that shows key progressions, average RPE, volume change vs last session, and one AI insight about a pattern detected so that I leave every session understanding whether I am on track.
- US-11: As James, I want the system to generate a complete mesocycle (12-16 weeks) based on my goals, experience level, available equipment, training frequency, and injury status during onboarding so that I never need to plan a training block manually again.
- US-12: As James, I want every AI prescription to display a plain-language rationale ("Adding 5kg - last RPE 6.2 suggests room for more") so that I understand and can trust the system's decisions.

**Injury Safety**

- US-13: As James, I want to register my chronic ankle instability and back sensitivity during onboarding so that the system never programs high-risk exercises for my specific injuries without warning me.
- US-14: As James, I want exercises flagged as HIGH risk for my injuries automatically excluded from daily workout generation by default so that I never accidentally program something contraindicated.
- US-15: As James, I want a kill switch that pauses my workout and prompts a safety check if I log a pain level above 2/10 or an RPE above 9 on a non-peak set so that I have a clear moment to decide whether to continue.

**Data Foundation**

- US-16: As James, I want a searchable exercise library with category filters, animated demonstrations, form cues, and substitution suggestions so that I can find and verify any exercise without leaving the app.
- US-17: As James, I want my full workout history stored locally and displayed in a chronological log with calendar overlay so that I can review any past session without an internet connection.
- US-18: As James, I want to log a readiness check-in (energy level 1-10, soreness level 1-10) before each session so that the system can modulate load prescriptions appropriately.

---

### Should Have (v1.1, within 60 days post-launch)

These stories significantly improve the experience but are not blockers for initial release.

- US-19: As James, I want the system to detect when I need a deload week based on accumulated fatigue indicators (RPE trend, volume trend, session completion rate) and proactively insert one before I reach burnout.
- US-20: As James, I want a 4-week mesocycle review conversation that analyzes what worked, what did not, and prescribes the next microcycle with adjustments so that each training block is smarter than the last.
- US-21: As James, I want the agentic memory system to surface historical context during real-time alerts ("Last time RPE was this high on squats, reducing load 8% led to a PR the following week") so that its suggestions are grounded in my personal history.
- US-22: As James, I want to substitute any prescribed exercise mid-workout with one tap and see injury-risk-sorted alternatives matching the same movement pattern so that equipment limitations or flare-ups never derail a session.
- US-23: As James, I want a plate calculator that tells me exactly which plates to load for any target weight given my available bar weight so that I spend zero time doing bar math.
- US-24: As James, I want progress charts for each exercise showing estimated 1RM trend, total volume per session, and personal records by rep range so that I can visualize my long-term development.
- US-25: As James, I want return-to-training protocols automatically applied after any training gap longer than 7 days so that the system conservatively rebuilds volume rather than jumping back to pre-break loads.
- US-26: As James, I want active rest suggestions displayed during the rest timer that are specific to the movement pattern I just completed (e.g., deep squat holds after squats) so that I can use rest periods productively.

---

### Could Have (v2.0, 3-6 months post-launch)

These stories are valuable extensions but require the core intelligence layer to be mature first.

- US-27: As James, I want Apple Watch integration that reads HRV and resting heart rate to automatically generate a readiness score each morning so that I do not need to manually enter readiness before every session.
- US-28: As James, I want the system to understand my concurrent strength and running schedule and space sessions to minimize interference between training modalities so that I never accidentally do heavy lower body work the day after a long run without a warning.
- US-29: As James, I want a conversational AI interface where I can ask questions like "Why is squat load lower this week?" or "What would happen if I skipped Friday's session?" and receive context-aware answers so that I can explore my programming without guessing.
- US-30: As James, I want a user-facing memory dashboard that shows me the patterns the system has learned about my training so that I can verify, correct, or delete any stored assumption.
- US-31: As James, I want full data export in a structured format (JSON/CSV) so that I retain complete ownership of my training history regardless of my subscription status.
- US-32: As James, I want iCloud/Google Drive cloud backup and cross-device sync so that I never lose data when switching devices.
- US-33: As James, I want the system to recognize superset and circuit formats, linking exercises together with appropriate shared rest timing so that high-density training styles are supported.

---

### Won't Have (Out of Scope for v1.x)

These are explicitly excluded to maintain focus and ship velocity.

- US-WN-01: Social features (feeds, sharing, likes, leaderboards) - this is a private training tool, not a social network.
- US-WN-02: Gamification mechanics (badges, streaks, points, achievements) - these undermine intrinsic motivation for advanced athletes.
- US-WN-03: Nutrition tracking or calorie logging - training focus only, food tracking is a separate product category.
- US-WN-04: Generic fitness content, video courses, or article library - only YOUR data matters, not generic content.
- US-WN-05: Human coach marketplace or real-time coaching chat with humans - AI augments judgment, does not simulate coaches.
- US-WN-06: Group training or team features - individual training tool only.
- US-WN-07: Cardio/running session logging within this app - James uses Runna for running; integration is out of scope for v1.

---

## 3. Functional Requirements

Requirements use the following format:

```
ID | Description | Acceptance Criteria | Priority | Dependencies
```

- **Priority:** P0 = launch blocker, P1 = high value v1.0, P2 = v1.1 target
- **IDs:** FR-[FEATURE]-[NUMBER] where features are LOG, INT, INJ, MEM, DATA

---

### 3.1 Feature 1: Strong-Inspired Logging UX

---

**FR-LOG-001: Auto-Fill from History**
- **Description:** When a user starts a workout containing an exercise they have performed before, weight and reps for each set are pre-populated from their most recent performance of that exercise.
- **Acceptance Criteria:**
  - Fields are populated before the first tap on any input field.
  - If AI progression is available, AI values take precedence over raw history repeat.
  - If no history exists, fields are empty with placeholder text.
  - Auto-fill completes in under 200ms from workout screen load.
- **Priority:** P0
- **Dependencies:** FR-DATA-001 (local workout storage), FR-DATA-002 (exercise performance retrieval)

---

**FR-LOG-002: Previous Performance Inline Display**
- **Description:** Each set row displays the corresponding set from the last session (weight x reps) in subdued gray text adjacent to the current input fields at all times during the active workout.
- **Acceptance Criteria:**
  - Previous data visible without any tap or navigation.
  - Text is visually distinct from active input fields (gray, smaller font size).
  - If no previous set at that index exists (e.g., user is adding a 4th set when last session had 3), display dash or "New".
  - Display updates correctly when user swaps exercises mid-workout.
- **Priority:** P0
- **Dependencies:** FR-LOG-001

---

**FR-LOG-003: Set Completion and Automatic Rest Timer**
- **Description:** Tapping the completion checkbox simultaneously marks the set as done, logs the timestamp, opens the RPE modal, and auto-starts the rest timer after RPE is submitted or dismissed.
- **Acceptance Criteria:**
  - All three actions (mark complete, log timestamp, open RPE prompt) happen in one tap.
  - Rest timer starts within 500ms of RPE submission or modal dismissal.
  - Completion is visually reflected immediately (checkbox state, row color change).
  - Timer continues running if user navigates to a different exercise card.
- **Priority:** P0
- **Dependencies:** FR-LOG-004 (RPE modal), FR-LOG-005 (rest timer)

---

**FR-LOG-004: RPE Entry Modal**
- **Description:** A modal with a numeric RPE selector (5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10) appears after set completion. Single tap on a value submits it with no additional confirm button.
- **Acceptance Criteria:**
  - Modal appears within 100ms of set completion tap.
  - All RPE values rendered as large tap targets (minimum 44x44px each).
  - Target RPE for the set is visually highlighted as a reference point.
  - Modal can be dismissed without entering RPE (entry treated as null/unrecorded).
  - Submitted RPE value is immediately visible on the completed set row.
- **Priority:** P0
- **Dependencies:** None

---

**FR-LOG-005: Rest Timer (Inline and Full-Screen)**
- **Description:** An inline rest timer appears in a fixed position (top header area) after each set completion showing remaining time and a skip control. Tapping it expands to a full-screen view with +30s, -30s, pause, and skip controls.
- **Acceptance Criteria:**
  - Inline timer shows MM:SS format with remaining time.
  - Full-screen view shows circular progress arc, total duration, and all controls.
  - Timer runs correctly when app is backgrounded (using background task or push notification).
  - A push notification fires when timer reaches zero if app is in background.
  - Rest duration is calculated using the formula: base rest (by exercise category + phase) + set number adjustment + RPE deviation adjustment + user preference offset.
  - Per-exercise rest duration can be customized by the user.
  - Minimum rest is enforced at 30 seconds.
- **Priority:** P0
- **Dependencies:** FR-LOG-004 (RPE deviation input)

---

**FR-LOG-006: Set Management (Add, Delete, Reorder)**
- **Description:** Users can add a set to any exercise, delete any set row, and reorder sets within an exercise card using gesture interactions.
- **Acceptance Criteria:**
  - Swipe left on a set row reveals a delete action.
  - Swipe right on a set row duplicates the set with the same weight/reps.
  - "Add Set" button appears below the last set row on every exercise card.
  - Long press on a set row enables drag-to-reorder within the card.
  - All set modifications persist immediately to local storage.
- **Priority:** P0
- **Dependencies:** FR-DATA-001

---

**FR-LOG-007: Exercise Card Expandable Actions**
- **Description:** Tapping the exercise name on any card opens a slide-up panel with quick access to form video, exercise history and charts, exercise substitution, form cues, and exercise settings.
- **Acceptance Criteria:**
  - Panel opens within 150ms of tap.
  - History view shows chronological list of past performances with date, weight, reps, RPE.
  - Charts view shows estimated 1RM trend and total volume per session.
  - Form video plays inline (or links to embedded player).
  - Substitution panel filtered by same movement pattern, injury-safe options only shown by default.
- **Priority:** P1
- **Dependencies:** FR-DATA-002, FR-INJ-003

---

**FR-LOG-008: Active Workout Screen Structure**
- **Description:** The active workout screen has a fixed header (back, workout title, elapsed timer, finish button), a scrollable exercise card list, and a fixed footer add-exercises button.
- **Acceptance Criteria:**
  - Elapsed timer counts up from 0:00:00 from workout start.
  - Header and footer remain fixed during exercise card scroll.
  - Screen handles 10+ exercise cards without layout issues.
  - Workout title shows prescribed session type (e.g., "Lower Body - Week 2 Accumulation") when generated from mesocycle.
- **Priority:** P0
- **Dependencies:** None

---

**FR-LOG-009: Finish Workout Flow**
- **Description:** Tapping Finish prompts a confirmation, computes session statistics, triggers AI post-workout analysis, and navigates to the Post-Workout Summary screen.
- **Acceptance Criteria:**
  - Confirmation modal prevents accidental dismissal.
  - Session stats computed: duration, total volume, average RPE, volume delta vs last session, progression count (exercises where weight increased).
  - Post-workout summary renders within 3 seconds (AI analysis may load asynchronously).
  - Workout saved to local storage before navigation (zero data loss on crash after this point).
- **Priority:** P0
- **Dependencies:** FR-INT-006 (post-workout AI analysis), FR-DATA-001

---

**FR-LOG-010: Workout History View**
- **Description:** A scrollable chronological log of all past workouts with a calendar overlay for date navigation.
- **Acceptance Criteria:**
  - Each history entry shows: date, workout type, duration, total volume, number of exercises.
  - Tapping any entry opens a detail view with full exercise and set data.
  - Calendar overlay highlights days with logged workouts.
  - History loads from local storage with no network requirement.
  - Supports 1000+ historical entries without performance degradation.
- **Priority:** P0
- **Dependencies:** FR-DATA-001

---

**FR-LOG-011: Exercise Library**
- **Description:** A searchable library of 100+ exercises with fuzzy search, category and equipment filters, animated demonstrations, form cues, and movement pattern tags.
- **Acceptance Criteria:**
  - Fuzzy search returns relevant results within 100ms of keystroke.
  - Filters: muscle group (primary), equipment type, movement pattern.
  - Recent and frequently-used exercises surfaced at top of default list.
  - User can create a custom exercise mid-workout or from the library screen.
  - Each exercise has: name, category, movement pattern, muscle groups, animated demo GIF or video, form cues, common mistakes, default rest duration.
- **Priority:** P0
- **Dependencies:** FR-DATA-003 (exercise database seeding)

---

**FR-LOG-012: Readiness Check-In**
- **Description:** Before starting each workout session, the app presents a brief readiness check-in capturing energy level (1-10) and soreness level (1-10).
- **Acceptance Criteria:**
  - Check-in modal appears when user taps "Start Workout" or "Start Today's Session."
  - Both sliders or tap-selectors have large interaction targets.
  - Check-in can be skipped; when skipped, system assumes neutral readiness (5/5).
  - Readiness values stored with the workout record and used by the progression calculator.
  - Optional: free-text notes field for additional context.
- **Priority:** P0
- **Dependencies:** FR-INT-002 (progression calculator uses readiness values)

---

**FR-LOG-013: Swipe Gestures for Speed**
- **Description:** Swipe gestures accelerate common actions beyond tap-only interactions.
- **Acceptance Criteria:**
  - Swipe left on set row: reveals delete action.
  - Swipe right on set row: duplicates set with same values.
  - Long press on weight or reps field: enters increment/decrement mode with +2.5kg / -2.5kg controls.
  - Swipe down on exercise card header: initiates reorder mode.
  - Gestures do not conflict with native scroll behavior.
- **Priority:** P1
- **Dependencies:** FR-LOG-006

---

### 3.2 Feature 2: Agentic Intelligence Layer

---

**FR-INT-001: Mesocycle Auto-Generation**
- **Description:** During onboarding (and on user request for a new block), the system generates a complete 12-16 week periodized training plan based on user inputs.
- **Acceptance Criteria:**
  - Onboarding collects: training goal (strength/hypertrophy/concurrent/return from break), experience level (beginner/intermediate/advanced), injuries, equipment availability, and weekly training frequency.
  - System selects appropriate periodization model: linear (beginner strength), block (concurrent training), DUP (intermediate hypertrophy), conjugate (advanced strength).
  - Generated mesocycle includes: name, model, total weeks, week-by-week phase labels (accumulation/intensification/realization/deload), target rep ranges, target RPE zones, and frequency per week.
  - A plain-language rationale explains why this model was selected.
  - Generation completes in under 10 seconds (may use Claude API with loading state).
  - Mesocycle persists locally and can be resumed after app restart.
- **Priority:** P0
- **Dependencies:** FR-INJ-001 (injury screening), FR-DATA-004 (mesocycle storage)

---

**FR-INT-002: Progression Calculator**
- **Description:** For each exercise in each session, the system calculates the recommended weight, sets, reps, tempo, RPE target, and rest duration based on the current mesocycle phase, last performance, and readiness check-in.
- **Acceptance Criteria:**
  - Calculates a base load increase rate by phase: accumulation +2.5%, intensification +1.5%, realization +0%, deload -15%, return week 1 +0%, return week 2 +4%.
  - Applies RPE multiplier from last session: RPE under 5.5 applies 1.5x increase, RPE 6.5-7.5 applies 1.0x, RPE above 8.5 applies 0x.
  - Applies readiness multiplier: readiness below 0.6 applies 0.5x, below 0.75 applies 0.8x, otherwise 1.0x.
  - Applies time-gap multiplier: more than 7 days since last session applies 0.7x.
  - Rounds calculated weight to nearest available plate increment.
  - Every prescription includes a one-sentence plain-language rationale visible on the exercise card.
  - Calculation is deterministic and runs offline without Claude API.
- **Priority:** P0
- **Dependencies:** FR-LOG-012 (readiness input), FR-DATA-002 (last performance retrieval), FR-INT-001 (phase context)

---

**FR-INT-003: Daily Workout Generation**
- **Description:** Each day the app generates the specific workout for that day's position in the mesocycle, selecting exercises, ordering them, and attaching full prescriptions.
- **Acceptance Criteria:**
  - Session type (Lower/Upper/Full) is determined by recency of prior sessions to avoid back-to-back same patterns.
  - Exercises are selected from a pool filtered for: equipment availability, injury safety (no HIGH-risk exercises by default), and movement pattern balance.
  - User-preferred exercises are prioritized within the safe pool.
  - Generated workout is available on the home screen before the user initiates a session.
  - A pre-workout rationale card explains the session goals ("Week 2 accumulation - building volume before next week's intensification").
  - If the user skips a day, the system re-queues the workout for the next available day without losing mesocycle continuity.
- **Priority:** P0
- **Dependencies:** FR-INT-001 (mesocycle), FR-INT-002 (progression calculator), FR-INJ-003 (exercise risk filtering), FR-MEM-003 (memory retrieval for preferences)

---

**FR-INT-004: Mid-Workout RPE Deviation Alerts**
- **Description:** When a logged RPE deviates more than 1.5 points from the set's target RPE, the system immediately presents an adaptation alert with three ranked options.
- **Acceptance Criteria:**
  - Alert triggers within 500ms of RPE submission.
  - Alert displays: trigger description, deviation magnitude, severity level (MODERATE or HIGH), three options ranked by system confidence.
  - Option types available: REDUCE_LOAD (calculated to specific new weight), REDUCE_VOLUME (remove remaining sets), CONTINUE (with warning if deviation is HIGH).
  - Each option includes: description, rationale, confidence level, and historical precedent from the user's memory if one exists.
  - User selection is recorded as a disagreement event if they override the highest-confidence option.
  - Alert also fires when RPE deviation is more than 1.5 below target (too easy), offering load increase or rep increase options.
- **Priority:** P0
- **Dependencies:** FR-LOG-004 (RPE input), FR-INT-002 (prescription target), FR-MEM-002 (historical precedent retrieval)

---

**FR-INT-005: Mid-Workout Kill Switch Triggers**
- **Description:** Automatic safety pauses are triggered when specific thresholds are crossed during a session.
- **Acceptance Criteria:**
  - Triggers: pain log above 2/10, RPE above 9 on non-peak set, form breakdown flag by user, injury flare self-report, return-week overreach detected.
  - Kill switch pauses the workout timer and presents a safety decision screen.
  - Options at kill switch: end workout, substitute the exercise, reduce load and continue, or dismiss and continue.
  - Kill switch events are recorded in session data and feed into memory pattern detection.
- **Priority:** P0
- **Dependencies:** FR-LOG-004, FR-INJ-004

---

**FR-INT-006: Post-Workout AI Analysis**
- **Description:** After each completed session, the system runs analysis to detect patterns, evaluate loading quality, generate insights, and propose next-session adjustments.
- **Acceptance Criteria:**
  - Summary always shows (computed offline): duration, total volume, volume delta vs last session, average RPE, and count of exercises where weight increased.
  - AI insight section (may use Claude API, loads asynchronously within 5 seconds): one pattern observation, one next-session preview (next workout date, one key exercise and target weight).
  - If Claude API is unavailable, deterministic fallback insight is shown (e.g., simple RPE average feedback).
  - "VIEW ANALYTICS" action deep-links to progress charts for the exercises performed.
- **Priority:** P0
- **Dependencies:** FR-DATA-001, FR-MEM-001

---

**FR-INT-007: Deload Week Detection**
- **Description:** The system monitors fatigue indicators across sessions and proactively recommends inserting a deload week when accumulation signals cross thresholds.
- **Acceptance Criteria:**
  - Monitors: average RPE trend across last 3 sessions (upward drift without load increase), workout completion rate drop below 85%, consecutive sessions with RPE above 8 on accumulation phase, user-reported soreness above 7/10 for 3+ consecutive sessions.
  - When threshold crossed: a banner recommendation appears on the home screen proposing deload insertion.
  - User can accept (system auto-adjusts next week's prescribed volume by -40%) or dismiss (reminder re-surfaces in 3 days).
  - Scheduled deloads within the mesocycle override this detection (system deload timing takes precedence).
- **Priority:** P1
- **Dependencies:** FR-INT-001, FR-DATA-002

---

**FR-INT-008: Mesocycle Review (4-Week Check-In)**
- **Description:** At the end of each 4-week microcycle, the system generates a progress review and prescribes the next microcycle with adjustments.
- **Acceptance Criteria:**
  - Review triggered automatically at microcycle end date, accessible from home screen notification or profile.
  - Review content: adherence percentage (sessions completed vs planned), average RPE trend per exercise, exercises that progressed vs stalled, patterns from memory system.
  - Prescribes next microcycle: adjusted rep ranges, volume targets, any exercise swaps.
  - Asks user two questions: "Have your goals changed?" and "Any new injuries or concerns?" and incorporates answers into next block.
  - Full review persists in session history.
- **Priority:** P1
- **Dependencies:** FR-INT-001, FR-MEM-001

---

**FR-INT-009: Return-to-Training Protocol**
- **Description:** When a training gap of 7 or more days is detected, the system applies a conservative return protocol that reduces initial loads and rebuilds volume progressively.
- **Acceptance Criteria:**
  - Gap detection: comparison of last workout date to today's date at session start.
  - Week 1 return: 0% load increase from last pre-gap session, volume at 60% of last session.
  - Week 2 return: +4% progression rate, volume at 80%.
  - Applies to all exercises regardless of mesocycle phase.
  - User is informed of the return protocol with a rationale card at session start.
  - Return protocol ends automatically after 2 weeks; normal progression resumes.
- **Priority:** P1
- **Dependencies:** FR-INT-002, FR-DATA-002

---

### 3.3 Feature 3: Injury Management System

---

**FR-INJ-001: Injury Screening (Onboarding)**
- **Description:** During initial onboarding, users register any active or chronic injuries/limitations with structured metadata.
- **Acceptance Criteria:**
  - Fields per injury: injury type (free text + suggested common types), status (acute/chronic/recovering), severity (1-10 slider), date occurred (optional), affected side (left/right/bilateral), notes.
  - User can add multiple injuries.
  - Pre-populated suggestions include common types: ankle instability, lower back strain, knee pain, shoulder impingement, tennis elbow.
  - Injuries saved to local storage immediately.
  - User can update injury status and severity at any time from the profile screen.
- **Priority:** P0
- **Dependencies:** FR-DATA-005 (injury storage)

---

**FR-INJ-002: Exercise Risk Matrix**
- **Description:** A database mapping 100+ exercises to risk levels for common injury types, with notes on contraindications and available safe modifications.
- **Acceptance Criteria:**
  - Covers at minimum: ankle instability, lower back issues, knee pain, shoulder impingement, wrist issues, hip pain.
  - Risk levels: LOW, MODERATE, HIGH.
  - Each mapping includes: a clinical note explaining the risk, any absolute contraindications, and at least one modification or alternative.
  - Risk matrix is stored locally as part of the exercise database (no network request at runtime).
  - Matrix is versioned and updateable via app update.
- **Priority:** P0
- **Dependencies:** FR-DATA-003 (exercise database)

---

**FR-INJ-003: Real-Time Injury Risk Assessment**
- **Description:** For each exercise in a generated workout, the system evaluates the user's active injuries against the risk matrix and produces an aggregate risk score with actionable output.
- **Acceptance Criteria:**
  - Assessment runs during daily workout generation (offline, deterministic).
  - For each exercise: produces overall risk level (LOW/MODERATE/HIGH), lists each contributing injury with specific risk note, and lists modifications or alternatives if risk is MODERATE or HIGH.
  - HIGH risk exercises excluded from generated workout by default.
  - MODERATE risk exercises included with a visible amber warning badge and modification note on the exercise card.
  - User can override HIGH risk exclusion from exercise settings with an explicit acknowledgment prompt.
- **Priority:** P0
- **Dependencies:** FR-INJ-001, FR-INJ-002, FR-INT-003

---

**FR-INJ-004: Injury-Aware Exercise Substitution**
- **Description:** When a user requests a substitution for any exercise mid-workout, alternatives are filtered by injury safety and sorted by risk level.
- **Acceptance Criteria:**
  - Substitution panel shows: alternatives matching same movement pattern, each with a risk badge (LOW/MODERATE), and a brief rationale for each.
  - HIGH-risk alternatives hidden by default (visible behind "Show all" toggle with disclaimer).
  - One-tap swap replaces the exercise card in the active workout without losing set count.
  - History for the substituted exercise is shown for reference.
- **Priority:** P0
- **Dependencies:** FR-INJ-002, FR-INJ-003

---

**FR-INJ-005: Pain Level Logging**
- **Description:** Users can log a pain level (0-10) alongside any set, distinct from RPE, to track pain responses during exercise.
- **Acceptance Criteria:**
  - Pain field is optional on each set row (accessible via long press or exercise settings, not shown by default to avoid clutter).
  - When pain level above 2 is entered, kill switch (FR-INT-005) is triggered.
  - Pain levels are stored in set_logs and available for pattern analysis.
  - Persistent pain patterns (3+ consecutive sessions with pain > 2 on same exercise) surface a recommendation to update injury status.
- **Priority:** P1
- **Dependencies:** FR-INT-005

---

### 3.4 Feature 4: Agentic Memory System

---

**FR-MEM-001: Pattern Detection and Storage**
- **Description:** After each session, the system analyzes the workout against historical data to detect recurring patterns, storing confirmed patterns as structured memory entries.
- **Acceptance Criteria:**
  - Pattern types detected: optimal RPE ranges per exercise, day-of-week fatigue differentials, exercise preference indicators (substitution history), recovery timelines (RPE normalization after deload), load progression sweet spots, injury risk indicators (pain level patterns), deload timing signals, return protocol success rates.
  - A pattern requires minimum 3 observations before storage.
  - Each stored memory includes: type, description, context (exercise, phase, day of week, conditions), observation count, success rate, first/last observed dates, trigger and application rule, confidence score (0.0-1.0).
  - Patterns with confidence below 0.5 are stored but not applied until confidence increases.
  - Memory storage runs after post-workout analysis, not blocking the summary screen.
- **Priority:** P1
- **Dependencies:** FR-DATA-006 (memory storage), FR-INT-006

---

**FR-MEM-002: Memory Retrieval and Application**
- **Description:** During workout generation, progression calculation, and mid-workout adaptation alerts, relevant memories are retrieved and incorporated into decisions.
- **Acceptance Criteria:**
  - Retrieval uses vector similarity search (if vector DB available) or keyword + context matching (offline fallback).
  - Top 3 relevant memories returned for each decision context, ranked by: confidence (40%), recency (30%), context match (30%).
  - Retrieved memories are applied to modify prescriptions within defined bounds (memories cannot override phase constraints; maximum memory-driven deviation: +/- 15% from calculated base).
  - Memory application is transparent: prescription rationale notes when a memory influenced the calculation.
  - Mid-workout alerts include "Historical context" field showing the most relevant memory if one exists.
- **Priority:** P1
- **Dependencies:** FR-MEM-001, FR-INT-002, FR-INT-004

---

**FR-MEM-003: Learning from User Overrides**
- **Description:** When a user overrides an AI recommendation (chooses a different weight, dismisses an alert, picks a non-recommended option), the system records the disagreement and eventually creates new memories from consistent override patterns.
- **Acceptance Criteria:**
  - Every user-initiated deviation from AI prescription is stored as a disagreement event with context (exercise, phase, AI suggestion, user choice, outcome).
  - After 3 consistent disagreements in the same context, the system proposes a new preference memory for the user to confirm.
  - User can accept, reject, or edit the proposed memory.
  - Accepted preference memories take precedence over general pattern memories when conflict arises.
  - Disagreement events viewable in the memory dashboard.
- **Priority:** P2
- **Dependencies:** FR-MEM-001, FR-MEM-004

---

**FR-MEM-004: Memory Dashboard (User-Facing)**
- **Description:** A screen where users can view, verify, and delete the patterns and preferences the system has learned about their training.
- **Acceptance Criteria:**
  - Lists all stored memories grouped by type (patterns, preferences, warnings, success factors).
  - Each memory shows: description, confidence level, observation count, last applied date.
  - User can delete any memory (requires confirmation).
  - User can manually create a preference memory via free text.
  - Memory count displayed as a metric on the profile screen.
- **Priority:** P2
- **Dependencies:** FR-MEM-001

---

### 3.5 Data Layer Requirements

---

**FR-DATA-001: Local Workout Storage**
- **Description:** All workout, exercise performance, and set log data is persisted in a local SQLite database immediately as it is generated.
- **Acceptance Criteria:**
  - Write occurs synchronously on every set completion (no batch-write on workout finish).
  - Database survives app crash and OS-level kill without data loss.
  - Schema matches the defined tables: workouts, exercise_performances, set_logs.
  - Database migration system handles schema updates via versioned migration files.
  - Supports 10,000+ workout records without query latency exceeding 100ms.
- **Priority:** P0
- **Dependencies:** None

---

**FR-DATA-002: Exercise Performance Retrieval**
- **Description:** Fast, indexed queries for retrieving historical exercise performance data by exercise name, date range, and user ID.
- **Acceptance Criteria:**
  - Query for last performance of an exercise returns within 50ms.
  - Query for full exercise history (all sessions) returns within 200ms for up to 500 sessions.
  - Indexed on: user_id + exercise_name + date.
  - Estimated 1RM calculation (Epley or Brzycki formula) available as a utility function.
- **Priority:** P0
- **Dependencies:** FR-DATA-001

---

**FR-DATA-003: Exercise Database Seeding**
- **Description:** The app ships with a pre-seeded exercise library of 100+ exercises with full metadata, risk matrix mappings, and movement pattern tags.
- **Acceptance Criteria:**
  - Minimum 100 exercises covering: squat, hinge, horizontal push, horizontal pull, vertical push, vertical pull, carry, core, cardio machine categories.
  - Each exercise includes: movement pattern, primary and secondary muscle groups, default tempo, default rest duration, equipment requirements.
  - At least 30 exercises have risk matrix mappings for common injuries.
  - Database seed runs on first launch and does not require network access.
- **Priority:** P0
- **Dependencies:** None

---

**FR-DATA-004: Mesocycle and Microcycle Storage**
- **Description:** Full mesocycle and microcycle structures are persisted locally with status tracking.
- **Acceptance Criteria:**
  - Tables: mesocycles (id, user_id, name, model, start/end dates, goal, status), microcycles (id, mesocycle_id, week_number, phase, target and actual volume/intensity/frequency).
  - Status enum: active, completed, paused.
  - Only one active mesocycle permitted per user at a time.
  - Paused mesocycles retain all data and can be resumed.
- **Priority:** P0
- **Dependencies:** FR-DATA-001

---

**FR-DATA-005: Injury Record Storage**
- **Description:** Injury records are stored locally with full metadata and audit history.
- **Acceptance Criteria:**
  - Table: injuries (id, user_id, type, status, severity, date_occurred, notes, created_at, updated_at).
  - Status changes are timestamped (chronic injury marked as "recovering" creates a new updated_at).
  - Supports multiple concurrent injuries per user.
- **Priority:** P0
- **Dependencies:** FR-DATA-001

---

**FR-DATA-006: Agentic Memory Storage**
- **Description:** Pattern memories are stored with full metadata including confidence scores, evidence counts, application history, and optionally vector embeddings.
- **Acceptance Criteria:**
  - Table: agentic_memories (id, user_id, type, description, context JSON, observations, success_rate, trigger, action, confidence, embedding_vector BLOB, reinforced, applied_successfully, applied_unsuccessfully, dates).
  - Table: user_disagreements (id, user_id, context JSON, ai_suggested, user_chose, timestamp).
  - Vector embedding field accepts raw float array serialized as BLOB (for future vector search).
  - Confidence score recalculated after each application event: new_confidence = (applied_successfully / (applied_successfully + applied_unsuccessfully)).
- **Priority:** P1
- **Dependencies:** FR-DATA-001

---

## 4. Non-Functional Requirements

### 4.1 Performance

| ID | Requirement | Metric | Rationale |
|----|-------------|--------|-----------|
| NFR-PERF-001 | Set logging interaction | User completes weight + reps entry + set completion in under 10 seconds | Core product promise; matches Strong benchmark |
| NFR-PERF-002 | Cold start time | App first interactive screen appears within 2 seconds on mid-range Android (2023) | Gym-floor use requires immediate availability |
| NFR-PERF-003 | Animation frame rate | All transitions, timer countdowns, and swipe gestures run at a sustained 60fps | Smooth UX is perceived as quality signal; use Reanimated 2 |
| NFR-PERF-004 | Auto-fill latency | Weight and reps pre-populated within 200ms of workout screen mounting | Delays break the "frictionless" promise |
| NFR-PERF-005 | Local query performance | Any SQLite read returns within 100ms for datasets up to 10,000 workouts | Supports 5+ years of daily training history |
| NFR-PERF-006 | AI prescription generation | Daily workout with full prescriptions generated within 3 seconds (Claude API, with loading state) | Acceptable for pre-session planning, not mid-set |
| NFR-PERF-007 | Post-workout analysis | Summary screen renders core stats immediately; AI insights load asynchronously within 5 seconds | Core stats must be instant; AI is enrichment |
| NFR-PERF-008 | RPE alert trigger | Adaptation alert appears within 500ms of RPE submission | Must feel responsive to be acted upon |

---

### 4.2 Reliability

| ID | Requirement | Metric | Rationale |
|----|-------------|--------|-----------|
| NFR-REL-001 | Zero data loss on crash | Every set is written to SQLite synchronously on completion; no batch writes | Losing a workout is unacceptable; user trust depends on it |
| NFR-REL-002 | Background timer reliability | Rest timer fires completion push notification within 5 seconds of zero when app is backgrounded | Users frequently lock phones between sets |
| NFR-REL-003 | Offline core functionality | All logging, history viewing, exercise library, and pre-generated workout prescription work with zero connectivity | Primary use case is in gym environments with unreliable WiFi |
| NFR-REL-004 | AI degraded mode | When Claude API is unavailable, the app falls back to deterministic progression calculations and skips AI-only features (post-workout natural language insights) with a clear status indicator | App must not become unusable when offline |
| NFR-REL-005 | Crash-free rate | Target 99.5%+ crash-free sessions as reported by Sentry within 30 days post-launch | |
| NFR-REL-006 | Data integrity | No orphaned set_logs records; referential integrity enforced via SQLite foreign key constraints | |

---

### 4.3 Security

| ID | Requirement | Metric | Rationale |
|----|-------------|--------|-----------|
| NFR-SEC-001 | API key protection | Claude API key stored in secure device keychain; never embedded in source code or transmitted to client-readable locations | API key exposure would allow abuse |
| NFR-SEC-002 | Health data encryption | All data in SQLite database encrypted at rest using SQLCipher or equivalent | Workout and health data is sensitive personal information |
| NFR-SEC-003 | Network security | All API calls use HTTPS/TLS 1.3; certificate pinning for Claude API endpoint | Prevent MITM interception of health data |
| NFR-SEC-004 | GDPR compliance | Full data export available in structured format (JSON); account deletion purges all local and remote data; privacy policy accessible within app | Required for EU user base |
| NFR-SEC-005 | No third-party data sale | Health, injury, and workout data is never sold or shared with third parties | Core trust requirement; stated in privacy policy |
| NFR-SEC-006 | Auth (Phase 2) | Supabase authentication with email/password and Apple Sign-In; JWT session management | Required when cloud sync is introduced |

---

### 4.4 Scalability

| ID | Requirement | Metric | Rationale |
|----|-------------|--------|-----------|
| NFR-SCALE-001 | Workout history | Support 10,000+ workout records without degradation (equivalent to 5+ years of 4x/week training) | Long-term user retention requires performant history access |
| NFR-SCALE-002 | Exercise library | Support 500+ exercises in the library without search latency above 100ms | Community-contributed exercises in future versions |
| NFR-SCALE-003 | Mesocycle archive | Support 50+ historical mesocycles per user without storage issues | Users may run multiple annual cycles over years |
| NFR-SCALE-004 | Memory entries | Support 500+ agentic memory entries per user without retrieval latency above 200ms | Memory system grows over the lifetime of app use |
| NFR-SCALE-005 | Concurrent users (Phase 2) | Supabase backend handles 10,000 concurrent users without degradation | Pre-plan schema for server-side sync from v1.0 |

---

### 4.5 Usability

| ID | Requirement | Metric | Rationale |
|----|-------------|--------|-----------|
| NFR-USE-001 | Minimum tap target size | All interactive elements 44x44px minimum (Apple HIG requirement) | Gym use: sweaty fingers, distraction, fatigue |
| NFR-USE-002 | One-handed operation | All primary logging actions operable with one thumb in portrait orientation | Users frequently hold weights in one hand |
| NFR-USE-003 | Portrait and landscape support | All screens render correctly in both orientations | Some users mount phones on squat racks in landscape |
| NFR-USE-004 | System font sizes | All text respects device font size accessibility settings | Inclusion requirement |
| NFR-USE-005 | High-contrast mode | App functions correctly in high-contrast system mode | Gym lighting varies; legibility is critical |
| NFR-USE-006 | Voice control compatibility | All buttons and fields have accessibility labels for VoiceOver/TalkBack | Accessibility compliance |
| NFR-USE-007 | Network condition resilience | UI does not freeze or show blank states during slow network; all network calls have timeout (10s) and retry logic | Gym WiFi is unreliable |

---

## 5. Feature Dependency Graph

### Dependency Matrix

The following represents which features must be completed before others can begin, based on data and service dependencies.

```
FOUNDATION LAYER (No dependencies - build first)
├── FR-DATA-001: Local workout storage (SQLite setup, schema)
├── FR-DATA-003: Exercise database seeding (100+ exercises)
└── FR-DATA-005: Injury record storage

        |
        v

LOGGING CORE (Depends on Foundation)
├── FR-LOG-001: Auto-fill from history  ──── requires FR-DATA-001, FR-DATA-002
├── FR-LOG-002: Previous performance inline ─ requires FR-LOG-001
├── FR-LOG-004: RPE entry modal  ────────── no hard deps (UI only)
├── FR-LOG-005: Rest timer  ─────────────── requires FR-LOG-004
├── FR-LOG-003: Set completion flow  ────── requires FR-LOG-004, FR-LOG-005
├── FR-LOG-006: Set management  ─────────── requires FR-DATA-001
├── FR-LOG-008: Active workout screen  ──── requires FR-LOG-001, FR-LOG-002, FR-LOG-003
├── FR-LOG-011: Exercise library  ───────── requires FR-DATA-003
└── FR-LOG-012: Readiness check-in  ─────── requires FR-DATA-001

        |
        v

INJURY SAFETY (Depends on Foundation + Logging Core)
├── FR-INJ-001: Injury screening ────────── requires FR-DATA-005
├── FR-INJ-002: Exercise risk matrix ─────── requires FR-DATA-003
└── FR-INJ-003: Risk assessment  ────────── requires FR-INJ-001, FR-INJ-002

        |
        v

INTELLIGENCE CORE (Depends on Logging Core + Injury Safety)
├── FR-INT-002: Progression calculator ──── requires FR-LOG-012, FR-DATA-002, FR-INJ-003
├── FR-INT-001: Mesocycle generation  ───── requires FR-INJ-001, FR-DATA-004
├── FR-INT-003: Daily workout generation ── requires FR-INT-001, FR-INT-002, FR-INJ-003
├── FR-INT-004: RPE deviation alerts  ───── requires FR-LOG-004, FR-INT-002
├── FR-INT-005: Kill switches  ──────────── requires FR-INT-004, FR-INJ-001
└── FR-INT-006: Post-workout analysis  ──── requires FR-DATA-001, FR-LOG-009

        |
        v

MEMORY LAYER (Depends on Intelligence Core)
├── FR-DATA-006: Memory storage  ────────── requires FR-DATA-001
├── FR-MEM-001: Pattern detection  ─────── requires FR-INT-006, FR-DATA-006
├── FR-MEM-002: Memory retrieval  ───────── requires FR-MEM-001, FR-INT-002, FR-INT-004
├── FR-MEM-003: Learning from overrides ─── requires FR-MEM-001, FR-MEM-004
└── FR-MEM-004: Memory dashboard  ───────── requires FR-MEM-001

        |
        v

ENHANCEMENT FEATURES (Depends on Memory Layer)
├── FR-INT-007: Deload detection  ───────── requires FR-INT-001, FR-MEM-001
├── FR-INT-008: Mesocycle review  ───────── requires FR-INT-001, FR-MEM-001
├── FR-INT-009: Return-to-training  ─────── requires FR-INT-002, FR-DATA-002
└── FR-LOG-007: Exercise expandable panel ─ requires FR-DATA-002, FR-INJ-003
```

---

### Critical Path Analysis

The critical path through the dependency graph for v1.0 launch is:

```
FR-DATA-001 (SQLite setup)
    → FR-DATA-003 (exercise seeding)
    → FR-DATA-005 (injury storage)
    → FR-LOG-004 (RPE modal)
    → FR-LOG-003 (set completion)
    → FR-LOG-001 (auto-fill)
    → FR-LOG-008 (active workout screen)
    → FR-LOG-012 (readiness check-in)
    → FR-INJ-001 (injury screening)
    → FR-INJ-002 (risk matrix)
    → FR-INJ-003 (risk assessment)
    → FR-INT-002 (progression calculator)
    → FR-INT-001 (mesocycle generation)
    → FR-INT-003 (daily workout generation)
    → FR-INT-004 (RPE deviation alerts)
    → FR-INT-006 (post-workout analysis)
    → LAUNCH READY
```

**Critical path duration estimate:** 16 weeks at 1 developer pace (matches Phases 1-4 in project roadmap).

**Parallelizable work not on critical path:**
- FR-LOG-011 (exercise library) can be built in parallel with intelligence layer.
- FR-INJ-004 (substitution) can be built in parallel with memory layer.
- FR-LOG-013 (swipe gestures) can be added after core logging is functional.
- FR-DATA-002 (performance retrieval indexing) can be optimized after initial implementation.

---

## 6. MVP Scope Definition

### v1.0 Launch (Weeks 1-16, Months 1-4)

**Scope decision rationale:** v1.0 must deliver the core differentiated value proposition - logging as fast as Strong plus AI prescriptions plus injury awareness. These three together constitute the minimum product that justifies switching from Strong.

**Included in v1.0:**

| Requirement | Description |
|-------------|-------------|
| FR-LOG-001 through FR-LOG-012 | Complete logging UX (minus swipe gestures FR-LOG-013) |
| FR-INJ-001 through FR-INJ-004 | Full injury screening and exercise risk management |
| FR-INT-001 through FR-INT-006 | Mesocycle generation, daily workout, progression, real-time alerts, post-workout analysis |
| FR-DATA-001 through FR-DATA-005 | All data layer foundations |
| All P0 NFRs | Offline-first, zero data loss, 10-second set logging, 2-second cold start |

**Excluded from v1.0 (deferred):**
- FR-LOG-013: Swipe gestures (P1 - core logging works without them)
- FR-INT-007: Deload detection (P1 - mesocycle has scheduled deloads; proactive detection is enhancement)
- FR-INT-008: Mesocycle review (P1 - first users need 4 weeks of data before this is useful)
- FR-INT-009: Return-to-training protocol (P1 - important but launch timing may precede any 7-day gaps)
- FR-MEM-001 through FR-MEM-004: Entire memory system (P1/P2 - requires training history to be useful)
- FR-DATA-006: Memory storage (P1 - no memory system in v1.0)

**Minimum Viable Intelligence definition:**
The minimum AI features that differentiate the app from Strong and justify the switch are:

1. **Mesocycle auto-generation** - Strong has zero programming; we generate a full periodized plan from a 5-question onboarding flow.
2. **AI-powered progression calculator** - Strong repeats history; we calculate next load using RPE, readiness, phase, and time gap.
3. **Real-time RPE deviation alerts** - Strong shows data but never intervenes; we proactively alert and offer calibrated options.
4. **Injury-aware exercise selection** - Strong has zero injury awareness; we filter and warn based on the user's registered injuries.
5. **Post-workout insights** - Strong shows raw history; we interpret it with pattern context.

These five AI touchpoints are all included in v1.0 and require no prior training history to work (they function from session 1).

---

### v1.1 Target (Weeks 17-22, Months 5-6)

These features require 4+ weeks of user data to be meaningful, or are enhancements to the core experience that improve retention but do not define the core value proposition.

| Requirement | Description |
|-------------|-------------|
| FR-LOG-013 | Swipe gestures for speed |
| FR-LOG-007 | Exercise expandable panel with full history/charts |
| FR-INT-007 | Automatic deload week detection |
| FR-INT-008 | 4-week mesocycle review with next-block prescription |
| FR-INT-009 | Return-to-training protocol after 7-day gaps |
| FR-MEM-001 | Pattern detection and storage (requires workout history) |
| FR-MEM-002 | Memory retrieval and application |
| FR-DATA-006 | Memory storage (SQLite + optional vector DB) |
| Progress charts | Exercise 1RM trend and volume charts (FR-LOG-007 dependent) |
| Plate calculator | Plate loading calculator for target weights |
| Active rest suggestions | Movement-specific mobility cues during rest timers |

---

### v2.0 Target (Months 7-12)

These features require a mature memory system, backend infrastructure, or novel integrations that should not be prioritized until the core intelligence is proven.

| Requirement | Description |
|-------------|-------------|
| FR-MEM-003 | Learning from overrides (requires memory layer + sufficient disagreement history) |
| FR-MEM-004 | Memory dashboard (user-facing pattern viewer) |
| Cloud sync | Supabase backend, multi-device support, iCloud/Google Drive backup |
| Apple Watch integration | HRV and resting HR for automated readiness scoring |
| Conversational AI | Natural language Q&A interface ("Why is load lower this week?") |
| Concurrent training scheduling | Strength + running interference management |
| Data export | JSON/CSV full data export |
| Supersets and circuits | Linked exercise logging with shared rest timing |
| Subscription billing | In-app purchase, subscription management, paywall for AI features |

---

### MVP vs Competitive Differentiation Matrix

| Feature | Strong | Fitbod | v1.0 MVP | v1.1 | v2.0 |
|---------|--------|--------|----------|------|------|
| 10-second set logging | Yes | No | Yes | Yes | Yes |
| Auto-fill from history | Yes | No | Yes | Yes | Yes |
| Inline rest timers | Yes | Partial | Yes | Yes | Yes |
| AI mesocycle generation | No | Partial | Yes | Yes | Yes |
| Evidence-based periodization | No | No | Yes | Yes | Yes |
| Real-time RPE adaptation | No | No | Yes | Yes | Yes |
| Injury-aware exercise selection | No | Partial | Yes | Yes | Yes |
| Agentic pattern memory | No | No | No | Yes | Yes |
| Apple Watch HRV integration | No | No | No | No | Yes |
| Conversational AI interface | No | No | No | No | Yes |
| Cloud sync | No | Yes | No | Yes | Yes |

The v1.0 product is the only app in the market with all five of: logging speed, periodized programming, real-time adaptation, injury awareness, and AI-explained prescriptions simultaneously.

---

*End of Product Requirements Document*

*Source: docs/PROJECT_BRIEF.md v2.0 | PRD Version: 1.0 | Next review: After first 4-week mesocycle completion (user data available)*
