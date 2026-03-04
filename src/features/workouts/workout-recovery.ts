import { Alert } from "react-native";
import { workoutSession$ } from "../../stores/activeWorkoutStore";
import { workoutRepository } from "./workout-repository";
import type { ActiveWorkoutData, WorkoutSet } from "./types";
import type { SetType } from "../../types";

export async function checkForActiveWorkout(
  userId: string,
): Promise<ActiveWorkoutData | null> {
  return workoutRepository.getActiveWorkout(userId);
}

export function resumeWorkout(data: ActiveWorkoutData): void {
  workoutSession$.set({
    id: data.workoutId,
    userId: data.userId,
    startedAt: new Date(data.date).getTime(),
    isActive: true,
    exercises: data.exercises.map((ex) => ({
      exercisePerformanceId: ex.exercisePerformanceId,
      exerciseName: ex.exerciseName,
      prescribedSets: ex.prescribedSets ?? 3,
      prescribedReps: ex.prescribedReps,
      prescribedWeight: ex.prescribedWeight,
      prescribedRpe: ex.prescribedRpe,
      prescribedRestSeconds: ex.prescribedRestSeconds ?? 120,
      sets: ex.sets.map(
        (s): WorkoutSet => ({
          id: s.id,
          setNumber: s.setNumber,
          weight: s.weight,
          reps: s.reps,
          rpe: s.rpe,
          type: s.type as SetType,
          isCompleted: s.completedAt != null,
          previousWeight: null,
          previousReps: null,
        }),
      ),
    })),
    currentExerciseIndex: 0,
    currentSetIndex: 0,
    restTimer: {
      isRunning: data.restTimerEndsAt != null && data.restTimerEndsAt > Date.now(),
      endTimestamp: data.restTimerEndsAt,
      totalSeconds: 0,
      notificationId: null,
    },
    activeField: null,
  });
}

export async function discardWorkout(workoutId: string): Promise<void> {
  await workoutRepository.abandonWorkout(workoutId);
  workoutSession$.set({
    id: "",
    userId: "",
    startedAt: 0,
    isActive: false,
    exercises: [],
    currentExerciseIndex: 0,
    currentSetIndex: 0,
    restTimer: {
      isRunning: false,
      endTimestamp: null,
      totalSeconds: 0,
      notificationId: null,
    },
    activeField: null,
  });
}

export function promptWorkoutRecovery(
  data: ActiveWorkoutData,
  onResume: () => void,
  onDiscard: () => void,
): void {
  Alert.alert(
    "Resume Workout?",
    `You have an unfinished workout from ${data.date}. Would you like to resume it?`,
    [
      {
        text: "Discard",
        style: "destructive",
        onPress: () => {
          discardWorkout(data.workoutId);
          onDiscard();
        },
      },
      {
        text: "Resume",
        onPress: () => {
          resumeWorkout(data);
          onResume();
        },
      },
    ],
  );
}
