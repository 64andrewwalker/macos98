import React, { useState, useEffect, useCallback, useRef } from 'react'
import styles from './Desktop.module.scss'
import MenuBar from './MenuBar'
import DesktopIcon from './DesktopIcon'
import Window from './Window'
import ContextMenu from './ContextMenu'
import type { ContextMenuItem } from './ContextMenu'
import InfoDialog from './InfoDialog'
import OpenDialog from './OpenDialog'
import BackgroundSwitcher from '../apps/BackgroundSwitcher'
import TextEditor from '../apps/TextEditor'
import Finder, { type Breadcrumb } from '../apps/Finder'
import Calculator from '../apps/Calculator'
import TicTacToe from '../apps/TicTacToe'
import About from '../apps/About'
import { useAppRuntime } from '../../system'
import {
  useWindows,
  useDesktop as useDesktopService,
  useDesktopServiceInstance
} from '../../ui-shell/context/hooks'
import { iconMetadata } from '../../ui-shell/context/iconMetadata'
import { useDesktop as useLegacyDesktopContext } from '../../contexts/DesktopContext'
import { type InitialFileItem } from '../../config/initialState'
import type { DesktopIcon as DesktopIconType } from '../../ui-shell/desktop/types'
import folderIcon from '../../assets/folder_icon.png'

export interface FileItem {
  id: string
  name: string
  type: 'folder' | 'file' | 'app' | 'system'
  icon: string
  children?: FileItem[]
  content?: string
}

// App IDs that should be launched via new AppRuntime
const NEW_SYSTEM_APPS = ['calc', 'game', 'about']

// Convert InitialFileItem to FileItem
function convertToFileItem(item: InitialFileItem): FileItem {
  return {
    id: item.id,
    name: item.name,
    type: item.type,
    icon: item.icon,
    content: item.content,
    children: item.children?.map(convertToFileItem)
  }
}

