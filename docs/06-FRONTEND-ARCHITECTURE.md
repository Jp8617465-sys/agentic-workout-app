# Frontend Architecture — Intelligent Training Companion

**Version:** 1.0
**Date:** March 3, 2026
**Status:** Approved
**Inputs:** PROJECT_BRIEF.md, 02-TECH-STACK-DECISIONS.md, 03-RESEARCH-FINDINGS.md, 04-SYSTEM-ARCHITECTURE.md

---

## Table of Contents

1. [Component Architecture](#1-component-architecture)
2. [Navigation Map](#2-navigation-map)
3. [Design System](#3-design-system)
4. [Gesture System](#4-gesture-system)
5. [Animation Specs](#5-animation-specs)
6. [Performance Optimization](#6-performance-optimization)
7. [Accessibility](#7-accessibility)

---

## 1. Component Architecture

Atomic design adapted for React Native. Components are organized by complexity: atoms → molecules → organisms → screens.

### 1.1 Atoms

Smallest UI primitives. No business logic, fully controlled via props.

```typescript
// ─── NumericInput ────────────────────────────────────────────
// Displays a numeric value; tapping activates the custom numpad
interface NumericInputProps {
  value: number | null;
  label: 'Weight' | 'Reps' | 'RPE';
  unit?: 'kg' | 'lbs';
  isActive: boolean;         // highlighted when numpad targets this field
  previousValue?: number;    // shown in gray below current value
  onPress: () => void;
}
// Styling: NativeWind
// Touch target: 48x48px minimum

// ─── RPEBadge ────────────────────────────────────────────────
// Color-coded RPE indicator
interface RPEBadgeProps {
  value: number;           // 1-10
  target?: number;         // shows deviation indicator if provided
  size: 'sm' | 'md' | 'lg';
}
// Colors: 5-6 green, 7 yellow, 8 orange, 9-10 red

// ─── TimerDisplay ────────────────────────────────────────────
// Circular arc progress with time remaining
interface TimerDisplayProps {
  endTimestamp: number;     // absolute timestamp (survives backgrounding)
  totalSeconds: number;     // for arc percentage calculation
  size: 'compact' | 'fullscreen';
  onComplete: () => void;
}
// Uses Reanimated 3 useSharedValue for 60fps arc animation

// ─── ProgressBar ─────────────────────────────────────────────
interface ProgressBarProps {
  progress: number;        // 0-1
  label?: string;
  variant: 'volume' | 'intensity' | 'adherence';
}

// ─── Badge ───────────────────────────────────────────────────
interface BadgeProps {
  text: string;
  variant: 'phase' | 'pr' | 'injury' | 'ai' | 'deload';
}

// ─── IconButton ──────────────────────────────────────────────
interface IconButtonProps {
  icon: string;            // icon name from @expo/vector-icons
  onPress: () => void;
  variant: 'primary' | 'secondary' | 'ghost' | 'danger';
  size: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  accessibilityLabel: string;
}
// Touch target: 44x44px minimum (48px for primary actions)
```

### 1.2 Molecules

Combine atoms into functional units with light interaction logic.

```typescript
// ─── SetRow ──────────────────────────────────────────────────
// Single set within an exercise card. THE critical UX component.
interface SetRowProps {
  setNumber: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  type: 'warmup' | 'working' | 'backoff' | 'amrap';
  isCompleted: boolean;
  previousWeight?: number;
  previousReps?: number;
  targetRpe?: number;
  onFieldPress: (field: 'weight' | 'reps' | 'rpe') => void;
  onToggleComplete: () => void;
  onSwipeLeft: () => void;   // delete
  onSwipeRight: () => void;  // duplicate
}
// Memo boundary: React.memo with shallow prop comparison
// Styling: StyleSheet (performance-critical, updated every set)
// Gestures: Swipeable from react-native-gesture-handler

// ─── RestTimerCompact ────────────────────────────────────────
// Inline timer shown between sets (not full screen)
interface RestTimerCompactProps {
  endTimestamp: number;
  totalSeconds: number;
  onExpand: () => void;      // opens full-screen timer
  onSkip: () => void;
}

// ─── ExerciseHeader ──────────────────────────────────────────
interface ExerciseHeaderProps {
  exerciseName: string;
  muscleGroups: string[];
  previousDate?: string;     // "Last: Feb 28"
  injuryWarning?: string;    // injury risk note
  onInfoPress: () => void;
  onSwapPress: () => void;   // exercise substitution
}

// ─── RPESelector ─────────────────────────────────────────────
// Horizontal slider or segmented control for RPE input
interface RPESelectorProps {
  value: number | null;
  onChange: (rpe: number) => void;
  targetRpe?: number;
}
// Range: 5.0 to 10.0 in 0.5 increments
// Haptic feedback on each step change

// ─── AdaptationOption ────────────────────────────────────────
// Single option in the adaptation alert
interface AdaptationOptionProps {
  type: 'REDUCE_LOAD' | 'REDUCE_VOLUME' | 'CONTINUE';
  description: string;
  rationale: string;
  confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  onSelect: () => void;
}
```

### 1.3 Organisms

Complete UI sections composed of molecules. Own domain-specific state.

```typescript
// ─── ExerciseCard ────────────────────────────────────────────
// Full exercise block in the active workout screen
interface ExerciseCardProps {
  exercisePerformanceId: string;
  exerciseName: string;
  prescribedSets: number;
  prescribedReps: number;
  prescribedWeight: number;
  prescribedRpe: number;
  prescribedRestSeconds: number;
  sets: SetData[];
  previousSets?: SetData[];
  injuryRisk?: InjuryRiskInfo;
  onLogSet: (setData: SetInput) => void;
  onDeleteSet: (setId: string) => void;
  activeFieldRef: React.RefObject<ActiveFieldInfo>;
}
// Rendered in FlashList — must have stable key and memoized children
// Contains: ExerciseHeader + SetRow[] + "Add Set" button

// ─── RestTimerFullScreen ─────────────────────────────────────
// Modal overlay with large circular timer + next set preview
interface RestTimerFullScreenProps {
  endTimestamp: number;
  totalSeconds: number;
  nextExercise?: string;
  nextSetNumber?: number;
  onSkip: () => void;
  onAddTime: (seconds: number) => void;
  onDismiss: () => void;
}
// Animation: Reanimated 3 circular arc (useSharedValue + withTiming)
// Haptic: notificationAsync(Success) on timer complete

// ─── RPEModal ────────────────────────────────────────────────
// Post-set RPE input with deviation warning
interface RPEModalProps {
  visible: boolean;
  targetRpe: number;
  exerciseName: string;
  setNumber: number;
  onSubmit: (rpe: number) => void;
  onDismiss: () => void;
}
// Presented as transparentModal (workout stays mounted beneath)
// Animation: spring slide-up (Reanimated layout)

// ─── AdaptationAlert ─────────────────────────────────────────
// Mid-workout RPE deviation alert with options
interface AdaptationAlertProps {
  trigger: 'RPE_TOO_HIGH' | 'RPE_TOO_LOW' | 'PAIN_REPORTED';
  severity: 'MODERATE' | 'HIGH';
  options: AdaptationOption[];
  historicalContext?: string;
  explanation: string;
  onSelect: (type: string) => void;
  onDismiss: () => void;
}

// ─── PostWorkoutSummary ──────────────────────────────────────
// End-of-workout screen with AI insights
interface PostWorkoutSummaryProps {
  workout: CompletedWorkout;
  analysis?: WorkoutAnalysis;
  personalRecords: PersonalRecord[];
  isAnalyzing: boolean;
  onViewDetails: () => void;
  onFinish: () => void;
}

// ─── CustomNumpad ────────────────────────────────────────────
// Persistent bottom sheet numpad (never unmounts during workout)
interface CustomNumpadProps {
  activeField: { type: 'weight' | 'reps' | 'rpe'; value: string } | null;
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onDecimal: () => void;
  onConfirm: () => void;
}
// Bottom sheet at 25% snap point
// Haptic: selectionAsync on each key press
// Does NOT use system keyboard — avoids Android numeric lag
```

### 1.4 Screens

```
HomeScreen            — Today's prescription, quick-start, streak/readiness
ActiveWorkoutScreen   — Full workout logging (ExerciseCard list + numpad)
PostWorkoutScreen     — Summary, AI analysis, PR celebrations
HistoryScreen         — Calendar view + workout list
ExerciseLibraryScreen — Searchable exercise database with FTS5
ProfileScreen         — User stats, settings, injury management
OnboardingScreen      — Multi-step: goals, equipment, injuries, experience
MesocycleScreen       — Current plan overview, phase progress, review
```

---

## 2. Navigation Map

React Navigation v7 with native stack for performance.

```
RootStack (NativeStack)
│
├── OnboardingFlow (NativeStack, conditional on !isOnboardingComplete)
│   ├── WelcomeScreen
│   ├── GoalsScreen
│   ├── ExperienceScreen
│   ├── EquipmentScreen
│   ├── InjuryScreen
│   └── ReadyScreen
│
├── MainTabs (BottomTab)
│   ├── HomeTab
│   │   └── HomeScreen
│   │       └── → MesocycleScreen (push)
│   │
│   ├── HistoryTab
│   │   └── HistoryScreen
│   │       └── → WorkoutDetailScreen (push)
│   │
│   ├── ExercisesTab
│   │   └── ExerciseLibraryScreen
│   │       └── → ExerciseDetailScreen (push)
│   │
│   └── ProfileTab
│       └── ProfileScreen
│           ├── → SettingsScreen (push)
│           ├── → InjuryManagementScreen (push)
│           └── → ProgressChartsScreen (push)
│
├── ActiveWorkoutScreen (fullScreenModal, gestureEnabled: false)
│   │
│   ├── RPEModal (transparentModal — workout stays mounted)
│   ├── AdaptationAlert (transparentModal)
│   ├── ExercisePickerModal (modal)
│   └── RestTimerFullScreen (transparentModal)
│
└── PostWorkoutScreen (modal)
```

### Navigation Configuration

```typescript
// src/navigation/RootNavigator.tsx
const RootStack = createNativeStackNavigator();

function RootNavigator() {
  const isOnboardingComplete = useUserStore(s => s.isOnboardingComplete);

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!isOnboardingComplete ? (
        <RootStack.Screen name="Onboarding" component={OnboardingFlow} />
      ) : (
        <RootStack.Screen name="Main" component={MainTabs} />
      )}
      <RootStack.Screen
        name="ActiveWorkout"
        component={ActiveWorkoutScreen}
        options={{
          presentation: 'fullScreenModal',
          gestureEnabled: false, // prevent accidental swipe-dismiss mid-workout
        }}
      />
      <RootStack.Screen
        name="PostWorkout"
        component={PostWorkoutScreen}
        options={{ presentation: 'modal' }}
      />
    </RootStack.Navigator>
  );
}
```

### Key Navigation Decisions

| Decision | Rationale |
|----------|-----------|
| `fullScreenModal` for ActiveWorkout | Prevents tab bar interaction mid-workout |
| `transparentModal` for RPE/Adaptation | Workout state preserved beneath overlay |
| `gestureEnabled: false` on workout | No accidental swipe-to-dismiss |
| Bottom tabs hidden during workout | Single-focus UX on gym floor |
| Native stack (not JS stack) | 60fps transitions, native gesture handling |

---

## 3. Design System

### 3.1 Color Palette

```typescript
// src/constants/colors.ts
export const colors = {
  // Brand
  primary: '#EA580C',      // Orange — CTAs, active states
  secondary: '#0D9488',    // Teal — secondary actions, progress
  accent: '#3B82F6',       // Blue — AI features, links

  // Semantic
  success: '#10B981',      // Completed sets, PRs
  warning: '#F59E0B',      // RPE warnings, moderate risk
  danger: '#EF4444',       // High risk, errors, deletes
  info: '#3B82F6',         // Tips, explanations

  // RPE scale
  rpe: {
    easy: '#10B981',       // RPE 5-6
    moderate: '#F59E0B',   // RPE 7
    hard: '#EA580C',       // RPE 8
    maximal: '#EF4444',    // RPE 9-10
  },

  // Slate scale (dark mode primary)
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
    950: '#020617',
  },

  // Dark mode surfaces
  dark: {
    background: '#0F172A',    // slate.900
    surface: '#1E293B',       // slate.800
    surfaceElevated: '#334155', // slate.700
    border: '#475569',         // slate.600
    textPrimary: '#F8FAFC',    // slate.50
    textSecondary: '#94A3B8',  // slate.400
    textMuted: '#64748B',      // slate.500
  },
} as const;
```

### 3.2 Typography

```typescript
// src/constants/typography.ts
export const typography = {
  heading: {
    h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
    h2: { fontSize: 22, fontWeight: '600' as const, lineHeight: 28 },
    h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  },
  body: {
    lg: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
    md: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
    sm: { fontSize: 12, fontWeight: '400' as const, lineHeight: 16 },
  },
  label: {
    lg: { fontSize: 14, fontWeight: '600' as const, lineHeight: 20 },
    md: { fontSize: 12, fontWeight: '600' as const, lineHeight: 16 },
    sm: { fontSize: 10, fontWeight: '600' as const, lineHeight: 14 },
  },
  numeric: {
    // Monospace for weight/reps — prevents layout shift on value change
    lg: { fontSize: 24, fontWeight: '700' as const, fontFamily: 'SpaceMono' },
    md: { fontSize: 18, fontWeight: '600' as const, fontFamily: 'SpaceMono' },
    sm: { fontSize: 14, fontWeight: '500' as const, fontFamily: 'SpaceMono' },
  },
} as const;
```

### 3.3 Spacing & Layout

```typescript
// src/constants/spacing.ts
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

// Touch targets
export const touchTarget = {
  minimum: 44,      // iOS HIG minimum
  preferred: 48,    // primary actions
  numpadKey: 56,    // large keys for gym use
} as const;

// Border radius
export const borderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;
```

### 3.4 Component Variants

```typescript
// Button variants
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

// Card variants
type CardVariant = 'default' | 'elevated' | 'outlined';

// Badge variants (maps to color)
const badgeColors: Record<string, { bg: string; text: string }> = {
  phase: { bg: colors.accent + '20', text: colors.accent },
  pr: { bg: colors.success + '20', text: colors.success },
  injury: { bg: colors.danger + '20', text: colors.danger },
  ai: { bg: colors.secondary + '20', text: colors.secondary },
  deload: { bg: colors.warning + '20', text: colors.warning },
};
```

### 3.5 Dark Mode

Dark mode is the **default** — gyms typically have low-to-moderate lighting.

```typescript
// NativeWind configuration
// tailwind.config.js
module.exports = {
  darkMode: 'class', // manually controlled, default to dark
  theme: {
    extend: {
      colors: {
        primary: '#EA580C',
        secondary: '#0D9488',
        accent: '#3B82F6',
      },
    },
  },
};
```

---

## 4. Gesture System

### 4.1 SetRow Gestures

```typescript
// Swipe left → delete set (with confirmation haptic)
// Swipe right → duplicate set (copies weight/reps from this set)
import { Swipeable } from 'react-native-gesture-handler';

function SwipeableSetRow({ children, onDelete, onDuplicate }: SwipeableSetRowProps) {
  const renderLeftActions = () => (
    <Animated.View style={styles.duplicateAction}>
      <Text style={styles.actionText}>Duplicate</Text>
    </Animated.View>
  );

  const renderRightActions = () => (
    <Animated.View style={styles.deleteAction}>
      <Text style={styles.actionText}>Delete</Text>
    </Animated.View>
  );

  return (
    <Swipeable
      renderLeftActions={renderLeftActions}
      renderRightActions={renderRightActions}
      onSwipeableOpen={(direction) => {
        if (direction === 'left') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onDelete();
        } else {
          Haptics.selectionAsync();
          onDuplicate();
        }
      }}
      overshootRight={false}
      overshootLeft={false}
    >
      {children}
    </Swipeable>
  );
}
```

### 4.2 Custom Numpad

```typescript
// Persistent bottom sheet — stays mounted during entire workout
// Only the activeField changes, no mount/unmount animation
function WorkoutNumpad({ activeField, onValueChange, onConfirm }: NumpadProps) {
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '⌫'];

  const handlePress = (digit: string) => {
    Haptics.selectionAsync(); // tactile feedback on every key
    if (digit === '⌫') {
      onValueChange(activeField, 'backspace');
    } else {
      onValueChange(activeField, digit);
    }
  };

  if (!activeField) return null;

  return (
    <BottomSheet
      snapPoints={['28%']}
      enablePanDownToClose={false}
      backgroundStyle={{ backgroundColor: colors.dark.surface }}
    >
      <View style={styles.fieldLabel}>
        <Text style={styles.labelText}>
          {activeField.type.toUpperCase()}: {activeField.value || '—'}
        </Text>
      </View>
      <View style={styles.numpadGrid}>
        {digits.map(digit => (
          <Pressable
            key={digit}
            onPress={() => handlePress(digit)}
            style={({ pressed }) => [
              styles.numpadKey,
              pressed && styles.numpadKeyPressed,
            ]}
            hitSlop={8}
          >
            <Text style={styles.numpadDigit}>{digit}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={onConfirm} style={styles.confirmButton}>
        <Text style={styles.confirmText}>Done</Text>
      </Pressable>
    </BottomSheet>
  );
}
```

### 4.3 Long Press Interactions

```typescript
// Long press on weight/reps → increment stepper mode
// Continuous press increases/decreases value by step
function useLongPressIncrement(
  initialValue: number,
  step: number,
  onUpdate: (value: number) => void,
) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startIncrement = (direction: 1 | -1) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onUpdate(initialValue + step * direction);
    intervalRef.current = setInterval(() => {
      initialValue += step * direction;
      onUpdate(initialValue);
      Haptics.selectionAsync();
    }, 150); // 150ms repeat rate
  };

  const stopIncrement = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  return { startIncrement, stopIncrement };
}
```

### 4.4 Haptic Patterns

```
┌────────────────────────────┬──────────────────────────────────┐
│ Event                      │ Haptic                           │
├────────────────────────────┼──────────────────────────────────┤
│ Numpad key press           │ selectionAsync()                 │
│ Field focus change         │ selectionAsync()                 │
│ Set completed              │ notificationAsync(Success)       │
│ Personal record            │ notificationAsync(Success) × 2   │
│                            │ (400ms apart)                    │
│ Rest timer complete        │ notificationAsync(Warning)       │
│ RPE deviation alert        │ notificationAsync(Error)         │
│ Set deleted (swipe)        │ notificationAsync(Warning)       │
│ Set duplicated (swipe)     │ selectionAsync()                 │
│ Long press increment       │ impactAsync(Light) then          │
│                            │ selectionAsync() per step        │
│ Workout started            │ impactAsync(Medium)              │
│ Workout completed          │ notificationAsync(Success)       │
└────────────────────────────┴──────────────────────────────────┘
```

---

## 5. Animation Specs

All animations run on the UI thread via Reanimated 3 worklets. No JS thread animations for interactive elements.

### 5.1 Set Completion

```typescript
// Checkbox fill + row background color transition
function useSetCompleteAnimation() {
  const progress = useSharedValue(0);

  const animate = () => {
    progress.value = withTiming(1, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
  };

  const checkboxStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.dark.surface, colors.success],
    ),
    transform: [{ scale: interpolate(progress.value, [0, 0.5, 1], [1, 1.15, 1]) }],
  }));

  const rowStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['transparent', colors.success + '10'],
    ),
  }));

  return { animate, checkboxStyle, rowStyle };
}
```

### 5.2 Rest Timer Arc

```typescript
// Circular progress arc — 60fps on UI thread
function useRestTimerAnimation(endTimestamp: number, totalSeconds: number) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const remainingMs = endTimestamp - Date.now();
    const startProgress = 1 - (remainingMs / (totalSeconds * 1000));

    progress.value = startProgress;
    progress.value = withTiming(1, {
      duration: Math.max(0, remainingMs),
      easing: Easing.linear,
    });
  }, [endTimestamp, totalSeconds]);

  const arcStyle = useAnimatedStyle(() => {
    // SVG arc calculation via react-native-svg animated path
    return { strokeDashoffset: (1 - progress.value) * circumference };
  });

  const timeText = useDerivedValue(() => {
    const remaining = Math.max(0, (1 - progress.value) * totalSeconds);
    const mins = Math.floor(remaining / 60);
    const secs = Math.floor(remaining % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  });

  return { arcStyle, timeText, progress };
}
```

### 5.3 Modal Transitions

```typescript
// RPE Modal — spring slide-up
const RPEModalTransition = {
  entering: SlideInDown.springify()
    .damping(15)
    .stiffness(150)
    .mass(0.8),
  exiting: SlideOutDown.duration(200),
};

// Adaptation Alert — fade + scale
const AlertTransition = {
  entering: FadeIn.duration(200).withInitialValues({ transform: [{ scale: 0.95 }] }),
  exiting: FadeOut.duration(150),
};
```

### 5.4 Screen Transitions

| Transition | Type | Duration |
|-----------|------|----------|
| Tab switch | Fade crossfade | 150ms |
| Stack push | Slide from right (native) | System default |
| Modal present | Slide from bottom (native) | System default |
| Workout start | Full-screen modal slide up | System default |
| Post-workout | Modal with custom spring | 300ms spring |

### 5.5 Reduce Motion Support

```typescript
// Respect system accessibility setting
import { AccessibilityInfo } from 'react-native';

function useReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  return reduceMotion;
}

// Usage: skip animations when reduceMotion is true
const duration = reduceMotion ? 0 : 200;
```

---

## 6. Performance Optimization

### 6.1 List Rendering

```typescript
// Use FlashList for exercise cards (not FlatList)
// FlashList recycles views for smooth scrolling with many exercises
import { FlashList } from '@shopify/flash-list';

function ExerciseList({ exercises }: ExerciseListProps) {
  return (
    <FlashList
      data={exercises}
      renderItem={({ item }) => <MemoizedExerciseCard {...item} />}
      estimatedItemSize={300} // average ExerciseCard height in px
      keyExtractor={(item) => item.id}
    />
  );
}
```

### 6.2 Memo Boundaries

```
ActiveWorkoutScreen
  └── FlashList
       └── ExerciseCard (React.memo — re-renders only when exercise data changes)
            ├── ExerciseHeader (React.memo — static during workout)
            └── SetRow[] (React.memo — each only re-renders on its own data change)
                 └── NumericInput (React.memo)

CustomNumpad (separate component tree — never re-renders ExerciseCards)
RestTimerCompact (Legend State observable — timer ticks don't re-render parent)
```

### 6.3 Legend State for Active Workout

```typescript
// Legend State observables prevent cascade re-renders
// Timer tick updates ONLY the TimerDisplay — not ExerciseCards
import { observable } from '@legendapp/state';
import { observer } from '@legendapp/state/react';

const workoutSession$ = observable({
  id: '',
  startedAt: 0,
  exercises: [] as ObservableExercise[],
  restTimer: {
    endTimestamp: 0,
    totalSeconds: 0,
    isRunning: false,
  },
});

// Only TimerDisplay observes restTimer — no cascade
const TimerDisplay = observer(function TimerDisplay() {
  const endTimestamp = workoutSession$.restTimer.endTimestamp.get();
  const totalSeconds = workoutSession$.restTimer.totalSeconds.get();
  // ... render timer
});

// SetRow observes only its own set data
const SetRow = observer(function SetRow({ exerciseIndex, setIndex }: SetRowIndexProps) {
  const set = workoutSession$.exercises[exerciseIndex].sets[setIndex].get();
  // ... render set — only re-renders when THIS set changes
});
```

### 6.4 Image Optimization

- Exercise thumbnails: WebP format, 200x200px max
- Lazy loading: Only load images for visible exercises
- Cache: expo-image with memory + disk cache

### 6.5 Bundle Size Targets

| Metric | Target |
|--------|--------|
| Initial JS bundle | < 2MB |
| Total app size (APK) | < 30MB |
| Time to interactive | < 2s on mid-range Android |
| First meaningful paint | < 1s |

---

## 7. Accessibility

### 7.1 VoiceOver / TalkBack Labels

```typescript
// Every interactive element gets an accessibility label
<Pressable
  accessibilityLabel={`Set ${setNumber}: ${weight} kilograms, ${reps} reps, RPE ${rpe}`}
  accessibilityRole="button"
  accessibilityHint="Double tap to edit this set"
  accessibilityState={{ checked: isCompleted }}
>

// Numpad keys
<Pressable
  accessibilityLabel={digit === '⌫' ? 'Backspace' : `Digit ${digit}`}
  accessibilityRole="button"
>

// Timer
<View
  accessibilityLabel={`Rest timer: ${minutes} minutes ${seconds} seconds remaining`}
  accessibilityRole="timer"
  accessibilityLiveRegion="polite" // announces changes
>
```

### 7.2 Dynamic Type

```typescript
// Support iOS Dynamic Type and Android font scaling
// Cap maximum scale to prevent layout breakage
import { PixelRatio } from 'react-native';

const fontScale = Math.min(PixelRatio.getFontScale(), 1.35);
// Apply to typography values that should scale
```

### 7.3 Contrast Ratios

| Element | Foreground | Background | Ratio | Passes |
|---------|-----------|------------|-------|--------|
| Body text | slate.50 (#F8FAFC) | slate.900 (#0F172A) | 17.5:1 | AAA |
| Secondary text | slate.400 (#94A3B8) | slate.900 (#0F172A) | 5.1:1 | AA |
| Primary button | white (#FFFFFF) | primary (#EA580C) | 4.6:1 | AA |
| RPE badge (easy) | white | success (#10B981) | 4.5:1 | AA |
| RPE badge (hard) | white | danger (#EF4444) | 4.6:1 | AA |

### 7.4 Focus Order

Active Workout screen focus order for keyboard/switch access:

1. Exercise header (name, swap, info)
2. Set rows (top to bottom)
3. Add set button
4. Next exercise
5. Numpad (when active)
6. Finish workout button

### 7.5 Screen Reader Announcements

```typescript
// Announce important state changes
import { AccessibilityInfo } from 'react-native';

// On set completion
AccessibilityInfo.announceForAccessibility(
  `Set ${setNumber} completed. ${weight} kg for ${reps} reps at RPE ${rpe}.`
);

// On personal record
AccessibilityInfo.announceForAccessibility(
  `Personal record! New best for ${exerciseName}: ${weight} kg.`
);

// On rest timer complete
AccessibilityInfo.announceForAccessibility(
  'Rest complete. Ready for next set.'
);
```
