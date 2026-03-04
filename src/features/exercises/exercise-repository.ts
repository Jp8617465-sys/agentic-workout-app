import { eq } from "drizzle-orm";
import { db, expoDb } from "../../lib/database";
import { exercises } from "../../lib/schema";
import type { Exercise, ExerciseCategory, ExercisePattern } from "../../types";

function rowToExercise(row: typeof exercises.$inferSelect): Exercise {
  return {
    name: row.name,
    category: row.category as ExerciseCategory,
    pattern: row.pattern as ExercisePattern,
    equipment: JSON.parse(row.equipment),
    muscleGroups: JSON.parse(row.muscleGroups),
    defaultTempo: row.defaultTempo ?? "3010",
    defaultRestSeconds: row.defaultRestSeconds ?? 120,
    instructions: JSON.parse(row.instructions),
    cues: JSON.parse(row.cues),
    commonMistakes: JSON.parse(row.commonMistakes),
    variations: JSON.parse(row.variations),
  };
}

export const exerciseRepository = {
  async search(query: string): Promise<Exercise[]> {
    if (!query.trim()) return this.findAll();

    const rows = expoDb.getAllSync<typeof exercises.$inferSelect>(
      `SELECT e.* FROM exercises e
       INNER JOIN exercises_fts fts ON e.name = fts.name
       WHERE exercises_fts MATCH ?
       ORDER BY rank
       LIMIT 50`,
      [query],
    );
    return rows.map(rowToExercise);
  },

  async findByName(name: string): Promise<Exercise | null> {
    const rows = await db
      .select()
      .from(exercises)
      .where(eq(exercises.name, name))
      .limit(1);
    return rows.length > 0 ? rowToExercise(rows[0]) : null;
  },

  async findByPattern(pattern: ExercisePattern): Promise<Exercise[]> {
    const rows = await db
      .select()
      .from(exercises)
      .where(eq(exercises.pattern, pattern));
    return rows.map(rowToExercise);
  },

  async findByCategory(category: ExerciseCategory): Promise<Exercise[]> {
    const rows = await db
      .select()
      .from(exercises)
      .where(eq(exercises.category, category));
    return rows.map(rowToExercise);
  },

  async findAll(): Promise<Exercise[]> {
    const rows = await db.select().from(exercises);
    return rows.map(rowToExercise);
  },
};
