/**
 * Shell Context Objects - UI Shell Layer
 *
 * React context objects for UI Shell services.
 * Separated from components for Fast Refresh compatibility.
 */

import { createContext } from 'react'
import type { WindowManager } from '../window-manager'
import type { DesktopService } from '../desktop'
import type { UseWindowManagerResult } from '../hooks/useWindowManager'
import type { UseDesktopServiceResult } from '../hooks/useDesktopService'

// Service instances context (raw services)
export interface ShellServices {
  windowManager: WindowManager
  desktopService: DesktopService
}

export const ShellServicesContext = createContext<ShellServices | null>(null)

// Hook result contexts (reactive state)
export const WindowManagerContext = createContext<UseWindowManagerResult | null>(null)
export const DesktopServiceContext = createContext<UseDesktopServiceResult | null>(null)

