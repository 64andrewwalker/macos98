## ADDED Requirements

### Requirement: TitleBar Interaction Engine
The system MUST provide a reusable TitleBar Interaction Engine that enforces the `INTERACTION_BLUEPRINT.md` title bar drag zone rules for all window‑like components.

#### Scenario: Only left drag zone starts window drag
- **GIVEN** a window using the TitleBar Interaction Engine
- **WHEN** the user presses and drags inside the designated drag zone (empty area between the close box and the title text)
- **THEN** the window MUST move with the cursor
- **AND** the drag MUST continue until mouseup, even if the cursor leaves the drag zone
- **AND** clicking on title text, control buttons, or the right side of the title bar MUST NOT start a drag.

#### Scenario: TitleBar engine reused across windows
- **GIVEN** multiple window‑like components (standard app windows, Finder windows, dialogs that are draggable)
- **WHEN** they need title bar drag behavior
- **THEN** they MUST attach to the shared TitleBar Interaction Engine (e.g., via `useTitleBarInteraction`)
- **AND** MUST NOT re‑implement drag math or drag zone hit‑testing inline in each component.

---

### Requirement: Button State Machine Runtime
Buttons across the OS shell and apps MUST derive their interactive behavior (hover, pressed, focus, toggle, disabled) from a shared Button State Machine runtime, not from ad‑hoc per‑component event logic.

#### Scenario: Pressed state overrides hover
- **GIVEN** a button using the Button State Machine
- **WHEN** the pointer is hovering over the button
- **AND** the user presses the primary mouse button
- **THEN** the button MUST enter the pressed state (bevel‑inset, slight darkening) regardless of hover styling
- **AND** visual hover styles MUST NOT override pressed visuals while the button is pressed.

#### Scenario: Toggle buttons maintain active state
- **GIVEN** a toolbar toggle button configured with `toggle: true`
- **WHEN** the user clicks the button
- **THEN** the button MUST remain visually pressed/active after mouseup until clicked again or programmatically deactivated
- **AND** the runtime MUST expose this active state for CSS (e.g., via `data-active="true"` or a class) so toolbar bevel and text weight can update.

#### Scenario: Focus ring and keyboard activation
- **GIVEN** a button using the Button State Machine
- **WHEN** the user tabs to the button using the keyboard
- **THEN** the button MUST show an OS9‑style focus ring (1px dotted, inside the button) driven by `:focus-visible` or an equivalent mechanism
- **AND** pressing Space or Enter while focused MUST trigger the button’s action and pressed visual state.

---

### Requirement: Window Focus Manager with Inactive Dimming
Window focus, z‑index, and inactive visual treatment MUST be controlled by a centralized Window Focus Manager to keep behavior consistent across all windows.

#### Scenario: Single active window with managed z-index
- **GIVEN** multiple windows registered with the Window Manager
- **WHEN** the user clicks a window’s content or title bar
- **THEN** that window MUST become the active window
- **AND** its z‑index MUST be raised above all other non‑modal windows
- **AND** any previously active window MUST transition to an inactive visual state.

#### Scenario: Inactive windows dim but remain interactive
- **GIVEN** at least one active window and one inactive window
- **WHEN** a window is inactive
- **THEN** its title bar stripes and bevel contrast MUST be visually dimmed according to `INTERACTION_BLUEPRINT.md`
- **AND** its content MAY have slightly reduced opacity
- **BUT** its controls MUST remain clickable (not disabled) so the window can be focused and interacted with at any time.

---

### Requirement: Menu Mode Engine (OS9 Menu Behavior)
The system MUST expose a Menu Mode Engine that implements OS9 menu mode semantics—click to enter, hover to switch while in menu mode, click outside or Esc to exit—and MenuBar MUST consume this engine.

#### Scenario: Click to enter and exit menu mode
- **GIVEN** a menu bar using the Menu Mode Engine
- **WHEN** the user clicks a menu title (e.g., “File”)
- **THEN** the system MUST enter menu mode and open that menu
- **AND** the menu title and dropdown MUST appear active.
- **WHEN** the user clicks anywhere outside the menu bar or dropdown, or presses Esc
- **THEN** the system MUST exit menu mode and close any open menus.

#### Scenario: Hover switches menus only in menu mode
- **GIVEN** the system is in menu mode with one menu already open
- **WHEN** the user hovers over another menu title (e.g., from “File” to “Edit”)
- **THEN** the engine MUST switch the open menu to the hovered title
- **AND** the previously open menu MUST close.
- **WHEN** the system is not in menu mode
- **THEN** hovering over menu titles MUST NOT open menus by itself.

#### Scenario: Keyboard navigation in menu mode
- **GIVEN** the system is in menu mode
- **WHEN** the user uses arrow keys (left/right to move between menu titles, up/down to move within menu items)
- **THEN** the engine MUST move focus accordingly
- **AND** pressing Enter MUST activate the focused menu item and exit menu mode
- **AND** pressing Esc MUST exit menu mode without activating an item.

---

### Requirement: Finder Selection Engine and Keyboard Navigation
Finder views and desktop icon grids MUST use a shared Finder Selection Engine that implements the selection and keyboard navigation rules defined in `INTERACTION_BLUEPRINT.md`.

#### Scenario: Single and multi-selection behavior
- **GIVEN** a Finder icon grid or list view using the Selection Engine
- **WHEN** the user clicks an item without modifiers
- **THEN** that item MUST become the single selected item.
- **WHEN** the user Cmd+Clicks an item
- **THEN** that item’s selection state MUST toggle without clearing other selections.
- **WHEN** the user Shift+Clicks an item
- **THEN** the engine MUST select a contiguous range from the anchor item to the clicked item (based on render order).

#### Scenario: Keyboard navigation in grid and list
- **GIVEN** a Finder view using the Selection Engine with at least two items
- **WHEN** the user uses arrow keys
- **THEN** focus (and optionally selection) MUST move between items according to layout:
  - Left/Right in both grid and list move to previous/next item.
  - Up/Down in grid move by row (based on column count), and in list move to previous/next row.
- **AND** pressing Enter/Return while an item is focused MUST trigger the “open” action for that item (e.g., navigate into folder, open file).

#### Scenario: Selection visuals match blueprint (no bevel)
- **GIVEN** an item that is marked selected by the Selection Engine
- **WHEN** it is rendered in Finder or on the desktop
- **THEN** it MUST use blue fill with white text and a subtle inner shadow to indicate selection
- **AND** it MUST NOT use button bevel mixins intended for clickable buttons.

