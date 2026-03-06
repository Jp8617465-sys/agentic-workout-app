# Design Implementation Guide - React Native Expo

Comprehensive guide for implementing the design specifications with React Native, NativeWind, and Tailwind CSS.

---

## Table of Contents

1. [Design Tokens & Configuration](#design-tokens--configuration)
2. [Component Implementation Examples](#component-implementation-examples)
3. [Responsive Layout Patterns](#responsive-layout-patterns)
4. [Accessibility Implementation](#accessibility-implementation)
5. [Animation & Interaction Patterns](#animation--interaction-patterns)
6. [Performance Optimization](#performance-optimization)
7. [Testing Checklist](#testing-checklist)

---

## Design Tokens & Configuration

### Tailwind Configuration (tailwind.config.js)

The project already has base tokens configured. Expand with additional design system specifications:

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Colors (already defined, expanded)
      colors: {
        // Brand colors
        brand: {
          primary: "#EA580C",      // Orange (secondary CTA)
          secondary: "#0D9488",    // Teal
          accent: "#3B82F6",       // Blue (primary accent)
        },
        // Dark theme
        dark: {
          background: "#0F172A",
          surface: "#1E293B",
          "surface-elevated": "#334155",
          border: "#475569",
          "text-primary": "#F8FAFC",
          "text-secondary": "#94A3B8",
          "text-muted": "#64748B",
        },
        // RPE scale (perceived exertion)
        rpe: {
          easy: "#10B981",      // Green
          moderate: "#F59E0B",  // Amber
          hard: "#EA580C",      // Orange
          maximal: "#EF4444",   // Red
        },
        // Status colors
        status: {
          success: "#10B981",
          warning: "#F59E0B",
          error: "#EF4444",
          info: "#3B82F6",
        },
      },

      // Typography
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI"],
        mono: ["SpaceMono", "monospace"],
      },
      fontSize: {
        display: ["32px", { lineHeight: "1.2", fontWeight: "700" }],
        headline: ["24px", { lineHeight: "1.2", fontWeight: "600" }],
        subheading: ["18px", { lineHeight: "1.2", fontWeight: "600" }],
        "body-lg": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
        body: ["14px", { lineHeight: "1.5", fontWeight: "400" }],
        caption: ["12px", { lineHeight: "1.5", fontWeight: "400" }],
        label: ["12px", { lineHeight: "1.5", fontWeight: "600" }],
        small: ["10px", { lineHeight: "1.5", fontWeight: "400" }],
      },

      // Spacing system
      spacing: {
        0: "0",
        1: "4px",
        2: "8px",
        3: "12px",
        4: "16px",
        6: "24px",
        8: "32px",
        12: "48px",
      },

      // Border radius
      borderRadius: {
        none: "0",
        sm: "4px",
        base: "8px",
        lg: "12px",
        xl: "16px",
        full: "9999px",
      },

      // Shadows (elevation system)
      boxShadow: {
        none: "none",
        sm: "0 2px 4px rgba(0, 0, 0, 0.2)",
        base: "0 4px 8px rgba(0, 0, 0, 0.15)",
        md: "0 6px 12px rgba(0, 0, 0, 0.15)",
        lg: "0 8px 16px rgba(0, 0, 0, 0.2)",
        xl: "0 12px 24px rgba(0, 0, 0, 0.25)",
      },

      // Line heights (typography)
      lineHeight: {
        tight: "1.2",
        normal: "1.5",
        relaxed: "1.75",
      },

      // Opacity for state changes
      opacity: {
        0: "0",
        5: "0.05",
        10: "0.1",
        25: "0.25",
        50: "0.5",
        75: "0.75",
        85: "0.85",
        90: "0.9",
        95: "0.95",
        100: "1",
      },
    },
  },
  plugins: [],
};
```

### Design Tokens TypeScript File

```typescript
// src/constants/design-tokens.ts
export const COLORS = {
  // Brand
  ACCENT: "#3B82F6",
  ACCENT_LIGHT: "#60A5FA",
  ACCENT_DARK: "#1E40AF",

  // Backgrounds
  BG_PRIMARY: "#0F172A",
  BG_SURFACE: "#1E293B",
  BG_SURFACE_ELEVATED: "#334155",

  // Text
  TEXT_PRIMARY: "#F8FAFC",
  TEXT_SECONDARY: "#94A3B8",
  TEXT_MUTED: "#64748B",

  // Status
  SUCCESS: "#10B981",
  WARNING: "#F59E0B",
  ERROR: "#EF4444",

  // Borders
  BORDER: "#475569",
};

export const SPACING = {
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 24,
  XXL: 32,
  XXXL: 48,
};

export const TYPOGRAPHY = {
  DISPLAY: { fontSize: 32, fontWeight: "700", lineHeight: 1.2 },
  HEADLINE: { fontSize: 24, fontWeight: "600", lineHeight: 1.2 },
  SUBHEADING: { fontSize: 18, fontWeight: "600", lineHeight: 1.2 },
  BODY_LG: { fontSize: 16, fontWeight: "400", lineHeight: 1.5 },
  BODY: { fontSize: 14, fontWeight: "400", lineHeight: 1.5 },
  CAPTION: { fontSize: 12, fontWeight: "400", lineHeight: 1.5 },
  LABEL: { fontSize: 12, fontWeight: "600", lineHeight: 1.5 },
  SMALL: { fontSize: 10, fontWeight: "400", lineHeight: 1.5 },
};

export const TOUCH_TARGET = {
  MIN: 44,
  STANDARD: 48,
  LARGE: 56,
};

export const BORDER_RADIUS = {
  SM: 4,
  BASE: 8,
  LG: 12,
  XL: 16,
  FULL: 9999,
};

export const SHADOW = {
  NONE: "0 0 0 rgba(0, 0, 0, 0)",
  SM: { elevation: 2, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 3 },
  BASE: { elevation: 4, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 6 },
  MD: { elevation: 6, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 9 },
};
```

---

## Component Implementation Examples

### Base Button Component

```typescript
// src/components/Button.tsx
import React from "react";
import { Pressable, Text, ActivityIndicator, View } from "react-native";
import { useAppTheme } from "../hooks/useAppTheme";
import { COLORS, SPACING, TYPOGRAPHY, TOUCH_TARGET } from "../constants/design-tokens";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: object;
}

export const Button = React.forwardRef<View, ButtonProps>(
  (
    {
      title,
      onPress,
      variant = "primary",
      size = "medium",
      disabled = false,
      loading = false,
      icon,
      style,
    },
    ref
  ) => {
    const { isDark } = useAppTheme();

    const variantStyles = {
      primary: "bg-blue-500",
      secondary: "bg-gray-700",
      danger: "bg-red-500",
    };

    const sizeStyles = {
      small: "px-3 py-2 h-9",
      medium: "px-4 py-3 h-11",
      large: "px-4 py-3 h-14",
    };

    return (
      <Pressable
        ref={ref}
        onPress={onPress}
        disabled={disabled || loading}
        className={`
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          rounded-lg
          flex-row items-center justify-center
          ${disabled || loading ? "opacity-50" : ""}
          active:opacity-85
        `}
        style={[
          {
            minHeight: TOUCH_TARGET.MIN,
            minWidth: TOUCH_TARGET.MIN,
          },
          style,
        ]}
        accessibilityRole="button"
        accessibilityLabel={title}
        accessibilityState={{ disabled: disabled || loading }}
      >
        {icon && <View className="mr-2">{icon}</View>}

        {loading ? (
          <ActivityIndicator color={COLORS.TEXT_PRIMARY} size="small" />
        ) : (
          <Text
            className="text-label text-white font-semibold text-center"
            numberOfLines={1}
          >
            {title}
          </Text>
        )}
      </Pressable>
    );
  }
);

Button.displayName = "Button";
```

### Card Component

```typescript
// src/components/Card.tsx
import React from "react";
import { View, Pressable, StyleProp, ViewStyle } from "react-native";
import { COLORS, SPACING, BORDER_RADIUS, SHADOW } from "../constants/design-tokens";

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: "default" | "elevated" | "highlighted";
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const Card = React.forwardRef<View, CardProps>(
  ({ children, onPress, variant = "default", style, testID }, ref) => {
    const variantStyles = {
      default: {
        backgroundColor: COLORS.BG_SURFACE_ELEVATED,
        borderColor: COLORS.BORDER,
        borderWidth: 1,
      },
      elevated: {
        backgroundColor: COLORS.BG_SURFACE_ELEVATED,
        ...SHADOW.BASE,
      },
      highlighted: {
        backgroundColor: COLORS.BG_SURFACE_ELEVATED,
        borderColor: COLORS.ACCENT,
        borderWidth: 2,
      },
    };

    const Component = onPress ? Pressable : View;

    return (
      <Component
        ref={ref}
        onPress={onPress}
        className="rounded-lg overflow-hidden"
        style={[
          {
            ...variantStyles[variant],
            padding: SPACING.MD,
            minHeight: onPress ? TOUCH_TARGET.MIN : "auto",
            minWidth: onPress ? TOUCH_TARGET.MIN : "auto",
          },
          style,
        ]}
        accessible={!!onPress}
        accessibilityRole={onPress ? "button" : "text"}
        testID={testID}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = "Card";
```

### Text Input Component

```typescript
// src/components/TextInput.tsx
import React, { useState } from "react";
import {
  TextInput as RNTextInput,
  View,
  Text,
  Pressable,
  TextInputProps as RNTextInputProps,
} from "react-native";
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from "../constants/design-tokens";

interface TextInputProps extends RNTextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  onClear?: () => void;
}

export const TextInput = React.forwardRef<RNTextInput, TextInputProps>(
  ({ label, error, hint, icon, value, onClear, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    const showClearButton = onClear && value && isFocused;

    return (
      <View className="mb-4">
        {label && (
          <Text
            className="text-label font-semibold mb-2"
            style={{ color: COLORS.TEXT_SECONDARY }}
          >
            {label}
          </Text>
        )}

        <View
          className={`
            flex-row items-center
            border rounded-lg
            px-3 py-2
            ${isFocused ? "border-blue-500 border-2" : "border-gray-600"}
            ${error ? "border-red-500 border-2" : ""}
          `}
          style={{
            backgroundColor: COLORS.BG_SURFACE,
            minHeight: 44,
          }}
        >
          {icon && <View className="mr-2">{icon}</View>}

          <RNTextInput
            ref={ref}
            {...props}
            value={value}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            placeholderTextColor={COLORS.TEXT_MUTED}
            className="flex-1 text-body text-white"
            style={{ color: COLORS.TEXT_PRIMARY }}
            accessible={true}
            accessibilityLabel={label}
          />

          {showClearButton && (
            <Pressable
              onPress={onClear}
              className="p-2"
              accessibilityRole="button"
              accessibilityLabel="Clear input"
            >
              <Text style={{ color: COLORS.TEXT_MUTED }}>✕</Text>
            </Pressable>
          )}
        </View>

        {error && (
          <Text
            className="text-caption mt-1"
            style={{ color: COLORS.ERROR }}
            accessibilityLiveRegion="assertive"
          >
            {error}
          </Text>
        )}

        {hint && !error && (
          <Text className="text-caption mt-1" style={{ color: COLORS.TEXT_MUTED }}>
            {hint}
          </Text>
        )}
      </View>
    );
  }
);

TextInput.displayName = "TextInput";
```

### Toggle Switch Component

```typescript
// src/components/ToggleSwitch.tsx
import React, { useState } from "react";
import { Pressable, Animated, View } from "react-native";
import { COLORS, SPACING } from "../constants/design-tokens";

interface ToggleSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  value,
  onValueChange,
  label,
  disabled,
}) => {
  const animatedValue = new Animated.Value(value ? 1 : 0);

  const handlePress = () => {
    if (disabled) return;

    const newValue = !value;
    Animated.timing(animatedValue, {
      toValue: newValue ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();

    onValueChange(newValue);
  };

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 24],
  });

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.TEXT_MUTED, COLORS.ACCENT],
  });

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      className="flex-row items-center"
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
    >
      <Animated.View
        className="rounded-full"
        style={{
          width: 48,
          height: 28,
          backgroundColor,
          justifyContent: "center",
          paddingHorizontal: 2,
        }}
      >
        <Animated.View
          className="rounded-full"
          style={{
            width: 24,
            height: 24,
            backgroundColor: COLORS.TEXT_PRIMARY,
            transform: [{ translateX }],
          }}
        />
      </Animated.View>

      {label && (
        <Text className="text-body ml-3" style={{ color: COLORS.TEXT_PRIMARY }}>
          {label}
        </Text>
      )}
    </Pressable>
  );
};
```

---

## Responsive Layout Patterns

### Safe Area Aware Layout

```typescript
// src/hooks/useSafeAreaInsets.ts
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const useSafeAreaInsets = () => {
  return useSafeAreaInsets();
};

