import { memo, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../constants/colors";
import { typography } from "../../../constants/typography";

interface WorkoutHeaderProps {
  elapsed: number;
  onBack: () => void;
  onFinish: () => void;
}

/**
 * Renders the workout header with elapsed timer and action buttons.
 * Timer format: HH:MM:SS or MM:SS depending on duration.
 */
export const WorkoutHeader = memo(function WorkoutHeader({ elapsed, onBack, onFinish }: WorkoutHeaderProps) {
  const formatElapsed = useCallback((ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (n: number) => String(n).padStart(2, "0");
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }, []);

  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={8}>
        <Ionicons name="chevron-back" size={24} color={colors.dark.textPrimary} />
      </Pressable>
      <Text style={styles.elapsed}>{formatElapsed(elapsed)}</Text>
      <Pressable onPress={onFinish} style={styles.finishButton}>
        <Text style={styles.finishText}>Finish</Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: colors.dark.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.dark.border,
  },
  elapsed: {
    ...typography.numeric.md,
    color: colors.dark.textPrimary,
  },
  finishButton: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  finishText: {
    ...typography.label.lg,
    color: "#FFFFFF",
  },
});
