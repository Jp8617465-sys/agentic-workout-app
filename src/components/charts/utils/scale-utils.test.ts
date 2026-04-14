import { linearScale, niceTicks, paddedDomain, buildLinePath, polylineLength } from "./scale-utils";

describe("linearScale", () => {
  it("maps domain values to range", () => {
    const scale = linearScale([0, 100], [0, 200]);
    expect(scale(0)).toBe(0);
    expect(scale(50)).toBe(100);
    expect(scale(100)).toBe(200);
  });

  it("handles inverted range (y-axis flip)", () => {
    const scale = linearScale([0, 100], [200, 0]);
    expect(scale(0)).toBe(200);
    expect(scale(100)).toBe(0);
    expect(scale(50)).toBe(100);
  });

  it("returns midpoint when domain is zero-width", () => {
    const scale = linearScale([5, 5], [0, 100]);
    expect(scale(5)).toBe(50);
    expect(scale(0)).toBe(50);
  });

  it("extrapolates beyond domain", () => {
    const scale = linearScale([0, 100], [0, 10]);
    expect(scale(200)).toBe(20);
    expect(scale(-50)).toBe(-5);
  });
});

describe("niceTicks", () => {
  it("produces ticks spanning the input range", () => {
    const ticks = niceTicks(0, 100, 5);
    expect(ticks[0]).toBeLessThanOrEqual(0);
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(100);
  });

  it("produces reasonable tick count (not wildly off target)", () => {
    const ticks = niceTicks(0, 1000, 5);
    expect(ticks.length).toBeGreaterThanOrEqual(3);
    expect(ticks.length).toBeLessThanOrEqual(9);
  });

  it("handles equal min/max", () => {
    const ticks = niceTicks(50, 50, 5);
    expect(ticks).toEqual([50]);
  });

  it("handles non-finite values", () => {
    const ticks = niceTicks(NaN, 100, 5);
    expect(ticks).toEqual([NaN]);
  });

  it("produces round numbers for volume data", () => {
    const ticks = niceTicks(0, 5000, 5);
    ticks.forEach((t) => {
      expect(t % 500).toBe(0);
    });
  });

  it("handles small fractional ranges (RPE 6–9)", () => {
    const ticks = niceTicks(6, 9, 4);
    expect(ticks[0]).toBeLessThanOrEqual(6);
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(9);
    expect(ticks.length).toBeGreaterThanOrEqual(2);
  });
});

describe("paddedDomain", () => {
  it("returns [0,1] for empty array", () => {
    expect(paddedDomain([])).toEqual([0, 1]);
  });

  it("pads by default 10% on each side", () => {
    const [lo, hi] = paddedDomain([0, 100]);
    expect(lo).toBe(-10);
    expect(hi).toBe(110);
  });

  it("handles single value (equal min/max)", () => {
    const [lo, hi] = paddedDomain([50]);
    expect(lo).toBe(49);
    expect(hi).toBe(51);
  });

  it("respects custom padding fraction", () => {
    const [lo, hi] = paddedDomain([0, 100], 0.2);
    expect(lo).toBe(-20);
    expect(hi).toBe(120);
  });

  it("works with negative values", () => {
    const [lo, hi] = paddedDomain([-100, -50]);
    expect(lo).toBeLessThan(-100);
    expect(hi).toBeGreaterThan(-50);
  });
});

describe("buildLinePath", () => {
  it("returns empty string for empty points", () => {
    expect(buildLinePath([])).toBe("");
  });

  it("starts with M for first point", () => {
    const path = buildLinePath([{ x: 0, y: 0 }]);
    expect(path.startsWith("M")).toBe(true);
  });

  it("uses L for subsequent points", () => {
    const path = buildLinePath([
      { x: 0, y: 0 },
      { x: 10, y: 5 },
      { x: 20, y: 10 },
    ]);
    expect(path).toBe("M 0.0,0.0 L 10.0,5.0 L 20.0,10.0");
  });
});

describe("polylineLength", () => {
  it("returns 0 for empty or single-point path", () => {
    expect(polylineLength([])).toBe(0);
    expect(polylineLength([{ x: 5, y: 5 }])).toBe(0);
  });

  it("calculates horizontal distance correctly", () => {
    const len = polylineLength([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
    ]);
    expect(len).toBe(100);
  });

  it("calculates vertical distance correctly", () => {
    const len = polylineLength([
      { x: 0, y: 0 },
      { x: 0, y: 60 },
    ]);
    expect(len).toBe(60);
  });

  it("calculates diagonal (3-4-5 triangle)", () => {
    const len = polylineLength([
      { x: 0, y: 0 },
      { x: 3, y: 4 },
    ]);
    expect(len).toBeCloseTo(5);
  });

  it("accumulates multiple segments", () => {
    const len = polylineLength([
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 50 },
    ]);
    expect(len).toBe(150);
  });
});
