/**
 * WindowManager Implementation - UI Shell Layer
 *
 * Manages window lifecycle, focus, and z-ordering.
 * Based on design-docs/05-ui-shell-layer-spec.md
 */

import type {
  WindowManager,
  Window,
  OpenWindowOptions,
  WindowBounds,
  WindowState,
  WindowEvent,
  WindowChangeCallback
} from './types'
import type { Unsubscribe } from '../../kernel/event-bus/types'

// Default window dimensions
const DEFAULT_WIDTH = 400
const DEFAULT_HEIGHT = 300
const WINDOW_OFFSET = 20 // Cascade offset for new windows

// Generate unique window IDs
let windowIdCounter = 0
function generateWindowId(): string {
  windowIdCounter += 1
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `window_${crypto.randomUUID()}`
  }
  return `window_${windowIdCounter}_${Date.now()}`
}

/**
 * Create a new WindowManager instance
 */
export function createWindowManager(): WindowManager {
  // Windows in z-order (last = front)
  const windows: Window[] = []

  // Currently focused window ID
  let focusedWindowId: string | null = null

  // Event listeners
  const listeners = new Set<WindowChangeCallback>()

  function notifyListeners(event: WindowEvent): void {
    for (const callback of listeners) {
      callback(event)
    }
  }

  function updateFocusedState(): void {
    for (const w of windows) {
      w.focused = w.id === focusedWindowId
    }
  }

  function openWindow(options: OpenWindowOptions): Window {
    const id = generateWindowId()

    // Calculate initial position (cascade from last window)
    const lastWindow = windows[windows.length - 1]
    const baseX = lastWindow ? lastWindow.bounds.x + WINDOW_OFFSET : 100
    const baseY = lastWindow ? lastWindow.bounds.y + WINDOW_OFFSET : 100

    const bounds: WindowBounds = {
      x: options.x ?? baseX,
      y: options.y ?? baseY,
      width: options.width ?? DEFAULT_WIDTH,
      height: options.height ?? DEFAULT_HEIGHT
    }

    const window: Window = {
      id,
      appId: options.appId ?? 'system',
      title: options.title,
      bounds,
      state: 'normal',
      focused: true,
      content: options.content,
      minSize: options.minSize,
      resizable: options.resizable ?? true
    }

    windows.push(window)
    focusedWindowId = id
    updateFocusedState()

    notifyListeners({ type: 'opened', windowId: id, window })
    notifyListeners({ type: 'focused', windowId: id, window })

    return window
  }

  function closeWindow(windowId: string): void {
    const index = windows.findIndex(w => w.id === windowId)
    if (index === -1) return

    const window = windows[index]
    windows.splice(index, 1)

    notifyListeners({ type: 'closed', windowId, window })

    // If closed window was focused, focus the next top window
    if (focusedWindowId === windowId) {
      const nextWindow = windows[windows.length - 1]
      if (nextWindow) {
        focusedWindowId = nextWindow.id
        updateFocusedState()
        notifyListeners({ type: 'focused', windowId: nextWindow.id, window: nextWindow })
      } else {
        focusedWindowId = null
        updateFocusedState()
      }
    }
  }

  function closeAllWindows(appId: string): void {
    const appWindows = windows.filter(w => w.appId === appId)
    for (const window of appWindows) {
      closeWindow(window.id)
    }
  }

  function focusWindow(windowId: string): void {
    const index = windows.findIndex(w => w.id === windowId)
    if (index === -1) return

    const window = windows[index]

    // Move to end of array (top of z-order)
    windows.splice(index, 1)
    windows.push(window)

    // Notify blur on previous focused window
    if (focusedWindowId && focusedWindowId !== windowId) {
      const prevWindow = windows.find(w => w.id === focusedWindowId)
      if (prevWindow) {
        notifyListeners({ type: 'blurred', windowId: focusedWindowId, window: prevWindow })
      }
    }

    focusedWindowId = windowId
    updateFocusedState()
    notifyListeners({ type: 'focused', windowId, window })
  }

  function setWindowState(windowId: string, state: WindowState): void {
    const window = windows.find(w => w.id === windowId)
    if (!window) return

    const prevState = window.state
    if (prevState === state) return

    window.state = state
    notifyListeners({ type: 'stateChanged', windowId, window })
  }

  function minimizeWindow(windowId: string): void {
    setWindowState(windowId, 'minimized')
  }

  function maximizeWindow(windowId: string): void {
    setWindowState(windowId, 'maximized')
  }

  function collapseWindow(windowId: string): void {
    setWindowState(windowId, 'collapsed')
  }

  function restoreWindow(windowId: string): void {
    setWindowState(windowId, 'normal')
  }

  function moveWindow(windowId: string, x: number, y: number): void {
    const window = windows.find(w => w.id === windowId)
    if (!window) return

    window.bounds.x = x
    window.bounds.y = y

    notifyListeners({ type: 'moved', windowId, window })
  }

  function resizeWindow(windowId: string, width: number, height: number): void {
    const window = windows.find(w => w.id === windowId)
    if (!window) return
    if (!window.resizable) return

    // Apply minimum size constraints
    const minWidth = window.minSize?.width ?? 100
    const minHeight = window.minSize?.height ?? 50

    window.bounds.width = Math.max(width, minWidth)
    window.bounds.height = Math.max(height, minHeight)

    notifyListeners({ type: 'resized', windowId, window })
  }

  function setBounds(windowId: string, bounds: Partial<WindowBounds>): void {
    const window = windows.find(w => w.id === windowId)
    if (!window) return

    if (bounds.x !== undefined) window.bounds.x = bounds.x
    if (bounds.y !== undefined) window.bounds.y = bounds.y
    if (bounds.width !== undefined && window.resizable) {
      window.bounds.width = Math.max(bounds.width, window.minSize?.width ?? 100)
    }
    if (bounds.height !== undefined && window.resizable) {
      window.bounds.height = Math.max(bounds.height, window.minSize?.height ?? 50)
    }

    notifyListeners({ type: 'moved', windowId, window })
  }

  function setTitle(windowId: string, title: string): void {
    const window = windows.find(w => w.id === windowId)
    if (!window) return

    window.title = title
    // No specific event for title change, could add if needed
  }

  function getWindow(windowId: string): Window | undefined {
    return windows.find(w => w.id === windowId)
  }

  function getWindowsByApp(appId: string): Window[] {
    return windows.filter(w => w.appId === appId)
  }

  function getAllWindows(): Window[] {
    // Return copy in z-order (back to front)
    return [...windows]
  }

  function getFocusedWindow(): Window | undefined {
    if (!focusedWindowId) return undefined
    return windows.find(w => w.id === focusedWindowId)
  }

  function onWindowChange(callback: WindowChangeCallback): Unsubscribe {
    listeners.add(callback)
    return () => {
      listeners.delete(callback)
    }
  }

  return {
    openWindow,
    closeWindow,
    closeAllWindows,
    focusWindow,
    minimizeWindow,
    maximizeWindow,
    collapseWindow,
    restoreWindow,
    moveWindow,
    resizeWindow,
    setBounds,
    setTitle,
    getWindow,
    getWindowsByApp,
    getAllWindows,
    getFocusedWindow,
    onWindowChange
  }
}
