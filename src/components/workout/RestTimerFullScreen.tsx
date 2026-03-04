import { memo, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, Modal } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RestTimerFullScreenProps {
  visible: boolean;
  remainingSeconds: number;
  totalSeconds: number;
  progress: number;
  nextSetLabel: string | null;
  onAddTime: (seconds: number) => void;
  onSkip: () => void;
  onDismiss: () => void;
}

const CIRCLE_SIZE = 220;
const STROKE_WIDTH = 8;
const RADIUS = (CIRCLE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export const RestTimerFullScreen = memo(function RestTimerFullScreen({
  visible,
  remainingSeconds,
  totalSeconds,
  progress,
  nextSetLabel,
  onAddTime,
  onSkip,
  onDismiss,
}: RestTimerFullScreenProps) {
  const animatedProgress = useSharedValue(progress);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 150,
      easing: Easing.linear,
    });
  }, [progress, animatedProgress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: (1 - animatedProgress.value) * CIRCUMFERENCE,
  }));

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Dismiss button */}
          <Pressable onPress={onDismiss} style={styles.dismissButton} hitSlop={12}>
            <Ionicons name="chevron-down" size={28} color={colors.dark.textMuted} />
          </Pressable>

          {/* Arc timer */}
          <View style={styles.timerContainer}>
            <Svg width={CIRCLE_SIZE} height={CIRCLE_SIZE}>
              {/* Background circle */}
              <Circle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={RADIUS}
                stroke={colors.dark.surfaceElevated}
                strokeWidth={STROKE_WIDTH}
                fill="transparent"
              />
              {/* Progress circle */}
              <AnimatedCircle
                cx={CIRCLE_SIZE / 2}
                cy={CIRCLE_SIZE / 2}
                r={RADIUS}
                stroke={colors.brand.primary}
                strokeWidth={STROKE_WIDTH}
                fill="transparent"
                strokeDasharray={CIRCUMFERENCE}
                animatedProps={animatedProps}
                strokeLinecap="round"
                rotation="-90"
                origin={`${CIRCLE_SIZE / 2}, ${CIRCLE_SIZE / 2}`}
              />
            </Svg>
            <View style={styles.timeOverlay}>
              <Text style={styles.timeText}>{formatTime(remainingSeconds)}</Text>
              <Text style={styles.totalText}>of {formatTime(totalSeconds)}</Text>
            </View>
          </View>

          {/* Next set preview */}
          {nextSetLabel && (
            <Text style={styles.nextSetText}>Next: {nextSetLabel}</Text>
          )}

          {/* Controls */}
          <View style={styles.controls}>
            <Pressable
              onPress={() => onAddTime(15)}
              style={styles.controlButton}
            >
              <Text style={styles.controlButtonText}>+15s</Text>
            </Pressable>
            <Pressable
              onPress={() => onAddTime(30)}
              style={styles.controlButton}
            >
              <Text style={styles.controlButtonText}>+30s</Text>
            </Pressable>
          </View>

          <Pressable onPress={onSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip Rest</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 32,
  },
  dismissButton: {
    position: "absolute",
    top: -80,
    alignSelf: "center",
  },
  timerContainer: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  timeOverlay: {
    position: "absolute",
    alignItems: "center",
  },
  timeText: {
    ...typography.numeric.lg,
    fontSize: 40,
    lineHeight: 48,
    color: colors.dark.textPrimary,
  },
  totalText: {
    ...typography.body.sm,
    color: colors.dark.textMuted,
    marginTop: 4,
  },
  nextSetText: {
    ...typography.body.md,
    color: colors.dark.textSecondary,
    marginTop: 24,
  },
  controls: {
    flexDirection: "row",
    gap: 16,
    marginTop: 32,
  },
  controlButton: {
    backgroundColor: colors.dark.surfaceElevated,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  controlButtonText: {
    ...typography.label.lg,
    color: colors.dark.textPrimary,
  },
  skipButton: {
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  skipText: {
    ...typography.label.lg,
    color: colors.dark.textMuted,
  },
});
