# Finder Grid Spatial Model

This document defines the formal spatial model for Finder icon/list view selection and navigation.

**Purpose:** Replace simple array-index logic with true OS9 grid-aware spatial positioning.

**Requirements Addressed:**
- `INT-FIND-301`: Grid layout calculates columns based on container width
- `INT-FIND-302`: Arrow navigation wraps at grid boundaries
- `INT-FIND-303`: Click empty space deselects all
- `INT-FIND-304`: Shift-select across rows uses spatial order
- `INT-FIND-305`: Dynamic filtering recalculates grid layout

---

## 1. Coordinate System

### 1.1 Grid Coordinates

Every item in the Finder has both:
- **Linear index** (0-based position in items array)
- **Grid coordinates** (row, col) based on layout

```typescript
interface GridCoordinates {
  row: number;    // 0-based row index
  col: number;    // 0-based column index
  index: number;  // Linear array index
}

interface GridDimensions {
  columns: number;      // Number of columns in grid
  rows: number;         // Number of rows in grid
  itemWidth: number;    // Width of each grid cell (px)
  itemHeight: number;   // Height of each grid cell (px)
  containerWidth: number;  // Width of container (px)
}
```

### 1.2 Coordinate Conversion

```typescript
/**
 * Convert linear index to grid coordinates
 */
function indexToGrid(index: number, columns: number): GridCoordinates {
  return {
    row: Math.floor(index / columns),
    col: index % columns,
    index
  };
}

/**
 * Convert grid coordinates to linear index
 */
function gridToIndex(row: number, col: number, columns: number): number {
  return row * columns + col;
}

/**
 * Check if grid coordinates are valid
 */
function isValidGridPos(
  row: number,
  col: number,
  dims: GridDimensions,
  itemCount: number
): boolean {
  if (row < 0 || col < 0 || col >= dims.columns) {
    return false;
  }

  const index = gridToIndex(row, col, dims.columns);
  return index >= 0 && index < itemCount;
}
```

---

## 2. Grid Layout Algorithm

### 2.1 Dynamic Column Calculation

```typescript
const ICON_VIEW_CONFIG = {
  itemWidth: 80,        // Icon + padding
  itemHeight: 80,       // Icon + label height
  minColumns: 1,        // Never less than 1 column
  maxColumns: Infinity  // No upper limit
};

const LIST_VIEW_CONFIG = {
  itemWidth: Infinity,  // Full width rows
  itemHeight: 20,       // Row height
  minColumns: 1,
  maxColumns: 1         // Always 1 column in list view
};

function calculateGridDimensions(
  containerWidth: number,
  itemCount: number,
  viewMode: 'icon' | 'list'
): GridDimensions {
  const config = viewMode === 'icon' ? ICON_VIEW_CONFIG : LIST_VIEW_CONFIG;

  let columns: number;

  if (viewMode === 'list') {
    columns = 1;
  } else {
    // Icon view: fit as many columns as possible
    columns = Math.max(
      config.minColumns,
      Math.floor(containerWidth / config.itemWidth)
    );
  }

  const rows = Math.ceil(itemCount / columns);

  return {
    columns,
    rows,
    itemWidth: config.itemWidth,
    itemHeight: config.itemHeight,
    containerWidth
  };
}
```

### 2.2 Layout Updates

Grid layout must recalculate when:
- Container resizes
- View mode changes (icon ↔ list)
- Items added/removed
- Filter applied

```typescript
interface FinderGridLayout {
  items: FinderItem[];
  dimensions: GridDimensions;
  viewMode: 'icon' | 'list';
}

function updateLayout(
  items: FinderItem[],
  containerWidth: number,
  viewMode: 'icon' | 'list'
): FinderGridLayout {
  const dimensions = calculateGridDimensions(
    containerWidth,
    items.length,
    viewMode
  );

  return {
    items,
    dimensions,
    viewMode
  };
}
```

---

## 3. Arrow Key Navigation

### 3.1 Navigation Rules (Icon View)

| Key | Behavior | Wrapping |
|-----|----------|----------|
| **Arrow Right** | Move to next item (col + 1) | Wrap to next row if at end of row |
| **Arrow Left** | Move to previous item (col - 1) | Wrap to previous row if at start of row |
| **Arrow Down** | Move down one row (row + 1) | No wrap - stay at bottom row |
| **Arrow Up** | Move up one row (row - 1) | No wrap - stay at top row |

