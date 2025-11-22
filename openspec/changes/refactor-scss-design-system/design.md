## Overview

This change introduces a structured SCSS design system for the macOS 98 UI that sits alongside the existing CSS variables in `src/styles/global.scss`.
The goal is to centralize primitives (tokens) and patterns (mixins) so that windows, buttons, and menus all share the same retro styling rules without duplicating literals.

The design has three layers:
- **Token layer**: SCSS variables and maps for colors, borders, shadows, spacing, and typography primitives.
- **Mixin layer**: Composable SCSS mixins that apply retro treatments (beveled borders, 3D buttons, menu hover states) built on top of tokens.
- **Component layer**: Individual `*.module.scss` files that import and apply tokens/mixins while using nested selectors to mirror JSX structure.

## Token Layer

- Introduce `src/styles/_tokens.scss` as the canonical place for SCSS-level tokens:
  - Color tokens: window background, content background, highlight, disabled, focus, menu background, selection background, text colors.
  - Border tokens: light, dark, mid-gray for bevel effects, divider colors, focus outlines.
  - Shadow tokens: window drop shadows, inset shadows for screens/displays, overlay shadows (e.g., dialogs).
  - Spacing tokens: small, medium, large spacing units for padding/gaps, tuned to pixel-perfect retro values.
  - Typography tokens: system font family, mono font, small/medium font sizes commonly used across the UI.
- Tokens SHOULD be derived from or aligned with CSS variables defined in `src/styles/global.scss` when possible (e.g., base system background, highlight, border colors), so theming remains centralized and changing a CSS variable reflects across SCSS users.
- Tokens SHOULD be named semantically (e.g., `$color-window-bg`, `$border-bevel-light`, `$space-xs`) instead of literal-oriented names, to encourage reuse over copy-paste.

## Mixin Layer

- Introduce `src/styles/_mixins.scss` to define reusable UI building blocks:
  - `@mixin window-chrome` for window outer container (background, border, shadow, padding).
  - `@mixin window-title-bar($active: false)` for title bar stripes/solid background, height, alignment, cursor behavior, and active state variation.
  - `@mixin window-content-frame` for the inner content border (beveled edge, background, scroll area).
  - `@mixin retro-button($variant)` for 3D-effect buttons (calculator keys, toolbar buttons, dialog buttons) with consistent pressed/hover states driven by tokens.
  - `@mixin menu-bar-item` / `@mixin menu-dropdown` for menu bar items and dropdowns, including hover, active, and disabled state styling.
- Mixins SHOULD:
  - Use token values exclusively (no hard-coded colors or spacing where tokens exist).
  - Accept small, focused parameters (e.g., `$variant`, `$isActive`) instead of many optional arguments to keep usage simple.
  - Avoid generating global selectors; they are intended for use inside module-scoped class blocks.

## Component SCSS Integration

- Components that represent windows, buttons, or menus MUST import the mixin layer and tokens via SCSS `@use` (preferred) or `@import` (if necessary for tooling constraints), with a consistent aliasing convention:
  - Example: `@use '../../styles/tokens' as tokens;` and `@use '../../styles/mixins' as mixins;`
- Within component `*.module.scss` files:
  - Top-level classes (e.g., `.window`, `.menuBar`, `.calculator`) SHOULD apply mixins inside their block.
  - Nested elements (e.g., title bars, content areas, dropdown items) SHOULD be expressed via SCSS nesting under their parent class to match JSX structure.
  - Existing class names SHOULD be preserved to avoid changing TypeScript imports or test selectors unnecessarily.
- Where components have unique variants (e.g., calculator display vs. text editor status bar), they MAY extend or layer additional rules on top of mixins while still using tokens for fundamental colors, borders, and spacing.

## Testing and Regression Strategy

- Add or extend tests that:
  - Render key surfaces (e.g., a window, the menu bar, a calculator button) and assert that computed styles match expectations derived from the token system (e.g., background color equals the window background token).
  - Use accessible queries (`getByRole`, `getByText`) to remain resilient to structural changes while still validating visual outcomes.
- Visual regressions should be minimized:
  - Any intentional change in color, border thickness, or spacing on a core surface (window, menu bar, key buttons) SHOULD be documented in the PR description and justified against the spec.
- The design system should make future test additions easier:
  - Tests can assert behavior in terms of tokens (e.g., “menu item hover uses highlight color”) rather than magic hex values scattered across components.

