import { expoDb } from "../../lib/database";
import { generateId } from "../../lib/uuid";
import { InjuryService } from "../injuries/InjuryService";
import { GapDetectionService } from "../programs/gap-detection-service";
import type {
  SessionTest,
  SessionTestContext,
  SessionTestResult,
  SessionTestType,
  ProgressionDecision,
  ProgressionDecisionType,
} from "./types";

const MAX_TESTS_PER_SESSION = 4;

interface PendingDecisionRow {
  id: string;
  user_id: string;
  exercise_name: string;
  decision_type: string;
  hold_sessions: number;
  source_test_id: string;
  applied_at: string | null;
  created_at: string;
}

interface SessionTestRow {
  id: string;
  workout_id: string;
  user_id: string;
  test_type: string;
  test_context: string;
  result: string | null;
  evaluated_at: string | null;
  created_at: string;
}

function rowToSessionTest(row: SessionTestRow): SessionTest {
  return {
    id: row.id,
    workoutId: row.workout_id,
    userId: row.user_id,
    testType: row.test_type as SessionTestType,
    testContext: JSON.parse(row.test_context) as SessionTestContext,
    result: row.result ? (JSON.parse(row.result) as SessionTestResult) : null,
    evaluatedAt: row.evaluated_at,
    createdAt: row.created_at,
  };
}

function rowToProgressionDecision(row: PendingDecisionRow): ProgressionDecision {
  return {
    id: row.id,
    userId: row.user_id,
    exerciseName: row.exercise_name,
    decisionType: row.decision_type as ProgressionDecisionType,
    holdSessions: row.hold_sessions,
    sourceTestId: row.source_test_id,
    appliedAt: row.applied_at,
    createdAt: row.created_at,
  };
}

function hasInjuryType(userId: string, injuryType: string): boolean {
  const injuries = InjuryService.getActiveRestrictions(userId);
  return injuries.some(
    (inj) => inj.type.toLowerCase().includes(injuryType.toLowerCase()),
  );
}

function getExercisesWithPendingHold(
  userId: string,
  exerciseNames: string[],
): string[] {
  if (exerciseNames.length === 0) return [];

  const placeholders = exerciseNames.map(() => "?").join(", ");
  const rows = expoDb.getAllSync<{ exercise_name: string }>(
    `SELECT DISTINCT exercise_name FROM pending_progression_decisions
     WHERE user_id = ? AND applied_at IS NULL AND hold_sessions > 0
     AND exercise_name IN (${placeholders})`,
    [userId, ...exerciseNames],
  );
  return rows.map((r) => r.exercise_name);
}

function exerciseNamesInclude(
  exerciseNames: string[],
  target: string,
): boolean {
  const normalised = target.toLowerCase();
  return exerciseNames.some((name) => name.toLowerCase().includes(normalised));
}

