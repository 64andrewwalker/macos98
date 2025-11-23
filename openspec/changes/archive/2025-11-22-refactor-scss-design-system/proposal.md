## Why

The current styling for the macOS 98 desktop is largely implemented with duplicated literals inside individual `*.module.scss` files (e.g., `#dddddd`, `#000000`, repeated border/shadow definitions) and a thin layer of global CSS variables in `src/styles/global.scss`.

### Current Problems

**Inconsistency & Duplication:**
- Window chrome, 3D bevels, and shadow logic are reimplemented in each component
- Menu hover states, button pressed states, and titlebar stripes are hand-coded multiple times
- Small visual differences emerge between Calculator buttons, Finder toolbars, and TextEditor controls

**Maintenance Burden:**
- Changing a border color requires hunting through 10+ SCSS files
- Adding a new spacing value means manually updating individual components
- Refactoring is risky—no single source of truth for "what is a window" or "what is a button"

**Developer Experience:**
- New contributors must reverse-engineer the retro aesthetic from scattered examples
- No clear API for "how to make a window" or "how to style a menu"
- SCSS structure doesn't match component JSX hierarchy, making code hard to navigate

### Technical Pain Points

Three critical architectural gaps:
- **P1**: Missing global SCSS token system for colors, shadows, borders, spacing, and typography
- **P2**: Lack of shared mixins for windows, buttons, and menus, leading to repeated bevel/shadow/state logic
- **P3**: SCSS not consistently structured/nested to mirror component structure, making it harder to reason about and maintain

## What Changes

- Establish a dedicated SCSS “style system” layer that complements the existing CSS variables:
  - Introduce global SCSS tokens for colors, shadows, borders, spacing, and typography primitives
  - Ensure tokens are wired to existing CSS variables (e.g., `--sys-bg-color`, `--sys-border-*`) where appropriate, so theming remains centralized
- Define shared SCSS mixins for core retro UI elements:
  - Window chrome (outer window, title bar, content frame)
  - Retro buttons (calculator keys, toolbar buttons, OK/Cancel buttons)
  - Menus (menu bar, dropdowns, context menus, disabled/active states)
- Refactor component SCSS modules to:
  - Import and use the shared token/mixin layer instead of repeating literals
  - Use SCSS nesting so selectors clearly follow the component structure (e.g., `.window { .titleBar { ... } }`)
  - Keep retro aesthetics intact while reducing divergence between apps and OS shell components
- Add minimal but meaningful tests/spec coverage around the styling system so future refactors can be verified (e.g., checking that key windows/buttons/menus still expose expected colors and border treatments via DOM inspection).

## Impact

- Affects styling files only:
  - `src/styles/**/*` (new token/mixin partials and any updates to global styles)
  - OS shell SCSS modules such as `src/components/os/Window.module.scss`, `MenuBar.module.scss`, `Desktop.module.scss`, `ContextMenu.module.scss`, `InfoDialog.module.scss`, `DesktopIcon.module.scss`
  - App SCSS modules such as `src/components/apps/Calculator.module.scss`, `Finder.module.scss`, `TextEditor.module.scss`, `BackgroundSwitcher.module.scss`, `About.module.scss`, `TicTacToe.module.scss`
- TypeScript/React runtime behavior (window management, app logic) should not change; all changes are presentational and should preserve existing behavior.
- Visual behavior from a user perspective must remain faithful to the current retro look:
  - Window chrome, menu hover, and button pressed states should continue to look and feel the same or more consistent (no “modernizing” of the design).
- Testing impact:
  - Some existing tests may need minor adjustments if they rely on specific class names or inline snapshot styles.
  - New tests will be added to assert that key UI surfaces still expose expected computed styles derived from the shared system.

## Non-Goals

- Introducing a full theming system with multiple color themes or dark mode (beyond leveraging the existing CSS variables).
- Changing the fundamental retro visual identity (no large-scale redesign, only consolidation and consistency improvements).
- Replacing SCSS with another styling solution (e.g., CSS-in-JS, Tailwind).

