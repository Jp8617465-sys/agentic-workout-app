export type PeriodizationModel = "linear" | "block" | "dup" | "conjugate";

export type MesocyclePhase = "accumulation" | "intensification" | "realization" | "deload";

export type MesocycleStatus = "active" | "completed" | "paused" | "abandoned";

export type MicrocycleStatus = "pending" | "active" | "completed" | "skipped";

export interface MesocycleExercisePlan {
  exerciseName: string;
  sets: number;
  repRange: string;
  targetRpe: number;
  restSeconds: number;
  notes: string | null;
}

export interface MesocycleSessionPlan {
  dayOfWeek: number;
  sessionType: string;
  exercises: MesocycleExercisePlan[];
  estimatedDurationMinutes: number;
}

export interface MesocycleWeekPlan {
  weekNumber: number;
  phase: MesocyclePhase;
  sessions: MesocycleSessionPlan[];
}

export interface GeneratedMesocyclePlan {
  name: string;
  durationWeeks: number;
  periodizationModel: PeriodizationModel;
  goal: string;
  weeks: MesocycleWeekPlan[];
}

export interface Mesocycle {
  id: string;
  userId: string;
  name: string;
  periodizationModel: PeriodizationModel;
  startDate: string;
  endDate: string;
  durationWeeks: number;
  status: MesocycleStatus;
  goal: string;
  generatedPlan: GeneratedMesocyclePlan;
  finalReview: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Microcycle {
  id: string;
  mesocycleId: string;
  weekNumber: number;
  phase: MesocyclePhase;
  targetVolume: number | null;
  targetIntensity: number | null;
  targetFrequency: number | null;
  actualVolume: number | null;
  actualIntensity: number | null;
  actualFrequency: number | null;
  status: MicrocycleStatus;
  review: string | null;
}
