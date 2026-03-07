import type { SupabaseClient } from "@supabase/supabase-js";
import type { SyncAdapter } from "../workouts/workout-sync";

export interface PersonalRecord {
  id: string;
  userId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  estimatedOneRepMax: number;
  achievedAt: string;
  workoutId: string;
  createdAt: string;
}

/**
 * Personal record sync adapter.
 * Personal records depend on workouts and users.
 * Personal records have no dependents (leaf nodes).
 */
export const personalRecordSyncAdapter: SyncAdapter<PersonalRecord> = {
  async push(
    pr: PersonalRecord,
    supabase: SupabaseClient,
    userId: string
  ): Promise<void> {
    // Verify both user and workout exist in cloud
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      throw new Error(`Cannot sync personal record: user not found (${userId})`);
    }

    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .select("id")
      .eq("id", pr.workoutId)
      .single();

    if (workoutError || !workout) {
      throw new Error(
        `Cannot sync personal record: parent workout not found (${pr.workoutId})`
      );
    }

    // Upsert personal record to cloud
    const { error } = await supabase
      .from("personal_records")
      .upsert({
        id: pr.id,
        user_id: pr.userId,
        exercise_name: pr.exerciseName,
        weight: pr.weight,
        reps: pr.reps,
        estimated_one_rep_max: pr.estimatedOneRepMax,
        achieved_at: pr.achievedAt,
        workout_id: pr.workoutId,
        created_at: pr.createdAt,
      });

    if (error) {
      throw new Error(
        `Failed to sync personal record ${pr.id}: ${error.message}`
      );
    }
  },

  async pull(
    userId: string,
    lastSync: number,
    supabase: SupabaseClient
  ): Promise<PersonalRecord[]> {
    const lastSyncDate = new Date(lastSync).toISOString();

    const { data, error } = await supabase
      .from("personal_records")
      .select("*")
      .eq("user_id", userId)
      .gt("created_at", lastSyncDate)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to pull personal records: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      exerciseName: row.exercise_name,
      weight: row.weight,
      reps: row.reps,
      estimatedOneRepMax: row.estimated_one_rep_max,
      achievedAt: row.achieved_at,
      workoutId: row.workout_id,
      createdAt: row.created_at,
    }));
  },

  getDependencies(): string[] {
    // Personal records depend on workouts and users
    return ["workouts", "users"];
  },

  getDependents(): string[] {
    // Personal records are leaf nodes
    return [];
  },
};
