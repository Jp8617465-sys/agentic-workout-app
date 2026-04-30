import type { SyncStatus } from "../../types/workout";

export interface RehabProtocol {
  id: string;
  userId: string;
  protocolName: string;
  currentPhase: number;
  phaseStartDate: string;
  progressionEligibleDate: string;
  autoProgress: boolean;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
}

export interface RehabExercise {
  name: string;
  sets?: number;
  reps?: number;
  duration?: string;
  notes?: string;
}

export interface ProgressionStatus {
  isDue: boolean;
  currentPhase: number;
  daysRemaining: number;
}
