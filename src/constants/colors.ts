export const colors = {
  brand: {
    primary: "#EA580C",
    secondary: "#0D9488",
    accent: "#3B82F6",
  },
  semantic: {
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    info: "#3B82F6",
  },
  rpe: {
    easy: "#10B981",
    moderate: "#F59E0B",
    hard: "#EA580C",
    maximal: "#EF4444",
  },
  dark: {
    background: "#0F172A",
    surface: "#1E293B",
    surfaceElevated: "#334155",
    border: "#475569",
    textPrimary: "#F8FAFC",
    textSecondary: "#94A3B8",
    textMuted: "#64748B",
  },
} as const;

export type ColorToken = typeof colors;
