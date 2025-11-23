/**
 * Button State Machine
 *
 * Provides shared hover/pressed/focus/toggle/disabled state for retro buttons.
 * Enforces OS9 state priority rules:
 * - :active (pressed) ALWAYS overrides :hover
 * - Focus ring uses :focus-visible
 * - Toggle buttons maintain "active" state after click
 *
 * @see INTERACTION_BLUEPRINT.md - Button State Machine
 */

import { useCallback, useEffect, useState, type RefObject } from 'react'

export interface ButtonStateMachineOptions {
  toggle?: boolean
  disabled?: boolean
  role?: 'default' | 'menuitem' | 'toolbar'
}

export interface ButtonState {
  hovered: boolean
  pressed: boolean
  focused: boolean
  active: boolean
  disabled: boolean
}

export interface ButtonStateMachineResult<T extends HTMLElement> {
  state: ButtonState
  buttonProps: React.HTMLAttributes<T> & {
    'data-active'?: boolean
    'data-pressed'?: boolean
    'data-focus-visible'?: boolean
  }
}

/**
 * Hook for OS9-style button state management
 *
 * Tracks interaction state and enforces priority rules.
 * Returns props with data attributes for SCSS mapping.
 */
export function useButtonStateMachine<T extends HTMLElement>(
  ref: RefObject<T>,
  options: ButtonStateMachineOptions = {}
): ButtonStateMachineResult<T> {
  const { toggle = false, disabled = false, role = 'default' } = options

  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)
  const [focused, setFocused] = useState(false)
  const [active, setActive] = useState(false)

  // TODO: Implement focus-visible detection
  // Use :focus-visible polyfill or native support

  const handleMouseEnter = useCallback(() => {
    if (!disabled) {
      setHovered(true)
    }
  }, [disabled])

  const handleMouseLeave = useCallback(() => {
    setHovered(false)
    setPressed(false)
  }, [])

  const handleMouseDown = useCallback(() => {
    if (!disabled) {
      setPressed(true)
    }
  }, [disabled])

  const handleMouseUp = useCallback(() => {
    setPressed(false)
    if (toggle) {
      // Toggle active state on click
      setActive(prev => !prev)
    }
  }, [toggle])

  const handleFocus = useCallback(() => {
    setFocused(true)
  }, [])

  const handleBlur = useCallback(() => {
    setFocused(false)
  }, [])

  const state: ButtonState = {
    hovered,
    pressed,
    focused,
    active,
    disabled
  }

  const buttonProps: ButtonStateMachineResult<T>['buttonProps'] = {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onFocus: handleFocus,
    onBlur: handleBlur,
    'data-active': active || undefined,
    'data-pressed': pressed || undefined,
    'data-focus-visible': focused || undefined
  }

  return {
    state,
    buttonProps
  }
}
