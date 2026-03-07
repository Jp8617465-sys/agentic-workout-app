import type { SupabaseClient } from "@supabase/supabase-js";
import type { Microcycle } from "../../types";
import type { SyncAdapter } from "../workouts/workout-sync";

/**
 * Microcycle sync adapter.
 * Microcycles depend on mesocycles.
 * Microcycles have no dependents (leaf nodes).
 */
export const microcycleSyncAdapter: SyncAdapter<Microcycle> = {
  async push(
    microcycle: Microcycle,
    supabase: SupabaseClient,
    userId: string
  ): Promise<void> {
    // Verify mesocycle exists in cloud
    const { data: meso, error: mesoError } = await supabase
      .from("mesocycles")
      .select("id")
      .eq("id", microcycle.id)
      .single();

    if (mesoError || !meso) {
      throw new Error(
        `Cannot sync microcycle: parent mesocycle not found (${microcycle.id})`
      );
    }

    // Upsert microcycle to cloud
    const { error } = await supabase
      .from("microcycles")
      .upsert({
        id: microcycle.id,
        mesocycle_id: microcycle.id,
        week_number: microcycle.weekNumber,
        phase: microcycle.phase,
        target_volume: microcycle.targetVolume,
        target_intensity: microcycle.targetIntensity,
        target_frequency: microcycle.targetFrequency,
        actual_volume: microcycle.actualVolume,
        actual_intensity: microcycle.actualIntensity,
        actual_frequency: microcycle.actualFrequency,
        status: microcycle.status,
        review: microcycle.review,
        sync_status: "synced",
      });

    if (error) {
      throw new Error(
        `Failed to sync microcycle ${microcycle.id}: ${error.message}`
      );
    }
  },

  async pull(
    userId: string,
    lastSync: number,
    supabase: SupabaseClient
  ): Promise<Microcycle[]> {
    const lastSyncDate = new Date(lastSync).toISOString();

    // Get all mesocycles for the user
    const { data: mesos, error: mesoError } = await supabase
      .from("mesocycles")
      .select("id")
      .eq("user_id", userId);

    if (mesoError) {
      throw new Error(`Failed to get mesocycles: ${mesoError.message}`);
    }

    if (!mesos || mesos.length === 0) {
      return [];
    }

    const mesoIds = mesos.map((m) => m.id);

    // Pull microcycles for those mesocycles updated since last sync
    const { data, error } = await supabase
      .from("microcycles")
      .select("*")
      .in("mesocycle_id", mesoIds)
      .gt("updated_at", lastSyncDate)
      .order("updated_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to pull microcycles: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      mesocycleId: row.mesocycle_id,
      weekNumber: row.week_number,
      phase: row.phase,
      targetVolume: row.target_volume,
      targetIntensity: row.target_intensity,
      targetFrequency: row.target_frequency,
      actualVolume: row.actual_volume,
      actualIntensity: row.actual_intensity,
      actualFrequency: row.actual_frequency,
      status: row.status,
      review: row.review,
      syncStatus: "synced",
    }));
  },

  getDependencies(): string[] {
    // Microcycles depend on mesocycles
    return ["mesocycles"];
  },

  getDependents(): string[] {
    // Microcycles are leaf nodes
    return [];
  },
};
