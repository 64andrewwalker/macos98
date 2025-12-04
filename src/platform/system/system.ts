/**
 * System Info Implementation - Platform Layer
 *
 * Detects browser capabilities and provides system-level information.
 * Based on design-docs/03-platform-layer-spec.md
 */

import type { SystemInfo, StorageEstimate } from './types'

/**
 * Create a new SystemInfo instance
 */
export function createSystemInfo(): SystemInfo {
  // Detect capabilities once at creation
  const supportsIndexedDB = typeof indexedDB !== 'undefined'
  const supportsOPFS = typeof navigator !== 'undefined' &&
    'storage' in navigator &&
    'getDirectory' in (navigator.storage || {})
  const supportsWebWorker = typeof Worker !== 'undefined'
  const supportsShadowDOM = typeof Element !== 'undefined' &&
    'attachShadow' in Element.prototype
  const supportsClipboard = typeof navigator !== 'undefined' &&
    'clipboard' in navigator
  const supportsIdleCallback = typeof requestIdleCallback !== 'undefined'

  // Static user agent info
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  const platform = typeof navigator !== 'undefined' ? navigator.platform : ''
  const hardwareConcurrency = typeof navigator !== 'undefined'
    ? navigator.hardwareConcurrency || 1
    : 1
  const isSecureContext = typeof window !== 'undefined'
    ? (window.isSecureContext ?? false)
    : false
  const language = typeof navigator !== 'undefined'
    ? navigator.language || 'en'
    : 'en'

  // Dynamic properties (updated on refresh)
  let viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024
  let viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768
  let devicePixelRatio = typeof window !== 'undefined' ? window.devicePixelRatio : 1
  let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true

  async function getStorageEstimate(): Promise<StorageEstimate> {
    if (typeof navigator !== 'undefined' &&
        'storage' in navigator &&
        'estimate' in (navigator.storage || {})) {
      try {
        const estimate = await navigator.storage.estimate()
        return {
          quota: estimate.quota ?? 0,
          usage: estimate.usage ?? 0
        }
      } catch {
        // Fall through to default
      }
    }

    // Fallback for environments without storage API
    return {
      quota: 0,
      usage: 0
    }
  }

  function refresh(): void {
    if (typeof window !== 'undefined') {
      viewportWidth = window.innerWidth
      viewportHeight = window.innerHeight
      devicePixelRatio = window.devicePixelRatio
    }
    if (typeof navigator !== 'undefined') {
      isOnline = navigator.onLine
    }
  }

  // Return object with getters for dynamic properties
  return Object.freeze({
    // Capabilities (static)
    supportsIndexedDB,
    supportsOPFS,
    supportsWebWorker,
    supportsShadowDOM,
    supportsClipboard,
    supportsIdleCallback,

    // Storage
    getStorageEstimate,

    // User agent (static)
    userAgent,
    platform,

    // Viewport (dynamic via getters)
    get viewportWidth() { return viewportWidth },
    get viewportHeight() { return viewportHeight },
    get devicePixelRatio() { return devicePixelRatio },

    // System info
    hardwareConcurrency,
    isSecureContext,
    language,
    get isOnline() { return isOnline },

    // Methods
    refresh
  })
}

