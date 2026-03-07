import { createClient } from "@supabase/supabase-js";
import { v5 as uuidv5 } from "uuid";

const EXERCISE_NAMESPACE_UUID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

interface BackfillResult {
  success: boolean;
  message: string;
  updatedCount: number;
  errors: string[];
}

/**
 * Backfill exercise UUIDs in the Supabase cloud database.
 * This edge function handles the initial migration of exercises to use UUIDs.
 *
 * Phases:
 * 1. Backfill exercises table with exerciseIds
 * 2. Backfill injury_risks with exerciseIds
 * 3. Backfill exercise_performances with exerciseIds
 * 4. Backfill personal_records with exerciseIds
 */
Deno.serve(async (req: Request) => {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const token = authHeader.substring("Bearer ".length);
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  );

  try {
    const result = await backfillExerciseUUIDs(supabase);
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Backfill error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Backfill failed",
        updatedCount: 0,
        errors: [String(error)],
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});

async function backfillExerciseUUIDs(supabase: ReturnType<typeof createClient>): Promise<BackfillResult> {
  const errors: string[] = [];
  let updatedCount = 0;

  try {
    // Phase 1: Backfill exercises with UUIDs
    console.log("Phase 1: Backfilling exercises with UUIDs...");
    const { data: exercises, error: exercisesError } = await supabase
      .from("exercises")
      .select("name, exercise_id")
      .is("exercise_id", null);

    if (exercisesError) throw exercisesError;
    if (!exercises || exercises.length === 0) {
      console.log("No exercises to backfill");
      return {
        success: true,
        message: "No exercises needed backfill",
        updatedCount: 0,
        errors: [],
      };
    }

    // Create UUID mappings
    const uuidMap = new Map<string, string>();
    for (const exercise of exercises) {
      const uuid = uuidv5(exercise.name, EXERCISE_NAMESPACE_UUID);
      uuidMap.set(exercise.name, uuid);
    }

    // Batch update exercises
    for (const [name, uuid] of uuidMap.entries()) {
      const { error } = await supabase
        .from("exercises")
        .update({ exercise_id: uuid })
        .eq("name", name);

      if (error) {
        errors.push(`Failed to update exercise ${name}: ${error.message}`);
      } else {
        updatedCount++;
      }
    }

    // Phase 2: Backfill injury_risks
    console.log("Phase 2: Backfilling injury_risks...");
    const { data: injuryRisks, error: irError } = await supabase
      .from("injury_risks")
      .select("id, exercise_name, exercise_id")
      .is("exercise_id", null);

    if (irError) throw irError;
    if (injuryRisks && injuryRisks.length > 0) {
      for (const risk of injuryRisks) {
        const uuid = uuidMap.get(risk.exercise_name);
        if (uuid) {
          const { error } = await supabase
            .from("injury_risks")
            .update({ exercise_id: uuid })
            .eq("id", risk.id);

          if (error) {
            errors.push(`Failed to update injury_risk ${risk.id}: ${error.message}`);
          } else {
            updatedCount++;
          }
        }
      }
    }

    // Phase 3: Backfill exercise_performances
    console.log("Phase 3: Backfilling exercise_performances...");
    const { data: eps, error: epError } = await supabase
      .from("exercise_performances")
      .select("id, exercise_name, exercise_id")
      .is("exercise_id", null);

    if (epError) throw epError;
    if (eps && eps.length > 0) {
      for (const ep of eps) {
        const uuid = uuidMap.get(ep.exercise_name);
        if (uuid) {
          const { error } = await supabase
            .from("exercise_performances")
            .update({ exercise_id: uuid })
            .eq("id", ep.id);

          if (error) {
            errors.push(`Failed to update exercise_performance ${ep.id}: ${error.message}`);
          } else {
            updatedCount++;
          }
        }
      }
    }

    // Phase 4: Backfill personal_records
    console.log("Phase 4: Backfilling personal_records...");
    const { data: prs, error: prError } = await supabase
      .from("personal_records")
      .select("id, exercise_name, exercise_id")
      .is("exercise_id", null);

    if (prError) throw prError;
    if (prs && prs.length > 0) {
      for (const pr of prs) {
        const uuid = uuidMap.get(pr.exercise_name);
        if (uuid) {
          const { error } = await supabase
            .from("personal_records")
            .update({ exercise_id: uuid })
            .eq("id", pr.id);

          if (error) {
            errors.push(`Failed to update personal_record ${pr.id}: ${error.message}`);
          } else {
            updatedCount++;
          }
        }
      }
    }

    return {
      success: errors.length === 0,
      message: `Backfilled ${updatedCount} records`,
      updatedCount,
      errors,
    };
  } catch (error) {
    return {
      success: false,
      message: "Backfill failed",
      updatedCount,
      errors: [String(error)],
    };
  }
}
