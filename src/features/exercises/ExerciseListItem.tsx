import { memo } from "react";
import { View, Text, Pressable } from "react-native";
import { colors } from "../../constants/colors";
import type { Exercise } from "../../types";

interface ExerciseListItemProps {
  exercise: Exercise;
  onPress?: (exercise: Exercise) => void;
}

const categoryColors: Record<string, string> = {
  compound: colors.brand.primary,
  isolation: colors.brand.secondary,
  cardio: colors.brand.accent,
  flexibility: colors.semantic.success,
};

export const ExerciseListItem = memo(function ExerciseListItem({
  exercise,
  onPress,
}: ExerciseListItemProps) {
  const muscleText = exercise.muscleGroups
    .slice(0, 3)
    .map((m) => m.replace(/_/g, " "))
    .join(", ");

  return (
    <Pressable
      onPress={() => onPress?.(exercise)}
      className="mx-4 mb-2 rounded-lg bg-dark-surface px-4 py-3"
      style={{ minHeight: 64 }}
    >
      <View className="flex-row items-center justify-between">
        <Text className="flex-1 text-base font-semibold text-dark-text-primary">
          {exercise.name}
        </Text>
        <View
          className="ml-2 rounded-full px-2 py-1"
          style={{ backgroundColor: categoryColors[exercise.category] + "20" }}
        >
          <Text
            className="text-xs font-medium"
            style={{ color: categoryColors[exercise.category] }}
          >
            {exercise.category}
          </Text>
        </View>
      </View>
      <Text className="mt-1 text-sm text-dark-text-muted">{muscleText}</Text>
    </Pressable>
  );
});
