import { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";
import { useUserStore } from "../../stores/userStore";
import { memoryRepository } from "./memory-repository";
import type { AgenticMemory, MemoryType } from "../../types/memory";

type LocalNav = NativeStackNavigationProp<
  { PatternDetail: { memoryId: string } },
  "PatternDetail"
>;

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
  success_factor: "Success",
  failure_factor: "Risk",
};

function ConfidenceBar({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const barColor =
    value >= 0.7
      ? colors.semantic.success
      : value >= 0.4
        ? colors.semantic.warning
        : colors.semantic.danger;

  return (
    <View style={barStyles.container}>
      <View style={barStyles.track}>
        <View
          style={[barStyles.fill, { width: `${pct}%`, backgroundColor: barColor }]}
        />
      </View>
      <Text style={[barStyles.label, { color: barColor }]}>{pct}%</Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  track: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.dark.border,
  },
  fill: {
    height: 4,
    borderRadius: 2,
  },
  label: {
    ...typography.label.sm,
    width: 36,
    textAlign: "right",
  },
});

function MemoryCard({
  memory,
  onPress,
}: {
  memory: AgenticMemory;
  onPress: () => void;
}) {
  const typeColor = TYPE_COLORS[memory.type];
  const typeLabel = TYPE_LABELS[memory.type];

  return (
    <Pressable style={cardStyles.container} onPress={onPress}>
      <View style={cardStyles.topRow}>
        <View style={[cardStyles.badge, { backgroundColor: typeColor + "20" }]}>
          <Text style={[cardStyles.badgeText, { color: typeColor }]}>
            {typeLabel}
          </Text>
        </View>
        <Text style={cardStyles.observations}>
          {memory.observations}x observed
        </Text>
      </View>
      <Text style={cardStyles.description} numberOfLines={2}>
        {memory.description}
      </Text>
      <ConfidenceBar value={memory.confidence} />
    </Pressable>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.dark.surface,
    borderRadius: 10,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    gap: 8,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    ...typography.label.sm,
  },
  description: {
    ...typography.body.md,
    color: colors.dark.textPrimary,
  },
  observations: {
    ...typography.label.sm,
    color: colors.dark.textMuted,
  },
});

export function MemoryDashboardScreen() {
  const navigation = useNavigation<LocalNav>();
  const userId = useUserStore((s) => s.id);
  const [memories, setMemories] = useState<AgenticMemory[]>([]);

  const loadMemories = useCallback(() => {
    if (!userId) return;
    setMemories(memoryRepository.findAllForUser(userId));
  }, [userId]);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  useFocusEffect(
    useCallback(() => {
      loadMemories();
    }, [loadMemories]),
  );

  if (memories.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons
          name="bulb-outline"
          size={48}
          color={colors.dark.textMuted}
        />
        <Text style={styles.emptyTitle}>No patterns yet</Text>
        <Text style={styles.emptySubtitle}>
          Complete more workouts and I&apos;ll start learning your preferences
          and patterns.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={memories}
        renderItem={({ item }) => (
          <MemoryCard
            memory={item}
            onPress={() =>
              navigation.navigate("PatternDetail", { memoryId: item.id })
            }
          />
        )}
        keyExtractor={(item) => item.id}
        estimatedItemSize={100}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  list: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: colors.dark.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyTitle: {
    ...typography.heading.h2,
    color: colors.dark.textPrimary,
  },
  emptySubtitle: {
    ...typography.body.md,
    color: colors.dark.textMuted,
    textAlign: "center",
    lineHeight: 22,
  },
});
