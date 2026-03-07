import { faker } from "@faker-js/faker";
import type {
  User,
  ExperienceLevel,
  TrainingGoal,
  UnitSystem,
  Equipment,
} from "../../types";

export interface CreateUserOptions {
  id?: string;
  supabaseUserId?: string;
  name?: string;
  experienceLevel?: ExperienceLevel;
  trainingGoal?: TrainingGoal;
  unitSystem?: UnitSystem;
  availableEquipment?: Equipment[];
  weeklyFrequency?: number;
}

/**
 * Factory for creating test User objects with sensible defaults
 */
export function createUser(options: CreateUserOptions = {}): User {
  const userId = options.id ?? faker.string.uuid();
  const supabaseUserId = options.supabaseUserId ?? faker.string.uuid();

  return {
    id: userId,
    supabaseUserId,
    name: options.name ?? faker.person.firstName(),
    experienceLevel: options.experienceLevel ?? "intermediate",
    trainingGoal: options.trainingGoal ?? "strength",
    unitSystem: options.unitSystem ?? "metric",
    availableEquipment: options.availableEquipment ?? [
      "barbell",
      "dumbbell",
      "machine",
    ],
    weeklyFrequency: options.weeklyFrequency ?? 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Factory for creating test UserState (Zustand store state)
 */
export function createUserState(options: CreateUserOptions = {}) {
  return {
    id: options.id ?? faker.string.uuid(),
    name: options.name ?? faker.person.firstName(),
    experienceLevel: options.experienceLevel ?? ("beginner" as ExperienceLevel),
    trainingGoal: options.trainingGoal ?? ("general_fitness" as TrainingGoal),
    unitSystem: options.unitSystem ?? ("metric" as UnitSystem),
    availableEquipment: options.availableEquipment ?? (["bodyweight"] as Equipment[]),
    weeklyFrequency: options.weeklyFrequency ?? 3,
    isOnboardingComplete: true,
    supabaseUserId: options.supabaseUserId ?? faker.string.uuid(),
  };
}

// Presets for quick test setup
export const userFactoryPresets = {
  beginner: () =>
    createUser({
      name: "Beginner User",
      experienceLevel: "beginner",
      weeklyFrequency: 3,
    }),

  intermediate: () =>
    createUser({
      name: "Intermediate User",
      experienceLevel: "intermediate",
      weeklyFrequency: 4,
    }),

  advanced: () =>
    createUser({
      name: "Advanced User",
      experienceLevel: "advanced",
      weeklyFrequency: 5,
      availableEquipment: ["barbell", "dumbbell", "machine", "cables"],
    }),

  elite: () =>
    createUser({
      name: "Elite User",
      experienceLevel: "elite",
      weeklyFrequency: 6,
      availableEquipment: ["barbell", "dumbbell", "machine", "cables", "rack"],
    }),

  minimal: () =>
    createUser({
      name: "Minimal User",
      availableEquipment: ["bodyweight"],
      weeklyFrequency: 2,
    }),
};
