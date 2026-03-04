import type { ExperienceLevel, TrainingGoal, PeriodizationModel } from "../../types";

export interface PeriodizationRecommendation {
  model: PeriodizationModel;
  durationWeeks: number;
  rationale: string;
}

export function selectPeriodizationModel(
  experienceLevel: ExperienceLevel,
  trainingGoal: TrainingGoal,
): PeriodizationRecommendation {
  if (experienceLevel === "beginner") {
    return {
      model: "linear",
      durationWeeks: 8,
      rationale: "Linear periodization builds a solid foundation with progressive overload each week.",
    };
  }

  if (experienceLevel === "elite" || (experienceLevel === "advanced" && trainingGoal === "strength")) {
    return {
      model: "conjugate",
      durationWeeks: 16,
      rationale: "Conjugate method rotates max effort and dynamic effort days for advanced strength.",
    };
  }

  if (experienceLevel === "intermediate") {
    return {
      model: "dup",
      durationWeeks: 12,
      rationale: "Daily undulating periodization varies intensity across the week for balanced progress.",
    };
  }

  return {
    model: "block",
    durationWeeks: 12,
    rationale: "Block periodization focuses on one quality per phase for systematic development.",
  };
}
