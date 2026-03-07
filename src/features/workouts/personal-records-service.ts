import * as Haptics from "expo-haptics";
import {
  personalRecordsRepository,
  type PersonalRecord,
} from "./personal-records-repository";
import { estimateOneRepMax } from "./progression-calculator";

export interface PRCheckResult {
  isNewPR: boolean;
  pr: PersonalRecord | null;
  previousBest: number | null; // previous best estimated 1RM
}

export const personalRecordsService = {
  // Call after each completed working set to check for and record new PRs.
  checkAndSavePR(
    userId: string,
    exerciseId: string,
    weight: number,
    reps: number,
    workoutId: string,
  ): PRCheckResult {
    if (weight <= 0 || reps <= 0) {
      return { isNewPR: false, pr: null, previousBest: null };
    }

    const { estimatedOneRepMax: newE1RM } = estimateOneRepMax(weight, reps);
    const currentBest = personalRecordsRepository.getBestOneRepMax(
      userId,
      exerciseId,
    );
    const previousBest = currentBest?.estimatedOneRepMax ?? null;

    if (currentBest === null || newE1RM > currentBest.estimatedOneRepMax) {
      personalRecordsRepository.insert({
        userId,
        exerciseId,
        weight,
        reps,
        estimatedOneRepMax: newE1RM,
        achievedAt: new Date().toISOString(),
        workoutId,
      });

      // Double haptic for PR
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const pr = personalRecordsRepository.getBestOneRepMax(
        userId,
        exerciseId,
      );
      return { isNewPR: true, pr, previousBest };
    }

    return { isNewPR: false, pr: currentBest, previousBest };
  },
};
