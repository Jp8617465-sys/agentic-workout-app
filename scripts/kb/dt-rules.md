# Decision Tree Rules Reference

## DT-01: Daily Readiness

Input: wellness_score (4–20), last_session_rpe, consecutive_high_rpe_sessions

| Condition | Session Type | Volume | Intensity |
|-----------|-------------|--------|-----------|
| wellness < 6 | rest | 0% | 0% |
| wellness < 8 AND consecutive_high_rpe ≥ 3 | rest | 0% | 0% |
| wellness < 8 OR consecutive_high_rpe ≥ 3 | active_recovery | 40% | 70% |
| last_rpe > 8.5 OR wellness < 12 | reduced | 70% | 85% |
| default | full | 100% | 100% |

## DT-03: Load Progression

Input: last_weight, last_rpe, target_rpe, phase, active_constraints

Algorithm:
1. Estimate 1RM from last session using Zourdos table
2. Calculate load for target RPE at same rep count
3. Apply phase progression modifier
4. Apply −10% for each matching active constraint

Phase modifiers:
- Accumulation: +2.5%
- Intensification: +1.5%
- Realization: +0.5%
- Deload: −15%

## Constraint Matching Keywords

| Constraint | Matched exercise keywords |
|------------|--------------------------|
| ankle / right_ankle | lunge, calf, squat, step_up, jump, plyometric, box_jump, single_leg |
| plantar | calf, jump, run, plyometric, box_jump, treadmill |
| glute | bulgarian, hip_thrust, glute_bridge, single_leg_rdl |
| low_back | deadlift, good_morning, jefferson_curl, bent_over |
| shoulder | overhead, ohp, military, upright_row, behind_neck |

When ≥2 constraints match an exercise → excluded.
When exactly 1 constraint matches → modified (−10% load).
When 0 constraints match → allowed.