export const SessionTestsService = {
  generateSessionTests(
    userId: string,
    workoutId: string,
    exerciseNames: string[],
  ): SessionTest[] {
    const now = new Date().toISOString();
    const tests: SessionTest[] = [];

    // 1. Check injuries for PAIN_CHECK
    const hasAnkle = hasInjuryType(userId, "ankle_instability");
    const hasPlantar = hasInjuryType(userId, "plantar_fasciitis");

    if (hasAnkle || hasPlantar) {
      const painArea = hasAnkle ? "ankle" : "foot";
      tests.push({
        id: generateId(),
        workoutId,
        userId,
        testType: "PAIN_CHECK",
        testContext: {
          description: `Monitor ${painArea} pain throughout the session`,
          whatToWatch: `Note any sharp, aching, or instability sensations in the ${painArea} during loaded movements`,
          howToReport: `Rate your worst ${painArea} pain during the session on a 0-10 scale`,
        },
        result: null,
        evaluatedAt: null,
        createdAt: now,
      });
    }

    // 2. Check for exercises at "hold" load pending progression
    if (tests.length < MAX_TESTS_PER_SESSION) {
      const holdExercises = getExercisesWithPendingHold(userId, exerciseNames);
      for (const exerciseName of holdExercises) {
        if (tests.length >= MAX_TESTS_PER_SESSION) break;
        tests.push({
          id: generateId(),
          workoutId,
          userId,
          testType: "RPE_PROGRESSION",
          testContext: {
            exerciseName,
            description: `RPE check on ${exerciseName} set 3 to decide load progression`,
            whatToWatch: `Focus on bar speed and perceived effort on your third working set of ${exerciseName}`,
            howToReport: "Rate RPE on your third working set (1-10)",
          },
          result: null,
          evaluatedAt: null,
          createdAt: now,
        });
      }
    }

    // 3. Check if exercises include deadbug for TEMPO_HOLD
    if (
      tests.length < MAX_TESTS_PER_SESSION &&
      exerciseNamesInclude(exerciseNames, "deadbug")
    ) {
      tests.push({
        id: generateId(),
        workoutId,
        userId,
        testType: "TEMPO_HOLD",
        testContext: {
          exerciseName: exerciseNames.find((n) =>
            n.toLowerCase().includes("deadbug"),
          ),
          description: "Deadbug tempo control check",
          whatToWatch:
            "Maintain the prescribed 3-1-3-0 tempo without rushing the eccentric or losing lumbar contact",
          howToReport:
            'Report whether you held the full tempo or drifted to faster reps',
        },
        result: null,
        evaluatedAt: null,
        createdAt: now,
      });
    }

    // 4. Check gap detection for TECHNIQUE_FLAG (first session back)
    if (tests.length < MAX_TESTS_PER_SESSION) {
      const gapDays = GapDetectionService.calculateGap(userId);
      if (gapDays >= 7) {
        tests.push({
          id: generateId(),
          workoutId,
          userId,
          testType: "TECHNIQUE_FLAG",
          testContext: {
            description: `First session back after ${gapDays} days — movement quality check`,
            whatToWatch:
              "Pay attention to coordination, bracing, and bar path on compound lifts. Note any hesitation or compensation patterns",
            howToReport:
              'Rate your overall movement quality: "Clean", "Minor breakdown", or "Stopped early"',
          },
          result: null,
          evaluatedAt: null,
          createdAt: now,
        });
      }
    }

    // 5. Check left glute inhibition for ACTIVATION_CHECK
    if (tests.length < MAX_TESTS_PER_SESSION) {
      const hasGluteFlag = hasInjuryType(userId, "glute_inhibition");
      if (hasGluteFlag) {
        tests.push({
          id: generateId(),
          workoutId,
          userId,
          testType: "ACTIVATION_CHECK",
          testContext: {
            description: "Left glute activation assessment",
            whatToWatch:
              "During single-leg hip thrusts or lunges, note whether you feel the left glute engaging or if the quad takes over",
            howToReport:
              'Report: "Felt it" (good activation), "Partial" (some engagement), or "Quad dominant" (glute not firing)',
          },
          result: null,
          evaluatedAt: null,
          createdAt: now,
        });
      }
    }

    // Limit to max tests
    const finalTests = tests.slice(0, MAX_TESTS_PER_SESSION);

    // Write to DB
    for (const test of finalTests) {
      expoDb.runSync(
        `INSERT INTO session_tests (id, workout_id, user_id, test_type, test_context, result, evaluated_at, created_at, sync_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          test.id,
          test.workoutId,
          test.userId,
          test.testType,
          JSON.stringify(test.testContext),
          null,
          null,
          test.createdAt,
        ],
      );
    }

    return finalTests;
  },

  recordTestResult(testId: string, result: SessionTestResult): void {
    expoDb.runSync(
      `UPDATE session_tests SET result = ?, sync_status = 'pending' WHERE id = ?`,
      [JSON.stringify(result), testId],
    );
  },

  evaluateTestResults(
    userId: string,
    workoutId: string,
  ): ProgressionDecision[] {
    const rows = expoDb.getAllSync<SessionTestRow>(
      `SELECT id, workout_id, user_id, test_type, test_context, result, evaluated_at, created_at
       FROM session_tests
       WHERE workout_id = ? AND user_id = ? AND result IS NOT NULL`,
      [workoutId, userId],
    );

    const tests = rows.map(rowToSessionTest);
    const now = new Date().toISOString();
    const decisions: ProgressionDecision[] = [];

    for (const test of tests) {
      if (!test.result) continue;

      const contextExercise = test.testContext.exerciseName ?? "general";
      const testDecisions = evaluateSingleTest(
        test.id,
        userId,
        contextExercise,
        test.result,
        now,
      );
      decisions.push(...testDecisions);

      // Mark test as evaluated
      expoDb.runSync(
        `UPDATE session_tests SET evaluated_at = ?, sync_status = 'pending' WHERE id = ?`,
        [now, test.id],
      );
    }

    // Write decisions to DB
    for (const decision of decisions) {
      expoDb.runSync(
        `INSERT INTO pending_progression_decisions
         (id, user_id, exercise_name, decision_type, hold_sessions, source_test_id, applied_at, created_at, sync_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
        [
          decision.id,
          decision.userId,
          decision.exerciseName,
          decision.decisionType,
          decision.holdSessions,
          decision.sourceTestId,
          null,
          decision.createdAt,
        ],
      );
    }

    return decisions;
  },

  getTestsForWorkout(workoutId: string): SessionTest[] {
    const rows = expoDb.getAllSync<SessionTestRow>(
      `SELECT id, workout_id, user_id, test_type, test_context, result, evaluated_at, created_at
       FROM session_tests WHERE workout_id = ?`,
      [workoutId],
    );
    return rows.map(rowToSessionTest);
  },

  getPendingDecisions(userId: string): ProgressionDecision[] {
    const rows = expoDb.getAllSync<PendingDecisionRow>(
      `SELECT id, user_id, exercise_name, decision_type, hold_sessions, source_test_id, applied_at, created_at
       FROM pending_progression_decisions
       WHERE user_id = ? AND applied_at IS NULL`,
      [userId],
    );
    return rows.map(rowToProgressionDecision);
  },

  markDecisionApplied(decisionId: string): void {
    const now = new Date().toISOString();
    expoDb.runSync(
      `UPDATE pending_progression_decisions SET applied_at = ?, sync_status = 'pending' WHERE id = ?`,
      [now, decisionId],
    );
  },
};

function evaluateSingleTest(
  testId: string,
  userId: string,
  exerciseName: string,
  result: SessionTestResult,
  now: string,
): ProgressionDecision[] {
  const decisions: ProgressionDecision[] = [];

  switch (result.type) {
    case "RPE_PROGRESSION": {
      if (result.rpe <= 6) {
        decisions.push(makeDecision(userId, exerciseName, "increase_load", 0, testId, now));
      } else if (result.rpe === 7) {
        decisions.push(makeDecision(userId, exerciseName, "hold_load", 1, testId, now));
      } else {
        // rpe >= 8
        decisions.push(makeDecision(userId, exerciseName, "hold_load_extended", 2, testId, now));
      }
      break;
    }
    case "ACTIVATION_CHECK": {
      if (result.outcome === "quad_dominant") {
        decisions.push(makeDecision(userId, exerciseName, "expand_prehab", 0, testId, now));
      }
      break;
    }
    case "TEMPO_HOLD": {
      if (result.outcome === "drifted") {
        decisions.push(makeDecision(userId, exerciseName, "add_cue", 0, testId, now));
      }
      break;
    }
    case "TECHNIQUE_FLAG": {
      // No specific decision for clean or minor breakdown beyond logging
      // stopped_early implies concern but not necessarily a decision
      break;
    }
    case "PAIN_CHECK": {
      if (result.painLevel >= 4) {
        decisions.push(
          makeDecision(userId, exerciseName, "suppress_progression", 0, testId, now),
        );
        decisions.push(
          makeDecision(userId, exerciseName, "flag_injury_review", 0, testId, now),
        );
      }
      break;
    }
  }

  return decisions;
}

function makeDecision(
  userId: string,
  exerciseName: string,
  decisionType: ProgressionDecisionType,
  holdSessions: number,
  sourceTestId: string,
  now: string,
): ProgressionDecision {
  return {
    id: generateId(),
    userId,
    exerciseName,
    decisionType,
    holdSessions,
    sourceTestId,
    appliedAt: null,
    createdAt: now,
  };
}
