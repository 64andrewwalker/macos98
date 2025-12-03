/**
 * App Framework Layer
 *
 * Provides application lifecycle management:
 * - AppManifest: App metadata and permissions
 * - AppContext: Managed resources for apps
 * - AppRuntime: Launch/terminate apps
 *
 * Based on design-docs/06-app-framework-layer-spec.md
 */

// Manifest
export {
  validateManifest,
  createManifest,
  createManifestRegistry,
  type ManifestRegistry,
  type AppManifest,
  type AppPermissionDeclaration,
  type AppMenu,
  type AppMenuItem,
  type FileAssociation,
  type WindowConfig,
  type ManifestValidationResult,
  type ManifestValidationError
} from './manifest'

// Context
export {
  createAppContext,
  type AppContext,
  type AppContextDependencies,
  type ScopedFileSystem,
  type AppEventHandler
} from './context'

// Runtime
export {
  createAppRuntime,
  type AppRuntime,
  type AppRuntimeDependencies,
  type AppFactory,
  type AppInstance,
  type LaunchOptions,
  type RunningApp
} from './runtime'

