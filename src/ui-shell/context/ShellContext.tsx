/**
 * Shell Context - UI Shell Layer
 *
 * Provides UI Shell services to the React component tree.
 * Uses the WindowManager from SystemProvider if available,
 * otherwise creates its own instance.
 */

import React, { useMemo, useContext } from 'react'
import { createWindowManager } from '../window-manager'
import { createDesktopService } from '../desktop'
import { useWindowManager } from '../hooks/useWindowManager'
import { useDesktopService } from '../hooks/useDesktopService'
import {
  ShellServicesContext,
  WindowManagerContext,
  DesktopServiceContext,
  type ShellServices
} from './contexts'
import { initialIcons } from '../../config/initialState'
import { arrangeIcons as arrangeIconPositions } from '../../utils/iconLayout'
import type { IconTarget } from '../desktop/types'
import { iconMetadata } from './iconMetadata'
import { SystemContext } from '../../system/context'

export interface ShellProviderProps {
  children: React.ReactNode
}

/**
 * Internal provider that uses hooks with the services
 */
function ShellHooksProvider({
  services,
  children
}: {
  services: ShellServices
  children: React.ReactNode
}) {
  const windowManagerResult = useWindowManager(services.windowManager)
  const desktopServiceResult = useDesktopService(services.desktopService)

  return (
    <WindowManagerContext.Provider value={windowManagerResult}>
      <DesktopServiceContext.Provider value={desktopServiceResult}>
        {children}
      </DesktopServiceContext.Provider>
    </WindowManagerContext.Provider>
  )
}

/**
 * Initialize the desktop service with default icons
 * Enables auto-save for persistence across page reloads
 */
function initializeDesktopWithIcons() {
  const desktopService = createDesktopService({ autoSave: true })
  
  // Calculate icon positions
  const withPositions = arrangeIconPositions(
    initialIcons.map((icon, index) => ({
      id: `icon_${index}`,
      label: icon.label,
      icon: icon.icon,
      x: 20,
      y: 20,
      type: icon.type,
      onDoubleClick: () => {}
    }))
  )

  // Add initial icons with stable IDs for persistence
  initialIcons.forEach((iconData, index) => {
    // Use a stable ID based on the legacy ID to support persistence
    const stableId = `desktop-icon-${iconData.id}`
    
    const target: IconTarget = {
      type: iconData.type,
      appId: iconData.type === 'app' ? iconData.id : undefined,
      path: iconData.type === 'folder' ? `/Users/default/${iconData.id}` : undefined
    }

    const newIcon = desktopService.addIcon({
      id: stableId, // Use stable ID
      name: iconData.label,
      icon: iconData.icon,
      position: { x: withPositions[index].x, y: withPositions[index].y },
      target
    })

    // Store legacy metadata
    iconMetadata.set(newIcon.id, {
      legacyId: iconData.id,
      children: iconData.children
    })
  })

  // Restore saved positions and wallpaper (if any)
  desktopService.restoreState()

  return desktopService
}

/**
 * Provider component that creates and provides UI Shell services
 * Uses the WindowManager from SystemContext if available for consistency
 * with apps launched via AppRuntime.
 */
export function ShellProvider({ children }: ShellProviderProps) {
  // Try to get WindowManager from SystemContext (if inside SystemProvider)
  const systemContext = useContext(SystemContext)
  
  // Create singleton service instances
  // IMPORTANT: Use the system's windowManager if available so that
  // apps launched via AppRuntime and legacy windows use the same instance
  const services = useMemo<ShellServices>(
    () => ({
      windowManager: systemContext?.windowManager ?? createWindowManager(),
      desktopService: initializeDesktopWithIcons()
    }),
    [systemContext?.windowManager]
  )

  return (
    <ShellServicesContext.Provider value={services}>
      <ShellHooksProvider services={services}>{children}</ShellHooksProvider>
    </ShellServicesContext.Provider>
  )
}
