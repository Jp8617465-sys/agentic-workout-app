import {
  evaluateRPEDeviation,
  RPE_DEVIATION_THRESHOLD,
  RPE_MAJOR_THRESHOLD,
} from "./rpe-evaluator";

describe("RPE Evaluator", () => {
  describe("evaluateRPEDeviation", () => {
    it("should return no deviation when prescribed RPE is null", () => {
      const result = evaluateRPEDeviation(7, null);

      expect(result.hasDeviation).toBe(false);
      expect(result.severity).toBe("none");
      expect(result.actionRequired).toBe("none");
    });

    it("should return no deviation when actual matches prescribed exactly", () => {
      const result = evaluateRPEDeviation(7, 7);

      expect(result.hasDeviation).toBe(false);
      expect(result.deviationMagnitude).toBe(0);
      expect(result.severity).toBe("none");
      expect(result.actionRequired).toBe("none");
    });

    it("should return no deviation when within threshold (< 1.0)", () => {
      const result = evaluateRPEDeviation(7.5, 7);

      expect(result.hasDeviation).toBe(false);
      expect(result.deviationMagnitude).toBe(0.5);
      expect(result.severity).toBe("none");
      expect(result.actionRequired).toBe("none");
    });

    it("should detect minor deviation at exactly threshold (1.0)", () => {
      const result = evaluateRPEDeviation(8, 7);

      expect(result.hasDeviation).toBe(true);
      expect(result.deviationMagnitude).toBe(1.0);
      expect(result.severity).toBe("minor");
      expect(result.actionRequired).toBe("suggest");
    });

    it("should detect minor deviation when 1-2 RPE harder", () => {
      const result1 = evaluateRPEDeviation(8, 7);
      const result2 = evaluateRPEDeviation(8.5, 7);

      expect(result1.hasDeviation).toBe(true);
      expect(result2.hasDeviation).toBe(true);
      expect(result1.severity).toBe("minor");
      expect(result2.severity).toBe("minor");
    });

    it("should detect major deviation at exactly major threshold (2.0)", () => {
      const result = evaluateRPEDeviation(9, 7);

      expect(result.hasDeviation).toBe(true);
      expect(result.deviationMagnitude).toBe(2.0);
      expect(result.severity).toBe("major");
      expect(result.actionRequired).toBe("require");
    });

    it("should detect major deviation when > 2.0 RPE harder", () => {
      const result = evaluateRPEDeviation(9.5, 7);

      expect(result.hasDeviation).toBe(true);
      expect(result.deviationMagnitude).toBe(2.5);
      expect(result.severity).toBe("major");
      expect(result.actionRequired).toBe("require");
    });

    it("should detect minor deviation when 1-2 RPE easier", () => {
      const result1 = evaluateRPEDeviation(6, 7);
      const result2 = evaluateRPEDeviation(5.5, 7);

      expect(result1.hasDeviation).toBe(true);
      expect(result2.hasDeviation).toBe(true);
      expect(result1.severity).toBe("minor");
      expect(result2.severity).toBe("minor");
      expect(result1.deviationMagnitude).toBe(-1.0);
      expect(result2.deviationMagnitude).toBe(-1.5);
    });

    it("should detect major deviation when > 2.0 RPE easier", () => {
      const result = evaluateRPEDeviation(4.5, 7);

      expect(result.hasDeviation).toBe(true);
      expect(result.deviationMagnitude).toBe(-2.5);
      expect(result.severity).toBe("major");
      expect(result.actionRequired).toBe("require");
    });

    it("should handle edge cases with extreme RPE values", () => {
      const result1 = evaluateRPEDeviation(0.5, 7);
      const result2 = evaluateRPEDeviation(10, 7);

      expect(result1.hasDeviation).toBe(true);
      expect(result1.severity).toBe("major");
      expect(result2.hasDeviation).toBe(true);
      expect(result2.severity).toBe("major");
    });

    it("should correctly calculate deviation magnitude (positive = harder)", () => {
      const harder = evaluateRPEDeviation(8, 7);
      const easier = evaluateRPEDeviation(6, 7);

      expect(harder.deviationMagnitude).toBeGreaterThan(0);
      expect(easier.deviationMagnitude).toBeLessThan(0);
      expect(harder.deviationMagnitude).toBe(-easier.deviationMagnitude);
    });

    it("should handle fractional RPE values", () => {
      const result = evaluateRPEDeviation(7.8, 7);

      expect(result.hasDeviation).toBe(true);
      expect(result.deviationMagnitude).toBeCloseTo(0.8, 1);
      expect(result.severity).toBe("minor");
    });

    it("should handle prescribed RPE of 0 (edge case)", () => {
      const result = evaluateRPEDeviation(5, 0);

      expect(result.hasDeviation).toBe(true);
      expect(result.deviationMagnitude).toBe(5);
      expect(result.severity).toBe("major");
    });

    it("should handle prescribed RPE of 10 (maximum)", () => {
      const result = evaluateRPEDeviation(8, 10);

      expect(result.hasDeviation).toBe(true);
      expect(result.deviationMagnitude).toBe(-2);
      expect(result.severity).toBe("major");
    });

    it("should suggest action for minor deviations", () => {
      const harderMinor = evaluateRPEDeviation(8.5, 7);
      const easierMinor = evaluateRPEDeviation(5.5, 7);

      expect(harderMinor.actionRequired).toBe("suggest");
      expect(easierMinor.actionRequired).toBe("suggest");
    });

    it("should require action for major deviations", () => {
      const harderMajor = evaluateRPEDeviation(9.5, 7);
      const easierMajor = evaluateRPEDeviation(4.5, 7);

      expect(harderMajor.actionRequired).toBe("require");
      expect(easierMajor.actionRequired).toBe("require");
    });

    it("should not require action when within threshold", () => {
      const result = evaluateRPEDeviation(7.4, 7);

      expect(result.actionRequired).toBe("none");
    });
  });

  describe("Threshold constants", () => {
    it("should have correct deviation threshold", () => {
      expect(RPE_DEVIATION_THRESHOLD).toBe(1.0);
    });

    it("should have correct major threshold", () => {
      expect(RPE_MAJOR_THRESHOLD).toBe(2.0);
    });

    it("should have major threshold > deviation threshold", () => {
      expect(RPE_MAJOR_THRESHOLD).toBeGreaterThan(RPE_DEVIATION_THRESHOLD);
    });
  });
});
