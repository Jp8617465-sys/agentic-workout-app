// Pure TypeScript — zero Deno-specific imports.
// Jest imports this file directly for stress tests (no Deno runtime required).

// ─── DT-01: Daily Readiness ───────────────────────────────────────────────────

export type SessionType = "full" | "reduced" | "active_recovery" | "rest";

export type DT01Input = {
  wellnessScore: number;              // Sum of soreness+energy+mood+stress (4–20)
  lastSessionRpe: number | null;      // RPE 1–10, null if no recent session
  consecutiveHighRpeSessions: number; // How many sessions in a row with RPE > 8
  daysSinceLastSession: number;       // 0 = same day (rare), large = returning from break
};

export type DT01Output = {
  sessionType: SessionType;
  volumeModifier: number;   // 0.0–1.0 multiplier on planned volume
  intensityModifier: number; // 0.0–1.0 multiplier on planned intensity
  rationale: string;
};

export function runDT01(input: DT01Input): DT01Output {
  const { wellnessScore, lastSessionRpe, consecutiveHighRpeSessions } = input;
  const rpe = lastSessionRpe ?? 6;

  // Rest: severely depleted
  if (wellnessScore < 8 && consecutiveHighRpeSessions >= 3) {
    return {
      sessionType: "rest",
      volumeModifier: 0,
      intensityModifier: 0,
      rationale: `Wellness ${wellnessScore}/20 with ${consecutiveHighRpeSessions} consecutive high-RPE sessions. Full rest prescribed to prevent overreaching.`,
    };
  }

  if (wellnessScore < 6) {
    return {
      sessionType: "rest",
      volumeModifier: 0,
      intensityModifier: 0,
      rationale: `Wellness score ${wellnessScore}/20 is critically low. Rest day to protect recovery and prevent injury accumulation.`,
    };
  }

  // Active recovery: low wellness or accumulated fatigue
  if (wellnessScore < 8 || consecutiveHighRpeSessions >= 3) {
    return {
      sessionType: "active_recovery",
      volumeModifier: 0.4,
      intensityModifier: 0.7,
      rationale:
        consecutiveHighRpeSessions >= 3
          ? `${consecutiveHighRpeSessions} consecutive sessions at high RPE. Active recovery at 40% volume to flush fatigue without adding stress.`
          : `Wellness ${wellnessScore}/20 indicates moderate depletion. Light movement session at 40% planned volume.`,
    };
  }

  // Reduced: last session was harder than expected
  if (rpe > 8.5 || wellnessScore < 12) {
    return {
      sessionType: "reduced",
      volumeModifier: 0.7,
      intensityModifier: 0.85,
      rationale:
        rpe > 8.5
          ? `Last session RPE ${rpe.toFixed(1)} exceeded sustainable threshold. Reducing volume 30% and intensity 15% today.`
          : `Wellness ${wellnessScore}/20 is below optimal. Proceeding at 70% volume to stay within adaptive range.`,
    };
  }

  // Full: green across the board
  return {
    sessionType: "full",
    volumeModifier: 1.0,
    intensityModifier: 1.0,
    rationale: `Wellness ${wellnessScore}/20, last RPE ${rpe.toFixed(1)} — proceeding with full planned session.`,
  };
}

// ─── DT-03: Load Progression ──────────────────────────────────────────────────

export type TrainingPhase =
  | "accumulation"
  | "intensification"
  | "realization"
  | "deload";

export type DT03Input = {
  exerciseName: string;
  lastWeight: number;   // kg
  lastRpe: number;      // RPE 1–10
  targetRpe: number;    // RPE target for today
  sets: number;
  reps: number;
  phase: TrainingPhase;
  activeConstraints: string[]; // Live list from injuries table — empty when healthy
};

export type DT03Output = {
  recommendedWeight: number;
  sets: number;
  reps: number;
  rationale: string;
  constraintApplied: boolean;
};

