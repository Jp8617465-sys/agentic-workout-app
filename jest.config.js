/**
 * React Native component-test config (jest-expo).
 *
 * CURRENTLY NON-FUNCTIONAL — do not wire this into `npm test` or CI until fixed.
 * Running it fails with:
 *   [BABEL] react-native/jest/react-native-env.js: .plugins is not a valid Plugin property
 * because Expo SDK 55 / React Native 0.83 require Jest 30, while this project pins
 * jest ^29.7.0. jest-expo has been aligned to ~55 to shrink the eventual migration,
 * but the jest 29 -> 30 bump (and the matching ts-jest/babel-jest bump) is the real
 * blocker and is tracked in docs/product/cleanup-backlog.md.
 *
 * There are currently zero component tests (*.test.tsx), so nothing is being skipped
 * by this being broken. All 94 existing tests are pure TypeScript and run under
 * jest.unit.config.js, which is what `npm test` points at.
 */
module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@shopify/flash-list|@supabase/supabase-js|@legendapp/state|nativewind|react-native-reanimated|react-native-gesture-handler|react-native-screens|react-native-safe-area-context|react-native-svg|zustand)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  // `setupFilesAfterSetup` is not a Jest option — the correct key is
  // `setupFilesAfterEnv`. Because the misspelling was silently ignored, the
  // missing jest.setup.js never raised an error and this config's setup never ran.
  setupFiles: ["<rootDir>/test/setup.unit.js"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.test.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/types/**",
    "!src/constants/**",
  ],
};
