import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../constants/colors";
import { typography } from "../../../constants/typography";

interface PRBannerProps {
  exerciseName: string | null;
}

/**
 * Displays a personal record banner when an exercise achieves a new PR.
 * Auto-hides when exerciseName is null.
 */
export const PRBanner = memo(function PRBanner({ exerciseName }: PRBannerProps) {
  if (!exerciseName) return null;

  return (
    <View style={styles.prBanner}>
      <Ionicons name="trophy" size={16} color={colors.semantic.warning} />
      <Text style={styles.prBannerText}>New PR — {exerciseName}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  prBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    backgroundColor: colors.semantic.warning + "20",
  },
  prBannerText: {
    ...typography.label.md,
    color: colors.semantic.warning,
  },
});
