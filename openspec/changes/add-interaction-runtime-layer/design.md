# Interaction Runtime Layer – Design

## 1. Goals

The Interaction Runtime Layer turns the behavioral rules in `INTERACTION_BLUEPRINT.md` into a small, reusable hook/context library that:

- Enforces OS9‑authentic interactions (drag zones, button states, menu mode, selection, keyboard nav) consistently across all apps and OS shell components.
- Keeps visual rules in the SCSS Design System (tokens + mixins) while centralizing state machines and event handling in TypeScript.
- Provides a clear API surface so new components can “opt in” to the blueprint by using the runtime layer instead of re‑implementing behavior.

High‑level flow:

```text
INTERACTION_BLUEPRINT.md
        ↓ (requirements)
Interaction Runtime Layer (hooks + providers)
        ↓ (state + events)
React Components (Window / MenuBar / Finder / Desktop / dialogs)
        ↓ (classes + data-attributes)
SCSS Design System (tokens + mixins)
```

---

## 2. Directory Structure

Planned runtime layout:

```text
src/
  runtime/
    interaction/
      index.ts                    # Re-exports all public hooks/providers
      titleBar.ts                 # useTitleBarInteraction
      buttonState.ts              # useButtonStateMachine
      windowManager.tsx           # WindowManagerProvider + useWindowRegistration
      menuMode.tsx                # MenuModeProvider + useMenuMode
      finderSelection.ts          # useFinderSelection
```

Usage in components:

- OS shell: `src/components/os/Window.tsx`, `MenuBar.tsx`, `Desktop.tsx`, dialogs import from `src/runtime/interaction`.
- Apps: `src/components/apps/Finder.tsx`, `TextEditor.tsx`, others can adopt the hooks gradually.

---

## 3. Module Relationships

At a glance:

```text
WindowManagerProvider
  ├─ useWindowRegistration(windowId)
  │    └─ Window / dialog components
  └─ (optionally) used by menu/dialog layers

MenuModeProvider
  ├─ useMenuMode()
  │    └─ MenuBar titles + dropdowns
  └─ uses useButtonStateMachine for menu item visuals

useButtonStateMachine()
  ├─ Toolbar buttons (Finder view toggle, TextEditor toolbar)
  ├─ Dialog buttons (OK/Cancel)
  └─ Menu titles/items (with MenuMode)

useTitleBarInteraction()
  └─ Window title bars (and any draggable windows)
        ↳ may call focusWindow() from useWindowRegistration

useFinderSelection()
  ├─ Finder icon grid + list view
  └─ Desktop icons (shared selection model)
```

Interactions between layers:

- **Blueprint → Runtime:** `INTERACTION_BLUEPRINT.md` defines what must happen (zones, states, keyboard rules). Each runtime module is a concrete state machine / event handler implementing those requirements.
- **Runtime → Components:** Components consume the runtime hooks/providers and apply returned `props` and `state` to DOM nodes.
- **Components → SCSS:** Components map runtime state to classes / `data-*` attributes. SCSS tokens + mixins render the correct visual treatment (bevels, stripes, selection fills, focus rings).

---

## 4. Mini API Reference

All hooks/providers are exported from `src/runtime/interaction/index.ts`.

### 4.1 `useTitleBarInteraction`

**Purpose:** Centralize OS9 window dragging and drag‑zone rules for title bars.

```ts
function useTitleBarInteraction(options: {
  windowId: string
  initialPosition: { x: number; y: number }
}): {
  position: { x: number; y: number }
  isDragging: boolean
  titleBarProps: React.HTMLAttributes<HTMLDivElement>
  dragZoneProps: React.HTMLAttributes<HTMLDivElement>
}
```

- `position`: current window position, to be applied to the outer window container.
- `titleBarProps`: handles focus/capture; does **not** start drag from title text or control boxes.
- `dragZoneProps`: starts dragging when the user presses in the left drag zone only.

**Example:**

```tsx
const { position, titleBarProps, dragZoneProps } = useTitleBarInteraction({
  windowId: id,
  initialPosition: { x, y },
})

return (
  <div className={styles.window} style={{ left: position.x, top: position.y }}>
    <div className={styles.titleBar} {...titleBarProps}>
      <div className={styles.closeBox} onClick={onClose} />
      <div className={styles.dragZone} {...dragZoneProps} />
      <div className={styles.title}>
        <span className={styles.titleText}>{title}</span>
      </div>
      {/* zoom / collapse boxes */}
    </div>
    {/* content */}
  </div>
)
```

---

### 4.2 `useButtonStateMachine`

**Purpose:** Provide shared hover/pressed/focus/toggle/disabled state for all retro buttons, enforcing state priority and keyboard behavior.

```ts
function useButtonStateMachine<T extends HTMLElement>(
  ref: React.RefObject<T>,
  options?: {
    toggle?: boolean
    disabled?: boolean
    role?: 'default' | 'menuitem' | 'toolbar'
  },
): {
  state: {
    hovered: boolean
    pressed: boolean
    focused: boolean
    active: boolean
    disabled: boolean
  }
  buttonProps: React.HTMLAttributes<T> & {
    'data-active'?: boolean
    'data-pressed'?: boolean
    'data-focus-visible'?: boolean
  }
}
```

- `state`: runtime view of the button’s interaction state.
- `buttonProps`: event handlers + attributes for mapping to SCSS (bevel flip, focus ring, active toggle).

