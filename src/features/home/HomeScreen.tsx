import { View, Text, Pressable } from "react-native";
import { colors } from "../../constants/colors";

export function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-dark-background px-6">
      <Text className="text-3xl font-bold text-dark-text-primary">
        Intelligent Trainer
      </Text>
      <Text className="mt-2 text-center text-dark-text-secondary">
        Your AI-powered workout companion
      </Text>
      <Pressable
        className="mt-8 rounded-xl px-8 py-4"
        style={{ backgroundColor: colors.brand.primary, minHeight: 48 }}
      >
        <Text className="text-lg font-semibold text-white">
          Start Workout
        </Text>
      </Pressable>
    </View>
  );
}
