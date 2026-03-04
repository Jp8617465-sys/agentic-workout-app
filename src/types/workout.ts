export type WorkoutType = "upper" | "lower" | "full_body" | "push" | "pull" | "custom";

export type WorkoutStatus = "active" | "completed" | "abandoned";

export type SetType = "warmup" | "working" | "backoff" | "amrap";

export type SyncStatus = "synced" | "pending" | "conflict";

export type ExperienceLevel = "beginner" | "intermediate" | "advanced" | "elite";

export type TrainingGoal =
  | "strength"
  | "hypertrophy"
  | "endurance"
  | "general_fitness"
  | "weight_loss"
  | "athletic_performance";

export type UnitSystem = "metric" | "imperial";

export type InjuryStatus = "acute" | "chronic" | "recovering" | "resolved";

export interface User {
  id: string;
  name: string;
  email: string | null;
  experienceLevel: ExperienceLevel;
  trainingGoal: TrainingGoal;
  unitSystem: UnitSystem;
  availableEquipment: string[];
  weeklyFrequency: number;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Workout {
  id: string;
  userId: string;
  date: string;
  type: WorkoutType;
  status: WorkoutStatus;
  mesocycleId: string | null;
  microcycleId: string | null;
  durationMinutes: number | null;
  totalVolume: number | null;
  averageRpe: number | null;
  restTimerEndsAt: number | null;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ExercisePerformance {
  id: string;
  workoutId: string;
  exerciseName: string;
  prescribedSets: number | null;
  prescribedReps: number | null;
  prescribedWeight: number | null;
  prescribedRpe: number | null;
  prescribedRestSeconds: number | null;
  actualSets: number | null;
  actualAverageRpe: number | null;
  orderInWorkout: number;
}

export interface SetLog {
  id: string;
  exercisePerformanceId: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  type: SetType;
  restTimeUsed: number | null;
  completedAt: string | null;
  syncStatus: SyncStatus;
}

export interface Injury {
  id: string;
  userId: string;
  type: string;
  status: InjuryStatus;
  severity: number;
  dateOccurred: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
