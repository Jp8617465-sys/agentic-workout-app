import { useCallback, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { colors } from "../../../constants/colors";
import { useUserStore } from "../../../stores/userStore";
import {
  mobilityRepository,
  toLocalDate,
} from "../services/mobility-repository";

const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];

function lastSevenDays(): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d;
  });
}

export function MobilityCard() {
  const navigation = useNavigation();
  const userId = useUserStore((s) => s.id);
  const [doneDates, setDoneDates] = useState<Set<string>>(new Set());

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      setDoneDates(new Set(mobilityRepository.recentSessionDates(userId, 7)));
    }, [userId]),
  );

  const days = lastSevenDays();
  const today = toLocalDate(new Date());
  const doneToday = doneDates.has(today);

  return (
    <Pressable
      onPress={() => navigation.navigate("Mobility")}
      className="mt-4 rounded-xl bg-dark-surface p-4"
      accessibilityRole="button"
      accessibilityLabel={`Mobility, ${doneDates.size} of the last 7 days. Start routine.`}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons
            name="body-outline"
            size={20}
            color={colors.brand.secondary}
          />
          <Text className="ml-2 text-base font-semibold text-dark-text-primary">
            Mobility
          </Text>
        </View>
        <Text className="text-sm text-dark-text-secondary">
          {doneDates.size}/7 days
        </Text>
      </View>

      <View className="mt-3 flex-row justify-between">
        {days.map((d) => {
          const key = toLocalDate(d);
          const done = doneDates.has(key);
          return (
            <View key={key} className="items-center">
              <View
                className={`h-7 w-7 items-center justify-center rounded-full ${done ? "bg-brand-secondary" : "bg-dark-surface-elevated"} ${key === today ? "border border-dark-text-secondary" : ""}`}
              >
                {done && (
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color={colors.dark.textInverse}
                  />
                )}
              </View>
              <Text className="mt-1 text-xs text-dark-text-muted">
                {DAY_LETTERS[d.getDay()]}
              </Text>
            </View>
          );
        })}
      </View>

      <View className="mt-3 flex-row items-center">
        <Text
          className={`flex-1 text-sm ${doneToday ? "text-dark-text-muted" : "text-brand-secondary"}`}
        >
          {doneToday
            ? "Done today. Nice work."
            : "Start today's 10-minute routine"}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.dark.textMuted}
        />
      </View>
    </Pressable>
  );
}
