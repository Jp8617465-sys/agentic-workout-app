# User Story Map and Differentiation Analysis

**Document Type:** Discovery / Requirements
**Date:** March 15, 2026
**Status:** Complete
**Source:** PROJECT_BRIEF.md, 01-PRD.md, 14-COMPETITIVE-ANALYSIS.md, TARGET_USER_ANALYSIS.md

---

## 1. "Why We're Better" -- Competitive Switching Narratives

### vs. Strong (4.9 stars, 1.2M+ downloads)

**What users have today:** The fastest workout logger on the market. Auto-fill from history, inline rest timers, clean information-dense UI. A perfect clipboard.

**What frustrates them:** "I open Strong and stare at the screen thinking 'what should I do today?'" Strong shows you what you did but never tells you what to do next. No programming, no periodization, no progression guidance, no injury awareness. Users manually plan mesocycles in spreadsheets, then log in Strong. Two tools that never talk to each other.

**How we solve it:** We match Strong's 10-second set logging speed -- auto-fill, inline timers, previous performance displayed adjacent to current inputs -- then add the intelligence layer Strong will never build. The app generates your daily workout with specific loads, explains the reasoning, adapts mid-session when RPE deviates, and learns your patterns over months.

**The aha moment:** First workout where the app pre-fills not just last session's weights but a calculated progression with a rationale: "Adding 2.5kg based on RPE 6.5 last session (room to grow) and Week 2 accumulation phase." The user realizes this is not a logger -- it is a coach that also logs.

---

### vs. Fitbod (Apple Editor's Choice, $12.99/mo)

**What users have today:** AI-generated workouts that remove decision fatigue. Recovery tracking per muscle group. Clean UI with equipment profiles.

**What frustrates them:** "The AI suggestions feel random." Weight recommendations are frequently inaccurate. No periodization -- workouts are isolated events, not part of a structured plan. Users report dropping off after approximately 7 workouts when they realize the "AI" is glorified randomization. No long-term memory. Each workout generated in a vacuum.

**How we solve it:** Our programming uses evidence-based periodization models (Linear, Block, DUP, Conjugate) to generate 12-16 week mesocycles with phase transitions, deload detection, and milestone reviews. Every prescription has a sports-science rationale. The system remembers that your squat progresses best at RPE 6.5-7 because it learned from your data, not because it rolled a dice.

**The aha moment:** Week 4 deload arrives automatically. The app explains: "Volume reduced 40% this week. Your average RPE trended from 7.0 to 8.2 over the last 3 weeks -- classic fatigue accumulation. Deloading now protects Week 5-8 gains." Fitbod never does this.

---

### vs. Hevy (12M+ users, $2.99/mo)

**What users have today:** Strong-quality logging plus social features -- workout sharing, comments, following. Generous free tier. Recently launched Hevy Trainer for basic AI workout generation.

**What frustrates them:** Social features add noise for serious trainees who want focused training. Hevy Trainer is new and unproven -- progressive overload suggestions are basic linear increments with no periodization, no injury awareness, and no pattern learning. The community-first culture may prevent the depth of AI investment required.

**How we solve it:** We strip the social noise and invest everything in intelligence depth. No feeds, no likes, no follower counts. Instead: injury-aware exercise selection, mid-workout RPE adaptation, agentic memory that learns individual patterns, and return-to-training protocols after breaks. For serious lifters, depth of intelligence beats breadth of community.

**The aha moment:** After a 3-week travel break, the app detects the gap and automatically applies a conservative return protocol -- 85% of pre-break loads, reduced volume, gradual ramp over 2 weeks. Hevy would just show your old template at full load.

---

### vs. JuggernautAI / RP Hypertrophy ($35/mo)

**What users have today:** The strongest evidence-based programming in the market. Block periodization with daily readiness adjustments. Backed by accomplished strength athletes.

**What frustrates them:** $35/month is prohibitive for most users. Obvious bugs persist for extended periods. Workouts can stretch 45-90 minutes, unsuitable for time-constrained users. Logging UX is mediocre -- these are programming tools first, loggers second. Narrow focus (powerlifting or hypertrophy, not concurrent training).

