// Types for the JAMES-OS coaching layer.
// Mirrors the Supabase tables from migration 004 and the Edge Function API shapes.

export type JamesOSMode =
  | "coaching_session"
  | "load_recommendation"
  | "wellness_checkin"
  | "state_sync";

export type JamesOSCommand =
  | "morning_brief"
  | "session_plan"
  | "log_session"
  | "log_wellness"
  | "log_meal"
  | "check_readiness"
  | "triage_pain"
  | "weekly_review"
  | "mesocycle_review"
  | "plateau_diagnosis"
  | "explain"
  | "handoff_clinician"
  | "state"
  | "chat";

// ─── Supabase table row types ─────────────────────────────────────────────────

export interface JamesState {
  user_id: string;
  current_phase: string | null;
  week_in_phase: number;
  mesocycle_week: number;
  last_session_date: string | null;
  last_session_rpe: number | null;
  consecutive_high_rpe_sessions: number;
  /** Cache derived from injuries table — refreshed on state_sync. */
  active_constraints: string[];
  coaching_notes: string | null;
  updated_at: string;
}

export interface JamesWellnessLog {
  id: string;
  user_id: string;
  log_date: string; // YYYY-MM-DD
  soreness: number;  // 1–5
  energy: number;    // 1–5
  mood: number;      // 1–5
  stress: number;    // 1–5
  wellness_score: number; // generated: soreness+energy+mood+stress (4–20)
  notes: string | null;
  created_at: string;
}

export interface JamesSessionNotes {
  id: string;
  user_id: string;
  workout_id: string | null;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  constraint_flags: string[];
  created_at: string;
}

export interface JamesAdjustmentLog {
  id: string;
  user_id: string;
  workout_id: string | null;
  exercise_name: string | null;
  decision_tree: "DT-01" | "DT-03";
  input_snapshot: Record<string, unknown>;
  recommended_action: string;
  actual_action: string | null;
  rationale: string;
  created_at: string;
}

// ─── Decision tree I/O ────────────────────────────────────────────────────────

export type SessionType = "full" | "reduced" | "active_recovery" | "rest";

export interface DT01Input {
  wellnessScore: number;
  lastSessionRpe: number | null;
  consecutiveHighRpeSessions: number;
  daysSinceLastSession: number;
}

export interface DT01Output {
  sessionType: SessionType;
  volumeModifier: number;
  intensityModifier: number;
  rationale: string;
}

export type TrainingPhase = "accumulation" | "intensification" | "realization" | "deload";

export interface DT03Input {
  exerciseName: string;
  lastWeight: number;
  lastRpe: number;
  targetRpe: number;
  sets: number;
  reps: number;
  phase: TrainingPhase;
  activeConstraints: string[];
}

export interface DT03Output {
  recommendedWeight: number;
  sets: number;
  reps: number;
  rationale: string;
  constraintApplied: boolean;
  activeConstraints: string[];
}

// ─── Edge Function request/response ──────────────────────────────────────────

export interface WellnessCheckinPayload {
  soreness: number;
  energy: number;
  mood: number;
  stress: number;
  notes?: string;
}

export interface LoadRecommendationPayload {
  input: DT03Input;
  workout_id?: string;
}

export interface CoachingSessionPayload {
  command?: JamesOSCommand;
  message?: string;
  workout_id?: string;
}

export interface JamesOSRequest {
  mode: JamesOSMode;
  [key: string]: unknown;
}

export interface CoachingSessionResponse {
  command: JamesOSCommand;
  sessionType: SessionType;
  volumeModifier: number;
  intensityModifier: number;
  dt01Rationale: string;
  activeConstraints: string[];
  kb_files_loaded: string[];
  coaching: string;
  noteId: string | null;
}

export interface StateSyncResponse {
  state: JamesState | null;
  recentWellness: JamesWellnessLog[];
  lastSessionNotes: JamesSessionNotes | null;
  activeConstraints: string[];
}

export interface WellnessCheckinResponse {
  success: boolean;
  date: string;
  wellness_score: number;
}

export type JamesOSResponse =
  | CoachingSessionResponse
  | DT03Output
  | WellnessCheckinResponse
  | StateSyncResponse;

// ─── Error type ───────────────────────────────────────────────────────────────

export class JamesOSError extends Error {
  constructor(
    public readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "JamesOSError";
  }
}
