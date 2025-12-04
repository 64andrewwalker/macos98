/**
 * AppRuntime Types - App Framework Layer
 *
 * Application lifecycle management.
 * Based on design-docs/06-app-framework-layer-spec.md
 */

import type { AppManifest } from '../manifest'
import type { AppContext } from '../context'
import type { Task } from '../../kernel/task-manager/types'

/**
 * Application factory - creates an app instance with a context
 */
export type AppFactory = (ctx: AppContext) => AppInstance

/**
 * Application instance - lifecycle hooks and handlers
 */
export interface AppInstance {
  /** Called when app is launched */
  onLaunch?(): void | Promise<void>

  /** Called when app becomes foreground */
  onActivate?(): void

  /** Called when app goes to background */
  onDeactivate?(): void

  /** Called before app terminates */
  onTerminate?(): void | Promise<void>

  /** Handle menu actions */
  onMenuAction?(action: string): void

  /** Open a file (called after launch if file specified) */
  openFile?(path: string): void
}

/**
 * Options for launching an app
 */
export interface LaunchOptions {
  /** File to open after launch */
  file?: string

  /** Additional launch arguments */
  args?: Record<string, unknown>
}

/**
 * Running app info
 */
export interface RunningApp {
  manifest: AppManifest
  task: Task
  context: AppContext
  instance: AppInstance
}

/**
 * AppRuntime - manages app lifecycle
 */
export interface AppRuntime {
  // Registration
  registerApp(manifest: AppManifest, factory: AppFactory): void
  unregisterApp(appId: string): void

  // Lifecycle
  launchApp(appId: string, options?: LaunchOptions): Promise<Task>
  terminateApp(taskId: string): Promise<void>
  terminateAllApps(): Promise<void>

  // Queries
  getInstalledApps(): AppManifest[]
  getRunningApps(): RunningApp[]
  isAppRunning(appId: string): boolean
  getRunningInstance(taskId: string): RunningApp | undefined

  // File associations
  getAppForFile(path: string): AppManifest | undefined
  openFile(path: string): Promise<Task | undefined>

  // Foreground management
  activateApp(taskId: string): void
  getActiveApp(): RunningApp | undefined
}

/**
 * Dependencies for creating an AppRuntime
 */
export interface AppRuntimeDependencies {
  taskManager: {
    spawn(appId: string): Task
    kill(taskId: string): boolean
    getTask(taskId: string): Task | undefined
    getTasksByApp(appId: string): Task[]
  }
  createAppContext: (taskId: string, manifest: AppManifest) => AppContext
  eventBus: {
    publish(channel: string, event: string, data?: unknown): void
  }
}

