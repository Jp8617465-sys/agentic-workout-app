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

  // Agentic memories table (Sprint 4)
  db.execSync(`
    CREATE TABLE IF NOT EXISTS agentic_memories (
      id text PRIMARY KEY NOT NULL,
      user_id text NOT NULL REFERENCES users(id),
      type text NOT NULL DEFAULT 'pattern',
      description text NOT NULL,
      context text NOT NULL DEFAULT '{}',
      observations integer NOT NULL DEFAULT 1,
      success_rate real NOT NULL DEFAULT 0,
      first_observed text NOT NULL,
      last_observed text NOT NULL,
      trigger_text text NOT NULL DEFAULT '',
      action text NOT NULL DEFAULT '',
      confidence real NOT NULL DEFAULT 0,
      reinforced integer NOT NULL DEFAULT 0,
      applied_successfully integer NOT NULL DEFAULT 0,
      applied_unsuccessfully integer NOT NULL DEFAULT 0,
      last_applied text,
      sync_status text NOT NULL DEFAULT 'pending',
      created_at text NOT NULL,
      updated_at text NOT NULL
    )
  `);
  db.execSync(`CREATE INDEX IF NOT EXISTS idx_memories_user_confidence ON agentic_memories(user_id, confidence DESC)`);
  db.execSync(`CREATE INDEX IF NOT EXISTS idx_memories_user_type ON agentic_memories(user_id, type)`);

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
