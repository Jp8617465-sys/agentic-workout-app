import type { ExperienceLevel } from "../../types";

// --- Types ---

export interface OneRepMaxResult {
  estimatedOneRepMax: number;
  formula: "epley";
}

export interface LoadAdjustmentResult {
  suggestedWeight: number;
  percentageChange: number;
  reason: string;
}

export interface NextLoadResult {
  weight: number;
  reps: number;
  rpe: number;
  progressionType: "weight" | "reps" | "deload" | "maintain";
}

export interface SessionRpeSummary {
  date: string;
  averageRpe: number;
  totalVolume: number;
}

export interface DeloadRecommendation {
  shouldDeload: boolean;
  reason: string | null;
  suggestedWeightReduction: number;
}

// --- Epley 1RM Estimation ---
// Formula: 1RM = weight * (1 + reps / 30)
// Valid range: reps 1–10; clamp to 20 to prevent overcalculation.
export function estimateOneRepMax(
  weight: number,
  reps: number,
): OneRepMaxResult {
  if (reps <= 0 || weight <= 0) {
    throw new RangeError("weight and reps must be positive");
  }
  const clampedReps = Math.min(reps, 20);
  const estimatedOneRepMax = weight * (1 + clampedReps / 30);
  return { estimatedOneRepMax, formula: "epley" };
}

// --- Zourdos %1RM from RPE ---
// %1RM = (100 - (10.7 - rpe) * 1.13) / 100
// RPE 10 → ~100%, RPE 8 → ~77.5%, RPE 6 → ~55%
export function percentOf1RMFromRPE(rpe: number): number {
  return (100 - (10.7 - rpe) * 1.13) / 100;
}

// --- RPE Load Adjustment (Zourdos) ---
// Given actual vs prescribed RPE, compute the weight adjustment needed
// to restore the target %1RM for the next set.
export function calculateRPELoadAdjustment(
  currentWeight: number,
  prescribedRpe: number,
  actualRpe: number,
): LoadAdjustmentResult {
  const deviationRpe = actualRpe - prescribedRpe;

  const prescribedPercent = percentOf1RMFromRPE(prescribedRpe);
  const actualPercent = percentOf1RMFromRPE(actualRpe);

  // Scale weight to restore the prescribed %1RM
  const adjustmentFactor = prescribedPercent / actualPercent;
  // Round to nearest 0.5 kg
  const suggestedWeight = Math.round(currentWeight * adjustmentFactor * 2) / 2;
  const percentageChange = (adjustmentFactor - 1) * 100;

  let reason: string;
  if (deviationRpe >= 2) {
    reason =
      "Set was significantly harder than target. Reduce load to match prescribed intensity.";
  } else if (deviationRpe >= 1) {
    reason = "Set was harder than target. Small load reduction recommended.";
  } else if (deviationRpe <= -2) {
    reason = "Set was much easier than target. Increase load.";
  } else if (deviationRpe <= -1) {
    reason = "Set was slightly easier than target. Consider increasing load.";
  } else {
    reason = "Set matched target RPE well.";
  }

  return { suggestedWeight, percentageChange, reason };
}

// --- Next Session Load ---
// Decision tree using last session's performance vs targets.
export function calculateNextLoad(
  lastWeight: number,
  lastReps: number,
  lastRpe: number,
  targetRpe: number,
  targetReps: number,
  experienceLevel: ExperienceLevel,
): NextLoadResult {
  const deviationRpe = lastRpe - targetRpe;

  const weightIncrements: Record<ExperienceLevel, number> = {
    beginner: 2.5,
    intermediate: 2.5,
    advanced: 1.25,
    elite: 1.25,
  };
  const increment = weightIncrements[experienceLevel];

  if (lastRpe > 9.5) {
    // Too close to failure — deload
    return {
      weight: Math.round(lastWeight * 0.9 * 2) / 2,
      reps: targetReps,
      rpe: targetRpe,
      progressionType: "deload",
    };
  }

  if (deviationRpe >= 1.0) {
    // RPE overshot target — don't progress
    return {
      weight: lastWeight,
      reps: targetReps,
      rpe: targetRpe,
      progressionType: "maintain",
    };
  }

  if (lastReps >= targetReps && lastRpe <= targetRpe) {
    // Hit reps at or below target RPE — add weight
    return {
      weight: lastWeight + increment,
      reps: targetReps,
      rpe: targetRpe,
      progressionType: "weight",
    };
  }

  // Did not hit target reps — try adding a rep next session
  return {
    weight: lastWeight,
    reps: Math.min(lastReps + 1, targetReps),
    rpe: targetRpe,
    progressionType: "reps",
  };
}

// --- Deload Detection ---
// Combines RPE streak detection with Banister fatigue index.
export function shouldDeload(
  recentSessions: SessionRpeSummary[],
  fatigueIndex: number,
): DeloadRecommendation {
  if (recentSessions.length < 3) {
    return { shouldDeload: false, reason: null, suggestedWeightReduction: 0 };
  }

  const lastThree = recentSessions.slice(-3);
  const allHighRpe = lastThree.every((s) => s.averageRpe >= 8.5);

  if (allHighRpe) {
    return {
      shouldDeload: true,
      reason: "3 consecutive sessions with average RPE ≥ 8.5",
      suggestedWeightReduction: 0.1,
    };
  }

  if (fatigueIndex > 80) {
    return {
      shouldDeload: true,
      reason: "Fatigue index exceeds threshold (Banister model)",
      suggestedWeightReduction: 0.15,
    };
  }

  return { shouldDeload: false, reason: null, suggestedWeightReduction: 0 };
}
