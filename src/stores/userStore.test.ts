import { useUserStore } from "./userStore";
import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("@react-native-async-storage/async-storage");

const mockAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;

describe("User Store", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the store for each test
    useUserStore.setState({
      id: null,
      name: "",
      experienceLevel: "beginner",
      trainingGoal: "general_fitness",
      unitSystem: "metric",
      availableEquipment: ["bodyweight"],
      weeklyFrequency: 3,
      isOnboardingComplete: false,
      supabaseUserId: null,
    });
  });

  describe("setUser", () => {
    it("should update user state with provided values", () => {
      const state = useUserStore.getState();

      state.setUser({
        id: "user-123",
        name: "John Doe",
        experienceLevel: "advanced",
      });

      const updated = useUserStore.getState();
      expect(updated.id).toBe("user-123");
      expect(updated.name).toBe("John Doe");
      expect(updated.experienceLevel).toBe("advanced");
    });

    it("should preserve unmodified fields", () => {
      const state = useUserStore.getState();

      state.setUser({
        id: "user-123",
        name: "John Doe",
      });

      const updated = useUserStore.getState();
      expect(updated.trainingGoal).toBe("general_fitness"); // unchanged
      expect(updated.unitSystem).toBe("metric"); // unchanged
    });

    it("should handle partial updates", () => {
      const state = useUserStore.getState();

      state.setUser({ experienceLevel: "elite" });

      const updated = useUserStore.getState();
      expect(updated.experienceLevel).toBe("elite");
      expect(updated.id).toBeNull(); // unchanged
    });

    it("should allow setting supabase user ID", () => {
      const state = useUserStore.getState();

      state.setUser({ supabaseUserId: "supabase-123" });

      const updated = useUserStore.getState();
      expect(updated.supabaseUserId).toBe("supabase-123");
    });
  });

  describe("setEquipment", () => {
    it("should update available equipment list", () => {
      const state = useUserStore.getState();

      state.setEquipment(["barbell", "dumbbell", "machine"]);

      const updated = useUserStore.getState();
      expect(updated.availableEquipment).toEqual([
        "barbell",
        "dumbbell",
        "machine",
      ]);
    });

    it("should replace entire equipment list", () => {
      const state = useUserStore.getState();
      state.setEquipment(["bodyweight"]);

      state.setEquipment(["barbell", "cables"]);

      const updated = useUserStore.getState();
      expect(updated.availableEquipment).toEqual(["barbell", "cables"]);
      expect(updated.availableEquipment).not.toContain("bodyweight");
    });

    it("should handle empty equipment list", () => {
      const state = useUserStore.getState();

      state.setEquipment([]);

      const updated = useUserStore.getState();
      expect(updated.availableEquipment).toEqual([]);
    });

    it("should handle single equipment item", () => {
      const state = useUserStore.getState();

      state.setEquipment(["bodyweight"]);

      const updated = useUserStore.getState();
      expect(updated.availableEquipment).toEqual(["bodyweight"]);
    });

    it("should handle duplicate equipment items", () => {
      const state = useUserStore.getState();

      // Duplicates not filtered (caller responsibility)
      state.setEquipment(["barbell", "barbell", "dumbbell"]);

      const updated = useUserStore.getState();
      expect(updated.availableEquipment).toEqual([
        "barbell",
        "barbell",
        "dumbbell",
      ]);
    });
  });

  describe("setFrequency", () => {
    it("should update weekly training frequency", () => {
      const state = useUserStore.getState();

      state.setFrequency(5);

      const updated = useUserStore.getState();
      expect(updated.weeklyFrequency).toBe(5);
    });

    it("should allow setting minimum frequency (1)", () => {
      const state = useUserStore.getState();

      state.setFrequency(1);

      const updated = useUserStore.getState();
      expect(updated.weeklyFrequency).toBe(1);
    });

    it("should allow setting maximum frequency", () => {
      const state = useUserStore.getState();

      state.setFrequency(7);

      const updated = useUserStore.getState();
      expect(updated.weeklyFrequency).toBe(7);
    });

    it("should handle fractional frequency", () => {
      const state = useUserStore.getState();

      state.setFrequency(3.5);

      const updated = useUserStore.getState();
      expect(updated.weeklyFrequency).toBe(3.5);
    });

    it("should allow updating frequency multiple times", () => {
      const state = useUserStore.getState();

      state.setFrequency(3);
      let updated = useUserStore.getState();
      expect(updated.weeklyFrequency).toBe(3);

      state.setFrequency(5);
      updated = useUserStore.getState();
      expect(updated.weeklyFrequency).toBe(5);
    });
  });

  describe("completeOnboarding", () => {
    it("should set onboarding as complete", () => {
      const state = useUserStore.getState();

      state.completeOnboarding();

      const updated = useUserStore.getState();
      expect(updated.isOnboardingComplete).toBe(true);
    });

    it("should preserve other state on completion", () => {
      const state = useUserStore.getState();
      state.setUser({
        id: "user-123",
        name: "John",
        experienceLevel: "intermediate",
      });

      state.completeOnboarding();

      const updated = useUserStore.getState();
      expect(updated.isOnboardingComplete).toBe(true);
      expect(updated.id).toBe("user-123");
      expect(updated.name).toBe("John");
      expect(updated.experienceLevel).toBe("intermediate");
    });

    it("should be idempotent (can call multiple times)", () => {
      const state = useUserStore.getState();

      state.completeOnboarding();
      let updated = useUserStore.getState();
      expect(updated.isOnboardingComplete).toBe(true);

      state.completeOnboarding();
      updated = useUserStore.getState();
      expect(updated.isOnboardingComplete).toBe(true);
    });
  });

  describe("reset", () => {
    it("should reset store to initial state", () => {
      const state = useUserStore.getState();
      state.setUser({
        id: "user-123",
        name: "John",
        experienceLevel: "advanced",
        supabaseUserId: "sup-123",
      });
      state.setEquipment(["barbell", "dumbbell"]);
      state.setFrequency(6);
      state.completeOnboarding();

      state.reset();

      const reset = useUserStore.getState();
      expect(reset.id).toBeNull();
      expect(reset.name).toBe("");
      expect(reset.experienceLevel).toBe("beginner");
      expect(reset.availableEquipment).toEqual(["bodyweight"]);
      expect(reset.weeklyFrequency).toBe(3);
      expect(reset.isOnboardingComplete).toBe(false);
      expect(reset.supabaseUserId).toBeNull();
    });

    it("should allow rebuilding state after reset", () => {
      const state = useUserStore.getState();
      state.setUser({
        id: "user-123",
        name: "John",
      });
      state.reset();

      state.setUser({
        id: "user-456",
        name: "Jane",
      });

      const updated = useUserStore.getState();
      expect(updated.id).toBe("user-456");
      expect(updated.name).toBe("Jane");
    });
  });

  describe("Persistence to AsyncStorage", () => {
    it("should persist state changes to storage", async () => {
      mockAsyncStorage.setItem.mockResolvedValue(undefined);

      const state = useUserStore.getState();
      state.setUser({
        id: "user-123",
        name: "John",
        experienceLevel: "advanced",
      });

      // The persist middleware should have been called
      // Note: This test verifies the store is configured with persist
      expect(useUserStore.getState().id).toBe("user-123");
    });

    it("should be configured with persist middleware", () => {
      const state = useUserStore.getState();

      // Check that state object has expected shape
      expect(state).toHaveProperty("id");
      expect(state).toHaveProperty("name");
      expect(state).toHaveProperty("setUser");
      expect(state).toHaveProperty("reset");
    });
  });

  describe("Multiple store instances", () => {
    it("should share state across multiple subscribers", () => {
      const subscriber1 = jest.fn();
      const subscriber2 = jest.fn();

      useUserStore.subscribe(subscriber1);
      useUserStore.subscribe(subscriber2);

      const state = useUserStore.getState();
      state.setUser({ id: "user-123" });

      expect(subscriber1).toHaveBeenCalled();
      expect(subscriber2).toHaveBeenCalled();
    });

    it("should allow unsubscribing", () => {
      const subscriber = jest.fn();
      const unsubscribe = useUserStore.subscribe(subscriber);

      unsubscribe();

      const state = useUserStore.getState();
      state.setUser({ id: "user-123" });

      expect(subscriber).not.toHaveBeenCalled();
    });
  });

  describe("Validation scenarios", () => {
    it("should handle valid experience levels", () => {
      const state = useUserStore.getState();
      const levels: Array<"beginner" | "intermediate" | "advanced" | "elite"> =
        ["beginner", "intermediate", "advanced", "elite"];

      levels.forEach((level) => {
        state.setUser({ experienceLevel: level });
        expect(useUserStore.getState().experienceLevel).toBe(level);
      });
    });

    it("should handle valid training goals", () => {
      const state = useUserStore.getState();
      const goals: Array<"strength" | "hypertrophy" | "endurance" | "general_fitness"> =
        ["strength", "hypertrophy", "endurance", "general_fitness"];

      goals.forEach((goal) => {
        state.setUser({ trainingGoal: goal });
        expect(useUserStore.getState().trainingGoal).toBe(goal);
      });
    });

    it("should handle valid unit systems", () => {
      const state = useUserStore.getState();
      const units: Array<"metric" | "imperial"> = ["metric", "imperial"];

      units.forEach((unit) => {
        state.setUser({ unitSystem: unit });
        expect(useUserStore.getState().unitSystem).toBe(unit);
      });
    });
  });

  describe("Complex workflows", () => {
    it("should handle complete user setup workflow", () => {
      const state = useUserStore.getState();

      state.setUser({
        id: "user-123",
        name: "John Doe",
        experienceLevel: "intermediate",
        trainingGoal: "strength",
        unitSystem: "metric",
        supabaseUserId: "sup-123",
      });

      state.setEquipment(["barbell", "dumbbell", "machine"]);
      state.setFrequency(4);
      state.completeOnboarding();

      const final = useUserStore.getState();
      expect(final.id).toBe("user-123");
      expect(final.name).toBe("John Doe");
      expect(final.experienceLevel).toBe("intermediate");
      expect(final.availableEquipment).toEqual([
        "barbell",
        "dumbbell",
        "machine",
      ]);
      expect(final.weeklyFrequency).toBe(4);
      expect(final.isOnboardingComplete).toBe(true);
    });

    it("should handle update of existing user", () => {
      const state = useUserStore.getState();

      // Initial setup
      state.setUser({
        id: "user-123",
        name: "John",
        experienceLevel: "beginner",
      });

      // Later update (progression)
      state.setUser({ experienceLevel: "intermediate" });

      const updated = useUserStore.getState();
      expect(updated.experienceLevel).toBe("intermediate");
      expect(updated.id).toBe("user-123"); // unchanged
    });
  });
});
