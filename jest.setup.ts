// Add custom jest matchers
import "@testing-library/jest-native/extend-expect";

// Mock expo-sqlite
jest.mock("expo-sqlite", () => ({
  openDatabaseSync: jest.fn().mockReturnValue({
    execSync: jest.fn(),
    runSync: jest.fn(),
    getSync: jest.fn(),
    getAllSync: jest.fn(),
    withTransactionSync: jest.fn((fn) => fn()),
  }),
}));

// Mock @react-native-async-storage/async-storage
jest.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
    getAllKeys: jest.fn(),
    multiGet: jest.fn(),
    multiSet: jest.fn(),
  },
}));

// Mock expo-haptics
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  NotificationFeedbackType: {
    Success: 0,
    Warning: 1,
    Error: 2,
  },
  ImpactFeedbackStyle: {
    Light: 0,
    Medium: 1,
    Heavy: 2,
  },
  SelectionFeedbackType: {},
}));

// Mock @supabase/supabase-js
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({
    auth: {
      getSession: jest.fn(),
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
    },
    from: jest.fn(),
    functions: {
      invoke: jest.fn(),
    },
    rpc: jest.fn(),
  })),
}));

// Global test utilities
global.testUtils = {
  // Deterministic date for testing
  TEST_DATE: "2025-03-07",
  TEST_TIMESTAMP: new Date("2025-03-07T00:00:00Z").getTime(),
};

// Date/timer utilities for deterministic testing
global.testDateUtils = {
  /**
   * Set a fake date for testing
   * Usage: testDateUtils.setTestDate("2025-03-07")
   */
  setTestDate(dateStr: string) {
    const date = new Date(dateStr);
    jest.useFakeTimers();
    jest.setSystemTime(date);
  },

  /**
   * Reset to real timers
   */
  resetToRealTimers() {
    jest.useRealTimers();
  },

  /**
   * Advance timers by milliseconds
   */
  advanceTimers(ms: number) {
    jest.advanceTimersByTime(ms);
  },

  /**
   * Run all pending timers
   */
  runAllTimers() {
    return jest.runAllTimersAsync();
  },
};

// Suppress console errors during tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Warning") || args[0].includes("Not implemented"))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Type declarations for global test utilities
declare global {
  var testUtils: {
    TEST_DATE: string;
    TEST_TIMESTAMP: number;
  };
  var testDateUtils: {
    setTestDate(dateStr: string): void;
    resetToRealTimers(): void;
    advanceTimers(ms: number): void;
    runAllTimers(): Promise<void>;
  };
}
