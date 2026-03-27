import { expoDb } from "../../lib/database";
import type { PatternDetectionResult, MemoryContext } from "../../types";

interface PerformanceRow {
  exercise_name: string;
  weight: number;
  reps: number;
  rpe: number;
  workout_date: string;
  day_of_week: number;
}

interface SessionGapRow {
  exercise_name: string;
  workout_date: string;
  average_rpe: number;
  total_volume: number;
}

const MIN_OBSERVATIONS = 5;
const MIN_SWAP_COUNT = 3;

function calculateRecencyScore(dateStr: string): number {
  const daysSince = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince < 7) return 1.0;
  if (daysSince < 30) return 0.8;
  if (daysSince < 90) return 0.5;
  return 0.2;
}

function calculateConfidence(
  observations: number,
  successRate: number,
  lastObserved: string,
): number {
  const normalizedObs = Math.min(observations / 10, 1);
  const recency = calculateRecencyScore(lastObserved);
  return Math.min(1.0, 0.3 * normalizedObs + 0.4 * successRate + 0.3 * recency);
}

export function detectPatterns(userId: string): PatternDetectionResult[] {
  const results: PatternDetectionResult[] = [];

  results.push(...detectRpeSweetSpots(userId));
  results.push(...detectLoadProgressionRates(userId));
  results.push(...detectRecoveryPatterns(userId));
  results.push(...detectFatigueIndicators(userId));
  results.push(...detectExercisePreferences(userId));

  return results;
}

function detectRpeSweetSpots(userId: string): PatternDetectionResult[] {
  const results: PatternDetectionResult[] = [];

  const exercises = expoDb.getAllSync<{ exercise_name: string }>(
    `SELECT DISTINCT ep.exercise_name
     FROM exercise_performances ep
     JOIN workouts w ON w.id = ep.workout_id
     WHERE w.user_id = ? AND w.status = 'completed'
     GROUP BY ep.exercise_name
     HAVING COUNT(*) >= ?`,
    [userId, MIN_OBSERVATIONS],
  );

  for (const { exercise_name } of exercises) {
    const rows = expoDb.getAllSync<PerformanceRow>(
      `SELECT ep.exercise_name, sl.weight, sl.reps, sl.rpe, w.date as workout_date,
              CAST(strftime('%w', w.date) AS INTEGER) as day_of_week
       FROM set_logs sl
       JOIN exercise_performances ep ON ep.id = sl.exercise_performance_id
       JOIN workouts w ON w.id = ep.workout_id
       WHERE w.user_id = ? AND ep.exercise_name = ?
         AND sl.type = 'working' AND sl.weight > 0 AND sl.reps > 0 AND sl.rpe > 0
       ORDER BY w.date ASC, sl.set_number ASC`,
      [userId, exercise_name],
    );

    if (rows.length < MIN_OBSERVATIONS) continue;

    // Group by workout date to get session averages
    const sessions: Record<string, { avgRpe: number; avgWeight: number; date: string }> = {};
    const byDate: Record<string, PerformanceRow[]> = {};
    for (const row of rows) {
      if (!byDate[row.workout_date]) byDate[row.workout_date] = [];
      byDate[row.workout_date].push(row);
    }

    for (const date of Object.keys(byDate)) {
      const dateRows = byDate[date];
      const avgRpe = dateRows.reduce((s: number, r: PerformanceRow) => s + r.rpe, 0) / dateRows.length;
      const avgWeight = dateRows.reduce((s: number, r: PerformanceRow) => s + r.weight, 0) / dateRows.length;
      sessions[date] = { avgRpe, avgWeight, date };
    }

    type SessionEntry = { avgRpe: number; avgWeight: number; date: string };
    const sessionList: SessionEntry[] = Object.values(sessions) as SessionEntry[];
    sessionList.sort(
      (a: SessionEntry, b: SessionEntry) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );

    if (sessionList.length < 3) continue;

    // Find RPE range where next session showed weight increase
    let goodRpeSum = 0;
    let goodRpeCount = 0;
    let totalPairs = 0;

    for (let i = 0; i < sessionList.length - 1; i++) {
      const current = sessionList[i];
      const next = sessionList[i + 1];
      totalPairs++;

      if (next.avgWeight > current.avgWeight) {
        goodRpeSum += current.avgRpe;
        goodRpeCount++;
      }
    }

    if (goodRpeCount < 3) continue;

    const optimalRpe = Math.round((goodRpeSum / goodRpeCount) * 2) / 2;
    const successRate = goodRpeCount / totalPairs;
    const lastDate = sessionList[sessionList.length - 1].date;

    results.push({
      type: "pattern",
      description: `${exercise_name}: best progression when RPE stays around ${optimalRpe}`,
      context: { exercise: exercise_name },
      confidence: calculateConfidence(goodRpeCount, successRate, lastDate),
      trigger: `RPE target for ${exercise_name}`,
      action: `Set target RPE to ${optimalRpe}`,
      observations: goodRpeCount,
      successRate,
    });
  }

  return results;
}

