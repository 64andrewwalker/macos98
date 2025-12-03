/**
 * AppManifest Module - App Framework Layer
 */

export {
  validateManifest,
  createManifest,
  createManifestRegistry,
  type ManifestRegistry
} from './manifest'

export type {
  AppManifest,
  AppPermissionDeclaration,
  AppMenu,
  AppMenuItem,
  FileAssociation,
  WindowConfig,
  ManifestValidationResult,
  ManifestValidationError
} from './types'

