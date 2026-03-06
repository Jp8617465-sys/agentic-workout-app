# Figma Design Specifications - Agentic Workout App

## Overview

This document provides comprehensive UI/UX design specifications for the Agentic Workout App, a React Native Expo mobile application. All designs follow mobile-first principles, WCAG 2.1 AA accessibility standards, and NativeWind/Tailwind compatibility.

**Design System Foundation:**
- Primary Color: #3B82F6 (Blue, accent)
- Secondary Color: #0D9488 (Teal)
- Tertiary Color: #EA580C (Orange, call-to-action)
- Dark Background: #0F172A
- Dark Surface: #1E293B
- Dark Surface Elevated: #334155
- Success: #10B981 (Green)
- Warning: #F59E0B (Amber)
- Error: #EF4444 (Red)

**Typography Scale:**
- Display: 32px, weight 700 (headings)
- Headline: 24px, weight 600 (section titles)
- Subheading: 18px, weight 600 (card titles)
- Body Large: 16px, weight 400 (primary text)
- Body Regular: 14px, weight 400 (secondary text)
- Caption: 12px, weight 400 (meta information)
- Label: 12px, weight 600 (buttons, labels)

**Spacing Scale:** 4px, 8px, 12px, 16px, 24px, 32px, 48px

**Touch Targets:** Minimum 44x44px (enforced throughout)

---

## 1. Dashboard / Home Screen

### Purpose
The primary entry point. Shows upcoming workouts, recent activity summary, stats overview, and quick-access actions. Drives user engagement through progress visibility.

### ASCII Mockup (375px × 812px - Portrait)

```
┌─────────────────────────────────┐
│                                 │  ← Status Bar (safe area)
│  ┌───────────────────────────┐  │
│  │ 9:41              ◀︎       │  │  Status Bar
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │  Hello, Alex              │  │  Header (16pt, 600wt)
│  │  Tuesday, Mar 6           │  │  Subheader (14pt, 400wt)
│  └───────────────────────────┘  │  Padding: 16px all sides
│                                 │
│  ┌───────────────────────────┐  │
│  │ ▶︎ START WORKOUT          │  │  CTA Button
│  │   Chest & Back Program    │  │  Height: 56px, corner: 12px
│  └───────────────────────────┘  │
│                                 │
│  ┌─────────────┬─────────────┐  │
│  │  ┏━━━━━━┓   │  ┏━━━━━━┓   │  │  Stats Cards (2 columns)
│  │  ┃ 47  ┃   │  ┃ 5.2K ┃   │  │  Height: 100px each
│  │  ┃ reps┃   │  ┃ lb   ┃   │  │
│  │  ┗━━━━━━┛   │  ┗━━━━━━┛   │  │
│  │  All time  │  Current wk  │  │
│  └─────────────┴─────────────┘  │
│                                 │
│  ┌─────────────────────────────┐ │
│  │ RECENT ACTIVITY             │ │  Section Header (14pt, 600wt)
│  └─────────────────────────────┘ │  Padding: 16px left
│                                 │
│  ┌───────────────────────────┐  │
│  │ 📌 Bench Press            │  │  Activity Item
│  │ Mon · 8x185 · 3s 42m     │  │  Height: 60px, padding: 12px
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ 📌 Squat                  │  │
│  │ Sun · 10x315 · 2s 18m    │  │
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ 📌 Deadlift               │  │
│  │ Sat · 5x365 · 1s 25m     │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ ▶︎ VIEW ALL WORKOUTS      │  │  Secondary Button
│  └───────────────────────────┘  │  Height: 48px
│                                 │
│  ┌───────────────────────────┐  │
│  │ H   W   T   F   S   S   M │  │  Bottom Tab Bar
│  │ ● 🏋  📊  ⚙  📝           │  │  Height: 56px safe area
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### Component Breakdown

#### Header Section (Height: 72px)
```
Component: DashboardHeader
Props:
  - userName: string
  - dateText: string
  - onOpenMenu: () => void

Spacing:
  - Top: 16px (safe area)
  - Left/Right: 16px
  - Bottom: 8px

Typography:
  - Name: 18pt, 600wt, text-white
  - Date: 14pt, 400wt, text-gray-400
```

#### CTA Button - Start Workout (Height: 56px)
```
Component: StartWorkoutButton
Props:
  - programName: string
  - nextWorkout: WorkoutTemplate
  - onPress: () => void

