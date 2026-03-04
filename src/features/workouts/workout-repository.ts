import { eq, desc } from "drizzle-orm";
import { db, expoDb } from "../../lib/database";
import { workouts, exercisePerformances, setLogs } from "../../lib/schema";
import { generateId } from "../../lib/uuid";
import type {
  NewWorkout,
  WorkoutSummary,
  PreviousSetData,
  ActiveWorkoutData,
  CompleteWorkoutData,
  WorkoutDetail,
} from "./types";

export const workoutRepository = {
  async insert(data: NewWorkout): Promise<string> {
    const id = generateId();
    const now = new Date().toISOString();
    await db.insert(workouts).values({
      id,
      userId: data.userId,
      date: data.date,
      type: data.type,
      status: "active",
      syncStatus: "pending",
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },

  async insertExercisePerformance(data: {
    workoutId: string;
    exerciseName: string;
    prescribedSets: number | null;
    prescribedReps: number | null;
    prescribedWeight: number | null;
    prescribedRpe: number | null;
    prescribedRestSeconds: number | null;
    orderInWorkout: number;
  }): Promise<string> {
    const id = generateId();
    await db.insert(exercisePerformances).values({
      id,
      workoutId: data.workoutId,
      exerciseName: data.exerciseName,
      prescribedSets: data.prescribedSets,
      prescribedReps: data.prescribedReps,
      prescribedWeight: data.prescribedWeight,
      prescribedRpe: data.prescribedRpe,
      prescribedRestSeconds: data.prescribedRestSeconds,
      orderInWorkout: data.orderInWorkout,
    });
    return id;
  },

  async upsertSetLog(data: {
    id: string | null;
    exercisePerformanceId: string;
    setNumber: number;
    weight: number | null;
    reps: number | null;
    rpe: number | null;
    type: string;
    completedAt: string | null;
  }): Promise<string> {
    const id = data.id ?? generateId();
    expoDb.runSync(
      `INSERT OR REPLACE INTO set_logs (id, exercise_performance_id, set_number, weight, reps, rpe, type, completed_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        id,
        data.exercisePerformanceId,
        data.setNumber,
        data.weight,
        data.reps,
        data.rpe,
        data.type,
        data.completedAt,
      ],
    );
    return id;
  },

  updateSetLogRpe(setLogId: string, rpe: number): void {
    expoDb.runSync("UPDATE set_logs SET rpe = ? WHERE id = ?", [rpe, setLogId]);
  },

  async deleteSetLog(setId: string): Promise<void> {
    expoDb.runSync("DELETE FROM set_logs WHERE id = ?", [setId]);
  },

  async findRecent(userId: string, limit = 20): Promise<WorkoutSummary[]> {
    const rows = expoDb.getAllSync<{
      id: string;
      date: string;
      type: string;
      status: string;
      duration_minutes: number | null;
      total_volume: number | null;
      exercise_count: number;
    }>(
      `SELECT w.id, w.date, w.type, w.status, w.duration_minutes, w.total_volume,
              (SELECT COUNT(DISTINCT ep.id) FROM exercise_performances ep WHERE ep.workout_id = w.id) as exercise_count
       FROM workouts w
       WHERE w.user_id = ? AND w.status = 'completed'
       ORDER BY w.date DESC
       LIMIT ?`,
      [userId, limit],
    );
    return rows.map((r) => ({
      id: r.id,
      date: r.date,
      type: r.type,
      status: r.status,
      durationMinutes: r.duration_minutes,
      totalVolume: r.total_volume,
      exerciseCount: r.exercise_count,
    }));
  },

  async findLastWithExercise(
    userId: string,
    exerciseName: string,
  ): Promise<PreviousSetData[]> {
    const rows = expoDb.getAllSync<{
      weight: number | null;
      reps: number | null;
      rpe: number | null;
      set_number: number;
      date: string;
    }>(
      `SELECT sl.weight, sl.reps, sl.rpe, sl.set_number, w.date
       FROM set_logs sl
       JOIN exercise_performances ep ON sl.exercise_performance_id = ep.id
       JOIN workouts w ON ep.workout_id = w.id
       WHERE w.user_id = ? AND ep.exercise_name = ? AND w.status = 'completed'
       ORDER BY w.date DESC, sl.set_number ASC
       LIMIT 20`,
      [userId, exerciseName],
    );
    return rows.map((r) => ({
      weight: r.weight,
      reps: r.reps,
      rpe: r.rpe,
      setNumber: r.set_number,
      date: r.date,
    }));
  },

  async getActiveWorkout(userId: string): Promise<ActiveWorkoutData | null> {
    const workout = expoDb.getFirstSync<{
      id: string;
      user_id: string;
      date: string;
      type: string;
      rest_timer_ends_at: number | null;
    }>(
      `SELECT id, user_id, date, type, rest_timer_ends_at
       FROM workouts
       WHERE user_id = ? AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId],
    );

    if (!workout) return null;

    const epRows = expoDb.getAllSync<{
      id: string;
      exercise_name: string;
      prescribed_sets: number | null;
      prescribed_reps: number | null;
      prescribed_weight: number | null;
      prescribed_rpe: number | null;
      prescribed_rest_seconds: number | null;
      order_in_workout: number;
    }>(
      `SELECT id, exercise_name, prescribed_sets, prescribed_reps, prescribed_weight,
              prescribed_rpe, prescribed_rest_seconds, order_in_workout
       FROM exercise_performances
       WHERE workout_id = ?
       ORDER BY order_in_workout ASC`,
      [workout.id],
    );

    const exercisesWithSets = epRows.map((ep) => {
      const sets = expoDb.getAllSync<{
        id: string;
        set_number: number;
        weight: number | null;
        reps: number | null;
        rpe: number | null;
        type: string;
        completed_at: string | null;
      }>(
        `SELECT id, set_number, weight, reps, rpe, type, completed_at
         FROM set_logs
         WHERE exercise_performance_id = ?
         ORDER BY set_number ASC`,
        [ep.id],
      );

      return {
        exercisePerformanceId: ep.id,
        exerciseName: ep.exercise_name,
        prescribedSets: ep.prescribed_sets,
        prescribedReps: ep.prescribed_reps,
        prescribedWeight: ep.prescribed_weight,
        prescribedRpe: ep.prescribed_rpe,
        prescribedRestSeconds: ep.prescribed_rest_seconds,
        orderInWorkout: ep.order_in_workout,
        sets: sets.map((s) => ({
          id: s.id,
          setNumber: s.set_number,
          weight: s.weight,
          reps: s.reps,
          rpe: s.rpe,
          type: s.type,
          completedAt: s.completed_at,
        })),
      };
    });

    return {
      workoutId: workout.id,
      userId: workout.user_id,
      date: workout.date,
      type: workout.type,
      restTimerEndsAt: workout.rest_timer_ends_at,
      exercises: exercisesWithSets,
    };
  },

  async saveCompleteWorkout(data: CompleteWorkoutData): Promise<void> {
    expoDb.withTransactionSync(() => {
      const now = new Date().toISOString();
      expoDb.runSync(
        `UPDATE workouts SET status = 'completed', duration_minutes = ?, total_volume = ?,
         average_rpe = ?, updated_at = ? WHERE id = ?`,
        [data.durationMinutes, data.totalVolume, data.averageRpe, now, data.workoutId],
      );

      for (const ex of data.exercises) {
        expoDb.runSync(
          `UPDATE exercise_performances SET actual_sets = ?, actual_average_rpe = ? WHERE id = ?`,
          [ex.actualSets, ex.actualAverageRpe, ex.exercisePerformanceId],
        );
      }
    });
  },

  async abandonWorkout(workoutId: string): Promise<void> {
    const now = new Date().toISOString();
    expoDb.runSync(
      "UPDATE workouts SET status = 'abandoned', updated_at = ? WHERE id = ?",
      [now, workoutId],
    );
  },

  async updateRestTimer(
    workoutId: string,
    endTimestamp: number | null,
  ): Promise<void> {
    expoDb.runSync(
      "UPDATE workouts SET rest_timer_ends_at = ? WHERE id = ?",
      [endTimestamp, workoutId],
    );
  },

  async findById(workoutId: string): Promise<WorkoutDetail | null> {
    const workout = expoDb.getFirstSync<{
      id: string;
      user_id: string;
      date: string;
      type: string;
      status: string;
      duration_minutes: number | null;
      total_volume: number | null;
      average_rpe: number | null;
    }>("SELECT * FROM workouts WHERE id = ?", [workoutId]);

    if (!workout) return null;

    const epRows = expoDb.getAllSync<{
      id: string;
      exercise_name: string;
      order_in_workout: number;
    }>(
      `SELECT id, exercise_name, order_in_workout
       FROM exercise_performances
       WHERE workout_id = ?
       ORDER BY order_in_workout ASC`,
      [workoutId],
    );

    const exercises = epRows.map((ep) => {
      const sets = expoDb.getAllSync<{
        set_number: number;
        weight: number | null;
        reps: number | null;
        rpe: number | null;
        type: string;
        completed_at: string | null;
      }>(
        `SELECT set_number, weight, reps, rpe, type, completed_at
         FROM set_logs
         WHERE exercise_performance_id = ?
         ORDER BY set_number ASC`,
        [ep.id],
      );

      return {
        exerciseName: ep.exercise_name,
        orderInWorkout: ep.order_in_workout,
        sets: sets.map((s) => ({
          setNumber: s.set_number,
          weight: s.weight,
          reps: s.reps,
          rpe: s.rpe,
          type: s.type,
          completedAt: s.completed_at,
        })),
      };
    });

    return {
      id: workout.id,
      userId: workout.user_id,
      date: workout.date,
      type: workout.type,
      status: workout.status,
      durationMinutes: workout.duration_minutes,
      totalVolume: workout.total_volume,
      averageRpe: workout.average_rpe,
      exercises,
    };
  },
};
