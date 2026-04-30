import { eq } from "drizzle-orm";
import { db } from "../../lib/database";
import { rehabProtocols } from "../../lib/schema";
import { generateId } from "../../lib/uuid";
import type { RehabProtocol } from "./types";

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

function todayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

function toRehabProtocol(
  row: typeof rehabProtocols.$inferSelect,
): RehabProtocol {
  return {
    id: row.id,
    userId: row.userId,
    protocolName: row.protocolName,
    currentPhase: row.currentPhase,
    phaseStartDate: row.phaseStartDate,
    progressionEligibleDate: row.progressionEligibleDate,
    autoProgress: row.autoProgress,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    syncStatus: row.syncStatus as RehabProtocol["syncStatus"],
  };
}

export function getActiveProtocol(
  userId: string,
): RehabProtocol | null {
  const rows = db
    .select()
    .from(rehabProtocols)
    .where(eq(rehabProtocols.userId, userId))
    .limit(1)
    .all();

  if (rows.length === 0) {
    return null;
  }

  return toRehabProtocol(rows[0]);
}

export function createProtocol(
  userId: string,
  protocolName: string,
): RehabProtocol {
  const now = new Date().toISOString();
  const today = todayDateString();
  const eligibleDate = addDays(today, 14);

  const protocol: typeof rehabProtocols.$inferInsert = {
    id: generateId(),
    userId,
    protocolName,
    currentPhase: 1,
    phaseStartDate: today,
    progressionEligibleDate: eligibleDate,
    autoProgress: false,
    createdAt: now,
    updatedAt: now,
    syncStatus: "pending",
  };

  db.insert(rehabProtocols).values(protocol).run();

  return toRehabProtocol(protocol as typeof rehabProtocols.$inferSelect);
}

export function advancePhase(protocolId: string): void {
  const now = new Date().toISOString();
  const today = todayDateString();
  const eligibleDate = addDays(today, 14);

  db.update(rehabProtocols)
    .set({
      currentPhase: 2,
      phaseStartDate: today,
      progressionEligibleDate: eligibleDate,
      updatedAt: now,
      syncStatus: "pending",
    })
    .where(eq(rehabProtocols.id, protocolId))
    .run();
}

export function isProgressionDue(protocolId: string): boolean {
  const rows = db
    .select({ progressionEligibleDate: rehabProtocols.progressionEligibleDate })
    .from(rehabProtocols)
    .where(eq(rehabProtocols.id, protocolId))
    .limit(1)
    .all();

  if (rows.length === 0) {
    return false;
  }

  const today = todayDateString();
  return today >= rows[0].progressionEligibleDate;
}
