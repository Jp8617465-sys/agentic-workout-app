import { memo, useState, useEffect, useRef } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../constants/colors";
import { useUserStore } from "../../../stores/userStore";

interface ReEntryBannerProps {
  loadReductionPercent: number;
  gapDays: number;
  sessionStartedAt: number;
}

/**
 * Persistent amber banner shown during re-entry sessions after a training gap.
 * Includes an "I was sick" toggle that applies additional load reduction and RPE cap,
 * only available within the first 2 minutes of the session.
 */
export const ReEntryBanner = memo(function ReEntryBanner({
  loadReductionPercent,
  gapDays,
  sessionStartedAt,
}: ReEntryBannerProps) {
  const setReEntryState = useUserStore((s) => s.setReEntryState);
  const reEntrySessionsRemaining = useUserStore((s) => s.reEntrySessionsRemaining);
  const currentReduction = useUserStore((s) => s.reEntryLoadReduction);
  const currentRpeCap = useUserStore((s) => s.reEntryRpeCap);

  const [illnessToggled, setIllnessToggled] = useState(false);
  const [canToggleIllness, setCanToggleIllness] = useState(true);
  const baseReduction = useRef(loadReductionPercent);

  // Disable illness toggle after 2 minutes from session start
  useEffect(() => {
    const twoMinutesMs = 120_000;
    const elapsed = Date.now() - sessionStartedAt;

    if (elapsed >= twoMinutesMs) {
      setCanToggleIllness(false);
      return;
    }

    const remaining = twoMinutesMs - elapsed;
    const timer = setTimeout(() => {
      setCanToggleIllness(false);
    }, remaining);

    return () => clearTimeout(timer);
  }, [sessionStartedAt]);

  const handleIllnessToggle = () => {
    if (!canToggleIllness || illnessToggled) return;

    setIllnessToggled(true);
    const newReduction = baseReduction.current + 0.05;
    const newRpeCap = 7;
    setReEntryState(reEntrySessionsRemaining, newReduction, newRpeCap);
  };

  const displayPercent = Math.round(currentReduction * 100);

  return (
    <View
      className="mx-4 mt-2 rounded-xl px-4 py-3"
      style={{ backgroundColor: colors.semantic.warning + "25" }}
    >
      <View className="flex-row items-center gap-2">
        <Ionicons
          name="alert-circle"
          size={20}
          color={colors.semantic.warning}
        />
        <Text
          className="flex-1 text-sm font-semibold"
          style={{ color: colors.semantic.warning }}
        >
          Re-entry session — loads reduced {displayPercent}%
        </Text>
      </View>

      <Text
        className="mt-1 text-xs"
        style={{ color: colors.dark.textSecondary }}
      >
        {gapDays} days since last session. Focus on quality, not numbers.
      </Text>

      {currentRpeCap !== null && (
        <Text
          className="mt-1 text-xs font-medium"
          style={{ color: colors.semantic.warning }}
        >
          RPE capped at {currentRpeCap}
        </Text>
      )}

      {canToggleIllness && !illnessToggled && (
        <Pressable
          onPress={handleIllnessToggle}
          className="mt-2 flex-row items-center gap-2 self-start rounded-lg px-3 py-2"
          style={{ backgroundColor: colors.dark.surfaceElevated }}
        >
          <Ionicons
            name="medkit-outline"
            size={16}
            color={colors.dark.textSecondary}
          />
          <Text
            className="text-xs font-medium"
            style={{ color: colors.dark.textSecondary }}
          >
            I was sick
          </Text>
        </Pressable>
      )}

      {illnessToggled && (
        <View className="mt-2 flex-row items-center gap-2">
          <Ionicons
            name="medkit"
            size={14}
            color={colors.semantic.warning}
          />
          <Text
            className="text-xs"
            style={{ color: colors.semantic.warning }}
          >
            Illness flag active — extra 5% reduction applied, RPE capped at 7
          </Text>
        </View>
      )}
    </View>
  );
});
