/**
 * Desktop Service Implementation - UI Shell Layer
 *
 * Manages desktop icons, selection, and background.
 * Based on design-docs/05-ui-shell-layer-spec.md
 */

import type {
  DesktopService,
  DesktopServiceOptions,
  DesktopIcon,
  IconPosition,
  DesktopEvent,
  DesktopChangeCallback,
  IconDoubleClickCallback,
  ContextMenuCallback
} from './types'
import type { Unsubscribe } from '../../kernel/event-bus/types'
import { saveDesktopSettings, loadDesktopSettings } from './desktop-persistence'

// Icon grid constants
const GRID_MARGIN_X = 20
const GRID_MARGIN_Y = 20
const GRID_CELL_WIDTH = 100
const GRID_CELL_HEIGHT = 90

// Generate unique icon IDs
let iconIdCounter = 0
function generateIconId(): string {
  iconIdCounter += 1
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `icon_${crypto.randomUUID()}`
  }
  return `icon_${iconIdCounter}_${Date.now()}`
}

/**
 * Create a new DesktopService instance
 */
export function createDesktopService(options: DesktopServiceOptions = {}): DesktopService {
  const { autoSave = false, autoRestore = false } = options

  // State
  let wallpaper = ''
  let wallpaperMode: 'tile' | 'center' | 'fill' | 'fit' = 'tile'
  const icons: DesktopIcon[] = []
  const selectedIconIds = new Set<string>()

  // Event listeners
  const changeListeners = new Set<DesktopChangeCallback>()
  const doubleClickListeners = new Set<IconDoubleClickCallback>()
  const contextMenuListeners = new Set<ContextMenuCallback>()

  function notifyChange(event: DesktopEvent): void {
    for (const callback of changeListeners) {
      callback(event)
    }
  }

  // Auto-save helper
  function doAutoSave(): void {
    if (autoSave) {
      saveState()
    }
  }

  // Wallpaper
  function setWallpaper(url: string, mode?: 'tile' | 'center' | 'fill' | 'fit'): void {
    wallpaper = url
    if (mode) {
      wallpaperMode = mode
    }
    notifyChange({ type: 'wallpaperChanged' })
    doAutoSave()
  }

  function getWallpaper(): string {
    return wallpaper
  }

  function getWallpaperMode(): 'tile' | 'center' | 'fill' | 'fit' {
    return wallpaperMode
  }

  // Icon management
  function addIcon(iconData: Omit<DesktopIcon, 'id'> & { id?: string }): DesktopIcon {
    const icon: DesktopIcon = {
      id: iconData.id ?? generateIconId(),
      name: iconData.name,
      icon: iconData.icon,
      position: iconData.position,
      target: iconData.target
    }
    icons.push(icon)
    notifyChange({ type: 'iconAdded', iconId: icon.id, icon })
    return icon
  }

  function removeIcon(iconId: string): void {
    const index = icons.findIndex(i => i.id === iconId)
    if (index === -1) return

    const icon = icons[index]
    icons.splice(index, 1)
    selectedIconIds.delete(iconId)

    notifyChange({ type: 'iconRemoved', iconId, icon })
  }

  function moveIcon(iconId: string, position: IconPosition): void {
    const icon = icons.find(i => i.id === iconId)
    if (!icon) return

    icon.position = { ...position }
    notifyChange({ type: 'iconMoved', iconId, icon })
    doAutoSave()
  }

  function getIcon(iconId: string): DesktopIcon | undefined {
    return icons.find(i => i.id === iconId)
  }

  function getAllIcons(): DesktopIcon[] {
    return [...icons]
  }

  function arrangeIcons(): void {
    // Calculate grid positions
    // Assume a reasonable viewport width for column calculation
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024
    const cols = Math.floor((viewportWidth - GRID_MARGIN_X) / GRID_CELL_WIDTH)

    icons.forEach((icon, index) => {
      const col = index % cols
      const row = Math.floor(index / cols)

      icon.position = {
        x: GRID_MARGIN_X + col * GRID_CELL_WIDTH,
        y: GRID_MARGIN_Y + row * GRID_CELL_HEIGHT
      }
    })

    // Notify for each moved icon
    for (const icon of icons) {
      notifyChange({ type: 'iconMoved', iconId: icon.id, icon })
    }
  }

  // Selection
  function selectIcon(iconId: string, multi = false): void {
    const icon = icons.find(i => i.id === iconId)
    if (!icon) return

    if (!multi) {
      selectedIconIds.clear()
    }

    selectedIconIds.add(iconId)
    notifyChange({ type: 'selectionChanged' })
  }

  function clearSelection(): void {
    if (selectedIconIds.size === 0) return

    selectedIconIds.clear()
    notifyChange({ type: 'selectionChanged' })
  }

  function getSelectedIcons(): DesktopIcon[] {
    return icons.filter(i => selectedIconIds.has(i.id))
  }

  function getSelectedIconIds(): string[] {
    return Array.from(selectedIconIds)
  }

  // Events
  function onChange(callback: DesktopChangeCallback): Unsubscribe {
    changeListeners.add(callback)
    return () => {
      changeListeners.delete(callback)
    }
  }

  function onIconDoubleClick(callback: IconDoubleClickCallback): Unsubscribe {
    doubleClickListeners.add(callback)
    return () => {
      doubleClickListeners.delete(callback)
    }
  }

  function onContextMenu(callback: ContextMenuCallback): Unsubscribe {
    contextMenuListeners.add(callback)
    return () => {
      contextMenuListeners.delete(callback)
    }
  }

  function triggerIconDoubleClick(iconId: string): void {
    const icon = icons.find(i => i.id === iconId)
    if (!icon) return

    for (const callback of doubleClickListeners) {
      callback(icon)
    }
  }

  function triggerContextMenu(x: number, y: number, iconId?: string): void {
    for (const callback of contextMenuListeners) {
      callback({ x, y, iconId })
    }
  }

  // Persistence
  function saveState(): void {
    const iconPositions: Record<string, IconPosition> = {}
    for (const icon of icons) {
      iconPositions[icon.id] = { ...icon.position }
    }

    saveDesktopSettings({
      wallpaper,
      wallpaperMode,
      iconPositions
    })
  }

  function restoreState(): void {
    const settings = loadDesktopSettings()
    if (!settings) return

    // Restore wallpaper
    wallpaper = settings.wallpaper
    wallpaperMode = settings.wallpaperMode

    // Restore icon positions
    for (const icon of icons) {
      const savedPosition = settings.iconPositions[icon.id]
      if (savedPosition) {
        icon.position = { ...savedPosition }
      }
    }
  }

  // Auto-restore on creation if enabled
  if (autoRestore) {
    restoreState()
  }

  return {
    setWallpaper,
    getWallpaper,
    getWallpaperMode,
    addIcon,
    removeIcon,
    moveIcon,
    getIcon,
    getAllIcons,
    arrangeIcons,
    selectIcon,
    clearSelection,
    getSelectedIcons,
    getSelectedIconIds,
    onChange,
    onIconDoubleClick,
    onContextMenu,
    triggerIconDoubleClick,
    triggerContextMenu,
    saveState,
    restoreState
  }
}

