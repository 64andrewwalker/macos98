/**
 * Title Bar Interaction Engine
 *
 * Implements OS9-authentic window dragging with strict drag zone rules:
 * - Only the left drag zone (between close box and title text) initiates dragging
 * - Title text and control buttons do NOT trigger dragging
 *
 * @see INTERACTION_BLUEPRINT.md - Title Bar Drag Zones
 */

import { useCallback, useRef, useState, type RefObject } from 'react'

export interface TitleBarInteractionOptions {
  windowId: string
  initialPosition: { x: number; y: number }
}

export interface TitleBarInteractionResult {
  position: { x: number; y: number }
  isDragging: boolean
  titleBarProps: React.HTMLAttributes<HTMLDivElement>
  dragZoneProps: React.HTMLAttributes<HTMLDivElement>
}

/**
 * Hook for OS9-style title bar interaction
 *
 * Enforces drag zone rules: only the explicit drag zone can initiate window dragging.
 * The title text, control buttons, and right-side empty space are NOT draggable.
 */
export function useTitleBarInteraction(
  options: TitleBarInteractionOptions
): TitleBarInteractionResult {
  const { windowId, initialPosition } = options
  const [position, setPosition] = useState(initialPosition)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ x: number; y: number } | null>(null)

  const handleDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    // TODO: Implement drag start logic
    // - Capture mouse position
    // - Set isDragging to true
    // - Add global mousemove/mouseup listeners
    setIsDragging(true)
    dragStartRef.current = { x: e.clientX, y: e.clientY }
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    // TODO: Implement drag movement
    // - Calculate delta from drag start
    // - Update position
  }, [])

  const handleMouseUp = useCallback(() => {
    // TODO: Implement drag end
    // - Remove global listeners
    // - Set isDragging to false
    setIsDragging(false)
    dragStartRef.current = null
  }, [])

  // Props for the title bar container (handles focus, but does NOT start drag)
  const titleBarProps: React.HTMLAttributes<HTMLDivElement> = {
    onMouseDown: (e) => {
      // Focus window on title bar click, but don't start drag
      // Drag is only started by dragZoneProps
      e.stopPropagation()
    }
  }

  // Props for the explicit drag zone (the only element that starts dragging)
  const dragZoneProps: React.HTMLAttributes<HTMLDivElement> = {
    onMouseDown: handleDragStart,
    style: {
      cursor: isDragging ? 'grabbing' : 'grab'
    }
  }

  return {
    position,
    isDragging,
    titleBarProps,
    dragZoneProps
  }
}
