# Component Blueprints

**Official Component Architecture Specification**
**Version**: 1.0
**Last Updated**: 2025-11-22
**Status**: ✅ Active

This document defines the **standard DOM structures and component patterns** for all UI components in the macOS 98 project. It prevents structural drift and ensures consistent zone spacing across all applications.

> **⚠️ Important**: This document defines **how to structure** components (DOM, zones, inheritance).
> For **how components behave** (hover, pressed, drag, focus), see [Interaction Blueprint](./INTERACTION_BLUEPRINT.md).

---

## Table of Contents

1. [Architecture Philosophy](#architecture-philosophy)
2. [Window Component Hierarchy](#window-component-hierarchy)
3. [Standard Zones](#standard-zones)
4. [Component Inheritance Chain](#component-inheritance-chain)
5. [Composite Components](#composite-components)
6. [Anti-Patterns](#anti-patterns)

---

## Architecture Philosophy

### The Problem

**Without component blueprints**:
- ❌ Every app reinvents window structure
- ❌ Toolbar spacing differs between Finder and TextEditor
- ❌ Status bars have inconsistent heights
- ❌ DOM structure is "self-organized chaos"
- ❌ 70% of code is duplicated structure

**With component blueprints**:
- ✅ Standard DOM patterns enforce consistency
- ✅ New apps built in hours, not days
- ✅ Zone spacing is automatic
- ✅ No structural drift
- ✅ Mixin usage is guided

### Core Principles

1. **Blueprint > Freedom**: Standard structures prevent drift
2. **Zones > Manual Layout**: Predefined slots enforce spacing
3. **Composition > Duplication**: Reuse standard components
4. **Inheritance > Copy-Paste**: Extend base patterns

---

## Window Component Hierarchy

### Base Window (Minimum Viable Window)

**Purpose**: Foundation for all windowed UI.

**DOM Structure**:
```jsx
<div className="window">
  <div className="chrome">
    <div className="titleBar">
      <div className="closeBox"></div>
      <div className="title">
        <span className="titleText">{title}</span>
      </div>
      <div className="zoomBox"></div>
    </div>
    <div className="contentOuter">
      <div className="content">
        {children}
      </div>
    </div>
  </div>
</div>
```

**SCSS Structure** (MUST mirror JSX):
```scss
.window {
  @include mixins.window-chrome;

  .chrome {
    // Chrome wrapper (if needed for positioning)
  }

  .titleBar {
    @include mixins.window-title-bar(true);

    .closeBox { /* ... */ }
    .title { /* ... */ }
    .zoomBox { /* ... */ }
  }

  .contentOuter {
    @include mixins.window-content-frame;

    .content {
      padding: tokens.$space-8;
      overflow: auto;
    }
  }
}
```

**Rules**:
- ✅ MUST use `window-chrome`, `window-title-bar`, `window-content-frame` mixins
- ✅ MUST have 2-layer content structure (`contentOuter` + `content`)
- ✅ Title bar MUST be exactly 18px height (enforced by mixin)
- ❌ FORBIDDEN: Adding extra wrapper divs between chrome and titleBar
- ❌ FORBIDDEN: Skipping contentOuter (breaks 2-layer inset)

---

### App Window (With Toolbar + Status Bar)

**Purpose**: Standard application window with toolbar and status zones.

**DOM Structure**:
```jsx
<div className="window">
  <div className="chrome">
    <div className="titleBar">...</div>

    {/* ZONE: Toolbar (optional) */}
    {toolbar && (
      <div className="toolbar">
        {toolbar}
      </div>
    )}

    <div className="contentOuter">
      <div className="content">
        {children}
      </div>
    </div>

    {/* ZONE: Status Bar (optional) */}
    {statusBar && (
      <div className="statusBar">
        {statusBar}
      </div>
    )}
  </div>
</div>
```

**SCSS Structure**:
```scss
.window {
  @include mixins.window-chrome;

  .titleBar {
    @include mixins.window-title-bar(true);
  }

  .toolbar {
    @include mixins.toolbar-strip;
    // Toolbar-specific layout here
  }

  .contentOuter {
    @include mixins.window-content-frame;
  }

  .statusBar {
    @include mixins.status-bar;
    // Status bar-specific layout here
  }
}
```

**Rules**:
- ✅ Toolbar MUST use `toolbar-strip` mixin
- ✅ Status bar MUST use `status-bar` mixin
- ✅ Toolbar MUST be minimum 28px height
- ✅ Status bar MUST be minimum 20px height
- ❌ FORBIDDEN: Custom toolbar/status bar structures

---

### Finder Window (Specialized App Window)

**Purpose**: File browser with breadcrumb navigation and view toggles.

**DOM Structure**:
```jsx
<div className="finder">
  <div className="chrome">
    <div className="titleBar">...</div>

    {/* ZONE: Finder Toolbar */}
    <div className="toolbar">
      <div className="breadcrumb">
        {/* Breadcrumb navigation */}
      </div>
      <div className="viewToggle">
        {/* Icon/List view buttons */}
      </div>
    </div>

    <div className="contentOuter">
      <div className="content">
        {/* Icon view or List view */}
      </div>
    </div>

    <div className="statusBar">
      {/* Item count, selection info */}
    </div>
  </div>
</div>
```

**SCSS Structure**:
```scss
.finder {
  @include mixins.window-chrome;

  .toolbar {
    @include mixins.toolbar-strip;
    justify-content: space-between; // Breadcrumb left, toggle right

    .breadcrumb {
      display: flex;
      gap: tokens.$space-4;
    }

    .viewToggle {
      display: flex;
      gap: tokens.$space-2;
    }
  }

  .content {
    // Icon view or list view specific styles
  }

  .statusBar {
    @include mixins.status-bar;
    padding: tokens.$space-4 tokens.$space-8;
  }
}
```

**Rules**:
- ✅ Breadcrumb MUST be left-aligned
- ✅ View toggle MUST be right-aligned
- ✅ View buttons MUST use `toolbar-toggle-button` mixin
- ✅ Icon grid MUST use 16px gap (`tokens.$space-16`)
- ✅ Table headers MUST have 2px bottom border

---

### TextEditor Window (Specialized App Window)

**Purpose**: Text editing with formatting toolbar and ruler.

**DOM Structure**:
```jsx
<div className="textEditor">
  <div className="chrome">
    <div className="titleBar">...</div>

    {/* ZONE: Format Toolbar */}
    <div className="toolbar">
      <div className="formatButtons">
        {/* Bold, Italic, Underline */}
      </div>
      <div className="ruler">
        {/* Tab stops */}
      </div>
    </div>

    <div className="contentOuter">
      <div className="content">
        <textarea className="editor" />
      </div>
    </div>

    <div className="statusBar">
      {/* Word count, cursor position */}
    </div>
  </div>
</div>
```

**SCSS Structure**:
```scss
.textEditor {
  @include mixins.window-chrome;

  .toolbar {
    @include mixins.toolbar-strip;
    flex-direction: column; // Stack buttons + ruler

    .formatButtons {
      display: flex;
      gap: tokens.$space-2;
      padding: tokens.$space-4;
    }

    .ruler {
      height: tokens.$size-20;
      background: tokens.$color-surface;
      border-top: tokens.$border-width-thin solid tokens.$color-border-gray;
    }
  }

  .editor {
    width: 100%;
    height: 100%;
    font-family: tokens.$font-mono;
    font-size: tokens.$font-size-12;
    line-height: tokens.$line-height-relaxed;
  }

  .statusBar {
    @include mixins.status-bar;
    display: flex;
    justify-content: space-between;
  }
}
```

**Rules**:
- ✅ Format toolbar MUST stack vertically (buttons + ruler)
- ✅ Ruler MUST be 20px height
- ✅ Editor MUST use monospace font
- ✅ Line height MUST be `$line-height-relaxed`

---

## Standard Zones

### Zone Hierarchy

All windowed components MUST follow this zone order (top to bottom):

```
1. Title Bar    (fixed, 18px)
2. Toolbar      (optional, min 28px)
3. Content      (flex, fills remaining)
4. Status Bar   (optional, min 20px)
```

**Rules**:
- ❌ FORBIDDEN: Changing zone order
- ❌ FORBIDDEN: Nesting zones (toolbar inside content)
- ✅ ALLOWED: Omitting optional zones

---

### Title Bar Zone

**Height**: Exactly 18px (enforced by `window-title-bar` mixin)

**Layout**:
```
[CloseBox] [----Title----] [ZoomBox]
```

**SCSS**:
```scss
.titleBar {
  @include mixins.window-title-bar(true);

  .closeBox {
    width: tokens.$size-12;
    height: tokens.$size-12;
    margin-right: tokens.$space-4;
  }

  .title {
    flex: 1;
    text-align: center;
  }

  .zoomBox {
    width: tokens.$size-12;
    height: tokens.$size-12;
    margin-left: tokens.$space-4;
  }
}
```

**Rules**:
- ✅ MUST use flexbox layout
- ✅ Controls MUST be 12x12px
- ✅ Control spacing MUST be 4px
- ❌ FORBIDDEN: Custom title bar heights

---

### Toolbar Zone

**Min Height**: 28px (enforced by `toolbar-strip` mixin)

**Standard Layouts**:

**Horizontal Split**:
```
[Breadcrumb/Actions] [----] [View/Options]
```

**Vertical Stack**:
```
[Format Buttons]
[Ruler/Tabs]
```

**SCSS**:
```scss
.toolbar {
  @include mixins.toolbar-strip;

  // Horizontal split
  justify-content: space-between;

  // OR vertical stack
  flex-direction: column;
}
```

**Rules**:
- ✅ MUST use `toolbar-strip` mixin
- ✅ Background MUST be toolbar gray (`$color-toolbar-bg`)
- ✅ Vertical padding MUST be 4px, horizontal 8px
- ✅ Buttons MUST use `toolbar-toggle-button` mixin
- ❌ FORBIDDEN: Custom toolbar backgrounds

---

### Content Zone

**Flex**: 1 (fills remaining space)

**Standard Patterns**:

**Icon Grid**:
```scss
.content {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: tokens.$space-16; // MUST be 16px
  padding: tokens.$space-8;
}
```

**List/Table**:
```scss
.content {
  overflow: auto;

  table {
    width: 100%;
    border-collapse: collapse;

    thead {
      background: tokens.$color-toolbar-bg;
      border-bottom: 2px solid tokens.$color-border-gray; // MUST be 2px
    }
  }
}
```

**Text Editor**:
```scss
.content {
  padding: tokens.$space-8;

  textarea {
    font-family: tokens.$font-mono;
    font-size: tokens.$font-size-12;
    line-height: tokens.$line-height-relaxed;
  }
}
```

**Rules**:
- ✅ Icon grid gap MUST be 16px
- ✅ Table header border MUST be 2px
- ✅ Text editors MUST use monospace font
- ✅ Padding MUST be 8px (standard content padding)
- ❌ FORBIDDEN: Custom grid gaps for icon views
- ❌ FORBIDDEN: Proportional fonts in text editors

---

### Status Bar Zone

**Min Height**: 20px

**Standard Layout**:
```
[Left Info] [----] [Right Info]
```

**SCSS**:
```scss
.statusBar {
  @include mixins.status-bar;
  display: flex;
  justify-content: space-between;
  padding: tokens.$space-4 tokens.$space-8;
  min-height: tokens.$size-20;
}
```

**Rules**:
- ✅ MUST use `status-bar` mixin
- ✅ Font size MUST be 11px
- ✅ Padding MUST be 4px vertical, 8px horizontal
- ✅ MUST use flexbox with space-between
- ❌ FORBIDDEN: Custom font sizes
- ❌ FORBIDDEN: Custom padding values

---

## Component Inheritance Chain

### Inheritance Hierarchy

```
BaseWindow
├─ AppWindow (+ toolbar + statusBar)
│  ├─ FinderWindow (+ breadcrumb + viewToggle)
│  ├─ TextEditorWindow (+ formatBar + ruler)
│  ├─ CalculatorWindow (+ numberPad)
│  └─ PreferencesWindow (+ tabs)
└─ DialogWindow (simplified, no toolbar/statusBar)
   ├─ InfoDialog
   ├─ AlertDialog
   └─ ConfirmDialog
```

**Rules**:
- ✅ Inherit from closest ancestor
- ✅ Add zones, don't remove them
- ✅ Specialize content, don't change structure
- ❌ FORBIDDEN: Skipping inheritance levels
- ❌ FORBIDDEN: Removing required zones

---

### Extending BaseWindow → AppWindow

**What AppWindow Adds**:
- ✅ Toolbar zone (optional)
- ✅ Status bar zone (optional)
- ✅ Zone management logic

**Example**:
```jsx
// AppWindow.tsx
export function AppWindow({ title, toolbar, statusBar, children }) {
  return (
    <div className={styles.window}>
      <div className={styles.chrome}>
        <div className={styles.titleBar}>
          {/* Title bar controls */}
        </div>

        {toolbar && <div className={styles.toolbar}>{toolbar}</div>}

        <div className={styles.contentOuter}>
          <div className={styles.content}>{children}</div>
        </div>

        {statusBar && <div className={styles.statusBar}>{statusBar}</div>}
      </div>
    </div>
  )
}
```

---

### Extending AppWindow → FinderWindow

**What FinderWindow Adds**:
- ✅ Breadcrumb navigation (left toolbar)
- ✅ View toggle (right toolbar)
- ✅ Icon grid / List view switching
- ✅ Selection status (status bar)

**Example**:
```jsx
// FinderWindow.tsx
export function FinderWindow({ path, view, onNavigate, children }) {
  const toolbar = (
    <>
      <Breadcrumb path={path} onNavigate={onNavigate} />
      <ViewToggle view={view} onChange={setView} />
    </>
  )

  const statusBar = (
    <StatusText>{selectedCount} items selected</StatusText>
  )

  return (
    <AppWindow toolbar={toolbar} statusBar={statusBar}>
      {view === 'icon' ? <IconView /> : <ListView />}
    </AppWindow>
  )
}
```

**Rules**:
- ✅ Breadcrumb MUST be left-aligned in toolbar
- ✅ View toggle MUST be right-aligned
- ✅ MUST support both icon and list views
- ❌ FORBIDDEN: Custom toolbar layouts

---

## Composite Components

### Standard Button Components

#### Retro Button

**Usage**: OK/Cancel buttons, dialog actions

**Structure**:
```jsx
<button className={styles.button}>
  {children}
</button>
```

**SCSS**:
```scss
.button {
  @include mixins.retro-button;
  padding: tokens.$space-4 tokens.$space-20;
}
```

**Rules**:
- ✅ MUST use `retro-button` mixin
- ✅ Padding MUST be 4px vertical, 20px horizontal
- ✅ Font MUST be 14px bold
- ❌ FORBIDDEN: Custom bevel logic

---

#### Toolbar Toggle Button

**Usage**: View toggles, format buttons

**Structure**:
```jsx
<button className={`${styles.toolbarButton} ${active ? styles.active : ''}`}>
  {icon}
</button>
```

**SCSS**:
```scss
.toolbarButton {
  @include mixins.toolbar-toggle-button;
  width: tokens.$size-24;
  height: tokens.$size-24;
}
```

**Rules**:
- ✅ MUST use `toolbar-toggle-button` mixin
- ✅ MUST be 24x24px for icon buttons
- ✅ MUST support `.active` class
- ❌ FORBIDDEN: Custom dimensions for standard buttons

---

### Menu Components

#### Menu Bar

**Structure**:
```jsx
<div className={styles.menuBar}>
  <div className={styles.left}>
    <MenuItem label="File" />
    <MenuItem label="Edit" />
  </div>
  <div className={styles.right}>
    <MenuItem label="Help" />
  </div>
</div>
```

**SCSS**:
```scss
.menuBar {
  @include mixins.menu-bar;

  .left, .right {
    display: flex;
  }
}
```

**Rules**:
- ✅ MUST use `menu-bar` mixin
- ✅ Height MUST be 22px
- ✅ MUST have left/right sections
- ❌ FORBIDDEN: Custom heights

---

#### Dropdown Menu

**Structure**:
```jsx
<div className={styles.dropdown}>
  <div className={styles.dropdownItem}>Open...</div>
  <div className={styles.dropdownItem}>Save</div>
  <div className={styles.separator}></div>
  <div className={`${styles.dropdownItem} ${styles.disabled}`}>Print</div>
</div>
```

**SCSS**:
```scss
.dropdown {
  @include mixins.menu-dropdown;
}

.dropdownItem {
  @include mixins.menu-dropdown-item;
}

.separator {
  height: tokens.$space-1;
  background: tokens.$color-border-gray;
  margin: tokens.$space-2 0;
}
```

**Rules**:
- ✅ MUST use `menu-dropdown` and `menu-dropdown-item` mixins
- ✅ Separator MUST be 1px height, 2px vertical margin
- ✅ Disabled items MUST use `.disabled` class
- ❌ FORBIDDEN: Custom separator heights

---

### Grid Components

#### Icon Grid

**Structure**:
```jsx
<div className={styles.iconGrid}>
  <div className={styles.iconItem}>
    <img className={styles.icon} />
    <div className={styles.label}>File name</div>
  </div>
</div>
```

**SCSS**:
```scss
.iconGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: tokens.$space-16; // MUST be 16px
  padding: tokens.$space-8;
}

.iconItem {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: tokens.$space-4;
}

.icon {
  width: tokens.$size-48;
  height: tokens.$size-48;
}

.label {
  font-size: tokens.$font-size-11;
  text-align: center;
  overflow-wrap: break-word;
  max-width: tokens.$size-80;
}
```

**Rules**:
- ✅ Gap MUST be 16px (authentic OS9 spacing)
- ✅ Icons MUST be 48x48px
- ✅ Labels MUST be 11px, center-aligned
- ✅ Labels MUST use `overflow-wrap: break-word`
- ❌ FORBIDDEN: Custom grid gaps
- ❌ FORBIDDEN: Icon sizes other than 48px

---

## Anti-Patterns

### ❌ FORBIDDEN: Custom Window Structure

**WRONG**:
```jsx
<div className="myCustomWindow">
  <div className="header">...</div>
  <div className="body">...</div>
</div>
```

**CORRECT**:
```jsx
<div className="window">
  <div className="titleBar">...</div>
  <div className="contentOuter">
    <div className="content">...</div>
  </div>
</div>
```

---

### ❌ FORBIDDEN: Single-Layer Content

**WRONG**:
```jsx
<div className="window">
  <div className="content">...</div> {/* Missing contentOuter! */}
</div>
```

**CORRECT**:
```jsx
<div className="window">
  <div className="contentOuter">
    <div className="content">...</div>
  </div>
</div>
```

**Why**: 2-layer structure creates authentic OS9 inset depth.

---

### ❌ FORBIDDEN: Custom Toolbar Heights

**WRONG**:
```scss
.toolbar {
  height: 32px; // Custom height!
}
```

**CORRECT**:
```scss
.toolbar {
  @include mixins.toolbar-strip; // Uses min-height: 28px
}
```

---

### ❌ FORBIDDEN: Reordering Zones

**WRONG**:
```jsx
<div className="window">
  <div className="statusBar">...</div> {/* Status bar FIRST?! */}
  <div className="content">...</div>
  <div className="toolbar">...</div>
</div>
```

**CORRECT**:
```jsx
<div className="window">
  <div className="toolbar">...</div>
  <div className="content">...</div>
  <div className="statusBar">...</div>
</div>
```

**Why**: Zone order is part of the OS9 aesthetic.

---

### ❌ FORBIDDEN: Manual Bevel Logic

**WRONG**:
```scss
.button {
  border-top: 1px solid white;
  border-left: 1px solid white;
  border-right: 1px solid gray;
  border-bottom: 1px solid gray;
}
```

**CORRECT**:
```scss
.button {
  @include mixins.retro-button;
}
```

---

## Enforcement

### Code Review Checklist

**For all new components**:
- [ ] Uses correct window structure (titleBar → toolbar → content → statusBar)
- [ ] 2-layer content structure (contentOuter + content)
- [ ] All zones use appropriate mixins
- [ ] Zone heights follow standards (18px titleBar, 28px toolbar, 20px statusBar)
- [ ] SCSS nesting mirrors JSX structure
- [ ] No custom bevel/border logic
- [ ] Icon grids use 16px gap
- [ ] Table headers use 2px border

### Testing Requirements

**Baseline tests MUST verify**:
- Zone heights (18px, 28px, 20px)
- Zone order (top to bottom)
- Mixin usage (var(--) references)
- Grid spacing (16px for icons)
- No structural drift

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-22 | **Initial Component Blueprints**: Window hierarchy, zone system, composite components, anti-patterns |

---

## Related Documentation

- **Interaction Blueprint**: `INTERACTION_BLUEPRINT.md` - How components behave (hover, pressed, drag, focus)
- **Design System**: `DESIGN_SYSTEM.md` - How components look (tokens, mixins, visual rules)
- **Mixin API**: `DESIGN_SYSTEM.md#mixin-api-reference`
- **Token Reference**: `src/styles/_tokens.scss`
