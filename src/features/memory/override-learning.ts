import type { MemoryContext } from "../../types/memory";
import { memoryRepository } from "./memory-repository";
import { memoryService } from "./memory-service";

export interface AdaptationChoiceInput {
  userId: string;
  exerciseName: string;
  aiSuggested: string;
  userChose: string;
  workoutContext?: MemoryContext;
}

export function recordAdaptationChoice(input: AdaptationChoiceInput): void {
  if (input.aiSuggested === input.userChose) return;

  memoryRepository.insertDisagreement({
    userId: input.userId,
    context: {
      exerciseName: input.exerciseName,
      ...(input.workoutContext ?? {}),
    },
    aiSuggested: input.aiSuggested,
    userChose: input.userChose,
  });
}

export function checkAndLearnFromOverrides(input: {
  userId: string;
  exerciseName: string;
  aiSuggested: string;
}): void {
  const disagreements = memoryRepository.findDisagreementsFor(
    input.userId,
    input.aiSuggested,
    10,
  );

  const relevantOverrides = disagreements.filter(
    (d) => d.context.exerciseName === input.exerciseName,
  );

  if (relevantOverrides.length < 3) return;

  const choiceCounts = new Map<string, number>();
  for (const d of relevantOverrides) {
    choiceCounts.set(d.userChose, (choiceCounts.get(d.userChose) ?? 0) + 1);
  }

  for (const [choice, count] of choiceCounts) {
    if (count >= 3) {
      memoryService.storeMemory({
        userId: input.userId,
        type: "preference",
        description: `Prefers "${choice}" over "${input.aiSuggested}" for ${input.exerciseName}`,
        context: { exerciseName: input.exerciseName },
        trigger: `AI suggested "${input.aiSuggested}"`,
        action: choice,
      });
    }
  }
}

export function getHistoricalContext(
  userId: string,
  exerciseName: string,
): string | null {
  const memories = memoryRepository.findRelevant(userId, {
    type: "preference",
    limit: 5,
  });

  const relevant = memories.find(
    (m) => m.context.exerciseName === exerciseName,
  );

  if (!relevant) return null;

  return `Last time this happened, you chose "${relevant.action}" and it ${
    relevant.successRate >= 0.5 ? "worked well" : "didn't help"
  } (${relevant.observations} observations)`;
}
