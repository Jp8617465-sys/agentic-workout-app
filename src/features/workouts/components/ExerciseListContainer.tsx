import { memo, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { ExerciseCard } from "../../../components/workout/ExerciseCard";
import { colors } from "../../../constants/colors";
import { typography } from "../../../constants/typography";
import type { WorkoutExercise } from "../types";

interface ExerciseListContainerProps {
  exercises: WorkoutExercise[];
  exerciseMeta: Map<
    string,
    {
      muscleGroups: string[];
      lastPerformed: string | null;
    }
  >;
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
  onAddExercise: (exerciseName: string) => void;
}

/**
 * Renders the exercise list with empty state fallback.
 * Uses FlashList for optimal performance with large datasets.
 */
export const ExerciseListContainer = memo(function ExerciseListContainer({
  exercises,
  exerciseMeta,
  activeField,
  onFieldPress,
  onToggleComplete,
  onDeleteSet,
  onDuplicateSet,
  onAddSet,
  onAddExercise,
}: ExerciseListContainerProps) {
  const handleAddDefault = useCallback(() => {
    onAddExercise("Barbell Back Squat");
  }, [onAddExercise]);

  const handleAddBench = useCallback(() => {
    onAddExercise("Barbell Bench Press");
  }, [onAddExercise]);

  if (exercises.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="barbell-outline" size={48} color={colors.dark.textMuted} />
        <Text style={styles.emptyText}>Add exercises to begin</Text>
        <Pressable onPress={handleAddDefault} style={styles.addExerciseButton}>
          <Ionicons name="add" size={20} color="#FFFFFF" />
          <Text style={styles.addExerciseText}>Add Exercise</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlashList
      data={exercises}
      renderItem={({ item, index }) => {
        const meta = exerciseMeta.get(item.exerciseName);
        return (
          <ExerciseCard
            exerciseIndex={index}
            exercise={item}
            muscleGroups={meta?.muscleGroups ?? []}
            lastPerformed={meta?.lastPerformed ?? null}
            hasInjuryWarning={false}
            activeField={activeField}
            onFieldPress={onFieldPress}
            onToggleComplete={onToggleComplete}
            onDeleteSet={onDeleteSet}
            onDuplicateSet={onDuplicateSet}
            onAddSet={onAddSet}
          />
        );
      }}
      estimatedItemSize={300}
      keyExtractor={(_, index) => String(index)}
      contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
      ListFooterComponent={
        <Pressable onPress={handleAddBench} style={styles.addExerciseInline}>
          <Ionicons name="add-circle-outline" size={22} color={colors.brand.primary} />
          <Text style={styles.addExerciseInlineText}>Add Exercise</Text>
        </Pressable>
      }
    />
  );
});

const styles = StyleSheet.create({
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: {
    ...typography.body.lg,
    color: colors.dark.textMuted,
  },
  addExerciseButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.brand.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    marginTop: 8,
  },
  addExerciseText: {
    ...typography.label.lg,
    color: "#FFFFFF",
  },
  addExerciseInline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 6,
  },
  addExerciseInlineText: {
    ...typography.label.lg,
    color: colors.brand.primary,
  },
});
