# Design System Quick Reference Card

**For developers:** Print this or keep it open while building. All key specs in one place.

---

## Color Tokens

```
ACCENT (CTA, Focus):     #3B82F6  bg-blue-500
SECONDARY:               #0D9488  bg-teal-500
TERTIARY (Alt CTA):      #EA580C  bg-orange-500

BACKGROUNDS:
  Primary:               #0F172A  bg-slate-950
  Surface:               #1E293B  bg-slate-900
  Elevated:              #334155  bg-slate-800

TEXT:
  Primary:               #F8FAFC  text-white
  Secondary:             #94A3B8  text-gray-400
  Muted:                 #64748B  text-gray-500

STATUS:
  Success:               #10B981  bg-green-500
  Warning:               #F59E0B  bg-amber-500
  Error:                 #EF4444  bg-red-500
```

---

## Typography Scale

| Style | Size | Weight | Usage | CSS |
|-------|------|--------|-------|-----|
| Display | 32px | 700 | Page titles | text-display |
| Headline | 24px | 600 | Section titles | text-headline |
| Subheading | 18px | 600 | Card titles | text-subheading |
| Body Large | 16px | 400 | Primary content | text-body-lg |
| Body | 14px | 400 | Secondary content | text-body |
| Caption | 12px | 400 | Meta info | text-caption |
| Label | 12px | 600 | Buttons | text-label |
| Small | 10px | 400 | Badges | text-small |

---

## Spacing & Sizing

```
SPACING (use consistently):
4px:  xs  (fine adjustments)
8px:  sm  (component gaps)
12px: md  (internal padding)
16px: lg  (section padding)
24px: xl  (large spacing)
32px: 2xl (extra large)
48px: 3xl (max large)

TOUCH TARGETS (minimum 44x44px):
Button:        48px height
Input:         44px height
Card:          80px height
Icon button:   44x44px
Tab:           56px height
Toggle:        48x28px

CORNER RADIUS:
Buttons:       8px   (rounded-lg)
Cards:         12px  (rounded-xl)
Chips:         20px  (rounded-full)
Circles:       50%   (rounded-full)

SHADOWS (elevation):
None:          0
SM:            elevation 2
BASE:          elevation 4
MD:            elevation 6
LG:            elevation 8
```

---

## Common Tailwind Classes

```
LAYOUT:
flex, flex-row, flex-col, items-center, justify-center
w-full, h-full, w-screen, h-screen
px-4, py-3, p-4 (padding: p{direction}-{size})
mx-2, my-3, m-4 (margin)

STYLING:
bg-blue-500, bg-slate-900 (backgrounds)
text-white, text-gray-400 (text colors)
border, border-gray-700 (borders)
rounded-lg, rounded-full (corner radius)
shadow-lg (shadows)

STATE MODIFIERS:
active:opacity-85 (pressed)
focus:border-blue-500 (focused)
disabled:opacity-50 (disabled)
opacity-50, opacity-100 (explicit opacity)

RESPONSIVE:
sm: sm:flex (small screens)
md: md:flex-row (medium screens)
lg: lg:w-1/2 (large screens)
portrait: portrait:flex-col
landscape: landscape:flex-row

SAFE AREA:
pt-safe, pb-safe, pl-safe, pr-safe
```

---

## Component Sizing Chart

| Component | Height | Width | Notes |
|-----------|--------|-------|-------|
| Button (small) | 40px | 100px+ | 12pt font |
| Button (medium) | 48px | 120px+ | 14pt font |
| Button (large) | 56px | 140px+ | 16pt font |
| Icon button | 44px | 44px | 24x24 icon |
| Input field | 44px | 100% | 14pt font |
| Toggle switch | 28px | 48px | animated |
| Card | 80px+ | 100% | flexible height |
| Tab bar | 56px | 100% | + safe area |
| Header | 48px | 100% | + safe area |
| Chip | 32px | auto | 20px radius |
| Badge | 20px | auto | 4px radius |

---

## Screen Spacing Reference

```
DASHBOARD SCREEN (375px wide, 812px tall):
Safe area top: 8px
Header: 72px
CTA Button: 56px
Stat Grid: 120px
Activity Section: 280px
Tab Bar: 56px + 34px safe

PORTRAIT MARGINS:
Left/Right: 16px padding
Between sections: 16px gap
Between list items: 8px gap

LANDSCAPE ADJUSTMENTS:
Sidebar width: ~40% of screen
Content width: ~60% of screen
Padding: 24px (increased)
```

