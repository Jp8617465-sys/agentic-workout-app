import type { ResolvedExerciseName } from "../types";

// Strong's default names ("Movement (Equipment)") → this app's exercise library.
export const STRONG_TO_LIBRARY: Record<string, string> = {
  "squat (barbell)": "Barbell Back Squat",
  "front squat (barbell)": "Front Squat",
  "goblet squat (kettlebell)": "Goblet Squat",
  "goblet squat (dumbbell)": "Goblet Squat",
  "hack squat": "Hack Squat",
  "hack squat (machine)": "Hack Squat",
  "leg press": "Leg Press",
  "leg press (machine)": "Leg Press",
  "bulgarian split squat": "Bulgarian Split Squat",
  "bulgarian split squat (dumbbell)": "Bulgarian Split Squat",
  "walking lunge (dumbbell)": "Walking Lunge",
  "lunge (dumbbell)": "Reverse Lunge",
  "reverse lunge (dumbbell)": "Reverse Lunge",
  "step-up (dumbbell)": "Step-Up",
  "bench press (barbell)": "Barbell Bench Press",
  "bench press (dumbbell)": "Dumbbell Flat Press",
  "incline bench press (dumbbell)": "Incline Dumbbell Press",
  "bench press - close grip (barbell)": "Close-Grip Bench Press",
  "chest press (machine)": "Machine Chest Press",
  "push up": "Push-Up",
  "push-up": "Push-Up",
  "chest dip": "Dip",
  "overhead press (barbell)": "Overhead Press",
  "overhead press (dumbbell)": "Dumbbell Shoulder Press",
  "seated overhead press (dumbbell)": "Dumbbell Shoulder Press",
  "shoulder press (dumbbell)": "Dumbbell Shoulder Press",
  "shoulder press (machine)": "Machine Shoulder Press",
  "landmine press": "Landmine Press",
  "deadlift (barbell)": "Conventional Deadlift",
  "deadlift (trap bar)": "Trap Bar Deadlift",
  "sumo deadlift (barbell)": "Sumo Deadlift",
  "romanian deadlift (barbell)": "Romanian Deadlift",
  "romanian deadlift (dumbbell)": "Romanian Deadlift",
  "single leg romanian deadlift (dumbbell)": "Single Leg Romanian Deadlift",
  "hip thrust (barbell)": "Barbell Hip Thrust",
  "good morning (barbell)": "Good Morning",
  "bent over row (barbell)": "Barbell Row",
  "pendlay row (barbell)": "Pendlay Row",
  "bent over one arm row (dumbbell)": "Dumbbell Row",
  "t bar row": "T-Bar Row",
  "seated row (cable)": "Seated Cable Row",
  "seated row (machine)": "Seated Row Machine",
  "chest supported row (dumbbell)": "Chest Supported Row",
  "inverted row": "Inverted Row",
  "lat pulldown (cable)": "Lat Pulldown",
  "lat pulldown (machine)": "Lat Pulldown",
  "pull up": "Pull-Up",
  "pull up (assisted)": "Pull-Up",
  "chin up": "Chin-Up",
  "face pull (cable)": "Face Pull",
  "reverse fly (dumbbell)": "Reverse Fly",
  "lateral raise (dumbbell)": "Lateral Raise",
  "lateral raise (cable)": "Cable Lateral Raise",
  "front raise (dumbbell)": "Front Raise",
  "shrug (dumbbell)": "Dumbbell Shrug",
  "bicep curl (barbell)": "Barbell Curl",
  "bicep curl (dumbbell)": "Dumbbell Curl",
  "bicep curl (cable)": "Cable Bicep Curl",
  "hammer curl (dumbbell)": "Hammer Curl",
  "preacher curl (barbell)": "Preacher Curl",
  "ez bar curl": "EZ Bar Curl",
  "triceps pushdown (cable - straight bar)": "Tricep Pushdown",
  "triceps pushdown (cable - rope)": "Tricep Pushdown",
  "triceps extension (cable)": "Cable Tricep Overhead Extension",
  "triceps extension (dumbbell)": "Overhead Tricep Extension",
  "skullcrusher (barbell)": "Skull Crusher",
  "chest fly (dumbbell)": "Dumbbell Fly",
  "cable crossover": "Cable Fly",
  "leg extension (machine)": "Leg Extension",
  "lying leg curl (machine)": "Leg Curl",
  "seated leg curl (machine)": "Leg Curl",
  "standing calf raise (machine)": "Standing Calf Raise",
  "standing calf raise (dumbbell)": "Standing Calf Raise",
  "seated calf raise (machine)": "Seated Calf Raise",
  "hip abductor (machine)": "Hip Abduction",
  "hip adductor (machine)": "Hip Adduction",
  "farmers walk": "Farmer's Walk",
  "farmer's walk": "Farmer's Walk",
  plank: "Plank",
  "hanging leg raise": "Hanging Leg Raise",
  "ab wheel": "Ab Wheel Rollout",
  "cable crunch": "Cable Crunch",
  "russian twist": "Russian Twist",
  "kettlebell swing": "Kettlebell Swing",
  running: "Running",
  "running (treadmill)": "Running",
  cycling: "Cycling",
  "cycling (indoor)": "Cycling",
  "rowing (machine)": "Rowing Machine",
  "elliptical trainer": "Elliptical",
  "stair climber": "Stair Climber",
  "jump rope": "Jump Rope",
  swimming: "Swimming",
};

function normalize(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Maps a Strong exercise name to the app library. Unknown names are kept verbatim so
 * the importer can register them as custom exercises rather than dropping data.
 */
export function resolveExerciseName(
  strongName: string,
  libraryNames: readonly string[],
): ResolvedExerciseName {
  const key = normalize(strongName);
  const byLower = new Map(libraryNames.map((n) => [n.toLowerCase(), n]));

  const mapped = STRONG_TO_LIBRARY[key];
  if (mapped && byLower.has(mapped.toLowerCase())) {
    return {
      name: byLower.get(mapped.toLowerCase()) as string,
      matchedLibrary: true,
    };
  }

  const exact = byLower.get(key);
  if (exact) return { name: exact, matchedLibrary: true };

  // "Movement (Equipment)" → try "Equipment Movement" and "Movement".
  const paren = /^(.*?)\s*\(([^)]+)\)$/.exec(strongName.trim());
  if (paren) {
    const movement = paren[1].toLowerCase();
    const equipment = paren[2].toLowerCase();
    const candidate =
      byLower.get(`${equipment} ${movement}`) ?? byLower.get(movement);
    if (candidate) return { name: candidate, matchedLibrary: true };
  }

  return { name: strongName.trim(), matchedLibrary: false };
}
