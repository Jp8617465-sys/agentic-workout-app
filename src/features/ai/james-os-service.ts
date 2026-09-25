import { supabase } from "@/lib/supabase";
import type {
  JamesOSMode,
  JamesOSResponse,
  CoachingSessionResponse,
  CoachingSessionPayload,
  DT03Input,
  DT03Output,
  WellnessCheckinResponse,
  StateSyncResponse,
  JamesWellnessLog,
} from "@/types/james-os";
import { JamesOSError } from "@/types/james-os";

async function callJamesOS<T extends JamesOSResponse>(
  mode: JamesOSMode,
  payload: Record<string, unknown> = {}
): Promise<T> {
  const { data, error } = await supabase.functions.invoke("james-os", {
    body: { mode, ...payload },
  });

  if (error) {
    throw new JamesOSError(
      "INVOKE_ERROR",
      `james-os/${mode} failed: ${error.message}`
    );
  }

  if (data?.error) {
    throw new JamesOSError("API_ERROR", data.error as string);
  }

  return data as T;
}

/**
 * Runs a full coaching session: DT-01 readiness assessment → KB context → Claude.
 * Returns SOAP notes + session type + volume/intensity modifiers.
 */
export async function getCoachingSession(
  options: CoachingSessionPayload = {}
): Promise<CoachingSessionResponse> {
  return callJamesOS<CoachingSessionResponse>("coaching_session", options as Record<string, unknown>);
}

/**
 * Fast-path load recommendation using DT-03 only (no Claude call).
 * Derives active constraints live from the injuries table server-side.
 */
export async function getLoadRecommendation(
  input: DT03Input,
  workoutId?: string
): Promise<DT03Output> {
  return callJamesOS<DT03Output>("load_recommendation", {
    input,
    ...(workoutId ? { workout_id: workoutId } : {}),
  });
}

/**
 * Logs today's wellness check-in. Upserts on (user_id, log_date).
 */
export async function logWellness(
  log: Omit<JamesWellnessLog, "id" | "user_id" | "created_at" | "wellness_score">
): Promise<WellnessCheckinResponse> {
  return callJamesOS<WellnessCheckinResponse>("wellness_checkin", log);
}

/**
 * Syncs state: re-derives active_constraints from live injuries table,
 * updates james_state cache, returns current state + recent wellness + last session notes.
 * Call this after marking an injury as resolved to propagate the constraint change.
 */
export async function syncState(): Promise<StateSyncResponse> {
  return callJamesOS<StateSyncResponse>("state_sync");
}
