/**
 * Kernel Layer
 *
 * Provides OS-like abstractions for the macOS 98 simulation:
 * - EventBus: Publish/subscribe for system events and app IPC
 * - TaskManager: App lifecycle management
 * - VFS: Virtual file system with persistence
 * - Permissions: App permission system
 */

// EventBus
export { createEventBus } from './event-bus'
export type {
  EventBus,
  EventChannel,
  EventCallback,
  Unsubscribe,
  SystemEvents
} from './event-bus'

// TaskManager
export { createTaskManager } from './task-manager'
export type {
  TaskManager,
  Task,
  TaskState,
  TaskStateChangeCallback
} from './task-manager'

// VFS
export { createVfs, resetVfs, VfsError } from './vfs'
export type {
  VirtualFileSystem,
  VfsNode,
  VfsStat,
  VfsEvent,
  VfsErrorCode,
  VfsWatchCallback
} from './vfs'

// Permissions
export { createPermissionManager } from './permissions'
export type {
  PermissionManager,
  PermissionAppManifest,
  AppPermissions,
  PathPermission,
  SystemService
} from './permissions'
