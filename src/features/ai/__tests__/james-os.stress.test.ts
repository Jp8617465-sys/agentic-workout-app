/**
 * JAMES-OS stress tests.
 * Imports dt-engine and kb-manifest directly — no Deno runtime, no network calls.
 * Run with: npx jest --config jest.james-os.config.js
 */

import {
  runDT01,
  runDT03,
  filterExercisesForConstraints,
  type DT01Input,
  type DT03Input,
  type SessionType,
} from "../../../../supabase/functions/james-os/dt-engine";
import {
  KB_FILE_PATHS,
  COMMAND_KB_MAP,
  getKBPathsForCommand,
  type JamesOSCommand,
} from "../../../../supabase/functions/james-os/kb-manifest";

// ─── Suite 1: DT-01 boundary conditions ──────────────────────────────────────

describe("DT-01: boundary conditions", () => {
  const SESSION_ORDER: SessionType[] = ["rest", "active_recovery", "reduced", "full"];

  function makeInput(overrides: Partial<DT01Input> = {}): DT01Input {
    return {
      wellnessScore: 14,
      lastSessionRpe: 7,
      consecutiveHighRpeSessions: 0,
      daysSinceLastSession: 2,
      ...overrides,
    };
  }

  it("returns valid shape for all wellness scores 4–20", () => {
    for (let ws = 4; ws <= 20; ws++) {
      const result = runDT01(makeInput({ wellnessScore: ws }));
      expect(result).toHaveProperty("sessionType");
      expect(result).toHaveProperty("volumeModifier");
      expect(result).toHaveProperty("intensityModifier");
      expect(result).toHaveProperty("rationale");
      expect(typeof result.rationale).toBe("string");
      expect(result.rationale.length).toBeGreaterThan(0);
    }
  });

  it("volumeModifier is in range 0.0–1.0 for all wellness scores", () => {
    for (let ws = 4; ws <= 20; ws++) {
      const { volumeModifier } = runDT01(makeInput({ wellnessScore: ws }));
      expect(volumeModifier).toBeGreaterThanOrEqual(0);
      expect(volumeModifier).toBeLessThanOrEqual(1);
    }
  });

  it("intensityModifier is in range 0.0–1.0 for all wellness scores", () => {
    for (let ws = 4; ws <= 20; ws++) {
      const { intensityModifier } = runDT01(makeInput({ wellnessScore: ws }));
      expect(intensityModifier).toBeGreaterThanOrEqual(0);
      expect(intensityModifier).toBeLessThanOrEqual(1);
    }
  });

  it("wellness 4 → rest", () => {
    const { sessionType } = runDT01(makeInput({ wellnessScore: 4, consecutiveHighRpeSessions: 0 }));
    expect(sessionType).toBe("rest");
  });

  it("wellness 5 → rest", () => {
    const { sessionType } = runDT01(makeInput({ wellnessScore: 5, consecutiveHighRpeSessions: 0 }));
    expect(sessionType).toBe("rest");
  });

  it("wellness 20 + low RPE → full", () => {
    const { sessionType } = runDT01(
      makeInput({ wellnessScore: 20, lastSessionRpe: 6, consecutiveHighRpeSessions: 0 })
    );
    expect(sessionType).toBe("full");
  });

  it("full session has volumeModifier 1.0", () => {
    const { volumeModifier, sessionType } = runDT01(
      makeInput({ wellnessScore: 18, lastSessionRpe: 7, consecutiveHighRpeSessions: 0 })
    );
    expect(sessionType).toBe("full");
    expect(volumeModifier).toBe(1.0);
  });

  it("rest session has volumeModifier 0", () => {
    const { volumeModifier, sessionType } = runDT01(makeInput({ wellnessScore: 5 }));
    expect(sessionType).toBe("rest");
    expect(volumeModifier).toBe(0);
  });

  it("session severity ordering: rest ≤ active_recovery ≤ reduced ≤ full by volumeModifier", () => {
    const rest = runDT01(makeInput({ wellnessScore: 5, consecutiveHighRpeSessions: 0 }));
    const activeRecovery = runDT01(makeInput({ wellnessScore: 7, consecutiveHighRpeSessions: 0 }));
    const reduced = runDT01(makeInput({ wellnessScore: 10, lastSessionRpe: 9, consecutiveHighRpeSessions: 0 }));
    const full = runDT01(makeInput({ wellnessScore: 18, lastSessionRpe: 7, consecutiveHighRpeSessions: 0 }));

    expect(rest.volumeModifier).toBeLessThanOrEqual(activeRecovery.volumeModifier);
    expect(activeRecovery.volumeModifier).toBeLessThanOrEqual(reduced.volumeModifier);
    expect(reduced.volumeModifier).toBeLessThanOrEqual(full.volumeModifier);
  });
});

