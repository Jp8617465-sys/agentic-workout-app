/**
 * Separate Jest config for pure TypeScript unit tests (no React Native environment).
 * Used for testing service/repository/utility modules that mock all RN deps.
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  // setupFiles (not setupFilesAfterEnv): src/lib/supabase.ts calls createClient()
  // at module scope, so the env must exist before the graph is required.
  setupFiles: ["<rootDir>/test/setup.unit.js"],
  // Glob, not an allowlist: a new *.test.ts under src/ is picked up automatically.
  // A hardcoded list silently skips new tests, which is how AIService.test.ts and
  // sync-engine.test.ts went 32 tests unrun.
  testMatch: ["<rootDir>/src/**/*.test.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    // Expo native modules ship untranspiled ESM that the node runtime cannot
    // parse. Stub them so a module graph that merely *reaches* them resolves.
    "^expo-secure-store$": "<rootDir>/test/mocks/expo-secure-store.js",
    "^expo-sqlite$": "<rootDir>/test/mocks/expo-sqlite.js",
    "^expo-haptics$": "<rootDir>/test/mocks/expo-haptics.js",
    "^expo-notifications$": "<rootDir>/test/mocks/expo-notifications.js",
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: { jsx: "react" } }],
  },
};
