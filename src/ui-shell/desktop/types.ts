/**
 * Desktop Service Types - UI Shell Layer
 *
 * Manages desktop icons, selection, and background.
 * Based on design-docs/05-ui-shell-layer-spec.md
 */

import type { Unsubscribe } from '../../kernel/event-bus/types'

export interface IconPosition {
  x: number
  y: number
}

export type IconTargetType = 'app' | 'file' | 'folder' | 'system'

export interface IconTarget {
  type: IconTargetType
  /** App ID for app icons */
  appId?: string
  /** VFS path for file/folder icons */
  path?: string
}

export interface DesktopIcon {
  /** Unique icon identifier */
  id: string
  /** Display name */
  name: string
  /** Icon image URL or asset path */
  icon: string
  /** Position on desktop */
  position: IconPosition
  /** What this icon represents */
  target: IconTarget
}

export interface DesktopState {
  /** Current wallpaper URL */
  wallpaper: string
  /** Wallpaper display mode */
  wallpaperMode: 'tile' | 'center' | 'fill' | 'fit'
  /** All desktop icons */
  icons: DesktopIcon[]
  /** Currently selected icon IDs */
  selectedIconIds: string[]
}

export type DesktopEventType =
  | 'iconAdded'
  | 'iconRemoved'
  | 'iconMoved'
  | 'selectionChanged'
  | 'wallpaperChanged'

export interface DesktopEvent {
  type: DesktopEventType
  iconId?: string
  icon?: DesktopIcon
}

export type DesktopChangeCallback = (event: DesktopEvent) => void

export type IconDoubleClickCallback = (icon: DesktopIcon) => void

export type ContextMenuCallback = (event: {
  x: number
  y: number
  iconId?: string
}) => void

export interface DesktopService {
  // Wallpaper
  /**
   * Set the desktop wallpaper
   */
  setWallpaper(url: string, mode?: 'tile' | 'center' | 'fill' | 'fit'): void

  /**
   * Get current wallpaper URL
   */
  getWallpaper(): string

  /**
   * Get wallpaper display mode
   */
  getWallpaperMode(): 'tile' | 'center' | 'fill' | 'fit'

  // Icon management
  /**
   * Add an icon to the desktop
   */
  addIcon(icon: Omit<DesktopIcon, 'id'>): DesktopIcon

  /**
   * Remove an icon from the desktop
   */
  removeIcon(iconId: string): void

  /**
   * Move an icon to a new position
   */
  moveIcon(iconId: string, position: IconPosition): void

  /**
   * Get an icon by ID
   */
  getIcon(iconId: string): DesktopIcon | undefined

  /**
   * Get all icons
   */
  getAllIcons(): DesktopIcon[]

  /**
   * Arrange icons in a grid
   */
  arrangeIcons(): void

  // Selection
  /**
   * Select an icon (optionally multi-select)
   */
  selectIcon(iconId: string, multi?: boolean): void

  /**
   * Clear all selections
   */
  clearSelection(): void

  /**
   * Get selected icons
   */
  getSelectedIcons(): DesktopIcon[]

  /**
   * Get selected icon IDs
   */
  getSelectedIconIds(): string[]

  // Events
  /**
   * Subscribe to desktop changes
   */
  onChange(callback: DesktopChangeCallback): Unsubscribe

  /**
   * Subscribe to icon double-clicks
   */
  onIconDoubleClick(callback: IconDoubleClickCallback): Unsubscribe

  /**
   * Subscribe to context menu events
   */
  onContextMenu(callback: ContextMenuCallback): Unsubscribe

  /**
   * Trigger a double-click on an icon (for external callers)
   */
  triggerIconDoubleClick(iconId: string): void

  /**
   * Trigger a context menu event
   */
  triggerContextMenu(x: number, y: number, iconId?: string): void
}

