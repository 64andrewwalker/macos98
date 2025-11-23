// @vitest-environment jsdom
import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MenuModeProvider, useMenuMode } from './menuMode'

/**
 * Menu Mode Engine Tests
 *
 * Validates OS9 menu mode behavior:
 * - Click to enter menu mode
 * - Hover to switch menus (only while in menu mode)
 * - Click outside or Esc to exit menu mode
 * - Keyboard navigation support
 *
 * @see INTERACTION_BLUEPRINT.md - Menu Interaction Model
 */

describe('MenuModeProvider', () => {
  describe('useMenuMode', () => {
    it('throws error when used outside provider', () => {
      expect(() => {
        renderHook(() => useMenuMode())
      }).toThrow('useMenuMode must be used within MenuModeProvider')
    })

    it('provides menu mode API', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MenuModeProvider>{children}</MenuModeProvider>
      )

      const { result } = renderHook(() => useMenuMode(), { wrapper })

      expect(result.current).toHaveProperty('isMenuMode')
      expect(result.current).toHaveProperty('openMenuId')
      expect(result.current).toHaveProperty('enterMenuMode')
      expect(result.current).toHaveProperty('hoverMenu')
      expect(result.current).toHaveProperty('exitMenuMode')
      expect(result.current).toHaveProperty('getMenuTitleProps')
      expect(result.current).toHaveProperty('getMenuListProps')
    })
  })

  describe('Menu Mode State', () => {
    it('starts with menu mode disabled', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MenuModeProvider>{children}</MenuModeProvider>
      )

      const { result } = renderHook(() => useMenuMode(), { wrapper })

      expect(result.current.isMenuMode).toBe(false)
      expect(result.current.openMenuId).toBeNull()
    })

    it('enters menu mode when enterMenuMode is called', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MenuModeProvider>{children}</MenuModeProvider>
      )

      const { result } = renderHook(() => useMenuMode(), { wrapper })

      act(() => {
        result.current.enterMenuMode('file')
      })

      expect(result.current.isMenuMode).toBe(true)
      expect(result.current.openMenuId).toBe('file')
    })

    it('exits menu mode when exitMenuMode is called', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MenuModeProvider>{children}</MenuModeProvider>
      )

      const { result } = renderHook(() => useMenuMode(), { wrapper })

      act(() => {
        result.current.enterMenuMode('file')
      })

      act(() => {
        result.current.exitMenuMode()
      })

      expect(result.current.isMenuMode).toBe(false)
      expect(result.current.openMenuId).toBeNull()
    })
  })

  describe('Menu Title Props', () => {
    it('getMenuTitleProps provides onClick handler', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MenuModeProvider>{children}</MenuModeProvider>
      )

      const { result } = renderHook(() => useMenuMode(), { wrapper })

      const props = result.current.getMenuTitleProps('file')

      expect(props).toHaveProperty('onClick')
      expect(props).toHaveProperty('onMouseEnter')
    })

    it('clicking menu title enters menu mode', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MenuModeProvider>{children}</MenuModeProvider>
      )

      const { result } = renderHook(() => useMenuMode(), { wrapper })

      const fileProps = result.current.getMenuTitleProps('file')

      act(() => {
        fileProps.onClick?.({} as React.MouseEvent<HTMLDivElement>)
      })

      expect(result.current.isMenuMode).toBe(true)
      expect(result.current.openMenuId).toBe('file')
    })
  })

  describe('OS9 Menu Mode Behavior', () => {
    it('hover does nothing when NOT in menu mode', () => {
      // BLUEPRINT RULE: Hover only switches menus when already in menu mode

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MenuModeProvider>{children}</MenuModeProvider>
      )

      const { result } = renderHook(() => useMenuMode(), { wrapper })

      // Hover over "edit" menu while not in menu mode
      act(() => {
        result.current.hoverMenu('edit')
      })

      // Should NOT enter menu mode or open menu
      expect(result.current.isMenuMode).toBe(false)
      expect(result.current.openMenuId).toBeNull()
    })

    it('hover switches menus when IN menu mode', () => {
      // BLUEPRINT RULE: In menu mode, hovering another menu title switches to it

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MenuModeProvider>{children}</MenuModeProvider>
      )

      const { result } = renderHook(() => useMenuMode(), { wrapper })

      // Enter menu mode with "file" menu
      act(() => {
        result.current.enterMenuMode('file')
      })

      expect(result.current.openMenuId).toBe('file')

      // Hover over "edit" menu
      act(() => {
        result.current.hoverMenu('edit')
      })

      // Should switch to "edit" menu while staying in menu mode
      expect(result.current.isMenuMode).toBe(true)
      expect(result.current.openMenuId).toBe('edit')
    })

    it('clicking active menu title exits menu mode', () => {
      // BLUEPRINT RULE: Clicking the already-open menu title closes it

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MenuModeProvider>{children}</MenuModeProvider>
      )

      const { result } = renderHook(() => useMenuMode(), { wrapper })

      // Enter menu mode
      act(() => {
        result.current.enterMenuMode('file')
      })

      const fileProps = result.current.getMenuTitleProps('file')

      // Click file menu again
      act(() => {
        fileProps.onClick?.({} as React.MouseEvent<HTMLDivElement>)
      })

      // Should exit menu mode
      expect(result.current.isMenuMode).toBe(false)
      expect(result.current.openMenuId).toBeNull()
    })

    it('provides data-menu-open attribute for active menu', () => {
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MenuModeProvider>{children}</MenuModeProvider>
      )

      const { result } = renderHook(() => useMenuMode(), { wrapper })

      act(() => {
        result.current.enterMenuMode('file')
      })

      const fileProps = result.current.getMenuTitleProps('file')
      const editProps = result.current.getMenuTitleProps('edit')

      expect(fileProps['data-menu-open']).toBe(true)
      expect(editProps['data-menu-open']).toBeUndefined()
    })
  })
})