function detectLoadProgressionRates(userId: string): PatternDetectionResult[] {
  const results: PatternDetectionResult[] = [];

  const exercises = expoDb.getAllSync<{ exercise_name: string }>(
    `SELECT DISTINCT ep.exercise_name
     FROM exercise_performances ep
     JOIN workouts w ON w.id = ep.workout_id
     WHERE w.user_id = ? AND w.status = 'completed'
     GROUP BY ep.exercise_name
     HAVING COUNT(*) >= ?`,
    [userId, MIN_OBSERVATIONS],
  );

  for (const { exercise_name } of exercises) {
    const rows = expoDb.getAllSync<{ workout_date: string; avg_weight: number; avg_rpe: number }>(
      `SELECT w.date as workout_date,
              AVG(sl.weight) as avg_weight,
              AVG(sl.rpe) as avg_rpe
       FROM set_logs sl
       JOIN exercise_performances ep ON ep.id = sl.exercise_performance_id
       JOIN workouts w ON w.id = ep.workout_id
       WHERE w.user_id = ? AND ep.exercise_name = ?
         AND sl.type = 'working' AND sl.weight > 0
       GROUP BY w.date
       ORDER BY w.date ASC`,
      [userId, exercise_name],
    );

    if (rows.length < MIN_OBSERVATIONS) continue;

    // Calculate progression rates when RPE was in 6-8 range
    const progressions: number[] = [];
    let lastDate = "";

    for (let i = 0; i < rows.length - 1; i++) {
      const current = rows[i];
      const next = rows[i + 1];

      if (current.avg_rpe >= 6 && current.avg_rpe <= 8 && current.avg_weight > 0) {
        const pctChange = (next.avg_weight - current.avg_weight) / current.avg_weight;
        if (pctChange > -0.2 && pctChange < 0.2) {
          progressions.push(pctChange);
          lastDate = next.workout_date;
        }
      }
    }

    if (progressions.length < 3) continue;

    const avgProgression = progressions.reduce((s, p) => s + p, 0) / progressions.length;
    const positiveRate = progressions.filter((p) => p > 0).length / progressions.length;

    if (Math.abs(avgProgression) < 0.001) continue;

    const pctDisplay = (avgProgression * 100).toFixed(1);

    results.push({
      type: "pattern",
      description: `${exercise_name}: avg ${avgProgression > 0 ? "+" : ""}${pctDisplay}% per session when RPE 6-8`,
      context: { exercise: exercise_name },
      confidence: calculateConfidence(progressions.length, positiveRate, lastDate),
      trigger: `Progression rate for ${exercise_name}`,
      action: `Apply ${pctDisplay}% load increase`,
      observations: progressions.length,
      successRate: positiveRate,
    });
  }

  return results;
}

