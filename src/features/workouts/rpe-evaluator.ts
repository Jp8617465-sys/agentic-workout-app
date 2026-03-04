export interface RPEDeviationResult {
  hasDeviation: boolean;
  deviationMagnitude: number; // actualRpe - prescribedRpe; positive = harder than target
  severity: "none" | "minor" | "major";
  actionRequired: "none" | "suggest" | "require";
}

export const RPE_DEVIATION_THRESHOLD = 1.0;
export const RPE_MAJOR_THRESHOLD = 2.0;

export function evaluateRPEDeviation(
  actualRpe: number,
  prescribedRpe: number | null,
): RPEDeviationResult {
  if (prescribedRpe === null) {
    return {
      hasDeviation: false,
      deviationMagnitude: 0,
      severity: "none",
      actionRequired: "none",
    };
  }

  const deviationMagnitude = actualRpe - prescribedRpe;
  const absDeviation = Math.abs(deviationMagnitude);

  if (absDeviation < RPE_DEVIATION_THRESHOLD) {
    return {
      hasDeviation: false,
      deviationMagnitude,
      severity: "none",
      actionRequired: "none",
    };
  }

  if (absDeviation >= RPE_MAJOR_THRESHOLD) {
    return {
      hasDeviation: true,
      deviationMagnitude,
      severity: "major",
      actionRequired: "require",
    };
  }

  return {
    hasDeviation: true,
    deviationMagnitude,
    severity: "minor",
    actionRequired: "suggest",
  };
}
