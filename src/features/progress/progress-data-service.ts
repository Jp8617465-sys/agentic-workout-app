import { expoDb } from "../../lib/database";

export interface ChartDataPoint {
  date: string;
  value: number;
}

interface VolumeRow {
  week_start: string;
  total_vol: number;
}

interface PRRow {
  exercise_name: string;
  achieved_at: string;
  estimated_one_rep_max: number;
}

interface RPERow {
  date: string;
  avg_rpe: number;
}

export function getWeeklyVolume(userId: string, weeks: number): ChartDataPoint[] {
  const cutoffDate = new Date(
    Date.now() - weeks * 7 * 24 * 60 * 60 * 1000,
  )
    .toISOString()
    .split("T")[0];

  const rows = expoDb.getAllSync<VolumeRow>(
    `SELECT
       strftime('%Y-%W', date) as week_start,
       SUM(COALESCE(total_volume, 0)) as total_vol
     FROM workouts
     WHERE user_id = ? AND status = 'completed' AND date >= ?
     GROUP BY week_start
     ORDER BY week_start ASC`,
    [userId, cutoffDate],
  );

  return rows.map((r) => ({
    date: r.week_start,
    value: r.total_vol,
  }));
}

export function get1RMTrends(
  userId: string,
  exerciseNames: string[],
): Map<string, ChartDataPoint[]> {
  const result = new Map<string, ChartDataPoint[]>();

  for (const name of exerciseNames) {
    const rows = expoDb.getAllSync<PRRow>(
      `SELECT exercise_name, achieved_at, estimated_one_rep_max
       FROM personal_records
       WHERE user_id = ? AND exercise_name = ?
       ORDER BY achieved_at ASC`,
      [userId, name],
    );

    result.set(
      name,
      rows.map((r) => ({
        date: r.achieved_at,
        value: r.estimated_one_rep_max,
      })),
    );
  }

  return result;
}

export function getRPETrends(userId: string, weeks: number): ChartDataPoint[] {
  const cutoffDate = new Date(
    Date.now() - weeks * 7 * 24 * 60 * 60 * 1000,
  )
    .toISOString()
    .split("T")[0];

  const rows = expoDb.getAllSync<RPERow>(
    `SELECT date, average_rpe as avg_rpe
     FROM workouts
     WHERE user_id = ? AND status = 'completed'
       AND average_rpe IS NOT NULL AND date >= ?
     ORDER BY date ASC`,
    [userId, cutoffDate],
  );

  return rows.map((r) => ({
    date: r.date,
    value: r.avg_rpe,
  }));
}
