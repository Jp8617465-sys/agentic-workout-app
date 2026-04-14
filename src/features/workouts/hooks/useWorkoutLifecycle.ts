import { useState, useEffect, useCallback } from "react";
import { workoutRepository } from "../workout-repository";
import { workoutSession$ } from "../../../stores/activeWorkoutStore";
import { autoFillExerciseSets } from "../auto-fill";
import { exerciseRepository } from "../../exercises/exercise-repository";
import type { WorkoutExercise, WorkoutSet } from "../types";
import type { SetType } from "../../../types";
import { generateId } from "../../../lib/uuid";

// exercises live exclusively in workoutSession$.exercises — no local copy here

export interface UseWorkoutLifecycleInput {
  userId: string | null;
  currentMesocycleId: string | null;
  currentMicrocycles: Array<{ id: string; weekNumber: number }>;
  currentWeek: number;
  defaultRestSeconds: { compound: number; isolation: number };
  prescription?: {
    exercises: Array<{
      exerciseName: string;
      sets: number;
      reps: number;
      weight: number;
      rpe: number;
    }>;
  } | null;
}

export interface UseWorkoutLifecycleOutput {
  workoutId: string;
  elapsed: number;
  startedAt: number;
  initWorkout: () => Promise<void>;
  finishWorkout: (summary: {
    durationMinutes: number;
    totalVolume: number;
    averageRpe: number | null;
    exercises: Array<{
      exercisePerformanceId: string;
      actualSets: number;
      actualAverageRpe: number | null;
    }>;
  }) => Promise<void>;
  addPrescribedExercise: (
    exerciseName: string,
    prescribedSets: number,
    prescribedReps: number,
    prescribedWeight: number,
    prescribedRpe: number
  ) => Promise<void>;
}

export function useWorkoutLifecycle(input: UseWorkoutLifecycleInput): UseWorkoutLifecycleOutput {
  const [workoutId, setWorkoutId] = useState("");
  const [startedAt, setStartedAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  // Initialize new or resume workout
  const initWorkout = useCallback(async () => {
    const session = workoutSession$.peek();
    if (session.isActive && session.id) {
      // Resuming existing workout — exercises already live in workoutSession$.exercises
      setWorkoutId(session.id);
      setStartedAt(session.startedAt);
    } else {
      // Start new workout
      const uid = input.userId ?? generateId();
      const now = Date.now();

      const currentMicrocycle = input.currentMicrocycles.find(
        (mc) => mc.weekNumber === input.currentWeek
      );
      const workoutType = input.prescription ? "program" : "custom";

      const id = await workoutRepository.insert({
        userId: uid,
        type: workoutType,
        date: new Date().toISOString().split("T")[0],
        mesocycleId:
          input.prescription && input.currentMesocycleId ? input.currentMesocycleId : undefined,
        microcycleId: input.prescription && currentMicrocycle ? currentMicrocycle.id : undefined,
      });

      setWorkoutId(id);
      setStartedAt(now);

      workoutSession$.set({
        id,
        userId: uid,
        startedAt: now,
        isActive: true,
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

      // Add prescribed exercises if provided
      if (input.prescription) {
        for (const ex of input.prescription.exercises) {
          await addPrescribedExercise(ex.exerciseName, ex.sets, ex.reps, ex.weight, ex.rpe);
        }
      }
    }
  }, [input.userId, input.currentMesocycleId, input.currentMicrocycles, input.currentWeek, input.prescription]);

  // Timer effect for elapsed time
  useEffect(() => {
    if (!startedAt) return;
    const timer = setInterval(() => {
      setElapsed(Date.now() - startedAt);
    }, 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  const addPrescribedExercise = useCallback(
    async (
      exerciseName: string,
      prescribedSets: number,
      prescribedReps: number,
      prescribedWeight: number,
      prescribedRpe: number
    ) => {
      const uid = input.userId ?? "";
      const exercise = await exerciseRepository.findByName(exerciseName);
      const restSeconds = exercise
        ? input.defaultRestSeconds[exercise.category === "isolation" ? "isolation" : "compound"]
        : input.defaultRestSeconds.compound;

      const epId = await workoutRepository.insertExercisePerformance({
        workoutId,
        exerciseName,
        prescribedSets,
        prescribedReps,
        prescribedWeight: prescribedWeight || null,
        prescribedRpe: prescribedRpe || null,
        prescribedRestSeconds: restSeconds,
        orderInWorkout: workoutSession$.exercises.peek().length,
      });

      const autoFill = await autoFillExerciseSets(uid, exerciseName);
      const sets: WorkoutSet[] = Array.from({ length: prescribedSets }, (_, i) => ({
        id: null,
        setNumber: i + 1,
        weight: autoFill[i]?.weight ?? (prescribedWeight || null),
        reps: autoFill[i]?.reps ?? prescribedReps,
        rpe: null,
        type: "working" as SetType,
        isCompleted: false,
        previousWeight: autoFill[i]?.weight ?? null,
        previousReps: autoFill[i]?.reps ?? null,
      }));

      const newExercise: WorkoutExercise = {
        exercisePerformanceId: epId,
        exerciseName,
        prescribedSets,
        prescribedReps,
        prescribedWeight: prescribedWeight || null,
        prescribedRpe: prescribedRpe || null,
        prescribedRestSeconds: restSeconds,
        sets,
      };

      workoutSession$.exercises.set([...workoutSession$.exercises.peek(), newExercise]);
    },
    [workoutId, input.userId, input.defaultRestSeconds]
  );

  const finishWorkout = useCallback(
    async (summary: {
      durationMinutes: number;
      totalVolume: number;
      averageRpe: number | null;
      exercises: Array<{
        exercisePerformanceId: string;
        actualSets: number;
        actualAverageRpe: number | null;
      }>;
    }) => {
      await workoutRepository.saveCompleteWorkout({
        workoutId,
        userId: input.userId ?? "",
        durationMinutes: summary.durationMinutes,
        totalVolume: summary.totalVolume,
        averageRpe: summary.averageRpe,
        exercises: summary.exercises,
      });

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

      // Reset local state — exercises already cleared by workoutSession$.set above
      setWorkoutId("");
      setStartedAt(0);
      setElapsed(0);
    },
    [workoutId]
  );

  return {
    workoutId,
    elapsed,
    startedAt,
    initWorkout,
    finishWorkout,
    addPrescribedExercise,
  };
}
