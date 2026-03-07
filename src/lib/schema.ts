import { sqliteTable, text, integer, real, index, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  experienceLevel: text("experience_level").notNull().default("beginner"),
  trainingGoal: text("training_goal").notNull().default("general_fitness"),
  unitSystem: text("unit_system").notNull().default("metric"),
  syncStatus: text("sync_status").notNull().default("pending"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  deletedAt: text("deleted_at"),
  availableEquipment: text("available_equipment").notNull().default("[]"),
  weeklyFrequency: integer("weekly_frequency").notNull().default(3),
});

export const exercises = sqliteTable("exercises", {
  exerciseId: text("exercise_id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category").notNull(),
  pattern: text("pattern").notNull(),
  equipment: text("equipment").notNull().default("[]"),
  muscleGroups: text("muscle_groups").notNull().default("[]"),
  defaultTempo: text("default_tempo").default("3010"),
  defaultRestSeconds: integer("default_rest_seconds").default(120),
  instructions: text("instructions").notNull().default("[]"),
  cues: text("cues").notNull().default("[]"),
  commonMistakes: text("common_mistakes").notNull().default("[]"),
  variations: text("variations").notNull().default("[]"),
}, (table) => [
  index("idx_exercises_name").on(table.name),
]);

export const injuryRisks = sqliteTable("injury_risks", {
  id: text("id").primaryKey(),
  exerciseId: text("exercise_id")
    .notNull()
    .references(() => exercises.exerciseId),
  injuryType: text("injury_type").notNull(),
  riskLevel: text("risk_level").notNull(),
  contraindications: text("contraindications").notNull().default("[]"),
  modifications: text("modifications").notNull().default("[]"),
});

export const injuries = sqliteTable("injuries", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  type: text("type").notNull(),
  status: text("status").notNull().default("acute"),
  severity: integer("severity").notNull().default(5),
  dateOccurred: text("date_occurred").notNull(),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const workouts = sqliteTable(
  "workouts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    date: text("date").notNull(),
    type: text("type").notNull().default("custom"),
    status: text("status").notNull().default("active"),
    durationMinutes: integer("duration_minutes"),
    totalVolume: real("total_volume"),
    averageRpe: real("average_rpe"),
    mesocycleId: text("mesocycle_id"),
    microcycleId: text("microcycle_id"),
    restTimerEndsAt: integer("rest_timer_ends_at"),
    syncStatus: text("sync_status").notNull().default("pending"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("idx_workouts_user_date").on(table.userId, table.date),
  ],
);

export const exercisePerformances = sqliteTable(
  "exercise_performances",
  {
    id: text("id").primaryKey(),
    workoutId: text("workout_id")
      .notNull()
      .references(() => workouts.id),
    exerciseId: text("exercise_id")
      .notNull()
      .references(() => exercises.exerciseId),
    prescribedSets: integer("prescribed_sets"),
    prescribedReps: integer("prescribed_reps"),
    prescribedWeight: real("prescribed_weight"),
    prescribedRpe: real("prescribed_rpe"),
    prescribedRestSeconds: integer("prescribed_rest_seconds"),
    actualSets: integer("actual_sets"),
    actualAverageRpe: real("actual_average_rpe"),
    orderInWorkout: integer("order_in_workout").notNull().default(0),
  },
  (table) => [
    index("idx_ep_workout").on(table.workoutId),
    index("idx_ep_exercise").on(table.exerciseId),
  ],
);

export const setLogs = sqliteTable(
  "set_logs",
  {
    id: text("id").primaryKey(),
    exercisePerformanceId: text("exercise_performance_id")
      .notNull()
      .references(() => exercisePerformances.id),
    setNumber: integer("set_number").notNull(),
    weight: real("weight"),
    reps: integer("reps"),
    rpe: real("rpe"),
    type: text("type").notNull().default("working"),
    restTimeUsed: integer("rest_time_used"),
    completedAt: text("completed_at"),
    syncStatus: text("sync_status").notNull().default("pending"),
  },
  (table) => [
    index("idx_set_logs_ep").on(table.exercisePerformanceId),
  ],
);

export const personalRecords = sqliteTable(
  "personal_records",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    exerciseId: text("exercise_id")
      .notNull()
      .references(() => exercises.exerciseId),
    weight: real("weight").notNull(),
    reps: integer("reps").notNull(),
    estimatedOneRepMax: real("estimated_one_rep_max").notNull(),
    achievedAt: text("achieved_at").notNull(),
    workoutId: text("workout_id")
      .notNull()
      .references(() => workouts.id),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_pr_user_exercise").on(table.userId, table.exerciseId),
  ],
);

export const mesocycles = sqliteTable(
  "mesocycles",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    name: text("name").notNull(),
    periodizationModel: text("periodization_model").notNull(),
    startDate: text("start_date").notNull(),
    endDate: text("end_date").notNull(),
    durationWeeks: integer("duration_weeks").notNull(),
    status: text("status").notNull().default("active"),
    goal: text("goal").notNull(),
    generatedPlan: text("generated_plan").notNull().default("{}"),
    finalReview: text("final_review"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    syncStatus: text("sync_status").notNull().default("pending"),
    deletedAt: text("deleted_at"),
  },
  (table) => [
    index("idx_mesocycles_user").on(table.userId),
    index("idx_mesocycles_status").on(table.userId, table.status),
  ],
);

export const microcycles = sqliteTable(
  "microcycles",
  {
    id: text("id").primaryKey(),
    mesocycleId: text("mesocycle_id")
      .notNull()
      .references(() => mesocycles.id),
    weekNumber: integer("week_number").notNull(),
    phase: text("phase").notNull(),
    targetVolume: real("target_volume"),
    targetIntensity: real("target_intensity"),
    targetFrequency: integer("target_frequency"),
    actualVolume: real("actual_volume"),
    actualIntensity: real("actual_intensity"),
    actualFrequency: integer("actual_frequency"),
    status: text("status").notNull().default("pending"),
    review: text("review"),
    syncStatus: text("sync_status").notNull().default("pending"),
  },
  (table) => [
    uniqueIndex("idx_microcycles_meso_week").on(
      table.mesocycleId,
      table.weekNumber,
    ),
  ],
);

export const aiCache = sqliteTable(
  "ai_cache",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    cacheKey: text("cache_key").notNull(),
    response: text("response").notNull(),
    expiresAt: integer("expires_at").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("idx_ai_cache_key").on(table.userId, table.cacheKey),
  ],
);
