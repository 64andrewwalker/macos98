# OS9 Behavior Research

This document researches and documents authentic Mac OS 9 interaction behaviors for true emulation.

**Research Sources:**
- Mac OS 9 Human Interface Guidelines (Apple, 2000)
- OS9 system behavior observations
- Classic Mac OS documentation
- Period-accurate software behavior

---

## Title Bar Behaviors (INT-TB-2xx)

### INT-TB-101: Click title bar activates window (even without drag)

**OS9 Behavior:**
- Single click anywhere on title bar (including non-drag zones) **activates** the window
- Window comes to front (z-order change)
- Title bar changes from inactive (gray stripes) to active (colored stripes)
- No drag initiated if click duration < ~150ms

**Implementation Requirements:**
```typescript
// Distinguish between "click to activate" and "drag to move"
onTitleBarMouseDown(e) {
  const clickStart = Date.now();

  // Always activate window on title bar click
  this.activateWindow();

  // Only start drag if:
  // 1. Click is in drag zone AND
  // 2. Mouse held down for threshold duration AND
  // 3. Mouse moves while held
}
```

**Test Cases:**
- Click non-drag zone → window activates, no drag
- Click drag zone briefly → window activates, no drag
- Click drag zone + hold + move → window activates AND drags

**Priority:** 🔴 P0 - Core window management behavior

---

### INT-TB-102: Double-click title bar collapses to title bar only

**OS9 Behavior:**
- Double-click anywhere on title bar (except traffic lights) → "WindowShade" effect
- Window collapses to show only title bar (content hidden)
- Double-click again → window expands back to original size
- Animation: smooth collapse/expand (not instant)
- Collapsed window still shows in window list
- Collapsed window still receives activation clicks

**Implementation Requirements:**
```typescript
interface WindowState {
  isCollapsed: boolean;
  preCollapseHeight: number;
}

onTitleBarDoubleClick() {
  if (this.isCollapsed) {
    // Expand
    this.height = this.preCollapseHeight;
    this.isCollapsed = false;
  } else {
    // Collapse
    this.preCollapseHeight = this.height;
    this.height = TITLE_BAR_HEIGHT; // ~20px
    this.isCollapsed = true;
  }
}
```

**Edge Cases:**
- Double-click on traffic lights → button action (not collapse)
- Double-click while dragging → no collapse
- Collapse + resize → ???  (need to research)

**Priority:** 🟡 P1 - Common OS9 feature, not critical for MVP

---

### INT-TB-103: Drag requires sustained mousedown (~150ms threshold)

**OS9 Behavior:**
- Immediate drag on mousedown feels "accidental" in OS9
- OS9 has subtle delay before drag initiates (~100-150ms)
- This prevents accidental drags when clicking to activate
- If mouse moves before threshold → drag starts immediately
- If mouse released before threshold → treated as click (activate only)

**Implementation Requirements:**
```typescript
const DRAG_THRESHOLD_MS = 150;
const DRAG_MOVEMENT_THRESHOLD_PX = 3;

let dragTimer: number | null = null;
let mouseDownPos: {x: number, y: number} | null = null;
let isDragReady = false;

onMouseDown(e) {
  mouseDownPos = {x: e.clientX, y: e.clientY};
  isDragReady = false;

  // Start timer
  dragTimer = setTimeout(() => {
    isDragReady = true;
    // Can now drag
  }, DRAG_THRESHOLD_MS);
}

onMouseMove(e) {
  if (!mouseDownPos) return;

  const distance = Math.hypot(
    e.clientX - mouseDownPos.x,
    e.clientY - mouseDownPos.y
  );

  // Movement threshold bypasses time threshold
  if (distance > DRAG_MOVEMENT_THRESHOLD_PX) {
    clearTimeout(dragTimer);
    isDragReady = true;
  }

  if (isDragReady) {
    // Perform drag
  }
}

onMouseUp() {
  clearTimeout(dragTimer);
  if (!isDragReady) {
    // Was a click, not a drag
    handleActivateClick();
  }
}
```

**Priority:** 🟡 P1 - Improves feel, prevents accidents

---

### INT-TB-104: Traffic lights remain interactive during drag

**OS9 Behavior:**
- While dragging window, traffic light buttons still respond to hover
- Close button shows hover state if mouse passes over it
- However, clicking close/zoom during drag does NOT trigger action
- Click must be released first, then click button

