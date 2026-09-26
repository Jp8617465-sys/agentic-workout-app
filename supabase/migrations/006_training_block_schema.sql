-- 006: 8-week training block schema shared by the app and the Cowork weekly coach.
--
-- Ownership: every block belongs to a public.users row (athlete_id). RLS follows
-- the existing convention (auth.uid() = owner). Cowork connects as the service
-- role / postgres and bypasses RLS, so it must always set athlete_id / user_id.
--
-- Append-only: working_loads and weekly_review reject UPDATE, DELETE and
-- TRUNCATE for every role via triggers. Corrections are new rows.
--
-- Non-destructive: only CREATE / ADD COLUMN / DROP NOT NULL on empty tables.

-- ─── Append-only guard ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reject_append_only_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION '% is append-only: % is not allowed. Insert a new row instead.',
    TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$;

-- ─── training_block ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS training_block (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  athlete_id     UUID NOT NULL REFERENCES users(id),
  name           TEXT NOT NULL,
  start_date     DATE NOT NULL,
  end_date       DATE NOT NULL,
  total_weeks    SMALLINT NOT NULL DEFAULT 8 CHECK (total_weeks BETWEEN 1 AND 16),
  -- Ordered: element 1 is the top priority.
  priorities     TEXT[] NOT NULL DEFAULT '{}',
  -- Decision rules the weekly coach applies (progression, run caps, pain, adherence).
  rules          JSONB NOT NULL DEFAULT '{}',
  -- Day-of-week → session_code, default start time.
  weekly_layout  JSONB NOT NULL DEFAULT '{}',
  status         TEXT NOT NULL DEFAULT 'planned'
                 CHECK (status IN ('planned', 'active', 'completed', 'abandoned')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date > start_date)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_training_block_one_active
  ON training_block (athlete_id) WHERE status = 'active';

CREATE TRIGGER training_block_updated_at
  BEFORE UPDATE ON training_block
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── block_week ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS block_week (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id      UUID NOT NULL REFERENCES training_block(id),
  week_no       SMALLINT NOT NULL CHECK (week_no BETWEEN 1 AND 16),
  week_start    DATE NOT NULL,
  phase         TEXT NOT NULL CHECK (phase IN ('build', 'deload', 'retest')),
  run_1         TEXT,
  run_2         TEXT,
  run_3         TEXT,
  -- Planned easy-equivalent minutes where the prescription states them; NULL when
  -- the session is interval-structured and has no stated total.
  run_1_min     SMALLINT CHECK (run_1_min >= 0),
  run_2_min     SMALLINT CHECK (run_2_min >= 0),
  run_3_min     SMALLINT CHECK (run_3_min >= 0),
  -- { "<lift>": <sets> } for this week, overrides block_lift.sets.
  planned_sets  JSONB NOT NULL DEFAULT '{}',
  notes         TEXT,
  UNIQUE (block_id, week_no)
);

-- ─── block_lift ──────────────────────────────────────────────────────────────
-- Session templates (Strength A/B/C). Needed because block_week only carries set
-- counts, and the progression rule depends on each lift's load class.
CREATE TABLE IF NOT EXISTS block_lift (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id      UUID NOT NULL REFERENCES training_block(id),
  session_code  TEXT NOT NULL CHECK (session_code IN ('A', 'B', 'C')),
  position      SMALLINT NOT NULL CHECK (position >= 1),
  lift          TEXT NOT NULL,
  sets          SMALLINT NOT NULL CHECK (sets >= 1),
  target        NUMERIC(6,1) NOT NULL CHECK (target > 0),
  target_unit   TEXT NOT NULL
                CHECK (target_unit IN ('reps', 'reps_per_leg', 'reps_per_side', 'seconds', 'seconds_per_side', 'metres')),
  -- Drives the progression increment (+2.5 barbell lower, +1–2 DB, +5 cable).
  load_class    TEXT NOT NULL
                CHECK (load_class IN ('barbell_lower', 'barbell_upper', 'dumbbell', 'cable', 'machine', 'bodyweight', 'carry')),
  notes         TEXT,
  UNIQUE (block_id, session_code, position),
  UNIQUE (block_id, lift)
);

-- ─── working_loads (append-only) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS working_loads (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id             UUID NOT NULL REFERENCES training_block(id),
  lift                 TEXT NOT NULL,
  load_kg              NUMERIC(6,2) NOT NULL CHECK (load_kg >= 0),
  effective_from_week  SMALLINT NOT NULL CHECK (effective_from_week BETWEEN 1 AND 16),
  reason               TEXT NOT NULL CHECK (length(trim(reason)) > 0),
  source               TEXT NOT NULL DEFAULT 'cowork'
                       CHECK (source IN ('seed', 'cowork', 'app', 'edge_fn', 'manual')),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_working_loads_lookup
  ON working_loads (block_id, lift, effective_from_week DESC, created_at DESC);

CREATE TRIGGER working_loads_append_only
  BEFORE UPDATE OR DELETE ON working_loads
  FOR EACH ROW EXECUTE FUNCTION public.reject_append_only_change();
CREATE TRIGGER working_loads_no_truncate
  BEFORE TRUNCATE ON working_loads
  FOR EACH STATEMENT EXECUTE FUNCTION public.reject_append_only_change();

-- ─── weekly_review (append-only) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS weekly_review (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id                  UUID NOT NULL REFERENCES training_block(id),
  week_no                   SMALLINT NOT NULL CHECK (week_no BETWEEN 1 AND 16),
  reviewed_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- High-water mark: check-ins created at or before this were considered.
  last_checkin_reviewed_at  TIMESTAMPTZ,
  sessions_done             SMALLINT NOT NULL CHECK (sessions_done BETWEEN 0 AND 6),
  sessions_planned          SMALLINT NOT NULL DEFAULT 6 CHECK (sessions_planned BETWEEN 0 AND 6),
  -- { "<lift>": { "load_kg": 60, "reps": 6, "rpe": 7 } | [ ...per set ] }
  key_lifts                 JSONB NOT NULL DEFAULT '{}',
  -- [ { "slot": "R1", "minutes": 20, "type": "easy", "done": true } ]
  runs                      JSONB NOT NULL DEFAULT '[]',
  -- { "nights_logged": 6, "avg_hours": 5.8, "nights_under_5h": 2 }
  sleep_summary             JSONB NOT NULL DEFAULT '{}',
  pain_ankle                SMALLINT CHECK (pain_ankle BETWEEN 0 AND 10),
  pain_back                 SMALLINT CHECK (pain_back BETWEEN 0 AND 10),
  flags                     TEXT[] NOT NULL DEFAULT '{}',
  -- [ { "type": "load_change", "lift": "back squat", "from": 60, "to": 62.5, "reason": "..." } ]
  decisions                 JSONB NOT NULL DEFAULT '[]',
  calendar_event_ids        TEXT[] NOT NULL DEFAULT '{}',
  summary_text              TEXT NOT NULL DEFAULT '',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (sessions_done <= sessions_planned)
);

CREATE INDEX IF NOT EXISTS idx_weekly_review_block
  ON weekly_review (block_id, reviewed_at DESC);

CREATE TRIGGER weekly_review_append_only
  BEFORE UPDATE OR DELETE ON weekly_review
  FOR EACH ROW EXECUTE FUNCTION public.reject_append_only_change();
CREATE TRIGGER weekly_review_no_truncate
  BEFORE TRUNCATE ON weekly_review
  FOR EACH STATEMENT EXECUTE FUNCTION public.reject_append_only_change();

-- ─── james_wellness_log: extend for weekly-coach check-ins ───────────────────
-- Drive check-ins may carry only sleep and pain, so the 1–5 scales become
-- optional. wellness_score is NULL for partial check-ins; james-os already
-- defaults a missing score to 12.
ALTER TABLE james_wellness_log ALTER COLUMN soreness DROP NOT NULL;
ALTER TABLE james_wellness_log ALTER COLUMN energy   DROP NOT NULL;
ALTER TABLE james_wellness_log ALTER COLUMN mood     DROP NOT NULL;
ALTER TABLE james_wellness_log ALTER COLUMN stress   DROP NOT NULL;

ALTER TABLE james_wellness_log
  ADD COLUMN IF NOT EXISTS sleep_hours    NUMERIC(4,2) CHECK (sleep_hours BETWEEN 0 AND 24),
  ADD COLUMN IF NOT EXISTS sleep_quality  SMALLINT CHECK (sleep_quality BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS pain_ankle     SMALLINT CHECK (pain_ankle BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS pain_back      SMALLINT CHECK (pain_back BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS bodyweight_kg  NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS source         TEXT NOT NULL DEFAULT 'app'
                                          CHECK (source IN ('app', 'edge_fn', 'cowork', 'manual')),
  ADD COLUMN IF NOT EXISTS reviewed_at    TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_james_wellness_unreviewed
  ON james_wellness_log (user_id, created_at) WHERE reviewed_at IS NULL;

-- ─── james_session_notes: extend for logged sessions ─────────────────────────
ALTER TABLE james_session_notes
  ADD COLUMN IF NOT EXISTS session_date  DATE,
  ADD COLUMN IF NOT EXISTS block_id      UUID REFERENCES training_block(id),
  ADD COLUMN IF NOT EXISTS week_no       SMALLINT CHECK (week_no BETWEEN 1 AND 16),
  ADD COLUMN IF NOT EXISTS session_code  TEXT
                                         CHECK (session_code IN ('A', 'B', 'C', 'R1', 'R2', 'R3', 'MOB', 'OTHER')),
  ADD COLUMN IF NOT EXISTS completed     BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS session_rpe   NUMERIC(3,1) CHECK (session_rpe BETWEEN 0 AND 10),
  ADD COLUMN IF NOT EXISTS duration_min  SMALLINT CHECK (duration_min >= 0),
  -- [ { "lift": "back squat", "set": 1, "load_kg": 60, "reps": 6, "rpe": 7 } ]
  ADD COLUMN IF NOT EXISTS sets          JSONB NOT NULL DEFAULT '[]',
  -- { "minutes": 25, "distance_km": 4.1, "type": "easy" }
  ADD COLUMN IF NOT EXISTS run           JSONB,
  ADD COLUMN IF NOT EXISTS source        TEXT NOT NULL DEFAULT 'edge_fn'
                                         CHECK (source IN ('app', 'edge_fn', 'cowork', 'strong_csv', 'manual')),
  -- Idempotency key for imports, e.g. Strong CSV "<date>|<workout name>".
  ADD COLUMN IF NOT EXISTS external_ref  TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_james_notes_external_ref
  ON james_session_notes (user_id, external_ref) WHERE external_ref IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_james_notes_block_week
  ON james_session_notes (block_id, week_no);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE training_block ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_week     ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_lift     ENABLE ROW LEVEL SECURITY;
ALTER TABLE working_loads  ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_review  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "training_block_owner" ON training_block FOR ALL TO authenticated
  USING (auth.uid() = athlete_id) WITH CHECK (auth.uid() = athlete_id);
CREATE POLICY "training_block_service" ON training_block FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "block_week_owner" ON block_week FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM training_block b WHERE b.id = block_id AND b.athlete_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM training_block b WHERE b.id = block_id AND b.athlete_id = auth.uid()));
CREATE POLICY "block_week_service" ON block_week FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "block_lift_owner" ON block_lift FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM training_block b WHERE b.id = block_id AND b.athlete_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM training_block b WHERE b.id = block_id AND b.athlete_id = auth.uid()));
CREATE POLICY "block_lift_service" ON block_lift FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Append-only tables: owners may read and insert, nothing else.
CREATE POLICY "working_loads_owner_select" ON working_loads FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM training_block b WHERE b.id = block_id AND b.athlete_id = auth.uid()));
CREATE POLICY "working_loads_owner_insert" ON working_loads FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM training_block b WHERE b.id = block_id AND b.athlete_id = auth.uid()));
CREATE POLICY "working_loads_service" ON working_loads FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "weekly_review_owner_select" ON weekly_review FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM training_block b WHERE b.id = block_id AND b.athlete_id = auth.uid()));
CREATE POLICY "weekly_review_owner_insert" ON weekly_review FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM training_block b WHERE b.id = block_id AND b.athlete_id = auth.uid()));
CREATE POLICY "weekly_review_service" ON weekly_review FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ─── v_block_current ─────────────────────────────────────────────────────────
-- One row per active block. Week is computed in Brisbane time and clamped to
-- the block. current_loads = latest row per lift effective at or before the
-- current week. security_invoker makes the caller's RLS apply.
CREATE OR REPLACE VIEW v_block_current
WITH (security_invoker = true) AS
WITH blk AS (
  SELECT
    b.*,
    LEAST(
      GREATEST(((now() AT TIME ZONE 'Australia/Brisbane')::date - b.start_date) / 7 + 1, 1),
      b.total_weeks
    )::smallint AS current_week
  FROM training_block b
  WHERE b.status = 'active'
)
SELECT
  blk.id                AS block_id,
  blk.athlete_id,
  blk.name,
  blk.start_date,
  blk.end_date,
  blk.priorities,
  blk.rules,
  blk.weekly_layout,
  blk.current_week,
  ((now() AT TIME ZONE 'Australia/Brisbane')::date < blk.start_date) AS not_started,
  ((now() AT TIME ZONE 'Australia/Brisbane')::date > blk.end_date)   AS past_end,
  to_jsonb(w.*) - 'id' - 'block_id' AS week,
  COALESCE((
    SELECT jsonb_object_agg(l.lift, jsonb_build_object(
      'load_kg', l.load_kg,
      'effective_from_week', l.effective_from_week,
      'reason', l.reason,
      'set_at', l.created_at))
    FROM (
      SELECT DISTINCT ON (wl.lift) wl.*
      FROM working_loads wl
      WHERE wl.block_id = blk.id AND wl.effective_from_week <= blk.current_week
      ORDER BY wl.lift, wl.effective_from_week DESC, wl.created_at DESC
    ) l
  ), '{}'::jsonb) AS current_loads,
  COALESCE((
    SELECT jsonb_agg(to_jsonb(r.*) ORDER BY r.reviewed_at DESC)
    FROM (
      SELECT * FROM weekly_review wr
      WHERE wr.block_id = blk.id
      ORDER BY wr.reviewed_at DESC
      LIMIT 3
    ) r
  ), '[]'::jsonb) AS last_reviews
FROM blk
LEFT JOIN block_week w ON w.block_id = blk.id AND w.week_no = blk.current_week;

COMMENT ON TABLE working_loads IS 'Append-only. Current load per lift = latest row with effective_from_week <= current week.';
COMMENT ON TABLE weekly_review IS 'Append-only. One or more rows per week; a correction is a new row.';
COMMENT ON TABLE daily_log IS 'LEGACY (JAMES-OS v1.0). Superseded by james_wellness_log (sleep, pain, bodyweight columns added in 006).';
