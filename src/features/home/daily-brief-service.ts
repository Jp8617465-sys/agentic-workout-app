import { supabase } from "../../lib/supabase";
import { dailyBriefRepository } from "./daily-brief-repository";
import type { DailyBrief, BriefExercise, ReadinessLog } from "./types";
import type { DailyPrescription } from "../ai/deterministic-fallback";

const EDGE_TIMEOUT_MS = 12_000;

interface BriefContext {
  userId: string;
  today: string;
  prescription: DailyPrescription | null;
  phase: string | null;
  weekNumber: number;
  readiness: ReadinessLog | null;
}

function prescriptionToExercises(prescription: DailyPrescription): BriefExercise[] {
  return prescription.exercises.map((ex) => ({
    exerciseName: ex.exerciseName,
    sets: ex.sets,
    reps: ex.reps,
    weight: ex.weight > 0 ? ex.weight : null,
    rpe: ex.rpe > 0 ? ex.rpe : null,
  }));
}

function estimateDuration(exercises: BriefExercise[], restSeconds = 120): number {
  // Roughly: sets × (work time + rest) + warm-up
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
  return Math.round((totalSets * (30 + restSeconds)) / 60 + 10);
}

function buildDeterministicBrief(ctx: BriefContext): Omit<DailyBrief, "id" | "createdAt" | "rationale"> {
  if (ctx.prescription) {
    const exercises = prescriptionToExercises(ctx.prescription);
    return {
      userId: ctx.userId,
      date: ctx.today,
      sessionType: ctx.prescription.exercises.length > 0 ? "Workout" : "Rest",
      estimatedDurationMinutes: estimateDuration(exercises),
      phase: ctx.phase,
      weekNumber: ctx.weekNumber,
      exercises,
      source: "mesocycle",
    };
  }

  // No prescription — suggest a default short session
  return {
    userId: ctx.userId,
    date: ctx.today,
    sessionType: "Custom",
    estimatedDurationMinutes: 45,
    phase: null,
    weekNumber: 0,
    exercises: [],
    source: "deterministic",
  };
}

async function callAIBrief(ctx: BriefContext, token: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), EDGE_TIMEOUT_MS);

  try {
    const { data, error } = await supabase.functions.invoke("ai-coach", {
      body: {
        mode: "daily_brief",
        userId: ctx.userId,
        exercises: ctx.prescription?.exercises ?? [],
        readiness: ctx.readiness
          ? {
              energy: ctx.readiness.energy,
              soreness: ctx.readiness.soreness,
              motivation: ctx.readiness.motivation,
            }
          : null,
        phase: ctx.phase,
        weekNumber: ctx.weekNumber,
      },
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (error) return null;
    return (data as { rationale?: string })?.rationale ?? null;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

export async function getDailyBrief(ctx: BriefContext): Promise<DailyBrief> {
  // 1. SQLite cache — valid for the whole day
  const cached = dailyBriefRepository.findByDate(ctx.userId, ctx.today);
  if (cached) return cached;

  // 2. Build deterministic brief (always works offline)
  const briefData = buildDeterministicBrief(ctx);
  const saved = dailyBriefRepository.upsert(briefData);

  // 3. Try to enrich with AI rationale in the background (non-blocking)
  (async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      const rationale = await callAIBrief(ctx, token);
      if (rationale) {
        saved.rationale = rationale;
      }
    } catch {
      // ignore — rationale is optional
    }
  })();

  return saved;
}
