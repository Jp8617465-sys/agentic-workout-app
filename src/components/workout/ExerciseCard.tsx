import { memo, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ExerciseHeader } from "./ExerciseHeader";
import { SetRow } from "./SetRow";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";
import type { WorkoutExercise } from "../../features/workouts/types";

interface ExerciseCardProps {
  exerciseIndex: number;
  exercise: WorkoutExercise;
  muscleGroups: string[];
  lastPerformed: string | null;
  hasInjuryWarning: boolean;
  activeField: {
    exerciseIndex: number;
    setIndex: number;
    field: "weight" | "reps" | "rpe";
  } | null;
  onFieldPress: (exerciseIndex: number, setIndex: number, field: "weight" | "reps" | "rpe") => void;
  onToggleComplete: (exerciseIndex: number, setIndex: number) => void;
  onDeleteSet: (exerciseIndex: number, setIndex: number) => void;
  onDuplicateSet: (exerciseIndex: number, setIndex: number) => void;
  onAddSet: (exerciseIndex: number) => void;
}

export const ExerciseCard = memo(function ExerciseCard({
  exerciseIndex,
  exercise,
  muscleGroups,
  lastPerformed,
  hasInjuryWarning,
  activeField,
  onFieldPress,
  onToggleComplete,
  onDeleteSet,
  onDuplicateSet,
  onAddSet,
}: ExerciseCardProps) {
  const handleAddSet = useCallback(() => {
    onAddSet(exerciseIndex);
  }, [exerciseIndex, onAddSet]);

  return (
    <View style={styles.card}>
      <ExerciseHeader
        exerciseName={exercise.exerciseName}
        muscleGroups={muscleGroups}
        lastPerformed={lastPerformed}
        hasInjuryWarning={hasInjuryWarning}
      />

      <View style={styles.columnHeaders}>
        <Text style={[styles.columnLabel, { width: 28 }]}>SET</Text>
        <Text style={[styles.columnLabel, { width: 64 }]}>PREV</Text>
        <Text style={[styles.columnLabel, { flex: 1 }]}>KG</Text>
        <Text style={[styles.columnLabel, { flex: 1 }]}>REPS</Text>
        <Text style={[styles.columnLabel, { width: 44 }]}>RPE</Text>
        <View style={{ width: 36 }} />
      </View>

      {exercise.sets.map((set, setIndex) => (
        <SetRow
          key={setIndex}
          setNumber={set.setNumber}
          weight={set.weight}
          reps={set.reps}
          rpe={set.rpe}
          type={set.type}
          isCompleted={set.isCompleted}
          previousWeight={set.previousWeight}
          previousReps={set.previousReps}
          isWeightActive={
            activeField?.exerciseIndex === exerciseIndex &&
            activeField?.setIndex === setIndex &&
            activeField?.field === "weight"
          }
          isRepsActive={
            activeField?.exerciseIndex === exerciseIndex &&
            activeField?.setIndex === setIndex &&
            activeField?.field === "reps"
          }
          isRpeActive={
            activeField?.exerciseIndex === exerciseIndex &&
            activeField?.setIndex === setIndex &&
            activeField?.field === "rpe"
          }
          onFieldPress={(field) => onFieldPress(exerciseIndex, setIndex, field)}
          onToggleComplete={() => onToggleComplete(exerciseIndex, setIndex)}
          onDelete={() => onDeleteSet(exerciseIndex, setIndex)}
          onDuplicate={() => onDuplicateSet(exerciseIndex, setIndex)}
        />
      ))}

      <Pressable onPress={handleAddSet} style={styles.addSetButton}>
        <Ionicons name="add" size={18} color={colors.brand.primary} />
        <Text style={styles.addSetText}>Add Set</Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: "hidden",
  },
  columnHeaders: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 4,
    gap: 4,
  },
  columnLabel: {
    ...typography.label.sm,
    color: colors.dark.textMuted,
    textAlign: "center",
  },
  addSetButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.dark.border,
  },
  addSetText: {
    ...typography.label.md,
    color: colors.brand.primary,
  },
});
