/**
 * PermissionManager Implementation - Kernel Layer
 *
 * Permission system based on App Manifest declarations.
 * Checks App access to file paths and system services.
 * Based on design-docs/04-kernel-layer-spec.md
 */

import type {
  PermissionManager,
  PermissionAppManifest,
  AppPermissions
} from './types'

/**
 * Check if a path matches a permission path prefix
 */
function pathMatches(requestedPath: string, permissionPath: string): boolean {
  // Normalize paths
  const normalized = requestedPath.replace(/\/+$/, '')
  const permNormalized = permissionPath.replace(/\/+$/, '')

  // Exact match or prefix match
  return normalized === permNormalized || normalized.startsWith(permNormalized + '/')
}

/**
 * Create a new PermissionManager instance
 */
export function createPermissionManager(): PermissionManager {
  // Map of appId -> AppPermissions
  const appPermissions = new Map<string, AppPermissions>()

  function canAccessPath(appId: string, path: string, mode: 'read' | 'write'): boolean {
    const permissions = appPermissions.get(appId)
    if (!permissions) {
      // No registered permissions - deny by default
      return false
    }

    for (const pathPerm of permissions.fs) {
      if (pathMatches(path, pathPerm.path)) {
        // Check if the mode is allowed
        if (pathPerm.mode === 'readwrite') {
          return true
        }
        if (pathPerm.mode === mode) {
          return true
        }
      }
    }

    return false
  }

  function canUseService(appId: string, service: string): boolean {
    const permissions = appPermissions.get(appId)
    if (!permissions) {
      return false
    }

    return permissions.services.includes(service)
  }

  function registerApp(appId: string, manifest: PermissionAppManifest): void {
    const permissions: AppPermissions = {
      fs: manifest.permissions?.fs || [],
      services: manifest.permissions?.services || []
    }

    appPermissions.set(appId, permissions)
  }

  function unregisterApp(appId: string): void {
    appPermissions.delete(appId)
  }

  function getAppPermissions(appId: string): AppPermissions | undefined {
    return appPermissions.get(appId)
  }

  return {
    canAccessPath,
    canUseService,
    registerApp,
    unregisterApp,
    getAppPermissions
  }
}

