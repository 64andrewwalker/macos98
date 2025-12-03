/**
 * Storage Module - Platform Layer
 */

export {
  createStorageAdapter,
  enableInMemoryMode,
  disableInMemoryMode,
  isInMemoryMode
} from './storage'
export type {
  StorageAdapter,
  Database,
  Transaction,
  UpgradeFn
} from './types'

