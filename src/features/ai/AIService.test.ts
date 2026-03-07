import { AIService } from "./AIService";
import { supabase } from "../../lib/supabase";
import { aiCacheRepository } from "./ai-cache-repository";
import type { ExperienceLevel } from "../../types";

// Mock modules
jest.mock("../../lib/supabase");
jest.mock("./ai-cache-repository");

const mockSupabase = supabase as jest.Mocked<typeof supabase>;
const mockCache = aiCacheRepository as jest.Mocked<typeof aiCacheRepository>;

describe("AIService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("callEdgeFunction", () => {
    it("should pass AbortSignal to supabase.functions.invoke", async () => {
      const mockData = { prescription: "test" };

      mockSupabase.functions.invoke = jest.fn().mockResolvedValueOnce({
        data: mockData,
        error: null,
      });
      mockSupabase.auth.getSession = jest.fn().mockResolvedValueOnce({
        data: { session: { access_token: "test-token" } },
      });
      mockCache.get.mockReturnValueOnce(null);
      mockCache.set.mockImplementation(() => {});

      const responsePromise = AIService.getDailyPrescription(
        "user-123",
        "intermediate" as ExperienceLevel
      );

      // Fast-forward through the promise
      await jest.runAllTimersAsync();
      await responsePromise;

      // Verify that invoke was called with signal option
      expect(mockSupabase.functions.invoke).toHaveBeenCalled();
      const callArgs = (
        mockSupabase.functions.invoke as jest.Mock
      ).mock.calls[0];
      expect(callArgs[1]).toHaveProperty("signal");
      expect(callArgs[1].signal).toBeInstanceOf(AbortSignal);
    });

    it("should timeout and abort after 15 seconds", async () => {
      const TIMEOUT_MS = 15_000;
      let abortController: AbortController;

      mockSupabase.functions.invoke = jest.fn().mockImplementationOnce(
        (name, options) => {
          abortController = options as unknown as AbortController;
          // Simulate a slow function that never completes
          return new Promise(() => {
            // Never resolve
          });
        }
      );
      mockSupabase.auth.getSession = jest.fn().mockResolvedValueOnce({
        data: { session: { access_token: "test-token" } },
      });
      mockCache.get.mockReturnValueOnce(null);

      const responsePromise = AIService.getDailyPrescription(
        "user-123",
        "beginner" as ExperienceLevel
      );

      // Fast-forward to just before timeout
      jest.advanceTimersByTime(TIMEOUT_MS - 100);
      expect(abortController!.signal.aborted).toBe(false);

      // Fast-forward past timeout
      jest.advanceTimersByTime(200);
      expect(abortController!.signal.aborted).toBe(true);

      // The promise should eventually settle (either with timeout error or deterministic fallback)
      await jest.runAllTimersAsync();
      const result = await responsePromise;

      // Should fall back to deterministic prescription
      expect(result).toBeDefined();
      expect(result.source).toBe("deterministic");
    });

    it("should clear timeout in success path", async () => {
      const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

      mockSupabase.functions.invoke = jest.fn().mockResolvedValueOnce({
        data: { prescription: "test" },
        error: null,
      });
      mockSupabase.auth.getSession = jest.fn().mockResolvedValueOnce({
        data: { session: { access_token: "test-token" } },
      });
      mockCache.get.mockReturnValueOnce(null);
      mockCache.set.mockImplementation(() => {});

      await AIService.getDailyPrescription("user-123", "intermediate" as ExperienceLevel);

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });

    it("should clear timeout in error path", async () => {
      const clearTimeoutSpy = jest.spyOn(global, "clearTimeout");

      mockSupabase.functions.invoke = jest.fn().mockResolvedValueOnce({
        data: null,
        error: new Error("Function error"),
      });
      mockSupabase.auth.getSession = jest.fn().mockResolvedValueOnce({
        data: { session: { access_token: "test-token" } },
      });
      mockCache.get.mockReturnValueOnce(null);
      mockCache.set.mockImplementation(() => {});

      // Should not throw, should fall back to deterministic
      const result = await AIService.getDailyPrescription(
        "user-123",
        "intermediate" as ExperienceLevel
      );

      expect(clearTimeoutSpy).toHaveBeenCalled();
      expect(result.source).toBe("deterministic");
      clearTimeoutSpy.mockRestore();
    });

    it("should catch AbortError and fall back to deterministic", async () => {
      mockSupabase.functions.invoke = jest.fn().mockRejectedValueOnce(
        new DOMException("The operation was aborted.", "AbortError")
      );
      mockSupabase.auth.getSession = jest.fn().mockResolvedValueOnce({
        data: { session: { access_token: "test-token" } },
      });
      mockCache.get.mockReturnValueOnce(null);
      mockCache.set.mockImplementation(() => {});

      const result = await AIService.getDailyPrescription(
        "user-123",
        "intermediate" as ExperienceLevel
      );

      expect(result.source).toBe("deterministic");
    });
  });

  describe("getDailyPrescription", () => {
    it("should return cached prescription if available", async () => {
      const cachedPrescription = JSON.stringify({
        source: "ai",
        exercises: [],
        rpe: 7,
      });

      mockCache.get.mockReturnValueOnce(cachedPrescription);

      const result = await AIService.getDailyPrescription(
        "user-123",
        "intermediate" as ExperienceLevel
      );

      expect(result).toEqual(JSON.parse(cachedPrescription));
      // Should not call supabase
      expect(mockSupabase.functions.invoke).not.toHaveBeenCalled();
    });

    it("should handle corrupt cache gracefully", async () => {
      const corruptCache = "{ invalid json }";

      mockCache.get.mockReturnValueOnce(corruptCache);
      mockSupabase.functions.invoke = jest.fn().mockResolvedValueOnce({
        data: { prescription: "test" },
        error: null,
      });
      mockSupabase.auth.getSession = jest.fn().mockResolvedValueOnce({
        data: { session: { access_token: "test-token" } },
      });
      mockCache.set.mockImplementation(() => {});

      const result = await AIService.getDailyPrescription(
        "user-123",
        "intermediate" as ExperienceLevel
      );

      // Should attempt to call edge function when cache is corrupt
      expect(mockSupabase.functions.invoke).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    it("should call edge function when no token available", async () => {
      mockCache.get.mockReturnValueOnce(null);
      mockSupabase.auth.getSession = jest.fn().mockResolvedValueOnce({
        data: { session: null },
      });
      mockCache.set.mockImplementation(() => {});

      const result = await AIService.getDailyPrescription(
        "user-123",
        "intermediate" as ExperienceLevel
      );

      // Should fall back to deterministic when no token
      expect(result.source).toBe("deterministic");
      // Should cache the deterministic result
      expect(mockCache.set).toHaveBeenCalled();
    });

    it("should set cache with correct TTL for AI response", async () => {
      const mockData = { exercises: [], rpe: 7 };
      const AI_TTL_MS = 24 * 60 * 60 * 1000;

      mockCache.get.mockReturnValueOnce(null);
      mockSupabase.functions.invoke = jest.fn().mockResolvedValueOnce({
        data: mockData,
        error: null,
      });
      mockSupabase.auth.getSession = jest.fn().mockResolvedValueOnce({
        data: { session: { access_token: "test-token" } },
      });
      mockCache.set.mockImplementation(() => {});

      await AIService.getDailyPrescription(
        "user-123",
        "intermediate" as ExperienceLevel
      );

      // Verify cache was set with AI TTL
      expect(mockCache.set).toHaveBeenCalledWith(
        "user-123",
        expect.stringContaining("prescription:"),
        expect.any(String),
        AI_TTL_MS
      );
    });
  });

  describe("getPostWorkoutAnalysis", () => {
    it("should timeout after 15 seconds", async () => {
      const TIMEOUT_MS = 15_000;

      mockSupabase.functions.invoke = jest.fn().mockImplementationOnce(() => {
        // Simulate slow function
        return new Promise(() => {
          // Never resolve
        });
      });
      mockSupabase.auth.getSession = jest.fn().mockResolvedValueOnce({
        data: { session: { access_token: "test-token" } },
      });
      mockCache.get.mockReturnValueOnce(null);
      mockCache.set.mockImplementation(() => {});

      const responsePromise = AIService.getPostWorkoutAnalysis(
        "workout-123",
        "user-123"
      );

      // Fast-forward past timeout
      jest.advanceTimersByTime(TIMEOUT_MS + 100);
      await jest.runAllTimersAsync();

      const result = await responsePromise;
      // Should return null when timeout occurs and no cache
      expect(result).toBeNull();
    });

    it("should return cached analysis if available", async () => {
      const cachedAnalysis = "Great workout! You lifted heavy today.";

      mockCache.get.mockReturnValueOnce(cachedAnalysis);

      const result = await AIService.getPostWorkoutAnalysis(
        "workout-123",
        "user-123"
      );

      expect(result).toBe(cachedAnalysis);
      expect(mockSupabase.functions.invoke).not.toHaveBeenCalled();
    });

    it("should return null when no token available", async () => {
      mockCache.get.mockReturnValueOnce(null);
      mockSupabase.auth.getSession = jest.fn().mockResolvedValueOnce({
        data: { session: null },
      });

      const result = await AIService.getPostWorkoutAnalysis(
        "workout-123",
        "user-123"
      );

      expect(result).toBeNull();
      expect(mockSupabase.functions.invoke).not.toHaveBeenCalled();
    });

    it("should cache successful analysis response", async () => {
      const mockAnalysis = "Excellent form on your squats!";
      const AI_TTL_MS = 24 * 60 * 60 * 1000;

      mockCache.get.mockReturnValueOnce(null);
      mockSupabase.functions.invoke = jest.fn().mockResolvedValueOnce({
        data: { analysis: mockAnalysis },
        error: null,
      });
      mockSupabase.auth.getSession = jest.fn().mockResolvedValueOnce({
        data: { session: { access_token: "test-token" } },
      });
      mockCache.set.mockImplementation(() => {});

      const result = await AIService.getPostWorkoutAnalysis(
        "workout-123",
        "user-123"
      );

      expect(result).toBe(mockAnalysis);
      expect(mockCache.set).toHaveBeenCalledWith(
        "user-123",
        expect.stringContaining("post_workout:"),
        mockAnalysis,
        AI_TTL_MS
      );
    });

    it("should return null when error occurs", async () => {
      mockCache.get.mockReturnValueOnce(null);
      mockSupabase.functions.invoke = jest.fn().mockResolvedValueOnce({
        data: null,
        error: new Error("Function error"),
      });
      mockSupabase.auth.getSession = jest.fn().mockResolvedValueOnce({
        data: { session: { access_token: "test-token" } },
      });

      const result = await AIService.getPostWorkoutAnalysis(
        "workout-123",
        "user-123"
      );

      expect(result).toBeNull();
    });
  });
});
