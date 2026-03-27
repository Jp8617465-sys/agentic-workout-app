import { memoryRepository } from "./memory-repository";
import { detectPatterns } from "./pattern-detector";
import type { AgenticMemory, MemoryContext, MemoryStats, PatternDetectionResult } from "../../types";

const DISAGREEMENT_THRESHOLD = 3;

export const memoryService = {
  detectAndStore(userId: string): number {
    const patterns = detectPatterns(userId);
    let stored = 0;

    for (const pattern of patterns) {
      const existing = memoryRepository.findExisting(userId, pattern.type, pattern.context);

      if (existing) {
        // Update existing memory with new observations
        memoryRepository.update(existing.id, {
          observations: existing.observations + 1,
          confidence: Math.max(existing.confidence, pattern.confidence),
          successRate: (existing.successRate + pattern.successRate) / 2,
          description: pattern.description,
          action: pattern.action,
        });
        memoryRepository.reinforce(existing.id);
      } else {
        memoryRepository.insert({
          userId,
          type: pattern.type,
          description: pattern.description,
          context: pattern.context,
          confidence: pattern.confidence,
          trigger: pattern.trigger,
          action: pattern.action,
          observations: pattern.observations,
          successRate: pattern.successRate,
        });
        stored++;
      }
    }

    // Enforce 500-memory budget
    memoryRepository.prune(userId);

    return stored;
  },

  getRelevantMemories(userId: string, context: MemoryContext): AgenticMemory[] {
    return memoryRepository.findRelevant(userId, context, 5);
  },

  recordDisagreement(
    userId: string,
    context: MemoryContext,
    aiSuggested: string,
    userChose: string,
  ): void {
    // Check if there's a pattern of disagreement
    const existing = memoryRepository.findExisting(userId, "preference", context);

    if (existing) {
      const newObs = existing.observations + 1;
      memoryRepository.update(existing.id, {
        observations: newObs,
        description: `User prefers "${userChose}" over AI suggestion "${aiSuggested}"`,
        action: `Use "${userChose}" instead of "${aiSuggested}"`,
        confidence: Math.min(1.0, newObs / 10),
        successRate: Math.min(1.0, newObs / DISAGREEMENT_THRESHOLD),
      });
    } else {
      memoryRepository.insert({
        userId,
        type: "preference",
        description: `User chose "${userChose}" over AI suggestion "${aiSuggested}"`,
        context,
        confidence: 0.2,
        trigger: `AI suggestion: ${aiSuggested}`,
        action: `Use "${userChose}" instead`,
        observations: 1,
        successRate: 0.3,
      });
    }
  },

  recordApplicationResult(memoryId: string, success: boolean): void {
    memoryRepository.recordApplication(memoryId, success);
  },

  getStats(userId: string): MemoryStats {
    return memoryRepository.getStats(userId);
  },

  getAllMemories(userId: string, limit = 50): AgenticMemory[] {
    return memoryRepository.findByUser(userId, limit);
  },

  getMemoriesByType(userId: string, type: AgenticMemory["type"]): AgenticMemory[] {
    return memoryRepository.findByType(userId, type);
  },

  applyMemoriesToPrescription(
    prescription: { exerciseName: string; weight: number; rpe: number; sets: number; reps: number },
    memories: AgenticMemory[],
  ): { weight: number; rpe: number; sets: number; reps: number; memoryNotes: string[] } {
    let { weight, rpe, sets, reps } = prescription;
    const memoryNotes: string[] = [];

    for (const memory of memories) {
      if (memory.confidence < 0.4) continue;

      if (
        memory.type === "pattern" &&
        memory.context.exercise === prescription.exerciseName &&
        memory.action.indexOf("RPE") >= 0
      ) {
        // Extract RPE target from action string
        const rpeMatch = memory.action.match(/(\d+\.?\d*)/);
        if (rpeMatch) {
          const suggestedRpe = parseFloat(rpeMatch[1]);
          if (suggestedRpe >= 5 && suggestedRpe <= 10) {
            rpe = suggestedRpe;
            memoryNotes.push(`RPE adjusted to ${suggestedRpe} based on ${memory.observations} past sessions`);
          }
        }
      }

      if (
        memory.type === "pattern" &&
        memory.context.exercise === prescription.exerciseName &&
        memory.action.indexOf("load increase") >= 0
      ) {
        const pctMatch = memory.action.match(/([-+]?\d+\.?\d*)%/);
        if (pctMatch) {
          const pct = parseFloat(pctMatch[1]) / 100;
          if (Math.abs(pct) < 0.15) {
            weight = Math.round(weight * (1 + pct) * 2) / 2;
            memoryNotes.push(`Load adjusted by ${pctMatch[1]}% based on progression pattern`);
          }
        }
      }

      if (memory.type === "warning" && memory.confidence > 0.5) {
        memoryNotes.push(memory.description);
      }
    }

    return { weight, rpe, sets, reps, memoryNotes };
  },
};
