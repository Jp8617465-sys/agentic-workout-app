import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { memoryService } from "../features/memory/memory-service";
import type { AgenticMemory, MemoryStats } from "../types";

interface MemoryState {
  memories: AgenticMemory[];
  stats: MemoryStats;
  isDetecting: boolean;
  lastDetectionAt: string | null;
  loadMemories: (userId: string) => void;
  runDetection: (userId: string) => void;
  refreshStats: (userId: string) => void;
  reset: () => void;
}

const emptyStats: MemoryStats = {
  total: 0,
  avgConfidence: 0,
  byType: { pattern: 0, preference: 0, adaptation: 0, warning: 0, success_factor: 0 },
};

const initialState = {
  memories: [] as AgenticMemory[],
  stats: emptyStats,
  isDetecting: false,
  lastDetectionAt: null as string | null,
};

export const useMemoryStore = create<MemoryState>()(
  persist(
    (set) => ({
      ...initialState,
      loadMemories: (userId: string) => {
        const memories = memoryService.getAllMemories(userId);
        const stats = memoryService.getStats(userId);
        set({ memories, stats });
      },
      runDetection: (userId: string) => {
        set({ isDetecting: true });
        try {
          memoryService.detectAndStore(userId);
          const memories = memoryService.getAllMemories(userId);
          const stats = memoryService.getStats(userId);
          set({
            memories,
            stats,
            isDetecting: false,
            lastDetectionAt: new Date().toISOString(),
          });
        } catch {
          set({ isDetecting: false });
        }
      },
      refreshStats: (userId: string) => {
        const stats = memoryService.getStats(userId);
        set({ stats });
      },
      reset: () => set(initialState),
    }),
    {
      name: "memory-store",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        lastDetectionAt: state.lastDetectionAt,
      }),
    },
  ),
);
