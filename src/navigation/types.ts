import type { NavigatorScreenParams } from "@react-navigation/native";

export type MainTabParamList = {
  HomeTab: undefined;
  HistoryTab: undefined;
  ExercisesTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  ActiveWorkout: undefined;
  PostWorkout: { workoutId: string };
  InjuryManagement: undefined;
  Auth: undefined;
  MesocycleGeneration: undefined;
  MesocycleOverview: undefined;
  GoalReassessment: undefined;
  ProgressCharts: undefined;
  MemoryDashboard: undefined;
  PatternDetail: { memoryId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