// Zourdos %1RM RPE table — maps (reps, RPE) → percentage of 1RM
// Source: Zourdos et al. (2016) modified RPE chart
const RPE_LOAD_TABLE: Record<number, Record<number, number>> = {
  1:  { 10: 1.00, 9.5: 0.978, 9: 0.955, 8.5: 0.939, 8: 0.922, 7.5: 0.907, 7: 0.892, 6.5: 0.878, 6: 0.863 },
  2:  { 10: 0.955, 9.5: 0.939, 9: 0.922, 8.5: 0.907, 8: 0.892, 7.5: 0.878, 7: 0.863, 6.5: 0.849, 6: 0.835 },
  3:  { 10: 0.922, 9.5: 0.907, 9: 0.892, 8.5: 0.878, 8: 0.863, 7.5: 0.849, 7: 0.835, 6.5: 0.822, 6: 0.809 },
  4:  { 10: 0.892, 9.5: 0.878, 9: 0.863, 8.5: 0.849, 8: 0.835, 7.5: 0.822, 7: 0.809, 6.5: 0.796, 6: 0.783 },
  5:  { 10: 0.863, 9.5: 0.849, 9: 0.835, 8.5: 0.822, 8: 0.809, 7.5: 0.796, 7: 0.783, 6.5: 0.770, 6: 0.758 },
  6:  { 10: 0.835, 9.5: 0.822, 9: 0.809, 8.5: 0.796, 8: 0.783, 7.5: 0.770, 7: 0.758, 6.5: 0.745, 6: 0.733 },
  8:  { 10: 0.783, 9.5: 0.770, 9: 0.758, 8.5: 0.745, 8: 0.733, 7.5: 0.720, 7: 0.708, 6.5: 0.697, 6: 0.685 },
  10: { 10: 0.733, 9.5: 0.720, 9: 0.708, 8.5: 0.697, 8: 0.685, 7.5: 0.674, 7: 0.663, 6.5: 0.652, 6: 0.642 },
  12: { 10: 0.685, 9.5: 0.674, 9: 0.663, 8.5: 0.652, 8: 0.642, 7.5: 0.631, 7: 0.621, 6.5: 0.611, 6: 0.601 },
};

function getRpeLoadFactor(reps: number, rpe: number): number {
  const repKeys = Object.keys(RPE_LOAD_TABLE).map(Number).sort((a, b) => a - b);
  const clampedReps = Math.max(repKeys[0], Math.min(repKeys[repKeys.length - 1], reps));

  // Find nearest rep bracket
  let repBracket = repKeys[0];
  for (const key of repKeys) {
    if (key <= clampedReps) repBracket = key;
  }

  const rpeRow = RPE_LOAD_TABLE[repBracket];
  const rpeKeys = Object.keys(rpeRow).map(Number).sort((a, b) => b - a);
  const clampedRpe = Math.max(rpeKeys[rpeKeys.length - 1], Math.min(rpeKeys[0], rpe));

  // Find nearest RPE bracket
  let rpeBracket = rpeKeys[0];
  for (const key of rpeKeys) {
    if (key >= clampedRpe) rpeBracket = key;
  }

  return rpeRow[rpeBracket];
}

// Phase-based progression rates (load increase over last session)
const PHASE_PROGRESSION: Record<TrainingPhase, number> = {
  accumulation:    0.025,  // +2.5%
  intensification: 0.015,  // +1.5%
  realization:     0.005,  // +0.5% (near max)
  deload:         -0.15,   // −15%
};

function roundToNearestPlate(weight: number): number {
  // Round to nearest 2.5 kg
  return Math.round(weight / 2.5) * 2.5;
}

