import type {
  GeneratedMesocyclePlan,
  MesocycleExercisePlan,
  MesocyclePhase,
  MesocycleSessionPlan,
  MesocycleWeekPlan,
} from "../../../types";

/**
 * Six-week block for rebuilding consistency when training time is unpredictable
 * (e.g. a new baby). Two full-body strength sessions plus one run-walk session a
 * week, run in order whenever there's time. Strength is held and nudged up by RPE;
 * the aerobic base is rebuilt with a run-walk progression; loads stay conservative
 * because sleep debt lowers recovery capacity.
 */

export const RETURN_TO_CONSISTENCY_ID = "return_to_consistency";

interface WeekParams {
  phase: MesocyclePhase;
  sets: number;
  rpe: number;
  squatReps: string;
  hingeReps: string;
  accessoryReps: string;
  run: { intervals: number; runMinutes: number; walkMinutes: number };
}

// Sets/RPE ramp gently: re-entry → build → consolidate → deload.
const WEEKS: WeekParams[] = [
  {
    phase: "accumulation",
    sets: 2,
    rpe: 6.5,
    squatReps: "6-8",
    hingeReps: "8",
    accessoryReps: "10-12",
    run: { intervals: 8, runMinutes: 1, walkMinutes: 1 },
  },
  {
    phase: "accumulation",
    sets: 3,
    rpe: 7,
    squatReps: "6-8",
    hingeReps: "8",
    accessoryReps: "10-12",
    run: { intervals: 6, runMinutes: 2, walkMinutes: 1 },
  },
  {
    phase: "accumulation",
    sets: 3,
    rpe: 7,
    squatReps: "6-8",
    hingeReps: "8-10",
    accessoryReps: "10-12",
    run: { intervals: 5, runMinutes: 3, walkMinutes: 1 },
  },
  {
    phase: "intensification",
    sets: 3,
    rpe: 7.5,
    squatReps: "5-6",
    hingeReps: "6-8",
    accessoryReps: "8-10",
    run: { intervals: 4, runMinutes: 5, walkMinutes: 1 },
  },
  {
    phase: "intensification",
    sets: 3,
    rpe: 8,
    squatReps: "5-6",
    hingeReps: "6-8",
    accessoryReps: "8-10",
    run: { intervals: 3, runMinutes: 8, walkMinutes: 1 },
  },
  {
    phase: "deload",
    sets: 2,
    rpe: 6,
    squatReps: "6",
    hingeReps: "8",
    accessoryReps: "10",
    run: { intervals: 2, runMinutes: 8, walkMinutes: 2 },
  },
];

function ex(
  exerciseName: string,
  sets: number,
  repRange: string,
  targetRpe: number,
  restSeconds: number,
  notes: string | null = null,
): MesocycleExercisePlan {
  return { exerciseName, sets, repRange, targetRpe, restSeconds, notes };
}

function strengthA(w: WeekParams): MesocycleSessionPlan {
  const accessorySets = Math.max(2, w.sets - 1);
  return {
    dayOfWeek: 2,
    sessionType: "Strength A: Squat + Push",
    estimatedDurationMinutes: w.sets === 2 ? 35 : 45,
    exercises: [
      ex(
        "Barbell Back Squat",
        w.sets,
        w.squatReps,
        w.rpe,
        150,
        "Start from your last working weight. Add 2.5 kg when every set hits the top of the rep range at or below target RPE.",
      ),
      ex("Barbell Hip Thrust", w.sets, "8-10", w.rpe, 120, null),
      ex("Incline Dumbbell Press", w.sets, "8-10", w.rpe, 120, null),
      ex(
        "Chest Supported Row",
        accessorySets,
        w.accessoryReps,
        w.rpe,
        90,
        "Chest support keeps load off the lower back.",
      ),
      ex(
        "Eccentric Calf Raise",
        2,
        "8",
        Math.min(w.rpe, 7),
        45,
        "Per side, 3-4 s lowering. Ankle resilience work for the ATFL side.",
      ),
      ex("Dead Bug", 2, "6", 6, 45, "Per side. Lower back stays flat."),
    ],
  };
}

function strengthB(w: WeekParams): MesocycleSessionPlan {
  const accessorySets = Math.max(2, w.sets - 1);
  return {
    dayOfWeek: 6,
    sessionType: "Strength B: Hinge + Pull",
    estimatedDurationMinutes: w.sets === 2 ? 35 : 45,
    exercises: [
      ex(
        "Romanian Deadlift",
        w.sets,
        w.hingeReps,
        Math.min(w.rpe, 7.5),
        150,
        "Back-sensitive: keep 2-3 reps in reserve and stop the set if form changes. Build from 40 kg.",
      ),
      ex("Lat Pulldown", w.sets, "8-10", w.rpe, 90, null),
      ex("Dumbbell Flat Press", w.sets, "8-10", w.rpe, 120, null),
      ex(
        "Bulgarian Split Squat",
        accessorySets,
        "8",
        Math.min(w.rpe, 7),
        90,
        "Per side. Bodyweight or light dumbbells; hold a rack if balance is off. Doubles as ankle stability work.",
      ),
      ex("Seated Cable Row", accessorySets, w.accessoryReps, w.rpe, 90, null),
      ex(
        "Suitcase Carry",
        2,
        "30-40",
        7,
        60,
        "Seconds per side. Stand tall; don't lean.",
      ),
    ],
  };
}

function conditioning(w: WeekParams): MesocycleSessionPlan {
  const { intervals, runMinutes, walkMinutes } = w.run;
  const total = intervals * (runMinutes + walkMinutes) + 10;
  return {
    dayOfWeek: 4,
    sessionType: "Run-Walk + Mobility",
    estimatedDurationMinutes: total,
    exercises: [
      ex(
        "Running",
        intervals,
        String(runMinutes),
        5,
        walkMinutes * 60,
        `Run ${runMinutes} min, walk ${walkMinutes} min, ×${intervals}. Conversational pace: you should be able to talk. Log run minutes as reps.`,
      ),
      ex("Deep Squat Hold", 1, "60", 5, 30, "Seconds. Cool-down."),
      ex("Couch Stretch", 1, "45", 5, 15, "Seconds per side. Cool-down."),
    ],
  };
}

export function buildReturnToConsistencyPlan(): GeneratedMesocyclePlan {
  const weeks: MesocycleWeekPlan[] = WEEKS.map((w, i) => ({
    weekNumber: i + 1,
    phase: w.phase,
    // Rotation order when flexible: A → Run → B.
    sessions: [strengthA(w), conditioning(w), strengthB(w)],
  }));

  return {
    name: "Return to Consistency",
    durationWeeks: weeks.length,
    periodizationModel: "linear",
    goal: RETURN_TO_CONSISTENCY_ID,
    weeks,
    flexibleSchedule: true,
  };
}

export const RETURN_TO_CONSISTENCY_SUMMARY = {
  title: "Return to Consistency",
  subtitle: "6 weeks · 3 sessions/week · 35–45 min",
  bullets: [
    "Two full-body strength sessions keep your squat, hinge, press and pull moving forward",
    "One run-walk session rebuilds your aerobic base, from 1-min intervals to 8-min runs",
    "Sessions run in order whenever you get the chance, not on fixed days",
    "Pair it with the daily 10-min mobility routine for ankles, hips and T-spine",
    "Week 6 is a deload before your next block",
  ],
} as const;
