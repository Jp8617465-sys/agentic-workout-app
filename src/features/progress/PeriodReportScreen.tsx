import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  InteractionManager,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import { useUserStore } from "../../stores/userStore";
import { getPeriodReport, buildPeriodStats } from "./report-service";
import { BarChart } from "../../components/charts/BarChart";
import { ChartCard } from "../../components/charts/ChartCard";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";
import type { PeriodReport, ReportPeriod, ExerciseVolumeRow } from "./report-service";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_WIDTH = SCREEN_WIDTH - 64;

type PeriodOption = { key: ReportPeriod; label: string };

const PERIOD_OPTIONS: PeriodOption[] = [
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "mesocycle", label: "This Cycle" },
];

function StatTile({
  label,
  value,
  delta,
}: {
  label: string;
  value: string;
  delta?: number | null;
}) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      {delta != null && delta !== 0 && (
        <Text
          style={[
            styles.statDelta,
            { color: delta >= 0 ? colors.semantic.success : colors.semantic.danger },
          ]}
        >
          {delta >= 0 ? "+" : ""}
          {delta}%
        </Text>
      )}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ExerciseRow({ item }: { item: ExerciseVolumeRow }) {
  return (
    <View style={styles.exerciseRow}>
      <Text style={styles.exerciseName} numberOfLines={1}>
        {item.exerciseName}
      </Text>
      <View style={styles.exerciseRight}>
        <Text style={styles.exerciseVolume}>{item.currentVolume.toLocaleString()} kg</Text>
        {item.deltaPct !== 0 && (
          <Text
            style={[
              styles.exerciseDelta,
              { color: item.deltaPct >= 0 ? colors.semantic.success : colors.semantic.danger },
            ]}
          >
            {item.deltaPct >= 0 ? "+" : ""}
            {item.deltaPct}%
          </Text>
        )}
      </View>
    </View>
  );
}

export function PeriodReportScreen() {
  const navigation = useNavigation();
  const userId = useUserStore((s) => s.id);

  const [activePeriod, setActivePeriod] = useState<ReportPeriod>("month");
  const [report, setReport] = useState<PeriodReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadReport = useCallback(
    async (period: ReportPeriod) => {
      if (!userId) return;
      setIsLoading(true);
      setReport(null);
      try {
        const result = await getPeriodReport(userId, period);
        setReport(result);
      } finally {
        setIsLoading(false);
      }
    },
    [userId],
  );

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      loadReport(activePeriod);
    });
    return () => task.cancel();
  }, [activePeriod, loadReport]);

  const stats = report?.stats;
  const weeklyVolumeData =
    stats && stats.previousVolume > 0
      ? [
          {
            label: "Previous",
            value: stats.previousVolume,
          },
          {
            label: "Current",
            value: stats.totalVolume,
          },
        ]
      : stats
      ? [{ label: "Current", value: stats.totalVolume }]
      : [];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.dark.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Period Report</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Period selector */}
      <View style={styles.periodSelector}>
        {PERIOD_OPTIONS.map((opt) => (
          <Pressable
            key={opt.key}
            onPress={() => setActivePeriod(opt.key)}
            style={[
              styles.periodButton,
              activePeriod === opt.key && styles.periodButtonActive,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: activePeriod === opt.key }}
          >
            <Text
              style={[
                styles.periodButtonText,
                activePeriod === opt.key && styles.periodButtonTextActive,
              ]}
            >
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {isLoading || !stats ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={styles.loadingText}>Crunching your numbers...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Date range */}
          <Text style={styles.dateRange}>
            {new Date(stats.startDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            –{" "}
            {new Date(stats.endDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <StatTile
              label="Workouts"
              value={String(stats.workoutsCompleted)}
            />
            <StatTile
              label="Volume (kg)"
              value={stats.totalVolume.toLocaleString()}
              delta={stats.volumeDeltaPct}
            />
            <StatTile
              label="Avg RPE"
              value={stats.averageRpe != null ? String(stats.averageRpe) : "—"}
            />
            <StatTile
              label="PRs"
              value={String(stats.personalRecords)}
            />
          </View>

          {/* Volume comparison chart */}
          {weeklyVolumeData.length > 0 && (
            <ChartCard
              title="Volume vs Previous Period"
              isEmpty={weeklyVolumeData.length === 0}
            >
              <BarChart
                data={weeklyVolumeData}
                width={CHART_WIDTH}
                height={120}
                color={colors.brand.primary}
              />
            </ChartCard>
          )}

          {/* AI narrative */}
          {report?.narrative && (
            <View style={styles.narrativeCard}>
              <View style={styles.narrativeHeader}>
                <Ionicons name="chatbubbles" size={16} color={colors.brand.secondary} />
                <Text style={styles.narrativeLabel}>Coach Insights</Text>
              </View>
              <Text style={styles.narrativeText}>{report.narrative}</Text>
            </View>
          )}

          {/* Exercise breakdown */}
          {stats.exerciseBreakdown.length > 0 && (
            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownTitle}>Exercise Volume</Text>
              <Text style={styles.breakdownSubtitle}>vs previous period</Text>
              <FlashList
                data={stats.exerciseBreakdown}
                keyExtractor={(item) => item.exerciseName}
                renderItem={({ item }) => <ExerciseRow item={item} />}
                estimatedItemSize={48}
                scrollEnabled={false}
              />
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.dark.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  headerTitle: { ...typography.heading.h3, color: colors.dark.textPrimary },
  periodSelector: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  periodButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.dark.surface,
    borderWidth: 1,
    borderColor: colors.dark.border,
    minHeight: 36,
    justifyContent: "center",
  },
  periodButtonActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  periodButtonText: { ...typography.label.sm, color: colors.dark.textSecondary },
  periodButtonTextActive: { color: "#FFFFFF" },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: { ...typography.body.md, color: colors.dark.textMuted },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  dateRange: {
    ...typography.body.sm,
    color: colors.dark.textMuted,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  statTile: {
    flex: 1,
    backgroundColor: colors.dark.surface,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    gap: 2,
  },
  statValue: { ...typography.numeric.md, color: colors.dark.textPrimary },
  statDelta: { ...typography.body.sm, fontSize: 11 },
  statLabel: { ...typography.body.sm, color: colors.dark.textMuted, textAlign: "center" },
  narrativeCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: colors.brand.secondary,
  },
  narrativeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  narrativeLabel: { ...typography.label.sm, color: colors.brand.secondary, textTransform: "uppercase", letterSpacing: 0.6 },
  narrativeText: { ...typography.body.md, color: colors.dark.textSecondary, lineHeight: 22 },
  breakdownCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  breakdownTitle: { ...typography.heading.h3, color: colors.dark.textPrimary },
  breakdownSubtitle: { ...typography.body.sm, color: colors.dark.textMuted, marginBottom: 12 },
  exerciseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.dark.border,
    minHeight: 44,
  },
  exerciseName: { ...typography.body.md, color: colors.dark.textSecondary, flex: 1, marginRight: 8 },
  exerciseRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  exerciseVolume: { ...typography.label.md, color: colors.dark.textPrimary },
  exerciseDelta: { ...typography.body.sm, minWidth: 40, textAlign: "right" },
});
