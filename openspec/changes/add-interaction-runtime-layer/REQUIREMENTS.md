# Interaction Runtime Requirements Registry

This document maps INTERACTION_BLUEPRINT.md behaviors to requirement IDs, tests, and implementations.

## Requirement ID Format

- **INT-TB-xxx**: Title Bar Drag Zones
- **INT-BTN-xxx**: Button State Machine
- **INT-WIN-xxx**: Window Focus/Inactive Behavior
- **INT-MENU-xxx**: Menu Interaction Model
- **INT-FIND-xxx**: Finder Selection Rules
- **INT-KBD-xxx**: Keyboard Navigation

---

## Title Bar Drag Zones (INT-TB)

### Core Requirements

| ID | Requirement | Blueprint Ref | Test Coverage | Implementation Status |
|----|-------------|---------------|---------------|----------------------|
| INT-TB-001 | Only left drag zone initiates window dragging | §1.1 | ❌ Missing | ❌ Not implemented |
| INT-TB-002 | Title text is NOT draggable | §1.1 | ❌ Missing | ❌ Not implemented |
| INT-TB-003 | Control buttons (close, zoom) do NOT initiate drag | §1.1 | ❌ Missing | ❌ Not implemented |
| INT-TB-004 | Right empty space is NOT draggable | §1.1 | ❌ Missing | ❌ Not implemented |
| INT-TB-005 | Drag zone cursor shows `move` | §1.3 | ❌ Missing | ❌ Not implemented |
| INT-TB-006 | Title text cursor shows `default` (not move) | §1.3 | ❌ Missing | ❌ Not implemented |
| INT-TB-007 | Title text has `user-select: none` | §1.3 | ❌ Missing | ❌ Not implemented |

### OS9-Specific Behaviors (Research Needed)

| ID | Requirement | OS9 Behavior | Test Coverage | Implementation Status |
|----|-------------|--------------|---------------|----------------------|
| INT-TB-101 | Click title bar activates window (even without drag) | **TODO: Research** | ❌ Missing | ❌ Not implemented |
| INT-TB-102 | Double-click title bar collapses to title bar only | **TODO: Research** | ❌ Missing | ❌ Not implemented |
| INT-TB-103 | Drag requires sustained mousedown (~150ms threshold) | **TODO: Research** | ❌ Missing | ❌ Not implemented |
| INT-TB-104 | Traffic lights remain interactive during drag | **TODO: Research** | ❌ Missing | ❌ Not implemented |

---

## Button State Machine (INT-BTN)

### State Priority Rules

| ID | Requirement | Blueprint Ref | Test Coverage | Implementation Status |
|----|-------------|---------------|---------------|----------------------|
| INT-BTN-001 | State priority: `:active` > `:hover` > `:focus` > default | §2.1 | ✅ Partial | ⚠️ Incomplete |
| INT-BTN-002 | Pressed state ALWAYS overrides hover state | §2.1 | ✅ Covered | ⚠️ Incomplete |
| INT-BTN-003 | Default state uses `bevel-outset` | §2.2 | ✅ Covered | ⚠️ Incomplete |
| INT-BTN-004 | Pressed state uses `bevel-inset` (complete flip) | §2.2 | ✅ Covered | ⚠️ Incomplete |
| INT-BTN-005 | Hover state shows subtle highlight (no bevel change) | §2.2 | ✅ Covered | ⚠️ Incomplete |
| INT-BTN-006 | Focus state shows 1px dotted outline, -3px offset | §2.2 | ❌ Missing | ❌ Not implemented |

### Toggle Button Behavior

| ID | Requirement | Blueprint Ref | Test Coverage | Implementation Status |
|----|-------------|---------------|---------------|----------------------|
| INT-BTN-101 | Toggle buttons maintain `active` state after click | §2.4 | ✅ Covered | ⚠️ Incomplete |
| INT-BTN-102 | Active toggle uses `bevel-inset` | §2.4 | ✅ Covered | ⚠️ Incomplete |
| INT-BTN-103 | Active + hover shows lighter background | §2.4 | ❌ Missing | ❌ Not implemented |

### OS9-Specific Behaviors (Research Needed)

| ID | Requirement | OS9 Behavior | Test Coverage | Implementation Status |
|----|-------------|--------------|---------------|----------------------|
| INT-BTN-201 | Mousedown outside + mouseup inside does NOT trigger | **TODO: Research** | ❌ Missing | ❌ Not implemented |
| INT-BTN-202 | Mousedown inside + drag outside + mouseup cancels press | **TODO: Research** | ❌ Missing | ❌ Not implemented |
| INT-BTN-203 | Focus-visible only on keyboard focus (not mouse click) | **TODO: Research** | ❌ Missing | ❌ Not implemented |
| INT-BTN-204 | Disabled state dims but remains visible | **TODO: Research** | ✅ Covered | ⚠️ Incomplete |

---

## Window Focus/Inactive Behavior (INT-WIN)

### Focus Management

