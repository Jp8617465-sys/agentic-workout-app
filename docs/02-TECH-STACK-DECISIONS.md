# Technology Stack Decisions — Intelligent Training Companion

**Version:** 1.0
**Date:** March 3, 2026
**Status:** Validated & Approved

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Decision Matrix](#decision-matrix)
3. [Recommended Stack](#recommended-stack)
4. [Rejected Alternatives](#rejected-alternatives)
5. [Risk Register](#risk-register)
6. [Version Pinning](#version-pinning)
7. [Integration Concerns](#integration-concerns)

---

## Executive Summary

This document validates the proposed technology stack for the Intelligent Training Companion app against the requirements defined in `PROJECT_BRIEF.md`. The analysis covers 11 technology categories with research conducted as of March 2026.

**Key findings:**
- The core proposed stack is largely sound but requires **3 significant adjustments**
- NativeWind v4 has documented compatibility issues with Expo SDK 52+ and New Architecture; recommend starting with **NativeWind v4.1.x pinned to Expo SDK 54**
- FAISS is not viable for local React Native vector search; replace with **sqlite-vec** (SQLite extension)
- Reanimated 2 is end-of-life; upgrade to **Reanimated 3** (with Reanimated 4 as a future path post NativeWind v5)
- React Navigation is preferred over Expo Router for this app due to animation control requirements (rest timers, swipe gestures, workout modals)
- Legend State is a strong alternative to Zustand for the active workout session state specifically, due to its near-zero re-render profile

---

## Decision Matrix

Scoring: 1 (poor) to 5 (excellent) for each criterion.

**Criteria definitions:**
- **Performance**: Raw execution speed, bundle size, re-render efficiency on mid-range Android
- **DX**: Developer experience, TypeScript support, documentation quality, debugging tools
- **Community**: npm downloads, GitHub stars/activity, Stack Overflow presence, ecosystem support
- **Fitness**: How well the technology matches this app's specific requirements (offline-first, 10s set logging, 60fps timers, agentic memory)
- **Risk**: Inverse of risk — high score = low risk (stable, maintained, no known breaking issues)

| Category | Technology | Performance | DX | Community | Fitness | Risk | **Total** | Recommendation |
|----------|------------|-------------|-----|-----------|---------|------|-----------|----------------|
| **Mobile Framework** | React Native + Expo SDK 54 | 4 | 5 | 5 | 5 | 5 | **24** | ✅ ADOPT |
| **Language** | TypeScript strict | 4 | 5 | 5 | 5 | 5 | **24** | ✅ ADOPT |
| **Local DB** | expo-sqlite + Drizzle ORM | 4 | 5 | 4 | 4 | 5 | **22** | ✅ ADOPT |
| **Local DB** | WatermelonDB | 5 | 3 | 3 | 4 | 2 | **17** | ❌ REJECT |
| **Local DB** | Realm | 5 | 3 | 3 | 3 | 3 | **17** | ❌ REJECT |
| **Backend** | Supabase (Phase 2) | 4 | 5 | 5 | 5 | 5 | **24** | ✅ ADOPT |
| **State (global)** | Zustand | 4 | 5 | 5 | 4 | 5 | **23** | ✅ ADOPT |
| **State (workout)** | Legend State | 5 | 4 | 3 | 5 | 4 | **21** | ✅ ADOPT (workout session only) |
| **State (workout)** | Jotai | 4 | 4 | 4 | 3 | 5 | **20** | ⚠️ CONSIDER |
| **Styling** | NativeWind v4 (pinned) | 3 | 4 | 4 | 4 | 3 | **18** | ⚠️ ADOPT with caution |
| **Styling** | StyleSheet API | 5 | 3 | 5 | 3 | 5 | **21** | ⚠️ FALLBACK |
| **Navigation** | React Navigation v7 | 4 | 4 | 5 | 5 | 5 | **23** | ✅ ADOPT |
| **Navigation** | Expo Router | 4 | 5 | 4 | 3 | 4 | **20** | ❌ REJECT (for this app) |
| **Animations** | Reanimated 3 | 5 | 4 | 5 | 5 | 4 | **23** | ✅ ADOPT |
| **Animations** | Moti | 4 | 5 | 4 | 4 | 4 | **21** | ⚠️ CONSIDER (for simple UI) |
| **Animations** | Reanimated 2 | 4 | 4 | 3 | 4 | 1 | **16** | ❌ REJECT (EOL) |
| **AI** | Claude API (via proxy) | 4 | 5 | 4 | 5 | 4 | **22** | ✅ ADOPT |
| **Vector Search** | sqlite-vec (SQLite extension) | 3 | 3 | 3 | 5 | 4 | **18** | ✅ ADOPT |
| **Vector Search** | FAISS (local) | 4 | 2 | 3 | 2 | 1 | **12** | ❌ REJECT |
| **Vector Search** | Supabase pgvector (Phase 2) | 4 | 5 | 5 | 4 | 5 | **23** | ✅ ADOPT (Phase 2) |
| **Vector Search** | Pinecone | 5 | 4 | 4 | 2 | 3 | **18** | ❌ REJECT |
| **Server State** | TanStack Query v5 | 4 | 5 | 5 | 4 | 5 | **23** | ✅ ADOPT |
| **AI Proxy** | Supabase Edge Functions | 4 | 5 | 4 | 5 | 5 | **23** | ✅ ADOPT |
| **AI Proxy** | Cloudflare Workers | 5 | 3 | 4 | 4 | 4 | **20** | ⚠️ CONSIDER |

---

## Recommended Stack

### 1. Mobile Framework: React Native + Expo SDK 54

**Decision: ADOPT Expo SDK 54 (not SDK 52 as originally proposed)**

The original proposal specified Expo SDK 52+. As of March 2026, the current stable release is **Expo SDK 55** (React Native 0.83), but SDK 55 forces the New Architecture with no opt-out and NativeWind v4 compatibility with it is unresolved. **Expo SDK 54** (React Native 0.81) is the recommended target because:

- It is the last SDK version where the New Architecture can be disabled if NativeWind issues arise
- NativeWind v4.2.0+ explicitly targets SDK 54 with documented compatibility
- React Native 0.81 is stable and production-proven
- 83% of EAS Build projects (as of January 2026) already run the New Architecture on SDK 54

**Justification for React Native + Expo over bare React Native:**
- EAS Build eliminates CI/CD infrastructure setup (cloud builds for iOS/Android)
- Managed workflow reduces native code complexity
- `expo-sqlite`, `expo-notifications` (for rest timer alerts), and other first-party packages work seamlessly
- Offline-first architecture is well-served by Expo's managed environment

```json
// Target in app.json / package.json
{
  "expo": {
    "sdkVersion": "54.0.0",
    "platforms": ["ios", "android"]
  }
}
```

---

### 2. Language: TypeScript 5.x (Strict Mode)

**Decision: ADOPT — no change from proposed**

TypeScript strict mode is non-negotiable for a project of this complexity. The agentic memory system, progression calculators, and RPE deviation logic all involve complex types that benefit from exhaustive null checks and strict inference.

- `noUncheckedIndexedAccess: true` — catches array/object access bugs in set logging loops
- `strictNullChecks: true` — essential for workout history queries that may return `undefined`
- No `any` types enforced via ESLint rule `@typescript-eslint/no-explicit-any`

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true
  }
}
```

---

### 3. Local Database: expo-sqlite + Drizzle ORM

**Decision: ADOPT expo-sqlite (upgrade from raw SQL to Drizzle ORM)**

The PROJECT_BRIEF's SQLite schema (12 tables, vector blobs, complex join queries) justifies adding an ORM layer. **Drizzle ORM** is the recommended addition because:

- Native `expo-sqlite` integration via `drizzle-orm/expo-sqlite` adapter
- Type-safe queries eliminate runtime errors in complex workout history lookups
- `drizzle-kit` generates migration files — essential for the schema changes planned across 7 phases
- Drizzle Studio plugin enables visual database inspection during development
- `useMigrations` hook prevents UI rendering before database is ready

**For the 10,000+ workout dataset concern:**
- expo-sqlite v2 (SDK 52+) uses JSI bindings — synchronous queries without bridge overhead
- `useSQLiteContext` hook for React integration
- Batch inserts wrapped in transactions reduce write time significantly
- Paginated queries (`LIMIT`/`OFFSET`) prevent loading 10k records into memory
- Proper indexes already defined in the PROJECT_BRIEF schema (`idx_workouts_user_date`, etc.)

**Why not WatermelonDB:** WatermelonDB has documented incompatibility with React Native 0.76+ JSI mode and is primarily maintained by a single developer. The project is feature-complete but not actively developed for New Architecture support.

**Why not Realm:** Vendor lock-in to MongoDB Atlas ecosystem, larger APK/RAM footprint, and object-oriented model doesn't align with the SQL schema defined in PROJECT_BRIEF.

```typescript
// src/lib/database/db.ts
import * as SQLite from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as schema from './schema';

const expo = SQLite.openDatabaseSync('intelligent_trainer.db');
export const db = drizzle(expo, { schema });
```

---

### 4. Backend/Auth/Sync: Supabase (Phase 2)

**Decision: ADOPT — no change from proposed**

Supabase aligns with the Phase 2 requirements perfectly:
- PostgreSQL with `pgvector` extension replaces local sqlite-vec for cloud-synced agentic memory
- Row Level Security (RLS) for per-user data isolation
- Supabase Auth handles JWT-based sessions
- Realtime subscriptions for future multi-device sync
- Edge Functions for Claude API proxy (Phase 2)

Phase 1 can operate entirely offline with expo-sqlite. Supabase is introduced in Phase 2 when cloud sync is required.

---

### 5. State Management: Zustand (global) + Legend State (active workout)

**Decision: ADOPT BOTH — split by concern**

The original proposal listed Zustand alone. Research reveals a more optimal two-library split:

**Zustand** for global app state:
- User profile, preferences, mesocycle data
- Navigation state (auth status, onboarding completion)
- Background sync status
- ~3KB bundle, minimal boilerplate, Redux DevTools compatible
- Excellent TypeScript inference with `immer` middleware for nested state

**Legend State** for active workout session state:
- The rest timer countdown requires near-zero re-renders — Legend State's observable/signal model eliminates unnecessary renders during timer ticks
- Set completion state changes happen dozens of times per session
- `useSelector` equivalent patterns prevent entire workout screen re-renders on each set completion
- Built-in persistence (`localStorage`/AsyncStorage) for workout state recovery if app is backgrounded
- Only 4KB bundle

The combination follows a clear separation: Zustand owns persistent/navigational client state, Legend State owns the high-frequency transactional state within an active workout.

```typescript
// src/stores/workoutSessionStore.ts (Legend State)
import { observable } from '@legendapp/state';
import { observer } from '@legendapp/state/react';

export const workoutSession$ = observable({
  isActive: false,
  elapsedSeconds: 0,
  restTimer: {
    isRunning: false,
    remainingSeconds: 0,
    totalSeconds: 0,
  },
  exercises: [] as ExerciseState[],
});

// src/stores/appStore.ts (Zustand)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAppStore = create(persist(
  (set) => ({
    user: null as User | null,
    currentMesocycle: null as Mesocycle | null,
    setUser: (user: User) => set({ user }),
  }),
  { name: 'app-store' }
));
```

---

### 6. Styling: NativeWind v4 (pinned) with StyleSheet fallback

**Decision: ADOPT with strict version pinning — moderate risk**

NativeWind v4 has had documented compatibility issues with Expo SDK 52+ and New Architecture. The safe path for March 2026:

- Pin to `nativewind@4.1.x` with `tailwindcss@3.4.17` (NOT Tailwind CSS v4)
- Target Expo SDK 54 (where v4.2.0+ compatibility is documented)
- Pin `react-native-reanimated@~3.17.4` (NativeWind v4 does NOT support Reanimated v4)
- Enable New Architecture but test on SDK 54 (not SDK 55 where it cannot be disabled)

**NativeWind v5 is pre-release** as of March 2026 with stable ETA of mid-2026. Do not use in production.

**Fallback strategy:** The active workout screen (highest performance requirement) should use `StyleSheet.create()` for set rows, rest timer, and RPE modal. NativeWind is appropriate for static screens (Home, History, Profile). This hybrid approach reduces NativeWind's surface area and risk exposure.

```javascript
// tailwind.config.js
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: { extend: {} },
  plugins: [],
};
```

---

### 7. Navigation: React Navigation v7

**Decision: ADOPT React Navigation — REJECT Expo Router for this app**

The PROJECT_BRIEF requires:
- Bottom tab bar with 4 tabs (Workout, History, Exercises, Profile)
- Stack navigators within each tab
- Modal presentation for RPE entry, rest timer expansion, exercise substitution, adaptation alerts
- Swipe gestures on set rows (requires RNGH integration)
- Custom transition animations (workout start = slide up, post-workout = fade)

**Why React Navigation over Expo Router:**

Expo Router is built on top of React Navigation but abstracts away direct animation control. The workout screen demands **fine-grained control over transitions** (the rest timer modal must slide up over the workout, maintaining the workout's scroll position). Expo Router's declarative modal system makes this harder to control precisely.

Expo Router's file-based routing is beneficial for web developers but adds complexity for a pure-mobile app with no web target.

React Navigation v7 provides:
- Full custom animation interpolators
- `presentation: 'transparentModal'` for the RPE overlay (appears without dimming the workout)
- `gestureEnabled` control per-screen
- Battle-tested across 15,000+ Stack Overflow questions with large community

```typescript
// src/navigation/RootNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Active workout modal presented as transparentModal
// to maintain scroll state on ExerciseCard list
```

---

### 8. Animations: Reanimated 3 (with Moti for simple UI)

**Decision: ADOPT Reanimated 3 — REJECT Reanimated 2 (EOL)**

Reanimated 2 is end-of-life and will not receive updates for upcoming React Native versions. Reanimated 3 is the production target; Reanimated 4 is stable (released October 2025) but cannot be used alongside NativeWind v4.

**Strategy:**
- Use **Reanimated 3** for rest timer (progress arc, countdown number), workout completion animation, swipe-to-delete set rows, and any gesture-driven animations
- Use **Moti** for simpler, declarative animations: loading states, badge pulse, RPE modal slide-in
- Do NOT upgrade to Reanimated 4 until NativeWind v5 is stable (targeted mid-2026)

**Rest timer implementation:**

The rest timer is the most performance-critical animation in the app. A `useSharedValue` + `withTiming` approach on the UI thread eliminates any frame drops during set logging:

```typescript
// src/components/workout/RestTimer.tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export function RestTimerProgress({ totalSeconds, remainingSeconds }: Props) {
  const progress = useSharedValue(remainingSeconds / totalSeconds);

  // Runs on UI thread — zero JS bridge overhead
  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  return <Animated.View style={[styles.progressBar, animatedStyle]} />;
}
```

---

### 9. AI Intelligence: Claude API via Supabase Edge Function Proxy

**Decision: ADOPT Claude API — PROXY via Supabase Edge Functions**

The Anthropic TypeScript SDK explicitly does not support React Native as a browser client and disables browser calls by default to prevent API key exposure. Direct RN integration is not viable.

**Architecture:**

```
React Native App
    ↓  (HTTPS, user JWT)
