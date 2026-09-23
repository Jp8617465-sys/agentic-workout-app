import { useCallback, useMemo, useState } from "react";
import { View, Text, TextInput } from "react-native";
import { Button } from "../../../components/Button";
import { colors } from "../../../constants/colors";
import { mobilityRepository } from "../services/mobility-repository";
import {
  MOBILITY_TESTS,
  ANKLE_ASYMMETRY_FLAG_CM,
  ankleAsymmetry,
  computeTrend,
} from "../services/mobility-routines";
import type { MobilitySide, MobilityTestId } from "../../../types";

type Key = `${MobilityTestId}:${MobilitySide}`;

const SIDE_LABEL: Record<MobilitySide, string> = {
  left: "Left",
  right: "Right",
  both: "",
};

function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

export function AssessmentPanel({ userId }: { userId: string }) {
  const [inputs, setInputs] = useState<Partial<Record<Key, string>>>({});
  const [version, setVersion] = useState(0);
  const [saved, setSaved] = useState(false);

  const histories = useMemo(() => {
    const out: Partial<
      Record<Key, ReturnType<typeof mobilityRepository.history>>
    > = {};
    for (const test of MOBILITY_TESTS) {
      for (const side of test.sides) {
        out[`${test.id}:${side}`] = mobilityRepository.history(
          userId,
          test.id,
          side,
        );
      }
    }
    return out;
  }, [userId, version]);

  const entries = Object.entries(inputs)
    .map(([key, raw]) => {
      const [test, side] = key.split(":") as [MobilityTestId, MobilitySide];
      const value = Number((raw ?? "").replace(",", "."));
      return raw && raw.trim() !== "" && Number.isFinite(value)
        ? { test, side, value }
        : null;
    })
    .filter(
      (e): e is { test: MobilityTestId; side: MobilitySide; value: number } =>
        e !== null,
    );

  const handleSave = useCallback(() => {
    mobilityRepository.addAssessments(userId, entries);
    setInputs({});
    setVersion((v) => v + 1);
    setSaved(true);
  }, [userId, entries]);

  const latestLeft = histories["knee_to_wall:left"]?.at(-1)?.value ?? null;
  const latestRight = histories["knee_to_wall:right"]?.at(-1)?.value ?? null;
  const asymmetry = ankleAsymmetry(latestLeft, latestRight);
  const stifferSide =
    latestLeft !== null && latestRight !== null && latestLeft < latestRight
      ? "left"
      : "right";

  return (
    <View>
      <Text className="mb-3 text-sm text-dark-text-secondary">
        Re-test every 2 weeks at the same time of day, before training. Leave
        blank anything you skip.
      </Text>

      {asymmetry !== null && asymmetry > ANKLE_ASYMMETRY_FLAG_CM && (
        <View className="mb-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3">
          <Text className="text-sm text-amber-400">
            Ankles differ by {asymmetry} cm. Do an extra set of knee-to-wall on
            the {stifferSide} side.
          </Text>
        </View>
      )}

      {MOBILITY_TESTS.map((test) => (
        <View key={test.id} className="mb-3 rounded-xl bg-dark-surface p-4">
          <Text className="text-base font-semibold text-dark-text-primary">
            {test.name}
          </Text>
          <Text className="mt-0.5 text-xs text-dark-text-muted">
            {test.instructions}
          </Text>
          <Text className="mt-0.5 text-xs text-dark-text-muted">
            Target: {test.target}
          </Text>

          <View className="mt-3 flex-row gap-3">
            {test.sides.map((side) => {
              const key: Key = `${test.id}:${side}`;
              const history = histories[key] ?? [];
              const trend = computeTrend(
                history.map((h) => h.value),
                test.higherIsBetter,
              );
              const trendColor =
                trend?.improved === true
                  ? "text-emerald-400"
                  : trend?.improved === false
                    ? "text-red-400"
                    : "text-dark-text-muted";
              return (
                <View key={side} className="flex-1">
                  {SIDE_LABEL[side] !== "" && (
                    <Text className="mb-1 text-xs text-dark-text-secondary">
                      {SIDE_LABEL[side]}
                    </Text>
                  )}
                  <View className="flex-row items-center rounded-lg bg-dark-surface-elevated px-3">
                    <TextInput
                      value={inputs[key] ?? ""}
                      onChangeText={(v) => {
                        setSaved(false);
                        setInputs((prev) => ({ ...prev, [key]: v }));
                      }}
                      keyboardType="numbers-and-punctuation"
                      placeholder={trend ? String(trend.latest) : "—"}
                      placeholderTextColor={colors.dark.textMuted}
                      className="h-11 flex-1 font-mono text-base text-dark-text-primary"
                      accessibilityLabel={`${test.name} ${SIDE_LABEL[side]} in ${test.unit}`}
                    />
                    <Text className="text-sm text-dark-text-muted">
                      {test.unit}
                    </Text>
                  </View>
                  {trend && history.length > 1 && (
                    <Text className={`mt-1 text-xs ${trendColor}`}>
                      {trend.change > 0 ? "+" : ""}
                      {trend.change} {test.unit} since{" "}
                      {formatShortDate(history[0].measuredAt)}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      ))}

      <Button
        title={
          saved
            ? "Saved"
            : entries.length === 0
              ? "Save results"
              : `Save ${entries.length} result${entries.length === 1 ? "" : "s"}`
        }
        onPress={handleSave}
        disabled={entries.length === 0}
        icon={saved ? "checkmark" : "save-outline"}
        size="lg"
      />
    </View>
  );
}
