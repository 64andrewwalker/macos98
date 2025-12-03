/**
 * VFS Module - Kernel Layer
 */

export { createVfs, resetVfs, enableVfsInMemoryMode, disableVfsInMemoryMode, isVfsInMemoryMode } from './vfs'
export { VfsError } from './types'
export type {
  VirtualFileSystem,
  VfsNode,
  VfsStat,
  VfsEvent,
  VfsErrorCode,
  VfsWatchCallback
} from './types'
