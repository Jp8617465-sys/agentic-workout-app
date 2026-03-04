import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";

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
});

export const exercises = sqliteTable("exercises", {
  name: text("name").primaryKey(),
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
});

export const injuryRisks = sqliteTable("injury_risks", {
  id: text("id").primaryKey(),
  exerciseName: text("exercise_name")
    .notNull()
    .references(() => exercises.name),
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
    exerciseName: text("exercise_name")
      .notNull()
      .references(() => exercises.name),
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