---

## Responsive Breakpoints

```
PORTRAIT:
375px  - Baseline (iPhone 6/7/8)
412px  - Large phones (XR, 11)
480px  - Extra large phones

LANDSCAPE:
360px height - Mobile landscape
800px+ height - Tablet landscape

SPECIFIC ADJUSTMENTS:
< 375px: Single column, reduce padding to 12px
375-412px: Full design as specified
412-480px: Full design, no changes needed
480px+: Consider 2-column layouts
800px+: Multi-column layouts allowed
```

---

## Accessibility Checklist (Quick)

```
✓ Color Contrast: 4.5:1 minimum for normal text
✓ Touch Targets: 44x44px minimum for all interactive
✓ Labels: All inputs and buttons have labels
✓ Focus: Visible 2px outline in accent color
✓ Keyboard: Tab/Enter for buttons, Tab for inputs
✓ Icons: Text labels for icon-only buttons
✓ Screens: Screen reader test on iOS/Android
✓ Motion: Respect prefers-reduced-motion
✓ Colors: Don't use color alone for status
```

---

## Button Quick Guide

```
PRIMARY BUTTON:
<Button
  title="Start Workout"
  variant="primary"
  size="large"
  onPress={handlePress}
/>
Renders: Blue bg, white text, 56px height

SECONDARY BUTTON:
variant="secondary"
Renders: Slate-700 bg, gray-300 text

DANGER BUTTON:
variant="danger"
Renders: Red-500 bg, white text

DISABLED STATE:
disabled={true}
Renders: 50% opacity, non-interactive

Loading STATE:
loading={true}
Renders: Spinner instead of text
```

---

## Input Quick Guide

```
BASIC INPUT:
<TextInput
  label="Reps"
  placeholder="Enter reps"
  value={reps}
  onChangeText={setReps}
  keyboardType="numeric"
/>

WITH ERROR:
error="Must be > 0"
Renders: Red border, error text below

WITH HINT:
hint="Max 3 digits"
Renders: Gray text below input

WITH ICON:
icon={<RepIcon />}
Renders: Icon on left side
```

---

## Common Interactive States

```
PRESSED (all pressable elements):
opacity-85 for 150ms duration

FOCUSED (keyboard):
border-blue-500 (2px)
shadow-md for elevation

DISABLED (all):
opacity-50
pointer-events: none

ACTIVE (tab selected):
text-blue-500
icon-blue-500

LOADING:
show spinner
disable onPress
opacity-70
```

---

## Safe Area Handling

```
// Top safe area (status bar):
paddingTop: insets.top (usually 8-44px)

// Bottom safe area (home indicator):
paddingBottom: insets.bottom (usually 0-34px)

// Side safe areas:
paddingLeft: insets.left
paddingRight: insets.right

// Always use react-native-safe-area-context
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// In components:
const insets = useSafeAreaInsets();
<ScrollView contentInset={{ bottom: insets.bottom }}>
```

---

## Animation Timing

```
STANDARD DURATIONS:
Fast reaction: 150ms (button press)
Standard transition: 300ms (modal appear)
Slow transition: 500ms (large movements)

EASING FUNCTIONS:
Appearing: Easing.out(Easing.cubic)
Disappearing: Easing.in(Easing.cubic)
Continuous: Easing.linear

NATIVE DRIVER:
Always use useNativeDriver: true
Offloads animation to native thread
Improves 60fps performance
```

---

## List Performance Tips

```
// Optimize FlatList:
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  removeClippedSubviews={true}
  initialNumToRender={8}
  maxToRenderPerBatch={10}
  windowSize={10}
  onEndReachedThreshold={0.5}
/>

// Memoize list items:
export const Item = memo(ItemComponent);

// Lazy load on scroll:
onEndReached={loadMoreItems}
```

---

## Image Sizing

```
Avatar: 64x64px (rounded 32px)
Icon: 24x24px (standard), 32x32px (large)
Icon button icon: 24x24px
Thumbnail: 80x80px
Hero image: 100% width

// Always specify dimensions:
<Image
  source={{ uri: url }}
  style={{ width: 64, height: 64 }}
/>
```

