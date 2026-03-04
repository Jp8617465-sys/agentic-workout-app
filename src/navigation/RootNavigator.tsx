import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TabNavigator } from "./TabNavigator";
import { ActiveWorkoutScreen } from "../features/workouts/ActiveWorkoutScreen";
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
      <Stack.Screen
        name="ActiveWorkout"
        component={ActiveWorkoutScreen}
        options={{
          presentation: "fullScreenModal",
          gestureEnabled: false,
          animation: "slide_from_bottom",
        }}
      />
    </Stack.Navigator>
  );
}
