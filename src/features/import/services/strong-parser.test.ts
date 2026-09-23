import { parseStrongText, parseSetLine } from "./strong-parser";
import { resolveExerciseName, STRONG_TO_LIBRARY } from "./exercise-name-map";
import seedData from "../../../constants/exercises/seed-data.json";

const LIBRARY = (seedData as { name: string }[]).map((e) => e.name);

const TWO_WORKOUTS = `Morning Workout
Friday, 4 September 2026 at 9:58 am

Incline Bench Press (Dumbbell)
Set 1: 22 kg × 8
Set 2: 22 kg × 8

Squat (Barbell)
Set 1: 60 kg × 6
Set 2: 60 kg × 6
Set 3: 60 kg × 6

Hip Thrust (Barbell)
Set 1: 70 kg × 8
Set 2: 70 kg × 8

Seated Overhead Press (Dumbbell)
Set 1: 12 kg × 8
Set 2: 12 kg × 8
Set 3: 12 kg × 8
https://link.strong.app/bstglqmb

Morning Workout
Saturday, 29 August 2026 at 10:34 am

Bench Press (Dumbbell)
Set 1: 24 kg × 8
Set 2: 24 kg × 8

Romanian Deadlift (Barbell)
Set 1: 40 kg × 8
Set 2: 40 kg × 8

Seated Row (Cable)
Set 1: 50 kg × 8
Set 2: 50 kg × 8

Lat Pulldown (Cable)
Set 1: 50 kg × 8
Set 2: 50 kg × 8

Leg Press
Set 1: 80 kg × 10
Set 2: 80 kg × 10
https://link.strong.app/rgrmhdwk`;

describe("parseStrongText", () => {
  it("parses both pasted workouts, oldest first", () => {
    const { workouts, warnings } = parseStrongText(TWO_WORKOUTS);

    expect(warnings).toEqual([]);
    expect(workouts).toHaveLength(2);
    expect(workouts[0].date).toBe("2026-08-29");
    expect(workouts[0].startedAt).toBe("2026-08-29T10:34:00");
    expect(workouts[1].date).toBe("2026-09-04");
    expect(workouts[1].startedAt).toBe("2026-09-04T09:58:00");
    expect(workouts[1].title).toBe("Morning Workout");
    expect(workouts[1].sourceUrl).toBe("https://link.strong.app/bstglqmb");
  });

  it("captures every exercise and set", () => {
    const [aug29, sep4] = parseStrongText(TWO_WORKOUTS).workouts;

    expect(sep4.exercises.map((e) => e.sourceName)).toEqual([
      "Incline Bench Press (Dumbbell)",
      "Squat (Barbell)",
      "Hip Thrust (Barbell)",
      "Seated Overhead Press (Dumbbell)",
    ]);
    expect(sep4.exercises[1].sets).toHaveLength(3);
    expect(sep4.exercises[1].sets[2]).toMatchObject({
      setNumber: 3,
      weight: 60,
      weightUnit: "kg",
      reps: 6,
      type: "working",
    });

    expect(aug29.exercises).toHaveLength(5);
    expect(aug29.exercises[4]).toMatchObject({ sourceName: "Leg Press" });
    expect(aug29.exercises[4].sets[0]).toMatchObject({ weight: 80, reps: 10 });
  });

  it("parses US-format dates and pm times", () => {
    const { workouts } = parseStrongText(
      "Evening Lift\nTuesday, September 22, 2026 at 6:05 PM\n\nDeadlift (Barbell)\nSet 1: 100 kg × 5",
    );
    expect(workouts[0].startedAt).toBe("2026-09-22T18:05:00");
  });

  it("skips workouts with no sets and reports a warning", () => {
    const { workouts, warnings } = parseStrongText(
      "Empty\nMonday, 21 September 2026 at 7:00 am\n",
    );
    expect(workouts).toHaveLength(0);
    expect(warnings).toHaveLength(1);
  });
});

describe("parseSetLine", () => {
  it("reads RPE, pounds, warm-ups and bodyweight reps", () => {
    expect(parseSetLine("Set 2: 100 kg × 5 @ 8.5", 1)).toMatchObject({
      weight: 100,
      reps: 5,
      rpe: 8.5,
    });
    expect(parseSetLine("Set 1: 135 lb × 5", 1)).toMatchObject({
      weight: 135,
      weightUnit: "lb",
    });
    expect(parseSetLine("W: 20 kg × 10", 1)).toMatchObject({
      type: "warmup",
      setNumber: 1,
    });
    expect(parseSetLine("Set 1: 12 reps", 1)).toMatchObject({
      weight: null,
      reps: 12,
    });
  });

  it("reads cardio distance and duration", () => {
    expect(parseSetLine("Set 1: 5 km | 28:30", 1)).toMatchObject({
      distanceKm: 5,
      durationSeconds: 1710,
    });
    expect(parseSetLine("Set 1: 1:02:00", 1)).toMatchObject({
      durationSeconds: 3720,
    });
  });
});

describe("resolveExerciseName", () => {
  it("maps every exercise from the pasted workouts onto the library", () => {
    const expected: Record<string, string> = {
      "Incline Bench Press (Dumbbell)": "Incline Dumbbell Press",
      "Squat (Barbell)": "Barbell Back Squat",
      "Hip Thrust (Barbell)": "Barbell Hip Thrust",
      "Seated Overhead Press (Dumbbell)": "Dumbbell Shoulder Press",
      "Bench Press (Dumbbell)": "Dumbbell Flat Press",
      "Romanian Deadlift (Barbell)": "Romanian Deadlift",
      "Seated Row (Cable)": "Seated Cable Row",
      "Lat Pulldown (Cable)": "Lat Pulldown",
      "Leg Press": "Leg Press",
    };
    for (const [strong, library] of Object.entries(expected)) {
      expect(resolveExerciseName(strong, LIBRARY)).toEqual({
        name: library,
        matchedLibrary: true,
      });
    }
  });

  it("only maps onto exercises that exist in the bundled library", () => {
    const missing = Object.values(STRONG_TO_LIBRARY).filter(
      (n) => !LIBRARY.includes(n),
    );
    expect(missing).toEqual([]);
  });

  it("keeps unknown exercises verbatim as custom", () => {
    expect(resolveExerciseName("Sled Push", LIBRARY)).toEqual({
      name: "Sled Push",
      matchedLibrary: false,
    });
  });
});
