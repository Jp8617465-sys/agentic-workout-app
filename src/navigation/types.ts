import type { NavigatorScreenParams } from "@react-navigation/native";
import type { DailyPrescription } from "../features/ai/deterministic-fallback";

export type MainTabParamList = {
  HomeTab: undefined;
  HistoryTab: undefined;
  ExercisesTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  ActiveWorkout: { prescription?: DailyPrescription } | undefined;
  PostWorkout: { workoutId: string };
  InjuryManagement: undefined;
  Auth: undefined;
  MesocycleGeneration: undefined;
  MesocycleOverview: undefined;
  GoalReassessment: undefined;
  ProgressCharts: undefined;
  MemoryDashboard: undefined;
  ImportWorkouts: undefined;
  Mobility: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
