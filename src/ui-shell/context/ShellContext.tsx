/**
 * Shell Context - UI Shell Layer
 *
 * Provides UI Shell services to the React component tree.
 * Creates singleton instances of WindowManager and DesktopService.
 */

import React, { useMemo } from 'react'
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
 */
function initializeDesktopWithIcons() {
  const desktopService = createDesktopService()
  
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

  // Add initial icons
  initialIcons.forEach((iconData, index) => {
    const target: IconTarget = {
      type: iconData.type,
      appId: iconData.type === 'app' ? iconData.id : undefined,
      path: iconData.type === 'folder' ? `/Users/default/${iconData.id}` : undefined
    }

    const newIcon = desktopService.addIcon({
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

  return desktopService
}

/**
 * Provider component that creates and provides UI Shell services
 */
export function ShellProvider({ children }: ShellProviderProps) {
  // Create singleton service instances
  const services = useMemo<ShellServices>(
    () => ({
      windowManager: createWindowManager(),
      desktopService: initializeDesktopWithIcons()
    }),
    []
  )

  return (
    <ShellServicesContext.Provider value={services}>
      <ShellHooksProvider services={services}>{children}</ShellHooksProvider>
    </ShellServicesContext.Provider>
  )
}
