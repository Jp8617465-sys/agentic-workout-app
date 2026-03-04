import { memo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";
import type { WorkoutSummary } from "../workouts/types";

interface WorkoutHistoryItemProps {
  workout: WorkoutSummary;
  onPress?: (workout: WorkoutSummary) => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatDuration(minutes: number | null): string {
  if (minutes == null) return "—";
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function formatVolume(volume: number | null): string {
  if (volume == null || volume === 0) return "—";
  if (volume >= 1000) return `${(volume / 1000).toFixed(1)}k kg`;
  return `${Math.round(volume)} kg`;
}

export const WorkoutHistoryItem = memo(function WorkoutHistoryItem({
  workout,
  onPress,
}: WorkoutHistoryItemProps) {
  return (
    <Pressable
      onPress={() => onPress?.(workout)}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.date}>{formatDate(workout.date)}</Text>
        <Text style={styles.type}>{workout.type}</Text>
      </View>
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Ionicons name="barbell-outline" size={14} color={colors.dark.textMuted} />
          <Text style={styles.statText}>
            {workout.exerciseCount} exercise{workout.exerciseCount !== 1 ? "s" : ""}
          </Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="time-outline" size={14} color={colors.dark.textMuted} />
          <Text style={styles.statText}>
            {formatDuration(workout.durationMinutes)}
          </Text>
        </View>
        <View style={styles.stat}>
          <Ionicons name="trending-up-outline" size={14} color={colors.dark.textMuted} />
          <Text style={styles.statText}>
            {formatVolume(workout.totalVolume)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    ...typography.label.lg,
    color: colors.dark.textPrimary,
  },
  type: {
    ...typography.label.sm,
    color: colors.dark.textMuted,
    textTransform: "capitalize",
  },
  stats: {
    flexDirection: "row",
    marginTop: 8,
    gap: 16,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    ...typography.body.sm,
    color: colors.dark.textSecondary,
  },
});
