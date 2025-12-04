# Interaction Blueprint

> **Layer 7: Interaction Patterns**
> This document defines the **interaction model** for macOS 9.8 UI components. It complements [Component Blueprints](component-blueprints.md) (static structure) and [Design System](design-system.md) (visual styling).

**Problem Solved:**
Visual consistency ≠ Experience consistency. A component can have perfect DOM structure and styling, but still feel wrong if its interaction behavior (hover, pressed, focus, drag) doesn't match the authentic OS9 model.

---

## Table of Contents

1. [Title Bar Drag Zones](#title-bar-drag-zones)
2. [Button State Machine](#button-state-machine)
3. [Window Focus/Inactive Behavior](#window-focusinactive-behavior)
4. [Menu Interaction Model](#menu-interaction-model)
5. [Finder Selection Rules](#finder-selection-rules)
6. [Keyboard Navigation](#keyboard-navigation)
7. [Anti-Patterns](#anti-patterns)

---

## Title Bar Drag Zones

### 1.1 Drag Area Definition

**Rule:** The title bar is **NOT** fully draggable. Only the **left empty area** (before title text) is the drag zone.

```
┌─────────────────────────────────────┐
│ ●  [DRAG ZONE]  Title Text      ▢  │ ← Title Bar
│ ↑               ↑                ↑  │
│ Close          Title             Zoom│
│ Box            (NOT draggable)   Box │
└─────────────────────────────────────┘

DRAG ZONE = Left empty space (between closeBox and title)
NOT DRAG  = Title text, control buttons, right empty space
```

### 1.2 Implementation Pattern

```tsx
// Window.tsx
const handleTitleBarMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
  const target = e.target as HTMLElement;

  // Only drag if clicked on the drag zone (empty left area)
  if (
    target.classList.contains('titleBar') ||  // The bar itself
    target.classList.contains('dragZone')      // Explicit drag zone
  ) {
    startDrag(e);
  }

  // Ignore clicks on:
  // - closeBox, zoomBox (they have their own click handlers)
  // - titleText (not draggable in OS9)
};
```

```tsx
// Recommended DOM structure
<div className="titleBar" onMouseDown={handleTitleBarMouseDown}>
  <button className="closeBox" onClick={onClose} />
  <div className="dragZone" />  {/* Explicit drag area */}
  <div className="title">
    <span className="titleText">{title}</span>
  </div>
  <button className="zoomBox" onClick={onZoom} />
</div>
```

### 1.3 Cursor Behavior

```tsx
// CSS
.titleBar {
  cursor: default; // Default, NOT move
}

.dragZone {
  cursor: move; // Only on drag zone
  flex: 1; // Fill space before title
}

.titleText {
  cursor: default; // NOT draggable
  user-select: none; // Cannot select text
}
```

### 1.4 Anti-Patterns

❌ **WRONG: Entire title bar draggable**
```tsx
<div className="titleBar" onMouseDown={startDrag}>
  {/* User can accidentally drag when clicking title text */}
</div>
```

❌ **WRONG: Title text draggable**
```tsx
<span className="titleText" style={{ cursor: 'move' }}>
  {/* OS9 title text is never draggable */}
</span>
```

✅ **CORRECT: Only left empty area draggable**
```tsx
<div className="dragZone" onMouseDown={startDrag} />
```

---

## Button State Machine

### 2.1 State Priority

**State Priority (highest to lowest):**

1. **`:active`** (mouse down on button) → **bevel-inset** (pressed)
2. **`:hover`** (mouse over button) → **bevel-outset** + slight highlight
3. **`:focus`** (keyboard focus) → **dotted outline** (OS9 focus ring)
4. **default** → **bevel-outset** (raised)

**Critical Rule:** `:active` **ALWAYS overrides** `:hover`. When mouse is down, button MUST show pressed state even if hover would normally apply.

### 2.2 Bevel Flip Rule

**Pressed State = Complete Bevel Inversion**

| State | Top Border | Left Border | Bottom Border | Right Border | Effect |
|-------|------------|-------------|---------------|--------------|--------|
| Default (raised) | Light (`--sys-border-light`) | Light | Gray (`--sys-border-gray`) | Gray | **bevel-outset** |
| Pressed (sunken) | Gray (`--sys-border-gray`) | Gray | Light (`--sys-border-light`) | Light | **bevel-inset** |

**SCSS Implementation:**

```scss
.retroButton {
  @include mixins.retro-button; // Default: bevel-outset

  &:hover {
    background: lighten($color-surface, 3%); // Subtle highlight
    // Bevel stays outset
  }

  &:active {
    @include mixins.bevel-inset; // Complete flip
    background: darken($color-surface, 2%); // Subtle darken

    // Override any hover styles
    // Active MUST win
  }

  &:focus-visible {
    outline: 1px dotted $color-text; // OS9 focus ring
    outline-offset: -3px; // Inside button
  }
}
```

### 2.3 State Machine Diagram

```
         ┌─────────┐
         │ Default │ ← bevel-outset
         └────┬────┘
              │
    ┌─────────┼─────────┐
    │                   │
    ↓                   ↓
┌─────────┐      ┌──────────┐
│  Hover  │      │  Focus   │ ← bevel-outset (raised)
└────┬────┘      └──────────┘
     │
     ↓
┌─────────┐
│ Active  │ ← bevel-inset (PRESSED)
└─────────┘   ↑
              │
        ALWAYS WINS
```

### 2.4 Toolbar Toggle Buttons

**Special Case:** Toolbar toggle buttons have an **active** state (selected) that is different from **pressed**.

```scss
.toolbarToggle {
  @include mixins.toolbar-toggle-button;

  // Selected (active state, NOT pressed)
  &.active {
    @include mixins.bevel-inset; // Stays inset
    background: $color-surface-pressed;
  }

  // Pressed (mouse down)
  &:active {
    @include mixins.bevel-inset; // Same visual
    background: darken($color-surface-pressed, 2%);
  }

  // Selected + Hover
  &.active:hover {
    background: lighten($color-surface-pressed, 3%);
    // Bevel stays inset
  }
}
```

### 2.5 Anti-Patterns

❌ **WRONG: Hover overrides active**
```scss
.button {
  &:active { @include mixins.bevel-inset; }

  &:hover {
    @include mixins.bevel-outset; // WRONG: will override :active
  }
}
```

❌ **WRONG: No bevel flip on press**
```scss
.button {
  @include mixins.bevel-outset;

  &:active {
    background: darken($color-surface, 5%);
    // MISSING: bevel-inset
  }
}
```

✅ **CORRECT: Active always wins**
```scss
.button {
  @include mixins.retro-button; // Default outset

  &:hover { /* subtle highlight */ }

  &:active {
    @include mixins.bevel-inset; // Complete flip
    // This will override hover
  }
}
```

---

## Window Focus/Inactive Behavior

### 3.1 Focus States

**Focused Window (Active):**
- Title bar: **Full color** (striped pattern visible)
- Control buttons: **Enabled** (clickable, colored)
- Bevel: **Full contrast** (light/gray borders)
- Content: **Normal** (full opacity)

**Inactive Window:**
- Title bar: **Dimmed** (stripe pattern desaturated)
- Control buttons: **Visible but dimmed** (NOT disabled, just desaturated)
- Bevel: **Reduced contrast** (softer borders)
- Content: **Slightly dimmed** (90% opacity)

### 3.2 Title Bar Dimming

```scss
.titleBar {
  // Active (default)
  background: repeating-linear-gradient(
    90deg,
    $color-stripe,
    $color-stripe 1px,
    $color-stripe-alt 1px,
    $color-stripe-alt 2px
  );

  // Inactive
  .window.inactive & {
    background: repeating-linear-gradient(
      90deg,
      desaturate($color-stripe, 40%),
      desaturate($color-stripe, 40%) 1px,
      desaturate($color-stripe-alt, 40%) 1px,
      desaturate($color-stripe-alt, 40%) 2px
    );
    opacity: 0.9; // Additional dimming
  }
}
```

### 3.3 Control Button States

**Important:** Inactive window controls are **NOT disabled**. They are **visually dimmed** but still clickable (clicking brings window to front).

```scss
.closeBox,
.zoomBox {
  // Active (default)
  background: $color-control-bg;
  border: 1px solid $color-border-dark;

  // Inactive
  .window.inactive & {
    background: desaturate($color-control-bg, 30%);
    border-color: desaturate($color-border-dark, 30%);
    opacity: 0.8;

    // Still clickable
    cursor: pointer;
    pointer-events: auto;
  }
}
```

### 3.4 Bevel Contrast

```scss
.chrome {
  // Active (default)
  @include mixins.window-chrome; // Full contrast bevel

  // Inactive
  .window.inactive & {
    border-top-color: lighten($color-border-gray, 10%);
    border-left-color: lighten($color-border-gray, 10%);
    border-bottom-color: lighten($color-border-light, -10%);
    border-right-color: lighten($color-border-light, -10%);
    // Softer bevel contrast
  }
}
```

### 3.5 Content Dimming

```scss
.content {
  // Active (default)
  opacity: 1;

  // Inactive
  .window.inactive & {
    opacity: 0.9; // Subtle dimming
  }
}
```

### 3.6 Focus Management

```tsx
// Window.tsx
const [isFocused, setIsFocused] = useState(true);

useEffect(() => {
  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  window.addEventListener('focus', handleFocus);
  window.addEventListener('blur', handleBlur);

  return () => {
    window.removeEventListener('focus', handleFocus);
    window.removeEventListener('blur', handleBlur);
  };
}, []);

return (
  <div className={`window ${!isFocused ? 'inactive' : ''}`}>
    {/* Window content */}
  </div>
);
```

### 3.7 Anti-Patterns

❌ **WRONG: Disable inactive controls**
```tsx
<button className="closeBox" disabled={!isFocused}>
  {/* OS9 inactive controls are clickable */}
</button>
```

❌ **WRONG: No visual change on inactive**
```scss
.window.inactive .titleBar {
  // No dimming - looks the same as active
}
```

✅ **CORRECT: Dim but clickable**
```tsx
<button className="closeBox" onClick={bringToFront}>
  {/* Visually dimmed via CSS, but still clickable */}
</button>
```

---

## Menu Interaction Model

### 4.1 OS9 Menu Behavior

**Menu Interaction Flow:**

1. **Hover on Menu Bar Item** → Highlight (no open)
2. **Click on Menu Bar Item** → Open dropdown, **enter "menu mode"**
3. **In "menu mode":**
   - Hover over other menu bar items → **Auto-switch** to that menu
   - Hover over menu items → Highlight
   - Click menu item → Execute action, **exit "menu mode"**
   - Click outside → **Exit "menu mode"**, close all menus

**Critical Difference from Modern UI:**
- Modern: Hover opens menus immediately
- OS9: **Click to enter menu mode**, then hover switches menus

### 4.2 State Machine

```
┌──────────────┐
│  Idle Mode   │ ← No menu open
└──────┬───────┘
       │
       │ Click menu bar item
       ↓
┌──────────────┐
│  Menu Mode   │ ← One menu open
└──────┬───────┘
       │
       ├─ Hover other menu bar item → Switch menu (stay in menu mode)
       ├─ Click menu item → Execute + exit menu mode
       └─ Click outside → Exit menu mode
```

### 4.3 Implementation Pattern

```tsx
// MenuBar.tsx
const [menuMode, setMenuMode] = useState(false);
const [openMenu, setOpenMenu] = useState<string | null>(null);

const handleMenuBarClick = (menuId: string) => {
  if (!menuMode) {
    // Enter menu mode
    setMenuMode(true);
    setOpenMenu(menuId);
  } else {
    // Already in menu mode, switch menu
    setOpenMenu(menuId);
  }
};

const handleMenuBarHover = (menuId: string) => {
  if (menuMode) {
    // In menu mode, hover switches menus
    setOpenMenu(menuId);
  }
  // If NOT in menu mode, hover does nothing (just visual highlight)
};

const handleMenuItemClick = (action: () => void) => {
  action(); // Execute action
  setMenuMode(false); // Exit menu mode
  setOpenMenu(null); // Close menu
};

const handleClickOutside = () => {
  setMenuMode(false);
  setOpenMenu(null);
};
```

### 4.4 Visual States

```scss
// Menu bar item
.menuBarItem {
  @include mixins.menu-bar-item;

  // Hover (idle mode) - just highlight
  &:hover {
    background: $color-menu-hover;
  }

  // Open (menu mode) - inset + highlight
  &.open {
    @include mixins.bevel-inset;
    background: $color-menu-active;
  }
}

// Dropdown menu
.menuDropdown {
  @include mixins.menu-dropdown;

  // Menu items
  .menuItem {
    // Default
    background: $color-surface;

    // Hover (in menu mode)
    &:hover:not(.disabled) {
      background: $color-selection-blue; // OS9 blue highlight
      color: $color-text-light;
    }

    // Disabled
    &.disabled {
      color: $color-text-disabled;
      cursor: default;

      &:hover {
        background: $color-surface; // No highlight
      }
    }
  }
}
```

### 4.5 Keyboard Navigation

**OS9 Menu Keyboard Shortcuts:**

- **F10** or **Alt** → Enter menu mode, focus first menu
- **Arrow Left/Right** → Navigate menu bar
- **Arrow Down** → Open focused menu
- **Arrow Up/Down** → Navigate menu items
- **Enter** → Execute focused item
- **Esc** → Exit menu mode

```tsx
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'F10' || e.key === 'Alt') {
    setMenuMode(true);
    focusFirstMenu();
  }

  if (menuMode) {
    if (e.key === 'Escape') {
      setMenuMode(false);
      setOpenMenu(null);
    }

    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      navigateMenuBar(e.key === 'ArrowRight' ? 1 : -1);
    }

    if (e.key === 'Enter') {
      executeFocusedItem();
      setMenuMode(false);
    }
  }
};
```

### 4.6 Anti-Patterns

❌ **WRONG: Hover opens menus**
```tsx
<div onMouseEnter={() => setOpenMenu('file')}>
  {/* Modern behavior, not OS9 */}
</div>
```

❌ **WRONG: No menu mode tracking**
```tsx
// Each menu independently opens/closes
// Cannot auto-switch on hover
```

✅ **CORRECT: Click to enter menu mode, hover to switch**
```tsx
<div
  onClick={() => handleMenuBarClick('file')}
  onMouseEnter={() => handleMenuBarHover('file')}
>
  {/* OS9 behavior */}
</div>
```

---

## Finder Selection Rules

### 5.1 Selection ≠ Button Press

**Critical Distinction:**

- **Button Press**: `bevel-outset` → `bevel-inset` (complete bevel flip)
- **Finder Selection**: `background: transparent` → `background: blue + inner-inset` (blue fill + sunken inner frame)

**Finder selection is NOT a button press.** It's a visual highlight with a subtle inner inset.

### 5.2 Selection Visual Pattern

```
┌────────────────────┐
│                    │ ← Unselected item
│   [Icon]           │   - Transparent background
│   Filename         │   - No border
└────────────────────┘

┌────────────────────┐
│░░░░░░░░░░░░░░░░░░░░│ ← Selected item
│░░░[Icon]░░░░░░░░░░░│   - Blue background
│░░░Filename░░░░░░░░░│   - Inner inset border (subtle)
└────────────────────┘   - White text (if selected)
```

### 5.3 SCSS Implementation

```scss
.finderItem {
  background: transparent;
  border: none;
  padding: $space-4;

  // Hover (not selected)
  &:hover:not(.selected) {
    background: rgba($color-selection-blue, 0.1); // Subtle hint
  }

  // Selected
  &.selected {
    background: $color-selection-blue; // OS9 blue
    color: $color-text-light; // White text

    // Inner inset (subtle depth)
    box-shadow:
      inset 1px 1px 0px rgba(black, 0.2),
      inset -1px -1px 0px rgba(white, 0.1);

    // NOT a button bevel
    // Just a subtle inner shadow
  }

  // Selected + Hover
  &.selected:hover {
    background: lighten($color-selection-blue, 5%);
  }

  // Focus ring (keyboard navigation)
  &:focus-visible {
    outline: 1px dotted $color-text;
    outline-offset: -2px;
  }
}
```

### 5.4 Multi-Selection

**OS9 Multi-Selection Rules:**

- **Click**: Select single item (clear previous)
- **Cmd+Click**: Toggle selection (add/remove)
- **Shift+Click**: Range selection (select from last to current)
- **Cmd+A**: Select all

```tsx
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

const handleItemClick = (
  id: string,
  e: React.MouseEvent
) => {
  if (e.metaKey || e.ctrlKey) {
    // Cmd+Click: Toggle
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  } else if (e.shiftKey) {
    // Shift+Click: Range selection
    selectRange(lastSelectedId, id);
  } else {
    // Click: Single selection
    setSelectedIds(new Set([id]));
  }
};
```

### 5.5 Icon vs List View

**Icon View:**
- Selection: Blue background fills **entire icon cell**
- Text: White when selected

**List View:**
- Selection: Blue background fills **entire row**
- Text: White when selected
- Columns: All columns highlighted

```scss
// Icon view
.iconGrid .finderItem.selected {
  background: $color-selection-blue;

  .iconLabel {
    color: $color-text-light; // White
  }
}

// List view
.listView .finderRow.selected {
  background: $color-selection-blue;

  .finderCell {
    color: $color-text-light; // All cells white
  }
}
```

### 5.6 Anti-Patterns

❌ **WRONG: Button-style bevel on selection**
```scss
.finderItem.selected {
  @include mixins.bevel-inset; // WRONG: Not a button
}
```

❌ **WRONG: No text color change**
```scss
.finderItem.selected {
  background: $color-selection-blue;
  // MISSING: color: $color-text-light;
  // Black text on blue is unreadable
}
```

✅ **CORRECT: Blue fill + white text + subtle inner shadow**
```scss
.finderItem.selected {
  background: $color-selection-blue;
  color: $color-text-light;
  box-shadow: inset 1px 1px 0px rgba(black, 0.2);
}
```

---

## Keyboard Navigation

### 6.1 Focus Visible

**OS9 Focus Ring:**
- **Style**: 1px dotted line
- **Color**: Text color (black)
- **Offset**: Inside element (-2px to -4px)
- **Timing**: Only on keyboard focus (`:focus-visible`)

```scss
.button,
.menuItem,
.finderItem {
  // Remove default focus outline
  outline: none;

  // Custom OS9 focus ring (keyboard only)
  &:focus-visible {
    outline: 1px dotted $color-text;
    outline-offset: -3px; // Inside element
  }
}
```

### 6.2 Tab Order

**Standard Tab Order:**

1. Window controls (close, zoom)
2. Menu bar (if visible)
3. Toolbar buttons (left to right)
4. Content area (focus first interactive element)
5. Status bar (if interactive)

```tsx
<div className="window" tabIndex={-1}>
  <div className="titleBar">
    <button className="closeBox" tabIndex={1} />
    <button className="zoomBox" tabIndex={2} />
  </div>

  <div className="toolbar">
    <button tabIndex={3}>Back</button>
    <button tabIndex={4}>Forward</button>
  </div>

  <div className="content">
    <input tabIndex={5} /> {/* First content element */}
  </div>
</div>
```

### 6.3 Arrow Key Navigation

**Finder Icon Grid:**
- **Arrow Up/Down/Left/Right**: Navigate icons in grid
- **Enter**: Open selected item
- **Cmd+Arrow Up**: Go up one folder level

```tsx
const handleKeyDown = (e: KeyboardEvent) => {
  const currentIndex = items.findIndex(item => item.id === focusedId);

  if (e.key === 'ArrowRight') {
    focusItem(items[currentIndex + 1]?.id);
  } else if (e.key === 'ArrowLeft') {
    focusItem(items[currentIndex - 1]?.id);
  } else if (e.key === 'ArrowDown') {
    const columns = Math.floor(gridWidth / 80); // Icon width
    focusItem(items[currentIndex + columns]?.id);
  } else if (e.key === 'ArrowUp') {
    const columns = Math.floor(gridWidth / 80);
    focusItem(items[currentIndex - columns]?.id);
  } else if (e.key === 'Enter') {
    openItem(focusedId);
  }
};
```

---

## Anti-Patterns

### 7.1 Interaction Anti-Patterns

❌ **Entire title bar draggable**
```tsx
<div className="titleBar" onMouseDown={startDrag}>
  {/* User can accidentally drag when clicking controls */}
</div>
```

❌ **Hover overrides active state**
```scss
.button {
  &:active { background: blue; }
  &:hover { background: red; } // Will override :active
}
```

❌ **No bevel flip on button press**
```scss
.button {
  &:active {
    background: darker;
    // MISSING: @include mixins.bevel-inset;
  }
}
```

❌ **Inactive window controls disabled**
```tsx
<button disabled={!isFocused}>
  {/* OS9 inactive controls are clickable */}
</button>
```

❌ **Hover opens menus**
```tsx
<div onMouseEnter={() => setOpenMenu('file')}>
  {/* Modern behavior, not OS9 */}
</div>
```

❌ **Button bevel on Finder selection**
```scss
.finderItem.selected {
  @include mixins.bevel-inset; // WRONG: Not a button
}
```

❌ **No focus ring on keyboard navigation**
```scss
.button:focus {
  outline: none; // Breaks accessibility + OS9 aesthetics
}
```

### 7.2 Correct Alternatives

✅ **Only left empty area draggable**
```tsx
<div className="dragZone" onMouseDown={startDrag} />
```

✅ **Active always wins**
```scss
.button {
  &:hover { background: light; }
  &:active {
    @include mixins.bevel-inset;
    background: dark; // Will override hover
  }
}
```

✅ **Inactive controls dimmed but clickable**
```tsx
<button className={isFocused ? '' : 'inactive'}>
  {/* Styled via CSS, not disabled */}
</button>
```

✅ **Click to enter menu mode**
```tsx
<div onClick={handleMenuClick} onMouseEnter={handleMenuHover}>
  {/* Hover only switches if already in menu mode */}
</div>
```

✅ **Blue fill + subtle shadow for selection**
```scss
.finderItem.selected {
  background: $color-selection-blue;
  color: $color-text-light;
  box-shadow: inset 1px 1px 0px rgba(black, 0.2);
}
```

✅ **Dotted focus ring on keyboard focus**
```scss
.button:focus-visible {
  outline: 1px dotted $color-text;
  outline-offset: -3px;
}
```

---

## Enforcement Checklist

Use this checklist when reviewing interaction implementations:

### Title Bar Drag Zones
- [ ] Drag zone is **only** the left empty area (not entire bar)
- [ ] Title text is **not** draggable
- [ ] Control buttons are **not** draggable
- [ ] Cursor is `move` only on drag zone

### Button States
- [ ] Default state uses `bevel-outset`
- [ ] Pressed state uses `bevel-inset` (complete flip)
- [ ] `:active` **always overrides** `:hover`
- [ ] Focus ring is 1px dotted, inside element
- [ ] Toolbar toggle buttons have distinct `active` state

### Window Focus
- [ ] Inactive windows have **dimmed** title bars
- [ ] Inactive controls are **dimmed** but **clickable**
- [ ] Inactive bevel has **reduced contrast**
- [ ] Inactive content has **90% opacity**

### Menu Interaction
- [ ] Click enters "menu mode"
- [ ] Hover switches menus **only in menu mode**
- [ ] Click outside exits menu mode
- [ ] Menu items highlight on hover
- [ ] Keyboard navigation supported (F10, arrows, Enter, Esc)

### Finder Selection
- [ ] Selection uses **blue background**, not button bevel
- [ ] Selected text is **white**
- [ ] Selection has **subtle inner shadow**, not full bevel
- [ ] Multi-selection supports Cmd+Click, Shift+Click
- [ ] Arrow keys navigate grid

### Keyboard Navigation
- [ ] Focus ring is 1px dotted, offset inside
- [ ] `:focus-visible` used (not `:focus`)
- [ ] Tab order is logical (controls → toolbar → content → status)
- [ ] Arrow keys work in grids/lists

---

## Related Documentation

- [Component Blueprints](component-blueprints.md) - Static structure patterns (DOM, zones, inheritance)
- [Design System](design-system.md) - Visual styling patterns (tokens, mixins, bevel rules)
- [SCSS Linting](scss-linting.md) - Automated enforcement of design tokens

---

**Status:** ✅ Complete
**Last Updated:** 2025-11-22
**Related OpenSpec:** `openspec/changes/refactor-scss-design-system`
