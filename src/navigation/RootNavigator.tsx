import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TabNavigator } from "./TabNavigator";
import { colors } from "../constants/colors";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.dark.background },
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      {/* ActiveWorkout and PostWorkout screens will be added in Sprint 1 Week 3-4 */}
    </Stack.Navigator>
  );
}
