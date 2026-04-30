import type { SupabaseClient } from "@supabase/supabase-js";
import type { SyncAdapter } from "../workouts/workout-sync";
import type { RehabProtocol } from "./types";

/**
 * Rehab protocol sync adapter.
 * Rehab protocols depend only on users (already synced).
 * No other entities depend on rehab protocols.
 */
export const rehabProtocolSyncAdapter: SyncAdapter<RehabProtocol> = {
  async push(
    protocol: RehabProtocol,
    supabase: SupabaseClient,
    userId: string,
  ): Promise<void> {
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      throw new Error(
        `Cannot sync rehab protocol: parent user not found (${userId})`,
      );
    }

    const { error } = await supabase.from("rehab_protocols").upsert({
      id: protocol.id,
      user_id: protocol.userId,
      protocol_name: protocol.protocolName,
      current_phase: protocol.currentPhase,
      phase_start_date: protocol.phaseStartDate,
      progression_eligible_date: protocol.progressionEligibleDate,
      auto_progress: protocol.autoProgress,
      created_at: protocol.createdAt,
      updated_at: protocol.updatedAt,
      sync_status: "synced",
    });

    if (error) {
      throw new Error(
        `Failed to sync rehab protocol ${protocol.id}: ${error.message}`,
      );
    }
  },

  async pull(
    userId: string,
    lastSync: number,
    supabase: SupabaseClient,
  ): Promise<RehabProtocol[]> {
    const lastSyncDate = new Date(lastSync).toISOString();

    const { data, error } = await supabase
      .from("rehab_protocols")
      .select("*")
      .eq("user_id", userId)
      .gt("updated_at", lastSyncDate)
      .order("updated_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to pull rehab protocols: ${error.message}`);
    }

    return (data || []).map(
      (row: Record<string, unknown>): RehabProtocol => ({
        id: row.id as string,
        userId: row.user_id as string,
        protocolName: row.protocol_name as string,
        currentPhase: row.current_phase as number,
        phaseStartDate: row.phase_start_date as string,
        progressionEligibleDate: row.progression_eligible_date as string,
        autoProgress: row.auto_progress as boolean,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
        syncStatus: "synced",
      }),
    );
  },

  getDependencies(): string[] {
    return ["users"];
  },

  getDependents(): string[] {
    return [];
  },
};
