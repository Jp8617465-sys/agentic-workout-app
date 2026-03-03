# Security Review — Intelligent Training Companion

**Version:** 1.0
**Date:** March 3, 2026
**Status:** Reviewed
**Inputs:** 04-SYSTEM-ARCHITECTURE.md, 05-BACKEND-ARCHITECTURE.md, 06-FRONTEND-ARCHITECTURE.md

---

## Table of Contents

1. [Threat Model (STRIDE)](#1-threat-model-stride)
2. [Authentication & Authorization](#2-authentication--authorization)
3. [Data Protection](#3-data-protection)
4. [API Security](#4-api-security)
5. [Offline Security](#5-offline-security)
6. [Supply Chain Security](#6-supply-chain-security)
7. [Row Level Security](#7-row-level-security)
8. [Secrets Management](#8-secrets-management)
9. [Prioritized Recommendations](#9-prioritized-recommendations)

---

## 1. Threat Model (STRIDE)

### 1.1 System Boundaries

```
┌───────────────────────┐     ┌───────────────────────┐     ┌──────────────┐
│  Mobile Device        │ ←→  │  Supabase Platform    │ ←→  │ Anthropic API│
│  (SQLite, app code)   │HTTPS│  (Auth, DB, Edge Fn)  │HTTPS│ (Claude)     │
└───────────────────────┘     └───────────────────────┘     └──────────────┘
        Trust boundary 1              Trust boundary 2
```

### 1.2 STRIDE Analysis

| Threat | Category | Attack Surface | Risk | Mitigation |
|--------|----------|---------------|------|------------|
| Impersonation | **S**poofing | Supabase Auth endpoint | Medium | JWT validation on every Edge Function call; `expo-secure-store` for token storage |
| Workout data modification | **T**ampering | SQLite on rooted/jailbroken device | Low | RLS on server ensures tampered data can't affect other users; data is personal |
| AI response tampering | **T**ampering | Man-in-middle on Edge Function response | Medium | TLS enforced; Zod validation of all Claude responses (`parseClaudeResponse`) |
| Workout history leakage | **I**nformation Disclosure | SQLite file on device, Supabase DB | Medium | RLS policies enforce `user_id = auth.uid()`; no SQLite encryption in Phase 1 (see §3.3) |
| Health/injury data exposure | **I**nformation Disclosure | `injuries` table, `readiness_*` fields | High | GDPR-relevant health data; RLS + encrypted transit; privacy policy required |
| AI service abuse | **D**enial of Service | Edge Function rate limits | Medium | Monthly token budget (500K tokens/user); rate limiting in Edge Function |
| PowerSync flood | **D**enial of Service | Sync upload queue | Low | `crudUploadThrottleMs: 200` limits upload rate; Supabase connection pooling |
| JWT theft | **E**levation of Privilege | Token stored in AsyncStorage (wrong) | High | **Must use `expo-secure-store`** — confirmed in architecture. Never AsyncStorage. |
| Exercise data poisoning | **T**ampering | exercises table is seed data | Low | Read-only RLS policy on `exercises` and `injury_risks` tables |

### 1.3 Key Assets Ranked by Sensitivity

1. **Anthropic API key** — full account access if leaked (Edge Function env only)
2. **User JWT tokens** — full user data access (expo-secure-store)
3. **Injury/health data** — GDPR special category data (RLS + privacy policy)
4. **Workout history** — personal training data (RLS)
5. **Agentic memories** — AI-learned patterns (RLS)
6. **Exercise seed data** — public, non-sensitive

---

## 2. Authentication & Authorization

### 2.1 Auth Flow

```
App Launch
  │
  ├── Check expo-secure-store for existing JWT
  │   ├── EXISTS → Validate expiry
  │   │   ├── VALID → Hydrate stores, enter app
  │   │   └── EXPIRED → Silent refresh via Supabase client
  │   │       ├── SUCCESS → Store new JWT, enter app
  │   │       └── FAIL → Redirect to login
  │   └── NONE → Show onboarding / login
  │
  ▼
Login (Supabase Auth)
  • Email + password (primary)
  • Apple Sign In (iOS requirement)
  • Google Sign In (Android)
  • No anonymous auth — user must create account for sync
```

### 2.2 Token Storage

```typescript
// CORRECT — use expo-secure-store (Keychain on iOS, EncryptedSharedPreferences on Android)
import * as SecureStore from 'expo-secure-store';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      getItem: (key: string) => SecureStore.getItemAsync(key),
      setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
      removeItem: (key: string) => SecureStore.deleteItemAsync(key),
    },
    autoRefreshToken: true,
    persistSession: true,
  },
});

// NEVER use AsyncStorage for tokens — it's plaintext on Android
```

### 2.3 Session Management

| Concern | Policy |
|---------|--------|
| Access token TTL | 1 hour (Supabase default) |
| Refresh token TTL | 30 days |
| Silent refresh | Supabase client handles automatically |
| Logout | Clear `expo-secure-store` + Supabase `signOut()` |
| Multi-device | Supported — each device has independent session |
| Force logout | Server-side: revoke refresh token via Supabase admin |

### 2.4 Authorization Model

Simple: every user can only access their own data. No roles, no sharing, no team features in Phase 1.

```
user_id = auth.uid()  ← enforced at every RLS policy
```

---

## 3. Data Protection

### 3.1 Data in Transit

| Channel | Protection |
|---------|-----------|
| App ↔ Supabase | HTTPS (TLS 1.3) — Supabase enforces |
| App ↔ PowerSync | HTTPS — PowerSync SDK enforces |
| Edge Function ↔ Anthropic | HTTPS — Anthropic SDK enforces |
| All HTTP calls | Certificate pinning NOT required (adds complexity, Supabase rotates certs) |

### 3.2 Data at Rest — Server

Supabase PostgreSQL: encrypted at rest (AES-256) by default on hosted instances. No additional configuration needed.

### 3.3 Data at Rest — Device

**Phase 1: No SQLite encryption.** Rationale:
- SQLite encryption (SQLCipher) adds ~10% CPU overhead on every query
- Workout data is not financial or medical-diagnostic — it's training logs
- The primary risk is a rooted/jailbroken device, which is a platform-level compromise
- expo-sqlite does not natively support SQLCipher

**Phase 2 consideration:** If the app stores sensitive health integrations (Apple HealthKit, HRV data), evaluate SQLCipher or OP-SQLite with encryption.

**Current mitigations:**
- JWT tokens in `expo-secure-store` (hardware-backed keystore)
- SQLite file in app sandbox (not accessible to other apps on non-rooted devices)
- `deletedAt` soft deletes allow server-side data deletion requests (GDPR)

### 3.4 PII and Health Data

| Data | Classification | Handling |
|------|---------------|----------|
| Email | PII | Stored in Supabase Auth (managed), not in SQLite |
| Name | PII | `users.name` — synced, RLS protected |
| Injury records | Health data (GDPR special category) | `injuries` table — RLS, consent required |
| Readiness scores | Health-adjacent | `workouts.readiness_*` — RLS protected |
| Workout history | Fitness data | All workout tables — RLS protected |
| Agentic memories | Behavioral data | `agentic_memories` — RLS, pruning policy |

### 3.5 GDPR Compliance

| Requirement | Implementation |
|-------------|---------------|
| Right to access | Export endpoint: query all user data via Supabase function |
| Right to erasure | Delete endpoint: cascade delete user + all related data |
| Right to portability | JSON export of all workout data |
| Consent | Onboarding flow includes data processing consent |
| Data minimization | No unnecessary data collection; memories pruned at 500 |
| Privacy policy | Required before App Store submission |
| Health data consent | Separate consent for injury tracking (GDPR Art. 9) |

---

## 4. API Security

### 4.1 Edge Function Hardening

The `ai-coach` Edge Function is the only server-side code and the sole gateway to the Anthropic API.

```typescript
// Security checklist for supabase/functions/ai-coach/index.ts

// 1. JWT validation (already in architecture)
const { data: { user }, error } = await supabase.auth.getUser();
if (error || !user) return new Response('Unauthorized', { status: 401 });

// 2. Rate limiting — monthly token budget
const MONTHLY_LIMIT = 500_000; // tokens per user per month
const monthlyTokens = await getUserMonthlyTokenUsage(supabase, user.id);
if (monthlyTokens > MONTHLY_LIMIT) {
  return new Response(JSON.stringify({ error: 'monthly_limit_exceeded' }), { status: 429 });
}

// 3. Input validation — Zod on EVERY request
const parsed = AIRequestSchema.safeParse(body);
if (!parsed.success) {
  return new Response(JSON.stringify({ error: 'invalid_request' }), { status: 400 });
}

// 4. Output validation — Zod on EVERY Claude response
const parsedResponse = schemaMap[type].safeParse(toolUseResult);
if (!parsedResponse.success) {
  // Log for debugging, return 500 to trigger client fallback
  console.error('Claude response validation failed', parsedResponse.error);
  return new Response(JSON.stringify({ error: 'ai_response_invalid' }), { status: 500 });
}

// 5. Request size limit
const body = await req.text();
if (body.length > 50_000) { // 50KB max
  return new Response('Request too large', { status: 413 });
}
```

### 4.2 Rate Limiting Summary

| Limit | Value | Scope |
|-------|-------|-------|
| Monthly token budget | 500,000 tokens | Per user |
| Request size | 50KB | Per request |
| Concurrent requests | 1 (Edge Function default) | Per user |
| Mesocycle generation | 1 per day | Per user |
| Daily prescription | 1 per 8 hours (cache TTL) | Per user |

### 4.3 Input Validation Boundaries

```
┌──────────────────────┐
│ Client (React Native) │
│                       │
│ Zod validation on:    │
│ - SetInput (weight,   │
│   reps, rpe ranges)   │
│ - User profile fields │
│ - Numpad input        │
│   (numeric only)      │
└──────────┬────────────┘
           │
    ┌──────▼──────────────┐
    │ Edge Function        │
    │                      │
    │ Zod validation on:   │
    │ - AIRequestSchema    │
    │   (all request types)│
    │ - Claude response    │
    │   (all schemas)      │
    │ - Request body size  │
    └──────────────────────┘
```

### 4.4 Prompt Injection Mitigation

The Claude API is called with structured tool use (`tool_choice: { type: 'tool', name: 'respond' }`), which constrains output to the Zod schema. User-provided data (workout history, readiness scores) is included in the `userMessage`, not the `systemPrompt`.

Additional safeguards:
- User notes field (`workouts.notes`) is sanitized before inclusion in prompts
- Memory descriptions are generated by the system, not user-authored
- Exercise names come from seed data, not user input

---

## 5. Offline Security

### 5.1 SQLite Protection

| Risk | Mitigation |
|------|-----------|
| Device theft (unlocked) | App data in sandbox; iOS Data Protection (Complete until first unlock) |
| Device theft (locked) | iOS Keychain + Android Keystore protect JWT; SQLite inaccessible |
| Rooted/jailbroken | Accept risk — platform compromise is outside app control |
| Backup extraction | Exclude SQLite from iCloud/Google backup (`excludeFromBackup: true`) |
| Screenshot capture | No sensitive data on screen (weights/reps are not sensitive) |

### 5.2 PowerSync Sync Security

- All sync traffic over HTTPS (TLS 1.3)
- JWT required for every sync connection
- PowerSync validates JWT against Supabase Auth
- Sync rules enforce same RLS policies as direct DB access
- Upload queue is local-only — not accessible to other apps

### 5.3 Conflict Resolution Attack Vectors

| Attack | Scenario | Mitigation |
|--------|----------|-----------|
| Replay attack | Resend old sync data | `server_updated_at` timestamps prevent stale overwrites |
| Data injection | Craft sync payload with another user's `user_id` | RLS policy: `auth.uid() = user_id` — server rejects |
| Active workout hijack | Modify active workout via sync | Client-always-wins policy for active workouts |
| Memory poisoning | Inject false agentic memories | LWW policy + `user_id` RLS — can only modify own |

---

## 6. Supply Chain Security

### 6.1 Dependency Audit Strategy

```bash
# Weekly audit in CI
npx audit-ci --critical --high
npm audit --audit-level=high

# Lock file integrity
npm ci  # Always use ci in CI/CD (respects lockfile exactly)
```

### 6.2 Key Dependencies Risk Assessment

| Package | Risk Level | Rationale |
|---------|-----------|-----------|
| expo (Expo SDK 54) | Low | Large org, active maintenance, security team |
| expo-sqlite | Low | First-party Expo, JSI-based |
| drizzle-orm | Low | Active community, TypeScript-first |
| @powersync/react-native | Medium | Smaller company; evaluate alternatives if abandoned |
| @legendapp/state | Medium | Smaller community; core logic is simple |
| react-native-reanimated | Low | Software Mansion, widely adopted |
| @gorhom/bottom-sheet | Medium | Single maintainer; fork if abandoned |
| zod | Low | Widely adopted, no runtime deps |

### 6.3 OTA Update Security

- Expo EAS Update signs OTA bundles
- Code signing prevents tampering with JS bundles
- Critical security fixes can be pushed OTA without App Store review
- Native code changes require full App Store submission

### 6.4 Build Integrity

- EAS Build runs in Expo's cloud — no local build secrets
- Environment variables set via EAS secrets (not committed)
- `app.json` does not contain any secrets
- `.gitignore` excludes `.env`, `*.keystore`, `*.mobileprovision`

---

## 7. Row Level Security

### 7.1 User-Owned Tables

Every table with a `user_id` column gets the same RLS pattern:

```sql
-- Enable RLS
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

-- Policy: users can only CRUD their own data
CREATE POLICY "Users own their data" ON workouts
  FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
```

Applied to all user-owned tables:
- `users` (id = auth.uid())
- `injuries`
- `user_equipment`
- `mesocycles`
- `microcycles`
- `workouts`
- `exercise_performances`
- `set_logs`
- `agentic_memories`
- `user_disagreements`
- `ai_usage_log`

### 7.2 Read-Only Seed Data

```sql
-- Exercises: anyone can read, nobody can write via API
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Exercises are public read" ON exercises
  FOR SELECT USING (true);
-- No INSERT/UPDATE/DELETE policies = blocked

-- Same for injury_risks
ALTER TABLE injury_risks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Injury risks are public read" ON injury_risks
  FOR SELECT USING (true);
```

### 7.3 AI Response Cache (No Sync)

`ai_response_cache` is local-only (not synced via PowerSync). No RLS needed — it never reaches Supabase. If it were synced in Phase 2, same user-owned policy would apply.

### 7.4 RLS Verification

```sql
-- Test: attempt to read another user's data (should return 0 rows)
-- Run as authenticated user via Supabase client
SELECT * FROM workouts WHERE user_id != auth.uid();
-- Expected: 0 rows (RLS blocks)

-- Test: attempt to insert with wrong user_id
INSERT INTO workouts (id, user_id, date) VALUES ('test', 'other-user-id', now());
-- Expected: RLS violation error
```

---

## 8. Secrets Management

### 8.1 Secret Location Map

```
┌─────────────────────────────────┬──────────────────────────────────┐
│ Secret                          │ Location                         │
├─────────────────────────────────┼──────────────────────────────────┤
│ ANTHROPIC_API_KEY               │ Supabase Edge Function env var   │
│                                 │ (never in bundle, never on device)│
├─────────────────────────────────┼──────────────────────────────────┤
│ SUPABASE_URL                    │ app.json / env config            │
│                                 │ (public, safe to include)        │
├─────────────────────────────────┼──────────────────────────────────┤
│ SUPABASE_ANON_KEY               │ app.json / env config            │
│                                 │ (public, safe — RLS enforces)    │
├─────────────────────────────────┼──────────────────────────────────┤
│ User JWT (access token)         │ expo-secure-store on device      │
│                                 │ (hardware-backed keystore)       │
├─────────────────────────────────┼──────────────────────────────────┤
│ User JWT (refresh token)        │ expo-secure-store on device      │
├─────────────────────────────────┼──────────────────────────────────┤
│ POWERSYNC_URL                   │ app.json / env config            │
│                                 │ (requires JWT to connect)        │
├─────────────────────────────────┼──────────────────────────────────┤
│ EAS_BUILD_SIGNING_KEY           │ EAS Secrets (Expo cloud)         │
│                                 │ (never local)                    │
├─────────────────────────────────┼──────────────────────────────────┤
│ Apple/Google signing certs      │ EAS Credentials                  │
│                                 │ (managed by Expo)                │
└─────────────────────────────────┴──────────────────────────────────┘
```

### 8.2 What Must NEVER Be in the Bundle

- `ANTHROPIC_API_KEY` — enables unrestricted Claude API access
- `SUPABASE_SERVICE_ROLE_KEY` — bypasses all RLS policies
- Any database connection strings
- Any signing keys or certificates

### 8.3 Verification

```bash
# Scan bundle for leaked secrets (run in CI)
npx secretlint "**/*"

# Check that .env is in .gitignore
grep -q ".env" .gitignore || echo "WARNING: .env not in .gitignore"
```

---

## 9. Prioritized Recommendations

### P0 — Must Have Before Launch

| # | Action | Component |
|---|--------|-----------|
| 1 | Implement RLS policies on ALL user-owned tables | Supabase migrations |
| 2 | Verify JWT storage uses `expo-secure-store` (not AsyncStorage) | Auth setup |
| 3 | Zod-validate all Claude API responses in Edge Function | `ai-coach/index.ts` |
| 4 | Zod-validate all request bodies in Edge Function | `ai-coach/index.ts` |
| 5 | Set request body size limit (50KB) on Edge Function | `ai-coach/index.ts` |
| 6 | Monthly token budget enforcement | `ai-coach/usage.ts` |
| 7 | Privacy policy + health data consent in onboarding | Legal + UI |
| 8 | GDPR data export and deletion endpoints | Supabase function |
| 9 | `.gitignore` includes `.env`, secrets, keystores | Repository config |

### P1 — Should Have for Beta

| # | Action | Component |
|---|--------|-----------|
| 10 | CI secret scanning (secretlint) | GitHub Actions |
| 11 | Dependency audit in CI (`audit-ci`) | GitHub Actions |
| 12 | Exclude SQLite from device backups | `expo-sqlite` config |
| 13 | Sanitize user notes before AI prompt inclusion | `prompts.ts` |
| 14 | Rate limit mesocycle generation (1/day) | Edge Function |
| 15 | Log all Edge Function auth failures | Monitoring |

### P2 — Consider for v2

| # | Action | Component |
|---|--------|-----------|
| 16 | SQLite encryption (SQLCipher or OP-SQLite) if health integrations added | Database |
| 17 | Certificate pinning for Supabase connection | Network layer |
| 18 | Biometric auth for app unlock | expo-local-authentication |
| 19 | Anomaly detection on sync patterns | Server-side monitoring |
| 20 | SOC 2 compliance review | Organizational |
