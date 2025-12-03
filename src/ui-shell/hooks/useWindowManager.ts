/**
 * useWindowManager Hook - UI Shell Layer
 *
 * React hook for accessing WindowManager service.
 * Provides reactive state updates when windows change.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Window, WindowManager, OpenWindowOptions, WindowBounds } from '../window-manager'

export interface UseWindowManagerResult {
  /** All windows in z-order (back to front) */
  windows: Window[]
  /** Currently focused window */
  focusedWindow: Window | undefined
  /** Open a new window */
  openWindow: (options: OpenWindowOptions) => Window
  /** Close a window */
  closeWindow: (windowId: string) => void
  /** Close all windows for an app */
  closeAllWindows: (appId: string) => void
  /** Focus a window */
  focusWindow: (windowId: string) => void
  /** Minimize a window */
  minimizeWindow: (windowId: string) => void
  /** Maximize a window */
  maximizeWindow: (windowId: string) => void
  /** Collapse a window (title bar only) */
  collapseWindow: (windowId: string) => void
  /** Restore window to normal state */
  restoreWindow: (windowId: string) => void
  /** Move a window */
  moveWindow: (windowId: string, x: number, y: number) => void
  /** Resize a window */
  resizeWindow: (windowId: string, width: number, height: number) => void
  /** Set window bounds */
  setBounds: (windowId: string, bounds: Partial<WindowBounds>) => void
  /** Set window title */
  setTitle: (windowId: string, title: string) => void
  /** Get window by ID */
  getWindow: (windowId: string) => Window | undefined
  /** Get windows by app ID */
  getWindowsByApp: (appId: string) => Window[]
}

/**
 * Hook to interact with WindowManager service
 * @param windowManager - The WindowManager instance
 */
export function useWindowManager(windowManager: WindowManager): UseWindowManagerResult {
  // Reactive state
  const [windows, setWindows] = useState<Window[]>(() => windowManager.getAllWindows())
  const [focusedWindow, setFocusedWindow] = useState<Window | undefined>(
    () => windowManager.getFocusedWindow()
  )

  // Subscribe to window changes
  useEffect(() => {
    const unsubscribe = windowManager.onWindowChange(() => {
      // Update state on any window change
      setWindows(windowManager.getAllWindows())
      setFocusedWindow(windowManager.getFocusedWindow())
    })

    return unsubscribe
  }, [windowManager])

  // Memoized callbacks
  const openWindow = useCallback(
    (options: OpenWindowOptions) => windowManager.openWindow(options),
    [windowManager]
  )

  const closeWindow = useCallback(
    (windowId: string) => windowManager.closeWindow(windowId),
    [windowManager]
  )

  const closeAllWindows = useCallback(
    (appId: string) => windowManager.closeAllWindows(appId),
    [windowManager]
  )

  const focusWindowCb = useCallback(
    (windowId: string) => windowManager.focusWindow(windowId),
    [windowManager]
  )

  const minimizeWindow = useCallback(
    (windowId: string) => windowManager.minimizeWindow(windowId),
    [windowManager]
  )

  const maximizeWindow = useCallback(
    (windowId: string) => windowManager.maximizeWindow(windowId),
    [windowManager]
  )

  const collapseWindow = useCallback(
    (windowId: string) => windowManager.collapseWindow(windowId),
    [windowManager]
  )

  const restoreWindow = useCallback(
    (windowId: string) => windowManager.restoreWindow(windowId),
    [windowManager]
  )

  const moveWindow = useCallback(
    (windowId: string, x: number, y: number) => windowManager.moveWindow(windowId, x, y),
    [windowManager]
  )

  const resizeWindow = useCallback(
    (windowId: string, width: number, height: number) =>
      windowManager.resizeWindow(windowId, width, height),
    [windowManager]
  )

  const setBounds = useCallback(
    (windowId: string, bounds: Partial<WindowBounds>) =>
      windowManager.setBounds(windowId, bounds),
    [windowManager]
  )

  const setTitle = useCallback(
    (windowId: string, title: string) => windowManager.setTitle(windowId, title),
    [windowManager]
  )

  const getWindow = useCallback(
    (windowId: string) => windowManager.getWindow(windowId),
    [windowManager]
  )

  const getWindowsByApp = useCallback(
    (appId: string) => windowManager.getWindowsByApp(appId),
    [windowManager]
  )

  return useMemo(
    () => ({
      windows,
      focusedWindow,
      openWindow,
      closeWindow,
      closeAllWindows,
      focusWindow: focusWindowCb,
      minimizeWindow,
      maximizeWindow,
      collapseWindow,
      restoreWindow,
      moveWindow,
      resizeWindow,
      setBounds,
      setTitle,
      getWindow,
      getWindowsByApp
    }),
    [
      windows,
      focusedWindow,
      openWindow,
      closeWindow,
      closeAllWindows,
      focusWindowCb,
      minimizeWindow,
      maximizeWindow,
      collapseWindow,
      restoreWindow,
      moveWindow,
      resizeWindow,
      setBounds,
      setTitle,
      getWindow,
      getWindowsByApp
    ]
  )
}

