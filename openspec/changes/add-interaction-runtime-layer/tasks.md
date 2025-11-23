## 1. Scaffold interaction runtime layer

- [x] 1.1 Create `src/runtime/interaction/` with an index file and placeholders for `titleBar`, `buttonState`, `windowManager`, `menuMode`, and `finderSelection` modules.
- [x] 1.2 Add high‑level unit tests that describe the expected behavior for each module, based on `INTERACTION_BLUEPRINT.md` (title bar drag zone, menu mode, selection, keyboard navigation).
- [x] 1.3 Ensure new runtime modules are tree‑shakable and have no React/UI dependencies beyond hooks and context.

## 2. Implement TitleBar Interaction Engine

- [ ] 2.1 Implement `useTitleBarInteraction` that owns drag state and exposes handlers/props for title bar and drag zone elements.
- [ ] 2.2 Update `Window.tsx` to align its DOM structure with the blueprint (explicit `dragZone` between close box and title text) and wire in `useTitleBarInteraction`.
- [ ] 2.3 Add/extend tests (e.g., in `Window.test.tsx` or a new interaction test) to verify:
  - Only clicks in the drag zone initiate dragging.
  - Clicking title text or control boxes does not start drag.
  - Drag updates window position correctly and stops on mouseup.

## 3. Implement Button State Machine

- [ ] 3.1 Implement `useButtonStateMachine(ref, options)` that tracks hover/pressed/focus/toggle/disabled state and enforces state priority (`pressed` overrides `hover`).
- [ ] 3.2 Integrate the hook with existing button surfaces:
  - OS buttons (e.g., `InfoDialog` OK button).
  - Toolbar toggle buttons in `Finder` (view mode buttons).
  - Any other retro buttons currently using ad‑hoc hover/active styles.
- [ ] 3.3 Add tests to verify:
  - Hover vs pressed priority (pressed visuals always win).
  - Toggle behavior for toolbar buttons (stay “pressed” after click until toggled off).
  - Focus ring behavior matches `INTERACTION_BLUEPRINT.md` (1px dotted, inside element, using `:focus-visible` or equivalent).

## 4. Implement Window Focus Manager

- [ ] 4.1 Implement `WindowManagerProvider` and `useWindowRegistration(windowId)` to track `activeWindowId`, z‑index order, and `isActive` flags.
- [ ] 4.2 Refactor `Desktop.tsx` and `Window.tsx` to use `WindowManager` instead of local `activeWindowId`/z‑index logic, preserving existing public behavior where it already matches the blueprint.
- [ ] 4.3 Update `Window.module.scss` (and any window‑like components) to use the new active/inactive state attributes/classes to dim inactive windows (title bar stripes, bevel contrast, slight content opacity reduction) without disabling controls.
- [ ] 4.4 Add tests to confirm:
  - Exactly one window is active at any time (except when none are focused).
  - Clicking a window brings it to front and marks it active.
  - Inactive windows visually dim per blueprint but remain fully interactive.

## 5. Implement Menu Mode Engine

- [ ] 5.1 Implement `MenuModeProvider` + `useMenuMode()` to model OS9 menu mode (`enterMenuMode`, `hoverMenu`, `exitMenuMode`, keyboard navigation).
- [ ] 5.2 Refactor `MenuBar.tsx` to use `useMenuMode` for menu title and dropdown behavior, including click‑outside and Escape handling.
- [ ] 5.3 Adjust `MenuBar.module.scss` (if needed) so hover styles respect menu mode (e.g., highlight only when in menu mode or when a menu is open) and rely on classes/attributes from the engine.
- [ ] 5.4 Add tests (or extend existing `MenuBar` tests) to cover:
  - Click to enter menu mode, hover to switch menus, click outside/Esc to exit.
  - Keyboard navigation across menu titles and within dropdown items.

## 6. Implement Finder Selection Engine

- [ ] 6.1 Implement `useFinderSelection(model)` with support for `grid` and `list` layouts, returning selection/focus state and item/keyboard handlers.
- [ ] 6.2 Refactor `Finder.tsx` to use `useFinderSelection` for icon and list views, including multi‑select and keyboard navigation.
- [ ] 6.3 Refactor desktop icon selection in `Desktop.tsx` to reuse the same engine where appropriate (or a shared subset) for consistent behavior.
- [ ] 6.4 Update SCSS (e.g., `Finder.module.scss` and desktop icon styles) to ensure selection visuals match the blueprint (blue fill, white text, subtle inner shadow, no button bevel) driven by classes/attributes from the selection engine.
- [ ] 6.5 Add tests to verify:
  - Single, Cmd+Click multi‑select, and Shift+Click range selection.
  - Arrow key navigation in grid and list layouts.
  - Enter/Return opens the focused item.

## 7. Keyboard navigation and accessibility pass

- [ ] 7.1 Ensure all new interaction hooks respect `:focus-visible` and expose appropriate roles/ARIA attributes where needed (especially for custom focusable surfaces).
- [ ] 7.2 Add or update tests to confirm keyboard navigation across windows, menus, and Finder/list views works without a mouse.
- [ ] 7.3 Verify that existing interaction tests (e.g., `Desktop.integration.test.tsx`) still pass and, where necessary, update expectations to match the interaction blueprint instead of legacy behavior.

## 8. Validation and documentation

- [ ] 8.1 Run `pnpm lint`, `pnpm test`, and `pnpm build` after implementing the runtime layer to ensure no regressions.
- [ ] 8.2 Add a short “Interaction Runtime Layer” section to `INTERACTION_BLUEPRINT.md` or a new runtime‑focused doc, describing how the runtime hooks map to the blueprint rules.
- [ ] 8.3 Optionally add an OpenSpec spec under `openspec/specs/interaction-runtime/` after this change is approved and implemented, promoting the runtime layer itself to a first‑class capability.