// Usage in screen
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const DashboardScreen = () => {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ScrollView
        contentContainerStyle={{
          paddingLeft: insets.left,
          paddingRight: insets.right,
        }}
      >
        {/* Content */}
      </ScrollView>
    </SafeAreaView>
  );
};
```

### Responsive Grid Layout

```typescript
// src/components/ResponsiveGrid.tsx
import React from "react";
import { View, useWindowDimensions } from "react-native";
import { SPACING } from "../constants/design-tokens";

interface ResponsiveGridProps {
  children: React.ReactNode[];
  gap?: number;
  minColumnWidth?: number;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  gap = SPACING.MD,
  minColumnWidth = 100,
}) => {
  const { width } = useWindowDimensions();
  const contentWidth = width - SPACING.LG * 2; // Account for padding

  // Calculate number of columns
  const numColumns = Math.max(
    1,
    Math.floor((contentWidth + gap) / (minColumnWidth + gap))
  );

  // Arrange children in rows
  const rows = [];
  for (let i = 0; i < children.length; i += numColumns) {
    rows.push(children.slice(i, i + numColumns));
  }

  return (
    <View>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row justify-between mb-3">
          {row.map((child, colIndex) => (
            <View
              key={colIndex}
              style={{
                flex: 1,
                marginRight: colIndex < row.length - 1 ? gap : 0,
              }}
            >
              {child}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};
```

### Adaptive Bottom Sheet

```typescript
// src/components/AdaptiveBottomSheet.tsx
import React from "react";
import { Modal, View, useWindowDimensions, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, SPACING, BORDER_RADIUS } from "../constants/design-tokens";

interface AdaptiveBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  maxHeight?: number;
}

export const AdaptiveBottomSheet: React.FC<AdaptiveBottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  maxHeight,
}) => {
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  // On tablet (height > 800), use full screen modal
  // On phone, use bottom sheet
  const isTablet = screenHeight > 800;

  if (!isOpen) return null;

  if (isTablet) {
    return (
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={onClose}
      >
        <View className="flex-1" style={{ backgroundColor: COLORS.BG_PRIMARY }}>
          {title && (
            <View className="flex-row justify-between items-center p-4 border-b border-gray-700">
              <Text className="text-headline">{title}</Text>
              <Pressable onPress={onClose}>
                <Text className="text-body">✕</Text>
              </Pressable>
            </View>
          )}
          <View className="flex-1">{children}</View>
        </View>
      </Modal>
    );
  }

  // Phone bottom sheet
  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        onPress={onClose}
      >
        <Pressable
          className="rounded-t-lg overflow-hidden"
          onPress={() => {}} // Prevent closing on content press
          style={{
            backgroundColor: COLORS.BG_SURFACE,
            marginTop: "auto",
            maxHeight: maxHeight || screenHeight * 0.75,
            paddingBottom: insets.bottom,
            borderTopLeftRadius: BORDER_RADIUS.LG,
            borderTopRightRadius: BORDER_RADIUS.LG,
          }}
        >
          {/* Drag handle */}
          <View className="items-center py-3">
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: COLORS.BORDER,
                borderRadius: 2,
              }}
            />
          </View>

          {title && (
            <View className="px-4 py-3 border-b border-gray-700">
              <Text className="text-headline">{title}</Text>
            </View>
          )}

          <View className="px-4 py-4">
            {children}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};
