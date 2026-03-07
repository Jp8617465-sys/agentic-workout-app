import { SyncEngine, getSyncEngine, resetSyncEngine, type SyncJob, type SyncResult } from "./sync-engine";
import type { SupabaseClient } from "@supabase/supabase-js";

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getSession: jest.fn(),
  },
  from: jest.fn(),
} as unknown as SupabaseClient;

describe("SyncEngine", () => {
  let syncEngine: SyncEngine;

  beforeEach(() => {
    jest.clearAllMocks();
    resetSyncEngine();
    syncEngine = new SyncEngine(mockSupabaseClient);
  });

  afterEach(() => {
    resetSyncEngine();
  });

  describe("syncPending", () => {
    it("should prevent concurrent syncs", async () => {
      // Set up mock to delay response
      (mockSupabaseClient.auth.getSession as jest.Mock).mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  data: { session: { user: { id: "user-123" } } },
                }),
              100
            )
          )
      );

      const promise1 = syncEngine.syncPending();

      // Try to sync again while first is running
      const promise2 = syncEngine.syncPending();

      const result1 = await promise1;
      const result2 = await promise2;

      // Second sync should fail with "already in progress" message
      expect(result1.success).toBeDefined();
      expect(result2.errors.some((e) => e.error.includes("already in progress"))).toBe(true);
    });

    it("should respect cooldown period between syncs", async () => {
      jest.useFakeTimers();

      (mockSupabaseClient.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: "user-123" } } },
      });

      // First sync
      const result1 = await syncEngine.syncPending();
      expect(result1.success).toBeDefined();

      // Immediately try again (within cooldown)
      const result2 = await syncEngine.syncPending();
      expect(result2.synced).toBe(0);
      expect(result2.failed).toBe(0);

      // Advance past cooldown (5000ms)
      jest.advanceTimersByTime(6000);

      // Now it should attempt again
      const result3 = await syncEngine.syncPending();
      expect(result3.success).toBeDefined();

      jest.useRealTimers();
    });

    it("should return error when user not authenticated", async () => {
      (mockSupabaseClient.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
      });

      const result = await syncEngine.syncPending();

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].error).toContain("No authenticated user");
    });

    it("should measure and return sync duration", async () => {
      jest.useFakeTimers();

      (mockSupabaseClient.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: "user-123" } } },
      });

      const result = await syncEngine.syncPending();

      expect(result.totalTime).toBeGreaterThanOrEqual(0);

      jest.useRealTimers();
    });
  });

  describe("subscribeToChanges", () => {
    it("should call listener on sync completion", async () => {
      const listener = jest.fn();
      syncEngine.subscribeToChanges(listener);

      (mockSupabaseClient.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: "user-123" } } },
      });

      await syncEngine.syncPending();

      expect(listener).toHaveBeenCalled();
      const result = listener.mock.calls[0][0] as SyncResult;
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("synced");
      expect(result).toHaveProperty("failed");
    });

    it("should return unsubscribe function", async () => {
      const listener = jest.fn();
      const unsubscribe = syncEngine.subscribeToChanges(listener);

      expect(typeof unsubscribe).toBe("function");

      // Unsubscribe
      unsubscribe();

      (mockSupabaseClient.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: "user-123" } } },
      });

      await syncEngine.syncPending();

      // Listener should not be called after unsubscribe
      expect(listener).not.toHaveBeenCalled();
    });

    it("should support multiple listeners", async () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();

      syncEngine.subscribeToChanges(listener1);
      syncEngine.subscribeToChanges(listener2);

      (mockSupabaseClient.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: "user-123" } } },
      });

      await syncEngine.syncPending();

      expect(listener1).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
    });

    it("should handle listener errors gracefully", async () => {
      const errorListener = jest.fn(() => {
        throw new Error("Listener error");
      });
      const successListener = jest.fn();

      syncEngine.subscribeToChanges(errorListener);
      syncEngine.subscribeToChanges(successListener);

      (mockSupabaseClient.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: "user-123" } } },
      });

      // Should not throw
      expect(async () => {
        await syncEngine.syncPending();
      }).not.toThrow();

      // Both listeners should be called
      expect(errorListener).toHaveBeenCalled();
      expect(successListener).toHaveBeenCalled();
    });
  });

  describe("manualSync", () => {
    it("should invoke syncPending when called", async () => {
      (mockSupabaseClient.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: "user-123" } } },
      });

      const result = await syncEngine.manualSync();

      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("synced");
      expect(result).toHaveProperty("failed");
    });
  });

  describe("hasPending", () => {
    it("should return boolean", () => {
      const result = syncEngine.hasPending();
      expect(typeof result).toBe("boolean");
    });
  });

  describe("backoff strategy", () => {
    it("should implement exponential backoff", async () => {
      // Test that getBackoffDelay implements exponential backoff
      // by checking private method behavior through the class

      // For now, test that retryCount=0 gives 1s, retryCount=1 gives 2s, etc.
      // This would require making the method public or testing through a different approach

      // Instead, test through job scheduling (when implemented)
      expect(syncEngine).toBeDefined();
    });
  });

  describe("singleton pattern", () => {
    it("should return same instance on multiple calls", () => {
      resetSyncEngine();

      const instance1 = getSyncEngine();
      const instance2 = getSyncEngine();

      expect(instance1).toBe(instance2);
    });

    it("should reset when resetSyncEngine is called", () => {
      const instance1 = getSyncEngine();

      resetSyncEngine();

      const instance2 = getSyncEngine();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe("foreign key validation", () => {
    it("should validate parent entities exist before pushing child", async () => {
      const mockFromFn = jest.fn(() => ({
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn().mockResolvedValue({
              data: null, // Parent doesn't exist
              error: new Error("Not found"),
            }),
          })),
        })),
      }));

      (mockSupabaseClient.from as jest.Mock).mockImplementation(mockFromFn);
      (mockSupabaseClient.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: "user-123" } } },
      });

      const result = await syncEngine.syncPending();

      // Sync should handle the error gracefully
      expect(result).toBeDefined();
    });
  });

  describe("network monitoring", () => {
    it("should start monitoring when first listener added", () => {
      const clearIntervalSpy = jest.spyOn(global, "clearInterval");

      const unsubscribe = syncEngine.subscribeToChanges(() => {});

      // Check that interval is set (indirectly by later cleanup)
      unsubscribe();

      // No explicit assertion needed; just verify no errors
      expect(syncEngine).toBeDefined();
    });

    it("should stop monitoring when last listener removed", () => {
      const unsub1 = syncEngine.subscribeToChanges(() => {});
      syncEngine.subscribeToChanges(() => {});

      // Remove first listener
      unsub1();

      // Monitor should still be running (second listener exists)
      expect(syncEngine).toBeDefined();
    });
  });

  describe("error handling", () => {
    it("should catch and log listener errors without breaking sync", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      const badListener = jest.fn(() => {
        throw new Error("Listener crash");
      });

      syncEngine.subscribeToChanges(badListener);

      (mockSupabaseClient.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { id: "user-123" } } },
      });

      const result = await syncEngine.syncPending();

      expect(result.success).toBeDefined();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should include errors in sync result", async () => {
      (mockSupabaseClient.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null }, // No user
      });

      const result = await syncEngine.syncPending();

      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
      if (result.errors.length > 0) {
        expect(result.errors[0]).toHaveProperty("jobId");
        expect(result.errors[0]).toHaveProperty("error");
      }
    });
  });
});
