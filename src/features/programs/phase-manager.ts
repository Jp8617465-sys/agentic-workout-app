import type { MesocyclePhase, PeriodizationModel, Mesocycle, Microcycle } from "../../types";
import { microcycleRepository } from "./microcycle-repository";

export interface PhaseTargets {
  volumeMultiplier: number;
  intensityRange: [number, number];
  rpeRange: [number, number];
}

export interface PhaseTransitionResult {
  fromPhase: MesocyclePhase;
  toPhase: MesocyclePhase;
  weekNumber: number;
  targets: PhaseTargets;
}

const PHASE_TARGETS: Record<MesocyclePhase, PhaseTargets> = {
  accumulation: {
    volumeMultiplier: 1.0,
    intensityRange: [0.65, 0.75],
    rpeRange: [6, 7],
  },
  intensification: {
    volumeMultiplier: 0.85,
    intensityRange: [0.75, 0.85],
    rpeRange: [7.5, 8.5],
  },
  realization: {
    volumeMultiplier: 0.7,
    intensityRange: [0.85, 0.95],
    rpeRange: [8.5, 9.5],
  },
  deload: {
    volumeMultiplier: 0.5,
    intensityRange: [0.5, 0.65],
    rpeRange: [5, 6],
  },
};

export function getPhaseTargets(
  phase: MesocyclePhase,
  _model: PeriodizationModel,
): PhaseTargets {
  return PHASE_TARGETS[phase];
}

export function detectPhaseTransition(
  mesocycle: Mesocycle,
  currentWeek: number,
  microcycles: Microcycle[],
): PhaseTransitionResult | null {
  const currentMc = microcycles.find((mc) => mc.weekNumber === currentWeek);
  const previousMc = microcycles.find((mc) => mc.weekNumber === currentWeek - 1);

  if (!currentMc) return null;
  if (!previousMc) return null;
  if (currentMc.phase === previousMc.phase) return null;

  return {
    fromPhase: previousMc.phase,
    toPhase: currentMc.phase,
    weekNumber: currentWeek,
    targets: getPhaseTargets(currentMc.phase, mesocycle.periodizationModel),
  };
}

export function applyPhaseTransition(
  mesocycleId: string,
  transition: PhaseTransitionResult,
): void {
  const microcycles = microcycleRepository.findByMesocycle(mesocycleId);

  // Mark previous week as completed
  const previousMc = microcycles.find((mc) => mc.weekNumber === transition.weekNumber - 1);
  if (previousMc && previousMc.status !== "completed") {
    microcycleRepository.updateStatus(previousMc.id, "completed");
  }

  // Mark current week as active
  const currentMc = microcycles.find((mc) => mc.weekNumber === transition.weekNumber);
  if (currentMc && currentMc.status === "pending") {
    microcycleRepository.updateStatus(currentMc.id, "active");
  }
}
