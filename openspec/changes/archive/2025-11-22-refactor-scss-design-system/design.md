# macOS 98 UI System - Technical Design

## Context

The macOS 98 project currently has SCSS styling scattered across component files with duplicated literals, repeated bevel/shadow logic, and no centralized design system. This design document specifies the technical architecture for a token-driven, mixin-based UI framework that preserves the retro Mac OS 9 aesthetic while enabling long-term maintainability.

## Goals

1. **Centralize visual primitives**: All colors, spacing, typography, shadows, and borders defined in one place
2. **Eliminate duplication**: Window chrome, buttons, and menus use shared mixins instead of copy-paste styling
3. **Improve maintainability**: Single source of truth for UI patterns, making changes predictable and safe
4. **Preserve retro aesthetic**: Zero visual regression—pixel-accurate recreation of classic Mac OS 9 look
5. **Enable future theming**: Foundation for color themes (dark mode, alternate OS versions) without major refactoring

## Non-Goals

- **Not introducing new UI patterns**: We're consolidating existing designs, not redesigning the interface
- **Not replacing SCSS**: No migration to CSS-in-JS, Tailwind, or other styling solutions
- **Not adding animations**: The retro aesthetic is instant state changes, not smooth transitions
- **Not full theming system**: CSS variables provide basic theming hooks, but multiple complete themes are out of scope

---

## Design Principles

These principles govern all implementation decisions:

### 1. Pixel Realism
**The visual must approximate authentic Mac OS 8-9:**
- Solid 2px pixel shadows (no blur)
- Diagonal title bar stripe patterns (45deg, 1px wide)
- Gray 3D beveled buttons (light top-left, dark bottom-right)
- Strong contrast menu selection (black background, white text)
- **Forbidden**: CSS blur filters, modern drop shadows, gradient transitions, animations

### 2. Strict Consistency
**All UI components follow unified rules:**
- Identical spacing scale (2px grid)
- Single color source (tokens only)
- Consistent border logic (3D bevel algorithm)
- Uniform shadow definitions
- Identical typography rules
- **Violation**: Any literal color, spacing, or font value in component styles

### 3. Token-Driven Architecture
**All visual properties originate from centralized tokens:**
- **Forbidden**: Hard-coded `#000`, `#fff`, `#ccc`, etc.
- **Forbidden**: Hard-coded `8px`, `10px`, `12px` spacing (except `0`)
- **Forbidden**: Hard-coded border definitions
- **Required**: All properties reference SCSS tokens or CSS custom properties

### 4. Mixins as Framework API
**The mixin layer is the public API; components are consumers:**
- Each UI pattern (window, button, menu) has a corresponding mixin
- Components MUST NOT reimplement UI patterns
- Components compose mixins with minimal overrides
- **Violation**: Duplicating bevel, shadow, or state logic in component files

---

## Architecture

### Layer 1: Design Tokens (`src/styles/_tokens.scss`)

**Purpose**: Single source of truth for all visual primitives.

#### Color Tokens

```scss
// Border & Structure
$color-border-dark: #000000;         // Primary dark borders, window frames
$color-border-light: #ffffff;        // Highlight edges, 3D bevel tops
$color-border-gray: #808080;         // Mid-tone borders, neutral separators

// Surfaces
$color-surface: #dddddd;             // Primary surface color (window backgrounds)
$color-window-bg: var(--sys-bg-color); // Window chrome background (themeable)
$color-stripe-alt: #555555;          // Title bar stripe alternate color

// Text
$color-text: #000000;                // Primary text color
$color-disabled-text: #808080;       // Disabled/inactive text

// Selection & Interactive
$color-menu-hover-bg: #000000;       // Menu item hover/active background
$color-menu-hover-text: #ffffff;     // Menu item hover/active text
$color-selection-bg: #000000;        // Generic selection background
$color-selection-text: #ffffff;      // Generic selection text

// Button States
$color-button-surface: #dddddd;      // Default button surface
$color-button-active-bg: #aaaaaa;    // Pressed button background

// Special Surfaces
$color-dialog-bg: #dddddd;           // Dialog box backgrounds
$color-inset-display-bg: #ffffff;    // Calculator display, text inputs
```

