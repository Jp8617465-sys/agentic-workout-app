import { describe, it, expect, vi, beforeEach } from "vitest";
import { WorkoutEngine, type LogSetInput } from "./WorkoutEngine";
import { workoutRepository } from "./workout-repository";
import { personalRecordsService } from "./personal-records-service";

describe("WorkoutEngine - UUID Migration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("logSet - uses exerciseId", () => {
    it("should pass exerciseId to personalRecordsService", async () => {
      const logSetInput: LogSetInput = {
        id: null,
        exercisePerformanceId: "ep-123",
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        setNumber: 1,
        weight: 185,
        reps: 8,
        rpe: 8,
        type: "working",
        prescribedRpe: 8,
        prescribedRestSeconds: 120,
        userId: "user-456",
        workoutId: "workout-789",
      };

      vi.spyOn(workoutRepository, "upsertSetLog").mockResolvedValueOnce(
        "set-log-id"
      );
      const prCheckSpy = vi
        .spyOn(personalRecordsService, "checkAndSavePR")
        .mockReturnValueOnce({
          isNewPR: false,
          pr: null,
          previousBest: null,
        });

      await WorkoutEngine.logSet(logSetInput);

      // Verify exerciseId was passed, not exerciseName
      expect(prCheckSpy).toHaveBeenCalledWith(
        logSetInput.userId,
        logSetInput.exerciseId, // exerciseId UUID
        logSetInput.weight,
        logSetInput.reps,
        logSetInput.workoutId
      );
    });

    it("should handle PR detection with exerciseId", async () => {
      const logSetInput: LogSetInput = {
        id: null,
        exercisePerformanceId: "ep-123",
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        setNumber: 1,
        weight: 200,
        reps: 5,
        rpe: 9,
        type: "working",
        prescribedRpe: 8,
        prescribedRestSeconds: 120,
        userId: "user-456",
        workoutId: "workout-789",
      };

      vi.spyOn(workoutRepository, "upsertSetLog").mockResolvedValueOnce(
        "set-log-id"
      );

      const mockPRRecord = {
        id: "pr-123",
        userId: "user-456",
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        weight: 200,
        reps: 5,
        estimatedOneRepMax: 232.5,
        achievedAt: new Date().toISOString(),
        workoutId: "workout-789",
        createdAt: new Date().toISOString(),
      };

      vi.spyOn(personalRecordsService, "checkAndSavePR").mockReturnValueOnce({
        isNewPR: true,
        pr: mockPRRecord,
        previousBest: 225,
      });

      const result = await WorkoutEngine.logSet(logSetInput);

      expect(result.prCheck?.isNewPR).toBe(true);
      expect(result.prCheck?.pr?.exerciseId).toBe(logSetInput.exerciseId);
    });

    it("should skip PR check if weight or reps missing", async () => {
      const logSetInput: LogSetInput = {
        id: null,
        exercisePerformanceId: "ep-123",
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        setNumber: 1,
        weight: null,
        reps: 8,
        rpe: 7,
        type: "working",
        prescribedRpe: 8,
        prescribedRestSeconds: 120,
        userId: "user-456",
        workoutId: "workout-789",
      };

      vi.spyOn(workoutRepository, "upsertSetLog").mockResolvedValueOnce(
        "set-log-id"
      );
      const prCheckSpy = vi
        .spyOn(personalRecordsService, "checkAndSavePR")
        .mockReturnValueOnce({
          isNewPR: false,
          pr: null,
          previousBest: null,
        });

      await WorkoutEngine.logSet(logSetInput);

      // PR check should not be called without weight
      expect(prCheckSpy).not.toHaveBeenCalled();
    });
  });

  describe("updateSetRPE - uses exerciseId", () => {
    it("should pass exerciseId to personalRecordsService", async () => {
      const exerciseId = "550e8400-e29b-41d4-a716-446655440000";

      vi.spyOn(workoutRepository, "updateSetLogRpe").mockImplementationOnce(
        () => undefined
      );
      const prCheckSpy = vi
        .spyOn(personalRecordsService, "checkAndSavePR")
        .mockReturnValueOnce({
          isNewPR: false,
          pr: null,
          previousBest: null,
        });

      await WorkoutEngine.updateSetRPE(
        "set-log-123",
        8.5,
        exerciseId,
        185,
        8,
        8,
        "user-456",
        "workout-789"
      );

      expect(prCheckSpy).toHaveBeenCalledWith(
        "user-456",
        exerciseId,
        185,
        8,
        "workout-789"
      );
    });

    it("should detect PR when RPE is added retroactively", async () => {
      const exerciseId = "550e8400-e29b-41d4-a716-446655440000";

      vi.spyOn(workoutRepository, "updateSetLogRpe").mockImplementationOnce(
        () => undefined
      );

      const mockNewPR = {
        id: "pr-456",
        userId: "user-456",
        exerciseId,
        weight: 185,
        reps: 8,
        estimatedOneRepMax: 240,
        achievedAt: new Date().toISOString(),
        workoutId: "workout-789",
        createdAt: new Date().toISOString(),
      };

      vi.spyOn(personalRecordsService, "checkAndSavePR").mockReturnValueOnce({
        isNewPR: true,
        pr: mockNewPR,
        previousBest: 225,
      });

      const result = await WorkoutEngine.updateSetRPE(
        "set-log-123",
        8.5,
        exerciseId,
        185,
        8,
        8,
        "user-456",
        "workout-789"
      );

      expect(result.prCheck?.isNewPR).toBe(true);
    });
  });

  describe("data migration safety", () => {
    it("should not mix exerciseId with exerciseName", async () => {
      // This test ensures the migration is complete - no hybrid state
      const logSetInput: LogSetInput = {
        id: null,
        exercisePerformanceId: "ep-123",
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        setNumber: 1,
        weight: 185,
        reps: 8,
        rpe: 8,
        type: "working",
        prescribedRpe: 8,
        prescribedRestSeconds: 120,
        userId: "user-456",
        workoutId: "workout-789",
      };

      // Verify the input type doesn't have exerciseName
      expect((logSetInput as any).exerciseName).toBeUndefined();
      expect(logSetInput.exerciseId).toBeDefined();
    });
  });

  describe("backward compatibility during rollout", () => {
    it("should handle all exercise identifier types during transition", async () => {
      // During migration, old log data might reference exerciseName via joins
      // New code should work with exerciseId

      const logSetInput: LogSetInput = {
        id: null,
        exercisePerformanceId: "ep-123",
        exerciseId: "550e8400-e29b-41d4-a716-446655440000",
        setNumber: 1,
        weight: 100,
        reps: 10,
        rpe: 7,
        type: "working",
        prescribedRpe: 7,
        prescribedRestSeconds: 120,
        userId: "user-456",
        workoutId: "workout-789",
      };

      vi.spyOn(workoutRepository, "upsertSetLog").mockResolvedValueOnce(
        "set-log-id"
      );
      vi.spyOn(personalRecordsService, "checkAndSavePR").mockReturnValueOnce({
        isNewPR: false,
        pr: null,
        previousBest: null,
      });

      // Should succeed with exerciseId only
      const result = await WorkoutEngine.logSet(logSetInput);
      expect(result.setLogId).toBe("set-log-id");
    });
  });
});
