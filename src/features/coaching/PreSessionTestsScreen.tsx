import { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";
import { useUserStore } from "../../stores/userStore";
import { SessionTestsService } from "./session-tests-service";
import type { SessionTest, SessionTestType } from "./types";
import type { RootStackParamList } from "../../navigation/types";

type PreSessionTestsRoute = RouteProp<RootStackParamList, "PreSessionTests">;

const TEST_ICONS: Record<SessionTestType, keyof typeof Ionicons.glyphMap> = {
  RPE_PROGRESSION: "trending-up",
  ACTIVATION_CHECK: "body",
  TEMPO_HOLD: "timer-outline",
  TECHNIQUE_FLAG: "eye-outline",
  PAIN_CHECK: "medkit-outline",
};

const TEST_LABELS: Record<SessionTestType, string> = {
  RPE_PROGRESSION: "Load Progression RPE Check",
  ACTIVATION_CHECK: "Activation Check",
  TEMPO_HOLD: "Tempo Hold",
  TECHNIQUE_FLAG: "Movement Quality",
  PAIN_CHECK: "Pain Monitoring",
};

export function PreSessionTestsScreen() {
  const navigation = useNavigation();
  const route = useRoute<PreSessionTestsRoute>();
  const { workoutId, exerciseNames } = route.params;
  const userId = useUserStore((s) => s.id);

  const [tests, setTests] = useState<SessionTest[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId || !workoutId) return;

    const generated = SessionTestsService.generateSessionTests(
      userId,
      workoutId,
      exerciseNames,
    );
    setTests(generated);
    setLoaded(true);
  }, [userId, workoutId, exerciseNames]);

  useEffect(() => {
    // Skip directly to workout if no tests were generated
    if (loaded && tests.length === 0) {
      navigation.navigate("ActiveWorkout" as never);
    }
  }, [loaded, tests.length, navigation]);

  const handleContinue = () => {
    navigation.navigate("ActiveWorkout" as never);
  };

  if (!loaded || tests.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="clipboard-outline" size={32} color={colors.brand.primary} />
          <Text style={styles.title}>Pre-Session Tests</Text>
          <Text style={styles.subtitle}>
            Watch for these during your workout. You will report results after.
          </Text>
        </View>

        {/* Test Cards */}
        {tests.map((test) => (
          <View key={test.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons
                name={TEST_ICONS[test.testType]}
                size={22}
                color={colors.brand.primary}
              />
              <Text style={styles.cardTitle}>
                {TEST_LABELS[test.testType]}
              </Text>
            </View>

            {test.testContext.exerciseName && (
              <Text style={styles.exerciseName}>
                {test.testContext.exerciseName}
              </Text>
            )}

            <View style={styles.cardSection}>
              <Text style={styles.cardLabel}>What to watch</Text>
              <Text style={styles.cardText}>
                {test.testContext.whatToWatch}
              </Text>
            </View>

            <View style={styles.cardSection}>
              <Text style={styles.cardLabel}>How to report</Text>
              <Text style={styles.cardText}>
                {test.testContext.howToReport}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.footer}>
        <Pressable style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueText}>Got it, let's go</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  content: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 16,
  },
  header: {
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  title: {
    ...typography.heading.h2,
    color: colors.dark.textPrimary,
  },
  subtitle: {
    ...typography.body.md,
    color: colors.dark.textSecondary,
    textAlign: "center",
  },
  card: {
    backgroundColor: colors.dark.surface,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardTitle: {
    ...typography.label.lg,
    color: colors.dark.textPrimary,
    flex: 1,
  },
  exerciseName: {
    ...typography.body.md,
    color: colors.brand.primary,
    marginLeft: 32,
  },
  cardSection: {
    marginLeft: 32,
    gap: 2,
  },
  cardLabel: {
    ...typography.label.sm,
    color: colors.dark.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardText: {
    ...typography.body.md,
    color: colors.dark.textSecondary,
    lineHeight: 20,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingBottom: 36,
    backgroundColor: colors.dark.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.dark.border,
  },
  continueButton: {
    backgroundColor: colors.brand.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  continueText: {
    ...typography.label.lg,
    color: "#FFFFFF",
  },
});
