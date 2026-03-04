import { expoDb } from "../../lib/database";
import { generateId } from "../../lib/uuid";
import type {
  AgenticMemory,
  MemoryContext,
  MemoryType,
  NewMemoryInput,
  UserDisagreement,
} from "../../types/memory";
import { calculateConfidence } from "./confidence-calculator";

type MemoryRow = {
  id: string;
  user_id: string;
  type: string;
  description: string;
  context: string;
  observations: number;
  success_rate: number;
  first_observed: string;
  last_observed: string;
  trigger: string | null;
  action: string | null;
  confidence: number;
  reinforced: number;
  applied_successfully: number;
  applied_unsuccessfully: number;
  last_applied: string | null;
  created_at: string;
  updated_at: string;
  sync_status: string;
  deleted_at: string | null;
};

type DisagreementRow = {
  id: string;
  user_id: string;
  context: string;
  ai_suggested: string;
  user_chose: string;
  created_at: string;
  sync_status: string;
};

function rowToMemory(r: MemoryRow): AgenticMemory {
  return {
    id: r.id,
    userId: r.user_id,
    type: r.type as MemoryType,
    description: r.description,
    context: JSON.parse(r.context) as MemoryContext,
    observations: r.observations,
    successRate: r.success_rate,
    firstObserved: r.first_observed,
    lastObserved: r.last_observed,
    trigger: r.trigger,
    action: r.action,
    confidence: r.confidence,
    reinforced: r.reinforced,
    appliedSuccessfully: r.applied_successfully,
    appliedUnsuccessfully: r.applied_unsuccessfully,
    lastApplied: r.last_applied,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    syncStatus: r.sync_status,
    deletedAt: r.deleted_at,
  };
}

function rowToDisagreement(r: DisagreementRow): UserDisagreement {
  return {
    id: r.id,
    userId: r.user_id,
    context: JSON.parse(r.context) as MemoryContext,
    aiSuggested: r.ai_suggested,
    userChose: r.user_chose,
    createdAt: r.created_at,
    syncStatus: r.sync_status,
  };
}

