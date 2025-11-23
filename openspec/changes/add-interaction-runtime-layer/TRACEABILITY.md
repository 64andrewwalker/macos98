# Interaction Runtime Traceability Matrix

This document maps every requirement from INTERACTION_BLUEPRINT.md to its tests and implementation.

**Status Legend:**
- ✅ Implemented and tested
- ⚠️ Partially implemented or tested
- ❌ Not implemented or tested
- 🔬 Test exists but no implementation
- 📝 Documented but not coded

---

## Title Bar Drag Zones (INT-TB)

| Req ID | Requirement | Blueprint | Test File | Test Name | Implementation | Status |
|--------|-------------|-----------|-----------|-----------|----------------|--------|
| INT-TB-001 | Only left drag zone initiates dragging | §1.1 | `titleBar.test.ts:25` | enforces that only drag zone can initiate dragging | `titleBar.ts:46` (placeholder) | 🔬 |
| INT-TB-002 | Title text is NOT draggable | §1.1 | ❌ Missing | - | ❌ Missing | ❌ |
| INT-TB-003 | Control buttons do NOT initiate drag | §1.1 | ❌ Missing | - | ❌ Missing | ❌ |
| INT-TB-004 | Right empty space is NOT draggable | §1.1 | ❌ Missing | - | ❌ Missing | ❌ |
| INT-TB-005 | Drag zone cursor shows `move` | §1.3 | `titleBar.test.ts:19` | dragZoneProps should have grab cursor | `titleBar.ts:67` (placeholder) | 🔬 |
| INT-TB-006 | Title text cursor shows `default` | §1.3 | ❌ Missing | - | ❌ Missing | ❌ |
| INT-TB-007 | Title text has `user-select: none` | §1.3 | ❌ Missing | - | ❌ Missing | ❌ |
| INT-TB-101 | Click title bar activates window | OS9 Research | ❌ Missing | - | ❌ Missing | ❌ |
| INT-TB-102 | Double-click collapses to title bar (WindowShade) | OS9 Research | ❌ Missing | - | ❌ Missing | ❌ |
| INT-TB-103 | Drag requires ~150ms threshold | OS9 Research | ❌ Missing | - | ❌ Missing | ❌ |
| INT-TB-104 | Traffic lights stay interactive during drag | OS9 Research | ❌ Missing | - | ❌ Missing | ❌ |

**Coverage:** 2/11 tests exist (18%), 0/11 implemented (0%)

---

## Button State Machine (INT-BTN)

| Req ID | Requirement | Blueprint | Test File | Test Name | Implementation | Status |
|--------|-------------|-----------|-----------|-----------|----------------|--------|
| INT-BTN-001 | State priority: :active > :hover > :focus > default | §2.1 | `buttonState.test.ts:127` | enforces that pressed state takes priority | `buttonState.ts:49` (partial) | ⚠️ |
| INT-BTN-002 | Pressed ALWAYS overrides hover | §2.1 | `buttonState.test.ts:127` | enforces that pressed state takes priority | `buttonState.ts:49` (partial) | ⚠️ |
| INT-BTN-003 | Default state uses bevel-outset | §2.2 | ❌ Missing (visual) | - | ❌ CSS only | 📝 |
| INT-BTN-004 | Pressed state uses bevel-inset | §2.2 | ❌ Missing (visual) | - | ❌ CSS only | 📝 |
| INT-BTN-005 | Hover shows subtle highlight | §2.2 | `buttonState.test.ts:28` | sets hovered state on mouse enter | `buttonState.ts:49` | ⚠️ |
| INT-BTN-006 | Focus shows 1px dotted outline, -3px offset | §2.2 | ❌ Missing | - | ❌ Missing | ❌ |
| INT-BTN-101 | Toggle buttons maintain active state | §2.4 | `buttonState.test.ts:69` | toggles active state on click | `buttonState.ts:71` | ⚠️ |
| INT-BTN-102 | Active toggle uses bevel-inset | §2.4 | ❌ Missing (visual) | - | ❌ CSS only | 📝 |
| INT-BTN-103 | Active + hover shows lighter background | §2.4 | ❌ Missing | - | ❌ Missing | ❌ |
| INT-BTN-201 | Mousedown outside + mouseup inside = no trigger | OS9 Research | ❌ Missing | - | ❌ Missing | ❌ |
| INT-BTN-202 | Drag-away-to-cancel | OS9 Research | ❌ Missing | - | ❌ Missing | ❌ |
| INT-BTN-203 | Focus-visible only on keyboard | OS9 Research | ❌ Missing | - | ❌ Missing | ❌ |
| INT-BTN-204 | Disabled dims but stays visible | §2.2 | `buttonState.test.ts:88` | does not respond to hover when disabled | `buttonState.ts:49` | ⚠️ |

