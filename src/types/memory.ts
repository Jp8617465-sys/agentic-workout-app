export type MemoryType =
  | "pattern"
  | "preference"
  | "adaptation"
  | "warning"
  | "success_factor"
  | "failure_factor";

export interface MemoryContext {
  exerciseName?: string;
  muscleGroup?: string;
  phase?: string;
  dayOfWeek?: number;
  [key: string]: unknown;
}

export interface AgenticMemory {
  id: string;
  userId: string;
  type: MemoryType;
  description: string;
  context: MemoryContext;
  observations: number;
  successRate: number;
  firstObserved: string;
  lastObserved: string;
  trigger: string | null;
  action: string | null;
  confidence: number;
  reinforced: number;
  appliedSuccessfully: number;
  appliedUnsuccessfully: number;
  lastApplied: string | null;
  createdAt: string;
  updatedAt: string;
  syncStatus: string;
  deletedAt: string | null;
}

export interface UserDisagreement {
  id: string;
  userId: string;
  context: MemoryContext;
  aiSuggested: string;
  userChose: string;
  createdAt: string;
  syncStatus: string;
}

export interface NewMemoryInput {
  userId: string;
  type: MemoryType;
  description: string;
  context: MemoryContext;
  trigger?: string;
  action?: string;
}

export interface ConfidenceFactors {
  observations: number;
  successRate: number;
  lastObservedIso: string;
}
