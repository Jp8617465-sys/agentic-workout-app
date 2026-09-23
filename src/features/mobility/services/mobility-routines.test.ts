import seedData from "../../../constants/exercises/seed-data.json";
import {
  MOBILITY_ROUTINES,
  estimateRoutineSeconds,
  formatDrillPrescription,
  computeTrend,
  ankleAsymmetry,
} from "./mobility-routines";

const LIBRARY = new Set((seedData as { name: string }[]).map((e) => e.name));

describe("mobility routines", () => {
  it("only uses exercises that exist in the library", () => {
    const missing = MOBILITY_ROUTINES.flatMap((r) =>
      r.drills.map((d) => d.exerciseName),
    ).filter((n) => !LIBRARY.has(n));
    expect(missing).toEqual([]);
  });

  it("keeps each routine near its advertised length", () => {
    const [daily, quick] = MOBILITY_ROUTINES;
    expect(estimateRoutineSeconds(daily) / 60).toBeGreaterThanOrEqual(9);
    expect(estimateRoutineSeconds(daily) / 60).toBeLessThanOrEqual(13);
    expect(estimateRoutineSeconds(quick) / 60).toBeLessThanOrEqual(6);
  });

  it("formats prescriptions", () => {
    expect(
      formatDrillPrescription({
        exerciseName: "x",
        mode: "hold",
        amount: 45,
        perSide: true,
        cue: "",
      }),
    ).toBe("45s / side");
    expect(
      formatDrillPrescription({
        exerciseName: "x",
        mode: "reps",
        amount: 8,
        perSide: false,
        cue: "",
      }),
    ).toBe("8 reps");
    expect(
      formatDrillPrescription({
        exerciseName: "x",
        mode: "hold",
        amount: 60,
        perSide: false,
        cue: "",
      }),
    ).toBe("60s");
  });
});

describe("computeTrend", () => {
  it("treats a longer knee-to-wall distance as improvement", () => {
    expect(computeTrend([8, 9, 10.5], true)).toEqual({
      latest: 10.5,
      baseline: 8,
      change: 2.5,
      improved: true,
    });
  });

  it("treats a smaller toe-touch gap as improvement", () => {
    expect(computeTrend([12, 7], false)).toMatchObject({
      change: -5,
      improved: true,
    });
  });

  it("reports no direction for a single or unchanged reading", () => {
    expect(computeTrend([10], true)?.improved).toBeNull();
    expect(computeTrend([], true)).toBeNull();
  });
});

describe("ankleAsymmetry", () => {
  it("returns the absolute left/right gap", () => {
    expect(ankleAsymmetry(7.5, 11)).toBe(3.5);
    expect(ankleAsymmetry(null, 11)).toBeNull();
  });
});
