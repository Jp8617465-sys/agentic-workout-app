import type { SupabaseClient } from "@supabase/supabase-js";
import type { SetLog } from "../../types";
import type { SyncAdapter } from "../workouts/workout-sync";

/**
 * Set log sync adapter.
 * Set logs depend on exercise performances.
 * Set logs have no dependents (leaf nodes in sync tree).
 */
export const setLogSyncAdapter: SyncAdapter<SetLog> = {
  async push(
    log: SetLog,
    supabase: SupabaseClient,
    userId: string
  ): Promise<void> {
    // Verify exercise performance exists in cloud
    const { data: ep, error: epError } = await supabase
      .from("exercise_performances")
      .select("id")
      .eq("id", log.exercisePerformanceId)
      .single();

    if (epError || !ep) {
      throw new Error(
        `Cannot sync set log: parent exercise performance not found (${log.exercisePerformanceId})`
      );
    }

    // Upsert set log to cloud
    const { error } = await supabase
      .from("set_logs")
      .upsert({
        id: log.id,
        exercise_performance_id: log.exercisePerformanceId,
        set_number: log.setNumber,
        weight: log.weight,
        reps: log.reps,
        rpe: log.rpe,
        type: log.type,
        rest_time_used: log.restTimeUsed,
        completed_at: log.completedAt,
        sync_status: "synced",
      });

    if (error) {
      throw new Error(`Failed to sync set log ${log.id}: ${error.message}`);
    }
  },

  async pull(
    userId: string,
    lastSync: number,
    supabase: SupabaseClient
  ): Promise<SetLog[]> {
    const lastSyncDate = new Date(lastSync).toISOString();

    // Get all exercise performances for user's workouts
    const { data: workouts, error: workoutError } = await supabase
      .from("workouts")
      .select("id")
      .eq("user_id", userId);

    if (workoutError) {
      throw new Error(`Failed to get user workouts: ${workoutError.message}`);
    }

    if (!workouts || workouts.length === 0) {
      return [];
    }

    const workoutIds = workouts.map((w) => w.id);

    const { data: eps, error: epError } = await supabase
      .from("exercise_performances")
      .select("id")
      .in("workout_id", workoutIds);

    if (epError) {
      throw new Error(
        `Failed to get exercise performances: ${epError.message}`
      );
    }

    if (!eps || eps.length === 0) {
      return [];
    }

    const epIds = eps.map((ep) => ep.id);

    // Pull set logs for those exercise performances updated since last sync
    const { data, error } = await supabase
      .from("set_logs")
      .select("*")
      .in("exercise_performance_id", epIds)
      .gt("updated_at", lastSyncDate)
      .order("updated_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to pull set logs: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      exercisePerformanceId: row.exercise_performance_id,
      setNumber: row.set_number,
      weight: row.weight,
      reps: row.reps,
      rpe: row.rpe,
      type: row.type,
      restTimeUsed: row.rest_time_used,
      completedAt: row.completed_at,
      syncStatus: "synced",
    }));
  },

  getDependencies(): string[] {
    // Set logs depend on exercise performances
    return ["exercisePerformances"];
  },

  getDependents(): string[] {
    // Set logs are leaf nodes; nothing depends on them
    return [];
  },
};
