import { useCallback } from "react";
import { useSelector } from "@legendapp/state/react";
import { workoutRepository } from "../workout-repository";
import { autoFillExerciseSets } from "../auto-fill";
import { exerciseRepository } from "../../exercises/exercise-repository";
import { workoutSession$ } from "../../../stores/activeWorkoutStore";
import type { WorkoutExercise, WorkoutSet } from "../types";
import type { SetType } from "../../../types";

export interface UseExerciseManagerInput {
  workoutId: string;
  userId: string | null;
  defaultRestSeconds: { compound: number; isolation: number };
}

export interface UseExerciseManagerOutput {
  exercises: WorkoutExercise[];
  addExercise: (exerciseName: string) => Promise<void>;
  handleAddSet: (exerciseIndex: number) => void;
  handleDeleteSet: (exerciseIndex: number, setIndex: number) => void;
  handleDuplicateSet: (exerciseIndex: number, setIndex: number) => void;
  updateExerciseSet: (
    exerciseIndex: number,
    setIndex: number,
    field: "weight" | "reps" | "rpe",
    value: number | null
  ) => void;
}

export function useExerciseManager(input: UseExerciseManagerInput): UseExerciseManagerOutput {
  // Single source of truth — reactive subscription to the observable
  const exercises = useSelector(workoutSession$.exercises) as WorkoutExercise[];

  const addExercise = useCallback(
    async (exerciseName: string) => {
      const uid = input.userId ?? "";
      const exercise = await exerciseRepository.findByName(exerciseName);
      if (!exercise) return;

      const current = workoutSession$.exercises.peek();
      const epId = await workoutRepository.insertExercisePerformance({
        workoutId: input.workoutId,
        exerciseName,
        prescribedSets: 3,
        prescribedReps: null,
        prescribedWeight: null,
        prescribedRpe: null,
        prescribedRestSeconds:
          input.defaultRestSeconds[exercise.category === "isolation" ? "isolation" : "compound"],
        orderInWorkout: current.length,
      });

      const autoFill = await autoFillExerciseSets(uid, exerciseName);
      const numSets = Math.max(autoFill.length, 3);
      const sets: WorkoutSet[] = Array.from({ length: numSets }, (_, i) => ({
        id: null,
        setNumber: i + 1,
        weight: autoFill[i]?.weight ?? null,
        reps: autoFill[i]?.reps ?? null,
        rpe: autoFill[i]?.rpe ?? null,
        type: "working" as SetType,
        isCompleted: false,
        previousWeight: autoFill[i]?.weight ?? null,
        previousReps: autoFill[i]?.reps ?? null,
      }));

      const newExercise: WorkoutExercise = {
        exercisePerformanceId: epId,
        exerciseName,
        prescribedSets: 3,
        prescribedReps: null,
        prescribedWeight: null,
        prescribedRpe: null,
        prescribedRestSeconds:
          input.defaultRestSeconds[exercise.category === "isolation" ? "isolation" : "compound"],
        sets,
      };

      workoutSession$.exercises.set([...current, newExercise]);
    },
    [input.workoutId, input.userId, input.defaultRestSeconds]
  );

  const handleAddSet = useCallback((exerciseIndex: number) => {
    const prev = workoutSession$.exercises.peek();
    const next = [...prev];
    const sets = [...next[exerciseIndex].sets];
    const lastSet = sets[sets.length - 1];
    const newSet: WorkoutSet = {
      id: null,
      setNumber: sets.length + 1,
      weight: lastSet?.weight ?? null,
      reps: lastSet?.reps ?? null,
      rpe: null,
      type: "working",
      isCompleted: false,
      previousWeight: null,
      previousReps: null,
    };
    sets.push(newSet);
    next[exerciseIndex] = { ...next[exerciseIndex], sets };
    workoutSession$.exercises.set(next);
  }, []);

  const handleDeleteSet = useCallback((exerciseIndex: number, setIndex: number) => {
    const prev = workoutSession$.exercises.peek();
    const next = [...prev];
    const sets = next[exerciseIndex].sets.filter((_, i) => i !== setIndex);
    const renumbered = sets.map((s, i) => ({ ...s, setNumber: i + 1 }));
    next[exerciseIndex] = { ...next[exerciseIndex], sets: renumbered };
    workoutSession$.exercises.set(next);
  }, []);

  const handleDuplicateSet = useCallback((exerciseIndex: number, setIndex: number) => {
    const prev = workoutSession$.exercises.peek();
    const next = [...prev];
    const sets = [...next[exerciseIndex].sets];
    const source = sets[setIndex];
    const newSet: WorkoutSet = {
      ...source,
      id: null,
      setNumber: sets.length + 1,
      isCompleted: false,
    };
    sets.push(newSet);
    next[exerciseIndex] = { ...next[exerciseIndex], sets };
    workoutSession$.exercises.set(next);
  }, []);

  const updateExerciseSet = useCallback(
    (exerciseIndex: number, setIndex: number, field: "weight" | "reps" | "rpe", value: number | null) => {
      const prev = workoutSession$.exercises.peek();
      const next = [...prev];
      const sets = [...next[exerciseIndex].sets];
      sets[setIndex] = { ...sets[setIndex], [field]: value };
      next[exerciseIndex] = { ...next[exerciseIndex], sets };
      workoutSession$.exercises.set(next);
    },
    []
  );

  return {
    exercises,
    addExercise,
    handleAddSet,
    handleDeleteSet,
    handleDuplicateSet,
    updateExerciseSet,
  };
}
