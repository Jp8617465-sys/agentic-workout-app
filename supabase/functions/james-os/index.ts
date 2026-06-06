import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Anthropic from "https://esm.sh/@anthropic-ai/sdk@0.27.0";
import { loadKBContext } from "./kb-loader.ts";
import { buildSystemPrompt } from "./system-prompt.ts";
import { runDT01, runDT03, filterExercisesForConstraints } from "./dt-engine.ts";
import type { DT01Input, DT03Input } from "./dt-engine.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

function err(message: string, status = 400): Response {
  return json({ error: message }, status);
}

// Re-derives active constraints from the live injuries table.
// This is the source of truth — james_state.active_constraints is just a cache.
async function deriveActiveConstraints(
  adminClient: ReturnType<typeof createClient>,
  userId: string
): Promise<string[]> {
  const { data, error } = await adminClient
    .from("injuries")
    .select("type, status")
    .eq("user_id", userId)
    .in("status", ["acute", "chronic", "recovering"]);

  if (error || !data) return [];

  return data.map((row: { type: string }) => row.type.toLowerCase().replace(/\s+/g, "_"));
}

async function refreshStateConstraints(
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  constraints: string[]
): Promise<void> {
  await adminClient
    .from("james_state")
    .upsert({ user_id: userId, active_constraints: constraints, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  // ─── Auth ─────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return err("Missing Authorization header", 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY")!;

  // User-scoped client (respects RLS)
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  // Admin client (bypasses RLS — only for reading shared data + writing on behalf of user)
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: { user }, error: authErr } = await userClient.auth.getUser();
  if (authErr || !user) return err("Invalid token", 401);

  const userId = user.id;

  // ─── Parse request ────────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body");
  }

  const mode = body.mode as string | undefined;
  if (!mode) return err("Missing 'mode' field");

  const todayDate = new Date().toISOString().split("T")[0];

  // ─── wellness_checkin ─────────────────────────────────────────────────────
  if (mode === "wellness_checkin") {
    const { soreness, energy, mood, stress, notes } = body as {
      soreness?: number; energy?: number; mood?: number; stress?: number; notes?: string;
    };

    if (!soreness || !energy || !mood || !stress) {
      return err("wellness_checkin requires soreness, energy, mood, stress (1–5)");
    }

    const { error: insertErr } = await adminClient.from("james_wellness_log").upsert({
      user_id: userId,
      log_date: todayDate,
      soreness,
      energy,
      mood,
      stress,
      notes: notes ?? null,
    }, { onConflict: "user_id,log_date" });

    if (insertErr) return err(`Failed to save wellness log: ${insertErr.message}`, 500);

    return json({ success: true, date: todayDate, wellness_score: soreness + energy + mood + stress });
  }

  // ─── state_sync ───────────────────────────────────────────────────────────
  if (mode === "state_sync") {
    const constraints = await deriveActiveConstraints(adminClient, userId);
    await refreshStateConstraints(adminClient, userId, constraints);

    const [{ data: state }, { data: wellness }, { data: notes }] = await Promise.all([
      adminClient.from("james_state").select("*").eq("user_id", userId).maybeSingle(),
      adminClient.from("james_wellness_log").select("*").eq("user_id", userId).order("log_date", { ascending: false }).limit(3),
      adminClient.from("james_session_notes").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(1),
    ]);

    return json({ state, recentWellness: wellness, lastSessionNotes: notes?.[0] ?? null, activeConstraints: constraints });
  }

  // ─── load_recommendation ──────────────────────────────────────────────────
  if (mode === "load_recommendation") {
    const constraints = await deriveActiveConstraints(adminClient, userId);
    const input = body.input as DT03Input | undefined;

    if (!input) return err("load_recommendation requires 'input' (DT03Input)");

    const dt03Result = runDT03({ ...input, activeConstraints: constraints });

    await adminClient.from("james_adjustment_log").insert({
      user_id: userId,
      workout_id: (body.workout_id as string) ?? null,
      exercise_name: input.exerciseName,
      decision_tree: "DT-03",
      input_snapshot: { ...input, activeConstraints: constraints },
      recommended_action: `${dt03Result.recommendedWeight}kg × ${dt03Result.sets}×${dt03Result.reps}`,
      rationale: dt03Result.rationale,
    });

    return json({ ...dt03Result, activeConstraints: constraints });
  }

  // ─── coaching_session ─────────────────────────────────────────────────────
  if (mode === "coaching_session") {
    // 1. Derive live constraints and run DT-01
    const constraints = await deriveActiveConstraints(adminClient, userId);
    await refreshStateConstraints(adminClient, userId, constraints);

    const { data: wellnessRow } = await adminClient
      .from("james_wellness_log")
      .select("*")
      .eq("user_id", userId)
      .eq("log_date", todayDate)
      .maybeSingle();

    const { data: stateRow } = await adminClient
      .from("james_state")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const dt01Input: DT01Input = {
      wellnessScore: wellnessRow?.wellness_score ?? 12,
      lastSessionRpe: stateRow?.last_session_rpe ?? null,
      consecutiveHighRpeSessions: stateRow?.consecutive_high_rpe_sessions ?? 0,
      daysSinceLastSession: stateRow?.last_session_date
        ? Math.floor((Date.now() - new Date(stateRow.last_session_date).getTime()) / 86400000)
        : 999,
    };

    const dt01Result = runDT01(dt01Input);

    // Log DT-01 decision
    await adminClient.from("james_adjustment_log").insert({
      user_id: userId,
      workout_id: (body.workout_id as string) ?? null,
      decision_tree: "DT-01",
      input_snapshot: dt01Input,
      recommended_action: dt01Result.sessionType,
      rationale: dt01Result.rationale,
    });

    // 2. Build system prompt with KB context
    const [kbContext] = await Promise.all([loadKBContext()]);
    const systemPrompt = await buildSystemPrompt(adminClient, userId, kbContext, todayDate);

    // 3. Call Claude
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const userMessage = (body.message as string | undefined) ?? "Generate today's coaching session brief.";

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `DT-01 assessment: ${dt01Result.sessionType} (volume ×${dt01Result.volumeModifier}, intensity ×${dt01Result.intensityModifier}). ${dt01Result.rationale}\n\nActive constraints: ${constraints.length > 0 ? constraints.join(", ") : "none"}.\n\n${userMessage}`,
        },
      ],
    });

    const coachingContent = response.content[0]?.type === "text" ? response.content[0].text : "";

    // 4. Parse SOAP from response and save to james_session_notes
    // Simple heuristic split — the prompt instructs SOAP format.
    const soapSections = parseSOAP(coachingContent);
    const { data: noteRow } = await adminClient.from("james_session_notes").insert({
      user_id: userId,
      workout_id: (body.workout_id as string) ?? null,
      subjective: soapSections.S,
      objective: soapSections.O,
      assessment: soapSections.A,
      plan: soapSections.P,
      constraint_flags: constraints,
    }).select("id").single();

    return json({
      sessionType: dt01Result.sessionType,
      volumeModifier: dt01Result.volumeModifier,
      intensityModifier: dt01Result.intensityModifier,
      dt01Rationale: dt01Result.rationale,
      activeConstraints: constraints,
      coaching: coachingContent,
      noteId: noteRow?.id ?? null,
    });
  }

  return err(`Unknown mode: ${mode}`);
});

