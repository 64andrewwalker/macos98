## Why

The current styling for the macOS 98 desktop is largely implemented with duplicated literals inside individual `*.module.scss` files (e.g., `#dddddd`, `#000000`, repeated border/shadow definitions) and a thin layer of global CSS variables in `src/styles/global.scss`.
This makes it difficult to:
- Keep the retro OS 9 aesthetic perfectly consistent across windows, buttons, menus, and apps
- Evolve or tweak colors, spacing, or shadow treatments in one place
- Onboard new components into the same “system look” without copying and slightly modifying existing styles

You explicitly called out three pain points:
- P1: A missing global SCSS variable system (colors, shadow, border, spacing) to anchor the retro UI
- P2: Lack of shared mixins for windows, buttons, menus, causing repeated styling logic
- P3: SCSS not consistently structured/nested to mirror component structure, making it harder to reason about

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

