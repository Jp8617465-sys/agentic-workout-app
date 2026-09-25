# Injury Constraint Rules

This file defines the static constraint-to-exercise mapping rules.
**Live active constraints are always derived from the injuries table at runtime — this file is reference only.**

## Active Constraints (as of initial setup — monitor for changes)

| Constraint | Injury | Status | Side |
|------------|--------|--------|------|
| `right_ankle` | CAI (chronic ankle instability, post-ATFL tear) | Chronic | Right |
| `plantar` | Plantar fasciitis | Recovering | Right foot |
| `glute` | Left glute inhibition | Chronic | Left |
| `low_back` | Low back sensitivity | Chronic | Bilateral |
| `shoulder` | Shoulder posture issues | Monitoring | Bilateral |

## Constraint Rules

### right_ankle / ankle
- **Exclude:** single-leg plyometrics, jump lunges, box jumps, single-leg calf raises under load
- **Modify:** bilateral squats (ensure stable base), step-ups (reduce height), walking lunges (shorter stride)
- **Safe:** seated/lying exercises, upper body, hip hinges on flat surface

### plantar (plantar fasciitis, right foot)
- **Exclude:** running (until resolved), jump rope, high-impact cardio
- **Modify:** standing exercises > 20 min continuous, calf raises (reduce ROM)
- **Safe:** cycling, rowing, swimming, all upper body, lying/seated lower body

### glute (left glute inhibition)
- **Modify:** Bulgarian split squats (reduce left-side load by 10–15%), single-leg RDL (use light load, focus activation)
- **Safe:** bilateral hip thrusts, conventional deadlift, leg press
- **Cue:** always activate glute medius before loaded single-leg work

### low_back (sensitivity, no spinal flexion under load)
- **Exclude:** Jefferson curls, good mornings, bent-over rows with rounded back, loaded sit-ups
- **Modify:** deadlifts (Romanian preferred over conventional), rows (use incline bench support)
- **Safe:** hip hinges with neutral spine, leg press, all upper body, planks

### shoulder (posture)
- **Modify:** overhead pressing (reduce load 10%, focus on scapular stability), upright rows (avoid full)
- **Safe:** horizontal pulling (rows), neutral-grip pressing, lat pulldowns