### 3.2 Navigation Implementation

```typescript
type Direction = 'up' | 'down' | 'left' | 'right';

function navigateGrid(
  currentIndex: number,
  direction: Direction,
  layout: FinderGridLayout
): number {
  const { dimensions, items } = layout;
  const { columns } = dimensions;
  const itemCount = items.length;

  const current = indexToGrid(currentIndex, columns);
  let nextRow = current.row;
  let nextCol = current.col;

  switch (direction) {
    case 'right':
      nextCol++;
      // Wrap to next row if needed
      if (nextCol >= columns) {
        nextCol = 0;
        nextRow++;
      }
      break;

    case 'left':
      nextCol--;
      // Wrap to previous row if needed
      if (nextCol < 0) {
        nextRow--;
        nextCol = columns - 1;
      }
      break;

    case 'down':
      nextRow++;
      // No wrapping - clamp to bottom
      break;

    case 'up':
      nextRow--;
      // No wrapping - clamp to top
      break;
  }

  // Validate new position
  if (!isValidGridPos(nextRow, nextCol, dimensions, itemCount)) {
    // Invalid position - stay where we are
    return currentIndex;
  }

  const nextIndex = gridToIndex(nextRow, nextCol, columns);

  // Final bounds check
  if (nextIndex < 0 || nextIndex >= itemCount) {
    return currentIndex;
  }

  return nextIndex;
}
```

### 3.3 Navigation Edge Cases

**Case 1: Last row is partially filled**
```
Grid:  [0] [1] [2]
       [3] [4] [X]  <- Only 2 items in last row

From item 4, Arrow Right → stay at 4 (no item 5)
From item 4, Arrow Down → stay at 4 (no row below)
```

**Case 2: Column doesn't exist in target row**
```
Grid:  [0] [1] [2] [3]
       [4] [X] [X] [X]  <- Only 1 item in last row

From item 3, Arrow Down → move to 4 (closest valid item)
```

Implementation:
```typescript
function findClosestValidItem(
  targetRow: number,
  targetCol: number,
  dimensions: GridDimensions,
  itemCount: number
): number {
  // Try target position first
  if (isValidGridPos(targetRow, targetCol, dimensions, itemCount)) {
    return gridToIndex(targetRow, targetCol, dimensions.columns);
  }

  // Target column doesn't exist - find rightmost item in row
  const rowStart = targetRow * dimensions.columns;
  const rowEnd = Math.min(rowStart + dimensions.columns, itemCount);

  if (rowStart >= itemCount) {
    // Row doesn't exist - stay at current item
    return -1; // Signal to stay at current
  }

  // Return last valid item in target row
  return rowEnd - 1;
}
```

---

## 4. Selection Model

### 4.1 Selection State

```typescript
interface SelectionState {
  selectedIds: Set<string>;     // Currently selected item IDs
  anchorId: string | null;      // Anchor for range selection (Shift+Click)
  focusId: string | null;       // Currently focused item (keyboard navigation)
  lastClickId: string | null;   // Last clicked item (for Shift+Click)
}

interface SelectionAction {
  type: 'click' | 'cmd-click' | 'shift-click' | 'arrow-nav' | 'deselect-all';
  itemId?: string;
  modifiers?: {
    meta: boolean;
    ctrl: boolean;
    shift: boolean;
  };
}
```

### 4.2 Click Selection

```typescript
function handleClick(
  itemId: string,
  modifiers: SelectionAction['modifiers'],
  currentState: SelectionState
): SelectionState {
  const { meta, ctrl, shift } = modifiers;

  if (meta || ctrl) {
    // Cmd+Click: Toggle selection
    return toggleSelection(itemId, currentState);
  }

  if (shift) {
    // Shift+Click: Range selection
    return rangeSelection(itemId, currentState);
  }

  // Simple click: Select only this item
  return {
    selectedIds: new Set([itemId]),
    anchorId: itemId,
    focusId: itemId,
    lastClickId: itemId
  };
}

function toggleSelection(
  itemId: string,
  state: SelectionState
): SelectionState {
  const newSelection = new Set(state.selectedIds);

  if (newSelection.has(itemId)) {
    newSelection.delete(itemId);
  } else {
    newSelection.add(itemId);
  }

  return {
    ...state,
    selectedIds: newSelection,
    focusId: itemId,
    lastClickId: itemId
  };
}
```

