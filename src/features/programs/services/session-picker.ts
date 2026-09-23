import type { MesocycleSessionPlan, MesocycleWeekPlan } from "../../../types";

export interface SessionPickInput {
  flexible: boolean;
  /** 0 = Sunday, matching Date#getDay */
  dayOfWeek: number;
  completedThisWeek: number;
}

/**
 * Fixed plans return the session scheduled for today. Flexible plans return the next
 * session in rotation, so a missed day shifts the plan instead of skipping a session.
 */
export function pickSession(
  week: MesocycleWeekPlan,
  input: SessionPickInput,
): MesocycleSessionPlan | null {
  if (!input.flexible) {
    return week.sessions.find((s) => s.dayOfWeek === input.dayOfWeek) ?? null;
  }
  return week.sessions[input.completedThisWeek] ?? null;
}

/** Top of a rep range like "6-8" → 8; single values pass through; falls back to 8. */
export function targetRepsFromRange(repRange: string): number {
  const parts = repRange.split("-").map((p) => parseInt(p, 10));
  const target = parts.length > 1 ? parts[1] : parts[0];
  return Number.isNaN(target) ? 8 : target;
}

export function weekStartDate(
  mesocycleStartDate: string,
  weekNumber: number,
): string {
  const d = new Date(`${mesocycleStartDate}T12:00:00`);
  d.setDate(d.getDate() + (weekNumber - 1) * 7);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
