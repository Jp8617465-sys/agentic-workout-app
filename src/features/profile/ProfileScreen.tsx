import { View, Text } from "react-native";

export function ProfileScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-dark-background">
      <Text className="text-xl font-semibold text-dark-text-primary">
        Profile
      </Text>
      <Text className="mt-2 text-dark-text-secondary">
        Your settings and stats
      </Text>
    </View>
  );
}
