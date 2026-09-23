import { expoDb } from "../../../lib/database";
import { generateId } from "../../../lib/uuid";
import { estimateOneRepMax } from "../../workouts/progression-calculator";
import { personalRecordsRepository } from "../../workouts/personal-records-repository";
import { resolveExerciseName } from "./exercise-name-map";
import type {
  ExerciseCategory,
  ExercisePattern,
  UnitSystem,
} from "../../../types";
import type {
  ImportSummary,
  ParsedExercise,
  ParsedSet,
  ParsedWorkout,
} from "../types";

const LB_PER_KG = 2.20462;

function convertWeight(set: ParsedSet, unitSystem: UnitSystem): number | null {
  if (set.weight === null) return null;
  const target = unitSystem === "imperial" ? "lb" : "kg";
  if (!set.weightUnit || set.weightUnit === target) return set.weight;
  const converted =
    target === "kg" ? set.weight / LB_PER_KG : set.weight * LB_PER_KG;
  return Math.round(converted * 2) / 2;
}

// set_logs has no duration column, so timed cardio stores whole minutes in reps.
function repsFor(set: ParsedSet): number | null {
  if (set.reps !== null) return set.reps;
  if (set.durationSeconds !== null)
    return Math.max(1, Math.round(set.durationSeconds / 60));
  return null;
}

function guessPattern(name: string): ExercisePattern {
  const n = name.toLowerCase();
  if (/squat|leg press|lunge|step/.test(n))
    return n.includes("lunge") || n.includes("step") ? "lunge" : "squat";
  if (/deadlift|hinge|thrust|swing|good morning|bridge/.test(n)) return "hinge";
  if (/overhead|shoulder press|military/.test(n)) return "vertical_push";
  if (/bench|press|push|dip|fly/.test(n)) return "horizontal_push";
  if (/pulldown|pull up|pull-up|chin/.test(n)) return "vertical_pull";
  if (/row|face pull|curl/.test(n)) return "horizontal_pull";
  if (/carry|walk/.test(n)) return "carry";
  if (/run|bike|cycl|row(ing)? \(machine\)|swim|sled/.test(n)) return "cardio";
  return "core";
}

function guessCategory(exercise: ParsedExercise): ExerciseCategory {
  const timedOnly = exercise.sets.every(
    (s) => s.weight === null && s.reps === null,
  );
  return timedOnly ? "cardio" : "compound";
}

function libraryNames(): string[] {
  return expoDb
    .getAllSync<{ name: string }>("SELECT name FROM exercises")
    .map((r) => r.name);
}

function registerCustomExercise(name: string, exercise: ParsedExercise): void {
  const category = guessCategory(exercise);
  expoDb.runSync(
    `INSERT OR IGNORE INTO exercises (name, category, pattern, equipment, muscle_groups,
       default_rest_seconds, instructions, cues, common_mistakes, variations)
     VALUES (?, ?, ?, '[]', '[]', ?, '[]', '[]', '[]', '[]')`,
    [
      name,
      category,
      category === "cardio" ? "cardio" : guessPattern(name),
      category === "cardio" ? 30 : 120,
    ],
  );
}

function isDuplicate(
  userId: string,
  date: string,
  exerciseNames: string[],
): boolean {
  const rows = expoDb.getAllSync<{ id: string; names: string | null }>(
    `SELECT w.id, GROUP_CONCAT(ep.exercise_name, '|') AS names
     FROM workouts w
     LEFT JOIN exercise_performances ep ON ep.workout_id = w.id
     WHERE w.user_id = ? AND w.date = ? AND w.status = 'completed'
     GROUP BY w.id`,
    [userId, date],
  );
  const signature = [...exerciseNames].sort().join("|");
  return rows.some(
    (r) => (r.names ?? "").split("|").sort().join("|") === signature,
  );
}

interface PRCandidate {
  exerciseName: string;
  weight: number;
  reps: number;
  e1rm: number;
  achievedAt: string;
  workoutId: string;
}

