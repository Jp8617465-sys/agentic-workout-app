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
  PreSessionTests: { workoutId: string; exerciseNames: string[] };
  ActiveWorkout: undefined;
  PostWorkout: { workoutId: string };
  InjuryManagement: undefined;
  Auth: undefined;
  MesocycleGeneration: undefined;
  MesocycleOverview: undefined;
  GoalReassessment: undefined;
  ProgressCharts: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
