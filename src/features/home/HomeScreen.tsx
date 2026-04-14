import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  InteractionManager,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useUserStore } from "../../stores/userStore";
import { useMesocycleStore } from "../../stores/mesocycleStore";
import { useSyncEngine } from "../../hooks/useSyncEngine";
import { workoutRepository } from "../workouts/workout-repository";
import {
  checkForActiveWorkout,
  promptWorkoutRecovery,
} from "../workouts/workout-recovery";
import { readinessRepository } from "./readiness-repository";
import { getDailyBrief } from "./daily-brief-service";
import { ReadinessCheckIn } from "./components/ReadinessCheckIn";
import { DailyBriefCard } from "./components/DailyBriefCard";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";
import type { WorkoutSummary } from "../workouts/types";
import type { DailyBrief, ReadinessLevel } from "./types";
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
  const [showReadiness, setShowReadiness] = useState(false);
  const [brief, setBrief] = useState<DailyBrief | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);

  const { isSyncing, hasPending, lastError, manualSync } = useSyncEngine({
    syncOnResume: true,
  });

  const today = new Date().toISOString().split("T")[0];

  const loadBrief = useCallback(
    async (readiness = null as Parameters<typeof getDailyBrief>[0]["readiness"]) => {
      if (!userId) return;
      setBriefLoading(true);
      try {
        const result = await getDailyBrief({
          userId,
          today,
          prescription: todayPrescription,
          phase: currentPhase,
          weekNumber: currentWeek,
          readiness,
        });
        setBrief(result);
      } finally {
        setBriefLoading(false);
      }
    },
    [userId, today, todayPrescription, currentPhase, currentWeek],
  );

  useEffect(() => {
    if (!userId) return;

    const task = InteractionManager.runAfterInteractions(() => {
      // Check for active workout to resume
      checkForActiveWorkout(userId).then((active) => {
        if (active) {
          promptWorkoutRecovery(
            active,
            () => navigation.navigate("ActiveWorkout"),
            () => {},
          );
        }
      });

      // Load workout stats
      workoutRepository.findRecent(userId, 1).then((recent) => {
        if (recent.length > 0) setLastWorkout(recent[0]);
      });

      workoutRepository.findRecent(userId, 100).then((all) => {
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          .toISOString()
          .split("T")[0];
        setMonthCount(all.filter((w) => w.date >= monthStart).length);
      });

      // Check readiness for today
      const readiness = readinessRepository.findByDate(userId, today);
      if (!readiness) {
        setShowReadiness(true);
      } else {
        loadBrief(readiness);
      }
    });

    return () => task.cancel();
  }, [userId, today, navigation, loadBrief]);

  const handleReadinessSubmit = useCallback(
    async (energy: ReadinessLevel, soreness: ReadinessLevel, motivation: ReadinessLevel) => {
      if (!userId) return;
      setShowReadiness(false);
      const log = readinessRepository.insert({ userId, date: today, energy, soreness, motivation });
      await loadBrief(log);
    },
    [userId, today, loadBrief],
  );

  const handleReadinessSkip = useCallback(() => {
    setShowReadiness(false);
    loadBrief(null);
  }, [loadBrief]);

  const handleStartWorkout = useCallback(() => {
    if (brief && brief.exercises.length > 0 && todayPrescription) {
      navigation.navigate("ActiveWorkout", { prescription: todayPrescription } as never);
    } else {
      navigation.navigate("ActiveWorkout");
    }
  }, [navigation, brief, todayPrescription]);

  const handleCreateProgram = useCallback(() => {
    navigation.navigate("MesocycleGeneration");
  }, [navigation]);

  const greeting = userName ? `Hey, ${userName}` : "Ready to train?";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Sync status */}
      {(isSyncing || hasPending || lastError) && (
        <View style={styles.syncStatusContainer}>
          {isSyncing ? (
            <>
              <ActivityIndicator size="small" color={colors.brand.primary} />
              <Text style={styles.syncStatusText}>Syncing...</Text>
            </>
          ) : lastError ? (
            <>
              <Ionicons name="alert-circle" size={16} color={colors.semantic.error} />
              <Text style={styles.syncStatusText}>Sync error</Text>
            </>
          ) : hasPending ? (
            <>
              <Ionicons name="cloud-offline" size={16} color={colors.semantic.warning} />
              <Text style={styles.syncStatusText}>Offline — pending sync</Text>
            </>
          ) : null}
          {!isSyncing && (hasPending || lastError) && (
            <Pressable onPress={manualSync} style={styles.syncButton}>
              <Ionicons name="refresh" size={16} color={colors.brand.primary} />
            </Pressable>
          )}
        </View>
      )}

      {/* Greeting */}
      <View style={styles.greetingSection}>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.subtitle}>
          {monthCount > 0
            ? `${monthCount} workout${monthCount !== 1 ? "s" : ""} this month`
            : "Let's get started"}
        </Text>
      </View>

      {/* Daily Brief Card — replaces the old prescription card */}
      {(brief || briefLoading) ? (
        <DailyBriefCard
          brief={brief}
          isLoading={briefLoading}
          currentPhase={currentPhase}
          onStart={handleStartWorkout}
        />
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

      {/* Last workout */}
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
                {lastWorkout.durationMinutes ? `${lastWorkout.durationMinutes}m` : "—"}
              </Text>
              <Text style={styles.statLabel}>Duration</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {lastWorkout.totalVolume ? `${Math.round(lastWorkout.totalVolume)}` : "—"}
              </Text>
              <Text style={styles.statLabel}>Volume (kg)</Text>
            </View>
          </View>
        </View>
      )}

      {/* Readiness modal */}
      <ReadinessCheckIn
        visible={showReadiness}
        onSubmit={handleReadinessSubmit}
        onSkip={handleReadinessSkip}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 64,
    paddingBottom: 32,
  },
  syncStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.dark.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    gap: 8,
  },
  syncStatusText: {
    ...typography.body.sm,
    color: colors.dark.textSecondary,
    flex: 1,
  },
  syncButton: {
    padding: 4,
  },
  greetingSection: {
    marginBottom: 24,
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
    marginBottom: 12,
  },
  startButtonText: {
    ...typography.heading.h3,
    color: "#FFFFFF",
  },
  programCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 16,
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
  lastWorkoutCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
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
