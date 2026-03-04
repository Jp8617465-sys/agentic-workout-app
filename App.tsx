import "./global.css";
import { StatusBar } from "expo-status-bar";
import { View, Text } from "react-native";

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-dark-background">
      <Text className="text-2xl font-bold text-dark-text-primary">
        Intelligent Trainer
      </Text>
      <Text className="mt-2 text-dark-text-secondary">Loading...</Text>
      <StatusBar style="light" />
    </View>
  );
}
