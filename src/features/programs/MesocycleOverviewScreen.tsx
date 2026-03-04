import { useCallback } from "react";
import { View, Text, Pressable, ScrollView, Alert, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useMesocycleStore } from "../../stores/mesocycleStore";
import { mesocycleRepository } from "./mesocycle-repository";
import { getPhaseTargets } from "./phase-manager";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";
import type { MesocyclePhase } from "../../types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PHASE_COLORS: Record<MesocyclePhase, string> = {
  accumulation: colors.semantic.success,
  intensification: colors.semantic.warning,
  realization: colors.brand.primary,
  deload: colors.brand.accent,
};

export function MesocycleOverviewScreen() {
  const navigation = useNavigation<Nav>();
  const currentMesocycle = useMesocycleStore((s) => s.currentMesocycle);
  const microcycles = useMesocycleStore((s) => s.microcycles);
  const currentWeek = useMesocycleStore((s) => s.currentWeek);
  const currentPhase = useMesocycleStore((s) => s.currentPhase);
  const clearMesocycle = useMesocycleStore((s) => s.clearMesocycle);

  const handleEndProgram = useCallback(() => {
    Alert.alert("End Program", "Are you sure you want to end this program?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "End Program",
        style: "destructive",
        onPress: () => {
          if (currentMesocycle) {
            mesocycleRepository.abandon(currentMesocycle.id);
            clearMesocycle();
          }
          navigation.goBack();
        },
      },
    ]);
  }, [currentMesocycle, clearMesocycle, navigation]);

  if (!currentMesocycle) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No active program</Text>
      </View>
    );
  }

  const targets = currentPhase
    ? getPhaseTargets(currentPhase, currentMesocycle.periodizationModel)
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.dark.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>{currentMesocycle.name}</Text>
        <Pressable onPress={() => navigation.navigate("GoalReassessment")}>
          <Ionicons name="settings-outline" size={22} color={colors.dark.textSecondary} />
        </Pressable>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {/* Phase Timeline */}
        <View style={styles.timeline}>
          {currentMesocycle.generatedPlan.weeks.map((week) => {
            const isActive = week.weekNumber === currentWeek;
            const isPast = week.weekNumber < currentWeek;
            return (
              <View key={week.weekNumber} style={styles.timelineWeek}>
                <View
                  style={[
                    styles.timelineBar,
                    { backgroundColor: PHASE_COLORS[week.phase] + (isPast ? "FF" : "55") },
                    isActive && styles.timelineBarActive,
                  ]}
                />
                {isActive && <View style={styles.timelineIndicator} />}
              </View>
            );
          })}
        </View>

        <View style={styles.timelineLabels}>
          <Text style={styles.timelineLabelText}>Week 1</Text>
          <Text style={styles.timelineLabelText}>
            Week {currentMesocycle.durationWeeks}
          </Text>
        </View>

        {/* Current Phase */}
        {currentPhase && targets && (
          <View style={styles.phaseCard}>
            <Text style={styles.phaseCardTitle}>
              Current Phase: <Text style={{ color: PHASE_COLORS[currentPhase], textTransform: "capitalize" }}>{currentPhase}</Text>
            </Text>
            <Text style={styles.phaseCardWeek}>Week {currentWeek} of {currentMesocycle.durationWeeks}</Text>
            <View style={styles.phaseTargets}>
              <View style={styles.targetRow}>
                <Text style={styles.targetLabel}>RPE Range</Text>
                <Text style={styles.targetValue}>{targets.rpeRange[0]} - {targets.rpeRange[1]}</Text>
              </View>
              <View style={styles.targetRow}>
                <Text style={styles.targetLabel}>Volume</Text>
                <Text style={styles.targetValue}>{Math.round(targets.volumeMultiplier * 100)}% of peak</Text>
              </View>
              <View style={styles.targetRow}>
                <Text style={styles.targetLabel}>Intensity</Text>
                <Text style={styles.targetValue}>
                  {Math.round(targets.intensityRange[0] * 100)}%-{Math.round(targets.intensityRange[1] * 100)}% 1RM
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Weekly Progress */}
        <Text style={styles.sectionTitle}>Weekly Progress</Text>
        {microcycles.map((mc) => {
          const isActive = mc.weekNumber === currentWeek;
          const isCompleted = mc.status === "completed";
          const volumePercent = mc.targetVolume && mc.actualVolume
            ? Math.min((mc.actualVolume / mc.targetVolume) * 100, 100)
            : 0;

          return (
            <View
              key={mc.id}
              style={[styles.weekRow, isActive && styles.weekRowActive]}
            >
              <View style={styles.weekRowHeader}>
                <Text style={styles.weekRowTitle}>Week {mc.weekNumber}</Text>
                <View style={[styles.weekPhaseBadge, { backgroundColor: PHASE_COLORS[mc.phase] + "33" }]}>
                  <Text style={[styles.weekPhaseBadgeText, { color: PHASE_COLORS[mc.phase] }]}>
                    {mc.phase}
                  </Text>
                </View>
                {isCompleted && (
                  <Ionicons name="checkmark-circle" size={18} color={colors.semantic.success} />
                )}
              </View>
              {mc.targetVolume != null && (
                <View style={styles.volumeBarContainer}>
                  <View style={[styles.volumeBar, { width: `${volumePercent}%` }]} />
                </View>
              )}
              {mc.actualFrequency != null && (
                <Text style={styles.weekFrequency}>
                  {mc.actualFrequency}/{mc.targetFrequency ?? "?"} sessions
                </Text>
              )}
            </View>
          );
        })}

        {/* Actions */}
        <Pressable
          onPress={() => navigation.navigate("ProgressCharts")}
          style={styles.actionButton}
        >
          <Ionicons name="analytics-outline" size={20} color={colors.brand.accent} />
          <Text style={styles.actionButtonText}>View Progress Charts</Text>
        </Pressable>

        <Pressable onPress={handleEndProgram} style={styles.endButton}>
          <Text style={styles.endButtonText}>End Program</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
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
  contentInner: { padding: 16, paddingBottom: 40 },
  emptyText: { ...typography.body.lg, color: colors.dark.textMuted, textAlign: "center", marginTop: 100 },
  timeline: { flexDirection: "row", gap: 2, marginBottom: 4 },
  timelineWeek: { flex: 1, position: "relative" },
  timelineBar: { height: 8, borderRadius: 4 },
  timelineBarActive: { borderWidth: 2, borderColor: colors.dark.textPrimary },
  timelineIndicator: {
    position: "absolute",
    top: -4,
    left: "50%",
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: colors.dark.textPrimary,
  },
  timelineLabels: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  timelineLabelText: { ...typography.body.sm, color: colors.dark.textMuted },
  phaseCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  phaseCardTitle: { ...typography.heading.h3, color: colors.dark.textPrimary },
  phaseCardWeek: { ...typography.body.md, color: colors.dark.textSecondary, marginTop: 4 },
  phaseTargets: { marginTop: 12, gap: 8 },
  targetRow: { flexDirection: "row", justifyContent: "space-between" },
  targetLabel: { ...typography.body.md, color: colors.dark.textMuted },
  targetValue: { ...typography.label.lg, color: colors.dark.textPrimary },
  sectionTitle: { ...typography.heading.h3, color: colors.dark.textPrimary, marginBottom: 12 },
  weekRow: {
    backgroundColor: colors.dark.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  weekRowActive: { borderWidth: 1, borderColor: colors.brand.primary },
  weekRowHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  weekRowTitle: { ...typography.label.lg, color: colors.dark.textPrimary },
  weekPhaseBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  weekPhaseBadgeText: { ...typography.label.sm, textTransform: "capitalize" },
  weekFrequency: { ...typography.body.sm, color: colors.dark.textMuted, marginTop: 4 },
  volumeBarContainer: {
    height: 4,
    backgroundColor: colors.dark.surfaceElevated,
    borderRadius: 2,
    marginTop: 8,
    overflow: "hidden",
  },
  volumeBar: { height: 4, backgroundColor: colors.semantic.success, borderRadius: 2 },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.dark.surface,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  actionButtonText: { ...typography.label.lg, color: colors.brand.accent },
  endButton: {
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.semantic.danger,
  },
  endButtonText: { ...typography.label.lg, color: colors.semantic.danger },
});