// ─── SOAP parser ─────────────────────────────────────────────────────────────
function parseSOAP(text: string): { S: string; O: string; A: string; P: string } {
  const sections = { S: "", O: "", A: "", P: "" };
  const patterns: Array<{ key: keyof typeof sections; re: RegExp }> = [
    { key: "S", re: /\*{0,2}S(?:ubjective)?[:\s*]+(.+?)(?=\*{0,2}[SOAP](?:ubjective|bjective|ssessment|lan)?[:\s*]|$)/si },
    { key: "O", re: /\*{0,2}O(?:bjective)?[:\s*]+(.+?)(?=\*{0,2}[SOAP](?:ubjective|bjective|ssessment|lan)?[:\s*]|$)/si },
    { key: "A", re: /\*{0,2}A(?:ssessment)?[:\s*]+(.+?)(?=\*{0,2}[SOAP](?:ubjective|bjective|ssessment|lan)?[:\s*]|$)/si },
    { key: "P", re: /\*{0,2}P(?:lan)?[:\s*]+(.+?)(?=\*{0,2}[SOAP](?:ubjective|bjective|ssessment|lan)?[:\s*]|$)/si },
  ];

  for (const { key, re } of patterns) {
    const match = text.match(re);
    if (match?.[1]) sections[key] = match[1].trim();
  }

  // Fallback: if no SOAP sections found, store entire response in assessment
  if (!sections.S && !sections.O && !sections.A && !sections.P) {
    sections.A = text.trim();
  }

  return sections;
}
