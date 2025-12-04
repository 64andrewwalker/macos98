/**
 * System Info Types - Platform Layer
 *
 * Detects browser capabilities and provides system-level information.
 * Based on design-docs/03-platform-layer-spec.md
 */

export interface StorageEstimate {
  /** Total storage quota in bytes */
  quota: number
  /** Currently used storage in bytes */
  usage: number
}

/**
 * System information and capability detection
 */
export interface SystemInfo {
  // Capability detection (static properties)
  /** Whether IndexedDB is supported */
  readonly supportsIndexedDB: boolean
  /** Whether Origin Private File System is supported */
  readonly supportsOPFS: boolean
  /** Whether Web Workers are supported */
  readonly supportsWebWorker: boolean
  /** Whether Shadow DOM is supported */
  readonly supportsShadowDOM: boolean
  /** Whether Clipboard API is supported */
  readonly supportsClipboard: boolean
  /** Whether requestIdleCallback is supported */
  readonly supportsIdleCallback: boolean

  // Storage quota
  /**
   * Get storage usage estimate
   * @returns Promise with quota and usage in bytes
   */
  getStorageEstimate(): Promise<StorageEstimate>

  // User agent info
  /** Browser user agent string */
  readonly userAgent: string
  /** Operating system platform */
  readonly platform: string

  // Viewport
  /** Current viewport width in pixels */
  readonly viewportWidth: number
  /** Current viewport height in pixels */
  readonly viewportHeight: number
  /** Device pixel ratio (for retina displays) */
  readonly devicePixelRatio: number

  // Additional system info
  /** Number of logical CPU cores */
  readonly hardwareConcurrency: number
  /** Whether running in secure context (HTTPS) */
  readonly isSecureContext: boolean
  /** Browser language */
  readonly language: string
  /** Whether online */
  readonly isOnline: boolean

  // Methods
  /**
   * Refresh dynamic properties (viewport, online status)
   * Call after window resize or network change
   */
  refresh(): void
}

