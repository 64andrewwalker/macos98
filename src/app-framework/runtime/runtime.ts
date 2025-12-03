/**
 * AppRuntime Implementation - App Framework Layer
 *
 * Manages application lifecycle: registration, launch, terminate.
 */

import type {
  AppRuntime,
  AppRuntimeDependencies,
  AppFactory,
  LaunchOptions,
  RunningApp
} from './types'
import type { AppManifest } from '../manifest'
import type { Task } from '../../kernel/task-manager/types'

// Get file extension from path
function getExtension(path: string): string {
  const lastDot = path.lastIndexOf('.')
  return lastDot >= 0 ? path.slice(lastDot) : ''
}

/**
 * Create a new AppRuntime instance
 */
export function createAppRuntime(deps: AppRuntimeDependencies): AppRuntime {
  const { taskManager, createAppContext, eventBus } = deps

  // Registered apps (manifest + factory)
  const registeredApps = new Map<string, { manifest: AppManifest; factory: AppFactory }>()

  // Running app instances
  const runningApps = new Map<string, RunningApp>()

  // Currently active (foreground) app
  let activeTaskId: string | null = null

  function publishEvent(event: string, data?: unknown): void {
    eventBus.publish('system', event, data)
  }

  const runtime: AppRuntime = {
    registerApp(manifest: AppManifest, factory: AppFactory): void {
      registeredApps.set(manifest.id, { manifest, factory })
      publishEvent('app.registered', { appId: manifest.id })
    },

    unregisterApp(appId: string): void {
      registeredApps.delete(appId)
      publishEvent('app.unregistered', { appId })
    },

    async launchApp(appId: string, options?: LaunchOptions): Promise<Task> {
      const registered = registeredApps.get(appId)
      if (!registered) {
        throw new Error(`App not registered: ${appId}`)
      }

      const { manifest, factory } = registered

      // 1. Create task
      const task = taskManager.spawn(appId)

      // 2. Create context
      const ctx = createAppContext(task.id, manifest)

      // 3. Create app instance
      const instance = factory(ctx)

      // 4. Store running app
      const runningApp: RunningApp = {
        manifest,
        task,
        context: ctx,
        instance
      }
      runningApps.set(task.id, runningApp)

      // 5. Call onLaunch
      try {
        await instance.onLaunch?.()
      } catch (e) {
        console.error(`Error in onLaunch for ${appId}:`, e)
        // Clean up on launch failure
        runningApps.delete(task.id)
        ctx.dispose()
        taskManager.kill(task.id)
        throw e
      }

      // 6. Open file if specified
      if (options?.file && instance.openFile) {
        try {
          instance.openFile(options.file)
        } catch (e) {
          console.error(`Error opening file ${options.file} in ${appId}:`, e)
        }
      }

      // 7. Make active
      runtime.activateApp(task.id)

      // 8. Publish event
      publishEvent('app.launched', { appId, taskId: task.id })

      return task
    },

    async terminateApp(taskId: string): Promise<void> {
      const runningApp = runningApps.get(taskId)
      if (!runningApp) return

      const { manifest, instance, context } = runningApp

      // 1. Call onTerminate
      try {
        await instance.onTerminate?.()
      } catch (e) {
        console.error(`Error in onTerminate for ${manifest.id}:`, e)
      }

      // 2. Dispose context (cleans up all resources)
      context.dispose()

      // 3. Kill task
      taskManager.kill(taskId)

      // 4. Remove from running
      runningApps.delete(taskId)

      // 5. Update active app
      if (activeTaskId === taskId) {
        activeTaskId = null
        // Activate another app if available
        const remaining = Array.from(runningApps.keys())
        if (remaining.length > 0) {
          runtime.activateApp(remaining[remaining.length - 1])
        }
      }

      // 6. Publish event
      publishEvent('app.terminated', { appId: manifest.id, taskId })
    },

    async terminateAllApps(): Promise<void> {
      const taskIds = Array.from(runningApps.keys())
      for (const taskId of taskIds) {
        await runtime.terminateApp(taskId)
      }
    },

    getInstalledApps(): AppManifest[] {
      return Array.from(registeredApps.values()).map(r => r.manifest)
    },

    getRunningApps(): RunningApp[] {
      return Array.from(runningApps.values())
    },

    isAppRunning(appId: string): boolean {
      return Array.from(runningApps.values()).some(r => r.manifest.id === appId)
    },

    getRunningInstance(taskId: string): RunningApp | undefined {
      return runningApps.get(taskId)
    },

    getAppForFile(path: string): AppManifest | undefined {
      const ext = getExtension(path)
      if (!ext) return undefined

      for (const { manifest } of registeredApps.values()) {
        if (manifest.fileAssociations?.some(fa => fa.extensions.includes(ext))) {
          return manifest
        }
      }
      return undefined
    },

    async openFile(path: string): Promise<Task | undefined> {
      const manifest = runtime.getAppForFile(path)
      if (!manifest) return undefined

      return runtime.launchApp(manifest.id, { file: path })
    },

    activateApp(taskId: string): void {
      const runningApp = runningApps.get(taskId)
      if (!runningApp) return

      // Deactivate previous
      if (activeTaskId && activeTaskId !== taskId) {
        const prev = runningApps.get(activeTaskId)
        if (prev) {
          try {
            prev.instance.onDeactivate?.()
          } catch (e) {
            console.error(`Error in onDeactivate for ${prev.manifest.id}:`, e)
          }
        }
      }

      // Activate new
      activeTaskId = taskId
      try {
        runningApp.instance.onActivate?.()
      } catch (e) {
        console.error(`Error in onActivate for ${runningApp.manifest.id}:`, e)
      }

      publishEvent('app.activated', { appId: runningApp.manifest.id, taskId })
    },

    getActiveApp(): RunningApp | undefined {
      if (!activeTaskId) return undefined
      return runningApps.get(activeTaskId)
    }
  }

  return runtime
}