export const memoryRepository = {
  insert(input: NewMemoryInput): string {
    const id = generateId();
    const now = new Date().toISOString();
    const confidence = calculateConfidence({
      observations: 1,
      successRate: 0.5,
      lastObservedIso: now,
    });
    expoDb.runSync(
      `INSERT INTO agentic_memories
         (id, user_id, type, description, context, observations, success_rate,
          first_observed, last_observed, trigger, action, confidence,
          reinforced, applied_successfully, applied_unsuccessfully,
          created_at, updated_at, sync_status)
       VALUES (?, ?, ?, ?, ?, 1, 0.5, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?, 'pending')`,
      [
        id,
        input.userId,
        input.type,
        input.description,
        JSON.stringify(input.context),
        now,
        now,
        input.trigger ?? null,
        input.action ?? null,
        confidence,
        now,
        now,
      ],
    );
    return id;
  },

  findRelevant(
    userId: string,
    options?: { type?: MemoryType; limit?: number },
  ): AgenticMemory[] {
    const limit = options?.limit ?? 5;
    if (options?.type) {
      const rows = expoDb.getAllSync<MemoryRow>(
        `SELECT * FROM agentic_memories
         WHERE user_id = ? AND type = ? AND deleted_at IS NULL
         ORDER BY confidence DESC, last_observed DESC
         LIMIT ?`,
        [userId, options.type, limit],
      );
      return rows.map(rowToMemory);
    }
    const rows = expoDb.getAllSync<MemoryRow>(
      `SELECT * FROM agentic_memories
       WHERE user_id = ? AND deleted_at IS NULL
       ORDER BY confidence DESC, last_observed DESC
       LIMIT ?`,
      [userId, limit],
    );
    return rows.map(rowToMemory);
  },

  findAllForUser(userId: string): AgenticMemory[] {
    const rows = expoDb.getAllSync<MemoryRow>(
      `SELECT * FROM agentic_memories
       WHERE user_id = ? AND deleted_at IS NULL
       ORDER BY confidence DESC, last_observed DESC`,
      [userId],
    );
    return rows.map(rowToMemory);
  },

  findById(id: string): AgenticMemory | null {
    const row = expoDb.getFirstSync<MemoryRow>(
      `SELECT * FROM agentic_memories WHERE id = ? AND deleted_at IS NULL`,
      [id],
    );
    return row ? rowToMemory(row) : null;
  },

  findByDescription(
    userId: string,
    type: MemoryType,
    description: string,
  ): AgenticMemory | null {
    const row = expoDb.getFirstSync<MemoryRow>(
      `SELECT * FROM agentic_memories
       WHERE user_id = ? AND type = ? AND description = ? AND deleted_at IS NULL`,
      [userId, type, description],
    );
    return row ? rowToMemory(row) : null;
  },

  reinforceMemory(id: string): void {
    const existing = expoDb.getFirstSync<MemoryRow>(
      `SELECT * FROM agentic_memories WHERE id = ?`,
      [id],
    );
    if (!existing) return;

    const now = new Date().toISOString();
    const newObs = existing.observations + 1;
    const newConfidence = calculateConfidence({
      observations: newObs,
      successRate: existing.success_rate,
      lastObservedIso: now,
    });

    expoDb.runSync(
      `UPDATE agentic_memories
       SET observations = ?, reinforced = reinforced + 1,
           last_observed = ?, confidence = ?, updated_at = ?,
           sync_status = 'pending'
       WHERE id = ?`,
      [newObs, now, newConfidence, now, id],
    );
  },

  recordOutcome(id: string, success: boolean): void {
    const existing = expoDb.getFirstSync<MemoryRow>(
      `SELECT * FROM agentic_memories WHERE id = ?`,
      [id],
    );
    if (!existing) return;

    const now = new Date().toISOString();
    const newSuccessful = existing.applied_successfully + (success ? 1 : 0);
    const newUnsuccessful =
      existing.applied_unsuccessfully + (success ? 0 : 1);
    const total = newSuccessful + newUnsuccessful;
    const newSuccessRate = total > 0 ? newSuccessful / total : 0.5;

    const newConfidence = calculateConfidence({
      observations: existing.observations,
      successRate: newSuccessRate,
      lastObservedIso: existing.last_observed,
    });

    expoDb.runSync(
      `UPDATE agentic_memories
       SET applied_successfully = ?, applied_unsuccessfully = ?,
           success_rate = ?, confidence = ?, last_applied = ?,
           updated_at = ?, sync_status = 'pending'
       WHERE id = ?`,
      [newSuccessful, newUnsuccessful, newSuccessRate, newConfidence, now, now, id],
    );
  },

  pruneExpired(userId: string, budget: number = 500): number {
    const countResult = expoDb.getFirstSync<{ cnt: number }>(
      `SELECT COUNT(*) as cnt FROM agentic_memories
       WHERE user_id = ? AND deleted_at IS NULL`,
      [userId],
    );
    const count = countResult?.cnt ?? 0;
    if (count <= budget) return 0;

    const toRemove = count - budget;
    const now = new Date().toISOString();

    const candidates = expoDb.getAllSync<{ id: string }>(
      `SELECT id FROM agentic_memories
       WHERE user_id = ? AND deleted_at IS NULL
       ORDER BY confidence ASC
       LIMIT ?`,
      [userId, toRemove],
    );

    for (const c of candidates) {
      expoDb.runSync(
        `UPDATE agentic_memories
         SET deleted_at = ?, sync_status = 'pending'
         WHERE id = ?`,
        [now, c.id],
      );
    }

    return candidates.length;
  },

  insertDisagreement(data: {
    userId: string;
    context: MemoryContext;
    aiSuggested: string;
    userChose: string;
  }): string {
    const id = generateId();
    const now = new Date().toISOString();
    expoDb.runSync(
      `INSERT INTO user_disagreements
         (id, user_id, context, ai_suggested, user_chose, created_at, sync_status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [
        id,
        data.userId,
        JSON.stringify(data.context),
        data.aiSuggested,
        data.userChose,
        now,
      ],
    );
    return id;
  },

  findDisagreementsFor(
    userId: string,
    aiSuggested: string,
    limit: number = 10,
  ): UserDisagreement[] {
    const rows = expoDb.getAllSync<DisagreementRow>(
      `SELECT * FROM user_disagreements
       WHERE user_id = ? AND ai_suggested = ?
       ORDER BY created_at DESC
       LIMIT ?`,
      [userId, aiSuggested, limit],
    );
    return rows.map(rowToDisagreement);
  },
};
