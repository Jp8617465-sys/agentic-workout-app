import { memo } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../constants/colors";
import { typography } from "../../../constants/typography";
import type { DailyBrief } from "../types";

interface Props {
  brief: DailyBrief | null;
  isLoading: boolean;
  currentPhase: string | null;
  onStart: () => void;
}

const SOURCE_LABEL: Record<DailyBrief["source"], string> = {
  ai: "AI",
  mesocycle: "Program",
  deterministic: "Auto",
};

export const DailyBriefCard = memo(function DailyBriefCard({
  brief,
  isLoading,
  currentPhase,
  onStart,
}: Props) {
  if (isLoading) {
    return (
      <View style={styles.card}>
        <View style={styles.skeletonHeader} />
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, { width: "70%" }]} />
        <View style={[styles.skeletonLine, { width: "55%" }]} />
        <ActivityIndicator
          size="small"
          color={colors.brand.primary}
          style={styles.spinner}
        />
      </View>
    );
  }

  if (!brief) {
    return null;
  }

  const visibleExercises = brief.exercises.slice(0, 4);
  const remaining = brief.exercises.length - visibleExercises.length;

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.sessionType}>{brief.sessionType}</Text>
        <View style={styles.badgeRow}>
          {currentPhase && brief.phase && (
            <View style={styles.phaseBadge}>
              <Text style={styles.phaseBadgeText}>
                {brief.phase} · Wk {brief.weekNumber}
              </Text>
            </View>
          )}
          <View style={styles.sourceBadge}>
            <Text style={styles.sourceBadgeText}>{SOURCE_LABEL[brief.source]}</Text>
          </View>
        </View>
      </View>

      {/* Duration */}
      {brief.estimatedDurationMinutes && (
        <View style={styles.durationRow}>
          <Ionicons name="time-outline" size={14} color={colors.dark.textMuted} />
          <Text style={styles.durationText}>~{brief.estimatedDurationMinutes} min</Text>
        </View>
      )}

      {/* Exercise list */}
      {visibleExercises.length > 0 ? (
        <View style={styles.exerciseList}>
          {visibleExercises.map((ex) => (
            <View key={ex.exerciseName} style={styles.exerciseRow}>
              <Text style={styles.exerciseName}>{ex.exerciseName}</Text>
              <Text style={styles.exerciseMeta}>
                {ex.sets}×{ex.reps}
                {ex.weight ? ` · ${ex.weight}kg` : ""}
                {ex.rpe ? ` · RPE ${ex.rpe}` : ""}
              </Text>
            </View>
          ))}
          {remaining > 0 && (
            <Text style={styles.moreText}>+{remaining} more exercise{remaining !== 1 ? "s" : ""}</Text>
          )}
        </View>
      ) : (
        <Text style={styles.noExercisesText}>Open a free session to choose exercises</Text>
      )}

      {/* AI rationale */}
      {brief.rationale && (
        <View style={styles.rationaleBox}>
          <Text style={styles.rationaleText}>{brief.rationale}</Text>
        </View>
      )}

      {/* CTA */}
      <Pressable
        onPress={onStart}
        style={styles.startButton}
        accessibilityRole="button"
        accessibilityLabel="Start today's workout"
      >
        <Ionicons name="flash" size={20} color="#FFFFFF" />
        <Text style={styles.startButtonText}>Start Today's Workout</Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.dark.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.brand.primary,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  sessionType: {
    ...typography.heading.h3,
    color: colors.dark.textPrimary,
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    flexShrink: 0,
  },
  phaseBadge: {
    backgroundColor: colors.brand.primary + "22",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  phaseBadgeText: {
    ...typography.label.sm,
    color: colors.brand.primary,
    textTransform: "capitalize",
  },
  sourceBadge: {
    backgroundColor: colors.dark.surfaceElevated,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sourceBadgeText: {
    ...typography.label.sm,
    color: colors.dark.textMuted,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  durationText: {
    ...typography.body.sm,
    color: colors.dark.textMuted,
  },
  exerciseList: {
    gap: 4,
    marginBottom: 12,
  },
  exerciseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
  },
  exerciseName: {
    ...typography.body.md,
    color: colors.dark.textPrimary,
    flex: 1,
  },
  exerciseMeta: {
    ...typography.body.sm,
    color: colors.dark.textMuted,
  },
  moreText: {
    ...typography.body.sm,
    color: colors.dark.textMuted,
    marginTop: 4,
  },
  noExercisesText: {
    ...typography.body.sm,
    color: colors.dark.textMuted,
    marginBottom: 12,
    fontStyle: "italic",
  },
  rationaleBox: {
    backgroundColor: colors.dark.surfaceElevated,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderLeftWidth: 2,
    borderLeftColor: colors.brand.secondary,
  },
  rationaleText: {
    ...typography.body.sm,
    color: colors.dark.textSecondary,
    lineHeight: 18,
  },
  startButton: {
    backgroundColor: colors.brand.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    minHeight: 52,
  },
  startButtonText: {
    ...typography.label.lg,
    color: "#FFFFFF",
  },
  // Skeleton states
  skeletonHeader: {
    height: 22,
    backgroundColor: colors.dark.surfaceElevated,
    borderRadius: 4,
    marginBottom: 12,
    width: "60%",
  },
  skeletonLine: {
    height: 14,
    backgroundColor: colors.dark.surfaceElevated,
    borderRadius: 4,
    marginBottom: 8,
    width: "85%",
  },
  spinner: {
    marginTop: 8,
  },
});
