export type SessionTestType =
  | "RPE_PROGRESSION"
  | "ACTIVATION_CHECK"
  | "TEMPO_HOLD"
  | "TECHNIQUE_FLAG"
  | "PAIN_CHECK";

export interface SessionTestContext {
  exerciseName?: string;
  description: string;
  whatToWatch: string;
  howToReport: string;
}

export interface SessionTest {
  id: string;
  workoutId: string;
  userId: string;
  testType: SessionTestType;
  testContext: SessionTestContext;
  result: SessionTestResult | null;
  evaluatedAt: string | null;
  createdAt: string;
}

export type SessionTestResult =
  | { type: "RPE_PROGRESSION"; rpe: number }
  | { type: "ACTIVATION_CHECK"; outcome: "felt_it" | "partial" | "quad_dominant" }
  | { type: "TEMPO_HOLD"; outcome: "held_it" | "drifted" }
  | { type: "TECHNIQUE_FLAG"; outcome: "clean" | "minor_breakdown" | "stopped_early" }
  | { type: "PAIN_CHECK"; painLevel: number };

export type ProgressionDecisionType =
  | "increase_load"
  | "hold_load"
  | "hold_load_extended"
  | "expand_prehab"
  | "add_cue"
  | "suppress_progression"
  | "flag_injury_review";

export interface ProgressionDecision {
  id: string;
  userId: string;
  exerciseName: string;
  decisionType: ProgressionDecisionType;
  holdSessions: number;
  sourceTestId: string;
  appliedAt: string | null;
  createdAt: string;
}
