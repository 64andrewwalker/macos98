/**
 * PermissionManager Tests - Kernel Layer
 *
 * Tests for app permission system.
 * Based on design-docs/04-kernel-layer-spec.md
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { createPermissionManager } from './permissions'
import type { PermissionManager, PermissionAppManifest } from './types'

describe('PermissionManager', () => {
  let pm: PermissionManager

  beforeEach(() => {
    pm = createPermissionManager()
  })

  describe('registerApp / unregisterApp', () => {
    it('should register an app with its permissions', () => {
      const manifest: PermissionAppManifest = {
        id: 'finder',
        name: 'Finder',
        version: '1.0.0',
        permissions: {
          fs: [{ path: '/Users', mode: 'readwrite' }],
          services: ['clipboard']
        }
      }

      pm.registerApp('finder', manifest)

      const perms = pm.getAppPermissions('finder')
      expect(perms).toBeDefined()
      expect(perms?.fs).toHaveLength(1)
      expect(perms?.services).toContain('clipboard')
    })

    it('should unregister an app', () => {
      const manifest: PermissionAppManifest = {
        id: 'finder',
        name: 'Finder',
        version: '1.0.0',
        permissions: {}
      }

      pm.registerApp('finder', manifest)
      pm.unregisterApp('finder')

      expect(pm.getAppPermissions('finder')).toBeUndefined()
    })

    it('should return undefined for unregistered app', () => {
      expect(pm.getAppPermissions('unknown')).toBeUndefined()
    })
  })

  describe('canAccessPath', () => {
    beforeEach(() => {
      const manifest: PermissionAppManifest = {
        id: 'textedit',
        name: 'TextEdit',
        version: '1.0.0',
        permissions: {
          fs: [
            { path: '/Users/default/Documents', mode: 'readwrite' },
            { path: '/System/Library', mode: 'read' }
          ]
        }
      }
      pm.registerApp('textedit', manifest)
    })

    it('should allow read access to readwrite paths', () => {
      expect(pm.canAccessPath('textedit', '/Users/default/Documents', 'read')).toBe(true)
    })

    it('should allow write access to readwrite paths', () => {
      expect(pm.canAccessPath('textedit', '/Users/default/Documents', 'write')).toBe(true)
    })

    it('should allow access to subdirectories', () => {
      expect(pm.canAccessPath('textedit', '/Users/default/Documents/notes', 'read')).toBe(true)
      expect(pm.canAccessPath('textedit', '/Users/default/Documents/notes/file.txt', 'write')).toBe(true)
    })

    it('should allow read access to read-only paths', () => {
      expect(pm.canAccessPath('textedit', '/System/Library', 'read')).toBe(true)
    })

    it('should deny write access to read-only paths', () => {
      expect(pm.canAccessPath('textedit', '/System/Library', 'write')).toBe(false)
    })

    it('should deny access to non-permitted paths', () => {
      expect(pm.canAccessPath('textedit', '/Applications', 'read')).toBe(false)
      expect(pm.canAccessPath('textedit', '/System/Settings', 'read')).toBe(false)
    })

    it('should deny access for unregistered apps', () => {
      expect(pm.canAccessPath('unknown', '/Users/default/Documents', 'read')).toBe(false)
    })
  })

  describe('canUseService', () => {
    beforeEach(() => {
      const manifest: PermissionAppManifest = {
        id: 'textedit',
        name: 'TextEdit',
        version: '1.0.0',
        permissions: {
          services: ['clipboard', 'notifications']
        }
      }
      pm.registerApp('textedit', manifest)
    })

    it('should allow access to permitted services', () => {
      expect(pm.canUseService('textedit', 'clipboard')).toBe(true)
      expect(pm.canUseService('textedit', 'notifications')).toBe(true)
    })

    it('should deny access to non-permitted services', () => {
      expect(pm.canUseService('textedit', 'network')).toBe(false)
      expect(pm.canUseService('textedit', 'camera')).toBe(false)
    })

    it('should deny access for unregistered apps', () => {
      expect(pm.canUseService('unknown', 'clipboard')).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle app with no permissions', () => {
      const manifest: PermissionAppManifest = {
        id: 'minimal',
        name: 'Minimal App',
        version: '1.0.0',
        permissions: {}
      }
      pm.registerApp('minimal', manifest)

      expect(pm.canAccessPath('minimal', '/Users', 'read')).toBe(false)
      expect(pm.canUseService('minimal', 'clipboard')).toBe(false)
    })

    it('should handle paths with trailing slashes', () => {
      const manifest: PermissionAppManifest = {
        id: 'finder',
        name: 'Finder',
        version: '1.0.0',
        permissions: {
          fs: [{ path: '/Users/', mode: 'read' }]
        }
      }
      pm.registerApp('finder', manifest)

      expect(pm.canAccessPath('finder', '/Users', 'read')).toBe(true)
      expect(pm.canAccessPath('finder', '/Users/', 'read')).toBe(true)
      expect(pm.canAccessPath('finder', '/Users/default', 'read')).toBe(true)
    })

    it('should not match partial path names', () => {
      const manifest: PermissionAppManifest = {
        id: 'app',
        name: 'App',
        version: '1.0.0',
        permissions: {
          fs: [{ path: '/User', mode: 'read' }]
        }
      }
      pm.registerApp('app', manifest)

      // /Users should not match /User permission
      expect(pm.canAccessPath('app', '/Users', 'read')).toBe(false)
    })
  })
})
