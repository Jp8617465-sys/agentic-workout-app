import { useEffect, useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { expoDb } from "../../lib/database";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";
import { personalRecordsRepository } from "./personal-records-repository";
import { AIService } from "../ai/AIService";
import { useUserStore } from "../../stores/userStore";
import { SessionTestsService } from "../coaching/session-tests-service";
import type { SessionTest, SessionTestResult, ProgressionDecision } from "../coaching/types";
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

  const [sessionTests, setSessionTests] = useState<SessionTest[]>([]);
  const [testResults, setTestResults] = useState<Map<string, SessionTestResult>>(new Map());
  const [decisions, setDecisions] = useState<ProgressionDecision[]>([]);
  const [testsSubmitted, setTestsSubmitted] = useState(false);

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

      const tests = SessionTestsService.getTestsForWorkout(workoutId);
      setSessionTests(tests);
      // Pre-populate any results already recorded
      const existingResults = new Map<string, SessionTestResult>();
      for (const test of tests) {
        if (test.result) {
          existingResults.set(test.id, test.result);
        }
      }
      if (existingResults.size > 0) {
        setTestResults(existingResults);
      }
    } else {
      setAiLoading(false);
    }
  }, [workoutId, userId]);

  const handleSetTestResult = useCallback(
    (testId: string, result: SessionTestResult) => {
      setTestResults((prev) => {
        const next = new Map(prev);
        next.set(testId, result);
        return next;
      });
    },
    [],
  );

  const handleSubmitTests = useCallback(() => {
    if (!userId) return;

    for (const [testId, result] of testResults.entries()) {
      SessionTestsService.recordTestResult(testId, result);
    }

    const evaluated = SessionTestsService.evaluateTestResults(userId, workoutId);
    setDecisions(evaluated);
    setTestsSubmitted(true);
  }, [userId, workoutId, testResults]);

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

      {/* Session Tests */}
      {sessionTests.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Session Tests</Text>
          <Text style={styles.testsPrompt}>
            These help drive your next session
          </Text>

          {sessionTests.map((test) => (
            <View key={test.id} style={styles.testCard}>
              <Text style={styles.testLabel}>
                {test.testContext.description}
              </Text>
              <SessionTestInput
                test={test}
                currentResult={testResults.get(test.id) ?? null}
                onResult={(result) => handleSetTestResult(test.id, result)}
              />
            </View>
          ))}

          {!testsSubmitted ? (
            <Pressable
              style={[
                styles.submitTestsButton,
                testResults.size === 0 && styles.submitTestsButtonDisabled,
              ]}
              onPress={handleSubmitTests}
              disabled={testResults.size === 0}
            >
              <Text style={styles.submitTestsText}>Submit Tests</Text>
            </Pressable>
          ) : decisions.length > 0 ? (
            <View style={styles.decisionsCard}>
              <Text style={styles.decisionsTitle}>Decisions Made</Text>
              {decisions.map((d) => (
                <Text key={d.id} style={styles.decisionText}>
                  {formatDecision(d)}
                </Text>
              ))}
            </View>
          ) : (
            <Text style={styles.noDecisionsText}>
              All clear — no progression changes needed.
            </Text>
          )}
        </View>
      )}

      {/* Done */}
      <Pressable style={styles.doneButton} onPress={handleDone}>
        <Text style={styles.doneText}>Done</Text>
      </Pressable>
    </ScrollView>
  );
}

function formatDecision(d: ProgressionDecision): string {
  const labels: Record<string, string> = {
    increase_load: "load increase next session",
    hold_load: "hold load for 1 more session",
    hold_load_extended: "hold load for 2 more sessions",
    expand_prehab: "expand prehab work",
    add_cue: "add tempo cue next session",
    suppress_progression: "progression paused",
    flag_injury_review: "flagged for injury review",
  };
  const label = labels[d.decisionType] ?? d.decisionType;
  return `${d.exerciseName}: ${label}`;
}

