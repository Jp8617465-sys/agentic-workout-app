# Component Inventory & Visual Reference

Complete visual catalog of all UI components for the Agentic Workout App with specifications, variants, and usage guidelines.

---

## Table of Contents

1. [Base Components](#base-components)
2. [Form Components](#form-components)
3. [Navigation Components](#navigation-components)
4. [Card Components](#card-components)
5. [Modal & Overlay Components](#modal--overlay-components)
6. [Progress & Data Components](#progress--data-components)
7. [State & Feedback Components](#state--feedback-components)
8. [Composite Components](#composite-components)

---

## Base Components

### Button

**Variants:** Primary, Secondary, Danger

**States:** Default, Pressed, Disabled, Loading

```
PRIMARY BUTTON
┌────────────────────────┐
│  ▶︎ START WORKOUT      │  Default
└────────────────────────┘
Height: 48px | Padding: 16px horizontal | Corner: 8px

Pressed: Opacity 0.85
Disabled: Opacity 0.5, text-gray-600

SECONDARY BUTTON
┌────────────────────────┐
│ SKIP SET               │  Outline variant
└────────────────────────┘

DANGER BUTTON
┌────────────────────────┐
│ DELETE WORKOUT         │  Red variant
└────────────────────────┘
```

**TypeScript:**
```typescript
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}
```

**Tailwind Classes:**
```
Primary: bg-blue-500 text-white
Secondary: bg-slate-700 text-gray-300
Danger: bg-red-500 text-white
Disabled: opacity-50
Loading: flex items-center justify-center
```

**Sizing:**
```
Small: 40px height, 12pt font
Medium: 48px height, 14pt font
Large: 56px height, 16pt font
```

**Accessibility:**
- ✓ Minimum 44x44px touch target
- ✓ accessibilityLabel prop
- ✓ accessibilityState={{ disabled }}
- ✓ Focus indicator with 2px outline

---

### Text

**Styles:** Display, Headline, Subheading, Body, Caption, Label, Small

```
DISPLAY (32pt, 700wt)
┌────────────────────────────────┐
│ Hello, Alex                    │
└────────────────────────────────┘

HEADLINE (24pt, 600wt)
┌────────────────────────────────┐
│ Recent Activity                │
└────────────────────────────────┘

SUBHEADING (18pt, 600wt)
┌────────────────────────────────┐
│ Bench Press                    │
└────────────────────────────────┘

BODY LARGE (16pt, 400wt)
This is primary content text that provides
important information to the user.

BODY (14pt, 400wt)
Secondary text for supporting information.

CAPTION (12pt, 400wt)
Meta information and timestamps.

LABEL (12pt, 600wt)
BUTTON TEXT AND LABELS

SMALL (10px, 400wt)
Additional info badge text
```

**Color Variants:**
```
Primary: text-white (#F8FAFC)
Secondary: text-gray-400 (#94A3B8)
Muted: text-gray-500 (#64748B)
Accent: text-blue-400 (#60A5FA)
Error: text-red-500 (#EF4444)
Success: text-green-500 (#10B981)
```

**TypeScript:**
```typescript
interface TextProps extends React.ComponentProps<typeof Text> {
  variant?: "display" | "headline" | "subheading" | "body-lg" | "body" | "caption" | "label" | "small";
  color?: "primary" | "secondary" | "muted" | "accent" | "error" | "success";
  numberOfLines?: number;
}
```

---

### Icon Button

**Variants:** Default, Outlined, Filled

```
DEFAULT ICON BUTTON      OUTLINED             FILLED
┌──────────┐             ┌──────────┐         ┌──────────┐
│    📌    │             │  ┌──────┐ │         │ ▓▓▓▓▓▓▓▓ │
│          │             │  │  📌  │ │         │ ▓  📌  ▓ │
└──────────┘             └──────────┘         └──────────┘
Size: 44x44px (min)      Border: 1px          Bg: blue-500
Transparent bg           Slate-700 border      Blue fill
```

**States:**
```
Default: icon-gray-400
Pressed: opacity-70
Disabled: opacity-30
Active: icon-blue-500

Icon sizes:
Small: 24x24px
Large: 32x32px
```

**Usage:**
```typescript
<IconButton
  icon={<EditIcon />}
  onPress={() => handleEdit()}
  size="large"
  variant="default"
/>
```

---

## Form Components

### Text Input

**Variants:** Default, Error, Focused

```
DEFAULT STATE
┌────────────────────────────────────┐
│ 🔍 Search exercises...             │
└────────────────────────────────────┘
Height: 44px | Padding: 12px | Corner: 8px | Border: 1px slate-700

FOCUSED STATE
┌━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┐
│ 🔍 Search exercises...           │
└━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┘
Border: 2px blue-500 | Bg: rgba(59,130,246,0.05)

ERROR STATE
┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┐
│ ✕ Please enter a valid email    │
└╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘
Border: 2px red-500
```

**Props:**
```typescript
interface TextInputProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  onClear?: () => void;
  keyboardType?: "default" | "numeric" | "decimal-pad" | "email-address";
  disabled?: boolean;
  autoFocus?: boolean;
}
```

**Accessibility:**
- ✓ Label associated with input
- ✓ Error announcement on focus
- ✓ Hint text for guidance
- ✓ Clear button with aria-label

---

### Toggle Switch

**States:** On, Off, Disabled

```
OFF STATE                    ON STATE
┌────────────┐              ┌────────────┐
│ ○          │              │          ○ │
└────────────┘              └────────────┘
Width: 48px | Height: 28px
Bg: slate-700               Bg: blue-500
Thumb: white (24x24px)      Thumb: white

DISABLED
┌────────────┐
│ ◑          │
└────────────┘
Opacity: 0.5
```

**Props:**
```typescript
interface ToggleSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  color?: string; // Default: blue-500
}
```

**Animation:**
- Duration: 300ms
- Easing: ease-out
- Thumb moves 24px

---

### Picker / Dropdown

**States:** Default, Expanded, Disabled

```
COLLAPSED
┌────────────────────────────┐
│ Weight Unit:        [lb] ▼ │
└────────────────────────────┘

EXPANDED
┌────────────────────────────┐
│ Weight Unit:        [lb] ▲ │
├────────────────────────────┤
│ ◉ lb (pounds)              │
│ ○ kg (kilograms)           │
└────────────────────────────┘
Height: 44px each option
```

**Props:**
```typescript
interface PickerProps<T> {
  label: string;
  items: Array<{ label: string; value: T }>;
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}
```

---

### Checkbox

**States:** Unchecked, Checked, Indeterminate, Disabled

```
UNCHECKED          CHECKED            INDETERMINATE
┌──────────┐       ┌──────────┐       ┌──────────┐
│          │       │    ✓     │       │    ━     │
└──────────┘       └──────────┘       └──────────┘
Border: gray-600   Bg: blue-500       Bg: blue-500
24x24px each

DISABLED (any state)
┌──────────┐
│  ✓       │
└──────────┘
Opacity: 0.5
```

**Props:**
```typescript
interface CheckboxProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  label?: string;
  disabled?: boolean;
  indeterminate?: boolean;
}
```

---

## Navigation Components

### Bottom Tab Bar

**Layout:** 5 tabs, fixed at bottom

```
┌────────────────────────────────┐
│ 🏠   📋   📊   ⏱   👤         │
│ HOME                           │
│ Home | Workouts | Progress     │
└────────────────────────────────┘
Height: 56px + safe area
Width: screen / 5 each
Safe area bottom: 34px (iOS), 0px (Android)
```

**Tabs (Left to Right):**
1. Home (🏠) - Dashboard
2. Workouts (📋) - History & templates
3. Progress (📊) - Charts & stats
4. Timer (⏱) - Rest timer
5. Profile (👤) - Settings & account

**States:**
```
Inactive Tab:
  Icon: 24x24px, text-gray-500
  Text: 10pt, 600wt, text-gray-500

Active Tab:
  Icon: 24x24px, text-blue-500
  Text: 10pt, 600wt, text-blue-500
```

**TypeScript:**
```typescript
interface BottomTabBarProps {
  activeTab: "home" | "workouts" | "progress" | "timer" | "profile";
  onTabChange: (tab) => void;
}
```

---

### Top Header

**Layout:** Back button, Title, Actions

```
┌────────────────────────────────┐
│ ◀︎  Chest & Back · 3 of 5      │
└────────────────────────────────┘
Height: 48px
Left padding: 8px (back button)
Center padding: 16px (title)
Right padding: 8px (actions)
Safe area top: 8px
```

**Components:**
- Back button: 44x44px touch target
- Title: 14pt, 600wt, white (center)
- Subtitle: 12pt, 400wt, text-gray-400 (optional)
- Actions: 44x44px each (optional)

---

## Card Components

### Basic Card

**Variants:** Default, Elevated, Highlighted

```
DEFAULT CARD
┌──────────────────────────┐
│ Bench Press              │
│ Last: 8x185 · 3 sets    │
└──────────────────────────┘
Bg: slate-800 | Border: 1px slate-700 | Corner: 12px
Padding: 16px

ELEVATED CARD
┌──────────────────────────┐ ╱╱
│ Bench Press              │╱╱
│ Last: 8x185 · 3 sets    │
└──────────────────────────┘
Elevation: 4 (shadow)

HIGHLIGHTED CARD (Active)
┏━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Bench Press              ┃
┃ Last: 8x185 · 3 sets    ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━┛
Border: 2px blue-500
```

**Props:**
```typescript
interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: "default" | "elevated" | "highlighted";
  disabled?: boolean;
}
```

---

### Exercise Card

**Layout:** Icon + Title + Subtitle + Badge

```
┌─────────────────────────────────┐
│ 💪 Bench Press                  │
│ Chest · Triceps                 │
│ ⭐⭐⭐⭐⭐ · Bar                │
│ Best: 275 lb                    │
└─────────────────────────────────┘
Height: 80px | Padding: 12px | Corner: 12px
Pressable, 44x80px minimum touch target

ICON (24x24px)  TITLE (16pt, 600wt)
                MUSCLE GROUPS (12pt, 400wt)
                DIFFICULTY + EQUIPMENT (12pt)
                PERSONAL BEST (12pt, 600wt, blue)
```

**Interactive State:**
```
Pressed: bg-blue-500 opacity-10, border-blue-500
Disabled: opacity-50
```

---

### Stat Card

**Layout:** Large number + Label

```
┌──────────────────┐
│                  │
│     47           │
│                  │
│   Total Reps     │
└──────────────────┘
Width: (screen - 40) / 2 ≈ 167px
Height: 100px
Number: 24pt, 700wt, blue
Label: 12pt, 600wt, gray-300
```

**Variants:**
```
With trend indicator:
┌──────────────────┐
│     47           │
│    ↑ 5 lb        │
│   Total Reps     │
└──────────────────┘
Trend color: green (up), red (down), gray (stable)
```

---

### Goal Progress Card

**Layout:** Title + Progress bar + Percentage

```
┌────────────────────────────────┐
│ Bench Press: 300 lb            │ Title: 14pt, 600wt
│ Current: 275 lb · ↑ 25 lb      │ Subtitle: 12pt, 400wt
│ ████████░░ 92%                 │ Progress: 0-100%
└────────────────────────────────┘
Height: 80px | Padding: 12px | Corner: 8px
Progress bar: 4px height, 2px corner, full width
```

**Progress Bar:**
```
Background: slate-700
Fill: blue-500
Animated: 300ms ease-out
```

---

## Modal & Overlay Components

### Bottom Sheet

**States:** Closed, Opened, Expanded

```
CLOSED
┌────────────────────────────┐
│ Main content below         │
└────────────────────────────┘

OPENED (Mobile)
┌────────────────────────────┐
│ Dimmed background          │
│    ┌────────────────────┐  │
│    │ ⠿⠿⠿ (drag handle)   │  │ ← 40x4px at top
│    │ Title              │  │
│    │ ────────────────   │  │ ← divider
│    │ Content scrollable │  │ ← Max 75% height
│    │                    │  │
│    └────────────────────┘  │
└────────────────────────────┘
```

**Props:**
```typescript
interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  maxHeight?: number;
  snapPoints?: number[];
}
```

**Animation:**
- Duration: 300ms
- Easing: ease-out
- Slide from bottom

---

### Alert Dialog

**Layout:** Title + Message + Buttons

```
┌────────────────────────────────┐
│ Discard Workout?               │ Title: 18pt, 600wt
│                                │
│ Are you sure you want to       │ Message: 14pt, 400wt
│ discard this workout? This     │
│ action cannot be undone.       │
│                                │
│ ┌──────────────┬─────────────┐│ Buttons: 44px height
│ │ CANCEL       │ DISCARD     ││
│ └──────────────┴─────────────┘│
└────────────────────────────────┘
```

**Button Styling:**
```
Cancel: bg-slate-700 text-white
Discard: bg-red-500 text-white (danger action)
```

---

### Loading Overlay

**States:** Loading, Completed, Error

```
LOADING
┌────────────────────────────┐
│  Saving workout...         │
│                            │
│    ⟳ (spinning)            │
└────────────────────────────┘

COMPLETED
┌────────────────────────────┐
│  Workout saved!            │
│                            │
│    ✓ (green)               │
└────────────────────────────┘

ERROR
┌────────────────────────────┐
│  Failed to save            │
│                            │
│    ✕ (red)                 │
│  [RETRY]                   │
└────────────────────────────┘
```

---

## Progress & Data Components

### Linear Progress Bar

**States:** Default, Complete, Error, Indeterminate

```
DEFAULT (50% progress)
┌─────────────────────────────┐
│ ████████░░░░░░░░░░░        │
└─────────────────────────────┘
Height: 4px | Corner: 2px | Bg: slate-700 | Fill: blue-500

COMPLETE (100%)
┌─────────────────────────────┐
│ █████████████████████████████│ ← Green fill
└─────────────────────────────┘

ERROR
┌─────────────────────────────┐
│ ███████░░░░░░░░░░░░░░░░░░░│ ← Red fill
└─────────────────────────────┘
```

**Props:**
```typescript
interface ProgressBarProps {
  progress: number; // 0-100
  variant?: "default" | "success" | "error";
  size?: "small" | "medium" | "large";
  animated?: boolean;
}
```

---

### Circular Progress (Pie Chart Segment)

**Usage:** Timer countdown, goal progress

```
30% PROGRESS
      ╱╲
   ╱    ╲  ← Blue segment (30%)
  │      │ ← Gray segment (70%)
   ╲    ╱
      ╲╱

FULL CIRCLE (100%)
    ◯
   ◯ ◯
   ◯ ◯
    ◯
```

---

### Chart Components

#### Line Chart (Volume Trend)

```
VOLUME TREND (200px height)
          📈
       ╱
      ╱   ╱
   ╱    ╱
  ╱  ╱
 ━━━━━━━━━━━━━━━━━
 Week 1  Week 2  Week 3
 12,450  13,200  12,890
```

**Features:**
- Line color: blue-500
- Area fill: rgba(59,130,246,0.1)
- Grid lines: rgba(255,255,255,0.05)
- Interactive points: tap for details

---

#### Bar Chart (Workout Frequency)

```
FREQUENCY (160px height)
M   W   F
██  ██  ██
██  ██  ██
██  ██  ██
██  ██  ██
──  ──  ──
12  11  13
```

**Features:**
- Bar color: blue-500
- Bar spacing: 16px
- Labels: bottom and above bars
- Summary: "Total: 48 sessions"

---

## State & Feedback Components

### Badge

**Variants:** Default, Success, Warning, Error, Info

```
DEFAULT BADGE      SUCCESS           WARNING          ERROR
┌─────────────┐    ┌─────────────┐   ┌─────────────┐  ┌─────────────┐
│ New         │    │ Completed   │   │ In Progress │  │ Failed      │
└─────────────┘    └─────────────┘   └─────────────┘  └─────────────┘
Bg: slate-700      Bg: green-500     Bg: orange-500   Bg: red-500
Text: white        Text: white       Text: white      Text: white
Padding: 4px 8px   Corner: 4px       12pt, 600wt
```

**Props:**
```typescript
interface BadgeProps {
  label: string;
  variant?: "default" | "success" | "warning" | "error" | "info";
  size?: "small" | "medium";
}
```

---

### Empty State

**Layout:** Icon + Title + Message + CTA

```
┌────────────────────────────────┐
│                                │
│           🏋          (64x64px)│
│                                │
│  No Workouts Yet               │ Title: 18pt, 600wt
│                                │
│  Start logging your first      │ Message: 14pt, 400wt
│  workout to track progress.    │
│                                │
│ ┌──────────────────────────┐  │
│ │ ▶︎ START FIRST WORKOUT   │  │ Button: 48px height
│ └──────────────────────────┘  │
│                                │
└────────────────────────────────┘
```

---

### Toast / Snackbar

**Position:** Bottom (safe area)

```
TOAST MESSAGE
┌────────────────────────────────┐
│ ✓ Workout saved successfully!  │ ← auto-dismiss 3s
└────────────────────────────────┘

WITH ACTION
┌────────────────────────────────┐
│ Workout deleted    [UNDO]      │
└────────────────────────────────┘

ERROR TOAST
┌────────────────────────────────┐
│ ✕ Failed to save. [RETRY]      │
└────────────────────────────────┘
```

**Positioning:**
```
Bottom: 16px
Padding: 12px 16px
Width: screen - 32px
Corner: 8px
```

---

## Composite Components

### Workout Set Card (Multi-part)

**Layout:** Header + Inputs + Notes + Actions

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ Set 1  ✓                      ┃ ← Header: 14pt, 600wt + status
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ Reps        Weight           ┃ ← Labels: 12pt, 600wt
┃ ┌────────┐ ┌──────────┐     ┃
┃ │   8    │ │  185 lb  │     ┃ ← Inputs: 44px height
┃ └────────┘ └──────────┘     ┃
┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫
┃ Notes (optional)             ┃ ← Input label
┃ ┌──────────────────────────┐ ┃
┃ │ RPE: 8, paused reps    │ ┃ ← Text field: 40px
┃ └──────────────────────────┘ ┃
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
Height: 160px (with notes) | Padding: 12px
Border: 2px blue-500 (active), 1px gray (inactive)
```

---

### Profile Summary Card

**Layout:** Avatar + Info + Stats

```
┌───────────────────────────────┐
│ ┌──────┐  Alex Johnson        │ ← Avatar: 64x64px + Name
│ │      │  alex@example.com    │
│ │  👤  │  Male · 185 lb · 6'0"│
│ └──────┘  Fitness: Advanced   │
│                               │
│ 47 workouts  · 5.2K lb volume │ ← Stats: 2-column
└───────────────────────────────┘
Height: 120px | Corner: 12px | Border: blue-500
```

---

### Exercise Search Result Item

**Layout:** Icon + Title + Metadata + Stats + Action

```
┌──────────────────────────────────┐
│ 💪 Bench Press        [+]        │ ← Icon (24x24px) + Title + Add button
│ Chest · Triceps                  │ ← Muscle groups
│ ⭐⭐⭐⭐⭐ · Bar                │ ← Difficulty + Equipment
│ Best: 275 lb                     │ ← Personal record
└──────────────────────────────────┘
Height: 80px | Pressable
Pressed: bg-blue-500 opacity-10
```

---

### Timer Display

**Layout:** Countdown + Controls + Info

```
LANDSCAPE VIEW
┌─────────────────────────┐
│  NEXT EXERCISE          │ ← Instruction (12pt)
│                         │
│  ┏━━━━━━━━━━━━━━━━┓    │
│  ┃     02:34      ┃    │ ← Timer: 72pt, blue-500
│  ┗━━━━━━━━━━━━━━━━┛    │
│                         │
│  seconds remaining      │ ← Secondary: 12pt, gray
│                         │
│ [PAUSE]  [SKIP]         │ ← Controls: 44px height
│                         │
│ Last set: 8x185        │ ← Set summary
│ RPE: 8                 │
│                         │
│ Next set: 8x185 lb     │ ← Next preview
│ Rest: 90 seconds       │
│                         │
│ [▶︎ START NEXT SET]     │ ← CTA: 48px height
└─────────────────────────┘
```

---

## Component Matrix by Screen

### Dashboard Screen Components
- Header (DashboardHeader)
- Button (StartWorkoutButton)
- Grid (StatsGrid)
- Card (StatsCard, RecentActivityCard)
- Tab Bar (BottomTabBar)

### Workout Logger Components
- Header (WorkoutLoggerHeader)
- Card (ExerciseHeaderCard, SetCard)
- Input (RepsInput, WeightInput, NotesInput)
- Button (ActionButtons)
- Tab Bar (BottomTabBar)

### Exercise Library Components
- Header (ExerciseLibraryHeader)
- Input (SearchBar)
- Chip (CategoryChips)
- Section (FilterSection)
- Card (ExerciseCard)
- List (SectionList)
- Tab Bar (BottomTabBar)

### Progress Charts Components
- Header (ProgressHeader)
- Button (TimeRangeSelector)
- Grid (PersonalRecordsSection)
- Card (PRCard)
- Chart (VolumeTrendChart, FrequencyChart)
- Grid (AchievementsSection)
- Badge (AchievementBadge)
- Tab Bar (BottomTabBar)

### Timer Screen Components
- Header (TimerHeader)
- Circle (TimerDisplay)
- Button (TimerControls, StartNextSetButton)
- Card (SetSummaryCard)

### Profile Screen Components
- Header (ProfileHeader)
- Card (ProfileCard)
- Grid (PersonalStatsGrid)
- Section (GoalsSection, PreferencesSection, AccountSection)
- Card (GoalCard, PreferenceItem, AccountMenuItem)
- Toggle (ToggleSwitch)
- Text (Footer)

---

## Accessibility Checklist by Component

| Component | Touch Target | Label | Keyboard | Screen Reader |
|-----------|--------------|-------|----------|---------------|
| Button | 44x44px | ✓ | Tab, Enter | ✓ |
| Icon Button | 44x44px | ✓ | Tab, Enter | ✓ |
| Input | 44px height | ✓ label | Tab, type | ✓ |
| Toggle | 48x28px | ✓ optional | Tab, Space | ✓ |
| Picker | 44px | ✓ label | Tab, Arrow | ✓ |
| Card (pressable) | 80px height | Vary | Tab, Enter | Content |
| Tab Bar | 44px each | ✓ | Tab, Arrow | ✓ |
| Text | N/A | N/A | N/A | ✓ |

---

## Implementation Order (Recommended)

### Phase 1: Base Components (Week 1)
1. Text component with all variants
2. Button component with all variants
3. Icon Button
4. Card component

### Phase 2: Form Components (Week 2)
1. TextInput
2. ToggleSwitch
3. Picker
4. Checkbox

### Phase 3: Navigation (Week 2)
1. Bottom Tab Bar
2. Top Header
3. Screen navigation setup

### Phase 4: Specialized Components (Week 3)
1. Chart components (Line, Bar)
2. Progress components (Linear, Circular)
3. Modal/Overlay components
4. Toast/Snackbar

### Phase 5: Composite Components (Week 4)
1. Profile Summary Card
2. Workout Set Card
3. Exercise Search Item
4. Timer Display

### Phase 6: Screens (Weeks 4-6)
1. Dashboard Screen
2. Exercise Library Screen
3. Workout Logger Screen
4. Progress Charts Screen
5. Timer Screen
6. Profile Screen

---

## Summary

This inventory provides a complete visual and technical reference for all components in the design system, organized by category and screen. Developers can:

1. **Find component specs** quickly by name or category
2. **Understand visual hierarchy** through ASCII mockups
3. **Access TypeScript interfaces** for proper typing
4. **Check accessibility requirements** in the checklist
5. **Plan implementation** with the recommended order

All components follow the design specifications from `11-DESIGN-SPECIFICATIONS.md` and implement the patterns from `12-DESIGN-IMPLEMENTATION-GUIDE.md`.

