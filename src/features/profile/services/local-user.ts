import { expoDb } from "../../../lib/database";
import { generateId } from "../../../lib/uuid";
import { useUserStore } from "../../../stores/userStore";

/**
 * Workouts, mesocycles and memories reference users(id) with foreign keys enforced,
 * but onboarding only writes the Zustand store. Call this before any user-owned insert.
 */
export function ensureLocalUser(): string {
  const state = useUserStore.getState();
  let id = state.id;
  if (!id) {
    id = generateId();
    state.setUser({ id });
  }

  const now = new Date().toISOString();
  expoDb.runSync(
    `INSERT INTO users (id, name, experience_level, training_goal, unit_system,
       available_equipment, weekly_frequency, sync_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       experience_level = excluded.experience_level,
       training_goal = excluded.training_goal,
       unit_system = excluded.unit_system,
       available_equipment = excluded.available_equipment,
       weekly_frequency = excluded.weekly_frequency,
       updated_at = excluded.updated_at`,
    [
      id,
      state.name || "Trainer",
      state.experienceLevel,
      state.trainingGoal,
      state.unitSystem,
      JSON.stringify(state.availableEquipment),
      state.weeklyFrequency,
      now,
      now,
    ],
  );
  return id;
}
