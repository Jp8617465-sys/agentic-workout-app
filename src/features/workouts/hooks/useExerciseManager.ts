import { useState, useCallback } from "react";
import { workoutRepository } from "../workout-repository";
import { autoFillExerciseSets } from "../auto-fill";
import { exerciseRepository } from "../../exercises/exercise-repository";
import type { WorkoutExercise, WorkoutSet } from "../types";
import type { SetType } from "../../../types";

export interface UseExerciseManagerInput {
  workoutId: string;
  userId: string | null;
  defaultRestSeconds: { compound: number; isolation: number };
}

export interface UseExerciseManagerOutput {
  exercises: WorkoutExercise[];
  setExercises: (exercises: WorkoutExercise[]) => void;
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
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);

  const addExercise = useCallback(
    async (exerciseName: string) => {
      const uid = input.userId ?? "";
      const exercise = await exerciseRepository.findByName(exerciseName);
      if (!exercise) return;

      const epId = await workoutRepository.insertExercisePerformance({
        workoutId: input.workoutId,
        exerciseName,
        prescribedSets: 3,
        prescribedReps: null,
        prescribedWeight: null,
        prescribedRpe: null,
        prescribedRestSeconds:
          input.defaultRestSeconds[exercise.category === "isolation" ? "isolation" : "compound"],
        orderInWorkout: exercises.length,
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

      setExercises((prev) => [...prev, newExercise]);
    },
    [input.workoutId, input.userId, input.defaultRestSeconds, exercises.length]
  );

  const handleAddSet = useCallback((exerciseIndex: number) => {
    setExercises((prev) => {
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
      return next;
    });
  }, []);

  const handleDeleteSet = useCallback((exerciseIndex: number, setIndex: number) => {
    setExercises((prev) => {
      const next = [...prev];
      const sets = next[exerciseIndex].sets.filter((_, i) => i !== setIndex);
      // Renumber
      const renumbered = sets.map((s, i) => ({ ...s, setNumber: i + 1 }));
      next[exerciseIndex] = { ...next[exerciseIndex], sets: renumbered };
      return next;
    });
  }, []);

  const handleDuplicateSet = useCallback((exerciseIndex: number, setIndex: number) => {
    setExercises((prev) => {
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
      return next;
    });
  }, []);

  const updateExerciseSet = useCallback(
    (exerciseIndex: number, setIndex: number, field: "weight" | "reps" | "rpe", value: number | null) => {
      setExercises((prev) => {
        const next = [...prev];
        const sets = [...next[exerciseIndex].sets];
        sets[setIndex] = { ...sets[setIndex], [field]: value };
        next[exerciseIndex] = { ...next[exerciseIndex], sets };
        return next;
      });
    },
    []
  );

  return {
    exercises,
    setExercises,
    addExercise,
    handleAddSet,
    handleDeleteSet,
    handleDuplicateSet,
    updateExerciseSet,
  };
}