// Constraint keywords mapped to exercise patterns
// When an active constraint matches a keyword in the exercise name, apply modifier.
const CONSTRAINT_EXERCISE_MAP: Record<string, string[]> = {
  ankle:       ["lunge", "calf", "squat", "step_up", "jump", "plyometric", "box_jump", "single_leg"],
  right_ankle: ["lunge", "calf", "squat", "step_up", "jump", "plyometric", "box_jump", "single_leg"],
  plantar:     ["calf", "jump", "run", "plyometric", "box_jump", "treadmill"],
  glute:       ["bulgarian", "hip_thrust", "glute_bridge", "single_leg_rdl"],
  low_back:    ["deadlift", "good_morning", "jefferson_curl", "bent_over"],
  shoulder:    ["overhead", "ohp", "military", "upright_row", "behind_neck"],
};

function constraintMatchesExercise(constraint: string, exerciseName: string): boolean {
  const lowerExercise = exerciseName.toLowerCase().replace(/\s+/g, "_");
  const keywords = CONSTRAINT_EXERCISE_MAP[constraint.toLowerCase()] ?? [];
  return keywords.some((kw) => lowerExercise.includes(kw));
}

export function runDT03(input: DT03Input): DT03Output {
  const { exerciseName, lastWeight, lastRpe, targetRpe, sets, reps, phase, activeConstraints } = input;

  // Estimate 1RM from last session using Zourdos table
  const lastLoadFactor = getRpeLoadFactor(reps, lastRpe);
  const estimated1RM = lastLoadFactor > 0 ? lastWeight / lastLoadFactor : lastWeight;

  // Calculate target load for today's target RPE
  const targetLoadFactor = getRpeLoadFactor(reps, targetRpe);
  let recommendedWeight = estimated1RM * targetLoadFactor;

  // Apply phase-based progression on top
  const phaseModifier = PHASE_PROGRESSION[phase];
  recommendedWeight = recommendedWeight * (1 + phaseModifier);

  // Apply constraint modifier if exercise matches any active constraint
  let constraintApplied = false;
  const matchedConstraints: string[] = [];

  for (const constraint of activeConstraints) {
    if (constraintMatchesExercise(constraint, exerciseName)) {
      recommendedWeight *= 0.9; // Conservative −10%
      constraintApplied = true;
      matchedConstraints.push(constraint);
    }
  }

  recommendedWeight = roundToNearestPlate(Math.max(0, recommendedWeight));

  const rpeAdjustment = targetRpe - lastRpe;
  const phaseLabel = phase.charAt(0).toUpperCase() + phase.slice(1);

  let rationale = `${phaseLabel} phase: estimated 1RM ${estimated1RM.toFixed(1)}kg. `;
  rationale += `Last session ${lastWeight}kg @RPE ${lastRpe} → target @RPE ${targetRpe} (${rpeAdjustment >= 0 ? "+" : ""}${rpeAdjustment.toFixed(1)}). `;
  rationale += `Phase progression ${(phaseModifier * 100).toFixed(1)}% → ${recommendedWeight}kg.`;

  if (constraintApplied) {
    rationale += ` Conservative −10% applied for active constraints: ${matchedConstraints.join(", ")}.`;
  }

  return {
    recommendedWeight,
    sets,
    reps,
    rationale,
    constraintApplied,
  };
}

// ─── Constraint Guard ────────────────────────────────────────────────────────

export type ConstraintFilterResult = {
  allowed: string[];
  modified: string[];
  excluded: string[];
};

// Exercises flagged with >1 matching constraint keyword → excluded.
// Exercises with exactly 1 matching → modified (allowed with load reduction).
// No match → allowed as-is.
export function filterExercisesForConstraints(
  exercises: string[],
  activeConstraints: string[]
): ConstraintFilterResult {
  if (activeConstraints.length === 0) {
    return { allowed: exercises, modified: [], excluded: [] };
  }

  const allowed: string[] = [];
  const modified: string[] = [];
  const excluded: string[] = [];

  for (const exercise of exercises) {
    const matchCount = activeConstraints.filter((c) =>
      constraintMatchesExercise(c, exercise)
    ).length;

    if (matchCount === 0) {
      allowed.push(exercise);
    } else if (matchCount === 1) {
      modified.push(exercise);
    } else {
      excluded.push(exercise);
    }
  }

  return { allowed, modified, excluded };
}
