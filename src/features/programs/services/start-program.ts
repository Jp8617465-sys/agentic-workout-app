import { mesocycleRepository } from "../mesocycle-repository";
import { microcycleRepository } from "../microcycle-repository";
import { ensureLocalUser } from "../../profile/services/local-user";
import { useMesocycleStore } from "../../../stores/mesocycleStore";
import type {
  GeneratedMesocyclePlan,
  PeriodizationModel,
} from "../../../types";

function toLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Persists a plan as the active mesocycle and loads it into the store. Any program
 * that is still active is abandoned first so there is only ever one active block.
 */
export function startProgram(
  plan: GeneratedMesocyclePlan,
  options: {
    model?: PeriodizationModel;
    goal?: string;
    weeklyFrequency?: number;
  } = {},
): string {
  const userId = ensureLocalUser();

  const existing = mesocycleRepository.findActive(userId);
  if (existing) mesocycleRepository.abandon(existing.id);

  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + plan.durationWeeks * 7 - 1);

  const mesocycleId = mesocycleRepository.insert({
    userId,
    name: plan.name,
    periodizationModel: options.model ?? plan.periodizationModel,
    startDate: toLocalDate(start),
    endDate: toLocalDate(end),
    durationWeeks: plan.durationWeeks,
    goal: options.goal ?? plan.goal,
    generatedPlan: plan,
  });

  microcycleRepository.insertBatch(
    mesocycleId,
    plan.weeks.map((week) => ({
      mesocycleId,
      weekNumber: week.weekNumber,
      phase: week.phase,
      targetVolume: null,
      targetIntensity: null,
      targetFrequency: options.weeklyFrequency ?? week.sessions.length,
    })),
  );

  const mesocycle = mesocycleRepository.findById(mesocycleId);
  if (mesocycle) {
    useMesocycleStore
      .getState()
      .setCurrentMesocycle(
        mesocycle,
        microcycleRepository.findByMesocycle(mesocycleId),
      );
  }
  return mesocycleId;
}
