/**
 * System Hooks
 *
 * Hooks for accessing system services.
 */

import { useContext } from 'react'
import { SystemContext } from './context'
import type { SystemServices } from './bootstrap'

/**
 * Hook to get system services
 */
export function useSystem(): SystemServices {
  const context = useContext(SystemContext)
  if (!context) {
    throw new Error('useSystem must be used within SystemProvider')
  }
  return context
}

/**
 * Hook to get the AppRuntime
 */
export function useAppRuntime() {
  return useSystem().appRuntime
}

/**
 * Hook to get the WindowManager
 */
export function useSystemWindowManager() {
  return useSystem().windowManager
}

/**
 * Hook to get the EventBus
 */
export function useEventBus() {
  return useSystem().eventBus
}

/**
 * Hook to get the VFS (Virtual File System)
 */
export function useVfs() {
  return useSystem().vfs
}

