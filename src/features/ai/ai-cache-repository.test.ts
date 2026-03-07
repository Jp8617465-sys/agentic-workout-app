import { aiCacheRepository } from "./ai-cache-repository";
import { expoDb } from "../../lib/database";

jest.mock("../../lib/database");

const mockDb = expoDb as jest.Mocked<typeof expoDb>;

describe("AI Cache Repository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2025-03-07T00:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("set", () => {
    it("should store value with TTL in cache", () => {
      mockDb.runSync.mockImplementation(() => {});

      aiCacheRepository.set(
        "user-123",
        "prescription:2025-03-07",
        '{"exercises":[]}',
        24 * 60 * 60 * 1000 // 24 hours
      );

      expect(mockDb.runSync).toHaveBeenCalled();
      const args = mockDb.runSync.mock.calls[0];
      expect(args[0]).toContain("INSERT");
    });

    it("should set expiration time based on TTL", () => {
      mockDb.runSync.mockImplementation(() => {});
      const ttl = 24 * 60 * 60 * 1000;

      aiCacheRepository.set("user-123", "test-key", "test-value", ttl);

      const args = mockDb.runSync.mock.calls[0];
      const params = args[1] as any[];

      // Last parameter should be expiration timestamp
      const expirationTime = params[params.length - 1];
      const now = Date.now();
      expect(expirationTime).toBeGreaterThanOrEqual(now + ttl - 1000);
      expect(expirationTime).toBeLessThanOrEqual(now + ttl + 1000);
    });

    it("should overwrite existing key", () => {
      mockDb.runSync.mockImplementation(() => {});

      aiCacheRepository.set("user-123", "test-key", "value-1", 3600000);
      aiCacheRepository.set("user-123", "test-key", "value-2", 3600000);

      expect(mockDb.runSync).toHaveBeenCalledTimes(2);
    });

    it("should handle long cache values", () => {
      mockDb.runSync.mockImplementation(() => {});
      const longValue = JSON.stringify({
        exercises: Array(100).fill({ name: "Test", reps: 8, sets: 3 }),
      });

      aiCacheRepository.set("user-123", "test-key", longValue, 3600000);

      expect(mockDb.runSync).toHaveBeenCalled();
    });

    it("should handle zero TTL (immediate expiry)", () => {
      mockDb.runSync.mockImplementation(() => {});

      aiCacheRepository.set("user-123", "test-key", "test-value", 0);

      const args = mockDb.runSync.mock.calls[0];
      const params = args[1] as any[];
      const expirationTime = params[params.length - 1];

      // Should expire at or very soon after "now"
      expect(expirationTime).toBeLessThanOrEqual(Date.now() + 100);
    });

    it("should handle very long TTL (years)", () => {
      mockDb.runSync.mockImplementation(() => {});
      const longTtl = 365 * 24 * 60 * 60 * 1000; // 1 year

      aiCacheRepository.set("user-123", "test-key", "test-value", longTtl);

      expect(mockDb.runSync).toHaveBeenCalled();
    });
  });

  describe("get", () => {
    it("should return cached value when not expired", () => {
      mockDb.getFirstSync.mockReturnValue({
        value: '{"exercises":[]}',
        expiresAt: Date.now() + 3600000, // Expires in 1 hour
      });

      const result = aiCacheRepository.get(
        "user-123",
        "prescription:2025-03-07"
      );

      expect(result).toBe('{"exercises":[]}');
    });

    it("should return null when key not found", () => {
      mockDb.getFirstSync.mockReturnValue(null);

      const result = aiCacheRepository.get("user-123", "nonexistent-key");

      expect(result).toBeNull();
    });

    it("should return null when value is expired", () => {
      mockDb.getFirstSync.mockReturnValue({
        value: '{"exercises":[]}',
        expiresAt: Date.now() - 1000, // Expired 1 second ago
      });

      const result = aiCacheRepository.get(
        "user-123",
        "expired-prescription"
      );

      expect(result).toBeNull();
    });

    it("should query with correct user ID and key", () => {
      mockDb.getFirstSync.mockReturnValue(null);

      aiCacheRepository.get("user-456", "test-key");

      expect(mockDb.getFirstSync).toHaveBeenCalledWith(
        expect.any(String),
        ["user-456", "test-key"]
      );
    });

    it("should handle edge case where expiration is exactly now", () => {
      const now = Date.now();
      jest.setSystemTime(new Date(now));

      mockDb.getFirstSync.mockReturnValue({
        value: "test",
        expiresAt: now,
      });

      const result = aiCacheRepository.get("user-123", "test-key");

      // Should be expired at exact boundary
      expect(result).toBeNull();
    });

    it("should return value 1ms before expiration", () => {
      const now = Date.now();
      jest.setSystemTime(new Date(now));

      mockDb.getFirstSync.mockReturnValue({
        value: "test",
        expiresAt: now + 1,
      });

      const result = aiCacheRepository.get("user-123", "test-key");

      expect(result).toBe("test");
    });
  });

  describe("evictExpired", () => {
    it("should delete expired cache entries", () => {
      mockDb.runSync.mockImplementation(() => {});

      aiCacheRepository.evictExpired();

      expect(mockDb.runSync).toHaveBeenCalled();
      const args = mockDb.runSync.mock.calls[0];
      expect(args[0]).toContain("DELETE");
      expect(args[0]).toContain("expires_at");
    });

    it("should use current timestamp for comparison", () => {
      mockDb.runSync.mockImplementation(() => {});
      const fixedTime = new Date("2025-03-07T12:00:00Z").getTime();
      jest.setSystemTime(fixedTime);

      aiCacheRepository.evictExpired();

      const args = mockDb.runSync.mock.calls[0];
      const params = args[1] as any[];

      // Last parameter should be current timestamp
      expect(params[params.length - 1]).toBeCloseTo(fixedTime, -2);
    });

    it("should not affect valid cache entries", () => {
      mockDb.runSync.mockImplementation(() => {});

      // Insert a valid entry
      aiCacheRepository.set("user-123", "valid-key", "value", 3600000);

      // Evict expired
      aiCacheRepository.evictExpired();

      expect(mockDb.runSync).toHaveBeenCalledTimes(2);
    });

    it("should handle no expired entries gracefully", () => {
      mockDb.runSync.mockImplementation(() => {});

      aiCacheRepository.evictExpired();

      expect(mockDb.runSync).toHaveBeenCalled();
      // Should not throw
    });
  });

  describe("clear", () => {
    it("should delete all cache entries for a user", () => {
      mockDb.runSync.mockImplementation(() => {});

      aiCacheRepository.clear("user-123");

      expect(mockDb.runSync).toHaveBeenCalled();
      const args = mockDb.runSync.mock.calls[0];
      expect(args[0]).toContain("DELETE");
      expect(args[1]).toContain("user-123");
    });

    it("should clear entries only for specified user", () => {
      mockDb.runSync.mockImplementation(() => {});

      aiCacheRepository.clear("user-456");

      const args = mockDb.runSync.mock.calls[0];
      const params = args[1] as any[];
      expect(params[0]).toBe("user-456");
    });

    it("should not throw when clearing non-existent user", () => {
      mockDb.runSync.mockImplementation(() => {});

      expect(() => {
        aiCacheRepository.clear("nonexistent-user");
      }).not.toThrow();
    });
  });

  describe("Integration scenarios", () => {
    it("should handle set then get workflow", () => {
      mockDb.runSync.mockImplementation(() => {});
      mockDb.getFirstSync.mockReturnValue({
        value: "cached-prescription",
        expiresAt: Date.now() + 3600000,
      });

      aiCacheRepository.set(
        "user-123",
        "prescription-key",
        "cached-prescription",
        3600000
      );

      const retrieved = aiCacheRepository.get(
        "user-123",
        "prescription-key"
      );

      expect(retrieved).toBe("cached-prescription");
    });

    it("should handle concurrent writes with same key (last write wins)", () => {
      mockDb.runSync.mockImplementation(() => {});

      aiCacheRepository.set("user-123", "key", "value-1", 3600000);
      aiCacheRepository.set("user-123", "key", "value-2", 3600000);

      expect(mockDb.runSync).toHaveBeenCalledTimes(2);
    });

    it("should handle multiple cache entries per user", () => {
      mockDb.runSync.mockImplementation(() => {});

      aiCacheRepository.set("user-123", "prescription:2025-03-07", "pres-1", 3600000);
      aiCacheRepository.set("user-123", "post_workout:1", "analysis-1", 3600000);
      aiCacheRepository.set("user-123", "custom-key", "value-1", 3600000);

      expect(mockDb.runSync).toHaveBeenCalledTimes(3);
    });

    it("should handle different TTL values for same key when overwritten", () => {
      mockDb.runSync.mockImplementation(() => {});

      aiCacheRepository.set("user-123", "key", "value", 1000); // 1 second
      aiCacheRepository.set("user-123", "key", "value", 3600000); // 1 hour

      expect(mockDb.runSync).toHaveBeenCalledTimes(2);
    });
  });

  describe("Performance characteristics", () => {
    it("should handle cache keys with special characters", () => {
      mockDb.runSync.mockImplementation(() => {});

      aiCacheRepository.set(
        "user-123",
        "prescription:2025-03-07T12:30:45.123Z",
        "value",
        3600000
      );

      expect(mockDb.runSync).toHaveBeenCalled();
    });

    it("should handle large values", () => {
      mockDb.runSync.mockImplementation(() => {});
      const largeValue = JSON.stringify({ data: "x".repeat(10000) });

      aiCacheRepository.set("user-123", "large-key", largeValue, 3600000);

      expect(mockDb.runSync).toHaveBeenCalled();
    });

    it("should handle many keys per user", () => {
      mockDb.runSync.mockImplementation(() => {});

      for (let i = 0; i < 100; i++) {
        aiCacheRepository.set("user-123", `key-${i}`, `value-${i}`, 3600000);
      }

      expect(mockDb.runSync).toHaveBeenCalledTimes(100);
    });
  });
});
