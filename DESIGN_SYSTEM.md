# macOS 98 Design System v2

**Official Visual Specification**
**Version**: 2.0
**Last Updated**: 2025-11-22
**Status**: ✅ Active

This document is the **single source of truth** for all visual design decisions in the macOS 98 project. It defines the rules, constraints, and APIs that all components must follow.

**⚠️ IMPORTANT**: This document defines **how to style** components. For **how to structure** components (DOM patterns, zones, inheritance), see **[Component Blueprints](COMPONENT_BLUEPRINTS.md)**.

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Visual Physics](#visual-physics)
3. [Token System](#token-system)
4. [Bevel System](#bevel-system)
5. [Typography Rules](#typography-rules)
6. [Layout Rules](#layout-rules)
7. [Mixin API Reference](#mixin-api-reference)
8. [Component Patterns](#component-patterns)
9. [Forbidden Patterns](#forbidden-patterns)

---

## Core Principles

### 1. Pixel Realism (OS9 Authenticity)

The design must approximate authentic Mac OS 8-9 visual behavior:

**MUST:**
- Use solid 2px pixel shadows (no blur)
- Use diagonal title bar stripe patterns (90deg, 2px wide alternating)
- Use gray 3D beveled buttons (light top-left, dark bottom-right)
- Use strong contrast menu selection (black background, white text)
- Use instant state changes (no transitions)

**FORBIDDEN:**
- CSS `blur()` filters
- Modern `drop-shadow()` effects
- Gradient transitions
- CSS animations or transitions
- Border radius (all corners must be square)

### 2. Token-Driven Architecture

**ALL visual properties MUST originate from tokens.**

**FORBIDDEN** in component files:
- Literal hex colors (`#000`, `#fff`, `#ccc`, etc.)
- Literal spacing values (`8px`, `10px`, etc.) — exception: `0`
- Literal font-size values (`12px`, `14px`, etc.)
- Literal border definitions

**REQUIRED:**
- Import tokens: `@use '@/styles/tokens' as *;`
- Reference tokens: `tokens.$color-*`, `tokens.$space-*`, etc.

### 3. Mixin-Based Framework

**UI patterns MUST use mixins, not duplicate code.**

**VIOLATION EXAMPLES:**
```scss
// ❌ WRONG - duplicating bevel logic
.button {
  border-top: 1px solid #fff;
  border-left: 1px solid #fff;
  border-right: 1px solid #000;
  border-bottom: 1px solid #000;
}

// ✅ CORRECT - using mixin
.button {
  @include mixins.bevel-outset;
}
```

---

## Visual Physics

These rules define the "physical laws" of the OS9 UI. **Violations break visual consistency.**

### Rule 1: Shadow Physics

**All shadows are solid pixel offsets, no blur.**

```scss
// ✅ CORRECT - solid 2px offset, no blur
box-shadow: 2px 2px 0px rgba(0, 0, 0, 0.2);

// ❌ WRONG - blur radius
box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
```

**Defined Shadows:**
- `$shadow-window`: 2px 2px, 20% opacity
- `$shadow-menu`: 2px 2px, 20% opacity
- `$shadow-dialog`: 4px 4px, 50% opacity (heavier for modals)
- `$shadow-display-inset`: inset 1px 1px 2px, 20% opacity (calculator display)

**Usage Rules:**
- Windows: MUST use `$shadow-window`
- Menus/dropdowns: MUST use `$shadow-menu`
- Modal dialogs: MUST use `$shadow-dialog`
- Input fields: MUST use `$shadow-display-inset`

### Rule 2: Border Physics

**All borders are 1px or 2px solid, no gradients.**

```scss
// Border widths
$border-width-thin: 1px;   // Standard borders
$border-width-thick: 2px;  // Window frames, thick buttons
```

**Usage Rules:**
- Window outer frames: MUST use `$border-width-thin` (not 2px!)
- Window content frames: MUST use `$border-width-thin`
- Toolbar buttons: MUST use `$border-width-thick`
- Dialog buttons: MUST use `$border-width-thick`
- Menu items: NO borders (use background color changes)

### Rule 3: Inset Depth Rules

**Window content frames MUST use 2-layer inset.**

The authentic OS9 look requires **double inset**:

```scss
// Layer 1: Border inset (top-left dark, bottom-right light)
border-top: 1px solid $color-border-gray;
border-left: 1px solid $color-border-gray;
border-right: 1px solid $color-border-light;
border-bottom: 1px solid $color-border-light;

// Layer 2: Inner shadow inset
box-shadow:
  inset 1px 1px 0 $color-border-dark,
  inset -1px -1px 0 $color-border-gray;
```

**DO NOT** create single-layer insets for content frames. Use `@mixin window-content-frame`.

### Rule 4: Stripe Pattern Rules

**Title bar stripes MUST be 90deg, 2px wide, alternating.**

```scss
// ✅ CORRECT - 90deg horizontal stripes
background: repeating-linear-gradient(
  90deg,
  $color-window-bg,
  $color-window-bg 2px,
  $color-border-dark 2px,
  $color-border-dark 4px
);

// ❌ WRONG - 45deg diagonal (too modern)
background: repeating-linear-gradient(45deg, ...);
```

**Active vs Inactive:**
- **Active window**: Black stripes (`$color-border-dark`)
- **Inactive window**: Gray stripes (`$color-stripe-alt: #aaa`)

---

## Token System

### Color Tokens

**Semantic Organization:**

#### Borders
```scss
$color-border-light: var(--sys-border-light);  // #fff - Top-left bevel highlight
$color-border-dark: var(--sys-border-dark);    // #000 - Bottom-right bevel shadow
$color-border-gray: var(--sys-border-gray);    // #808080 - Mid-tone borders
```

**Usage Rules:**
- Outset bevel top-left: MUST use `$color-border-light`
- Outset bevel bottom-right: MUST use `$color-border-gray`
- Inset bevel top-left: MUST use `$color-border-gray`
- Inset bevel bottom-right: MUST use `$color-border-light`
- Flat borders: MUST use `$color-border-dark`

#### Surfaces
```scss
$color-window-bg: var(--surface-window);     // #ddd - Main window chrome
$color-toolbar-bg: var(--surface-toolbar);   // #c0c0c0 - Toolbar gray
$color-surface: var(--surface-input);        // #fff - White input/content surfaces
```

**Usage Rules:**
- Window outer chrome: MUST use `$color-window-bg`
- Toolbars (Finder, TextEditor): MUST use `$color-toolbar-bg`
- Input fields, calculator display: MUST use `$color-surface`
- Window content area: MUST use `$color-surface`

#### Text
```scss
$color-text: var(--text-primary);           // #000 - Primary text
$color-text-disabled: var(--text-disabled); // #808080 - Disabled text
```

**Usage Rules:**
- All body text: MUST use `$color-text`
- Disabled menu items: MUST use `$color-text-disabled`
- Active title bar text: MUST use `$color-surface` (white on black)

#### Interactive States
```scss
$color-selection-bg: var(--sys-highlight);  // #000080 - Blue selection (Finder, text)
$color-menu-hover-bg: $color-border-dark;   // #000 - Menu hover (black)
```

**Usage Rules:**
- Finder selected items: MUST use `$color-selection-bg`
- Menu bar hover: MUST use `$color-menu-hover-bg` (black, not blue!)
- Menu dropdown hover: MUST use `$color-selection-bg`

### Spacing Tokens

**2px Grid System:**

All spacing follows a 2px grid (no odd values except where legacy):

```scss
$space-2: 2px;   // Minimal chrome padding
$space-4: 4px;   // Tight padding (title bar, buttons)
$space-6: 6px;   // Compact layouts
$space-8: 8px;   // Standard padding (content, toolbars)
$space-12: 12px; // Generous padding (menu items)
$space-16: 16px; // Large gaps (icon grids)
$space-20: 20px; // Button horizontal padding
```

**Usage Rules:**
- Window chrome padding: MUST use `$space-2`
- Title bar padding: MUST use `$space-4`
- Toolbar padding: MUST use `$space-4` vertical, `$space-8` horizontal
- Content padding: MUST use `$space-8` minimum
- Menu item padding: MUST use `$space-12` horizontal
- Finder icon grid gap: MUST use `$space-16`

**FORBIDDEN:**
- Odd pixel values (1px, 3px, 5px) except `$space-1` for borders
- Spacing > 20px without a defined token

### Sizing Tokens

**Component Heights:**

```scss
$size-18: 18px;  // Title bar height
$size-20: 20px;  // Status bar min-height
$size-22: 22px;  // Menu bar height
$size-24: 24px;  // Toolbar button size
$size-28: 28px;  // Toolbar min-height
```

**Usage Rules:**
- Title bars: MUST be exactly `$size-18`
- Menu bar: MUST be exactly `$size-22`
- Toolbar: MUST be minimum `$size-28`
- Status bar: MUST be minimum `$size-20`

**Icon Sizes:**

```scss
$size-16: 16px;  // Small icon (list view)
$size-48: 48px;  // Large icon (icon view)
$size-64: 64px;  // Desktop icon
```

### Typography Tokens

**Font Size Mapping:**

```scss
$font-size-10: 10px;  // Menu dropdown items
$font-size-11: 11px;  // Title bars, toolbar buttons, Finder labels
$font-size-12: 12px;  // Menu bar, body text, table content
$font-size-14: 14px;  // Standard buttons, dialog text
$font-size-18: 18px;  // Icon placeholders
```

**Usage Rules:**

| Element | Font Size | Token |
|---------|-----------|-------|
| Window title bar | 11px | `$font-size-11` |
| Menu bar items | 12px | `$font-size-12` |
| Menu dropdown items | 10px | `$font-size-10` |
| Standard buttons | 14px | `$font-size-14` |
| Toolbar buttons | 11px | `$font-size-11` |
| Finder labels | 11px | `$font-size-11` |
| Body text | 12px | `$font-size-12` |

**Line Height Rules:**

```scss
$line-height-tight: 1.0;    // Title bars (no extra space)
$line-height-normal: 1.2;   // Body text (compact)
$line-height-relaxed: 1.4;  // Comfortable reading (TextEditor)
```

**Usage Rules:**
- Title bars: MUST use `$line-height-tight`
- Menus: MUST use `$line-height-normal`
- Body text: MUST use `$line-height-normal`
- TextEditor content: MAY use `$line-height-relaxed`

---

## Bevel System

The bevel system is the foundation of the OS9 3D aesthetic. **All 3D effects MUST use these mixins.**

### Core Bevel Rules

**Light Source Direction: TOP-LEFT**

All bevels simulate light coming from the top-left corner:

```
Light (top-left) ⬇️⬇️⬇️
           ┌─────────┐  ← Light border
           │ RAISED  │
           │ SURFACE │
           └─────────┘  ← Dark border (shadow)
```

### Bevel Direction Matrix

| Mixin | Top | Left | Bottom | Right | Effect | Use Case |
|-------|-----|------|--------|-------|--------|----------|
| `bevel-outset` | Light | Light | Gray | Gray | Raised | Buttons (default), toolbars |
| `bevel-inset` | Gray | Gray | Light | Light | Sunken | Pressed buttons, input fields |
| `border-flat` | Dark | Dark | Dark | Dark | Flat | Window frames, separators |

### Mixin: `bevel-outset`

**Purpose**: Create raised 3D effect (button appears to pop out).

**Signature**:
```scss
@mixin bevel-outset($width: tokens.$border-width-thin)
```

**Parameters**:
- `$width` (optional): Border width, default `1px`. Use `tokens.$border-width-thick` (2px) for toolbar buttons.

**Output**:
```scss
border-top: $width solid $color-border-light;     // #fff
border-left: $width solid $color-border-light;    // #fff
border-right: $width solid $color-border-gray;    // #808080
border-bottom: $width solid $color-border-gray;   // #808080
```

**Usage Rules**:
- ✅ Standard buttons (Calculator, dialogs)
- ✅ Toolbar buttons (default state)
- ✅ Raised toolbar strips
- ❌ Pressed buttons (use `bevel-inset`)
- ❌ Input fields (use `bevel-inset`)

**Example**:
```scss
.button {
  @include mixins.bevel-outset(tokens.$border-width-thick);
  // Produces 2px light top-left, 2px gray bottom-right
}
```

### Mixin: `bevel-inset`

**Purpose**: Create sunken 3D effect (button appears pressed in).

**Signature**:
```scss
@mixin bevel-inset($width: tokens.$border-width-thin)
```

**Parameters**:
- `$width` (optional): Border width, default `1px`.

**Output**:
```scss
border-top: $width solid $color-border-gray;     // #808080
border-left: $width solid $color-border-gray;    // #808080
border-right: $width solid $color-border-light;  // #fff
border-bottom: $width solid $color-border-light; // #fff
```

**Usage Rules**:
- ✅ Pressed/active buttons
- ✅ Input fields (text fields, calculator display)
- ✅ Window content frames (outer layer)
- ❌ Default button state (use `bevel-outset`)

**Example**:
```scss
.button:active {
  @include mixins.bevel-inset(tokens.$border-width-thick);
  // Inverts the bevel for pressed effect
}
```

### Mixin: `border-flat`

**Purpose**: Flat dark border with no 3D effect.

**Signature**:
```scss
@mixin border-flat($width: tokens.$border-width-thin)
```

**Parameters**:
- `$width` (optional): Border width, default `1px`.

**Output**:
```scss
border: $width solid $color-border-dark;  // #000 on all sides
```

**Usage Rules**:
- ✅ Window outer frames
- ✅ Menu dropdowns
- ✅ Separators (when combined with height)
- ❌ Buttons (need 3D bevel)
- ❌ Toolbars (need subtle bevel)

### Mixin: `pressed-state`

**Purpose**: Apply pressed visual state (inverted bevel + darkening).

**Signature**:
```scss
@mixin pressed-state($width: tokens.$border-width-thin)
```

**Output**:
```scss
@include bevel-inset($width);
filter: brightness(0.95);  // Slight darkening
```

**Usage Rules**:
- ✅ Button `:active` pseudo-class
- ✅ Toggled toolbar buttons (`.active` class)
- ❌ Hover state (use `hover-brighten` instead)

### Mixin: `hover-brighten`

**Purpose**: Subtle hover effect for toolbar surfaces.

**Signature**:
```scss
@mixin hover-brighten
```

**Output**:
```scss
&:hover {
  filter: brightness(1.05);  // 5% brighter
}
```

**Usage Rules**:
- ✅ Toolbar buttons (subtle feedback)
- ✅ Toolbar toggle buttons
- ❌ Menu items (use background color change)
- ❌ Standard buttons (no hover effect in OS9)

**Important**: OS9 did NOT have hover effects on standard buttons. Only toolbars may use hover.

---

## Typography Rules

### Font Family Hierarchy

```scss
$font-system: 'Chicago', 'Geneva', sans-serif;
$font-mono: 'Courier New', monospace;
```

**Usage Rules**:
- **ALL UI text**: MUST use `$font-system`
- **Code/monospace**: MUST use `$font-mono` (TextEditor, code blocks)
- **FORBIDDEN**: Custom fonts, web fonts (except Chicago fallback)

### Font Size Scenarios

**Strict Mapping Table:**

| Component | Size | Token | Weight | Usage |
|-----------|------|-------|--------|-------|
| Window title bar | 11px | `$font-size-11` | Bold | Title text in active/inactive windows |
| Menu bar | 12px | `$font-size-12` | Normal | Top menu bar items (File, Edit, View) |
| Menu dropdown | 10px | `$font-size-10` | Normal | Dropdown menu items |
| Standard button | 14px | `$font-size-14` | Bold | OK/Cancel buttons, dialog actions |
| Toolbar button | 11px | `$font-size-11` | Normal | Finder view toggles, tool buttons |
| Finder label | 11px | `$font-size-11` | Normal | Icon view file names |
| Table content | 12px | `$font-size-12` | Normal | Finder list view, data grids |
| Status bar | 11px | `$font-size-11` | Normal | Bottom status text |
| Calculator display | 24px | `$font-size-24` | Normal | Large number display |

**VIOLATION DETECTION**:
If you see `font-size: 13px` or any unlisted size → **BUG**. All sizes must map to tokens.

### Line Height Standards

**OS9 text is compact** (not modern relaxed spacing):

```scss
$line-height-tight: 1.0;    // Title bars (exactly font-size height)
$line-height-normal: 1.2;   // Most UI text (20% extra)
$line-height-relaxed: 1.4;  // Reading text only (40% extra)
```

**Usage Rules**:
- Title bars: `$line-height-tight` (no wasted vertical space)
- Menus: `$line-height-normal`
- Buttons: `$line-height-normal`
- Body text: `$line-height-normal`
- TextEditor: `$line-height-relaxed` (readability)

**FORBIDDEN**:
- CSS default `line-height: 1.5` (too modern/loose)
- Unitless values without token reference

---

## Layout Rules

### Spacing Distribution Rules

**When to use each spacing token:**

| Token | Use Case | Examples |
|-------|----------|----------|
| `$space-2` | Window chrome micro-padding | Window frame inner padding |
| `$space-4` | Tight padding, compact layouts | Title bar padding, toolbar vertical padding |
| `$space-6` | Compact content spacing | (Rarely used, legacy) |
| `$space-8` | Standard content padding | Content area padding, toolbar horizontal padding |
| `$space-12` | Generous interactive padding | Menu item horizontal padding |
| `$space-15` | Menu dropdown item padding | Dropdown horizontal padding |
| `$space-16` | Icon grid gaps | Finder icon view spacing |
| `$space-20` | Button horizontal padding | Dialog button padding |

**Forbidden Values**:
- `padding: 10px` → Use `$space-8` or `$space-12`
- `gap: 14px` → No 14px token exists, choose `$space-12` or `$space-16`

### Grid vs Flex Rules

**Grid** (use for):
- Finder icon view (fixed-size grid cells)
- Calculator button grid (uniform rows/columns)
- Desktop icon layout (predictable spacing)

**Flex** (use for):
- Window chrome (title bar, content stacking)
- Toolbars (horizontal item flow)
- Menu bars (left-to-right item distribution)
- Status bars (text + metadata layout)

**FORBIDDEN**:
- Mixing grid and flex for same layout level
- Nested grids (causes alignment issues)

### Finder Layout Rules

**Icon View**:
```scss
grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
gap: $space-16;  // Must be 16px for authentic spacing
```

**List View**:
- Table headers: MUST have `border-bottom: 2px solid $color-border-gray`
- Row hover: MUST lighten background (not selection color)
- Row selected: MUST use `$color-selection-bg` (blue)

### Desktop Icon Label Rules

**2-Line Wrap Standard**:

```scss
.label {
  text-align: center;
  overflow-wrap: break-word;  // Modern equivalent of word-break
  max-width: $size-80;         // Constrain to ~10 characters per line
  font-size: $font-size-11;
}
```

**Rules**:
- Labels MUST wrap at word boundaries
- MUST NOT exceed 2 lines (visual constraint, not enforced by CSS)
- MUST center-align
- MUST use `overflow-wrap: break-word` (NOT `word-break: break-all`)

---

## Mixin API Reference

### Window System Mixins

#### `window-chrome`

**Purpose**: Outer window container styling.

**Signature**:
```scss
@mixin window-chrome
```

**Output**:
```scss
position: absolute;
background-color: $color-window-bg;           // #ddd
@include border-flat($border-width-thin);     // 1px black border
box-shadow: $shadow-window;                   // 2px 2px solid shadow
display: flex;
flex-direction: column;
padding: $border-width-thin;                  // 1px inner padding
```

**Usage**:
```scss
.window {
  @include mixins.window-chrome;
}
```

**Must be paired with**:
- `.titleBar` child using `window-title-bar`
- `.contentOuter` child using `window-content-frame`

**Forbidden**:
- Overriding background color
- Changing padding (breaks alignment)
- Removing box-shadow (breaks depth perception)

---

#### `window-title-bar($active: false)`

**Purpose**: Title bar with stripe pattern (active) or solid background (inactive).

**Signature**:
```scss
@mixin window-title-bar($active: false)
```

**Parameters**:
- `$active` (boolean): `true` for active window (black stripes), `false` for inactive (gray stripes).

**Output (active=true)**:
```scss
height: $size-18;                          // Fixed 18px height
@include border-flat($border-width-thin);  // 1px black border
border-left: none;                         // No side borders
border-right: none;
border-top: none;
display: flex;
align-items: center;
padding: 0 $space-4;
cursor: default;
user-select: none;
background: repeating-linear-gradient(
  90deg,
  $color-window-bg,
  $color-window-bg 2px,
  $color-border-dark 2px,              // Black stripes
  $color-border-dark 4px
);
```

**Output (active=false)**:
Same as above, but:
```scss
background: repeating-linear-gradient(
  90deg,
  $color-window-bg,
  $color-window-bg 2px,
  $color-stripe-alt 2px,               // Gray stripes (#aaa)
  $color-stripe-alt 4px
);
```

**Usage**:
```scss
.titleBar {
  @include mixins.window-title-bar(true);  // Active window
}

.window.inactive .titleBar {
  @include mixins.window-title-bar(false); // Inactive window
}
```

**Rules**:
- Height MUST be `$size-18` (18px) — **DO NOT OVERRIDE**
- Stripe width MUST be 2px alternating
- Stripe angle MUST be 90deg (horizontal)

---

#### `window-content-frame`

**Purpose**: 2-layer inset frame around window content.

**Signature**:
```scss
@mixin window-content-frame
```

**Output**:
```scss
flex: 1;
@include bevel-inset($border-width-thin);  // Outer inset layer
margin: $space-2;
background-color: $color-surface;
overflow: hidden;
position: relative;

// Inner shadow for deeper inset effect
box-shadow:
  inset 1px 1px 0 $color-border-dark,      // Inner dark shadow
  inset -1px -1px 0 $color-border-gray;    // Inner light highlight
```

**Usage**:
```scss
.contentOuter {
  @include mixins.window-content-frame;

  .content {
    width: 100%;
    height: 100%;
    overflow: auto;
    padding: $space-8;
  }
}
```

**Rules**:
- MUST have a child `.content` element for actual content
- DO NOT override `overflow: hidden` (breaks inset appearance)
- DO NOT remove box-shadow (2-layer inset required)

---

### Button System Mixins

#### `retro-button`

**Purpose**: Standard OS9 3D button with outset bevel.

**Signature**:
```scss
@mixin retro-button
```

**Output**:
```scss
font-family: $font-system;
font-size: $font-size-14;                  // 14px for standard buttons
font-weight: $font-weight-bold;
color: $color-text;
background-color: $color-window-bg;
@include bevel-outset($border-width-thin); // 1px outset bevel
box-shadow: 1px 1px 0 $color-border-dark;  // Subtle drop shadow
cursor: pointer;

&:active {
  @include bevel-inset($border-width-thin);
  box-shadow: none;
  transform: translate(1px, 1px);          // Shift down-right when pressed
}
```

**Usage**:
```scss
.okButton {
  @include mixins.retro-button;
  padding: $space-4 $space-20;  // 4px vertical, 20px horizontal
}
```

**Rules**:
- MUST use 14px font size (standard button size)
- MUST be bold
- MUST have active state (auto-included)
- DO NOT add hover effects (OS9 buttons don't hover)

**Scenarios**:
- Dialog OK/Cancel buttons
- Calculator number/operation buttons
- Form submit buttons

---

#### `toolbar-toggle-button`

**Purpose**: Toolbar-style button with 2px thick bevel and active state.

**Signature**:
```scss
@mixin toolbar-toggle-button
```

**Output**:
```scss
font-family: $font-system;
font-size: $font-size-11;                      // 11px for toolbar
background-color: $color-toolbar-bg;           // #c0c0c0 (not window gray)
@include bevel-outset($border-width-thick);    // 2px thick bevel
cursor: pointer;

@include hover-brighten;                       // Slight brightness on hover

&:active,
&.active {
  @include bevel-inset($border-width-thick);   // Inverted bevel when pressed/toggled
  font-weight: $font-weight-bold;              // Bold when active
}

&.active {
  box-shadow: inset 1px 1px 0 $color-border-dark;  // Inner shadow when toggled
}
```

**Usage**:
```scss
.viewButton {
  @include mixins.toolbar-toggle-button;
  width: $size-24;
  height: $size-24;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

**Rules**:
- MUST use 2px bevel (not 1px like standard buttons)
- MUST use 11px font (smaller than standard buttons)
- MAY add `.active` class for toggled state
- MUST use toolbar gray background (not window gray)

**Scenarios**:
- Finder view toggles (icon/list view)
- TextEditor formatting buttons
- Toolbar action buttons

---

#### `dialog-button`

**Purpose**: Dialog button with thick outset border.

**Signature**:
```scss
@mixin dialog-button
```

**Output**:
```scss
padding: $space-4 $space-20;                   // 4px vertical, 20px horizontal
@include bevel-outset($border-width-thick);    // 2px thick bevel
background-color: $color-toolbar-bg;
cursor: pointer;
font-family: $font-system;
font-size: $font-size-12;                      // 12px (between toolbar & standard)
font-weight: $font-weight-bold;
color: $color-text;

@include hover-brighten;

&:active {
  border-style: inset;                         // Browser-native inset
}
```

**Usage**:
```scss
.dialogButton {
  @include mixins.dialog-button;
}
```

**Scenarios**:
- InfoDialog action buttons
- Alert dialog buttons
- Modal confirmation buttons

---

### Menu System Mixins

#### `menu-bar`

**Purpose**: Top menu bar container.

**Signature**:
```scss
@mixin menu-bar
```

**Output**:
```scss
height: $size-22;                              // Fixed 22px height
background-color: $color-surface !important;   // White background
color: $color-text !important;
@include border-flat($border-width-thin);
border-top: none;
border-left: none;
border-right: none;
display: flex;
justify-content: space-between;
align-items: center;
padding: 0 $space-8;
font-size: $font-size-12;                      // 12px
font-family: $font-system;
z-index: $z-menubar;                           // 1000
position: relative;
```

**Usage**:
```scss
.menuBar {
  @include mixins.menu-bar;
}
```

**Rules**:
- Height MUST be exactly 22px
- Background MUST be white (not gray)
- Border only on bottom
- Z-index MUST be 1000 (above windows, below dropdowns)

---

#### `menu-item`

**Purpose**: Menu bar item with hover/active state.

**Signature**:
```scss
@mixin menu-item
```

**Output**:
```scss
padding: 0 $space-12;                          // 12px horizontal only
height: 100%;
display: flex;
align-items: center;
cursor: default;
position: relative;
color: $color-text;

&:hover,
&.active {
  background-color: $color-border-dark !important;  // Black background
  color: $color-surface !important;                 // White text
}
```

**Usage**:
```scss
.menuItem {
  @include mixins.menu-item;
}
```

**Rules**:
- Hover MUST be black background, white text (not blue)
- NO vertical padding (fills parent height)
- Horizontal padding MUST be 12px

**Scenarios**:
- Menu bar items (File, Edit, View, etc.)

---

#### `menu-dropdown`

**Purpose**: Dropdown menu panel.

**Signature**:
```scss
@mixin menu-dropdown
```

**Output**:
```scss
position: absolute;
top: $size-22;                                 // Positioned below menu bar
left: 0;
background-color: $color-surface;              // White background
@include border-flat($border-width-thin);      // 1px black border
box-shadow: $shadow-menu;                      // 2px 2px shadow
min-width: $size-200;                          // 200px minimum width
z-index: $z-dropdown;                          // 2000 (above menu bar)
padding: $space-2 0;                           // 2px vertical, no horizontal
color: $color-text;
```

**Usage**:
```scss
.dropdown {
  @include mixins.menu-dropdown;
}
```

**Rules**:
- Z-index MUST be 2000 (above menu bar)
- MUST have shadow
- MUST have black border

---

#### `menu-dropdown-item`

**Purpose**: Dropdown menu item with hover and disabled states.

**Signature**:
```scss
@mixin menu-dropdown-item
```

**Output**:
```scss
padding: $space-3 $space-15;                   // 3px vertical, 15px horizontal
cursor: default;
font-family: $font-system;
font-size: $font-size-10;                      // 10px (smaller than menu bar)
color: $color-text;

&:hover {
  background-color: $color-selection-bg;       // Blue selection (not black!)
  color: $color-surface;                       // White text
}

&.disabled {
  color: $color-text-disabled;                 // Gray text
  cursor: default;

  &:hover {
    background-color: transparent;             // No hover effect
    color: $color-text-disabled;
  }
}
```

**Usage**:
```scss
.dropdownItem {
  @include mixins.menu-dropdown-item;
}
```

**Rules**:
- Hover MUST be blue (not black like menu bar)
- Disabled items MUST be gray, no hover
- Font size MUST be 10px (smaller than menu bar)

---

### Toolbar & Status Bar Mixins

#### `toolbar-strip`

**Purpose**: Horizontal toolbar with subtle 3D appearance.

**Signature**:
```scss
@mixin toolbar-strip
```

**Output**:
```scss
display: flex;
align-items: center;
padding: $space-4 $space-8;                    // 4px vertical, 8px horizontal
background-color: $color-toolbar-bg;           // #c0c0c0 toolbar gray
border-bottom: $border-width-thin $border-style $color-border-gray;
min-height: $size-28;                          // 28px minimum
```

**Usage**:
```scss
.toolbar {
  @include mixins.toolbar-strip;
  justify-content: space-between;  // Custom layout
}
```

**Scenarios**:
- Finder toolbar (breadcrumbs + view toggles)
- TextEditor formatting toolbar
- Calculator memory buttons

---

#### `status-bar`

**Purpose**: Bottom status bar.

**Signature**:
```scss
@mixin status-bar
```

**Output**:
```scss
font-family: $font-system;
font-size: $font-size-11;                      // 11px
background-color: $color-toolbar-bg;
border-top: $border-width-thin $border-style $color-border-gray;
color: $color-text;
```

**Usage**:
```scss
.statusBar {
  @include mixins.status-bar;
  padding: $space-4 $space-8;
  min-height: $size-20;
}
```

**Scenarios**:
- Finder status bar (item count, size)
- TextEditor status bar (word count, cursor position)

---

## Component Patterns

**⚠️ IMPORTANT**: This section shows basic styling patterns. For complete component architecture (DOM structure, zones, inheritance chain, composite components), see **[Component Blueprints](COMPONENT_BLUEPRINTS.md)**.

### Window Component Structure

**Standard JSX Hierarchy**:
```jsx
<div className={styles.window}>
  <div className={styles.titleBar}>
    <div className={styles.closeBox}></div>
    <div className={styles.title}>
      <span className={styles.titleText}>Window Title</span>
    </div>
    <div className={styles.zoomBox}></div>
  </div>
  <div className={styles.contentOuter}>
    <div className={styles.content}>
      {/* Actual content here */}
    </div>
  </div>
</div>
```

**SCSS Pattern**:
```scss
@use '@/styles/tokens' as *;
@use '@/styles/mixins' as *;

.window {
  @include mixins.window-chrome;

  .titleBar {
    @include mixins.window-title-bar(true);

    .closeBox {
      width: tokens.$size-12;
      height: tokens.$size-12;
      background-color: tokens.$color-surface;
      border: tokens.$space-1 solid tokens.$color-border-dark;
      margin-right: tokens.$space-4;
      cursor: pointer;

      &:active {
        background-color: tokens.$color-border-dark;
      }
    }

    .title {
      flex: 1;
      display: flex;
      justify-content: center;
      background-color: tokens.$color-window-bg;
      margin: 0 tokens.$space-4;
      padding: 0 tokens.$space-4;
    }

    .titleText {
      font-family: tokens.$font-system;
      font-weight: bold;
      font-size: tokens.$font-size-11;
      color: tokens.$color-text;
      background-color: tokens.$color-window-bg;
      padding: 0 tokens.$space-5;
    }
  }

  .contentOuter {
    @include mixins.window-content-frame;
  }

  .content {
    width: 100%;
    height: 100%;
    overflow: auto;
    padding: tokens.$space-8;
    font-family: 'Geneva', sans-serif;
    font-size: tokens.$font-size-12;
    color: tokens.$color-text;
  }
}
```

**Rules**:
- MUST nest SCSS to mirror JSX structure
- MUST NOT exceed 3 levels of nesting
- Title bar MUST contain close/zoom boxes and title
- Content MUST use 2-layer structure (contentOuter + content)

---

## Forbidden Patterns

### ❌ Literal Values in Components

**WRONG**:
```scss
.button {
  background: #ddd;           // ❌ Literal color
  padding: 8px 12px;          // ❌ Literal spacing
  font-size: 14px;            // ❌ Literal font size
  border: 1px solid #000;     // ❌ Literal border
}
```

**CORRECT**:
```scss
@use '@/styles/tokens' as *;

.button {
  background: tokens.$color-window-bg;
  padding: tokens.$space-8 tokens.$space-12;
  font-size: tokens.$font-size-14;
  border: tokens.$border-width-thin tokens.$border-style tokens.$color-border-dark;
}
```

### ❌ Duplicating Bevel Logic

**WRONG**:
```scss
.button {
  border-top: 1px solid #fff;
  border-left: 1px solid #fff;
  border-right: 1px solid #808080;
  border-bottom: 1px solid #808080;
}
```

**CORRECT**:
```scss
@use '@/styles/mixins' as *;

.button {
  @include mixins.bevel-outset;
}
```

### ❌ Modern CSS Features

**FORBIDDEN**:
```scss
.button {
  border-radius: 4px;                    // ❌ No rounded corners in OS9
  transition: all 0.3s ease;             // ❌ No transitions
  box-shadow: 0 4px 8px rgba(0,0,0,0.1); // ❌ No blur shadows
  filter: drop-shadow(2px 2px 4px #000); // ❌ No filter drop-shadow
}
```

**CORRECT**:
```scss
.button {
  @include mixins.retro-button;
  box-shadow: tokens.$shadow-window;  // Solid pixel offset only
}
```

### ❌ Inconsistent Spacing

**WRONG**:
```scss
.container {
  padding: 10px;  // ❌ No 10px token exists
  gap: 14px;      // ❌ No 14px token exists
  margin: 7px;    // ❌ Odd values forbidden
}
```

**CORRECT**:
```scss
@use '@/styles/tokens' as *;

.container {
  padding: tokens.$space-8;   // Use 8px
  gap: tokens.$space-12;      // Use 12px or 16px
  margin: tokens.$space-8;    // Use 8px
}
```

### ❌ Wrong Font Sizes

**WRONG**:
```scss
.titleBar {
  font-size: 13px;  // ❌ No 13px scenario exists
}
```

**CORRECT**:
```scss
@use '@/styles/tokens' as *;

.titleBar {
  font-size: tokens.$font-size-11;  // Title bars use 11px
}
```

---

## Enforcement

### Automated Checks

**Stylelint** catches:
- ✅ Literal hex colors in component files
- ✅ Deprecated CSS properties
- ✅ Inconsistent formatting

Run:
```bash
npm run lint:css         # Lint SCSS
npm run lint:css -- --fix  # Auto-fix formatting
```

### Manual Code Review Checks

**Reviewers MUST verify**:
- [ ] All spacing uses tokens (no literal `8px`)
- [ ] All components use mixins (no duplicated bevels)
- [ ] Font sizes match scenario table
- [ ] No modern CSS (transitions, border-radius, blur)
- [ ] SCSS nesting mirrors JSX structure
- [ ] Window components use 2-layer content structure

### Visual Regression Testing

**Purpose**: Prevent visual drift that linters cannot detect.

The design system uses **SCSS compilation tests** to verify pixel-perfect visual baseline:

#### Test Strategy

**SCSS Compilation Tests** (`*.baseline.test.tsx`):
- Compile SCSS to CSS and verify exact output values
- Check token usage (var(--) references)
- Verify spacing, sizing, colors, borders, shadows
- Catch regressions in compiled CSS

**Example**: `Window.baseline.test.tsx` (28 tests)

```typescript
import * as sass from 'sass'

const compiledCss = sass.compile('./Window.module.scss').css

it('has 2px 2px solid shadow (no blur)', () => {
  expect(compiledCss).toMatch(/box-shadow:\s*2px 2px 0px/)
})

it('has inset bevel borders', () => {
  expect(compiledCss).toMatch(/border-top:\s*1px solid var\(--sys-border-gray\)/)
  expect(compiledCss).toMatch(/border-right:\s*1px solid var\(--sys-border-light\)/)
})
```

#### Required Test Coverage

**Window Baseline** (28 tests):
- ✅ Chrome background color (#ddd via var(--surface-window))
- ✅ 1px solid black border
- ✅ 2px 2px shadow (no blur)
- ✅ Title bar height (18px)
- ✅ Title bar stripe pattern (90deg, 2px)
- ✅ Content frame 2-layer inset (gray/light borders + inner shadow)
- ✅ Control boxes (12x12px)
- ✅ No border-radius, no transitions, no blur

**Button Baseline**:
- ✅ Outset bevel (default state)
- ✅ Inset bevel (active state)
- ✅ 14px bold font
- ✅ Special buttons (pink/green backgrounds)

**Menu Baseline**:
- ✅ Menu bar height (22px)
- ✅ White background
- ✅ Menu item hover (black background)
- ✅ Dropdown positioning + shadow
- ✅ Disabled item styling (gray text, no hover)

**Finder Baseline**:
- ✅ Toolbar height (28px)
- ✅ Status bar height (20px)
- ✅ Icon grid spacing (16px)
- ✅ Label wrapping (overflow-wrap: break-word)
- ✅ Table header bevel

#### Running Visual Tests

```bash
# Run all baseline tests
npm test -- --run *.baseline.test.tsx

# Run specific component baseline
npm test -- --run Window.baseline.test.tsx

# Run full test suite (includes 28 visual baseline tests)
npm test
```

#### Test Files

- `src/components/os/Window.baseline.test.tsx` (28 tests)
- `src/components/os/Window.style.test.tsx` (token usage)
- `src/components/os/MenuBar.style.test.tsx` (token usage)
- `src/components/apps/Calculator.style.test.tsx` (token usage)

#### Why SCSS Compilation Tests?

**Advantages**:
- ✅ No browser environment needed
- ✅ Fast execution (pure Node.js)
- ✅ Verify exact CSS output values
- ✅ Catch token usage errors
- ✅ Detect missing mixins

**What They Catch**:
- Bevel border directions inverted
- Shadow blur added accidentally
- Token references removed
- Spacing/sizing values changed
- Border-radius or transitions added
- Font sizes changed

**What They Miss**:
- Visual rendering in actual browsers (use manual testing)
- Cross-browser compatibility (use Playwright if needed)
- Accessibility (use axe-core if needed)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2025-11-22 | **Initial Design System v2**: Comprehensive visual baseline, bevel system rules, mixin API reference, typography rules, layout rules, forbidden patterns |
| 1.0 | 2025-11-20 | Token system + mixins introduced (feat/refactor-core) |

---

## Related Documentation

- **Component Blueprints**: `COMPONENT_BLUEPRINTS.md` — Standard DOM structures, zones, inheritance
- **Interaction Blueprint**: `INTERACTION_BLUEPRINT.md` — Component behavior (hover, pressed, drag, focus)
- **Implementation**: `src/styles/_tokens.scss`, `src/styles/_mixins.scss`
- **Linting Guide**: `SCSS_LINTING.md`
- **Proposal**: `openspec/changes/refactor-scss-design-system/proposal.md`
- **Technical Design**: `openspec/changes/refactor-scss-design-system/design.md`

---

**Document Status**: ✅ **Active** — This is the authoritative design specification.
**Governance**: All changes to visual design MUST update this document via OpenSpec process.
