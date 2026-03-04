import { useState, useCallback } from "react";
import { View, Text, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useUserStore } from "../../stores/userStore";
import { useMesocycleStore } from "../../stores/mesocycleStore";
import { mesocycleRepository } from "./mesocycle-repository";
import { microcycleRepository } from "./microcycle-repository";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";
import type { TrainingGoal } from "../../types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const GOALS: { value: TrainingGoal; label: string; impact: string }[] = [
  { value: "strength", label: "Strength", impact: "Lower rep ranges (1-5), higher intensity, longer rest" },
  { value: "hypertrophy", label: "Hypertrophy", impact: "Moderate reps (8-12), moderate intensity, shorter rest" },
  { value: "endurance", label: "Endurance", impact: "Higher reps (15-20+), lower intensity, minimal rest" },
  { value: "general_fitness", label: "General Fitness", impact: "Mixed rep ranges, balanced volume and intensity" },
  { value: "weight_loss", label: "Weight Loss", impact: "Circuit-style, higher volume, minimal rest" },
  { value: "athletic_performance", label: "Athletic Performance", impact: "Power-focused, explosive movements, varied intensity" },
];

export function GoalReassessmentScreen() {
  const navigation = useNavigation<Nav>();
  const currentGoal = useUserStore((s) => s.trainingGoal);
  const setUser = useUserStore((s) => s.setUser);
  const currentMesocycle = useMesocycleStore((s) => s.currentMesocycle);
  const currentWeek = useMesocycleStore((s) => s.currentWeek);
  const setCurrentMesocycle = useMesocycleStore((s) => s.setCurrentMesocycle);

  const [selectedGoal, setSelectedGoal] = useState<TrainingGoal>(currentGoal);

  const handleApply = useCallback(() => {
    if (selectedGoal === currentGoal || !currentMesocycle) {
      navigation.goBack();
      return;
    }

    Alert.alert(
      "Change Training Goal",
      `Switch from ${formatGoal(currentGoal)} to ${formatGoal(selectedGoal)}? This will adjust your remaining program weeks.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Apply",
          onPress: () => {
            setUser({ trainingGoal: selectedGoal });

            // Update the generated plan for remaining weeks
            const updatedPlan = { ...currentMesocycle.generatedPlan, goal: selectedGoal };
            mesocycleRepository.updatePlan(currentMesocycle.id, updatedPlan);

            // Reload from DB
            const refreshed = mesocycleRepository.findById(currentMesocycle.id);
            if (refreshed) {
              const mcs = microcycleRepository.findByMesocycle(refreshed.id);
              setCurrentMesocycle(refreshed, mcs);
            }

            navigation.goBack();
          },
        },
      ],
    );
  }, [selectedGoal, currentGoal, currentMesocycle, currentWeek, setUser, setCurrentMesocycle, navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.dark.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Training Goal</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <Text style={styles.subtitle}>
          Current goal: <Text style={{ color: colors.brand.primary }}>{formatGoal(currentGoal)}</Text>
        </Text>
        {currentMesocycle && (
          <Text style={styles.weekInfo}>
            Week {currentWeek} of {currentMesocycle.durationWeeks} — changes apply to remaining weeks
          </Text>
        )}

        <View style={styles.goalList}>
          {GOALS.map((goal) => {
            const isSelected = selectedGoal === goal.value;
            const isCurrent = currentGoal === goal.value;
            return (
              <Pressable
                key={goal.value}
                style={[styles.goalCard, isSelected && styles.goalCardSelected]}
                onPress={() => setSelectedGoal(goal.value)}
              >
                <View style={styles.goalCardHeader}>
                  <Text style={[styles.goalLabel, isSelected && styles.goalLabelSelected]}>
                    {goal.label}
                  </Text>
                  {isCurrent && (
                    <Text style={styles.currentBadge}>Current</Text>
                  )}
                  {isSelected && !isCurrent && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.brand.primary} />
                  )}
                </View>
                <Text style={styles.goalImpact}>{goal.impact}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Pressable
        onPress={handleApply}
        style={[
          styles.applyButton,
          selectedGoal === currentGoal && styles.applyButtonDisabled,
        ]}
        disabled={selectedGoal === currentGoal}
      >
        <Text style={styles.applyButtonText}>
          {selectedGoal === currentGoal ? "No Changes" : "Apply Changes"}
        </Text>
      </Pressable>
    </View>
  );
}

function formatGoal(goal: string): string {
  return goal.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
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
  headerTitle: { ...typography.heading.h3, color: colors.dark.textPrimary },
  content: { flex: 1 },
  contentInner: { padding: 16 },
  subtitle: { ...typography.body.lg, color: colors.dark.textSecondary, marginBottom: 4 },
  weekInfo: { ...typography.body.sm, color: colors.dark.textMuted, marginBottom: 20 },
  goalList: { gap: 10 },
  goalCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  goalCardSelected: {
    borderColor: colors.brand.primary,
    backgroundColor: colors.dark.surfaceElevated,
  },
  goalCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  goalLabel: { ...typography.label.lg, color: colors.dark.textSecondary },
  goalLabelSelected: { color: colors.dark.textPrimary },
  currentBadge: {
    ...typography.label.sm,
    color: colors.brand.secondary,
    backgroundColor: colors.brand.secondary + "22",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: "hidden",
  },
  goalImpact: { ...typography.body.sm, color: colors.dark.textMuted, marginTop: 4 },
  applyButton: {
    backgroundColor: colors.brand.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 40,
    minHeight: 56,
  },
  applyButtonDisabled: { backgroundColor: colors.dark.surfaceElevated },
  applyButtonText: { ...typography.heading.h3, color: "#FFFFFF" },
});
