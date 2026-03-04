import { useState, useEffect } from "react";
import { View, Text, Pressable, Modal, StyleSheet, FlatList, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { InjuryService, type ActiveInjury } from "../../features/injuries/InjuryService";
import { useUserStore } from "../../stores/userStore";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";

interface ExerciseSwapModalProps {
  visible: boolean;
  exerciseName: string;
  onSelect: (newExerciseName: string) => void;
  onDismiss: () => void;
}

export function ExerciseSwapModal({
  visible,
  exerciseName,
  onSelect,
  onDismiss,
}: ExerciseSwapModalProps) {
  const userId = useUserStore((s) => s.id);
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [activeInjuries, setActiveInjuries] = useState<ActiveInjury[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible || !exerciseName) return;
    setLoading(true);

    const injuries = userId ? InjuryService.getActiveRestrictions(userId) : [];
    setActiveInjuries(injuries);

    const substitution = InjuryService.getSubstitutions(exerciseName, injuries);
    setAlternatives(substitution.alternatives);
    setLoading(false);
  }, [visible, exerciseName, userId]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.handle} />
          <View style={styles.headerRow}>
            <Text style={styles.title}>Swap Exercise</Text>
            <Pressable onPress={onDismiss} hitSlop={8}>
              <Ionicons name="close" size={24} color={colors.dark.textSecondary} />
            </Pressable>
          </View>
          <Text style={styles.subtitle}>Replacing: {exerciseName}</Text>

          {activeInjuries.length > 0 && (
            <View style={styles.injuryBadge}>
              <Ionicons name="warning-outline" size={14} color={colors.semantic.warning} />
              <Text style={styles.injuryBadgeText}>
                {activeInjuries.length} active {activeInjuries.length === 1 ? "injury" : "injuries"} — unsafe exercises filtered
              </Text>
            </View>
          )}
        </View>

        {/* Alternatives list */}
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.brand.primary} />
          </View>
        ) : alternatives.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="swap-horizontal-outline" size={48} color={colors.dark.textMuted} />
            <Text style={styles.emptyText}>No safe alternatives found</Text>
          </View>
        ) : (
          <FlatList
            data={alternatives}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <Pressable
                style={styles.alternativeRow}
                onPress={() => {
                  onSelect(item);
                  onDismiss();
                }}
              >
                <Text style={styles.alternativeName}>{item}</Text>
                <Ionicons name="chevron-forward" size={18} color={colors.dark.textMuted} />
              </Pressable>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  header: {
    backgroundColor: colors.dark.surface,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.dark.border,
    gap: 8,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.dark.border,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    ...typography.heading.h2,
    color: colors.dark.textPrimary,
  },
  subtitle: {
    ...typography.body.md,
    color: colors.dark.textSecondary,
  },
  injuryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.semantic.warning + "20",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  injuryBadgeText: {
    ...typography.label.sm,
    color: colors.semantic.warning,
  },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: {
    ...typography.body.lg,
    color: colors.dark.textMuted,
  },
  list: {
    padding: 16,
    gap: 8,
  },
  alternativeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.dark.surface,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  alternativeName: {
    ...typography.body.md,
    color: colors.dark.textPrimary,
    flex: 1,
  },
});
