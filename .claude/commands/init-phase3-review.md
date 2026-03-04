---
description: Phase 3 - Security and performance review of architecture using specialist agents
model: claude-sonnet-4-5
---

# Phase 3: Security & Performance Review

Review the planned architecture for security vulnerabilities and performance risks. Two specialist agents run in parallel.

## Prerequisites

This phase requires all outputs from Phases 1-2:
- `docs/01-PRD.md` through `docs/06-FRONTEND-ARCHITECTURE.md`
- `docs/PROJECT_BRIEF.md`

## Arguments

$ARGUMENTS

---

## Agent 1: Security Engineer (parallel)

Use the `security-engineer` agent.

### Task

Conduct a thorough security review of the Intelligent Training Companion architecture. This app handles sensitive health and fitness data.

### Security Review Scope

**1. API Key Management**
- Claude API key MUST NOT be bundled in the React Native app
- Review the proposed edge function proxy pattern
- Assess API key rotation strategy
- Check for key exposure in build artifacts, logs, error messages

**2. User Data Protection**
- Workout data classification (is it "health data" under GDPR/HIPAA?)
- Injury information sensitivity (medical-adjacent data)
- SQLite encryption at rest (SQLCipher or alternative)
- Data in transit (HTTPS, certificate pinning)
- Biometric authentication for app access
- Data export/deletion (right to be forgotten)

**3. Authentication & Authorization**
- Supabase Auth flow security (JWT handling, refresh token storage)
- Session management on mobile (token persistence, expiry)
- Row-level security in Supabase (when cloud sync is added)
- API rate limiting per user

**4. Input Validation**
- RPE values (must be 5.0-10.0 in 0.5 increments)
- Weight values (must be positive, reasonable range 0-1000kg)
- Reps values (must be positive integers, reasonable range 1-100)
- Exercise names (sanitize user-created exercises)
- Notes fields (prevent injection in SQLite queries)
- AI prompt injection (user input going into Claude API prompts)

**5. Third-Party Dependencies**
- npm dependency audit strategy
- Supply chain attack prevention
- Expo SDK security posture
- Claude API data retention policies

**6. Mobile-Specific Security**
- Secure storage for sensitive data (expo-secure-store)
- Jailbreak/root detection considerations
- Screenshot prevention for sensitive screens
- Deep link security
- Clipboard data exposure

**7. Compliance**
- Apple Health/HealthKit data handling requirements
- App Store health app review guidelines
- GDPR compliance for EU users (James is in Australia, but future users)
- Data residency considerations

### Required Output (`docs/07-SECURITY-REVIEW.md`)

For each finding:
```
| ID | Category | Severity | Finding | Recommendation | Priority |
|----|----------|----------|---------|----------------|----------|
| SEC-001 | API Keys | CRITICAL | ... | ... | P0 |
```

Plus:
1. **Security requirements** (must-implement before launch)
2. **Security architecture diagram** (data flow with encryption points)
3. **Threat model** (STRIDE or similar)
4. **Secure development checklist** (for each sprint)

---

## Agent 2: Performance Engineer (parallel)

Use the `performance-engineer` agent.

### Task

Review the architecture for performance risks and create an optimization plan targeting gym-floor usability.

### Performance Targets (from brief)

| Metric | Target | Priority |
|--------|--------|----------|
| Set logging speed | <10 seconds (auto-fill to checkbox) | P0 |
| App cold start | <2 seconds | P0 |
| Rest timer accuracy | 60fps, ±100ms | P0 |
| Screen transitions | <300ms | P1 |
| SQLite query (history) | <50ms for last 30 workouts | P1 |
| Claude API response | <3s for daily workout | P1 |
| Memory usage (active workout) | <150MB | P1 |
| Bundle size (initial) | <30MB | P2 |
| Battery drain (1hr workout) | <5% | P2 |

### Review Areas

**1. Interaction Performance (Set Logging Speed)**
- Auto-fill latency (SQLite query → pre-populate fields)
- Numeric keyboard appearance time
- Checkbox → RPE modal → timer chain (must feel instant)
- Swipe gesture recognition latency
- Haptic feedback timing

**2. Rendering Performance**
- ExerciseCard list virtualization (FlatList vs FlashList)
- SetRow re-render minimization (which props change?)
- Rest timer animation (useAnimatedStyle vs setInterval)
- RPE modal animation (spring physics for natural feel)
- Memo/useMemo/useCallback boundaries

**3. Data Layer Performance**
- SQLite query optimization for common patterns:
  - Get last workout with exercise X
  - Get workout history (paginated)
  - Get all memories for exercise X
  - Calculate volume trends
- Index effectiveness analysis
- Batch insert for set logs (save all at workout completion)
- Transaction grouping strategy

**4. AI Layer Performance**
- Claude API call optimization (minimize tokens, structured output)
- Response caching strategy (what to cache, TTL, invalidation)
- Preemptive generation (generate tomorrow's workout after today's)
- Fallback when API is slow/unavailable (use last prescription)
- Streaming responses for long-form analysis

**5. Memory Management**
- Active workout session memory lifecycle
- Exercise library caching strategy
- Image/video memory management (exercise demos)
- Vector store memory footprint
- Background task cleanup

**6. Network Performance**
- Offline queue batch processing
- API call prioritization (user-facing > background)
- Response compression
- Connection state monitoring

**7. Battery Optimization**
- Background timer implementation (avoid wake locks)
- Sync frequency optimization
- Location services usage (none needed - verify)
- Push notification efficiency

### Required Output (`docs/08-PERFORMANCE-PLAN.md`)

1. **Performance budget** (table with metric, target, measurement method)
2. **Critical path analysis** (set logging interaction breakdown in ms)
3. **Optimization recommendations** (prioritized by impact)
4. **Monitoring plan** (what to measure, how, alerting)
5. **Performance testing strategy** (benchmarks, profiling tools, CI checks)
6. **Anti-patterns to avoid** (specific to React Native + SQLite + animations)

---

## Checkpoint

After both agents complete:

```
PHASE 3 COMPLETE
─────────────────

Security Review:
- X findings (Y critical, Z high, W medium)
- Key requirement: [most important security item]
- Threat model created
- Compliance checklist ready

Performance Plan:
- X optimization recommendations
- Critical path: set logging in ~Xms (target: <10,000ms)
- Performance budget defined
- X anti-patterns identified

All architecture work complete. Proceed to Phase 4 (Sprint Planning)? [Y/N]
```
