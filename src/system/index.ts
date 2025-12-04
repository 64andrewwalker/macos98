/**
 * System Module
 *
 * Main entry point for system initialization.
 */

export {
  initializeSystem,
  getSystemServices,
  shutdownSystem,
  type SystemServices
} from './bootstrap'

export {
  SystemProvider,
  type SystemProviderProps
} from './SystemContext'

export {
  useSystem,
  useAppRuntime,
  useSystemWindowManager,
  useEventBus,
  useVfs
} from './hooks'

