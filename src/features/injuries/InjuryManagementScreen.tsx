import { useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  Alert,
  StyleSheet,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { InjuryService, type ActiveInjury } from "./InjuryService";
import { useUserStore } from "../../stores/userStore";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";

const SEVERITY_COLORS: Record<number, string> = {
  1: colors.semantic.success,
  2: colors.semantic.success,
  3: colors.semantic.success,
  4: colors.semantic.warning,
  5: colors.semantic.warning,
  6: colors.semantic.warning,
  7: colors.semantic.danger,
  8: colors.semantic.danger,
  9: colors.semantic.danger,
  10: colors.semantic.danger,
};

function severityColor(severity: number): string {
  return SEVERITY_COLORS[Math.min(10, Math.max(1, Math.round(severity)))] ?? colors.semantic.danger;
}

export function InjuryManagementScreen() {
  const navigation = useNavigation();
  const userId = useUserStore((s) => s.id);

  const [injuries, setInjuries] = useState<ActiveInjury[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState("");
  const [formSeverity, setFormSeverity] = useState(5);
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formNotes, setFormNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const reload = useCallback(() => {
    if (!userId) return;
    setInjuries(InjuryService.getActiveRestrictions(userId));
  }, [userId]);

  useFocusEffect(reload);

  const handleAdd = async () => {
    if (!userId || !formType.trim()) {
      Alert.alert("Validation", "Please enter an injury type.");
      return;
    }
    setSaving(true);
    try {
      await InjuryService.addInjury(userId, {
        type: formType.trim(),
        severity: formSeverity,
        dateOccurred: formDate,
        notes: formNotes.trim() || undefined,
      });
      setFormType("");
      setFormSeverity(5);
      setFormNotes("");
      setShowForm(false);
      reload();
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = (injury: ActiveInjury) => {
    Alert.alert("Resolve Injury", `Mark "${injury.type}" as resolved?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Resolve",
        onPress: () => {
          InjuryService.resolveInjury(injury.id);
          reload();
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.dark.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Injury Management</Text>
        <Pressable onPress={() => setShowForm((v) => !v)} hitSlop={8}>
          <Ionicons
            name={showForm ? "close" : "add"}
            size={24}
            color={colors.brand.primary}
          />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Add form */}
        {showForm && (
          <View style={styles.form}>
            <Text style={styles.formTitle}>Add Injury</Text>
            <TextInput
              style={styles.input}
              placeholder="Injury type (e.g. Lower Back Pain)"
              placeholderTextColor={colors.dark.textMuted}
              value={formType}
              onChangeText={setFormType}
            />
            <TextInput
              style={styles.input}
              placeholder="Date occurred (YYYY-MM-DD)"
              placeholderTextColor={colors.dark.textMuted}
              value={formDate}
              onChangeText={setFormDate}
            />
            <View style={styles.severityRow}>
              <Text style={styles.severityLabel}>
                Severity: <Text style={{ color: severityColor(formSeverity) }}>{formSeverity}/10</Text>
              </Text>
              <View style={styles.stepperRow}>
                <Pressable
                  style={styles.stepperButton}
                  onPress={() => setFormSeverity((v) => Math.max(1, v - 1))}
                >
                  <Ionicons name="remove" size={16} color={colors.dark.textPrimary} />
                </Pressable>
                <Text style={styles.stepperValue}>{formSeverity}</Text>
                <Pressable
                  style={styles.stepperButton}
                  onPress={() => setFormSeverity((v) => Math.min(10, v + 1))}
                >
                  <Ionicons name="add" size={16} color={colors.dark.textPrimary} />
                </Pressable>
              </View>
            </View>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Notes (optional)"
              placeholderTextColor={colors.dark.textMuted}
              value={formNotes}
              onChangeText={setFormNotes}
              multiline
              numberOfLines={3}
            />
            <Pressable
              style={[styles.addButton, saving && styles.addButtonDisabled]}
              onPress={handleAdd}
              disabled={saving}
            >
              <Text style={styles.addButtonText}>{saving ? "Saving…" : "Add Injury"}</Text>
            </Pressable>
          </View>
        )}

        {/* Injury list */}
        {injuries.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="shield-checkmark-outline" size={48} color={colors.dark.textMuted} />
            <Text style={styles.emptyText}>No active injuries</Text>
          </View>
        ) : (
          injuries.map((injury) => (
            <View key={injury.id} style={styles.injuryRow}>
              <View style={[styles.severityBadge, { backgroundColor: severityColor(injury.severity) + "30" }]}>
                <Text style={[styles.severityBadgeText, { color: severityColor(injury.severity) }]}>
                  {injury.severity}
                </Text>
              </View>
              <View style={styles.injuryInfo}>
                <Text style={styles.injuryType}>{injury.type}</Text>
                <Text style={styles.injuryMeta}>
                  {injury.status} · since {injury.dateOccurred}
                </Text>
                {injury.notes ? (
                  <Text style={styles.injuryNotes}>{injury.notes}</Text>
                ) : null}
              </View>
              <Pressable
                style={styles.resolveButton}
                onPress={() => handleResolve(injury)}
                hitSlop={8}
              >
                <Ionicons name="checkmark-circle-outline" size={24} color={colors.semantic.success} />
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: colors.dark.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.dark.border,
  },
  headerTitle: {
    ...typography.heading.h3,
    color: colors.dark.textPrimary,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  form: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 8,
  },
  formTitle: {
    ...typography.heading.h3,
    color: colors.dark.textPrimary,
  },
  input: {
    backgroundColor: colors.dark.surfaceElevated,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...typography.body.md,
    color: colors.dark.textPrimary,
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: "top",
  },
  severityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  severityLabel: {
    ...typography.body.md,
    color: colors.dark.textSecondary,
  },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  stepperButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.dark.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperValue: {
    ...typography.numeric.md,
    color: colors.dark.textPrimary,
    minWidth: 24,
    textAlign: "center",
  },
  addButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  addButtonText: {
    ...typography.label.lg,
    color: "#FFFFFF",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    ...typography.body.lg,
    color: colors.dark.textMuted,
  },
  injuryRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.dark.surface,
    borderRadius: 10,
    padding: 12,
    gap: 12,
  },
  severityBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  severityBadgeText: {
    ...typography.label.lg,
  },
  injuryInfo: {
    flex: 1,
    gap: 2,
  },
  injuryType: {
    ...typography.label.md,
    color: colors.dark.textPrimary,
  },
  injuryMeta: {
    ...typography.body.sm,
    color: colors.dark.textSecondary,
    textTransform: "capitalize",
  },
  injuryNotes: {
    ...typography.body.sm,
    color: colors.dark.textMuted,
  },
  resolveButton: {
    padding: 4,
  },
});
