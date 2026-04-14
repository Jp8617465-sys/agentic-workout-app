import { expoDb } from "../../../lib/database";
import { memoryRepository, type AgenticMemory } from "./memory-repository";

interface SetLogRow {
  exercise_name: string;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  workout_date: string;
  day_of_week: number; // 0=Sunday
}

interface RpeVolumeRow {
  exercise_name: string;
  avg_rpe: number;
  total_vol: number;
  workout_date: string;
  day_of_week: number;
}

/**
 * Derive the confidence score from observation count and success rate.
 * Confidence grows toward 1.0 as observations accumulate.
 */
function deriveConfidence(observations: number, successRate = 1.0): number {
  // Sigmoid-like ramp: 3 obs → ~0.3, 10 obs → ~1.0
  const rawConf = Math.min(1.0, observations / 10.0);
  return Math.round(rawConf * successRate * 100) / 100;
}

/**
 * Run pattern detection after a workout completes.
 * Reads workout history, identifies patterns, upserts to agentic_memories.
 */
export async function runPatternDetection(userId: string): Promise<AgenticMemory[]> {
  const detected: AgenticMemory[] = [];

  try {
    detected.push(...detectOptimalRpeRanges(userId));
    detected.push(...detectDayOfWeekFatigue(userId));
    detected.push(...detectProgressionSweetSpots(userId));
  } catch {
    // Pattern detection is non-blocking — failures are silent
  }

  return detected;
}

/**
 * Detect optimal RPE ranges per exercise.
 * Pattern: "When RPE stays in 6.5–7.5 for Squat, volume increases the following week."
 */
function detectOptimalRpeRanges(userId: string): AgenticMemory[] {
  const memories: AgenticMemory[] = [];

  const rows = expoDb.getAllSync<RpeVolumeRow>(
    `SELECT ep.exercise_name,
            AVG(sl.rpe) as avg_rpe,
            SUM(COALESCE(sl.weight, 0) * COALESCE(sl.reps, 0)) as total_vol,
            w.date as workout_date,
            CAST(strftime('%w', w.date) AS INTEGER) as day_of_week
     FROM set_logs sl
     JOIN exercise_performances ep ON sl.exercise_performance_id = ep.id
     JOIN workouts w ON ep.workout_id = w.id
     WHERE w.user_id = ?
       AND w.status = 'completed'
       AND sl.rpe IS NOT NULL
       AND sl.rpe > 0
     GROUP BY ep.exercise_name, w.id
     ORDER BY ep.exercise_name, w.date ASC`,
    [userId],
  );

  // Group by exercise
  const byExercise = new Map<string, RpeVolumeRow[]>();
  for (const row of rows) {
    const arr = byExercise.get(row.exercise_name) ?? [];
    arr.push(row);
    byExercise.set(row.exercise_name, arr);
  }

  for (const [exercise, sessions] of byExercise.entries()) {
    if (sessions.length < 4) continue; // Need at least 4 sessions to detect pattern

    // Find the RPE range that correlates with highest next-session volume
    const moderate = sessions.filter((s) => s.avg_rpe >= 6.0 && s.avg_rpe <= 7.5);
    if (moderate.length < 2) continue;

    const avgVolMod = moderate.reduce((s, r) => s + r.total_vol, 0) / moderate.length;
    const allAvgVol = sessions.reduce((s, r) => s + r.total_vol, 0) / sessions.length;

    if (avgVolMod > allAvgVol * 1.05) {
      // Moderate RPE sessions outperform average — pattern found
      const mem = memoryRepository.upsert({
        userId,
        type: "optimal_rpe_range",
        exercise,
        description: `${exercise}: best volume gains when RPE stays 6.0–7.5`,
        context: {
          optimalRpeLow: 6.0,
          optimalRpeHigh: 7.5,
          avgVolAtOptimal: Math.round(avgVolMod),
          overallAvgVol: Math.round(allAvgVol),
          samplesAnalyzed: sessions.length,
        },
        trigger: `About to prescribe ${exercise}`,
        action: "Keep RPE target in 6.0–7.5 range",
        observations: moderate.length,
        successRate: 1.0,
        confidence: deriveConfidence(moderate.length),
        lastObserved: sessions[sessions.length - 1].workout_date,
        reinforced: 0,
        appliedSuccessfully: 0,
        appliedUnsuccessfully: 0,
        lastApplied: null,
      });
      memories.push(mem);
    }
  }

  return memories;
}

/**
 * Detect day-of-week fatigue patterns.
 * Pattern: "Monday sessions have lower RPE than Friday sessions."
 */
