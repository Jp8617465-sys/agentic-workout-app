import { createHash } from "crypto";
import { v5 as uuidv5 } from "uuid";

// Deterministic namespace UUID for exercises (based on app identifier)
const EXERCISE_NAMESPACE_UUID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

/**
 * Generate a deterministic UUID v5 for an exercise based on its name.
 * This ensures that the same exercise name always produces the same UUID,
 * which is important for reproducible backfills and testing.
 */
export function generateDeterministicExerciseId(exerciseName: string): string {
  return uuidv5(exerciseName, EXERCISE_NAMESPACE_UUID);
}

/**
 * Generate a simple deterministic ID from a string using MD5 hash.
 * Useful as fallback if uuid v5 is not available.
 * Format: 8-4-4-4-12 (UUID-like string from hash)
 */
export function generateDeterministicIdFromHash(input: string): string {
  const hash = createHash("md5").update(input).digest("hex");
  return (
    hash.substring(0, 8) +
    "-" +
    hash.substring(8, 12) +
    "-5" +
    hash.substring(12, 15) +
    "-a" +
    hash.substring(15, 18) +
    "-" +
    hash.substring(18, 30)
  );
}

/**
 * Validate if a string is a valid UUID format
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
