import { expoDb } from "../../lib/database";
import { computeFitnessFatigue, type TrainingLoadEntry } from "../workouts/fitness-fatigue-model";
import { calculateNextLoad, shouldDeload } from "../workouts/progression-calculator";
import type { ExperienceLevel } from "../../types";

export interface ExercisePrescription {
  exerciseId: string;
  sets: number;
  reps: number;
  weight: number;
  rpe: number;
  progressionType: "weight" | "reps" | "deload" | "maintain";
}

export interface DailyPrescription {
  exercises: ExercisePrescription[];
  performanceScore: number; // Banister score — positive = ready
  deloadRecommended: boolean;
  deloadReason: string | null;
  generatedAt: string;
  source: "deterministic" | "ai" | "mesocycle";
}

interface RecentSetRow {
  exercise_id: string;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
}

interface WorkoutLoadRow {
  date: string;
  total_volume: number | null;
  average_rpe: number | null;
}

export function getDeterministicPrescription(
  userId: string,
  experienceLevel: ExperienceLevel,
): DailyPrescription {
  const today = new Date().toISOString().split("T")[0];

  // --- Banister fitness-fatigue ---
  const loadRows = expoDb.getAllSync<WorkoutLoadRow>(
    `SELECT w.date, w.total_volume, w.average_rpe
     FROM workouts w
     WHERE w.user_id = ? AND w.status = 'completed'
       AND w.date >= date(?, '-135 days')
     ORDER BY w.date ASC`,
    [userId, today],
  );

  const history: TrainingLoadEntry[] = loadRows
    .filter((r) => r.total_volume !== null)
    .map((r) => ({
      date: r.date,
      totalVolume: r.total_volume ?? 0,
      averageRpe: r.average_rpe ?? 7,
    }));

  const { performanceScore, fatigue } = computeFitnessFatigue(history, today);
  const fatigueIndex = (fatigue / (fatigue + 1)) * 100; // normalise to 0-100

  // --- Deload check ---
  const recentSessions = loadRows.slice(-3).map((r) => ({
    date: r.date,
    averageRpe: r.average_rpe ?? 0,
    totalVolume: r.total_volume ?? 0,
  }));
  const deloadResult = shouldDeload(recentSessions, fatigueIndex);

  // --- Per-exercise prescription ---
  const recentExercisesRows = expoDb.getAllSync<{ exercise_id: string }>(
    `SELECT DISTINCT ep.exercise_id
     FROM exercise_performances ep
     JOIN workouts w ON w.id = ep.workout_id
     WHERE w.user_id = ? AND w.status = 'completed'
     ORDER BY w.date DESC
     LIMIT 20`,
    [userId],
  );

  const exercises: ExercisePrescription[] = [];
  const seen = new Set<string>();

  for (const { exercise_id } of recentExercisesRows) {
    if (seen.has(exercise_id)) continue;
    seen.add(exercise_id);

    const lastSets = expoDb.getAllSync<RecentSetRow>(
      `SELECT ep.exercise_id, sl.weight, sl.reps, sl.rpe
       FROM set_logs sl
       JOIN exercise_performances ep ON ep.id = sl.exercise_performance_id
       JOIN workouts w ON w.id = ep.workout_id
       WHERE w.user_id = ? AND ep.exercise_id = ?
         AND sl.type = 'working' AND sl.weight > 0 AND sl.reps > 0
       ORDER BY w.date DESC, sl.set_number DESC
       LIMIT 3`,
      [userId, exercise_id],
    );

    if (lastSets.length === 0) continue;

    const lastSet = lastSets[0];
    if (!lastSet.weight || !lastSet.reps) continue;

    const lastRpe = lastSet.rpe ?? 7.5;
    const targetRpe = 7.5;
    const targetReps = lastSet.reps;

    let nextLoad = calculateNextLoad(
      lastSet.weight,
      lastSet.reps,
      lastRpe,
      targetRpe,
      targetReps,
      experienceLevel,
    );

    if (deloadResult.shouldDeload && nextLoad.progressionType !== "deload") {
      nextLoad = {
        ...nextLoad,
        weight: Math.round(nextLoad.weight * (1 - deloadResult.suggestedWeightReduction) * 2) / 2,
        progressionType: "deload",
      };
    }

    exercises.push({
      exerciseId: exercise_id,
      sets: 3,
      reps: nextLoad.reps,
      weight: nextLoad.weight,
      rpe: nextLoad.rpe,
      progressionType: nextLoad.progressionType,
    });

    if (exercises.length >= 6) break;
  }

  return {
    exercises,
    performanceScore,
    deloadRecommended: deloadResult.shouldDeload,
    deloadReason: deloadResult.reason,
    generatedAt: new Date().toISOString(),
    source: "deterministic",
  };
}
