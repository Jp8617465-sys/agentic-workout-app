import { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";

interface RPEBadgeProps {
  rpe: number;
}

function getRpeColor(rpe: number): string {
  if (rpe <= 6) return colors.rpe.easy;
  if (rpe <= 7.5) return colors.rpe.moderate;
  if (rpe <= 9) return colors.rpe.hard;
  return colors.rpe.maximal;
}

export const RPEBadge = memo(function RPEBadge({ rpe }: RPEBadgeProps) {
  const color = getRpeColor(rpe);

  return (
    <View style={[styles.badge, { backgroundColor: color + "20" }]}>
      <Text style={[styles.text, { color }]}>{rpe}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 28,
    alignItems: "center",
  },
  text: {
    ...typography.label.sm,
  },
});
