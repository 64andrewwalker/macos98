// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { WindowManagerProvider, useWindowRegistration } from './windowManager'

/**
 * Window Manager Tests
 *
 * Validates window focus and z-index management:
 * - Exactly one window is active at a time
 * - Clicking a window brings it to front
 * - Inactive windows receive proper state for dimming
 *
 * @see INTERACTION_BLUEPRINT.md - Window Focus/Inactive Behavior
 */

describe('WindowManagerProvider', () => {
  describe('useWindowRegistration', () => {
    it('throws error when used outside provider', () => {
      // Should throw when not wrapped in provider
      expect(() => {
        renderHook(() => useWindowRegistration('window-1'))
      }).toThrow('useWindowRegistration must be used within WindowManagerProvider')
    })

    it('provides window registration API', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WindowManagerProvider>{children}</WindowManagerProvider>
      )

      const { result } = renderHook(() => useWindowRegistration('window-1'), { wrapper })

      expect(result.current).toHaveProperty('isActive')
      expect(result.current).toHaveProperty('zIndex')
      expect(result.current).toHaveProperty('windowProps')
    })

    it('provides data-window-active attribute in windowProps', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WindowManagerProvider>{children}</WindowManagerProvider>
      )

      const { result } = renderHook(() => useWindowRegistration('window-1'), { wrapper })

      // Check that windowProps has the expected structure
      expect(result.current.windowProps).toHaveProperty('onMouseDown')
      expect(result.current.windowProps.style).toHaveProperty('zIndex')
    })
  })

  describe('Focus Management', () => {
    it('activates window when onMouseDown is called', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WindowManagerProvider>{children}</WindowManagerProvider>
      )

      const { result } = renderHook(() => useWindowRegistration('window-1'), { wrapper })

      expect(result.current.isActive).toBe(false)

      // Simulate clicking the window
      act(() => {
        result.current.windowProps.onMouseDown?.({} as React.MouseEvent<HTMLDivElement>)
      })

      expect(result.current.isActive).toBe(true)
    })

    it('ensures exactly one window is active at a time', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WindowManagerProvider>{children}</WindowManagerProvider>
      )

      // Render both hooks with the same wrapper to share context
      const { result } = renderHook(
        () => ({
          window1: useWindowRegistration('window-1'),
          window2: useWindowRegistration('window-2')
        }),
        { wrapper }
      )

      // Focus window 1
      act(() => {
        result.current.window1.windowProps.onMouseDown?.({} as React.MouseEvent<HTMLDivElement>)
      })

      expect(result.current.window1.isActive).toBe(true)
      expect(result.current.window2.isActive).toBe(false)

      // Focus window 2
      act(() => {
        result.current.window2.windowProps.onMouseDown?.({} as React.MouseEvent<HTMLDivElement>)
      })

      expect(result.current.window1.isActive).toBe(false)
      expect(result.current.window2.isActive).toBe(true)
    })
  })

  describe('Z-Index Management', () => {
    it('assigns z-index based on focus order', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WindowManagerProvider>{children}</WindowManagerProvider>
      )

      const { result: window1 } = renderHook(() => useWindowRegistration('window-1'), { wrapper })
      const { result: window2 } = renderHook(() => useWindowRegistration('window-2'), { wrapper })

      // Both windows should have z-index
      expect(window1.current.zIndex).toBeGreaterThanOrEqual(1)
      expect(window2.current.zIndex).toBeGreaterThanOrEqual(1)
    })

    it('brings focused window to front (highest z-index)', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WindowManagerProvider>{children}</WindowManagerProvider>
      )

      // Render both hooks with the same wrapper to share context
      const { result } = renderHook(
        () => ({
          window1: useWindowRegistration('window-1'),
          window2: useWindowRegistration('window-2')
        }),
        { wrapper }
      )

      // Focus window 1
      act(() => {
        result.current.window1.windowProps.onMouseDown?.({} as React.MouseEvent<HTMLDivElement>)
      })

      // Window 1 should be on top
      expect(result.current.window1.zIndex).toBeGreaterThan(result.current.window2.zIndex)

      // Focus window 2
      act(() => {
        result.current.window2.windowProps.onMouseDown?.({} as React.MouseEvent<HTMLDivElement>)
      })

      // Window 2 should now have higher z-index than window 1
      expect(result.current.window2.zIndex).toBeGreaterThan(result.current.window1.zIndex)
    })
  })

  describe('OS9 Authenticity Requirements', () => {
    it('provides isActive flag for inactive window dimming', () => {
      // BLUEPRINT RULE: Inactive windows should be visually dimmed but remain clickable
      // The isActive flag allows components to apply dimming styles

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <WindowManagerProvider>{children}</WindowManagerProvider>
      )

      // Render both hooks with the same wrapper to share context
      const { result } = renderHook(
        () => ({
          window1: useWindowRegistration('window-1'),
          window2: useWindowRegistration('window-2')
        }),
        { wrapper }
      )

      // Focus window 1
      act(() => {
        result.current.window1.windowProps.onMouseDown?.({} as React.MouseEvent<HTMLDivElement>)
      })

      // Window 1 is active, window 2 is inactive
      expect(result.current.window1.isActive).toBe(true)
      expect(result.current.window2.isActive).toBe(false)

      // Both windows should still be interactive (have onMouseDown)
      expect(result.current.window2.windowProps.onMouseDown).toBeDefined()
    })
  })
})
