## 1. Define SCSS token layer

- [x] 1.1 Add tests that capture key window, button, and menu colors/borders (e.g., via `getComputedStyle` on representative components) to lock in current visual behavior.
- [x] 1.2 Introduce a global SCSS tokens partial (e.g., `src/styles/_tokens.scss`) defining shared color, border, shadow, spacing, and typography variables for the retro UI.
- [x] 1.3 Wire SCSS tokens to existing CSS variables in `src/styles/global.scss` where applicable (e.g., base background, highlight, border colors) so theme adjustments happen in one place.

## 2. Introduce shared mixins

- [x] 2.1 Create a SCSS mixins partial (e.g., `src/styles/_mixins.scss`) exposing reusable mixins for:
  - Window chrome (outer window container, title bar, content frame)
  - Retro buttons (primary, secondary, toolbar, calculator keys)
  - Menus (menu bar items, dropdown menus, disabled/active/hover states)
- [x] 2.2 Update at least one OS shell component (`Window.module.scss`) to use window chrome mixins while keeping its current behavior and visuals unchanged.
- [x] 2.3 Update at least one representative app component (`Calculator.module.scss` or `TextEditor.module.scss`) to use button mixins while preserving existing pressed/hover behavior.
- [x] 2.4 Update a menu surface (`MenuBar.module.scss` and/or `ContextMenu.module.scss`) to use menu-related mixins for hover/active/disabled states.

## 3. Align SCSS structure with components

- [x] 3.1 Refactor selected SCSS modules to use SCSS nesting such that selectors clearly mirror the component JSX structure (e.g., `.window { .titleBar { ... } .contentOuter { ... } }`).
- [x] 3.2 Ensure refactored modules remain CSS-module friendly (avoid over-nesting or global selectors) and keep class names stable for TypeScript imports.
- [x] 3.3 Expand the nesting pattern to additional components (Desktop, Finder, TextEditor) once the approach is validated on a smaller set.

## 4. Complete rollout and clean-up

- [x] 4.1 Gradually migrate remaining OS shell and app SCSS modules to use the token and mixin layer, removing duplicated magic values where reasonable.
- [x] 4.2 Remove obsolete or unused style definitions uncovered during the migration (while preserving behavior and tests).
- [x] 4.3 Update or add tests where necessary to ensure that window/menu/button visuals still match the retro OS 9 aesthetic after refactoring.
- [x] 4.4 Run `pnpm lint`, `pnpm test`, and `pnpm build` to validate the change end-to-end and adjust as needed.

## 5. Add SCSS linting to enforce design system

- [x] 5.1 Install stylelint with standard SCSS configuration and plugins (`stylelint`, `stylelint-config-standard-scss`, `stylelint-scss`).
- [x] 5.2 Configure `.stylelintrc.json` to prohibit literal hex colors in component files while allowing them in token definition files (`_tokens.scss`, `global.scss`).
- [x] 5.3 Add npm scripts (`lint:css`, `lint:all`) for running SCSS linting and combined JS+CSS linting.
- [x] 5.4 Auto-fix formatting issues across all SCSS files to ensure compliance with linting rules.
- [x] 5.5 Create `SCSS_LINTING.md` documentation explaining the linting setup, rules, and integration options.

## 6. Create comprehensive visual specification (Design System v2)

- [x] 6.1 Create `DESIGN_SYSTEM.md` as the official visual specification and single source of truth for design decisions.
- [x] 6.2 Document all visual physics rules (shadow rules, border rules, inset depth rules, stripe pattern rules).
- [x] 6.3 Document bevel system with direction matrix, usage scenarios, and complete API reference for all bevel mixins.
- [x] 6.4 Document typography rules with font size mapping table, line height standards, and usage scenarios for each size.
- [x] 6.5 Document layout rules including spacing distribution, grid vs flex principles, Finder layout standards, and Desktop icon label wrapping.
- [x] 6.6 Document complete mixin API reference for all 17 mixins (window system, button system, menu system, toolbar/status bar) with signatures, parameters, output, usage rules, and examples.
- [x] 6.7 Document component patterns (window structure, nesting rules) and forbidden patterns (literal values, duplicated logic, modern CSS).
- [x] 6.8 Update `SCSS_LINTING.md` to reference `DESIGN_SYSTEM.md` as the primary visual specification.
