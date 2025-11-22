## Why

The interaction model for macOS 98 is now fully specified in `INTERACTION_BLUEPRINT.md`, but the runtime layer does not yet enforce those rules in a unified way. Core OS9 behaviors like title bar drag zones, button state priority, window focus dimming, menu “menu mode”, Finder selection, and keyboard navigation are described in detail but only partially (and inconsistently) implemented across components.

### Current Problems

- **Spec–runtime gap:** Window dragging, menu interaction, selection, and keyboard navigation are implemented ad‑hoc in `Window.tsx`, `MenuBar.tsx`, `Finder.tsx`, `Desktop.tsx`, and dialog components instead of via a shared interaction library.
- **Title bar drag zone:** The current `Window` component treats almost the entire title bar as draggable (excluding control boxes), contrary to the blueprint’s “left empty zone only” rule for drag, and this logic is baked directly into the component.
- **Button behavior divergence:** Buttons rely mostly on CSS pseudo‑classes and per‑component styles; there is no shared **button state machine** that guarantees `:active` overrides `:hover`, bevel flip rules, focus ring, and toggle/toolbar/menu variants in one place.
- **Window focus/inactive behavior:** Desktop tracks `activeWindowId`, but there is no centralized `WindowManager` for focus/z‑index/inactive state, and inactive windows are not consistently visually dimmed according to the blueprint.
- **Menu mode missing as a first‑class concept:** `MenuBar` has local `activeMenu` state and hover logic, but there is no reusable **Menu Mode Engine** that correctly implements “click to enter menu mode, hover to switch while in menu mode, click outside to exit” as specified.
- **Finder selection & keyboard navigation:** Finder and Desktop icons implement selection with local state and basic click handlers; multi‑select, keyboard arrows, and the exact blue‑fill + inner‑shadow + white‑text selection model are not enforced by a shared selection engine.
- **Risk of divergence:** If every new app or OS component hand‑rolls interaction logic, the system will drift away from the blueprint and the spec layer will become advisory instead of authoritative.

## What Changes

Introduce a dedicated **Interaction Runtime Layer** under `src/runtime/interaction/` that turns the rules in `INTERACTION_BLUEPRINT.md` into reusable, testable primitives. This layer will be consumed by OS shell components (`Window`, `MenuBar`, `Desktop`, dialogs) and apps (`Finder`, `TextEditor`, etc.), so they don’t re‑implement interaction logic.

- **1. TitleBar Interaction Engine**
  - Add `useTitleBarInteraction` (and supporting utilities) that encapsulate drag behavior for window title bars:
    - Enforces “only left drag zone is draggable” (between close box and title text).
    - Prevents drag from title text, control buttons, and right‑hand empty space.
    - Provides position state and mouse handlers that `Window` (and any future window‑like components) can attach without re‑implementing drag math.
  - Refactor `src/components/os/Window.tsx` to use this engine instead of inline drag logic, and align its DOM to the blueprint’s `dragZone` structure.

- **2. Button State Machine (Runtime)**
  - Introduce `useButtonStateMachine(ref, options)` where:
    - `ref` points to the underlying `<button>`/clickable element.
    - `options` supports `toggle` buttons (toolbar, view mode), `menu` buttons (menu items), and optional `disabled` state.
  - The hook:
    - Tracks `hover`, `pressed`, `focused`, `activeToggle`, and `disabled` flags.
    - Enforces state priority so `pressed` (active) always overrides `hover`, and focus ring is applied via `:focus-visible` or a `data-focus-visible` attribute.
    - Exposes a small state object and `buttonProps` (event handlers + `data-*` attributes) for SCSS to map to bevel‑outset/bevel‑inset and focus ring styles.
  - Integrate with existing SCSS mixins (`retro-button`, `toolbar-toggle-button`, dialog buttons) so visual rules remain in SCSS while interaction state lives in the runtime layer.