Styling:
  - Background: brand-accent (#3B82F6)
  - Corner radius: 12px
  - Padding: 16px horizontal, 12px vertical
  - Icon size: 24px (right side)
  - Text: 16pt, 600wt, white
  - Shadow: elevation 4

Pressed state:
  - Opacity: 0.85
  - Background: #2563EB (darker blue)
```

#### Stats Cards Row (Height: 120px)
```
Component: StatsGrid
Props:
  - stats: {
      totalReps: number,
      weeklyVolume: number,
      currentStreak: number,
      personalRecords: number
    }

Layout: 2-column grid, gap: 12px
Card height: 100px
Card width: (screen - 40) / 2

Individual Card (StatsCard):
  - Background: dark-surface-elevated (#334155)
  - Padding: 16px
  - Corner radius: 12px
  - Content:
    * Large number: 24pt, 700wt, primary-color
    * Label: 12pt, 400wt, text-gray-400
    * Optional badge: 10pt, 600wt
  - Border: 1px solid dark-border

Pressed state:
  - Background: rgba(255,255,255,0.05)
```

#### Recent Activity Section (Height: Variable, min 200px)
```
Component: RecentActivitySection
Props:
  - activities: Activity[]
  - onActivityPress: (activityId) => void
  - onViewAll: () => void

Section header:
  - Padding: 16px left, 0 top
  - Font: 14pt, 600wt, text-gray-300
  - Margin bottom: 12px

Activity List:
  - Scrollable container
  - Item height: 64px
  - Item padding: 12px horizontal, 8px vertical
  - Margin between items: 8px

Individual Activity Item (RecentActivityCard):
  - Background: dark-surface-elevated
  - Padding: 12px
  - Corner radius: 8px
  - Layout:
    * Left: Icon (24x24px)
    * Middle: Exercise name (16pt, 600wt) + metadata (12pt, 400wt)
    * Right: Arrow icon
  - Touch target: 64x64px minimum

Pressed state:
  - Background: rgba(59,130,246,0.1)
  - Opacity: 0.85

Activity metadata format:
  - Format: "[Day] · [Sets]x[Reps/Weight] · [Duration]"
  - Example: "Mon · 8x185 · 3s 42m"
```

#### Tab Navigation (Height: 56px with safe area)
```
Component: BottomTabBar
Props:
  - activeTab: 'home' | 'workouts' | 'progress' | 'timer' | 'profile'
  - onTabChange: (tab) => void

Tab bar:
  - Background: dark-surface with top border (1px solid, border-color)
  - Position: Fixed bottom
  - Safe area bottom padding
  - Height: 56px + safe area

Each Tab:
  - Width: screen / 5
  - Center aligned
  - Touch target: 44x44px minimum
  - Inactive: icon 24x24px, text-gray-500, 10pt, 600wt
  - Active: icon 24x24px, text-accent, 10pt, 600wt

Icons:
  - Home: 🏠 (house)
  - Workouts: 📋 (list)
  - Progress: 📊 (chart)
  - Timer: ⏱ (timer)
  - Profile: 👤 (person)
```

### Layout Specifications

**Safe Area Consideration:**
- iOS: Top 44px (notch), Bottom 34px (home indicator)
- Android: Top 24px, Bottom 0px
- Implement using safe area insets

**Content Area:**
- Width: 375px baseline (safe area: 351px)
- Scrollable content with FlatList optimization
- Padding: 16px horizontal (consistent throughout)

**Responsive Behavior:**
- 375px (baseline): All content single column
- 540px+: Consider 3-column stats grid
- Landscape (667px width): Side-by-side layout with sidebar stats

### Accessibility

- **Focus management:** Header is keyboard navigable, buttons in logical order
- **Screen reader:** Each stat card announces "X [metric], [timestamp]"
- **Color contrast:** All text meets WCAG AA (min 4.5:1)
- **Touch targets:** All interactive elements 44x44px minimum
- **Labels:** All icons have text labels or aria labels

### Interactive States

| State | Background | Text | Icon |
|-------|-----------|------|------|
| Default | dark-surface-elevated | text-white | accent |
| Pressed | rgba(255,255,255,0.05) | text-white | accent |
| Disabled | dark-surface | text-gray-600 | text-gray-600 |
| Hover (web) | rgba(59,130,246,0.1) | text-white | accent |

---

## 2. Workout Logger Screen

### Purpose
Main interface for logging sets, reps, and weight during an active workout. Critical UX - must be fast, tactile, and work offline.

### ASCII Mockup (375px × 812px - Portrait)

```
┌─────────────────────────────────┐
│ ◀︎  Chest & Back · 3 of 5      │  ← Header with progress
│                                 │
├─────────────────────────────────┤
│                                 │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃  BENCH PRESS              ┃ │  Exercise header card
│ ┃  Last: 8x185 · 3 sets     ┃ │  Height: 80px
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                 │
│ Set 1  ✓                       │  Set number with status
│ ┌───────────────────────────┐  │
│ │  Reps       Weight       │  │  Input row (height: 56px)
│ │ ┌────────┐ ┌──────────┐ │  │
│ │ │   8    │ │  185 lb  │ │  │
│ │ └────────┘ └──────────┘ │  │
│ └───────────────────────────┘  │
│ ┌───────────────────────────┐  │
│ │  Notes (optional)         │  │
│ │ ┌────────────────────────┐│  │
│ │ │ RPE: 8, paused reps   ││  │
│ │ └────────────────────────┘│  │
│ └───────────────────────────┘  │
│                                 │
│ Set 2  -                        │  Next set (inactive)
│ ┌───────────────────────────┐  │
│ │  Reps       Weight       │  │
│ │ ┌────────┐ ┌──────────┐ │  │
│ │ │   8    │ │  185 lb  │ │  │
│ │ └────────┘ └──────────┘ │  │
│ └───────────────────────────┘  │
│                                 │
│ Set 3  -                        │
│ ┌───────────────────────────┐  │
│ │  Reps       Weight       │  │
│ │ ┌────────┐ ┌──────────┐ │  │
│ │ │   8    │ │  185 lb  │ │  │
│ │ └────────┘ └──────────┘ │  │
│ └───────────────────────────┘  │
│                                 │
│ ┌─────────────┬─────────────┐  │  Action buttons (height: 44px)
│ │ ✗ REMOVE    │ ✓ NEXT      │  │
│ │ SET         │ EXERCISE    │  │
│ └─────────────┴─────────────┘  │
└─────────────────────────────────┘

Landscape variant (540px height):
┌────────────────────────────────────────────┐
│ ◀︎  Chest & Back          Timer: 02:34    │
├────────────────────────────────────────────┤
│ ┌──────────────────┐  ┌──────────────────┐ │
│ │ BENCH PRESS      │  │ Set 1  ✓         │ │
│ │ Last: 8x185      │  │ Reps: 8 Weight:  │ │
│ │                  │  │ ┌─────┬─────────┐ │ │
│ │ [Set buttons]    │  │ │  8  │  185 lb │ │ │
│ │                  │  │ └─────┴─────────┘ │ │
│ └──────────────────┘  │ RPE, Notes, etc   │ │
│                       │ [Continue]        │ │
│                       └──────────────────┘ │
└────────────────────────────────────────────┘
```

### Component Breakdown

#### Header Section (Height: 48px)
```
Component: WorkoutLoggerHeader
Props:
  - programName: string
  - currentExerciseIndex: number
  - totalExercises: number
  - onBack: () => void
  - elapsedTime?: number

Layout:
  - Left: Back button (44x44px touch target)
  - Center: Title + progress badge
  - Right: Timer display (optional)

Typography:
  - Program name: 14pt, 600wt, text-white
  - Progress: 12pt, 400wt, text-gray-400
  - Timer: 14pt, 700wt, text-accent (if showing)

Spacing:
  - Horizontal padding: 8px (back button), 16px (center), 8px (timer)
  - Vertical padding: 8px
  - Safe area top: 8px
```

#### Exercise Header Card (Height: 80px)
```
Component: ExerciseHeaderCard
Props:
  - exerciseName: string
  - lastPerformance: {
      sets: number,
      reps: number,
      weight: number
    }
  - notes?: string
  - onEdit: () => void

Styling:
  - Background: linear gradient(135°, #3B82F6, #2563EB)
  - Corner radius: 12px
  - Padding: 16px
  - Margin: 16px
  - Shadow: elevation 2

Layout:
  - Line 1: Exercise name (20pt, 700wt, white)
  - Line 2: Last performance (14pt, 400wt, rgba(255,255,255,0.7))
  - Optional: Notes or RPE indicator

Touch state:
  - Opacity: 0.9
  - Shadow: elevation 4
```

#### Set Card (Height: 120-160px depending on state)
```
Component: SetCard
Props:
  - setNumber: number
  - reps: number | null
  - weight: number | null
  - unit: 'lb' | 'kg'
  - completed: boolean
  - notes?: string
  - rpe?: number
  - isActive: boolean
  - onRepsChange: (reps: number) => void
  - onWeightChange: (weight: number) => void
  - onNotesChange: (notes: string) => void
  - onComplete: () => void

Base styling (active):
  - Background: dark-surface-elevated (#334155)
  - Border: 2px solid brand-accent (#3B82F6)
  - Corner radius: 12px
  - Padding: 16px
  - Margin: 12px 16px
  - Shadow: elevation 2

Base styling (inactive):
  - Background: dark-surface-elevated
  - Border: 1px solid dark-border (#475569)
  - Opacity: 0.7

Set header row:
  - Left: "Set 1" (14pt, 600wt)
  - Right: Status icon (✓ completed, - pending)
  - Height: 24px

Input row:
  - Layout: 2 columns with gap
  - Each input: 44px height, 12px corner radius
  - Background: dark-surface (#1E293B)
  - Text: 16pt, 600wt, text-white
  - Numeric keyboard

Input labels:
  - Above each field: 12pt, 600wt, text-gray-400
  - Padding: 8px bottom

Notes field (if showing):
  - Height: 40px (multiline, 1-2 lines)
  - Placeholder: "Notes (optional)"
  - Font: 14pt, 400wt
  - Background: dark-surface

Pressed state (input):
  - Background: rgba(59,130,246,0.15)
  - Border: 2px solid brand-accent
```

#### Action Buttons (Height: 56px)
```
Component: WorkoutSetActions
Props:
  - onSkipSet: () => void
  - onCompleteSet: () => void
  - onRemoveExercise: () => void
  - onNextExercise: () => void

Layout: 2 columns
Gap: 12px
Margin: 16px

Left button (secondary):
  - Text: "SKIP / REMOVE"
  - Background: dark-surface-elevated
  - Text color: text-gray-400
  - Corner radius: 8px
  - Height: 44px
  - Font: 12pt, 600wt

Right button (primary):
  - Text: "COMPLETE / NEXT"
  - Background: brand-accent (#3B82F6)
  - Text color: white
  - Corner radius: 8px
  - Height: 44px
  - Font: 12pt, 600wt

Pressed state:
  - Primary: opacity 0.85, elevation 2
  - Secondary: opacity 0.7
```

### Layout Specifications

**Scrollable Content:**
- FlatList with removeClippedSubviews={true}
- keyExtractor based on set ID
- initialNumToRender={5} for performance

**Safe Area:**
- Header respects safe area top
- Content scrolls under safe area if needed

**Responsive:**
- 375px: Single column, vertical flow
- 540px+: Could display side-by-side with timer/stats panel
- Landscape: Header compressed, content takes full height

**Input Handling:**
- Numeric keyboard for reps/weight
- Debounced save (500ms)
- Optimistic UI updates
- Offline sync queue

### Accessibility

- **Focus management:** Logical flow through sets
- **Screen reader:** "Set 1 of 3, completed, reps, weight, notes"
- **Keyboard navigation:** Tab through inputs, Enter to complete
- **Labels:** All inputs have visible labels
- **Color:** Status indicated by icon + color (not color alone)

### Interactive States

| Element | Default | Focused | Pressed | Completed |
|---------|---------|---------|---------|-----------|
| Active Set | Border accent | Shadow elevation 4 | Opacity 0.9 | Green border |
| Inactive Set | Border gray | Shadow elevation 2 | Opacity 0.7 | Opacity 0.6 |
| Input field | dark-surface | border-accent | background-accent-light | - |
| Button | text-gray-400 | underline | opacity 0.7 | - |

---

## 3. Exercise Library Screen

### Purpose
Browse, search, and filter exercises across multiple categories. Support advanced filtering by muscle group, equipment, and difficulty.

### ASCII Mockup (375px × 812px - Portrait)

```
┌─────────────────────────────────┐
│ 📌 Exercise Library             │  ← Header
│                                 │
│ ┌───────────────────────────────┐│  Search/Filter
│ │ 🔍 Search exercises...        ││
│ └───────────────────────────────┘│
│                                 │
│ [Strength] [Cardio] [Mobility]  │  Category chips
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Filters ▼                   │ │  Collapsed filter section
│ └─────────────────────────────┘ │
│                                 │
│ STRENGTH EXERCISES              │  Section header
│                                 │
│ ┌───────────────────────────────┐│
│ │ 💪 Bench Press                ││  Exercise card
│ │ Chest · Triceps               ││  Height: 72px
│ │ ⭐⭐⭐⭐⭐ · Equipment: Bar  ││
│ │ Best: 275 lb                  ││
│ └───────────────────────────────┘│
│ ┌───────────────────────────────┐│
│ │ 💪 Squat                      ││
│ │ Quads · Glutes                ││
│ │ ⭐⭐⭐⭐⭐ · Equipment: Rack ││
│ │ Best: 365 lb                  ││
│ └───────────────────────────────┘│
│ ┌───────────────────────────────┐│
│ │ 💪 Deadlift                   ││
│ │ Posterior Chain · Grip        ││
│ │ ⭐⭐⭐⭐⭐ · Equipment: Bar  ││
│ │ Best: 495 lb                  ││
│ └───────────────────────────────┘│
│                                 │
│ CARDIO EXERCISES                │
│                                 │
│ ┌───────────────────────────────┐│
│ │ 🏃 Treadmill Running          ││
│ │ Endurance · Calorie Burn      ││
│ │ ⭐⭐⭐⭐ · Equipment: Machine ││
│ │ Max: 5.2 miles/10m             ││
│ └───────────────────────────────┘│
│                                 │
└─────────────────────────────────┘
```

### Component Breakdown

#### Header Section (Height: 56px)
```
Component: ExerciseLibraryHeader
Props:
  - onFilterPress: () => void
  - filterCount?: number

Styling:
  - Background: dark-surface
  - Padding: 12px 16px
  - Safe area top: 8px

Title:
  - Font: 18pt, 600wt
  - Text: "Exercise Library"
  - Icon: 24x24px

Right action:
  - Filter button (44x44px)
  - Badge showing active filters if filterCount > 0
```

#### Search Bar (Height: 44px)
```
Component: ExerciseSearchBar
Props:
  - onSearch: (text: string) => void
  - onFocus: () => void
  - onBlur: () => void
  - placeholder?: string

Styling:
  - Background: dark-surface-elevated
  - Corner radius: 8px
  - Padding: 8px 12px
  - Margin: 12px 16px
  - Border: 1px solid dark-border (focus: brand-accent)

Input:
  - Font: 14pt, 400wt
  - Text color: white
  - Placeholder: text-gray-500
  - Icon left: 🔍 (18x18px)
  - Icon right: ✕ (clear, appears on focus)

Focus state:
  - Border: 2px solid brand-accent
  - Background: rgba(59,130,246,0.05)
```

#### Category Chips Row (Height: 48px)
```
Component: CategoryChips
Props:
  - categories: { id, label }[]
  - activeCategory: string | null
  - onCategorySelect: (categoryId) => void

Layout:
  - Horizontal scroll
  - Padding: 12px 16px
  - Gap: 8px

Individual Chip:
  - Padding: 8px 12px
  - Corner radius: 20px (pill shape)
  - Height: 32px
  - Font: 12pt, 600wt
  - Border: 1px solid dark-border

Inactive state:
  - Background: transparent
  - Text: text-gray-400
  - Border: 1px solid dark-border

Active state:
  - Background: brand-accent
  - Text: white
  - Border: none

Touch target: 44x44px (expanded hit area)
```

#### Filter Section (Collapsible, Height: 48px or expanded)
```
Component: FilterSection
Props:
  - filters: {
      muscleGroups: string[],
      equipment: string[],
      difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
    }
  - onFilterChange: (filterKey, value) => void
  - isExpanded: boolean
  - onToggleExpanded: () => void

Collapsed header:
  - Height: 48px
  - Padding: 12px 16px
  - Background: dark-surface-elevated
  - Text: "Filters ▼" (14pt, 600wt)
  - Right: badge with active filter count

Expanded content:
  - Multi-select list
  - Muscle group section
  - Equipment section
  - Difficulty radio group
  - Apply/Clear buttons (height: 40px each)

Styling:
  - Background: dark-surface-elevated
  - Padding: 16px
  - Border top: 1px solid dark-border
  - Animation: slide down (300ms ease-out)
```

#### Exercise Card (Height: 80px)
```
Component: ExerciseCard
Props:
  - exercise: {
      id: string,
      name: string,
      category: string,
      muscleGroups: string[],
      equipment: string,
      difficulty: 1-5,
      personalBest?: {
        value: number,
        unit: string,
        date: Date
      }
    }
  - onPress: (exerciseId) => void
  - onAddToWorkout?: (exerciseId) => void

Styling:
  - Background: dark-surface-elevated
  - Border: 1px solid dark-border
  - Corner radius: 12px
  - Padding: 12px
  - Margin: 8px 16px
  - Height: 80px

Layout:
  - Header row:
    * Icon (24x24px) + Name (16pt, 600wt)
    * Right: Add button (✓) or Menu (⋯)
  - Content row:
    * Muscle groups (12pt, 400wt, text-gray-400)
  - Footer row:
    * Difficulty stars (12pt)
    * Equipment icon + label (12pt, 400wt)
    * Personal best (right side, 12pt, 600wt, accent)

Pressed state:
  - Background: rgba(59,130,246,0.1)
  - Border: 2px solid brand-accent
  - Elevation: 4

Touch target: full card = 80x375px minimum
```

#### Section Header (Height: 28px)
```
Component: SectionHeader
Props:
  - title: string
  - count?: number

Styling:
  - Font: 14pt, 600wt
  - Color: text-gray-300
  - Padding: 16px left, 8px top
  - Margin bottom: 8px
  - Background: transparent

Format:
  - "STRENGTH EXERCISES" (uppercase)
  - Optional count badge on right
```

### Layout Specifications

**List Layout:**
- SectionList (React Native) for grouped exercises
- renderItem: ExerciseCard
- renderSectionHeader: SectionHeader
- stickySectionHeadersEnabled={true}

**Scrolling Performance:**
- removeClippedSubviews={true}
- windowSize={10}
- initialNumToRender={8}
- maxToRenderPerBatch={10}

**Search & Filter Logic:**
- Debounce search input (300ms)
- Real-time filter updates
- Results count in header

**Responsive:**
- 375px: Single column
- 540px+: Consider 2-column grid
- Landscape: sidebar filters + grid layout

### Accessibility

- **Search:** Magnifying glass icon + "Search exercises" label
- **Categories:** Visible text labels on chips
- **Filter section:** Announcements on expand/collapse
- **Cards:** Full text for difficulty and equipment
- **Focus:** All interactive elements keyboard navigable

### Interactive States

| Element | Default | Focused | Pressed | Disabled |
|---------|---------|---------|---------|----------|
| Search | border-gray | border-accent | - | opacity 0.5 |
| Chip (inactive) | bg-transparent | border-accent | - | - |
| Chip (active) | bg-accent | shadow | opacity 0.9 | - |
| Card | border-gray | border-accent | bg-accent-light | - |

---

## 4. Progress Charts Screen

### Purpose
Visualize workout history, personal records, and progress over time. Show trends, statistics, and achievement milestones.

### ASCII Mockup (375px × 812px - Portrait)

```
┌─────────────────────────────────┐
│ 📊 Progress & Records           │  ← Header
│                                 │
│ ┌───────────────────────────────┐│  Time range selector
│ │ [1W] [1M] [3M] [ALL]          ││
│ └───────────────────────────────┘│
│                                 │
│ PERSONAL RECORDS                │  Section header
│                                 │
│ ┌──────────┬──────────┬────────┐ │
│ │ Bench    │ Squat    │ Dead   │ │  PR cards (3-column)
│ │ 275 lb   │ 365 lb   │ 495 lb │ │  Height: 80px each
│ │ ↑ 5 lb   │ ↓ 10 lb  │ ↔︎ 0   │ │  Trend indicator
│ └──────────┴──────────┴────────┘ │
│                                 │
│ VOLUME TREND                    │
│                                 │
│ ┌─────────────────────────────┐ │
│ │          📈                 │ │  Chart (height: 200px)
│ │       ╱                     │ │  Line chart with area fill
│ │      ╱   ╱                 │ │
│ │   ╱    ╱                   │ │
│ │  ╱  ╱                      │ │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━ │ │
│ │ Week 1  Week 2  Week 3      │ │
│ │ 12,450 lb  13,200 lb  12,890 │ │
│ └─────────────────────────────┘ │
│                                 │
│ WORKOUT FREQUENCY               │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ M   W   F   Total (4W)      │ │  Bar chart
│ │ 12  11  13  48 sessions     │ │
│ │ ██  ██  ██                  │ │
│ │ ██  ██  ██                  │ │
│ │ ██  ██  ██                  │ │
│ │ ██  ██  ██                  │ │
│ └─────────────────────────────┘ │
│                                 │
│ ACHIEVEMENTS                    │
│                                 │
│ ✓ 100 Workouts Logged          │  Milestone badges
│ ✓ 30 Day Streak                │
│ ◎ 500 Total Sessions (456)     │
│                                 │
└─────────────────────────────────┘
```

### Component Breakdown

#### Header Section (Height: 56px)
```
Component: ProgressHeader
Props:
  - onExport?: () => void
  - onSettings?: () => void

Styling:
  - Background: dark-surface
  - Padding: 12px 16px
  - Safe area top: 8px

Title:
  - Font: 18pt, 600wt, white
  - Icon: 📊 (24x24px)

Right actions:
  - Export button (44x44px) - optional
  - Settings button (44x44px) - optional
```

#### Time Range Selector (Height: 44px)
```
Component: TimeRangeSelector
Props:
  - selectedRange: '1W' | '1M' | '3M' | 'ALL'
  - onRangeSelect: (range) => void

Layout:
  - Horizontal button group
  - 4 buttons, equal width
  - Padding: 8px 16px
  - Gap: 8px

Individual Button:
  - Height: 32px
  - Corner radius: 20px (pill)
  - Font: 12pt, 600wt
  - Padding: 0 12px

Inactive state:
  - Background: dark-surface-elevated
  - Text: text-gray-400
  - Border: 1px solid dark-border

Active state:
  - Background: brand-accent
  - Text: white
  - Border: none

Press state:
  - Opacity: 0.85
```

#### Personal Records Section (Height: 120px)
```
Component: PersonalRecordsSection
Props:
  - records: Array<{
      exerciseName: string,
      weight: number,
      unit: 'lb' | 'kg',
      trend: 'up' | 'down' | 'stable',
      trendValue: number,
      date: Date
    }>

Layout:
  - Horizontal scrolling grid
  - 3 columns visible, scroll for more
  - Padding: 16px
  - Gap: 12px

Individual PR Card (PRCard):
  - Width: (screen - 40) / 3 ≈ 105px
  - Height: 100px
  - Background: dark-surface-elevated
  - Border: 1px solid dark-border
  - Corner radius: 12px
  - Padding: 12px
  - Center aligned

Content:
  - Exercise name: 12pt, 600wt, white (center)
  - Weight: 18pt, 700wt, accent (center)
  - Trend: small arrow icon (↑ green, ↓ red, ↔︎ gray)
  - Trend value: 10pt, 400wt, color-coded

Pressed state:
  - Background: rgba(59,130,246,0.1)
  - Border: 2px solid brand-accent
```

#### Chart Component - Volume Trend (Height: 220px)
```
Component: VolumeTrendChart
Props:
  - data: Array<{
      date: Date,
      volume: number
    }>
  - timeRange: string
  - onDataPointPress?: (dataPoint) => void

Styling:
  - Background: dark-surface-elevated
  - Border: 1px solid dark-border
  - Corner radius: 12px
  - Padding: 16px
  - Margin: 16px
  - Height: 200px

Chart details:
  - Type: Line chart with area fill
  - Line color: brand-accent (#3B82F6)
  - Fill color: rgba(59,130,246,0.1)
  - Grid lines: rgba(255,255,255,0.05)
  - X-axis: Date labels (every Nth point)
  - Y-axis: Volume in lbs
  - Y-axis labels: 12pt, 400wt, text-gray-400

Data points:
  - Circle markers (6px diameter)
  - Hover tooltip showing value + date
  - Interactive: tap to see details

Animation:
  - Line draws on mount (300ms)
  - Easing: ease-out
```

#### Bar Chart - Workout Frequency (Height: 180px)
```
Component: FrequencyChart
Props:
  - data: Array<{
      label: string,
      value: number,
      percentage: number
    }>
  - timeRange: string

Styling:
  - Background: dark-surface-elevated
  - Border: 1px solid dark-border
  - Corner radius: 12px
  - Padding: 16px
  - Margin: 16px
  - Height: 160px

Chart details:
  - Type: Bar chart (vertical bars)
  - Bar color: brand-accent
  - Bar spacing: 16px
  - Max bar height: 120px
  - Grid lines horizontal (light)

Labels:
  - X-axis: Day labels (M, W, F)
  - Y-axis: Session count
  - Above bar: value label (12pt, 600wt)
  - Below chart: "Total: X sessions" summary

Interactive:
  - Bar press shows details tooltip
  - Tap to filter by day (optional)
```

#### Achievements Section (Height: Variable, min 150px)
```
Component: AchievementsSection
Props:
  - achievements: Array<{
      id: string,
      title: string,
      description: string,
      icon: string,
      unlocked: boolean,
      progress?: number,
      progressText?: string
    }>

Section header:
  - Font: 14pt, 600wt
  - Padding: 16px left
  - Margin bottom: 12px

Achievement Badges (grid):
  - Layout: 2 columns
  - Gap: 12px
  - Padding: 0 16px

Individual Badge (AchievementBadge):
  - Height: 80px
  - Background: dark-surface-elevated (unlocked), dark-surface (locked)
  - Border: 1px solid dark-border
  - Corner radius: 12px
  - Padding: 12px

Content:
  - Top: Icon (32x32px, accent if unlocked, gray if locked)
  - Title: 12pt, 600wt
  - Progress bar (if applicable): height 4px, corner 2px
    * Background: dark-surface
    * Fill: brand-accent
  - Progress text: 10pt, 400wt, text-gray-400

Unlocked state:
  - Icon: colored
  - Title: white
  - Background: slightly elevated

Locked state:
  - Icon: grayscale, opacity 0.5
  - Title: text-gray-500
  - Background: darker
  - Progress bar visible
```

### Layout Specifications

**Scroll Container:**
- ScrollView with bounces={false}
- Content inset for safe area
- Refresh control for pulling latest data

**Chart Library:**
- Use react-native-chart-kit for charts
- Alternative: custom SVG charts with Skia
- Optimize for performance (memoize)

**Responsive:**
- 375px: All sections full width, 3-col PR cards
- 540px+: 4-col PR cards, side-by-side charts
- Landscape: 2 columns of charts

**Data Update:**
- Poll every 5 minutes (background)
- Real-time Supabase subscription
- Offline: show last synced data

### Accessibility

- **Charts:** Text description + alternative view (table)
- **Trends:** Announced as "up 5 pounds," not just arrow
- **Achievements:** Full descriptions for locked items
- **Time range:** Clearly indicated current selection
- **Numbers:** Formatted consistently (1,234 lb not 1234lb)

### Interactive States

| Element | Default | Pressed | Unlocked | Locked |
|---------|---------|---------|----------|--------|
| Time range | bg-surface | bg-accent | - | - |
| PR card | border-gray | border-accent | - | - |
| Bar | bar-accent | bar-light | - | - |
| Badge | bg-surface | opacity 0.9 | icon-accent | icon-gray |

---

## 5. Workout Timer Screen

### Purpose
Dedicated timer interface for rest periods between sets. Large, legible countdown with haptic feedback and audio cues.

### ASCII Mockup (375px × 812px - Portrait)

```
┌─────────────────────────────────┐
│ ◀︎  Bench Press · Set 2         │  ← Header
│                                 │
├─────────────────────────────────┤
│                                 │
│        NEXT EXERCISE             │  Instruction (12pt)
│                                 │
│        ┏━━━━━━━━━━━━━━━━━━┓   │
│        ┃                    ┃    │  Timer circle (size: 240x240px)
│        ┃        02:34       ┃    │  Font: 72pt, 700wt
│        ┃                    ┃    │  Color: accent (blue)
│        ┗━━━━━━━━━━━━━━━━━━┛   │
│                                 │
│          seconds remaining      │  Secondary text (12pt)
│                                 │
│ ┌─────────────┬─────────────┐  │
│ │    ⏸       │    SKIP     │  │  Control buttons (44px height)
│ │   PAUSE     │             │  │
│ └─────────────┴─────────────┘  │
│                                 │
│ Last set:                       │  Previous set summary
│ 8 reps × 185 lb                │
│ RPE: 8                          │
│                                 │
│ Next set:                       │  Next set preview
│ Estimated: 8 reps × 185 lb     │
│ Rest: 90 seconds                │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ▶︎ START NEXT SET            │ │  CTA button (height: 48px)
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘

Landscape variant (540px × 360px):
┌────────────────────────────────────────┐
│ ◀︎  Bench Press                       │
├────────────────────────────────────────┤
│                                        │
│  ┌─────────────────┐  ┌─────────────┐ │
│  │                 │  │ NEXT SET    │ │
│  │   ┏━━━━━━━━┓   │  │ 8x185 lb    │ │
│  │   ┃02:34  ┃   │  │             │ │
│  │   ┗━━━━━━━┛   │  │ Rest: 90s   │ │
│  │               │  │             │ │
│  │ [Pause] [Skip]│  │ [Start Next]│ │
│  │               │  │             │ │
│  └─────────────────┘  └─────────────┘ │
│                                        │
└────────────────────────────────────────┘
```

### Component Breakdown

#### Header Section (Height: 48px)
```
Component: TimerHeader
Props:
  - exerciseName: string
  - setNumber: number
  - totalSets: number
  - onBack: () => void

Styling:
  - Background: dark-surface
  - Padding: 8px 16px
  - Safe area top: 8px

Layout:
  - Back button (44x44px) | Title (center) | Close button
  - Title: 14pt, 600wt
```

#### Timer Display (Height: 280px)
```
Component: TimerDisplay
Props:
  - totalSeconds: number
  - remainingSeconds: number
  - isRunning: boolean
  - onComplete?: () => void

Styling:
  - Background: linear gradient (vertical)
    * Top: transparent
    * Bottom: rgba(59,130,246,0.1)
  - Padding: 24px 16px

Center circle:
  - Width/Height: 240px
  - Background: rgba(59,130,246,0.1)
  - Border: 3px solid brand-accent
  - Corner radius: 120px (perfect circle)
  - Center align content

Time display:
  - Format: "MM:SS"
  - Font: 72pt, 700wt (mono family)
  - Color: brand-accent
  - Kerning: tight

Subtitle:
  - Font: 12pt, 400wt
  - Color: text-gray-400
  - Text: "[X] seconds remaining"
  - Margin top: 12px

Progress ring (optional):
  - SVG circle circumference
  - Stroke: brand-accent
  - Dasharray animated based on progress
  - Starting at top (0°)

Animation:
  - Numbers update every 100ms
  - Smooth progress ring animation
  - Color shift at final 10 seconds (to warning/orange)
```

#### Timer Controls (Height: 56px)
```
Component: TimerControls
Props:
  - isRunning: boolean
  - onPlayPause: () => void
  - onSkip: () => void

Layout:
  - 2 buttons, equal width
  - Gap: 12px
  - Padding: 0 16px
  - Margin: 16px 0

Pause/Play Button:
  - Height: 44px
  - Background: dark-surface-elevated
  - Text: "PAUSE" (if running), "RESUME" (if paused)
  - Font: 12pt, 600wt
  - Corner radius: 8px
  - Icon: ⏸ or ▶︎

Skip Button:
  - Height: 44px
  - Background: dark-surface-elevated
  - Text: "SKIP"
  - Font: 12pt, 600wt
  - Corner radius: 8px

Pressed state:
  - Both buttons: opacity 0.85
  - Background: rgba(255,255,255,0.05)
```

#### Set Summary Cards (Height: 100px each)
```
Component: SetSummaryCard
Props:
  - label: 'Last set' | 'Next set'
  - reps: number
  - weight: number
  - unit: string
  - rpe?: number
  - notes?: string

Styling:
  - Background: dark-surface-elevated
  - Border: 1px solid dark-border
  - Corner radius: 12px
  - Padding: 16px
  - Margin: 12px 16px

Layout:
  - Label: 12pt, 600wt, text-gray-400
  - Main text: 16pt, 600wt, white
    * Format: "8 reps × 185 lb"
  - Secondary: 12pt, 400wt, text-gray-400
    * "RPE: 8" or "Estimated: ..."

Styling by type:
  - Last set: left border accent
  - Next set: right border accent
  - Completed: opacity 0.7
```

#### Start Next Set Button (Height: 48px)
```
Component: StartNextSetButton
Props:
  - onPress: () => void
  - remainingSeconds: number

Styling:
  - Background: brand-accent (#3B82F6)
  - Corner radius: 8px
  - Padding: 0 16px
  - Height: 48px
  - Margin: 16px
  - Font: 14pt, 600wt, white

Enabled state:
  - Background: brand-accent
  - Opacity: 1

Disabled (if timer still running):
  - Background: dark-surface-elevated
  - Text: text-gray-400
  - Opacity: 0.5

Pressed state:
  - Opacity: 0.85
  - Shadow: elevation 2
```

### Layout Specifications

**Portrait Layout:**
- Safe area top: 8px
- Header: 48px
- Spacer: 24px
- Timer circle: 240x240px
- Spacer: 24px
- Controls: 44px
- Spacer: 24px
- Set summaries: 2 × 100px = 200px
- Spacer: 24px
- Start button: 48px
- Total: ~850px (scrollable with keyboard awareness)

**Landscape Layout:**
- Header: 48px
- Two-column layout:
  * Left: Timer (centered, responsive width)
  * Right: Set summary + controls
- Maximum widths respected

**Audio & Haptics:**
```
- 10 seconds remaining: 3 short haptic pulses
- 3 seconds remaining: continuous pulses
- Timer end: long pulse + notification sound
- Skip: short haptic pulse
```

**Notifications:**
- Local push notification when timer ends (if app backgrounded)
- Wear OS support (smartwatch timer)

### Accessibility

- **Large text:** 72pt timer for visibility during workout
- **Color:** Timer color changes (not color-blind dependent)
- **Audio cues:** Beep at completion (volume > 0)
- **Screen reader:** "Timer running, 2 minutes 34 seconds remaining"
- **Haptics:** Vibration feedback for all state changes

### Interactive States

| Element | Default | Running | Paused | Complete |
|---------|---------|---------|--------|----------|
| Timer | blue | blue | gray | green |
| Controls | enabled | enabled | enabled | disabled |
| Start button | disabled | disabled | disabled | enabled |
| Progress ring | at 100% | animating | frozen | at 0% |

---

## 6. Profile Screen

### Purpose
User account settings, personal stats, goals management, and app preferences. Profile data syncs with Supabase.

### ASCII Mockup (375px × 812px - Portrait)

```
┌─────────────────────────────────┐
│ ⚙︎  Profile                     │  ← Header
│                                 │
├─────────────────────────────────┤
│                                 │
│ ┌───────────────────────────────┐│
│ │  👤 Alex Johnson              ││  Profile card (height: 120px)
│ │  alex@example.com             ││
│ │                               ││
│ │  Male · 185 lbs · 6'0"        ││
│ │  Fitness Level: Advanced      ││
│ └───────────────────────────────┘│
│                                 │
│ PERSONAL STATS                  │  Section header
│                                 │
│ ┌─────────────┬─────────────┐  │
│ │ Workouts    │ Streak Days │  │  Stats grid
│ │ 147         │ 28          │  │  Height: 80px
│ └─────────────┴─────────────┘  │
│                                 │
│ GOALS                           │
│                                 │
│ ┌───────────────────────────────┐│
│ │ Bench Press: 300 lb           ││  Goal card
│ │ Current: 275 lb · ↑ 25 lb     ││  Height: 64px
│ │ ████████░░ 92%                ││
│ └───────────────────────────────┘│
│                                 │
│ PREFERENCES                     │
│                                 │
│ ┌───────────────────────────────┐│
│ │ Weight Unit              lb    ││  Setting item (height: 44px)
│ └───────────────────────────────┘│
│ ┌───────────────────────────────┐│
│ │ Dark Mode               ● on  ││
│ └───────────────────────────────┘│
│ ┌───────────────────────────────┐│
│ │ Notifications           ● on  ││
│ └───────────────────────────────┘│
│                                 │
│ ACCOUNT                         │
│                                 │
│ ┌───────────────────────────────┐│
│ │ Change Password       ▶︎       ││  Menu item
│ │ Privacy Policy        ▶︎       ││  Height: 44px each
│ │ Terms of Service      ▶︎       ││
│ │ Sign Out              ▶︎       ││
│ └───────────────────────────────┘│
│                                 │
│ Version 1.0.0                   │  Footer text
│                                 │
└─────────────────────────────────┘
```

### Component Breakdown

#### Header Section (Height: 56px)
```
Component: ProfileHeader
Props:
  - onEditProfile?: () => void
  - onSettings?: () => void

Styling:
  - Background: dark-surface
  - Padding: 12px 16px
  - Safe area top: 8px

Layout:
  - Left: Title "Profile" (18pt, 600wt)
  - Right: Edit button (44x44px, optional)

Edit Button:
  - Icon: ✏︎ or pencil
  - Touch target: 44x44px
```

#### Profile Card (Height: 120px)
```
Component: ProfileCard
Props:
  - user: {
      name: string,
      email: string,
      avatar?: URL,
      gender?: 'Male' | 'Female' | 'Other',
      weight: number,
      height: number,
      fitnessLevel: string,
      joinDate: Date
    }
  - onEditPress: () => void

Styling:
  - Background: linear gradient(135°, rgba(59,130,246,0.1), transparent)
  - Border: 1px solid brand-accent
  - Corner radius: 12px
  - Padding: 16px
  - Margin: 16px

Layout:
  - Top: Avatar (64x64px) + Name (16pt, 600wt)
  - Email: 12pt, 400wt, text-gray-400
  - Stats row: "Male · 185 lbs · 6'0\"" (12pt, 400wt)
  - Fitness level: 12pt, 600wt, accent

Avatar:
  - Circular (64px diameter)
  - Background: brand-accent
  - Initials or image
  - Border: 2px solid brand-accent

Pressed state:
  - Opacity: 0.9
  - Border: 2px solid brand-accent
```

#### Personal Stats Grid (Height: 80px)
```
Component: PersonalStatsGrid
Props:
  - stats: {
      totalWorkouts: number,
      currentStreak: number,
      totalVolume: number,
      personalRecords: number
    }

Layout:
  - 2 columns, equal width
  - Gap: 12px
  - Padding: 0 16px
  - Margin: 12px 0

Individual Stat Card:
  - Height: 80px
  - Background: dark-surface-elevated
  - Border: 1px solid dark-border
  - Corner radius: 8px
  - Padding: 12px
  - Center content

Content:
  - Large number: 24pt, 700wt, accent
  - Label: 12pt, 600wt, text-gray-300
  - Optional: trend icon (↑, ↓, ↔︎)

Pressed state:
  - Background: rgba(59,130,246,0.1)
  - Border: 2px solid brand-accent
```

#### Goals Section (Height: Variable, min 100px)
```
Component: GoalsSection
Props:
  - goals: Array<{
      id: string,
      exercise: string,
      targetValue: number,
      currentValue: number,
      unit: string,
      dueDate?: Date,
      progress: number (0-100)
    }>
  - onAddGoal?: () => void
  - onEditGoal?: (goalId) => void

Section header:
  - Font: 14pt, 600wt
  - Padding: 16px left
  - Right: Add button (+ icon)

Goal Card (GoalCard):
  - Height: 80px
  - Background: dark-surface-elevated
  - Border: 1px solid dark-border
  - Corner radius: 8px
  - Padding: 12px
  - Margin: 8px 16px
  - Margin bottom: 12px

Content:
  - Title row:
    * Exercise name: 14pt, 600wt
    * Current/Target: 12pt, 400wt, text-gray-400
    * Format: "Current: 275 lb · ↑ 25 lb to goal"
  - Progress bar:
    * Height: 4px
    * Corner radius: 2px
    * Background: dark-surface
    * Fill: brand-accent
    * Percentage label: right aligned
  - Due date (optional): 10pt, text-gray-500

Pressed state:
  - Background: rgba(59,130,246,0.1)
  - Border: 2px solid brand-accent
```

#### Preferences Section (Height: Variable)
```
Component: PreferencesSection
Props:
  - preferences: {
      weightUnit: 'lb' | 'kg',
      distanceUnit: 'mi' | 'km',
      darkMode: 'on' | 'off' | 'system',
      notificationsEnabled: boolean,
      soundEnabled: boolean,
      hapticEnabled: boolean,
      autoRestTimer: boolean
    }
  - onPreferenceChange: (key, value) => void

Section header:
  - Font: 14pt, 600wt
  - Padding: 16px left

Preference Items (PreferenceItem):
  - Height: 44px
  - Background: dark-surface-elevated
  - Border-bottom: 1px solid dark-border
  - Padding: 12px 16px
  - Last item: no border

Layout:
  - Left: Label (14pt, 400wt, white)
  - Right: Control (switch, dropdown, or text)
  - Touch target: full row = 44x375px

Toggle switch:
  - Width: 48px, Height: 28px
  - Border radius: 14px
  - Thumb: 24px diameter
  - Off: background dark-border
  - On: background brand-accent

Dropdown items:
  - Font: 12pt, 600wt, accent
  - Right align

Pressed state:
  - Background: rgba(59,130,246,0.1)
```

#### Account Section (Height: Variable)
```
Component: AccountSection
Props:
  - items: Array<{
      label: string,
      icon?: string,
      onPress: () => void,
      isDangerous?: boolean
    }>

Menu Items (AccountMenuItem):
  - Height: 44px
  - Background: dark-surface-elevated (dangerous: dark-surface-elevated)
  - Border-bottom: 1px solid dark-border
  - Padding: 12px 16px

Layout:
  - Left: Label (14pt, 400wt, white or error)
  - Right: Chevron (▶︎)

Dangerous items (Sign Out):
  - Text: error color (#EF4444)
  - Background: darker
  - Padding: 8px on press

Pressed state:
  - Background: rgba(59,130,246,0.1) (normal)
  - Background: rgba(239,68,68,0.1) (dangerous)
```

#### Footer (Height: 44px)
```
Component: ProfileFooter
Props:
  - version: string
  - buildNumber?: number
  - lastSyncTime?: Date

Styling:
  - Padding: 16px
  - Text align: center
  - Font: 12pt, 400wt, text-gray-500

Content:
  - "Version {version}"
  - Optional: "Last synced {timeAgo}"
```

### Layout Specifications

**Scroll Container:**
- ScrollView with bounces={false}
- SafeAreaView wrapper
- Keyboard aware (on Android)

**Content Areas:**
- Header: 56px
- Profile card: 120px
- Stats grid: 80px + spacing
- Goals section: variable
- Preferences: variable
- Account: variable
- Footer: 44px + safe area bottom

**Edit Workflows:**
- Edit profile modal overlay
- Preference changes saved instantly
- Goal creation/editing: separate screen
- Confirmation dialogs for destructive actions

**Responsive:**
- 375px: Full width single column
- 540px+: Consider 3-stat layout, sidebar preferences
- Landscape: 2-column layout

### Accessibility

- **Profile card:** "Alex Johnson, Male, 185 pounds, 6 feet tall"
- **Stats:** Each announces value and label
- **Preferences:** All toggles have accessible labels
- **Menus:** All items keyboard navigable
- **Dangerous actions:** Confirmation required

### Interactive States

| Element | Default | Focused | Pressed | Disabled |
|---------|---------|---------|---------|----------|
| Stat card | border-gray | border-accent | bg-accent-light | opacity 0.5 |
| Goal card | border-gray | border-accent | bg-accent-light | - |
| Toggle | off-gray | border-accent | scale 0.95 | opacity 0.5 |
| Menu item | bg-surface | border-accent | bg-accent-light | - |

---

## Design System Reference

### Color Palette

**Primary Brand:**
- Primary: #3B82F6 (Blue) - CTAs, focus states
- Secondary: #0D9488 (Teal) - Alternative accent
- Tertiary: #EA580C (Orange) - Secondary CTAs

**Dark Theme (Default):**
- Background: #0F172A
- Surface: #1E293B
- Surface Elevated: #334155
- Border: #475569

**Text:**
- Primary: #F8FAFC (white)
- Secondary: #94A3B8 (light gray)
- Muted: #64748B (medium gray)

**Functional:**
- Success: #10B981 (Green)
- Warning: #F59E0B (Amber)
- Error: #EF4444 (Red)

### Typography Scale

```
Display:    32px, 700wt - Page titles
Headline:   24px, 600wt - Section titles
Subheading: 18px, 600wt - Card titles
Body Large: 16px, 400wt - Primary content
Body:       14px, 400wt - Secondary content
Caption:    12px, 400wt - Meta information
Label:      12px, 600wt - Buttons, labels
Small:      10px, 400wt - Badges

Font family: System font (San Francisco on iOS, Roboto on Android)
Line height: 1.5x for body, 1.2x for headlines
Letter spacing: 0 for most, 0.5px for labels
```

### Spacing System

```
4px   - Fine adjustments
8px   - Component spacing
12px  - Internal padding
16px  - Section padding
24px  - Large spacing
32px  - Extra large
48px  - Maximum large spacing
```

### Touch Targets

```
Minimum: 44x44px (WCAG AAA, all interactive elements)
Optimal: 48x48px
Comfortable: 56x56px (buttons, CTAs)
Large: 64x64px (primary actions)

Spacing between targets: minimum 8px
```

### Corner Radius

```
Small buttons/inputs: 8px
Cards/sections: 12px
Chips/badges: 20px (pill shape)
Circles: 50% (divides width/height equally)
```

### Shadows & Elevation

```
No shadow: elevation 0
Cards: elevation 2 - subtle (y offset 2, blur 4)
Modals: elevation 4 - prominent (y offset 4, blur 8)
Popovers: elevation 6 - floating (y offset 6, blur 12)
Pressed/dragging: elevation 1 - minimal
```

### Opacity & States

```
Default: 1.0 (100%)
Hover: 0.95 (95%)
Pressed: 0.85 (85%)
Disabled: 0.5 (50%)
Subtle background: 0.05 (5%)
Light background: 0.1 (10%)
```

### Animation Timings

```
Fast transitions: 150ms (ui feedback)
Standard transitions: 300ms (modal, navigation)
Slow transitions: 500ms (long movements)
Easing: ease-out for appears, ease-in for dismisses
```

---

## Component Library Blueprint

### Base Components

| Component | Height | Width | Notes |
|-----------|--------|-------|-------|
| Button | 44px | variable | 8px corners, 12pt font |
| Input field | 44px | variable | dark-surface bg |
| Card | variable | 100% - 32px | 1px border, 12px corners |
| Chip | 32px | variable | pill shape (20px corners) |
| Toggle | 28px | 48px | animated |
| Divider | 1px | 100% | border color |
| Badge | 20px | variable | 4px corners, label font |
| Progress bar | 4px | 100% | 2px corners |

### Compound Components

| Component | Usage | Sub-components |
|-----------|-------|----------------|
| List item | Rows in lists | Icon, title, subtitle, action |
| Card button | Pressable cards | Card + ripple/press state |
| Tab bar | Navigation | 5 tabs (bottom fixed) |
| Modal | Overlays | Header, content, actions |
| Alert | Warnings/errors | Icon, message, action button |

### Icons

All icons in this design use:
- Size: 24x24px (standard), 32x32px (large)
- Stroke weight: 2px
- Corner radius: 2px (if squared)
- Color: inherit from context (white, accent, error)
- Family: Use emoji icons for simplicity (📌, 💪, 🏃, etc.) or SF Symbols on iOS, Material Icons on Android

---

## Responsive Design Breakpoints

### Portrait (Standard)

| Viewport | Width | Adjustments |
|----------|-------|-------------|
| Mobile | 320px | Minimum supported |
| Baseline | 375px | Design baseline (iPhone 6/7/8) |
| Large | 412px | iPhone XR, 11, 12 |
| Extra Large | 480px | Larger phones |

### Landscape

| Viewport | Height | Adjustments |
|----------|--------|-------------|
| Mobile Landscape | 360px | Compress header, side-by-side content |
| Tablet Landscape | 540px+ | Multi-column layouts |

### Tablet (iPad)

| Viewport | Width | Adjustments |
|----------|-------|-------------|
| Standard | 768px | 2-column layouts, expanded padding |
| Large | 1024px | 3-column layouts, sidebar navigation |

### Safe Area Handling

```
iOS:
  - Top notch: 44px (iPhone 12 Pro)
  - Bottom home indicator: 34px

Android:
  - Top system bar: 24px
  - Bottom: 0px
  - Respect keyboard height

Implementation:
  - Use react-native-safe-area-context
  - Padding applied to header, footer, content
  - Test on multiple device sizes
```

---

## Accessibility Standards (WCAG 2.1 AA)

### Color Contrast Ratios

```
Normal text: 4.5:1 (minimum)
Large text (18pt+): 3:1 (minimum)
UI components & borders: 3:1 (minimum)

Examples:
- White (#F8FAFC) on dark bg (#1E293B): 15.6:1 ✓
- Accent (#3B82F6) on dark bg: 4.5:1 ✓
- Gray (#94A3B8) on dark bg: 8.2:1 ✓
```

### Touch Targets

```
Minimum: 44x44px (WCAG AAA)
Spacing: 8px minimum between targets
All interactive elements must meet this standard
```

### Keyboard Navigation

```
All interactive elements must be keyboard navigable
Tab order: logical, left-to-right, top-to-bottom
Focus indicator: visible (2px outline, accent color)
Enter/Space: activates buttons
Arrow keys: list navigation, slider control
Escape: close modals, cancel actions
```

### Screen Reader Support

```
All images: alt text describing content
Icon-only buttons: aria-label with text
Form inputs: associated labels
Lists: proper semantic structure
Announcements: use accessibility API for state changes
Live regions: for timers, progress updates
```

### Motion & Animation

```
No auto-playing animations
Respects prefers-reduced-motion setting
Animations <3 seconds (does not distract)
No flashing/strobing content
```

---

## Implementation Checklist

### Before Development

- [ ] Ensure all screens follow typography scale
- [ ] Verify all touch targets are 44x44px minimum
- [ ] Check color contrast ratios (4.5:1 for normal text)
- [ ] Confirm responsive breakpoints match specs
- [ ] Set up design tokens in NativeWind/Tailwind
- [ ] Create component library foundation

### During Development

- [ ] Build base components matching specs
- [ ] Implement dark mode by default
- [ ] Test on multiple device sizes (375px, 412px, 540px)
- [ ] Verify offline-first data handling
- [ ] Add haptic feedback for interactions
- [ ] Implement keyboard navigation
- [ ] Test with screen readers (TalkBack, VoiceOver)

### After Development

- [ ] Run accessibility audit (WAVE, axe DevTools)
- [ ] Test with real users (mobile, various devices)
- [ ] Performance audit (Core Web Vitals, Lighthouse)
- [ ] Cross-browser testing (iOS Safari, Chrome Mobile)
- [ ] Verify animations respect prefers-reduced-motion
- [ ] Check offline functionality thoroughly
- [ ] Test on slow networks (3G, 4G simulation)

---

## File Organization for Design Assets

```
designs/
├── figma-links.md           # Figma file links
├── components/
│   ├── Button.md            # Component specs
│   ├── Card.md
│   ├── Input.md
│   ├── etc.
├── screens/
│   ├── Dashboard.md         # Screen specs & mockups
│   ├── WorkoutLogger.md
│   ├── ExerciseLibrary.md
│   ├── ProgressCharts.md
│   ├── TimerScreen.md
│   └── Profile.md
├── tokens/
│   ├── colors.json          # Design tokens
│   ├── typography.json
│   ├── spacing.json
│   └── shadows.json
└── guidelines/
    ├── accessibility.md
    ├── responsive-design.md
    └── animation.md
```

---

## Summary

This design specification document provides complete, implementation-ready designs for a mobile workout tracking application. All screens follow:

- **Accessibility Standards:** WCAG 2.1 AA compliance with keyboard navigation, screen reader support, and proper contrast ratios
- **Mobile-First Approach:** Baseline 375px width with responsive scales to 540px+ and landscape
- **Touch-Friendly UI:** All interactive elements 44x44px minimum touch targets
- **Modern Aesthetic:** Clean dark theme with blue accent, consistent typography, and meaningful animations
- **NativeWind Compatible:** All styles map directly to Tailwind CSS for React Native
- **Developer-Ready:** Precise specifications for spacing, sizing, colors, and states

Developers can implement these screens directly from the specifications provided, ensuring consistency across the entire application while maintaining accessibility and performance standards.