**Implementation:**
- Separate hover state from click state
- Traffic lights track hover even during window drag
- But clicks are ignored if `isDragging === true`

**Priority:** 🟢 P2 - Polish, not essential

---

## Button State Machine (INT-BTN-2xx)

### INT-BTN-201: Mousedown outside + mouseup inside does NOT trigger

**OS9 Behavior:**
- Press mouse outside button → button stays unpressed
- Drag mouse into button (while held) → button does NOT highlight
- Release mouse inside button → button does NOT activate
- This is standard UI behavior (prevents accidental clicks)

**Implementation:**
```typescript
let mouseDownInside = false;

onMouseDown(e) {
  if (isPointInButton(e)) {
    mouseDownInside = true;
    setState('pressed');
  }
}

onMouseUp(e) {
  if (mouseDownInside && isPointInButton(e)) {
    // Trigger action
    onClick();
  }
  mouseDownInside = false;
  setState('default');
}
```

**Priority:** 🔴 P0 - Standard UI behavior, prevents bugs

---

### INT-BTN-202: Mousedown inside + drag outside + mouseup cancels press

**OS9 Behavior:**
- Press mouse inside button → button shows pressed state
- Drag mouse outside button (while held) → button returns to unpressed
- Release outside → no action triggered
- Drag back inside (still held) → button shows pressed again
- This allows "cancel" by dragging away

**Implementation:**
```typescript
onMouseMove(e) {
  if (mouseDownInside) {
    if (isPointInButton(e)) {
      setState('pressed');
    } else {
      setState('hover'); // Or 'default' if not hovering
    }
  }
}

onMouseUp(e) {
  if (mouseDownInside) {
    if (isPointInButton(e)) {
      onClick(); // Only trigger if still inside
    }
  }
  mouseDownInside = false;
}
```

**Priority:** 🔴 P0 - Standard UI behavior, user expects this

---

### INT-BTN-203: Focus-visible only on keyboard focus (not mouse click)

**OS9 Behavior:**
- Clicking button with mouse does NOT show focus ring
- Pressing Tab to navigate to button DOES show focus ring (1px dotted)
- Pressing Space on focused button activates it
- This matches `:focus-visible` CSS behavior

**Implementation:**
```typescript
// Use browser's :focus-visible or polyfill
button:focus-visible {
  outline: 1px dotted #000;
  outline-offset: -3px;
}

// DO NOT use :focus alone
// :focus shows on mouse click (wrong for OS9)
```

**Priority:** 🔴 P0 - Accessibility + OS9 authenticity

---

### INT-BTN-204: Disabled state dims but remains visible

**OS9 Behavior:**
- Disabled buttons use light gray text
- Bevel remains (not flat)
- Cursor becomes `default` (not `not-allowed`)
- No hover state
- No pressed state

**Visual:**
```scss
.button {
  &:disabled {
    color: #999; // Light gray
    cursor: default; // NOT not-allowed

    &:hover {
      // No hover effect
    }
  }
}
```

**Priority:** 🔴 P0 - Standard behavior

---

## Window Manager (INT-WIN-2xx)

### INT-WIN-201: Modal windows always on top of document windows

**OS9 Window Type Hierarchy (highest to lowest):**
1. **System alerts** (e.g., crash dialogs) - z-index 1000+
2. **Modal dialogs** (blocking, dimmed background) - z-index 500-999
3. **Floating palettes** (tool palettes, inspectors) - z-index 100-499
4. **Document windows** (normal windows) - z-index 1-99

**Rules:**
- Modal dialog opens → all document windows become inactive
- Clicking document window while modal open → system beep, modal shakes
- Floating palette always above document windows, even when document is active
- Floating palette does NOT become active (stays above but dim)

**Implementation:**
```typescript
enum WindowType {
  DOCUMENT = 'document',
  FLOATING = 'floating',
  MODAL = 'modal',
  SYSTEM = 'system'
}

interface Window {
  type: WindowType;
  baseZIndex: number; // Determined by type
  orderWithinType: number; // Order among same-type windows
}

function calculateZIndex(window: Window): number {
  const typeBase = {
    [WindowType.DOCUMENT]: 0,
    [WindowType.FLOATING]: 100,
    [WindowType.MODAL]: 500,
    [WindowType.SYSTEM]: 1000
  };

  return typeBase[window.type] + window.orderWithinType;
}
```

**Priority:** 🔴 P0 - Core window management

---

### INT-WIN-202: Floating palettes above document, below modal