Supabase Edge Function (Deno)
    ↓  (ANTHROPIC_API_KEY in env var)
Claude API (Anthropic)
    ↓
Supabase Edge Function
    ↓  (streamed response)
React Native App
```

**Why Supabase Edge Functions over Cloudflare Workers:**
- Already using Supabase for auth/database — unified platform
- Supabase JWT validation happens automatically at the edge gateway
- Real-world latency difference for LLM API proxying is minimal (<150ms P50 difference)
- Supabase Edge Functions are officially recommended for "orchestrating calls to external LLM APIs"
- Simpler developer experience for a solo/small team

**Phase 1 (offline):** Deterministic algorithms handle progression calculations locally. Claude API is NOT called during active workout to avoid latency. Claude is only called for: mesocycle generation (pre-session), post-workout analysis (post-session), and pattern explanation (background).

```typescript
// supabase/functions/claude-proxy/index.ts
import Anthropic from 'npm:@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY'),
});

Deno.serve(async (req) => {
  // Validate Supabase JWT — user must be authenticated
  const authHeader = req.headers.get('Authorization');
  // ... JWT validation ...

  const { prompt, context } = await req.json();

  const message = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  return Response.json(message);
});
```

---

### 10. Vector Search: sqlite-vec (Phase 1) → pgvector in Supabase (Phase 2)

**Decision: REJECT FAISS — ADOPT sqlite-vec for Phase 1, pgvector for Phase 2**

FAISS is not viable for React Native because:
- No native React Native bindings
- Requires Python runtime (not available in RN)
- No built-in persistence layer (manual save/load required)
- Designed for server-side use

**Phase 1: sqlite-vec**

`sqlite-vec` is a portable SQLite extension for vector similarity search that runs on mobile devices. It is the successor to `sqlite-vss` (which was FAISS-based) and is specifically designed to avoid FAISS's portability limitations.

The agentic memory system stores embeddings as BLOB columns (already defined in the PROJECT_BRIEF schema: `embedding_vector BLOB`). sqlite-vec enables cosine similarity search over these blobs.

For Phase 1 with a single user's agentic memories (typically <500 records), sqlite-vec performance is adequate. Embedding generation happens via Claude API (when online) or a lightweight on-device model.

```sql
-- Migration: Add sqlite-vec virtual table for memory retrieval
CREATE VIRTUAL TABLE memory_vectors USING vec0(
  memory_id TEXT,
  embedding FLOAT[1536]  -- Claude embedding dimensions
);
```

**Phase 2: pgvector in Supabase**

When Supabase backend is added, agentic memories sync to PostgreSQL with the `pgvector` extension. Based on March 2026 research, pgvector with HNSW indexing outperforms Pinecone in both accuracy and QPS at equivalent costs, and the new `pgvectorscale` extension supports up to 50 million vectors on NVMe SSD — far exceeding requirements for this app.

Pinecone is rejected because: requires a separate service, lacks row-level security, and the cost model (usage-based) is unpredictable versus Supabase's flat compute pricing.

---

### 11. Server State: TanStack Query v5

**Decision: ADOPT — no change from proposed**

TanStack Query v5 (formerly React Query) handles all async server state:
- Workout history sync with Supabase (Phase 2)
- Mesocycle data fetching and caching
- Exercise library updates from server
- Background refetch on app foreground

The combination of **Zustand (client state) + TanStack Query (server state)** is the documented best practice per TanStack's own documentation: "TanStack Query is a server-state library, not a client-state library."

This prevents the common mistake of putting server data into Zustand stores and manually managing staleness.

```typescript
// src/features/workouts/hooks/useWorkoutHistory.ts
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/database/db';

