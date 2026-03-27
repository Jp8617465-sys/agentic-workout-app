import { memo } from "react";
import { Pressable, Text, ActivityIndicator, StyleSheet, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../constants/colors";
import { typography } from "../constants/typography";
import { borderRadius, touchTarget } from "../constants/spacing";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

const VARIANT_STYLES: Record<ButtonVariant, { bg: string; bgPressed: string; text: string; border?: string }> = {
  primary: {
    bg: colors.brand.primary,
    bgPressed: "#C2410C",
    text: colors.dark.textInverse,
  },
  secondary: {
    bg: "transparent",
    bgPressed: colors.dark.surfaceElevated,
    text: colors.dark.textPrimary,
    border: colors.dark.border,
  },
  ghost: {
    bg: "transparent",
    bgPressed: colors.dark.surface,
    text: colors.dark.textSecondary,
  },
  danger: {
    bg: colors.semantic.danger,
    bgPressed: "#DC2626",
    text: colors.dark.textInverse,
  },
};

const SIZE_STYLES: Record<ButtonSize, { height: number; paddingHorizontal: number; fontSize: typeof typography.label.sm }> = {
  sm: { height: 36, paddingHorizontal: 12, fontSize: typography.label.sm },
  md: { height: touchTarget.minimum, paddingHorizontal: 16, fontSize: typography.label.md },
  lg: { height: touchTarget.numpadKey, paddingHorizontal: 24, fontSize: typography.label.lg },
};

export const Button = memo(function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon,
  style,
}: ButtonProps) {
  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          height: sizeStyle.height,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          backgroundColor: pressed ? variantStyle.bgPressed : variantStyle.bg,
          borderColor: variantStyle.border ?? "transparent",
          borderWidth: variantStyle.border ? 1 : 0,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyle.text} />
      ) : (
        <>
          {icon ? (
            <Ionicons
              name={icon}
              size={size === "sm" ? 16 : 20}
              color={variantStyle.text}
              style={styles.icon}
            />
          ) : null}
          <Text style={[sizeStyle.fontSize, { color: variantStyle.text, fontWeight: "600" }]}>
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.lg,
    gap: 8,
  },
  icon: {
    marginRight: -2,
  },
});
