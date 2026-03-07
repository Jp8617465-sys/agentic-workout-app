import { faker } from "@faker-js/faker";
import type {
  Workout,
  SetLog,
  WorkoutExercise,
  SetType,
  ExercisePerformance,
} from "../../types";
import { createExercisePerformance } from "./exercise.factory";

export interface CreateWorkoutOptions {
  id?: string;
  userId?: string;
  name?: string;
  startedAt?: string;
  completedAt?: string | null;
  notes?: string | null;
  totalVolume?: number;
  totalDuration?: number;
}

/**
 * Factory for creating test Workout objects
 */
export function createWorkout(options: CreateWorkoutOptions = {}): Workout {
  const startedAt = options.startedAt ?? new Date().toISOString();

  return {
    id: options.id ?? faker.string.uuid(),
    userId: options.userId ?? faker.string.uuid(),
    name: options.name ?? `Workout ${faker.string.alphaNumeric(4)}`,
    startedAt,
    completedAt: options.completedAt ?? null,
    notes: options.notes ?? null,
    totalVolume: options.totalVolume ?? 0,
    totalDuration: options.totalDuration ?? 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export interface CreateSetLogOptions {
  id?: string;
  exercisePerformanceId?: string;
  setNumber?: number;
  weight?: number | null;
  reps?: number | null;
  rpe?: number | null;
  type?: SetType;
  completedAt?: string | null;
  prescribedRpe?: number | null;
  prescribedRestSeconds?: number | null;
}

/**
 * Factory for creating test SetLog objects
 */
export function createSetLog(options: CreateSetLogOptions = {}): SetLog {
  return {
    id: options.id ?? faker.string.uuid(),
    exercisePerformanceId:
      options.exercisePerformanceId ?? faker.string.uuid(),
    setNumber: options.setNumber ?? 1,
    weight: options.weight ?? 100,
    reps: options.reps ?? 8,
    rpe: options.rpe ?? 7,
    type: options.type ?? "working",
    completedAt: options.completedAt ?? new Date().toISOString(),
    prescribedRpe: options.prescribedRpe ?? null,
    prescribedRestSeconds: options.prescribedRestSeconds ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Fluent builder for creating complex workout scenarios
 */
export class WorkoutBuilder {
  private workoutData: Workout;
  private exercisePerformances: ExercisePerformance[] = [];
  private setLogs: SetLog[] = [];

  constructor(workoutOptions: CreateWorkoutOptions = {}) {
    this.workoutData = createWorkout(workoutOptions);
  }

  withExercise(
    exerciseName: string,
    options?: Partial<CreateExercisePerformanceOptions>
  ): this {
    const exercise = createExercisePerformance({
      userId: this.workoutData.userId,
      workoutId: this.workoutData.id,
      exerciseName,
      orderIndex: this.exercisePerformances.length,
      ...options,
    });
    this.exercisePerformances.push(exercise);
    return this;
  }

  withSet(
    exerciseIndex: number,
    options?: CreateSetLogOptions,
    type: SetType = "working"
  ): this {
    if (
      exerciseIndex < 0 ||
      exerciseIndex >= this.exercisePerformances.length
    ) {
      throw new Error(`Invalid exercise index: ${exerciseIndex}`);
    }
    const exercise = this.exercisePerformances[exerciseIndex];
    const setNumber = this.setLogs.filter(
      (s) => s.exercisePerformanceId === exercise.id
    ).length + 1;

    const setLog = createSetLog({
      exercisePerformanceId: exercise.id,
      setNumber,
      type,
      ...options,
    });
    this.setLogs.push(setLog);
    return this;
  }

  withWarmupSet(exerciseIndex: number, weight: number = 80): this {
    return this.withSet(exerciseIndex, { weight, reps: 8, rpe: 5 }, "warmup");
  }

  withWorkingSet(
    exerciseIndex: number,
    weight: number = 100,
    reps: number = 8,
    rpe: number = 7
  ): this {
    return this.withSet(
      exerciseIndex,
      { weight, reps, rpe },
      "working"
    );
  }

  /**
   * Add multiple sets (3 is common for strength)
   */
  withSets(
    exerciseIndex: number,
    count: number = 3,
    weight: number = 100,
    reps: number = 8,
    rpe: number = 7
  ): this {
    for (let i = 0; i < count; i++) {
      this.withSet(
        exerciseIndex,
        { weight, reps, rpe: rpe + (i > 0 ? 0.5 : 0) },
        "working"
      );
    }
    return this;
  }

  complete(): {
    workout: Workout;
    exercises: ExercisePerformance[];
    sets: SetLog[];
  } {
    const now = new Date().toISOString();

    // Calculate total volume and duration
    let totalVolume = 0;
    const setsByExercise = new Map<string, SetLog[]>();
    for (const set of this.setLogs) {
      if (!setsByExercise.has(set.exercisePerformanceId)) {
        setsByExercise.set(set.exercisePerformanceId, []);
      }
      setsByExercise.get(set.exercisePerformanceId)!.push(set);
      totalVolume += (set.weight ?? 0) * (set.reps ?? 0);
    }

    const workoutDuration = this.exercisePerformances.length * 10 * 60; // ~10 min per exercise

    return {
      workout: {
        ...this.workoutData,
        completedAt: now,
        totalVolume,
        totalDuration: workoutDuration,
      },
      exercises: this.exercisePerformances,
      sets: this.setLogs,
    };
  }
}

/**
 * Preset builders for common workout scenarios
 */
export const workoutBuilderPresets = {
  /**
   * Standard 3-exercise strength session
   */
  standardStrengthSession: () =>
    new WorkoutBuilder({ name: "Strength Session" })
      .withExercise("Bench Press", { targetReps: 8, targetSets: 3 })
      .withExercise("Squat", { targetReps: 8, targetSets: 3 })
      .withExercise("Deadlift", { targetReps: 5, targetSets: 3 }),

  /**
   * Minimal session with 1 exercise and 3 sets
   */
  minimalSession: () =>
    new WorkoutBuilder({ name: "Quick Session" })
      .withExercise("Bench Press")
      .withSets(0, 3),

  /**
   * Full session with warmups
   */
  fullSession: () =>
    new WorkoutBuilder({ name: "Full Session" })
      .withExercise("Bench Press")
      .withWarmupSet(0, 60)
      .withWarmupSet(0, 80)
      .withSets(0, 3, 100, 8, 7),

  /**
   * PR scenario: progressing weight over session
   */
  prSession: () =>
    new WorkoutBuilder({ name: "PR Attempt" })
      .withExercise("Squat")
      .withWorkingSet(0, 120, 3, 6)
      .withWorkingSet(0, 130, 2, 7)
      .withWorkingSet(0, 140, 1, 8), // New PR potential
};
