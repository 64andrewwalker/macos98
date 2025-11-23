/**
 * Finder Selection Engine
 *
 * Provides shared selection and keyboard navigation for Finder-style grids and lists.
 * Supports:
 * - Single selection (click)
 * - Multi-selection (Cmd+Click)
 * - Range selection (Shift+Click)
 * - Keyboard navigation (arrows, Enter)
 *
 * Selection uses blue fill + white text + subtle inner shadow (NOT button bevel).
 *
 * @see INTERACTION_BLUEPRINT.md - Finder Selection Rules
 */

import { useCallback, useState } from 'react'

export type SelectionModel = 'grid' | 'list'

export interface SelectionItem {
  id: string
}

export interface ItemSelectionProps {
  selected: boolean
  focused: boolean
  itemProps: React.HTMLAttributes<HTMLElement> & {
    'data-selected'?: boolean
    'data-focused'?: boolean
    tabIndex?: number
  }
}

export interface FinderSelectionResult {
  selectedIds: Set<string>
  focusedId: string | null
  getItemProps: (id: string) => ItemSelectionProps
  containerProps: React.HTMLAttributes<HTMLElement>
}

/**
 * Hook for Finder-style selection and keyboard navigation
 *
 * Implements OS9 selection behavior:
 * - Click: single selection
 * - Cmd+Click: toggle selection
 * - Shift+Click: range selection
 * - Arrow keys: navigate focus
 * - Enter: open focused item
 */
export function useFinderSelection(
  model: SelectionModel,
  items: SelectionItem[]
): FinderSelectionResult {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null)

  const handleItemClick = useCallback((id: string, event: React.MouseEvent) => {
    if (event.metaKey || event.ctrlKey) {
      // Cmd+Click: Toggle selection
      setSelectedIds(prev => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          next.add(id)
        }
        return next
      })
      setLastSelectedId(id)
    } else if (event.shiftKey && lastSelectedId) {
      // Shift+Click: Range selection
      const lastIndex = items.findIndex(item => item.id === lastSelectedId)
      const currentIndex = items.findIndex(item => item.id === id)
      const [start, end] = lastIndex < currentIndex
        ? [lastIndex, currentIndex]
        : [currentIndex, lastIndex]

      const rangeIds = items.slice(start, end + 1).map(item => item.id)
      setSelectedIds(new Set(rangeIds))
    } else {
      // Click: Single selection
      setSelectedIds(new Set([id]))
      setLastSelectedId(id)
    }
    setFocusedId(id)
  }, [items, lastSelectedId])

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!focusedId) return

    const currentIndex = items.findIndex(item => item.id === focusedId)
    let nextIndex = currentIndex

    // TODO: Implement grid-aware arrow navigation for 'grid' model
    // For now, simple list navigation

    if (event.key === 'ArrowDown') {
      nextIndex = Math.min(currentIndex + 1, items.length - 1)
      event.preventDefault()
    } else if (event.key === 'ArrowUp') {
      nextIndex = Math.max(currentIndex - 1, 0)
      event.preventDefault()
    } else if (event.key === 'Enter') {
      // TODO: Trigger open/activate for focused item
      event.preventDefault()
    }

    if (nextIndex !== currentIndex) {
      const nextId = items[nextIndex]?.id
      if (nextId) {
        setFocusedId(nextId)
        if (!event.shiftKey) {
          setSelectedIds(new Set([nextId]))
          setLastSelectedId(nextId)
        }
      }
    }
  }, [focusedId, items])

  const getItemProps = useCallback((id: string): ItemSelectionProps => {
    const selected = selectedIds.has(id)
    const focused = focusedId === id

    return {
      selected,
      focused,
      itemProps: {
        onClick: (e) => handleItemClick(id, e),
        'data-selected': selected || undefined,
        'data-focused': focused || undefined,
        tabIndex: focused ? 0 : -1
      }
    }
  }, [selectedIds, focusedId, handleItemClick])

  const containerProps: React.HTMLAttributes<HTMLElement> = {
    onKeyDown: handleKeyDown,
    tabIndex: 0
  }

  return {
    selectedIds,
    focusedId,
    getItemProps,
    containerProps
  }
}