function SessionTestInput({
  test,
  currentResult,
  onResult,
}: {
  test: SessionTest;
  currentResult: SessionTestResult | null;
  onResult: (result: SessionTestResult) => void;
}) {
  switch (test.testType) {
    case "RPE_PROGRESSION":
      return (
        <RpeButtons
          selected={currentResult?.type === "RPE_PROGRESSION" ? currentResult.rpe : null}
          onSelect={(rpe) => onResult({ type: "RPE_PROGRESSION", rpe })}
        />
      );

    case "ACTIVATION_CHECK":
      return (
        <OptionButtons
          options={[
            { key: "felt_it", label: "Felt it" },
            { key: "partial", label: "Partial" },
            { key: "quad_dominant", label: "Quad dominant" },
          ]}
          selected={currentResult?.type === "ACTIVATION_CHECK" ? currentResult.outcome : null}
          onSelect={(outcome) =>
            onResult({
              type: "ACTIVATION_CHECK",
              outcome: outcome as "felt_it" | "partial" | "quad_dominant",
            })
          }
        />
      );

    case "TEMPO_HOLD":
      return (
        <OptionButtons
          options={[
            { key: "held_it", label: "Held it" },
            { key: "drifted", label: "Drifted" },
          ]}
          selected={currentResult?.type === "TEMPO_HOLD" ? currentResult.outcome : null}
          onSelect={(outcome) =>
            onResult({
              type: "TEMPO_HOLD",
              outcome: outcome as "held_it" | "drifted",
            })
          }
        />
      );

    case "TECHNIQUE_FLAG":
      return (
        <OptionButtons
          options={[
            { key: "clean", label: "Clean" },
            { key: "minor_breakdown", label: "Minor breakdown" },
            { key: "stopped_early", label: "Stopped early" },
          ]}
          selected={currentResult?.type === "TECHNIQUE_FLAG" ? currentResult.outcome : null}
          onSelect={(outcome) =>
            onResult({
              type: "TECHNIQUE_FLAG",
              outcome: outcome as "clean" | "minor_breakdown" | "stopped_early",
            })
          }
        />
      );

    case "PAIN_CHECK":
      return (
        <PainScaleButtons
          selected={currentResult?.type === "PAIN_CHECK" ? currentResult.painLevel : null}
          onSelect={(painLevel) => onResult({ type: "PAIN_CHECK", painLevel })}
        />
      );

    default:
      return null;
  }
}

function RpeButtons({
  selected,
  onSelect,
}: {
  selected: number | null;
  onSelect: (rpe: number) => void;
}) {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  return (
    <View style={inputStyles.buttonRow}>
      {values.map((v) => (
        <Pressable
          key={v}
          style={[
            inputStyles.rpeButton,
            selected === v && inputStyles.rpeButtonSelected,
          ]}
          onPress={() => onSelect(v)}
        >
          <Text
            style={[
              inputStyles.rpeButtonText,
              selected === v && inputStyles.rpeButtonTextSelected,
            ]}
          >
            {v}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function OptionButtons({
  options,
  selected,
  onSelect,
}: {
  options: { key: string; label: string }[];
  selected: string | null;
  onSelect: (key: string) => void;
}) {
  return (
    <View style={inputStyles.optionRow}>
      {options.map((opt) => (
        <Pressable
          key={opt.key}
          style={[
            inputStyles.optionButton,
            selected === opt.key && inputStyles.optionButtonSelected,
          ]}
          onPress={() => onSelect(opt.key)}
        >
          <Text
            style={[
              inputStyles.optionButtonText,
              selected === opt.key && inputStyles.optionButtonTextSelected,
            ]}
          >
            {opt.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function PainScaleButtons({
  selected,
  onSelect,
}: {
  selected: number | null;
  onSelect: (level: number) => void;
}) {
  const values = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  return (
    <View style={inputStyles.buttonRow}>
      {values.map((v) => {
        const isHigh = v >= 4;
        return (
          <Pressable
            key={v}
            style={[
              inputStyles.painButton,
              selected === v && (isHigh ? inputStyles.painButtonDanger : inputStyles.painButtonSelected),
            ]}
            onPress={() => onSelect(v)}
          >
            <Text
              style={[
                inputStyles.painButtonText,
                selected === v && inputStyles.painButtonTextSelected,
              ]}
            >
              {v}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const inputStyles = StyleSheet.create({
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  rpeButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: colors.dark.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  rpeButtonSelected: {
    backgroundColor: colors.brand.primary,
  },
  rpeButtonText: {
    ...typography.label.md,
    color: colors.dark.textSecondary,
  },
  rpeButtonTextSelected: {
    color: "#FFFFFF",
  },
  optionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: colors.dark.surfaceElevated,
    alignItems: "center",
  },
  optionButtonSelected: {
    backgroundColor: colors.brand.primary,
  },
  optionButtonText: {
    ...typography.label.md,
    color: colors.dark.textSecondary,
    textAlign: "center",
  },
  optionButtonTextSelected: {
    color: "#FFFFFF",
  },
  painButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: colors.dark.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  painButtonSelected: {
    backgroundColor: colors.brand.primary,
  },
  painButtonDanger: {
    backgroundColor: colors.semantic.danger,
  },
  painButtonText: {
    ...typography.label.sm,
    color: colors.dark.textSecondary,
  },
  painButtonTextSelected: {
    color: "#FFFFFF",
  },
});

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
  testsPrompt: {
    ...typography.body.sm,
    color: colors.dark.textMuted,
  },
  testCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: 10,
    padding: 14,
    gap: 4,
  },
  testLabel: {
    ...typography.label.md,
    color: colors.dark.textPrimary,
  },
  submitTestsButton: {
    backgroundColor: colors.brand.secondary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitTestsButtonDisabled: {
    opacity: 0.4,
  },
  submitTestsText: {
    ...typography.label.lg,
    color: "#FFFFFF",
  },
  decisionsCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: 10,
    padding: 14,
    gap: 6,
  },
  decisionsTitle: {
    ...typography.label.md,
    color: colors.semantic.success,
  },
  decisionText: {
    ...typography.body.md,
    color: colors.dark.textSecondary,
  },
  noDecisionsText: {
    ...typography.body.md,
    color: colors.dark.textMuted,
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
