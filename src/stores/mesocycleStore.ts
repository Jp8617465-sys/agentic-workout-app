import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  Mesocycle,
  Microcycle,
  MesocyclePhase,
} from "../types";
import type { DailyPrescription, ExercisePrescription } from "../features/ai/deterministic-fallback";

interface MesocycleState {
  currentMesocycleId: string | null;
  currentMesocycle: Mesocycle | null;
  microcycles: Microcycle[];
  currentWeek: number;
  currentPhase: MesocyclePhase | null;
  todayPrescription: DailyPrescription | null;
  isGenerating: boolean;

  setCurrentMesocycle: (mesocycle: Mesocycle, microcycles: Microcycle[]) => void;
  refreshTodayPrescription: () => void;
  clearMesocycle: () => void;
  setIsGenerating: (generating: boolean) => void;
  reset: () => void;
}

function computeCurrentWeek(startDate: string): number {
  const start = new Date(startDate);
  const now = new Date();
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.floor(diffDays / 7) + 1);
}

const initialState = {
  currentMesocycleId: null as string | null,
  currentMesocycle: null as Mesocycle | null,
  microcycles: [] as Microcycle[],
  currentWeek: 0,
  currentPhase: null as MesocyclePhase | null,
  todayPrescription: null as DailyPrescription | null,
  isGenerating: false,
};

export const useMesocycleStore = create<MesocycleState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setCurrentMesocycle: (mesocycle, microcycles) => {
        const week = computeCurrentWeek(mesocycle.startDate);
        const currentMicrocycle = microcycles.find((mc) => mc.weekNumber === week);

        set({
          currentMesocycleId: mesocycle.id,
          currentMesocycle: mesocycle,
          microcycles,
          currentWeek: week,
          currentPhase: currentMicrocycle?.phase ?? null,
        });

        get().refreshTodayPrescription();
      },

      refreshTodayPrescription: () => {
        const { currentMesocycle, currentWeek } = get();
        if (!currentMesocycle) {
          set({ todayPrescription: null });
          return;
        }

        const plan = currentMesocycle.generatedPlan;
        const weekPlan = plan.weeks.find((w) => w.weekNumber === currentWeek);
        if (!weekPlan) {
          set({ todayPrescription: null });
          return;
        }

        const dayOfWeek = new Date().getDay();
        const session = weekPlan.sessions.find((s) => s.dayOfWeek === dayOfWeek);
        if (!session) {
          set({ todayPrescription: null });
          return;
        }

        const exercises: ExercisePrescription[] = session.exercises.map((ex) => {
          const repParts = ex.repRange.split("-");
          const targetReps = repParts.length > 1 ? parseInt(repParts[1], 10) : parseInt(repParts[0], 10);
          return {
            exerciseName: ex.exerciseName,
            sets: ex.sets,
            reps: isNaN(targetReps) ? 8 : targetReps,
            weight: 0,
            rpe: ex.targetRpe,
            progressionType: "maintain" as const,
          };
        });

        set({
          todayPrescription: {
            exercises,
            performanceScore: 0,
            deloadRecommended: weekPlan.phase === "deload",
            deloadReason: weekPlan.phase === "deload" ? "Scheduled deload week" : null,
            generatedAt: new Date().toISOString(),
            source: "mesocycle",
          },
        });
      },

      clearMesocycle: () => set(initialState),

      setIsGenerating: (generating) => set({ isGenerating: generating }),

      reset: () => set(initialState),
    }),
    {
      name: "mesocycle-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        currentMesocycleId: state.currentMesocycleId,
        currentMesocycle: state.currentMesocycle,
        microcycles: state.microcycles,
        currentWeek: state.currentWeek,
        currentPhase: state.currentPhase,
      }),
    },
  ),
);
