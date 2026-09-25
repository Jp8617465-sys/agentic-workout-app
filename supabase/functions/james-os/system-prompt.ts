import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

type JamesState = {
  current_phase: string | null;
  week_in_phase: number;
  mesocycle_week: number;
  last_session_date: string | null;
  last_session_rpe: number | null;
  consecutive_high_rpe_sessions: number;
  active_constraints: string[];
  coaching_notes: string | null;
};

type WellnessLog = {
  log_date: string;
  soreness: number;
  energy: number;
  mood: number;
  stress: number;
  wellness_score: number;
  notes: string | null;
};

/**
 * Assembles the complete system prompt for a coaching session by combining:
 * 1. The active versioned prompt from the system_prompts table
 * 2. Injected KB context (fetched separately by kb-loader)
 * 3. James's current state and today's wellness log
 */
export async function buildSystemPrompt(
  adminClient: SupabaseClient,
  userId: string,
  kbContext: string,
  todayDate: string
): Promise<string> {
  // 1. Fetch active system prompt version
  const { data: promptRow, error: promptErr } = await adminClient
    .from("system_prompts")
    .select("content")
    .eq("is_active", true)
    .single();

  const basePrompt = promptErr || !promptRow
    ? "You are JAMES-OS, an elite strength and conditioning coach."
    : promptRow.content;

  // 2. Fetch current james_state
  const { data: stateRow } = await adminClient
    .from("james_state")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const state = stateRow as JamesState | null;

  // 3. Fetch today's wellness log
  const { data: wellnessRow } = await adminClient
    .from("james_wellness_log")
    .select("*")
    .eq("user_id", userId)
    .eq("log_date", todayDate)
    .maybeSingle();

  const wellness = wellnessRow as WellnessLog | null;

  // 4. Assemble
  const parts: string[] = [basePrompt];

  if (kbContext) {
    parts.push(kbContext);
  }

  if (state) {
    const constraintStr =
      state.active_constraints.length > 0
        ? state.active_constraints.join(", ")
        : "none (athlete is fully available)";

    parts.push(`## Current Training State
- Phase: ${state.current_phase ?? "unknown"}
- Week in phase: ${state.week_in_phase}
- Mesocycle week: ${state.mesocycle_week}
- Last session: ${state.last_session_date ?? "no recent session"}${state.last_session_rpe != null ? ` (RPE ${state.last_session_rpe})` : ""}
- Consecutive high-RPE sessions: ${state.consecutive_high_rpe_sessions}
- Active constraints: ${constraintStr}${state.coaching_notes ? `\n- Coaching notes: ${state.coaching_notes}` : ""}`);
  }

  if (wellness) {
    parts.push(`## Today's Readiness (${todayDate})
- Soreness: ${wellness.soreness}/5
- Energy: ${wellness.energy}/5
- Mood: ${wellness.mood}/5
- Stress: ${wellness.stress}/5
- Wellness score: ${wellness.wellness_score}/20${wellness.notes ? `\n- Notes: ${wellness.notes}` : ""}`);
  }

  return parts.join("\n\n");
}
