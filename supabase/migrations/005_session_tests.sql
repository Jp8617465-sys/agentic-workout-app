-- 005_session_tests.sql
-- Session testing framework: pre/post-session tests and progression decisions

-- Session Tests
CREATE TABLE IF NOT EXISTS session_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id),
  user_id UUID NOT NULL REFERENCES users(id),
  test_type TEXT NOT NULL,
  test_context TEXT NOT NULL DEFAULT '{}',
  result TEXT,
  evaluated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sync_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE INDEX idx_session_tests_workout ON session_tests(workout_id);
CREATE INDEX idx_session_tests_user ON session_tests(user_id);

-- Pending Progression Decisions
CREATE TABLE IF NOT EXISTS pending_progression_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  exercise_name TEXT NOT NULL,
  decision_type TEXT NOT NULL,
  hold_sessions INTEGER NOT NULL DEFAULT 0,
  source_test_id UUID NOT NULL REFERENCES session_tests(id),
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sync_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE INDEX idx_ppd_user ON pending_progression_decisions(user_id);
CREATE INDEX idx_ppd_exercise ON pending_progression_decisions(user_id, exercise_name);

-- Enable RLS
ALTER TABLE session_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_progression_decisions ENABLE ROW LEVEL SECURITY;

-- Session Tests RLS: users can only access their own tests
CREATE POLICY session_tests_select ON session_tests
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY session_tests_insert ON session_tests
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY session_tests_update ON session_tests
  FOR UPDATE USING (auth.uid() = user_id);

-- Pending Progression Decisions RLS: users can only access their own decisions
CREATE POLICY ppd_select ON pending_progression_decisions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY ppd_insert ON pending_progression_decisions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY ppd_update ON pending_progression_decisions
  FOR UPDATE USING (auth.uid() = user_id);