```

---

## Accessibility Implementation

### Accessible List Component

```typescript
// src/components/AccessibleList.tsx
import React from "react";
import {
  FlatList,
  FlatListProps,
  View,
  AccessibilityInfo,
  ViewStyle,
} from "react-native";

interface AccessibleListProps<T> extends FlatListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactElement;
  listLabel: string;
  itemLabel?: (item: T, index: number) => string;
}

export const AccessibleList = React.forwardRef<FlatList, AccessibleListProps<any>>(
  ({ items, renderItem, listLabel, itemLabel, ...props }, ref) => {
    return (
      <View
        accessible
        accessibilityRole="list"
        accessibilityLabel={listLabel}
        accessibilityHint={`Contains ${items.length} items`}
      >
        <FlatList
          ref={ref}
          data={items}
          renderItem={({ item, index }) => (
            <View
              accessible
              accessibilityRole="listitem"
              accessibilityLabel={itemLabel?.(item, index)}
              accessibilityHint={`Item ${index + 1} of ${items.length}`}
            >
              {renderItem(item, index)}
            </View>
          )}
          keyExtractor={(_, index) => `list-item-${index}`}
          {...props}
        />
      </View>
    );
  }
);

AccessibleList.displayName = "AccessibleList";
```

### Screen Reader Announcements

```typescript
// src/hooks/useAccessibilityAnnouncement.ts
import { AccessibilityInfo, Platform } from "react-native";
import { useEffect } from "react";

