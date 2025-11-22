## ADDED Requirements

### Requirement: SCSS Design Tokens for Retro UI
The macOS 98 UI styling MUST use a shared SCSS token layer for core colors, borders, shadows, spacing, and typography primitives instead of duplicating literals in each component stylesheet.

#### Scenario: Tokens centralize core visual values
- **GIVEN** a new or existing window, button, or menu component
- **WHEN** its SCSS module defines colors, borders, shadows, or spacing
- **THEN** those values MUST be sourced from the shared SCSS token layer (except in rare, documented one-off cases)
- **AND** updating a token value MUST propagate the change consistently across all components that use that token.

#### Scenario: Tokens align with CSS variables
- **GIVEN** base system colors defined as CSS variables in `src/styles/global.scss`
- **WHEN** the SCSS token layer defines equivalents for background, highlight, and border colors
- **THEN** the SCSS tokens SHOULD be derived from or mapped to those CSS variables
- **SO THAT** theming and color adjustments can be made centrally without editing every SCSS module.

### Requirement: Shared Mixins for Windows, Buttons, and Menus
Core retro surfaces (windows, buttons, menus) MUST use shared SCSS mixins built on tokens so that their bevels, shadows, and states remain visually consistent.

#### Scenario: Window chrome uses shared mixin
- **GIVEN** a window-like component (e.g., the main OS window component)
- **WHEN** its SCSS module defines the outer window container and title bar styles
- **THEN** it MUST apply a shared window chrome mixin (for borders, shadows, padding) and title bar mixin (for height, stripes/solid background, active/inactive states)
- **AND** changing those mixins MUST update all window-like components that consume them.

#### Scenario: Retro buttons share pressed and hover behavior
- **GIVEN** retro-style buttons in apps (e.g., calculator keys, text editor toolbar buttons, dialog buttons)
- **WHEN** their SCSS modules define default, hover, and pressed states
- **THEN** they MUST use a shared retro button mixin for border, background, and pressed/hover behavior
- **AND** the mixin MUST rely on SCSS tokens for colors and spacing rather than hard-coded literals.

#### Scenario: Menus share hover/active/disabled styles
- **GIVEN** menu surfaces (menu bar items, dropdown menus, context menus)
- **WHEN** a menu item is rendered in normal, hover, active, or disabled state
- **THEN** its styling MUST be derived from shared menu-related mixins
- **AND** those mixins MUST ensure that hover/selection uses the system highlight token and disabled items use the designated disabled token.

### Requirement: Component SCSS Mirrors JSX Structure
Component `*.module.scss` files for OS shell and apps MUST use SCSS nesting so that selector structure closely mirrors the corresponding JSX tree, except where a flat structure is explicitly justified (e.g., shared utility classes).

#### Scenario: Window styles follow component hierarchy
- **GIVEN** the window component with elements like title bar, control boxes, and content area
- **WHEN** its SCSS module defines styles for these elements
- **THEN** the styles SHOULD be organized under a nested structure (e.g., `.window { .titleBar { ... } .closeBox { ... } .contentOuter { ... } }`)
- **AND** the nesting SHOULD avoid unnecessary selector depth while still reflecting the component’s hierarchy.

#### Scenario: App SCSS uses nested structure with modules
- **GIVEN** an app component (e.g., Finder or TextEditor) with toolbar, content area, and status bar
- **WHEN** its SCSS module defines styles for those areas
- **THEN** the module SHOULD structure selectors using SCSS nesting under a top-level class (e.g., `.textEditor` or `.finder`)
- **AND** the CSS module class names used in TypeScript MUST remain stable so that imports and tests do not break.

### Requirement: Preserve Retro Visual Behavior During Refactor
Refactoring SCSS to use tokens and mixins MUST preserve the established retro Mac OS 9 visual behavior for windows, buttons, and menus, except for intentional, documented improvements in consistency.

#### Scenario: Key surfaces remain visually consistent
- **GIVEN** existing core components (window chrome, menu bar, calculator, text editor)
- **WHEN** their styles are migrated to use the shared token and mixin system
- **THEN** their visible appearance (colors, borders, shadows, spacing) MUST remain effectively unchanged to users
- **AND** any necessary deviations MUST be small, deliberate, and documented in the change description.
