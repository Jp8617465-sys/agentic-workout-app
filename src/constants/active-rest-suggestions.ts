// Pattern-specific active rest suggestions shown during rest timer.
// Ordered by priority — first suggestion is shown by default.
export const ACTIVE_REST_BY_PATTERN: Record<string, string[]> = {
  SQUAT: [
    "Deep squat hold (30-45s)",
    "Hip CARs — 5 each side",
    "Ankle circles — 10 each direction",
    "Pigeon stretch — 30s each side",
  ],
  HINGE: [
    "Hip flexor stretch — 30s each side",
    "Hamstring stretch — 30s each side",
    "Cat-cow — 10 reps",
    "Glute bridge hold — 30s",
  ],
  HORIZONTAL_PUSH: [
    "Thread the needle — 5 each side",
    "Doorway pec stretch — 30s each side",
    "Shoulder CARs — 3 each direction",
    "Wrist circles — 10 reps",
  ],
  HORIZONTAL_PULL: [
    "Lat hang — 20-30s",
    "Scapular wall slides — 10 reps",
    "Band pull-aparts — 15 reps",
    "Chest opener stretch — 30s",
  ],
  VERTICAL_PUSH: [
    "Shoulder CARs — 3 each direction",
    "Wall angels — 10 reps",
    "Neck side stretch — 30s each side",
    "Trap stretch — 20s each side",
  ],
  VERTICAL_PULL: [
    "Dead hang — 20-30s",
    "Scapular retractions — 10 reps",
    "Lat stretch — 30s each side",
    "Band pull-apart — 15 reps",
  ],
  CARRY: [
    "Wrist circles — 10 each direction",
    "Shoulder shrugs — 10 slow reps",
    "Neck rolls — 5 each direction",
  ],
  CORE: [
    "Child's pose — 30s",
    "Spinal rotation — 5 each side",
    "Hip flexor stretch — 30s each side",
  ],
  CARDIO: [
    "Walk it out — keep moving",
    "Deep diaphragmatic breathing — 5 breaths",
    "Calf raises — 15 slow reps",
  ],
};

export const DEFAULT_ACTIVE_REST = ["Light stretching", "Deep breathing — 5 slow breaths"];

export function getActiveRestSuggestions(pattern: string | null | undefined): string[] {
  if (!pattern) return DEFAULT_ACTIVE_REST;
  return ACTIVE_REST_BY_PATTERN[pattern.toUpperCase()] ?? DEFAULT_ACTIVE_REST;
}
