import type { SupabaseClient } from "@supabase/supabase-js";
import type { Workout } from "../../types";

export interface SyncAdapter<T> {
  push(entity: T, supabase: SupabaseClient, userId: string): Promise<void>;
  pull(
    userId: string,
    lastSync: number,
    supabase: SupabaseClient
  ): Promise<T[]>;
  getDependencies(): string[];
  getDependents(): string[];
}

/**
 * Workout sync adapter.
 * Workouts depend only on users (already synced).
 * Workouts are depended on by exercise performances and set logs.
 */
export const workoutSyncAdapter: SyncAdapter<Workout> = {
  async push(
    workout: Workout,
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
      throw new Error(`Cannot sync workout: parent user not found (${userId})`);
    }

    // Upsert workout to cloud
    const { error } = await supabase.from("workouts").upsert({
      ...workout,
      sync_status: "synced",
    });

    if (error) {
      throw new Error(
        `Failed to sync workout ${workout.id}: ${error.message}`
      );
    }
  },

  async pull(
    userId: string,
    lastSync: number,
    supabase: SupabaseClient
  ): Promise<Workout[]> {
    const lastSyncDate = new Date(lastSync).toISOString();

    const { data, error } = await supabase
      .from("workouts")
      .select("*")
      .eq("user_id", userId)
      .gt("updated_at", lastSyncDate)
      .order("updated_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to pull workouts: ${error.message}`);
    }

    // Transform Supabase format to local format if needed
    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      date: row.date,
      type: row.type,
      status: row.status,
      mesocycleId: row.mesocycle_id,
      microcycleId: row.microcycle_id,
      durationMinutes: row.duration_minutes,
      totalVolume: row.total_volume,
      averageRpe: row.average_rpe,
      restTimerEndsAt: row.rest_timer_ends_at,
      syncStatus: "synced",
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  },

  getDependencies(): string[] {
    // Workouts depend on users (which should always be synced first)
    return ["users"];
  },

  getDependents(): string[] {
    // Exercise performances and set logs depend on workouts
    return ["exercisePerformances", "setLogs", "personalRecords"];
  },
};