function detectDayOfWeekFatigue(userId: string): AgenticMemory[] {
  const rows = expoDb.getAllSync<{ day_of_week: number; avg_rpe: number; session_count: number }>(
    `SELECT CAST(strftime('%w', w.date) AS INTEGER) as day_of_week,
            AVG(sl.rpe) as avg_rpe,
            COUNT(DISTINCT w.id) as session_count
     FROM set_logs sl
     JOIN exercise_performances ep ON sl.exercise_performance_id = ep.id
     JOIN workouts w ON ep.workout_id = w.id
     WHERE w.user_id = ?
       AND w.status = 'completed'
       AND sl.rpe IS NOT NULL
       AND sl.rpe > 0
     GROUP BY day_of_week
     HAVING session_count >= 3`,
    [userId],
  );

  if (rows.length < 2) return [];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const sorted = [...rows].sort((a, b) => a.avg_rpe - b.avg_rpe);
  const easiest = sorted[0];
  const hardest = sorted[sorted.length - 1];

  if (hardest.avg_rpe - easiest.avg_rpe < 0.5) return []; // Negligible difference

  const totalSessions = rows.reduce((s, r) => s + r.session_count, 0);

  const mem = memoryRepository.upsert({
    userId,
    type: "day_of_week_fatigue",
    exercise: null,
    description: `${dayNames[easiest.day_of_week]} feels easiest (avg RPE ${easiest.avg_rpe.toFixed(1)}), ${dayNames[hardest.day_of_week]} hardest (${hardest.avg_rpe.toFixed(1)})`,
    context: {
      easiestDay: easiest.day_of_week,
      hardestDay: hardest.day_of_week,
      easiestAvgRpe: easiest.avg_rpe,
      hardestAvgRpe: hardest.avg_rpe,
      dayData: rows,
    },
    trigger: "Scheduling next session",
    action: `Prefer heavy sets on ${dayNames[easiest.day_of_week]}, deload/active recovery on ${dayNames[hardest.day_of_week]}`,
    observations: totalSessions,
    successRate: 1.0,
    confidence: deriveConfidence(totalSessions),
    lastObserved: new Date().toISOString().split("T")[0],
    reinforced: 0,
    appliedSuccessfully: 0,
    appliedUnsuccessfully: 0,
    lastApplied: null,
  });

  return [mem];
}

/**
 * Detect progression sweet spots — the weekly load increase % that correlates with PRs.
 * Pattern: "2.5% weekly load increase leads to PRs without RPE spikes."
 */
function detectProgressionSweetSpots(userId: string): AgenticMemory[] {
  const memories: AgenticMemory[] = [];

  const rows = expoDb.getAllSync<{
    exercise_name: string;
    avg_weight: number;
    workout_date: string;
    pr_count: number;
  }>(
    `SELECT ep.exercise_name,
            AVG(sl.weight) as avg_weight,
            w.date as workout_date,
            COUNT(DISTINCT pr.id) as pr_count
     FROM set_logs sl
     JOIN exercise_performances ep ON sl.exercise_performance_id = ep.id
     JOIN workouts w ON ep.workout_id = w.id
     LEFT JOIN personal_records pr ON pr.exercise_name = ep.exercise_name
                                   AND pr.workout_id = w.id
     WHERE w.user_id = ?
       AND w.status = 'completed'
       AND sl.weight IS NOT NULL
     GROUP BY ep.exercise_name, w.id
     ORDER BY ep.exercise_name, w.date ASC`,
    [userId],
  );

  // Group by exercise
  const byExercise = new Map<string, typeof rows>();
  for (const row of rows) {
    const arr = byExercise.get(row.exercise_name) ?? [];
    arr.push(row);
    byExercise.set(row.exercise_name, arr);
  }

  for (const [exercise, sessions] of byExercise.entries()) {
    if (sessions.length < 6) continue;

    // Calculate week-over-week load increases
    const increases: number[] = [];
    for (let i = 1; i < sessions.length; i++) {
      const prev = sessions[i - 1].avg_weight;
      const curr = sessions[i].avg_weight;
      if (prev > 0) {
        increases.push(((curr - prev) / prev) * 100);
      }
    }

    if (increases.length < 4) continue;

    const avgIncrease = increases.reduce((s, v) => s + v, 0) / increases.length;
    const prSessions = sessions.filter((s) => s.pr_count > 0).length;

    if (prSessions > 0 && Math.abs(avgIncrease) > 0.5) {
      const mem = memoryRepository.upsert({
        userId,
        type: "progression_sweet_spot",
        exercise,
        description: `${exercise}: ~${avgIncrease.toFixed(1)}% load increase per session, ${prSessions} PRs from ${sessions.length} sessions`,
        context: {
          avgWeeklyIncreasePercent: avgIncrease,
          prSessions,
          totalSessions: sessions.length,
          prRate: prSessions / sessions.length,
        },
        trigger: `Calculating progression for ${exercise}`,
        action: `Target ~${avgIncrease.toFixed(1)}% load increase per session`,
        observations: sessions.length,
        successRate: prSessions / sessions.length,
        confidence: deriveConfidence(sessions.length, prSessions / sessions.length),
        lastObserved: sessions[sessions.length - 1].workout_date,
        reinforced: 0,
        appliedSuccessfully: 0,
        appliedUnsuccessfully: 0,
        lastApplied: null,
      });
      memories.push(mem);
    }
  }

  return memories;
}