**How we solve it:** We deliver 80% of JuggernautAI's programming intelligence at 30% of the price, wrapped in Strong-caliber logging UX. We support concurrent training (strength + running), injury management, and agentic memory -- features neither JuggernautAI nor RP offer. The logging experience is not an afterthought; it is the foundation.

**The aha moment:** Logging a set takes 8 seconds, just like Strong. But the prescription came from a periodized mesocycle with readiness-based adaptation, just like JuggernautAI. Both experiences in one app at $9.99/month.

---

### vs. JEFIT (13M users, $69.99/yr)

**What users have today:** The largest exercise library (1,400+ movements), community-driven workout sharing, and recently added AI engines for performance analysis.

**What frustrates them:** Training programs have "wide quality variations" with critical programming errors. Interface feels overwhelming and cluttered. AI recommendations lack depth. Premium pricing is high relative to value delivered.

**How we solve it:** Quality over quantity. A curated library of 100+ exercises with injury risk matrices, movement pattern classifications, and safe alternatives. Every exercise has a purpose in the periodized plan. Programming quality is non-negotiable -- evidence-based models only.

**The aha moment:** The app flags that barbell back squats are HIGH risk for the user's chronic ankle instability and suggests goblet squats or safety bar squats with the rationale. JEFIT would prescribe the risky exercise without a second thought.

---

### Positioning Statement

For experienced lifters who are frustrated by the gap between excellent logging tools and excellent coaching tools, the Intelligent Training Companion is the only workout app that logs at Strong's speed, programs with evidence-based periodization, adapts in real time, and learns individual patterns over months. Unlike Strong (no intelligence), Fitbod (random AI), or JuggernautAI (poor UX, high price), we combine all four pillars in a single $9.99/month experience.

---

## 2. Complete User Story Map

### Epic 1: Workout Logging (Strong-Parity)

| ID | Story | Priority | Sprint | Acceptance Criteria |
|----|-------|----------|--------|---------------------|
| E1-01 | As a lifter, I want to log sets with weight, reps, and RPE in under 10 seconds, so that logging never interrupts my training flow. | Must | S1 | - Auto-filled values from last session appear on workout start. - Set completion requires 3 taps max (weight, reps, checkbox). - Numeric keypad opens inline without screen transition. |
| E1-02 | As a lifter, I want a rest timer to auto-start when I complete a set, so that I never forget to time my rest. | Must | S1 | - Timer starts within 200ms of checkbox tap. - Compact inline display visible while scrolling exercise cards. - Full-screen mode accessible via single tap with +/-30s and skip controls. |
| E1-03 | As a lifter, I want to see my previous session's weight x reps adjacent to current input fields, so that I know my baseline without navigating away. | Must | S1 | - Previous data displayed in subdued gray text. - Current inputs in primary color with clear visual hierarchy. - Data sourced from most recent session containing that exercise. |
| E1-04 | As a lifter, I want to search and add exercises mid-workout with fuzzy search, so that I can adapt my session without friction. | Must | S1 | - FTS5-powered search returns results within 100ms. - Category and equipment filters available. - Recently used exercises appear at the top. |
| E1-05 | As a lifter, I want swipe gestures to delete, duplicate, and reorder sets, so that I reduce taps when my hands are chalky or sweaty. | Should | S1 | - Swipe left to delete with undo option. - Swipe right to duplicate set. - Long press to reorder exercises within workout. |
| E1-06 | As a lifter, I want a post-workout summary showing duration, volume, and key progressions, so that I leave the gym knowing what I accomplished. | Must | S1 | - Summary displays within 2 seconds of tapping Finish. - Shows total volume, average RPE, and PR badges. - Persists in workout history. |

---

### Epic 2: AI Programming

