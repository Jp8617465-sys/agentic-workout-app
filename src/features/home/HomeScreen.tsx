import { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useUserStore } from "../../stores/userStore";
import { workoutRepository } from "../workouts/workout-repository";
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
  const [lastWorkout, setLastWorkout] = useState<WorkoutSummary | null>(null);
  const [monthCount, setMonthCount] = useState(0);

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
  }, [userId, navigation]);

  const handleStartWorkout = useCallback(() => {
    navigation.navigate("ActiveWorkout");
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

      <Pressable onPress={handleStartWorkout} style={styles.startButton}>
        <Ionicons name="flash" size={22} color="#FFFFFF" />
        <Text style={styles.startButtonText}>Start Workout</Text>
      </Pressable>

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
});
