import type { NavigatorScreenParams } from "@react-navigation/native";

export type MainTabParamList = {
  HomeTab: undefined;
  HistoryTab: undefined;
  ExercisesTab: undefined;
  ProfileTab: undefined;
};

export type RootStackParamList = {
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  ActiveWorkout: undefined;
  PostWorkout: { workoutId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