function insertWorkout(
  userId: string,
  workout: ParsedWorkout,
  names: string[],
  unitSystem: UnitSystem,
  prCandidates: Map<string, PRCandidate>,
): void {
  const workoutId = generateId();
  const now = new Date().toISOString();
  let totalVolume = 0;
  const rpes: number[] = [];

  expoDb.runSync(
    `INSERT INTO workouts (id, user_id, date, type, status, sync_status, created_at, updated_at)
     VALUES (?, ?, ?, 'custom', 'completed', 'pending', ?, ?)`,
    [workoutId, userId, workout.date, now, now],
  );

  workout.exercises.forEach((exercise, order) => {
    const epId = generateId();
    const exerciseName = names[order];
    const exRpes = exercise.sets
      .map((s) => s.rpe)
      .filter((r): r is number => r !== null);

    expoDb.runSync(
      `INSERT INTO exercise_performances (id, workout_id, exercise_name, actual_sets, actual_average_rpe, order_in_workout)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        epId,
        workoutId,
        exerciseName,
        exercise.sets.length,
        exRpes.length
          ? exRpes.reduce((a, b) => a + b, 0) / exRpes.length
          : null,
        order,
      ],
    );

    for (const set of exercise.sets) {
      const weight = convertWeight(set, unitSystem);
      const reps = repsFor(set);
      expoDb.runSync(
        `INSERT INTO set_logs (id, exercise_performance_id, set_number, weight, reps, rpe, type, completed_at, sync_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          generateId(),
          epId,
          set.setNumber,
          weight,
          reps,
          set.rpe,
          set.type,
          workout.startedAt,
        ],
      );

      if (set.type !== "warmup" && weight && set.reps && weight > 0) {
        totalVolume += weight * set.reps;
        const { estimatedOneRepMax } = estimateOneRepMax(weight, set.reps);
        const best = prCandidates.get(exerciseName);
        if (!best || estimatedOneRepMax > best.e1rm) {
          prCandidates.set(exerciseName, {
            exerciseName,
            weight,
            reps: set.reps,
            e1rm: estimatedOneRepMax,
            achievedAt: workout.startedAt,
            workoutId,
          });
        }
      }
      if (set.rpe !== null) rpes.push(set.rpe);
    }
  });

  expoDb.runSync(
    `UPDATE workouts SET total_volume = ?, average_rpe = ? WHERE id = ?`,
    [
      totalVolume || null,
      rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : null,
      workoutId,
    ],
  );
}

export function importParsedWorkouts(
  userId: string,
  workouts: ParsedWorkout[],
  unitSystem: UnitSystem,
): ImportSummary {
  const summary: ImportSummary = {
    imported: 0,
    skippedDuplicates: 0,
    createdExercises: [],
    personalRecords: 0,
  };
  const library = libraryNames();
  const prCandidates = new Map<string, PRCandidate>();

  expoDb.withTransactionSync(() => {
    for (const workout of workouts) {
      const names = workout.exercises.map((ex) => {
        const resolved = resolveExerciseName(ex.sourceName, library);
        if (!resolved.matchedLibrary && !library.includes(resolved.name)) {
          registerCustomExercise(resolved.name, ex);
          library.push(resolved.name);
          summary.createdExercises.push(resolved.name);
        }
        return resolved.name;
      });

      if (isDuplicate(userId, workout.date, names)) {
        summary.skippedDuplicates++;
        continue;
      }
      insertWorkout(userId, workout, names, unitSystem, prCandidates);
      summary.imported++;
    }

    for (const pr of prCandidates.values()) {
      const existing = personalRecordsRepository.getBestOneRepMax(
        userId,
        pr.exerciseName,
      );
      if (existing && existing.estimatedOneRepMax >= pr.e1rm) continue;
      personalRecordsRepository.insert({
        userId,
        exerciseName: pr.exerciseName,
        weight: pr.weight,
        reps: pr.reps,
        estimatedOneRepMax: pr.e1rm,
        achievedAt: pr.achievedAt,
        workoutId: pr.workoutId,
      });
      summary.personalRecords++;
    }
  });

  return summary;
}
