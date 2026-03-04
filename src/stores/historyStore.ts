import { create } from "zustand";
import type { Workout } from "../types";

interface PersonalRecord {
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
}

interface HistoryState {
  recentWorkouts: Workout[];
  personalRecords: Map<string, PersonalRecord>;
  setRecentWorkouts: (workouts: Workout[]) => void;
  addWorkout: (workout: Workout) => void;
  setPersonalRecord: (record: PersonalRecord) => void;
  getPersonalRecord: (exerciseName: string) => PersonalRecord | undefined;
  reset: () => void;
}

export const useHistoryStore = create<HistoryState>()((set, get) => ({
  recentWorkouts: [],
  personalRecords: new Map(),
  setRecentWorkouts: (workouts) => set({ recentWorkouts: workouts }),
  addWorkout: (workout) =>
    set((state) => ({
      recentWorkouts: [workout, ...state.recentWorkouts].slice(0, 50),
    })),
  setPersonalRecord: (record) =>
    set((state) => {
      const records = new Map(state.personalRecords);
      records.set(record.exerciseName, record);
      return { personalRecords: records };
    }),
  getPersonalRecord: (exerciseName) => get().personalRecords.get(exerciseName),
  reset: () => set({ recentWorkouts: [], personalRecords: new Map() }),
}));