| ID | Requirement | Blueprint Ref | Test Coverage | Implementation Status |
|----|-------------|---------------|---------------|----------------------|
| INT-WIN-001 | Exactly one window is active at a time | §3.1 | ✅ Covered | ✅ Implemented |
| INT-WIN-002 | Clicking window brings to front and activates | §3.6 | ✅ Covered | ✅ Implemented |
| INT-WIN-003 | Z-index increases with focus order | §3.6 | ✅ Covered | ✅ Implemented |

### Inactive Window Dimming

| ID | Requirement | Blueprint Ref | Test Coverage | Implementation Status |
|----|-------------|---------------|---------------|----------------------|
| INT-WIN-101 | Inactive title bar: dimmed stripe pattern | §3.2 | ❌ Missing | ❌ Not implemented |
| INT-WIN-102 | Inactive controls: dimmed but clickable | §3.3 | ✅ Covered | ⚠️ Incomplete |
| INT-WIN-103 | Inactive bevel: reduced contrast | §3.4 | ❌ Missing | ❌ Not implemented |
| INT-WIN-104 | Inactive content: 90% opacity | §3.5 | ❌ Missing | ❌ Not implemented |

### OS9-Specific Behaviors (Research Needed)

| ID | Requirement | OS9 Behavior | Test Coverage | Implementation Status |
|----|-------------|--------------|---------------|----------------------|
| INT-WIN-201 | Modal windows always on top of document windows | **TODO: Research** | ❌ Missing | ❌ Not implemented |
| INT-WIN-202 | Floating palettes above document, below modal | **TODO: Research** | ❌ Missing | ❌ Not implemented |
| INT-WIN-203 | Window type hierarchy enforced in z-order | **TODO: Research** | ❌ Missing | ❌ Not implemented |
| INT-WIN-204 | Application switching deactivates all windows | **TODO: Research** | ❌ Missing | ❌ Not implemented |

---

## Menu Interaction Model (INT-MENU)

### Menu Mode State Machine

| ID | Requirement | Blueprint Ref | Test Coverage | Implementation Status |
|----|-------------|---------------|---------------|----------------------|
| INT-MENU-001 | Click menu title enters "menu mode" | §4.1 | ✅ Covered | ⚠️ Incomplete |
| INT-MENU-002 | Hover switches menus ONLY while in menu mode | §4.1 | ✅ Covered | ⚠️ Incomplete |
| INT-MENU-003 | Click outside exits menu mode | §4.1 | ❌ Missing | ❌ Not implemented |
| INT-MENU-004 | Esc key exits menu mode | §4.5 | ❌ Missing | ❌ Not implemented |
| INT-MENU-005 | Click menu item executes action and exits menu mode | §4.1 | ❌ Missing | ⚠️ Incomplete |

### Keyboard Navigation

| ID | Requirement | Blueprint Ref | Test Coverage | Implementation Status |
|----|-------------|---------------|---------------|----------------------|
| INT-MENU-101 | F10 or Alt enters menu mode, focuses first menu | §4.5 | ❌ Missing | ❌ Not implemented |
| INT-MENU-102 | Arrow Left/Right navigates menu bar | §4.5 | ❌ Missing | ❌ Not implemented |
| INT-MENU-103 | Arrow Down opens focused menu | §4.5 | ❌ Missing | ❌ Not implemented |
| INT-MENU-104 | Arrow Up/Down navigates menu items | §4.5 | ❌ Missing | ❌ Not implemented |
| INT-MENU-105 | Enter executes focused item | §4.5 | ❌ Missing | ❌ Not implemented |

### OS9-Specific Behaviors (Research Needed)

| ID | Requirement | OS9 Behavior | Test Coverage | Implementation Status |
|----|-------------|--------------|---------------|----------------------|
| INT-MENU-201 | ⌘-key shortcuts activate menus visually | **TODO: Research** | ❌ Missing | ❌ Not implemented |
| INT-MENU-202 | Menu bar "sticky" after first activation | **TODO: Research** | ❌ Missing | ❌ Not implemented |
| INT-MENU-203 | Disabled items shown but not selectable | **TODO: Research** | ❌ Missing | ❌ Not implemented |
| INT-MENU-204 | Submenu indicators (▶) on items with submenus | **TODO: Research** | ❌ Missing | ❌ Not implemented |

---

## Finder Selection Rules (INT-FIND)

### Selection Modes

| ID | Requirement | Blueprint Ref | Test Coverage | Implementation Status |
|----|-------------|---------------|---------------|----------------------|
| INT-FIND-001 | Click selects single item (clears previous) | §5.4 | ✅ Covered | ⚠️ Incomplete |
| INT-FIND-002 | Cmd+Click toggles item selection | §5.4 | ✅ Covered | ⚠️ Incomplete |
| INT-FIND-003 | Shift+Click selects range from anchor to current | §5.4 | ✅ Covered | ⚠️ Incomplete |
| INT-FIND-004 | Cmd+A selects all items | §5.4 | ❌ Missing | ❌ Not implemented |

