ALTER TABLE workouts ADD COLUMN was_re_entry_session BOOLEAN DEFAULT FALSE;
ALTER TABLE workouts ADD COLUMN gap_days_prior INTEGER;
