export type ReadinessLevel = 1 | 2 | 3;

export interface BriefExercise {
  exerciseName: string;
  sets: number;
  reps: number;
  weight: number | null;
  rpe: number | null;
}

export interface DailyBrief {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  sessionType: string;
  estimatedDurationMinutes: number | null;
  phase: string | null;
  weekNumber: number | null;
  exercises: BriefExercise[];
  source: "deterministic" | "mesocycle" | "ai";
  rationale: string | null;
  createdAt: string;
}

export interface ReadinessLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  energy: ReadinessLevel;     // 1=low  2=medium  3=high
  soreness: ReadinessLevel;   // 1=none 2=mild    3=significant
  motivation: ReadinessLevel; // 1=low  2=medium  3=high
  createdAt: string;
}
