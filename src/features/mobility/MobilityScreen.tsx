import { useCallback, useMemo, useRef, useState } from "react";
import { View, Text, Pressable, ScrollView, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { Button } from "../../components/Button";
import { colors } from "../../constants/colors";
import { useSettingsStore } from "../../stores/settingsStore";
import { ensureLocalUser } from "../profile/services/local-user";
import { DrillRow } from "./components/DrillRow";
import { AssessmentPanel } from "./components/AssessmentPanel";
import { useHoldTimer } from "./hooks/useHoldTimer";
import { mobilityRepository } from "./services/mobility-repository";
import {
  MOBILITY_ROUTINES,
  estimateRoutineSeconds,
  type MobilityRoutine,
} from "./services/mobility-routines";

type Tab = "routine" | "checkin";

export function MobilityScreen() {
  const navigation = useNavigation();
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const userId = useMemo(() => ensureLocalUser(), []);
  const startedAt = useRef(Date.now());

  const [tab, setTab] = useState<Tab>("routine");
  const [routine, setRoutine] = useState<MobilityRoutine>(MOBILITY_ROUTINES[0]);
  const [done, setDone] = useState<Set<number>>(new Set());

  const markDone = useCallback((index: number) => {
    setDone((prev) => new Set(prev).add(index));
  }, []);

  const { timer, start, cancel } = useHoldTimer(routine.drills, markDone);

  const toggle = useCallback(
    (index: number) => {
      if (hapticsEnabled)
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setDone((prev) => {
        const next = new Set(prev);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        return next;
      });
    },
    [hapticsEnabled],
  );

  const selectRoutine = (r: MobilityRoutine) => {
    cancel();
    setRoutine(r);
    setDone(new Set());
  };

  const finish = () => {
    const drills = routine.drills
      .map((d, i) => ({ d, i }))
      .filter(({ i }) => done.has(i))
      .map(({ d }) => ({
        exerciseName: d.exerciseName,
        sets: d.perSide ? [d.amount, d.amount] : [d.amount],
      }));

    mobilityRepository.logSession(
      userId,
      drills,
      (Date.now() - startedAt.current) / 1000,
    );
    if (hapticsEnabled)
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const thisWeek = mobilityRepository.recentSessionDates(userId, 7).length;
    Alert.alert(
      "Mobility logged",
      `${thisWeek} day${thisWeek === 1 ? "" : "s"} of mobility in the last 7.`,
      [{ text: "Done", onPress: () => navigation.goBack() }],
    );
  };

  const close = () => {
    if (done.size === 0) {
      navigation.goBack();
      return;
    }
    Alert.alert("Discard session?", "Your completed drills won't be saved.", [
      { text: "Keep going", style: "cancel" },
      {
        text: "Discard",
        style: "destructive",
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  const minutes = Math.round(estimateRoutineSeconds(routine) / 60);

  return (
    <View className="flex-1 bg-dark-background">
      <View className="flex-row items-center justify-between px-4 pt-14 pb-2">
        <Pressable
          onPress={close}
          className="h-11 w-11 items-center justify-center"
          accessibilityLabel="Close"
        >
          <Ionicons name="close" size={26} color={colors.dark.textPrimary} />
        </Pressable>
        <Text className="text-lg font-semibold text-dark-text-primary">
          Mobility
        </Text>
        <View className="w-11" />
      </View>

      <View className="mx-4 mb-3 flex-row rounded-lg bg-dark-surface p-1">
        {(["routine", "checkin"] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            className={`h-10 flex-1 items-center justify-center rounded-md ${tab === t ? "bg-brand-primary" : ""}`}
          >
            <Text
              className={`text-sm font-semibold ${tab === t ? "text-white" : "text-dark-text-secondary"}`}
            >
              {t === "routine" ? "Routine" : "Check-in"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
      >
        {tab === "routine" ? (
          <>
            <View className="mb-3 flex-row gap-2">
              {MOBILITY_ROUTINES.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => selectRoutine(r)}
                  className={`h-11 flex-1 items-center justify-center rounded-lg border ${routine.id === r.id ? "border-brand-primary bg-brand-primary/15" : "border-dark-border"}`}
                >
                  <Text
                    className={`text-sm font-semibold ${routine.id === r.id ? "text-brand-primary" : "text-dark-text-secondary"}`}
                  >
                    {r.name}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Text className="mb-3 text-sm text-dark-text-muted">
              {routine.description} About {minutes} min.
            </Text>
            {routine.drills.map((drill, i) => (
              <DrillRow
                key={`${routine.id}-${drill.exerciseName}`}
                drill={drill}
                index={i}
                done={done.has(i)}
                timer={timer}
                onToggle={toggle}
                onStartTimer={start}
                onCancelTimer={cancel}
              />
            ))}
          </>
        ) : (
          <AssessmentPanel userId={userId} />
        )}
      </ScrollView>

      {tab === "routine" && (
        <View className="absolute bottom-0 left-0 right-0 border-t border-dark-border bg-dark-background px-4 pb-8 pt-3">
          <Button
            title={`Finish (${done.size}/${routine.drills.length})`}
            onPress={finish}
            disabled={done.size === 0}
            size="lg"
            icon="checkmark-done"
          />
        </View>
      )}
    </View>
  );
}
