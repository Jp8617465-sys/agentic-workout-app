-- 007: Seed James (sole athlete) and Block 1 (28 Sep – 22 Nov 2026).
--
-- Single-user system: the athlete ID below is a fixed constant used by the app,
-- the james-os Edge Function and the Cowork weekly coach. When James creates his
-- Supabase Auth login, create it with this same id (admin createUser({ id }))
-- so RLS (auth.uid() = athlete_id) recognises him.
--
-- Insert-only and re-runnable (ON CONFLICT DO NOTHING).

-- ─── Athlete ─────────────────────────────────────────────────────────────────
INSERT INTO users (id, name, experience_level, training_goal, weekly_frequency)
VALUES ('6a3e5c1d-7b2f-4e8a-9c41-0f5d2b8e7a13', 'James', 'advanced', 'concurrent', 6)
ON CONFLICT (id) DO NOTHING;

-- ─── Block ───────────────────────────────────────────────────────────────────
INSERT INTO training_block (id, athlete_id, name, start_date, end_date, total_weeks, priorities, weekly_layout, rules, status)
VALUES (
  'b10c0001-2026-4928-8000-000000000001',
  '6a3e5c1d-7b2f-4e8a-9c41-0f5d2b8e7a13',
  'Block 1',
  '2026-09-28',
  '2026-11-22',
  8,
  ARRAY[
    'consistency: keep 6 sessions/week',
    'joints: ankle and back ≤2/10',
    'strength progression',
    'aerobic base / 5 km'
  ],
  '{
    "default_time": "06:00",
    "timezone": "Australia/Brisbane",
    "days": {
      "mon": {"session_code": "A",  "label": "Strength A"},
      "tue": {"session_code": "R1", "label": "Run 1"},
      "wed": {"session_code": "B",  "label": "Strength B"},
      "thu": {"session_code": "R2", "label": "Run 2"},
      "fri": {"session_code": "C",  "label": "Strength C"},
      "sat": {"session_code": "R3", "label": "Run 3 (long)"},
      "sun": {"session_code": null, "label": "Rest"}
    }
  }'::jsonb,
  '{
    "progression": {
      "increase_when": "all working sets RPE <= 7",
      "increments_kg": {"barbell_lower": 2.5, "dumbbell": {"min": 1, "max": 2}, "cable": 5},
      "hold_when": ["last set RPE >= 8", "missed reps with no RPE recorded"],
      "low_sleep": {"condition": "sleep < 5 h on most nights of the week", "sets": 2, "increase": false},
      "unlisted_classes": "hold (machine, bodyweight, carry): no automatic increment"
    },
    "lighter_weeks": {"weeks": [4, 8], "sets": 2, "loads": "same", "runs": "shorter", "retest": true},
    "runs": {
      "weekly_time_increase_max_pct": 15,
      "hard_run_not_day_after_squats": true,
      "long_run_followed_by_rest": true
    },
    "adherence": {
      "trigger": "sessions_done <= 3",
      "next_week_minimum": ["mobility", "R1", "R3", "A", "B"],
      "catch_ups": false
    },
    "pain": {
      "modify": {
        "when": ["pain > 2/10", "pain worsening over 2 consecutive check-ins"],
        "actions": ["swap exercise", "cut load", "flag"]
      },
      "refer": {
        "when": ["pain > 5/10", "swelling", "giving way", "numbness", "radiating pain"],
        "actions": ["refer to physio", "do not plan around it"]
      }
    },
    "daily_mobility": {
      "minutes": 10,
      "items": [
        "knee-to-wall 2x10/side",
        "90/90 switches 2x8",
        "couch stretch 45 s/side",
        "open books 2x8/side",
        "deep squat hold 30 s building to 2 min"
      ]
    }
  }'::jsonb,
  'active'
)
ON CONFLICT (id) DO NOTHING;

