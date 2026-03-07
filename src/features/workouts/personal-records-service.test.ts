import { personalRecordsService } from "./personal-records-service";
import { personalRecordsRepository } from "./personal-records-repository";
import * as Haptics from "expo-haptics";

jest.mock("./personal-records-repository");
jest.mock("expo-haptics");

const mockRepository = personalRecordsRepository as jest.Mocked<
  typeof personalRecordsRepository
>;
const mockHaptics = Haptics as jest.Mocked<typeof Haptics>;

describe("Personal Records Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkAndSavePR", () => {
    it("should return false when weight is invalid", () => {
      const result = personalRecordsService.checkAndSavePR(
        "user-123",
        "Bench Press",
        0,
        8,
        "workout-123"
      );

      expect(result.isNewPR).toBe(false);
      expect(result.pr).toBeNull();
      expect(result.previousBest).toBeNull();
      expect(mockRepository.insert).not.toHaveBeenCalled();
    });

    it("should return false when reps are invalid", () => {
      const result = personalRecordsService.checkAndSavePR(
        "user-123",
        "Bench Press",
        100,
        0,
        "workout-123"
      );

      expect(result.isNewPR).toBe(false);
      expect(result.pr).toBeNull();
      expect(result.previousBest).toBeNull();
      expect(mockRepository.insert).not.toHaveBeenCalled();
    });

    it("should return false when weight is negative", () => {
      const result = personalRecordsService.checkAndSavePR(
        "user-123",
        "Bench Press",
        -50,
        8,
        "workout-123"
      );

      expect(result.isNewPR).toBe(false);
      expect(mockRepository.insert).not.toHaveBeenCalled();
    });

    it("should detect new PR when no previous record exists", () => {
      mockRepository.getBestOneRepMax.mockReturnValue(null);
      mockRepository.insert.mockReturnValue("pr-123");

      const result = personalRecordsService.checkAndSavePR(
        "user-123",
        "Bench Press",
        100,
        8,
        "workout-123"
      );

      expect(result.isNewPR).toBe(true);
      expect(mockRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-123",
          exerciseName: "Bench Press",
          weight: 100,
          reps: 8,
        })
      );
    });

    it("should detect new PR when estimated 1RM exceeds previous best", () => {
      mockRepository.getBestOneRepMax.mockReturnValueOnce(
        {
          id: "old-pr",
          userId: "user-123",
          exerciseName: "Bench Press",
          weight: 90,
          reps: 8,
          estimatedOneRepMax: 100,
          achievedAt: "2025-02-01T00:00:00Z",
          workoutId: "old-workout",
          createdAt: "2025-02-01T00:00:00Z",
          updatedAt: "2025-02-01T00:00:00Z",
        }
      );
      mockRepository.insert.mockReturnValue("pr-123");
      mockRepository.getBestOneRepMax.mockReturnValueOnce({
        id: "new-pr",
        userId: "user-123",
        exerciseName: "Bench Press",
        weight: 105,
        reps: 8,
        estimatedOneRepMax: 116.67,
        achievedAt: "2025-03-07T00:00:00Z",
        workoutId: "workout-123",
        createdAt: "2025-03-07T00:00:00Z",
        updatedAt: "2025-03-07T00:00:00Z",
      });

      const result = personalRecordsService.checkAndSavePR(
        "user-123",
        "Bench Press",
        105,
        8,
        "workout-123"
      );

      expect(result.isNewPR).toBe(true);
      expect(result.pr?.estimatedOneRepMax).toBeGreaterThan(100);
      expect(result.previousBest).toBe(100);
    });

    it("should not record PR when estimated 1RM does not exceed previous best", () => {
      mockRepository.getBestOneRepMax.mockReturnValue({
        id: "old-pr",
        userId: "user-123",
        exerciseName: "Bench Press",
        weight: 120,
        reps: 5,
        estimatedOneRepMax: 135,
        achievedAt: "2025-02-01T00:00:00Z",
        workoutId: "old-workout",
        createdAt: "2025-02-01T00:00:00Z",
        updatedAt: "2025-02-01T00:00:00Z",
      });

      const result = personalRecordsService.checkAndSavePR(
        "user-123",
        "Bench Press",
        100,
        8,
        "workout-123"
      );

      // 100 * (1 + 8/30) = 126.67, which is < 135
      expect(result.isNewPR).toBe(false);
      expect(mockRepository.insert).not.toHaveBeenCalled();
      expect(result.previousBest).toBe(135);
    });

    it("should trigger haptics feedback on new PR", () => {
      mockRepository.getBestOneRepMax.mockReturnValueOnce(null);
      mockRepository.insert.mockReturnValue("pr-123");
      mockRepository.getBestOneRepMax.mockReturnValueOnce({
        id: "new-pr",
        userId: "user-123",
        exerciseName: "Bench Press",
        weight: 100,
        reps: 8,
        estimatedOneRepMax: 116.67,
        achievedAt: "2025-03-07T00:00:00Z",
        workoutId: "workout-123",
        createdAt: "2025-03-07T00:00:00Z",
        updatedAt: "2025-03-07T00:00:00Z",
      });

      personalRecordsService.checkAndSavePR(
        "user-123",
        "Bench Press",
        100,
        8,
        "workout-123"
      );

      expect(mockHaptics.notificationAsync).toHaveBeenCalledWith(
        Haptics.NotificationFeedbackType.Success
      );
    });

    it("should not trigger haptics when not a new PR", () => {
      mockRepository.getBestOneRepMax.mockReturnValue({
        id: "existing-pr",
        userId: "user-123",
        exerciseName: "Bench Press",
        weight: 120,
        reps: 5,
        estimatedOneRepMax: 135,
        achievedAt: "2025-02-01T00:00:00Z",
        workoutId: "old-workout",
        createdAt: "2025-02-01T00:00:00Z",
        updatedAt: "2025-02-01T00:00:00Z",
      });

      personalRecordsService.checkAndSavePR(
        "user-123",
        "Bench Press",
        100,
        8,
        "workout-123"
      );

      expect(mockHaptics.notificationAsync).not.toHaveBeenCalled();
    });

    it("should use Epley formula for 1RM estimation", () => {
      mockRepository.getBestOneRepMax.mockReturnValueOnce(null);
      mockRepository.insert.mockReturnValue("pr-123");
      mockRepository.getBestOneRepMax.mockReturnValueOnce({
        id: "new-pr",
        userId: "user-123",
        exerciseName: "Bench Press",
        weight: 100,
        reps: 5,
        estimatedOneRepMax: 116.67,
        achievedAt: "2025-03-07T00:00:00Z",
        workoutId: "workout-123",
        createdAt: "2025-03-07T00:00:00Z",
        updatedAt: "2025-03-07T00:00:00Z",
      });

      personalRecordsService.checkAndSavePR(
        "user-123",
        "Bench Press",
        100,
        5,
        "workout-123"
      );

      // Verify insert was called with correct 1RM calculation
      // 100 * (1 + 5/30) = 116.67
      expect(mockRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          estimatedOneRepMax: expect.closeTo(116.67, 1),
        })
      );
    });

    it("should record different exercises separately", () => {
      mockRepository.getBestOneRepMax.mockReturnValueOnce(null); // First call
      mockRepository.insert.mockReturnValue("pr-123");
      mockRepository.getBestOneRepMax.mockReturnValueOnce({
        id: "new-pr-1",
        userId: "user-123",
        exerciseName: "Bench Press",
        weight: 100,
        reps: 8,
        estimatedOneRepMax: 116.67,
        achievedAt: "2025-03-07T00:00:00Z",
        workoutId: "workout-123",
        createdAt: "2025-03-07T00:00:00Z",
        updatedAt: "2025-03-07T00:00:00Z",
      });

      personalRecordsService.checkAndSavePR(
        "user-123",
        "Bench Press",
        100,
        8,
        "workout-123"
      );

      // Clear mocks for second exercise
      jest.clearAllMocks();
      mockRepository.getBestOneRepMax.mockReturnValueOnce(null);
      mockRepository.insert.mockReturnValue("pr-124");
      mockRepository.getBestOneRepMax.mockReturnValueOnce({
        id: "new-pr-2",
        userId: "user-123",
        exerciseName: "Squat",
        weight: 140,
        reps: 5,
        estimatedOneRepMax: 163.33,
        achievedAt: "2025-03-07T00:00:00Z",
        workoutId: "workout-123",
        createdAt: "2025-03-07T00:00:00Z",
        updatedAt: "2025-03-07T00:00:00Z",
      });

      personalRecordsService.checkAndSavePR(
        "user-123",
        "Squat",
        140,
        5,
        "workout-123"
      );

      // Both should be recorded
      expect(mockRepository.insert).toHaveBeenCalledWith(
        expect.objectContaining({ exerciseName: "Squat" })
      );
    });

    it("should store current timestamp for achieved date", () => {
      mockRepository.getBestOneRepMax.mockReturnValueOnce(null);
      mockRepository.insert.mockReturnValue("pr-123");

      personalRecordsService.checkAndSavePR(
        "user-123",
        "Bench Press",
        100,
        8,
        "workout-123"
      );

      const call = mockRepository.insert.mock.calls[0][0];
      const achievedTime = new Date(call.achievedAt).getTime();
      const now = Date.now();

      // Should be within 1 second
      expect(Math.abs(achievedTime - now)).toBeLessThan(1000);
    });

    it("should return previous best 1RM before new PR", () => {
      const previousOneRM = 100;
      mockRepository.getBestOneRepMax.mockReturnValueOnce({
        id: "old-pr",
        userId: "user-123",
        exerciseName: "Bench Press",
        weight: 90,
        reps: 5,
        estimatedOneRepMax: previousOneRM,
        achievedAt: "2025-02-01T00:00:00Z",
        workoutId: "old-workout",
        createdAt: "2025-02-01T00:00:00Z",
        updatedAt: "2025-02-01T00:00:00Z",
      });
      mockRepository.insert.mockReturnValue("pr-123");
      mockRepository.getBestOneRepMax.mockReturnValueOnce({
        id: "new-pr",
        userId: "user-123",
        exerciseName: "Bench Press",
        weight: 105,
        reps: 5,
        estimatedOneRepMax: 122.5,
        achievedAt: "2025-03-07T00:00:00Z",
        workoutId: "workout-123",
        createdAt: "2025-03-07T00:00:00Z",
        updatedAt: "2025-03-07T00:00:00Z",
      });

      const result = personalRecordsService.checkAndSavePR(
        "user-123",
        "Bench Press",
        105,
        5,
        "workout-123"
      );

      expect(result.previousBest).toBe(previousOneRM);
    });
  });
});
