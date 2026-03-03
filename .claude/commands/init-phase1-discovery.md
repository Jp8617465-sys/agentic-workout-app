---
description: Phase 1 - Discovery and research using requirements, tech stack, and research agents
model: claude-sonnet-4-5
---

# Phase 1: Discovery & Research

Run the discovery and research phase for the Intelligent Training Companion project. This phase uses 3 agents in parallel to analyze the project brief and produce foundational planning documents.

## Source of Truth

Read `docs/PROJECT_BRIEF.md` for the complete project brief.

## Arguments

$ARGUMENTS

## Agent 1: Requirements Analyst

Use the `requirements-analyst` agent to distill the project brief into a structured PRD.

### Input Context

The brief describes an intelligent workout tracking app with 4 core features:
1. **Strong-Inspired Logging UX** - 10-second set logging, auto-fill, rest timers, swipe gestures
2. **Agentic Intelligence Layer** - Mesocycle programming, daily workout generation, real-time adaptation, post-workout analysis
3. **Injury Management System** - Risk matrix, exercise filtering, kill switches, return protocols
4. **Agentic Memory System** - Pattern detection, vector storage, memory retrieval, feedback learning

Primary user persona: James (32, advanced lifter, concurrent strength + running, chronic ankle instability, frequent travel gaps).

### Required Output

Produce a PRD (`docs/01-PRD.md`) containing:

1. **Product Overview** (1 paragraph)

2. **User Stories** (MoSCoW prioritized)
   - Must Have: Core logging (set entry, auto-fill, rest timer), basic progression suggestions, workout history
   - Should Have: Mesocycle generation, RPE-based adaptation, injury screening
   - Could Have: Agentic memory, Apple Watch, plate calculator
   - Won't Have (v1): Social features, nutrition, gamification

3. **Functional Requirements** (grouped by feature)
   - For each requirement: ID, description, acceptance criteria, priority, dependencies
   - Example: `FR-LOG-001: Auto-fill sets from last session - When user starts a workout containing an exercise performed previously, all set rows pre-populate with last session's weight and reps`

4. **Non-Functional Requirements**
   - Performance: Set logging <10 seconds, app cold start <2 seconds, 60fps animations
   - Reliability: Offline-first, zero data loss on crash, background timer reliability
   - Security: API key protection, health data encryption, GDPR compliance
   - Scalability: Support 10,000+ workout entries, 100+ exercises, 50+ mesocycles

5. **Feature Dependencies**
   - Dependency graph showing which features must be built first
   - Critical path analysis

6. **MVP Scope Definition**
   - What ships in v1.0 vs v1.1 vs v2.0
   - Minimum viable intelligence (what AI features are essential for differentiation)

---

## Agent 2: Tech Stack Researcher

Use the `tech-stack-researcher` agent to validate and refine technology choices.

### Research Questions

For each technology in the proposed stack, answer:
1. Is this the best choice for our specific requirements?
2. What are the alternatives and trade-offs?
3. Are there compatibility issues we should know about?
4. What's the community/maintenance status as of 2026?

### Technologies to Evaluate

| Technology | Purpose | Alternatives to Consider |
|-----------|---------|-------------------------|
| React Native + Expo SDK 52+ | Mobile framework | Flutter, native Swift/Kotlin |
| TypeScript strict mode | Language | - |
| expo-sqlite | Local database | WatermelonDB, Realm, MMKV |
| Supabase | Backend/auth/sync | Firebase, AWS Amplify, custom |
| Zustand | State management | Jotai, Legend State, MobX |
| NativeWind v4 | Styling | Tamagui, Unistyles, StyleSheet |
| React Navigation | Navigation | Expo Router |
| Reanimated 2 | Animations | Moti, react-native-skia |
| Claude API | AI intelligence | OpenAI, local models, custom |
| FAISS (local) | Vector search | Pinecone, pgvector, ChromaDB |
| React Query | Server state | SWR, TanStack Query |

### Required Output

Produce a tech decision document (`docs/02-TECH-STACK-DECISIONS.md`) with:

1. **Decision matrix** (table format with scores 1-5 for: performance, DX, community, fitness-for-purpose, risk)
2. **Recommended stack** with justification for each choice
3. **Rejected alternatives** with reasons
4. **Risk register** (what could go wrong with each choice)
5. **Version pinning recommendations** (specific versions to lock to)
6. **Integration concerns** (known compatibility issues between chosen technologies)

---

## Agent 3: Deep Research Agent

Use the `deep-research-agent` for implementation pattern research.

### Research Topics

1. **React Native Workout App Patterns**
   - How do production fitness apps structure their React Native codebases?
   - Best practices for numeric input handling (weight/reps fields) on iOS/Android
   - Timer implementation patterns that survive app backgrounding
   - Haptic feedback patterns for set completion

2. **Sports Science Algorithms**
   - RPE-based auto-regulation: How to calculate load adjustments from RPE data
   - Evidence-based periodization implementation (not just theory - actual algorithm pseudocode)
   - Fatigue management models (fitness-fatigue, SRA curve)
   - Progressive overload calculation methods

3. **Offline-First Architecture**
   - SQLite + sync patterns for React Native
   - Conflict resolution strategies for workout data
   - Queue-based sync with retry logic
   - Handling schema migrations in SQLite on mobile

4. **AI Integration on Mobile**
   - Claude API call patterns from React Native (direct vs proxy)
   - Streaming responses for real-time workout analysis
   - Caching AI responses for offline access
   - Rate limiting and cost management for per-user AI calls

5. **Vector Search on Device**
   - Local embedding generation options (ONNX runtime, TensorFlow Lite)
   - FAISS on mobile feasibility and alternatives
   - Approximate nearest neighbor search for pattern matching
   - Memory/battery impact of local vector operations

### Required Output

Produce a research findings document (`docs/03-RESEARCH-FINDINGS.md`) with:

1. **Key findings** (bulleted, actionable)
2. **Implementation recommendations** (code patterns, library choices)
3. **Risks and mitigations** (what's hard, what's unsolved)
4. **References** (links to relevant libraries, papers, examples)
5. **Open questions** (things that need prototyping to answer)

---

## Checkpoint

After all three agents complete, present a summary:

```
PHASE 1 COMPLETE
─────────────────

PRD:
- X user stories (Y must-have, Z should-have)
- MVP scope defined
- Feature dependency graph created

Tech Stack:
- [Confirmed/Changed] decisions listed
- X risks identified
- Integration concerns noted

Research:
- X key findings
- Y implementation patterns documented
- Z open questions for prototyping

Proceed to Phase 2 (Architecture)? [Y/N]
```