| ID | Story | Priority | Sprint | Acceptance Criteria |
|----|-------|----------|--------|---------------------|
| E2-01 | As a lifter, I want a complete periodized mesocycle generated from my goals and experience level, so that I follow evidence-based programming without manual planning. | Must | S3 | - Generates 12-16 week plan using appropriate periodization model (Linear/Block/DUP). - Includes phase transitions (accumulation, intensification, realization, deload). - Displays rationale for model selection. |
| E2-02 | As a lifter, I want today's workout prescribed with specific sets, reps, loads, and RPE targets, so that I eliminate "what should I do?" decisions. | Must | S2 | - Workout available on home screen before gym arrival. - Loads calculated from last session performance, readiness, and current phase. - Each exercise includes a one-line rationale. |
| E2-03 | As a lifter, I want the progression calculator to factor in my RPE history and readiness, so that load increases are appropriate for my current state. | Must | S2 | - Progression uses RPE multiplier, readiness multiplier, and time-gap multiplier. - Loads rounded to nearest available plate increment. - User acceptance rate target: 80%+. |
| E2-04 | As a lifter, I want automatic deload detection and scheduling, so that I recover adequately without guessing when to back off. | Should | S3 | - Deload triggered after 3-4 weeks of rising RPE trend. - Volume reduced 40% during deload week. - Rationale explains the fatigue indicators that triggered the deload. |

---

### Epic 3: Real-Time Adaptation

| ID | Story | Priority | Sprint | Acceptance Criteria |
|----|-------|----------|--------|---------------------|
| E3-01 | As a lifter, I want an alert when my RPE deviates more than 1.5 points from target, so that I can adjust before form breaks down. | Must | S2 | - Alert appears within 1 second of RPE entry. - Offers 3 options: reduce load, reduce volume, or continue with warning. - Shows historical context ("Last time RPE was this high, you chose X"). |
| E3-02 | As a lifter, I want mid-workout load adjustment suggestions with confidence levels, so that I can make informed decisions under fatigue. | Should | S2 | - Each option labeled HIGH/MEDIUM/LOW confidence. - Adjustment calculations shown transparently. - User choice recorded for future pattern learning. |
| E3-03 | As a lifter, I want kill switches that halt the workout when safety thresholds are breached, so that I have a safety net against pushing through injury. | Should | S2 | - Triggers on: pain >2/10, RPE >9 outside peak phase, form breakdown flag. - Offers: stop exercise, substitute, or end workout. - Records incident for injury tracking. |

---

### Epic 4: Injury Management

| ID | Story | Priority | Sprint | Acceptance Criteria |
|----|-------|----------|--------|---------------------|
| E4-01 | As a lifter with chronic injuries, I want to disclose my injuries once during onboarding, so that the app never prescribes unsafe exercises without my consent. | Must | S2 | - Injury screening captures type, status (acute/chronic/recovering), severity, and date. - Injuries persist across sessions and mesocycles. - User can update injury status at any time. |
| E4-02 | As a lifter, I want exercises flagged with risk levels based on my injury profile, so that I make informed decisions about exercise selection. | Must | S2 | - Risk levels: LOW (green), MODERATE (yellow), HIGH (red). - HIGH risk exercises excluded from auto-generated workouts by default. - User can override with explicit acknowledgment. |
| E4-03 | As a lifter, I want safe alternative exercises suggested when a prescribed exercise conflicts with my injuries, so that I maintain training stimulus without risk. | Should | S2 | - Alternatives match same movement pattern and muscle groups. - One-tap substitution within active workout. - Substitution logged for pattern learning. |

---

### Epic 5: Agentic Memory

| ID | Story | Priority | Sprint | Acceptance Criteria |
|----|-------|----------|--------|---------------------|
| E5-01 | As a lifter, I want the system to detect my optimal RPE ranges, recovery patterns, and progression sweet spots, so that prescriptions improve over time. | Must | S4 | - Detects patterns after minimum 8 workouts. - Stores patterns with confidence scores and observation counts. - Patterns influence daily workout generation. |
| E5-02 | As a lifter, I want to see a dashboard of what the app has learned about me, so that I understand and trust the AI's decisions. | Should | S4 | - Displays top 5+ patterns with evidence counts. - Shows confidence levels and when patterns were last applied. - Allows user to dismiss or reinforce patterns. |
| E5-03 | As a lifter, I want the system to learn from my overrides, so that it stops making suggestions I consistently reject. | Should | S4 | - Tracks user disagreements with AI suggestions. - After 3+ consistent overrides on the same decision type, creates a new preference memory. - Reduces confidence on patterns the user rejects. |

---

### Epic 6: Progress and Analytics