// ─── Suite 2: DT-01 consecutive high RPE ─────────────────────────────────────

describe("DT-01: consecutive high RPE", () => {
  it("3+ consecutive high-RPE sessions → never full", () => {
    for (let n = 3; n <= 10; n++) {
      const { sessionType } = runDT01({
        wellnessScore: 14,
        lastSessionRpe: 8,
        consecutiveHighRpeSessions: n,
        daysSinceLastSession: 1,
      });
      expect(sessionType).not.toBe("full");
    }
  });

  it("3+ consecutive + low wellness → rest", () => {
    const { sessionType } = runDT01({
      wellnessScore: 7,
      lastSessionRpe: 8.5,
      consecutiveHighRpeSessions: 3,
      daysSinceLastSession: 1,
    });
    expect(sessionType).toBe("rest");
  });
});

// ─── Suite 3: DT-03 RPE accuracy ─────────────────────────────────────────────

describe("DT-03: load recommendation accuracy", () => {
  const phases: Array<DT03Input["phase"]> = [
    "accumulation", "intensification", "realization", "deload",
  ];

  function makeInput(overrides: Partial<DT03Input> = {}): DT03Input {
    return {
      exerciseName: "squat",
      lastWeight: 100,
      lastRpe: 7.5,
      targetRpe: 7.5,
      sets: 4,
      reps: 5,
      phase: "accumulation",
      activeConstraints: [],
      ...overrides,
    };
  }

  it("returns valid shape", () => {
    const result = runDT03(makeInput());
    expect(result).toHaveProperty("recommendedWeight");
    expect(result).toHaveProperty("sets");
    expect(result).toHaveProperty("reps");
    expect(result).toHaveProperty("rationale");
    expect(result).toHaveProperty("constraintApplied");
    expect(typeof result.rationale).toBe("string");
  });

  it("recommendedWeight is a positive number rounded to nearest 2.5", () => {
    const { recommendedWeight } = runDT03(makeInput());
    expect(recommendedWeight).toBeGreaterThan(0);
    expect(recommendedWeight % 2.5).toBeCloseTo(0);
  });

  it("30 random inputs: recommendedWeight within phase-appropriate bounds", () => {
    const rng = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    // Deload can legitimately be far from last session (RPE shift + −15% phase modifier).
    // Other phases: ±20% covers RPE swing + progression modifier.
    const maxPctByPhase: Record<string, number> = {
      accumulation:    0.20,
      intensification: 0.20,
      realization:     0.20,
      deload:          0.35,
    };

    for (let i = 0; i < 30; i++) {
      const lastWeight = rng(20, 250);
      const lastRpe = rng(6, 10);
      const targetRpe = rng(6, 9.5);
      const phase = phases[Math.floor(Math.random() * phases.length)];
      const reps = [3, 4, 5, 6, 8, 10][Math.floor(Math.random() * 6)];

      const { recommendedWeight } = runDT03(
        makeInput({ lastWeight, lastRpe, targetRpe, phase, reps })
      );

      const pctDiff = Math.abs(recommendedWeight - lastWeight) / lastWeight;
      expect(pctDiff).toBeLessThan(maxPctByPhase[phase]);
    }
  });

  it("deload phase reduces weight vs accumulation", () => {
    const base = makeInput({ phase: "accumulation" });
    const deload = makeInput({ phase: "deload" });
    expect(runDT03(deload).recommendedWeight).toBeLessThan(runDT03(base).recommendedWeight);
  });

  it("higher targetRpe → more weight", () => {
    const low = runDT03(makeInput({ targetRpe: 6 }));
    const high = runDT03(makeInput({ targetRpe: 9 }));
    expect(high.recommendedWeight).toBeGreaterThanOrEqual(low.recommendedWeight);
  });
});

// ─── Suite 4: Constraint Guard (dynamic) ─────────────────────────────────────

