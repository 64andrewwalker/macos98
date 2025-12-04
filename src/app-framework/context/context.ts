/**
 * AppContext Implementation - App Framework Layer
 *
 * Provides managed resources to applications.
 * All resources are tracked and cleaned up on dispose.
 */

import type {
  AppContext,
  AppContextDependencies,
  ScopedFileSystem,
  AppEventHandler
} from './types'
import type { Unsubscribe } from '../../kernel/event-bus/types'
import type { Window, OpenWindowOptions } from '../../ui-shell'

/**
 * Create a permission-checked file system wrapper
 */
function createScopedFileSystem(
  deps: AppContextDependencies
): ScopedFileSystem {
  const { appId, vfs, permissionChecker } = deps

  function checkRead(path: string): void {
    if (!permissionChecker.canAccessPath(appId, path, 'read')) {
      throw new Error(`Permission denied: cannot read ${path}`)
    }
  }

  function checkWrite(path: string): void {
    if (!permissionChecker.canAccessPath(appId, path, 'write')) {
      throw new Error(`Permission denied: cannot write ${path}`)
    }
  }

  return {
    async readFile(path: string) {
      checkRead(path)
      return vfs.readFile(path)
    },

    async readTextFile(path: string) {
      checkRead(path)
      const data = await vfs.readFile(path)
      if (typeof data === 'string') return data
      return new TextDecoder().decode(data)
    },

    async writeFile(path: string, data: ArrayBuffer | string) {
      checkWrite(path)
      return vfs.writeFile(path, data)
    },

    async mkdir(path: string) {
      checkWrite(path)
      return vfs.mkdir(path)
    },

    async readdir(path: string) {
      checkRead(path)
      return vfs.readdir(path)
    },

    async stat(path: string) {
      checkRead(path)
      const stat = await vfs.stat(path)
      return {
        isDirectory: stat.type === 'directory',
        size: stat.size,
        mtime: stat.updatedAt.getTime()
      }
    },

    async exists(path: string) {
      checkRead(path)
      return vfs.exists(path)
    },

    async remove(path: string) {
      checkWrite(path)
      // VFS uses deleteFile for files, but we need to detect type first
      const stat = await vfs.stat(path)
      if (stat.type === 'directory') {
        return vfs.rmdir(path)
      }
      return vfs.deleteFile(path)
    }
  }
}

// Counter for generating numeric timer IDs
let timerIdCounter = 0

// Track event handlers with their unsubscribe functions
interface EventSubscription {
  handler: AppEventHandler
  unsubscribe: Unsubscribe
}

/**
 * Create a new AppContext
 */
export function createAppContext(deps: AppContextDependencies): AppContext {
  const {
    appId,
    taskId,
    manifest,
    eventBus,
    windowManager,
    permissionChecker,
    services
  } = deps

  // Resource tracking - map our numeric IDs to actual timer handles
  const timerHandles = new Map<number, ReturnType<typeof setTimeout>>()
  const intervalHandles = new Map<number, ReturnType<typeof setInterval>>()
  // Map event name -> Set of subscriptions
  const eventSubscriptions = new Map<string, Set<EventSubscription>>()
  const terminateCallbacks = new Set<() => void>()
  let disposed = false

  function checkDisposed(): void {
    if (disposed) {
      throw new Error('AppContext has been disposed')
    }
  }

  // Create scoped file system
  const fs = createScopedFileSystem(deps)

  const context: AppContext = {
    get appId() { return appId },
    get taskId() { return taskId },
    get manifest() { return manifest },
    get fs() { return fs },

    setTimeout(callback: () => void, ms: number): number {
      checkDisposed()
      timerIdCounter += 1
      const id = timerIdCounter
      const handle = globalThis.setTimeout(() => {
        timerHandles.delete(id)
        if (!disposed) callback()
      }, ms)
      timerHandles.set(id, handle)
      return id
    },

    setInterval(callback: () => void, ms: number): number {
      checkDisposed()
      timerIdCounter += 1
      const id = timerIdCounter
      const handle = globalThis.setInterval(() => {
        if (!disposed) callback()
      }, ms)
      intervalHandles.set(id, handle)
      return id
    },

    clearTimeout(id: number): void {
      const handle = timerHandles.get(id)
      if (handle !== undefined) {
        globalThis.clearTimeout(handle)
        timerHandles.delete(id)
      }
    },

    clearInterval(id: number): void {
      const handle = intervalHandles.get(id)
      if (handle !== undefined) {
        globalThis.clearInterval(handle)
        intervalHandles.delete(id)
      }
    },

    addEventListener(event: string, handler: AppEventHandler): void {
      checkDisposed()

      // Subscribe to event bus and track the unsubscribe function
      const unsubscribe = eventBus.subscribe(event, handler)

      // Track for cleanup
      let subscriptions = eventSubscriptions.get(event)
      if (!subscriptions) {
        subscriptions = new Set()
        eventSubscriptions.set(event, subscriptions)
      }
      subscriptions.add({ handler, unsubscribe })
    },

    removeEventListener(event: string, handler: AppEventHandler): void {
      const subscriptions = eventSubscriptions.get(event)
      if (!subscriptions) return

      // Find and remove the subscription matching this handler
      for (const sub of subscriptions) {
        if (sub.handler === handler) {
          sub.unsubscribe()
          subscriptions.delete(sub)
          break
        }
      }

      if (subscriptions.size === 0) {
        eventSubscriptions.delete(event)
      }
    },

    getService<T>(serviceName: string): T | undefined {
      checkDisposed()
      if (!permissionChecker.canUseService(appId, serviceName)) {
        return undefined
      }
      return services.get(serviceName) as T | undefined
    },

    openWindow(options: Omit<OpenWindowOptions, 'appId'>): Window {
      checkDisposed()
      return windowManager.openWindow({ ...options, appId })
    },

    closeWindow(windowId: string): void {
      windowManager.closeWindow(windowId)
    },

    getWindows(): Window[] {
      return windowManager.getWindowsByApp(appId)
    },

    onTerminate(callback: () => void): Unsubscribe {
      terminateCallbacks.add(callback)
      return () => {
        terminateCallbacks.delete(callback)
      }
    },

    dispose(): void {
      if (disposed) return
      disposed = true

      // 1. Execute terminate callbacks
      for (const callback of terminateCallbacks) {
        try {
          callback()
        } catch (e) {
          console.error(`Error in terminate callback for ${appId}:`, e)
        }
      }
      terminateCallbacks.clear()

      // 2. Clear all timers
      for (const handle of timerHandles.values()) {
        globalThis.clearTimeout(handle)
      }
      timerHandles.clear()

      // 3. Clear all intervals
      for (const handle of intervalHandles.values()) {
        globalThis.clearInterval(handle)
      }
      intervalHandles.clear()

      // 4. Remove all event listeners
      for (const subscriptions of eventSubscriptions.values()) {
        for (const sub of subscriptions) {
          sub.unsubscribe()
        }
      }
      eventSubscriptions.clear()

      // 5. Close all windows
      windowManager.closeAllWindows(appId)
    }
  }

  return context
}
