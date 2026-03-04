import { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { expoDb } from "../../lib/database";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";
import { personalRecordsRepository } from "./personal-records-repository";
import { AIService } from "../ai/AIService";
import { useUserStore } from "../../stores/userStore";
import type { RootStackParamList } from "../../navigation/types";

type PostWorkoutRoute = RouteProp<RootStackParamList, "PostWorkout">;

function formatDuration(minutes: number | null): string {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatVolume(kg: number | null): string {
  if (!kg) return "—";
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`;
  return `${Math.round(kg)}kg`;
}

interface WorkoutSummaryRow {
  date: string;
  duration_minutes: number | null;
  total_volume: number | null;
  average_rpe: number | null;
}

export function PostWorkoutScreen() {
  const navigation = useNavigation();
  const route = useRoute<PostWorkoutRoute>();
  const { workoutId } = route.params;

  const userId = useUserStore((s) => s.id);

  const [workout, setWorkout] = useState<{
    date: string;
    durationMinutes: number | null;
    totalVolume: number | null;
    averageRpe: number | null;
    exerciseCount: number;
    setCount: number;
  } | null>(null);

  const [prs, setPrs] = useState<
    { exerciseName: string; weight: number; reps: number; estimatedOneRepMax: number }[]
  >([]);

  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(true);

  useEffect(() => {
    if (!workoutId) return;

    const row = expoDb.getFirstSync<WorkoutSummaryRow>(
      "SELECT date, duration_minutes, total_volume, average_rpe FROM workouts WHERE id = ?",
      [workoutId],
    );

    const exCount = expoDb.getFirstSync<{ cnt: number }>(
      "SELECT COUNT(DISTINCT id) as cnt FROM exercise_performances WHERE workout_id = ?",
      [workoutId],
    );

    const sCount = expoDb.getFirstSync<{ cnt: number }>(
      `SELECT COUNT(sl.id) as cnt FROM set_logs sl
       JOIN exercise_performances ep ON ep.id = sl.exercise_performance_id
       WHERE ep.workout_id = ?`,
      [workoutId],
    );

    if (row) {
      setWorkout({
        date: row.date,
        durationMinutes: row.duration_minutes,
        totalVolume: row.total_volume,
        averageRpe: row.average_rpe,
        exerciseCount: exCount?.cnt ?? 0,
        setCount: sCount?.cnt ?? 0,
      });
    }

    if (userId) {
      const allPrs = personalRecordsRepository.findAllForUser(userId);
      setPrs(
        allPrs
          .filter((pr) => pr.workoutId === workoutId)
          .map((pr) => ({
            exerciseName: pr.exerciseName,
            weight: pr.weight,
            reps: pr.reps,
            estimatedOneRepMax: pr.estimatedOneRepMax,
          })),
      );
    }

    if (userId) {
      AIService.getPostWorkoutAnalysis(workoutId, userId)
        .then((analysis) => setAiAnalysis(analysis))
        .catch(() => setAiAnalysis(null))
        .finally(() => setAiLoading(false));
    } else {
      setAiLoading(false);
    }
  }, [workoutId, userId]);

  const handleDone = () => {
    navigation.navigate("MainTabs" as never);
  };

  const dateLabel = workout
    ? new Date(workout.date).toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={40} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Workout Complete</Text>
        <Text style={styles.date}>{dateLabel}</Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={20} color={colors.dark.textSecondary} />
          <Text style={styles.statValue}>{formatDuration(workout?.durationMinutes ?? null)}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="barbell-outline" size={20} color={colors.dark.textSecondary} />
          <Text style={styles.statValue}>{formatVolume(workout?.totalVolume ?? null)}</Text>
          <Text style={styles.statLabel}>Volume</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="list-outline" size={20} color={colors.dark.textSecondary} />
          <Text style={styles.statValue}>{workout?.setCount ?? "—"}</Text>
          <Text style={styles.statLabel}>Sets</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Ionicons name="speedometer-outline" size={20} color={colors.dark.textSecondary} />
          <Text style={styles.statValue}>
            {workout?.averageRpe != null ? workout.averageRpe.toFixed(1) : "—"}
          </Text>
          <Text style={styles.statLabel}>Avg RPE</Text>
        </View>
      </View>

      {/* PR Celebrations */}
      {prs.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Records</Text>
          {prs.map((pr) => (
            <View key={pr.exerciseName} style={styles.prRow}>
              <Ionicons name="trophy" size={20} color={colors.semantic.warning} />
              <View style={styles.prInfo}>
                <Text style={styles.prExercise}>{pr.exerciseName}</Text>
                <Text style={styles.prDetail}>
                  {pr.weight}kg × {pr.reps} — e1RM {pr.estimatedOneRepMax.toFixed(1)}kg
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* AI Analysis */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Coach Analysis</Text>
        {aiLoading ? (
          <View style={styles.aiLoading}>
            <ActivityIndicator color={colors.brand.primary} />
            <Text style={styles.aiLoadingText}>Analysing your workout…</Text>
          </View>
        ) : aiAnalysis ? (
          <Text style={styles.aiText}>{aiAnalysis}</Text>
        ) : (
          <Text style={styles.aiOfflineText}>
            Analysis unavailable offline. Connect to cloud sync for AI coaching.
          </Text>
        )}
      </View>

      {/* Done */}
      <Pressable style={styles.doneButton} onPress={handleDone}>
        <Text style={styles.doneText}>Done</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  content: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    gap: 24,
  },
  header: {
    alignItems: "center",
    gap: 12,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.semantic.success,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    ...typography.heading.h1,
    color: colors.dark.textPrimary,
  },
  date: {
    ...typography.body.md,
    color: colors.dark.textSecondary,
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  statValue: {
    ...typography.numeric.md,
    color: colors.dark.textPrimary,
  },
  statLabel: {
    ...typography.label.sm,
    color: colors.dark.textMuted,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    height: 40,
    backgroundColor: colors.dark.border,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    ...typography.heading.h3,
    color: colors.dark.textPrimary,
  },
  prRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.dark.surface,
    borderRadius: 10,
    padding: 12,
  },
  prInfo: {
    flex: 1,
    gap: 2,
  },
  prExercise: {
    ...typography.label.md,
    color: colors.dark.textPrimary,
  },
  prDetail: {
    ...typography.body.sm,
    color: colors.dark.textSecondary,
  },
  aiLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.dark.surface,
    borderRadius: 10,
    padding: 16,
  },
  aiLoadingText: {
    ...typography.body.md,
    color: colors.dark.textSecondary,
  },
  aiText: {
    ...typography.body.md,
    color: colors.dark.textSecondary,
    backgroundColor: colors.dark.surface,
    borderRadius: 10,
    padding: 16,
    lineHeight: 22,
  },
  aiOfflineText: {
    ...typography.body.md,
    color: colors.dark.textMuted,
    backgroundColor: colors.dark.surface,
    borderRadius: 10,
    padding: 16,
  },
  doneButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  doneText: {
    ...typography.label.lg,
    color: "#FFFFFF",
  },
});