**Example (Finder toolbar toggle):**

```tsx
const iconRef = useRef<HTMLButtonElement>(null)
const { buttonProps } = useButtonStateMachine(iconRef, { toggle: true })

return (
  <button
    ref={iconRef}
    className={clsx(styles.viewButton, viewMode === 'icon' && styles.active)}
    {...buttonProps}
    onClick={() => setViewMode('icon')}
  >
    ⊞
  </button>
)
```

---

### 4.3 `WindowManagerProvider` / `useWindowRegistration`

**Purpose:** Manage global window focus and z‑index and expose active/inactive state for dimming.

```ts
function WindowManagerProvider(props: { children: React.ReactNode }): JSX.Element

function useWindowRegistration(windowId: string): {
  isActive: boolean
  zIndex: number
  windowProps: React.HTMLAttributes<HTMLDivElement>
}
```

- `WindowManagerProvider`: wraps the desktop shell (likely in `App.tsx` or `Desktop.tsx`).
- `windowProps`: includes focus handlers (e.g., `onMouseDown`) and an inline style `zIndex`, plus data attributes like `data-active`.

**Example (Window component):**

```tsx
const { isActive, zIndex, windowProps } = useWindowRegistration(id)

return (
  <div
    className={clsx(styles.window, isActive ? styles.active : styles.inactive)}
    style={{ left: position.x, top: position.y, zIndex }}
    {...windowProps}
  >
    {/* title bar + content */}
  </div>
)
```

---

### 4.4 `MenuModeProvider` / `useMenuMode`

**Purpose:** Implement OS9 menu mode (click to enter, hover to switch in menu mode, click outside/Esc to exit, keyboard arrows + Enter/Esc).

```ts
function MenuModeProvider(props: { children: React.ReactNode }): JSX.Element

function useMenuMode(): {
  isMenuMode: boolean
  openMenuId: string | null
  enterMenuMode: (menuId: string) => void
  hoverMenu: (menuId: string) => void
  exitMenuMode: () => void
  getMenuTitleProps: (menuId: string) => React.HTMLAttributes<HTMLDivElement>
  getMenuListProps: (menuId: string) => React.HTMLAttributes<HTMLDivElement>
}
```

**Example (MenuBar title + dropdown):**

```tsx
const { openMenuId, getMenuTitleProps, getMenuListProps } = useMenuMode()
const fileOpen = openMenuId === 'file'

return (
  <div
    className={clsx(styles.menuItem, fileOpen && styles.active)}
    {...getMenuTitleProps('file')}
  >
    File
    {fileOpen && (
      <div className={styles.dropdown} {...getMenuListProps('file')}>
        {/* items */}
      </div>
    )}
  </div>
)
```

---

### 4.5 `useFinderSelection`

**Purpose:** Provide shared selection + keyboard navigation for Finder icon/list views and desktop icons, using blue‑fill + white‑text + inner shadow visuals (no bevel).

```ts
function useFinderSelection(
  model: 'grid' | 'list',
  items: { id: string }[],
): {
  selectedIds: Set<string>
  focusedId: string | null
  getItemProps: (id: string) => {
    selected: boolean
    focused: boolean
    itemProps: React.HTMLAttributes<HTMLElement> & {
      'data-selected'?: boolean
      'data-focused'?: boolean
      tabIndex?: number
    }
  }
  containerProps: React.HTMLAttributes<HTMLElement>
}
```

- `containerProps`: attaches keyboard handlers (`onKeyDown`) for arrow keys, Enter/Return, Cmd/Shift modifiers.
- `getItemProps(id)`: returns flags and DOM props for each item.

**Example (Finder icon view):**

```tsx
const { selectedIds, getItemProps, containerProps } = useFinderSelection(
  'grid',
  items.map(item => ({ id: item.id })),
)

return (
  <div className={styles.iconView} {...containerProps}>
    {items.map(item => {
      const { selected, itemProps } = getItemProps(item.id)
      return (
        <div
          key={item.id}
          className={clsx(styles.iconItem, selected && styles.selected)}
          {...itemProps}
          onDoubleClick={() => handleDoubleClick(item)}
        >
          {renderIconVisual(item, 'large')}
          <span className={styles.label}>{item.name}</span>
        </div>
      )
    })}
  </div>
)
```

---

## 5. Blueprint ↔ Runtime ↔ Tests Mapping

This table links `INTERACTION_BLUEPRINT.md` sections to runtime modules and planned tests.

| Blueprint section              | Runtime module             | Test coverage (target)           | Status  |
| ------------------------------ | -------------------------- | -------------------------------- | ------- |
| Title Bar Drag Zones           | `useTitleBarInteraction`   | Window interaction tests         | pending |
| Button State Machine / Priority| `useButtonStateMachine`    | Retro button / toolbar tests     | pending |
| Window Focus / Inactive        | `WindowManagerProvider` + `useWindowRegistration` | Window focus/z‑index tests       | pending |
| Menu Interaction Model (Menu Mode) | `MenuModeProvider` + `useMenuMode` | `MenuBar` interaction tests      | pending |
| Finder Selection Rules         | `useFinderSelection`       | Finder selection tests           | pending |
| Keyboard Navigation            | All of the above           | Integration + keyboard‑nav tests | pending |

As each runtime module is implemented and tests are added, the “Status” column can be updated (`pending` → `implemented` → `shipped`) to make review and maintenance straightforward.

