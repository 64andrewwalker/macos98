/**
 * Permissions Types - Kernel Layer
 *
 * Permission system based on App Manifest declarations.
 * Checks App access to file paths and system services.
 * Based on design-docs/04-kernel-layer-spec.md
 */

export interface PathPermission {
  /** Path prefix that the app can access */
  path: string
  /** Access mode */
  mode: 'read' | 'write' | 'readwrite'
}

export interface AppPermissions {
  /** File system path permissions */
  fs: PathPermission[]
  /** Allowed system services */
  services: string[]
}

/**
 * Minimal manifest interface for permission registration.
 * For full AppManifest, use app-framework/manifest/types.ts
 */
export interface PermissionAppManifest {
  /** Unique app identifier */
  id: string
  /** App display name */
  name: string
  /** Version string */
  version: string
  /** Icon path */
  icon?: string
  /** Permission declarations */
  permissions?: {
    fs?: PathPermission[]
    services?: string[]
  }
}

export interface PermissionManager {
  /**
   * Check if app can access a file path
   * @param appId - The app requesting access
   * @param path - The file path to check
   * @param mode - Read or write access
   */
  canAccessPath(appId: string, path: string, mode: 'read' | 'write'): boolean

  /**
   * Check if app can use a system service
   * @param appId - The app requesting access
   * @param service - The service name (e.g., 'clipboard', 'network')
   */
  canUseService(appId: string, service: string): boolean

  /**
   * Register an app's permissions from its manifest
   * Called when app is launched
   */
  registerApp(appId: string, manifest: PermissionAppManifest): void

  /**
   * Unregister an app's permissions
   * Called when app is terminated
   */
  unregisterApp(appId: string): void

  /**
   * Get the current permissions for an app
   */
  getAppPermissions(appId: string): AppPermissions | undefined
}

// Common system services
export type SystemService =
  | 'clipboard'     // Access system clipboard
  | 'notifications' // Show system notifications
  | 'network'       // Make network requests
  | 'storage'       // Access persistent storage beyond VFS
  | 'camera'        // Access camera (future)
  | 'microphone'    // Access microphone (future)

