import { workoutRepository } from "./workout-repository";

interface AutoFillSet {
  weight: number | null;
  reps: number | null;
  rpe: number | null;
}

export async function autoFillExerciseSets(
  userId: string,
  exerciseId: string,
): Promise<AutoFillSet[]> {
  const previousSets = await workoutRepository.findLastWithExercise(
    userId,
    exerciseId,
  );

  if (previousSets.length === 0) return [];

  // All results are from the most recent workout (query orders by date DESC)
  // Take only sets from the first date
  const firstDate = previousSets[0].date;
  return previousSets
    .filter((s) => s.date === firstDate)
    .map((s) => ({
      weight: s.weight,
      reps: s.reps,
      rpe: s.rpe,
    }));
}
