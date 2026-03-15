-- 002_rls_policies.sql
-- Row-Level Security: users can only access their own data
-- exercises and injury_risks are shared reference data (read-only for all)

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE injury_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE injuries ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_performances ENABLE ROW LEVEL SECURITY;
ALTER TABLE set_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesocycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE microcycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;

-- Users: own row only
CREATE POLICY users_select ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_insert ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY users_update ON users FOR UPDATE USING (auth.uid() = id);

-- Exercises: read-only for all authenticated users
CREATE POLICY exercises_select ON exercises FOR SELECT USING (auth.role() = 'authenticated');

-- Injury risks: read-only for all authenticated users
CREATE POLICY injury_risks_select ON injury_risks FOR SELECT USING (auth.role() = 'authenticated');

-- Injuries: own rows only
CREATE POLICY injuries_select ON injuries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY injuries_insert ON injuries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY injuries_update ON injuries FOR UPDATE USING (auth.uid() = user_id);

-- Workouts: own rows only
CREATE POLICY workouts_select ON workouts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY workouts_insert ON workouts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY workouts_update ON workouts FOR UPDATE USING (auth.uid() = user_id);

-- Exercise performances: access through workout ownership
CREATE POLICY ep_select ON exercise_performances FOR SELECT
  USING (EXISTS (SELECT 1 FROM workouts WHERE workouts.id = exercise_performances.workout_id AND workouts.user_id = auth.uid()));
CREATE POLICY ep_insert ON exercise_performances FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM workouts WHERE workouts.id = exercise_performances.workout_id AND workouts.user_id = auth.uid()));
CREATE POLICY ep_update ON exercise_performances FOR UPDATE
  USING (EXISTS (SELECT 1 FROM workouts WHERE workouts.id = exercise_performances.workout_id AND workouts.user_id = auth.uid()));

-- Set logs: access through workout ownership (via exercise_performances)
CREATE POLICY set_logs_select ON set_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM exercise_performances ep
    JOIN workouts w ON w.id = ep.workout_id
    WHERE ep.id = set_logs.exercise_performance_id AND w.user_id = auth.uid()
  ));
CREATE POLICY set_logs_insert ON set_logs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM exercise_performances ep
    JOIN workouts w ON w.id = ep.workout_id
    WHERE ep.id = set_logs.exercise_performance_id AND w.user_id = auth.uid()
  ));
CREATE POLICY set_logs_update ON set_logs FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM exercise_performances ep
    JOIN workouts w ON w.id = ep.workout_id
    WHERE ep.id = set_logs.exercise_performance_id AND w.user_id = auth.uid()
  ));

-- Personal records: own rows only
CREATE POLICY pr_select ON personal_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY pr_insert ON personal_records FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Mesocycles: own rows only
CREATE POLICY mesocycles_select ON mesocycles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY mesocycles_insert ON mesocycles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY mesocycles_update ON mesocycles FOR UPDATE USING (auth.uid() = user_id);

-- Microcycles: access through mesocycle ownership
CREATE POLICY microcycles_select ON microcycles FOR SELECT
  USING (EXISTS (SELECT 1 FROM mesocycles WHERE mesocycles.id = microcycles.mesocycle_id AND mesocycles.user_id = auth.uid()));
CREATE POLICY microcycles_insert ON microcycles FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM mesocycles WHERE mesocycles.id = microcycles.mesocycle_id AND mesocycles.user_id = auth.uid()));
CREATE POLICY microcycles_update ON microcycles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM mesocycles WHERE mesocycles.id = microcycles.mesocycle_id AND mesocycles.user_id = auth.uid()));

-- AI cache: own rows only
CREATE POLICY ai_cache_select ON ai_cache FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY ai_cache_insert ON ai_cache FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY ai_cache_update ON ai_cache FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY ai_cache_delete ON ai_cache FOR DELETE USING (auth.uid() = user_id);
