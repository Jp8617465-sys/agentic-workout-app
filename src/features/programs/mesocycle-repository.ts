import { expoDb } from "../../lib/database";
import { generateId } from "../../lib/uuid";
import type { Mesocycle, MesocycleStatus, GeneratedMesocyclePlan, PeriodizationModel } from "../../types";

interface MesocycleRow {
  id: string;
  user_id: string;
  name: string;
  periodization_model: string;
  start_date: string;
  end_date: string;
  duration_weeks: number;
  status: string;
  goal: string;
  generated_plan: string;
  final_review: string | null;
  created_at: string;
  updated_at: string;
}

function rowToMesocycle(row: MesocycleRow): Mesocycle {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    periodizationModel: row.periodization_model as PeriodizationModel,
    startDate: row.start_date,
    endDate: row.end_date,
    durationWeeks: row.duration_weeks,
    status: row.status as MesocycleStatus,
    goal: row.goal,
    generatedPlan: JSON.parse(row.generated_plan) as GeneratedMesocyclePlan,
    finalReview: row.final_review,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export interface InsertMesocycleData {
  userId: string;
  name: string;
  periodizationModel: PeriodizationModel;
  startDate: string;
  endDate: string;
  durationWeeks: number;
  goal: string;
  generatedPlan: GeneratedMesocyclePlan;
}

export const mesocycleRepository = {
  insert(data: InsertMesocycleData): string {
    const id = generateId();
    const now = new Date().toISOString();
    expoDb.runSync(
      `INSERT INTO mesocycles (id, user_id, name, periodization_model, start_date, end_date,
       duration_weeks, status, goal, generated_plan, created_at, updated_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, 'pending')`,
      [
        id,
        data.userId,
        data.name,
        data.periodizationModel,
        data.startDate,
        data.endDate,
        data.durationWeeks,
        data.goal,
        JSON.stringify(data.generatedPlan),
        now,
        now,
      ],
    );
    return id;
  },

  findActive(userId: string): Mesocycle | null {
    const row = expoDb.getFirstSync<MesocycleRow>(
      `SELECT id, user_id, name, periodization_model, start_date, end_date,
       duration_weeks, status, goal, generated_plan, final_review, created_at, updated_at
       FROM mesocycles
       WHERE user_id = ? AND status = 'active' AND deleted_at IS NULL
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId],
    );
    return row ? rowToMesocycle(row) : null;
  },

  findById(id: string): Mesocycle | null {
    const row = expoDb.getFirstSync<MesocycleRow>(
      `SELECT id, user_id, name, periodization_model, start_date, end_date,
       duration_weeks, status, goal, generated_plan, final_review, created_at, updated_at
       FROM mesocycles
       WHERE id = ? AND deleted_at IS NULL`,
      [id],
    );
    return row ? rowToMesocycle(row) : null;
  },

  findByUser(userId: string): Mesocycle[] {
    const rows = expoDb.getAllSync<MesocycleRow>(
      `SELECT id, user_id, name, periodization_model, start_date, end_date,
       duration_weeks, status, goal, generated_plan, final_review, created_at, updated_at
       FROM mesocycles
       WHERE user_id = ? AND deleted_at IS NULL
       ORDER BY created_at DESC`,
      [userId],
    );
    return rows.map(rowToMesocycle);
  },

  updatePlan(id: string, plan: GeneratedMesocyclePlan): void {
    const now = new Date().toISOString();
    expoDb.runSync(
      "UPDATE mesocycles SET generated_plan = ?, updated_at = ? WHERE id = ?",
      [JSON.stringify(plan), now, id],
    );
  },

  complete(id: string, finalReview: string | null): void {
    const now = new Date().toISOString();
    expoDb.runSync(
      "UPDATE mesocycles SET status = 'completed', final_review = ?, updated_at = ? WHERE id = ?",
      [finalReview, now, id],
    );
  },

  abandon(id: string): void {
    const now = new Date().toISOString();
    expoDb.runSync(
      "UPDATE mesocycles SET status = 'abandoned', updated_at = ? WHERE id = ?",
      [now, id],
    );
  },

  pause(id: string): void {
    const now = new Date().toISOString();
    expoDb.runSync(
      "UPDATE mesocycles SET status = 'paused', updated_at = ? WHERE id = ?",
      [now, id],
    );
  },
};
