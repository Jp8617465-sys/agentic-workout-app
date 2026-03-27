import { useEffect, useCallback } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useMemoryStore } from "../../stores/memoryStore";
import { useUserStore } from "../../stores/userStore";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";
import type { AgenticMemory, MemoryType } from "../../types";

const TYPE_CONFIG: Record<MemoryType, { label: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  pattern: { label: "Pattern", color: colors.brand.accent, icon: "analytics-outline" },
  preference: { label: "Preference", color: colors.brand.secondary, icon: "heart-outline" },
  adaptation: { label: "Adaptation", color: colors.brand.primary, icon: "git-branch-outline" },
  warning: { label: "Warning", color: colors.semantic.warning, icon: "warning-outline" },
  success_factor: { label: "Success", color: colors.semantic.success, icon: "trophy-outline" },
};

function formatRelativeDate(dateStr: string): string {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const barColor = pct >= 70 ? colors.semantic.success : pct >= 40 ? colors.semantic.warning : colors.dark.textMuted;

  return (
    <View style={confStyles.container}>
      <View style={confStyles.track}>
        <View style={[confStyles.fill, { width: `${pct}%`, backgroundColor: barColor }]} />
      </View>
      <Text style={confStyles.label}>{pct}%</Text>
    </View>
  );
}

const confStyles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", gap: 6 },
  track: { flex: 1, height: 4, backgroundColor: colors.dark.surfaceElevated, borderRadius: 2 },
  fill: { height: 4, borderRadius: 2 },
  label: { ...typography.label.sm, color: colors.dark.textMuted, minWidth: 32 },
});

function MemoryCard({ memory }: { memory: AgenticMemory }) {
  const config = TYPE_CONFIG[memory.type];

  return (
    <View style={cardStyles.container}>
      <View style={cardStyles.header}>
        <View style={[cardStyles.badge, { backgroundColor: config.color + "20" }]}>
          <Ionicons name={config.icon} size={12} color={config.color} />
          <Text style={[cardStyles.badgeText, { color: config.color }]}>{config.label}</Text>
        </View>
        <Text style={cardStyles.date}>{formatRelativeDate(memory.lastObserved)}</Text>
      </View>

      <Text style={cardStyles.description}>{memory.description}</Text>

      <View style={cardStyles.footer}>
        <ConfidenceBar value={memory.confidence} />
        <Text style={cardStyles.observations}>
          {memory.observations} obs
        </Text>
      </View>

      {memory.action ? (
        <View style={cardStyles.actionRow}>
          <Ionicons name="arrow-forward-outline" size={12} color={colors.dark.textMuted} />
          <Text style={cardStyles.actionText}>{memory.action}</Text>
        </View>
      ) : null}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { ...typography.label.sm, fontWeight: "600" },
  date: { ...typography.label.sm, color: colors.dark.textMuted },
  description: { ...typography.body.md, color: colors.dark.textPrimary, marginBottom: 10 },
  footer: { flexDirection: "row", alignItems: "center", gap: 12 },
  observations: { ...typography.label.sm, color: colors.dark.textMuted },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.dark.border,
  },
  actionText: { ...typography.body.sm, color: colors.dark.textSecondary, flex: 1 },
});

function StatsHeader({ total, avgConfidence, byType }: { total: number; avgConfidence: number; byType: Record<MemoryType, number> }) {
  return (
    <View style={statsStyles.container}>
      <View style={statsStyles.row}>
        <View style={statsStyles.stat}>
          <Text style={statsStyles.statValue}>{total}</Text>
          <Text style={statsStyles.statLabel}>Memories</Text>
        </View>
        <View style={statsStyles.stat}>
          <Text style={statsStyles.statValue}>{Math.round(avgConfidence * 100)}%</Text>
          <Text style={statsStyles.statLabel}>Avg Confidence</Text>
        </View>
      </View>
      <View style={statsStyles.typesRow}>
        {(["pattern", "preference", "adaptation", "warning", "success_factor"] as MemoryType[])
          .filter((type) => byType[type] > 0)
          .map((type) => (
            <View key={type} style={[statsStyles.typeBadge, { backgroundColor: TYPE_CONFIG[type].color + "20" }]}>
              <Text style={[statsStyles.typeText, { color: TYPE_CONFIG[type].color }]}>
                {TYPE_CONFIG[type].label}: {byType[type]}
              </Text>
            </View>
          ))}
      </View>
    </View>
  );
}

const statsStyles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 16 },
  row: { flexDirection: "row", gap: 16, marginBottom: 12 },
  stat: {
    flex: 1,
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statValue: { ...typography.heading.h2, color: colors.dark.textPrimary },
  statLabel: { ...typography.label.sm, color: colors.dark.textMuted, marginTop: 4 },
  typesRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  typeText: { ...typography.label.sm, fontWeight: "600" },
});

function EmptyState() {
  return (
    <View style={emptyStyles.container}>
      <Ionicons name="bulb-outline" size={48} color={colors.dark.textMuted} />
      <Text style={emptyStyles.title}>No Memories Yet</Text>
      <Text style={emptyStyles.subtitle}>
        Complete more workouts and the AI will learn your patterns, preferences, and optimal training strategies.
      </Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: { alignItems: "center", paddingTop: 80, paddingHorizontal: 40 },
  title: { ...typography.heading.h3, color: colors.dark.textPrimary, marginTop: 16 },
  subtitle: { ...typography.body.md, color: colors.dark.textMuted, textAlign: "center", marginTop: 8 },
});

export function MemoryDashboardScreen() {
  const navigation = useNavigation();
  const userId = useUserStore((s: { id: string | null }) => s.id);
  const { memories, stats, isDetecting, loadMemories, runDetection } = useMemoryStore();

  useEffect(() => {
    if (userId) loadMemories(userId);
  }, [userId, loadMemories]);

  const handleRefresh = useCallback(() => {
    if (userId && !isDetecting) runDetection(userId);
  }, [userId, isDetecting, runDetection]);

  const renderItem = useCallback(
    (info: { item: AgenticMemory }) => <MemoryCard memory={info.item} />,
    [],
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={colors.dark.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>AI Memory</Text>
        <Pressable onPress={handleRefresh} hitSlop={8} style={styles.refreshButton}>
          {isDetecting ? (
            <ActivityIndicator size="small" color={colors.brand.primary} />
          ) : (
            <Ionicons name="refresh-outline" size={22} color={colors.dark.textSecondary} />
          )}
        </Pressable>
      </View>

      {memories.length === 0 ? (
        <EmptyState />
      ) : (
        <FlashList
          data={memories}
          renderItem={renderItem}
          estimatedItemSize={120}
          keyExtractor={(item: AgenticMemory) => item.id}
          ListHeaderComponent={
            <StatsHeader total={stats.total} avgConfidence={stats.avgConfidence} byType={stats.byType} />
          }
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...typography.heading.h2,
    color: colors.dark.textPrimary,
  },
  refreshButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
