import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { exercisePerformanceSyncAdapter } from "./exercise-performance-sync";
import type { ExercisePerformance } from "../../types";

describe("exercisePerformanceSyncAdapter", () => {
  let mockSupabase: Partial<SupabaseClient>;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(),
    };
  });

  describe("push - migrated to exerciseId", () => {
    it("should send exercise_id instead of exercise_name", async () => {
      const mockEP: ExercisePerformance = {
        id: "ep-123",
        workoutId: "workout-456",
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        prescribedSets: 4,
        prescribedReps: 8,
        prescribedWeight: 185,
        prescribedRpe: 8,
        prescribedRestSeconds: 120,
        actualSets: 4,
        actualAverageRpe: 8.2,
        orderInWorkout: 1,
      };

      const mockUpsert = vi.fn().mockResolvedValueOnce({ error: null });
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValueOnce({ data: { id: "workout-456" }, error: null }),
          single: vi.fn(),
        }),
        upsert: mockUpsert,
      });

      (mockSupabase.from as any) = mockFrom;

      await exercisePerformanceSyncAdapter.push(
        mockEP,
        mockSupabase as SupabaseClient,
        "user-123"
      );

      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          exercise_id: mockEP.exerciseId,
        })
      );
      // Ensure exercise_name is NOT in the payload
      expect(mockUpsert).not.toHaveBeenCalledWith(
        expect.objectContaining({
          exercise_name: expect.anything(),
        })
      );
    });

    it("should verify workout exists before syncing", async () => {
      const mockEP: ExercisePerformance = {
        id: "ep-123",
        workoutId: "missing-workout",
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        prescribedSets: 3,
        prescribedReps: 10,
        prescribedWeight: 100,
        prescribedRpe: 7,
        prescribedRestSeconds: 120,
        actualSets: null,
        actualAverageRpe: null,
        orderInWorkout: 1,
      };

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValueOnce({ data: null, error: null }),
        single: vi.fn(),
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      (mockSupabase.from as any) = mockFrom;

      await expect(
        exercisePerformanceSyncAdapter.push(
          mockEP,
          mockSupabase as SupabaseClient,
          "user-123"
        )
      ).rejects.toThrow();
    });
  });

  describe("pull - returns exerciseId", () => {
    it("should map exercise_id from cloud to exerciseId", async () => {
      const mockData = [
        {
          id: "ep-123",
          workout_id: "workout-456",
          exercise_id: "550e8400-e29b-41d4-a716-446655440000",
          prescribed_sets: 4,
          prescribed_reps: 8,
          prescribed_weight: 185,
          prescribed_rpe: 8,
          prescribed_rest_seconds: 120,
          actual_sets: 4,
          actual_average_rpe: 8.2,
          order_in_workout: 1,
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockReturnValue({
              gt: vi.fn().mockReturnValue({
                order: vi
                  .fn()
                  .mockResolvedValueOnce({ data: mockData, error: null }),
              }),
            }),
          }),
        }),
      });

      const mockFromWorkouts = vi.fn().mockReturnValue({
        select: vi
          .fn()
          .mockReturnValue({
            eq: vi.fn().mockResolvedValueOnce({
              data: [{ id: "workout-456" }],
              error: null,
            }),
          }),
      });

      (mockSupabase.from as any) = (table: string) => {
        if (table === "workouts") return mockFromWorkouts();
        return mockSelect();
      };

      const result = await exercisePerformanceSyncAdapter.pull(
        "user-123",
        Date.now() - 86400000,
        mockSupabase as SupabaseClient
      );

      expect(result).toHaveLength(1);
      expect(result[0].exerciseId).toBe(
        "550e8400-e29b-41d4-a716-446655440000"
      );
    });

    it("should return empty array when user has no workouts", async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValueOnce({ data: [], error: null }),
      });

      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect,
      });

      (mockSupabase.from as any) = mockFrom;

      const result = await exercisePerformanceSyncAdapter.pull(
        "user-no-workouts",
        Date.now() - 86400000,
        mockSupabase as SupabaseClient
      );

      expect(result).toEqual([]);
    });
  });

  describe("data integrity", () => {
    it("should preserve all exercise performance data during migration", async () => {
      const originalEP: ExercisePerformance = {
        id: "ep-full-data",
        workoutId: "w-123",
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        prescribedSets: 5,
        prescribedReps: 5,
        prescribedWeight: 225,
        prescribedRpe: 8.5,
        prescribedRestSeconds: 180,
        actualSets: 5,
        actualAverageRpe: 8.3,
        orderInWorkout: 2,
      };

      const mockUpsert = vi.fn().mockResolvedValueOnce({ error: null });
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValueOnce({ data: { id: "w-123" }, error: null }),
          single: vi.fn(),
        }),
        upsert: mockUpsert,
      });

      (mockSupabase.from as any) = mockFrom;

      await exercisePerformanceSyncAdapter.push(
        originalEP,
        mockSupabase as SupabaseClient,
        "user-123"
      );

      const upsertPayload = mockUpsert.mock.calls[0][0];
      expect(upsertPayload).toEqual({
        id: originalEP.id,
        workout_id: originalEP.workoutId,
        exercise_id: originalEP.exerciseId,
        prescribed_sets: originalEP.prescribedSets,
        prescribed_reps: originalEP.prescribedReps,
        prescribed_weight: originalEP.prescribedWeight,
        prescribed_rpe: originalEP.prescribedRpe,
        prescribed_rest_seconds: originalEP.prescribedRestSeconds,
        actual_sets: originalEP.actualSets,
        actual_average_rpe: originalEP.actualAverageRpe,
        order_in_workout: originalEP.orderInWorkout,
      });
    });
  });

  describe("sync dependencies", () => {
    it("should declare correct dependencies", () => {
      const deps = exercisePerformanceSyncAdapter.getDependencies();
      expect(deps).toContain("workouts");
    });

    it("should declare correct dependents", () => {
      const deps = exercisePerformanceSyncAdapter.getDependents();
      expect(deps).toContain("setLogs");
    });
  });
});
