import { View, Text } from "react-native";

export function HistoryScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-dark-background">
      <Text className="text-xl font-semibold text-dark-text-primary">
        Workout History
      </Text>
      <Text className="mt-2 text-dark-text-secondary">
        Your completed workouts will appear here
      </Text>
    </View>
  );
}
