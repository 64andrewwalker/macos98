/**
 * AppManifest Utilities - App Framework Layer
 *
 * Manifest validation and registry.
 */

import type {
  AppManifest,
  ManifestValidationResult,
  ManifestValidationError
} from './types'

// Semantic version regex
const SEMVER_REGEX = /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/

/**
 * Validate an AppManifest
 */
export function validateManifest(manifest: unknown): ManifestValidationResult {
  const errors: ManifestValidationError[] = []

  if (!manifest || typeof manifest !== 'object') {
    return { valid: false, errors: [{ field: '', message: 'Manifest must be an object' }] }
  }

  const m = manifest as Record<string, unknown>

  // Required fields
  if (!m.id || typeof m.id !== 'string') {
    errors.push({ field: 'id', message: 'id is required and must be a string' })
  } else if (!/^[a-z][a-z0-9-]*$/.test(m.id)) {
    errors.push({ field: 'id', message: 'id must be lowercase alphanumeric with hyphens, starting with a letter' })
  }

  if (!m.name || typeof m.name !== 'string') {
    errors.push({ field: 'name', message: 'name is required and must be a string' })
  }

  if (!m.version || typeof m.version !== 'string') {
    errors.push({ field: 'version', message: 'version is required and must be a string' })
  } else if (!SEMVER_REGEX.test(m.version)) {
    errors.push({ field: 'version', message: 'version must be a valid semantic version (e.g., 1.0.0)' })
  }

  if (!m.icon || typeof m.icon !== 'string') {
    errors.push({ field: 'icon', message: 'icon is required and must be a string' })
  }

  // Optional: permissions
  if (m.permissions !== undefined) {
    if (typeof m.permissions !== 'object' || m.permissions === null) {
      errors.push({ field: 'permissions', message: 'permissions must be an object' })
    } else {
      const perms = m.permissions as Record<string, unknown>

      if (perms.fs !== undefined && !Array.isArray(perms.fs)) {
        errors.push({ field: 'permissions.fs', message: 'permissions.fs must be an array' })
      }

      if (perms.services !== undefined && !Array.isArray(perms.services)) {
        errors.push({ field: 'permissions.services', message: 'permissions.services must be an array' })
      }
    }
  }

  // Optional: fileAssociations
  if (m.fileAssociations !== undefined) {
    if (!Array.isArray(m.fileAssociations)) {
      errors.push({ field: 'fileAssociations', message: 'fileAssociations must be an array' })
    } else {
      m.fileAssociations.forEach((assoc: unknown, index: number) => {
        if (!assoc || typeof assoc !== 'object') {
          errors.push({ field: `fileAssociations[${index}]`, message: 'must be an object' })
          return
        }
        const a = assoc as Record<string, unknown>
        if (!Array.isArray(a.mimeTypes) && !Array.isArray(a.extensions)) {
          errors.push({
            field: `fileAssociations[${index}]`,
            message: 'must have mimeTypes or extensions array'
          })
        }
        if (!a.role || (a.role !== 'viewer' && a.role !== 'editor')) {
          errors.push({
            field: `fileAssociations[${index}].role`,
            message: 'role must be "viewer" or "editor"'
          })
        }
      })
    }
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Create a valid manifest with defaults
 */
export function createManifest(partial: Partial<AppManifest> & { id: string; name: string }): AppManifest {
  return {
    version: '1.0.0',
    icon: `/icons/${partial.id}.png`,
    ...partial
  }
}

/**
 * ManifestRegistry - stores and retrieves app manifests
 */
export interface ManifestRegistry {
  register(manifest: AppManifest): void
  unregister(appId: string): void
  get(appId: string): AppManifest | undefined
  getAll(): AppManifest[]
  findByExtension(extension: string): AppManifest[]
  findByMimeType(mimeType: string): AppManifest[]
}

/**
 * Create a new ManifestRegistry
 */
export function createManifestRegistry(): ManifestRegistry {
  const manifests = new Map<string, AppManifest>()

  return {
    register(manifest: AppManifest): void {
      const validation = validateManifest(manifest)
      if (!validation.valid) {
        throw new Error(`Invalid manifest: ${validation.errors.map(e => e.message).join(', ')}`)
      }
      manifests.set(manifest.id, manifest)
    },

    unregister(appId: string): void {
      manifests.delete(appId)
    },

    get(appId: string): AppManifest | undefined {
      return manifests.get(appId)
    },

    getAll(): AppManifest[] {
      return Array.from(manifests.values())
    },

    findByExtension(extension: string): AppManifest[] {
      const ext = extension.startsWith('.') ? extension : `.${extension}`
      return Array.from(manifests.values()).filter(m =>
        m.fileAssociations?.some(fa => fa.extensions.includes(ext))
      )
    },

    findByMimeType(mimeType: string): AppManifest[] {
      return Array.from(manifests.values()).filter(m =>
        m.fileAssociations?.some(fa => fa.mimeTypes.includes(mimeType))
      )
    }
  }
}

