import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SettingsState {
  hapticsEnabled: boolean;
  defaultRestSeconds: {
    compound: number;
    isolation: number;
    cardio: number;
  };
  theme: "dark" | "light" | "system";
  setHapticsEnabled: (enabled: boolean) => void;
  setDefaultRestSeconds: (type: "compound" | "isolation" | "cardio", seconds: number) => void;
  setTheme: (theme: "dark" | "light" | "system") => void;
  reset: () => void;
}

const initialState = {
  hapticsEnabled: true,
  defaultRestSeconds: {
    compound: 180,
    isolation: 90,
    cardio: 30,
  },
  theme: "dark" as const,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...initialState,
      setHapticsEnabled: (enabled) => set({ hapticsEnabled: enabled }),
      setDefaultRestSeconds: (type, seconds) =>
        set((state) => ({
          defaultRestSeconds: { ...state.defaultRestSeconds, [type]: seconds },
        })),
      setTheme: (theme) => set({ theme }),
      reset: () => set(initialState),
    }),
    {
      name: "settings-store",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