| ID | Story | Priority | Sprint | Acceptance Criteria |
|----|-------|----------|--------|---------------------|
| E6-01 | As a lifter, I want to view progress charts for volume, estimated 1RM, and body measurements over time, so that I validate my training is working. | Should | S3 | - Line charts with selectable time ranges (4w, 12w, all). - Estimated 1RM calculated from best set using Epley formula. - Charts load within 500ms from local data. |
| E6-02 | As a lifter, I want automatic PR detection and celebration across all rep ranges, so that I notice achievements I might otherwise miss. | Should | S1 | - PRs detected at 1RM, 3RM, 5RM, 8RM, 10RM. - Visual badge on post-workout summary. - PR history accessible from exercise detail view. |
| E6-03 | As a lifter, I want weekly and monthly volume summaries by muscle group, so that I ensure balanced training stimulus. | Could | S3 | - Aggregated volume per muscle group from exercise metadata. - Visual comparison against target volume from mesocycle plan. - Highlights under-trained or over-trained groups. |

---

### Epic 7: Onboarding and Setup

| ID | Story | Priority | Sprint | Acceptance Criteria |
|----|-------|----------|--------|---------------------|
| E7-01 | As a new user, I want to complete goal setting (training goal, experience level, frequency) in under 2 minutes, so that I get a personalized program immediately. | Must | S3 | - 4-5 screens max: goal, experience, injuries, equipment, frequency. - Generates first mesocycle within 5 seconds of completion. - Skippable for users who want to log ad-hoc. |
| E7-02 | As a switching user, I want to import my workout history from Strong or Hevy, so that the AI has context from day one. | Could | S5 | - Supports Strong CSV export format. - Maps imported exercises to internal library. - Imported history feeds progression calculator immediately. |
| E7-03 | As a new user, I want a guided first workout that explains the UI without slowing me down, so that I learn the interface naturally. | Should | S3 | - Contextual tooltips on first workout only. - Dismissable and non-blocking. - Covers: auto-fill, RPE prompt, rest timer, AI prescription rationale. |

---

### Epic 8: Integrations

| ID | Story | Priority | Sprint | Acceptance Criteria |
|----|-------|----------|--------|---------------------|
| E8-01 | As a lifter with an Apple Watch, I want HRV and resting heart rate imported to auto-score my readiness, so that I skip manual readiness input. | Could | S5 | - Reads HealthKit HRV and RHR data. - Calculates readiness score from baseline deviations. - Falls back to manual input when watch data unavailable. |
| E8-02 | As a lifter, I want to export my complete training data as CSV or JSON, so that I own my data and can migrate if needed. | Should | S4 | - Exports workouts, sets, exercises, and AI memories. - JSON format preserves full data fidelity. - CSV format compatible with spreadsheet analysis. |
| E8-03 | As a concurrent athlete, I want running data from HealthKit or Strava factored into recovery scoring, so that strength programming accounts for endurance load. | Could | S5 | - Reads running distance, pace, and heart rate zones. - Factors cardio load into readiness multiplier. - Adjusts strength session volume on high-running days. |

---

### Epic 9: Social and Sharing (Light)

| ID | Story | Priority | Sprint | Acceptance Criteria |
|----|-------|----------|--------|---------------------|
| E9-01 | As a lifter, I want to share a post-workout summary as an image, so that I can post achievements without exposing detailed training data. | Could | S5 | - Generates branded image card with workout stats. - Excludes sensitive data (RPE, injury info). - Shareable via system share sheet. |
| E9-02 | As a coached athlete, I want to grant read-only access to my training data for a coach, so that they can monitor my programming remotely. | Won't (V2) | -- | - Coach receives view-only access via invite link. - Coach can add notes but not modify workouts. - Revocable at any time. |

---

### Epic 10: Settings and Personalization

