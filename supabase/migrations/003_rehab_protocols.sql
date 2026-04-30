-- 003_rehab_protocols.sql
-- Ankle rehab protocol tracking with phase progression

CREATE TABLE IF NOT EXISTS rehab_protocols (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  protocol_name TEXT NOT NULL,
  current_phase INTEGER NOT NULL DEFAULT 1,
  phase_start_date TEXT NOT NULL,
  progression_eligible_date TEXT NOT NULL,
  auto_progress BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sync_status TEXT NOT NULL DEFAULT 'pending'
);

CREATE INDEX idx_rehab_protocols_user ON rehab_protocols(user_id);

CREATE TRIGGER rehab_protocols_updated_at
  BEFORE UPDATE ON rehab_protocols
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS: users can only access their own rehab protocols
ALTER TABLE rehab_protocols ENABLE ROW LEVEL SECURITY;

CREATE POLICY rehab_protocols_select ON rehab_protocols
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY rehab_protocols_insert ON rehab_protocols
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY rehab_protocols_update ON rehab_protocols
  FOR UPDATE USING (auth.uid() = user_id);
