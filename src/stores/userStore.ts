import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ExperienceLevel, TrainingGoal, UnitSystem, Equipment } from "../types";

interface UserState {
  id: string | null;
  name: string;
  experienceLevel: ExperienceLevel;
  trainingGoal: TrainingGoal;
  unitSystem: UnitSystem;
  availableEquipment: Equipment[];
  weeklyFrequency: number;
  isOnboardingComplete: boolean;
  supabaseUserId: string | null;
  reEntrySessionsRemaining: number;
  reEntryLoadReduction: number;
  reEntryRpeCap: number | null;
  setUser: (user: Partial<Pick<UserState, "id" | "name" | "experienceLevel" | "trainingGoal" | "unitSystem" | "supabaseUserId">>) => void;
  setEquipment: (equipment: Equipment[]) => void;
  setFrequency: (frequency: number) => void;
  completeOnboarding: () => void;
  setReEntryState: (sessions: number, loadReduction: number, rpeCap: number | null) => void;
  decrementReEntry: () => void;
  clearReEntry: () => void;
  reset: () => void;
}

const initialState = {
  id: null,
  name: "",
  experienceLevel: "beginner" as ExperienceLevel,
  trainingGoal: "general_fitness" as TrainingGoal,
  unitSystem: "metric" as UnitSystem,
  availableEquipment: ["bodyweight"] as Equipment[],
  weeklyFrequency: 3,
  isOnboardingComplete: false,
  supabaseUserId: null,
  reEntrySessionsRemaining: 0,
  reEntryLoadReduction: 0,
  reEntryRpeCap: null as number | null,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      ...initialState,
      setUser: (user) => set(user),
      setEquipment: (equipment) => set({ availableEquipment: equipment }),
      setFrequency: (frequency) => set({ weeklyFrequency: frequency }),
      completeOnboarding: () => set({ isOnboardingComplete: true }),
      setReEntryState: (sessions, loadReduction, rpeCap) =>
        set({
          reEntrySessionsRemaining: sessions,
          reEntryLoadReduction: loadReduction,
          reEntryRpeCap: rpeCap,
        }),
      decrementReEntry: () =>
        set((state) => ({
          reEntrySessionsRemaining: Math.max(0, state.reEntrySessionsRemaining - 1),
        })),
      clearReEntry: () =>
        set({
          reEntrySessionsRemaining: 0,
          reEntryLoadReduction: 0,
          reEntryRpeCap: null,
        }),
      reset: () => set(initialState),
    }),
    {
      name: "user-store",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
