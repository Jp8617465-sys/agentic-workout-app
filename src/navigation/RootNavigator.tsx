import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TabNavigator } from "./TabNavigator";
import { ActiveWorkoutScreen } from "../features/workouts/ActiveWorkoutScreen";
import { PostWorkoutScreen } from "../features/workouts/PostWorkoutScreen";
import { InjuryManagementScreen } from "../features/injuries/InjuryManagementScreen";
import { AuthScreen } from "../features/auth/AuthScreen";
import { OnboardingScreen } from "../features/onboarding/OnboardingScreen";
import { MesocycleGenerationScreen } from "../features/programs/MesocycleGenerationScreen";
import { MesocycleOverviewScreen } from "../features/programs/MesocycleOverviewScreen";
import { GoalReassessmentScreen } from "../features/programs/GoalReassessmentScreen";
import { ProgressChartsScreen } from "../features/progress/ProgressChartsScreen";
import { PeriodReportScreen } from "../features/progress/PeriodReportScreen";
import { useUserStore } from "../stores/userStore";
import { useAuth } from "../features/auth/useAuth";
import { colors } from "../constants/colors";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { session, loading } = useAuth();
  const isOnboardingComplete = useUserStore((s) => s.isOnboardingComplete);

  if (loading) return null;

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.dark.background },
      }}
    >
      {!session ? (
        <Stack.Screen name="Auth" component={AuthScreen} />
      ) : !isOnboardingComplete ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      ) : (
        <>
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
      <Stack.Screen
        name="PostWorkout"
        component={PostWorkoutScreen}
        options={{
          presentation: "card",
          gestureEnabled: false,
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="InjuryManagement"
        component={InjuryManagementScreen}
        options={{
          headerShown: false,
          presentation: "card",
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="MesocycleGeneration"
        component={MesocycleGenerationScreen}
        options={{
          presentation: "fullScreenModal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="MesocycleOverview"
        component={MesocycleOverviewScreen}
        options={{
          presentation: "card",
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="GoalReassessment"
        component={GoalReassessmentScreen}
        options={{
          presentation: "card",
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="ProgressCharts"
        component={ProgressChartsScreen}
        options={{
          presentation: "card",
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="PeriodReport"
        component={PeriodReportScreen}
        options={{
          presentation: "card",
          animation: "slide_from_right",
        }}
      />
        </>
      )}
    </Stack.Navigator>
  );
}
