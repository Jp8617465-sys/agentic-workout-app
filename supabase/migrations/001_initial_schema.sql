-- 001_initial_schema.sql
-- Mirrors src/lib/schema.ts (Drizzle ORM) for Supabase PostgreSQL
-- All tables use auth.uid() for RLS (see 002_rls_policies.sql)

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  experience_level TEXT NOT NULL DEFAULT 'beginner',
  training_goal TEXT NOT NULL DEFAULT 'general_fitness',
  unit_system TEXT NOT NULL DEFAULT 'metric',
  sync_status TEXT NOT NULL DEFAULT 'pending',
  available_equipment TEXT NOT NULL DEFAULT '[]',
  weekly_frequency INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Exercises (shared library — read-only for users)
CREATE TABLE IF NOT EXISTS exercises (
  name TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  pattern TEXT NOT NULL,
  equipment TEXT NOT NULL DEFAULT '[]',
  muscle_groups TEXT NOT NULL DEFAULT '[]',
  default_tempo TEXT DEFAULT '3010',
  default_rest_seconds INTEGER DEFAULT 120,
  instructions TEXT NOT NULL DEFAULT '[]',
  cues TEXT NOT NULL DEFAULT '[]',
  common_mistakes TEXT NOT NULL DEFAULT '[]',
  variations TEXT NOT NULL DEFAULT '[]'
);

-- Injury risks (shared reference data)
CREATE TABLE IF NOT EXISTS injury_risks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_name TEXT NOT NULL REFERENCES exercises(name),
  injury_type TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  contraindications TEXT NOT NULL DEFAULT '[]',
  modifications TEXT NOT NULL DEFAULT '[]'
);

-- Injuries (per-user)
CREATE TABLE IF NOT EXISTS injuries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'acute',
  severity INTEGER NOT NULL DEFAULT 5,
  date_occurred TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER injuries_updated_at
  BEFORE UPDATE ON injuries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Workouts
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  date TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'custom',
  status TEXT NOT NULL DEFAULT 'active',
  duration_minutes INTEGER,
  total_volume DOUBLE PRECISION,
  average_rpe DOUBLE PRECISION,
  mesocycle_id UUID,
  microcycle_id UUID,
  rest_timer_ends_at BIGINT,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workouts_user_date ON workouts(user_id, date);

CREATE TRIGGER workouts_updated_at
  BEFORE UPDATE ON workouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Exercise performances (per-workout exercise instance)
CREATE TABLE IF NOT EXISTS exercise_performances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id),
  exercise_name TEXT NOT NULL REFERENCES exercises(name),
  prescribed_sets INTEGER,
  prescribed_reps INTEGER,
  prescribed_weight DOUBLE PRECISION,
  prescribed_rpe DOUBLE PRECISION,
  prescribed_rest_seconds INTEGER,
  actual_sets INTEGER,
  actual_average_rpe DOUBLE PRECISION,
  order_in_workout INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_ep_workout ON exercise_performances(workout_id);

-- Set logs (individual sets within an exercise performance)
CREATE TABLE IF NOT EXISTS set_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_performance_id UUID NOT NULL REFERENCES exercise_performances(id),
  set_number INTEGER NOT NULL,
  weight DOUBLE PRECISION,
  reps INTEGER,
  rpe DOUBLE PRECISION,
  type TEXT NOT NULL DEFAULT 'working',
  rest_time_used INTEGER,
  completed_at TIMESTAMPTZ,
  sync_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE INDEX idx_set_logs_ep ON set_logs(exercise_performance_id);

-- Personal records
CREATE TABLE IF NOT EXISTS personal_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  exercise_name TEXT NOT NULL REFERENCES exercises(name),
  weight DOUBLE PRECISION NOT NULL,
  reps INTEGER NOT NULL,
  estimated_one_rep_max DOUBLE PRECISION NOT NULL,
  achieved_at TEXT NOT NULL,
  workout_id UUID NOT NULL REFERENCES workouts(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pr_user_exercise ON personal_records(user_id, exercise_name);

-- Mesocycles (training blocks)
CREATE TABLE IF NOT EXISTS mesocycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  periodization_model TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  duration_weeks INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  goal TEXT NOT NULL,
  generated_plan TEXT NOT NULL DEFAULT '{}',
  final_review TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sync_status TEXT NOT NULL DEFAULT 'pending',
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_mesocycles_user ON mesocycles(user_id);
CREATE INDEX idx_mesocycles_status ON mesocycles(user_id, status);

CREATE TRIGGER mesocycles_updated_at
  BEFORE UPDATE ON mesocycles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Microcycles (phases within mesocycle)
CREATE TABLE IF NOT EXISTS microcycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mesocycle_id UUID NOT NULL REFERENCES mesocycles(id),
  week_number INTEGER NOT NULL,
  phase TEXT NOT NULL,
  target_volume DOUBLE PRECISION,
  target_intensity DOUBLE PRECISION,
  target_frequency INTEGER,
  actual_volume DOUBLE PRECISION,
  actual_intensity DOUBLE PRECISION,
  actual_frequency INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  review TEXT,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  UNIQUE(mesocycle_id, week_number)
);

-- AI cache
CREATE TABLE IF NOT EXISTS ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  cache_key TEXT NOT NULL,
  response TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_cache_key ON ai_cache(user_id, cache_key);
