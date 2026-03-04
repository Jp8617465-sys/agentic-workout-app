import type { SQLiteDatabase } from "expo-sqlite";

let hasRun = false;

export function runCustomMigrations(db: SQLiteDatabase): void {
  if (hasRun) return;
  hasRun = true;

  db.execSync(`
    CREATE VIRTUAL TABLE IF NOT EXISTS exercises_fts
    USING fts5(name, category, pattern, muscle_groups, tokenize='trigram');
  `);

  db.execSync(`
    CREATE TRIGGER IF NOT EXISTS exercises_fts_insert
    AFTER INSERT ON exercises
    BEGIN
      INSERT INTO exercises_fts(name, category, pattern, muscle_groups)
      VALUES (NEW.name, NEW.category, NEW.pattern, NEW.muscle_groups);
    END;
  `);

  db.execSync(`
    CREATE TRIGGER IF NOT EXISTS exercises_fts_delete
    AFTER DELETE ON exercises
    BEGIN
      DELETE FROM exercises_fts WHERE name = OLD.name;
    END;
  `);

  db.execSync(`
    CREATE TRIGGER IF NOT EXISTS exercises_fts_update
    AFTER UPDATE ON exercises
    BEGIN
      DELETE FROM exercises_fts WHERE name = OLD.name;
      INSERT INTO exercises_fts(name, category, pattern, muscle_groups)
      VALUES (NEW.name, NEW.category, NEW.pattern, NEW.muscle_groups);
    END;
  `);
}
