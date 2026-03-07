import type { SupabaseClient } from "@supabase/supabase-js";
import type { ExercisePerformance } from "../../types";
import type { SyncAdapter } from "../workouts/workout-sync";

/**
 * Exercise performance sync adapter.
 * Exercise performances depend on workouts.
 * Exercise performances are depended on by set logs.
 */
export const exercisePerformanceSyncAdapter: SyncAdapter<ExercisePerformance> = {
  async push(
    ep: ExercisePerformance,
    supabase: SupabaseClient,
    userId: string
  ): Promise<void> {
    // Verify workout exists in cloud
    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .select("id")
      .eq("id", ep.workoutId)
      .single();

    if (workoutError || !workout) {
      throw new Error(
        `Cannot sync exercise performance: parent workout not found (${ep.workoutId})`
      );
    }

    // Upsert exercise performance to cloud
    const { error } = await supabase
      .from("exercise_performances")
      .upsert({
        id: ep.id,
        workout_id: ep.workoutId,
        exercise_id: ep.exerciseId,
        prescribed_sets: ep.prescribedSets,
        prescribed_reps: ep.prescribedReps,
        prescribed_weight: ep.prescribedWeight,
        prescribed_rpe: ep.prescribedRpe,
        prescribed_rest_seconds: ep.prescribedRestSeconds,
        actual_sets: ep.actualSets,
        actual_average_rpe: ep.actualAverageRpe,
        order_in_workout: ep.orderInWorkout,
      });

    if (error) {
      throw new Error(
        `Failed to sync exercise performance ${ep.id}: ${error.message}`
      );
    }
  },

  async pull(
    userId: string,
    lastSync: number,
    supabase: SupabaseClient
  ): Promise<ExercisePerformance[]> {
    const lastSyncDate = new Date(lastSync).toISOString();

    // First, get all user's workouts
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

    // Pull exercise performances for those workouts updated since last sync
    const { data, error } = await supabase
      .from("exercise_performances")
      .select("*")
      .in("workout_id", workoutIds)
      .gt("updated_at", lastSyncDate)
      .order("updated_at", { ascending: true });

    if (error) {
      throw new Error(
        `Failed to pull exercise performances: ${error.message}`
      );
    }

    return (data || []).map((row) => ({
      id: row.id,
      workoutId: row.workout_id,
      exerciseId: row.exercise_id,
      prescribedSets: row.prescribed_sets,
      prescribedReps: row.prescribed_reps,
      prescribedWeight: row.prescribed_weight,
      prescribedRpe: row.prescribed_rpe,
      prescribedRestSeconds: row.prescribed_rest_seconds,
      actualSets: row.actual_sets,
      actualAverageRpe: row.actual_average_rpe,
      orderInWorkout: row.order_in_workout,
    }));
  },

  getDependencies(): string[] {
    // Exercise performances depend on workouts
    return ["workouts"];
  },

  getDependents(): string[] {
    // Set logs depend on exercise performances
    return ["setLogs"];
  },
};
