import { expoDb } from "../../lib/database";
import { generateId } from "../../lib/uuid";
import type { DailyBrief, BriefExercise } from "./types";

interface DailyBriefRow {
  id: string;
  user_id: string;
  date: string;
  session_type: string;
  estimated_duration_minutes: number | null;
  phase: string | null;
  week_number: number | null;
  exercises: string;
  source: string;
  created_at: string;
}

function rowToBrief(row: DailyBriefRow): DailyBrief {
  let exercises: BriefExercise[] = [];
  try {
    exercises = JSON.parse(row.exercises) as BriefExercise[];
  } catch {
    // ignore corrupt JSON
  }
  return {
    id: row.id,
    userId: row.user_id,
    date: row.date,
    sessionType: row.session_type,
    estimatedDurationMinutes: row.estimated_duration_minutes,
    phase: row.phase,
    weekNumber: row.week_number,
    exercises,
    source: row.source as DailyBrief["source"],
    // rationale not persisted — regenerated from cache or AI
    rationale: null,
    createdAt: row.created_at,
  };
}

export const dailyBriefRepository = {
  findByDate(userId: string, date: string): DailyBrief | null {
    const row = expoDb.getFirstSync<DailyBriefRow>(
      `SELECT * FROM daily_briefs WHERE user_id = ? AND date = ?`,
      [userId, date],
    );
    return row ? rowToBrief(row) : null;
  },

  upsert(brief: Omit<DailyBrief, "id" | "createdAt" | "rationale">): DailyBrief {
    const existing = dailyBriefRepository.findByDate(brief.userId, brief.date);
    const id = existing?.id ?? generateId();
    const now = new Date().toISOString();

    expoDb.runSync(
      `INSERT INTO daily_briefs
         (id, user_id, date, session_type, estimated_duration_minutes, phase, week_number, exercises, source, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, date) DO UPDATE SET
         session_type = excluded.session_type,
         estimated_duration_minutes = excluded.estimated_duration_minutes,
         phase = excluded.phase,
         week_number = excluded.week_number,
         exercises = excluded.exercises,
         source = excluded.source`,
      [
        id,
        brief.userId,
        brief.date,
        brief.sessionType,
        brief.estimatedDurationMinutes ?? null,
        brief.phase ?? null,
        brief.weekNumber ?? null,
        JSON.stringify(brief.exercises),
        brief.source,
        now,
      ],
    );

    return { ...brief, id, createdAt: now, rationale: null };
  },
};
