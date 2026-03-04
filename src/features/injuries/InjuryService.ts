import { db, expoDb } from "../../lib/database";
import { injuries } from "../../lib/schema";
import { generateId } from "../../lib/uuid";

export interface ActiveInjury {
  id: string;
  type: string;
  status: string;
  severity: number;
  dateOccurred: string;
  notes: string | null;
}

export interface LoadModification {
  exerciseName: string;
  modifier: number; // 0.5–1.0 weight multiplier
  reason: string;
}

export interface ExerciseSubstitution {
  original: string;
  alternatives: string[];
}

interface InjuryRiskRow {
  exercise_name: string;
  injury_type: string;
  risk_level: string;
}

interface InjuryRow {
  id: string;
  type: string;
  status: string;
  severity: number;
  date_occurred: string;
  notes: string | null;
}

export const InjuryService = {
  getActiveRestrictions(userId: string): ActiveInjury[] {
    const rows = expoDb.getAllSync<InjuryRow>(
      `SELECT id, type, status, severity, date_occurred, notes
       FROM injuries
       WHERE user_id = ? AND status != 'resolved'
       ORDER BY date_occurred DESC`,
      [userId],
    );
    return rows.map((r) => ({
      id: r.id,
      type: r.type,
      status: r.status,
      severity: r.severity,
      dateOccurred: r.date_occurred,
      notes: r.notes,
    }));
  },

  isExerciseSafe(exerciseName: string, activeInjuries: ActiveInjury[]): boolean {
    if (activeInjuries.length === 0) return true;

    for (const injury of activeInjuries) {
      const riskRow = expoDb.getFirstSync<InjuryRiskRow>(
        `SELECT exercise_name, injury_type, risk_level
         FROM injury_risks
         WHERE exercise_name = ? AND injury_type = ?`,
        [exerciseName, injury.type],
      );

      if (!riskRow) continue;

      if (riskRow.risk_level === "HIGH") return false;
      if (riskRow.risk_level === "MODERATE" && injury.severity >= 7) return false;
    }

    return true;
  },

  getLoadModifier(exerciseName: string, activeInjuries: ActiveInjury[]): LoadModification {
    let minModifier = 1.0;
    let reason = "";

    for (const injury of activeInjuries) {
      const riskRow = expoDb.getFirstSync<InjuryRiskRow>(
        `SELECT exercise_name, injury_type, risk_level
         FROM injury_risks
         WHERE exercise_name = ? AND injury_type = ?`,
        [exerciseName, injury.type],
      );

      if (!riskRow || riskRow.risk_level !== "MODERATE") continue;

      const modifier = Math.max(0.5, 1 - injury.severity * 0.05);
      if (modifier < minModifier) {
        minModifier = modifier;
        reason = `${injury.type} (severity ${injury.severity}) — load reduced to ${Math.round(modifier * 100)}%`;
      }
    }

    return { exerciseName, modifier: minModifier, reason };
  },

  getSubstitutions(exerciseName: string, activeInjuries: ActiveInjury[]): ExerciseSubstitution {
    // Find the movement pattern of the target exercise
    const exercise = expoDb.getFirstSync<{ pattern: string }>(
      "SELECT pattern FROM exercises WHERE name = ?",
      [exerciseName],
    );

    if (!exercise) return { original: exerciseName, alternatives: [] };

    // Get exercises with the same movement pattern
    const candidates = expoDb.getAllSync<{ name: string }>(
      "SELECT name FROM exercises WHERE pattern = ? AND name != ? LIMIT 20",
      [exercise.pattern, exerciseName],
    );

    const alternatives = candidates
      .filter((c) => this.isExerciseSafe(c.name, activeInjuries))
      .slice(0, 5)
      .map((c) => c.name);

    return { original: exerciseName, alternatives };
  },

  async addInjury(
    userId: string,
    data: { type: string; severity: number; dateOccurred: string; notes?: string },
  ): Promise<string> {
    const id = generateId();
    const now = new Date().toISOString();
    await db.insert(injuries).values({
      id,
      userId,
      type: data.type,
      status: "acute",
      severity: data.severity,
      dateOccurred: data.dateOccurred,
      notes: data.notes ?? null,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },

  resolveInjury(injuryId: string): void {
    const now = new Date().toISOString();
    expoDb.runSync(
      "UPDATE injuries SET status = 'resolved', updated_at = ? WHERE id = ?",
      [now, injuryId],
    );
  },

  updateInjuryStatus(injuryId: string, status: string, severity: number): void {
    const now = new Date().toISOString();
    expoDb.runSync(
      "UPDATE injuries SET status = ?, severity = ?, updated_at = ? WHERE id = ?",
      [status, severity, now, injuryId],
    );
  },
};
