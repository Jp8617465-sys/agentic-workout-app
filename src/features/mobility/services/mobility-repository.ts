import { expoDb } from "../../../lib/database";
import { generateId } from "../../../lib/uuid";
import type {
  MobilityAssessment,
  MobilitySide,
  MobilityTestId,
} from "../../../types";

export interface CompletedDrill {
  exerciseName: string;
  /** Reps or seconds, one entry per side performed. */
  sets: number[];
}

interface AssessmentRow {
  id: string;
  user_id: string;
  test: string;
  side: string;
  value: number;
  measured_at: string;
  sync_status: string;
  created_at: string;
}

function toLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function rowToAssessment(row: AssessmentRow): MobilityAssessment {
  return {
    id: row.id,
    userId: row.user_id,
    test: row.test as MobilityTestId,
    side: row.side as MobilitySide,
    value: row.value,
    measuredAt: row.measured_at,
    syncStatus: row.sync_status as MobilityAssessment["syncStatus"],
    createdAt: row.created_at,
  };
}

export const mobilityRepository = {
  logSession(
    userId: string,
    drills: CompletedDrill[],
    durationSeconds: number,
  ): string {
    const workoutId = generateId();
    const now = new Date();
    const nowIso = now.toISOString();

    expoDb.withTransactionSync(() => {
      expoDb.runSync(
        `INSERT INTO workouts (id, user_id, date, type, status, duration_minutes, sync_status, created_at, updated_at)
         VALUES (?, ?, ?, 'mobility', 'completed', ?, 'pending', ?, ?)`,
        [
          workoutId,
          userId,
          toLocalDate(now),
          Math.max(1, Math.round(durationSeconds / 60)),
          nowIso,
          nowIso,
        ],
      );

      drills.forEach((drill, order) => {
        const epId = generateId();
        expoDb.runSync(
          `INSERT INTO exercise_performances (id, workout_id, exercise_name, actual_sets, order_in_workout)
           VALUES (?, ?, ?, ?, ?)`,
          [epId, workoutId, drill.exerciseName, drill.sets.length, order],
        );
        drill.sets.forEach((amount, i) => {
          expoDb.runSync(
            `INSERT INTO set_logs (id, exercise_performance_id, set_number, reps, type, completed_at, sync_status)
             VALUES (?, ?, ?, ?, 'working', ?, 'pending')`,
            [generateId(), epId, i + 1, amount, nowIso],
          );
        });
      });
    });

    return workoutId;
  },

  /** Local dates (YYYY-MM-DD) with at least one mobility session in the last `days` days. */
  recentSessionDates(userId: string, days = 7): string[] {
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    return expoDb
      .getAllSync<{ date: string }>(
        `SELECT DISTINCT date FROM workouts
         WHERE user_id = ? AND type = 'mobility' AND status = 'completed' AND date >= ?
         ORDER BY date ASC`,
        [userId, toLocalDate(since)],
      )
      .map((r) => r.date);
  },

  addAssessments(
    userId: string,
    entries: { test: MobilityTestId; side: MobilitySide; value: number }[],
  ): void {
    const now = new Date().toISOString();
    expoDb.withTransactionSync(() => {
      for (const e of entries) {
        expoDb.runSync(
          `INSERT INTO mobility_assessments (id, user_id, test, side, value, measured_at, sync_status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`,
          [generateId(), userId, e.test, e.side, e.value, now, now],
        );
      }
    });
  },

  /** Oldest → newest, for trend calculation. */
  history(
    userId: string,
    test: MobilityTestId,
    side: MobilitySide,
  ): MobilityAssessment[] {
    return expoDb
      .getAllSync<AssessmentRow>(
        `SELECT * FROM mobility_assessments
         WHERE user_id = ? AND test = ? AND side = ?
         ORDER BY measured_at ASC`,
        [userId, test, side],
      )
      .map(rowToAssessment);
  },
};

export { toLocalDate };
