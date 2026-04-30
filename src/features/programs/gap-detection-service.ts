import { desc, eq, and } from "drizzle-orm";
import { db } from "../../lib/database";
import { workouts } from "../../lib/schema";

export interface ReEntryProtocol {
  isReEntry: boolean;
  gapDays: number;
  loadReductionPercent: number;
  maxSets: number;
  rpeHardCap: number | null;
  sessionsOnProtocol: number;
  extendedPrehab: boolean;
}

const NO_RE_ENTRY: ReEntryProtocol = {
  isReEntry: false,
  gapDays: 0,
  loadReductionPercent: 0,
  maxSets: Infinity,
  rpeHardCap: null,
  sessionsOnProtocol: 0,
  extendedPrehab: false,
};

function daysBetween(dateA: string, dateB: string): number {
  const msPerDay = 86_400_000;
  const a = new Date(dateA + "T00:00:00Z");
  const b = new Date(dateB + "T00:00:00Z");
  return Math.round(Math.abs(b.getTime() - a.getTime()) / msPerDay);
}

function todayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

export const GapDetectionService = {
  getLastSessionDate(userId: string): string | null {
    const rows = db
      .select({ date: workouts.date })
      .from(workouts)
      .where(and(eq(workouts.userId, userId), eq(workouts.status, "completed")))
      .orderBy(desc(workouts.date))
      .limit(1)
      .all();

    if (rows.length === 0) return null;
    return rows[0].date;
  },

  calculateGap(userId: string): number {
    const lastDate = GapDetectionService.getLastSessionDate(userId);
    if (lastDate === null) return 0;
    return daysBetween(lastDate, todayDateString());
  },

  getReEntryProtocol(userId: string, illnessFlag: boolean): ReEntryProtocol {
    const gapDays = GapDetectionService.calculateGap(userId);

    if (gapDays < 7) {
      return { ...NO_RE_ENTRY, gapDays };
    }

    let loadReductionPercent: number;
    let sessionsOnProtocol: number;

    if (gapDays <= 10) {
      // 7-10 day gap
      loadReductionPercent = 0.125;
      sessionsOnProtocol = 1;
    } else if (gapDays <= 21) {
      // 11-21 day gap
      loadReductionPercent = 0.175;
      sessionsOnProtocol = 2;
    } else {
      // 22+ day gap
      loadReductionPercent = 0.225;
      sessionsOnProtocol = 2;
    }

    let rpeHardCap: number | null = null;

    if (illnessFlag) {
      loadReductionPercent += 0.05;
      rpeHardCap = 7;
    }

    return {
      isReEntry: true,
      gapDays,
      loadReductionPercent,
      maxSets: 2,
      rpeHardCap,
      sessionsOnProtocol,
      extendedPrehab: true,
    };
  },
};
