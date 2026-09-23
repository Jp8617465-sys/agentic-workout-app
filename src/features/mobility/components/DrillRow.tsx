import { memo } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../constants/colors";
import {
  formatDrillPrescription,
  type MobilityDrill,
} from "../services/mobility-routines";
import type { HoldTimerState } from "../hooks/useHoldTimer";

interface DrillRowProps {
  drill: MobilityDrill;
  index: number;
  done: boolean;
  timer: HoldTimerState | null;
  onToggle: (index: number) => void;
  onStartTimer: (index: number) => void;
  onCancelTimer: () => void;
}

export const DrillRow = memo(function DrillRow({
  drill,
  index,
  done,
  timer,
  onToggle,
  onStartTimer,
  onCancelTimer,
}: DrillRowProps) {
  const isTiming = timer?.drillIndex === index;

  return (
    <View
      className={`mb-2 flex-row items-center rounded-xl p-3 ${done ? "bg-dark-surface/60" : "bg-dark-surface"}`}
    >
      <Pressable
        onPress={() => onToggle(index)}
        className="h-11 w-11 items-center justify-center"
        accessibilityRole="checkbox"
        accessibilityState={{ checked: done }}
        accessibilityLabel={`Mark ${drill.exerciseName} done`}
      >
        <Ionicons
          name={done ? "checkmark-circle" : "ellipse-outline"}
          size={28}
          color={done ? colors.semantic.success : colors.dark.textMuted}
        />
      </Pressable>

      <View className="ml-2 flex-1">
        <Text
          className={`text-base font-semibold ${done ? "text-dark-text-muted line-through" : "text-dark-text-primary"}`}
        >
          {drill.exerciseName}
        </Text>
        <Text className="text-sm text-dark-text-secondary">
          {formatDrillPrescription(drill)}
        </Text>
        {!done && (
          <Text className="mt-0.5 text-xs text-dark-text-muted">
            {drill.cue}
          </Text>
        )}
      </View>

      {drill.mode === "hold" && !done && (
        <Pressable
          onPress={() => (isTiming ? onCancelTimer() : onStartTimer(index))}
          className={`ml-2 h-11 min-w-[72px] flex-row items-center justify-center rounded-lg px-3 ${isTiming ? "bg-brand-primary" : "bg-dark-surface-elevated"}`}
          accessibilityLabel={
            isTiming ? "Stop timer" : `Start ${drill.amount} second timer`
          }
        >
          {isTiming && timer ? (
            <Text className="font-mono text-base font-bold text-white">
              {drill.perSide ? `S${timer.side} ` : ""}
              {timer.remainingSeconds}s
            </Text>
          ) : (
            <>
              <Ionicons
                name="timer-outline"
                size={18}
                color={colors.dark.textPrimary}
              />
              <Text className="ml-1 text-sm font-semibold text-dark-text-primary">
                Start
              </Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
});