// Generate unique IDs
let idCounter = 0
const generateId = (prefix: string) => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}_${crypto.randomUUID()}`
  }
  idCounter += 1
  return `${prefix}_${idCounter}`
}

// Helper to find folder by ID recursively (pure function)
function findFolderByIdRecursive(
  id: string,
  searchItems: FileItem[],
  desktopIcons: DesktopIconType[],
  metadata: Map<string, { legacyId: string; children?: InitialFileItem[] }>
): FileItem | null {
  for (const item of searchItems) {
    if (item.id === id) return item
    if (item.children) {
      const found = findFolderByIdRecursive(id, item.children, desktopIcons, metadata)
      if (found) return found
    }
  }
  // Also search in desktop icons
  for (const icon of desktopIcons) {
    const iconMeta = metadata.get(icon.id)
    if (iconMeta?.legacyId === id && iconMeta.children) {
      return {
        id: iconMeta.legacyId,
        name: icon.name,
        type: 'folder',
        icon: icon.icon,
        children: iconMeta.children.map(convertToFileItem)
      }
    }
    if (iconMeta?.children) {
      const found = findFolderByIdRecursive(id, iconMeta.children.map(convertToFileItem), desktopIcons, metadata)
      if (found) return found
    }
  }
  return null
}

const Desktop: React.FC = () => {
  const appRuntime = useAppRuntime()
  const {
    windows: shellWindows,
    focusWindow: focusShellWindow,
    closeWindow: closeShellWindow,
    openWindow: openShellWindow
  } = useWindows()
  
    const {
    icons: desktopIcons,
    selectedIconIds,
    addIcon,
    moveIcon,
    selectIcon,
    clearSelection,
    arrangeIcons
  } = useDesktopService()
  
  const desktopService = useDesktopServiceInstance()

  // Get background from legacy context (will be migrated to DesktopService later)
  const { backgroundImage, backgroundMode } = useLegacyDesktopContext()

  const [showOpenDialog, setShowOpenDialog] = useState(false)
  const [showInfoDialog, setShowInfoDialog] = useState(false)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false
  })
  const [clipboard, setClipboard] = useState<{ iconId: string; cut: boolean } | null>(null)
  const [history, setHistory] = useState<{ type: string; iconId: string }[]>([])

  // Use ref for functions that need to call each other
  const openFinderRef = useRef<(folderId: string, folderName: string, items: FileItem[], path: Breadcrumb[]) => void>(() => {})

  // Helper to find folder by ID
  const findFolderById = useCallback((id: string, searchItems: FileItem[] = []): FileItem | null => {
    return findFolderByIdRecursive(id, searchItems, desktopIcons, iconMetadata)
  }, [desktopIcons])

  // Open a window using the new WindowManager
  const openWindow = useCallback((
    id: string,
    title: string,
    content: React.ReactNode,
    width: number = 400,
    height: number = 300
  ) => {
    // Check if window already exists
    const existingWindow = shellWindows.find(w => w.id === id || w.title === title)
    if (existingWindow) {
      focusShellWindow(existingWindow.id)
      return
    }

    openShellWindow({
      title,
      content,
      width,
      height,
      appId: 'desktop'
    })
  }, [shellWindows, focusShellWindow, openShellWindow])

  // Open Finder for a folder
  const openFinder = useCallback((_folderId: string, folderName: string, items: FileItem[], path: Breadcrumb[]) => {
    // Check if window already exists
    const existingWindow = shellWindows.find(w => w.title === folderName)
    if (existingWindow) {
      focusShellWindow(existingWindow.id)
      return
    }

    openShellWindow({
      title: folderName,
      content: (
        <Finder
          items={items}
          path={path}
          onNavigate={(id) => {
            const folder = findFolderByIdRecursive(id, [], desktopIcons, iconMetadata)
            if (folder && folder.children) {
              const existingIndex = path.findIndex(crumb => crumb.id === id)
              const nextPath = existingIndex >= 0
                ? path.slice(0, existingIndex + 1)
                : [...path, { id, name: folder.name }]

              // Use ref to call openFinder
              openFinderRef.current(id, folder.name, folder.children, nextPath)
            }
          }}
          onOpenFile={(fileId, fileName, content) => {
            openShellWindow({
              title: fileName,
              content: (
                <TextEditor
                  fileId={fileId}
                  fileName={fileName}
                  initialContent={content}
                  onSave={() => { /* Save handled internally via VFS */ }}
                />
              ),
              width: 600,
              height: 500,
              appId: 'text-editor'
            })
          }}
        />
      ),
      width: 500,
      height: 400,
      appId: 'finder'
    })
  }, [shellWindows, focusShellWindow, openShellWindow, desktopIcons])

  // Keep ref in sync
  useEffect(() => {
    openFinderRef.current = openFinder
  }, [openFinder])

  // Handle legacy icon double-click (direct window open)
  const handleLegacyIconDoubleClick = useCallback((
    icon: DesktopIconType,
    metadata?: { legacyId: string; children?: InitialFileItem[] }
  ) => {
    const legacyId = metadata?.legacyId
    const children = metadata?.children

    if (legacyId === 'hd') {
      openWindow('hd', 'Macintosh HD', <div><p>78.4 MB in disk</p><p>0 items</p></div>)
    } else if (legacyId === 'docs') {
      if (children) {
        openFinder('docs', 'Documents', children.map(convertToFileItem), [{ id: 'docs', name: 'Documents' }])
      }
    } else if (legacyId === 'calc') {
      openWindow('calc', 'Calculator', <Calculator />, 200, 300)
    } else if (legacyId === 'game') {
      openWindow('game', 'TicTacToe', <TicTacToe />, 200, 250)
    } else if (legacyId === 'trash') {
      openWindow('trash', 'Trash', <div><p>Trash is empty</p></div>)
    } else if (icon.name) {
      // Generic folder opening
      openWindow(icon.id, icon.name, <div><p>Empty folder</p></div>)
    }
  }, [openWindow, openFinder])

  // Handle icon double-click
  const handleIconDoubleClick = useCallback((iconId: string) => {
    const icon = desktopIcons.find(i => i.id === iconId)
    if (!icon) return

    const metadata = iconMetadata.get(iconId)
    const legacyId = metadata?.legacyId ?? ''
    const appIdMap: Record<string, string> = {
      'calc': 'calculator',
      'game': 'tictactoe',
      'about': 'about'
    }

    // Check if this app should use the new system
    if (NEW_SYSTEM_APPS.includes(legacyId) && appIdMap[legacyId]) {
      const appId = appIdMap[legacyId]
      const installedApps = appRuntime.getInstalledApps()
      if (installedApps.some(app => app.id === appId)) {
        appRuntime.launchApp(appId).catch(err => {
          console.error('Failed to launch app:', err)
          // Fallback to direct window open
          handleLegacyIconDoubleClick(icon, metadata)
        })
        return
      }
    }

    handleLegacyIconDoubleClick(icon, metadata)
  }, [desktopIcons, appRuntime, handleLegacyIconDoubleClick])

  // Close window handler
  const handleCloseWindow = useCallback((windowId: string) => {
    closeShellWindow(windowId)
  }, [closeShellWindow])

  // Focus window handler
  const handleFocusWindow = useCallback((windowId: string) => {
    focusShellWindow(windowId)
  }, [focusShellWindow])

  // Handle file open from Open dialog
  const handleOpenFile = useCallback((path: string) => {
    setShowOpenDialog(false)
    const fileName = path.split('/').pop() || 'Untitled'
    openShellWindow({
      title: fileName,
      content: (
        <TextEditor
          fileId={path}
          fileName={fileName}
          initialContent=""
          onSave={() => { /* Save handled internally via VFS */ }}
        />
      ),
      width: 500,
      height: 400,
      appId: 'text-editor'
    })
  }, [openShellWindow])

  // Create new folder
  const createNewFolder = useCallback((position?: { x?: number; y?: number }) => {
    const baseX = 150 + (desktopIcons.length % 5) * 100
    const baseY = 50 + Math.floor(desktopIcons.length / 5) * 100
    const newLegacyId = generateId('folder')
    
    const newIcon = addIcon({
      name: 'New Folder',
      icon: folderIcon,
      position: {
        x: position?.x ?? baseX,
        y: position?.y ?? baseY
      },
      target: {
        type: 'folder',
        path: `/Users/default/${newLegacyId}`
      }
    })

    // Store legacy metadata
    iconMetadata.set(newIcon.id, { legacyId: newLegacyId })

    setHistory(prev => [...prev, { type: 'create_folder', iconId: newIcon.id }])
    selectIcon(newIcon.id)
  }, [desktopIcons.length, addIcon, selectIcon])

  // Edit operations
  const handleCopy = useCallback(() => {
    if (selectedIconIds.length === 0) return
    setClipboard({ iconId: selectedIconIds[0], cut: false })
  }, [selectedIconIds])

  const handleCut = useCallback(() => {
    if (selectedIconIds.length === 0) return
    setClipboard({ iconId: selectedIconIds[0], cut: true })
  }, [selectedIconIds])

  const handlePaste = useCallback(() => {
    if (!clipboard) return
    const sourceIcon = desktopIcons.find(i => i.id === clipboard.iconId)
    if (!sourceIcon) return

    const newIcon = addIcon({
      name: sourceIcon.name.includes('copy') ? sourceIcon.name : `${sourceIcon.name} copy`,
      icon: sourceIcon.icon,
      position: {
        x: sourceIcon.position.x + 20,
        y: sourceIcon.position.y + 20
      },
      target: { ...sourceIcon.target }
    })

    // Copy metadata
    const sourceMeta = iconMetadata.get(clipboard.iconId)
    if (sourceMeta) {
      iconMetadata.set(newIcon.id, { ...sourceMeta })
    }

    setHistory(prev => [...prev, { type: 'paste', iconId: newIcon.id }])
    selectIcon(newIcon.id)
    
    if (clipboard.cut) {
      setClipboard(null)
    }
  }, [clipboard, desktopIcons, addIcon, selectIcon])

  const handleUndo = useCallback(() => {
    if (history.length === 0) return
    const lastAction = history[history.length - 1]
    
    if (lastAction.type === 'create_folder' || lastAction.type === 'paste') {
      desktopService.removeIcon(lastAction.iconId)
      iconMetadata.delete(lastAction.iconId)
    }
    
    setHistory(prev => prev.slice(0, -1))
  }, [history, desktopService])

  const handleClear = useCallback(() => {
    clearSelection()
  }, [clearSelection])

  // Context menu handler
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      visible: true
    })
  }, [])

  // Clean up icons
  const handleCleanUp = useCallback(() => {
    arrangeIcons()
  }, [arrangeIcons])

  // Close active window
  const closeActiveWindow = useCallback(() => {
    const focusedWindow = shellWindows.find(w => w.focused)
    if (focusedWindow) {
      closeShellWindow(focusedWindow.id)
    }
  }, [shellWindows, closeShellWindow])

  // Get focused window ID
  const focusedWindow = shellWindows.find(w => w.focused)
  const activeWindowId = focusedWindow?.id ?? null

    const contextMenuItems: ContextMenuItem[] = [
        {
            label: 'New Folder',
            action: () => {
                createNewFolder({
          x: 150 + (desktopIcons.length * 10),
          y: 50 + (desktopIcons.length * 10)
        })
            }
        },
        {
            label: 'Change Background...',
            action: () => {
        openShellWindow({
          title: 'Change Background',
          content: <BackgroundSwitcher />,
          width: 600,
          height: 500,
          appId: 'background-switcher'
        })
            }
        },
        {
            label: 'Refresh',
            action: () => {
        console.log('Refresh desktop')
            }
        },
        { separator: true },
        {
            label: 'Clean Up',
            action: handleCleanUp
        },
        { separator: true },
        {
            label: 'Get Info',
            action: () => setShowInfoDialog(true)
        }
  ]

    const getBackgroundStyle = () => {
        const baseStyle: React.CSSProperties = {
            backgroundImage: `url(${backgroundImage})`
    }

        switch (backgroundMode) {
            case 'fill':
        return { ...baseStyle, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }
            case 'fit':
        return { ...baseStyle, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundColor: 'var(--gray-0)' }
            case 'tile':
        return { ...baseStyle, backgroundSize: 'auto', backgroundRepeat: 'repeat' }
            default:
        return baseStyle
    }
  }

  // Map desktop icons to the format expected by DesktopIcon component
  const mappedIcons = desktopIcons.map(icon => ({
    id: icon.id,
    label: icon.name,
    icon: icon.icon,
    x: icon.position.x,
    y: icon.position.y,
    type: icon.target.type
  }))

  // Suppress unused variable warnings
  void findFolderById

    return (
        <div
            className={styles.desktop}
            style={getBackgroundStyle()}
      onClick={() => clearSelection()}
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
          clearSelection()
                }
            }}
            onContextMenu={handleContextMenu}
        >
            <MenuBar
        onOpenWindow={(id, title, content, width, height) => {
          if (id === 'about') {
            openWindow(id, title, <About />, 300, 200)
          } else {
            openWindow(id, title, content, width, height)
          }
        }}
                onCloseActiveWindow={closeActiveWindow}
        onOpenDialog={() => setShowOpenDialog(true)}
                onUndo={handleUndo}
                onCut={handleCut}
                onCopy={handleCopy}
                onPaste={handlePaste}
                onClear={handleClear}
        hasSelection={selectedIconIds.length > 0}
                hasClipboard={clipboard !== null}
                canUndo={history.length > 0}
            />
            <div className={styles.iconContainer}>
        {mappedIcons.map(icon => (
                    <DesktopIcon
                        key={icon.id}
                        icon={icon.icon}
                        label={icon.label}
                        x={icon.x}
                        y={icon.y}
                        onDoubleClick={() => handleIconDoubleClick(icon.id)}
            selected={selectedIconIds.includes(icon.id)}
            onSelect={() => selectIcon(icon.id)}
            onMove={(position) => moveIcon(icon.id, position)}
                    />
                ))}
            </div>

      {/* Render windows from WindowManager */}
      {shellWindows.map(window => (
                <Window
                    key={window.id}
                    id={window.id}
                    title={window.title}
          x={window.bounds.x}
          y={window.bounds.y}
          width={window.bounds.width}
          height={window.bounds.height}
                    isActive={window.id === activeWindowId}
          onClose={() => handleCloseWindow(window.id)}
          onFocus={() => handleFocusWindow(window.id)}
                >
                    {window.content}
                </Window>
            ))}

            <ContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                visible={contextMenu.visible}
                items={contextMenuItems}
                onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
            />
            {showInfoDialog && (
                <InfoDialog
          iconData={selectedIconIds.length > 0 ? mappedIcons.find(i => i.id === selectedIconIds[0]) : undefined}
                    onClose={() => setShowInfoDialog(false)}
                />
            )}
      {showOpenDialog && (
        <OpenDialog
          onClose={() => setShowOpenDialog(false)}
          onOpen={handleOpenFile}
                />
            )}
        </div>
  )
}

export default Desktop
