import { expoDb } from "../../lib/database";
import { supabase } from "../../lib/supabase";
import type { Mesocycle } from "../../types";

export function checkMilestone(
  mesocycle: Mesocycle,
  currentWeek: number,
): boolean {
  const plan = mesocycle.generatedPlan;

  // Check at every 4th week
  if (currentWeek > 1 && currentWeek % 4 === 0) return true;

  // Check at phase boundaries
  if (currentWeek < 2 || !plan.weeks) return false;
  const currentPhase = plan.weeks.find((w) => w.weekNumber === currentWeek)?.phase;
  const previousPhase = plan.weeks.find((w) => w.weekNumber === currentWeek - 1)?.phase;

  return currentPhase !== previousPhase;
}

interface WeekSummaryRow {
  week_start: string;
  total_volume: number;
  avg_rpe: number;
  session_count: number;
}

export async function generateMilestoneReview(
  mesocycleId: string,
  userId: string,
  weekRange: [number, number],
): Promise<string | null> {
  // Gather workout data for the period
  const rows = expoDb.getAllSync<WeekSummaryRow>(
    `SELECT
       date as week_start,
       COALESCE(total_volume, 0) as total_volume,
       COALESCE(average_rpe, 0) as avg_rpe,
       1 as session_count
     FROM workouts
     WHERE user_id = ? AND mesocycle_id = ? AND status = 'completed'
     ORDER BY date ASC`,
    [userId, mesocycleId],
  );

  if (rows.length === 0) return null;

  const workoutData = {
    totalSessions: rows.length,
    totalVolume: rows.reduce((sum, r) => sum + r.total_volume, 0),
    averageRpe: rows.reduce((sum, r) => sum + r.avg_rpe, 0) / rows.length,
    sessions: rows,
  };

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;
    if (!token) return null;

    const { data, error } = await supabase.functions.invoke("ai-coach", {
      body: {
        mode: "milestone_review",
        userId,
        weekRange,
        workoutData,
      },
      headers: { Authorization: `Bearer ${token}` },
    });

    if (error) return null;
    return (data as { review: string }).review ?? null;
  } catch {
    return null;
  }
}
