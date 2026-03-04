import type {
  AgenticMemory,
  MemoryType,
  NewMemoryInput,
} from "../../types/memory";
import { memoryRepository } from "./memory-repository";
import { detectPatterns } from "./pattern-detector";
import { MEMORY_BUDGET } from "./confidence-calculator";

export const memoryService = {
  storeMemory(input: NewMemoryInput): string {
    const existing = memoryRepository.findByDescription(
      input.userId,
      input.type,
      input.description,
    );

    if (existing) {
      memoryRepository.reinforceMemory(existing.id);
      return existing.id;
    }

    const id = memoryRepository.insert(input);
    memoryRepository.pruneExpired(input.userId, MEMORY_BUDGET);
    return id;
  },

  storeAdaptation(memoryId: string, success: boolean): void {
    memoryRepository.recordOutcome(memoryId, success);
  },

  extractAndStorePatterns(userId: string): void {
    const { memories } = detectPatterns(userId);

    for (const mem of memories) {
      this.storeMemory(mem);
    }
  },

  retrieveRelevant(
    userId: string,
    options?: { type?: MemoryType; limit?: number },
  ): AgenticMemory[] {
    return memoryRepository.findRelevant(userId, options);
  },

  buildAIContext(userId: string): string {
    const memories = memoryRepository.findRelevant(userId, { limit: 5 });

    if (memories.length === 0) return "";

    const lines = memories.map(
      (m, i) =>
        `${i + 1}. [${m.type}] ${m.description} (confidence: ${Math.round(m.confidence * 100)}%, observed ${m.observations}x)`,
    );

    return [
      "Learned patterns about this athlete:",
      ...lines,
    ].join("\n");
  },
};
