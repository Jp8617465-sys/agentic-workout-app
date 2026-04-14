/**
 * Separate Jest config for pure TypeScript unit tests (no React Native environment).
 * Used for testing service/repository/utility modules that mock all RN deps.
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: [
    "**/components/charts/utils/*.test.ts",
    "**/features/progress/report-service.test.ts",
    "**/features/ai/chat-repository.test.ts",
    "**/features/home/daily-brief-repository.test.ts",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: { jsx: "react" } }],
  },
};