| ID | Story | Priority | Sprint | Acceptance Criteria |
|----|-------|----------|--------|---------------------|
| E10-01 | As a lifter, I want to choose between kg and lbs with fractional plate support, so that the app matches my gym setup. | Must | S1 | - Unit preference persists across all screens. - Supports 0.5kg / 1lb increments. - Plate calculator respects available plate inventory. |
| E10-02 | As a lifter, I want per-exercise rest timer defaults, so that I rest longer for heavy compounds and shorter for accessories. | Should | S1 | - Default rest times configurable by exercise category. - Overridable per individual exercise. - Saved in user preferences. |
| E10-03 | As a lifter, I want to configure notification preferences for rest timer completion, workout reminders, and deload alerts, so that the app communicates on my terms. | Should | S3 | - Granular toggles for each notification type. - Push notifications work when app is backgrounded. - Haptic feedback toggle for in-app events. |

---

## 3. "Day in the Life" Scenarios

### Scenario 1: The Experienced Lifter (Switching from Strong)

**Persona:** James, 32, 5+ years training, chronic ankle instability, uses Strong today.

**6:45 AM** -- James checks his phone. The home screen shows: "Lower Body -- Week 6 Intensification. 5 exercises, est. 52 min." He taps for details and sees squat prescribed at 72.5kg for 4x5 at RPE 8: "Up 2.5kg from last week. RPE averaged 7.2 last session with strong bar speed."

**7:15 AM** -- At the gym, he taps Start. All exercises appear with pre-filled weights and reps. Set 1 of squats: he keeps the auto-filled 72.5kg, does 5 reps, taps the checkbox. RPE modal appears with large buttons -- he taps 7.5. Rest timer starts (3:00). He glances at the compact timer in the corner while walking to the water fountain.

**7:22 AM** -- Set 3 of squats, RPE comes in at 9.0 (target was 8). An amber alert appears: "RPE 1.0 above target. Options: Drop to 70kg (-3.4%), reduce to 3 total sets, or continue. Last time RPE hit 9 on squats, dropping load led to better Week 7 performance." He taps "reduce to 70kg" -- the remaining sets update instantly.

**7:55 AM** -- He finishes. Post-workout summary: "Duration 48 min. Volume 3,120kg (+2.1%). Squat load adjusted mid-session -- good call, this protects next week's realization phase." He is out of the gym in under an hour.

**What Strong could not do:** Generate the workout, prescribe the loads, alert on RPE deviation, suggest the mid-session adjustment with historical precedent, or connect today's decision to next week's phase.

---

### Scenario 2: The Returning Athlete (Back from 3-Week Travel Break)

**Persona:** James after a month-long work trip to Southeast Asia. No gym access for 3 weeks.

**Day 1 back** -- He opens the app. A banner reads: "Welcome back. 21-day gap detected. Activating return protocol: Week 1 at 85% of pre-break loads, reduced volume (3 sets instead of 4), RPE cap at 7.0." He taps "View Plan" and sees a 2-week ramp-back schedule.

**During the workout** -- Squats prescribed at 62.5kg (pre-break was 72.5kg). He feels strong and considers adding weight, but the RPE modal after set 2 shows 6.5 -- right on target. The app notes: "Resist the urge to jump ahead. Return protocols that respect the ramp produce 12% fewer setbacks (based on your history of 2 previous returns)."

**End of Week 2** -- Return protocol complete. The app transitions to a fresh accumulation phase: "Pre-break loads restored. Starting new 4-week accumulation block. Your ankle stability has been good through the return -- maintaining split squats."

**What no competitor does:** Detect the gap automatically, apply a conservative evidence-based return protocol, cite the user's own historical return data, and monitor injury status throughout the ramp-back.

---

### Scenario 3: The Busy Professional (3x/Week, Maximum Efficiency)

**Persona:** Priya, 28, intermediate lifter, 3x/week, 45-minute sessions max, wants to break through a plateau.

**Monday evening** -- Priya checks tomorrow's workout during her commute. The app shows: "Full Body A -- Week 3 Accumulation. 4 exercises, est. 38 min." She sees squat, bench press, row, and RDL with specific prescriptions. The rationale reads: "3x/week full body optimized for compound movements. Accessories minimized to fit your 45-minute window."

**During the workout** -- She finishes bench press faster than expected (RPE 6.0 vs target 7.0). The app suggests: "Bench press felt easy. Add 1.25kg for the remaining 2 sets? Your bench progresses best with small, frequent jumps (learned from 14 sessions)." She accepts.

