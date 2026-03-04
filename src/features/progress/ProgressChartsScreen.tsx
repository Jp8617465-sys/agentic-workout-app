import { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet, Dimensions } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useUserStore } from "../../stores/userStore";
import { getWeeklyVolume, get1RMTrends, getRPETrends } from "./progress-data-service";
import type { ChartDataPoint } from "./progress-data-service";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_WIDTH = SCREEN_WIDTH - 64;
const CHART_HEIGHT = 160;

export function ProgressChartsScreen() {
  const navigation = useNavigation();
  const userId = useUserStore((s) => s.id);

  const [volumeData, setVolumeData] = useState<ChartDataPoint[]>([]);
  const [rpeData, setRpeData] = useState<ChartDataPoint[]>([]);
  const [e1rmData, setE1rmData] = useState<Map<string, ChartDataPoint[]>>(new Map());

  useEffect(() => {
    if (!userId) return;
    setVolumeData(getWeeklyVolume(userId, 12));
    setRpeData(getRPETrends(userId, 12));
    setE1rmData(
      get1RMTrends(userId, ["Barbell Back Squat", "Barbell Bench Press", "Barbell Deadlift"]),
    );
  }, [userId]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.dark.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Progress</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        {/* Volume Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Weekly Volume</Text>
          <Text style={styles.chartSubtitle}>Total training volume over time (kg)</Text>
          <MiniBarChart data={volumeData} color={colors.semantic.success} />
          {volumeData.length === 0 && (
            <Text style={styles.noData}>Complete workouts to see volume data</Text>
          )}
        </View>

        {/* E1RM Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Estimated 1RM Trends</Text>
          <Text style={styles.chartSubtitle}>Strength progress for key lifts</Text>
          {Array.from(e1rmData.entries()).map(([exercise, data]) => (
            <View key={exercise} style={styles.e1rmRow}>
              <Text style={styles.e1rmExercise}>{exercise}</Text>
              {data.length > 0 ? (
                <MiniLineIndicator data={data} color={colors.brand.primary} />
              ) : (
                <Text style={styles.noDataInline}>No PRs yet</Text>
              )}
            </View>
          ))}
          {e1rmData.size === 0 && (
            <Text style={styles.noData}>Set personal records to track strength</Text>
          )}
        </View>

        {/* RPE Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Average Session RPE</Text>
          <Text style={styles.chartSubtitle}>Training intensity over time</Text>
          <MiniBarChart data={rpeData} color={colors.brand.accent} maxValue={10} />
          {rpeData.length === 0 && (
            <Text style={styles.noData}>Log RPE to see intensity trends</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function MiniBarChart({
  data,
  color,
  maxValue,
}: {
  data: ChartDataPoint[];
  color: string;
  maxValue?: number;
}) {
  if (data.length === 0) return null;

  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1);
  const barWidth = Math.max(4, Math.floor(CHART_WIDTH / data.length) - 2);

  return (
    <View style={[styles.miniChart, { height: CHART_HEIGHT }]}>
      <View style={styles.miniChartBars}>
        {data.map((point, i) => {
          const height = (point.value / max) * (CHART_HEIGHT - 20);
          return (
            <View
              key={i}
              style={[
                styles.bar,
                {
                  width: barWidth,
                  height: Math.max(height, 2),
                  backgroundColor: color,
                },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.miniChartLabels}>
        <Text style={styles.miniChartLabel}>{data[0]?.date ?? ""}</Text>
        <Text style={styles.miniChartLabel}>{data[data.length - 1]?.date ?? ""}</Text>
      </View>
    </View>
  );
}

function MiniLineIndicator({
  data,
  color,
}: {
  data: ChartDataPoint[];
  color: string;
}) {
  if (data.length === 0) return null;

  const latest = data[data.length - 1];
  const previous = data.length > 1 ? data[data.length - 2] : null;
  const change = previous ? latest.value - previous.value : 0;
  const changePercent = previous ? ((change / previous.value) * 100).toFixed(1) : null;

  return (
    <View style={styles.lineIndicator}>
      <Text style={[styles.lineIndicatorValue, { color }]}>
        {Math.round(latest.value)} kg
      </Text>
      {changePercent && (
        <Text
          style={[
            styles.lineIndicatorChange,
            { color: change >= 0 ? colors.semantic.success : colors.semantic.danger },
          ]}
        >
          {change >= 0 ? "+" : ""}{changePercent}%
        </Text>
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
  content: { flex: 1 },
  contentInner: { padding: 16, paddingBottom: 40 },
  chartCard: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: { ...typography.heading.h3, color: colors.dark.textPrimary },
  chartSubtitle: { ...typography.body.sm, color: colors.dark.textMuted, marginTop: 2, marginBottom: 16 },
  noData: { ...typography.body.md, color: colors.dark.textMuted, textAlign: "center", paddingVertical: 24 },
  noDataInline: { ...typography.body.sm, color: colors.dark.textMuted },
  miniChart: { width: CHART_WIDTH },
  miniChartBars: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
  },
  bar: { borderRadius: 2 },
  miniChartLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  miniChartLabel: { ...typography.body.sm, color: colors.dark.textMuted },
  e1rmRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.dark.border,
  },
  e1rmExercise: { ...typography.body.md, color: colors.dark.textSecondary, flex: 1 },
  lineIndicator: { flexDirection: "row", alignItems: "center", gap: 8 },
  lineIndicatorValue: { ...typography.label.lg },
  lineIndicatorChange: { ...typography.body.sm },
});
