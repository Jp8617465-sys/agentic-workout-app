import { useMemo } from "react";
import { useUserStore } from "../../stores/userStore";
import { memoryService } from "./memory-service";

export function useMemoryContext(): string {
  const userId = useUserStore((s) => s.id);

  return useMemo(() => {
    if (!userId) return "";
    return memoryService.buildAIContext(userId);
  }, [userId]);
}
