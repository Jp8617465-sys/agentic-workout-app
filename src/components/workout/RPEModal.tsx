import { useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";

interface RPEModalProps {
  visible: boolean;
  exerciseName: string;
  setNumber: number;
  onSubmit: (rpe: number) => void;
  onDismiss: () => void;
}

const RPE_VALUES = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10] as const;

const RPE_DESCRIPTIONS: Record<number, string> = {
  6: "Easy",
  6.5: "Easy+",
  7: "Moderate",
  7.5: "Moderate+",
  8: "Hard",
  8.5: "Hard+",
  9: "Near max",
  9.5: "Max−1",
  10: "Max",
};

function getRpeColor(rpe: number): string {
  if (rpe >= 9.5) return colors.rpe.maximal;
  if (rpe >= 8) return colors.rpe.hard;
  if (rpe >= 7) return colors.rpe.moderate;
  return colors.rpe.easy;
}

export function RPEModal({
  visible,
  exerciseName,
  setNumber,
  onSubmit,
  onDismiss,
}: RPEModalProps) {
  const translateY = useSharedValue(400);

  useEffect(() => {
    translateY.value = withSpring(visible ? 0 : 400, {
      damping: 20,
      stiffness: 200,
    });
  }, [visible, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <>
      <Pressable style={styles.backdrop} onPress={onDismiss} />
      <Animated.View style={[styles.sheet, animatedStyle]}>
        <View style={styles.handle} />
        <Text style={styles.title}>How hard was that set?</Text>
        <Text style={styles.subtitle}>
          {exerciseName} — Set {setNumber}
        </Text>
        <View style={styles.rpeGrid}>
          {RPE_VALUES.map((rpe) => {
            const color = getRpeColor(rpe);
            return (
              <Pressable
                key={rpe}
                style={[styles.rpeButton, { borderColor: color }]}
                onPress={() => onSubmit(rpe)}
              >
                <Text style={[styles.rpeValue, { color }]}>{rpe}</Text>
                <Text style={styles.rpeDesc}>{RPE_DESCRIPTIONS[rpe]}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable onPress={onDismiss} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 10,
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.dark.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    zIndex: 11,
    gap: 12,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: colors.dark.border,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  title: {
    ...typography.heading.h2,
    color: colors.dark.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    ...typography.body.md,
    color: colors.dark.textSecondary,
    textAlign: "center",
  },
  rpeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
    marginTop: 8,
  },
  rpeButton: {
    width: 72,
    height: 56,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.dark.surfaceElevated,
  },
  rpeValue: {
    ...typography.label.lg,
  },
  rpeDesc: {
    ...typography.label.sm,
    color: colors.dark.textMuted,
    marginTop: 2,
  },
  skipButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  skipText: {
    ...typography.label.md,
    color: colors.dark.textMuted,
  },
});