**Coverage:** 5/13 tests exist (38%), 4/13 partially implemented (31%)

---

## Window Focus Manager (INT-WIN)

| Req ID | Requirement | Blueprint | Test File | Test Name | Implementation | Status |
|--------|-------------|-----------|-----------|-----------|----------------|--------|
| INT-WIN-001 | Exactly one window active at a time | §3.1 | `windowManager.test.tsx:69` | ensures exactly one window is active | `windowManager.tsx:48` | ✅ |
| INT-WIN-002 | Clicking window brings to front and activates | §3.6 | `windowManager.test.tsx:52` | activates window when onMouseDown called | `windowManager.tsx:107` | ✅ |
| INT-WIN-003 | Z-index increases with focus order | §3.6 | `windowManager.test.tsx:109` | brings focused window to front | `windowManager.tsx:50` | ✅ |
| INT-WIN-101 | Inactive title bar: dimmed stripes | §3.2 | ❌ Missing | - | ❌ Missing | ❌ |
| INT-WIN-102 | Inactive controls: dimmed but clickable | §3.3 | `windowManager.test.tsx:142` | provides isActive flag for dimming | `windowManager.tsx:103` (flag only) | ⚠️ |
| INT-WIN-103 | Inactive bevel: reduced contrast | §3.4 | ❌ Missing | - | ❌ Missing | ❌ |
| INT-WIN-104 | Inactive content: 90% opacity | §3.5 | ❌ Missing | - | ❌ Missing | ❌ |
| INT-WIN-201 | Modal windows always on top | OS9 Research | ❌ Missing | - | ❌ Missing | ❌ |
| INT-WIN-202 | Floating palettes above documents | OS9 Research | ❌ Missing | - | ❌ Missing | ❌ |
| INT-WIN-203 | Window type hierarchy enforced | OS9 Research | ❌ Missing | - | ❌ Missing | ❌ |
| INT-WIN-204 | Application switching deactivates all | OS9 Research | ❌ Missing | - | ❌ Missing | ❌ |

**Coverage:** 4/11 tests exist (36%), 3/11 implemented (27%), 1/11 partial (9%)

---

## Menu Interaction Model (INT-MENU)

| Req ID | Requirement | Blueprint | Test File | Test Name | Implementation | Status |
|--------|-------------|-----------|-----------|-----------|----------------|--------|
| INT-MENU-001 | Click menu title enters menu mode | §4.1 | `menuMode.test.tsx:42` | clicking menu title enters menu mode | `menuMode.tsx:31` | ⚠️ |
| INT-MENU-002 | Hover switches menus ONLY in menu mode | §4.1 | `menuMode.test.tsx:97` | hover does nothing when NOT in menu mode | `menuMode.tsx:37` | ⚠️ |
| INT-MENU-003 | Click outside exits menu mode | §4.1 | ❌ Missing | - | ❌ Missing (TODO comment) | 🔬 |
| INT-MENU-004 | Esc key exits menu mode | §4.5 | ❌ Missing | - | ❌ Missing (TODO comment) | 🔬 |
| INT-MENU-005 | Click menu item exits menu mode | §4.1 | ❌ Missing | - | `menuMode.tsx:48` (partial) | ⚠️ |
| INT-MENU-101 | F10/Alt enters menu mode | §4.5 | ❌ Missing | - | ❌ Missing (TODO comment) | 🔬 |
| INT-MENU-102 | Arrow Left/Right navigates menu bar | §4.5 | ❌ Missing | - | ❌ Missing (TODO comment) | 🔬 |
| INT-MENU-103 | Arrow Down opens focused menu | §4.5 | ❌ Missing | - | ❌ Missing (TODO comment) | 🔬 |
| INT-MENU-104 | Arrow Up/Down navigates items | §4.5 | ❌ Missing | - | ❌ Missing (TODO comment) | 🔬 |
| INT-MENU-105 | Enter executes focused item | §4.5 | ❌ Missing | - | ❌ Missing (TODO comment) | 🔬 |
| INT-MENU-201 | Keyboard shortcut visual feedback | OS9 Research | ❌ Missing | - | ❌ Missing | ❌ |
| INT-MENU-202 | Sticky menu bar after activation | OS9 Research | ❌ Missing | - | ❌ Missing | ❌ |
| INT-MENU-203 | Disabled items shown but not selectable | OS9 Research | ❌ Missing | - | ❌ Missing | ❌ |
| INT-MENU-204 | Submenu indicators (▶) | OS9 Research | ❌ Missing | - | ❌ Missing | ❌ |

