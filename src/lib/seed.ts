import type { SQLiteDatabase } from "expo-sqlite";
import seedData from "../constants/exercises/seed-data.json";
import injuryRiskData from "../constants/exercises/injury-risk-matrix.json";
import { generateId } from "./uuid";

const BATCH_SIZE = 50;

export async function seedDatabase(db: SQLiteDatabase): Promise<void> {
  const result = db.getFirstSync<{ count: number }>(
    "SELECT COUNT(*) as count FROM exercises",
  );
  if (result && result.count > 0) return;

  const exercises = seedData as Array<{
    name: string;
    category: string;
    pattern: string;
    equipment: string[];
    muscleGroups: string[];
    defaultTempo: string;
    defaultRestSeconds: number;
    instructions: string[];
    cues: string[];
    commonMistakes: string[];
    variations: string[];
  }>;

  for (let i = 0; i < exercises.length; i += BATCH_SIZE) {
    const batch = exercises.slice(i, i + BATCH_SIZE);
    db.withTransactionSync(() => {
      for (const exercise of batch) {
        db.runSync(
          `INSERT OR IGNORE INTO exercises (name, category, pattern, equipment, muscle_groups, default_tempo, default_rest_seconds, instructions, cues, common_mistakes, variations)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            exercise.name,
            exercise.category,
            exercise.pattern,
            JSON.stringify(exercise.equipment),
            JSON.stringify(exercise.muscleGroups),
            exercise.defaultTempo,
            exercise.defaultRestSeconds,
            JSON.stringify(exercise.instructions),
            JSON.stringify(exercise.cues),
            JSON.stringify(exercise.commonMistakes),
            JSON.stringify(exercise.variations),
          ],
        );
      }
    });
  }

  const risks = injuryRiskData as Array<{
    exerciseName: string;
    injuryType: string;
    riskLevel: string;
    contraindications: string[];
    modifications: string[];
  }>;

  db.withTransactionSync(() => {
    for (const risk of risks) {
      db.runSync(
        `INSERT OR IGNORE INTO injury_risks (id, exercise_name, injury_type, risk_level, contraindications, modifications)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          generateId(),
          risk.exerciseName,
          risk.injuryType,
          risk.riskLevel,
          JSON.stringify(risk.contraindications),
          JSON.stringify(risk.modifications),
        ],
      );
    }
  });
}
