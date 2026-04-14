import { expoDb } from "../../../lib/database";
import { generateId } from "../../../lib/uuid";

export type MemoryType =
  | "optimal_rpe_range"
  | "day_of_week_fatigue"
  | "exercise_preference"
  | "recovery_timeline"
  | "progression_sweet_spot"
  | "deload_timing"
  | "return_protocol";

export interface AgenticMemory {
  id: string;
  userId: string;
  type: MemoryType;
  description: string;
  context: Record<string, unknown>;
  observations: number;
  successRate: number;
  confidence: number;
  trigger: string | null;
  action: string | null;
  exercise: string | null;
  firstObserved: string;
  lastObserved: string;
  reinforced: number;
  appliedSuccessfully: number;
  appliedUnsuccessfully: number;
  lastApplied: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MemoryRow {
  id: string;
  user_id: string;
  type: string;
  description: string;
  context: string;
  observations: number;
  success_rate: number;
  confidence: number;
  trigger: string | null;
  action: string | null;
  exercise: string | null;
  first_observed: string;
  last_observed: string;
  reinforced: number;
  applied_successfully: number;
  applied_unsuccessfully: number;
  last_applied: string | null;
  created_at: string;
  updated_at: string;
}

function rowToMemory(row: MemoryRow): AgenticMemory {
  let context: Record<string, unknown> = {};
  try {
    context = JSON.parse(row.context) as Record<string, unknown>;
  } catch {
    // ignore corrupt JSON
  }
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as MemoryType,
    description: row.description,
    context,
    observations: row.observations,
    successRate: row.success_rate,
    confidence: row.confidence,
    trigger: row.trigger,
    action: row.action,
    exercise: row.exercise,
    firstObserved: row.first_observed,
    lastObserved: row.last_observed,
    reinforced: row.reinforced,
    appliedSuccessfully: row.applied_successfully,
    appliedUnsuccessfully: row.applied_unsuccessfully,
    lastApplied: row.last_applied,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const memoryRepository = {
  findAll(userId: string): AgenticMemory[] {
    const rows = expoDb.getAllSync<MemoryRow>(
      `SELECT * FROM agentic_memories
       WHERE user_id = ?
       ORDER BY confidence DESC, last_observed DESC`,
      [userId],
    );
    return rows.map(rowToMemory);
  },

  findByType(userId: string, type: MemoryType): AgenticMemory[] {
    const rows = expoDb.getAllSync<MemoryRow>(
      `SELECT * FROM agentic_memories
       WHERE user_id = ? AND type = ?
       ORDER BY confidence DESC`,
      [userId, type],
    );
    return rows.map(rowToMemory);
  },

  findByExercise(userId: string, exercise: string): AgenticMemory[] {
    const rows = expoDb.getAllSync<MemoryRow>(
      `SELECT * FROM agentic_memories
       WHERE user_id = ? AND exercise = ?
       ORDER BY confidence DESC`,
      [userId, exercise],
    );
    return rows.map(rowToMemory);
  },

  findRelevant(userId: string, minConfidence = 0.4): AgenticMemory[] {
    const rows = expoDb.getAllSync<MemoryRow>(
      `SELECT * FROM agentic_memories
       WHERE user_id = ? AND confidence >= ?
       ORDER BY confidence DESC
       LIMIT 20`,
      [userId, minConfidence],
    );
    return rows.map(rowToMemory);
  },

  upsert(
    memory: Omit<AgenticMemory, "id" | "createdAt" | "updatedAt" | "firstObserved"> & {
      id?: string;
    },
  ): AgenticMemory {
    const existing = memory.exercise
      ? expoDb.getFirstSync<MemoryRow>(
          `SELECT * FROM agentic_memories
           WHERE user_id = ? AND type = ? AND exercise = ?
           LIMIT 1`,
          [memory.userId, memory.type, memory.exercise],
        )
      : expoDb.getFirstSync<MemoryRow>(
          `SELECT * FROM agentic_memories
           WHERE user_id = ? AND type = ? AND description = ?
           LIMIT 1`,
          [memory.userId, memory.type, memory.description],
        );

    const now = new Date().toISOString();
    const id = existing?.id ?? memory.id ?? generateId();
    const firstObserved = existing?.first_observed ?? now;

    expoDb.runSync(
      `INSERT INTO agentic_memories
         (id, user_id, type, description, context, observations, success_rate, confidence,
          trigger, action, exercise, first_observed, last_observed,
          reinforced, applied_successfully, applied_unsuccessfully, last_applied,
          created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         description = excluded.description,
         context = excluded.context,
         observations = excluded.observations,
         success_rate = excluded.success_rate,
         confidence = excluded.confidence,
         trigger = excluded.trigger,
         action = excluded.action,
         last_observed = excluded.last_observed,
         reinforced = excluded.reinforced,
         applied_successfully = excluded.applied_successfully,
         applied_unsuccessfully = excluded.applied_unsuccessfully,
         last_applied = excluded.last_applied,
         updated_at = excluded.updated_at`,
      [
        id,
        memory.userId,
        memory.type,
        memory.description,
        JSON.stringify(memory.context),
        memory.observations,
        memory.successRate,
        memory.confidence,
        memory.trigger ?? null,
        memory.action ?? null,
        memory.exercise ?? null,
        firstObserved,
        memory.lastObserved,
        memory.reinforced,
        memory.appliedSuccessfully,
        memory.appliedUnsuccessfully,
        memory.lastApplied ?? null,
        existing?.created_at ?? now,
        now,
      ],
    );

    return {
      id,
      userId: memory.userId,
      type: memory.type,
      description: memory.description,
      context: memory.context,
      observations: memory.observations,
      successRate: memory.successRate,
      confidence: memory.confidence,
      trigger: memory.trigger ?? null,
      action: memory.action ?? null,
      exercise: memory.exercise ?? null,
      firstObserved,
      lastObserved: memory.lastObserved,
      reinforced: memory.reinforced,
      appliedSuccessfully: memory.appliedSuccessfully,
      appliedUnsuccessfully: memory.appliedUnsuccessfully,
      lastApplied: memory.lastApplied ?? null,
      createdAt: existing?.created_at ?? now,
      updatedAt: now,
    };
  },

  recordApplication(memoryId: string, success: boolean): void {
    const now = new Date().toISOString();
    if (success) {
      expoDb.runSync(
        `UPDATE agentic_memories
         SET applied_successfully = applied_successfully + 1,
             last_applied = ?,
             updated_at = ?
         WHERE id = ?`,
        [now, now, memoryId],
      );
    } else {
      expoDb.runSync(
        `UPDATE agentic_memories
         SET applied_unsuccessfully = applied_unsuccessfully + 1,
             last_applied = ?,
             updated_at = ?
         WHERE id = ?`,
        [now, now, memoryId],
      );
    }
    // Recompute confidence: successRate = successful / (successful + unsuccessful)
    expoDb.runSync(
      `UPDATE agentic_memories
       SET success_rate = CAST(applied_successfully AS REAL) / MAX(1, applied_successfully + applied_unsuccessfully),
           confidence = MIN(1.0, CAST(observations AS REAL) / 10.0) *
                        (CAST(applied_successfully AS REAL) / MAX(1, applied_successfully + applied_unsuccessfully)),
           updated_at = ?
       WHERE id = ?`,
      [now, memoryId],
    );
  },
};
