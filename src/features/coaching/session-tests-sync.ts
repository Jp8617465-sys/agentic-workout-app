import type { SupabaseClient } from "@supabase/supabase-js";
import type { SyncAdapter } from "../workouts/workout-sync";
import type { SessionTest, ProgressionDecision } from "./types";

interface SessionTestSync {
  id: string;
  workoutId: string;
  userId: string;
  testType: string;
  testContext: string;
  result: string | null;
  evaluatedAt: string | null;
  createdAt: string;
}

interface ProgressionDecisionSync {
  id: string;
  userId: string;
  exerciseName: string;
  decisionType: string;
  holdSessions: number;
  sourceTestId: string;
  appliedAt: string | null;
  createdAt: string;
}

export const sessionTestsSyncAdapter: SyncAdapter<SessionTestSync> = {
  async push(
    entity: SessionTestSync,
    supabase: SupabaseClient,
    userId: string,
  ): Promise<void> {
    const { error } = await supabase.from("session_tests").upsert({
      id: entity.id,
      workout_id: entity.workoutId,
      user_id: userId,
      test_type: entity.testType,
      test_context: entity.testContext,
      result: entity.result,
      evaluated_at: entity.evaluatedAt,
      created_at: entity.createdAt,
      sync_status: "synced",
    });

    if (error) {
      throw new Error(
        `Failed to sync session test ${entity.id}: ${error.message}`,
      );
    }
  },

  async pull(
    userId: string,
    lastSync: number,
    supabase: SupabaseClient,
  ): Promise<SessionTestSync[]> {
    const lastSyncDate = new Date(lastSync).toISOString();

    const { data, error } = await supabase
      .from("session_tests")
      .select("*")
      .eq("user_id", userId)
      .gt("created_at", lastSyncDate)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to pull session tests: ${error.message}`);
    }

    return (data || []).map((row) => ({
      id: row.id,
      workoutId: row.workout_id,
      userId: row.user_id,
      testType: row.test_type,
      testContext: row.test_context,
      result: row.result,
      evaluatedAt: row.evaluated_at,
      createdAt: row.created_at,
    }));
  },

  getDependencies(): string[] {
    return ["workouts"];
  },

  getDependents(): string[] {
    return ["pendingProgressionDecisions"];
  },
};

export const progressionDecisionsSyncAdapter: SyncAdapter<ProgressionDecisionSync> = {
  async push(
    entity: ProgressionDecisionSync,
    supabase: SupabaseClient,
    userId: string,
  ): Promise<void> {
    const { error } = await supabase
      .from("pending_progression_decisions")
      .upsert({
        id: entity.id,
        user_id: userId,
        exercise_name: entity.exerciseName,
        decision_type: entity.decisionType,
        hold_sessions: entity.holdSessions,
        source_test_id: entity.sourceTestId,
        applied_at: entity.appliedAt,
        created_at: entity.createdAt,
        sync_status: "synced",
      });

    if (error) {
      throw new Error(
        `Failed to sync progression decision ${entity.id}: ${error.message}`,
      );
    }
  },

  async pull(
    userId: string,
    lastSync: number,
    supabase: SupabaseClient,
  ): Promise<ProgressionDecisionSync[]> {
    const lastSyncDate = new Date(lastSync).toISOString();

    const { data, error } = await supabase
      .from("pending_progression_decisions")
      .select("*")
      .eq("user_id", userId)
      .gt("created_at", lastSyncDate)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(
        `Failed to pull progression decisions: ${error.message}`,
      );
    }

    return (data || []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      exerciseName: row.exercise_name,
      decisionType: row.decision_type,
      holdSessions: row.hold_sessions,
      sourceTestId: row.source_test_id,
      appliedAt: row.applied_at,
      createdAt: row.created_at,
    }));
  },

  getDependencies(): string[] {
    return ["sessionTests"];
  },

  getDependents(): string[] {
    return [];
  },
};
