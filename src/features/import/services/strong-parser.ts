import type {
  ParsedExercise,
  ParsedSet,
  ParsedWorkout,
  ParseResult,
  WeightUnit,
} from "../types";
import type { SetType } from "../../../types";

const MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  sept: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const WEEKDAY = "(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)";
// "Friday, 4 September 2026 at 9:58 am" (AU/UK share format)
const DATE_DMY = new RegExp(
  `^${WEEKDAY},?\\s+(\\d{1,2})\\s+([a-z]+)\\s+(\\d{4})\\s+at\\s+(\\d{1,2}):(\\d{2})\\s*(am|pm)?$`,
  "i",
);
// "Friday, September 4, 2026 at 9:58 AM" (US share format)
const DATE_MDY = new RegExp(
  `^${WEEKDAY},?\\s+([a-z]+)\\s+(\\d{1,2}),?\\s+(\\d{4})\\s+at\\s+(\\d{1,2}):(\\d{2})\\s*(am|pm)?$`,
  "i",
);

const SET_PREFIX = /^(set\s*(\d+)|w(\d*)|d(\d*)|f(\d*))\s*:\s*(.+)$/i;
const WEIGHT_REPS =
  /^(-?\d+(?:\.\d+)?)\s*(kg|kgs|lb|lbs)\s*[×x*]\s*(\d+)(?:\s*@\s*(\d+(?:\.\d+)?))?/i;
const REPS_ONLY = /^(\d+)\s*reps?(?:\s*@\s*(\d+(?:\.\d+)?))?$/i;
const DISTANCE = /(\d+(?:\.\d+)?)\s*(km|mi)\b/i;
const DURATION = /(?:^|\s|\|)(\d{1,2}:)?(\d{1,2}):(\d{2})(?:\s|$|\|)/;
const URL = /^https?:\/\//i;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function parseDateLine(
  line: string,
): { date: string; startedAt: string } | null {
  let day: number;
  let month: number | undefined;
  let year: number;
  let hour: number;
  let minute: number;
  let meridiem: string | undefined;

  const dmy = DATE_DMY.exec(line);
  const mdy = dmy ? null : DATE_MDY.exec(line);
  if (dmy) {
    day = Number(dmy[1]);
    month = MONTHS[dmy[2].toLowerCase()];
    year = Number(dmy[3]);
    hour = Number(dmy[4]);
    minute = Number(dmy[5]);
    meridiem = dmy[6];
  } else if (mdy) {
    month = MONTHS[mdy[1].toLowerCase()];
    day = Number(mdy[2]);
    year = Number(mdy[3]);
    hour = Number(mdy[4]);
    minute = Number(mdy[5]);
    meridiem = mdy[6];
  } else {
    return null;
  }
  if (!month) return null;

  if (meridiem) {
    const pm = meridiem.toLowerCase() === "pm";
    if (hour === 12) hour = pm ? 12 : 0;
    else if (pm) hour += 12;
  }

  const date = `${year}-${pad(month)}-${pad(day)}`;
  return { date, startedAt: `${date}T${pad(hour)}:${pad(minute)}:00` };
}

function setTypeFromPrefix(prefix: string): SetType {
  const p = prefix.toLowerCase();
  if (p.startsWith("w")) return "warmup";
  if (p.startsWith("d")) return "backoff";
  return "working";
}

function parseDurationSeconds(body: string): number | null {
  const m = DURATION.exec(body);
  if (!m) return null;
  const hours = m[1] ? Number(m[1].slice(0, -1)) : 0;
  return hours * 3600 + Number(m[2]) * 60 + Number(m[3]);
}

export function parseSetLine(
  line: string,
  fallbackNumber: number,
): ParsedSet | null {
  const prefixMatch = SET_PREFIX.exec(line.trim());
  if (!prefixMatch) return null;

  const explicitNumber =
    prefixMatch[2] ?? prefixMatch[3] ?? prefixMatch[4] ?? prefixMatch[5];
  const body = prefixMatch[6].trim();
  const set: ParsedSet = {
    setNumber: explicitNumber ? Number(explicitNumber) : fallbackNumber,
    type: setTypeFromPrefix(prefixMatch[1]),
    weight: null,
    weightUnit: null,
    reps: null,
    rpe: null,
    durationSeconds: null,
    distanceKm: null,
  };

  const wr = WEIGHT_REPS.exec(body);
  if (wr) {
    set.weight = Number(wr[1]);
    set.weightUnit = (
      wr[2].toLowerCase().startsWith("lb") ? "lb" : "kg"
    ) as WeightUnit;
    set.reps = Number(wr[3]);
    set.rpe = wr[4] ? Number(wr[4]) : null;
    return set;
  }

  const ro = REPS_ONLY.exec(body);
  if (ro) {
    set.reps = Number(ro[1]);
    set.rpe = ro[2] ? Number(ro[2]) : null;
    return set;
  }

  const dist = DISTANCE.exec(body);
  if (dist) {
    const value = Number(dist[1]);
    set.distanceKm =
      dist[2].toLowerCase() === "mi"
        ? Math.round(value * 1.60934 * 100) / 100
        : value;
  }
  set.durationSeconds = parseDurationSeconds(body);

  return set.distanceKm !== null || set.durationSeconds !== null ? set : null;
}

/**
 * Parses the text Strong produces from "Share workout". Multiple workouts can be
 * pasted at once; each starts with a title line followed by a date line.
 */
export function parseStrongText(text: string): ParseResult {
  const lines = text.split(/\r?\n/).map((l) => l.trim());
  const workouts: ParsedWorkout[] = [];
  const warnings: string[] = [];

  let current: ParsedWorkout | null = null;
  let currentExercise: ParsedExercise | null = null;
  let pendingHeader: string | null = null;

  const closeExercise = () => {
    if (current && currentExercise && currentExercise.sets.length > 0) {
      current.exercises.push(currentExercise);
    }
    currentExercise = null;
  };

  const closeWorkout = () => {
    closeExercise();
    if (current) {
      if (current.exercises.length > 0) workouts.push(current);
      else
        warnings.push(
          `"${current.title}" on ${current.date} had no sets and was skipped`,
        );
    }
    current = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const dateInfo = parseDateLine(line);
    if (dateInfo) {
      closeWorkout();
      current = {
        title: pendingHeader ?? "Imported Workout",
        date: dateInfo.date,
        startedAt: dateInfo.startedAt,
        exercises: [],
        sourceUrl: null,
      };
      pendingHeader = null;
      continue;
    }

    if (URL.test(line)) {
      if (current) current.sourceUrl = line;
      continue;
    }

    if (SET_PREFIX.test(line)) {
      if (!current) continue;
      if (!currentExercise) {
        warnings.push(`Set line without an exercise name ignored: "${line}"`);
        continue;
      }
      const parsed = parseSetLine(line, currentExercise.sets.length + 1);
      if (parsed) currentExercise.sets.push(parsed);
      else
        warnings.push(
          `Could not read set "${line}" for ${currentExercise.sourceName}`,
        );
      continue;
    }

    // A plain line is either the next workout's title (if a date follows) or an exercise name.
    const nextNonEmpty = lines.slice(i + 1).find((l) => l.length > 0) ?? "";
    if (parseDateLine(nextNonEmpty)) {
      closeWorkout();
      pendingHeader = line;
      continue;
    }

    if (current) {
      closeExercise();
      currentExercise = { sourceName: line, sets: [] };
    }
  }
  closeWorkout();

  workouts.sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  return { workouts, warnings };
}
