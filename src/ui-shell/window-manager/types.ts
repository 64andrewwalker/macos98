/**
 * WindowManager Types - UI Shell Layer
 *
 * Manages window lifecycle, focus, and z-ordering.
 * Based on design-docs/05-ui-shell-layer-spec.md
 */

import type React from 'react'
import type { Unsubscribe } from '../../kernel/event-bus/types'

export interface WindowBounds {
  x: number
  y: number
  width: number
  height: number
}

export type WindowState = 'normal' | 'minimized' | 'maximized' | 'collapsed'

export interface Window {
  /** Unique window identifier */
  id: string
  /** App that owns this window */
  appId: string
  /** Window title displayed in title bar */
  title: string
  /** Window position and size */
  bounds: WindowBounds
  /** Current window state */
  state: WindowState
  /** Whether this window is focused */
  focused: boolean
  /** React content to render */
  content?: React.ReactNode
  /** Minimum window size */
  minSize?: { width: number; height: number }
  /** Whether window is resizable */
  resizable?: boolean
}

export interface OpenWindowOptions {
  /** App ID that owns this window (optional for standalone windows) */
  appId?: string
  /** Window title */
  title: string
  /** React content to render in the window */
  content?: React.ReactNode
  /** Initial width */
  width?: number
  /** Initial height */
  height?: number
  /** Initial x position */
  x?: number
  /** Initial y position */
  y?: number
  /** Minimum size constraints */
  minSize?: { width: number; height: number }
  /** Whether resizable (default true) */
  resizable?: boolean
}

export type WindowEventType =
  | 'opened'
  | 'closed'
  | 'focused'
  | 'blurred'
  | 'moved'
  | 'resized'
  | 'stateChanged'

export interface WindowEvent {
  type: WindowEventType
  windowId: string
  window?: Window
}

export type WindowChangeCallback = (event: WindowEvent) => void

export interface WindowManager {
  // Window lifecycle
  /**
   * Open a new window
   * @returns The created window
   */
  openWindow(options: OpenWindowOptions): Window

  /**
   * Close a window by ID
   */
  closeWindow(windowId: string): void

  /**
   * Close all windows belonging to an app
   */
  closeAllWindows(appId: string): void

  // Window operations
  /**
   * Focus a window, bringing it to front
   */
  focusWindow(windowId: string): void

  /**
   * Minimize a window
   */
  minimizeWindow(windowId: string): void

  /**
   * Maximize a window
   */
  maximizeWindow(windowId: string): void

  /**
   * Collapse a window (title bar only)
   */
  collapseWindow(windowId: string): void

  /**
   * Restore window to normal state
   */
  restoreWindow(windowId: string): void

  // Position and size
  /**
   * Move a window to a new position
   */
  moveWindow(windowId: string, x: number, y: number): void

  /**
   * Resize a window
   */
  resizeWindow(windowId: string, width: number, height: number): void

  /**
   * Set window bounds
   */
  setBounds(windowId: string, bounds: Partial<WindowBounds>): void

  /**
   * Update window title
   */
  setTitle(windowId: string, title: string): void

  // Queries
  /**
   * Get a window by ID
   */
  getWindow(windowId: string): Window | undefined

  /**
   * Get all windows for an app
   */
  getWindowsByApp(appId: string): Window[]

  /**
   * Get all windows in z-order (front to back)
   */
  getAllWindows(): Window[]

  /**
   * Get the currently focused window
   */
  getFocusedWindow(): Window | undefined

  // Events
  /**
   * Subscribe to window events
   */
  onWindowChange(callback: WindowChangeCallback): Unsubscribe
}

