// Pure TypeScript — no Deno-specific imports. Safe to import directly in Jest tests.

export type KBFile = {
  key: string;
  description: string;
};

export const KB_FILES: KBFile[] = [
  {
    key: "james-profile.md",
    description: "James physical profile, training history, and personal goals",
  },
  {
    key: "constraints.md",
    description:
      "Injury constraint rules and exercise modification guidelines (static reference; live active constraints come from injuries table at runtime)",
  },
  {
    key: "training-philosophy.md",
    description: "Evidence-based training principles and periodization rationale",
  },
  {
    key: "periodization.md",
    description: "Current mesocycle structure, phase targets, and weekly layout",
  },
  {
    key: "dt-rules.md",
    description:
      "Decision tree rules reference: DT-01 readiness thresholds and DT-03 load progression tables",
  },
];

export const KB_BUCKET = "james-os-kb";
