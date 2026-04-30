import {
  getActiveProtocol,
  createProtocol,
  advancePhase,
  isProgressionDue,
} from "./rehab-protocol-repository";
import type { RehabExercise, ProgressionStatus } from "./types";

const PHASE_1_EXERCISES: RehabExercise[] = [
  {
    name: "Banded three-way sweep",
    sets: 3,
    reps: 15,
    notes: "Big toe curl, sweep out, sweep in",
  },
  {
    name: "Big toe hold",
    duration: "45s",
    notes: "Maintain steady pressure through big toe",
  },
  {
    name: "Single-leg calf raise (80% height)",
    sets: 3,
    duration: "30s building to 45s",
    notes: "Pressure on big toe, controlled tempo",
  },
  {
    name: "Single-leg balance with ball throws",
    sets: 3,
    reps: 30,
    notes: "30 throws per set, maintain stable ankle",
  },
];

const PHASE_2_EXERCISES: RehabExercise[] = [
  {
    name: "Sweep (extended leg)",
    sets: 3,
    reps: 15,
    notes: "Longer and straighter leg position",
  },
  {
    name: "Ball throws on foam/towel",
    sets: 3,
    reps: 30,
    notes: "Unstable surface for proprioception challenge",
  },
  {
    name: "Internal sweep with foot up",
    sets: 3,
    reps: 15,
    notes: "Foot elevated, sweep inward with control",
  },
  {
    name: "Reverse Nordic with power band",
    sets: 3,
    reps: 6,
    notes: "Hips forward, band-assisted eccentric control",
  },
  {
    name: "90/90 stretches and hip mobility",
    sets: 3,
    duration: "30s per side",
    notes: "Progressive hip mobility, hold end range",
  },
];

function getExercisesForPhase(phase: number): RehabExercise[] {
  if (phase === 1) {
    return PHASE_1_EXERCISES;
  }
  return PHASE_2_EXERCISES;
}

export function getSessionPrehab(userId: string): RehabExercise[] {
  const protocol = getActiveProtocol(userId);

  if (!protocol) {
    return [];
  }

  return getExercisesForPhase(protocol.currentPhase);
}

export function checkAndPromptProgression(
  userId: string,
): ProgressionStatus {
  const protocol = getActiveProtocol(userId);

  if (!protocol) {
    return { isDue: false, currentPhase: 0, daysRemaining: 0 };
  }

  const isDue = isProgressionDue(protocol.id);

  let daysRemaining = 0;
  if (!isDue) {
    const today = new Date();
    const eligible = new Date(protocol.progressionEligibleDate);
    daysRemaining = Math.max(
      0,
      Math.ceil(
        (eligible.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );
  }

  return {
    isDue,
    currentPhase: protocol.currentPhase,
    daysRemaining,
  };
}

export function confirmProgression(userId: string): void {
  const protocol = getActiveProtocol(userId);

  if (!protocol) {
    return;
  }

  advancePhase(protocol.id);
}

export function ensureProtocolExists(
  userId: string,
  protocolName: string,
): void {
  const existing = getActiveProtocol(userId);
  if (!existing) {
    createProtocol(userId, protocolName);
  }
}
