/**
 * Jest config for JAMES-OS stress tests.
 * dt-engine.ts and kb-manifest.ts are pure TypeScript (no Deno imports),
 * so ts-jest can handle them directly even though they live in supabase/functions/.
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/features/ai/__tests__/james-os.stress.test.ts"],
  roots: ["<rootDir>/src", "<rootDir>/supabase/functions/james-os"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: { jsx: "react" } }],
  },
};
