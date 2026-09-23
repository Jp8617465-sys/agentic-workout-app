import seedData from "../../../constants/exercises/seed-data.json";
import { buildReturnToConsistencyPlan } from "./return-to-consistency";
import {
  pickSession,
  targetRepsFromRange,
  weekStartDate,
} from "../services/session-picker";

const LIBRARY = new Set((seedData as { name: string }[]).map((e) => e.name));
const plan = buildReturnToConsistencyPlan();

describe("Return to Consistency plan", () => {
  it("is a 6-week flexible block of 3 sessions per week", () => {
    expect(plan.durationWeeks).toBe(6);
    expect(plan.weeks).toHaveLength(6);
    expect(plan.flexibleSchedule).toBe(true);
    for (const week of plan.weeks) expect(week.sessions).toHaveLength(3);
  });

  it("only prescribes exercises that exist in the library", () => {
    const names = plan.weeks.flatMap((w) =>
      w.sessions.flatMap((s) => s.exercises.map((e) => e.exerciseName)),
    );
    expect(names.filter((n) => !LIBRARY.has(n))).toEqual([]);
  });

  it("ends with a deload that cuts sets and RPE", () => {
    const deload = plan.weeks[5];
    const peak = plan.weeks[4];
    expect(deload.phase).toBe("deload");
    const squat = (w: typeof deload) =>
      w.sessions[0].exercises.find(
        (e) => e.exerciseName === "Barbell Back Squat",
      );
    expect(squat(deload)?.sets).toBeLessThan(squat(peak)?.sets ?? 0);
    expect(squat(deload)?.targetRpe).toBeLessThan(squat(peak)?.targetRpe ?? 0);
  });

  it("progresses continuous running time week over week until the deload", () => {
    const runMinutes = plan.weeks.slice(0, 5).map((w) => {
      const run = w.sessions[1].exercises.find(
        (e) => e.exerciseName === "Running",
      );
      return Number(run?.repRange);
    });
    expect(runMinutes).toEqual([1, 2, 3, 5, 8]);
  });

  it("never pushes back-sensitive hinge work above RPE 7.5", () => {
    const rdlRpes = plan.weeks.map(
      (w) =>
        w.sessions[2].exercises.find(
          (e) => e.exerciseName === "Romanian Deadlift",
        )?.targetRpe ?? 0,
    );
    expect(Math.max(...rdlRpes)).toBeLessThanOrEqual(7.5);
  });

  it("keeps every session under 50 minutes", () => {
    const durations = plan.weeks.flatMap((w) =>
      w.sessions.map((s) => s.estimatedDurationMinutes),
    );
    expect(Math.max(...durations)).toBeLessThanOrEqual(50);
  });
});

describe("pickSession", () => {
  const week = plan.weeks[0];

  it("rotates through sessions in order on a flexible plan", () => {
    expect(
      pickSession(week, { flexible: true, dayOfWeek: 0, completedThisWeek: 0 })
        ?.sessionType,
    ).toMatch(/Strength A/);
    expect(
      pickSession(week, { flexible: true, dayOfWeek: 0, completedThisWeek: 1 })
        ?.sessionType,
    ).toMatch(/Run-Walk/);
    expect(
      pickSession(week, { flexible: true, dayOfWeek: 0, completedThisWeek: 2 })
        ?.sessionType,
    ).toMatch(/Strength B/);
    expect(
      pickSession(week, { flexible: true, dayOfWeek: 0, completedThisWeek: 3 }),
    ).toBeNull();
  });

  it("uses the weekday on a fixed plan", () => {
    expect(
      pickSession(week, { flexible: false, dayOfWeek: 2, completedThisWeek: 0 })
        ?.sessionType,
    ).toMatch(/Strength A/);
    expect(
      pickSession(week, {
        flexible: false,
        dayOfWeek: 1,
        completedThisWeek: 0,
      }),
    ).toBeNull();
  });
});

describe("helpers", () => {
  it("targets the top of a rep range", () => {
    expect(targetRepsFromRange("6-8")).toBe(8);
    expect(targetRepsFromRange("5")).toBe(5);
    expect(targetRepsFromRange("AMRAP")).toBe(8);
  });

  it("computes week start dates across month boundaries", () => {
    expect(weekStartDate("2026-09-23", 1)).toBe("2026-09-23");
    expect(weekStartDate("2026-09-23", 2)).toBe("2026-09-30");
    expect(weekStartDate("2026-09-23", 3)).toBe("2026-10-07");
  });
});
