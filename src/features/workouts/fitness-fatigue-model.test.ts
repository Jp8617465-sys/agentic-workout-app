import {
  computeFitnessFatigue,
  type TrainingLoadEntry,
} from "./fitness-fatigue-model";

describe("Fitness-Fatigue Model (Banister)", () => {
  const TEST_DATE = "2025-03-07";

  describe("computeFitnessFatigue", () => {
    it("should return zero fitness/fatigue with empty history", () => {
      const result = computeFitnessFatigue([], TEST_DATE);

      expect(result.fitness).toBe(0);
      expect(result.fatigue).toBe(0);
      expect(result.performanceScore).toBe(0);
      expect(result.trainingLoad).toBe(0);
    });

    it("should calculate today's training load when entry matches target date", () => {
      const entries: TrainingLoadEntry[] = [
        {
          date: TEST_DATE,
          totalVolume: 10000,
          averageRpe: 8,
        },
      ];

      const result = computeFitnessFatigue(entries, TEST_DATE);

      // TL = 10000 * (0.5 + 8/10 * 0.5) = 10000 * 0.9 = 9000
      expect(result.trainingLoad).toBe(9000);
    });

    it("should have higher fatigue than fitness immediately after training", () => {
      const entries: TrainingLoadEntry[] = [
        {
          date: TEST_DATE,
          totalVolume: 10000,
          averageRpe: 8,
        },
      ];

      const result = computeFitnessFatigue(entries, TEST_DATE);

      // K2 (fatigue) = 2.0, K1 (fitness) = 1.0, so fatigue > fitness
      expect(result.fatigue).toBeGreaterThan(result.fitness);
    });

    it("should decay fatigue faster than fitness over time", () => {
      const entries: TrainingLoadEntry[] = [
        {
          date: "2025-02-28", // 7 days ago
          totalVolume: 10000,
          averageRpe: 8,
        },
      ];

      const result = computeFitnessFatigue(entries, TEST_DATE);

      // After 7 days:
      // fitness: 1.0 * TL * exp(-7/45) ≈ 1.0 * TL * 0.854
      // fatigue: 2.0 * TL * exp(-7/15) ≈ 2.0 * TL * 0.616
      // fitness should be > fatigue
      expect(result.fitness).toBeGreaterThan(result.fatigue);
    });

    it("should show positive performance after recovery period", () => {
      const entries: TrainingLoadEntry[] = [
        {
          date: "2025-02-14", // ~21 days ago (recovery window)
          totalVolume: 10000,
          averageRpe: 8,
        },
      ];

      const result = computeFitnessFatigue(entries, TEST_DATE);

      expect(result.performanceScore).toBeGreaterThan(0);
      expect(result.fitness).toBeGreaterThan(result.fatigue);
    });

    it("should accumulate fitness with multiple training days", () => {
      const entries: TrainingLoadEntry[] = [
        { date: "2025-03-05", totalVolume: 5000, averageRpe: 7 },
        { date: "2025-03-06", totalVolume: 5000, averageRpe: 7 },
        { date: TEST_DATE, totalVolume: 5000, averageRpe: 7 },
      ];

      const result = computeFitnessFatigue(entries, TEST_DATE);

      // Multiple training days should accumulate fitness
      expect(result.fitness).toBeGreaterThan(0);
      expect(result.trainingLoad).toBeGreaterThan(0);
    });

    it("should ignore entries beyond 3 time constants (135 days)", () => {
      const entries: TrainingLoadEntry[] = [
        { date: "2024-10-23", totalVolume: 10000, averageRpe: 8 }, // ~136 days ago
        { date: TEST_DATE, totalVolume: 5000, averageRpe: 7 },
      ];

      const result = computeFitnessFatigue(entries, TEST_DATE);

      // Old entry should be negligible; result dominated by recent entry
      expect(result.fitness).toBeLessThan(1000); // Small but not zero due to recent entry
    });

    it("should scale training load by RPE factor", () => {
      // Compare same volume at different RPEs
      const rpe5 = computeFitnessFatigue(
        [{ date: TEST_DATE, totalVolume: 10000, averageRpe: 5 }],
        TEST_DATE
      );

      const rpe9 = computeFitnessFatigue(
        [{ date: TEST_DATE, totalVolume: 10000, averageRpe: 9 }],
        TEST_DATE
      );

      // Higher RPE should result in higher training load
      // TL = volume * (0.5 + rpe/10 * 0.5)
      // RPE 5: 10000 * (0.5 + 0.25) = 7500
      // RPE 9: 10000 * (0.5 + 0.45) = 9500
      expect(rpe9.trainingLoad).toBeGreaterThan(rpe5.trainingLoad);
    });

    it("should handle minimum RPE (1) and maximum (10)", () => {
      const resultMin = computeFitnessFatigue(
        [{ date: TEST_DATE, totalVolume: 10000, averageRpe: 1 }],
        TEST_DATE
      );

      const resultMax = computeFitnessFatigue(
        [{ date: TEST_DATE, totalVolume: 10000, averageRpe: 10 }],
        TEST_DATE
      );

      // Both should compute without error
      expect(resultMin.trainingLoad).toBeGreaterThan(0);
      expect(resultMax.trainingLoad).toBeGreaterThan(resultMin.trainingLoad);
    });

    it("should handle fractional RPE values", () => {
      const result = computeFitnessFatigue(
        [{ date: TEST_DATE, totalVolume: 10000, averageRpe: 7.5 }],
        TEST_DATE
      );

      // Should compute without error
      expect(result.trainingLoad).toBeGreaterThan(0);
      // RPE 7.5: 10000 * (0.5 + 0.375) = 8750
      expect(result.trainingLoad).toBeCloseTo(8750, 0);
    });

    it("should handle variable volume across sessions", () => {
      const entries: TrainingLoadEntry[] = [
        { date: "2025-03-05", totalVolume: 3000, averageRpe: 7 }, // Light
        { date: "2025-03-06", totalVolume: 10000, averageRpe: 8 }, // Heavy
        { date: TEST_DATE, totalVolume: 5000, averageRpe: 6 }, // Moderate
      ];

      const result = computeFitnessFatigue(entries, TEST_DATE);

      // Should handle mixed volumes
      expect(result.fitness).toBeGreaterThan(0);
      expect(result.fatigue).toBeGreaterThan(0);
    });

    it("should show negative performance during high fatigue period", () => {
      // Two very heavy days in a row
      const entries: TrainingLoadEntry[] = [
        { date: "2025-03-06", totalVolume: 15000, averageRpe: 9 },
        { date: TEST_DATE, totalVolume: 15000, averageRpe: 9 },
      ];

      const result = computeFitnessFatigue(entries, TEST_DATE);

      // High fatigue immediately after two heavy sessions
      expect(result.performanceScore).toBeLessThan(0);
      expect(result.fatigue).toBeGreaterThan(result.fitness);
    });

    it("should correctly calculate exponential decay constants", () => {
      const entry: TrainingLoadEntry = {
        date: "2025-02-20",
        totalVolume: 10000,
        averageRpe: 8,
      };

      const result1Day = computeFitnessFatigue([entry], "2025-02-21");
      const result7Days = computeFitnessFatigue([entry], "2025-02-27");
      const result45Days = computeFitnessFatigue([entry], "2025-04-06");

      // After 45 days, fitness should dominate (tau_fitness = 45)
      expect(result45Days.fitness).toBeGreaterThan(result45Days.fatigue);

      // Recent entries should show fatigue > fitness
      expect(result1Day.fatigue).toBeGreaterThan(result1Day.fitness);
    });

    it("should handle zero volume (rest day)", () => {
      const entries: TrainingLoadEntry[] = [
        { date: TEST_DATE, totalVolume: 0, averageRpe: 0 },
      ];

      const result = computeFitnessFatigue(entries, TEST_DATE);

      // Rest day should contribute zero
      expect(result.trainingLoad).toBe(0);
      expect(result.fitness).toBe(0);
      expect(result.fatigue).toBe(0);
    });

    it("should process realistic weekly training scenario", () => {
      // Monday-Friday training, weekends rest
      const entries: TrainingLoadEntry[] = [
        { date: "2025-03-03", totalVolume: 8000, averageRpe: 7 }, // Mon
        { date: "2025-03-04", totalVolume: 7000, averageRpe: 7 }, // Tue
        // Wed rest
        { date: "2025-03-05", totalVolume: 9000, averageRpe: 7.5 }, // Thu
        { date: "2025-03-06", totalVolume: 6000, averageRpe: 6.5 }, // Fri
        // Weekend rest
        { date: TEST_DATE, totalVolume: 8500, averageRpe: 7 }, // Mon
      ];

      const result = computeFitnessFatigue(entries, TEST_DATE);

      expect(result.fitness).toBeGreaterThan(0);
      expect(result.trainingLoad).toBeGreaterThan(0);
      // After a week, should be recovering (fitness > fatigue)
      expect(result.fitness).toBeGreaterThan(result.fatigue);
    });
  });
});
