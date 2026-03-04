import { View, Text, TextInput, Pressable, ActivityIndicator } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { useExerciseSearch } from "./useExerciseSearch";
import { ExerciseListItem } from "./ExerciseListItem";
import { colors } from "../../constants/colors";
import type { ExerciseCategory, ExercisePattern } from "../../types";

const CATEGORIES: ExerciseCategory[] = ["compound", "isolation", "cardio", "flexibility"];

const PATTERNS: { label: string; value: ExercisePattern }[] = [
  { label: "Squat", value: "squat" },
  { label: "Hinge", value: "hinge" },
  { label: "Push", value: "horizontal_push" },
  { label: "Pull", value: "horizontal_pull" },
  { label: "Lunge", value: "lunge" },
  { label: "Core", value: "core" },
  { label: "Carry", value: "carry" },
];

export function ExerciseLibraryScreen() {
  const {
    query,
    setQuery,
    categoryFilter,
    setCategoryFilter,
    patternFilter,
    setPatternFilter,
    exercises,
    isLoading,
  } = useExerciseSearch();

  return (
    <View className="flex-1 bg-dark-background">
      <View className="px-4 pb-2 pt-2">
        <View className="flex-row items-center rounded-lg bg-dark-surface px-3 py-2">
          <Ionicons name="search" size={20} color={colors.dark.textMuted} />
          <TextInput
            className="ml-2 flex-1 text-base text-dark-text-primary"
            placeholder="Search exercises..."
            placeholderTextColor={colors.dark.textMuted}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery("")} hitSlop={8}>
              <Ionicons name="close-circle" size={20} color={colors.dark.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      <View className="px-4 pb-2">
        <View className="flex-row flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <FilterChip
              key={cat}
              label={cat}
              isActive={categoryFilter === cat}
              onPress={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
            />
          ))}
        </View>
      </View>

      <View className="px-4 pb-2">
        <View className="flex-row flex-wrap gap-2">
          {PATTERNS.map(({ label, value }) => (
            <FilterChip
              key={value}
              label={label}
              isActive={patternFilter === value}
              onPress={() => setPatternFilter(patternFilter === value ? null : value)}
            />
          ))}
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.brand.primary} />
        </View>
      ) : exercises.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="barbell-outline" size={48} color={colors.dark.textMuted} />
          <Text className="mt-4 text-center text-lg text-dark-text-secondary">
            No exercises found
          </Text>
          <Text className="mt-1 text-center text-dark-text-muted">
            Try a different search or filter
          </Text>
        </View>
      ) : (
        <FlashList
          data={exercises}
          renderItem={({ item }) => <ExerciseListItem exercise={item} />}
          estimatedItemSize={80}
          keyExtractor={(item) => item.name}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 16 }}
        />
      )}
    </View>
  );
}

function FilterChip({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-full px-3 py-1.5"
      style={{
        backgroundColor: isActive ? colors.brand.primary : colors.dark.surface,
        minHeight: 32,
      }}
    >
      <Text
        className="text-xs font-medium capitalize"
        style={{
          color: isActive ? "#FFFFFF" : colors.dark.textSecondary,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
