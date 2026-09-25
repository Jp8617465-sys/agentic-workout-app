// Pure TypeScript — no Deno-specific imports. Safe to import directly in Jest tests.

export const KB_BUCKET = "james-os-kb";

// All 20 KB files with their Storage paths
export const KB_FILE_PATHS = {
  // Core reference files (always under kb/)
  F01: "kb/F01_Master_Index.md",
  F02: "kb/F02_Strength_and_Power.md",
  F03: "kb/F03_Concurrent_Training.md",
  F04: "kb/F04_Rehab.md",
  F05: "kb/F05_Nutrition.md",
  F06: "kb/F06_Running_Mechanics.md",
  F07: "kb/F07_Sleep_and_Recovery.md",
  F08: "kb/F08_Mental_Performance.md",
  F09: "kb/F09_Protocol_Library.md",
  F10: "kb/F10_Decision_Trees.md",
  F11: "kb/F11_Assessment_Frameworks.md",
  F12: "kb/F12_Evidence_Appendix.md",
  F13: "kb/F13_Integration_Guide.md",
  F14: "kb/F14_Glossary_and_Standards.md",
  F15: "kb/F15_Versioning.md",
  // Programme-specific files (under programme/)
  MESO1:      "programme/JAMES_OS_Meso1_v2.md",
  MESO2:      "programme/JAMES_OS_Meso2_v2.md",
  MESO3:      "programme/JAMES_OS_Meso3_v2.md",
  NUTRITION:  "programme/JAMES_OS_Nutrition_Protocol_v1.md",
  RECOVERY:   "programme/JAMES_OS_Recovery_Sleep_Protocol_v1.md",
} as const;

export type KBFileKey = keyof typeof KB_FILE_PATHS;

// Commands supported by the coaching_session mode.
// Each entry lists which KB files to load — selective loading keeps token usage low.
export type JamesOSCommand =
  | "morning_brief"
  | "session_plan"
  | "log_session"
  | "log_wellness"
  | "log_meal"
  | "check_readiness"
  | "triage_pain"
  | "weekly_review"
  | "mesocycle_review"
  | "plateau_diagnosis"
  | "explain"
  | "handoff_clinician"
  | "state"
  | "chat";

export const COMMAND_KB_MAP: Record<JamesOSCommand, KBFileKey[]> = {
  morning_brief:    ["F01", "F10", "F13", "F07", "MESO1"],
  session_plan:     ["F01", "F10", "F02", "F09", "F04", "MESO1"],
  log_session:      ["F01", "F10", "F02", "F09", "MESO1"],
  log_wellness:     ["F01", "F10", "F07"],
  log_meal:         ["F01", "F05", "NUTRITION"],
  check_readiness:  ["F01", "F10", "F07", "F13"],
  triage_pain:      ["F01", "F10", "F04"],
  weekly_review:    ["F01", "F10", "F13", "F02", "NUTRITION", "MESO1"],
  mesocycle_review: ["F01", "F10", "F13", "F02", "F11", "MESO1", "MESO2"],
  plateau_diagnosis:["F01", "F10", "F02", "F05", "F07", "F13"],
  explain:          ["F01", "F12", "F14"],
  handoff_clinician:["F01", "F04", "F13"],
  state:            ["F01", "F13"],
  chat:             ["F01", "F10", "F13", "F14"],
};

// Resolves a command to its list of Storage paths
export function getKBPathsForCommand(command: JamesOSCommand): string[] {
  const keys = COMMAND_KB_MAP[command];
  return keys.map((k) => KB_FILE_PATHS[k]);
}

// Legacy: used by stress tests — all non-programme files
export const KB_FILES = Object.entries(KB_FILE_PATHS)
  .filter(([k]) => !["MESO1","MESO2","MESO3","NUTRITION","RECOVERY"].includes(k))
  .map(([, path]) => ({ key: path, description: path }));