### 4.3 Range Selection (Shift+Click)

**OS9 Behavior:** Shift+Click selects all items from anchor to current in **linear index order** (not rectangular region).

```typescript
function rangeSelection(
  targetId: string,
  state: SelectionState,
  layout: FinderGridLayout
): SelectionState {
  const { items } = layout;
  const anchorIndex = items.findIndex(item => item.id === state.anchorId);
  const targetIndex = items.findIndex(item => item.id === targetId);

  if (anchorIndex === -1) {
    // No anchor - treat as simple click
    return {
      selectedIds: new Set([targetId]),
      anchorId: targetId,
      focusId: targetId,
      lastClickId: targetId
    };
  }

  // Select all items in linear range
  const [start, end] = anchorIndex < targetIndex
    ? [anchorIndex, targetIndex]
    : [targetIndex, anchorIndex];

  const rangeIds = items
    .slice(start, end + 1)
    .map(item => item.id);

  return {
    selectedIds: new Set(rangeIds),
    anchorId: state.anchorId, // Keep original anchor
    focusId: targetId,
    lastClickId: targetId
  };
}
```

**Example:**
```
Grid:  [0] [1] [2]
       [3] [4] [5]
       [6] [7] [8]

Click item 1 → anchor = 1, selected = {1}
Shift+Click item 7 → selected = {1,2,3,4,5,6,7} (linear order)

NOT: {1,2,4,5,7} (rectangular region)
```

---

## 5. Hit Testing (Click Detection)

### 5.1 Point-to-Item Mapping

```typescript
interface Point {
  x: number;  // Relative to container
  y: number;  // Relative to container
}

function findItemAtPoint(
  point: Point,
  layout: FinderGridLayout
): string | null {
  const { dimensions, items } = layout;
  const { itemWidth, itemHeight, columns } = dimensions;

  // Calculate grid position from pixel coordinates
  const col = Math.floor(point.x / itemWidth);
  const row = Math.floor(point.y / itemHeight);

  // Convert to linear index
  const index = gridToIndex(row, col, columns);

  // Validate
  if (index < 0 || index >= items.length) {
    return null; // Clicked empty space
  }

  return items[index].id;
}
```

### 5.2 Empty Space Click

```typescript
function handleContainerClick(
  point: Point,
  layout: FinderGridLayout,
  state: SelectionState
): SelectionState {
  const itemId = findItemAtPoint(point, layout);

  if (itemId === null) {
    // Clicked empty space - deselect all
    return {
      selectedIds: new Set(),
      anchorId: null,
      focusId: null,
      lastClickId: null
    };
  }

  // Clicked an item - handle normally
  return handleClick(itemId, { meta: false, ctrl: false, shift: false }, state);
}
```

---

## 6. Dynamic Filtering

### 6.1 Filter Application

```typescript
function applyFilter(
  allItems: FinderItem[],
  filter: string,
  layout: FinderGridLayout,
  selection: SelectionState
): { layout: FinderGridLayout; selection: SelectionState } {
  // Filter items
  const filteredItems = allItems.filter(item =>
    item.name.toLowerCase().includes(filter.toLowerCase())
  );

  // Recalculate layout
  const newLayout = updateLayout(
    filteredItems,
    layout.dimensions.containerWidth,
    layout.viewMode
  );

  // Preserve selection for visible items only
  const visibleIds = new Set(filteredItems.map(item => item.id));
  const newSelectedIds = new Set(
    Array.from(selection.selectedIds).filter(id => visibleIds.has(id))
  );

  // Update focus to first visible item if current focus is hidden
  let newFocusId = selection.focusId;
  if (newFocusId && !visibleIds.has(newFocusId)) {
    newFocusId = filteredItems[0]?.id || null;
  }

  const newSelection: SelectionState = {
    selectedIds: newSelectedIds,
    anchorId: visibleIds.has(selection.anchorId) ? selection.anchorId : newFocusId,
    focusId: newFocusId,
    lastClickId: selection.lastClickId
  };

  return { layout: newLayout, selection: newSelection };
}
```

---

## 7. Complete Interface

### 7.1 Unified Spatial Model

