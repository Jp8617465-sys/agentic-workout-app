export type ExerciseCategory = "compound" | "isolation" | "cardio" | "flexibility";

export type ExercisePattern =
  | "squat"
  | "hinge"
  | "horizontal_push"
  | "vertical_push"
  | "horizontal_pull"
  | "vertical_pull"
  | "carry"
  | "rotation"
  | "lunge"
  | "core"
  | "cardio"
  | "flexibility";

export type Equipment =
  | "barbell"
  | "dumbbell"
  | "kettlebell"
  | "cable"
  | "machine"
  | "bodyweight"
  | "band"
  | "squat_rack"
  | "bench"
  | "pull_up_bar"
  | "dip_station"
  | "ez_bar"
  | "trap_bar"
  | "smith_machine"
  | "treadmill"
  | "bike"
  | "rower"
  | "jump_rope"
  | "mat"
  | "foam_roller"
  | "none";

export type MuscleGroup =
  | "quadriceps"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "chest"
  | "upper_back"
  | "lats"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "forearms"
  | "core"
  | "hip_flexors"
  | "adductors"
  | "abductors"
  | "traps"
  | "rear_delts"
  | "front_delts"
  | "side_delts"
  | "lower_back"
  | "obliques"
  | "full_body"
  | "cardiovascular";

export type InjuryRiskLevel = "LOW" | "MODERATE" | "HIGH";

export interface Exercise {
  exerciseId: string;
  name: string;
  category: ExerciseCategory;
  pattern: ExercisePattern;
  equipment: Equipment[];
  muscleGroups: MuscleGroup[];
  defaultTempo: string;
  defaultRestSeconds: number;
  instructions: string[];
  cues: string[];
  commonMistakes: string[];
  variations: string[];
}

export interface InjuryRisk {
  id: string;
  exerciseId: string;
  injuryType: string;
  riskLevel: InjuryRiskLevel;
  contraindications: string[];
  modifications: string[];
}
