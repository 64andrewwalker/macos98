/**
 * AppManifest Types - App Framework Layer
 *
 * Declares application metadata, permissions, and capabilities.
 * Based on design-docs/06-app-framework-layer-spec.md
 */

import type { PathPermission } from '../../kernel/permissions/types'

/**
 * Application manifest - declares metadata and permissions
 */
export interface AppManifest {
  /** Unique application identifier (e.g., 'finder', 'calculator') */
  id: string

  /** Display name (e.g., 'Finder', 'Calculator') */
  name: string

  /** Semantic version (e.g., '1.0.0') */
  version: string

  /** Icon path or asset */
  icon: string

  /** Permission declarations */
  permissions?: AppPermissionDeclaration

  /** Menu configuration */
  menus?: AppMenu[]

  /** File type associations */
  fileAssociations?: FileAssociation[]

  /** Window configuration */
  window?: WindowConfig
}

/**
 * Permission declarations for an app
 */
export interface AppPermissionDeclaration {
  /** File system access paths */
  fs?: PathPermission[]

  /** System services the app needs */
  services?: string[]
}

/**
 * Menu structure for an app
 */
export interface AppMenu {
  id: string
  label: string
  items: AppMenuItem[]
}

/**
 * Menu item types
 */
export type AppMenuItem =
  | { type: 'action'; label: string; action: string; shortcut?: string; disabled?: boolean }
  | { type: 'separator' }
  | { type: 'submenu'; label: string; items: AppMenuItem[] }

/**
 * File association - which file types this app can open
 */
export interface FileAssociation {
  /** MIME types this app handles */
  mimeTypes: string[]

  /** File extensions this app handles (with dot, e.g., '.txt') */
  extensions: string[]

  /** Role: viewer (read-only) or editor (read-write) */
  role: 'viewer' | 'editor'
}

/**
 * Default window configuration
 */
export interface WindowConfig {
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number
  resizable?: boolean
}

/**
 * Manifest validation result
 */
export interface ManifestValidationResult {
  valid: boolean
  errors: ManifestValidationError[]
}

/**
 * Validation error details
 */
export interface ManifestValidationError {
  field: string
  message: string
}

