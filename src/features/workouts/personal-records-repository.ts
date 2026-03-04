import { expoDb } from "../../lib/database";
import { generateId } from "../../lib/uuid";

export interface PersonalRecord {
  id: string;
  userId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  estimatedOneRepMax: number;
  achievedAt: string;
  workoutId: string;
  createdAt: string;
}

type PRRow = {
  id: string;
  user_id: string;
  exercise_name: string;
  weight: number;
  reps: number;
  estimated_one_rep_max: number;
  achieved_at: string;
  workout_id: string;
  created_at: string;
};

function rowToPR(r: PRRow): PersonalRecord {
  return {
    id: r.id,
    userId: r.user_id,
    exerciseName: r.exercise_name,
    weight: r.weight,
    reps: r.reps,
    estimatedOneRepMax: r.estimated_one_rep_max,
    achievedAt: r.achieved_at,
    workoutId: r.workout_id,
    createdAt: r.created_at,
  };
}

export const personalRecordsRepository = {
  getBestOneRepMax(userId: string, exerciseName: string): PersonalRecord | null {
    const row = expoDb.getFirstSync<PRRow>(
      `SELECT * FROM personal_records
       WHERE user_id = ? AND exercise_name = ?
       ORDER BY estimated_one_rep_max DESC
       LIMIT 1`,
      [userId, exerciseName],
    );
    return row ? rowToPR(row) : null;
  },

  insert(data: {
    userId: string;
    exerciseName: string;
    weight: number;
    reps: number;
    estimatedOneRepMax: number;
    achievedAt: string;
    workoutId: string;
  }): string {
    const id = generateId();
    const now = new Date().toISOString();
    expoDb.runSync(
      `INSERT INTO personal_records
         (id, user_id, exercise_name, weight, reps, estimated_one_rep_max, achieved_at, workout_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.userId,
        data.exerciseName,
        data.weight,
        data.reps,
        data.estimatedOneRepMax,
        data.achievedAt,
        data.workoutId,
        now,
      ],
    );
    return id;
  },

  findAllForUser(userId: string): PersonalRecord[] {
    const rows = expoDb.getAllSync<PRRow>(
      `SELECT * FROM personal_records
       WHERE user_id = ?
       ORDER BY achieved_at DESC`,
      [userId],
    );
    return rows.map(rowToPR);
  },

  findAllForExercise(userId: string, exerciseName: string): PersonalRecord[] {
    const rows = expoDb.getAllSync<PRRow>(
      `SELECT * FROM personal_records
       WHERE user_id = ? AND exercise_name = ?
       ORDER BY achieved_at DESC`,
      [userId, exerciseName],
    );
    return rows.map(rowToPR);
  },
};
