import { supabase } from "../../lib/supabase";
import { aiCacheRepository } from "./ai-cache-repository";
import { getDeterministicPrescription, type DailyPrescription } from "./deterministic-fallback";
import type { ExperienceLevel } from "../../types";

const DETERMINISTIC_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours
const AI_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const EDGE_FUNCTION_TIMEOUT_MS = 15_000;

function prescriptionCacheKey(userId: string): string {
  const today = new Date().toISOString().split("T")[0];
  return `prescription:${userId}:${today}`;
}

function postWorkoutCacheKey(workoutId: string): string {
  return `post_workout:${workoutId}`;
}

async function callEdgeFunction(
  mode: string,
  payload: Record<string, unknown>,
  authToken: string,
): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EDGE_FUNCTION_TIMEOUT_MS);

  try {
    const { data, error } = await supabase.functions.invoke("ai-coach", {
      body: { mode, ...payload },
      headers: { Authorization: `Bearer ${authToken}` },
    });
    clearTimeout(timer);
    if (error) throw error;
    return data;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

export const AIService = {
  async getDailyPrescription(
    userId: string,
    experienceLevel: ExperienceLevel,
    memoryContext?: string,
  ): Promise<DailyPrescription> {
    const cacheKey = prescriptionCacheKey(userId);

    // 1. Check SQLite cache
    const cached = aiCacheRepository.get(userId, cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as DailyPrescription;
      } catch {
        // ignore corrupt cache
      }
    }

    // 2. Try Supabase Edge Function
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (token) {
        const response = await callEdgeFunction(
          "daily_prescription",
          { userId, experienceLevel, memoryContext },
          token,
        );

        const prescription = response as DailyPrescription;
        prescription.source = "ai";
        aiCacheRepository.set(userId, cacheKey, JSON.stringify(prescription), AI_TTL_MS);
        return prescription;
      }
    } catch {
      // Fall through to deterministic
    }

    // 3. Deterministic fallback (always offline-capable)
    const prescription = getDeterministicPrescription(userId, experienceLevel);
    aiCacheRepository.set(userId, cacheKey, JSON.stringify(prescription), DETERMINISTIC_TTL_MS);
    return prescription;
  },

  async getPostWorkoutAnalysis(workoutId: string, userId: string): Promise<string | null> {
    const cacheKey = postWorkoutCacheKey(workoutId);

    const cached = aiCacheRepository.get(userId, cacheKey);
    if (cached) return cached;

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return null;

      const response = await callEdgeFunction(
        "post_workout_analysis",
        { workoutId, userId },
        token,
      );
      const analysis = (response as { analysis: string }).analysis ?? null;

      if (analysis) {
        aiCacheRepository.set(userId, cacheKey, analysis, AI_TTL_MS);
      }
      return analysis;
    } catch {
      return null;
    }
  },
};