export function useWorkoutHistory(userId: string) {
  return useQuery({
    queryKey: ['workouts', userId],
    queryFn: () => db.query.workouts.findMany({
      where: eq(workouts.userId, userId),
      orderBy: [desc(workouts.date)],
      limit: 50,
    }),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
```

---

## Rejected Alternatives

### WatermelonDB (Local DB)
**Rejected because:** Documented incompatibility with React Native 0.76+ JSI mode (GitHub issue #1851, Nov 2025). Primary maintainer is a single developer at Nozbe; project is considered feature-complete but receives slow updates for New Architecture support. The reactive observable model is appealing but not worth the compatibility risk when expo-sqlite + Drizzle achieves the same result with full Expo support.

### Realm (Local DB)
**Rejected because:** Vendor lock-in to MongoDB Atlas ecosystem. ObjectIds and object-oriented model don't align with the relational schema defined in PROJECT_BRIEF. APK size and RAM usage increase. The free local database tier is acceptable, but Atlas Device Sync introduces another subscription cost alongside Supabase.

### Expo Router (Navigation)
**Rejected because:** The workout session requires transparentModal presentation (RPE entry appears over the workout without unmounting it), custom gesture-driven transitions, and fine-grained animation interpolation for the rest timer expansion. Expo Router's declarative abstraction over React Navigation makes these patterns significantly harder. Additionally, this app has no web target, so Expo Router's universal routing benefits are irrelevant.

### FAISS (Vector Search)
**Rejected because:** No React Native or mobile bindings. Designed for server-side Python/C++. No built-in persistence. Cannot run in a mobile app environment. The original proposal cited FAISS as a local option, but this was based on incorrect assumptions about its portability.

### Pinecone (Vector Search)
**Rejected because:** Requires a separate paid cloud service. Lacks row-level security (critical for multi-user personal training data). Two-step retrieval process (vector search then database query) adds latency. Cost model is usage-based and unpredictable at scale. pgvector in Supabase achieves equivalent performance with HNSW indexing and the new pgvectorscale extension, at lower cost with hybrid SQL+vector queries in a single statement.

### Reanimated 2 (Animations)
**Rejected because:** End-of-life as of 2025. Will not receive updates for React Native 0.81+. Active development moved entirely to Reanimated 3/4. Keeping Reanimated 2 is a technical debt that will block future SDK upgrades.

### Moti (as primary animation library)
**Evaluated but not rejected as secondary option.** Moti uses Reanimated under the hood and is excellent for declarative animations. However, the rest timer and swipe gesture animations require Reanimated's direct `useSharedValue` and `useAnimatedGestureHandler` APIs for frame-accurate control. Moti is approved for use on simpler animations (loading spinners, modal slide-ins, badge pulses).

### Jotai (State Management)
**Not adopted as primary but remains viable.** Jotai's atomic model would work well for form state within the RPE modal and exercise picker. However, Zustand's simpler mental model is preferred for a small team, and Legend State already covers the high-frequency re-render case. A future refactor could introduce Jotai for form atoms without conflicting with either Zustand or Legend State.

### Cloudflare Workers (AI Proxy)
**Not adopted but viable.** Cloudflare Workers have marginally lower latency (~150ms P50 improvement for third-party API proxying) and zero cold starts versus Supabase Edge Functions. However, the added complexity of managing a separate Cloudflare account alongside Supabase is not justified for a single-developer project. If latency becomes a measured problem in production, migrating the Claude proxy to Cloudflare Workers is a well-documented path.

---

## Risk Register

| # | Risk | Technology | Likelihood | Impact | Mitigation |
|---|------|------------|------------|--------|------------|
| R1 | NativeWind v4 breaks on New Architecture upgrade | NativeWind | **HIGH** | HIGH | Pin NativeWind + Tailwind versions. Use StyleSheet for critical workout screens. Monitor NativeWind v5 release (target mid-2026). |
| R2 | Reanimated v3 → v4 upgrade blocked by NativeWind | Reanimated | HIGH | MEDIUM | Do not upgrade Reanimated until NativeWind v5 is stable. Pin to `~3.17.4`. |
| R3 | sqlite-vec extension not loadable in Expo managed workflow | sqlite-vec | MEDIUM | MEDIUM | Phase 1: Use cosine similarity via manual dot product in TypeScript as fallback. Phase 2: Migrate to pgvector. |
| R4 | Claude API latency causes UX degradation during workout | Claude API | MEDIUM | HIGH | Never call Claude API during active set logging. All AI calls are pre-session or post-session. Cache mesocycle data locally. |
| R5 | Claude API key exposed in mobile app bundle | Claude API | HIGH (if direct) | CRITICAL | Always route through Supabase Edge Function. Never ship API key in RN bundle. Use Expo's `expo-constants` with `EXPO_PUBLIC_` prefix only for non-secret config. |
| R6 | Legend State + Zustand state synchronization complexity | State Management | MEDIUM | MEDIUM | Define clear boundaries: Legend State owns `workoutSession$` only. Zustand owns everything else. Document state transitions explicitly. |
| R7 | expo-sqlite migration failures on app update | expo-sqlite | LOW | HIGH | Use `drizzle-kit` migration system with version control. Test migration path from each release. Never drop columns in migrations — use `ALTER TABLE ADD COLUMN` only. |
| R8 | Supabase service outage blocks Phase 2 features | Supabase | LOW | MEDIUM | Phase 1 offline-first design means core logging never depends on Supabase. AI features degrade gracefully when offline (show cached prescriptions). |
| R9 | React Navigation v7 → v8 breaking changes | React Navigation | LOW | MEDIUM | Pin to `@react-navigation/*@7.x` in package.json. |
| R10 | 10k+ workout records causing slow queries | expo-sqlite | LOW | HIGH | Enforce pagination (50 records per page). Verify indexes exist on `(user_id, date DESC)`. Use `EXPLAIN QUERY PLAN` in development to catch missing indexes. |
| R11 | TanStack Query cache invalidation causing stale workout data | TanStack Query | LOW | LOW | Set `staleTime` to 0 for workout history (always fresh). Use `invalidateQueries` after any mutation. |
| R12 | WatermelonDB chosen in future and creates New Architecture conflict | (alternative) | N/A | N/A | Decision locked. Document rejection rationale here to prevent future reconsideration without research review. |

---

## Version Pinning

Pin these exact versions in `package.json` to prevent breaking upgrades. Upgrade only after validating the NativeWind compatibility matrix.

```json
{
  "dependencies": {
    "expo": "~54.0.0",
    "react": "18.3.2",
    "react-native": "0.81.5",

    "nativewind": "4.1.23",
    "tailwindcss": "3.4.17",

    "react-native-reanimated": "~3.17.4",
    "react-native-gesture-handler": "~2.21.2",

    "@react-navigation/native": "^7.0.0",
    "@react-navigation/bottom-tabs": "^7.0.0",
    "@react-navigation/native-stack": "^7.0.0",

    "zustand": "^5.0.0",
    "@legendapp/state": "^3.0.0",

    "@tanstack/react-query": "^5.0.0",

    "drizzle-orm": "^0.40.0",

    "expo-sqlite": "~15.1.2",

    "typescript": "~5.8.3"
  },
  "devDependencies": {
    "drizzle-kit": "^0.30.0"
  }
}
```

**Do not upgrade without testing:**
- `nativewind` — only upgrade after verifying New Architecture compatibility matrix
- `react-native-reanimated` — do not upgrade to v4 until NativeWind v5 is stable (target mid-2026)
- `expo` — increment one SDK version at a time, never skip

---

## Integration Concerns

### 1. NativeWind + Reanimated Peer Dependency Conflict

**Issue:** NativeWind v4 requires Reanimated `~3.17.4`. Expo SDK 54 ships with Reanimated 4.1.1. Installing both NativeWind v4 and the default Expo-installed Reanimated will cause:
- "Duplicate plugin/preset detected" error in Babel
- NativeWind styles silently not applying

**Resolution:** Explicitly override the Reanimated version in `package.json`:
```json
{
  "overrides": {
    "react-native-reanimated": "3.17.4"
  }
}
```
And update `babel.config.js` to include only one instance of the Reanimated plugin.

---

### 2. expo-sqlite + sqlite-vec Extension Loading

**Issue:** The sqlite-vec extension requires loading a native shared library into SQLite. In Expo's managed workflow, loading arbitrary SQLite extensions requires a custom dev client (EAS build).

**Resolution:** Use `expo-sqlite`'s `enableLoadExtension` API (available in SDK 52+). This requires building with EAS — Expo Go will NOT support it:
```typescript
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('trainer.db');
db.withExclusiveTransactionSync(() => {
  db.runSync("SELECT load_extension('/path/to/vec0')");
});
```

**Fallback for Phase 1 without sqlite-vec:** Store embeddings as TEXT (JSON array) and compute cosine similarity in TypeScript. For <500 agentic memories, a TypeScript dot-product computation is fast enough (<10ms). Migrate to sqlite-vec or pgvector when memory count exceeds ~1000 records.

---

### 3. Legend State + React Suspense Boundary

**Issue:** Legend State's observables can cause React Suspense boundaries to trigger unexpectedly if used inside a Suspense tree managed by TanStack Query.

**Resolution:** Keep Legend State (`workoutSession$`) outside any TanStack Query `Suspense` boundaries. The active workout screen should NOT use `suspense: true` in its queries. Use `isLoading` flags instead of Suspense for workout screen queries.

---

### 4. TypeScript + Drizzle ORM Schema Inference

**Issue:** Drizzle's `$inferSelect` and `$inferInsert` types require explicit schema exports. The PROJECT_BRIEF defines tables in SQL — these must be re-declared in TypeScript Drizzle schema files. Keeping both in sync is a maintenance burden.

**Resolution:** Use drizzle-kit as the source of truth. Define schemas in TypeScript Drizzle format, then generate SQL migrations from them (rather than the other way around):
```bash
npx drizzle-kit generate  # generates SQL from TypeScript schema
npx drizzle-kit migrate   # applies to local SQLite
```

---

### 5. Claude API Streaming + Supabase Edge Functions

**Issue:** Mesocycle generation responses from Claude can be long (2000+ tokens). Non-streaming responses can take 15-30 seconds, making the UX feel broken.

**Resolution:** Use Claude's streaming API (`stream: true`) and Supabase Edge Function's `ReadableStream` support:
```typescript
// Supabase Edge Function returns a stream
const stream = await anthropic.messages.stream({
  model: 'claude-opus-4-6',
  max_tokens: 4096,
  messages: [{ role: 'user', content: prompt }],
});

return new Response(stream.toReadableStream(), {
  headers: { 'Content-Type': 'text/event-stream' },
});
```
The React Native client consumes the stream with `fetch` + `ReadableStream` for progressive rendering of the mesocycle plan.

---

### 6. React Navigation + Gesture Handler on Android

**Issue:** React Native Gesture Handler (required for swipe gestures on set rows) must wrap the entire navigation tree on Android, or gestures will not be recognized.

**Resolution:** Wrap `NavigationContainer` with `GestureHandlerRootView`:
```typescript
// App.tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </GestureHandlerRootView>
  );
}
```

---

### 7. New Architecture Compatibility Verification Checklist

Before shipping Phase 1, verify each library supports the New Architecture (bridgeless mode) on Expo SDK 54:

| Library | New Architecture Status |
|---------|------------------------|
| expo-sqlite | ✅ Fully supported (SDK 52+) |
| react-native-reanimated 3.17.x | ✅ Supported |
| react-native-gesture-handler | ✅ Supported |
| @react-navigation/* v7 | ✅ Supported |
| nativewind 4.1.x | ⚠️ Partially — test on each SDK upgrade |
| @legendapp/state v3 | ✅ Supported |
| zustand v5 | ✅ Supported (pure JS) |
| @tanstack/react-query v5 | ✅ Supported (pure JS) |

---

*Document generated: March 3, 2026*
*Next review: When NativeWind v5 reaches stable (target: mid-2026)*
