import type { SetType } from "../../types";

export interface WorkoutSet {
  id: string | null;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  type: SetType;
  isCompleted: boolean;
  previousWeight: number | null;
  previousReps: number | null;
}

export interface WorkoutExercise {
  exercisePerformanceId: string;
  exerciseName: string;
  prescribedSets: number;
  prescribedReps: number | null;
  prescribedWeight: number | null;
  prescribedRpe: number | null;
  prescribedRestSeconds: number;
  sets: WorkoutSet[];
}

export interface NewWorkout {
  userId: string;
  type: string;
  date: string;
  mesocycleId?: string;
  microcycleId?: string;
}

export interface WorkoutSummary {
  id: string;
  date: string;
  type: string;
  status: string;
  durationMinutes: number | null;
  totalVolume: number | null;
  exerciseCount: number;
}

export interface PreviousSetData {
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  setNumber: number;
  date: string;
}

export interface ActiveWorkoutData {
  workoutId: string;
  userId: string;
  date: string;
  type: string;
  restTimerEndsAt: number | null;
  exercises: {
    exercisePerformanceId: string;
    exerciseName: string;
    prescribedSets: number | null;
    prescribedReps: number | null;
    prescribedWeight: number | null;
    prescribedRpe: number | null;
    prescribedRestSeconds: number | null;
    orderInWorkout: number;
    sets: {
      id: string;
      setNumber: number;
      weight: number | null;
      reps: number | null;
      rpe: number | null;
      type: string;
      completedAt: string | null;
    }[];
  }[];
}

export interface CompleteWorkoutData {
  workoutId: string;
  durationMinutes: number;
  totalVolume: number;
  averageRpe: number | null;
  exercises: {
    exercisePerformanceId: string;
    actualSets: number;
    actualAverageRpe: number | null;
  }[];
}

export interface WorkoutDetail {
  id: string;
  userId: string;
  date: string;
  type: string;
  status: string;
  durationMinutes: number | null;
  totalVolume: number | null;
  averageRpe: number | null;
  exercises: {
    exerciseName: string;
    orderInWorkout: number;
    sets: {
      setNumber: number;
      weight: number | null;
      reps: number | null;
      rpe: number | null;
      type: string;
      completedAt: string | null;
    }[];
  }[];
}
