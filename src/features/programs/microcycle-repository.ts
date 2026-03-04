import { expoDb } from "../../lib/database";
import { generateId } from "../../lib/uuid";
import type { Microcycle, MesocyclePhase, MicrocycleStatus } from "../../types";

interface MicrocycleRow {
  id: string;
  mesocycle_id: string;
  week_number: number;
  phase: string;
  target_volume: number | null;
  target_intensity: number | null;
  target_frequency: number | null;
  actual_volume: number | null;
  actual_intensity: number | null;
  actual_frequency: number | null;
  status: string;
  review: string | null;
}

function rowToMicrocycle(row: MicrocycleRow): Microcycle {
  return {
    id: row.id,
    mesocycleId: row.mesocycle_id,
    weekNumber: row.week_number,
    phase: row.phase as MesocyclePhase,
    targetVolume: row.target_volume,
    targetIntensity: row.target_intensity,
    targetFrequency: row.target_frequency,
    actualVolume: row.actual_volume,
    actualIntensity: row.actual_intensity,
    actualFrequency: row.actual_frequency,
    status: row.status as MicrocycleStatus,
    review: row.review,
  };
}

export interface InsertMicrocycleData {
  mesocycleId: string;
  weekNumber: number;
  phase: MesocyclePhase;
  targetVolume: number | null;
  targetIntensity: number | null;
  targetFrequency: number | null;
}

export const microcycleRepository = {
  insertBatch(mesocycleId: string, microcycles: InsertMicrocycleData[]): void {
    expoDb.withTransactionSync(() => {
      for (const mc of microcycles) {
        const id = generateId();
        expoDb.runSync(
          `INSERT INTO microcycles (id, mesocycle_id, week_number, phase,
           target_volume, target_intensity, target_frequency, status, sync_status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'pending')`,
          [
            id,
            mesocycleId,
            mc.weekNumber,
            mc.phase,
            mc.targetVolume,
            mc.targetIntensity,
            mc.targetFrequency,
          ],
        );
      }
    });
  },

  findByMesocycle(mesocycleId: string): Microcycle[] {
    const rows = expoDb.getAllSync<MicrocycleRow>(
      `SELECT id, mesocycle_id, week_number, phase, target_volume, target_intensity,
       target_frequency, actual_volume, actual_intensity, actual_frequency, status, review
       FROM microcycles
       WHERE mesocycle_id = ?
       ORDER BY week_number ASC`,
      [mesocycleId],
    );
    return rows.map(rowToMicrocycle);
  },

  findCurrentWeek(mesocycleId: string, weekNumber: number): Microcycle | null {
    const row = expoDb.getFirstSync<MicrocycleRow>(
      `SELECT id, mesocycle_id, week_number, phase, target_volume, target_intensity,
       target_frequency, actual_volume, actual_intensity, actual_frequency, status, review
       FROM microcycles
       WHERE mesocycle_id = ? AND week_number = ?`,
      [mesocycleId, weekNumber],
    );
    return row ? rowToMicrocycle(row) : null;
  },

  updateActuals(
    id: string,
    data: { actualVolume: number; actualIntensity: number; actualFrequency: number },
  ): void {
    expoDb.runSync(
      `UPDATE microcycles SET actual_volume = ?, actual_intensity = ?, actual_frequency = ?
       WHERE id = ?`,
      [data.actualVolume, data.actualIntensity, data.actualFrequency, id],
    );
  },

  updateStatus(id: string, status: MicrocycleStatus): void {
    expoDb.runSync("UPDATE microcycles SET status = ? WHERE id = ?", [status, id]);
  },

  saveReview(id: string, review: string): void {
    expoDb.runSync("UPDATE microcycles SET review = ? WHERE id = ?", [review, id]);
  },
};
