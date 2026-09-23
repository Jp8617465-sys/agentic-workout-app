import { expoDb } from "../../../lib/database";

export function countCompletedProgramSessions(
  mesocycleId: string,
  sinceDate: string,
): number {
  const row = expoDb.getFirstSync<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM workouts
     WHERE mesocycle_id = ? AND status = 'completed' AND type != 'mobility' AND date >= ?`,
    [mesocycleId, sinceDate],
  );
  return row?.cnt ?? 0;
}

/** Most recent working-set weight for an exercise, so program sessions pre-fill real loads. */
export function lastWorkingWeight(exerciseName: string): number | null {
  const row = expoDb.getFirstSync<{ weight: number }>(
    `SELECT sl.weight FROM set_logs sl
     JOIN exercise_performances ep ON ep.id = sl.exercise_performance_id
     JOIN workouts w ON w.id = ep.workout_id
     WHERE ep.exercise_name = ? AND w.status = 'completed' AND sl.type = 'working' AND sl.weight > 0
     ORDER BY w.date DESC, sl.set_number DESC
     LIMIT 1`,
    [exerciseName],
  );
  return row?.weight ?? null;
}
