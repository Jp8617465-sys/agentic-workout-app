# Product Requirements Document
# Intelligent Training Companion

**Version:** 1.0
**Date:** March 3, 2026
**Status:** Draft
**Author:** Requirements Analyst
**Source:** PROJECT_BRIEF.md v2.0

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [User Stories (MoSCoW Prioritized)](#2-user-stories-moscow-prioritized)
3. [Functional Requirements](#3-functional-requirements)
   - 3.1 [Feature 1: Strong-Inspired Logging UX](#31-feature-1-strong-inspired-logging-ux)
   - 3.2 [Feature 2: Agentic Intelligence Layer](#32-feature-2-agentic-intelligence-layer)
   - 3.3 [Feature 3: Injury Management System](#33-feature-3-injury-management-system)
   - 3.4 [Feature 4: Agentic Memory System](#34-feature-4-agentic-memory-system)
4. [Non-Functional Requirements](#4-non-functional-requirements)
5. [Feature Dependency Graph](#5-feature-dependency-graph)
6. [MVP Scope Definition](#6-mvp-scope-definition)

---

## 1. Product Overview

The Intelligent Training Companion is a mobile workout tracking application for iOS and Android that combines the speed and usability of Strong (the 4.9-star gold-standard logging app) with evidence-based autonomous programming, real-time AI adaptation, injury-aware exercise selection, and a persistent agentic memory system that learns individual training patterns over time. Built primarily for advanced concurrent athletes like James (32, strength + running, chronic ankle instability, frequent travel), the app eliminates the gap between great logging tools and great coaching tools: it logs at Strong's 10-second-per-set speed, generates 12-16 week periodized mesocycles from evidence-based models (Linear, Block, DUP, Conjugate), adapts prescriptions mid-workout when RPE deviates from target, enforces injury safety at the exercise selection and kill-switch levels, and continuously accumulates a vector-stored memory of the user's personal patterns so that every future prescription is more accurate than the last. The core philosophy is "think less, lift more" - the AI handles all programming decisions while the user retains full override authority at every step.

---

## 2. User Stories (MoSCoW Prioritized)

### Primary Persona: James

> Age 32, advanced lifter, Brisbane. Concurrent strength + running. Chronic ankle instability (18-month post-ATFL tear). Frequent travel with 1-month training gaps. Former exercise scientist. Uses Strong for logging, Runna for running. Apple Watch user.

---

### Must Have (v1.0 - Launch Blockers)

| ID | As James... | I want to... | So that... |
|----|-------------|--------------|------------|
| US-001 | logging a workout | pre-filled weights and reps from my last session appear automatically | I can confirm or adjust in under 10 seconds without typing from scratch |
| US-002 | completing a set | be prompted for RPE immediately and have the rest timer start automatically | I don't need to take any additional manual action between sets |
| US-003 | training at the gym | see my previous session's performance (weight x reps) adjacent to my current input fields | I always know my baseline without navigating away |
| US-004 | starting any workout | tap a single button and have the workout ready with exercises and target prescriptions | I eliminate the "what do I do today?" decision entirely |
| US-005 | training at the gym | have my data saved locally even without internet connectivity | I never lose a training session due to poor gym Wi-Fi |
| US-006 | doing onboarding | disclose my ankle and back injuries once | the app never prescribes exercises that aggravate those injuries without my explicit consent |
| US-007 | seeing an RPE that deviates significantly from target | receive an immediate suggestion to adjust load or volume | I can manage fatigue safely without having to reason about it myself |
| US-008 | reviewing my training history | scroll a chronological log of all past workouts with date, volume, and key stats | I can track my progress over time |
| US-009 | starting a new training block | answer a short goal-setting questionnaire | the app generates a complete periodized mesocycle tailored to my goal and experience level |
| US-010 | returning after a break (travel, illness) | have the app detect the gap and apply a conservative return-to-training protocol automatically | I don't risk injury by jumping back to pre-break loads |

---

### Should Have (v1.1 - High Value, Non-Blocking)

| ID | As James... | I want to... | So that... |
|----|-------------|--------------|------------|
| US-011 | mid-workout | substitute an exercise with one tap | I can adapt when equipment is unavailable or an injury flares unexpectedly |
| US-012 | finishing a workout | see an AI-generated insight summarizing what my RPE patterns and volume suggest about today's performance | I build intuition about my own physiology without manual analysis |
| US-013 | viewing an exercise | access form cues, demonstration video, and full history chart with one tap | I never have to leave the active workout screen for longer than a few seconds |
| US-014 | completing a 4-week microcycle | receive a mesocycle review that assesses progress and proposes adjustments to the next block | my programming evolves based on what actually happened, not a static plan |
| US-015 | logging a set | use swipe gestures (delete, duplicate) instead of tapping menus | I reduce friction during the workout when my hands are occupied |
| US-016 | looking at the home screen | see what today's workout is with the phase name, session type, and key prescriptions | I know the plan before I arrive at the gym |
| US-017 | reviewing my patterns | see a dashboard showing what the app has learned about my optimal RPE ranges, best training days, and recovery patterns | I understand and trust the AI's decision-making |
| US-018 | experiencing unexpected pain mid-workout | be asked about pain level after a set and have the app activate a kill switch if I report pain > 2/10 | I have a safety net even when I might be inclined to push through |

---

### Could Have (v2.0 - Differentiating but Deferrable)

| ID | As James... | I want to... | So that... |
|----|-------------|--------------|------------|
| US-019 | wearing my Apple Watch | have the app read HRV and resting heart rate to automatically score my readiness | I don't need to manually input energy and soreness each morning |
| US-020 | training at home or traveling | have the app adapt my program to available equipment | I get an appropriate workout even without a full gym |
| US-021 | asking "why this exercise?" | type a natural language question and receive a plain-English explanation of the AI's reasoning | I stay informed about my own programming and can give better feedback |
| US-022 | planning concurrent training | have the app space my strength and running sessions to minimize interference | I stop manually juggling two separate training calendars |
| US-023 | loading a barbell | open a plate calculator that shows exactly which plates to load each side | I save mental arithmetic time during warmups |
| US-024 | sharing data | export my full workout history in CSV or JSON format | I maintain data ownership and can analyze data in other tools |
| US-025 | configuring preferences | set approval mode on or off for AI auto-adjustments | I control how autonomously the system acts |

---

### Won't Have (Out of Scope for v1.x)

| ID | Feature | Reason |
|----|---------|--------|
| US-026 | Social feed / activity sharing | Explicitly out of scope per product philosophy; creates scope and moderation complexity |
| US-027 | Gamification (badges, streaks, points) | Conflicts with evidence-based, intrinsically motivated design philosophy |
| US-028 | Nutrition tracking | Focus is exclusively on training; nutrition is a separate domain requiring separate expertise |
| US-029 | Human coach marketplace | Augments coaching judgment but does not mediate human coaches |
| US-030 | Generic fitness content (articles, videos not tied to user data) | Only training data that belongs to the user matters in this product |
| US-031 | Multi-user / team features | Single-user personal tool |
| US-032 | Live class / streaming workouts | Asynchronous, self-directed training only |

---

## 3. Functional Requirements

### Requirement Format

Each requirement follows the pattern:

```
ID: [Feature]-[Subsystem]-[Number]
Description: What the system must do
Acceptance Criteria: Observable, testable conditions for completion
Priority: P0 (launch blocker) | P1 (v1.1 high value) | P2 (v2.0 enhancement)
Dependencies: Other requirements that must be completed first
```

---

### 3.1 Feature 1: Strong-Inspired Logging UX

**Goal:** Match or exceed Strong's 10-second set logging speed. This is the foundation on which all intelligence features are layered.

---

#### FR-LOG-001: Auto-Fill from History

**Description:** When a user starts or opens a workout containing an exercise they have previously performed, the weight and reps fields for each set are pre-populated from the most recent logged session for that exercise.

**Acceptance Criteria:**
- [ ] Weight and reps fields are populated before the user interacts with them
- [ ] Pre-filled values match the corresponding set number from the last session (set 1 maps to set 1, set 2 to set 2, etc.)
- [ ] If the last session had fewer sets than the current prescription, remaining sets copy the last available set values
- [ ] If AI has generated a progression suggestion, AI values take precedence over raw history values
- [ ] Auto-filled values are visually distinguishable from user-entered values (e.g., subdued color until confirmed)
- [ ] The system falls back gracefully to empty fields if no history exists

**Priority:** P0
**Dependencies:** None (requires local database with set_logs)

---

#### FR-LOG-002: Previous Performance Inline Display

**Description:** While logging a set, the user can see the weight and reps achieved in their last session for that exact set position, displayed adjacent to the current input fields without navigating away.

**Acceptance Criteria:**
- [ ] "Prev" column is always visible in the set table without any additional tap
- [ ] Values display in subdued gray (e.g., `60kg x 8`) to visually distinguish from current input
- [ ] Previous performance is per-set-number (set 1 shows last set 1, not a global average)
- [ ] If no previous data exists, the column shows a dash or "First"
- [ ] Column is readable on screens as small as iPhone SE (375pt width)

**Priority:** P0
**Dependencies:** FR-LOG-001

---

#### FR-LOG-003: Set Completion with Simultaneous RPE Capture and Timer Start

**Description:** Tapping the set completion checkbox simultaneously marks the set as done, opens a compact RPE input modal, and auto-starts the rest timer - all in a single compound action requiring no secondary navigation.

**Acceptance Criteria:**
- [ ] Single tap on checkbox triggers all three actions (complete + RPE prompt + timer start)
- [ ] RPE modal presents values 5.0 through 9.5 in 0.5-point increments as large tap targets
- [ ] RPE modal shows the AI-prescribed target RPE for reference
- [ ] Tapping an RPE value closes the modal immediately with no additional confirmation button
- [ ] Rest timer begins counting down from the calculated rest duration the moment the checkbox is tapped (not after RPE is entered)
- [ ] The next set row becomes visually active after RPE is captured
- [ ] RPE is stored against the specific set log record

**Priority:** P0
**Dependencies:** FR-LOG-001, FR-LOG-004

---

#### FR-LOG-004: Rest Timer (Inline and Full-Screen)

**Description:** A rest timer is always visible in a compact inline state after set completion, and can be expanded to a full-screen view with adjustment controls. Timer persists in the background and issues a notification when complete.

**Acceptance Criteria (Inline State):**
- [ ] Compact timer appears in the top bar of the active workout screen showing remaining time (MM:SS)
- [ ] Compact timer includes a "Skip" action accessible without expanding
- [ ] Timer is visible while scrolling the exercise list

**Acceptance Criteria (Full-Screen State):**
- [ ] Single tap on the compact timer expands to full-screen view
- [ ] Full-screen shows: circular progress arc, countdown, base duration label and context (e.g., "Neural Skill base - 3:00"), and optional active rest suggestion
- [ ] Controls available: -30s, Pause/Resume, +30s, Skip
- [ ] Active rest suggestions are pattern-appropriate (squat pattern shows ankle mobility suggestions; horizontal push shows pec stretch)

**Acceptance Criteria (Background Behavior):**
- [ ] Timer continues counting when app is backgrounded
- [ ] Push notification fires when rest period ends with next set weight visible in notification payload
- [ ] Timer state survives app backgrounding and foregrounding without reset

**Acceptance Criteria (Rest Duration Calculation):**
- [ ] Base duration is determined by exercise category and training phase (Neural Skill: 3:00; Compound: 2:00-2:30; Accessory: 1:30; Cardio/Conditioning: 0:45)
- [ ] Set number adds cumulative fatigue (set 2: +10s; set 3+: +15s)
- [ ] RPE deviation adjusts duration (RPE > 1.5 over target: +30s; RPE > 1.5 under target: -30s)
- [ ] User can set a global rest preference offset (e.g., +60s always) in profile settings
- [ ] Minimum rest enforced at 30 seconds

**Priority:** P0
**Dependencies:** FR-LOG-003

---

#### FR-LOG-005: Active Workout Screen Structure

**Description:** The active workout screen renders a scrollable vertical list of exercise cards with a fixed header (timer, finish button) and a floating footer (add exercise). Each exercise card contains the set table, an AI prescription rationale panel, and an expandable action sheet.

**Acceptance Criteria:**
- [ ] Header is fixed and always visible while scrolling
- [ ] Each exercise card shows: exercise name, category badge, optional AI explanation (collapsible), set table, and "+ Add Set" button
- [ ] Set table columns are: Set # (with tag: W/F/D), Prev, Weight, Reps, Checkbox
- [ ] Exercise action sheet (accessed by tapping exercise name) contains: Form Video, History & Charts, Substitute Exercise, Form Cues, Exercise Settings
- [ ] "+ Add Exercise" button is accessible from the footer without scrolling to the bottom manually
- [ ] Screen handles workouts with 1-10 exercises without layout degradation

**Priority:** P0
**Dependencies:** FR-LOG-001, FR-LOG-002

---

#### FR-LOG-006: Swipe Gestures on Set Rows

**Description:** Set rows support swipe gestures as speed shortcuts: swipe left deletes the set, swipe right duplicates it. Long-pressing a weight or reps field enables increment/decrement stepping.

**Acceptance Criteria:**
- [ ] Swipe-left on set row reveals a "Delete" action and removes the row on confirmation
- [ ] Swipe-right on set row adds a new identical set directly below
- [ ] Long-press on weight field activates a haptic stepper (increment/decrement by configurable amount, default: 2.5kg)
- [ ] Long-press on reps field activates a haptic stepper (increment/decrement by 1)
- [ ] Gestures do not conflict with vertical scroll on the parent screen
- [ ] Gestures meet the 44x44pt minimum touch target requirement

**Priority:** P1
**Dependencies:** FR-LOG-005

---

#### FR-LOG-007: Finish Workout Flow and Post-Workout Summary

**Description:** Tapping "Finish" presents a confirmation, calculates session statistics, runs post-workout AI analysis, and shows a summary screen with volume, RPE averages, key progressions, PRs, AI insights, and the next scheduled session preview.

**Acceptance Criteria:**
- [ ] Confirmation modal warns user if any sets have not been marked complete
- [ ] Session stats calculated: duration (minutes), total volume (kg), average RPE, per-exercise volume delta vs. last session
- [ ] Post-workout summary screen shows: duration, total volume with percentage change, average RPE with target comparison, list of key progressions, any personal records set
- [ ] AI insights section renders pattern-based commentary (e.g., "Your squat progresses best when RPE stays 6.5-7. Today's +5kg was appropriate.")
- [ ] "Next Session" preview shows next scheduled session type and key target lifts
- [ ] All data is persisted to local database before the summary screen appears
- [ ] Screen loads in < 2 seconds post-workout

**Priority:** P0
**Dependencies:** FR-LOG-003, FR-INTEL-006

---

#### FR-LOG-008: Exercise Library and Picker

**Description:** A searchable exercise library with category and equipment filters allows users to add exercises mid-workout. The library is pre-seeded with 100+ exercises including injury risk metadata.

**Acceptance Criteria:**
- [ ] Library is searchable with fuzzy text matching and result highlighting
- [ ] Filters available: muscle group/pattern, equipment type
- [ ] Recently used exercises appear at the top of results
- [ ] User can create a custom exercise during workout without losing session state
- [ ] Each exercise entry shows: name, category badge, primary muscle group
- [ ] Search returns results in < 300ms

**Priority:** P0
**Dependencies:** Database seeding (exercises table)

---

#### FR-LOG-009: Workout History View

**Description:** Past workouts are stored and browsable in a chronological history view with a calendar overlay. Users can restart any past workout as a template.

**Acceptance Criteria:**
- [ ] History screen shows workouts in reverse-chronological order with: date, workout name/type, duration, total volume
- [ ] Calendar overlay highlights training days visually
- [ ] Tapping a past workout shows full exercise and set detail
- [ ] "Repeat Workout" action starts a new session pre-loaded with the same exercises and last session's values
- [ ] History is paginated to prevent loading 10k+ workouts simultaneously

**Priority:** P0
**Dependencies:** FR-LOG-007

---

#### FR-LOG-010: Readiness Check-In

**Description:** Before a workout begins, the user is presented with a brief readiness questionnaire (energy level 1-10, soreness 1-10, optional ankle status note) that feeds into the progression calculation algorithm.

**Acceptance Criteria:**
- [ ] Readiness check-in appears when opening a planned workout (not mandatory for ad-hoc workouts)
- [ ] Input controls use large sliders or numeric pickers (not free text)
- [ ] Check-in can be skipped with a single tap (system uses neutral values)
- [ ] Readiness values are stored against the workout record
- [ ] Readiness values are passed to the progression calculator before prescriptions are finalized

**Priority:** P0
**Dependencies:** FR-INTEL-002

---

### 3.2 Feature 2: Agentic Intelligence Layer

**Goal:** Autonomous programming, real-time adaptation, and explainable AI decisions that make the app a genuine training partner, not merely a logging tool.

---

#### FR-INTEL-001: Goal Setting and Onboarding Flow

**Description:** On first launch (or when starting a new training block), the user completes a structured onboarding questionnaire that collects the inputs needed for mesocycle generation.

**Acceptance Criteria:**
- [ ] Flow collects: training goal (strength, hypertrophy, concurrent, endurance, return from break), experience level (beginner/intermediate/advanced), injury disclosure, available equipment, and weekly training frequency
- [ ] Each step uses single-choice selection (no free text except injury notes)
- [ ] Flow can be completed in under 3 minutes
- [ ] Injury data from this flow seeds the injuries table and is immediately applied to exercise filters
- [ ] User can edit any onboarding answer from the profile settings screen at any time
- [ ] If user has existing history, system offers to factor it into mesocycle generation

**Priority:** P0
**Dependencies:** FR-INJURY-001

---

#### FR-INTEL-002: Mesocycle Generation

**Description:** Based on onboarding inputs and workout history, the system generates a complete 12-16 week periodized mesocycle with weekly phase labels, target volume/intensity parameters, and rationale for all programming decisions.

**Acceptance Criteria:**
- [ ] Periodization model is selected from: Linear (beginner/strength), Block (concurrent/advanced), DUP (intermediate/hypertrophy), Conjugate (advanced/strength)
- [ ] Mesocycle duration is 12-16 weeks with 4-week microcycles
- [ ] Each microcycle has a phase label (accumulation, intensification, realization, deload)
- [ ] Deload week is included every 4th week (40% volume reduction)
- [ ] Generated mesocycle is stored to database immediately and persists through app restarts
- [ ] User is shown a plain-language explanation of why this model was selected (e.g., "Block periodization suits concurrent training because it separates strength and endurance stimuli across weekly blocks")
- [ ] Mesocycle generation completes in < 10 seconds on device
- [ ] User can regenerate with different parameters without losing workout history

**Priority:** P0
**Dependencies:** FR-INTEL-001, FR-INJURY-002

---

#### FR-INTEL-003: Daily Workout Generation

**Description:** Each day the user opens the app, the system generates (or retrieves cached) a specific workout for that day, including exercise selection, set/rep/load prescriptions, tempo, rest periods, and a plain-language rationale.

**Acceptance Criteria:**
- [ ] Workout is derived from the active mesocycle's current week and phase
- [ ] Session type (Upper/Lower/Full) is determined by training frequency, days since last session of each type, and weekly balance
- [ ] Exercise selection respects: equipment availability, injury risk filters, user preferences, and session type
- [ ] Each exercise prescription includes: sets, reps, target weight, tempo, target RPE, rest period, and rationale string
- [ ] Weight prescription uses the progression calculator (FR-INTEL-004) applied to last session data
- [ ] Rationale is displayed collapsibly on each exercise card
- [ ] Daily workout is generated or cached by app open time (not mid-workout)
- [ ] If no readiness check-in has been completed, system uses neutral readiness (energy 7/10, soreness 3/10) with a prompt

**Priority:** P0
**Dependencies:** FR-INTEL-002, FR-LOG-010, FR-INJURY-002

---

#### FR-INTEL-004: Progression Calculator

**Description:** A deterministic algorithm calculates the target weight for each exercise based on last session performance, current training phase, readiness score, RPE from last session, and time elapsed since last performance.

**Acceptance Criteria (Calculation Logic):**
- [ ] Phase-based progression rates applied: accumulation +2.5%, intensification +1.5%, realization +0%, deload -15%, return week 1 +0%, return week 2 +4%
- [ ] RPE multiplier applied: last RPE < 5.5 = 1.5x; 5.5-6.5 = 1.2x; 6.5-7.5 = 1.0x; 7.5-8.5 = 0.5x; > 8.5 = 0.0x
- [ ] Readiness multiplier applied: readiness score < 60% = 0.5x; 60-75% = 0.8x; > 75% = 1.0x
- [ ] Time gap multiplier applied: > 7 days since last performance = 0.7x; 5-7 days = 0.85x; <= 5 days = 1.0x
- [ ] All calculated weights are rounded to the nearest available plate increment (default 2.5kg)
- [ ] If no previous data, system uses conservative starter loads appropriate to experience level

**Acceptance Criteria (Rationale Output):**
- [ ] Every prescription includes a human-readable rationale string (e.g., "Adding 2.5% (65kg to 67.5kg) - last RPE 6.5 suggests room for more, excellent readiness")
- [ ] Rationale is surfaced in the exercise card before and during the workout

**Priority:** P0
**Dependencies:** FR-INTEL-002, FR-LOG-010

---

#### FR-INTEL-005: Mid-Workout RPE Deviation Alerts

**Description:** When a logged RPE deviates by more than 1.5 points from the prescribed target, the system immediately presents an adaptation card with three options (reduce load, reduce volume, continue with warning) along with historical context from similar past situations.

**Acceptance Criteria:**
- [ ] Alert triggers when: `|actual_rpe - target_rpe| > 1.5`
- [ ] Alert is non-blocking (does not prevent workout continuation) but appears prominently
- [ ] Alert always presents exactly three options:
  - Option A: Reduce load (percentage reduction based on deviation magnitude: deviation <= 2.0 = 8% reduction; deviation > 2.0 = 10% reduction)
  - Option B: Reduce remaining sets (keep weight, stop after current set count)
  - Option C: Continue as prescribed (with warning label if deviation > 2.0)
- [ ] Each option shows its rationale string
- [ ] Alert includes historical context if a similar situation has been stored in memory (e.g., "Last time RPE was this high, you chose 'reduce load' and progression improved the following week")
- [ ] User's choice is recorded to the user_disagreements table for memory learning
- [ ] Alert applies to remaining sets in the current exercise, not retroactively

**Priority:** P0
**Dependencies:** FR-LOG-003, FR-INTEL-004, FR-MEM-001

---

#### FR-INTEL-006: Post-Workout AI Insights

**Description:** After each workout, the system runs a pattern detection and analysis pass on the completed session and surfaces 2-4 plain-language insights about performance, readiness patterns, and what to expect from the next session.

**Acceptance Criteria:**
- [ ] Analysis runs asynchronously after data is saved (does not block summary screen load)
- [ ] Insight types include: loading analysis (volume delta vs. last), RPE trend (improving/declining/stable), recovery prediction (predicted soreness/readiness for next session), red flags (unusual RPE spikes, consecutive high-fatigue sessions)
- [ ] Each insight is a single sentence in plain language
- [ ] Insights reference specific exercise names and numbers when relevant
- [ ] Next session adjustments are pre-computed and stored so tomorrow's prescription is ready
- [ ] If no patterns can be detected (fewer than 3 sessions of data), insights are replaced with general encouragement and data-gathering messaging

**Priority:** P0
**Dependencies:** FR-LOG-007, FR-MEM-001

---

#### FR-INTEL-007: Mesocycle Review and Iteration

**Description:** At the end of each 4-week microcycle, the system generates a milestone review: progress assessment against goals, identification of what worked and what did not, and a proposed adjustment to the next microcycle with user confirmation.

**Acceptance Criteria:**
- [ ] Review is triggered automatically when the final workout of a microcycle is completed
- [ ] Review presents: actual vs. target volume and intensity for the 4-week block, progression achieved on primary lifts (percentage change), adherence rate (workouts completed / planned), notable patterns from memory
- [ ] System proposes next microcycle parameters with specific adjustments (e.g., "Increasing target RPE from 7.5 to 8.0 based on consistent under-RPE performance")
- [ ] User can accept, modify, or reject proposed adjustments before the next week begins
- [ ] Review includes a goal re-alignment check ("Has your goal changed?")
- [ ] Full review is accessible from the history screen at any time after generation

**Priority:** P1
**Dependencies:** FR-INTEL-002, FR-INTEL-006, FR-MEM-002

---

#### FR-INTEL-008: Return-to-Training Protocol

**Description:** When the system detects a training gap of 7 or more days, it automatically applies a conservative return protocol that reduces initial loads and uses a graduated volume re-introduction schedule for the first 2 weeks back.

**Acceptance Criteria:**
- [ ] Gap detection triggers when last workout date is >= 7 days before the current date
- [ ] Return week 1: progression rate = 0% (maintain last loads), RPE target reduced by 1 point
- [ ] Return week 2: progression rate = +4%, RPE target restored
- [ ] User is shown an explicit "Return Protocol Active" notice on the home screen and exercise cards
- [ ] System stores the gap event in memory for future pattern analysis
- [ ] Protocol deactivates automatically after 2 weeks or when user dismisses it

**Priority:** P0
**Dependencies:** FR-INTEL-004, FR-MEM-001

---

### 3.3 Feature 3: Injury Management System

**Goal:** Proactive risk prevention, safe exercise selection during daily workout generation, and live safety monitoring during workout execution.

---

#### FR-INJURY-001: Injury Screening in Onboarding

**Description:** During onboarding, the user can disclose one or more injuries/limitations. Each entry captures type, status (acute/chronic/recovering), severity (1-10), approximate date, and optional notes.

**Acceptance Criteria:**
- [ ] Interface allows adding multiple injury entries (not a single text field)
- [ ] Injury type is selected from a predefined list plus "Other" with free text
- [ ] Status, severity, and date are all captured via picker controls (not free text for structured fields)
- [ ] User can skip injury disclosure with a single tap
- [ ] Injury records are stored immediately to the injuries table
- [ ] Injury records are editable from the profile settings screen at any time
- [ ] Adding an injury immediately updates the exercise risk filter for all future workout generation

**Priority:** P0
**Dependencies:** FR-INTEL-001

---

#### FR-INJURY-002: Exercise Risk Matrix

**Description:** The exercise database includes risk metadata for 100+ exercises mapped against a standard set of common injury types. Risk levels are LOW, MODERATE, or HIGH, with notes on contraindications and safe modifications.

**Acceptance Criteria:**
- [ ] Each exercise record includes an injury_risks JSON field with risk level, note, contraindications array, and modifications array for each injury type
- [ ] At minimum, the following injury types are covered: ankle instability, knee ligament, knee cartilage, lower back, shoulder impingement, shoulder labrum, wrist/elbow, hip
- [ ] Risk matrix covers all 100+ seeded exercises
- [ ] Risk metadata is stored in the injury_risks database table and can be queried per exercise + injury type combination

**Priority:** P0
**Dependencies:** FR-LOG-008 (exercise seeding)

---

#### FR-INJURY-003: Injury-Aware Exercise Selection

**Description:** During daily workout generation, exercises rated HIGH risk for any of the user's active injuries are excluded by default. MODERATE risk exercises are included with a visible warning and modification note.

**Acceptance Criteria:**
- [ ] HIGH risk exercises for any active user injury are excluded from the exercise selection pool silently
- [ ] MODERATE risk exercises are included but marked with a visible risk badge and modification note on the exercise card
- [ ] When a HIGH risk exercise is excluded, the system selects the next best movement pattern match from the safe pool
- [ ] User can explicitly override and add a HIGH risk exercise manually, with a confirmation step that reminds them of the risk
- [ ] LOW risk exercises show no injury indicator (no badge, no note)
- [ ] Risk assessment is recalculated when the user updates their injury records

**Priority:** P0
**Dependencies:** FR-INJURY-001, FR-INJURY-002, FR-INTEL-003

---

#### FR-INJURY-004: Mid-Workout Kill Switches

**Description:** During an active workout, automatic safety triggers activate when specified conditions are detected. Each kill switch presents a recommended action and logs the event for memory learning.

**Acceptance Criteria:**
- [ ] The following kill switch triggers are implemented:
  - Pain level reported > 2/10 after any set (via RPE modal pain option)
  - User reports form breakdown via the exercise action sheet
  - RPE spike > 9.0 in a non-realization phase
  - User explicitly flags injury flare via exercise action sheet
  - Return week protocol violation (load increase attempted in week 1)
- [ ] Each trigger immediately presents an alert with: what was detected, recommended options (stop exercise, substitute, rest and continue), and a "Continue anyway" option with documented acknowledgment
- [ ] All kill switch activations are logged to the workout record and stored as memory events
- [ ] Kill switch activation does NOT automatically end the workout (user retains control)

**Priority:** P0
**Dependencies:** FR-LOG-003, FR-INJURY-003, FR-MEM-001

---

#### FR-INJURY-005: Exercise Substitution System

**Description:** During an active workout, the user can substitute any exercise with a single tap, seeing alternatives that match the same movement pattern with an injury risk comparison.

**Acceptance Criteria:**
- [ ] "Substitute Exercise" option is accessible from each exercise's action sheet in <= 2 taps
- [ ] Substitution list is sorted by: same movement pattern first, then injury risk (lowest first), then equipment match
- [ ] Each substitute shows: exercise name, risk level for user's injuries, equipment required
- [ ] Selecting a substitute replaces the exercise card immediately with pre-filled values carried over
- [ ] Original exercise prescription (sets, reps, target weight) is copied to the substitute
- [ ] Substitution is recorded in the exercise_performance record

**Priority:** P1
**Dependencies:** FR-INJURY-002, FR-INJURY-003

---

### 3.4 Feature 4: Agentic Memory System

**Goal:** The system learns the user's individual training patterns, preferences, and adaptations over time so that every future prescription is more accurate and personalized than the last.

---

#### FR-MEM-001: Pattern Detection Engine

**Description:** After every workout, a pattern detection service analyses the completed session against historical data to identify and store recurring patterns, preferences, and risk indicators.

**Acceptance Criteria:**
- [ ] The following pattern types are detected and stored: optimal RPE range per exercise/phase, day-of-week fatigue patterns, preferred exercise variations, recovery timeline (days until RPE returns to baseline after high-load session), load progression sweet spots per exercise, deload timing signals, return protocol adherence
- [ ] A pattern is persisted to agentic_memories only when observed on >= 2 separate occasions with matching conditions
- [ ] Each memory record includes: type, description, context (exercise, phase, day_of_week, conditions), observations count, success_rate, first/last observed dates, trigger, action rule, confidence score (0.0-1.0)
- [ ] Pattern detection runs asynchronously post-workout and does not block the summary screen
- [ ] Patterns are not created from fewer than 3 total workout sessions (cold start protection)

**Priority:** P1
**Dependencies:** FR-LOG-007, FR-INTEL-006

---

#### FR-MEM-002: Memory Storage and Vector Retrieval

**Description:** All agentic memory records are stored with vector embeddings to enable semantic similarity retrieval. When generating daily workouts or adaptation alerts, the system queries memory by contextual similarity to the current situation.

**Acceptance Criteria:**
- [ ] Each memory record has an embedding_vector field (BLOB/float array)
- [ ] Memory retrieval accepts a context object (current exercise, phase, day of week, last RPE) and returns ranked results by similarity score
- [ ] Retrieval applies a minimum confidence threshold (default 0.6) to filter low-confidence patterns
- [ ] Results are ranked by: vector similarity score (primary), then recency (secondary), then reinforcement count (tertiary)
- [ ] Retrieval returns a maximum of 5 memories per query to prevent context overload
- [ ] Retrieval is local-first (SQLite + local vector index) with no mandatory network call

**Priority:** P1
**Dependencies:** FR-MEM-001

---

#### FR-MEM-003: Memory-Based Prescription Adjustment

**Description:** When generating daily workout prescriptions, the system retrieves relevant memories and uses them to override or modify the base progression calculator output, with the memory-based adjustment surfaced in the rationale.

**Acceptance Criteria:**
- [ ] Prescription generation queries memory before finalizing weights and RPE targets
- [ ] Retrieved memories with confidence >= 0.7 can modify: weight (max +/- 5%), RPE target (max +/- 0.5), rest period (max +/- 30s)
- [ ] The exercise card rationale explicitly mentions memory-based adjustments (e.g., "Based on your pattern: RPE tends to be 1 point higher on Monday squats after weekend running. RPE target reduced to 6.5.")
- [ ] Memory adjustments are never applied silently (always visible in rationale)
- [ ] User can disable memory-based adjustments per exercise from exercise settings

**Priority:** P1
**Dependencies:** FR-MEM-002, FR-INTEL-004

---

#### FR-MEM-004: Learning from User Overrides

**Description:** When a user modifies or rejects an AI prescription, their choice is recorded. When the same type of override occurs consistently across 3+ sessions, the system generates a new memory from the pattern and applies it to future prescriptions.

**Acceptance Criteria:**
- [ ] All user_disagreements records include: original AI suggestion, user's actual choice, context (exercise, phase, situation type), timestamp
- [ ] System queries disagreements after each workout to detect clusters of 3+ similar overrides
- [ ] Detected override pattern creates a new memory with confidence proportional to observation count
- [ ] New memory description is generated in natural language (e.g., "User consistently prefers 2 min rest over prescribed 3 min on accessory exercises")
- [ ] Override-derived memories are labeled with type "preference" and are visible in the user's memory dashboard

**Priority:** P1
**Dependencies:** FR-MEM-001, FR-INTEL-005

---

#### FR-MEM-005: Memory Transparency Dashboard

**Description:** Users can view a plain-language list of all patterns the system has learned about them, with the ability to confirm, edit, or delete any memory entry.

**Acceptance Criteria:**
- [ ] Memory dashboard is accessible from the Profile tab in <= 2 taps
- [ ] Each memory shows: description (plain language), type badge, confidence percentage, observation count, last applied date
- [ ] User can delete any memory entry
- [ ] User can mark a memory as "do not apply" without deleting it (disable toggle)
- [ ] Memories are grouped by type (pattern, preference, adaptation, warning, success_factor, failure_factor)
- [ ] Dashboard shows a count of total memories and how many were applied in the last 30 days

**Priority:** P1
**Dependencies:** FR-MEM-001, FR-MEM-004

---

## 4. Non-Functional Requirements

### 4.1 Performance

| ID | Requirement | Target | Measurement Method |
|----|-------------|--------|-------------------|
| NFR-PERF-001 | Set logging speed | Complete one set (auto-fill present) in < 10 seconds end-to-end | Manual timing test with experienced user |
| NFR-PERF-002 | Cold start (app launch to home screen) | < 2 seconds on iPhone 12 / equivalent Android | Expo performance profiling |
| NFR-PERF-003 | Animation frame rate | 60fps on all navigations, timers, and transitions | React Native Reanimated profiler |
| NFR-PERF-004 | Workout history load | History screen loads 100 most recent workouts in < 1 second | SQLite query timing |
| NFR-PERF-005 | Exercise search | Returns results in < 300ms for any query against 500+ exercise library | Search timing test |
| NFR-PERF-006 | Daily workout generation | Prescription available within 10 seconds of app open (may be cached) | App open timing test |
| NFR-PERF-007 | Post-workout AI analysis | Insights appear on summary screen within 2 seconds of data save | End-to-end timing |
| NFR-PERF-008 | Memory retrieval | Returns ranked results in < 200ms per query | SQLite + vector query timing |

---

### 4.2 Reliability

| ID | Requirement | Target | Measurement Method |
|----|-------------|--------|-------------------|
| NFR-REL-001 | Zero data loss on crash | All logged sets are committed to SQLite before the summary screen renders; if app crashes mid-workout, all completed sets are recoverable | Crash simulation test; force-kill app mid-workout and verify data on reopen |
| NFR-REL-002 | Background timer reliability | Rest timer continues accurately when app is backgrounded; deviation < 1 second over a 5-minute period | Background timing test |
| NFR-REL-003 | Offline-first operation | All core workout logging, history access, and exercise browsing functions work with zero network connectivity | Airplane mode test across full workout session |
| NFR-REL-004 | Data persistence across updates | App updates do not destroy local SQLite database; migration scripts handle schema changes | Update simulation test |
| NFR-REL-005 | Recovery from interrupted workout | If app is killed during an active workout, reopening the app offers to resume the session with all completed sets intact | App kill + reopen test |

---

### 4.3 Security

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-SEC-001 | API key protection | Anthropic Claude API key must never be bundled in client app binary; all AI calls must route through a serverless proxy (Cloudflare Workers / Supabase Edge Function) |
| NFR-SEC-002 | Health data encryption | Any biometric or health data (HRV, sleep, pain levels) stored on device must use iOS Keychain / Android Keystore for encryption at rest |
| NFR-SEC-003 | Authentication | Supabase Auth with email/password and optional OAuth (Apple Sign-In on iOS required by App Store guidelines); JWT tokens stored in secure storage, not AsyncStorage |
| NFR-SEC-004 | GDPR compliance | User can export all personal data in machine-readable format; user can request permanent account deletion with full data purge within 30 days |
| NFR-SEC-005 | Injury data sensitivity | Injury records are treated as health data; never transmitted to third-party analytics platforms; excluded from crash reports |
| NFR-SEC-006 | Input sanitization | All user-generated text inputs are sanitized before database storage and before transmission to AI APIs to prevent prompt injection |

---

### 4.4 Scalability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-SCALE-001 | Workout history | Application performs within NFR-PERF-004 bounds at 10,000+ workout records per user |
| NFR-SCALE-002 | Exercise library | Exercise picker and search perform within NFR-PERF-005 bounds at 500+ exercises |
| NFR-SCALE-003 | Mesocycle history | Users can have 50+ completed mesocycles without degradation in program generation or history browsing |
| NFR-SCALE-004 | Agentic memory | Memory retrieval performs within NFR-PERF-008 bounds at 500+ memory records per user |
| NFR-SCALE-005 | Set log volume | Exercise history charts and personal record calculations perform within 1 second at 10,000+ set log records per user |

---

### 4.5 Usability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-UX-001 | Touch target size | All interactive elements (buttons, checkboxes, input fields, tab bar items) must have a minimum touch target of 44x44pt per Apple HIG and Material Design guidelines |
| NFR-UX-002 | One-handed operation | All critical workout logging actions (complete set, adjust weight/reps, start timer, log RPE) must be reachable with one thumb on a standard phone without repositioning grip |
| NFR-UX-003 | Legibility during exercise | All text displayed during an active workout must be readable in varied lighting conditions (high contrast mode supported; minimum 16pt body text; subdued values minimum 14pt) |
| NFR-UX-004 | Portrait and landscape | App functions correctly in both portrait and landscape orientations; layout does not break in either orientation |
| NFR-UX-005 | Accessibility | App meets WCAG 2.1 AA contrast standards; all interactive elements have accessible labels for VoiceOver / TalkBack |
| NFR-UX-006 | Error states | All error states (network failure, empty states, first-run states) display actionable messages; no raw error codes or stack traces shown to users |

---

## 5. Feature Dependency Graph

### Dependency Overview

```
LAYER 0 - Infrastructure (no dependencies)
├── Database schema and migrations
├── Exercise library seeding (100+ exercises)
├── SQLite local storage setup
└── Navigation structure (4 tabs)

LAYER 1 - Core Logging (depends on Layer 0)
├── FR-LOG-001: Auto-fill from history
├── FR-LOG-002: Previous performance inline
├── FR-LOG-004: Rest timer
├── FR-LOG-008: Exercise library and picker
└── FR-LOG-009: Workout history

LAYER 2 - Set Completion Flow (depends on Layer 1)
├── FR-LOG-003: Set completion + RPE + timer (depends on FR-LOG-001, FR-LOG-004)
├── FR-LOG-005: Active workout screen (depends on FR-LOG-001, FR-LOG-002)
└── FR-LOG-010: Readiness check-in (feeds into FR-INTEL-002)

LAYER 3 - Injury Foundation (depends on Layer 0)
├── FR-INJURY-001: Injury screening
└── FR-INJURY-002: Exercise risk matrix (depends on exercise seeding)

LAYER 4 - Intelligence Foundation (depends on Layers 2 + 3)
├── FR-INTEL-001: Onboarding flow (depends on FR-INJURY-001)
├── FR-INTEL-002: Mesocycle generation (depends on FR-INTEL-001, FR-INJURY-002)
├── FR-INTEL-004: Progression calculator (depends on FR-INTEL-002, FR-LOG-010)
└── FR-INJURY-003: Injury-aware exercise selection (depends on FR-INJURY-001, FR-INJURY-002, FR-INTEL-003)

LAYER 5 - Daily Workout + Safety (depends on Layer 4)
├── FR-INTEL-003: Daily workout generation (depends on FR-INTEL-002, FR-LOG-010, FR-INJURY-002)
├── FR-INTEL-005: Mid-workout RPE alerts (depends on FR-LOG-003, FR-INTEL-004)
├── FR-INJURY-004: Kill switches (depends on FR-LOG-003, FR-INJURY-003)
└── FR-INTEL-008: Return protocol (depends on FR-INTEL-004)

LAYER 6 - Post-Workout Intelligence (depends on Layer 5)
├── FR-LOG-007: Finish workout flow (depends on FR-LOG-003, FR-INTEL-006)
├── FR-INTEL-006: Post-workout insights (depends on FR-LOG-007, FR-MEM-001)
└── FR-INJURY-005: Exercise substitution (depends on FR-INJURY-002, FR-INJURY-003)

LAYER 7 - Memory System (depends on Layer 6)
├── FR-MEM-001: Pattern detection (depends on FR-LOG-007, FR-INTEL-006)
├── FR-MEM-002: Memory storage + retrieval (depends on FR-MEM-001)
├── FR-MEM-003: Memory-based adjustments (depends on FR-MEM-002, FR-INTEL-004)
└── FR-MEM-004: Learning from overrides (depends on FR-MEM-001, FR-INTEL-005)

LAYER 8 - Review and Transparency (depends on Layer 7)
├── FR-INTEL-007: Mesocycle review (depends on FR-INTEL-002, FR-INTEL-006, FR-MEM-002)
├── FR-MEM-005: Memory dashboard (depends on FR-MEM-001, FR-MEM-004)
├── FR-LOG-006: Swipe gestures (depends on FR-LOG-005)
└── Advanced UX polish
```

### Critical Path

The critical path from zero to a usable v1.0 is:

```
Database + Exercise Seeding
    --> FR-LOG-001 (Auto-fill)
    --> FR-LOG-002 (Prev performance)
    --> FR-LOG-004 (Rest timer)
    --> FR-LOG-003 (Set completion + RPE)
    --> FR-LOG-005 (Active workout screen)
    --> FR-INJURY-001 (Injury screening)
    --> FR-INJURY-002 (Risk matrix)
    --> FR-INTEL-001 (Onboarding)
    --> FR-INTEL-002 (Mesocycle generation)
    --> FR-INTEL-004 (Progression calculator)
    --> FR-INTEL-003 (Daily workout generation)
    --> FR-INJURY-003 (Injury-aware selection)
    --> FR-INTEL-005 (RPE deviation alerts)
    --> FR-INJURY-004 (Kill switches)
    --> FR-LOG-007 (Finish + summary)
    --> FR-INTEL-006 (Post-workout insights)
    --> FR-INTEL-008 (Return protocol)
    --> v1.0 LAUNCH
```

The memory system (FR-MEM-001 through FR-MEM-005) and advanced review features (FR-INTEL-007) are on a parallel track that does not block v1.0 but must ship in v1.1.

---

## 6. MVP Scope Definition

### Minimum Viable Intelligence

The single differentiating question for MVP: **which AI features separate this product from Strong** (which has zero intelligence) and establish a moat that competitors cannot easily replicate?

The minimum viable intelligence stack - the features that must be present at v1.0 for the product to be meaningfully differentiated from a pure logging app - is:

1. **Mesocycle generation** (FR-INTEL-002): The "here's your 12-week plan" moment in onboarding makes the value proposition immediately tangible.
2. **Daily workout prescription with progression rationale** (FR-INTEL-003, FR-INTEL-004): Pre-filled loads with an explanation of why satisfies James's core need and removes the "what do I do today?" pain point.
3. **RPE deviation alerts** (FR-INTEL-005): Real-time adaptation is what distinguishes an intelligent companion from a passive logging tool.
4. **Injury-aware exercise selection** (FR-INJURY-003): This is a concrete, demonstrable safety feature with no equivalent in Strong, Fitbod, or JEFIT.
5. **Return-to-training protocol** (FR-INTEL-008): Directly solves James's travel-gap pain point and has no equivalent in competing apps.

Without all five, the product is a feature-augmented Strong clone. With all five, it is a category-new intelligent training companion.

---

### v1.0 Launch Scope

**Included in v1.0 (All P0 requirements):**

| Feature Area | Requirements Included |
|---|---|
| Core Logging | FR-LOG-001, FR-LOG-002, FR-LOG-003, FR-LOG-004, FR-LOG-005, FR-LOG-007, FR-LOG-008, FR-LOG-009, FR-LOG-010 |
| Agentic Intelligence | FR-INTEL-001, FR-INTEL-002, FR-INTEL-003, FR-INTEL-004, FR-INTEL-005, FR-INTEL-006, FR-INTEL-008 |
| Injury Management | FR-INJURY-001, FR-INJURY-002, FR-INJURY-003, FR-INJURY-004 |
| Non-Functional | NFR-PERF-001 through NFR-PERF-004, NFR-REL-001 through NFR-REL-003, NFR-SEC-001 through NFR-SEC-006, NFR-UX-001 through NFR-UX-003 |

**Deferred from v1.0:**

| Requirement | Deferral Reason |
|---|---|
| FR-LOG-006 (Swipe gestures) | Usability enhancement; tap-based gestures are sufficient for launch |
| FR-INTEL-007 (Mesocycle review) | Requires 4+ weeks of data to be meaningful; launch users will not reach this milestone before v1.1 |
| FR-INJURY-005 (Substitution panel) | Manual exercise add/remove is a valid workaround at launch |
| FR-MEM-001 through FR-MEM-005 (Memory system) | Memory accumulates from day one; pattern-based adjustments need 30+ days of data to be useful |
| FR-LOG-010 full integration | Readiness UI ships v1.0; full progression calculator integration ships v1.1 |

---

### v1.1 Scope (Weeks 13-20, Post-Launch)

**Goal:** Activate the memory system and close the feedback loop that makes the AI genuinely improve over time.

| Feature Area | Requirements |
|---|---|
| Memory System | FR-MEM-001, FR-MEM-002, FR-MEM-003, FR-MEM-004, FR-MEM-005 |
| Advanced Intelligence | FR-INTEL-007 (Mesocycle review), FR-LOG-010 full readiness integration |
| UX Polish | FR-LOG-006 (Swipe gestures), FR-INJURY-005 (Substitution panel) |
| Non-Functional | NFR-PERF-005 through NFR-PERF-008, NFR-REL-004 through NFR-REL-005, NFR-SCALE-001 through NFR-SCALE-005, NFR-UX-004 through NFR-UX-006 |

---

### v2.0 Scope (Post v1.1 Stabilization)

**Goal:** Add wearable integration, concurrent training optimization, natural language interface, and platform maturity.

| Feature | User Story | Notes |
|---|---|---|
| Apple Watch / HRV Integration | US-019 | Requires HealthKit entitlement; automates readiness scoring |
| Concurrent training scheduler | US-022 | Integrates with Runna or running log to space sessions |
| Natural language Q&A | US-021 | "Why this exercise?" conversational interface via Claude API |
| Plate calculator | US-023 | Low build cost, high perceived value utility |
| Equipment-aware adaptation | US-020 | Hotel gym / home gym workout variants |
| Full data export (CSV/JSON) | US-024 | GDPR compliance enhancement; power user feature |
| Approval mode toggle | US-025 | Auto-apply AI adjustments without confirmation for advanced users |

---

### Scope Boundary Rules

The following are permanently out of scope and must not be built or prototyped at any version:

1. **Social features** - No feeds, comments, sharing, or leaderboards
2. **Gamification** - No streaks, badges, points, or achievement systems
3. **Nutrition** - No food logging, macro tracking, or calorie counting
4. **Generic content** - No articles, how-to videos, or content not tied to the user's own training data
5. **Human coaching marketplace** - No two-sided marketplace connecting users with human coaches

---

### Success Metrics for v1.0

These targets, drawn from the project brief, define what "launch success" means:

| Metric | Target |
|---|---|
| Daily Active Users / Monthly Active Users ratio | 40% |
| 30-day retention | 65% |
| Average session duration | 45 minutes |
| Workout completion rate | 87% |
| Load progression accuracy (user accepts AI suggestion) | 80% |
| RPE prediction accuracy (within +/- 0.5 of actual) | 75% |
| App Store rating | 4.7 or above |
| Subscription conversion within 30 days | 15% |
| Monthly churn | < 8% |

---

*Document generated from PROJECT_BRIEF.md v2.0. For technology choices, see `docs/02-TECH-STACK-DECISIONS.md`. For implementation research, see `docs/03-RESEARCH-FINDINGS.md`.*
