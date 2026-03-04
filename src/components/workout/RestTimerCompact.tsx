import { memo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";

interface RestTimerCompactProps {
  remainingSeconds: number;
  onPress: () => void;
  onSkip: () => void;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export const RestTimerCompact = memo(function RestTimerCompact({
  remainingSeconds,
  onPress,
  onSkip,
}: RestTimerCompactProps) {
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="timer-outline" size={18} color={colors.brand.primary} />
        <Text style={styles.time}>{formatTime(remainingSeconds)}</Text>
      </View>
      <Pressable onPress={onSkip} hitSlop={8} style={styles.skipButton}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.dark.surface,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.brand.primary + "40",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  time: {
    ...typography.numeric.md,
    color: colors.dark.textPrimary,
  },
  skipButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  skipText: {
    ...typography.label.md,
    color: colors.dark.textMuted,
  },
});
