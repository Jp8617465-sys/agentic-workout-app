import { useEffect, useState, useCallback } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useUserStore } from "../../stores/userStore";
import { workoutRepository } from "../workouts/workout-repository";
import { WorkoutHistoryItem } from "./WorkoutHistoryItem";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";
import type { WorkoutSummary } from "../workouts/types";

export function HistoryScreen() {
  const userId = useUserStore((s) => s.id);
  const [workouts, setWorkouts] = useState<WorkoutSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadWorkouts = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const recent = await workoutRepository.findRecent(userId, 50);
    setWorkouts(recent);
    setIsLoading(false);
  }, [userId]);

  // Reload on screen focus
  useFocusEffect(
    useCallback(() => {
      loadWorkouts();
    }, [loadWorkouts]),
  );

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.brand.primary} />
      </View>
    );
  }

  if (workouts.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="calendar-outline" size={48} color={colors.dark.textMuted} />
        <Text style={styles.emptyTitle}>No workouts yet</Text>
        <Text style={styles.emptySubtitle}>
          Complete a workout and it will appear here
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Workout History</Text>
      <FlashList
        data={workouts}
        renderItem={({ item }) => <WorkoutHistoryItem workout={item} />}
        estimatedItemSize={80}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
    paddingTop: 56,
  },
  header: {
    ...typography.heading.h2,
    color: colors.dark.textPrimary,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  center: {
    flex: 1,
    backgroundColor: colors.dark.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    ...typography.heading.h3,
    color: colors.dark.textSecondary,
    marginTop: 16,
  },
  emptySubtitle: {
    ...typography.body.md,
    color: colors.dark.textMuted,
    textAlign: "center",
    marginTop: 4,
  },
});
