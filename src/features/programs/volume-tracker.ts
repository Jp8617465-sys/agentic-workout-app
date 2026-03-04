import { expoDb } from "../../lib/database";

export interface VolumeByMuscleGroup {
  muscleGroup: string;
  totalVolume: number;
}

export interface VolumeComparison {
  muscleGroup: string;
  actualVolume: number;
  targetVolume: number;
  percentOfTarget: number;
  isOverreaching: boolean;
}

interface VolumeRow {
  exercise_name: string;
  muscle_groups: string;
  set_volume: number;
}

export function getWeeklyVolumeByMuscleGroup(
  userId: string,
  weekStartDate: string,
): Map<string, number> {
  const weekEndDate = new Date(
    new Date(weekStartDate).getTime() + 7 * 24 * 60 * 60 * 1000,
  )
    .toISOString()
    .split("T")[0];

  const rows = expoDb.getAllSync<VolumeRow>(
    `SELECT e.name as exercise_name, e.muscle_groups,
            COALESCE(sl.weight, 0) * COALESCE(sl.reps, 0) as set_volume
     FROM set_logs sl
     JOIN exercise_performances ep ON sl.exercise_performance_id = ep.id
     JOIN workouts w ON ep.workout_id = w.id
     JOIN exercises e ON ep.exercise_name = e.name
     WHERE w.user_id = ? AND w.status = 'completed'
       AND w.date >= ? AND w.date < ?
       AND sl.type = 'working'`,
    [userId, weekStartDate, weekEndDate],
  );

  const volumeMap = new Map<string, number>();

  for (const row of rows) {
    const muscleGroups: string[] = JSON.parse(row.muscle_groups || "[]");
    const volumePerGroup = row.set_volume / Math.max(muscleGroups.length, 1);

    for (const mg of muscleGroups) {
      volumeMap.set(mg, (volumeMap.get(mg) ?? 0) + volumePerGroup);
    }
  }

  return volumeMap;
}

export function compareVolumeToTarget(
  actual: Map<string, number>,
  targetPerGroup: number,
): VolumeComparison[] {
  const comparisons: VolumeComparison[] = [];

  for (const [muscleGroup, actualVolume] of actual) {
    const percentOfTarget = targetPerGroup > 0
      ? (actualVolume / targetPerGroup) * 100
      : 0;

    comparisons.push({
      muscleGroup,
      actualVolume,
      targetVolume: targetPerGroup,
      percentOfTarget,
      isOverreaching: percentOfTarget > 120,
    });
  }

  return comparisons.sort((a, b) => b.percentOfTarget - a.percentOfTarget);
}

export function detectOverreach(comparisons: VolumeComparison[]): boolean {
  const overreachingCount = comparisons.filter((c) => c.isOverreaching).length;
  return overreachingCount > 2;
}
