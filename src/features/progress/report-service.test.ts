import { buildPeriodStats } from "./report-service";

// Mock expoDb and its sync methods
jest.mock("../../lib/database", () => ({
  expoDb: {
    getAllSync: jest.fn(),
    getFirstSync: jest.fn(),
    runSync: jest.fn(),
  },
}));

// Mock supabase to prevent network calls
jest.mock("../../lib/supabase", () => ({
  supabase: {
    auth: { getSession: jest.fn().mockResolvedValue({ data: { session: null } }) },
    functions: { invoke: jest.fn() },
  },
}));

// Mock aiCacheRepository
jest.mock("../ai/ai-cache-repository", () => ({
  aiCacheRepository: {
    get: jest.fn().mockReturnValue(null),
    set: jest.fn(),
  },
}));

import { expoDb } from "../../lib/database";

const mockDb = expoDb as jest.Mocked<typeof expoDb>;

const TODAY = new Date().toISOString().split("T")[0];

function makeWorkoutRows(count: number, volume: number, rpe: number | null = 7) {
  return Array.from({ length: count }, (_, i) => ({
    total_volume: volume,
    average_rpe: rpe,
    date: TODAY,
  }));
}

describe("buildPeriodStats", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("workout count and volume", () => {
    it("counts completed workouts correctly", () => {
      mockDb.getAllSync
        .mockReturnValueOnce(makeWorkoutRows(3, 1000)) // current period workouts
        .mockReturnValueOnce(makeWorkoutRows(2, 800)) // previous period workouts
        .mockReturnValueOnce([]) // current exercise vol
        .mockReturnValueOnce([]); // prev exercise vol
      mockDb.getFirstSync.mockReturnValueOnce({ count: 2 }); // PRs

      const stats = buildPeriodStats("user-abc", "week");

      expect(stats.workoutsCompleted).toBe(3);
    });

    it("sums total volume from all workouts", () => {
      mockDb.getAllSync
        .mockReturnValueOnce(makeWorkoutRows(3, 1000))
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);
      mockDb.getFirstSync.mockReturnValueOnce({ count: 0 });

      const stats = buildPeriodStats("user-abc", "week");

      expect(stats.totalVolume).toBe(3000);
    });

    it("handles null total_volume entries", () => {
      mockDb.getAllSync
        .mockReturnValueOnce([
          { total_volume: null, average_rpe: 7, date: TODAY },
          { total_volume: 500, average_rpe: 7, date: TODAY },
        ])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);
      mockDb.getFirstSync.mockReturnValueOnce({ count: 0 });

      const stats = buildPeriodStats("user-abc", "week");

      expect(stats.totalVolume).toBe(500);
    });
  });

  describe("volume delta calculation", () => {
    it("calculates positive volume delta percentage", () => {
      mockDb.getAllSync
        .mockReturnValueOnce(makeWorkoutRows(1, 1100)) // current: 1100
        .mockReturnValueOnce(makeWorkoutRows(1, 1000)) // previous: 1000
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);
      mockDb.getFirstSync.mockReturnValueOnce({ count: 0 });

      const stats = buildPeriodStats("user-abc", "week");

      expect(stats.volumeDeltaPct).toBe(10);
    });

    it("calculates negative volume delta percentage", () => {
      mockDb.getAllSync
        .mockReturnValueOnce(makeWorkoutRows(1, 800))
        .mockReturnValueOnce(makeWorkoutRows(1, 1000))
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);
      mockDb.getFirstSync.mockReturnValueOnce({ count: 0 });

      const stats = buildPeriodStats("user-abc", "week");

      expect(stats.volumeDeltaPct).toBe(-20);
    });

    it("returns 0 delta when no previous period data", () => {
      mockDb.getAllSync
        .mockReturnValueOnce(makeWorkoutRows(1, 1000))
        .mockReturnValueOnce([]) // no previous workouts
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);
      mockDb.getFirstSync.mockReturnValueOnce({ count: 0 });

      const stats = buildPeriodStats("user-abc", "week");

      expect(stats.volumeDeltaPct).toBe(0);
      expect(stats.previousVolume).toBe(0);
    });
  });

  describe("average RPE", () => {
    it("averages RPE across workouts", () => {
      mockDb.getAllSync
        .mockReturnValueOnce([
          { total_volume: 1000, average_rpe: 7, date: TODAY },
          { total_volume: 1000, average_rpe: 8, date: TODAY },
        ])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);
      mockDb.getFirstSync.mockReturnValueOnce({ count: 0 });

      const stats = buildPeriodStats("user-abc", "week");

      expect(stats.averageRpe).toBe(7.5);
    });

    it("returns null when no RPE data", () => {
      mockDb.getAllSync
        .mockReturnValueOnce([{ total_volume: 1000, average_rpe: null, date: TODAY }])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);
      mockDb.getFirstSync.mockReturnValueOnce({ count: 0 });

      const stats = buildPeriodStats("user-abc", "week");

      expect(stats.averageRpe).toBeNull();
    });

    it("rounds RPE to 1 decimal place", () => {
      mockDb.getAllSync
        .mockReturnValueOnce([
          { total_volume: 1000, average_rpe: 7, date: TODAY },
          { total_volume: 1000, average_rpe: 8, date: TODAY },
          { total_volume: 1000, average_rpe: 8, date: TODAY },
        ])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);
      mockDb.getFirstSync.mockReturnValueOnce({ count: 0 });

      const stats = buildPeriodStats("user-abc", "week");

      // (7+8+8)/3 = 7.666... → rounds to 7.7
      expect(stats.averageRpe).toBe(7.7);
    });
  });

  describe("personal records", () => {
    it("reads PR count from database", () => {
      mockDb.getAllSync
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);
      mockDb.getFirstSync.mockReturnValueOnce({ count: 5 });

      const stats = buildPeriodStats("user-abc", "week");

      expect(stats.personalRecords).toBe(5);
    });

    it("returns 0 PRs when no row returned", () => {
      mockDb.getAllSync
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);
      mockDb.getFirstSync.mockReturnValueOnce(null);

      const stats = buildPeriodStats("user-abc", "week");

      expect(stats.personalRecords).toBe(0);
    });
  });

  describe("exercise breakdown", () => {
    it("calculates delta vs previous period", () => {
      mockDb.getAllSync
        .mockReturnValueOnce([]) // workouts
        .mockReturnValueOnce([]) // prev workouts
        .mockReturnValueOnce([
          { exercise_name: "Squat", total_vol: 1100 },
        ])
        .mockReturnValueOnce([
          { exercise_name: "Squat", total_vol: 1000 },
        ]);
      mockDb.getFirstSync.mockReturnValueOnce({ count: 0 });

      const stats = buildPeriodStats("user-abc", "week");

      expect(stats.exerciseBreakdown).toHaveLength(1);
      expect(stats.exerciseBreakdown[0].exerciseName).toBe("Squat");
      expect(stats.exerciseBreakdown[0].currentVolume).toBe(1100);
      expect(stats.exerciseBreakdown[0].deltaPct).toBe(10);
    });

    it("returns 0 delta for exercises with no previous data", () => {
      mockDb.getAllSync
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([{ exercise_name: "Deadlift", total_vol: 2000 }])
        .mockReturnValueOnce([]); // no previous
      mockDb.getFirstSync.mockReturnValueOnce({ count: 0 });

      const stats = buildPeriodStats("user-abc", "week");

      expect(stats.exerciseBreakdown[0].deltaPct).toBe(0);
      expect(stats.exerciseBreakdown[0].previousVolume).toBe(0);
    });

    it("returns empty breakdown when no exercises", () => {
      mockDb.getAllSync
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);
      mockDb.getFirstSync.mockReturnValueOnce({ count: 0 });

      const stats = buildPeriodStats("user-abc", "week");

      expect(stats.exerciseBreakdown).toEqual([]);
    });
  });

  describe("date range", () => {
    it("returns startDate and endDate strings", () => {
      mockDb.getAllSync
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);
      mockDb.getFirstSync.mockReturnValueOnce({ count: 0 });

      const stats = buildPeriodStats("user-abc", "week");

      expect(stats.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(stats.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new Date(stats.startDate) <= new Date(stats.endDate)).toBe(true);
    });

    it("week period: start is ~7 days before today", () => {
      mockDb.getAllSync
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);
      mockDb.getFirstSync.mockReturnValueOnce({ count: 0 });

      const stats = buildPeriodStats("user-abc", "week");

      const diffDays =
        (new Date(stats.endDate).getTime() - new Date(stats.startDate).getTime()) /
        (1000 * 60 * 60 * 24);
      expect(diffDays).toBeCloseTo(7, 0);
    });

    it("mesocycle period: falls back to ~84 days when no active mesocycle", () => {
      mockDb.getAllSync
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);
      mockDb.getFirstSync
        .mockReturnValueOnce(null) // no active mesocycle row
        .mockReturnValueOnce({ count: 0 }); // PRs

      const stats = buildPeriodStats("user-abc", "mesocycle");

      const diffDays =
        (new Date(stats.endDate).getTime() - new Date(stats.startDate).getTime()) /
        (1000 * 60 * 60 * 24);
      expect(diffDays).toBeCloseTo(84, 0);
    });
  });

  describe("null safety", () => {
    it("handles completely empty database gracefully", () => {
      mockDb.getAllSync.mockReturnValue([]);
      mockDb.getFirstSync.mockReturnValue(null);

      expect(() => buildPeriodStats("user-abc", "month")).not.toThrow();

      const stats = buildPeriodStats("user-abc", "month");
      expect(stats.workoutsCompleted).toBe(0);
      expect(stats.totalVolume).toBe(0);
      expect(stats.averageRpe).toBeNull();
      expect(stats.personalRecords).toBe(0);
      expect(stats.exerciseBreakdown).toEqual([]);
    });
  });
});
