/**
 * System Info Tests - Platform Layer
 *
 * TDD tests based on design-docs/03-platform-layer-spec.md
 * Tests browser capability detection and system information.
 *
 * Run: pnpm test src/platform/system/system.test.ts
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type { SystemInfo } from './types'
import { createSystemInfo } from './system'

describe('SystemInfo', () => {
  let system: SystemInfo

  beforeEach(() => {
    system = createSystemInfo()
  })

  describe('capability detection', () => {
    it('should detect IndexedDB support', () => {
      // jsdom supports IndexedDB (via fake-indexeddb in most setups)
      expect(system.supportsIndexedDB).toBeTypeOf('boolean')
    })

    it('should detect OPFS support', () => {
      expect(system.supportsOPFS).toBeTypeOf('boolean')
    })

    it('should detect WebWorker support', () => {
      expect(system.supportsWebWorker).toBeTypeOf('boolean')
    })

    it('should detect Shadow DOM support', () => {
      expect(system.supportsShadowDOM).toBeTypeOf('boolean')
    })

    it('should detect Clipboard API support', () => {
      expect(system.supportsClipboard).toBeTypeOf('boolean')
    })

    it('should detect requestIdleCallback support', () => {
      expect(system.supportsIdleCallback).toBeTypeOf('boolean')
    })
  })

  describe('storage estimate', () => {
    it('should return storage estimate with quota and usage', async () => {
      const estimate = await system.getStorageEstimate()

      expect(estimate).toHaveProperty('quota')
      expect(estimate).toHaveProperty('usage')
      expect(estimate.quota).toBeTypeOf('number')
      expect(estimate.usage).toBeTypeOf('number')
    })

    it('should have quota greater than or equal to zero', async () => {
      const estimate = await system.getStorageEstimate()

      expect(estimate.quota).toBeGreaterThanOrEqual(0)
    })

    it('should have usage greater than or equal to zero', async () => {
      const estimate = await system.getStorageEstimate()

      expect(estimate.usage).toBeGreaterThanOrEqual(0)
    })

    it('should have usage less than or equal to quota', async () => {
      const estimate = await system.getStorageEstimate()

      // Usage should never exceed quota (in normal cases)
      expect(estimate.usage).toBeLessThanOrEqual(estimate.quota)
    })
  })

  describe('user agent info', () => {
    it('should return user agent string', () => {
      expect(system.userAgent).toBeTypeOf('string')
      expect(system.userAgent.length).toBeGreaterThan(0)
    })

    it('should return platform string', () => {
      expect(system.platform).toBeTypeOf('string')
    })
  })

  describe('viewport', () => {
    it('should return viewport width', () => {
      expect(system.viewportWidth).toBeTypeOf('number')
      expect(system.viewportWidth).toBeGreaterThan(0)
    })

    it('should return viewport height', () => {
      expect(system.viewportHeight).toBeTypeOf('number')
      expect(system.viewportHeight).toBeGreaterThan(0)
    })

    it('should return device pixel ratio', () => {
      expect(system.devicePixelRatio).toBeTypeOf('number')
      expect(system.devicePixelRatio).toBeGreaterThan(0)
    })
  })

  describe('additional system info', () => {
    it('should return hardware concurrency', () => {
      expect(system.hardwareConcurrency).toBeTypeOf('number')
      expect(system.hardwareConcurrency).toBeGreaterThanOrEqual(1)
    })

    it('should return secure context status', () => {
      expect(system.isSecureContext).toBeTypeOf('boolean')
    })

    it('should return language', () => {
      expect(system.language).toBeTypeOf('string')
      expect(system.language.length).toBeGreaterThan(0)
    })

    it('should return online status', () => {
      expect(system.isOnline).toBeTypeOf('boolean')
    })
  })

  describe('refresh', () => {
    it('should not throw when called', () => {
      expect(() => system.refresh()).not.toThrow()
    })

    it('should update dynamic properties', () => {
      // Get initial values and verify they're valid
      expect(system.viewportWidth).toBeTypeOf('number')
      expect(system.viewportHeight).toBeTypeOf('number')

      // Refresh (in tests, values may not change, but shouldn't throw)
      system.refresh()

      // Properties should still be valid after refresh
      expect(system.viewportWidth).toBeTypeOf('number')
      expect(system.viewportHeight).toBeTypeOf('number')
    })
  })
})

describe('SystemInfo - Browser-specific Behavior', () => {
  let system: SystemInfo

  beforeEach(() => {
    system = createSystemInfo()
  })

  describe('jsdom environment', () => {
    it('should handle missing navigator.storage', async () => {
      // Even if navigator.storage is not available, should return fallback
      const estimate = await system.getStorageEstimate()

      expect(estimate.quota).toBeTypeOf('number')
      expect(estimate.usage).toBeTypeOf('number')
    })

    it('should handle missing requestIdleCallback', () => {
      // jsdom may not have requestIdleCallback
      expect(system.supportsIdleCallback).toBeTypeOf('boolean')
    })

    it('should provide sensible defaults for viewport in jsdom', () => {
      // jsdom has default viewport dimensions
      expect(system.viewportWidth).toBeGreaterThan(0)
      expect(system.viewportHeight).toBeGreaterThan(0)
    })
  })
})

describe('SystemInfo - Immutability', () => {
  let system: SystemInfo

  beforeEach(() => {
    system = createSystemInfo()
  })

  it('should have readonly capability properties', () => {
    // These should not be assignable (TypeScript enforces, but runtime check)
    const originalValue = system.supportsIndexedDB

    // @ts-expect-error - Testing runtime behavior
    expect(() => { system.supportsIndexedDB = !originalValue }).toThrow()
  })
})

