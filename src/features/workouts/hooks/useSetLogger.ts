import { useState, useCallback, useRef } from "react";
import { WorkoutEngine, type LogSetResult } from "../WorkoutEngine";
import { workoutSession$ } from "../../../stores/activeWorkoutStore";
import type { WorkoutExercise, WorkoutSet } from "../types";
import type { LoadAdjustmentResult } from "../progression-calculator";

export interface RPEModalState {
  visible: boolean;
  exerciseId: string;
  setNumber: number;
  setLogId: string;
  exerciseIndex: number;
  setIndex: number;
  weight: number | null;
  reps: number | null;
  prescribedRpe: number | null;
}

export interface AdaptationAlertState {
  visible: boolean;
  exerciseId: string;
  deviationMagnitude: number;
  adjustment: LoadAdjustmentResult;
}

export interface UseSetLoggerInput {
  exercises: WorkoutExercise[];
  userId: string | null;
  workoutId: string;
  onExercisesUpdate: (exercises: WorkoutExercise[]) => void;
}

export interface UseSetLoggerOutput {
  rpeModalState: RPEModalState | null;
  adaptationState: AdaptationAlertState | null;
  prBannerExerciseId: string | null;
  handleToggleComplete: (exerciseIndex: number, setIndex: number) => void;
  handleRPESubmit: (rpe: number) => Promise<void>;
  handleAdaptationAction: () => void;
}

export function useSetLogger(input: UseSetLoggerInput): UseSetLoggerOutput {
  const [rpeModalState, setRpeModalState] = useState<RPEModalState | null>(null);
  const [adaptationState, setAdaptationState] = useState<AdaptationAlertState | null>(null);
  const [prBannerExerciseId, setPrBannerExerciseId] = useState<string | null>(null);
  const prBannerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleLogSetResult = useCallback(
    (result: LogSetResult, exerciseIndex: number, setIndex: number, setLogId: string) => {
      const exercise = input.exercises[exerciseIndex];
      if (!exercise) return;
      const set = exercise.sets[setIndex];

      if (result.prCheck?.isNewPR) {
        setPrBannerExerciseId(exercise.exerciseId);
        if (prBannerTimer.current) clearTimeout(prBannerTimer.current);
        prBannerTimer.current = setTimeout(() => setPrBannerExerciseId(null), 3000);
      }

      if (result.shouldShowRPEModal) {
        setRpeModalState({
          visible: true,
          exerciseId: exercise.exerciseId,
          setNumber: set?.setNumber ?? setIndex + 1,
          setLogId,
          exerciseIndex,
          setIndex,
          weight: set?.weight ?? null,
          reps: set?.reps ?? null,
          prescribedRpe: exercise.prescribedRpe,
        });
      } else if (result.shouldShowAdaptation && result.rpeDeviation && result.loadAdjustment) {
        setAdaptationState({
          visible: true,
          exerciseId: exercise.exerciseId,
          deviationMagnitude: result.rpeDeviation.deviationMagnitude,
          adjustment: result.loadAdjustment,
        });
      }
    },
    [input.exercises]
  );

  const handleToggleComplete = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      input.onExercisesUpdate(
        input.exercises.map((_, i) => {
          if (i !== exerciseIndex) return input.exercises[i];

          const exercise = input.exercises[i];
          const set = exercise.sets[setIndex];
          const isNowComplete = !set.isCompleted;

          const updatedSets = exercise.sets.map((s, j) => {
            if (j !== setIndex) return s;
            return { ...s, isCompleted: isNowComplete };
          });

          const updatedExercise = { ...exercise, sets: updatedSets };

          if (isNowComplete) {
            WorkoutEngine.logSet({
              id: set.id,
              exercisePerformanceId: exercise.exercisePerformanceId,
              exerciseId: exercise.exerciseId,
              setNumber: set.setNumber,
              weight: set.weight,
              reps: set.reps,
              rpe: set.rpe,
              type: set.type,
              prescribedRpe: exercise.prescribedRpe,
              prescribedRestSeconds: exercise.prescribedRestSeconds,
              userId: input.userId ?? "",
              workoutId: input.workoutId,
            }).then((result) => {
              // Assign DB id back if this was a new set
              if (!set.id) {
                input.onExercisesUpdate(
                  input.exercises.map((ex, exIdx) => {
                    if (exIdx !== exerciseIndex) return ex;
                    const updatedExSets = ex.sets.map((s, setIdx) => {
                      if (setIdx !== setIndex) return s;
                      return { ...s, id: result.setLogId };
                    });
                    return { ...ex, sets: updatedExSets };
                  })
                );
              }
              handleLogSetResult(result, exerciseIndex, setIndex, result.setLogId);
            });
          }

          return updatedExercise;
        })
      );

      workoutSession$.activeField.set(null);
    },
    [input.exercises, input.userId, input.workoutId, input.onExercisesUpdate, handleLogSetResult]
  );

  const handleRPESubmit = useCallback(
    async (rpe: number) => {
      if (!rpeModalState) return;
      setRpeModalState(null);

      // Update RPE in local state
      input.onExercisesUpdate(
        input.exercises.map((ex, exIdx) => {
          if (exIdx !== rpeModalState.exerciseIndex) return ex;
          const updatedSets = ex.sets.map((s, setIdx) => {
            if (setIdx !== rpeModalState.setIndex) return s;
            return { ...s, rpe };
          });
          return { ...ex, sets: updatedSets };
        })
      );

      const result = await WorkoutEngine.updateSetRPE(
        rpeModalState.setLogId,
        rpe,
        rpeModalState.exerciseId,
        rpeModalState.weight,
        rpeModalState.reps,
        rpeModalState.prescribedRpe,
        input.userId ?? "",
        input.workoutId
      );

      if (result.prCheck?.isNewPR) {
        setPrBannerExerciseId(rpeModalState.exerciseId);
        if (prBannerTimer.current) clearTimeout(prBannerTimer.current);
        prBannerTimer.current = setTimeout(() => setPrBannerExerciseId(null), 3000);
      }

      if (result.shouldShowAdaptation && result.rpeDeviation && result.loadAdjustment) {
        setAdaptationState({
          visible: true,
          exerciseId: rpeModalState.exerciseId,
          deviationMagnitude: result.rpeDeviation.deviationMagnitude,
          adjustment: result.loadAdjustment,
        });
      }
    },
    [rpeModalState, input.exercises, input.userId, input.workoutId, input.onExercisesUpdate]
  );

  const handleAdaptationAction = useCallback(() => {
    setAdaptationState(null);
  }, []);

  return {
    rpeModalState,
    adaptationState,
    prBannerExerciseId,
    handleToggleComplete,
    handleRPESubmit,
    handleAdaptationAction,
  };
}