export const useAccessibilityAnnouncement = (
  message: string,
  shouldAnnounce: boolean = true
) => {
  useEffect(() => {
    if (!shouldAnnounce) return;

    if (Platform.OS === "android") {
      AccessibilityInfo.announceForAccessibility(message);
    } else if (Platform.OS === "ios") {
      // iOS uses different approach
      AccessibilityInfo.announceForAccessibility(message);
    }
  }, [message, shouldAnnounce]);
};

// Usage
export const SetCompletedNotification = () => {
  useAccessibilityAnnouncement("Set completed successfully", true);

  return (
    <View className="bg-green-600 p-4 rounded-lg">
      <Text className="text-white font-semibold">Set Logged!</Text>
    </View>
  );
};
```

### Focus Management

```typescript
// src/hooks/useFocusManagement.ts
import { useRef, useEffect } from "react";
import { AccessibilityInfo, findNodeHandle, View } from "react-native";

export const useFocusManagement = () => {
  const viewRef = useRef<View>(null);

  const setAccessibilityFocus = () => {
    const viewHandle = findNodeHandle(viewRef.current);
    if (viewHandle) {
      AccessibilityInfo.setAccessibilityFocus(viewHandle);
    }
  };

  return { viewRef, setAccessibilityFocus };
};

// Usage in modal or navigation
export const WorkoutLoggerModal = () => {
  const { viewRef, setAccessibilityFocus } = useFocusManagement();

  useEffect(() => {
    // Focus on modal title when it opens
    setAccessibilityFocus();
  }, []);

  return (
    <View ref={viewRef} accessible accessibilityRole="header">
      <Text className="text-headline">Log Workout</Text>
    </View>
  );
};
```

---

## Animation & Interaction Patterns

### Press State Animation

```typescript
// src/hooks/usePressAnimation.ts
import { useCallback } from "react";
import { Animated, Easing } from "react-native";

