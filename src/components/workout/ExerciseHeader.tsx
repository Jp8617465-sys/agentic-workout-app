import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";

interface ExerciseHeaderProps {
  exerciseName: string;
  muscleGroups: string[];
  lastPerformed: string | null;
  hasInjuryWarning: boolean;
}

export const ExerciseHeader = memo(function ExerciseHeader({
  exerciseName,
  muscleGroups,
  lastPerformed,
  hasInjuryWarning,
}: ExerciseHeaderProps) {
  const muscleText = muscleGroups
    .slice(0, 3)
    .map((m) => m.replace(/_/g, " "))
    .join(", ");

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={styles.name} numberOfLines={1}>
          {exerciseName}
        </Text>
        {hasInjuryWarning && (
          <Ionicons
            name="warning"
            size={18}
            color={colors.semantic.warning}
            style={styles.warningIcon}
          />
        )}
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.muscles}>{muscleText}</Text>
        {lastPerformed && (
          <Text style={styles.lastDate}>Last: {lastPerformed}</Text>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    ...typography.heading.h3,
    color: colors.dark.textPrimary,
    flex: 1,
  },
  warningIcon: {
    marginLeft: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 12,
  },
  muscles: {
    ...typography.body.sm,
    color: colors.dark.textMuted,
    textTransform: "capitalize",
  },
  lastDate: {
    ...typography.body.sm,
    color: colors.dark.textMuted,
  },
});
