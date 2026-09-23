import type { SetType } from "../../../types";

export type WeightUnit = "kg" | "lb";

export interface ParsedSet {
  setNumber: number;
  type: SetType;
  weight: number | null;
  weightUnit: WeightUnit | null;
  reps: number | null;
  rpe: number | null;
  durationSeconds: number | null;
  distanceKm: number | null;
}

export interface ParsedExercise {
  sourceName: string;
  sets: ParsedSet[];
}

export interface ParsedWorkout {
  title: string;
  /** Local wall-clock time, ISO without timezone: YYYY-MM-DDTHH:mm:00 */
  startedAt: string;
  /** YYYY-MM-DD, matching workouts.date */
  date: string;
  exercises: ParsedExercise[];
  sourceUrl: string | null;
}

export interface ParseResult {
  workouts: ParsedWorkout[];
  warnings: string[];
}

export interface ResolvedExerciseName {
  name: string;
  matchedLibrary: boolean;
}

export interface ImportSummary {
  imported: number;
  skippedDuplicates: number;
  createdExercises: string[];
  personalRecords: number;
}
