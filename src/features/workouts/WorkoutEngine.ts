import * as Haptics from "expo-haptics";
import { workoutRepository } from "./workout-repository";
import { personalRecordsService, type PRCheckResult } from "./personal-records-service";
import { evaluateRPEDeviation, type RPEDeviationResult } from "./rpe-evaluator";
import { calculateRPELoadAdjustment, type LoadAdjustmentResult } from "./progression-calculator";
import { workoutSession$ } from "../../stores/activeWorkoutStore";
import type { SetType } from "../../types";

export interface LogSetInput {
  id: string | null;
  exercisePerformanceId: string;
  exerciseId: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  type: SetType;
  prescribedRpe: number | null;
  prescribedRestSeconds: number | null;
  userId: string;
  workoutId: string;
}

export interface LogSetResult {
  setLogId: string;
  prCheck: PRCheckResult | null;
  rpeDeviation: RPEDeviationResult | null;
  loadAdjustment: LoadAdjustmentResult | null;
  shouldShowRPEModal: boolean;
  shouldShowAdaptation: boolean;
}

export const WorkoutEngine = {
  async logSet(input: LogSetInput): Promise<LogSetResult> {
    const isWorking = input.type === "working";

    // 1. Persist to SQLite
    const setLogId = await workoutRepository.upsertSetLog({
      id: input.id,
      exercisePerformanceId: input.exercisePerformanceId,
      setNumber: input.setNumber,
      weight: input.weight,
      reps: input.reps,
      rpe: input.rpe,
      type: input.type,
      completedAt: new Date().toISOString(),
    });

    // 2. PR detection (working sets with weight + reps only)
    let prCheck: PRCheckResult | null = null;
    if (isWorking && input.weight && input.weight > 0 && input.reps && input.reps > 0 && input.rpe !== null) {
      prCheck = personalRecordsService.checkAndSavePR(
        input.userId,
        input.exerciseId,
        input.weight,
        input.reps,
        input.workoutId,
      );
    }

    // 3. RPE deviation analysis (only when RPE was entered)
    let rpeDeviation: RPEDeviationResult | null = null;
    let loadAdjustment: LoadAdjustmentResult | null = null;

    if (input.rpe !== null && isWorking) {
      rpeDeviation = evaluateRPEDeviation(input.rpe, input.prescribedRpe);

      if (rpeDeviation.hasDeviation && input.weight && input.prescribedRpe !== null) {
        loadAdjustment = calculateRPELoadAdjustment(
          input.weight,
          input.prescribedRpe,
          input.rpe,
        );
      }
    }

    // 4. Haptics — PR gets double haptic (fired in personalRecordsService),
    //    regular sets get standard impact feedback
    if (!prCheck?.isNewPR) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // 5. Start rest timer
    if (input.prescribedRestSeconds && input.prescribedRestSeconds > 0) {
      const endTimestamp = Date.now() + input.prescribedRestSeconds * 1000;
      workoutSession$.restTimer.set({
        isRunning: true,
        endTimestamp,
        totalSeconds: input.prescribedRestSeconds,
        notificationId: null,
      });
      await workoutRepository.updateRestTimer(input.workoutId, endTimestamp);
    }

    const shouldShowRPEModal = input.rpe === null && isWorking;
    const shouldShowAdaptation =
      !shouldShowRPEModal &&
      rpeDeviation !== null &&
      rpeDeviation.hasDeviation &&
      loadAdjustment !== null;

    return {
      setLogId,
      prCheck,
      rpeDeviation,
      loadAdjustment,
      shouldShowRPEModal,
      shouldShowAdaptation,
    };
  },

  async updateSetRPE(
    setLogId: string,
    rpe: number,
    exerciseId: string,
    weight: number | null,
    reps: number | null,
    prescribedRpe: number | null,
    userId: string,
    workoutId: string,
  ): Promise<{
    prCheck: PRCheckResult | null;
    rpeDeviation: RPEDeviationResult | null;
    loadAdjustment: LoadAdjustmentResult | null;
    shouldShowAdaptation: boolean;
  }> {
    // Persist updated RPE to existing set log row
    workoutRepository.updateSetLogRpe(setLogId, rpe);

    // Re-check PR with RPE now known
    let prCheck: PRCheckResult | null = null;
    if (weight && weight > 0 && reps && reps > 0) {
      prCheck = personalRecordsService.checkAndSavePR(
        userId,
        exerciseId,
        weight,
        reps,
        workoutId,
      );
    }

    // Evaluate deviation
    const rpeDeviation = evaluateRPEDeviation(rpe, prescribedRpe);
    let loadAdjustment: LoadAdjustmentResult | null = null;
    if (rpeDeviation.hasDeviation && weight && prescribedRpe !== null) {
      loadAdjustment = calculateRPELoadAdjustment(weight, prescribedRpe, rpe);
    }

    const shouldShowAdaptation = rpeDeviation.hasDeviation && loadAdjustment !== null;

    return { prCheck, rpeDeviation, loadAdjustment, shouldShowAdaptation };
  },
};
