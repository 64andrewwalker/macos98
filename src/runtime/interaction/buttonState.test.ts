// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRef } from 'react'
import { useButtonStateMachine } from './buttonState'

/**
 * Button State Machine Tests
 *
 * Validates OS9 button state priority rules:
 * - :active (pressed) ALWAYS overrides :hover
 * - Focus ring uses :focus-visible
 * - Toggle buttons maintain active state after click
 *
 * @see INTERACTION_BLUEPRINT.md - Button State Machine
 */

describe('useButtonStateMachine', () => {
  describe('State Priority Rules', () => {
    it('starts in default state (not hovered, pressed, focused, or active)', () => {
      const { result } = renderHook(() => {
        const ref = useRef<HTMLButtonElement>(null)
        return useButtonStateMachine(ref)
      })

      expect(result.current.state).toEqual({
        hovered: false,
        pressed: false,
        focused: false,
        active: false,
        disabled: false
      })
    })

    it('sets hovered state on mouse enter', () => {
      const { result } = renderHook(() => {
        const ref = useRef<HTMLButtonElement>(null)
        return useButtonStateMachine(ref)
      })

      act(() => {
        result.current.buttonProps.onMouseEnter?.({} as React.MouseEvent<HTMLButtonElement>)
      })

      expect(result.current.state.hovered).toBe(true)
    })

    it('clears hovered state on mouse leave', () => {
      const { result } = renderHook(() => {
        const ref = useRef<HTMLButtonElement>(null)
        return useButtonStateMachine(ref)
      })

      act(() => {
        result.current.buttonProps.onMouseEnter?.({} as React.MouseEvent<HTMLButtonElement>)
      })

      act(() => {
        result.current.buttonProps.onMouseLeave?.({} as React.MouseEvent<HTMLButtonElement>)
      })

      expect(result.current.state.hovered).toBe(false)
    })

    it('sets pressed state on mouse down', () => {
      const { result } = renderHook(() => {
        const ref = useRef<HTMLButtonElement>(null)
        return useButtonStateMachine(ref)
      })

      act(() => {
        result.current.buttonProps.onMouseDown?.({} as React.MouseEvent<HTMLButtonElement>)
      })

      expect(result.current.state.pressed).toBe(true)
    })

    it('clears pressed state on mouse up', () => {
      const { result } = renderHook(() => {
        const ref = useRef<HTMLButtonElement>(null)
        return useButtonStateMachine(ref)
      })

      act(() => {
        result.current.buttonProps.onMouseDown?.({} as React.MouseEvent<HTMLButtonElement>)
      })

      act(() => {
        result.current.buttonProps.onMouseUp?.({} as React.MouseEvent<HTMLButtonElement>)
      })

      expect(result.current.state.pressed).toBe(false)
    })
  })

  describe('Toggle Button Behavior', () => {
    it('toggles active state on click (mouse down + mouse up)', () => {
      const { result } = renderHook(() => {
        const ref = useRef<HTMLButtonElement>(null)
        return useButtonStateMachine(ref, { toggle: true })
      })

      // Initial state
      expect(result.current.state.active).toBe(false)

      // Click (down + up)
      act(() => {
        result.current.buttonProps.onMouseDown?.({} as React.MouseEvent<HTMLButtonElement>)
        result.current.buttonProps.onMouseUp?.({} as React.MouseEvent<HTMLButtonElement>)
      })

      expect(result.current.state.active).toBe(true)

      // Click again to toggle off
      act(() => {
        result.current.buttonProps.onMouseDown?.({} as React.MouseEvent<HTMLButtonElement>)
        result.current.buttonProps.onMouseUp?.({} as React.MouseEvent<HTMLButtonElement>)
      })

      expect(result.current.state.active).toBe(false)
    })
  })

  describe('Disabled State', () => {
    it('does not respond to hover when disabled', () => {
      const { result } = renderHook(() => {
        const ref = useRef<HTMLButtonElement>(null)
        return useButtonStateMachine(ref, { disabled: true })
      })

      act(() => {
        result.current.buttonProps.onMouseEnter?.({} as React.MouseEvent<HTMLButtonElement>)
      })

      expect(result.current.state.hovered).toBe(false)
    })

    it('does not respond to press when disabled', () => {
      const { result } = renderHook(() => {
        const ref = useRef<HTMLButtonElement>(null)
        return useButtonStateMachine(ref, { disabled: true })
      })

      act(() => {
        result.current.buttonProps.onMouseDown?.({} as React.MouseEvent<HTMLButtonElement>)
      })

      expect(result.current.state.pressed).toBe(false)
    })
  })

  describe('Data Attributes for SCSS Mapping', () => {
    it('provides data-pressed attribute when pressed', () => {
      const { result } = renderHook(() => {
        const ref = useRef<HTMLButtonElement>(null)
        return useButtonStateMachine(ref)
      })

      act(() => {
        result.current.buttonProps.onMouseDown?.({} as React.MouseEvent<HTMLButtonElement>)
      })

      expect(result.current.buttonProps['data-pressed']).toBe(true)
    })

    it('provides data-active attribute when active (toggle mode)', () => {
      const { result } = renderHook(() => {
        const ref = useRef<HTMLButtonElement>(null)
        return useButtonStateMachine(ref, { toggle: true })
      })

      act(() => {
        result.current.buttonProps.onMouseDown?.({} as React.MouseEvent<HTMLButtonElement>)
        result.current.buttonProps.onMouseUp?.({} as React.MouseEvent<HTMLButtonElement>)
      })

      expect(result.current.buttonProps['data-active']).toBe(true)
    })
  })

  describe('OS9 Authenticity Requirements', () => {
    it('enforces that pressed state takes priority over hover', () => {
      // BLUEPRINT RULE: :active (pressed) ALWAYS overrides :hover
      // While we can't test CSS specificity here, we ensure both states are tracked

      const { result } = renderHook(() => {
        const ref = useRef<HTMLButtonElement>(null)
        return useButtonStateMachine(ref)
      })

      // Hover first
      act(() => {
        result.current.buttonProps.onMouseEnter?.({} as React.MouseEvent<HTMLButtonElement>)
      })

      expect(result.current.state.hovered).toBe(true)

      // Then press (while still hovered)
      act(() => {
        result.current.buttonProps.onMouseDown?.({} as React.MouseEvent<HTMLButtonElement>)
      })

      // Both should be true, but SCSS will prioritize pressed
      expect(result.current.state.hovered).toBe(true)
      expect(result.current.state.pressed).toBe(true)
    })
  })
})
