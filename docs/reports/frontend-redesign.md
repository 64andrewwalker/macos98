# Frontend Redesign: Calculator Module

## Current Architecture Diagram

The Calculator is currently implemented as a standalone application module:
- **Path**: `src/apps/calculator/CalculatorView.tsx`
- **Styles**: `src/components/apps/Calculator.module.scss`
- **Structure**:
  - Container (Grid 4 cols)
    - Display (Col 1-4)
    - Keypad Buttons (Col 1-4, implicitly placed)

## Identified Issues

1.  **Alignment & Sizing** (Fixed):
    - ~The keypad uses a CSS Grid (`repeat(4, 1fr)`), but individual buttons have fixed pixel dimensions.~ -> Fixed by using 100% width/height buttons.
    - ~Spanning buttons (Zero, Plus, Equals) use manually calculated fixed sizes.~ -> Fixed by using grid spanning.
    - ~The Display component is outside the Keypad grid.~ -> Fixed by merging into single grid.

2.  **Whitespace** (Fixed):
    - Excessive white space at the bottom of the window due to mismatch between content height (~216px) and configured window height (300px).
    - Window background showing through.

## Proposed Architecture

### Layout Strategy
Move to a **Single Grid Container** approach for the entire calculator interface.

-   **Container**: CSS Grid with 4 columns.
-   **Rows**:
    -   Row 1: Display (spans 4 columns).
    -   Row 2-6: Keypad buttons.
-   **Sizing**:
    -   Use `fr` units for columns.
    -   Buttons should have `width: 100%` and `height: 100%` to fill their assigned grid cells.
    -   Gaps define the spacing, not margins.
-   **Window Size**:
    -   Match exact content height: 250px (216px content + 34px chrome).

### Component Hierarchy

```tsx
<div className="calculator-grid">
  <div className="display-area">...</div>
  <button className="btn-clear">C</button>
  <button className="btn-divide">/</button>
  ...
</div>
```

### Design Tokens

Re-affirm usage of existing tokens but apply them to the Grid gap and padding rather than element sizes where possible.
-   `gap`: `$space-4`
-   `padding`: `$space-8`
-   `border`: `$color-border-gray`

## Migration Plan (Completed)

1.  **Refactor SCSS**:
    -   ✅ Update `.calculator` to be the main Grid container.
    -   ✅ Ensure `.calculator` fills available height (`height: 100%`).
    
2.  **Update Component**:
    -   ✅ Flatten the JSX structure.

3.  **Manifest Update**:
    -   ✅ Set window height to 250px.

4.  **Testing**:
    -   ✅ Verify standard button size (30px) is maintained.
    -   ✅ Verify visual alignment.
