import { useState, useEffect, useCallback } from "react";
import { View, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { colors } from "../../constants/colors";
import { useUserStore } from "../../stores/userStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { useMesocycleStore } from "../../stores/mesocycleStore";
import type { DailyPrescription } from "../ai/deterministic-fallback";
import type { RootStackParamList } from "../../navigation/types";
import { workoutSession$ } from "../../stores/activeWorkoutStore";
import { CustomNumpad } from "../../components/workout/CustomNumpad";
import { WorkoutHeader } from "./components/WorkoutHeader";
import { ExerciseListContainer } from "./components/ExerciseListContainer";
import { PRBanner } from "./components/PRBanner";
import { ModalsOverlay } from "./components/ModalsOverlay";
import { useWorkoutLifecycle } from "./hooks/useWorkoutLifecycle";
import { useExerciseManager } from "./hooks/useExerciseManager";
import { useSetLogger } from "./hooks/useSetLogger";
import { useNumpadController } from "./hooks/useNumpadController";
import type { NumpadValue } from "./hooks/useNumpadController";

export function ActiveWorkoutScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, "ActiveWorkout">>();
  const prescription = (route.params as { prescription?: DailyPrescription } | undefined)?.prescription ?? null;

  // Store access
  const userId = useUserStore((s) => s.id);
  const defaultRest = useSettingsStore((s) => s.defaultRestSeconds);
  const currentMesocycleId = useMesocycleStore((s) => s.currentMesocycleId);
  const currentMicrocycles = useMesocycleStore((s) => s.microcycles);
  const currentWeek = useMesocycleStore((s) => s.currentWeek);

  // Exercise metadata
  const [exerciseMeta, setExerciseMeta] = useState<
    Map<string, { muscleGroups: string[]; lastPerformed: string | null }>
  >(new Map());

  // Custom hooks for lifecycle, exercises, logging, and numpad
  const { workoutId, elapsed, exercises, startedAt, initWorkout, finishWorkout, addPrescribedExercise } =
    useWorkoutLifecycle({
      userId,
      currentMesocycleId,
      currentMicrocycles,
      currentWeek,
      defaultRestSeconds: defaultRest,
      prescription,
    });

  const { exercises: managerExercises, setExercises, addExercise, handleAddSet, handleDeleteSet, handleDuplicateSet, updateExerciseSet } = useExerciseManager({
    workoutId,
    userId,
    defaultRestSeconds: defaultRest,
  });

  const { rpeModalState, adaptationState, prBannerExercise, handleToggleComplete, handleRPESubmit, handleAdaptationAction } = useSetLogger({
    exercises: managerExercises,
    userId,
    workoutId,
    onExercisesUpdate: setExercises,
  });

  const { activeField, handleFieldPress, handleNumpadInput, handleNumpadBackspace, handleNumpadDecimal, submitValue, getDisplayValue } =
    useNumpadController({
      exercises: managerExercises,
      onValueChange: (change: NumpadValue) => {
        updateExerciseSet(change.exerciseIndex, change.setIndex, change.field, change.value);
      },
    });

  // Initialize workout on mount
  useEffect(() => {
    initWorkout();
  }, [initWorkout]);

  // Sync exercises from lifecycle hook to manager hook
  useEffect(() => {
    if (exercises.length > 0) {
      setExercises(exercises);
    }
  }, [exercises, setExercises]);

  // Sync exercises to Legend State
  useEffect(() => {
    workoutSession$.exercises.set(managerExercises);
  }, [managerExercises]);

  // Handle finish with summary calculation
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

          const exerciseSummaries = managerExercises.map((ex) => {
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

          await finishWorkout({
            durationMinutes,
            totalVolume,
            averageRpe: rpeCount > 0 ? totalRpe / rpeCount : null,
            exercises: exerciseSummaries,
          });

          navigation.navigate("PostWorkout", { workoutId });
        },
      },
    ]);
  }, [managerExercises, startedAt, workoutId, finishWorkout, navigation]);

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
      ]
    );
  }, [navigation]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.dark.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <WorkoutHeader elapsed={elapsed} onBack={handleBack} onFinish={handleFinish} />

      <ExerciseListContainer
        exercises={managerExercises}
        exerciseMeta={exerciseMeta}
        activeField={activeField}
        onFieldPress={handleFieldPress}
        onToggleComplete={handleToggleComplete}
        onDeleteSet={handleDeleteSet}
        onDuplicateSet={handleDuplicateSet}
        onAddSet={handleAddSet}
        onAddExercise={addExercise}
      />

      <PRBanner exerciseName={prBannerExercise} />

      <ModalsOverlay
        rpeModalState={rpeModalState}
        adaptationState={adaptationState}
        onRPESubmit={handleRPESubmit}
        onRPEDismiss={() => {
          /* Handled by modal */
        }}
        onAdaptationAction={handleAdaptationAction}
      />

      <CustomNumpad
        activeField={
          activeField
            ? {
                field: activeField.field,
                value: getDisplayValue(),
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
