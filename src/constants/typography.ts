import { TextStyle } from "react-native";

export const typography = {
  heading: {
    h1: {
      fontSize: 28,
      fontWeight: "700",
      lineHeight: 34,
    } satisfies TextStyle,
    h2: {
      fontSize: 22,
      fontWeight: "600",
      lineHeight: 28,
    } satisfies TextStyle,
    h3: {
      fontSize: 18,
      fontWeight: "600",
      lineHeight: 24,
    } satisfies TextStyle,
  },
  body: {
    lg: {
      fontSize: 16,
      fontWeight: "400",
      lineHeight: 24,
    } satisfies TextStyle,
    md: {
      fontSize: 14,
      fontWeight: "400",
      lineHeight: 20,
    } satisfies TextStyle,
    sm: {
      fontSize: 12,
      fontWeight: "400",
      lineHeight: 16,
    } satisfies TextStyle,
  },
  label: {
    lg: {
      fontSize: 14,
      fontWeight: "600",
      lineHeight: 20,
    } satisfies TextStyle,
    md: {
      fontSize: 12,
      fontWeight: "600",
      lineHeight: 16,
    } satisfies TextStyle,
    sm: {
      fontSize: 10,
      fontWeight: "600",
      lineHeight: 14,
    } satisfies TextStyle,
  },
  numeric: {
    lg: {
      fontSize: 24,
      fontWeight: "700",
      lineHeight: 30,
      fontFamily: "SpaceMono",
    } satisfies TextStyle,
    md: {
      fontSize: 18,
      fontWeight: "600",
      lineHeight: 24,
      fontFamily: "SpaceMono",
    } satisfies TextStyle,
    sm: {
      fontSize: 14,
      fontWeight: "500",
      lineHeight: 18,
      fontFamily: "SpaceMono",
    } satisfies TextStyle,
  },
} as const;
