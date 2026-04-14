import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  InteractionManager,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useUserStore } from "../../../stores/userStore";
import { memoryRepository, type AgenticMemory, type MemoryType } from "./memory-repository";
import { colors } from "../../../constants/colors";
import { typography } from "../../../constants/typography";

const TYPE_META: Record<MemoryType, { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }> = {
  optimal_rpe_range:    { icon: "speedometer-outline",    label: "Optimal RPE",        color: colors.brand.primary },
  day_of_week_fatigue:  { icon: "calendar-outline",        label: "Weekly Pattern",     color: colors.brand.secondary },
  exercise_preference:  { icon: "heart-outline",           label: "Preference",         color: "#F59E0B" },
  recovery_timeline:    { icon: "bed-outline",             label: "Recovery",           color: "#8B5CF6" },
  progression_sweet_spot: { icon: "trending-up-outline",  label: "Progression",        color: colors.semantic.success },
  deload_timing:        { icon: "refresh-outline",         label: "Deload Timing",      color: "#F97316" },
  return_protocol:      { icon: "walk-outline",            label: "Return Protocol",    color: "#06B6D4" },
};

function ConfidenceBar({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color =
    confidence >= 0.7
      ? colors.semantic.success
      : confidence >= 0.4
      ? "#F59E0B"
      : colors.semantic.danger;
  return (
    <View style={styles.confRow}>
      <View style={styles.confTrack}>
        <View style={[styles.confFill, { width: `${pct}%` as `${number}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.confLabel, { color }]}>{pct}%</Text>
    </View>
  );
}

function MemoryCard({ item }: { item: AgenticMemory }) {
  const meta = TYPE_META[item.type] ?? TYPE_META.optimal_rpe_range;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.typeBadge, { backgroundColor: meta.color + "22" }]}>
          <Ionicons name={meta.icon} size={14} color={meta.color} />
          <Text style={[styles.typeLabel, { color: meta.color }]}>{meta.label}</Text>
        </View>
        {item.exercise && (
          <Text style={styles.exerciseTag} numberOfLines={1}>
            {item.exercise}
          </Text>
        )}
      </View>
      <Text style={styles.description}>{item.description}</Text>
      {item.action && (
        <View style={styles.actionRow}>
          <Ionicons name="flash-outline" size={12} color={colors.dark.textMuted} />
          <Text style={styles.actionText}>{item.action}</Text>
        </View>
      )}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{item.observations}</Text>
          <Text style={styles.statLabel}>observations</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{Math.round(item.successRate * 100)}%</Text>
          <Text style={styles.statLabel}>success</Text>
        </View>
      </View>
      <ConfidenceBar confidence={item.confidence} />
    </View>
  );
}

export function MemoryDashboardScreen() {
  const navigation = useNavigation();
  const userId = useUserStore((s) => s.id);
  const [memories, setMemories] = useState<AgenticMemory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadMemories = useCallback(() => {
    if (!userId) return;
    const task = InteractionManager.runAfterInteractions(() => {
      const data = memoryRepository.findAll(userId);
      setMemories(data);
      setIsLoading(false);
    });
    return () => task.cancel();
  }, [userId]);

  useEffect(() => {
    const cancel = loadMemories();
    return cancel;
  }, [loadMemories]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.dark.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Learned Patterns</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      ) : memories.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="library-outline" size={48} color={colors.dark.textMuted} />
          <Text style={styles.emptyTitle}>No patterns detected yet</Text>
          <Text style={styles.emptySubtitle}>
            Complete a few more workouts and the AI will start recognising your patterns.
          </Text>
        </View>
      ) : (
        <FlashList
          data={memories}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MemoryCard item={item} />}
          estimatedItemSize={160}
          contentContainerStyle={styles.listContent}
        />
      )}
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
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: { ...typography.heading.h3, color: colors.dark.textSecondary, textAlign: "center" },
  emptySubtitle: { ...typography.body.md, color: colors.dark.textMuted, textAlign: "center", lineHeight: 22 },
  listContent: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeLabel: { ...typography.label.sm, textTransform: "uppercase", letterSpacing: 0.4 },
  exerciseTag: {
    ...typography.label.sm,
    color: colors.dark.textMuted,
    maxWidth: "50%",
  },
  description: {
    ...typography.body.md,
    color: colors.dark.textPrimary,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
  },
  actionText: {
    ...typography.body.sm,
    color: colors.dark.textMuted,
    flex: 1,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: "row",
    gap: 16,
  },
  statItem: { alignItems: "center" },
  statValue: { ...typography.numeric.sm, color: colors.dark.textPrimary },
  statLabel: { ...typography.body.sm, color: colors.dark.textMuted },
  confRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  confTrack: {
    flex: 1,
    height: 4,
    backgroundColor: colors.dark.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  confFill: {
    height: "100%",
    borderRadius: 2,
  },
  confLabel: {
    ...typography.label.sm,
    minWidth: 32,
    textAlign: "right",
  },
});
