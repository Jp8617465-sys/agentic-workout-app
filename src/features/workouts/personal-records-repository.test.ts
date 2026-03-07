import { personalRecordsRepository } from "./personal-records-repository";
import { expoDb } from "../../lib/database";
import { generateId } from "../../lib/uuid";

jest.mock("../../lib/database");
jest.mock("../../lib/uuid");

const mockDb = expoDb as jest.Mocked<typeof expoDb>;
const mockGenerateId = generateId as jest.MockedFunction<typeof generateId>;

describe("Personal Records Repository", () => {
  const mockPRRow = {
    id: "pr-1",
    user_id: "user-123",
    exercise_id: "ex-1",
    weight: 100,
    reps: 5,
    estimated_one_rep_max: 116.67,
    achieved_at: "2025-03-07T00:00:00Z",
    workout_id: "workout-123",
    created_at: "2025-03-07T00:00:00Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getBestOneRepMax", () => {
    it("should return the PR with highest estimated 1RM", () => {
      mockDb.getFirstSync.mockReturnValue(mockPRRow);

      const result = personalRecordsRepository.getBestOneRepMax(
        "user-123",
        "ex-1"
      );

      expect(result).toEqual({
        id: "pr-1",
        userId: "user-123",
        exerciseId: "ex-1",
        weight: 100,
        reps: 5,
        estimatedOneRepMax: 116.67,
        achievedAt: "2025-03-07T00:00:00Z",
        workoutId: "workout-123",
        createdAt: "2025-03-07T00:00:00Z",
      });
    });

    it("should return null when no PRs exist for exercise", () => {
      mockDb.getFirstSync.mockReturnValue(null);

      const result = personalRecordsRepository.getBestOneRepMax(
        "user-123",
        "ex-1"
      );

      expect(result).toBeNull();
    });

    it("should query with correct SQL and parameters", () => {
      mockDb.getFirstSync.mockReturnValue(mockPRRow);

      personalRecordsRepository.getBestOneRepMax("user-123", "ex-1");

      expect(mockDb.getFirstSync).toHaveBeenCalledWith(
        expect.stringContaining("ORDER BY estimated_one_rep_max DESC"),
        ["user-123", "ex-1"]
      );
    });

    it("should limit result to single row", () => {
      mockDb.getFirstSync.mockReturnValue(mockPRRow);

      personalRecordsRepository.getBestOneRepMax("user-123", "ex-1");

      expect(mockDb.getFirstSync).toHaveBeenCalledWith(
        expect.stringContaining("LIMIT 1"),
        expect.any(Array)
      );
    });

    it("should filter by both userId and exerciseId", () => {
      mockDb.getFirstSync.mockReturnValue(mockPRRow);

      personalRecordsRepository.getBestOneRepMax("user-456", "ex-2");

      expect(mockDb.getFirstSync).toHaveBeenCalledWith(
        expect.any(String),
        ["user-456", "ex-2"]
      );
    });
  });

  describe("insert", () => {
    beforeEach(() => {
      mockGenerateId.mockReturnValue("new-pr-id");
    });

    it("should insert PR and return generated ID", () => {
      mockDb.runSync.mockImplementation(() => {});

      const id = personalRecordsRepository.insert({
        userId: "user-123",
        exerciseId: "ex-1",
        weight: 100,
        reps: 5,
        estimatedOneRepMax: 116.67,
        achievedAt: "2025-03-07T00:00:00Z",
        workoutId: "workout-123",
      });

      expect(id).toBe("new-pr-id");
    });

    it("should call runSync with correct SQL", () => {
      mockDb.runSync.mockImplementation(() => {});

      personalRecordsRepository.insert({
        userId: "user-123",
        exerciseId: "ex-1",
        weight: 100,
        reps: 5,
        estimatedOneRepMax: 116.67,
        achievedAt: "2025-03-07T00:00:00Z",
        workoutId: "workout-123",
      });

      expect(mockDb.runSync).toHaveBeenCalledWith(
        expect.stringContaining("INSERT INTO personal_records"),
        expect.any(Array)
      );
    });

    it("should include all required fields in insert", () => {
      mockDb.runSync.mockImplementation(() => {});

      personalRecordsRepository.insert({
        userId: "user-123",
        exerciseId: "ex-1",
        weight: 100,
        reps: 5,
        estimatedOneRepMax: 116.67,
        achievedAt: "2025-03-07T00:00:00Z",
        workoutId: "workout-123",
      });

      const args = mockDb.runSync.mock.calls[0];
      const params = args[1] as any[];

      expect(params).toHaveLength(9);
      expect(params[0]).toBe("new-pr-id"); // Generated ID
      expect(params[1]).toBe("user-123"); // userId
      expect(params[2]).toBe("ex-1"); // exerciseId
      expect(params[3]).toBe(100); // weight
      expect(params[4]).toBe(5); // reps
      expect(params[5]).toBe(116.67); // estimatedOneRepMax
      expect(params[6]).toBe("2025-03-07T00:00:00Z"); // achievedAt
      expect(params[7]).toBe("workout-123"); // workoutId
      expect(params[8]).toMatch(/^\d{4}-\d{2}-\d{2}T/); // createdAt (ISO string)
    });

    it("should generate unique ID for each insert", () => {
      mockDb.runSync.mockImplementation(() => {});
      mockGenerateId
        .mockReturnValueOnce("id-1")
        .mockReturnValueOnce("id-2");

      const id1 = personalRecordsRepository.insert({
        userId: "user-123",
        exerciseId: "ex-1",
        weight: 100,
        reps: 5,
        estimatedOneRepMax: 116.67,
        achievedAt: "2025-03-07T00:00:00Z",
        workoutId: "workout-123",
      });

      const id2 = personalRecordsRepository.insert({
        userId: "user-123",
        exerciseId: "ex-2",
        weight: 150,
        reps: 3,
        estimatedOneRepMax: 163.64,
        achievedAt: "2025-03-08T00:00:00Z",
        workoutId: "workout-124",
      });

      expect(id1).toBe("id-1");
      expect(id2).toBe("id-2");
      expect(id1).not.toBe(id2);
    });
  });

  describe("findAllForUser", () => {
    it("should return all PRs for a user sorted by date desc", () => {
      const rows = [
        { ...mockPRRow, achieved_at: "2025-03-07T00:00:00Z", id: "pr-1" },
        { ...mockPRRow, achieved_at: "2025-03-06T00:00:00Z", id: "pr-2" },
        { ...mockPRRow, achieved_at: "2025-03-05T00:00:00Z", id: "pr-3" },
      ];
      mockDb.getAllSync.mockReturnValue(rows);

      const results = personalRecordsRepository.findAllForUser("user-123");

      expect(results).toHaveLength(3);
      expect(results[0].id).toBe("pr-1");
      expect(results[1].id).toBe("pr-2");
      expect(results[2].id).toBe("pr-3");
    });

    it("should return empty array when user has no PRs", () => {
      mockDb.getAllSync.mockReturnValue([]);

      const results = personalRecordsRepository.findAllForUser("user-123");

      expect(results).toEqual([]);
    });

    it("should query with correct user filter", () => {
      mockDb.getAllSync.mockReturnValue([]);

      personalRecordsRepository.findAllForUser("user-456");

      expect(mockDb.getAllSync).toHaveBeenCalledWith(
        expect.any(String),
        ["user-456"]
      );
    });

    it("should convert database rows to domain objects", () => {
      mockDb.getAllSync.mockReturnValue([mockPRRow]);

      const results = personalRecordsRepository.findAllForUser("user-123");

      expect(results[0]).toEqual({
        id: mockPRRow.id,
        userId: mockPRRow.user_id,
        exerciseId: mockPRRow.exercise_id,
        weight: mockPRRow.weight,
        reps: mockPRRow.reps,
        estimatedOneRepMax: mockPRRow.estimated_one_rep_max,
        achievedAt: mockPRRow.achieved_at,
        workoutId: mockPRRow.workout_id,
        createdAt: mockPRRow.created_at,
      });
    });
  });

  describe("findAllForExercise", () => {
    it("should return all PRs for exercise sorted by date desc", () => {
      const rows = [
        { ...mockPRRow, achieved_at: "2025-03-07T00:00:00Z" },
        { ...mockPRRow, achieved_at: "2025-03-06T00:00:00Z" },
      ];
      mockDb.getAllSync.mockReturnValue(rows);

      const results = personalRecordsRepository.findAllForExercise(
        "user-123",
        "ex-1"
      );

      expect(results).toHaveLength(2);
      expect(results[0].achievedAt).toBe("2025-03-07T00:00:00Z");
      expect(results[1].achievedAt).toBe("2025-03-06T00:00:00Z");
    });

    it("should filter by both userId and exerciseId", () => {
      mockDb.getAllSync.mockReturnValue([]);

      personalRecordsRepository.findAllForExercise("user-789", "ex-5");

      expect(mockDb.getAllSync).toHaveBeenCalledWith(
        expect.any(String),
        ["user-789", "ex-5"]
      );
    });

    it("should return empty array when no PRs found", () => {
      mockDb.getAllSync.mockReturnValue([]);

      const results = personalRecordsRepository.findAllForExercise(
        "user-123",
        "ex-1"
      );

      expect(results).toEqual([]);
    });

    it("should convert all rows to domain objects", () => {
      const rows = [mockPRRow, mockPRRow];
      mockDb.getAllSync.mockReturnValue(rows);

      const results = personalRecordsRepository.findAllForExercise(
        "user-123",
        "ex-1"
      );

      expect(results).toHaveLength(2);
      results.forEach((result) => {
        expect(result.userId).toBeDefined();
        expect(result.exerciseId).toBeDefined();
        expect(result.estimatedOneRepMax).toBeDefined();
      });
    });
  });
});
