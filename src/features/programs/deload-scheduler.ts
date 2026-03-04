import type { Microcycle, PeriodizationModel, MesocyclePhase } from "../../types";
import { generateId } from "../../lib/uuid";
import type { InsertMicrocycleData } from "./microcycle-repository";

export function shouldInsertDeload(
  microcycles: Microcycle[],
  periodizationModel: PeriodizationModel,
  fatigueIndex?: number,
): boolean {
  const completedWeeks = microcycles.filter((mc) => mc.status === "completed");
  const lastDeload = [...completedWeeks]
    .reverse()
    .find((mc) => mc.phase === "deload");

  const weeksSinceDeload = lastDeload
    ? completedWeeks.length - completedWeeks.indexOf(lastDeload)
    : completedWeeks.length;

  switch (periodizationModel) {
    case "linear":
      return weeksSinceDeload >= 4;
    case "block": {
      // Deload after each phase transition
      if (completedWeeks.length < 2) return false;
      const last = completedWeeks[completedWeeks.length - 1];
      const secondLast = completedWeeks[completedWeeks.length - 2];
      return last.phase !== secondLast.phase && last.phase !== "deload";
    }
    case "dup":
      // Fatigue-based: deload when fatigue index exceeds 70%
      return (fatigueIndex ?? 0) > 70;
    case "conjugate":
      return weeksSinceDeload >= 3;
    default:
      return weeksSinceDeload >= 4;
  }
}

export function createDeloadWeek(
  mesocycleId: string,
  weekNumber: number,
  previousMicrocycle?: Microcycle,
): InsertMicrocycleData {
  return {
    mesocycleId,
    weekNumber,
    phase: "deload" as MesocyclePhase,
    targetVolume: previousMicrocycle?.targetVolume
      ? previousMicrocycle.targetVolume * 0.5
      : null,
    targetIntensity: previousMicrocycle?.targetIntensity
      ? previousMicrocycle.targetIntensity * 0.6
      : null,
    targetFrequency: previousMicrocycle?.targetFrequency ?? null,
  };
}
