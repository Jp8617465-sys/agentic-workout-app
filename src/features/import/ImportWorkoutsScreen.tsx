import { useMemo, useState } from "react";
import { View, Text, TextInput, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { Button } from "../../components/Button";
import { colors } from "../../constants/colors";
import { useUserStore } from "../../stores/userStore";
import { useMemoryStore } from "../../stores/memoryStore";
import { expoDb } from "../../lib/database";
import { ensureLocalUser } from "../profile/services/local-user";
import { parseStrongText } from "./services/strong-parser";
import { resolveExerciseName } from "./services/exercise-name-map";
import { importParsedWorkouts } from "./services/workout-importer";
import type { ImportSummary, ParseResult } from "./types";

function formatDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function ImportWorkoutsScreen() {
  const navigation = useNavigation();
  const unitSystem = useUserStore((s) => s.unitSystem);
  const runDetection = useMemoryStore((s) => s.runDetection);
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<ParseResult | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const library = useMemo(
    () =>
      preview
        ? expoDb
            .getAllSync<{ name: string }>("SELECT name FROM exercises")
            .map((r) => r.name)
        : [],
    [preview],
  );

  const handlePreview = () => {
    setError(null);
    const result = parseStrongText(text);
    if (result.workouts.length === 0) {
      setError(
        'No workouts found. Paste the text from Strong\'s "Share workout" option.',
      );
      return;
    }
    setPreview(result);
  };

  const handleImport = () => {
    if (!preview) return;
    try {
      const userId = ensureLocalUser();
      const result = importParsedWorkouts(userId, preview.workouts, unitSystem);
      setSummary(result);
      if (result.imported > 0) runDetection(userId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    }
  };

  return (
    <View className="flex-1 bg-dark-background">
      <View className="flex-row items-center justify-between px-4 pt-14 pb-3">
        <Pressable
          onPress={() => navigation.goBack()}
          className="h-11 w-11 items-center justify-center"
          accessibilityLabel="Go back"
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={colors.dark.textPrimary}
          />
        </Pressable>
        <Text className="text-lg font-semibold text-dark-text-primary">
          Import from Strong
        </Text>
        <View className="w-11" />
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      >
        {summary ? (
          <View className="rounded-xl bg-dark-surface p-4">
            <Text className="text-xl font-bold text-dark-text-primary">
              Import complete
            </Text>
            <Text className="mt-3 text-base text-dark-text-secondary">
              {summary.imported} workout{summary.imported === 1 ? "" : "s"}{" "}
              imported
              {summary.skippedDuplicates > 0
                ? `, ${summary.skippedDuplicates} already in your history`
                : ""}
              .
            </Text>
            {summary.personalRecords > 0 && (
              <Text className="mt-1 text-base text-dark-text-secondary">
                {summary.personalRecords} personal record
                {summary.personalRecords === 1 ? "" : "s"} set from history.
              </Text>
            )}
            {summary.createdExercises.length > 0 && (
              <Text className="mt-1 text-sm text-dark-text-muted">
                Added as custom exercises: {summary.createdExercises.join(", ")}
              </Text>
            )}
            <Button
              title="Done"
              onPress={() => navigation.goBack()}
              style={{ marginTop: 20 }}
            />
          </View>
        ) : preview ? (
          <>
            {preview.workouts.map((w) => (
              <View
                key={w.startedAt}
                className="mb-3 rounded-xl bg-dark-surface p-4"
              >
                <Text className="text-base font-semibold text-dark-text-primary">
                  {w.title}
                </Text>
                <Text className="mb-2 text-sm text-dark-text-muted">
                  {formatDate(w.date)}
                </Text>
                {w.exercises.map((ex) => {
                  const resolved = resolveExerciseName(ex.sourceName, library);
                  const top = ex.sets.reduce(
                    (best, s) =>
                      (s.weight ?? 0) > (best.weight ?? 0) ? s : best,
                    ex.sets[0],
                  );
                  return (
                    <View
                      key={ex.sourceName}
                      className="flex-row items-center justify-between py-1"
                    >
                      <View className="flex-1 flex-row items-center">
                        {!resolved.matchedLibrary && (
                          <Ionicons
                            name="add-circle-outline"
                            size={14}
                            color={colors.semantic.warning}
                          />
                        )}
                        <Text
                          className="ml-1 text-sm text-dark-text-secondary"
                          numberOfLines={1}
                        >
                          {resolved.name}
                        </Text>
                      </View>
                      <Text className="text-sm text-dark-text-muted">
                        {ex.sets.length} ×{" "}
                        {top.weight !== null
                          ? `${top.weight}${top.weightUnit} × ${top.reps}`
                          : `${top.reps ?? "—"}`}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ))}
            {preview.warnings.map((w) => (
              <Text key={w} className="mb-1 text-xs text-dark-text-muted">
                ⚠ {w}
              </Text>
            ))}
            <Button
              title={`Import ${preview.workouts.length} workout${preview.workouts.length === 1 ? "" : "s"}`}
              onPress={handleImport}
              size="lg"
              icon="download-outline"
              style={{ marginTop: 12 }}
            />
            <Button
              title="Edit text"
              variant="ghost"
              onPress={() => setPreview(null)}
              style={{ marginTop: 8 }}
            />
          </>
        ) : (
          <>
            <Text className="mb-3 text-sm text-dark-text-secondary">
              In Strong, open a workout → Share → Copy, then paste below. You
              can paste several workouts at once.
            </Text>
            <TextInput
              value={text}
              onChangeText={setText}
              multiline
              placeholder={
                "Morning Workout\nFriday, 4 September 2026 at 9:58 am\n\nSquat (Barbell)\nSet 1: 60 kg × 6"
              }
              placeholderTextColor={colors.dark.textMuted}
              className="min-h-[260px] rounded-xl bg-dark-surface p-4 text-sm text-dark-text-primary"
              style={{ textAlignVertical: "top" }}
              autoCorrect={false}
              autoCapitalize="none"
            />
            <Button
              title="Preview"
              onPress={handlePreview}
              size="lg"
              disabled={text.trim().length === 0}
              style={{ marginTop: 16 }}
            />
          </>
        )}
        {error && <Text className="mt-3 text-sm text-red-500">{error}</Text>}
      </ScrollView>
    </View>
  );
}
