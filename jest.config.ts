import type { Config } from "jest";

const config: Config = {
  preset: "react-native",
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react",
          esModuleInterop: true,
        },
      },
    ],
  },
  testMatch: ["**/__tests__/**/*.test.ts?(x)", "**/?(*.)+(spec|test).ts?(x)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/**/*.test.{ts,tsx}",
    "!src/navigation/**",
    "!src/constants/**",
    "!src/types/**",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    "src/lib/": {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    "src/features/workouts/": {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    "src/features/ai/": {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    "src/stores/": {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  testTimeout: 10000,
};

export default config;