- **3. Window Focus Manager**
  - Add a `WindowManagerProvider` and `useWindowRegistration(windowId)` hook that:
    - Tracks `activeWindowId` and z‑index ordering for all registered windows.
    - Provides `isActive`, `zIndex`, and `focusWindow()` to each window.
    - Applies a consistent inactive state (e.g., `data-window-active="true|false"` or `window--active`/`window--inactive` classes) so SCSS can dim title bars, reduce bevel contrast, and slightly lower content opacity per the blueprint.
  - Migrate window focus/z‑index logic out of `Desktop.tsx` into this manager, and update `Window.tsx`, dialogs, and any other window‑like components to register with it.

- **4. Menu Mode Engine**
  - Introduce `MenuModeProvider` + `useMenuMode()` to model classic OS9 menu mode:
    - `enterMenuMode(menuId)` on menu title click.
    - `hoverMenu(menuId)` switches menus only while in menu mode.
    - `exitMenuMode(reason)` on click outside, Escape, or selection.
    - Tracks `isMenuMode`, `openMenuId`, and keyboard navigation (arrow keys, Enter, Esc).
  - Refactor `src/components/os/MenuBar.tsx` to use this engine and stop relying on raw hover to open menus.
  - Wire menu titles and dropdowns to use `useButtonStateMachine` and `useMenuMode` together so visual active/hover states follow the interaction blueprint.

- **5. Finder Selection Engine**
  - Implement `useFinderSelection(model)` as a reusable selection engine for Finder and desktop‑style icon grids:
    - Supports both `grid` and `list` layouts.
    - Handles single selection, multi‑selection (`Cmd+Click`, `Shift+Click`), and range selection anchored by last focused item.
    - Provides `selectedIds`, `focusedId`, `onItemClick`, and `onKeyDown` handlers (arrow keys, Enter/Return, Space) according to the blueprint’s keyboard navigation rules.
    - Exposes `getItemSelectionProps(id)` to add `data-selected`, `data-focused`, and appropriate classes for SCSS to render blue fill + inner shadow + white text (no button bevel).
  - Refactor `Finder.tsx` (icon and list view) and desktop icon selection in `Desktop.tsx` to consume this engine instead of manual `selectedId` state.

- **6. Keyboard Navigation Integration**
  - Ensure the runtime layer covers keyboard navigation for:
    - Buttons (focus ring, Space/Enter invoke, Tab order).
    - Menus (F10 or Alt/Control interaction, arrow navigation within menu bar and dropdowns, Esc to exit menu mode).
    - Finder/list/grid views (arrow navigation, Enter to open, Command+Arrow shortcuts where applicable).
  - Prefer `:focus-visible` and data‑driven focus indicators over `:focus` alone, to stay consistent with `INTERACTION_BLUEPRINT.md`.

## Impact

- **Behavioral changes (intended):**
  - Title bar dragging becomes stricter and OS9‑authentic (only left drag zone, no accidental drags from title text or controls).
  - Menu bar interaction shifts to a true OS9 menu mode model, which may feel slightly different from current hover‑open behavior but matches the blueprint.
  - Finder and desktop selection gain multi‑select and keyboard navigation, with blue‑fill + white‑text selection visuals driven by a shared engine.
  - Window focus/inactive state becomes more visually distinct and centrally managed.
- **Code structure changes:**
  - New runtime folder (`src/runtime/interaction/`) introduces hooks and context providers.
  - OS shell and app components will be refactored to consume these primitives instead of embedding interaction logic.
- **Testing:**
  - New tests will be added for each engine (TitleBar, Button state machine, WindowManager, MenuMode, Finder selection) using Vitest + Testing Library, following the existing style of behavioral tests for `Window`, `MenuBar`, and `Finder`.
  - Some existing tests may need updates where they assert current interaction behavior that deviates from the blueprint (e.g., entire title bar drag, hover‑open menus).

## Non-Goals

- Changing visual token values or SCSS mixin definitions beyond what is needed to support new interaction state classes/attributes.
- Implementing window resizing or new window management features beyond focus, z‑index, and inactive dimming.
- Introducing a global keyboard shortcut system beyond what is required for menu mode and Finder/list navigation.
- Replacing React Context with an external state library; the interaction runtime layer will be built with hooks and context only.

