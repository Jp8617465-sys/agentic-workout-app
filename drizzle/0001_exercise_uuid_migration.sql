-- Exercise UUID Migration
-- Migrate exercises table from using 'name' as primary key to 'exerciseId' (UUID)
-- This allows exercises to be renamed while maintaining referential integrity

-- Add new columns to support migration
ALTER TABLE exercises ADD COLUMN exercise_id TEXT;

ALTER TABLE injury_risks ADD COLUMN exercise_id TEXT;
ALTER TABLE exercise_performances ADD COLUMN exercise_id TEXT;
ALTER TABLE personal_records ADD COLUMN exercise_id TEXT;

-- Note: UUIDs will be backfilled by the application migration script
-- This is handled by the TypeScript migration phase to ensure deterministic UUIDs

-- Create unique constraint on exercise name
CREATE UNIQUE INDEX IF NOT EXISTS idx_exercises_name_unique ON exercises (name);

-- Indexes for performance (applied after data migration)
-- CREATE INDEX IF NOT EXISTS idx_exercises_name ON exercises (name);
-- CREATE INDEX IF NOT EXISTS idx_ep_exercise ON exercise_performances (exercise_id);
-- CREATE INDEX IF NOT EXISTS idx_pr_user_exercise ON personal_records (user_id, exercise_id);
-- CREATE INDEX IF NOT EXISTS idx_ir_exercise ON injury_risks (exercise_id);
