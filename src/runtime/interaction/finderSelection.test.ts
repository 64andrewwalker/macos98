// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFinderSelection } from './finderSelection'

/**
 * Finder Selection Engine Tests
 *
 * Validates OS9 Finder selection behavior:
 * - Single selection (click)
 * - Multi-selection (Cmd+Click)
 * - Range selection (Shift+Click)
 * - Arrow key navigation
 * - Blue fill + white text selection visuals (NOT button bevel)
 *
 * @see INTERACTION_BLUEPRINT.md - Finder Selection Rules
 */

describe('useFinderSelection', () => {
  const mockItems = [
    { id: 'item-1' },
    { id: 'item-2' },
    { id: 'item-3' },
    { id: 'item-4' },
    { id: 'item-5' }
  ]

  describe('Initial State', () => {
    it('starts with no selection', () => {
      const { result } = renderHook(() => useFinderSelection('grid', mockItems))

      expect(result.current.selectedIds.size).toBe(0)
      expect(result.current.focusedId).toBeNull()
    })

    it('provides getItemProps and containerProps', () => {
      const { result } = renderHook(() => useFinderSelection('grid', mockItems))

      expect(result.current.getItemProps).toBeDefined()
      expect(result.current.containerProps).toBeDefined()
    })
  })

  describe('Single Selection', () => {
    it('selects item on click', () => {
      const { result } = renderHook(() => useFinderSelection('grid', mockItems))

      const itemProps = result.current.getItemProps('item-1')

      act(() => {
        itemProps.itemProps.onClick?.({
          metaKey: false,
          ctrlKey: false,
          shiftKey: false
        } as React.MouseEvent)
      })

      expect(result.current.selectedIds.has('item-1')).toBe(true)
      expect(result.current.selectedIds.size).toBe(1)
    })

    it('replaces previous selection on new click', () => {
      const { result } = renderHook(() => useFinderSelection('grid', mockItems))

      // Select item 1
      const item1Props = result.current.getItemProps('item-1')
      act(() => {
        item1Props.itemProps.onClick?.({
          metaKey: false,
          ctrlKey: false,
          shiftKey: false
        } as React.MouseEvent)
      })

      // Select item 2
      const item2Props = result.current.getItemProps('item-2')
      act(() => {
        item2Props.itemProps.onClick?.({
          metaKey: false,
          ctrlKey: false,
          shiftKey: false
        } as React.MouseEvent)
      })

      expect(result.current.selectedIds.has('item-1')).toBe(false)
      expect(result.current.selectedIds.has('item-2')).toBe(true)
      expect(result.current.selectedIds.size).toBe(1)
    })
  })

  describe('Multi-Selection (Cmd+Click)', () => {
    it('toggles selection with Cmd+Click', () => {
      const { result } = renderHook(() => useFinderSelection('grid', mockItems))

      // Cmd+Click item 1
      const item1Props = result.current.getItemProps('item-1')
      act(() => {
        item1Props.itemProps.onClick?.({
          metaKey: true,
          ctrlKey: false,
          shiftKey: false
        } as React.MouseEvent)
      })

      expect(result.current.selectedIds.has('item-1')).toBe(true)

      // Cmd+Click item 2 (add to selection)
      const item2Props = result.current.getItemProps('item-2')
      act(() => {
        item2Props.itemProps.onClick?.({
          metaKey: true,
          ctrlKey: false,
          shiftKey: false
        } as React.MouseEvent)
      })

      expect(result.current.selectedIds.has('item-1')).toBe(true)
      expect(result.current.selectedIds.has('item-2')).toBe(true)
      expect(result.current.selectedIds.size).toBe(2)
    })

    it('deselects item when Cmd+Clicking already-selected item', () => {
      const { result } = renderHook(() => useFinderSelection('grid', mockItems))

      const item1Props = result.current.getItemProps('item-1')

      // Select item 1
      act(() => {
        item1Props.itemProps.onClick?.({
          metaKey: true,
          ctrlKey: false,
          shiftKey: false
        } as React.MouseEvent)
      })

      expect(result.current.selectedIds.has('item-1')).toBe(true)

      // Cmd+Click again to deselect
      act(() => {
        item1Props.itemProps.onClick?.({
          metaKey: true,
          ctrlKey: false,
          shiftKey: false
        } as React.MouseEvent)
      })

      expect(result.current.selectedIds.has('item-1')).toBe(false)
    })
  })

  describe('Range Selection (Shift+Click)', () => {
    it('selects range from last selected to current', () => {
      const { result } = renderHook(() => useFinderSelection('grid', mockItems))

      // Select item 1
      const item1Props = result.current.getItemProps('item-1')
      act(() => {
        item1Props.itemProps.onClick?.({
          metaKey: false,
          ctrlKey: false,
          shiftKey: false
        } as React.MouseEvent)
      })

      // Shift+Click item 3
      const item3Props = result.current.getItemProps('item-3')
      act(() => {
        item3Props.itemProps.onClick?.({
          metaKey: false,
          ctrlKey: false,
          shiftKey: true
        } as React.MouseEvent)
      })

      // Should select items 1, 2, and 3
      expect(result.current.selectedIds.has('item-1')).toBe(true)
      expect(result.current.selectedIds.has('item-2')).toBe(true)
      expect(result.current.selectedIds.has('item-3')).toBe(true)
      expect(result.current.selectedIds.size).toBe(3)
    })
  })

  describe('Keyboard Navigation', () => {
    it('moves focus down on ArrowDown', () => {
      const { result } = renderHook(() => useFinderSelection('list', mockItems))

      // Select and focus item 1
      const item1Props = result.current.getItemProps('item-1')
      act(() => {
        item1Props.itemProps.onClick?.({
          metaKey: false,
          ctrlKey: false,
          shiftKey: false
        } as React.MouseEvent)
      })

      // Press ArrowDown
      act(() => {
        result.current.containerProps.onKeyDown?.({
          key: 'ArrowDown',
          shiftKey: false,
          preventDefault: () => {}
        } as React.KeyboardEvent)
      })

      expect(result.current.focusedId).toBe('item-2')
      expect(result.current.selectedIds.has('item-2')).toBe(true)
    })

    it('moves focus up on ArrowUp', () => {
      const { result } = renderHook(() => useFinderSelection('list', mockItems))

      // Select and focus item 2
      const item2Props = result.current.getItemProps('item-2')
      act(() => {
        item2Props.itemProps.onClick?.({
          metaKey: false,
          ctrlKey: false,
          shiftKey: false
        } as React.MouseEvent)
      })

      // Press ArrowUp
      act(() => {
        result.current.containerProps.onKeyDown?.({
          key: 'ArrowUp',
          shiftKey: false,
          preventDefault: () => {}
        } as React.KeyboardEvent)
      })

      expect(result.current.focusedId).toBe('item-1')
      expect(result.current.selectedIds.has('item-1')).toBe(true)
    })
  })

  describe('Data Attributes for SCSS Mapping', () => {
    it('provides data-selected attribute for selected items', () => {
      const { result } = renderHook(() => useFinderSelection('grid', mockItems))

      // Select item 1
      const item1Props = result.current.getItemProps('item-1')
      act(() => {
        item1Props.itemProps.onClick?.({
          metaKey: false,
          ctrlKey: false,
          shiftKey: false
        } as React.MouseEvent)
      })

      const selectedItemProps = result.current.getItemProps('item-1')
      const unselectedItemProps = result.current.getItemProps('item-2')

      expect(selectedItemProps.itemProps['data-selected']).toBe(true)
      expect(unselectedItemProps.itemProps['data-selected']).toBeUndefined()
    })

    it('provides data-focused attribute for focused item', () => {
      const { result } = renderHook(() => useFinderSelection('grid', mockItems))

      // Select and focus item 1
      const item1Props = result.current.getItemProps('item-1')
      act(() => {
        item1Props.itemProps.onClick?.({
          metaKey: false,
          ctrlKey: false,
          shiftKey: false
        } as React.MouseEvent)
      })

      const focusedItemProps = result.current.getItemProps('item-1')
      const unfocusedItemProps = result.current.getItemProps('item-2')

      expect(focusedItemProps.itemProps['data-focused']).toBe(true)
      expect(unfocusedItemProps.itemProps['data-focused']).toBeUndefined()
    })

    it('sets tabIndex 0 for focused item, -1 for others', () => {
      const { result } = renderHook(() => useFinderSelection('grid', mockItems))

      // Select and focus item 1
      const item1Props = result.current.getItemProps('item-1')
      act(() => {
        item1Props.itemProps.onClick?.({
          metaKey: false,
          ctrlKey: false,
          shiftKey: false
        } as React.MouseEvent)
      })

      const focusedItemProps = result.current.getItemProps('item-1')
      const unfocusedItemProps = result.current.getItemProps('item-2')

      expect(focusedItemProps.itemProps.tabIndex).toBe(0)
      expect(unfocusedItemProps.itemProps.tabIndex).toBe(-1)
    })
  })

  describe('OS9 Authenticity Requirements', () => {
    it('supports both grid and list selection models', () => {
      // Grid model
      const { result: gridResult } = renderHook(() =>
        useFinderSelection('grid', mockItems)
      )
      expect(gridResult.current).toBeDefined()

      // List model
      const { result: listResult } = renderHook(() =>
        useFinderSelection('list', mockItems)
      )
      expect(listResult.current).toBeDefined()

      // Both should provide the same API
      expect(gridResult.current.getItemProps).toBeDefined()
      expect(listResult.current.getItemProps).toBeDefined()
    })
  })
})
