import { memo } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";
import { touchTarget } from "../../constants/spacing";

interface CustomNumpadProps {
  activeField: { field: "weight" | "reps" | "rpe"; value: string } | null;
  onInput: (digit: string) => void;
  onBackspace: () => void;
  onDecimal: () => void;
}

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [".", "0", "backspace"],
] as const;

const FIELD_LABELS: Record<string, string> = {
  weight: "WEIGHT",
  reps: "REPS",
  rpe: "RPE",
};

export const CustomNumpad = memo(function CustomNumpad({
  activeField,
  onInput,
  onBackspace,
  onDecimal,
}: CustomNumpadProps) {
  if (!activeField) return null;

  const handlePress = (key: string) => {
    Haptics.selectionAsync();
    if (key === "backspace") {
      onBackspace();
    } else if (key === ".") {
      onDecimal();
    } else {
      onInput(key);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.fieldLabel}>
        <Text style={styles.fieldName}>{FIELD_LABELS[activeField.field]}</Text>
        <Text style={styles.fieldValue}>{activeField.value || "—"}</Text>
      </View>
      <View style={styles.grid}>
        {KEYS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((key) => (
              <Pressable
                key={key}
                onPress={() => handlePress(key)}
                style={({ pressed }) => [
                  styles.key,
                  pressed && styles.keyPressed,
                  key === "." && activeField.field === "reps" && styles.keyDisabled,
                ]}
                disabled={key === "." && activeField.field === "reps"}
              >
                {key === "backspace" ? (
                  <Ionicons
                    name="backspace-outline"
                    size={24}
                    color={colors.dark.textPrimary}
                  />
                ) : (
                  <Text
                    style={[
                      styles.keyText,
                      key === "." && activeField.field === "reps" && styles.keyTextDisabled,
                    ]}
                  >
                    {key}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.dark.surface,
    borderTopWidth: 1,
    borderTopColor: colors.dark.border,
    paddingBottom: 16,
  },
  fieldLabel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 8,
  },
  fieldName: {
    ...typography.label.md,
    color: colors.brand.primary,
  },
  fieldValue: {
    ...typography.numeric.md,
    color: colors.dark.textPrimary,
  },
  grid: {
    paddingHorizontal: 32,
    gap: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  key: {
    width: touchTarget.numpadKey,
    height: touchTarget.numpadKey,
    borderRadius: 12,
    backgroundColor: colors.dark.surfaceElevated,
    alignItems: "center",
    justifyContent: "center",
  },
  keyPressed: {
    backgroundColor: colors.dark.border,
  },
  keyDisabled: {
    opacity: 0.3,
  },
  keyText: {
    ...typography.numeric.md,
    color: colors.dark.textPrimary,
  },
  keyTextDisabled: {
    color: colors.dark.textMuted,
  },
});
