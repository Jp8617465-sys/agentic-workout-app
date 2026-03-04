import type { ConfidenceFactors } from "../../types/memory";

export function daysBetweenIso(isoA: string, isoB: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const a = new Date(isoA).getTime();
  const b = new Date(isoB).getTime();
  return Math.abs(b - a) / msPerDay;
}

export function clampConfidence(raw: number): number {
  return Math.round(Math.min(1, Math.max(0, raw)) * 10000) / 10000;
}

/**
 * confidence = 0.30 * observationScore + 0.40 * successRate + 0.30 * recencyScore
 *
 * observationScore = observations / (observations + 10) — asymptotic, ~50% at 10 obs
 * recencyScore = 2^(-(daysSinceObserved / 60)) — 60-day half-life exponential decay
 */
export function calculateConfidence(factors: ConfidenceFactors): number {
  const observationScore = factors.observations / (factors.observations + 10);

  const daysSinceObserved = daysBetweenIso(
    factors.lastObservedIso,
    new Date().toISOString(),
  );
  const recencyScore = Math.pow(2, -(daysSinceObserved / 60));

  const raw =
    0.3 * observationScore + 0.4 * factors.successRate + 0.3 * recencyScore;

  return clampConfidence(raw);
}

export const MEMORY_BUDGET = 500;