```typescript
/**
 * Complete spatial model for Finder grid/list views
 */
class FinderSpatialModel {
  private layout: FinderGridLayout;
  private selection: SelectionState;

  constructor(
    items: FinderItem[],
    containerWidth: number,
    viewMode: 'icon' | 'list'
  ) {
    this.layout = updateLayout(items, containerWidth, viewMode);
    this.selection = {
      selectedIds: new Set(),
      anchorId: null,
      focusId: null,
      lastClickId: null
    };
  }

  // Layout operations
  resize(newWidth: number): void {
    this.layout = updateLayout(
      this.layout.items,
      newWidth,
      this.layout.viewMode
    );
  }

  setViewMode(mode: 'icon' | 'list'): void {
    this.layout = updateLayout(
      this.layout.items,
      this.layout.dimensions.containerWidth,
      mode
    );
  }

  // Navigation
  navigate(direction: Direction): void {
    if (!this.selection.focusId) return;

    const currentIndex = this.layout.items.findIndex(
      item => item.id === this.selection.focusId
    );

    const nextIndex = navigateGrid(currentIndex, direction, this.layout);
    const nextId = this.layout.items[nextIndex]?.id;

    if (nextId) {
      this.selection.focusId = nextId;
      // Optionally update selection if not holding Shift
    }
  }

  // Selection
  click(itemId: string, modifiers: SelectionAction['modifiers']): void {
    this.selection = handleClick(itemId, modifiers, this.selection);
  }

  clickPoint(point: Point): void {
    this.selection = handleContainerClick(point, this.layout, this.selection);
  }

  // Filtering
  filter(searchTerm: string, allItems: FinderItem[]): void {
    const result = applyFilter(
      allItems,
      searchTerm,
      this.layout,
      this.selection
    );
    this.layout = result.layout;
    this.selection = result.selection;
  }

  // Getters
  getLayout(): FinderGridLayout {
    return this.layout;
  }

  getSelection(): SelectionState {
    return this.selection;
  }

  getGridCoordinates(itemId: string): GridCoordinates | null {
    const index = this.layout.items.findIndex(item => item.id === itemId);
    if (index === -1) return null;
    return indexToGrid(index, this.layout.dimensions.columns);
  }
}
```

---

## 8. Implementation Plan

### 8.1 Refactor `useFinderSelection`

**Current (Simple):**
```typescript
// Uses array index only
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
```

**New (Spatial):**
```typescript
// Uses FinderSpatialModel
const [model] = useState(() => new FinderSpatialModel(items, containerWidth, 'icon'));

useEffect(() => {
  model.resize(containerWidth);
}, [containerWidth]);

const handleItemClick = (itemId: string, e: React.MouseEvent) => {
  model.click(itemId, {
    meta: e.metaKey,
    ctrl: e.ctrlKey,
    shift: e.shiftKey
  });
};

const handleKeyDown = (e: React.KeyboardEvent) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    const direction = e.key.replace('Arrow', '').toLowerCase() as Direction;
    model.navigate(direction);
  }
};
```

### 8.2 Testing Strategy

**Unit Tests:**
- Grid coordinate conversion (index ↔ grid)
- Navigation edge cases (partial rows, wrapping)
- Range selection linear order
- Filter preserves selection
- Hit testing (point → item)

**Integration Tests:**
- Resize container → columns recalculate
- Switch view mode → layout updates
- Multi-select + filter → selection preserved
- Arrow keys in partially filled grid

---

## 9. Edge Cases Reference

| Case | Expected Behavior | Implementation |
|------|------------------|----------------|
| Navigate right at end of row | Wrap to next row, first column | Check `nextCol >= columns` |
| Navigate down at bottom | Stay at bottom row | Clamp `nextRow` to max |
| Navigate to non-existent column | Move to rightmost valid item in row | `findClosestValidItem()` |
| Shift+select across filter | Select only visible items in range | Filter before range calculation |
| Resize during selection | Preserve selection, recalculate grid | Update layout, keep `selectedIds` |
| Click empty space | Deselect all | `findItemAtPoint()` returns null |
| Last row partial | Navigation respects item count | Validate with `itemCount` |

---

**Status:** ✅ Spatial model defined
**Next:** Implement `FinderSpatialModel` class in `finderSelection.ts`
**Tests:** Update `finderSelection.test.ts` to cover all spatial cases
