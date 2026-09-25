-- 005: Close the four JAMES-OS v1.0 tables that were created without RLS.
--
-- These tables had no owner column, so there was nothing to scope a policy to.
-- user_id is nullable because the Cowork weekly coach writes over a direct SQL
-- connection (postgres/service role, no auth.uid()); it should set user_id
-- explicitly. Rows with a NULL owner are reachable only by the service role.
-- Non-destructive: tables are empty and no column is dropped or rewritten.

ALTER TABLE daily_log     ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE session_log   ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE mesocycle_log ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();
ALTER TABLE admin_flags   ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid();

CREATE INDEX IF NOT EXISTS idx_daily_log_user     ON daily_log(user_id);
CREATE INDEX IF NOT EXISTS idx_session_log_user   ON session_log(user_id);
CREATE INDEX IF NOT EXISTS idx_mesocycle_log_user ON mesocycle_log(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_flags_user   ON admin_flags(user_id);

ALTER TABLE daily_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_log   ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesocycle_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_flags   ENABLE ROW LEVEL SECURITY;

-- anon gets nothing: no policy grants it access.
-- service_role bypasses RLS; the explicit policy documents the intent.

CREATE POLICY "daily_log_owner" ON daily_log FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_log_service" ON daily_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "session_log_owner" ON session_log FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "session_log_service" ON session_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "mesocycle_log_owner" ON mesocycle_log FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mesocycle_log_service" ON mesocycle_log FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "admin_flags_owner" ON admin_flags FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admin_flags_service" ON admin_flags FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Legacy: superseded by james_wellness_log / james_session_notes / training_block.
COMMENT ON TABLE session_log   IS 'LEGACY (JAMES-OS v1.0). Superseded by james_session_notes + weekly_review. Kept read-only by convention.';
COMMENT ON TABLE mesocycle_log IS 'LEGACY (JAMES-OS v1.0). Superseded by training_block / block_week. Kept read-only by convention.';
