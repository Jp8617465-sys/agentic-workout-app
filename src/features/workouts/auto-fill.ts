import { workoutRepository } from "./workout-repository";

interface AutoFillSet {
  weight: number | null;
  reps: number | null;
  rpe: number | null;
}

function applyLoadReduction(
  weight: number | null,
  loadReductionPercent: number,
): number | null {
  if (weight === null || loadReductionPercent <= 0) return weight;
  return Math.round(weight * (1 - loadReductionPercent) * 100) / 100;
}

export async function autoFillExerciseSets(
  userId: string,
  exerciseName: string,
  loadReductionPercent = 0,
): Promise<AutoFillSet[]> {
  const previousSets = await workoutRepository.findLastWithExercise(
    userId,
    exerciseName,
  );

  if (previousSets.length === 0) return [];

  // All results are from the most recent workout (query orders by date DESC)
  // Take only sets from the first date
  const firstDate = previousSets[0].date;
  return previousSets
    .filter((s) => s.date === firstDate)
    .map((s) => ({
      weight: applyLoadReduction(s.weight, loadReductionPercent),
      reps: s.reps,
      rpe: s.rpe,
    }));
}