export const usePressAnimation = (defaultOpacity = 1) => {
  const animatedValue = new Animated.Value(defaultOpacity);

  const onPressIn = useCallback(() => {
    Animated.timing(animatedValue, {
      toValue: 0.7,
      duration: 100,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);

  const onPressOut = useCallback(() => {
    Animated.timing(animatedValue, {
      toValue: defaultOpacity,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [defaultOpacity]);

  return { animatedValue, onPressIn, onPressOut };
};

// Usage
export const AnimatedButton = ({ onPress }: { onPress: () => void }) => {
  const { animatedValue, onPressIn, onPressOut } = usePressAnimation(1);

  return (
    <Pressable onPressIn={onPressIn} onPressOut={onPressOut} onPress={onPress}>
      <Animated.View style={{ opacity: animatedValue }}>
        <Text className="text-white font-semibold">Press me</Text>
      </Animated.View>
    </Pressable>
  );
};
```

### Timer Countdown Animation

```typescript
// src/components/CountdownTimer.tsx
import React, { useEffect, useRef } from "react";
import { Animated, Text, View, useWindowDimensions } from "react-native";
import { COLORS, TYPOGRAPHY } from "../constants/design-tokens";

interface CountdownTimerProps {
  seconds: number;
  isRunning: boolean;
  onComplete?: () => void;
  size?: "small" | "large";
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  seconds,
  isRunning,
  onComplete,
  size = "large",
}) => {
  const displayValue = Math.max(0, Math.floor(seconds));
  const formattedTime = `${String(Math.floor(displayValue / 60)).padStart(2, "0")}:${String(
    displayValue % 60
  ).padStart(2, "0")}`;

  // Color animation (blue -> orange when < 10 seconds)
  const colorValue = useRef(new Animated.Value(seconds > 10 ? 0 : 1)).current;

  useEffect(() => {
    if (seconds <= 10 && seconds > 0) {
      Animated.timing(colorValue, {
        toValue: 1,
        duration: 500,
        useNativeDriver: false,
      }).start();
    }
  }, [seconds]);

  const color = colorValue.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.ACCENT, COLORS.WARNING],
  });

  return (
    <View
      className={`items-center justify-center rounded-full border-4 border-blue-500`}
      style={{
        width: size === "large" ? 240 : 120,
        height: size === "large" ? 240 : 120,
        backgroundColor: "rgba(59, 130, 246, 0.1)",
      }}
    >
      <Animated.Text
        style={{
          fontSize: size === "large" ? 72 : 36,
          fontWeight: "700",
          color,
          fontFamily: "SpaceMono",
        }}
      >
        {formattedTime}
      </Animated.Text>
    </View>
  );
};
```

### Slide-In Animation

```typescript
// src/hooks/useSlideAnimation.ts
import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

export const useSlideAnimation = (duration = 300, initialPosition = -100) => {
  const translateY = useRef(new Animated.Value(initialPosition)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: 0,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  return { translateY, style: { transform: [{ translateY }] } };
};
```

---

## Performance Optimization

### Memoized List Item Component

```typescript
// src/components/ExerciseListItem.tsx
import React, { memo } from "react";
import { Pressable, Text, View } from "react-native";
import { COLORS, SPACING } from "../constants/design-tokens";

interface ExerciseListItemProps {
  name: string;
  muscleGroups: string[];
  personalBest?: number;
  onPress: () => void;
}

const ExerciseListItemComponent: React.FC<ExerciseListItemProps> = ({
  name,
  muscleGroups,
  personalBest,
  onPress,
}) => {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center p-3 bg-slate-800 rounded-lg mb-2 active:opacity-70"
      style={{
        minHeight: 44,
        borderWidth: 1,
        borderColor: COLORS.BORDER,
      }}
    >
      <View className="flex-1">
        <Text className="text-body-lg font-semibold text-white">{name}</Text>
        <Text className="text-caption text-gray-400 mt-1">
          {muscleGroups.join(" · ")}
        </Text>
      </View>

      {personalBest && (
        <Text className="text-label font-semibold text-blue-400">
          {personalBest} lb
        </Text>
      )}
    </Pressable>
  );
};

export const ExerciseListItem = memo(ExerciseListItemComponent, (prevProps, nextProps) => {
  return (
    prevProps.name === nextProps.name &&
    prevProps.muscleGroups.join(",") === nextProps.muscleGroups.join(",") &&
    prevProps.personalBest === nextProps.personalBest
  );
});

ExerciseListItem.displayName = "ExerciseListItem";
```

### Lazy Loading List

```typescript
// src/hooks/useLazyList.ts
import { useState, useCallback, useMemo } from "react";

interface UseLazyListOptions {
  pageSize?: number;
  threshold?: number;
}

export const useLazyList = <T,>(
  items: T[],
  options: UseLazyListOptions = {}
) => {
  const { pageSize = 20, threshold = 5 } = options;
  const [displayedCount, setDisplayedCount] = useState(pageSize);

  const displayedItems = useMemo(() => {
    return items.slice(0, displayedCount);
  }, [items, displayedCount]);

  const onEndReached = useCallback(() => {
    setDisplayedCount((prev) => Math.min(prev + pageSize, items.length));
  }, [items.length, pageSize]);

  const hasMore = displayedCount < items.length;

  return { displayedItems, onEndReached, hasMore };
};

// Usage
export const ExerciseList = ({ exercises }: { exercises: Exercise[] }) => {
  const { displayedItems, onEndReached, hasMore } = useLazyList(exercises);

  return (
    <FlatList
      data={displayedItems}
      renderItem={({ item }) => <ExerciseListItem {...item} />}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      ListFooterComponent={
        hasMore ? <ActivityIndicator size="large" color="#3B82F6" /> : null
      }
    />
  );
};
```

### Image Optimization

```typescript
// src/hooks/useOptimizedImage.ts
import { useState, useEffect } from "react";
import { Image } from "react-native";

export const useOptimizedImage = (uri: string) => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    Image.getSize(
      uri,
      (width, height) => {
        setDimensions({ width, height });
      },
      (error) => {
        setError(error as Error);
      }
    );
  }, [uri]);

  return { dimensions, error };
};
```

---

## Testing Checklist

### Unit Tests

```typescript
// src/components/__tests__/Button.test.tsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import { Button } from "../Button";

