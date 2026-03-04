import { observable } from "@legendapp/state";
import type { WorkoutExercise } from "../features/workouts/types";

export const workoutSession$ = observable({
  id: "" as string,
  userId: "" as string,
  startedAt: 0,
  isActive: false,
  exercises: [] as WorkoutExercise[],
  currentExerciseIndex: 0,
  currentSetIndex: 0,
  restTimer: {
    isRunning: false,
    endTimestamp: null as number | null,
    totalSeconds: 0,
    notificationId: null as string | null,
  },
  activeField: null as {
    exerciseIndex: number;
    setIndex: number;
    field: "weight" | "reps" | "rpe";
  } | null,
});