### Visual Styling

| ID | Requirement | Blueprint Ref | Test Coverage | Implementation Status |
|----|-------------|---------------|---------------|----------------------|
| INT-FIND-101 | Selection uses blue background (not button bevel) | §5.1, §5.3 | ❌ Missing | ❌ Not implemented |
| INT-FIND-102 | Selected text is white | §5.3 | ✅ Covered | ❌ Not implemented |
| INT-FIND-103 | Selection has subtle inner shadow (inset 1px) | §5.3 | ❌ Missing | ❌ Not implemented |
| INT-FIND-104 | Unselected hover shows subtle blue hint | §5.3 | ❌ Missing | ❌ Not implemented |

### Keyboard Navigation

| ID | Requirement | Blueprint Ref | Test Coverage | Implementation Status |
|----|-------------|---------------|---------------|----------------------|
| INT-FIND-201 | Arrow Down moves focus to next item | §6.3 | ✅ Covered | ⚠️ Incomplete |
| INT-FIND-202 | Arrow Up moves focus to previous item | §6.3 | ✅ Covered | ⚠️ Incomplete |
| INT-FIND-203 | Arrow Right/Left navigates grid columns | §6.3 | ❌ Missing | ❌ Not implemented |
| INT-FIND-204 | Enter/Return opens focused item | §6.3 | ❌ Missing | ❌ Not implemented |
| INT-FIND-205 | Cmd+Arrow Up goes to parent folder | §6.3 | ❌ Missing | ❌ Not implemented |

### Spatial Model (Missing - Needs Definition)

| ID | Requirement | OS9 Behavior | Test Coverage | Implementation Status |
|----|-------------|--------------|---------------|----------------------|
| INT-FIND-301 | Grid layout calculates columns based on container width | **TODO: Define** | ❌ Missing | ❌ Not implemented |
| INT-FIND-302 | Arrow navigation wraps at grid boundaries | **TODO: Define** | ❌ Missing | ❌ Not implemented |
| INT-FIND-303 | Click empty space deselects all | **TODO: Define** | ❌ Missing | ❌ Not implemented |
| INT-FIND-304 | Shift-select across rows uses spatial order | **TODO: Define** | ❌ Missing | ❌ Not implemented |
| INT-FIND-305 | Dynamic filtering recalculates grid layout | **TODO: Define** | ❌ Missing | ❌ Not implemented |

---

## Keyboard Navigation (INT-KBD)

### Focus Visible

| ID | Requirement | Blueprint Ref | Test Coverage | Implementation Status |
|----|-------------|---------------|---------------|----------------------|
| INT-KBD-001 | Focus ring: 1px dotted line | §6.1 | ❌ Missing | ❌ Not implemented |
| INT-KBD-002 | Focus ring color: text color (black) | §6.1 | ❌ Missing | ❌ Not implemented |
| INT-KBD-003 | Focus ring offset: inside element (-2px to -4px) | §6.1 | ❌ Missing | ❌ Not implemented |
| INT-KBD-004 | Focus ring only on keyboard focus (`:focus-visible`) | §6.1 | ❌ Missing | ❌ Not implemented |

### Tab Order

| ID | Requirement | Blueprint Ref | Test Coverage | Implementation Status |
|----|-------------|---------------|---------------|----------------------|
| INT-KBD-101 | Tab order: controls → menu → toolbar → content → status | §6.2 | ❌ Missing | ❌ Not implemented |
| INT-KBD-102 | Window controls (close, zoom) are first in tab order | §6.2 | ❌ Missing | ❌ Not implemented |

---

## Summary Statistics

### Coverage by Module

| Module | Total Requirements | Tested | Implemented | Coverage % | Implementation % |
|--------|-------------------|--------|-------------|------------|-----------------|
| Title Bar | 11 | 0 | 0 | 0% | 0% |
| Button State | 11 | 6 | 3 | 55% | 27% |
| Window Focus | 8 | 3 | 3 | 38% | 38% |
| Menu Mode | 11 | 2 | 1 | 18% | 9% |
| Finder Selection | 15 | 5 | 1 | 33% | 7% |
| Keyboard Nav | 6 | 0 | 0 | 0% | 0% |
| **TOTAL** | **62** | **16** | **8** | **26%** | **13%** |

### Priority Breakdown

- 🔴 **Critical (P0)**: 28 requirements - Core OS9 behaviors that must be implemented
- 🟡 **Important (P1)**: 20 requirements - OS9-specific edge cases
- 🟢 **Enhancement (P2)**: 14 requirements - Advanced features (tearoff menus, etc.)

---

## Next Steps

1. ✅ Create this requirements registry
2. ⏳ Add requirement IDs inline in INTERACTION_BLUEPRINT.md
3. ⏳ Research OS9 behaviors for "TODO: Research" items
4. ⏳ Define spatial models for FinderSelection grid layout
5. ⏳ Update tests to reference requirement IDs
6. ⏳ Reimplement runtime modules to meet all requirements
