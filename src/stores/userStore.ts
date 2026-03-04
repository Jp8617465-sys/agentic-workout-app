import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ExperienceLevel, TrainingGoal, UnitSystem } from "../types";

interface UserState {
  id: string | null;
  name: string;
  experienceLevel: ExperienceLevel;
  trainingGoal: TrainingGoal;
  unitSystem: UnitSystem;
  isOnboardingComplete: boolean;
  supabaseUserId: string | null;
  setUser: (user: Partial<Pick<UserState, "id" | "name" | "experienceLevel" | "trainingGoal" | "unitSystem" | "supabaseUserId">>) => void;
  completeOnboarding: () => void;
  reset: () => void;
}

const initialState = {
  id: null,
  name: "",
  experienceLevel: "beginner" as ExperienceLevel,
  trainingGoal: "general_fitness" as TrainingGoal,
  unitSystem: "metric" as UnitSystem,
  isOnboardingComplete: false,
  supabaseUserId: null,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...initialState,
      setUser: (user) => set(user),
      completeOnboarding: () => set({ isOnboardingComplete: true }),
      reset: () => set(initialState),
    }),
    {
      name: "user-store",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
