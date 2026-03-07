import type { SupabaseClient } from "@supabase/supabase-js";
import type { Mesocycle } from "../../types";
import type { SyncAdapter } from "../workouts/workout-sync";

/**
 * Mesocycle sync adapter.
 * Mesocycles depend on users.
 * Mesocycles are depended on by microcycles.
 */
export const mesocycleSyncAdapter: SyncAdapter<Mesocycle> = {
  async push(
    mesocycle: Mesocycle,
    supabase: SupabaseClient,
    userId: string
  ): Promise<void> {
    // Verify user exists in cloud
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      throw new Error(
        `Cannot sync mesocycle: parent user not found (${userId})`
      );
    }

    // Upsert mesocycle to cloud
    const { error } = await supabase
      .from("mesocycles")
      .upsert({
        id: mesocycle.id,
        user_id: mesocycle.userId,
        name: mesocycle.name,
        periodization_model: mesocycle.periodizationModel,
        start_date: mesocycle.startDate,
        end_date: mesocycle.endDate,
        duration_weeks: mesocycle.durationWeeks,
        status: mesocycle.status,
        goal: mesocycle.goal,
        generated_plan: mesocycle.generatedPlan,
        final_review: mesocycle.finalReview,
        created_at: mesocycle.createdAt,
        updated_at: mesocycle.updatedAt,
        sync_status: "synced",
        deleted_at: mesocycle.deletedAt,
      });

    if (error) {
      throw new Error(
        `Failed to sync mesocycle ${mesocycle.id}: ${error.message}`
      );
    }
  },

  async pull(
    userId: string,
    lastSync: number,
    supabase: SupabaseClient
  ): Promise<Mesocycle[]> {
    const lastSyncDate = new Date(lastSync).toISOString();

    const { data, error } = await supabase
      .from("mesocycles")
      .select("*")
      .eq("user_id", userId)
      .gt("updated_at", lastSyncDate)
      .order("updated_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to pull mesocycles: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: row.name,
      periodizationModel: row.periodization_model,
      startDate: row.start_date,
      endDate: row.end_date,
      durationWeeks: row.duration_weeks,
      status: row.status,
      goal: row.goal,
      generatedPlan: row.generated_plan,
      finalReview: row.final_review,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      syncStatus: "synced",
      deletedAt: row.deleted_at,
    }));
  },

  getDependencies(): string[] {
    // Mesocycles depend on users
    return ["users"];
  },

  getDependents(): string[] {
    // Microcycles depend on mesocycles
    return ["microcycles"];
  },
};
