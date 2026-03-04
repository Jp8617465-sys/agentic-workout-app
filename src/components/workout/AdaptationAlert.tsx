import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";
import type { LoadAdjustmentResult } from "../../features/workouts/progression-calculator";

export type AdaptationAction = "reduce_load" | "reduce_volume" | "continue";

interface AdaptationAlertProps {
  visible: boolean;
  exerciseName: string;
  deviationMagnitude: number;
  adjustment: LoadAdjustmentResult;
  onAction: (action: AdaptationAction) => void;
}

export function AdaptationAlert({
  visible,
  exerciseName,
  deviationMagnitude,
  adjustment,
  onAction,
}: AdaptationAlertProps) {
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(visible ? 1 : 0, { duration: 200 }),
    maxHeight: withTiming(visible ? 200 : 0, { duration: 200 }),
    overflow: "hidden" as const,
  }));

  if (!visible) return null;

  const isOvershoot = deviationMagnitude > 0;
  const color = isOvershoot ? colors.semantic.warning : colors.semantic.info;
  const iconName = isOvershoot
    ? ("trending-down" as const)
    : ("trending-up" as const);
  const title = isOvershoot
    ? `RPE ${deviationMagnitude.toFixed(1)} above target — ${exerciseName}`
    : `RPE ${Math.abs(deviationMagnitude).toFixed(1)} below target — ${exerciseName}`;

  return (
    <Animated.View style={[styles.container, { borderLeftColor: color }, animatedStyle]}>
      <View style={styles.header}>
        <Ionicons name={iconName} size={18} color={color} />
        <Text style={[styles.title, { color }]}>{title}</Text>
      </View>
      <Text style={styles.reason}>{adjustment.reason}</Text>
      {isOvershoot && (
        <Text style={styles.suggestion}>
          Suggested: {adjustment.suggestedWeight}kg (
          {adjustment.percentageChange > 0 ? "+" : ""}
          {adjustment.percentageChange.toFixed(1)}%)
        </Text>
      )}
      <View style={styles.actions}>
        {isOvershoot && (
          <>
            <Pressable
              style={[styles.actionButton, { backgroundColor: color + "25" }]}
              onPress={() => onAction("reduce_load")}
            >
              <Text style={[styles.actionText, { color }]}>Reduce Load</Text>
            </Pressable>
            <Pressable
              style={[styles.actionButton, { backgroundColor: color + "15" }]}
              onPress={() => onAction("reduce_volume")}
            >
              <Text style={[styles.actionText, { color }]}>Skip a Set</Text>
            </Pressable>
          </>
        )}
        <Pressable
          style={styles.continueButton}
          onPress={() => onAction("continue")}
        >
          <Text style={styles.continueText}>Continue</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: colors.dark.surface,
    borderRadius: 10,
    borderLeftWidth: 3,
    padding: 12,
    gap: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    ...typography.label.md,
    flex: 1,
  },
  reason: {
    ...typography.body.sm,
    color: colors.dark.textSecondary,
  },
  suggestion: {
    ...typography.label.md,
    color: colors.dark.textPrimary,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
    marginTop: 4,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionText: {
    ...typography.label.md,
  },
  continueButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: colors.dark.surfaceElevated,
  },
  continueText: {
    ...typography.label.md,
    color: colors.dark.textMuted,
  },
});
