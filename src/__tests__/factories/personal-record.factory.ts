import { faker } from "@faker-js/faker";
import type { PersonalRecord } from "../../types";

export interface CreatePersonalRecordOptions {
  id?: string;
  userId?: string;
  exerciseName?: string;
  weight?: number;
  reps?: number;
  estimatedOneRepMax?: number;
  achievedAt?: string;
  workoutId?: string;
}

/**
 * Factory for creating test PersonalRecord objects
 */
export function createPersonalRecord(
  options: CreatePersonalRecordOptions = {}
): PersonalRecord {
  const weight = options.weight ?? 100;
  const reps = options.reps ?? 5;
  // Epley formula: 1RM = weight * (1 + reps/30)
  const estimatedOneRepMax =
    options.estimatedOneRepMax ?? weight * (1 + reps / 30);

  return {
    id: options.id ?? faker.string.uuid(),
    userId: options.userId ?? faker.string.uuid(),
    exerciseName: options.exerciseName ?? "Bench Press",
    weight,
    reps,
    estimatedOneRepMax,
    achievedAt: options.achievedAt ?? new Date().toISOString(),
    workoutId: options.workoutId ?? faker.string.uuid(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Create multiple PRs for an exercise progression scenario
 */
export function createPersonalRecordProgression(
  exerciseName: string,
  userId: string,
  months: number = 3
): PersonalRecord[] {
  const records: PersonalRecord[] = [];
  let currentWeight = 100;

  for (let i = 0; i < months; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - (months - i - 1));

    records.push(
      createPersonalRecord({
        userId,
        exerciseName,
        weight: currentWeight,
        reps: 5,
        achievedAt: date.toISOString(),
      })
    );

    currentWeight += 2.5; // Progression every month
  }

  return records;
}

/**
 * Presets for common PR scenarios
 */
export const prFactoryPresets = {
  /**
   * Beginner PR (light weight)
   */
  beginnerPR: () =>
    createPersonalRecord({
      exerciseName: "Bench Press",
      weight: 60,
      reps: 5,
    }),

  /**
   * Intermediate PR (moderate weight)
   */
  intermediatePR: () =>
    createPersonalRecord({
      exerciseName: "Bench Press",
      weight: 100,
      reps: 5,
    }),

  /**
   * Advanced PR (heavy weight)
   */
  advancedPR: () =>
    createPersonalRecord({
      exerciseName: "Bench Press",
      weight: 140,
      reps: 5,
    }),

  /**
   * 3-month progression
   */
  threeMonthProgression: (userId: string) =>
    createPersonalRecordProgression("Bench Press", userId, 3),

  /**
   * Multiple exercises at different levels
   */
  multiExercisePRs: (userId: string) => [
    createPersonalRecord({
      userId,
      exerciseName: "Bench Press",
      weight: 100,
      reps: 5,
    }),
    createPersonalRecord({
      userId,
      exerciseName: "Squat",
      weight: 140,
      reps: 3,
    }),
    createPersonalRecord({
      userId,
      exerciseName: "Deadlift",
      weight: 180,
      reps: 2,
    }),
  ],
};
