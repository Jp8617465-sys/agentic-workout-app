import { expoDb } from "../../lib/database";
import { generateId } from "../../lib/uuid";
import type { AgenticMemory, MemoryType, MemoryContext, MemoryStats } from "../../types";

interface InsertMemoryData {
  userId: string;
  type: MemoryType;
  description: string;
  context: MemoryContext;
  confidence: number;
  trigger: string;
  action: string;
  observations: number;
  successRate: number;
}

interface MemoryRow {
  id: string;
  user_id: string;
  type: string;
  description: string;
  context: string;
  observations: number;
  success_rate: number;
  first_observed: string;
  last_observed: string;
  trigger_text: string;
  action: string;
  confidence: number;
  reinforced: number;
  applied_successfully: number;
  applied_unsuccessfully: number;
  last_applied: string | null;
  sync_status: string;
  created_at: string;
  updated_at: string;
}

function rowToMemory(row: MemoryRow): AgenticMemory {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type as MemoryType,
    description: row.description,
    context: JSON.parse(row.context) as MemoryContext,
    observations: row.observations,
    successRate: row.success_rate,
    firstObserved: row.first_observed,
    lastObserved: row.last_observed,
    trigger: row.trigger_text,
    action: row.action,
    confidence: row.confidence,
    reinforced: row.reinforced,
    appliedSuccessfully: row.applied_successfully,
    appliedUnsuccessfully: row.applied_unsuccessfully,
    lastApplied: row.last_applied,
    syncStatus: row.sync_status as AgenticMemory["syncStatus"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const memoryRepository = {
  insert(data: InsertMemoryData): string {
    const id = generateId();
    const now = new Date().toISOString();
    expoDb.runSync(
      `INSERT INTO agentic_memories
        (id, user_id, type, description, context, observations, success_rate,
         first_observed, last_observed, trigger_text, action, confidence,
         reinforced, applied_successfully, applied_unsuccessfully,
         sync_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 'pending', ?, ?)`,
      [
        id,
        data.userId,
        data.type,
        data.description,
        JSON.stringify(data.context),
        data.observations,
        data.successRate,
        now,
        now,
        data.trigger,
        data.action,
        data.confidence,
        now,
        now,
      ],
    );
    return id;
  },

  findByUser(userId: string, limit = 50): AgenticMemory[] {
    const rows = expoDb.getAllSync<MemoryRow>(
      `SELECT * FROM agentic_memories
       WHERE user_id = ?
       ORDER BY confidence DESC
       LIMIT ?`,
      [userId, limit],
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

  findRelevant(userId: string, context: MemoryContext, limit = 5): AgenticMemory[] {
    const all = expoDb.getAllSync<MemoryRow>(
      `SELECT * FROM agentic_memories
       WHERE user_id = ? AND confidence >= 0.3
       ORDER BY confidence DESC`,
      [userId],
    );

    const scored: { memory: AgenticMemory; score: number }[] = all.map((row: MemoryRow) => {
      const mem = rowToMemory(row);
      let score = mem.confidence;

      if (context.exercise && mem.context.exercise === context.exercise) {
        score += 3;
      }
      if (context.phase && mem.context.phase === context.phase) {
        score += 2;
      }
      if (context.dayOfWeek !== undefined && mem.context.dayOfWeek === context.dayOfWeek) {
        score += 1;
      }
      if (context.muscleGroup && mem.context.muscleGroup === context.muscleGroup) {
        score += 1.5;
      }

      return { memory: mem, score };
    });

    scored.sort((a: { memory: AgenticMemory; score: number }, b: { memory: AgenticMemory; score: number }) => b.score - a.score);
    return scored.slice(0, limit).map((s: { memory: AgenticMemory; score: number }) => s.memory);
  },

  findExisting(userId: string, type: MemoryType, context: MemoryContext): AgenticMemory | null {
    const contextStr = JSON.stringify(context);
    const rows = expoDb.getAllSync<MemoryRow>(
      `SELECT * FROM agentic_memories
       WHERE user_id = ? AND type = ? AND context = ?
       LIMIT 1`,
      [userId, type, contextStr],
    );
    return rows.length > 0 ? rowToMemory(rows[0]) : null;
  },

  update(
    id: string,
    data: Partial<Pick<AgenticMemory, "description" | "confidence" | "observations" | "successRate" | "action">>,
  ): void {
    const now = new Date().toISOString();
    const sets: string[] = ["updated_at = ?", "last_observed = ?", "sync_status = 'pending'"];
    const values: (string | number)[] = [now, now];

    if (data.description !== undefined) {
      sets.push("description = ?");
      values.push(data.description);
    }
    if (data.confidence !== undefined) {
      sets.push("confidence = ?");
      values.push(data.confidence);
    }
    if (data.observations !== undefined) {
      sets.push("observations = ?");
      values.push(data.observations);
    }
    if (data.successRate !== undefined) {
      sets.push("success_rate = ?");
      values.push(data.successRate);
    }
    if (data.action !== undefined) {
      sets.push("action = ?");
      values.push(data.action);
    }

    values.push(id);
    expoDb.runSync(
      `UPDATE agentic_memories SET ${sets.join(", ")} WHERE id = ?`,
      values,
    );
  },

  reinforce(id: string): void {
    const now = new Date().toISOString();
    expoDb.runSync(
      `UPDATE agentic_memories
       SET reinforced = reinforced + 1, observations = observations + 1,
           last_observed = ?, updated_at = ?, sync_status = 'pending'
       WHERE id = ?`,
      [now, now, id],
    );
  },

  recordApplication(id: string, success: boolean): void {
    const now = new Date().toISOString();
    const field = success ? "applied_successfully" : "applied_unsuccessfully";
    expoDb.runSync(
      `UPDATE agentic_memories
       SET ${field} = ${field} + 1, last_applied = ?, updated_at = ?, sync_status = 'pending'
       WHERE id = ?`,
      [now, now, id],
    );
  },

  prune(userId: string, maxCount = 500): number {
    const countRow = expoDb.getFirstSync<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM agentic_memories WHERE user_id = ?`,
      [userId],
    );
    const total = countRow?.cnt ?? 0;
    if (total <= maxCount) return 0;

    const toDelete = total - maxCount;
    expoDb.runSync(
      `DELETE FROM agentic_memories
       WHERE id IN (
         SELECT id FROM agentic_memories
         WHERE user_id = ?
         ORDER BY confidence ASC, last_observed ASC
         LIMIT ?
       )`,
      [userId, toDelete],
    );
    return toDelete;
  },

  getStats(userId: string): MemoryStats {
    const rows = expoDb.getAllSync<{ type: string; cnt: number; avg_conf: number }>(
      `SELECT type, COUNT(*) as cnt, AVG(confidence) as avg_conf
       FROM agentic_memories
       WHERE user_id = ?
       GROUP BY type`,
      [userId],
    );

    const byType: Record<string, number> = {
      pattern: 0,
      preference: 0,
      adaptation: 0,
      warning: 0,
      success_factor: 0,
    };
    let total = 0;
    let totalConf = 0;

    for (const row of rows) {
      byType[row.type] = row.cnt;
      total += row.cnt;
      totalConf += row.avg_conf * row.cnt;
    }

    return {
      total,
      avgConfidence: total > 0 ? totalConf / total : 0,
      byType: byType as MemoryStats["byType"],
    };
  },

  findPending(userId: string): AgenticMemory[] {
    const rows = expoDb.getAllSync<MemoryRow>(
      `SELECT * FROM agentic_memories
       WHERE user_id = ? AND sync_status = 'pending'`,
      [userId],
    );
    return rows.map(rowToMemory);
  },

  deleteAll(userId: string): void {
    expoDb.runSync(`DELETE FROM agentic_memories WHERE user_id = ?`, [userId]);
  },
};