**OS9 Behavior:**
- Floating palettes (tool windows) stay above all document windows
- Even when document window is active, palette stays visible on top
- Palette does NOT steal focus when clicked (document stays active)
- Palette shows active state even when document has focus

**Use Cases:**
- Finder "Find" window
- Photoshop tool palettes
- Inspector panels

**Priority:** 🟡 P1 - Needed for authentic multi-window UIs

---

### INT-WIN-203: Window type hierarchy enforced in z-order

**See INT-WIN-201 for full hierarchy.**

**Priority:** 🔴 P0

---

### INT-WIN-204: Application switching deactivates all windows

**OS9 Behavior:**
- OS9 has application-level focus (not window-level like modern macOS)
- Switching to another app → all windows of current app become inactive
- Returning to app → previously active window becomes active again
- In web context: simulate with visibility change / blur events?

**Implementation (Web Approximation):**
```typescript
// When tab loses focus
window.addEventListener('blur', () => {
  // Deactivate all windows
  windowManager.deactivateAll();
  // Remember which was active
  windowManager.rememberActiveWindow();
});

// When tab regains focus
window.addEventListener('focus', () => {
  // Restore previously active window
  windowManager.restorePreviouslyActive();
});
```

**Priority:** 🟢 P2 - Web limitation, nice to have

---

## Menu Interaction (INT-MENU-2xx)

### INT-MENU-201: ⌘-key shortcuts activate menus visually

**OS9 Behavior:**
- Pressing ⌘-N (for File → New) shows:
  1. "File" menu title highlights briefly
  2. Menu dropdown appears
  3. "New" item highlights
  4. Action executes
  5. Menu closes
- This visual feedback confirms the shortcut worked
- Entire sequence takes ~300ms

**Implementation:**
```typescript
onKeyDown(e) {
  if (e.metaKey || e.ctrlKey) {
    const shortcut = e.key.toLowerCase();
    const menuItem = findMenuItemByShortcut(shortcut);

    if (menuItem) {
      // Animate menu activation
      highlightMenuTitle(menuItem.parentMenu);
      await sleep(100);
      showMenuDropdown(menuItem.parentMenu);
      highlightMenuItem(menuItem);
      await sleep(150);
      executeMenuItem(menuItem);
      closeMenu();
    }
  }
}
```

**Priority:** 🟡 P1 - Improves usability, authentic OS9 feel

---

### INT-MENU-202: Menu bar "sticky" after first activation

**OS9 Behavior:**
- First click on menu bar → enters menu mode
- After closing menu, menu bar stays "sticky" for ~2 seconds
- During sticky period, hovering menu titles opens them (no click needed)
- After timeout, returns to normal (click required again)

**Implementation:**
```typescript
let menuBarStickyTimeout: number | null = null;
let isMenuBarSticky = false;

function enterMenuMode() {
  isMenuBarSticky = true;
  clearTimeout(menuBarStickyTimeout);
  // ... open menu
}

function exitMenuMode() {
  // Keep sticky for 2 seconds
  menuBarStickyTimeout = setTimeout(() => {
    isMenuBarSticky = false;
  }, 2000);
}

function onMenuTitleHover(menuId: string) {
  if (isMenuMode || isMenuBarSticky) {
    // Open menu on hover
    openMenu(menuId);
  }
}
```

**Priority:** 🟢 P2 - Nice polish, not essential

---

### INT-MENU-203: Disabled items shown but not selectable

**OS9 Behavior:**
- Disabled items: light gray text
- No hover highlight
- Click does nothing (no beep, just ignored)
- Still visible (not hidden)

**Visual:**
```scss
.menuItem.disabled {
  color: #999;
  cursor: default;

  &:hover {
    background: transparent; // No highlight
  }
}
```

**Priority:** 🔴 P0 - Standard behavior

---

### INT-MENU-204: Submenu indicators (▶) on items with submenus

**OS9 Behavior:**
- Menu item with submenu shows ▶ on right side
- Hovering item (or arrow right) opens submenu to the right
- Submenu appears ~100ms after hover starts
- Moving mouse away closes submenu

**Priority:** 🟡 P1 - Common pattern in OS9 menus

---

## Finder Selection (INT-FIND-3xx) - Spatial Model

### INT-FIND-301: Grid layout calculates columns based on container width

**OS9 Finder Icon View:**
- Icons arranged in grid
- Column width = icon width + spacing (typically 80px total)
- Columns = floor(containerWidth / columnWidth)
- Icons fill left-to-right, top-to-bottom