-- ─── Session templates ───────────────────────────────────────────────────────
INSERT INTO block_lift (block_id, session_code, position, lift, sets, target, target_unit, load_class, notes) VALUES
  ('b10c0001-2026-4928-8000-000000000001', 'A', 1, 'back squat',           3, 6,  'reps',             'barbell_lower', NULL),
  ('b10c0001-2026-4928-8000-000000000001', 'A', 2, 'DB bench press',       3, 8,  'reps',             'dumbbell',      NULL),
  ('b10c0001-2026-4928-8000-000000000001', 'A', 3, 'DB split squat',       2, 8,  'reps_per_leg',     'dumbbell',      'light'),
  ('b10c0001-2026-4928-8000-000000000001', 'A', 4, 'seated cable row',     2, 10, 'reps',             'cable',         NULL),
  ('b10c0001-2026-4928-8000-000000000001', 'A', 5, 'bent-knee calf raise', 2, 15, 'reps',             'bodyweight',    'paired with SL balance'),
  ('b10c0001-2026-4928-8000-000000000001', 'A', 6, 'SL balance',           3, 30, 'seconds_per_side', 'bodyweight',    'paired with calf raise'),
  ('b10c0001-2026-4928-8000-000000000001', 'A', 7, 'dead bug',             2, 8,  'reps_per_side',    'bodyweight',    NULL),
  ('b10c0001-2026-4928-8000-000000000001', 'B', 1, 'RDL',                  3, 8,  'reps',             'barbell_lower', NULL),
  ('b10c0001-2026-4928-8000-000000000001', 'B', 2, 'lat pulldown',         3, 8,  'reps',             'cable',         NULL),
  ('b10c0001-2026-4928-8000-000000000001', 'B', 3, 'incline DB press',     3, 8,  'reps',             'dumbbell',      NULL),
  ('b10c0001-2026-4928-8000-000000000001', 'B', 4, 'face pull',            2, 12, 'reps',             'cable',         NULL),
  ('b10c0001-2026-4928-8000-000000000001', 'B', 5, 'side plank',           2, 30, 'seconds_per_side', 'bodyweight',    NULL),
  ('b10c0001-2026-4928-8000-000000000001', 'C', 1, 'leg press',            3, 10, 'reps',             'machine',       NULL),
  ('b10c0001-2026-4928-8000-000000000001', 'C', 2, 'seated DB OHP',        3, 8,  'reps',             'dumbbell',      NULL),
  ('b10c0001-2026-4928-8000-000000000001', 'C', 3, 'barbell hip thrust',   3, 8,  'reps',             'barbell_lower', NULL),
  ('b10c0001-2026-4928-8000-000000000001', 'C', 4, 'lateral step-down',    2, 8,  'reps_per_leg',     'bodyweight',    NULL),
  ('b10c0001-2026-4928-8000-000000000001', 'C', 5, 'farmer carry',         3, 30, 'metres',           'carry',         NULL)
ON CONFLICT (block_id, lift) DO NOTHING;

-- ─── Weeks ───────────────────────────────────────────────────────────────────
-- run_n_min only where the spec states a duration; interval sessions stay NULL.
-- Lighter weeks (4, 8): every lift drops to 2 sets.
WITH lighter AS (
  SELECT jsonb_object_agg(lift, 2) AS sets
  FROM block_lift WHERE block_id = 'b10c0001-2026-4928-8000-000000000001'
)
INSERT INTO block_week (block_id, week_no, week_start, phase, run_1, run_2, run_3, run_1_min, run_2_min, run_3_min, planned_sets, notes)
SELECT 'b10c0001-2026-4928-8000-000000000001', w.week_no, DATE '2026-09-28' + (w.week_no - 1) * 7, w.phase,
       w.run_1, w.run_2, w.run_3, w.r1, w.r2, w.r3,
       CASE WHEN w.week_no IN (4, 8) THEN lighter.sets ELSE '{}'::jsonb END,
       w.notes
FROM lighter, (VALUES
  (1, 'build',  '20 min easy', '20 min easy',                           '25 min long easy', 20, 20,   25, NULL),
  (2, 'build',  '25 min easy', '20 min easy + 4x20 s strides',          '30 min long easy', 25, 20,   30, NULL),
  (3, 'build',  '25 min easy', '5x1 min hard : 2 min easy',             '35 min long easy', 25, NULL, 35, NULL),
  (4, 'deload', '20 min easy', '20 min easy + strides',                 '30 min long easy', 20, 20,   30, 'Lighter week: 2 sets, same loads, shorter runs, re-test.'),
  (5, 'build',  '30 min easy', '6x2 min threshold : 90 s',              '40 min long easy', 30, NULL, 40, NULL),
  (6, 'build',  '30 min easy', '5x3 min threshold : 90 s',              '40 min long easy', 30, NULL, 40, NULL),
  (7, 'build',  '30 min easy', '4x4 min threshold : 2 min',             '45 min long easy', 30, NULL, 45, NULL),
  (8, 'retest', '20 min easy', '5 km time trial OR 20 min easy + strides', '30 min long easy', 20, NULL, 30, 'Lighter week: 2 sets, same loads, shorter runs, re-test.')
) AS w(week_no, phase, run_1, run_2, run_3, r1, r2, r3, notes)
ON CONFLICT (block_id, week_no) DO NOTHING;

-- ─── Starting loads (append-only) ────────────────────────────────────────────
-- No row for DB split squat ("light"), face pull or farmer carry: spec gives no load.
INSERT INTO working_loads (block_id, lift, load_kg, effective_from_week, reason, source)
SELECT 'b10c0001-2026-4928-8000-000000000001', l.lift, l.load_kg, 1, 'Block 1 starting load', 'seed'
FROM (VALUES
  ('back squat', 60), ('DB bench press', 24), ('seated cable row', 50),
  ('RDL', 40), ('lat pulldown', 50), ('incline DB press', 22),
  ('leg press', 80), ('seated DB OHP', 12), ('barbell hip thrust', 70)
) AS l(lift, load_kg)
WHERE NOT EXISTS (
  SELECT 1 FROM working_loads wl
  WHERE wl.block_id = 'b10c0001-2026-4928-8000-000000000001' AND wl.lift = l.lift AND wl.source = 'seed'
);
