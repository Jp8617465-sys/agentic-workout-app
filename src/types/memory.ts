import type { SyncStatus } from "./workout";

export type MemoryType =
  | "pattern"
  | "preference"
  | "adaptation"
  | "warning"
  | "success_factor";

export interface MemoryContext {
  exercise?: string;
  phase?: string;
  dayOfWeek?: number;
  muscleGroup?: string;
  conditions?: string[];
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
  trigger: string;
  action: string;
  confidence: number;
  reinforced: number;
  appliedSuccessfully: number;
  appliedUnsuccessfully: number;
  lastApplied: string | null;
  syncStatus: SyncStatus;
  createdAt: string;
  updatedAt: string;
}

export interface PatternDetectionResult {
  type: MemoryType;
  description: string;
  context: MemoryContext;
  confidence: number;
  trigger: string;
  action: string;
  observations: number;
  successRate: number;
}

export interface MemoryStats {
  total: number;
  avgConfidence: number;
  byType: Record<MemoryType, number>;
}
