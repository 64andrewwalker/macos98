/**
 * VFS (Virtual File System) Types - Kernel Layer
 *
 * Provides Unix-like file system abstraction with IndexedDB persistence.
 * Based on design-docs/04-kernel-layer-spec.md
 */

import type { Unsubscribe } from '../event-bus/types'

export interface VfsNode {
  /** Unique identifier */
  id: string
  /** Node type */
  type: 'file' | 'directory'
  /** File or directory name */
  name: string
  /** Parent directory ID, null for root */
  parentId: string | null
  /** Full path (cached for performance) */
  path: string
  /** Creation timestamp */
  createdAt: number
  /** Last modification timestamp */
  updatedAt: number
  /** MIME type (files only) */
  mimeType?: string
  /** File size in bytes (files only) */
  size?: number
  /** Reference to content in separate store (files only) */
  contentId?: string
}

export interface VfsStat {
  type: 'file' | 'directory'
  name: string
  path: string
  size: number
  mimeType?: string
  createdAt: Date
  updatedAt: Date
}

export interface VfsEvent {
  type: 'create' | 'update' | 'delete' | 'rename'
  path: string
  /** Previous path for rename events */
  oldPath?: string
}

export type VfsWatchCallback = (event: VfsEvent) => void

export interface VirtualFileSystem {
  // Directory operations
  /**
   * Create a directory at the given path
   * Creates parent directories if they don't exist
   */
  mkdir(path: string): Promise<void>

  /**
   * List entries in a directory
   * @returns Array of entry names (not full paths)
   */
  readdir(path: string): Promise<string[]>

  /**
   * Remove an empty directory
   * @throws if directory is not empty
   */
  rmdir(path: string): Promise<void>

  // File operations
  /**
   * Read file contents
   * @returns ArrayBuffer for binary, string for text
   */
  readFile(path: string): Promise<ArrayBuffer | string>

  /**
   * Read file as text
   * @returns UTF-8 decoded string
   */
  readTextFile(path: string): Promise<string>

  /**
   * Write data to a file
   * Creates the file if it doesn't exist
   * Creates parent directories if needed
   */
  writeFile(path: string, data: ArrayBuffer | string): Promise<void>

  /**
   * Delete a file
   */
  deleteFile(path: string): Promise<void>

  // Common operations
  /**
   * Get file/directory metadata
   */
  stat(path: string): Promise<VfsStat>

  /**
   * Check if path exists
   */
  exists(path: string): Promise<boolean>

  /**
   * Rename or move a file/directory
   */
  rename(oldPath: string, newPath: string): Promise<void>

  /**
   * Copy a file/directory
   */
  copy(srcPath: string, destPath: string): Promise<void>

  // Watching
  /**
   * Watch a path for changes
   * @returns Unsubscribe function
   */
  watch(path: string, callback: VfsWatchCallback): Unsubscribe
}

// Error codes matching POSIX conventions
export class VfsError extends Error {
  code: VfsErrorCode
  path?: string

  constructor(code: VfsErrorCode, message: string, path?: string) {
    super(message)
    this.name = 'VfsError'
    this.code = code
    this.path = path
  }
}

export type VfsErrorCode =
  | 'ENOENT'     // No such file or directory
  | 'EEXIST'     // File/directory already exists
  | 'ENOTDIR'    // Not a directory
  | 'EISDIR'     // Is a directory (when file expected)
  | 'ENOTEMPTY'  // Directory not empty
  | 'EINVAL'     // Invalid argument

