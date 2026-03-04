import { expoDb } from "../../lib/database";
import { generateId } from "../../lib/uuid";

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export const aiCacheRepository = {
  get(userId: string, cacheKey: string): string | null {
    const now = Date.now();
    const row = expoDb.getFirstSync<{ response: string }>(
      `SELECT response FROM ai_cache
       WHERE user_id = ? AND cache_key = ? AND expires_at > ?
       LIMIT 1`,
      [userId, cacheKey, now],
    );
    return row?.response ?? null;
  },

  set(userId: string, cacheKey: string, response: string, ttlMs = DEFAULT_TTL_MS): void {
    const now = Date.now();
    const expiresAt = now + ttlMs;
    const id = generateId();

    // Evict any existing entry for this key first
    expoDb.runSync(
      "DELETE FROM ai_cache WHERE user_id = ? AND cache_key = ?",
      [userId, cacheKey],
    );

    expoDb.runSync(
      `INSERT INTO ai_cache (id, user_id, cache_key, response, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userId, cacheKey, response, expiresAt, new Date(now).toISOString()],
    );
  },

  evictExpired(): void {
    expoDb.runSync("DELETE FROM ai_cache WHERE expires_at <= ?", [Date.now()]);
  },
};
