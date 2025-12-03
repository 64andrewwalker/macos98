/**
 * UI Shell Layer
 *
 * Provides desktop environment services:
 * - WindowManager: Window lifecycle, focus, z-ordering
 * - DesktopService: Icon management, selection, wallpaper
 * - ShellProvider: React context for services
 * - Hooks: useWindows, useDesktop for reactive state
 *
 * Based on design-docs/05-ui-shell-layer-spec.md
 */

// WindowManager
export { createWindowManager } from './window-manager'
export type {
  WindowManager,
  Window,
  WindowBounds,
  WindowState,
  OpenWindowOptions,
  WindowEvent,
  WindowEventType,
  WindowChangeCallback
} from './window-manager'

// Desktop
export { createDesktopService } from './desktop'
export type {
  DesktopService,
  DesktopIcon,
  IconPosition,
  IconTarget,
  IconTargetType,
  DesktopState,
  DesktopEvent,
  DesktopEventType,
  DesktopChangeCallback,
  IconDoubleClickCallback,
  ContextMenuCallback
} from './desktop'

// Context & Hooks
export {
  ShellProvider,
  useWindows,
  useDesktop,
  useWindowManagerService,
  useDesktopServiceInstance,
  type ShellProviderProps
} from './context'

export {
  useWindowManager,
  useDesktopService,
  type UseWindowManagerResult,
  type UseDesktopServiceResult
} from './hooks'

// SystemOverlay
export {
  createSystemOverlayService,
  SystemOverlay,
  type SystemOverlayService,
  type SystemOverlayProps,
  type OverlayItem,
  type OverlayPosition,
  type OverlayType,
  type ShowOverlayOptions
} from './system-overlay'