function detectRecoveryPatterns(userId: string): PatternDetectionResult[] {
  const results: PatternDetectionResult[] = [];

  const rows = expoDb.getAllSync<SessionGapRow>(
    `SELECT ep.exercise_name, w.date as workout_date,
            ep.actual_average_rpe as average_rpe,
            SUM(sl.weight * sl.reps) as total_volume
     FROM exercise_performances ep
     JOIN workouts w ON w.id = ep.workout_id
     LEFT JOIN set_logs sl ON sl.exercise_performance_id = ep.id AND sl.type = 'working'
     WHERE w.user_id = ? AND w.status = 'completed'
     GROUP BY ep.exercise_name, w.date
     ORDER BY ep.exercise_name, w.date ASC`,
    [userId],
  );

  // Group by exercise
  const byExercise: Record<string, SessionGapRow[]> = {};
  for (const row of rows) {
    if (!byExercise[row.exercise_name]) byExercise[row.exercise_name] = [];
    byExercise[row.exercise_name].push(row);
  }

  for (const exerciseName of Object.keys(byExercise)) {
    const sessions = byExercise[exerciseName];
    if (sessions.length < MIN_OBSERVATIONS) continue;

    const gapResults: { days: number; improved: boolean }[] = [];

    for (let i = 0; i < sessions.length - 1; i++) {
      const current = sessions[i];
      const next = sessions[i + 1];
      const daysBetween = Math.round(
        (new Date(next.workout_date).getTime() - new Date(current.workout_date).getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (daysBetween > 0 && daysBetween <= 14) {
        gapResults.push({
          days: daysBetween,
          improved: next.total_volume > current.total_volume,
        });
      }
    }

    if (gapResults.length < 3) continue;

    // Find optimal gap (days with highest improvement rate)
    const gapBuckets: Record<number, { count: number; improved: number }> = {};
    for (const g of gapResults) {
      if (!gapBuckets[g.days]) gapBuckets[g.days] = { count: 0, improved: 0 };
      gapBuckets[g.days].count++;
      if (g.improved) gapBuckets[g.days].improved++;
    }

    let bestGap = 0;
    let bestRate = 0;
    let bestCount = 0;

    for (const daysStr of Object.keys(gapBuckets)) {
      const days = Number(daysStr);
      const data = gapBuckets[days];
      if (data.count < 2) continue;
      const rate = data.improved / data.count;
      if (rate > bestRate || (rate === bestRate && data.count > bestCount)) {
        bestGap = days;
        bestRate = rate;
        bestCount = data.count;
      }
    }

    if (bestGap === 0 || bestRate < 0.5) continue;

    const lastDate = sessions[sessions.length - 1].workout_date;
    results.push({
      type: "pattern",
      description: `${exerciseName}: best recovery with ${bestGap}-day spacing (${Math.round(bestRate * 100)}% improved)`,
      context: { exercise: exerciseName },
      confidence: calculateConfidence(bestCount, bestRate, lastDate),
      trigger: `Recovery spacing for ${exerciseName}`,
      action: `Schedule ${bestGap} days between sessions`,
      observations: bestCount,
      successRate: bestRate,
    });
  }

  return results;
}

function detectFatigueIndicators(userId: string): PatternDetectionResult[] {
  const results: PatternDetectionResult[] = [];

  const rows = expoDb.getAllSync<{ day_of_week: number; avg_rpe: number; cnt: number }>(
    `SELECT CAST(strftime('%w', w.date) AS INTEGER) as day_of_week,
            AVG(w.average_rpe) as avg_rpe,
            COUNT(*) as cnt
     FROM workouts w
     WHERE w.user_id = ? AND w.status = 'completed' AND w.average_rpe IS NOT NULL
     GROUP BY day_of_week
     HAVING cnt >= 3`,
    [userId],
  );

  if (rows.length < 3) return results;

  const overallAvg = rows.reduce((s: number, r: { day_of_week: number; avg_rpe: number; cnt: number }) => s + r.avg_rpe * r.cnt, 0) /
    rows.reduce((s: number, r: { day_of_week: number; avg_rpe: number; cnt: number }) => s + r.cnt, 0);

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  for (const row of rows) {
    const deviation = row.avg_rpe - overallAvg;
    if (Math.abs(deviation) < 0.5) continue;

    const dayName = dayNames[row.day_of_week];
    const direction = deviation > 0 ? "higher" : "lower";
    const lastDate = new Date().toISOString();

    results.push({
      type: "warning",
      description: `RPE tends ${Math.abs(deviation).toFixed(1)} points ${direction} on ${dayName}s`,
      context: { dayOfWeek: row.day_of_week },
      confidence: calculateConfidence(row.cnt, deviation > 0 ? 0.3 : 0.7, lastDate),
      trigger: `Workout on ${dayName}`,
      action: deviation > 0
        ? `Consider lighter loads or fewer sets on ${dayName}s`
        : `${dayName}s are strong days — good for heavy work`,
      observations: row.cnt,
      successRate: deviation > 0 ? 0.3 : 0.7,
    });
  }

  return results;
}

function detectExercisePreferences(userId: string): PatternDetectionResult[] {
  const results: PatternDetectionResult[] = [];

  // Detect exercises the user consistently performs vs skips
  // Look at exercises that appear frequently as a preference signal
  const frequentExercises = expoDb.getAllSync<{
    exercise_name: string;
    cnt: number;
    last_date: string;
  }>(
    `SELECT ep.exercise_name, COUNT(*) as cnt, MAX(w.date) as last_date
     FROM exercise_performances ep
     JOIN workouts w ON w.id = ep.workout_id
     WHERE w.user_id = ? AND w.status = 'completed'
     GROUP BY ep.exercise_name
     HAVING cnt >= ?
     ORDER BY cnt DESC
     LIMIT 10`,
    [userId, MIN_SWAP_COUNT],
  );

  // Get total workout count
  const totalRow = expoDb.getFirstSync<{ cnt: number }>(
    `SELECT COUNT(*) as cnt FROM workouts WHERE user_id = ? AND status = 'completed'`,
    [userId],
  );
  const totalWorkouts = totalRow?.cnt ?? 0;
  if (totalWorkouts < MIN_OBSERVATIONS) return results;

  for (const ex of frequentExercises) {
    const frequency = ex.cnt / totalWorkouts;
    if (frequency < 0.3) continue;

    results.push({
      type: "preference",
      description: `Frequently performs ${ex.exercise_name} (${Math.round(frequency * 100)}% of workouts)`,
      context: { exercise: ex.exercise_name },
      confidence: calculateConfidence(ex.cnt, frequency, ex.last_date),
      trigger: `Exercise selection`,
      action: `Prioritize ${ex.exercise_name} in prescriptions`,
      observations: ex.cnt,
      successRate: frequency,
    });
  }

  return results;
}