**Coverage:** 2/14 tests exist (14%), 2/14 partially implemented (14%)

---

## Finder Selection Rules (INT-FIND)

| Req ID | Requirement | Blueprint | Test File | Test Name | Implementation | Status |
|--------|-------------|-----------|-----------|-----------|----------------|--------|
| INT-FIND-001 | Click selects single item | §5.4 | `finderSelection.test.ts:29` | selects item on click | `finderSelection.ts:48` | ⚠️ |
| INT-FIND-002 | Cmd+Click toggles selection | §5.4 | `finderSelection.test.ts:65` | toggles selection with Cmd+Click | `finderSelection.ts:48` | ⚠️ |
| INT-FIND-003 | Shift+Click range selection | §5.4 | `finderSelection.test.ts:113` | selects range from last to current | `finderSelection.ts:48` | ⚠️ |
| INT-FIND-004 | Cmd+A selects all | §5.4 | ❌ Missing | - | ❌ Missing | ❌ |
| INT-FIND-101 | Selection uses blue background | §5.1, §5.3 | ❌ Missing (visual) | - | ❌ CSS only | 📝 |
| INT-FIND-102 | Selected text is white | §5.3 | `finderSelection.test.ts:195` | provides data-selected attribute | `finderSelection.ts:126` (data attr only) | ⚠️ |
| INT-FIND-103 | Selection has subtle inner shadow | §5.3 | ❌ Missing (visual) | - | ❌ CSS only | 📝 |
| INT-FIND-104 | Unselected hover shows blue hint | §5.3 | ❌ Missing | - | ❌ Missing | ❌ |
| INT-FIND-201 | Arrow Down moves focus | §6.3 | `finderSelection.test.ts:143` | moves focus down on ArrowDown | `finderSelection.ts:80` | ⚠️ |
| INT-FIND-202 | Arrow Up moves focus | §6.3 | `finderSelection.test.ts:163` | moves focus up on ArrowUp | `finderSelection.ts:80` | ⚠️ |
| INT-FIND-203 | Arrow Right/Left navigates grid | §6.3 | ❌ Missing | - | ❌ Missing | ❌ |
| INT-FIND-204 | Enter/Return opens focused item | §6.3 | ❌ Missing | - | ❌ Missing (TODO comment) | 🔬 |
| INT-FIND-205 | Cmd+Arrow Up goes to parent | §6.3 | ❌ Missing | - | ❌ Missing | ❌ |
| INT-FIND-301 | Grid layout calculates columns | Spatial Model | ❌ Missing | - | ❌ Missing | ❌ |
| INT-FIND-302 | Arrow navigation wraps at boundaries | Spatial Model | ❌ Missing | - | ❌ Missing | ❌ |
| INT-FIND-303 | Click empty space deselects all | Spatial Model | ❌ Missing | - | ❌ Missing | ❌ |
| INT-FIND-304 | Shift-select uses spatial order | Spatial Model | ❌ Missing | - | ❌ Missing | ❌ |
| INT-FIND-305 | Dynamic filtering recalculates grid | Spatial Model | ❌ Missing | - | ❌ Missing | ❌ |

**Coverage:** 5/18 tests exist (28%), 5/18 partially implemented (28%)

---

## Keyboard Navigation (INT-KBD)

| Req ID | Requirement | Blueprint | Test File | Test Name | Implementation | Status |
|--------|-------------|-----------|-----------|-----------|----------------|--------|
| INT-KBD-001 | Focus ring: 1px dotted line | §6.1 | ❌ Missing | - | ❌ Missing | ❌ |
| INT-KBD-002 | Focus ring color: text color | §6.1 | ❌ Missing | - | ❌ Missing | ❌ |
| INT-KBD-003 | Focus ring offset: -2px to -4px | §6.1 | ❌ Missing | - | ❌ Missing | ❌ |
| INT-KBD-004 | Focus ring only on :focus-visible | §6.1 | ❌ Missing | - | ❌ Missing | ❌ |
| INT-KBD-101 | Tab order: controls → menu → toolbar → content | §6.2 | ❌ Missing | - | ❌ Missing | ❌ |
| INT-KBD-102 | Window controls first in tab order | §6.2 | ❌ Missing | - | ❌ Missing | ❌ |

**Coverage:** 0/6 tests exist (0%), 0/6 implemented (0%)

---

## Overall Summary

### By Module

