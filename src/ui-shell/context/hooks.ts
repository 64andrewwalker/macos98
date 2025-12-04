/**
 * Shell Context Hooks - UI Shell Layer
 *
 * Hooks for accessing UI Shell services from context.
 * Separated from ShellContext.tsx for Fast Refresh compatibility.
 */

import { useContext } from 'react'
import type { WindowManager } from '../window-manager'
import type { DesktopService } from '../desktop'
import type { UseWindowManagerResult } from '../hooks/useWindowManager'
import type { UseDesktopServiceResult } from '../hooks/useDesktopService'
import {
  ShellServicesContext,
  WindowManagerContext,
  DesktopServiceContext
} from './contexts'

/**
 * Hook to get raw WindowManager service instance
 * Use this when you need direct access to the service (e.g., for event subscriptions)
 */
export function useWindowManagerService(): WindowManager {
  const context = useContext(ShellServicesContext)
  if (!context) {
    throw new Error('useWindowManagerService must be used within ShellProvider')
  }
  return context.windowManager
}

/**
 * Hook to get raw DesktopService instance
 * Use this when you need direct access to the service
 */
export function useDesktopServiceInstance(): DesktopService {
  const context = useContext(ShellServicesContext)
  if (!context) {
    throw new Error('useDesktopServiceInstance must be used within ShellProvider')
  }
  return context.desktopService
}

/**
 * Hook to get reactive WindowManager state and methods
 * This is the primary hook for components that render windows
 */
export function useWindows(): UseWindowManagerResult {
  const context = useContext(WindowManagerContext)
  if (!context) {
    throw new Error('useWindows must be used within ShellProvider')
  }
  return context
}

/**
 * Hook to get reactive Desktop state and methods
 * This is the primary hook for components that render desktop icons
 */
export function useDesktop(): UseDesktopServiceResult {
  const context = useContext(DesktopServiceContext)
  if (!context) {
    throw new Error('useDesktop must be used within ShellProvider')
  }
  return context
}