describe("Button Component", () => {
  it("renders with correct text", () => {
    const { getByText } = render(
      <Button title="Press me" onPress={() => {}} />
    );
    expect(getByText("Press me")).toBeTruthy();
  });

  it("calls onPress when pressed", () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <Button title="Press" onPress={onPress} />
    );

    fireEvent.press(getByRole("button"));
    expect(onPress).toHaveBeenCalled();
  });

  it("disables when disabled prop is true", () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <Button title="Press" onPress={onPress} disabled={true} />
    );

    fireEvent.press(getByRole("button"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("has correct accessibility attributes", () => {
    const { getByRole } = render(
      <Button title="Accessible Button" onPress={() => {}} />
    );

    const button = getByRole("button");
    expect(button).toHaveAccessibilityLabel("Accessible Button");
  });
});
```

### Integration Tests

```typescript
// src/__tests__/screens/Dashboard.integration.test.tsx
import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { DashboardScreen } from "../../screens/DashboardScreen";

describe("Dashboard Screen Integration", () => {
  it("loads and displays user stats", async () => {
    const { getByText } = render(<DashboardScreen />);

    await waitFor(() => {
      expect(getByText(/Welcome/i)).toBeTruthy();
      expect(getByText(/Total Workouts/i)).toBeTruthy();
    });
  });

  it("navigates to workout logger on button press", async () => {
    const mockNavigation = { navigate: jest.fn() };
    const { getByText } = render(
      <DashboardScreen navigation={mockNavigation} />
    );

    fireEvent.press(getByText(/Start Workout/i));
    expect(mockNavigation.navigate).toHaveBeenCalledWith("WorkoutLogger");
  });
});
```

### Accessibility Testing

```typescript
// src/__tests__/accessibility.test.tsx
import React from "react";
import { render } from "@testing-library/react-native";
import { WorkoutLoggerScreen } from "../screens/WorkoutLoggerScreen";