**Friday** -- Third session of the week. The app scheduled it as lower-intensity to close the week: "Recovery session: lighter loads, higher reps (10-12), RPE cap 6.5. You train again Monday -- this preserves weekend recovery." Priya finishes in 35 minutes.

**What Priya could not get elsewhere:** Time-optimized programming that respects her 45-minute constraint, mid-workout micro-progressions based on learned patterns, and weekly periodization within a 3-day structure.

---

### Scenario 4: The Concurrent Athlete (Strength + Running)

**Persona:** James during his concurrent training phase -- 3x/week strength, 2x/week running (using Runna).

**Tuesday** -- The app detects (via HealthKit) that James ran 8km at tempo pace yesterday. Today's lower body session is adjusted: "Running load detected (8km tempo). Reducing squat volume from 4 sets to 3 and lowering RDL load by 5%. Prioritizing hip thrust and calf raises -- lower interference with running recovery."

**Thursday** -- An easy 5km recovery run is on the calendar. The app's home screen notes: "Upper body tomorrow. Today's easy run won't affect pressing movements. No adjustments needed."

**Saturday** -- Long run day (14km). The app shows no strength session scheduled: "Rest day from lifting. Your long run provides sufficient lower body stimulus. Next strength session: Monday upper body."

**End of 4-week block** -- Mesocycle review: "Concurrent block complete. Strength maintained (squat +2.5kg despite running volume). Running interference managed by spacing sessions 24h+ apart on 86% of weeks. Recommendation: next block can increase squat frequency if running volume stays stable."

**What no single app does:** Integrate running load into strength programming decisions, manage session spacing for concurrent training, and review cross-modality interference at the mesocycle level.

---

## 4. Feature Prioritization

### Impact vs. Effort Matrix

```
                        HIGH IMPACT
                            |
     AI Programming (E2)    |    Workout Logging (E1)
     Injury Mgmt (E4)       |    Onboarding (E7)
                             |
  LOW EFFORT ----------------+---------------- HIGH EFFORT
                             |
     Settings (E10)          |    Agentic Memory (E5)
     Progress Charts (E6)    |    Integrations (E8)
                             |
                        LOW IMPACT
```

### Release Phasing

**MVP (Sprint 1-2, Weeks 1-8) -- "Log + Adapt"**

Core value proposition: Strong-speed logging with intelligent progression.

- Full set logging with auto-fill, rest timers, RPE prompts (E1)
- Progression calculator with readiness-based adjustments (E2-02, E2-03)
- RPE deviation alerts with adjustment options (E3-01)
- Injury screening and exercise risk flagging (E4-01, E4-02)
- Basic exercise library with search (E1-04)
- Workout history (E1-06)
- Unit preferences and rest timer settings (E10-01, E10-02)
- Offline-first local storage

**V1.0 (Sprint 3-4, Weeks 9-16) -- "Program + Learn"**

Full autonomous programming and pattern learning.

- Mesocycle generation with periodization models (E2-01)
- Deload detection and scheduling (E2-04)
- Onboarding flow with goal setting (E7-01)
- Mid-workout kill switches (E3-03)
- Exercise substitution system (E4-03)
- Pattern detection and memory storage (E5-01)
- Memory dashboard (E5-02)
- Progress charts and PR detection (E6-01, E6-02)
- Notification preferences (E10-03)
- Guided first workout (E7-03)

**V2.0 (Sprint 5+, Weeks 17-24) -- "Integrate + Share"**

Ecosystem expansion and advanced features.

- HealthKit/wearable integration for automated readiness (E8-01)
- Concurrent training management with running data (E8-03)
- Data import from Strong/Hevy (E7-02)
- Data export (E8-02)
- Workout summary sharing (E9-01)
- Volume tracking by muscle group (E6-03)
- Coach connection (E9-02)
- Learning from overrides (E5-03)
- Plate calculator
- Supersets and circuit support

### MVP Success Gate

Ship MVP when all of the following are true:
- Set logging takes under 10 seconds with auto-fill (measured)
- Progression suggestions accepted by test users 75%+ of the time
- RPE alerts fire correctly on deviation >1.5 points
- Injury screening prevents HIGH risk exercises from appearing in workouts
- All data persists offline with zero data loss
- 5-exercise workout completable in under 60 seconds of active logging time
