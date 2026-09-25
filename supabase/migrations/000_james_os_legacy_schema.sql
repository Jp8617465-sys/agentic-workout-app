-- Recorded from production: this migration was applied to gym-os as
-- version 20260518100706 (create_james_os_schema) but never committed.
-- It is checked in so the repo reproduces the live schema. Do not re-apply.

-- JAMES-OS v1.0 Database Schema
-- Created: 2026-05-18

-- Daily wellness and readiness log
CREATE TABLE daily_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL UNIQUE,
  bodyweight_kg NUMERIC(5,2),
  sleep_hours NUMERIC(4,2),
  sleep_quality SMALLINT CHECK (sleep_quality BETWEEN 1 AND 5),
  soreness SMALLINT CHECK (soreness BETWEEN 1 AND 5),
  energy SMALLINT CHECK (energy BETWEEN 1 AND 5),
  mood SMALLINT CHECK (mood BETWEEN 1 AND 5),
  stress SMALLINT CHECK (stress BETWEEN 1 AND 5),
  wellness_composite SMALLINT GENERATED ALWAYS AS (soreness + energy + mood + stress) STORED,
  hrv_rmssd NUMERIC(6,2),
  calories_kcal INTEGER,
  protein_g INTEGER,
  readiness_colour TEXT CHECK (readiness_colour IN ('GREEN', 'AMBER', 'RED')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Session log
CREATE TABLE session_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  session_type TEXT CHECK (session_type IN ('Session A', 'Session B', 'Session C', 'Run', 'Active Recovery', 'Rest')),
  readiness_colour TEXT CHECK (readiness_colour IN ('GREEN', 'AMBER', 'RED')),
  -- Squat
  squat_top_set_kg NUMERIC(6,2),
  squat_reps SMALLINT,
  squat_rpe NUMERIC(3,1),
  -- Hip Thrust
  hip_thrust_top_set_kg NUMERIC(6,2),
  hip_thrust_reps SMALLINT,
  hip_thrust_rpe NUMERIC(3,1),
  -- Kickstand RDL
  kickstand_rdl_kg NUMERIC(6,2),
  kickstand_rdl_reps SMALLINT,
  kickstand_rdl_rpe NUMERIC(3,1),
  -- Bulgarian Split Squat
  bulgarian_kg NUMERIC(6,2),
  bulgarian_reps SMALLINT,
  bulgarian_rpe NUMERIC(3,1),
  -- Lat Pulldown
  lat_pulldown_kg NUMERIC(6,2),
  lat_pulldown_reps SMALLINT,
  lat_pulldown_rpe NUMERIC(3,1),
  -- OHP DB
  ohp_db_kg NUMERIC(6,2),
  ohp_db_reps SMALLINT,
  ohp_db_rpe NUMERIC(3,1),
  -- Session overall
  session_rpe NUMERIC(3,1),
  duration_min SMALLINT,
  -- Constraint flags
  ankle_flag TEXT DEFAULT 'Clear' CHECK (ankle_flag IN ('Clear', 'Monitor', 'Flag')),
  low_back_flag TEXT DEFAULT 'Clear' CHECK (low_back_flag IN ('Clear', 'Monitor', 'Flag')),
  left_glute_flag TEXT DEFAULT 'Clear' CHECK (left_glute_flag IN ('Clear', 'Monitor', 'Flag')),
  plantar_flag TEXT DEFAULT 'Clear' CHECK (plantar_flag IN ('Clear', 'Monitor', 'Flag')),
  adherence TEXT CHECK (adherence IN ('Full', 'Modified', 'Missed')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Mesocycle metadata
CREATE TABLE mesocycle_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meso_number SMALLINT NOT NULL,
  name TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  archetype TEXT,
  retest_date DATE,
  target_sessions_per_week SMALLINT DEFAULT 3,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Active substitutions and open DT threads
CREATE TABLE admin_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT CHECK (type IN ('substitution', 'dt_thread', 'injury_note', 'runna_prescription')),
  title TEXT NOT NULL,
  description TEXT,
  date_opened DATE DEFAULT CURRENT_DATE,
  review_date DATE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'monitoring')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_daily_log_date ON daily_log(date DESC);
CREATE INDEX idx_session_log_date ON session_log(date DESC);
CREATE INDEX idx_session_log_type ON session_log(session_type);
CREATE INDEX idx_admin_flags_status ON admin_flags(status);
