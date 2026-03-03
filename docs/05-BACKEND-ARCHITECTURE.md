# Backend Architecture — Intelligent Training Companion

**Version:** 1.0
**Date:** March 3, 2026
**Status:** Approved
**Inputs:** PROJECT_BRIEF.md, 02-TECH-STACK-DECISIONS.md, 03-RESEARCH-FINDINGS.md, 04-SYSTEM-ARCHITECTURE.md

---

## Table of Contents

1. [SQLite Schema (Drizzle ORM)](#1-sqlite-schema-drizzle-orm)
2. [Migration Strategy](#2-migration-strategy)
3. [Repository Pattern](#3-repository-pattern)
4. [Claude API Service (Edge Functions)](#4-claude-api-service-edge-functions)
5. [Agentic Memory Storage](#5-agentic-memory-storage)
6. [Exercise Seed Data](#6-exercise-seed-data)
7. [Offline Sync (PowerSync)](#7-offline-sync-powersync)

---

## 1. SQLite Schema (Drizzle ORM)

All tables use TEXT UUIDs as primary keys (offline-safe). WAL mode is enabled at connection time. The schema maps to the PROJECT_BRIEF.md data model with refinements for Drizzle ORM, sync status tracking, and soft deletes.

### 1.1 Database Initialization

```typescript
// src/lib/database.ts
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

const expoDb = openDatabaseSync('intelligent_trainer.db', {
  enableChangeListener: true,
});

// WAL mode for concurrent read/write performance
expoDb.execSync('PRAGMA journal_mode = WAL');
expoDb.execSync('PRAGMA foreign_keys = ON');
expoDb.execSync('PRAGMA cache_size = -8000'); // 8MB cache

export const db = drizzle(expoDb, { schema });
```

### 1.2 Core Tables

```typescript
// src/lib/schema.ts
import { sqliteTable, text, integer, real, blob, uniqueIndex, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// ─── Users ────────────────────────────────────────────────────
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),  // UUID v4
  name: text('name').notNull(),
  email: text('email').unique(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).default(sql`(unixepoch() * 1000)`),
  experienceLevel: text('experience_level', {
    enum: ['beginner', 'intermediate', 'advanced'],
  }),
  trainingGoal: text('training_goal'),
  weeklyFrequency: integer('weekly_frequency'),
  unitSystem: text('unit_system', { enum: ['metric', 'imperial'] }).default('metric'),
  hrvBaseline: real('hrv_baseline'),
  rhrBaseline: real('rhr_baseline'),
  sleepTarget: real('sleep_target'),
  preferences: text('preferences', { mode: 'json' }),
  lastActive: integer('last_active', { mode: 'timestamp_ms' }),
  totalWorkouts: integer('total_workouts').default(0),
  // Sync fields
  syncStatus: text('sync_status', { enum: ['pending', 'synced', 'conflict'] }).default('pending'),
  serverUpdatedAt: integer('server_updated_at', { mode: 'timestamp_ms' }),
  deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
});

// ─── Injuries ─────────────────────────────────────────────────
export const injuries = sqliteTable('injuries', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  type: text('type').notNull(), // e.g. 'ankle_instability', 'back_sensitivity'
  status: text('status', { enum: ['acute', 'chronic', 'recovering'] }),
  severity: integer('severity'), // 1-10
  dateOccurred: integer('date_occurred', { mode: 'timestamp_ms' }),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).default(sql`(unixepoch() * 1000)`),
  syncStatus: text('sync_status', { enum: ['pending', 'synced', 'conflict'] }).default('pending'),
  deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
}, (table) => [
  index('idx_injuries_user').on(table.userId),
]);

// ─── User Equipment ──────────────────────────────────────────
export const userEquipment = sqliteTable('user_equipment', {
  userId: text('user_id').notNull().references(() => users.id),
  equipmentType: text('equipment_type').notNull(),
}, (table) => [
  uniqueIndex('pk_user_equipment').on(table.userId, table.equipmentType),
]);

// ─── Mesocycles ───────────────────────────────────────────────
export const mesocycles = sqliteTable('mesocycles', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  name: text('name').notNull(),
  periodizationModel: text('periodization_model', {
    enum: ['linear', 'block', 'dup', 'conjugate'],
  }),
  startDate: integer('start_date', { mode: 'timestamp_ms' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp_ms' }).notNull(),
  durationWeeks: integer('duration_weeks'),
  goal: text('goal'),
  status: text('status', { enum: ['active', 'completed', 'paused'] }).default('active'),
  initialAssessment: text('initial_assessment', { mode: 'json' }),
  finalReview: text('final_review', { mode: 'json' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).default(sql`(unixepoch() * 1000)`),
  syncStatus: text('sync_status', { enum: ['pending', 'synced', 'conflict'] }).default('pending'),
  deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
}, (table) => [
  index('idx_mesocycles_user').on(table.userId),
  index('idx_mesocycles_status').on(table.userId, table.status),
]);

// ─── Microcycles ──────────────────────────────────────────────
export const microcycles = sqliteTable('microcycles', {
  id: text('id').primaryKey(),
  mesocycleId: text('mesocycle_id').notNull().references(() => mesocycles.id),
  weekNumber: integer('week_number').notNull(),
  phase: text('phase'),  // 'accumulation', 'intensification', 'realization', 'deload'
  targetVolume: real('target_volume'),
  targetIntensity: real('target_intensity'),
  targetFrequency: integer('target_frequency'),
  actualVolume: real('actual_volume'),
  actualIntensity: real('actual_intensity'),
  actualFrequency: integer('actual_frequency'),
  syncStatus: text('sync_status', { enum: ['pending', 'synced', 'conflict'] }).default('pending'),
}, (table) => [
  uniqueIndex('idx_microcycles_meso_week').on(table.mesocycleId, table.weekNumber),
]);

// ─── Workouts ─────────────────────────────────────────────────
export const workouts = sqliteTable('workouts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  mesocycleId: text('mesocycle_id').references(() => mesocycles.id),
  microcycleId: text('microcycle_id').references(() => microcycles.id),
  date: integer('date', { mode: 'timestamp_ms' }).notNull(),
  type: text('type'),  // 'upper', 'lower', 'full_body', 'push', 'pull'
  phase: text('phase'),
  status: text('status', { enum: ['active', 'completed', 'abandoned'] }).default('active'),
  durationMinutes: integer('duration_minutes'),
  totalVolume: real('total_volume'),
  averageRpe: real('average_rpe'),
  readinessEnergy: integer('readiness_energy'),    // 1-5
  readinessSoreness: integer('readiness_soreness'), // 1-5
  readinessAnkle: text('readiness_ankle'),          // user-specific
  aiInsights: text('ai_insights', { mode: 'json' }),
  notes: text('notes'),
  restTimerEndsAt: integer('rest_timer_ends_at', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).default(sql`(unixepoch() * 1000)`),
  syncStatus: text('sync_status', { enum: ['pending', 'synced', 'conflict'] }).default('pending'),
  deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
}, (table) => [
  index('idx_workouts_user_date').on(table.userId, table.date),
  index('idx_workouts_mesocycle').on(table.mesocycleId),
  index('idx_workouts_status').on(table.userId, table.status),
]);

// ─── Exercise Performances ───────────────────────────────────
export const exercisePerformances = sqliteTable('exercise_performances', {
  id: text('id').primaryKey(),
  workoutId: text('workout_id').notNull().references(() => workouts.id),
  exerciseName: text('exercise_name').notNull().references(() => exercises.name),
  category: text('category'),
  prescribedSets: integer('prescribed_sets'),
  prescribedReps: integer('prescribed_reps'),
  prescribedWeight: real('prescribed_weight'),
  prescribedTempo: text('prescribed_tempo'),
  prescribedRpeTarget: real('prescribed_rpe_target'),
  prescribedRestSeconds: integer('prescribed_rest_seconds'),
  actualSets: integer('actual_sets'),
  actualAverageRpe: real('actual_average_rpe'),
  vsLastWeightDelta: real('vs_last_weight_delta'),
  vsLastVolumeDelta: real('vs_last_volume_delta'),
  progressionRationale: text('progression_rationale'),
  injuryRisk: text('injury_risk', { mode: 'json' }),
  adjustmentsMade: text('adjustments_made', { mode: 'json' }),
  notes: text('notes'),
  orderInWorkout: integer('order_in_workout'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).default(sql`(unixepoch() * 1000)`),
  syncStatus: text('sync_status', { enum: ['pending', 'synced', 'conflict'] }).default('pending'),
}, (table) => [
  index('idx_ep_workout').on(table.workoutId),
  index('idx_ep_exercise_name').on(table.exerciseName),
]);

// ─── Set Logs ─────────────────────────────────────────────────
export const setLogs = sqliteTable('set_logs', {
  id: text('id').primaryKey(),
  exercisePerformanceId: text('exercise_performance_id').notNull()
    .references(() => exercisePerformances.id),
  setNumber: integer('set_number').notNull(),
  weight: real('weight').notNull(),
  reps: integer('reps').notNull(),
  rpe: real('rpe').notNull(),
  type: text('type', { enum: ['warmup', 'working', 'backoff', 'amrap'] }).default('working'),
  restTimeUsed: integer('rest_time_used'),
  formQuality: text('form_quality'),
  painLevel: integer('pain_level').default(0),
  completedAt: integer('completed_at', { mode: 'timestamp_ms' }).default(sql`(unixepoch() * 1000)`),
  syncStatus: text('sync_status', { enum: ['pending', 'synced', 'conflict'] }).default('pending'),
}, (table) => [
  index('idx_sets_ep').on(table.exercisePerformanceId),
  uniqueIndex('idx_sets_ep_number').on(table.exercisePerformanceId, table.setNumber),
]);

// ─── Exercises (seed data) ───────────────────────────────────
export const exercises = sqliteTable('exercises', {
  name: text('name').primaryKey(),
  category: text('category'), // 'compound', 'isolation', 'cardio', 'flexibility'
  pattern: text('pattern'),   // 'squat', 'hinge', 'push', 'pull', 'carry', 'rotation'
  equipment: text('equipment', { mode: 'json' }),    // ['barbell', 'bench']
  muscleGroups: text('muscle_groups', { mode: 'json' }), // ['chest', 'triceps', 'anterior_deltoid']
  defaultTempo: text('default_tempo'),
  videoUrl: text('video_url'),
  instructions: text('instructions', { mode: 'json' }),
  cues: text('cues', { mode: 'json' }),
  commonMistakes: text('common_mistakes', { mode: 'json' }),
  variations: text('variations', { mode: 'json' }),
  defaultRestSeconds: integer('default_rest_seconds'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).default(sql`(unixepoch() * 1000)`),
});

// ─── Injury Risks (seed data) ────────────────────────────────
export const injuryRisks = sqliteTable('injury_risks', {
  exerciseName: text('exercise_name').notNull().references(() => exercises.name),
  injuryType: text('injury_type').notNull(),
  riskLevel: text('risk_level', { enum: ['LOW', 'MODERATE', 'HIGH'] }),
  note: text('note'),
  contraindications: text('contraindications', { mode: 'json' }),
  modifications: text('modifications', { mode: 'json' }),
}, (table) => [
  uniqueIndex('pk_injury_risks').on(table.exerciseName, table.injuryType),
]);

// ─── Agentic Memories ────────────────────────────────────────
export const agenticMemories = sqliteTable('agentic_memories', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  type: text('type', {
    enum: ['pattern', 'preference', 'adaptation', 'warning', 'success_factor', 'failure_factor'],
  }),
  description: text('description').notNull(),
  context: text('context', { mode: 'json' }),
  observations: integer('observations').default(1),
  successRate: real('success_rate'),
  firstObserved: integer('first_observed', { mode: 'timestamp_ms' }).default(sql`(unixepoch() * 1000)`),
  lastObserved: integer('last_observed', { mode: 'timestamp_ms' }).default(sql`(unixepoch() * 1000)`),
  trigger: text('trigger'),
  action: text('action'),
  confidence: real('confidence').default(0.5),
  embeddingVector: blob('embedding_vector'), // f32 array for sqlite-vec
  reinforced: integer('reinforced').default(0),
  appliedSuccessfully: integer('applied_successfully').default(0),
  appliedUnsuccessfully: integer('applied_unsuccessfully').default(0),
  lastApplied: integer('last_applied', { mode: 'timestamp_ms' }),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).default(sql`(unixepoch() * 1000)`),
  syncStatus: text('sync_status', { enum: ['pending', 'synced', 'conflict'] }).default('pending'),
  deletedAt: integer('deleted_at', { mode: 'timestamp_ms' }),
}, (table) => [
  index('idx_memories_user').on(table.userId),
  index('idx_memories_confidence').on(table.confidence),
  index('idx_memories_type_user').on(table.userId, table.type),
]);

// ─── User Disagreements ──────────────────────────────────────
export const userDisagreements = sqliteTable('user_disagreements', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  context: text('context', { mode: 'json' }),
  aiSuggested: text('ai_suggested'),
  userChose: text('user_chose'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).default(sql`(unixepoch() * 1000)`),
  syncStatus: text('sync_status', { enum: ['pending', 'synced', 'conflict'] }).default('pending'),
}, (table) => [
  index('idx_disagreements_user').on(table.userId),
]);

// ─── AI Response Cache ───────────────────────────────────────
export const aiResponseCache = sqliteTable('ai_response_cache', {
  cacheKey: text('cache_key').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  requestType: text('request_type', {
    enum: ['daily_prescription', 'mesocycle_generation', 'post_workout_analysis'],
  }),
  response: text('response', { mode: 'json' }),
  generatedAt: integer('generated_at', { mode: 'timestamp_ms' }),
  expiresAt: integer('expires_at', { mode: 'timestamp_ms' }),
  source: text('source', { enum: ['claude', 'deterministic', 'default'] }),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
});

// ─── AI Usage Log ────────────────────────────────────────────
export const aiUsageLog = sqliteTable('ai_usage_log', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  requestType: text('request_type').notNull(),
  inputTokens: integer('input_tokens').notNull(),
  outputTokens: integer('output_tokens').notNull(),
  durationMs: integer('duration_ms'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).default(sql`(unixepoch() * 1000)`),
});
```

### 1.3 FTS5 Virtual Table (Exercise Search)

```sql
-- Created in migration, not Drizzle (Drizzle doesn't support virtual tables)
CREATE VIRTUAL TABLE exercises_fts USING fts5(
  name,
  category,
  pattern,
  muscle_groups,
  content='exercises',
  content_rowid='rowid',
  tokenize='trigram'
);

-- Triggers to keep FTS in sync
CREATE TRIGGER exercises_ai AFTER INSERT ON exercises BEGIN
  INSERT INTO exercises_fts(rowid, name, category, pattern, muscle_groups)
  VALUES (new.rowid, new.name, new.category, new.pattern, new.muscle_groups);
END;

CREATE TRIGGER exercises_ad AFTER DELETE ON exercises BEGIN
  INSERT INTO exercises_fts(exercises_fts, rowid, name, category, pattern, muscle_groups)
  VALUES ('delete', old.rowid, old.name, old.category, old.pattern, old.muscle_groups);
END;
```

### 1.4 sqlite-vec Virtual Table (Memory Vectors)

```sql
-- Created after sqlite-vec extension is loaded
CREATE VIRTUAL TABLE memory_vectors USING vec0(
  memory_id TEXT PRIMARY KEY,
  embedding FLOAT[384]  -- dimension matches embedding model output
);
```

---

## 2. Migration Strategy

### 2.1 Drizzle Kit Configuration

```typescript
// drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/schema.ts',
  out: './drizzle/migrations',
  dialect: 'sqlite',
} satisfies Config;
```

### 2.2 Migration Application

```typescript
// src/lib/migrate.ts
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db } from './database';
import migrations from '../../drizzle/migrations/migrations';

export function useDatabaseMigrations() {
  return useMigrations(db, migrations);
}

// In App.tsx — gate UI behind migration completion
function App() {
  const { success, error } = useDatabaseMigrations();

  if (error) return <MigrationError error={error} />;
  if (!success) return <LoadingScreen message="Updating database..." />;

  return <RootNavigator />;
}
```

### 2.3 Custom Migrations (FTS5, sqlite-vec)

Virtual tables and triggers are applied as custom SQL after Drizzle migrations:

```typescript
// src/lib/custom-migrations.ts
export async function applyCustomMigrations(db: ExpoSQLiteDatabase) {
  // FTS5 for exercise search
  db.run(sql`
    CREATE VIRTUAL TABLE IF NOT EXISTS exercises_fts USING fts5(
      name, category, pattern, muscle_groups,
      content='exercises', content_rowid='rowid',
      tokenize='trigram'
    )
  `);

  // sqlite-vec for memory vectors (after extension load)
  db.run(sql`
    CREATE VIRTUAL TABLE IF NOT EXISTS memory_vectors USING vec0(
      memory_id TEXT PRIMARY KEY,
      embedding FLOAT[384]
    )
  `);
}
```

### 2.4 Seed Data Loading

```typescript
// src/lib/seed.ts
import { db } from './database';
import { exercises, injuryRisks } from './schema';
import exerciseSeedData from '../constants/exercise-seed-data.json';
import injuryRiskData from '../constants/injury-risk-matrix.json';

export async function seedDatabase() {
  const existingCount = await db.select({ count: sql<number>`count(*)` }).from(exercises);

  if (existingCount[0]?.count === 0) {
    await db.transaction(async (tx) => {
      // Batch insert exercises
      for (const batch of chunk(exerciseSeedData, 50)) {
        await tx.insert(exercises).values(batch);
      }

      // Batch insert injury risk matrix
      for (const batch of chunk(injuryRiskData, 50)) {
        await tx.insert(injuryRisks).values(batch);
      }

      // Rebuild FTS index
      tx.run(sql`INSERT INTO exercises_fts(exercises_fts) VALUES('rebuild')`);
    });
  }
}

function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
```

---

## 3. Repository Pattern

All database access goes through repository interfaces. Services never import Drizzle directly.

### 3.1 Workout Repository

```typescript
// src/features/workouts/workout-repository.ts
import { db } from '@/lib/database';
import { workouts, exercisePerformances, setLogs } from '@/lib/schema';
import { eq, and, desc, gte, lte, isNull } from 'drizzle-orm';

export interface IWorkoutRepository {
  findById(id: string): Promise<WorkoutWithExercises | null>;
  findRecent(userId: string, limit: number): Promise<WorkoutSummary[]>;
  findByDateRange(userId: string, from: number, to: number): Promise<WorkoutSummary[]>;
  findLastWithExercise(userId: string, exerciseName: string): Promise<ExerciseHistory | null>;
  insert(workout: WorkoutInsert): Promise<Workout>;
  update(id: string, updates: Partial<WorkoutInsert>): Promise<Workout>;
  softDelete(id: string): Promise<void>;
  getActiveWorkout(userId: string): Promise<WorkoutWithExercises | null>;
  saveCompleteWorkout(workout: CompleteWorkoutData): Promise<void>;
}

export const workoutRepository: IWorkoutRepository = {
  async findById(id) {
    const result = await db.query.workouts.findFirst({
      where: and(eq(workouts.id, id), isNull(workouts.deletedAt)),
      with: {
        exercisePerformances: {
          orderBy: [exercisePerformances.orderInWorkout],
          with: {
            setLogs: { orderBy: [setLogs.setNumber] },
          },
        },
      },
    });
    return result ?? null;
  },

  async findRecent(userId, limit) {
    return db.query.workouts.findMany({
      where: and(
        eq(workouts.userId, userId),
        eq(workouts.status, 'completed'),
        isNull(workouts.deletedAt),
      ),
      orderBy: [desc(workouts.date)],
      limit,
      columns: {
        id: true, date: true, type: true, durationMinutes: true,
        totalVolume: true, averageRpe: true,
      },
    });
  },

  async findByDateRange(userId, from, to) {
    return db.query.workouts.findMany({
      where: and(
        eq(workouts.userId, userId),
        gte(workouts.date, from),
        lte(workouts.date, to),
        isNull(workouts.deletedAt),
      ),
      orderBy: [desc(workouts.date)],
    });
  },

  async findLastWithExercise(userId, exerciseName) {
    const result = await db
      .select({
        workoutDate: workouts.date,
        weight: setLogs.weight,
        reps: setLogs.reps,
        rpe: setLogs.rpe,
        setNumber: setLogs.setNumber,
      })
      .from(setLogs)
      .innerJoin(exercisePerformances, eq(setLogs.exercisePerformanceId, exercisePerformances.id))
      .innerJoin(workouts, eq(exercisePerformances.workoutId, workouts.id))
      .where(and(
        eq(workouts.userId, userId),
        eq(exercisePerformances.exerciseName, exerciseName),
        eq(workouts.status, 'completed'),
        isNull(workouts.deletedAt),
      ))
      .orderBy(desc(workouts.date), setLogs.setNumber)
      .limit(20); // last session's sets (up to 20)

    return result.length > 0 ? { exerciseName, sets: result } : null;
  },

  async getActiveWorkout(userId) {
    return db.query.workouts.findFirst({
      where: and(
        eq(workouts.userId, userId),
        eq(workouts.status, 'active'),
        isNull(workouts.deletedAt),
      ),
      with: {
        exercisePerformances: {
          orderBy: [exercisePerformances.orderInWorkout],
          with: { setLogs: { orderBy: [setLogs.setNumber] } },
        },
      },
    }) ?? null;
  },

  async saveCompleteWorkout(data) {
    await db.transaction(async (tx) => {
      // Update workout summary
      await tx.update(workouts).set({
        status: 'completed',
        durationMinutes: data.durationMinutes,
        totalVolume: data.totalVolume,
        averageRpe: data.averageRpe,
        syncStatus: 'pending',
      }).where(eq(workouts.id, data.workoutId));

      // Update each exercise performance summary
      for (const ep of data.exerciseSummaries) {
        await tx.update(exercisePerformances).set({
          actualSets: ep.actualSets,
          actualAverageRpe: ep.actualAverageRpe,
          vsLastWeightDelta: ep.vsLastWeightDelta,
          vsLastVolumeDelta: ep.vsLastVolumeDelta,
        }).where(eq(exercisePerformances.id, ep.id));
      }
    });
  },

  async insert(data) {
    const [result] = await db.insert(workouts).values(data).returning();
    return result;
  },

  async update(id, updates) {
    const [result] = await db.update(workouts).set({
      ...updates,
      syncStatus: 'pending',
    }).where(eq(workouts.id, id)).returning();
    return result;
  },

  async softDelete(id) {
    await db.update(workouts).set({
      deletedAt: Date.now(),
      syncStatus: 'pending',
    }).where(eq(workouts.id, id));
  },
};
```

### 3.2 Exercise Repository

```typescript
// src/features/exercises/exercise-repository.ts
export interface IExerciseRepository {
  search(query: string, limit?: number): Promise<Exercise[]>;
  findByName(name: string): Promise<Exercise | null>;
  findByMuscleGroup(group: string): Promise<Exercise[]>;
  findByPattern(pattern: string): Promise<Exercise[]>;
  findSubstitutes(exerciseName: string, restrictions: InjuryRestriction[]): Promise<Exercise[]>;
  getRiskMatrix(exerciseName: string): Promise<InjuryRiskEntry[]>;
}

export const exerciseRepository: IExerciseRepository = {
  async search(query, limit = 20) {
    // Use FTS5 for fuzzy search with trigram tokenizer
    const results = await db.all(sql`
      SELECT e.*
      FROM exercises_fts fts
      JOIN exercises e ON e.rowid = fts.rowid
      WHERE exercises_fts MATCH ${query + '*'}
      ORDER BY rank
      LIMIT ${limit}
    `);
    return results;
  },

  async findByName(name) {
    return db.query.exercises.findFirst({
      where: eq(exercises.name, name),
    }) ?? null;
  },

  async findByMuscleGroup(group) {
    // JSON contains check for muscle_groups array
    return db.query.exercises.findMany({
      where: sql`json_each.value = ${group}`,
    });
  },

  async findByPattern(pattern) {
    return db.query.exercises.findMany({
      where: eq(exercises.pattern, pattern),
    });
  },

  async findSubstitutes(exerciseName, restrictions) {
    const exercise = await this.findByName(exerciseName);
    if (!exercise) return [];

    // Find exercises with same pattern that are safe
    const candidates = await this.findByPattern(exercise.pattern ?? '');

    // Filter out unsafe exercises
    const safe: Exercise[] = [];
    for (const candidate of candidates) {
      if (candidate.name === exerciseName) continue;
      const risks = await this.getRiskMatrix(candidate.name);
      const isUnsafe = risks.some(r =>
        restrictions.some(res => res.injuryType === r.injuryType && r.riskLevel === 'HIGH')
      );
      if (!isUnsafe) safe.push(candidate);
    }

    return safe;
  },

  async getRiskMatrix(exerciseName) {
    return db.query.injuryRisks.findMany({
      where: eq(injuryRisks.exerciseName, exerciseName),
    });
  },
};
```

### 3.3 Memory Repository

```typescript
// src/features/memory/memory-repository.ts
export interface IMemoryRepository {
  insert(memory: MemoryInsert): Promise<AgenticMemory>;
  update(id: string, updates: Partial<MemoryInsert>): Promise<void>;
  findByUser(userId: string, limit?: number): Promise<AgenticMemory[]>;
  findByType(userId: string, type: string): Promise<AgenticMemory[]>;
  reinforceMemory(id: string): Promise<void>;
  recordOutcome(id: string, success: boolean): Promise<void>;
  searchByVector(embedding: number[], userId: string, topK: number): Promise<AgenticMemory[]>;
  pruneExpired(userId: string, maxMemories: number): Promise<number>;
}

export const memoryRepository: IMemoryRepository = {
  async insert(memory) {
    const [result] = await db.insert(agenticMemories).values(memory).returning();

    // If embedding provided, insert into sqlite-vec
    if (memory.embeddingVector) {
      await db.run(sql`
        INSERT INTO memory_vectors(memory_id, embedding)
        VALUES (${result.id}, ${memory.embeddingVector})
      `);
    }

    return result;
  },

  async reinforceMemory(id) {
    await db.update(agenticMemories).set({
      reinforced: sql`reinforced + 1`,
      observations: sql`observations + 1`,
      lastObserved: Date.now(),
      confidence: sql`MIN(1.0, confidence + 0.05)`,
      updatedAt: Date.now(),
      syncStatus: 'pending',
    }).where(eq(agenticMemories.id, id));
  },

  async recordOutcome(id, success) {
    const field = success ? 'applied_successfully' : 'applied_unsuccessfully';
    await db.update(agenticMemories).set({
      [field]: sql`${sql.identifier(field)} + 1`,
      lastApplied: Date.now(),
      confidence: success
        ? sql`MIN(1.0, confidence + 0.03)`
        : sql`MAX(0.0, confidence - 0.08)`,
      updatedAt: Date.now(),
      syncStatus: 'pending',
    }).where(eq(agenticMemories.id, id));
  },

  async searchByVector(embedding, userId, topK) {
    // sqlite-vec ANN search with user filter
    const vectorResults = await db.all(sql`
      SELECT mv.memory_id, mv.distance
      FROM memory_vectors mv
      WHERE mv.embedding MATCH ${new Float32Array(embedding)}
        AND k = ${topK * 2}
      ORDER BY mv.distance ASC
    `);

    // Join with full memory data and filter by user
    const memoryIds = vectorResults.map((r: { memory_id: string }) => r.memory_id);
    if (memoryIds.length === 0) return [];

    const memories = await db.query.agenticMemories.findMany({
      where: and(
        eq(agenticMemories.userId, userId),
        isNull(agenticMemories.deletedAt),
        sql`id IN (${sql.join(memoryIds.map(id => sql`${id}`), sql`, `)})`,
      ),
    });

    // Apply recency boost: score = (1 - distance) * recencyMultiplier
    const now = Date.now();
    const scored = memories.map(m => {
      const vectorEntry = vectorResults.find((v: { memory_id: string }) => v.memory_id === m.id);
      const similarity = 1 - (vectorEntry?.distance ?? 1);
      const ageMs = now - (m.lastObserved ?? m.createdAt);
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      const recencyBoost = Math.exp(-ageDays / 30); // decay over 30 days
      const score = similarity * 0.6 + recencyBoost * 0.2 + (m.confidence ?? 0.5) * 0.2;
      return { ...m, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  },

  async pruneExpired(userId, maxMemories) {
    // Count user memories
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(agenticMemories)
      .where(and(eq(agenticMemories.userId, userId), isNull(agenticMemories.deletedAt)));

    if (count <= maxMemories) return 0;

    // Soft-delete lowest confidence memories beyond budget
    const toRemove = count - maxMemories;
    const candidates = await db.query.agenticMemories.findMany({
      where: and(eq(agenticMemories.userId, userId), isNull(agenticMemories.deletedAt)),
      orderBy: [agenticMemories.confidence],
      limit: toRemove,
      columns: { id: true },
    });

    for (const c of candidates) {
      await db.update(agenticMemories).set({
        deletedAt: Date.now(),
        syncStatus: 'pending',
      }).where(eq(agenticMemories.id, c.id));
    }

    return candidates.length;
  },

  // ... remaining simple CRUD methods
  async update(id, updates) {
    await db.update(agenticMemories).set({
      ...updates,
      updatedAt: Date.now(),
      syncStatus: 'pending',
    }).where(eq(agenticMemories.id, id));
  },

  async findByUser(userId, limit = 50) {
    return db.query.agenticMemories.findMany({
      where: and(eq(agenticMemories.userId, userId), isNull(agenticMemories.deletedAt)),
      orderBy: [desc(agenticMemories.confidence)],
      limit,
    });
  },

  async findByType(userId, type) {
    return db.query.agenticMemories.findMany({
      where: and(
        eq(agenticMemories.userId, userId),
        eq(agenticMemories.type, type),
        isNull(agenticMemories.deletedAt),
      ),
      orderBy: [desc(agenticMemories.confidence)],
    });
  },
};
```

### 3.4 AI Response Cache

```typescript
// src/features/ai/ai-cache-repository.ts
export interface IAIResponseCache {
  get(cacheKey: string): Promise<CachedResponse | null>;
  set(cacheKey: string, data: CacheEntry): Promise<void>;
  invalidateForUser(userId: string): Promise<void>;
}

export const aiCacheRepository: IAIResponseCache = {
  async get(cacheKey) {
    const result = await db.query.aiResponseCache.findFirst({
      where: and(
        eq(aiResponseCache.cacheKey, cacheKey),
        gte(aiResponseCache.expiresAt, Date.now()),
      ),
    });
    return result ?? null;
  },

  async set(cacheKey, data) {
    await db.insert(aiResponseCache).values({
      cacheKey,
      ...data,
    }).onConflictDoUpdate({
      target: aiResponseCache.cacheKey,
      set: data,
    });
  },

  async invalidateForUser(userId) {
    await db.delete(aiResponseCache).where(eq(aiResponseCache.userId, userId));
  },
};
```

---

## 4. Claude API Service (Edge Functions)

### 4.1 Edge Function Structure

```
supabase/functions/
  ai-coach/
    index.ts          # Entry point with auth + rate limiting
    prompts.ts        # Prompt templates for each request type
    schemas.ts        # Zod schemas for request/response validation
    usage.ts          # Token usage tracking
```

### 4.2 Request/Response Schemas

```typescript
// supabase/functions/ai-coach/schemas.ts
import { z } from 'zod';

// ─── Request Schema ──────────────────────────────────────────
export const AIRequestSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('daily_prescription'),
    context: z.object({
      userId: z.string().uuid(),
      mesocycleWeek: z.number().int().min(1).max(16),
      phase: z.enum(['accumulation', 'intensification', 'realization', 'deload']),
      sessionType: z.string(),
      recentWorkouts: z.array(z.object({
        date: z.number(),
        type: z.string(),
        averageRpe: z.number(),
        totalVolume: z.number(),
      })).max(14),
      activeInjuries: z.array(z.object({
        type: z.string(),
        status: z.enum(['acute', 'chronic', 'recovering']),
        severity: z.number().min(1).max(10),
      })),
      relevantMemories: z.array(z.object({
        description: z.string(),
        confidence: z.number(),
        type: z.string(),
      })).max(10),
      readiness: z.object({
        energy: z.number().min(1).max(5),
        soreness: z.number().min(1).max(5),
      }).optional(),
    }),
  }),
  z.object({
    type: z.literal('mesocycle_generation'),
    context: z.object({
      userId: z.string().uuid(),
      experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']),
      trainingGoal: z.string(),
      weeklyFrequency: z.number().int().min(1).max(7),
      availableEquipment: z.array(z.string()),
      injuries: z.array(z.object({
        type: z.string(),
        status: z.string(),
        severity: z.number(),
      })),
      previousMesocycleReview: z.object({
        adherence: z.number(),
        progressionRate: z.number(),
        issuesEncountered: z.array(z.string()),
      }).optional(),
    }),
  }),
  z.object({
    type: z.literal('post_workout_analysis'),
    context: z.object({
      userId: z.string().uuid(),
      workout: z.object({
        date: z.number(),
        type: z.string(),
        durationMinutes: z.number(),
        exercises: z.array(z.object({
          name: z.string(),
          sets: z.array(z.object({
            weight: z.number(),
            reps: z.number(),
            rpe: z.number(),
          })),
          prescribedRpe: z.number(),
        })),
      }),
      recentHistory: z.array(z.unknown()).max(7),
    }),
  }),
]);

// ─── Response Schemas ────────────────────────────────────────
export const PrescribedExerciseSchema = z.object({
  exerciseName: z.string(),
  sets: z.number().int().min(1).max(10),
  reps: z.number().int().min(1).max(30),
  weight: z.number().min(0),
  rpeTarget: z.number().min(5).max(10),
  tempo: z.string().optional(),
  restSeconds: z.number().int().min(30).max(600),
  rationale: z.string(),
  alternatives: z.array(z.string()).optional(),
});

export const WorkoutPrescriptionSchema = z.object({
  exercises: z.array(PrescribedExerciseSchema).min(1).max(12),
  sessionRationale: z.string(),
  estimatedDurationMinutes: z.number().int(),
  warnings: z.array(z.string()),
});

export const MesocycleSchema = z.object({
  name: z.string(),
  durationWeeks: z.number().int().min(4).max(16),
  periodizationModel: z.enum(['linear', 'block', 'dup', 'conjugate']),
  goal: z.string(),
  weeks: z.array(z.object({
    weekNumber: z.number().int(),
    phase: z.string(),
    sessions: z.array(z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      sessionType: z.string(),
      focus: z.string(),
    })),
    targetIntensity: z.number(),
    targetVolume: z.number(),
  })),
  rationale: z.string(),
});

export const PostWorkoutAnalysisSchema = z.object({
  summary: z.string(),
  patterns: z.array(z.object({
    type: z.string(),
    description: z.string(),
    confidence: z.number().min(0).max(1),
  })),
  recommendations: z.array(z.string()),
  memoriesToStore: z.array(z.object({
    type: z.enum(['pattern', 'preference', 'adaptation', 'warning', 'success_factor']),
    description: z.string(),
    trigger: z.string(),
    action: z.string(),
    confidence: z.number(),
  })),
});
```

### 4.3 Prompt Templates

```typescript
// supabase/functions/ai-coach/prompts.ts

export function buildDailyPrescriptionPrompt(context: DailyPrescriptionContext) {
  const systemPrompt = `You are an expert strength and conditioning coach.
You prescribe evidence-based workouts using periodization principles.

Rules:
- All load suggestions must account for active injuries
- RPE targets should match the current mesocycle phase
- Provide a clear rationale for every exercise choice
- If the user has injury restrictions, suggest safe alternatives
- Exercises must match available equipment

Current mesocycle context:
- Week ${context.mesocycleWeek}, Phase: ${context.phase}
- Session type: ${context.sessionType}
- Active injuries: ${JSON.stringify(context.activeInjuries)}
- Relevant patterns from history: ${context.relevantMemories.map(m => m.description).join('; ')}`;

  const userMessage = `Generate today's workout prescription.

Recent performance (last 14 days):
${context.recentWorkouts.map(w =>
  `${new Date(w.date).toLocaleDateString()}: ${w.type}, avg RPE ${w.averageRpe}, volume ${w.totalVolume}kg`
).join('\n')}

${context.readiness ? `Today's readiness: Energy ${context.readiness.energy}/5, Soreness ${context.readiness.soreness}/5` : ''}`;

  return { systemPrompt, userMessage, schema: WorkoutPrescriptionSchema };
}

export function buildMesocyclePrompt(context: MesocycleContext) {
  const systemPrompt = `You are an expert periodization coach designing a multi-week training mesocycle.

Rules:
- Use ${context.weeklyFrequency} training days per week
- Program around injuries: ${JSON.stringify(context.injuries)}
- Equipment available: ${context.availableEquipment.join(', ')}
- Experience level: ${context.experienceLevel}
- Goal: ${context.trainingGoal}
${context.previousMesocycleReview
  ? `- Previous mesocycle: ${context.previousMesocycleReview.adherence}% adherence, issues: ${context.previousMesocycleReview.issuesEncountered.join(', ')}`
  : '- First mesocycle for this user'}

Design a complete mesocycle with progressive overload, appropriate deload timing, and phase transitions.`;

  const userMessage = 'Generate the complete mesocycle plan.';

  return { systemPrompt, userMessage, schema: MesocycleSchema };
}

export function buildPostWorkoutPrompt(context: PostWorkoutContext) {
  const systemPrompt = `You are an expert sports scientist analyzing a completed workout.
Identify patterns, assess performance vs prescription, and generate actionable memories.

Focus on:
- RPE deviations from targets (significance threshold: ±1.0)
- Volume and load progression trends
- Signs of fatigue accumulation or readiness improvement
- Injury risk indicators`;

  const userMessage = `Analyze this completed workout:
${JSON.stringify(context.workout, null, 2)}

Recent history for comparison:
${JSON.stringify(context.recentHistory, null, 2)}`;

  return { systemPrompt, userMessage, schema: PostWorkoutAnalysisSchema };
}
```

### 4.4 Edge Function Entry Point

See the complete Edge Function implementation in `04-SYSTEM-ARCHITECTURE.md`, Section 5.2. Key additions:

```typescript
// supabase/functions/ai-coach/index.ts
// Error handling with typed responses

function parseClaudeResponse(
  type: AIRequestType,
  response: Anthropic.Message
): z.infer<typeof WorkoutPrescriptionSchema> | z.infer<typeof MesocycleSchema> | z.infer<typeof PostWorkoutAnalysisSchema> {
  // Extract tool use result from Claude response
  const toolUse = response.content.find(block => block.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error('Claude did not return structured output');
  }

  const schemaMap = {
    daily_prescription: WorkoutPrescriptionSchema,
    mesocycle_generation: MesocycleSchema,
    post_workout_analysis: PostWorkoutAnalysisSchema,
  } as const;

  return schemaMap[type].parse(toolUse.input);
}
```

### 4.5 Client-Side AI Service

```typescript
// src/features/ai/ai-service.ts
import { aiCacheRepository } from './ai-cache-repository';
import { memoryRepository } from '../memory/memory-repository';

export const aiService: IAIService = {
  async getDailyPrescription(context) {
    // 1. Check cache
    const cacheKey = buildCacheKey(context);
    const cached = await aiCacheRepository.get(cacheKey);
    if (cached) {
      return { ...cached.response, source: 'cache' as const };
    }

    // 2. Try Claude via Edge Function
    try {
      const response = await fetchWithTimeout(
        `${SUPABASE_URL}/functions/v1/ai-coach`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${await getJWT()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ type: 'daily_prescription', context }),
        },
        10_000, // 10s timeout
      );

      if (!response.ok) throw new Error(`AI error: ${response.status}`);

      const prescription = await response.json();

      // Cache for 8 hours
      await aiCacheRepository.set(cacheKey, {
        userId: context.userProfile.id,
        requestType: 'daily_prescription',
        response: prescription,
        generatedAt: Date.now(),
        expiresAt: Date.now() + 8 * 60 * 60 * 1000,
        source: 'claude',
      });

      return { ...prescription, source: 'claude' as const };
    } catch {
      // 3. Deterministic fallback
      return this.deterministicFallback(context);
    }
  },

  deterministicFallback(context) {
    // Uses ProgressionCalculator to generate valid prescription from last data
    // See 04-SYSTEM-ARCHITECTURE.md Section 5.3 for the full fallback chain
  },
};

function buildCacheKey(context: AIContext): string {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const parts = [context.userProfile.id, context.mesocycleContext.currentWeek, context.mesocycleContext.sessionType, date];
  return parts.join(':');
}
```

---

## 5. Agentic Memory Storage

### 5.1 Memory Lifecycle

```
Event occurs (RPE deviation, user override, pattern detected)
    │
    ▼
MemoryService.storeMemory()
    │
    ├─ Check for existing similar memory
    │   ├─ EXISTS → reinforceMemory() (bump observations + confidence)
    │   └─ NEW → insert new memory
    │
    ▼
[Online?]
    ├─ YES → Generate embedding via Edge Function
    │        Store in sqlite-vec for vector search
    │        Mark syncStatus = 'pending' for PowerSync upload
    └─ NO  → Queue embedding generation
             Memory still searchable by metadata (type, context)
    │
    ▼
Memory used in AI context assembly
    │
    ▼
Outcome recorded → confidence adjusted
    │
    ▼
[Over budget?]
    ├─ YES → Prune lowest-confidence memories (soft delete)
    └─ NO  → Done
```

### 5.2 Confidence Scoring

```typescript
// src/features/memory/confidence.ts

export function calculateConfidence(memory: AgenticMemory): number {
  const observationWeight = Math.min(memory.observations / 10, 1.0) * 0.3;

  const totalApplications = memory.appliedSuccessfully + memory.appliedUnsuccessfully;
  const successWeight = totalApplications > 0
    ? (memory.appliedSuccessfully / totalApplications) * 0.4
    : 0.2; // neutral if never applied

  const ageMs = Date.now() - (memory.lastObserved ?? memory.createdAt);
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  const recencyWeight = Math.exp(-ageDays / 60) * 0.3; // 60-day half-life

  return Math.min(1.0, observationWeight + successWeight + recencyWeight);
}

// Storage budget: max 500 memories per user
export const MEMORY_BUDGET = 500;
```

### 5.3 Context Assembly for AI Calls

```typescript
// src/features/memory/memory-service.ts
export const memoryService: IMemoryService = {
  async buildAIContext(userId) {
    // Get relevant memories (top 5 by vector similarity to current session context)
    const sessionDescription = await buildSessionDescription(userId);

    let relevantMemories: AgenticMemory[];
    try {
      const embedding = await generateEmbedding(sessionDescription);
      relevantMemories = await memoryRepository.searchByVector(embedding, userId, 5);
    } catch {
      // Fallback: metadata-based retrieval
      relevantMemories = await memoryRepository.findByUser(userId, 5);
    }

    const activeInjuries = await injuryRepository.findActive(userId);
    const recentWorkouts = await workoutRepository.findRecent(userId, 14);
    const userProfile = await userRepository.findById(userId);
    const mesocycle = await mesocycleRepository.findActive(userId);

    return {
      userProfile: userProfile!,
      mesocycleContext: {
        currentWeek: mesocycle?.currentWeek ?? 1,
        currentPhase: mesocycle?.phase ?? 'accumulation',
        sessionType: mesocycle?.nextSessionType ?? 'full_body',
      },
      recentWorkouts,
      relevantMemories,
      activeInjuries,
    };
  },
};
```

---

## 6. Exercise Seed Data

### 6.1 Exercise Data Structure

```typescript
// src/constants/exercise-seed-data.ts (excerpt — full dataset in JSON)
export interface ExerciseSeed {
  name: string;
  category: 'compound' | 'isolation' | 'cardio' | 'flexibility';
  pattern: 'squat' | 'hinge' | 'push' | 'pull' | 'carry' | 'rotation' | 'core' | 'cardio';
  equipment: string[];
  muscleGroups: string[];
  defaultTempo: string;
  defaultRestSeconds: number;
  instructions: string[];
  cues: string[];
  commonMistakes: string[];
  variations: string[];
}

// Sample entries
const EXERCISES: ExerciseSeed[] = [
  {
    name: 'Barbell Back Squat',
    category: 'compound',
    pattern: 'squat',
    equipment: ['barbell', 'squat_rack'],
    muscleGroups: ['quadriceps', 'glutes', 'hamstrings', 'core'],
    defaultTempo: '3010',
    defaultRestSeconds: 180,
    instructions: ['Unrack barbell at upper back', 'Feet shoulder-width apart', 'Descend until hip crease below knee', 'Drive through midfoot to stand'],
    cues: ['Chest up', 'Knees tracking toes', 'Brace core'],
    commonMistakes: ['Knees caving', 'Forward lean', 'Depth too shallow'],
    variations: ['Front Squat', 'Goblet Squat', 'Safety Bar Squat', 'Box Squat'],
  },
  {
    name: 'Barbell Bench Press',
    category: 'compound',
    pattern: 'push',
    equipment: ['barbell', 'bench'],
    muscleGroups: ['chest', 'anterior_deltoid', 'triceps'],
    defaultTempo: '3010',
    defaultRestSeconds: 180,
    instructions: ['Lie on bench, feet flat on floor', 'Grip slightly wider than shoulders', 'Lower bar to mid-chest', 'Press up to lockout'],
    cues: ['Retract scapulae', 'Arch upper back', 'Leg drive'],
    commonMistakes: ['Bouncing off chest', 'Flared elbows', 'Uneven press'],
    variations: ['Incline Bench Press', 'Dumbbell Bench Press', 'Close-Grip Bench Press'],
  },
  // ... 100+ more exercises
];
```

### 6.2 Injury Risk Matrix (excerpt)

```typescript
export interface InjuryRiskSeed {
  exerciseName: string;
  injuryType: string;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH';
  note: string;
  contraindications: string[];
  modifications: string[];
}

const INJURY_RISK_MATRIX: InjuryRiskSeed[] = [
  {
    exerciseName: 'Barbell Back Squat',
    injuryType: 'ankle_instability',
    riskLevel: 'MODERATE',
    note: 'Ankle dorsiflexion under load may stress ATFL',
    contraindications: ['acute ankle inflammation'],
    modifications: ['Elevate heels with plates', 'Use safety bar to reduce ankle demand', 'Reduce depth to parallel'],
  },
  {
    exerciseName: 'Barbell Back Squat',
    injuryType: 'back_sensitivity',
    riskLevel: 'MODERATE',
    note: 'Axial loading with forward lean increases lumbar stress',
    contraindications: ['acute disc herniation'],
    modifications: ['Belt squat instead', 'Front squat (more upright)', 'Reduce load by 20%'],
  },
  {
    exerciseName: 'Running',
    injuryType: 'ankle_instability',
    riskLevel: 'HIGH',
    note: 'Repeated single-leg impact stresses lateral ankle',
    contraindications: ['acute ATFL tear'],
    modifications: ['Stationary bike for cardio', 'Pool running', 'Ankle brace required'],
  },
  // ... entries for all exercise × injury combinations
];
```

### 6.3 Default Rest Times by Phase

```typescript
export const REST_TIME_DEFAULTS: Record<string, Record<string, number>> = {
  compound: {
    accumulation: 120,     // 2 min
    intensification: 180,  // 3 min
    realization: 240,      // 4 min
    deload: 120,           // 2 min
  },
  isolation: {
    accumulation: 60,
    intensification: 90,
    realization: 120,
    deload: 60,
  },
  cardio: {
    accumulation: 30,
    intensification: 45,
    realization: 60,
    deload: 30,
  },
};
```

---

## 7. Offline Sync (PowerSync)

### 7.1 PowerSync Configuration

```typescript
// src/lib/sync.ts
import { PowerSyncDatabase } from '@powersync/react-native';

const SYNCED_TABLES = [
  'users', 'injuries', 'user_equipment',
  'mesocycles', 'microcycles',
  'workouts', 'exercise_performances', 'set_logs',
  'agentic_memories', 'user_disagreements',
];

// Tables NOT synced (local only):
// - exercises (seed data, identical everywhere)
// - injury_risks (seed data)
// - ai_response_cache (local cache)
// - ai_usage_log (logged server-side via Edge Function)

export const powerSyncConfig = {
  retryDelayMs: 1000,
  maxRetryDelayMs: 30_000,
  crudUploadThrottleMs: 200,
};
```

### 7.2 Conflict Resolution Rules

```
┌───────────────────────────┬──────────────────────┬────────────────────────────┐
│ Table                     │ Strategy             │ Rationale                  │
├───────────────────────────┼──────────────────────┼────────────────────────────┤
│ workouts (active)         │ Client always wins   │ Never overwrite live data  │
│ workouts (completed)      │ Last-Write-Wins      │ Standard; single user      │
│ set_logs                  │ Last-Write-Wins      │ Immutable after workout    │
│ exercise_performances     │ Last-Write-Wins      │ Immutable after workout    │
│ mesocycles                │ Server wins           │ AI-generated server-side   │
│ agentic_memories          │ Last-Write-Wins      │ Both sides can update      │
│ injuries                  │ Last-Write-Wins      │ User-edited                │
│ users                     │ Last-Write-Wins      │ Single user profile        │
│ user_disagreements        │ Client always wins   │ User intent is source      │
└───────────────────────────┴──────────────────────┴────────────────────────────┘
```

### 7.3 Sync Priority

Upload queue processes records in this priority order:

1. **Workout data** (workouts, exercise_performances, set_logs) — highest priority
2. **Agentic memories** — needed for server-side AI calls
3. **User profile + injuries** — context for AI
4. **User disagreements + preferences** — lowest priority

### 7.4 Supabase RLS Policies

```sql
-- Users can only read/write their own data
CREATE POLICY "Users own their data" ON workouts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Same pattern for all user-owned tables
-- Applied to: injuries, mesocycles, microcycles, workouts,
--             exercise_performances, set_logs, agentic_memories,
--             user_disagreements, user_equipment

-- Exercises and injury_risks are read-only (seed data)
CREATE POLICY "Exercises are public read" ON exercises
  FOR SELECT USING (true);

CREATE POLICY "Injury risks are public read" ON injury_risks
  FOR SELECT USING (true);
```
