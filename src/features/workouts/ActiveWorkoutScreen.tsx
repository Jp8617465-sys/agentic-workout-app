import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { workoutSession$ } from "../../stores/activeWorkoutStore";
import { workoutRepository } from "./workout-repository";
import { autoFillExerciseSets } from "./auto-fill";
import { ExerciseCard } from "../../components/workout/ExerciseCard";
import { CustomNumpad } from "../../components/workout/CustomNumpad";
import { colors } from "../../constants/colors";
import { typography } from "../../constants/typography";
import { generateId } from "../../lib/uuid";
import { useUserStore } from "../../stores/userStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { exerciseRepository } from "../exercises/exercise-repository";
import type { WorkoutExercise, WorkoutSet } from "./types";
import type { SetType } from "../../types";

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function ActiveWorkoutScreen() {
  const navigation = useNavigation();
  const userId = useUserStore((s) => s.id);
  const defaultRest = useSettingsStore((s) => s.defaultRestSeconds);

  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [exerciseMeta, setExerciseMeta] = useState<
    Map<string, { muscleGroups: string[]; lastPerformed: string | null }>
  >(new Map());
  const [activeField, setActiveField] = useState<{
    exerciseIndex: number;
    setIndex: number;
    field: "weight" | "reps" | "rpe";
  } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [workoutId, setWorkoutId] = useState("");
  const inputBuffer = useRef("");

  // Initialize workout
  useEffect(() => {
    const session = workoutSession$.peek();
    if (session.isActive && session.id) {
      // Resuming existing workout
      setWorkoutId(session.id);
      setStartedAt(session.startedAt);
      setExercises(session.exercises);
    } else {
      // Start new workout
      initNewWorkout();
    }
  }, []);

  const initNewWorkout = async () => {
    const uid = userId ?? generateId();
    const now = Date.now();
    const id = await workoutRepository.insert({
      userId: uid,
      type: "custom",
      date: new Date().toISOString().split("T")[0],
    });

    setWorkoutId(id);
    setStartedAt(now);

    workoutSession$.set({
      id,
      userId: uid,
      startedAt: now,
      isActive: true,
      exercises: [],
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      restTimer: {
        isRunning: false,
        endTimestamp: null,
        totalSeconds: 0,
        notificationId: null,
      },
      activeField: null,
    });
  };

  // Elapsed timer
  useEffect(() => {
    if (!startedAt) return;
    const timer = setInterval(() => {
      setElapsed(Date.now() - startedAt);
    }, 1000);
    return () => clearInterval(timer);
  }, [startedAt]);

  // Sync exercises to Legend State
  useEffect(() => {
    workoutSession$.exercises.set(exercises);
  }, [exercises]);

  const addExercise = useCallback(
    async (exerciseName: string) => {
      const uid = userId ?? "";
      const exercise = await exerciseRepository.findByName(exerciseName);
      if (!exercise) return;

      const epId = await workoutRepository.insertExercisePerformance({
        workoutId,
        exerciseName,
        prescribedSets: 3,
        prescribedReps: null,
        prescribedWeight: null,
        prescribedRpe: null,
        prescribedRestSeconds: defaultRest[exercise.category === "isolation" ? "isolation" : "compound"],
        orderInWorkout: exercises.length,
      });

      const autoFill = await autoFillExerciseSets(uid, exerciseName);
      const numSets = Math.max(autoFill.length, 3);
      const sets: WorkoutSet[] = Array.from({ length: numSets }, (_, i) => ({
        id: null,
        setNumber: i + 1,
        weight: autoFill[i]?.weight ?? null,
        reps: autoFill[i]?.reps ?? null,
        rpe: autoFill[i]?.rpe ?? null,
        type: "working" as SetType,
        isCompleted: false,
        previousWeight: autoFill[i]?.weight ?? null,
        previousReps: autoFill[i]?.reps ?? null,
      }));

      const newExercise: WorkoutExercise = {
        exercisePerformanceId: epId,
        exerciseName,
        prescribedSets: 3,
        prescribedReps: null,
        prescribedWeight: null,
        prescribedRpe: null,
        prescribedRestSeconds: defaultRest[exercise.category === "isolation" ? "isolation" : "compound"],
        sets,
      };

      setExercises((prev) => [...prev, newExercise]);
      setExerciseMeta((prev) => {
        const next = new Map(prev);
        next.set(exerciseName, {
          muscleGroups: exercise.muscleGroups,
          lastPerformed: autoFill.length > 0 ? autoFill[0].rpe?.toString() ?? null : null,
        });
        return next;
      });
    },
    [workoutId, exercises.length, userId, defaultRest],
  );

  const handleFieldPress = useCallback(
    (exerciseIndex: number, setIndex: number, field: "weight" | "reps" | "rpe") => {
      const currentValue = exercises[exerciseIndex]?.sets[setIndex]?.[field];
      inputBuffer.current = currentValue != null ? String(currentValue) : "";
      setActiveField({ exerciseIndex, setIndex, field });
      workoutSession$.activeField.set({ exerciseIndex, setIndex, field });
    },
    [exercises],
  );

  const handleNumpadInput = useCallback(
    (digit: string) => {
      if (!activeField) return;
      const { exerciseIndex, setIndex, field } = activeField;

      inputBuffer.current += digit;
      const numValue = parseFloat(inputBuffer.current);
      if (isNaN(numValue)) return;

      setExercises((prev) => {
        const next = [...prev];
        const sets = [...next[exerciseIndex].sets];
        sets[setIndex] = { ...sets[setIndex], [field]: numValue };
        next[exerciseIndex] = { ...next[exerciseIndex], sets };
        return next;
      });
    },
    [activeField],
  );

  const handleNumpadBackspace = useCallback(() => {
    if (!activeField) return;
    const { exerciseIndex, setIndex, field } = activeField;

    inputBuffer.current = inputBuffer.current.slice(0, -1);
    const numValue = inputBuffer.current ? parseFloat(inputBuffer.current) : null;

    setExercises((prev) => {
      const next = [...prev];
      const sets = [...next[exerciseIndex].sets];
      sets[setIndex] = { ...sets[setIndex], [field]: isNaN(numValue as number) ? null : numValue };
      next[exerciseIndex] = { ...next[exerciseIndex], sets };
      return next;
    });
  }, [activeField]);

  const handleNumpadDecimal = useCallback(() => {
    if (!activeField) return;
    if (activeField.field === "reps") return;
    if (inputBuffer.current.includes(".")) return;
    inputBuffer.current += ".";
  }, [activeField]);

  const handleToggleComplete = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      setExercises((prev) => {
        const next = [...prev];
        const sets = [...next[exerciseIndex].sets];
        const set = sets[setIndex];
        const isNowComplete = !set.isCompleted;
        sets[setIndex] = {
          ...set,
          isCompleted: isNowComplete,
        };
        next[exerciseIndex] = { ...next[exerciseIndex], sets };

        // Persist to SQLite
        if (isNowComplete) {
          workoutRepository.upsertSetLog({
            id: set.id,
            exercisePerformanceId: next[exerciseIndex].exercisePerformanceId,
            setNumber: set.setNumber,
            weight: set.weight,
            reps: set.reps,
            rpe: set.rpe,
            type: set.type,
            completedAt: new Date().toISOString(),
          }).then((id) => {
            if (!set.id) {
              setExercises((current) => {
                const updated = [...current];
                const updatedSets = [...updated[exerciseIndex].sets];
                updatedSets[setIndex] = { ...updatedSets[setIndex], id };
                updated[exerciseIndex] = { ...updated[exerciseIndex], sets: updatedSets };
                return updated;
              });
            }
          });
        }

        return next;
      });

      // Clear active field and move focus away
      setActiveField(null);
      workoutSession$.activeField.set(null);
    },
    [],
  );

  const handleDeleteSet = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      setExercises((prev) => {
        const next = [...prev];
        const sets = next[exerciseIndex].sets.filter((_, i) => i !== setIndex);
        // Renumber
        const renumbered = sets.map((s, i) => ({ ...s, setNumber: i + 1 }));
        next[exerciseIndex] = { ...next[exerciseIndex], sets: renumbered };
        return next;
      });
    },
    [],
  );

  const handleDuplicateSet = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      setExercises((prev) => {
        const next = [...prev];
        const sets = [...next[exerciseIndex].sets];
        const source = sets[setIndex];
        const newSet: WorkoutSet = {
          ...source,
          id: null,
          setNumber: sets.length + 1,
          isCompleted: false,
        };
        sets.push(newSet);
        next[exerciseIndex] = { ...next[exerciseIndex], sets };
        return next;
      });
    },
    [],
  );

  const handleAddSet = useCallback(
    (exerciseIndex: number) => {
      setExercises((prev) => {
        const next = [...prev];
        const sets = [...next[exerciseIndex].sets];
        const lastSet = sets[sets.length - 1];
        const newSet: WorkoutSet = {
          id: null,
          setNumber: sets.length + 1,
          weight: lastSet?.weight ?? null,
          reps: lastSet?.reps ?? null,
          rpe: null,
          type: "working",
          isCompleted: false,
          previousWeight: null,
          previousReps: null,
        };
        sets.push(newSet);
        next[exerciseIndex] = { ...next[exerciseIndex], sets };
        return next;
      });
    },
    [],
  );

  const handleFinish = useCallback(() => {
    Alert.alert("Finish Workout", "Complete this workout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Finish",
        onPress: async () => {
          const durationMinutes = Math.round((Date.now() - startedAt) / 60000);
          let totalVolume = 0;
          let totalRpe = 0;
          let rpeCount = 0;
          const exerciseSummaries = exercises.map((ex) => {
            let actualSets = 0;
            let exRpeSum = 0;
            let exRpeCount = 0;
            for (const set of ex.sets) {
              if (set.isCompleted) {
                actualSets++;
                totalVolume += (set.weight ?? 0) * (set.reps ?? 0);
                if (set.rpe != null) {
                  totalRpe += set.rpe;
                  rpeCount++;
                  exRpeSum += set.rpe;
                  exRpeCount++;
                }
              }
            }
            return {
              exercisePerformanceId: ex.exercisePerformanceId,
              actualSets,
              actualAverageRpe: exRpeCount > 0 ? exRpeSum / exRpeCount : null,
            };
          });

          await workoutRepository.saveCompleteWorkout({
            workoutId,
            durationMinutes,
            totalVolume,
            averageRpe: rpeCount > 0 ? totalRpe / rpeCount : null,
            exercises: exerciseSummaries,
          });

          workoutSession$.set({
            id: "",
            userId: "",
            startedAt: 0,
            isActive: false,
            exercises: [],
            currentExerciseIndex: 0,
            currentSetIndex: 0,
            restTimer: {
              isRunning: false,
              endTimestamp: null,
              totalSeconds: 0,
              notificationId: null,
            },
            activeField: null,
          });

          navigation.goBack();
        },
      },
    ]);
  }, [exercises, startedAt, workoutId, navigation]);

  const handleBack = useCallback(() => {
    Alert.alert(
      "Leave Workout",
      "Your workout will be saved and can be resumed later.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Leave",
          onPress: () => navigation.goBack(),
        },
      ],
    );
  }, [navigation]);

  const getNumpadValue = (): string => {
    if (!activeField) return "";
    const { exerciseIndex, setIndex, field } = activeField;
    const value = exercises[exerciseIndex]?.sets[setIndex]?.[field];
    return value != null ? String(value) : "";
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.dark.textPrimary} />
        </Pressable>
        <Text style={styles.elapsed}>{formatElapsed(elapsed)}</Text>
        <Pressable onPress={handleFinish} style={styles.finishButton}>
          <Text style={styles.finishText}>Finish</Text>
        </Pressable>
      </View>

      {/* Exercise list */}
      {exercises.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="barbell-outline" size={48} color={colors.dark.textMuted} />
          <Text style={styles.emptyText}>Add exercises to begin</Text>
          <Pressable
            onPress={() => {
              // For now, add a default exercise
              addExercise("Barbell Back Squat");
            }}
            style={styles.addExerciseButton}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addExerciseText}>Add Exercise</Text>
          </Pressable>
        </View>
      ) : (
        <FlashList
          data={exercises}
          renderItem={({ item, index }) => {
            const meta = exerciseMeta.get(item.exerciseName);
            return (
              <ExerciseCard
                exerciseIndex={index}
                exercise={item}
                muscleGroups={meta?.muscleGroups ?? []}
                lastPerformed={meta?.lastPerformed ?? null}
                hasInjuryWarning={false}
                activeField={activeField}
                onFieldPress={handleFieldPress}
                onToggleComplete={handleToggleComplete}
                onDeleteSet={handleDeleteSet}
                onDuplicateSet={handleDuplicateSet}
                onAddSet={handleAddSet}
              />
            );
          }}
          estimatedItemSize={300}
          keyExtractor={(_, index) => String(index)}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
          ListFooterComponent={
            <Pressable
              onPress={() => addExercise("Barbell Bench Press")}
              style={styles.addExerciseInline}
            >
              <Ionicons name="add-circle-outline" size={22} color={colors.brand.primary} />
              <Text style={styles.addExerciseInlineText}>Add Exercise</Text>
            </Pressable>
          }
        />
      )}

      {/* Numpad */}
      <CustomNumpad
        activeField={
          activeField
            ? {
                field: activeField.field,
                value: getNumpadValue(),
              }
            : null
        }
        onInput={handleNumpadInput}
        onBackspace={handleNumpadBackspace}
        onDecimal={handleNumpadDecimal}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
    backgroundColor: colors.dark.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.dark.border,
  },
  elapsed: {
    ...typography.numeric.md,
    color: colors.dark.textPrimary,
  },
  finishButton: {
    backgroundColor: colors.brand.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 8,
  },
  finishText: {
    ...typography.label.lg,
    color: "#FFFFFF",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: {
    ...typography.body.lg,
    color: colors.dark.textMuted,
  },
  addExerciseButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.brand.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    marginTop: 8,
  },
  addExerciseText: {
    ...typography.label.lg,
    color: "#FFFFFF",
  },
  addExerciseInline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 6,
  },
  addExerciseInlineText: {
    ...typography.label.lg,
    color: colors.brand.primary,
  },
});
