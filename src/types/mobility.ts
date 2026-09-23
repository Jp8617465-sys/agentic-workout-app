import type { SyncStatus } from "./workout";

export type MobilityTestId = "knee_to_wall" | "toe_touch" | "deep_squat_hold";

export type MobilitySide = "left" | "right" | "both";

export interface MobilityAssessment {
  id: string;
  userId: string;
  test: MobilityTestId;
  side: MobilitySide;
  value: number;
  measuredAt: string;
  syncStatus: SyncStatus;
  createdAt: string;
}
