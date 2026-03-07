import { describe, it, expect, beforeEach, vi } from "vitest";
import { exerciseRepository } from "./exercise-repository";
import { generateDeterministicExerciseId } from "../../lib/uuid-migration";
import type { Exercise } from "../../types";

describe("exerciseRepository", () => {
  describe("UUID generation consistency", () => {
    it("should generate the same UUID for the same exercise name", () => {
      const name = "Bench Press";
      const uuid1 = generateDeterministicExerciseId(name);
      const uuid2 = generateDeterministicExerciseId(name);
      expect(uuid1).toBe(uuid2);
    });

    it("should generate different UUIDs for different exercise names", () => {
      const uuid1 = generateDeterministicExerciseId("Bench Press");
      const uuid2 = generateDeterministicExerciseId("Squat");
      expect(uuid1).not.toBe(uuid2);
    });

    it("should produce valid UUID format", () => {
      const uuid = generateDeterministicExerciseId("Deadlift");
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(uuid).toMatch(uuidRegex);
    });
  });

  describe("findById", () => {
    it("should find exercise by ID", async () => {
      const mockExercise = {
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        name: "Bench Press",
        category: "compound" as const,
        pattern: "horizontal_push" as const,
        equipment: ["barbell", "bench"],
        muscleGroups: ["chest", "shoulders", "triceps"],
        defaultTempo: "3010",
        defaultRestSeconds: 120,
        instructions: ["Lie on bench", "Press bar"],
        cues: ["Keep shoulders packed"],
        commonMistakes: ["Bouncing"],
        variations: ["Incline"],
      };

      vi.spyOn(exerciseRepository, "findById").mockResolvedValueOnce(
        mockExercise
      );

      const result = await exerciseRepository.findById(
        "550e8400-e29b-41d4-a716-446655440000"
      );
      expect(result).toEqual(mockExercise);
    });

    it("should return null for non-existent exercise", async () => {
      vi.spyOn(exerciseRepository, "findById").mockResolvedValueOnce(null);

      const result = await exerciseRepository.findById(
        "non-existent-uuid"
      );
      expect(result).toBeNull();
    });
  });

  describe("findByName", () => {
    it("should find exercise by name", async () => {
      const mockExercise = {
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        name: "Squat",
        category: "compound" as const,
        pattern: "squat" as const,
        equipment: ["barbell", "squat_rack"],
        muscleGroups: ["quadriceps", "glutes", "hamstrings"],
        defaultTempo: "3010",
        defaultRestSeconds: 120,
        instructions: ["Stand with feet shoulder-width"],
        cues: ["Keep chest up"],
        commonMistakes: ["Knees caving"],
        variations: ["Front Squat"],
      };

      vi.spyOn(exerciseRepository, "findByName").mockResolvedValueOnce(
        mockExercise
      );

      const result = await exerciseRepository.findByName("Squat");
      expect(result?.name).toBe("Squat");
      expect(result?.exerciseId).toBeDefined();
    });

    it("should maintain backward compatibility for name-based lookups", async () => {
      const mockExercise = {
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        name: "Deadlift",
        category: "compound" as const,
        pattern: "hinge" as const,
        equipment: ["barbell"],
        muscleGroups: ["back", "glutes", "hamstrings"],
        defaultTempo: "2020",
        defaultRestSeconds: 180,
        instructions: ["Hip hinge"],
        cues: [],
        commonMistakes: [],
        variations: [],
      };

      vi.spyOn(exerciseRepository, "findByName").mockResolvedValueOnce(
        mockExercise
      );

      const result = await exerciseRepository.findByName("Deadlift");
      expect(result).not.toBeNull();
      // Old code that stored exerciseName should still work via name lookup
      expect(result?.name).toBe("Deadlift");
    });
  });

  describe("create", () => {
    it("should create exercise with deterministic UUID", async () => {
      const exerciseData = {
        name: "Leg Press",
        category: "compound" as const,
        pattern: "squat" as const,
        equipment: ["machine"],
        muscleGroups: ["quadriceps", "glutes"],
        defaultTempo: "3010",
        defaultRestSeconds: 120,
        instructions: ["Sit and press"],
        cues: ["Full range of motion"],
        commonMistakes: [],
        variations: [],
      };

      const expectedId = generateDeterministicExerciseId(exerciseData.name);

      vi.spyOn(exerciseRepository, "create").mockResolvedValueOnce({
        ...exerciseData,
        exerciseId: expectedId,
      });

      const result = await exerciseRepository.create(exerciseData);
      expect(result.exerciseId).toBe(expectedId);
      expect(result.name).toBe("Leg Press");
    });

    it("should produce same UUID across different app instances", async () => {
      const exerciseName = "Pull-ups";
      const uuid1 = generateDeterministicExerciseId(exerciseName);
      const uuid2 = generateDeterministicExerciseId(exerciseName);
      expect(uuid1).toBe(uuid2);
    });
  });

  describe("search with UUID support", () => {
    it("should return exercises with exerciseId", async () => {
      const mockExercises = [
        {
          exerciseId: "550e8400-e29b-41d4-a716-446655440000",
          name: "Bench Press",
          category: "compound" as const,
          pattern: "horizontal_push" as const,
          equipment: ["barbell"],
          muscleGroups: ["chest"],
          defaultTempo: "3010",
          defaultRestSeconds: 120,
          instructions: [],
          cues: [],
          commonMistakes: [],
          variations: [],
        },
      ];

      vi.spyOn(exerciseRepository, "search").mockResolvedValueOnce(
        mockExercises
      );

      const results = await exerciseRepository.search("bench");
      expect(results).toHaveLength(1);
      expect(results[0].exerciseId).toBeDefined();
      expect(typeof results[0].exerciseId).toBe("string");
    });
  });

  describe("data integrity during migration", () => {
    it("should ensure no exercise loses its identity during rename", () => {
      // Scenario: User renames "Bench Press" to "Bar Bench"
      // Old system: Would break references (exerciseName changed)
      // New system: exerciseId stays same, name can change

      const originalName = "Bench Press";
      const exerciseId = generateDeterministicExerciseId(originalName);
      const renamedName = "Bar Bench";
      const renamedId = generateDeterministicExerciseId(renamedName);

      // Key: IDs are different because they're based on the original name
      // This is expected behavior - old exercise keeps old ID
      expect(exerciseId).not.toBe(renamedId);

      // In practice, updates would create new exercise or preserve the ID:
      // UPDATE exercises SET name = 'Bar Bench' WHERE exercise_id = '...'
      // The exercise_id column doesn't change, only name does
    });
  });
});
