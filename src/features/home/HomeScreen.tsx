import { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useUserStore } from "../../stores/userStore";
import { useMesocycleStore } from "../../stores/mesocycleStore";
import { workoutRepository } from "../workouts/workout-repository";
import { memoryRepository } from "../memory/memory-repository";
import type { AgenticMemory } from "../../types/memory";
import {
  checkForActiveWorkout,
  promptWorkoutRecovery,
} from "../workouts/workout-recovery";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";
import type { WorkoutSummary } from "../workouts/types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const userId = useUserStore((s) => s.id);
  const userName = useUserStore((s) => s.name);
  const todayPrescription = useMesocycleStore((s) => s.todayPrescription);
  const currentPhase = useMesocycleStore((s) => s.currentPhase);
  const currentWeek = useMesocycleStore((s) => s.currentWeek);
  const currentMesocycle = useMesocycleStore((s) => s.currentMesocycle);
  const [lastWorkout, setLastWorkout] = useState<WorkoutSummary | null>(null);
  const [monthCount, setMonthCount] = useState(0);
  const [topMemories, setTopMemories] = useState<AgenticMemory[]>([]);

  useEffect(() => {
    if (!userId) return;

    // Check for active workout
    checkForActiveWorkout(userId).then((active) => {
      if (active) {
        promptWorkoutRecovery(
          active,
          () => navigation.navigate("ActiveWorkout"),
          () => {},
        );
      }
    });

    // Load recent workout
    workoutRepository.findRecent(userId, 1).then((recent) => {
      if (recent.length > 0) setLastWorkout(recent[0]);
    });

    // Count workouts this month
    workoutRepository.findRecent(userId, 100).then((all) => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split("T")[0];
      const count = all.filter((w) => w.date >= monthStart).length;
      setMonthCount(count);
    });

    // Load top-2 memory insights
    const memories = memoryRepository.findRelevant(userId, { limit: 2 });
    setTopMemories(memories.filter((m) => m.confidence >= 0.3));
  }, [userId, navigation]);

  const handleStartWorkout = useCallback(() => {
    navigation.navigate("ActiveWorkout");
  }, [navigation]);

  const handleCreateProgram = useCallback(() => {
    navigation.navigate("MesocycleGeneration");
  }, [navigation]);

  const greeting = userName ? `Hey, ${userName}` : "Ready to train?";

  return (
    <View style={styles.container}>
      <View style={styles.greetingSection}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.subtitle}>
          {monthCount > 0
            ? `${monthCount} workout${monthCount !== 1 ? "s" : ""} this month`
            : "Let's get started"}
        </Text>
      </View>

      {todayPrescription ? (
        <>
          <View style={styles.prescriptionCard}>
            <View style={styles.prescriptionHeader}>
              <Text style={styles.prescriptionTitle}>Today's Workout</Text>
              {currentPhase && (
                <View style={styles.phaseBadge}>
                  <Text style={styles.phaseBadgeText}>
                    {currentPhase} - Week {currentWeek}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.prescriptionExercises}>
              {todayPrescription.exercises.length} exercises
            </Text>
            {todayPrescription.exercises.slice(0, 4).map((ex) => (
              <Text key={ex.exerciseName} style={styles.prescriptionExerciseName}>
                {ex.exerciseName} - {ex.sets}x{ex.reps}
              </Text>
            ))}
            {todayPrescription.exercises.length > 4 && (
              <Text style={styles.prescriptionMore}>
                +{todayPrescription.exercises.length - 4} more
              </Text>
            )}
          </View>
          <Pressable onPress={handleStartWorkout} style={styles.startButton}>
            <Ionicons name="flash" size={22} color="#FFFFFF" />
            <Text style={styles.startButtonText}>Start Today's Workout</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Pressable onPress={handleStartWorkout} style={styles.startButton}>
            <Ionicons name="flash" size={22} color="#FFFFFF" />
            <Text style={styles.startButtonText}>Start Workout</Text>
          </Pressable>
          {!currentMesocycle && (
            <Pressable onPress={handleCreateProgram} style={styles.programCard}>
              <Ionicons name="calendar" size={24} color={colors.brand.accent} />
              <View style={styles.programCardContent}>
                <Text style={styles.programCardTitle}>Create a Training Program</Text>
                <Text style={styles.programCardDescription}>
                  Get a personalized multi-week plan
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.dark.textMuted} />
            </Pressable>
          )}
        </>
      )}

      {topMemories.length > 0 && (
        <Pressable
          style={styles.memoryCard}
          onPress={() => navigation.navigate("MemoryDashboard")}
        >
          <View style={styles.memoryHeader}>
            <Ionicons name="bulb-outline" size={20} color={colors.brand.accent} />
            <Text style={styles.memoryTitle}>What I&apos;ve Learned</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.dark.textMuted} />
          </View>
          {topMemories.map((m) => (
            <Text key={m.id} style={styles.memoryItem} numberOfLines={1}>
              {m.description}
            </Text>
          ))}
        </Pressable>
      )}

      {lastWorkout && (
        <View style={styles.lastWorkoutCard}>
          <Text style={styles.lastWorkoutLabel}>Last Workout</Text>
          <Text style={styles.lastWorkoutDate}>
            {new Date(lastWorkout.date).toLocaleDateString("en-US", {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </Text>
          <View style={styles.lastWorkoutStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{lastWorkout.exerciseCount}</Text>
              <Text style={styles.statLabel}>Exercises</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {lastWorkout.durationMinutes
                  ? `${lastWorkout.durationMinutes}m`
                  : "—"}
              </Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {lastWorkout.totalVolume
                  ? `${Math.round(lastWorkout.totalVolume)}`
                  : "—"}
              </Text>
              <Text style={styles.statLabel}>Volume (kg)</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
    paddingHorizontal: 16,
    paddingTop: 64,
  },
  greetingSection: {
    marginBottom: 32,
  },
  greeting: {
    ...typography.heading.h1,
    color: colors.dark.textPrimary,
  },
  subtitle: {
    ...typography.body.lg,
    color: colors.dark.textSecondary,
    marginTop: 4,
  },
  startButton: {
    backgroundColor: colors.brand.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    minHeight: 56,
  },
  startButtonText: {
    ...typography.heading.h3,
    color: "#FFFFFF",
  },
  lastWorkoutCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  lastWorkoutLabel: {
    ...typography.label.sm,
    color: colors.dark.textMuted,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  lastWorkoutDate: {
    ...typography.label.lg,
    color: colors.dark.textPrimary,
    marginTop: 4,
  },
  lastWorkoutStats: {
    flexDirection: "row",
    marginTop: 12,
    gap: 24,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    ...typography.numeric.md,
    color: colors.dark.textPrimary,
  },
  statLabel: {
    ...typography.body.sm,
    color: colors.dark.textMuted,
    marginTop: 2,
  },
  prescriptionCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.brand.primary,
  },
  prescriptionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  prescriptionTitle: {
    ...typography.heading.h3,
    color: colors.dark.textPrimary,
  },
  phaseBadge: {
    backgroundColor: colors.brand.primary + "33",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  phaseBadgeText: {
    ...typography.label.sm,
    color: colors.brand.primary,
    textTransform: "capitalize",
  },
  prescriptionExercises: {
    ...typography.body.sm,
    color: colors.dark.textMuted,
    marginBottom: 8,
  },
  prescriptionExerciseName: {
    ...typography.body.md,
    color: colors.dark.textSecondary,
    paddingVertical: 2,
  },
  prescriptionMore: {
    ...typography.body.sm,
    color: colors.dark.textMuted,
    marginTop: 4,
  },
  programCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  programCardContent: {
    flex: 1,
  },
  programCardTitle: {
    ...typography.label.lg,
    color: colors.dark.textPrimary,
  },
  programCardDescription: {
    ...typography.body.sm,
    color: colors.dark.textMuted,
    marginTop: 2,
  },
  memoryCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 6,
  },
  memoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  memoryTitle: {
    ...typography.label.lg,
    color: colors.dark.textPrimary,
    flex: 1,
  },
  memoryItem: {
    ...typography.body.sm,
    color: colors.dark.textSecondary,
    paddingLeft: 28,
  },
});
