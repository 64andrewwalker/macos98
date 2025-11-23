/**
 * Window Focus Manager
 *
 * Manages global window focus, z-index ordering, and active/inactive states.
 * Ensures exactly one window is active at a time and provides dimming for inactive windows.
 *
 * @see INTERACTION_BLUEPRINT.md - Window Focus/Inactive Behavior
 */

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

interface WindowManagerContextValue {
  activeWindowId: string | null
  windowOrder: string[]
  registerWindow: (windowId: string) => void
  unregisterWindow: (windowId: string) => void
  focusWindow: (windowId: string) => void
}

const WindowManagerContext = createContext<WindowManagerContextValue | null>(null)

export interface WindowManagerProviderProps {
  children: ReactNode
}

/**
 * Provider for global window management
 *
 * Tracks active window and z-index order across all windows in the desktop.
 * Should wrap the desktop shell (e.g., in App.tsx or Desktop.tsx).
 */
export function WindowManagerProvider({ children }: WindowManagerProviderProps) {
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null)
  const [windowOrder, setWindowOrder] = useState<string[]>([])

  const registerWindow = useCallback((windowId: string) => {
    setWindowOrder(prev => {
      if (prev.includes(windowId)) return prev
      return [...prev, windowId]
    })
  }, [])

  const unregisterWindow = useCallback((windowId: string) => {
    setWindowOrder(prev => prev.filter(id => id !== windowId))
    setActiveWindowId(prev => prev === windowId ? null : prev)
  }, [])

  const focusWindow = useCallback((windowId: string) => {
    setActiveWindowId(windowId)
    setWindowOrder(prev => {
      // Move window to end (highest z-index)
      const filtered = prev.filter(id => id !== windowId)
      return [...filtered, windowId]
    })
  }, [])

  const value: WindowManagerContextValue = {
    activeWindowId,
    windowOrder,
    registerWindow,
    unregisterWindow,
    focusWindow
  }

  return (
    <WindowManagerContext.Provider value={value}>
      {children}
    </WindowManagerContext.Provider>
  )
}

export interface WindowRegistrationResult {
  isActive: boolean
  zIndex: number
  windowProps: React.HTMLAttributes<HTMLDivElement> & {
    'data-window-active'?: boolean
  }
}

/**
 * Hook for window registration and focus management
 *
 * Registers a window with the global manager and provides:
 * - isActive flag for dimming inactive windows
 * - zIndex for proper layering
 * - windowProps with focus handlers and data attributes
 */
export function useWindowRegistration(windowId: string): WindowRegistrationResult {
  const context = useContext(WindowManagerContext)

  if (!context) {
    throw new Error('useWindowRegistration must be used within WindowManagerProvider')
  }

  const { activeWindowId, windowOrder, registerWindow, unregisterWindow, focusWindow } = context

  // Register window on mount, unregister on unmount
  useEffect(() => {
    registerWindow(windowId)
    return () => unregisterWindow(windowId)
  }, [windowId, registerWindow, unregisterWindow])

  const isActive = activeWindowId === windowId
  const zIndex = windowOrder.indexOf(windowId) + 1

  const windowProps: WindowRegistrationResult['windowProps'] = {
    onMouseDown: () => {
      focusWindow(windowId)
    },
    'data-window-active': isActive || undefined,
    style: {
      zIndex
    }
  }

  return {
    isActive,
    zIndex,
    windowProps
  }
}
