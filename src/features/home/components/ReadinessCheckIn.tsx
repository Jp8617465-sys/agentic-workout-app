import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Modal } from "react-native";
import { colors } from "../../../constants/colors";
import { typography } from "../../../constants/typography";
import type { ReadinessLevel } from "../types";

interface Props {
  visible: boolean;
  onSubmit: (energy: ReadinessLevel, soreness: ReadinessLevel, motivation: ReadinessLevel) => void;
  onSkip: () => void;
}

interface LevelOption {
  value: ReadinessLevel;
  label: string;
  color: string;
}

const ENERGY_OPTIONS: LevelOption[] = [
  { value: 1, label: "Low", color: colors.semantic.danger },
  { value: 2, label: "Medium", color: colors.semantic.warning },
  { value: 3, label: "High", color: colors.semantic.success },
];

const SORENESS_OPTIONS: LevelOption[] = [
  { value: 1, label: "None", color: colors.semantic.success },
  { value: 2, label: "Mild", color: colors.semantic.warning },
  { value: 3, label: "Heavy", color: colors.semantic.danger },
];

const MOTIVATION_OPTIONS: LevelOption[] = [
  { value: 1, label: "Low", color: colors.semantic.danger },
  { value: 2, label: "Medium", color: colors.semantic.warning },
  { value: 3, label: "High", color: colors.semantic.success },
];

function LevelPicker({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: LevelOption[];
  value: ReadinessLevel;
  onChange: (v: ReadinessLevel) => void;
}) {
  return (
    <View style={styles.pickerRow}>
      <Text style={styles.pickerLabel}>{label}</Text>
      <View style={styles.pickerOptions}>
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => onChange(opt.value)}
              style={[
                styles.optionButton,
                selected && { backgroundColor: opt.color + "33", borderColor: opt.color },
              ]}
              accessibilityLabel={`${label} ${opt.label}`}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <Text
                style={[styles.optionText, selected && { color: opt.color, fontWeight: "700" }]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function ReadinessCheckIn({ visible, onSubmit, onSkip }: Props) {
  const [energy, setEnergy] = useState<ReadinessLevel>(2);
  const [soreness, setSoreness] = useState<ReadinessLevel>(1);
  const [motivation, setMotivation] = useState<ReadinessLevel>(2);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={onSkip}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>How are you feeling?</Text>
          <Text style={styles.subtitle}>Takes 5 seconds — helps your AI coach plan smarter.</Text>

          <LevelPicker label="Energy" options={ENERGY_OPTIONS} value={energy} onChange={setEnergy} />
          <LevelPicker label="Soreness" options={SORENESS_OPTIONS} value={soreness} onChange={setSoreness} />
          <LevelPicker label="Motivation" options={MOTIVATION_OPTIONS} value={motivation} onChange={setMotivation} />

          <Pressable
            onPress={() => onSubmit(energy, soreness, motivation)}
            style={styles.submitButton}
            accessibilityRole="button"
            accessibilityLabel="Let's go"
          >
            <Text style={styles.submitText}>Let's Go</Text>
          </Pressable>

          <Pressable onPress={onSkip} style={styles.skipButton} accessibilityRole="button" accessibilityLabel="Skip readiness check-in for now">
            <Text style={styles.skipText}>Skip for now</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  sheet: {
    backgroundColor: colors.dark.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    ...typography.heading.h2,
    color: colors.dark.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.body.sm,
    color: colors.dark.textMuted,
    marginBottom: 28,
  },
  pickerRow: {
    marginBottom: 20,
  },
  pickerLabel: {
    ...typography.label.md,
    color: colors.dark.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  pickerOptions: {
    flexDirection: "row",
    gap: 8,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.dark.border,
    alignItems: "center",
    minHeight: 44,
    justifyContent: "center",
  },
  optionText: {
    ...typography.label.md,
    color: colors.dark.textSecondary,
  },
  submitButton: {
    backgroundColor: colors.brand.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    minHeight: 56,
    justifyContent: "center",
  },
  submitText: {
    ...typography.heading.h3,
    color: "#FFFFFF",
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: "center",
  },
  skipText: {
    ...typography.body.md,
    color: colors.dark.textMuted,
  },
});
