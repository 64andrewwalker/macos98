/**
 * useDesktopService Hook - UI Shell Layer
 *
 * React hook for accessing DesktopService.
 * Provides reactive state updates when desktop changes.
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import type {
  DesktopService,
  DesktopIcon,
  IconPosition,
  IconDoubleClickCallback,
  ContextMenuCallback
} from '../desktop'

export interface UseDesktopServiceResult {
  /** All desktop icons */
  icons: DesktopIcon[]
  /** Selected icon IDs */
  selectedIconIds: string[]
  /** Selected icons */
  selectedIcons: DesktopIcon[]
  /** Current wallpaper URL */
  wallpaper: string
  /** Wallpaper display mode */
  wallpaperMode: 'tile' | 'center' | 'fill' | 'fit'
  /** Set wallpaper */
  setWallpaper: (url: string, mode?: 'tile' | 'center' | 'fill' | 'fit') => void
  /** Add an icon */
  addIcon: (icon: Omit<DesktopIcon, 'id'>) => DesktopIcon
  /** Remove an icon */
  removeIcon: (iconId: string) => void
  /** Move an icon */
  moveIcon: (iconId: string, position: IconPosition) => void
  /** Get an icon */
  getIcon: (iconId: string) => DesktopIcon | undefined
  /** Arrange icons in grid */
  arrangeIcons: () => void
  /** Select an icon */
  selectIcon: (iconId: string, multi?: boolean) => void
  /** Clear selection */
  clearSelection: () => void
  /** Register double-click handler */
  onIconDoubleClick: (callback: IconDoubleClickCallback) => () => void
  /** Register context menu handler */
  onContextMenu: (callback: ContextMenuCallback) => () => void
  /** Trigger icon double-click */
  triggerIconDoubleClick: (iconId: string) => void
  /** Trigger context menu */
  triggerContextMenu: (x: number, y: number, iconId?: string) => void
}

/**
 * Hook to interact with DesktopService
 * @param desktopService - The DesktopService instance
 */
export function useDesktopService(desktopService: DesktopService): UseDesktopServiceResult {
  // Reactive state
  const [icons, setIcons] = useState<DesktopIcon[]>(() => desktopService.getAllIcons())
  const [selectedIconIds, setSelectedIconIds] = useState<string[]>(
    () => desktopService.getSelectedIconIds()
  )
  const [wallpaper, setWallpaperState] = useState<string>(() => desktopService.getWallpaper())
  const [wallpaperMode, setWallpaperModeState] = useState<'tile' | 'center' | 'fill' | 'fit'>(
    () => desktopService.getWallpaperMode()
  )

  // Subscribe to desktop changes
  useEffect(() => {
    const unsubscribe = desktopService.onChange((event) => {
      switch (event.type) {
        case 'iconAdded':
        case 'iconRemoved':
        case 'iconMoved':
          setIcons(desktopService.getAllIcons())
          break
        case 'selectionChanged':
          setSelectedIconIds(desktopService.getSelectedIconIds())
          break
        case 'wallpaperChanged':
          setWallpaperState(desktopService.getWallpaper())
          setWallpaperModeState(desktopService.getWallpaperMode())
          break
      }
    })

    return unsubscribe
  }, [desktopService])

  // Derived state
  const selectedIcons = useMemo(
    () => icons.filter(i => selectedIconIds.includes(i.id)),
    [icons, selectedIconIds]
  )

  // Memoized callbacks
  const setWallpaper = useCallback(
    (url: string, mode?: 'tile' | 'center' | 'fill' | 'fit') =>
      desktopService.setWallpaper(url, mode),
    [desktopService]
  )

  const addIcon = useCallback(
    (icon: Omit<DesktopIcon, 'id'>) => desktopService.addIcon(icon),
    [desktopService]
  )

  const removeIcon = useCallback(
    (iconId: string) => desktopService.removeIcon(iconId),
    [desktopService]
  )

  const moveIcon = useCallback(
    (iconId: string, position: IconPosition) => desktopService.moveIcon(iconId, position),
    [desktopService]
  )

  const getIcon = useCallback(
    (iconId: string) => desktopService.getIcon(iconId),
    [desktopService]
  )

  const arrangeIcons = useCallback(() => desktopService.arrangeIcons(), [desktopService])

  const selectIcon = useCallback(
    (iconId: string, multi?: boolean) => desktopService.selectIcon(iconId, multi),
    [desktopService]
  )

  const clearSelection = useCallback(() => desktopService.clearSelection(), [desktopService])

  const onIconDoubleClick = useCallback(
    (callback: IconDoubleClickCallback) => desktopService.onIconDoubleClick(callback),
    [desktopService]
  )

  const onContextMenu = useCallback(
    (callback: ContextMenuCallback) => desktopService.onContextMenu(callback),
    [desktopService]
  )

  const triggerIconDoubleClick = useCallback(
    (iconId: string) => desktopService.triggerIconDoubleClick(iconId),
    [desktopService]
  )

  const triggerContextMenu = useCallback(
    (x: number, y: number, iconId?: string) => desktopService.triggerContextMenu(x, y, iconId),
    [desktopService]
  )

  return useMemo(
    () => ({
      icons,
      selectedIconIds,
      selectedIcons,
      wallpaper,
      wallpaperMode,
      setWallpaper,
      addIcon,
      removeIcon,
      moveIcon,
      getIcon,
      arrangeIcons,
      selectIcon,
      clearSelection,
      onIconDoubleClick,
      onContextMenu,
      triggerIconDoubleClick,
      triggerContextMenu
    }),
    [
      icons,
      selectedIconIds,
      selectedIcons,
      wallpaper,
      wallpaperMode,
      setWallpaper,
      addIcon,
      removeIcon,
      moveIcon,
      getIcon,
      arrangeIcons,
      selectIcon,
      clearSelection,
      onIconDoubleClick,
      onContextMenu,
      triggerIconDoubleClick,
      triggerContextMenu
    ]
  )
}

