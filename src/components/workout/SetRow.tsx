import { memo, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { RPEBadge } from "./RPEBadge";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";

interface SetRowProps {
  setNumber: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  type: "warmup" | "working" | "backoff" | "amrap";
  isCompleted: boolean;
  previousWeight: number | null;
  previousReps: number | null;
  isWeightActive: boolean;
  isRepsActive: boolean;
  isRpeActive: boolean;
  onFieldPress: (field: "weight" | "reps" | "rpe") => void;
  onToggleComplete: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  warmup: "W",
  working: "",
  backoff: "B",
  amrap: "A",
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const SetRow = memo(function SetRow({
  setNumber,
  weight,
  reps,
  rpe,
  type,
  isCompleted,
  previousWeight,
  previousReps,
  isWeightActive,
  isRepsActive,
  isRpeActive,
  onFieldPress,
  onToggleComplete,
  onDelete,
  onDuplicate,
}: SetRowProps) {
  const completionProgress = useSharedValue(isCompleted ? 1 : 0);

  const handleToggleComplete = useCallback(() => {
    const newCompleted = !isCompleted;
    completionProgress.value = withTiming(newCompleted ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
    if (newCompleted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onToggleComplete();
  }, [isCompleted, onToggleComplete, completionProgress]);

  const rowAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      completionProgress.value,
      [0, 1],
      ["transparent", colors.semantic.success + "1A"],
    ),
  }));

  const checkboxAnimatedStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      completionProgress.value,
      [0, 1],
      [colors.dark.surface, colors.semantic.success],
    ),
    transform: [
      {
        scale: interpolate(completionProgress.value, [0, 0.5, 1], [1, 1.15, 1]),
      },
    ],
  }));

  const renderLeftActions = () => (
    <View style={styles.swipeActionLeft}>
      <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
    </View>
  );

  const renderRightActions = () => (
    <View style={styles.swipeActionRight}>
      <Ionicons name="copy-outline" size={20} color="#FFFFFF" />
    </View>
  );

  const handleSwipeLeft = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDelete();
  };

  const handleSwipeRight = () => {
    Haptics.selectionAsync();
    onDuplicate();
  };

  const typeLabel = TYPE_LABELS[type];

  return (
    <Swipeable
      renderLeftActions={renderRightActions}
      renderRightActions={renderLeftActions}
      onSwipeableOpen={(direction) => {
        if (direction === "left") handleSwipeRight();
        else handleSwipeLeft();
      }}
      overshootLeft={false}
      overshootRight={false}
    >
      <Animated.View style={[styles.row, rowAnimatedStyle]}>
        <View style={styles.setNumberCol}>
          <Text style={styles.setNumber}>
            {typeLabel || String(setNumber)}
          </Text>
        </View>

        <View style={styles.previousCol}>
          {previousWeight != null && previousReps != null ? (
            <Text style={styles.previousText}>
              {previousWeight}×{previousReps}
            </Text>
          ) : (
            <Text style={styles.previousText}>—</Text>
          )}
        </View>

        <Pressable
          onPress={() => onFieldPress("weight")}
          style={[styles.fieldCell, isWeightActive && styles.fieldCellActive]}
        >
          <Text style={[styles.fieldValue, isWeightActive && styles.fieldValueActive]}>
            {weight != null ? String(weight) : "—"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onFieldPress("reps")}
          style={[styles.fieldCell, isRepsActive && styles.fieldCellActive]}
        >
          <Text style={[styles.fieldValue, isRepsActive && styles.fieldValueActive]}>
            {reps != null ? String(reps) : "—"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onFieldPress("rpe")}
          style={[styles.rpeCell, isRpeActive && styles.fieldCellActive]}
        >
          {rpe != null ? (
            <RPEBadge rpe={rpe} />
          ) : (
            <Text style={[styles.rpePlaceholder, isRpeActive && styles.fieldValueActive]}>
              —
            </Text>
          )}
        </Pressable>

        <AnimatedPressable
          onPress={handleToggleComplete}
          style={[styles.checkbox, checkboxAnimatedStyle]}
          hitSlop={8}
        >
          {isCompleted && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </AnimatedPressable>
      </Animated.View>
    </Swipeable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  setNumberCol: {
    width: 28,
    alignItems: "center",
  },
  setNumber: {
    ...typography.label.md,
    color: colors.dark.textMuted,
  },
  previousCol: {
    width: 64,
    alignItems: "center",
  },
  previousText: {
    ...typography.body.sm,
    color: colors.dark.textMuted,
  },
  fieldCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    marginHorizontal: 2,
    borderRadius: 6,
    backgroundColor: colors.dark.surfaceElevated,
    minHeight: 36,
  },
  fieldCellActive: {
    borderWidth: 1.5,
    borderColor: colors.brand.primary,
    backgroundColor: colors.brand.primary + "15",
  },
  fieldValue: {
    ...typography.numeric.sm,
    color: colors.dark.textPrimary,
  },
  fieldValueActive: {
    color: colors.brand.primary,
  },
  rpeCell: {
    width: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    marginHorizontal: 2,
    borderRadius: 6,
    backgroundColor: colors.dark.surfaceElevated,
    minHeight: 36,
  },
  rpePlaceholder: {
    ...typography.label.sm,
    color: colors.dark.textMuted,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.dark.border,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  swipeActionLeft: {
    backgroundColor: colors.semantic.danger,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    flex: 1,
  },
  swipeActionRight: {
    backgroundColor: colors.brand.accent,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    flex: 1,
  },
});
