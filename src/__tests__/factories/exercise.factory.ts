import { faker } from "@faker-js/faker";
import type { Exercise, ExercisePerformance, ExerciseCategory } from "../../types";

export interface CreateExerciseOptions {
  id?: string;
  name?: string;
  category?: ExerciseCategory;
  description?: string;
  instructions?: string[];
  equipment?: string[];
  muscleGroups?: string[];
}

/**
 * Factory for creating test Exercise objects
 */
export function createExercise(options: CreateExerciseOptions = {}): Exercise {
  const categories: ExerciseCategory[] = [
    "strength",
    "cardio",
    "flexibility",
    "power",
  ];

  return {
    id: options.id ?? faker.string.uuid(),
    name: options.name ?? faker.word.noun(),
    category: options.category ?? faker.helpers.arrayElement(categories),
    description: options.description ?? faker.lorem.sentence(),
    instructions:
      options.instructions ??
      [
        faker.lorem.sentence(),
        faker.lorem.sentence(),
        faker.lorem.sentence(),
      ],
    equipment: options.equipment ?? ["barbell", "dumbbell"],
    muscleGroups: options.muscleGroups ?? ["chest", "triceps"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export interface CreateExercisePerformanceOptions {
  id?: string;
  userId?: string;
  workoutId?: string;
  exerciseName?: string;
  exerciseId?: string;
  orderIndex?: number;
  targetSets?: number;
  targetReps?: number;
  targetRpe?: number;
  restSeconds?: number;
  notes?: string;
}

/**
 * Factory for creating test ExercisePerformance objects
 */
export function createExercisePerformance(
  options: CreateExercisePerformanceOptions = {}
): ExercisePerformance {
  return {
    id: options.id ?? faker.string.uuid(),
    userId: options.userId ?? faker.string.uuid(),
    workoutId: options.workoutId ?? faker.string.uuid(),
    exerciseName: options.exerciseName ?? "Bench Press",
    exerciseId: options.exerciseId ?? faker.string.uuid(),
    orderIndex: options.orderIndex ?? 0,
    targetSets: options.targetSets ?? 3,
    targetReps: options.targetReps ?? 8,
    targetRpe: options.targetRpe ?? 7,
    restSeconds: options.restSeconds ?? 180,
    notes: options.notes ?? null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// Exercise presets for common exercises
export const exerciseFactoryPresets = {
  benchPress: () =>
    createExercise({
      name: "Bench Press",
      category: "strength",
      equipment: ["barbell"],
      muscleGroups: ["chest", "triceps", "shoulders"],
    }),

  squat: () =>
    createExercise({
      name: "Squat",
      category: "strength",
      equipment: ["barbell"],
      muscleGroups: ["quads", "glutes", "hamstrings"],
    }),

  deadlift: () =>
    createExercise({
      name: "Deadlift",
      category: "strength",
      equipment: ["barbell"],
      muscleGroups: ["hamstrings", "glutes", "back"],
    }),

  pullUp: () =>
    createExercise({
      name: "Pull Up",
      category: "strength",
      equipment: ["pullup_bar"],
      muscleGroups: ["back", "biceps"],
    }),

  running: () =>
    createExercise({
      name: "Running",
      category: "cardio",
      equipment: [],
      muscleGroups: ["full_body"],
    }),

  dumbellCurl: () =>
    createExercise({
      name: "Dumbbell Curl",
      category: "strength",
      equipment: ["dumbbell"],
      muscleGroups: ["biceps"],
    }),
};
