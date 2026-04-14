import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
  InteractionManager,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useUserStore } from "../../stores/userStore";
import { getWeeklyVolume, get1RMTrends, getRPETrends } from "./progress-data-service";
import type { ChartDataPoint } from "./progress-data-service";
import { BarChart } from "../../components/charts/BarChart";
import { LineChart } from "../../components/charts/LineChart";
import { ChartCard } from "../../components/charts/ChartCard";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";

const SCREEN_WIDTH = Dimensions.get("window").width;
const CHART_WIDTH = SCREEN_WIDTH - 64;
const CHART_HEIGHT = 160;

type Period = "1M" | "3M" | "6M" | "1Y";

const PERIOD_WEEKS: Record<Period, number> = {
  "1M": 4,
  "3M": 12,
  "6M": 24,
  "1Y": 52,
};

export function ProgressChartsScreen() {
  const navigation = useNavigation();
  const userId = useUserStore((s) => s.id);

  const [volumeData, setVolumeData] = useState<ChartDataPoint[]>([]);
  const [rpeData, setRpeData] = useState<ChartDataPoint[]>([]);
  const [e1rmData, setE1rmData] = useState<Map<string, ChartDataPoint[]>>(new Map());
  const [volumePeriod, setVolumePeriod] = useState<Period>("3M");
  const [rpePeriod, setRpePeriod] = useState<Period>("3M");

  const loadData = useCallback(
    (vPeriod: Period, rPeriod: Period) => {
      if (!userId) return;
      setVolumeData(getWeeklyVolume(userId, PERIOD_WEEKS[vPeriod]));
      setRpeData(getRPETrends(userId, PERIOD_WEEKS[rPeriod]));
      setE1rmData(
        get1RMTrends(userId, ["Barbell Back Squat", "Barbell Bench Press", "Barbell Deadlift"]),
      );
    },
    [userId],
  );

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      loadData(volumePeriod, rpePeriod);
    });
    return () => task.cancel();
  }, [loadData, volumePeriod, rpePeriod]);

  // Map ChartDataPoint to chart input formats
  function toBarPoints(data: ChartDataPoint[]) {
    return data.map((d) => ({
      label: d.date.slice(5), // "MM-DD"
      value: d.value,
    }));
  }

  function toLinePoints(data: ChartDataPoint[]) {
    return data.map((d, i) => ({
      x: i,
      y: d.value,
      label: d.date.slice(5),
    }));
  }

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
        <ChartCard
          title="Weekly Volume"
          subtitle="Total training volume (kg)"
          showPeriodSelector
          onPeriodChange={(p) => setVolumePeriod(p as Period)}
          isEmpty={volumeData.length === 0}
          emptyMessage="Complete workouts to see volume data"
        >
          <BarChart
            data={toBarPoints(volumeData)}
            width={CHART_WIDTH}
            height={CHART_HEIGHT}
            color={colors.semantic.success}
          />
        </ChartCard>

        {/* E1RM per key lift */}
        <ChartCard
          title="Estimated 1RM Trends"
          subtitle="Strength progress for key lifts"
          isEmpty={e1rmData.size === 0}
          emptyMessage="Set personal records to track strength"
        >
          {Array.from(e1rmData.entries()).map(([exercise, data]) => (
            <View key={exercise} style={styles.e1rmBlock}>
              <Text style={styles.e1rmExercise}>{exercise}</Text>
              {data.length > 1 ? (
                <LineChart
                  data={toLinePoints(data)}
                  width={CHART_WIDTH}
                  height={100}
                  color={colors.brand.primary}
                  showDots
                />
              ) : data.length === 1 ? (
                <Text style={styles.singlePR}>{Math.round(data[0].value)} kg 1RM</Text>
              ) : (
                <Text style={styles.noDataInline}>No PRs yet</Text>
              )}
            </View>
          ))}
        </ChartCard>

        {/* RPE Trend */}
        <ChartCard
          title="Average Session RPE"
          subtitle="Training intensity over time"
          showPeriodSelector
          onPeriodChange={(p) => setRpePeriod(p as Period)}
          isEmpty={rpeData.length === 0}
          emptyMessage="Log RPE to see intensity trends"
        >
          <LineChart
            data={toLinePoints(rpeData)}
            width={CHART_WIDTH}
            height={CHART_HEIGHT}
            color={colors.brand.accent}
          />
        </ChartCard>
      </ScrollView>
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
  e1rmBlock: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.dark.border,
  },
  e1rmExercise: {
    ...typography.label.md,
    color: colors.dark.textSecondary,
    marginBottom: 8,
  },
  singlePR: {
    ...typography.numeric.md,
    color: colors.brand.primary,
  },
  noDataInline: {
    ...typography.body.sm,
    color: colors.dark.textMuted,
  },
});
