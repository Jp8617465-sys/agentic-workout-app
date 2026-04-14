import { memo, useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";

type Period = "1M" | "3M" | "6M" | "1Y";

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onPeriodChange?: (period: Period) => void;
  showPeriodSelector?: boolean;
  emptyMessage?: string;
  isEmpty?: boolean;
}

const PERIODS: Period[] = ["1M", "3M", "6M", "1Y"];

export const ChartCard = memo(function ChartCard({
  title,
  subtitle,
  children,
  onPeriodChange,
  showPeriodSelector = false,
  emptyMessage = "No data yet",
  isEmpty = false,
}: Props) {
  const [activePeriod, setActivePeriod] = useState<Period>("3M");

  const handlePeriodPress = (period: Period) => {
    setActivePeriod(period);
    onPeriodChange?.(period);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {showPeriodSelector && (
          <View style={styles.periodSelector}>
            {PERIODS.map((p) => (
              <Pressable
                key={p}
                onPress={() => handlePeriodPress(p)}
                style={[styles.periodButton, activePeriod === p && styles.periodButtonActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: activePeriod === p }}
                accessibilityLabel={`${p} period`}
              >
                <Text
                  style={[styles.periodText, activePeriod === p && styles.periodTextActive]}
                >
                  {p}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {isEmpty ? (
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      ) : (
        children
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  titleBlock: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    ...typography.heading.h3,
    color: colors.dark.textPrimary,
  },
  subtitle: {
    ...typography.body.sm,
    color: colors.dark.textMuted,
    marginTop: 2,
  },
  periodSelector: {
    flexDirection: "row",
    backgroundColor: colors.dark.surfaceElevated,
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  periodButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 30,
    alignItems: "center",
    minHeight: 28,
    justifyContent: "center",
  },
  periodButtonActive: {
    backgroundColor: colors.brand.primary,
  },
  periodText: {
    ...typography.label.sm,
    color: colors.dark.textMuted,
    fontSize: 11,
  },
  periodTextActive: {
    color: "#FFFFFF",
  },
  emptyText: {
    ...typography.body.md,
    color: colors.dark.textMuted,
    textAlign: "center",
    paddingVertical: 24,
  },
});
