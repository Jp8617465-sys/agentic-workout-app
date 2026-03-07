import {
  estimateOneRepMax,
  percentOf1RMFromRPE,
  calculateRPELoadAdjustment,
  calculateNextLoad,
  shouldDeload,
  type SessionRpeSummary,
} from "./progression-calculator";
import type { ExperienceLevel } from "../../types";

describe("Progression Calculator", () => {
  // ============= estimateOneRepMax =============
  describe("estimateOneRepMax (Epley Formula)", () => {
    it("should calculate 1RM correctly with Epley formula", () => {
      const result = estimateOneRepMax(100, 5);
      expect(result.formula).toBe("epley");
      // 1RM = 100 * (1 + 5/30) = 100 * 1.1667 = 116.67
      expect(result.estimatedOneRepMax).toBeCloseTo(116.67, 2);
    });

    it("should handle single rep max (input reps=1)", () => {
      const result = estimateOneRepMax(100, 1);
      // 1RM = 100 * (1 + 1/30) = 100 * 1.0333 = 103.33
      expect(result.estimatedOneRepMax).toBeCloseTo(103.33, 2);
    });

    it("should clamp high reps to 20 to prevent overcalculation", () => {
      const result1 = estimateOneRepMax(100, 25);
      const result2 = estimateOneRepMax(100, 20);
      // Both should be same because 25 is clamped to 20
      expect(result1.estimatedOneRepMax).toBe(result2.estimatedOneRepMax);
    });

    it("should throw error for non-positive weight", () => {
      expect(() => estimateOneRepMax(0, 5)).toThrow(RangeError);
      expect(() => estimateOneRepMax(-10, 5)).toThrow(RangeError);
    });

    it("should throw error for non-positive reps", () => {
      expect(() => estimateOneRepMax(100, 0)).toThrow(RangeError);
      expect(() => estimateOneRepMax(100, -5)).toThrow(RangeError);
    });

    it("should handle small weights correctly", () => {
      const result = estimateOneRepMax(0.5, 3);
      expect(result.estimatedOneRepMax).toBeCloseTo(0.55, 2);
    });

    it("should handle fractional reps in calculation", () => {
      const result = estimateOneRepMax(100, 7.5);
      expect(result.estimatedOneRepMax).toBeCloseTo(125, 2);
    });

    it("should handle very light weights", () => {
      const result = estimateOneRepMax(5, 8);
      expect(result.estimatedOneRepMax).toBeCloseTo(6.33, 2);
    });
  });

  // ============= percentOf1RMFromRPE =============
  describe("percentOf1RMFromRPE", () => {
    it("should calculate RPE 10 as ~100% of 1RM", () => {
      const percent = percentOf1RMFromRPE(10);
      expect(percent).toBeCloseTo(1.0, 1);
    });

    it("should calculate RPE 8 as ~77.5% of 1RM", () => {
      const percent = percentOf1RMFromRPE(8);
      expect(percent).toBeCloseTo(0.775, 2);
    });

    it("should calculate RPE 6 as ~55% of 1RM", () => {
      const percent = percentOf1RMFromRPE(6);
      expect(percent).toBeCloseTo(0.55, 2);
    });

    it("should calculate RPE 7 as mid-range intensity", () => {
      const percent = percentOf1RMFromRPE(7);
      expect(percent).toBeGreaterThan(percentOf1RMFromRPE(6));
      expect(percent).toBeLessThan(percentOf1RMFromRPE(8));
    });

    it("should handle RPE 5", () => {
      const percent = percentOf1RMFromRPE(5);
      expect(percent).toBeLessThan(percentOf1RMFromRPE(6));
      expect(percent).toBeGreaterThan(0);
    });

    it("should handle low RPE values", () => {
      const percent = percentOf1RMFromRPE(3);
      expect(percent).toBeGreaterThan(0);
      expect(percent).toBeLessThan(percentOf1RMFromRPE(5));
    });
  });

  // ============= calculateRPELoadAdjustment =============
  describe("calculateRPELoadAdjustment", () => {
    it("should suggest weight reduction when RPE is 2+ higher than prescribed", () => {
      const result = calculateRPELoadAdjustment(100, 7, 9);
      expect(result.suggestedWeight).toBeLessThan(100);
      expect(result.reason).toContain("significantly harder");
    });

    it("should suggest small weight reduction when RPE is 1 higher", () => {
      const result = calculateRPELoadAdjustment(100, 7, 8);
      expect(result.suggestedWeight).toBeLessThan(100);
      expect(result.reason).toContain("harder than target");
    });

    it("should suggest weight increase when RPE is 2+ lower than prescribed", () => {
      const result = calculateRPELoadAdjustment(100, 7, 5);
      expect(result.suggestedWeight).toBeGreaterThan(100);
      expect(result.reason).toContain("much easier");
    });

    it("should suggest small weight increase when RPE is 1 lower", () => {
      const result = calculateRPELoadAdjustment(100, 7, 6);
      expect(result.suggestedWeight).toBeGreaterThan(100);
      expect(result.reason).toContain("slightly easier");
    });

    it("should suggest no change when RPE matches prescribed", () => {
      const result = calculateRPELoadAdjustment(100, 7, 7);
      expect(result.suggestedWeight).toBe(100);
      expect(result.reason).toContain("matched target RPE");
    });

    it("should round suggested weight to nearest 0.5 kg", () => {
      const result = calculateRPELoadAdjustment(100.3, 7, 5);
      expect(result.suggestedWeight % 0.5).toBe(0);
    });

    it("should handle small weights", () => {
      const result = calculateRPELoadAdjustment(5, 7, 5);
      expect(result.suggestedWeight).toBeGreaterThan(5);
    });

    it("should calculate percentage change correctly", () => {
      const result = calculateRPELoadAdjustment(100, 7, 9);
      expect(result.percentageChange).toBeLessThan(0); // Negative = reduce
      expect(result.percentageChange).toBeLessThan(-5);
    });
  });

  // ============= calculateNextLoad =============
  describe("calculateNextLoad", () => {
    it("should deload when RPE > 9.5", () => {
      const result = calculateNextLoad(100, 8, 9.6, 7, 8, "intermediate");
      expect(result.progressionType).toBe("deload");
      expect(result.weight).toBeLessThan(100);
      // Deload = weight * 0.9
      expect(result.weight).toBeCloseTo(90, 1);
    });

    it("should maintain weight when RPE overshoots target by 1+", () => {
      const result = calculateNextLoad(100, 8, 8.5, 7, 8, "intermediate");
      expect(result.progressionType).toBe("maintain");
      expect(result.weight).toBe(100);
    });

    it("should progress weight when hitting reps at target RPE", () => {
      const result = calculateNextLoad(100, 8, 7, 7, 8, "intermediate");
      expect(result.progressionType).toBe("weight");
      expect(result.weight).toBeGreaterThan(100);
    });

    it("should use 2.5kg increment for intermediate", () => {
      const result = calculateNextLoad(100, 8, 7, 7, 8, "intermediate");
      expect(result.weight).toBe(102.5);
    });

    it("should use 1.25kg increment for advanced", () => {
      const result = calculateNextLoad(100, 8, 7, 7, 8, "advanced");
      expect(result.weight).toBe(101.25);
    });

    it("should use 1.25kg increment for elite", () => {
      const result = calculateNextLoad(100, 8, 7, 7, 8, "elite");
      expect(result.weight).toBe(101.25);
    });

    it("should use 2.5kg increment for beginner", () => {
      const result = calculateNextLoad(100, 8, 7, 7, 8, "beginner");
      expect(result.weight).toBe(102.5);
    });

    it("should add rep when not hitting target reps", () => {
      const result = calculateNextLoad(100, 7, 7, 7, 8, "intermediate");
      expect(result.progressionType).toBe("reps");
      expect(result.reps).toBe(8);
      expect(result.weight).toBe(100);
    });

    it("should cap reps at target maximum", () => {
      const result = calculateNextLoad(100, 10, 7, 7, 8, "intermediate");
      expect(result.progressionType).toBe("reps");
      expect(result.reps).toBe(8); // Capped at targetReps
    });

    it("should return target RPE regardless of progression type", () => {
      const cases = [
        calculateNextLoad(100, 8, 9.6, 7, 8, "intermediate"),
        calculateNextLoad(100, 8, 8.5, 7, 8, "intermediate"),
        calculateNextLoad(100, 8, 7, 7, 8, "intermediate"),
        calculateNextLoad(100, 7, 7, 7, 8, "intermediate"),
      ];
      cases.forEach((result) => {
        expect(result.rpe).toBe(7);
      });
    });
  });

  // ============= shouldDeload =============
  describe("shouldDeload", () => {
    it("should not deload with < 3 sessions history", () => {
      const recentSessions: SessionRpeSummary[] = [
        { date: "2025-03-05", averageRpe: 8.5, totalVolume: 5000 },
        { date: "2025-03-06", averageRpe: 8.6, totalVolume: 5200 },
      ];
      const result = shouldDeload(recentSessions, 50);
      expect(result.shouldDeload).toBe(false);
      expect(result.reason).toBeNull();
    });

    it("should recommend deload with 3 consecutive high-RPE sessions", () => {
      const recentSessions: SessionRpeSummary[] = [
        { date: "2025-03-05", averageRpe: 8.5, totalVolume: 5000 },
        { date: "2025-03-06", averageRpe: 8.6, totalVolume: 5200 },
        { date: "2025-03-07", averageRpe: 8.7, totalVolume: 5400 },
      ];
      const result = shouldDeload(recentSessions, 50);
      expect(result.shouldDeload).toBe(true);
      expect(result.reason).toContain("3 consecutive");
    });

    it("should recommend deload when fatigue index > 80", () => {
      const recentSessions: SessionRpeSummary[] = [
        { date: "2025-03-05", averageRpe: 7, totalVolume: 5000 },
        { date: "2025-03-06", averageRpe: 7, totalVolume: 5000 },
        { date: "2025-03-07", averageRpe: 7, totalVolume: 5000 },
      ];
      const result = shouldDeload(recentSessions, 85);
      expect(result.shouldDeload).toBe(true);
      expect(result.reason).toContain("Fatigue index");
    });

    it("should not deload with low RPE sessions", () => {
      const recentSessions: SessionRpeSummary[] = [
        { date: "2025-03-05", averageRpe: 6, totalVolume: 5000 },
        { date: "2025-03-06", averageRpe: 6.5, totalVolume: 5200 },
        { date: "2025-03-07", averageRpe: 6.8, totalVolume: 5400 },
      ];
      const result = shouldDeload(recentSessions, 50);
      expect(result.shouldDeload).toBe(false);
    });

    it("should not deload with high rpe but mixed sessions", () => {
      const recentSessions: SessionRpeSummary[] = [
        { date: "2025-03-05", averageRpe: 8.5, totalVolume: 5000 },
        { date: "2025-03-06", averageRpe: 7.5, totalVolume: 5200 }, // Dip below 8.5
        { date: "2025-03-07", averageRpe: 8.6, totalVolume: 5400 },
      ];
      const result = shouldDeload(recentSessions, 50);
      expect(result.shouldDeload).toBe(false);
    });

    it("should return weight reduction percentage for deload", () => {
      const recentSessions: SessionRpeSummary[] = [
        { date: "2025-03-05", averageRpe: 8.5, totalVolume: 5000 },
        { date: "2025-03-06", averageRpe: 8.6, totalVolume: 5200 },
        { date: "2025-03-07", averageRpe: 8.7, totalVolume: 5400 },
      ];
      const result = shouldDeload(recentSessions, 50);
      expect(result.suggestedWeightReduction).toBeGreaterThan(0);
      expect(result.suggestedWeightReduction).toBeLessThanOrEqual(0.15);
    });

    it("should return 0 reduction when no deload recommended", () => {
      const recentSessions: SessionRpeSummary[] = [
        { date: "2025-03-05", averageRpe: 6, totalVolume: 5000 },
      ];
      const result = shouldDeload(recentSessions, 40);
      expect(result.suggestedWeightReduction).toBe(0);
    });
  });
});
