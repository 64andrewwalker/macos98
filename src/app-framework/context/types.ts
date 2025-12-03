/**
 * AppContext Types - App Framework Layer
 *
 * Application execution context with resource management.
 * Based on design-docs/06-app-framework-layer-spec.md
 */

import type { AppManifest } from '../manifest'
import type { VirtualFileSystem } from '../../kernel/vfs/types'
import type { EventBus, Unsubscribe } from '../../kernel/event-bus/types'
import type { Window, OpenWindowOptions } from '../../ui-shell'

/**
 * Scoped file system - VFS with permission checking
 */
export interface ScopedFileSystem {
  readFile(path: string): Promise<ArrayBuffer | string>
  readTextFile(path: string): Promise<string>
  writeFile(path: string, data: ArrayBuffer | string): Promise<void>
  mkdir(path: string): Promise<void>
  readdir(path: string): Promise<string[]>
  stat(path: string): Promise<{ isDirectory: boolean; size: number; mtime: number }>
  exists(path: string): Promise<boolean>
  remove(path: string): Promise<void>
}

/**
 * Event handler type for AppContext
 */
export type AppEventHandler = (data: unknown) => void

/**
 * Application context - provides managed resources to apps
 */
export interface AppContext {
  // Identity
  readonly appId: string
  readonly taskId: string
  readonly manifest: AppManifest

  // Managed timers (auto-cleanup on dispose)
  setTimeout(callback: () => void, ms: number): number
  setInterval(callback: () => void, ms: number): number
  clearTimeout(id: number): void
  clearInterval(id: number): void

  // Managed event subscriptions
  addEventListener(event: string, handler: AppEventHandler): void
  removeEventListener(event: string, handler: AppEventHandler): void

  // Scoped file system (permission-checked)
  readonly fs: ScopedFileSystem

  // System services
  getService<T>(serviceName: string): T | undefined

  // Window operations
  openWindow(options: Omit<OpenWindowOptions, 'appId'>): Window
  closeWindow(windowId: string): void
  getWindows(): Window[]

  // Lifecycle callbacks
  onTerminate(callback: () => void): Unsubscribe

  // Resource cleanup (called by system)
  dispose(): void
}

/**
 * Dependencies for creating an AppContext
 */
export interface AppContextDependencies {
  appId: string
  taskId: string
  manifest: AppManifest
  vfs: VirtualFileSystem
  eventBus: EventBus
  windowManager: {
    openWindow(options: OpenWindowOptions): Window
    closeWindow(windowId: string): void
    getWindowsByApp(appId: string): Window[]
    closeAllWindows(appId: string): void
  }
  permissionChecker: {
    canAccessPath(appId: string, path: string, mode: 'read' | 'write'): boolean
    canUseService(appId: string, serviceName: string): boolean
  }
  services: Map<string, unknown>
}

