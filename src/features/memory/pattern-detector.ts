import { expoDb } from "../../lib/database";
import type { NewMemoryInput } from "../../types/memory";

export interface DetectedPatterns {
  memories: NewMemoryInput[];
}

type RpeRow = {
  exercise_name: string;
  avg_rpe: number;
  session_count: number;
};

type WeeklyRpeRow = {
  week_key: string;
  avg_rpe: number;
};

type ExerciseFreqRow = {
  exercise_name: string;
  workout_count: number;
};

type WorkoutGapRow = {
  date: string;
};

export function detectPatterns(
  userId: string,
  lookbackDays: number = 60,
): DetectedPatterns {
  const memories: NewMemoryInput[] = [];
  const cutoff = new Date(
    Date.now() - lookbackDays * 24 * 60 * 60 * 1000,
  ).toISOString();

  detectRpeRanges(userId, cutoff, memories);
  detectFatigueTrend(userId, cutoff, memories);
  detectExercisePreferences(userId, cutoff, memories);
  detectRecoveryTimeline(userId, cutoff, memories);

  return { memories };
}

function detectRpeRanges(
  userId: string,
  cutoff: string,
  memories: NewMemoryInput[],
): void {
  const rows = expoDb.getAllSync<RpeRow>(
    `SELECT ep.exercise_name,
            AVG(sl.rpe) as avg_rpe,
            COUNT(DISTINCT w.id) as session_count
     FROM set_logs sl
     JOIN exercise_performances ep ON sl.exercise_performance_id = ep.id
     JOIN workouts w ON ep.workout_id = w.id
     WHERE w.user_id = ? AND w.status = 'completed'
       AND w.date >= ? AND sl.rpe IS NOT NULL AND sl.type = 'working'
     GROUP BY ep.exercise_name
     HAVING session_count >= 3`,
    [userId, cutoff],
  );

  for (const row of rows) {
    const avgRpe = Math.round(row.avg_rpe * 10) / 10;
    memories.push({
      userId,
      type: "pattern",
      description: `Average working RPE for ${row.exercise_name} is ${avgRpe} across ${row.session_count} sessions`,
      context: { exerciseName: row.exercise_name, avgRpe },
      trigger: `${row.exercise_name} performance`,
      action: `Target RPE around ${avgRpe}`,
    });
  }
}

function detectFatigueTrend(
  userId: string,
  cutoff: string,
  memories: NewMemoryInput[],
): void {
  const rows = expoDb.getAllSync<WeeklyRpeRow>(
    `SELECT strftime('%Y-%W', w.date) as week_key,
            AVG(sl.rpe) as avg_rpe
     FROM set_logs sl
     JOIN exercise_performances ep ON sl.exercise_performance_id = ep.id
     JOIN workouts w ON ep.workout_id = w.id
     WHERE w.user_id = ? AND w.status = 'completed'
       AND w.date >= ? AND sl.rpe IS NOT NULL AND sl.type = 'working'
     GROUP BY week_key
     ORDER BY week_key ASC`,
    [userId, cutoff],
  );

  if (rows.length < 4) return;

  const recent2 = rows.slice(-2);
  const prior2 = rows.slice(-4, -2);

  const recentAvg =
    recent2.reduce((s, r) => s + r.avg_rpe, 0) / recent2.length;
  const priorAvg =
    prior2.reduce((s, r) => s + r.avg_rpe, 0) / prior2.length;

  if (recentAvg - priorAvg > 0.5) {
    memories.push({
      userId,
      type: "warning",
      description: `Fatigue trend detected: average RPE increased from ${Math.round(priorAvg * 10) / 10} to ${Math.round(recentAvg * 10) / 10} over recent weeks`,
      context: { priorAvg, recentAvg, weekCount: rows.length },
      trigger: "Weekly RPE trend analysis",
      action: "Consider a deload or reduced volume",
    });
  }
}

function detectExercisePreferences(
  userId: string,
  cutoff: string,
  memories: NewMemoryInput[],
): void {
  const totalResult = expoDb.getFirstSync<{ cnt: number }>(
    `SELECT COUNT(DISTINCT id) as cnt FROM workouts
     WHERE user_id = ? AND status = 'completed' AND date >= ?`,
    [userId, cutoff],
  );
  const totalWorkouts = totalResult?.cnt ?? 0;
  if (totalWorkouts < 3) return;

  const rows = expoDb.getAllSync<ExerciseFreqRow>(
    `SELECT ep.exercise_name,
            COUNT(DISTINCT w.id) as workout_count
     FROM exercise_performances ep
     JOIN workouts w ON ep.workout_id = w.id
     WHERE w.user_id = ? AND w.status = 'completed' AND w.date >= ?
     GROUP BY ep.exercise_name
     ORDER BY workout_count DESC`,
    [userId, cutoff],
  );

  for (const row of rows) {
    const rate = row.workout_count / totalWorkouts;
    if (rate > 0.6) {
      memories.push({
        userId,
        type: "preference",
        description: `Frequently performs ${row.exercise_name} (${Math.round(rate * 100)}% of workouts)`,
        context: {
          exerciseName: row.exercise_name,
          appearanceRate: Math.round(rate * 100) / 100,
          workoutCount: row.workout_count,
        },
        trigger: "Exercise frequency analysis",
        action: `Prioritize ${row.exercise_name} in prescriptions`,
      });
    }
  }
}

function detectRecoveryTimeline(
  userId: string,
  cutoff: string,
  memories: NewMemoryInput[],
): void {
  const rows = expoDb.getAllSync<WorkoutGapRow>(
    `SELECT date FROM workouts
     WHERE user_id = ? AND status = 'completed' AND date >= ?
     ORDER BY date ASC`,
    [userId, cutoff],
  );

  if (rows.length < 3) return;

  const gaps: number[] = [];
  for (let i = 1; i < rows.length; i++) {
    const prev = new Date(rows[i - 1].date).getTime();
    const curr = new Date(rows[i].date).getTime();
    const daysDiff = (curr - prev) / (1000 * 60 * 60 * 24);
    if (daysDiff > 0 && daysDiff < 14) {
      gaps.push(daysDiff);
    }
  }

  if (gaps.length < 3) return;

  gaps.sort((a, b) => a - b);
  const medianGap =
    gaps.length % 2 === 0
      ? (gaps[gaps.length / 2 - 1] + gaps[gaps.length / 2]) / 2
      : gaps[Math.floor(gaps.length / 2)];

  const roundedGap = Math.round(medianGap * 10) / 10;

  memories.push({
    userId,
    type: "pattern",
    description: `Typical recovery between workouts is ${roundedGap} days (median across ${gaps.length} gaps)`,
    context: { medianRecoveryDays: roundedGap, gapCount: gaps.length },
    trigger: "Workout frequency analysis",
    action: `Schedule workouts ~${roundedGap} days apart`,
  });
}
