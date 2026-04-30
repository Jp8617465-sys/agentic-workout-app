import { useState, useEffect, useCallback } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { colors } from "../../constants/colors";
import {
  getSessionPrehab,
  checkAndPromptProgression,
  confirmProgression,
} from "./rehab-protocol-service";
import type { RehabExercise, ProgressionStatus } from "./types";

interface RehabPrehabProps {
  userId: string;
}

function formatPrescription(exercise: RehabExercise): string {
  const parts: string[] = [];

  if (exercise.sets != null && exercise.reps != null) {
    parts.push(`${exercise.sets} x ${exercise.reps}`);
  } else if (exercise.sets != null && exercise.duration != null) {
    parts.push(`${exercise.sets} x ${exercise.duration}`);
  } else if (exercise.duration != null) {
    parts.push(exercise.duration);
  }

  return parts.join(" ");
}

export function RehabPrehab({ userId }: RehabPrehabProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [exercises, setExercises] = useState<RehabExercise[]>([]);
  const [completedIndices, setCompletedIndices] = useState<Set<number>>(
    new Set(),
  );
  const [progressionStatus, setProgressionStatus] =
    useState<ProgressionStatus | null>(null);
  const [progressionDismissed, setProgressionDismissed] = useState(false);

  useEffect(() => {
    const prehab = getSessionPrehab(userId);
    setExercises(prehab);

    const status = checkAndPromptProgression(userId);
    setProgressionStatus(status);
  }, [userId]);

  const handleToggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleToggleExercise = useCallback((index: number) => {
    setCompletedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }, []);

  const handleConfirmProgression = useCallback(() => {
    confirmProgression(userId);

    const prehab = getSessionPrehab(userId);
    setExercises(prehab);
    setCompletedIndices(new Set());

    const status = checkAndPromptProgression(userId);
    setProgressionStatus(status);
    setProgressionDismissed(false);
  }, [userId]);

  const handleDismissProgression = useCallback(() => {
    setProgressionDismissed(true);
  }, []);

  if (exercises.length === 0) {
    return null;
  }

  const currentPhase = progressionStatus?.currentPhase ?? 1;
  const showProgressionBanner =
    progressionStatus?.isDue &&
    !progressionDismissed &&
    currentPhase < 2;

  return (
    <View className="mx-4 mb-3 overflow-hidden rounded-xl" style={styles.card}>
      {showProgressionBanner && (
        <View className="px-4 py-3" style={styles.progressionBanner}>
          <Text className="mb-2 text-sm font-semibold" style={styles.progressionText}>
            Your physio protocol is ready to advance to Phase 2. Confirm
            progression?
          </Text>
          <View className="flex-row gap-3">
            <Pressable
              className="rounded-lg px-4 py-2"
              style={styles.confirmButton}
              onPress={handleConfirmProgression}
            >
              <Text className="text-sm font-semibold text-white">Yes</Text>
            </Pressable>
            <Pressable
              className="rounded-lg px-4 py-2"
              style={styles.dismissButton}
              onPress={handleDismissProgression}
            >
              <Text
                className="text-sm font-semibold"
                style={styles.dismissText}
              >
                Not yet
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      <Pressable
        className="flex-row items-center justify-between px-4 py-3"
        onPress={handleToggleExpanded}
      >
        <Text className="text-base font-bold" style={styles.headerText}>
          Prehab — Phase {currentPhase}
        </Text>
        <Text className="text-base" style={styles.chevron}>
          {isExpanded ? "▼" : "▶"}
        </Text>
      </Pressable>

      {isExpanded && (
        <View className="pb-3">
          {exercises.map((exercise, index) => {
            const isCompleted = completedIndices.has(index);
            return (
              <Pressable
                key={exercise.name}
                className="flex-row items-center px-4 py-2"
                onPress={() => handleToggleExercise(index)}
              >
                <View
                  className="mr-3 h-6 w-6 items-center justify-center rounded-md"
                  style={[
                    styles.checkbox,
                    isCompleted && styles.checkboxCompleted,
                  ]}
                >
                  {isCompleted && (
                    <Text className="text-sm font-bold text-white">
                      ✓
                    </Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text
                    className="text-sm font-medium"
                    style={[
                      styles.exerciseName,
                      isCompleted && styles.exerciseNameCompleted,
                    ]}
                  >
                    {exercise.name}
                  </Text>
                  <Text
                    className="text-xs"
                    style={[
                      styles.exerciseDetail,
                      isCompleted && styles.exerciseDetailCompleted,
                    ]}
                  >
                    {formatPrescription(exercise)}
                    {exercise.notes ? ` — ${exercise.notes}` : ""}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.dark.surface,
  },
  progressionBanner: {
    backgroundColor: "#78350F",
    borderBottomWidth: 1,
    borderBottomColor: colors.semantic.warning,
  },
  progressionText: {
    color: colors.semantic.warning,
  },
  confirmButton: {
    backgroundColor: colors.semantic.warning,
  },
  dismissButton: {
    backgroundColor: colors.dark.surfaceElevated,
  },
  dismissText: {
    color: colors.dark.textSecondary,
  },
  headerText: {
    color: colors.brand.secondary,
  },
  chevron: {
    color: colors.dark.textMuted,
  },
  checkbox: {
    borderWidth: 2,
    borderColor: colors.dark.border,
    backgroundColor: "transparent",
  },
  checkboxCompleted: {
    backgroundColor: colors.brand.secondary,
    borderColor: colors.brand.secondary,
  },
  exerciseName: {
    color: colors.dark.textPrimary,
  },
  exerciseNameCompleted: {
    color: colors.dark.textMuted,
    textDecorationLine: "line-through",
  },
  exerciseDetail: {
    color: colors.dark.textSecondary,
  },
  exerciseDetailCompleted: {
    color: colors.dark.textMuted,
  },
});