| Module | Total Reqs | Tests Exist | Tests % | Implemented | Impl % | Partial | Partial % |
|--------|-----------|-------------|---------|-------------|--------|---------|-----------|
| Title Bar | 11 | 2 | 18% | 0 | 0% | 0 | 0% |
| Button State | 13 | 5 | 38% | 0 | 0% | 4 | 31% |
| Window Manager | 11 | 4 | 36% | 3 | 27% | 1 | 9% |
| Menu Mode | 14 | 2 | 14% | 0 | 0% | 2 | 14% |
| Finder Selection | 18 | 5 | 28% | 0 | 0% | 5 | 28% |
| Keyboard Nav | 6 | 0 | 0% | 0 | 0% | 0 | 0% |
| **TOTAL** | **73** | **18** | **25%** | **3** | **4%** | **12** | **16%** |

### By Priority

| Priority | Total | Tested | Implemented | Partial |
|----------|-------|--------|-------------|---------|
| P0 (Critical) | 18 | 8 (44%) | 3 (17%) | 4 (22%) |
| P1 (Important) | 12 | 2 (17%) | 0 (0%) | 2 (17%) |
| P2 (Enhancement) | 4 | 0 (0%) | 0 (0%) | 0 (0%) |
| **Remaining** | **39** | **8 (21%)** | **0 (0%)** | **6 (15%)** |

### Critical Gaps (P0 Requirements with No Tests)

1. **INT-TB-002**: Title text not draggable
2. **INT-TB-003**: Control buttons don't initiate drag
3. **INT-BTN-006**: Focus-visible ring
4. **INT-BTN-201**: Mousedown outside + mouseup inside
5. **INT-BTN-202**: Drag-away-to-cancel
6. **INT-BTN-203**: Focus-visible only on keyboard
7. **INT-MENU-003**: Click outside exits menu mode
8. **INT-MENU-004**: Esc exits menu mode
9. **INT-FIND-301**: Grid layout algorithm
10. **INT-FIND-302**: Arrow navigation wrapping

---

## Test File Mapping

| Test File | Requirements Covered | Coverage % |
|-----------|---------------------|-----------|
| `titleBar.test.ts` | INT-TB-001, INT-TB-005 | 2/11 (18%) |
| `buttonState.test.ts` | INT-BTN-001, INT-BTN-002, INT-BTN-005, INT-BTN-101, INT-BTN-204 | 5/13 (38%) |
| `windowManager.test.tsx` | INT-WIN-001, INT-WIN-002, INT-WIN-003, INT-WIN-102 | 4/11 (36%) |
| `menuMode.test.tsx` | INT-MENU-001, INT-MENU-002 | 2/14 (14%) |
| `finderSelection.test.ts` | INT-FIND-001, INT-FIND-002, INT-FIND-003, INT-FIND-102, INT-FIND-201, INT-FIND-202 | 6/18 (33%) |

---

## Implementation File Mapping

| Implementation File | Requirements Covered | Coverage % |
|--------------------|---------------------|-----------|
| `titleBar.ts` | 0/11 fully, 2/11 placeholders | 0% (18% placeholder) |
| `buttonState.ts` | 0/13 fully, 4/13 partial | 0% (31% partial) |
| `windowManager.tsx` | 3/11 fully, 1/11 partial | 27% (36% with partial) |
| `menuMode.tsx` | 0/14 fully, 2/14 partial | 0% (14% partial) |
| `finderSelection.ts` | 0/18 fully, 5/18 partial | 0% (28% partial) |

---

## Next Steps (Prioritized)

### Phase 5: Rewrite Tests for P0 Gaps

**Highest Priority (Missing P0 Tests):**
1. Title bar drag zone restrictions (INT-TB-002, INT-TB-003)
2. Button focus-visible (INT-BTN-006, INT-BTN-203)
3. Button click boundaries (INT-BTN-201, INT-BTN-202)
4. Menu mode exit (INT-MENU-003, INT-MENU-004)
5. Finder grid spatial (INT-FIND-301, INT-FIND-302, INT-FIND-303)

### Phase 6: Implement P0 Requirements

**Ordered by dependency:**
1. Window Manager: Complete (3/11 done, need 8 more)
2. Button State: Add focus-visible, click boundaries
3. Title Bar: Add drag zone restrictions, click-to-activate
4. Menu Mode: Add exit handling, keyboard nav
5. Finder Selection: Replace with FinderSpatialModel
6. Keyboard Nav: Add focus ring system-wide

---

**Status:** ✅ Traceability matrix complete
**Last Updated:** 2025-11-23
**Total Requirements:** 73 (updated from 62 - added keyboard nav)
**Test Coverage:** 25%
**Implementation Coverage:** 4% (fully), 16% (partial)
