import { expoDb } from "../../lib/database";
import { supabase } from "../../lib/supabase";
import { aiCacheRepository } from "../ai/ai-cache-repository";

export type ReportPeriod = "week" | "month" | "mesocycle";

export interface ExerciseVolumeRow {
  exerciseName: string;
  currentVolume: number;
  previousVolume: number;
  deltaPct: number;
}

export interface PeriodStats {
  workoutsCompleted: number;
  workoutsScheduled: number | null;
  adherencePct: number | null;
  totalVolume: number;
  previousVolume: number;
  volumeDeltaPct: number;
  averageRpe: number | null;
  previousAverageRpe: number | null;
  personalRecords: number;
  startDate: string;
  endDate: string;
  exerciseBreakdown: ExerciseVolumeRow[];
}

export interface PeriodReport {
  period: ReportPeriod;
  stats: PeriodStats;
  narrative: string | null;
}

interface WorkoutRow {
  total_volume: number | null;
  average_rpe: number | null;
  date: string;
}

interface ExerciseVolRow {
  exercise_name: string;
  total_vol: number;
}

interface PRCountRow {
  count: number;
}

function dateRangeForPeriod(period: ReportPeriod, userId?: string): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().split("T")[0];

  if (period === "week") {
    const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    return { start, end };
  }

  if (period === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
    return { start, end };
  }

  // mesocycle — current mesocycle start date, or last 12 weeks fallback
  const mesocycleRow = expoDb.getFirstSync<{ start_date: string } | null>(
    `SELECT start_date FROM mesocycles
     WHERE user_id = ? AND status = 'active'
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId ?? ""],
  );

  const start = mesocycleRow?.start_date
    ?? new Date(now.getTime() - 84 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  return { start, end };
}

function prevPeriodRange(current: { start: string; end: string }): { start: string; end: string } {
  const s = new Date(current.start).getTime();
  const e = new Date(current.end).getTime();
  const duration = e - s;
  return {
    start: new Date(s - duration).toISOString().split("T")[0],
    end: current.start,
  };
}

export function buildPeriodStats(userId: string, period: ReportPeriod): PeriodStats {
  const range = dateRangeForPeriod(period, userId);
  const prev = prevPeriodRange(range);

  // Current period workouts
  const workouts = expoDb.getAllSync<WorkoutRow>(
    `SELECT total_volume, average_rpe, date FROM workouts
     WHERE user_id = ? AND status = 'completed' AND date BETWEEN ? AND ?
     ORDER BY date ASC`,
    [userId, range.start, range.end],
  );

  // Previous period workouts
  const prevWorkouts = expoDb.getAllSync<WorkoutRow>(
    `SELECT total_volume, average_rpe FROM workouts
     WHERE user_id = ? AND status = 'completed' AND date BETWEEN ? AND ?`,
    [userId, prev.start, prev.end],
  );

  const totalVolume = workouts.reduce((sum, w) => sum + (w.total_volume ?? 0), 0);
  const previousVolume = prevWorkouts.reduce((sum, w) => sum + (w.total_volume ?? 0), 0);
  const volumeDeltaPct =
    previousVolume > 0 ? Math.round(((totalVolume - previousVolume) / previousVolume) * 100) : 0;

  const rpeValues = workouts.filter((w) => w.average_rpe != null).map((w) => w.average_rpe!);
  const averageRpe =
    rpeValues.length > 0
      ? Math.round((rpeValues.reduce((s, r) => s + r, 0) / rpeValues.length) * 10) / 10
      : null;

  const prevRpeValues = prevWorkouts.filter((w) => w.average_rpe != null).map((w) => w.average_rpe!);
  const previousAverageRpe =
    prevRpeValues.length > 0
      ? Math.round((prevRpeValues.reduce((s, r) => s + r, 0) / prevRpeValues.length) * 10) / 10
      : null;

  // Personal records
  const prRow = expoDb.getFirstSync<PRCountRow>(
    `SELECT COUNT(*) as count FROM personal_records
     WHERE user_id = ? AND achieved_at BETWEEN ? AND ?`,
    [userId, range.start, range.end],
  );
  const personalRecords = prRow?.count ?? 0;

  // Exercise volume breakdown
  const exVol = expoDb.getAllSync<ExerciseVolRow>(
    `SELECT ep.exercise_name, SUM(COALESCE(sl.weight, 0) * COALESCE(sl.reps, 0)) as total_vol
     FROM set_logs sl
     JOIN exercise_performances ep ON sl.exercise_performance_id = ep.id
     JOIN workouts w ON ep.workout_id = w.id
     WHERE w.user_id = ? AND w.status = 'completed' AND w.date BETWEEN ? AND ?
     GROUP BY ep.exercise_name
     ORDER BY total_vol DESC
     LIMIT 8`,
    [userId, range.start, range.end],
  );

  const prevExVol = expoDb.getAllSync<ExerciseVolRow>(
    `SELECT ep.exercise_name, SUM(COALESCE(sl.weight, 0) * COALESCE(sl.reps, 0)) as total_vol
     FROM set_logs sl
     JOIN exercise_performances ep ON sl.exercise_performance_id = ep.id
     JOIN workouts w ON ep.workout_id = w.id
     WHERE w.user_id = ? AND w.status = 'completed' AND w.date BETWEEN ? AND ?
     GROUP BY ep.exercise_name`,
    [userId, prev.start, prev.end],
  );

  const prevExMap = new Map(prevExVol.map((r) => [r.exercise_name, r.total_vol]));

  const exerciseBreakdown: ExerciseVolumeRow[] = exVol.map((r) => {
    const prevVol = prevExMap.get(r.exercise_name) ?? 0;
    const delta = prevVol > 0 ? Math.round(((r.total_vol - prevVol) / prevVol) * 100) : 0;
    return {
      exerciseName: r.exercise_name,
      currentVolume: Math.round(r.total_vol),
      previousVolume: Math.round(prevVol),
      deltaPct: delta,
    };
  });

  return {
    workoutsCompleted: workouts.length,
    workoutsScheduled: null,
    adherencePct: null,
    totalVolume: Math.round(totalVolume),
    previousVolume: Math.round(previousVolume),
    volumeDeltaPct,
    averageRpe,
    previousAverageRpe,
    personalRecords,
    startDate: range.start,
    endDate: range.end,
    exerciseBreakdown,
  };
}

const NARRATIVE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function narrativeCacheKey(userId: string, period: ReportPeriod, startDate: string): string {
  return `period_report:${period}:${startDate}`;
}

export async function getPeriodReport(
  userId: string,
  period: ReportPeriod,
): Promise<PeriodReport> {
  const stats = buildPeriodStats(userId, period);
  const cacheKey = narrativeCacheKey(userId, period, stats.startDate);

  // Try SQLite cache for narrative
  const cachedNarrative = aiCacheRepository.get(userId, cacheKey);
  if (cachedNarrative) {
    return { period, stats, narrative: cachedNarrative };
  }

  // Try AI narrative (non-blocking, return without if unavailable)
  let narrative: string | null = null;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (token) {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 12_000);

      const { data, error } = await supabase.functions.invoke("ai-coach", {
        body: {
          mode: "period_report",
          userId,
          stats: {
            period,
            workoutsCompleted: stats.workoutsCompleted,
            totalVolume: stats.totalVolume,
            volumeDeltaPct: stats.volumeDeltaPct,
            averageRpe: stats.averageRpe,
            personalRecords: stats.personalRecords,
            startDate: stats.startDate,
            endDate: stats.endDate,
          },
        },
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      if (!error) {
        narrative = (data as { narrative?: string })?.narrative ?? null;
        if (narrative) {
          aiCacheRepository.set(userId, cacheKey, narrative, NARRATIVE_TTL_MS);
        }
      }
    }
  } catch {
    // narrative stays null — stats are still shown
  }

  return { period, stats, narrative };
}
