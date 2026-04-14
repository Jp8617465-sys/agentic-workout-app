import { expoDb } from "../../lib/database";
import { generateId } from "../../lib/uuid";
import type { ReadinessLog, ReadinessLevel } from "./types";

interface ReadinessRow {
  id: string;
  user_id: string;
  date: string;
  energy: number;
  soreness: number;
  motivation: number;
  created_at: string;
}

function rowToLog(row: ReadinessRow): ReadinessLog {
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    energy: row.energy as ReadinessLevel,
    soreness: row.soreness as ReadinessLevel,
    motivation: row.motivation as ReadinessLevel,
    createdAt: row.created_at,
  };
}

export const readinessRepository = {
  findByDate(userId: string, date: string): ReadinessLog | null {
    const row = expoDb.getFirstSync<ReadinessRow>(
      `SELECT * FROM readiness_logs WHERE user_id = ? AND date = ?`,
      [userId, date],
    );
    return row ? rowToLog(row) : null;
  },

  insert(log: Omit<ReadinessLog, "id" | "createdAt">): ReadinessLog {
    const id = generateId();
    const now = new Date().toISOString();

    expoDb.runSync(
      `INSERT INTO readiness_logs (id, user_id, date, energy, soreness, motivation, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, log.userId, log.date, log.energy, log.soreness, log.motivation, now],
    );

    return { ...log, id, createdAt: now };
  },
};
