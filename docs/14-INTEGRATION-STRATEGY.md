# Integration & Ecosystem Strategy — Intelligent Training Companion

**Version:** 1.0
**Date:** March 15, 2026
**Status:** Draft — Planning Phase
**Inputs:** PROJECT_BRIEF.md, 02-TECH-STACK-DECISIONS.md, 03-RESEARCH-FINDINGS.md, 05-BACKEND-ARCHITECTURE.md

---

## Table of Contents

1. [Strategic Overview](#1-strategic-overview)
2. [Health Platform Integrations](#2-health-platform-integrations)
3. [Wearable Integrations](#3-wearable-integrations)
4. [Fitness Ecosystem Integrations](#4-fitness-ecosystem-integrations)
5. [AI and ML Service Integrations](#5-ai-and-ml-service-integrations)
6. [Data Export and Import](#6-data-export-and-import)
7. [Social and Sharing Integrations](#7-social-and-sharing-integrations)
8. [Payment and Subscription](#8-payment-and-subscription)
9. [Priority Integration Roadmap](#9-priority-integration-roadmap)
10. [Integration Architecture Patterns](#10-integration-architecture-patterns)

---

## 1. Strategic Overview

### Integration Philosophy

This app's core value proposition is autonomous, personalized training intelligence. Every external integration must either feed higher-quality data into that intelligence engine or reduce friction in the user's training workflow. Integrations that distract from the core loop — log fast, get smart feedback, progress — are out of scope.

**Three integration tiers:**

- **Tier 1 — Data Inputs**: Health platforms and wearables that feed readiness, recovery, and activity data into the AI engine. These directly improve prescription quality and are highest priority.
- **Tier 2 — Ecosystem Bridges**: Services users already rely on (Strava for running, Strong for history) that reduce migration friction and fill data gaps.
- **Tier 3 — Distribution Amplifiers**: Payment infrastructure, sharing utilities, and developer APIs that expand reach and monetization.

### Alignment with Existing Stack

The app runs React Native (Expo SDK 54) with TypeScript strict mode, Supabase as the Phase 2 backend, Drizzle ORM on local SQLite, and Claude API (via Supabase Edge Functions) for AI. All integration choices below respect these constraints:

- Expo managed workflow limits native module options; bare workflow unlocks HealthKit but adds build complexity.
- Edge Functions are the appropriate layer for all third-party API calls that require secret key management.
- The offline-first architecture means integrations must be additive — the app must function fully without any third-party connection.
- No integration should introduce a hard dependency on an external service for core workout logging.

---

## 2. Health Platform Integrations

### 2.1 Apple HealthKit (iOS)

**What can be read:**

| Data Type | HealthKit Identifier | Relevance to AI Engine |
|-----------|---------------------|------------------------|
| Heart Rate Variability (SDNN) | `HKQuantityTypeIdentifierHeartRateVariabilitySDNN` | Primary readiness input — HRV below personal baseline suppresses load progression |
| Resting Heart Rate | `HKQuantityTypeIdentifierRestingHeartRate` | Secondary recovery indicator |
| Sleep analysis | `HKCategoryTypeIdentifierSleepAnalysis` | Sleep duration and efficiency feed readiness score |
| Active Energy Burned | `HKQuantityTypeIdentifierActiveEnergyBurned` | Cumulative training load context |
| Walking/Running Distance | `HKQuantityTypeIdentifierDistanceCycling` | Concurrent training volume tracking |
| Body Mass | `HKQuantityTypeIdentifierBodyMass` | Load prescription calibration |
| VO2 Max (estimated) | `HKQuantityTypeIdentifierVO2Max` | Aerobic capacity for concurrent programming |
| Workout sessions | `HKWorkoutType` | Running session import for interference effect calculation |

**What can be written:**

| Data Type | Relevance |
|-----------|-----------|
| Workout sessions | Write completed strength workouts back to Health, satisfying users who track all activity centrally |
| Active Energy | Caloric expenditure from workout volume calculations |
| Body measurements | If the app adds measurement tracking in Phase 3 |

**Implementation approach:**

The recommended library is `expo-health-kit` (managed workflow compatible in Expo SDK 54) for read operations. For write operations and full workout session types, the app will need to eject to a bare workflow or use a config plugin. Given the Phase 2 Supabase rollout timeline, plan the bare workflow migration at the same milestone.

```
react-native-health (config plugin for Expo bare)
  — Maintained, 3,200+ GitHub stars, covers full HealthKit API surface
  — Requires bare workflow (expo prebuild)

expo-health-kit (managed workflow)
  — Covers read-only access to most quantity types
  — Cannot write workout sessions (HKWorkout)
  — Acceptable for Phase 1 readiness data reads
```

**Permission model:** HealthKit uses per-type permissions. Request the minimum set at onboarding (HRV, sleep, resting HR) and request additional types contextually when the feature is introduced (workout write when the user finishes their first session).

**Privacy consideration:** HealthKit data never leaves the device through HealthKit itself. If the app sends readiness data to Supabase for AI processing, this must be disclosed in the privacy policy with explicit user consent at the data-sharing prompt.

**Implementation complexity:** Medium. Read access in managed workflow is 2-3 days. Full read/write with bare workflow migration is 1-2 weeks including regression testing.

---

### 2.2 Google Health Connect (Android)

Google Health Connect (the successor to Google Fit's REST API, available as an on-device API since Android 13) mirrors HealthKit's capabilities closely.

**Data types of interest:**

| Health Connect Type | iOS Equivalent | Priority |
|--------------------|----------------|----------|
| `SleepSessionRecord` | Sleep analysis | High |
| `RestingHeartRateRecord` | Resting HR | High |
| `HeartRateVariabilityRmssdRecord` | HRV SDNN | High |
| `ExerciseSessionRecord` | HKWorkout | High |
| `WeightRecord` | Body mass | Medium |
| `ActiveCaloriesBurnedRecord` | Active energy | Medium |
| `Vo2MaxRecord` | VO2 Max | Medium |

**Implementation approach:**

```
react-native-health-connect
  — Official community library wrapping Google Health Connect SDK
  — Expo config plugin available for managed/bare workflow
  — API surface mirrors react-native-health for HealthKit
  — Android 13+ required; graceful degradation on Android 12
```

**Key difference from HealthKit:** Health Connect requires the user to install the Health Connect app (bundled in Android 14+, separate install on Android 13). The onboarding flow must check for availability and provide an install prompt with graceful fallback if unavailable.

**Implementation complexity:** Medium. Very similar to HealthKit integration. Cross-platform abstraction layer recommended — a single `src/features/health/services/healthPlatformService.ts` that exposes a unified interface over both SDKs. The Zustand readiness store should consume this service, not the platform SDKs directly.

---

### 2.3 Samsung Health

Samsung Health does not offer a public third-party React Native SDK. Integration options are:

1. **Via Google Health Connect:** Samsung Health syncs data to Health Connect on compatible devices (Galaxy S21+, Android 13+). If the user has this sync enabled, Health Connect integration automatically captures Samsung Health data. This is the recommended path — zero additional code.
2. **Samsung Health SDK (native module):** A native Android module could integrate the Samsung Health SDK directly, but this requires a partner agreement with Samsung, significant native development work, and maintenance of a separate code path. Not recommended.

**Recommendation:** Advertise "Samsung Health" compatibility only after the Health Connect integration is live and tested on Samsung devices. Users must manually enable the Health Connect sync in Samsung Health settings.

---

## 3. Wearable Integrations

### 3.1 Apple Watch

**Companion app possibilities:**

A watchOS companion app for this React Native app requires a separate native Swift/SwiftUI target. The communication bridge between the RN app and Watch app uses WatchConnectivity framework. This is significant scope — plan as a discrete sprint, not a feature addition.

**High-value Watch features:**

| Feature | Implementation | Priority |
|---------|---------------|----------|
| Rest timer complication | WKComplication — shows countdown on watch face | Phase 2 |
| Active HR during workout | HKWorkoutSession streams live HR to paired iPhone | Phase 2 |
| Set logging from wrist | WCSession sends set completion event to phone | Phase 3 |
| Haptic on timer end | WKHapticType.notification | Phase 2 |
| Next set weight display | WCSession message on set completion | Phase 2 |

**Implementation approach:**

```
expo-apple-watch (does not exist as a managed solution)
  — Must build a native Swift watchOS target
  — Communicates via WatchConnectivity (WCSession)
  — React Native side uses NativeEventEmitter to receive watch events
  — Requires bare workflow + Xcode configuration
```

The most practical Phase 2 approach: Read HRV and sleep from HealthKit (which Apple Watch already writes to) rather than building a Watch companion app. The Watch app itself becomes a Phase 3 investment when the user base justifies the engineering cost.

**Implementation complexity:** High (Watch companion app). Low (reading Watch-sourced data from HealthKit).

---

### 3.2 Wear OS

Android's equivalent of watchOS companion apps. Uses the Wearable Data Layer API via Google Play Services. Same analysis as Apple Watch applies — significant native development scope, reads via Health Connect are the practical Phase 2 approach.

---

### 3.3 Garmin Connect API

Garmin offers the Health API and Connect IQ platform. For a fitness app focused on strength training, the relevant data Garmin can provide:

- Sleep stages and sleep score
- Body Battery (Garmin's energy readiness metric)
- HRV status (on supported devices: Fenix 7+, Forerunner 255+, Epix)
- Running dynamics and VO2 Max

**Integration approach:** Garmin's Health API is a server-to-server OAuth 2.0 API. The flow is:

1. User authenticates with their Garmin Connect account (OAuth 2.0 via browser redirect)
2. Garmin pushes data to a registered webhook URL (Supabase Edge Function)
3. Edge Function stores normalized readiness data in Supabase `user_readiness` table
4. Mobile app reads from Supabase on next sync

This is a pure backend integration — no React Native SDK required. The Supabase Edge Function acts as the webhook receiver and data normalizer.

**Scope:** Medium-low backend work. Garmin's API is well-documented and stable. The OAuth flow in the mobile app is a standard WebView redirect handled by `expo-auth-session`.

**Priority:** Phase 2. Garmin users are a strong overlap with advanced strength athletes (James persona).

---

### 3.4 Whoop API

Whoop provides a developer API (OAuth 2.0) exposing:
- Recovery score (0-100)
- HRV (RMSSD)
- Resting heart rate
- Sleep performance
- Strain score

This data maps directly onto the readiness input for the progression calculator. A Whoop user with a 40% recovery score should receive noticeably more conservative load prescriptions than on a 90% recovery day.

**Integration approach:** Same server-side OAuth pattern as Garmin. Whoop pushes to webhooks or the app polls the REST API via Supabase Edge Function on a schedule (Supabase scheduled functions, available since late 2025).

**Scope:** Low-medium backend work. The Whoop API is public and well-documented. OAuth flow handled by `expo-auth-session`.

**Priority:** Phase 2. Whoop users are highly engaged fitness enthusiasts who will value the integration.

---

### 3.5 Oura Ring API

Oura's REST API (v2) provides readiness score, sleep score, HRV, and activity data. Nearly identical integration pattern to Whoop. The Oura readiness score is a composited metric that can serve as a single input replacing individual HRV/sleep readings.

**Integration approach:** Server-side OAuth, Supabase Edge Function webhook/poll, normalized readiness store.

**Priority:** Phase 2. Oura users skew toward health-optimized, data-driven individuals — strong product-market fit overlap.

---

### 3.6 Polar Heart Rate Monitors

Polar's Bluetooth SDK (`PolarBleSdk`) streams real-time HR data directly via BLE without an account or OAuth. This enables live heart rate display during sets — useful for cardio component tracking in concurrent training programs.

**React Native implementation:**

```
react-native-ble-plx or @abandonware/react-native-bluetooth-classic
  — Generic BLE libraries that can communicate with Polar H10/H9 using Polar's GATT profile
  — Polar BLE SDK for React Native does not officially exist; community wrappers available

Alternative: expo-bluetooth (does not exist in managed workflow)
  — Requires bare workflow + native BLE permissions
```

**Implementation complexity:** High. BLE in React Native is notoriously complex, especially maintaining connections during active workout screens. This is a Phase 3 feature for advanced users.

---

## 4. Fitness Ecosystem Integrations

### 4.1 Strava API

Strava is directly relevant for the James persona — concurrent strength + running training. Importing running activities from Strava enables:
- Accurate concurrent training load calculation (prevents overprogramming on heavy run weeks)
- Interference effect detection (high running volume reduces strength progression tolerance)
- Rest day identification (non-strength active recovery days)

**Integration approach:**

Strava's REST API uses OAuth 2.0. The standard integration pattern:

1. `expo-auth-session` handles the OAuth browser redirect to Strava
2. Supabase Edge Function exchanges the auth code for tokens (keeps Strava client secret server-side)
3. Background sync job polls Strava activities API and writes to a `running_sessions` table in Supabase
4. `running_sessions` data is included in the daily workout generation prompt context

**Key Strava API data:**

| Field | Use in AI Engine |
|-------|-----------------|
| `distance` | Weekly running volume |
| `moving_time` | Training duration for load calculation |
| `total_elevation_gain` | Intensity proxy for hilly runs |
| `average_heartrate` | Cardiovascular load |
| `suffer_score` | Strava's effort composite (less reliable than HR zones) |
| `type` (Run/Ride/etc.) | Filter for endurance-only activities |

**Strava Webhook API:** Strava offers activity webhooks that push new activities in near real-time. This is preferable to polling and reduces API rate limit concerns.

**Implementation complexity:** Medium. OAuth flow is standard, data model is clean. The main work is the Supabase Edge Function webhook receiver and the AI prompt engineering to incorporate running load.

**Priority:** Phase 2. The James persona (primary user) explicitly uses concurrent training. This integration directly improves programming quality for this audience.

---

### 4.2 MyFitnessPal API

MyFitnessPal's API provides nutrition data that could improve load prescription accuracy — undereating relative to training volume is a common reason RPE is unexpectedly high. However, the MFP Premium API access requires a partnership agreement and is not publicly available for new integrations as of early 2026.

**Practical alternative:** Apple Health and Google Health Connect both receive nutrition data from MyFitnessPal (and other apps). If the app already reads from HealthKit, dietary energy data from MFP flows through automatically on iOS.

**Recommendation:** Do not pursue a direct MFP integration. Let HealthKit act as the aggregation layer. This avoids the partnership dependency and API rate limits.

---

### 4.3 Cronometer

Cronometer's API is more open than MyFitnessPal and provides micronutrient data (zinc, magnesium, vitamin D) that directly affects recovery quality and testosterone production. However, this level of nutrition-recovery correlation requires more data than most users will provide consistently and introduces nutritional science into the coaching scope — which the PROJECT_BRIEF explicitly excludes.

**Recommendation:** Out of scope. Nutrition tracking is listed as a non-goal in the PROJECT_BRIEF.

---

### 4.4 Runna

Runna is a running plan app used by the primary persona (James). Unlike Strava, Runna focuses on structured running plans with planned sessions. Importing Runna plan data would enable the AI to account for planned high-intensity running sessions in the coming week when scheduling strength training — a meaningful improvement for concurrent training programming.

**Integration blocker:** Runna does not have a public API as of March 2026. The only available integration path is via Strava (Runna marks planned workouts as completed activities on Strava) or via HealthKit activity data.

**Recommendation:** Track Runna's API roadmap. In the near term, the Strava integration captures Runna-executed sessions after the fact, which is sufficient for retrospective load analysis. Pre-planned concurrent scheduling requires either a Runna API or manual user input ("I have a hard track session Tuesday").

---

### 4.5 TrainingPeaks

TrainingPeaks has a partner API for endurance training data (TSS, CTL, ATL — chronic and acute training load metrics). This data is highly relevant for concurrent athletes but requires a formal partnership application. TrainingPeaks targets coaches and serious endurance athletes — the overlap with the strength-primary target audience is narrow.

**Recommendation:** Phase 3 consideration if the user base demonstrates significant endurance athlete presence. Not warranted at launch.

---

## 5. AI and ML Service Integrations

### 5.1 Claude API (Anthropic)

As established in the tech stack decisions, Claude is the primary AI engine. All Claude API calls must be proxied through Supabase Edge Functions — never called directly from the mobile client.

**Structured outputs:** Claude's native structured output support (available since November 2025 in Sonnet 4.5+) means the app can define Zod schemas for mesocycle responses, daily workout prescriptions, and adaptation recommendations, and receive guaranteed JSON-compliant responses. This eliminates retry logic for malformed AI responses.

**Prompt caching:** Structure all prompts with stable context first (user profile, injury list, periodization model, current mesocycle phase) to maximize Anthropic's 5-minute cache window. Estimated 60-70% reduction in token costs for daily workout generation calls where the context is largely unchanged between consecutive users.

**Models to consider:**

| Use Case | Recommended Model | Rationale |
|----------|------------------|-----------|
| Mesocycle generation (monthly) | claude-opus-4 | Complex, high-stakes planning; latency acceptable |
| Daily workout prescription | claude-sonnet-4-5 | Balance of quality and speed; called once per session |
| Mid-workout adaptation alerts | claude-haiku-3-5 | Low latency required (<2s); simple decision logic |
| Post-workout insights | claude-sonnet-4-5 | Moderate complexity; user reviews at session end |
| Conversational Q&A | claude-sonnet-4-5 with streaming | Real-time feel for coaching conversation |

---

### 5.2 On-Device ML: Core ML and TensorFlow Lite

**Core ML (iOS):** Expo SDK 54 supports Core ML via the `expo-ml` package (experimental as of SDK 54). Use cases for on-device ML:

- **RPE prediction from workout velocity:** If a barbell velocity sensor integration is added in Phase 4, a lightweight regression model can predict RPE from bar speed, running entirely on-device.
- **Pattern classification from local history:** A small classification model could tag workout sessions (good session, recovery day, overreach) without a network call. This classification feeds into the readiness input with zero latency.

**Current recommendation:** Do not build custom on-device ML models for V1. The Claude API approach via Edge Functions is substantially simpler, produces better results, and avoids the model training and update distribution complexity. Revisit in Phase 4 if specific latency or offline constraints require it.

**EmbeddingGemma (Google, September 2025):** As documented in the research findings, this 308MB model enables on-device text embeddings for semantic memory retrieval without a network call. If the agentic memory system needs to retrieve patterns during a workout in airplane mode, EmbeddingGemma is the path. Phase 3 evaluation item.

---

### 5.3 Vector Database for Agentic Memory

The tech stack decisions document establishes the following:

- **Phase 1:** `sqlite-vec` extension within local SQLite for on-device pattern storage. Sufficient for a small number of patterns per user (<500).
- **Phase 2:** Supabase pgvector with HNSW indexing for server-side semantic retrieval. Embeddings generated via a Supabase Edge Function calling a remote embedding API (OpenAI `text-embedding-3-small` or Anthropic embedding endpoint when available).

**Local sqlite-vec schema integration:**

The existing `agentic_memories` table in the Drizzle schema already includes an `embedding_vector BLOB` column. The `sqlite-vec` extension loads via Drizzle's raw SQL execution at database initialization. ANN queries use the `vec_search` virtual table syntax.

**Embedding generation strategy:** On-device embedding generation is not viable at V1 scale with acceptable quality. Generate embeddings server-side (Supabase Edge Function) when a new memory pattern is created. Sync the embedding back to the device alongside the memory record during the normal sync cycle.

---

### 5.4 Voice Interface

**Siri Shortcuts:** `expo-apple-authentication` does not provide Siri integration. Siri Shortcuts require a native `INIntent` implementation (SiriKit). The most valuable use case is a "Start my workout" shortcut that deep-links to the active workout screen. Expo provides a config plugin approach for deep link handling; Siri Shortcuts registration is a separate native module.

**Google Assistant:** Similar to Siri, requires native integration via App Actions and BII (Built-In Intents). Deep linking is simpler and achievable via React Navigation's linking configuration.

**Recommendation:** Implement deep link handling for workout start (`intelligenttrainer://workout/start`) as a Phase 2 feature. Register as a Siri Shortcut (iOS) and App Action (Android). Full voice logging ("log squat 100kg 5 reps") is Phase 4 scope and requires a custom voice model or NLP integration.

---

## 6. Data Export and Import

### 6.1 Strong CSV Import

Strong exports a CSV file format that is the de facto migration standard for strength training apps. Supporting this import is critical for user acquisition — a significant portion of the target audience currently uses Strong.

**Strong CSV format:**

```
Date,Workout Name,Duration,Exercise Name,Set Order,Weight,Reps,RPE,Notes
2025-12-01,Legs,1h 23m,Squat (Barbell),1,100,5,,
2025-12-01,Legs,1h 23m,Squat (Barbell),2,100,5,,
```

**Import flow:**

1. User taps "Import from Strong" in Profile settings
2. `expo-document-picker` opens the file picker
3. The selected CSV is parsed on-device using a streaming parser (no size limit)
4. Parsed data is validated with Zod (verify exercise names, weight ranges, date formats)
5. User reviews a summary: "Found 847 workouts across 2 years. Import?"
6. Workouts are written to local SQLite in a batch transaction
7. On next Supabase sync, historical data is uploaded

**Exercise name normalization:** Strong's exercise names will not exactly match the app's exercise library (e.g., "Bench Press (Barbell)" vs "Barbell Bench Press"). Implement a fuzzy matching step during import, with a manual review screen for unmatched exercises. This is also an opportunity to seed the AI memory system with historical patterns from Strong data.

**Implementation complexity:** Medium. CSV parsing is straightforward; the exercise name normalization fuzzy matching and the import UI add complexity.

**Library recommendation:**

```
papaparse — Gold standard CSV parser, 12k GitHub stars, handles edge cases (quoted fields, BOM, CRLF)
  — Works in React Native JavaScript thread
  — Stream parsing avoids memory issues for large files
```

---

### 6.2 Fitbod and JEFIT Import

Neither Fitbod nor JEFIT exports a standardized format. Fitbod's export (CSV) has a similar column structure to Strong's. JEFIT exports XML. Both can be supported with separate parser implementations once the Strong import is validated and stable.

**Priority:** Phase 3. Strong import covers the majority of the migration market. Fitbod and JEFIT together represent a secondary segment.

---

### 6.3 Universal Export Formats

**JSON export (primary):** Full data export as a structured JSON file including all workouts, sets, mesocycles, and AI memories. This is the backup and portability format.

**CSV export:** Flattened CSV of all set logs, compatible with spreadsheet analysis. Less structured but more universally accessible.

**HealthKit/Health Connect write-back:** Writing completed strength workouts to the platform health store effectively creates a portable record visible to other apps.

**Implementation approach:** Generate exports in a Supabase Edge Function (avoids mobile memory constraints for large datasets), then deliver via a signed download URL. For on-device exports (offline users), generate from local SQLite using `expo-file-system` and share via the native share sheet.

---

### 6.4 Data Portability Regulations

**GDPR (EU):** Users in the EU have the right to data portability (Article 20) and the right to erasure (Article 17). The JSON export satisfies portability. Hard delete on request must be implemented — the soft delete architecture means `deleted_at` records must be purged from Supabase within 30 days of an erasure request. A Supabase Edge Function triggered by a user deletion request handles this.

**CCPA (California):** Similar export and deletion rights. The implementation overlaps significantly with GDPR compliance.

**App Store requirements:** Apple requires a "Delete Account" option accessible from within the app. This must trigger the full data erasure flow. Google Play has the same requirement since December 2023.

**Implementation:** Phase 2 (alongside Supabase rollout). The deletion flow requires both Supabase data removal and Supabase Auth account deletion.

---

## 7. Social and Sharing Integrations

### 7.1 Workout Summary Sharing

Light-touch sharing consistent with the non-social-app philosophy. The primary use case is sharing a workout summary card (image) to Instagram Stories, WhatsApp, or any system share sheet.

**Implementation approach:**

```
react-native-view-shot — Captures a React Native view as a PNG/JPEG
  — The WorkoutSummaryCard component is rendered off-screen and captured
  — Result shared via React Native's built-in Share API (iOS share sheet / Android intent)
  — No third-party social SDK required
```

The summary card includes: workout name, duration, volume, key PRs, and an app store link. Avoid showing detailed data (weights, specific movements) on the card — privacy-conscious users may not want to share this publicly.

**Implementation complexity:** Low. 1-2 days.

---

### 7.2 Coach-Athlete Data Sharing

For coaches managing multiple athletes, the data model needs a `coach_relationships` table in Supabase with appropriate RLS policies. A coach sees their athletes' workout history, readiness trends, and progression charts via a web dashboard (not the mobile app — this is out of scope for the initial product).

**Recommendation:** Design the Supabase RLS policies to support coach-athlete relationships from Phase 2, but do not build the coach dashboard until there is clear demand. The mobile app can expose a "Share with Coach" feature that generates a read-only access token.

**Priority:** Phase 3.

---

### 7.3 Developer API

A public REST API for third-party developers follows only after the user base is established. The Supabase PostgREST layer already provides an auto-generated REST API; the work is documentation, API key management, and rate limiting.

**Priority:** Phase 4 or later.

---

## 8. Payment and Subscription

### 8.1 RevenueCat (Primary — In-App Purchases)

RevenueCat is the industry standard for in-app subscription management in React Native apps and is the clear choice for iOS App Store and Google Play billing.

**Why RevenueCat over direct StoreKit/Billing Library:**

- Cross-platform abstraction with a single API for iOS and Android
- Webhook-based entitlement verification (Supabase Edge Function receives entitlement events and updates user subscription status)
- Built-in subscription analytics, cohort analysis, and churn prediction
- A/B testing for paywall variants without app updates
- Handles grace periods, billing retry, and refund detection automatically

**React Native integration:**

```
react-native-purchases (RevenueCat's official SDK)
  — Expo config plugin available (managed workflow compatible)
  — Supabase integration via RevenueCat webhooks to Edge Function
```

**Subscription tier design:**

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | Basic logging, 3-month history, manual progression |
| Pro | $9.99/month | AI mesocycle generation, unlimited history, readiness integration, wearable sync |
| Annual Pro | $79.99/year | All Pro features, 33% discount |

**Implementation complexity:** Low-medium. RevenueCat's React Native SDK is well-documented. The Supabase webhook integration for entitlement status requires 1-2 Edge Functions.

**Priority:** Phase 1. The app must have a monetization path before App Store submission.

---

### 8.2 Stripe (Web Billing)

If a web companion app or coach dashboard is built in Phase 3, Stripe handles billing for web-originated subscriptions. Stripe and RevenueCat can coexist — RevenueCat manages App Store/Play Store subscriptions, Stripe manages web subscriptions. Both should update the same `user_subscriptions` table in Supabase via their respective webhook integrations.

**Implementation complexity:** Medium (when the web app is built). Not relevant for the mobile-only Phase 1 and Phase 2.

---

### 8.3 Family Plans and Group Licensing

RevenueCat supports group subscriptions via the "Family Sharing" mechanism on iOS (App Store handles seat sharing). Android has no equivalent — multi-seat plans on Android require a custom implementation using Stripe for web billing with Supabase-managed seat counts.

**Recommendation:** Support iOS Family Sharing passively (RevenueCat handles it automatically). Do not build custom multi-seat licensing until there is demonstrated demand from gym owners or corporate wellness buyers.

---

## 9. Priority Integration Roadmap

### Phase 1 — Launch (Weeks 1-24)

**Must-have for App Store approval and monetization:**

| Integration | Library/Service | Effort |
|------------|----------------|--------|
| RevenueCat in-app subscriptions | `react-native-purchases` | 3-4 days |
| Strong CSV import | `papaparse` + custom parser | 3-4 days |
| Claude API (via Supabase Edge Functions) | Anthropic SDK (server-side) | Already planned |
| Deep link handling (Siri Shortcut prep) | React Navigation linking config | 1 day |
| Workout summary share card | `react-native-view-shot` | 1-2 days |
| JSON/CSV data export (on-device) | `expo-file-system` + share sheet | 2 days |

**Total Phase 1 integration effort:** ~2 weeks parallel to core feature development

---

### Phase 2 — First 3 Months Post-Launch

**High-value additions that improve AI prescription quality:**

| Integration | Library/Service | Effort |
|------------|----------------|--------|
| Apple HealthKit (read: HRV, sleep, RHR) | `react-native-health` + bare workflow | 1 week |
| Google Health Connect (read: HRV, sleep, RHR) | `react-native-health-connect` | 1 week |
| Supabase pgvector for memory (server-side) | Supabase MCP + Edge Functions | 3 days |
| Strava activity sync | `expo-auth-session` + Edge Function webhook | 1 week |
| Garmin Connect API (server-side) | Supabase Edge Function + webhook | 1 week |
| Whoop API (server-side) | Supabase Edge Function + webhook | 3-4 days |
| Oura Ring API (server-side) | Supabase Edge Function + webhook | 3-4 days |
| GDPR/CCPA delete account flow | Supabase Edge Function | 3 days |

**Total Phase 2 integration effort:** ~6-8 weeks; can be parallelized across 2 developers

---

### Phase 3 — 3-6 Months Post-Launch

**Ecosystem expansion and advanced features:**

| Integration | Library/Service | Effort |
|------------|----------------|--------|
| Apple Watch companion (rest timer, next set) | Native Swift target + WCSession | 4-6 weeks |
| Fitbod CSV import | Custom parser | 1 week |
| JEFIT XML import | Custom parser | 1 week |
| EmbeddingGemma on-device embedding | Native module or community package | 2-3 weeks |
| Coach-athlete sharing (read-only tokens) | Supabase RLS + mobile UI | 1-2 weeks |
| Siri Shortcut registration | Native config plugin | 1 week |
| Stripe (web billing, if web app is built) | Stripe SDK + Edge Function | 2 weeks |

**Total Phase 3 integration effort:** ~12-16 weeks across the team; Apple Watch is the dominant investment

---

## 10. Integration Architecture Patterns

### 10.1 The Edge Function Integration Layer

All third-party API calls that require secret key management route through Supabase Edge Functions. This architecture applies uniformly to Anthropic, Strava, Garmin, Whoop, and Oura.

```
Mobile App
  └── Supabase JS client (authenticated)
        └── Supabase Edge Function (Deno runtime)
              ├── Validates user JWT
              ├── Calls third-party API with server-side secret
              ├── Normalizes response to internal types
              └── Returns normalized data (or writes to Supabase directly)
```

**Why this matters for the existing architecture:** The offline-first SQLite database is the source of truth for workout data. Third-party integrations populate supplementary tables (`running_sessions`, `readiness_snapshots`, `wearable_data`) that are read-only inputs to the AI engine. They are never the source of truth for workout logs.

---

### 10.2 The Readiness Aggregation Pattern

Multiple data sources (HealthKit, Oura, Whoop, Garmin, manual input) contribute to a single readiness score used by the progression calculator. The aggregation logic lives in a Supabase Edge Function that runs nightly and writes to a `daily_readiness` table.

```
Sources                     Aggregator              Consumer
───────                     ──────────              ────────
HealthKit HRV          →
HealthKit Sleep        →    Supabase Edge Function  →  daily_readiness table
Oura Readiness Score   →    (nightly scheduled)     →  Synced to device
Whoop Recovery %       →
Manual user input      →
```

Priority order when multiple sources exist: Manual input > Oura/Whoop composite score > HealthKit raw HRV + sleep calculation.

This abstraction means the progression calculator in `src/features/ai/services/progressionCalculator.ts` consumes a single `ReadinessScore` type regardless of which wearables the user owns.

---

### 10.3 The OAuth Connection Pattern

All wearable and fitness platform OAuth connections follow the same mobile UI pattern:

1. User navigates to Profile > Connected Services
2. Taps "Connect [Service]"
3. `expo-auth-session` opens an in-app browser for the OAuth flow
4. On redirect, the auth code is exchanged for tokens via a Supabase Edge Function (keeps client secrets server-side)
5. Tokens are stored encrypted in Supabase (never in the mobile app)
6. Connection status is synced to the device and shown in the Connected Services list

The `src/features/profile/` feature module owns all connection UI. Each integration registers a service adapter that implements a standard `IntegrationAdapter` interface:

```typescript
interface IntegrationAdapter {
  readonly serviceId: string;
  readonly displayName: string;
  readonly dataTypes: ReadonlyArray<'hrv' | 'sleep' | 'running' | 'readiness'>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  syncLatestData(): Promise<void>;
}
```

---

### 10.4 Integration Impact on the AI Prompt

Every integration ultimately contributes to the prompt context sent to Claude for workout generation and adaptation. The integration investment only pays off if this context is used well.

Prompt context priority order (most impactful first):

1. Current mesocycle phase and week number
2. Last 7 days of workout performance (sets, reps, RPE actuals vs targets)
3. Today's readiness score with source attribution ("Oura: 73/100, sleep 7.2h, HRV 42ms")
4. Active injuries and restrictions
5. Strava/running activity from the last 5 days (concurrent load)
6. Agentic memory patterns relevant to today's planned session
7. User's historical preference patterns for this exercise type

This ordering ensures that even users with no wearables or Strava connections receive high-quality prescriptions, while connected users receive meaningfully improved personalization.

---

*This document should be revisited after Phase 1 launch with real user data on which integrations are most requested. The Phase 2 and Phase 3 roadmaps are subject to reprioritization based on user feedback.*