**Rules**:
- Semantic names only (purpose-based, not value-based)
- All grays derive from consistent scale (#000, #555, #808080, #aaa, #ddd, #fff)
- Reference CSS custom properties (`var(--sys-*)`) where theming needed
- No component-specific tokens in global file

#### Shadow Tokens

```scss
$shadow-window: 2px 2px 0 rgba(0, 0, 0, 0.5);     // Window drop shadow
$shadow-menu: 1px 1px 0 rgba(0, 0, 0, 0.5);       // Menu dropdown shadow
$shadow-inset: inset 1px 1px 0 rgba(0, 0, 0, 0.2); // Inset field shadow
```

**Rules**:
- Solid pixel offsets only (no blur radius for external shadows)
- Opacity ≤ 0.5 to maintain retro aesthetic
- Forbidden: `filter: drop-shadow()` or `box-shadow` with blur >0

#### Border Tokens

```scss
$border-width: 1px;                  // Standard border width
$border-width-thick: 2px;            // Thick borders (window frames)
$border-style: solid;                // Standard border style
```

#### Spacing Tokens

```scss
$space-xxs: 2px;   // Minimal spacing (window chrome padding)
$space-xs: 4px;    // Extra small (button padding, compact layouts)
$space-sm: 6px;    // Small (menu item padding, toolbar spacing)
$space-md: 8px;    // Medium (default component spacing)
$space-lg: 10px;   // Large (dialog padding, section spacing)
$space-xl: 12px;   // Extra large (window margins, major sections)
$space-2xl: 16px;  // 2X large (application-level spacing)
```

**Rules**:
- All values are multiples of 2px (pixel grid alignment)
- Component padding/margin MUST reference tokens exclusively
- Exception: `0` value doesn't require a token
- **Migration Note**: Legacy `$space-sm: 5px` should be updated to `6px` for consistency

#### Typography Tokens

```scss
// Font Families
$font-system: 'Chicago', 'Charcoal', 'Geneva', -apple-system, sans-serif;
$font-mono: 'Monaco', 'Courier New', monospace;

// Font Sizes
$font-size-xs: 9px;   // Title bar, small labels
$font-size-sm: 10px;  // Menu items, compact UI
$font-size-md: 12px;  // Body text, default size
$font-size-lg: 14px;  // Headings, emphasis

// Line Heights
$line-height-tight: 1.0;   // Compact layouts (title bars)
$line-height-normal: 1.2;  // Standard text
$line-height-relaxed: 1.4; // Comfortable reading
```

**Rules**:
- All text uses `$font-system` unless displaying code/monospace
- Components MUST NOT specify font-size directly
- Title bar text MUST use `$font-size-xs` consistently

---

### Layer 2: UI Pattern Mixins (`src/styles/_mixins.scss`)

**Purpose**: Reusable styling APIs for core UI patterns.

#### Window Mixins

##### `@mixin window-chrome`
**Applies**: Outer window container styling.

```scss
@mixin window-chrome {
  background: $color-window-bg;
  border: $border-width-thick $border-style $color-border-dark;
  box-shadow: $shadow-window;
  padding: $space-xxs;
}
```

**Usage**:
```scss
.window {
  @include window-chrome;
}
```

**Requirements**:
- Background MUST be `$color-window-bg`
- Border MUST use `$border-width-thick` and `$color-border-dark`
- Shadow MUST be `$shadow-window`
- Padding MUST be `$space-xxs`

---

##### `@mixin window-title-bar($active: true)`
**Applies**: Title bar with stripe pattern (active) or solid background (inactive).

```scss
@mixin window-title-bar($active: true) {
  padding: $space-xs;
  font-size: $font-size-xs;
  line-height: $line-height-tight;

  @if $active {
    background: repeating-linear-gradient(
      45deg,
      $color-border-dark,
      $color-border-dark 1px,
      $color-stripe-alt 1px,
      $color-stripe-alt 2px
    );
    color: $color-surface;
  } @else {
    background: $color-surface;
    color: $color-text;
  }
}
```

**Parameters**:
- `$active` (boolean): Whether window is in active state (default: `true`)

**Usage**:
```scss
.titleBar {
  @include window-title-bar(true);  // Active
}

.titleBar.inactive {
  @include window-title-bar(false); // Inactive
}
```

**Requirements**:
- Active: `repeating-linear-gradient` at 45deg, 1px stripe width
- Inactive: Solid `$color-surface` background
- Padding: `$space-xs`
- Font size: `$font-size-xs`

---

##### `@mixin window-content-frame`
**Applies**: 3D inset frame around window content.

```scss
@mixin window-content-frame {
  margin: $space-xxs;
  background: $color-surface;
  border-top: $border-width $border-style $color-border-gray;
  border-left: $border-width $border-style $color-border-gray;
  border-right: $border-width $border-style $color-border-light;
  border-bottom: $border-width $border-style $color-border-light;
  padding: $border-width;

  // Inner inset border
  box-shadow:
    inset $border-width $border-width 0 $color-border-dark,
    inset (-$border-width) (-$border-width) 0 $color-border-gray;
}
```

**Usage**:
```scss
.contentOuter {
  @include window-content-frame;
}
```

**Requirements**:
- Creates 3D "pressed in" appearance
- Top/left: Gray then dark (inset effect)
- Bottom/right: Light then gray (bevel highlight)

---

#### Button Mixins

##### `@mixin retro-button`
**Applies**: Standard OS 9 3D button.

```scss
@mixin retro-button {
  background: $color-button-surface;
  border-top: $border-width $border-style $color-border-light;
  border-left: $border-width $border-style $color-border-light;
  border-right: $border-width $border-style $color-border-dark;
  border-bottom: $border-width $border-style $color-border-dark;
  padding: $space-xs $space-md;
  font-family: $font-system;
  font-size: $font-size-sm;
  cursor: pointer;

  &:active {
    @include retro-button-active;
  }
}

@mixin retro-button-active {
  // Invert bevel
  border-top: $border-width $border-style $color-border-dark;
  border-left: $border-width $border-style $color-border-dark;
  border-right: $border-width $border-style $color-border-light;
  border-bottom: $border-width $border-style $color-border-light;
  background: $color-button-active-bg;
}
```

**Usage**:
```scss
.button {
  @include retro-button;
}
```

**Requirements**:
- Default: Light top-left, dark bottom-right borders
- Active: Inverted borders, darker background
- NO transforms, transitions, or animations

---

##### `@mixin toolbar-toggle-button`
**Applies**: Toolbar-style button with subtle pressed state.

```scss
@mixin toolbar-toggle-button {
  @include retro-button;
  padding: $space-xs;

  &.toggled {
    background: $color-button-active-bg;
  }
}
```

**Usage**:
```scss
.toolbarButton {
  @include toolbar-toggle-button;
}
```

---

#### Menu Mixins

##### `@mixin menu-bar`
**Applies**: Menu bar container.

```scss
@mixin menu-bar {
  background: $color-surface;
  border-bottom: $border-width $border-style $color-border-dark;
  padding: $space-xs $space-sm;
  font-size: $font-size-sm;
  font-family: $font-system;
}
```

**Usage**:
```scss
.menuBar {
  @include menu-bar;
}
```

---

##### `@mixin menu-item`
**Applies**: Menu bar item with hover/active states.

```scss
@mixin menu-item {
  padding: 0 $space-sm;
  color: $color-text;
  background: transparent;
  cursor: pointer;

  &:hover,
  &.active {
    background: $color-menu-hover-bg;
    color: $color-menu-hover-text;
  }
}
```

**Usage**:
```scss
.menuItem {
  @include menu-item;
}
```

**Requirements**:
- Default: Transparent background, `$color-text`
- Hover/active: Black background, white text
- NO font-size or font-family (inherits from parent)
- NO transitions

---

##### `@mixin menu-dropdown`
**Applies**: Dropdown menu panel.

```scss
@mixin menu-dropdown {
  position: absolute;
  z-index: 2000;
  background: $color-surface;
  border: $border-width $border-style $color-border-dark;
  box-shadow: $shadow-menu;
  padding: $space-xxs;
}
```

**Usage**:
```scss
.dropdown {
  @include menu-dropdown;
}
```

**Requirements**:
- Fixed z-index: 2000 (not a magic number; documented standard)
- Shadow: `$shadow-menu`

---

##### `@mixin menu-dropdown-item`
**Applies**: Dropdown menu item with states.

```scss
@mixin menu-dropdown-item {
  @include menu-item;
  display: block;
  width: 100%;

  &.disabled {
    color: $color-disabled-text;
    cursor: not-allowed;

    &:hover {
      background: transparent;
      color: $color-disabled-text;
    }
  }
}
```

**Usage**:
```scss
.dropdownItem {
  @include menu-dropdown-item;
}
```

---

#### Toolbar & Status Bar Mixins

##### `@mixin toolbar-strip`
**Applies**: Horizontal toolbar with 3D bevel.

```scss
@mixin toolbar-strip {
  background: $color-surface;
  border-top: $border-width $border-style $color-border-light;
  border-bottom: $border-width $border-style $color-border-dark;
  padding: $space-xs;
}
```

---

##### `@mixin status-bar`
**Applies**: Status bar (typically bottom of windows).

```scss
@mixin status-bar {
  background: $color-surface;
  border-top: $border-width $border-style $color-border-dark;
  padding: $space-xs $space-sm;
  font-size: $font-size-sm;
}
```

---

### Layer 3: Component Styles (`*.module.scss`)

**Purpose**: Component-specific styling using tokens and mixins.

#### Component Structure Pattern

All window-like components follow this structure:

**JSX**:
```jsx
<div className={styles.window}>
  <div className={styles.titleBar}>
    {/* title, controls */}
  </div>
  <div className={styles.contentOuter}>
    <div className={styles.content}>
      {/* actual content */}
    </div>
  </div>
</div>
```

**SCSS**:
```scss
@use '@/styles/tokens' as *;
@use '@/styles/mixins' as *;

.window {
  @include window-chrome;

  .titleBar {
    @include window-title-bar(true);

    .title {
      // Component-specific title styling
    }
  }

  .contentOuter {
    @include window-content-frame;

    .content {
      // Component-specific content styling
    }
  }
}
```

**Rules**:
- Nesting MUST mirror JSX structure
- Maximum nesting depth: 3 levels
- Class names MUST be camelCase
- MUST NOT alter contentOuter/content two-layer structure
- MUST NOT add wrapper divs without justification

---

#### App Component Example

**Calculator SCSS**:
```scss
@use '@/styles/tokens' as *;
@use '@/styles/mixins' as *;

.calculator {
  @include window-chrome;

  .titleBar {
    @include window-title-bar(true);
  }

  .toolbar {
    @include toolbar-strip;
  }

  .display {
    background: $color-inset-display-bg;
    border: $border-width $border-style $color-border-dark;
    padding: $space-sm;
    font-family: $font-mono;
    font-size: $font-size-md;
  }

  .buttonGrid {
    padding: $space-sm;
  }

  .button {
    @include retro-button;
  }
}
```

**Forbidden Patterns**:
```scss
// ❌ WRONG - literal color
.button {
  background: #ddd;
}

// ❌ WRONG - literal spacing
.display {
  padding: 8px;
}

// ❌ WRONG - duplicated bevel logic
.button {
  border-top: 1px solid #fff;
  border-left: 1px solid #fff;
  border-right: 1px solid #000;
  border-bottom: 1px solid #000;
}

// ✅ CORRECT
.button {
  @include retro-button;
}
```

---

## Code Style Standards

### SCSS Nesting Rules

**Maximum depth: 3 levels**

✅ **Good**:
```scss
.window {
  .titleBar {
    .title {
      // 3 levels - acceptable
    }
  }
}
```

❌ **Bad**:
```scss
.window {
  .outer {
    .inner {
      .wrapper {
        .title {
          // Too deep!
        }
      }
    }
  }
}
```

### Selector Requirements

- **Forbidden**: ID selectors (`#foo`)
- **Forbidden**: `!important` (except documented edge cases)
- **Required**: All component styles use CSS modules
- **Forbidden**: Global class names (except `_globals.scss` utilities)

### Literal Value Policy

**Forbidden in component files**:
- Literal hex colors (`#000`, `#fff`, `#ccc`, etc.)
- Literal spacing values (`8px`, `10px`, etc.) - except `0`
- Literal font-size values (`12px`, `14px`, etc.)

**Required**:
- All values source from tokens

---

## Testing Strategy

### Style Test Coverage

All major UI patterns require automated tests verifying token compliance.

#### Required Test Scenarios

**Window Components**:
```typescript
it('applies window chrome with correct background', () => {
  const { container } = render(<Window />);
  const window = container.querySelector(`.${styles.window}`);
  const computed = getComputedStyle(window);

  expect(computed.backgroundColor).toBe('rgb(221, 221, 221)'); // $color-surface
  expect(computed.borderColor).toBe('rgb(0, 0, 0)'); // $color-border-dark
});

it('applies title bar stripe pattern for active window', () => {
  const { container } = render(<Window active={true} />);
  const titleBar = container.querySelector(`.${styles.titleBar}`);
  const computed = getComputedStyle(titleBar);

  expect(computed.backgroundImage).toContain('repeating-linear-gradient');
});
```

**Button Components**:
```typescript
it('applies 3D bevel borders to retro button', () => {
  const { container } = render(<button className={styles.button}>Test</button>);
  const button = container.querySelector('button');
  const computed = getComputedStyle(button);

  expect(computed.borderTopColor).toBe('rgb(255, 255, 255)'); // Light
  expect(computed.borderBottomColor).toBe('rgb(0, 0, 0)'); // Dark
});
```

**Menu Components**:
```typescript
it('applies correct hover background to menu item', () => {
  const { container } = render(<MenuItem>File</MenuItem>);
  const item = container.querySelector(`.${styles.menuItem}`);

  fireEvent.mouseEnter(item);
  const computed = getComputedStyle(item);

  expect(computed.backgroundColor).toBe('rgb(0, 0, 0)'); // $color-menu-hover-bg
  expect(computed.color).toBe('rgb(255, 255, 255)'); // $color-menu-hover-text
});
```

### Coverage Requirements

- All mixins: At least 1 test per mixin
- All core components: Window, MenuBar, Calculator, TextEditor, Finder
- State variations: Default, hover, active, disabled
- Active/inactive window states

---

## File Organization

```
src/styles/
  _tokens.scss       # All design tokens
  _mixins.scss       # All UI pattern mixins
  _globals.scss      # CSS custom properties, resets, global layout
  _reset.scss        # CSS reset (if separated)

src/components/os/
  Window.module.scss
  MenuBar.module.scss
  Desktop.module.scss
  ContextMenu.module.scss
  InfoDialog.module.scss
  DesktopIcon.module.scss

src/components/apps/
  Calculator/
    Calculator.tsx
    Calculator.module.scss
    Calculator.test.tsx
  Finder/
    Finder.tsx
    Finder.module.scss
    Finder.test.tsx
  TextEditor/
    TextEditor.tsx
    TextEditor.module.scss
    TextEditor.test.tsx
```

**Rules**:
- Tokens and mixins MUST NOT live in component directories
- Each component MUST have colocated `.module.scss`
- Global styles MUST live in `src/styles/` only

---

## Enforcement & Review Checklist

### Pre-Merge Checklist

All SCSS PRs MUST pass:

- [ ] **No literal colors**: All colors sourced from `_tokens.scss`
- [ ] **No literal spacing**: All padding/margin use spacing tokens (except `0`)
- [ ] **No literal font-size**: All typography uses font-size tokens
- [ ] **No literal borders**: All borders reference token values
- [ ] **Mixins used correctly**: Window/button/menu components use corresponding mixins
- [ ] **SCSS nesting matches JSX**: Component structure mirrors markup hierarchy
- [ ] **No duplication**: No repeated border/shadow/bevel logic
- [ ] **File structure correct**: Tokens/mixins in `src/styles/`, components in proper directories
- [ ] **Selector compliance**: No ID selectors, no `!important` (except justified cases)
- [ ] **Tests updated**: New components have style tests, existing tests pass
- [ ] **Visual regression**: Manual verification that retro aesthetic is preserved

### Review Failure Criteria

Reject PR if:
- Literal hex colors in component SCSS
- Spacing values hard-coded (not from tokens)
- UI patterns duplicated instead of using mixins
- SCSS structure doesn't mirror JSX hierarchy
- Tests failing or not updated
- File structure violates organization rules

---

## Migration Strategy

1. **Start with tokens**: Define all tokens before refactoring components
2. **Implement mixins**: Build and test each mixin in isolation
3. **Migrate incrementally**: Update components one at a time (Window, MenuBar first)
4. **Test each migration**: Run visual and unit tests after each component
5. **Remove old code**: Delete obsolete styles only after new code verified
6. **Document deviations**: Any visual changes MUST be documented

---

## Risks & Trade-offs

### Risk: Visual Regression
**Mitigation**: Comprehensive style tests + manual visual verification

### Risk: Developer Learning Curve
**Mitigation**: Clear mixin API docs + examples in this design document

### Risk: Over-abstraction
**Mitigation**: Only create mixins for patterns used 3+ times; allow component-specific styles

### Trade-off: SCSS vs CSS-in-JS
**Decision**: Keep SCSS for consistency with existing codebase and team familiarity

### Trade-off: Global Tokens vs Component Tokens
**Decision**: Only global tokens; component-specific values stay scoped with TODO comments

---

## Open Questions

None. All architectural decisions are finalized.

---

## Versioning

This represents **Version 1.0** of the macOS 98 UI System design.

Future enhancements MAY include:
- Multiple color themes (dark mode, alternate OS versions)
- Accessibility improvements (ARIA, focus states)
- Animation tokens (if transitions are introduced)
- Additional UI patterns (sliders, progress bars, tabs)

All changes to this design MUST follow the OpenSpec proposal process.
