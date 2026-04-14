import { dailyBriefRepository } from "./daily-brief-repository";

// Mock expoDb
jest.mock("../../lib/database", () => ({
  expoDb: {
    getAllSync: jest.fn(),
    getFirstSync: jest.fn(),
    runSync: jest.fn(),
  },
}));

jest.mock("../../lib/uuid", () => ({
  generateId: jest.fn(() => "generated-id-abc"),
}));

import { expoDb } from "../../lib/database";

const mockDb = expoDb as jest.Mocked<typeof expoDb>;

const USER_ID = "user-123";
const TODAY = "2026-01-15";

function makeRow(overrides?: Record<string, unknown>) {
  return {
    id: "brief-1",
    user_id: USER_ID,
    date: TODAY,
    session_type: "Lower",
    estimated_duration_minutes: 60,
    phase: "accumulation",
    week_number: 2,
    exercises: JSON.stringify([
      { exerciseName: "Squat", sets: 3, reps: 8, weight: 80, rpe: 7 },
    ]),
    source: "deterministic",
    created_at: "2026-01-15T08:00:00.000Z",
    ...overrides,
  };
}

describe("dailyBriefRepository.findByDate", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns null when no brief exists", () => {
    mockDb.getFirstSync.mockReturnValueOnce(null);

    const result = dailyBriefRepository.findByDate(USER_ID, TODAY);

    expect(result).toBeNull();
  });

  it("maps all row fields to DailyBrief correctly", () => {
    mockDb.getFirstSync.mockReturnValueOnce(makeRow());

    const brief = dailyBriefRepository.findByDate(USER_ID, TODAY);

    expect(brief).not.toBeNull();
    expect(brief!.id).toBe("brief-1");
    expect(brief!.userId).toBe(USER_ID);
    expect(brief!.date).toBe(TODAY);
    expect(brief!.sessionType).toBe("Lower");
    expect(brief!.estimatedDurationMinutes).toBe(60);
    expect(brief!.phase).toBe("accumulation");
    expect(brief!.weekNumber).toBe(2);
    expect(brief!.source).toBe("deterministic");
    expect(brief!.rationale).toBeNull(); // never persisted
    expect(brief!.createdAt).toBe("2026-01-15T08:00:00.000Z");
  });

  it("parses exercises JSON from row", () => {
    mockDb.getFirstSync.mockReturnValueOnce(makeRow());

    const brief = dailyBriefRepository.findByDate(USER_ID, TODAY);

    expect(brief!.exercises).toHaveLength(1);
    expect(brief!.exercises[0].exerciseName).toBe("Squat");
    expect(brief!.exercises[0].sets).toBe(3);
    expect(brief!.exercises[0].weight).toBe(80);
  });

  it("handles corrupt exercises JSON gracefully", () => {
    mockDb.getFirstSync.mockReturnValue(makeRow({ exercises: "not-valid-json" }));

    let brief: ReturnType<typeof dailyBriefRepository.findByDate>;
    expect(() => {
      brief = dailyBriefRepository.findByDate(USER_ID, TODAY);
    }).not.toThrow();

    expect(brief!.exercises).toEqual([]);
  });

  it("queries with correct userId and date", () => {
    mockDb.getFirstSync.mockReturnValueOnce(null);

    dailyBriefRepository.findByDate(USER_ID, TODAY);

    expect(mockDb.getFirstSync).toHaveBeenCalledWith(
      expect.stringContaining("WHERE user_id = ?"),
      [USER_ID, TODAY],
    );
  });
});

describe("dailyBriefRepository.upsert", () => {
  beforeEach(() => jest.clearAllMocks());

  const briefData = {
    userId: USER_ID,
    date: TODAY,
    sessionType: "Upper",
    estimatedDurationMinutes: 50,
    phase: "intensification",
    weekNumber: 3,
    exercises: [
      { exerciseName: "Bench Press", sets: 4, reps: 6, weight: 70, rpe: 8 },
    ],
    source: "mesocycle" as const,
  };

  it("inserts a new brief when none exists", () => {
    mockDb.getFirstSync.mockReturnValueOnce(null); // findByDate returns null

    const result = dailyBriefRepository.upsert(briefData);

    expect(mockDb.runSync).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO daily_briefs"),
      expect.arrayContaining([USER_ID, TODAY, "Upper"]),
    );
    expect(result.id).toBe("generated-id-abc");
    expect(result.rationale).toBeNull();
  });

  it("reuses existing id when updating", () => {
    mockDb.getFirstSync.mockReturnValueOnce(makeRow({ id: "existing-brief-id" }));

    const result = dailyBriefRepository.upsert(briefData);

    expect(result.id).toBe("existing-brief-id");
  });

  it("serializes exercises array to JSON in the query", () => {
    mockDb.getFirstSync.mockReturnValueOnce(null);

    dailyBriefRepository.upsert(briefData);

    const callArgs = mockDb.runSync.mock.calls[0][1] as unknown as (string | number | null)[];
    const exercisesArg = callArgs.find(
      (a) => typeof a === "string" && a.startsWith("["),
    );
    expect(exercisesArg).toBeDefined();
    const parsed = JSON.parse(exercisesArg as string) as Array<{ exerciseName: string }>;
    expect(parsed[0].exerciseName).toBe("Bench Press");
  });

  it("returns brief with all input fields intact", () => {
    mockDb.getFirstSync.mockReturnValueOnce(null);

    const result = dailyBriefRepository.upsert(briefData);

    expect(result.userId).toBe(USER_ID);
    expect(result.date).toBe(TODAY);
    expect(result.sessionType).toBe("Upper");
    expect(result.estimatedDurationMinutes).toBe(50);
    expect(result.phase).toBe("intensification");
    expect(result.weekNumber).toBe(3);
    expect(result.source).toBe("mesocycle");
    expect(result.exercises).toHaveLength(1);
  });

  it("handles null optional fields", () => {
    mockDb.getFirstSync.mockReturnValueOnce(null);

    const result = dailyBriefRepository.upsert({
      userId: USER_ID,
      date: TODAY,
      sessionType: "Upper",
      estimatedDurationMinutes: null,
      phase: null,
      weekNumber: null,
      exercises: [],
      source: "mesocycle" as const,
    });

    const callArgs = mockDb.runSync.mock.calls[0][1] as unknown as (string | number | null)[];
    expect(callArgs).toContain(null);
    expect(result.estimatedDurationMinutes).toBeNull();
  });
});
