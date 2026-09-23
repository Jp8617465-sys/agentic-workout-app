import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  Mesocycle,
  Microcycle,
  MesocyclePhase,
} from "../types";
import type { DailyPrescription, ExercisePrescription } from "../features/ai/deterministic-fallback";
import { pickSession, targetRepsFromRange, weekStartDate } from "../features/programs/services/session-picker";
import { countCompletedProgramSessions, lastWorkingWeight } from "../features/programs/services/program-history";

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
        const { currentMesocycle, microcycles } = get();
        if (!currentMesocycle) {
          set({ todayPrescription: null });
          return;
        }

        const currentWeek = computeCurrentWeek(currentMesocycle.startDate);
        set({
          currentWeek,
          currentPhase: microcycles.find((mc) => mc.weekNumber === currentWeek)?.phase ?? null,
        });

        const plan = currentMesocycle.generatedPlan;
        const weekPlan = plan.weeks.find((w) => w.weekNumber === currentWeek);
        if (!weekPlan) {
          set({ todayPrescription: null });
          return;
        }

        const flexible = plan.flexibleSchedule === true;
        const session = pickSession(weekPlan, {
          flexible,
          dayOfWeek: new Date().getDay(),
          completedThisWeek: flexible
            ? countCompletedProgramSessions(currentMesocycle.id, weekStartDate(currentMesocycle.startDate, currentWeek))
            : 0,
        });
        if (!session) {
          set({ todayPrescription: null });
          return;
        }

        const exercises: ExercisePrescription[] = session.exercises.map((ex) => ({
          exerciseName: ex.exerciseName,
          sets: ex.sets,
          reps: targetRepsFromRange(ex.repRange),
          weight: lastWorkingWeight(ex.exerciseName) ?? 0,
          rpe: ex.targetRpe,
          progressionType: "maintain" as const,
        }));

        set({
          todayPrescription: {
            exercises,
            performanceScore: 0,
            deloadRecommended: weekPlan.phase === "deload",
            deloadReason: weekPlan.phase === "deload" ? "Scheduled deload week" : null,
            generatedAt: new Date().toISOString(),
            source: "mesocycle",
            sessionName: session.sessionType,
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
