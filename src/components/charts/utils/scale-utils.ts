/** Map a value from one domain to a range. */
export function linearScale(
  domain: [number, number],
  range: [number, number],
): (value: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  if (d1 === d0) return () => (r0 + r1) / 2;
  return (value) => r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
}

/** Generate human-readable tick values for an axis. */
export function niceTicks(min: number, max: number, targetCount = 5): number[] {
  if (!isFinite(min) || !isFinite(max) || min === max) return [min];
  const range = max - min;
  const rawStep = range / targetCount;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const niceMultipliers = [1, 2, 5, 10];
  const step = (niceMultipliers.find((m) => m * magnitude >= rawStep) ?? 10) * magnitude;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let t = start; t <= max + step * 0.01; t += step) {
    ticks.push(parseFloat(t.toPrecision(10)));
  }
  return ticks;
}

/** Pad a [min, max] domain by a fraction on each side. */
export function paddedDomain(
  values: number[],
  paddingFraction = 0.1,
): [number, number] {
  if (values.length === 0) return [0, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return [min - 1, max + 1];
  const pad = (max - min) * paddingFraction;
  return [min - pad, max + pad];
}

/** Build an SVG polyline path string from pixel-space points. */
export function buildLinePath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return "";
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
}

/** Approximate total length of a polyline path (for strokeDasharray animation). */
export function polylineLength(points: Array<{ x: number; y: number }>): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    total += Math.sqrt(dx * dx + dy * dy);
  }
  return total;
}
