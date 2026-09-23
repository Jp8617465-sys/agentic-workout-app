import type { MobilityTestId, MobilitySide } from "../../../types";

export type DrillMode = "reps" | "hold";

export interface MobilityDrill {
  exerciseName: string;
  mode: DrillMode;
  /** Reps, or seconds for holds — per side when perSide is true. */
  amount: number;
  perSide: boolean;
  cue: string;
}

export interface MobilityRoutine {
  id: "daily_10" | "quick_5";
  name: string;
  description: string;
  drills: MobilityDrill[];
}

// Ankle, hip and T-spine work first: those regress fastest with sitting, sleep loss and holding a baby.
const DAILY_10: MobilityRoutine = {
  id: "daily_10",
  name: "Daily 10",
  description: "Full routine for ankles, hips, T-spine and trunk control.",
  drills: [
    {
      exerciseName: "Cat-Cow Stretch",
      mode: "reps",
      amount: 8,
      perSide: false,
      cue: "Move one vertebra at a time",
    },
    {
      exerciseName: "World's Greatest Stretch",
      mode: "reps",
      amount: 4,
      perSide: true,
      cue: "Reach the elbow to the instep, then rotate open",
    },
    {
      exerciseName: "Knee-to-Wall Ankle Mobilization",
      mode: "reps",
      amount: 10,
      perSide: true,
      cue: "Heel stays down; spend extra time on the stiffer side",
    },
    {
      exerciseName: "90/90 Hip Switch",
      mode: "reps",
      amount: 6,
      perSide: true,
      cue: "Tall spine, rotate from the hips",
    },
    {
      exerciseName: "Thoracic Open Book",
      mode: "reps",
      amount: 6,
      perSide: true,
      cue: "Knees stacked, exhale as you open",
    },
    {
      exerciseName: "Couch Stretch",
      mode: "hold",
      amount: 45,
      perSide: true,
      cue: "Squeeze the back glute, ribs down",
    },
    {
      exerciseName: "Deep Squat Hold",
      mode: "hold",
      amount: 60,
      perSide: false,
      cue: "Heels down, hold a post if needed",
    },
    {
      exerciseName: "Dead Bug",
      mode: "reps",
      amount: 6,
      perSide: true,
      cue: "Lower back pressed to the floor",
    },
    {
      exerciseName: "Single-Leg Balance",
      mode: "hold",
      amount: 30,
      perSide: true,
      cue: "Grip the floor; eyes closed if it's easy",
    },
  ],
};

const QUICK_5: MobilityRoutine = {
  id: "quick_5",
  name: "Quick 5",
  description: "For days you only have five minutes. The essentials.",
  drills: [
    {
      exerciseName: "World's Greatest Stretch",
      mode: "reps",
      amount: 3,
      perSide: true,
      cue: "Slow and deliberate",
    },
    {
      exerciseName: "Knee-to-Wall Ankle Mobilization",
      mode: "reps",
      amount: 10,
      perSide: true,
      cue: "Heel stays down",
    },
    {
      exerciseName: "90/90 Hip Switch",
      mode: "reps",
      amount: 5,
      perSide: true,
      cue: "Tall spine",
    },
    {
      exerciseName: "Deep Squat Hold",
      mode: "hold",
      amount: 45,
      perSide: false,
      cue: "Breathe into the bottom",
    },
  ],
};

export const MOBILITY_ROUTINES: readonly MobilityRoutine[] = [
  DAILY_10,
  QUICK_5,
];

const SECONDS_PER_REP = 4;
const TRANSITION_SECONDS = 10;

export function estimateRoutineSeconds(routine: MobilityRoutine): number {
  return routine.drills.reduce((total, d) => {
    const sides = d.perSide ? 2 : 1;
    const work = d.mode === "hold" ? d.amount : d.amount * SECONDS_PER_REP;
    return total + work * sides + TRANSITION_SECONDS;
  }, 0);
}

export function formatDrillPrescription(drill: MobilityDrill): string {
  const unit = drill.mode === "hold" ? `${drill.amount}s` : `${drill.amount}`;
  return drill.perSide
    ? `${unit} / side`
    : drill.mode === "hold"
      ? unit
      : `${unit} reps`;
}

export interface MobilityTestDefinition {
  id: MobilityTestId;
  name: string;
  unit: "cm" | "s";
  sides: MobilitySide[];
  higherIsBetter: boolean;
  instructions: string;
  target: string;
}

export const MOBILITY_TESTS: readonly MobilityTestDefinition[] = [
  {
    id: "knee_to_wall",
    name: "Knee-to-wall",
    unit: "cm",
    sides: ["left", "right"],
    higherIsBetter: true,
    instructions:
      "Furthest toe-to-wall distance where the knee still touches with the heel down.",
    target: "10 cm+ each side, and within 2 cm left-to-right",
  },
  {
    id: "toe_touch",
    name: "Standing toe touch",
    unit: "cm",
    sides: ["both"],
    higherIsBetter: false,
    instructions:
      "Fingertip distance above the floor with straight knees. Negative if past the floor.",
    target: "Fingertips to floor (0 cm)",
  },
  {
    id: "deep_squat_hold",
    name: "Deep squat hold",
    unit: "s",
    sides: ["both"],
    higherIsBetter: true,
    instructions:
      "Seconds you can hold a comfortable, heels-down deep squat without support.",
    target: "60 s+",
  },
];

export interface AssessmentTrend {
  latest: number;
  baseline: number;
  change: number;
  improved: boolean | null;
}

/** Values must be ordered oldest → newest. */
export function computeTrend(
  values: number[],
  higherIsBetter: boolean,
): AssessmentTrend | null {
  if (values.length === 0) return null;
  const baseline = values[0];
  const latest = values[values.length - 1];
  const change = Math.round((latest - baseline) * 10) / 10;
  const improved =
    change === 0 ? null : higherIsBetter ? change > 0 : change < 0;
  return { latest, baseline, change, improved };
}

/** Largest left/right knee-to-wall gap worth flagging for someone with a previous ankle sprain. */
export const ANKLE_ASYMMETRY_FLAG_CM = 2;

export function ankleAsymmetry(
  left: number | null,
  right: number | null,
): number | null {
  if (left === null || right === null) return null;
  return Math.round(Math.abs(left - right) * 10) / 10;
}
