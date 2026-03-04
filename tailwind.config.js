/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#EA580C",
          secondary: "#0D9488",
          accent: "#3B82F6",
        },
        dark: {
          background: "#0F172A",
          surface: "#1E293B",
          "surface-elevated": "#334155",
          border: "#475569",
          "text-primary": "#F8FAFC",
          "text-secondary": "#94A3B8",
          "text-muted": "#64748B",
        },
        rpe: {
          easy: "#10B981",
          moderate: "#F59E0B",
          hard: "#EA580C",
          maximal: "#EF4444",
        },
      },
      fontFamily: {
        mono: ["SpaceMono"],
      },
    },
  },
  plugins: [],
};