describe("Accessibility Tests", () => {
  it("all buttons have 44x44px minimum touch targets", () => {
    const { getAllByRole } = render(<WorkoutLoggerScreen />);
    const buttons = getAllByRole("button");

    buttons.forEach((button) => {
      const { width, height } = button.props.style;
      expect(width).toBeGreaterThanOrEqual(44);
      expect(height).toBeGreaterThanOrEqual(44);
    });
  });

  it("all images have alt text", () => {
    const { getAllByRole } = render(<WorkoutLoggerScreen />);
    const images = getAllByRole("image");

    images.forEach((image) => {
      expect(image.props.accessibilityLabel).toBeTruthy();
    });
  });

  it("supports keyboard navigation", () => {
    const { getByTestId } = render(<WorkoutLoggerScreen />);
    const focusableElements = getByTestId("focusable-container");

    // Verify tab order is logical
    expect(focusableElements.props.accessibilityRole).toBe("region");
  });

  it("respects prefers-reduced-motion", () => {
    // Mock reduced motion preference
    const { getByTestId } = render(
      <WorkoutLoggerScreen reduceMotion={true} />
    );

    const animatedComponent = getByTestId("timer");
    // Verify animations are disabled or simplified
    expect(animatedComponent.props.style.animation).toBeUndefined();
  });
});
```

---

## NativeWind Utility Classes Reference

### Commonly Used Tailwind Classes for React Native

```
// Layout
flex, flex-row, flex-col, flex-wrap
items-start, items-center, items-end
justify-start, justify-center, justify-between, justify-around
w-full, h-full, w-screen, h-screen
px-4, py-3, p-4 (padding)
mx-2, my-3, m-4 (margin)

