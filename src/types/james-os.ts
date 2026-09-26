// Types for the JAMES-OS coaching layer.
// Mirrors the Supabase tables from migrations 004 and 006 and the Edge Function API shapes.

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
  // 1–5 scales are optional since 006: Cowork check-ins may carry only sleep + pain.
  soreness: number | null;
  energy: number | null;
  mood: number | null;
  stress: number | null;
  wellness_score: number | null; // generated: soreness+energy+mood+stress (4–20), NULL if any missing
  notes: string | null;
  sleep_hours: number | null;
  sleep_quality: number | null; // 1–5
  pain_ankle: number | null; // 0–10
  pain_back: number | null; // 0–10
  bodyweight_kg: number | null;
  source: RowSource;
  /** Set by the weekly coach once the check-in has been folded into a weekly_review. */
  reviewed_at: string | null;
  created_at: string;
}

/** Input accepted by the james-os `wellness_checkin` mode (all four scales required). */
export type WellnessCheckinInput = {
  soreness: number;
  energy: number;
  mood: number;
  stress: number;
  notes: string | null;
};

export type RowSource =
  | "app"
  | "edge_fn"
  | "cowork"
  | "strong_csv"
  | "manual"
  | "seed";

export type SessionCode =
  | "A"
  | "B"
  | "C"
  | "R1"
  | "R2"
  | "R3"
  | "MOB"
  | "OTHER";

export interface LoggedSet {
  lift: string;
  set: number;
  load_kg: number | null;
  reps: number | null;
  rpe: number | null;
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
  session_date: string | null;
  block_id: string | null;
  week_no: number | null;
  session_code: SessionCode | null;
  completed: boolean;
  session_rpe: number | null;
  duration_min: number | null;
  sets: LoggedSet[];
  run: { minutes?: number; distance_km?: number; type?: string } | null;
  source: RowSource;
  external_ref: string | null;
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

// ─── Training block (migration 006) ───────────────────────────────────────────

export type BlockStatus = "planned" | "active" | "completed" | "abandoned";
export type BlockPhase = "build" | "deload" | "retest";
export type LoadClass =
  | "barbell_lower"
  | "barbell_upper"
  | "dumbbell"
  | "cable"
  | "machine"
  | "bodyweight"
  | "carry";
export type TargetUnit =
  | "reps"
  | "reps_per_leg"
  | "reps_per_side"
  | "seconds"
  | "seconds_per_side"
  | "metres";

export interface TrainingBlock {
  id: string;
  athlete_id: string;
  name: string;
  start_date: string;
  end_date: string;
  total_weeks: number;
  priorities: string[];
  rules: Record<string, unknown>;
  weekly_layout: Record<string, unknown>;
  status: BlockStatus;
  created_at: string;
  updated_at: string;
}

export interface BlockWeek {
  id: string;
  block_id: string;
  week_no: number;
  week_start: string;
  phase: BlockPhase;
  run_1: string | null;
  run_2: string | null;
  run_3: string | null;
  run_1_min: number | null;
  run_2_min: number | null;
  run_3_min: number | null;
  planned_sets: Record<string, number>;
  notes: string | null;
}

export interface BlockLift {
  id: string;
  block_id: string;
  session_code: "A" | "B" | "C";
  position: number;
  lift: string;
  sets: number;
  target: number;
  target_unit: TargetUnit;
  load_class: LoadClass;
  notes: string | null;
}

/** Append-only. */
export interface WorkingLoad {
  id: string;
  block_id: string;
  lift: string;
  load_kg: number;
  effective_from_week: number;
  reason: string;
  source: RowSource;
  created_at: string;
}

export interface WeeklyReviewDecision {
  type: string;
  lift?: string;
  from?: number;
  to?: number;
  reason: string;
}

/** Append-only. */
export interface WeeklyReview {
  id: string;
  block_id: string;
  week_no: number;
  reviewed_at: string;
  last_checkin_reviewed_at: string | null;
  sessions_done: number;
  sessions_planned: number;
  key_lifts: Record<string, unknown>;
  runs: unknown[];
  sleep_summary: {
    nights_logged?: number;
    avg_hours?: number;
    nights_under_5h?: number;
  };
  pain_ankle: number | null;
  pain_back: number | null;
  flags: string[];
  decisions: WeeklyReviewDecision[];
  calendar_event_ids: string[];
  summary_text: string;
  created_at: string;
}

export interface BlockCurrentView {
  block_id: string;
  athlete_id: string;
  name: string;
  start_date: string;
  end_date: string;
  priorities: string[];
  rules: Record<string, unknown>;
  weekly_layout: Record<string, unknown>;
  current_week: number;
  not_started: boolean;
  past_end: boolean;
  week: Omit<BlockWeek, "id" | "block_id"> | null;
  current_loads: Record<
    string,
    {
      load_kg: number;
      effective_from_week: number;
      reason: string;
      set_at: string;
    }
  >;
  last_reviews: WeeklyReview[];
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

export type TrainingPhase =
  | "accumulation"
  | "intensification"
  | "realization"
  | "deload";

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
    message: string,
  ) {
    super(message);
    this.name = "JamesOSError";
  }
}
