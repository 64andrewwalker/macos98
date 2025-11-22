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

#### Scenario: Component prohibits literal values
- **GIVEN** a component SCSS module being authored or reviewed
- **WHEN** a developer attempts to use literal hex colors (#000, #fff, etc.), pixel spacing values (8px, 10px), or font sizes (12px, 14px)
- **THEN** the code review or linting process MUST flag these as violations
- **AND** the developer MUST replace them with the appropriate token references.

---

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

#### Scenario: Component reuses UI patterns instead of duplicating
- **GIVEN** an app component (Calculator, Finder, TextEditor) requiring standard UI elements
- **WHEN** the developer needs to style a toolbar, status bar, or retro button
- **THEN** the component MUST include the corresponding mixin (@include toolbar-strip, @include status-bar, @include retro-button)
- **AND** MUST NOT reimplement border, bevel, shadow, or state transition logic manually.

---

### Requirement: Component SCSS Mirrors JSX Structure
Component `*.module.scss` files for OS shell and apps MUST use SCSS nesting so that selector structure closely mirrors the corresponding JSX tree, except where a flat structure is explicitly justified (e.g., shared utility classes).

#### Scenario: Window styles follow component hierarchy
- **GIVEN** the window component with elements like title bar, control boxes, and content area
- **WHEN** its SCSS module defines styles for these elements
- **THEN** the styles SHOULD be organized under a nested structure (e.g., `.window { .titleBar { ... } .closeBox { ... } .contentOuter { ... } }`)
- **AND** the nesting SHOULD avoid unnecessary selector depth while still reflecting the component's hierarchy.

#### Scenario: App SCSS uses nested structure with modules
- **GIVEN** an app component (e.g., Finder or TextEditor) with toolbar, content area, and status bar
- **WHEN** its SCSS module defines styles for those areas
- **THEN** the module SHOULD structure selectors using SCSS nesting under a top-level class (e.g., `.textEditor` or `.finder`)
- **AND** the CSS module class names used in TypeScript MUST remain stable so that imports and tests do not break.

#### Scenario: Nesting depth is limited
- **GIVEN** any component SCSS module
- **WHEN** nesting selectors to mirror component structure
- **THEN** the nesting depth MUST NOT exceed 3 levels
- **SO THAT** selector specificity remains manageable and the code stays readable.

---

### Requirement: Preserve Retro Visual Behavior During Refactor
Refactoring SCSS to use tokens and mixins MUST preserve the established retro Mac OS 9 visual behavior for windows, buttons, and menus, except for intentional, documented improvements in consistency.

#### Scenario: Key surfaces remain visually consistent
- **GIVEN** existing core components (window chrome, menu bar, calculator, text editor)
- **WHEN** their styles are migrated to use the shared token and mixin system
- **THEN** their visible appearance (colors, borders, shadows, spacing) MUST remain effectively unchanged to users
- **AND** any necessary deviations MUST be small, deliberate, and documented in the change description.

#### Scenario: Active and inactive window states are preserved
- **GIVEN** the window component with active/inactive titlebar styling
- **WHEN** migrating to use the `window-title-bar` mixin with state parameter
- **THEN** active windows MUST display the diagonal stripe pattern with correct colors
- **AND** inactive windows MUST display the solid gray background
- **AND** the visual distinction between states MUST match the pre-refactor behavior.

#### Scenario: Button 3D bevel effect remains pixel-accurate
- **GIVEN** calculator buttons, toolbar buttons, and dialog buttons using the retro button mixin
- **WHEN** rendered in default, hover, and pressed states
- **THEN** the 3D bevel (light top-left, dark bottom-right) MUST be visually identical to pre-refactor implementation
- **AND** the pressed state MUST correctly invert the bevel (dark top-left, light bottom-right)
- **AND** no blur, transitions, or modern effects may be introduced.

---

### Requirement: Style Testing Validates Token Compliance
All major UI patterns MUST have automated style tests that verify correct usage of design tokens and mixins, ensuring visual consistency and preventing regression.

#### Scenario: Window component tests verify token usage
- **GIVEN** the Window component with chrome, titlebar, and content frame
- **WHEN** style tests are executed
- **THEN** the tests MUST verify that window background uses `var(--sys-bg-color)` or equivalent token
- **AND** border color matches `$color-border-dark` token value (e.g., rgb(0, 0, 0))
- **AND** titlebar includes the stripe pattern for active state
- **AND** content frame has the correct 3D inset borders.

#### Scenario: Button component tests verify bevel behavior
- **GIVEN** a button component using the retro-button mixin
- **WHEN** style tests are executed
- **THEN** the tests MUST verify default button has light top/left borders and dark bottom/right borders
- **AND** the pressed/active state inverts the border colors
- **AND** the background color sources from button surface token.

#### Scenario: Menu component tests verify hover states
- **GIVEN** menu bar and dropdown menu components
- **WHEN** style tests are executed
- **THEN** the tests MUST verify that hover background matches `$color-menu-hover-bg` token
- **AND** hover text color matches `$color-menu-hover-text` token
- **AND** disabled items use `$color-disabled-text` token
- **AND** dropdown shadow matches `$shadow-menu` token definition.

#### Scenario: Test coverage includes all core components
- **GIVEN** the UI system with Window, MenuBar, Calculator, TextEditor, Finder components
- **WHEN** the style test suite is run
- **THEN** each core component MUST have at least one style test verifying token compliance
- **AND** each shared mixin MUST be tested via at least one component that uses it
- **AND** tests MUST cover default, hover, active, and disabled states where applicable.

---

### Requirement: File Organization Enforces Separation of Concerns
All style-related files MUST follow a standardized directory structure that separates global design system files from component-specific styles.

#### Scenario: Design tokens and mixins live in global styles directory
- **GIVEN** the project's style system architecture
- **WHEN** defining design tokens, mixins, or global CSS variables
- **THEN** these MUST be placed in `src/styles/` directory (_tokens.scss, _mixins.scss, _globals.scss)
- **AND** MUST NOT be defined within component directories.

#### Scenario: Components have colocated module styles
- **GIVEN** an OS shell component (Window, MenuBar, Desktop) or app component (Calculator, Finder)
- **WHEN** the component requires custom styling beyond mixins
- **THEN** the component MUST have a colocated `.module.scss` file in the same directory
- **AND** the module MUST import and use tokens/mixins from `src/styles/`.

#### Scenario: Temporary or experimental styles are forbidden
- **GIVEN** a developer working on a component
- **WHEN** they need to try out new colors, spacing, or UI patterns
- **THEN** they MUST NOT create temporary token or mixin definitions in component directories
- **AND** experimental values MUST either be added to the global design system or remain as scoped, non-token values with TODO comments for cleanup.

---

### Requirement: Code Review Enforces Token and Mixin Compliance
All SCSS-related pull requests MUST pass a standardized review checklist before merging, ensuring adherence to the design system principles.

#### Scenario: Pull request checklist validates no literal values
- **GIVEN** a pull request modifying component SCSS files
- **WHEN** the code review process is conducted
- **THEN** reviewers MUST verify that no literal hex colors, spacing values, or font sizes exist in component files
- **AND** any violations MUST be flagged and corrected before approval.

#### Scenario: Pull request checklist validates mixin usage
- **GIVEN** a pull request adding or modifying window, button, or menu components
- **WHEN** the code review process is conducted
- **THEN** reviewers MUST verify that appropriate mixins are used (window-chrome, retro-button, menu-item, etc.)
- **AND** any duplicated border/shadow/bevel logic MUST be flagged and refactored to use mixins.

#### Scenario: Pull request checklist validates SCSS structure
- **GIVEN** a pull request modifying component SCSS files
- **WHEN** the code review process is conducted
- **THEN** reviewers MUST verify that SCSS nesting mirrors the component JSX structure
- **AND** nesting depth does not exceed 3 levels
- **AND** no ID selectors or unjustified `!important` declarations are present.

#### Scenario: Pull request checklist validates tests
- **GIVEN** a pull request adding new UI components or modifying existing ones
- **WHEN** the code review process is conducted
- **THEN** reviewers MUST verify that style tests are included or updated
- **AND** existing tests continue to pass
- **AND** visual regression has been manually verified for retro aesthetic preservation.
