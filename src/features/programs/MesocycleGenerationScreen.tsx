import { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useUserStore } from "../../stores/userStore";
import { useMesocycleStore } from "../../stores/mesocycleStore";
import { selectPeriodizationModel } from "./periodization-selector";
import { mesocycleRepository } from "./mesocycle-repository";
import { microcycleRepository } from "./microcycle-repository";
import { supabase } from "../../lib/supabase";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";
import type { GeneratedMesocyclePlan, MesocyclePhase } from "../../types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type GenerationState = "preview" | "generating" | "review" | "error";

const LOADING_MESSAGES = [
  "Analyzing your profile...",
  "Designing your program...",
  "Selecting exercises...",
  "Finalizing your plan...",
];

export function MesocycleGenerationScreen() {
  const navigation = useNavigation<Nav>();
  const userId = useUserStore((s) => s.id);
  const experienceLevel = useUserStore((s) => s.experienceLevel);
  const trainingGoal = useUserStore((s) => s.trainingGoal);
  const availableEquipment = useUserStore((s) => s.availableEquipment);
  const weeklyFrequency = useUserStore((s) => s.weeklyFrequency);
  const setCurrentMesocycle = useMesocycleStore((s) => s.setCurrentMesocycle);

  const recommendation = selectPeriodizationModel(experienceLevel, trainingGoal);
  const [state, setState] = useState<GenerationState>("preview");
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedMesocyclePlan | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleGenerate = useCallback(async () => {
    setState("generating");
    setLoadingMsgIdx(0);

    const msgInterval = setInterval(() => {
      setLoadingMsgIdx((prev) => Math.min(prev + 1, LOADING_MESSAGES.length - 1));
    }, 5000);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (token) {
        const { data, error } = await supabase.functions.invoke("ai-coach", {
          body: {
            mode: "mesocycle_generation",
            userId,
            experienceLevel,
            trainingGoal,
            weeklyFrequency,
            availableEquipment,
            periodizationModel: recommendation.model,
            durationWeeks: recommendation.durationWeeks,
          },
          headers: { Authorization: `Bearer ${token}` },
        });

        if (error) throw error;
        const plan = data as GeneratedMesocyclePlan;
        if (plan.weeks && plan.weeks.length > 0) {
          setGeneratedPlan(plan);
          setState("review");
          clearInterval(msgInterval);
          return;
        }
      }
      throw new Error("No valid plan returned");
    } catch {
      clearInterval(msgInterval);
      // Fallback: generate a basic deterministic plan
      const fallbackPlan = generateFallbackPlan(recommendation.model, recommendation.durationWeeks, weeklyFrequency, trainingGoal);
      setGeneratedPlan(fallbackPlan);
      setState("review");
    }
  }, [userId, experienceLevel, trainingGoal, weeklyFrequency, availableEquipment, recommendation]);

  const handleStartProgram = useCallback(() => {
    if (!generatedPlan || !userId) return;

    const startDate = new Date().toISOString().split("T")[0];
    const endDate = new Date(Date.now() + recommendation.durationWeeks * 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const mesocycleId = mesocycleRepository.insert({
      userId,
      name: generatedPlan.name,
      periodizationModel: recommendation.model,
      startDate,
      endDate,
      durationWeeks: recommendation.durationWeeks,
      goal: trainingGoal,
      generatedPlan,
    });

    const microcycleData = generatedPlan.weeks.map((week) => ({
      mesocycleId,
      weekNumber: week.weekNumber,
      phase: week.phase,
      targetVolume: null,
      targetIntensity: null,
      targetFrequency: weeklyFrequency,
    }));
    microcycleRepository.insertBatch(mesocycleId, microcycleData);

    const mesocycle = mesocycleRepository.findById(mesocycleId);
    const microcycles = microcycleRepository.findByMesocycle(mesocycleId);
    if (mesocycle) {
      setCurrentMesocycle(mesocycle, microcycles);
    }

    navigation.goBack();
  }, [generatedPlan, userId, recommendation, trainingGoal, weeklyFrequency, setCurrentMesocycle, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={colors.dark.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Training Program</Text>
        <View style={styles.headerSpacer} />
      </View>

      {state === "preview" && (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          <Text style={styles.title}>Your Program Profile</Text>

          <View style={styles.summaryCard}>
            <SummaryRow label="Goal" value={formatGoal(trainingGoal)} />
            <SummaryRow label="Experience" value={formatLevel(experienceLevel)} />
            <SummaryRow label="Equipment" value={`${availableEquipment.length} types`} />
            <SummaryRow label="Frequency" value={`${weeklyFrequency} days/week`} />
          </View>

          <View style={styles.recommendationCard}>
            <Text style={styles.recommendationTitle}>Recommended Program</Text>
            <Text style={styles.recommendationModel}>{formatModel(recommendation.model)}</Text>
            <Text style={styles.recommendationDuration}>
              {recommendation.durationWeeks} weeks
            </Text>
            <Text style={styles.recommendationRationale}>{recommendation.rationale}</Text>
          </View>

          <Pressable onPress={handleGenerate} style={styles.generateButton}>
            <Ionicons name="sparkles" size={20} color="#FFFFFF" />
            <Text style={styles.generateButtonText}>Generate My Program</Text>
          </Pressable>
        </ScrollView>
      )}

      {state === "generating" && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={styles.loadingText}>{LOADING_MESSAGES[loadingMsgIdx]}</Text>
        </View>
      )}

      {state === "review" && generatedPlan && (
        <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
          <Text style={styles.title}>{generatedPlan.name}</Text>
          <Text style={styles.planSummary}>
            {generatedPlan.durationWeeks} weeks - {formatModel(generatedPlan.periodizationModel)}
          </Text>

          {generatedPlan.weeks.slice(0, 4).map((week) => (
            <View key={week.weekNumber} style={styles.weekCard}>
              <View style={styles.weekHeader}>
                <Text style={styles.weekTitle}>Week {week.weekNumber}</Text>
                <View style={[styles.phaseBadge, phaseColor(week.phase)]}>
                  <Text style={styles.phaseBadgeText}>{week.phase}</Text>
                </View>
              </View>
              <Text style={styles.weekDetail}>
                {week.sessions.length} sessions - {week.sessions.reduce(
                  (sum, s) => sum + s.exercises.length,
                  0,
                )} exercises
              </Text>
            </View>
          ))}
          {generatedPlan.weeks.length > 4 && (
            <Text style={styles.moreWeeks}>
              +{generatedPlan.weeks.length - 4} more weeks
            </Text>
          )}

          <Pressable onPress={handleStartProgram} style={styles.startProgramButton}>
            <Text style={styles.startProgramText}>Start Program</Text>
          </Pressable>
        </ScrollView>
      )}

      {state === "error" && (
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.semantic.danger} />
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable onPress={handleGenerate} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

function formatGoal(goal: string): string {
  return goal.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatLevel(level: string): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function formatModel(model: string): string {
  const map: Record<string, string> = {
    linear: "Linear Periodization",
    block: "Block Periodization",
    dup: "Daily Undulating",
    conjugate: "Conjugate Method",
  };
  return map[model] ?? model;
}

function phaseColor(phase: MesocyclePhase): { backgroundColor: string } {
  const map: Record<MesocyclePhase, string> = {
    accumulation: colors.semantic.success,
    intensification: colors.semantic.warning,
    realization: colors.brand.primary,
    deload: colors.brand.accent,
  };
  return { backgroundColor: map[phase] + "33" };
}

function generateFallbackPlan(
  model: string,
  durationWeeks: number,
  frequency: number,
  goal: string,
): GeneratedMesocyclePlan {
  const phases: MesocyclePhase[] = [];
  for (let w = 1; w <= durationWeeks; w++) {
    if (w % 4 === 0) phases.push("deload");
    else if (w <= Math.ceil(durationWeeks * 0.4)) phases.push("accumulation");
    else if (w <= Math.ceil(durationWeeks * 0.7)) phases.push("intensification");
    else phases.push("realization");
  }

  const sessionDays = [1, 2, 3, 4, 5, 6].slice(0, frequency); // Mon-Sat

  const weeks = phases.map((phase, idx) => ({
    weekNumber: idx + 1,
    phase,
    sessions: sessionDays.map((dayOfWeek, si) => ({
      dayOfWeek,
      sessionType: si % 2 === 0 ? "upper" : "lower",
      exercises: [
        { exerciseName: "Bench Press", sets: 3, repRange: "8-12", targetRpe: 7, restSeconds: 120, notes: null },
        { exerciseName: "Barbell Squat", sets: 3, repRange: "6-10", targetRpe: 7.5, restSeconds: 150, notes: null },
      ],
      estimatedDurationMinutes: 45,
    })),
  }));

  return {
    name: `${formatGoal(goal)} Program`,
    durationWeeks,
    periodizationModel: model as GeneratedMesocyclePlan["periodizationModel"],
    goal,
    weeks,
  };
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  closeButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { ...typography.heading.h3, color: colors.dark.textPrimary },
  headerSpacer: { width: 40 },
  content: { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 40 },
  title: { ...typography.heading.h1, color: colors.dark.textPrimary, marginBottom: 16 },
  summaryCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryLabel: { ...typography.body.md, color: colors.dark.textMuted },
  summaryValue: { ...typography.label.lg, color: colors.dark.textPrimary },
  recommendationCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: colors.brand.primary,
  },
  recommendationTitle: { ...typography.label.sm, color: colors.dark.textMuted, textTransform: "uppercase", letterSpacing: 1 },
  recommendationModel: { ...typography.heading.h2, color: colors.dark.textPrimary, marginTop: 4 },
  recommendationDuration: { ...typography.body.lg, color: colors.brand.primary, marginTop: 2 },
  recommendationRationale: { ...typography.body.md, color: colors.dark.textSecondary, marginTop: 8 },
  generateButton: {
    backgroundColor: colors.brand.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    minHeight: 56,
  },
  generateButtonText: { ...typography.heading.h3, color: "#FFFFFF" },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  loadingText: { ...typography.body.lg, color: colors.dark.textSecondary },
  planSummary: { ...typography.body.lg, color: colors.dark.textSecondary, marginBottom: 16 },
  weekCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  weekHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  weekTitle: { ...typography.label.lg, color: colors.dark.textPrimary },
  phaseBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  phaseBadgeText: { ...typography.label.sm, color: colors.dark.textPrimary, textTransform: "capitalize" },
  weekDetail: { ...typography.body.sm, color: colors.dark.textMuted, marginTop: 4 },
  moreWeeks: { ...typography.body.md, color: colors.dark.textMuted, textAlign: "center", paddingVertical: 8 },
  startProgramButton: {
    backgroundColor: colors.semantic.success,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 16,
    minHeight: 56,
  },
  startProgramText: { ...typography.heading.h3, color: "#FFFFFF" },
  errorText: { ...typography.body.lg, color: colors.semantic.danger, textAlign: "center", paddingHorizontal: 32 },
  retryButton: {
    backgroundColor: colors.dark.surface,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: { ...typography.label.lg, color: colors.dark.textPrimary },
});
