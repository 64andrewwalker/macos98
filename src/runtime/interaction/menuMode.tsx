/**
 * Menu Mode Engine
 *
 * Implements OS9 menu mode:
 * - Click menu title to ENTER menu mode
 * - Hover other titles to SWITCH menus (only while in menu mode)
 * - Click outside or Esc to EXIT menu mode
 * - Keyboard navigation (arrows, Enter, Esc)
 *
 * @see INTERACTION_BLUEPRINT.md - Menu Interaction Model
 */

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

interface MenuModeContextValue {
  isMenuMode: boolean
  openMenuId: string | null
  enterMenuMode: (menuId: string) => void
  hoverMenu: (menuId: string) => void
  exitMenuMode: () => void
  selectMenuItem: () => void
}

const MenuModeContext = createContext<MenuModeContextValue | null>(null)

export interface MenuModeProviderProps {
  children: ReactNode
}

/**
 * Provider for OS9 menu mode state
 *
 * Tracks whether the system is in "menu mode" and which menu is open.
 * Should wrap the application root or desktop shell.
 */
export function MenuModeProvider({ children }: MenuModeProviderProps) {
  const [isMenuMode, setIsMenuMode] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const enterMenuMode = useCallback((menuId: string) => {
    setIsMenuMode(true)
    setOpenMenuId(menuId)
  }, [])

  const hoverMenu = useCallback((menuId: string) => {
    if (isMenuMode) {
      // Only switch menus if already in menu mode
      setOpenMenuId(menuId)
    }
  }, [isMenuMode])

  const exitMenuMode = useCallback(() => {
    setIsMenuMode(false)
    setOpenMenuId(null)
  }, [])

  const selectMenuItem = useCallback(() => {
    // Exit menu mode after selecting an item
    exitMenuMode()
  }, [exitMenuMode])

  // TODO: Implement click-outside detection
  // TODO: Implement keyboard navigation (arrows, Enter, Esc)

  const value: MenuModeContextValue = {
    isMenuMode,
    openMenuId,
    enterMenuMode,
    hoverMenu,
    exitMenuMode,
    selectMenuItem
  }

  return (
    <MenuModeContext.Provider value={value}>
      {children}
    </MenuModeContext.Provider>
  )
}

export interface UseMenuModeResult {
  isMenuMode: boolean
  openMenuId: string | null
  enterMenuMode: (menuId: string) => void
  hoverMenu: (menuId: string) => void
  exitMenuMode: () => void
  getMenuTitleProps: (menuId: string) => React.HTMLAttributes<HTMLDivElement>
  getMenuListProps: (menuId: string) => React.HTMLAttributes<HTMLDivElement>
}

/**
 * Hook for menu mode interaction
 *
 * Provides menu state and prop getters for menu titles and dropdown lists.
 */
export function useMenuMode(): UseMenuModeResult {
  const context = useContext(MenuModeContext)

  if (!context) {
    throw new Error('useMenuMode must be used within MenuModeProvider')
  }

  const { isMenuMode, openMenuId, enterMenuMode, hoverMenu, exitMenuMode, selectMenuItem } = context

  const getMenuTitleProps = useCallback((menuId: string): React.HTMLAttributes<HTMLDivElement> => {
    return {
      onClick: () => {
        if (!isMenuMode) {
          enterMenuMode(menuId)
        } else if (openMenuId === menuId) {
          // Clicking active menu title exits menu mode
          exitMenuMode()
        } else {
          // Switch to this menu
          hoverMenu(menuId)
        }
      },
      onMouseEnter: () => {
        hoverMenu(menuId)
      },
      'data-menu-open': openMenuId === menuId || undefined
    }
  }, [isMenuMode, openMenuId, enterMenuMode, hoverMenu, exitMenuMode])

  const getMenuListProps = useCallback((menuId: string): React.HTMLAttributes<HTMLDivElement> => {
    return {
      onClick: (e) => {
        // TODO: Prevent closing if clicking separator or disabled item
        e.stopPropagation()
        selectMenuItem()
      }
    }
  }, [selectMenuItem])

  return {
    isMenuMode,
    openMenuId,
    enterMenuMode,
    hoverMenu,
    exitMenuMode,
    getMenuTitleProps,
    getMenuListProps
  }
}
