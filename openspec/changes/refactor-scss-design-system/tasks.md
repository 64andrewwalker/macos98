## 1. Define SCSS token layer

- [ ] 1.1 Add tests that capture key window, button, and menu colors/borders (e.g., via `getComputedStyle` on representative components) to lock in current visual behavior.
- [ ] 1.2 Introduce a global SCSS tokens partial (e.g., `src/styles/_tokens.scss`) defining shared color, border, shadow, spacing, and typography variables for the retro UI.
- [ ] 1.3 Wire SCSS tokens to existing CSS variables in `src/styles/global.scss` where applicable (e.g., base background, highlight, border colors) so theme adjustments happen in one place.

## 2. Introduce shared mixins

- [ ] 2.1 Create a SCSS mixins partial (e.g., `src/styles/_mixins.scss`) exposing reusable mixins for:
  - Window chrome (outer window container, title bar, content frame)
  - Retro buttons (primary, secondary, toolbar, calculator keys)
  - Menus (menu bar items, dropdown menus, disabled/active/hover states)
- [ ] 2.2 Update at least one OS shell component (`Window.module.scss`) to use window chrome mixins while keeping its current behavior and visuals unchanged.
- [ ] 2.3 Update at least one representative app component (`Calculator.module.scss` or `TextEditor.module.scss`) to use button mixins while preserving existing pressed/hover behavior.
- [ ] 2.4 Update a menu surface (`MenuBar.module.scss` and/or `ContextMenu.module.scss`) to use menu-related mixins for hover/active/disabled states.

## 3. Align SCSS structure with components

- [ ] 3.1 Refactor selected SCSS modules to use SCSS nesting such that selectors clearly mirror the component JSX structure (e.g., `.window { .titleBar { ... } .contentOuter { ... } }`).
- [ ] 3.2 Ensure refactored modules remain CSS-module friendly (avoid over-nesting or global selectors) and keep class names stable for TypeScript imports.
- [ ] 3.3 Expand the nesting pattern to additional components (Desktop, Finder, TextEditor) once the approach is validated on a smaller set.

## 4. Complete rollout and clean-up

- [ ] 4.1 Gradually migrate remaining OS shell and app SCSS modules to use the token and mixin layer, removing duplicated magic values where reasonable.
- [ ] 4.2 Remove obsolete or unused style definitions uncovered during the migration (while preserving behavior and tests).
- [ ] 4.3 Update or add tests where necessary to ensure that window/menu/button visuals still match the retro OS 9 aesthetic after refactoring.
- [ ] 4.4 Run `pnpm lint`, `pnpm test`, and `pnpm build` to validate the change end-to-end and adjust as needed.