**Layout Algorithm:**
```typescript
interface GridLayout {
  columns: number;
  rows: number;
  itemWidth: number;
  itemHeight: number;
}

function calculateGridLayout(
  containerWidth: number,
  itemCount: number
): GridLayout {
  const ITEM_WIDTH = 80;
  const ITEM_HEIGHT = 80;

  const columns = Math.max(1, Math.floor(containerWidth / ITEM_WIDTH));
  const rows = Math.ceil(itemCount / columns);

  return { columns, rows, itemWidth: ITEM_WIDTH, itemHeight: ITEM_HEIGHT };
}

function getItemPosition(itemIndex: number, layout: GridLayout) {
  const row = Math.floor(itemIndex / layout.columns);
  const col = itemIndex % layout.columns;
  return { row, col };
}
```

**Priority:** 🔴 P0 - Core Finder behavior

---

### INT-FIND-302: Arrow navigation wraps at grid boundaries

**OS9 Behavior:**
- Arrow Right at end of row → wraps to next row, first column
- Arrow Left at start of row → wraps to previous row, last column
- Arrow Down at bottom → no wrap (stays at bottom)
- Arrow Up at top → no wrap (stays at top)

**Implementation:**
```typescript
function navigateGrid(
  currentIndex: number,
  direction: 'up' | 'down' | 'left' | 'right',
  layout: GridLayout,
  itemCount: number
): number {
  const { row, col } = getItemPosition(currentIndex, layout);

  switch (direction) {
    case 'right':
      const nextIndex = currentIndex + 1;
      return nextIndex < itemCount ? nextIndex : currentIndex;

    case 'left':
      return Math.max(0, currentIndex - 1);

    case 'down':
      const downIndex = currentIndex + layout.columns;
      return downIndex < itemCount ? downIndex : currentIndex;

    case 'up':
      return Math.max(0, currentIndex - layout.columns);
  }
}
```

**Priority:** 🔴 P0 - Core navigation

---

### INT-FIND-303: Click empty space deselects all

**OS9 Behavior:**
- Click on empty area of Finder window → deselect all items
- Selection becomes empty set
- Focus remains on Finder window

**Implementation:**
```typescript
onFinderWindowClick(e) {
  const clickedItem = findItemAt(e.clientX, e.clientY);

  if (!clickedItem) {
    // Clicked empty space
    deselectAll();
  }
}
```

**Priority:** 🔴 P0 - Standard Finder behavior

---

### INT-FIND-304: Shift-select across rows uses spatial order

**OS9 Behavior:**
- Select item at (row 1, col 2)
- Shift-click item at (row 3, col 4)
- Selection includes all items in rectangular region? OR linear order?
- **Need to verify:** OS9 uses linear index order, not rectangular selection

**Implementation (Linear Order):**
```typescript
function selectRange(startIndex: number, endIndex: number) {
  const [min, max] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];
  const selectedIds = items.slice(min, max + 1).map(item => item.id);
  return new Set(selectedIds);
}
```

**Priority:** 🟡 P1 - Affects multi-select UX

**TODO: Verify with OS9 screenshots/videos**

---

### INT-FIND-305: Dynamic filtering recalculates grid layout

**OS9 Behavior:**
- When search/filter reduces visible items, grid reflows
- Columns stay same, rows decrease
- Selection preserved for visible items
- Focus moves to first visible item if focused item hidden

**Implementation:**
```typescript
function applyFilter(items: Item[], filter: string): Item[] {
  const filtered = items.filter(item =>
    item.name.toLowerCase().includes(filter.toLowerCase())
  );

  // Recalculate grid
  const layout = calculateGridLayout(containerWidth, filtered.length);

  // Preserve selection
  const newSelection = new Set(
    Array.from(selection).filter(id =>
      filtered.some(item => item.id === id)
    )
  );

  return { filtered, layout, selection: newSelection };
}
```

**Priority:** 🟡 P1 - Important for usability

---

## Summary

**Critical (P0) - Must Implement:** 18 requirements
**Important (P1) - Should Implement:** 12 requirements
**Enhancement (P2) - Nice to Have:** 4 requirements

**Next Steps:**
1. Create tests for all P0 requirements
2. Implement P0 behaviors in runtime modules
3. Validate against OS9 screenshots/videos
4. Add P1 requirements incrementally