describe("Constraint Guard: dynamic constraint handling", () => {
  const exercises = [
    "barbell_squat",
    "single_leg_calf_raise",
    "jump_lunge",
    "bench_press",
    "lat_pulldown",
  ];

  it("with right_ankle + plantar constraints → calf_raise and jump_lunge are excluded or modified", () => {
    const { allowed, modified, excluded } = filterExercisesForConstraints(
      exercises,
      ["right_ankle", "plantar"]
    );
    const flagged = [...modified, ...excluded];
    expect(flagged.some((e) => e.includes("calf_raise"))).toBe(true);
    expect(flagged.some((e) => e.includes("jump_lunge"))).toBe(true);
  });

  it("with no constraints (injury resolved) → all exercises allowed", () => {
    const { allowed, modified, excluded } = filterExercisesForConstraints(exercises, []);
    expect(allowed).toHaveLength(exercises.length);
    expect(modified).toHaveLength(0);
    expect(excluded).toHaveLength(0);
  });

  it("bench_press and lat_pulldown allowed under ankle/plantar constraints", () => {
    const { allowed } = filterExercisesForConstraints(
      ["bench_press", "lat_pulldown"],
      ["right_ankle", "plantar"]
    );
    expect(allowed).toContain("bench_press");
    expect(allowed).toContain("lat_pulldown");
  });

  it("result is deterministic (same inputs → same output)", () => {
    const a = filterExercisesForConstraints(exercises, ["right_ankle"]);
    const b = filterExercisesForConstraints(exercises, ["right_ankle"]);
    expect(a).toEqual(b);
  });

  it("total count equals input length", () => {
    const { allowed, modified, excluded } = filterExercisesForConstraints(
      exercises,
      ["right_ankle", "plantar"]
    );
    expect(allowed.length + modified.length + excluded.length).toBe(exercises.length);
  });
});

// ─── Suite 5: KB manifest integrity ──────────────────────────────────────────

describe("KB manifest integrity", () => {
  const allPaths = Object.values(KB_FILE_PATHS);

  it("has 20 KB file paths", () => {
    expect(allPaths).toHaveLength(20);
  });

  it("all paths are non-empty strings", () => {
    for (const p of allPaths) {
      expect(typeof p).toBe("string");
      expect(p.length).toBeGreaterThan(0);
    }
  });

  it("no duplicate storage paths", () => {
    const unique = new Set(allPaths);
    expect(unique.size).toBe(allPaths.length);
  });

  it("core files are under kb/ prefix", () => {
    const coreKeys = ["F01","F02","F03","F04","F05","F06","F07","F08","F09","F10","F11","F12","F13","F14","F15"] as const;
    for (const k of coreKeys) {
      expect(KB_FILE_PATHS[k]).toMatch(/^kb\//);
    }
  });

  it("programme files are under programme/ prefix", () => {
    const progKeys = ["MESO1","MESO2","MESO3","NUTRITION","RECOVERY"] as const;
    for (const k of progKeys) {
      expect(KB_FILE_PATHS[k]).toMatch(/^programme\//);
    }
  });

  it("all commands have at least 1 KB file", () => {
    const commands = Object.keys(COMMAND_KB_MAP) as JamesOSCommand[];
    for (const cmd of commands) {
      expect(COMMAND_KB_MAP[cmd].length).toBeGreaterThan(0);
    }
  });

  it("F01 (master index) is loaded by every command", () => {
    const commands = Object.keys(COMMAND_KB_MAP) as JamesOSCommand[];
    for (const cmd of commands) {
      expect(COMMAND_KB_MAP[cmd]).toContain("F01");
    }
  });

  it("getKBPathsForCommand returns valid Storage paths", () => {
    const paths = getKBPathsForCommand("morning_brief");
    expect(paths.length).toBeGreaterThan(0);
    for (const p of paths) {
      expect(p).toMatch(/^(kb|programme)\//);
    }
  });

  it("morning_brief loads correct files", () => {
    const keys = COMMAND_KB_MAP["morning_brief"];
    expect(keys).toEqual(expect.arrayContaining(["F01", "F10", "F13", "F07", "MESO1"]));
  });

  it("mesocycle_review loads Meso1 and Meso2", () => {
    const keys = COMMAND_KB_MAP["mesocycle_review"];
    expect(keys).toContain("MESO1");
    expect(keys).toContain("MESO2");
  });
});
