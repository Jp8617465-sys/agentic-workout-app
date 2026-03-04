// @ts-nocheck — Deno runtime
import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "npm:@supabase/supabase-js";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { mode, userId, workoutId, experienceLevel } = body;

    if (!mode) {
      return new Response(JSON.stringify({ error: "mode is required" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const anthropic = new Anthropic({
      apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
    });

    if (mode === "daily_prescription") {
      const message = await anthropic.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `You are an expert strength coach. Generate a daily workout prescription for a ${experienceLevel} level athlete (user: ${userId}).

Return a JSON object matching this schema:
{
  "exercises": [
    {
      "exerciseName": string,
      "sets": number,
      "reps": number,
      "weight": number,
      "rpe": number,
      "progressionType": "weight" | "reps" | "deload" | "maintain"
    }
  ],
  "performanceScore": number,
  "deloadRecommended": boolean,
  "deloadReason": string | null,
  "generatedAt": string (ISO),
  "source": "ai"
}

Recommend 4-6 exercises appropriate for the athlete's level. Return only valid JSON.`,
          },
        ],
      });

      const text = message.content[0].type === "text" ? message.content[0].text : "{}";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const prescription = jsonMatch ? JSON.parse(jsonMatch[0]) : { exercises: [], source: "ai" };

      return new Response(JSON.stringify(prescription), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (mode === "post_workout_analysis") {
      const message = await anthropic.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 512,
        messages: [
          {
            role: "user",
            content: `You are an expert strength coach. Provide a brief, encouraging 2-3 sentence post-workout analysis for workout ${workoutId}. Focus on recovery, adaptation, and what the athlete did well. Keep it positive and specific.`,
          },
        ],
      });

      const analysis = message.content[0].type === "text" ? message.content[0].text : "";

      return new Response(JSON.stringify({ analysis }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (mode === "mesocycle_generation") {
      const {
        trainingGoal,
        weeklyFrequency,
        availableEquipment,
        injuries,
        periodizationModel,
        durationWeeks,
      } = body;

      const message = await anthropic.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: `You are an expert strength coach designing a ${durationWeeks}-week mesocycle using ${periodizationModel} periodization.

Athlete profile:
- Experience: ${experienceLevel}
- Goal: ${trainingGoal}
- Weekly frequency: ${weeklyFrequency} days
- Available equipment: ${JSON.stringify(availableEquipment)}
- Current injuries: ${JSON.stringify(injuries ?? [])}

Generate a complete mesocycle plan as JSON matching this schema exactly:
{
  "name": string,
  "durationWeeks": ${durationWeeks},
  "periodizationModel": "${periodizationModel}",
  "goal": "${trainingGoal}",
  "weeks": [
    {
      "weekNumber": number,
      "phase": "accumulation" | "intensification" | "realization" | "deload",
      "sessions": [
        {
          "dayOfWeek": number (0=Sunday..6=Saturday),
          "sessionType": string,
          "exercises": [
            {
              "exerciseName": string,
              "sets": number,
              "repRange": string (e.g. "8-12"),
              "targetRpe": number,
              "restSeconds": number,
              "notes": string | null
            }
          ],
          "estimatedDurationMinutes": number
        }
      ]
    }
  ]
}

Rules:
- Include exactly ${weeklyFrequency} sessions per week
- Only prescribe exercises that use the available equipment
- Avoid exercises contraindicated by injuries
- Follow ${periodizationModel} periodization principles for phase progression
- Include a deload week every 4th week (or as appropriate for the model)
- Return only valid JSON`,
          },
        ],
      });

      const text = message.content[0].type === "text" ? message.content[0].text : "{}";
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const plan = jsonMatch ? JSON.parse(jsonMatch[0]) : { weeks: [] };

      return new Response(JSON.stringify(plan), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    if (mode === "milestone_review") {
      const { weekRange, workoutData } = body;

      const message = await anthropic.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `You are an expert strength coach reviewing a training block (weeks ${weekRange?.[0]}-${weekRange?.[1]}).

Workout data summary:
${JSON.stringify(workoutData ?? {})}

Provide a concise milestone review covering:
1. Volume adherence (actual vs target)
2. Performance trends (improving, stalling, declining)
3. Recovery status assessment
4. Specific recommendations for the next phase

Keep the review to 3-4 paragraphs. Be specific and actionable.`,
          },
        ],
      });

      const review = message.content[0].type === "text" ? message.content[0].text : "";

      return new Response(JSON.stringify({ review }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown mode: ${mode}` }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
