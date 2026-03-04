import { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useRoute, type RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";
import { memoryRepository } from "./memory-repository";
import type { AgenticMemory, MemoryType } from "../../types/memory";
import type { RootStackParamList } from "../../navigation/types";

type PatternDetailRoute = RouteProp<RootStackParamList, "PatternDetail">;

const TYPE_COLORS: Record<MemoryType, string> = {
  pattern: "#3B82F6",
  preference: "#8B5CF6",
  adaptation: "#10B981",
  warning: "#F59E0B",
  success_factor: "#22C55E",
  failure_factor: "#EF4444",
};

const TYPE_LABELS: Record<MemoryType, string> = {
  pattern: "Pattern",
  preference: "Preference",
  adaptation: "Adaptation",
  warning: "Warning",
  success_factor: "Success Factor",
  failure_factor: "Risk Factor",
};

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function PatternDetailScreen() {
  const route = useRoute<PatternDetailRoute>();
  const { memoryId } = route.params;
  const [memory, setMemory] = useState<AgenticMemory | null>(null);

  useEffect(() => {
    const m = memoryRepository.findById(memoryId);
    setMemory(m);
  }, [memoryId]);

  if (!memory) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Memory not found</Text>
      </View>
    );
  }

  const typeColor = TYPE_COLORS[memory.type];
  const typeLabel = TYPE_LABELS[memory.type];
  const confidencePct = Math.round(memory.confidence * 100);
  const totalApplied = memory.appliedSuccessfully + memory.appliedUnsuccessfully;
  const successRatePct = Math.round(memory.successRate * 100);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Type Badge */}
      <View style={[styles.badge, { backgroundColor: typeColor + "20" }]}>
        <Text style={[styles.badgeText, { color: typeColor }]}>
          {typeLabel}
        </Text>
      </View>

      {/* Description */}
      <Text style={styles.description}>{memory.description}</Text>

      {/* Confidence */}
      <View style={styles.confidenceSection}>
        <Text style={styles.sectionTitle}>Confidence</Text>
        <View style={styles.confidenceBar}>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${confidencePct}%`,
                  backgroundColor:
                    memory.confidence >= 0.7
                      ? colors.semantic.success
                      : memory.confidence >= 0.4
                        ? colors.semantic.warning
                        : colors.semantic.danger,
                },
              ]}
            />
          </View>
          <Text style={styles.confidenceLabel}>{confidencePct}%</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statistics</Text>
        <View style={styles.statsCard}>
          <StatRow label="Observations" value={String(memory.observations)} />
          <StatRow label="Reinforcements" value={String(memory.reinforced)} />
          <StatRow
            label="Success Rate"
            value={totalApplied > 0 ? `${successRatePct}%` : "Not applied yet"}
          />
          <StatRow
            label="Times Applied"
            value={String(totalApplied)}
          />
          <StatRow
            label="Successful"
            value={String(memory.appliedSuccessfully)}
          />
          <StatRow
            label="Unsuccessful"
            value={String(memory.appliedUnsuccessfully)}
          />
        </View>
      </View>

      {/* Timeline */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Timeline</Text>
        <View style={styles.statsCard}>
          <StatRow
            label="First Observed"
            value={formatDate(memory.firstObserved)}
          />
          <StatRow
            label="Last Observed"
            value={formatDate(memory.lastObserved)}
          />
          {memory.lastApplied && (
            <StatRow
              label="Last Applied"
              value={formatDate(memory.lastApplied)}
            />
          )}
        </View>
      </View>

      {/* Trigger / Action */}
      {(memory.trigger ?? memory.action) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trigger & Response</Text>
          <View style={styles.statsCard}>
            {memory.trigger && (
              <View style={styles.triggerRow}>
                <Ionicons
                  name="flash-outline"
                  size={16}
                  color={colors.semantic.warning}
                />
                <View style={styles.triggerContent}>
                  <Text style={styles.triggerLabel}>Trigger</Text>
                  <Text style={styles.triggerValue}>{memory.trigger}</Text>
                </View>
              </View>
            )}
            {memory.action && (
              <View style={styles.triggerRow}>
                <Ionicons
                  name="arrow-forward-outline"
                  size={16}
                  color={colors.semantic.success}
                />
                <View style={styles.triggerContent}>
                  <Text style={styles.triggerLabel}>Response</Text>
                  <Text style={styles.triggerValue}>{memory.action}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  content: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 16,
    gap: 20,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.dark.background,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    ...typography.body.md,
    color: colors.dark.textMuted,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    ...typography.label.md,
  },
  description: {
    ...typography.body.lg,
    color: colors.dark.textPrimary,
    lineHeight: 24,
  },
  confidenceSection: {
    gap: 8,
  },
  sectionTitle: {
    ...typography.heading.h3,
    color: colors.dark.textPrimary,
  },
  confidenceBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.dark.border,
  },
  barFill: {
    height: 8,
    borderRadius: 4,
  },
  confidenceLabel: {
    ...typography.numeric.md,
    color: colors.dark.textPrimary,
    width: 44,
    textAlign: "right",
  },
  section: {
    gap: 10,
  },
  statsCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: 10,
    padding: 14,
    gap: 10,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statLabel: {
    ...typography.body.md,
    color: colors.dark.textSecondary,
  },
  statValue: {
    ...typography.label.md,
    color: colors.dark.textPrimary,
  },
  triggerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingTop: 2,
  },
  triggerContent: {
    flex: 1,
    gap: 2,
  },
  triggerLabel: {
    ...typography.label.sm,
    color: colors.dark.textMuted,
  },
  triggerValue: {
    ...typography.body.md,
    color: colors.dark.textPrimary,
  },
});