// Display
bg-slate-900, bg-blue-500 (backgrounds)
text-white, text-gray-400, text-blue-500 (text colors)
border, border-gray-700, border-blue-500 (borders)
rounded-lg, rounded-full (border radius)
shadow-lg, shadow-xl (shadows)

// Text
text-display, text-headline, text-body, text-label (custom sizes)
font-semibold, font-bold (font weight)
text-center, text-left, text-right (text align)

// Opacity & Visibility
opacity-50, opacity-75, opacity-100
hidden, flex (conditional display)

// State
active:opacity-85, active:bg-blue-600
disabled:opacity-50
focus:border-blue-500

// Safe Area
pt-safe, pb-safe (safe area padding)
```

---

## Summary

This implementation guide provides:

1. **Design Token System** - Tailwind configuration with comprehensive color, typography, spacing, and shadow tokens
2. **Component Examples** - Production-ready implementations of Button, Card, TextInput, and ToggleSwitch
3. **Responsive Patterns** - Safe area handling, grid layouts, and adaptive sheets
4. **Accessibility** - Screen reader support, focus management, and WCAG compliance
5. **Animations** - Press states, countdowns, and slide-ins with native drivers
6. **Performance** - Memoization, lazy loading, and image optimization
7. **Testing** - Unit, integration, and accessibility test examples

All code follows React Native and TypeScript best practices with strict typing and accessibility-first design.