---

## Form Validation Pattern

```
const [value, setValue] = useState("");
const [error, setError] = useState("");

const handleChange = (text) => {
  setValue(text);
  // Validate on change or onBlur
};

const handleBlur = () => {
  if (!value) {
    setError("Required");
  } else if (value < 0) {
    setError("Must be positive");
  } else {
    setError("");
  }
};

<TextInput
  value={value}
  onChangeText={handleChange}
  onBlur={handleBlur}
  error={error}
/>
```

---

## Focus Management

```
// Import:
import { AccessibilityInfo } from 'react-native';

// Set focus on element:
const viewRef = useRef(null);
AccessibilityInfo.setAccessibilityFocus(
  findNodeHandle(viewRef.current)
);

// When opening modal:
useEffect(() => {
  // Focus on modal title
  setAccessibilityFocus();
}, [isOpen]);
```

---

## Screen Reader Announcements

```
// Announce state change:
AccessibilityInfo.announceForAccessibility(
  "Set completed successfully"
);

// On timer end:
"Timer complete, 3 minutes 45 seconds elapsed"

// On error:
"Error: Please enter a valid number"

// On success:
"Workout saved successfully"
```

---

## Testing Commands

```
// Run all tests:
npm test

// Run specific test:
npm test Button.test.tsx

// Check accessibility:
npm run audit:a11y

// Check TypeScript:
npm run type-check

// Lint styles:
npm run lint
```

---

## Common Mistakes to Avoid

```
✗ Using arbitrary pixel values instead of design tokens
✗ Touch targets < 44x44px
✗ Text without color contrast (< 4.5:1)
✗ Buttons without labels
✗ Images without alt text
✗ Animations without easing
✗ Lists without key extractor
✗ Hardcoded colors (use tokens)
✗ No safe area handling
✗ FlatList without optimization
```

---

## Quick File Templates

### New Component Template
```typescript
// src/components/MyComponent.tsx
import React from 'react';
import { View, Pressable, Text } from 'react-native';
import { COLORS, SPACING, TOUCH_TARGET } from '../constants/design-tokens';

interface MyComponentProps {
  title: string;
  onPress?: () => void;
}

export const MyComponent: React.FC<MyComponentProps> = ({ title, onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      className="bg-slate-900 rounded-lg p-4"
      style={{ minHeight: TOUCH_TARGET.MIN }}
      accessible
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Text className="text-body text-white">{title}</Text>
    </Pressable>
  );
};
```

### New Screen Template
```typescript
// src/screens/MyScreen.tsx
import React from 'react';
import { View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const MyScreen = () => {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
      <ScrollView contentInset={{ bottom: insets.bottom }}>
        {/* Content */}
      </ScrollView>
    </SafeAreaView>
  );
};
```

---

## Design Token Imports

```typescript
// Always import from design-tokens.ts:
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  TOUCH_TARGET,
  BORDER_RADIUS,
  SHADOW
} from '../constants/design-tokens';

// Use in components:
<View style={{ padding: SPACING.LG }}>
  <Text style={{ color: COLORS.TEXT_PRIMARY }}>Hello</Text>
</View>
```

---

## Useful Resources

- **Main Spec:** docs/11-DESIGN-SPECIFICATIONS.md
- **Implementation:** docs/12-DESIGN-IMPLEMENTATION-GUIDE.md
- **Components:** docs/13-COMPONENT-INVENTORY.md
- **Overview:** docs/00-DESIGN-SYSTEM-OVERVIEW.md

---

## Quick Links for Common Tasks

```
Change primary color:
→ tailwind.config.js (line 14)
→ src/constants/design-tokens.ts (COLORS.ACCENT)

Adjust touch target size:
→ src/constants/design-tokens.ts (TOUCH_TARGET)

Add new component:
→ Reference 13-COMPONENT-INVENTORY.md
→ Use template above
→ Add tests
→ Update inventory

Update typography:
→ tailwind.config.js (fontSize section)
→ src/constants/design-tokens.ts (TYPOGRAPHY)

Change spacing:
→ tailwind.config.js (spacing section)
→ src/constants/design-tokens.ts (SPACING)
```

---

**Printed:** March 6, 2026
**Version:** 1.0

Keep this nearby while developing! 📱

