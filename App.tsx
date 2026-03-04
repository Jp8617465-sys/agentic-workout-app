import "./global.css";
import { StatusBar } from "expo-status-bar";
import { View, Text, ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { useDatabaseMigrations } from "./src/lib/migrate";
import { colors } from "./src/constants/colors";

const queryClient = new QueryClient();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.dark.background,
    card: colors.dark.surface,
    border: colors.dark.border,
    text: colors.dark.textPrimary,
    primary: colors.brand.primary,
  },
};

function AppContent() {
  const { success, error } = useDatabaseMigrations();

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-dark-background px-6">
        <Text className="text-lg font-semibold text-red-500">
          Database Error
        </Text>
        <Text className="mt-2 text-center text-dark-text-secondary">
          {error.message}
        </Text>
      </View>
    );
  }

  if (!success) {
    return (
      <View className="flex-1 items-center justify-center bg-dark-background">
        <ActivityIndicator size="large" color={colors.brand.primary} />
        <Text className="mt-4 text-dark-text-secondary">
          Setting up database...
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <RootNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
        <StatusBar style="light" />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
