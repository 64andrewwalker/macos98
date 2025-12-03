/**
 * System Bootstrap
 *
 * Initializes the OS subsystems and registers all apps.
 */

import { createEventBus } from '../kernel/event-bus/event-bus'
import { createTaskManager } from '../kernel/task-manager/task-manager'
import { createVfs } from '../kernel/vfs/vfs'
import { createPermissionManager } from '../kernel/permissions/permissions'
import { createAppRuntime, createAppContext } from '../app-framework'
import { createWindowManager } from '../ui-shell'
import { allApps } from '../apps'
import type { AppRuntime, AppManifest } from '../app-framework'
import type { WindowManager } from '../ui-shell'
import type { EventBus } from '../kernel/event-bus/types'
import type { TaskManager } from '../kernel/task-manager/types'
import type { VirtualFileSystem } from '../kernel/vfs/types'
import type { PermissionManager } from '../kernel/permissions/types'

export interface SystemServices {
  eventBus: EventBus
  taskManager: TaskManager
  vfs: VirtualFileSystem
  permissions: PermissionManager
  windowManager: WindowManager
  appRuntime: AppRuntime
}

let systemServices: SystemServices | null = null
let initializationPromise: Promise<SystemServices> | null = null

/**
 * Initialize the system and all subsystems
 */
export async function initializeSystem(): Promise<SystemServices> {
  // If already initialized, return the existing services
  if (systemServices) {
    return systemServices
  }

  // If initialization is in progress, wait for it
  if (initializationPromise) {
    return initializationPromise
  }

  // Start initialization
  initializationPromise = doInitializeSystem()
  return initializationPromise
}

async function doInitializeSystem(): Promise<SystemServices> {
  // Create kernel services
  const eventBus = createEventBus()
  const taskManager = createTaskManager()
  const vfs = await createVfs()
  const permissions = createPermissionManager()

  // Create UI Shell services
  const windowManager = createWindowManager()

  // Shared services map
  const services = new Map<string, unknown>()

  // Create AppRuntime
  const appRuntime = createAppRuntime({
    taskManager: {
      spawn: (appId) => taskManager.spawn(appId),
      kill: (taskId) => {
        taskManager.kill(taskId)
        return true
      },
      getTask: (taskId) => taskManager.getTask(taskId),
      getTasksByApp: (appId) => taskManager.getTasksByApp(appId)
    },
    createAppContext: (taskId, manifest: AppManifest) => {
      // Register app permissions using the permission manager's expected format
      permissions.registerApp(manifest.id, {
        id: manifest.id,
        name: manifest.name,
        version: manifest.version,
        icon: manifest.icon,
        permissions: {
          fs: manifest.permissions?.fs,
          services: manifest.permissions?.services
        }
      })

      return createAppContext({
        appId: manifest.id,
        taskId,
        manifest,
        vfs,
        eventBus,
        windowManager: {
          openWindow: (opts) => windowManager.openWindow(opts),
          closeWindow: (id) => windowManager.closeWindow(id),
          getWindowsByApp: (appId) => windowManager.getWindowsByApp(appId),
          closeAllWindows: (appId) => windowManager.closeAllWindows(appId)
        },
        permissionChecker: {
          canAccessPath: (appId, path, mode) => permissions.canAccessPath(appId, path, mode),
          canUseService: (appId, service) => permissions.canUseService(appId, service)
        },
        services
      })
    },
    eventBus: {
      publish: (channel, event, data) => {
        // Publish to global event bus
        eventBus.publish(`${channel}.${event}`, data)
      }
    }
  })

  // Register all apps
  for (const { manifest, factory } of allApps) {
    appRuntime.registerApp(manifest, factory)
  }

  // Publish boot event
  eventBus.publish('system.boot', {})

  systemServices = {
    eventBus,
    taskManager,
    vfs,
    permissions,
    windowManager,
    appRuntime
  }

  return systemServices
}

/**
 * Get the system services (must call initializeSystem first)
 */
export function getSystemServices(): SystemServices | null {
  return systemServices
}

/**
 * Shutdown the system (cleanup)
 */
export async function shutdownSystem(): Promise<void> {
  if (!systemServices) return

  const { appRuntime, eventBus } = systemServices

  // Terminate all running apps
  await appRuntime.terminateAllApps()

  // Publish shutdown event
  eventBus.publish('system.shutdown', {})

  systemServices = null
  initializationPromise = null
}
