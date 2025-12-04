/**
 * VFS (Virtual File System) Implementation - Kernel Layer
 *
 * Provides Unix-like file system abstraction with IndexedDB persistence.
 * Uses Platform StorageAdapter for persistence, with in-memory fallback for testing.
 * Based on design-docs/04-kernel-layer-spec.md
 */

import type {
  VirtualFileSystem,
  VfsNode,
  VfsStat,
  VfsEvent,
  VfsWatchCallback
} from './types'
import { VfsError } from './types'
import type { Unsubscribe } from '../event-bus/types'
import type { StorageAdapter, Database } from '../../platform/storage/types'
import { createStorageAdapter, enableInMemoryMode, disableInMemoryMode, isInMemoryMode } from '../../platform/storage/storage'

// Database constants
const VFS_DB_NAME = 'macos98-vfs'
const VFS_DB_VERSION = 1
const NODES_STORE = 'nodes'
const CONTENT_STORE = 'content'

// Generate unique IDs
let nodeIdCounter = 0
function generateNodeId(): string {
  nodeIdCounter += 1
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `node_${nodeIdCounter}_${Date.now()}`
}

/**
 * Parse path into components
 */
function parsePath(path: string): string[] {
  if (!path.startsWith('/')) {
    throw new VfsError('EINVAL', `Invalid path: ${path}`, path)
  }
  return path.split('/').filter(Boolean)
}

/**
 * Join path components
 */
function joinPath(...parts: string[]): string {
  return '/' + parts.filter(Boolean).join('/')
}

/**
 * Get parent path
 */
function getParentPath(path: string): string {
  if (path === '/') return '/'
  const parts = parsePath(path)
  parts.pop()
  return joinPath(...parts) || '/'
}

/**
 * Get name from path
 */
function getNameFromPath(path: string): string {
  if (path === '/') return ''
  const parts = parsePath(path)
  return parts[parts.length - 1]
}

/**
 * Create default directory structure
 */
function createDefaultNodes(): VfsNode[] {
  const now = Date.now()

  return [
    { id: 'root', type: 'directory', name: '', parentId: null, path: '/', createdAt: now, updatedAt: now },
    { id: 'system', type: 'directory', name: 'System', parentId: 'root', path: '/System', createdAt: now, updatedAt: now },
    { id: 'system-settings', type: 'directory', name: 'Settings', parentId: 'system', path: '/System/Settings', createdAt: now, updatedAt: now },
    { id: 'system-library', type: 'directory', name: 'Library', parentId: 'system', path: '/System/Library', createdAt: now, updatedAt: now },
    { id: 'applications', type: 'directory', name: 'Applications', parentId: 'root', path: '/Applications', createdAt: now, updatedAt: now },
    { id: 'users', type: 'directory', name: 'Users', parentId: 'root', path: '/Users', createdAt: now, updatedAt: now },
    { id: 'users-default', type: 'directory', name: 'default', parentId: 'users', path: '/Users/default', createdAt: now, updatedAt: now },
    { id: 'users-default-desktop', type: 'directory', name: 'Desktop', parentId: 'users-default', path: '/Users/default/Desktop', createdAt: now, updatedAt: now },
    { id: 'users-default-documents', type: 'directory', name: 'Documents', parentId: 'users-default', path: '/Users/default/Documents', createdAt: now, updatedAt: now }
  ]
}

// Shared storage adapter instance
let sharedStorageAdapter: StorageAdapter | null = null
let sharedDb: Database | null = null

// In-memory cache for faster lookups (synced with IndexedDB)
let nodeCache: Map<string, VfsNode> | null = null
let contentCache: Map<string, ArrayBuffer | string> | null = null

/**
 * Enable in-memory mode for VFS (for testing)
 */
export function enableVfsInMemoryMode(): void {
  enableInMemoryMode()
}

/**
 * Disable in-memory mode (use real IndexedDB)
 */
export function disableVfsInMemoryMode(): void {
  disableInMemoryMode()
}

/**
 * Check if VFS is in in-memory mode
 */
export function isVfsInMemoryMode(): boolean {
  return isInMemoryMode()
}

/**
 * Initialize the database
 */
async function initDb(): Promise<Database> {
  if (sharedDb) {
    return sharedDb
  }

  if (!sharedStorageAdapter) {
    sharedStorageAdapter = createStorageAdapter()
  }

  sharedDb = await sharedStorageAdapter.open(VFS_DB_NAME, VFS_DB_VERSION, (db, oldVersion) => {
    if (oldVersion < 1) {
      // Create object stores
      if (!db.objectStoreNames.contains(NODES_STORE)) {
        db.createObjectStore(NODES_STORE)
      }
      if (!db.objectStoreNames.contains(CONTENT_STORE)) {
        db.createObjectStore(CONTENT_STORE)
      }
    }
  })

  return sharedDb
}

/**
 * Load all nodes from database into cache
 */
async function loadCache(db: Database): Promise<void> {
  if (nodeCache && contentCache) {
    return
  }

  nodeCache = new Map()
  contentCache = new Map()

  // Load nodes
  const nodes = await db.getAll<VfsNode>(NODES_STORE)
  for (const node of nodes) {
    nodeCache.set(node.path, node)
  }

  // If empty, initialize with default structure
  if (nodeCache.size === 0) {
    const defaultNodes = createDefaultNodes()
    for (const node of defaultNodes) {
      nodeCache.set(node.path, node)
      await db.put(NODES_STORE, node.path, node)
    }
  }

  // Load content
  const contentKeys = await db.getAllKeys(CONTENT_STORE)
  for (const key of contentKeys) {
    const data = await db.get<ArrayBuffer | string>(CONTENT_STORE, key)
    if (data !== undefined) {
      contentCache.set(key as string, data)
    }
  }
}

/**
 * Create a new VFS instance
 */
export async function createVfs(): Promise<VirtualFileSystem> {
  const db = await initDb()
  await loadCache(db)

  // Watchers: path -> Set of callbacks
  const watchers = new Map<string, Set<VfsWatchCallback>>()

  function notifyWatchers(event: VfsEvent): void {
    for (const [watchPath, callbacks] of watchers) {
      // Check if event path starts with watched path
      if (event.path.startsWith(watchPath) || event.path === watchPath) {
        for (const callback of callbacks) {
          callback(event)
        }
      }
    }
  }

  function getNodeByPath(path: string): VfsNode | null {
    return nodeCache!.get(path) || null
  }

  function getChildNodes(parentId: string): VfsNode[] {
    const result: VfsNode[] = []
    for (const node of nodeCache!.values()) {
      if (node.parentId === parentId) {
        result.push(node)
      }
    }
    return result
  }

  async function saveNode(node: VfsNode): Promise<void> {
    nodeCache!.set(node.path, node)
    await db.put(NODES_STORE, node.path, node)
  }

  async function deleteNode(path: string): Promise<void> {
    nodeCache!.delete(path)
    await db.delete(NODES_STORE, path)
  }

  async function saveContent(id: string, data: ArrayBuffer | string): Promise<void> {
    contentCache!.set(id, data)
    await db.put(CONTENT_STORE, id, data)
  }

  function getContent(id: string): ArrayBuffer | string | null {
    return contentCache!.get(id) ?? null
  }

  async function deleteContent(id: string): Promise<void> {
    contentCache!.delete(id)
    await db.delete(CONTENT_STORE, id)
  }

  // -- Public API --

  async function mkdir(path: string): Promise<void> {
    const existing = getNodeByPath(path)

    if (existing) {
      if (existing.type === 'file') {
        throw new VfsError('EEXIST', `File exists at path: ${path}`, path)
      }
      // Directory already exists, that's fine
      return
    }

    // Create parent directories if needed
    const parentPath = getParentPath(path)
    if (parentPath !== '/') {
      await mkdir(parentPath)
    }

    const parent = getNodeByPath(parentPath)
    if (!parent) {
      throw new VfsError('ENOENT', `Parent directory not found: ${parentPath}`, parentPath)
    }

    const now = Date.now()
    const node: VfsNode = {
      id: generateNodeId(),
      type: 'directory',
      name: getNameFromPath(path),
      parentId: parent.id,
      path,
      createdAt: now,
      updatedAt: now
    }

    await saveNode(node)
    notifyWatchers({ type: 'create', path })
  }

  async function readdir(path: string): Promise<string[]> {
    const node = getNodeByPath(path)

    if (!node) {
      throw new VfsError('ENOENT', `Directory not found: ${path}`, path)
    }

    if (node.type !== 'directory') {
      throw new VfsError('ENOTDIR', `Not a directory: ${path}`, path)
    }

    const children = getChildNodes(node.id)
    return children.map(child => child.name)
  }

  async function rmdir(path: string): Promise<void> {
    const node = getNodeByPath(path)

    if (!node) {
      throw new VfsError('ENOENT', `Directory not found: ${path}`, path)
    }

    if (node.type !== 'directory') {
      throw new VfsError('ENOTDIR', `Not a directory: ${path}`, path)
    }

    const children = getChildNodes(node.id)
    if (children.length > 0) {
      throw new VfsError('ENOTEMPTY', `Directory not empty: ${path}`, path)
    }

    await deleteNode(path)
    notifyWatchers({ type: 'delete', path })
  }

  async function writeFile(path: string, data: ArrayBuffer | string): Promise<void> {
    const existing = getNodeByPath(path)
    const isUpdate = existing != null

    // If exists and is a directory, error
    if (existing && existing.type === 'directory') {
      throw new VfsError('EISDIR', `Is a directory: ${path}`, path)
    }

    // Create parent directories if needed
    const parentPath = getParentPath(path)
    if (parentPath !== '/') {
      await mkdir(parentPath)
    }

    const parent = getNodeByPath(parentPath)
    if (!parent) {
      throw new VfsError('ENOENT', `Parent directory not found: ${parentPath}`, parentPath)
    }

    const now = Date.now()
    const contentId = existing?.contentId || generateNodeId()
    const size = typeof data === 'string' ? new TextEncoder().encode(data).length : data.byteLength

    const node: VfsNode = existing
      ? { ...existing, updatedAt: now, size, contentId }
      : {
          id: generateNodeId(),
          type: 'file',
          name: getNameFromPath(path),
          parentId: parent.id,
          path,
          createdAt: now,
          updatedAt: now,
          size,
          contentId,
          mimeType: 'text/plain' // Default for now
        }

    await saveContent(contentId, data)
    await saveNode(node)

    notifyWatchers({ type: isUpdate ? 'update' : 'create', path })
  }

  async function readFile(path: string): Promise<ArrayBuffer | string> {
    const node = getNodeByPath(path)

    if (!node) {
      throw new VfsError('ENOENT', `File not found: ${path}`, path)
    }

    if (node.type === 'directory') {
      throw new VfsError('EISDIR', `Is a directory: ${path}`, path)
    }

    if (!node.contentId) {
      return ''
    }

    const data = getContent(node.contentId)
    return data ?? ''
  }

  async function readTextFile(path: string): Promise<string> {
    const data = await readFile(path)
    if (typeof data === 'string') {
      return data
    }
    return new TextDecoder().decode(data)
  }

  async function deleteFileImpl(path: string): Promise<void> {
    const node = getNodeByPath(path)

    if (!node) {
      throw new VfsError('ENOENT', `File not found: ${path}`, path)
    }

    if (node.type === 'directory') {
      throw new VfsError('EISDIR', `Is a directory, use rmdir: ${path}`, path)
    }

    if (node.contentId) {
      await deleteContent(node.contentId)
    }
    await deleteNode(path)

    notifyWatchers({ type: 'delete', path })
  }

  async function stat(path: string): Promise<VfsStat> {
    const node = getNodeByPath(path)

    if (!node) {
      throw new VfsError('ENOENT', `Path not found: ${path}`, path)
    }

    return {
      type: node.type,
      name: node.name,
      path: node.path,
      size: node.size ?? 0,
      mimeType: node.mimeType,
      createdAt: new Date(node.createdAt),
      updatedAt: new Date(node.updatedAt)
    }
  }

  async function exists(path: string): Promise<boolean> {
    const node = getNodeByPath(path)
    return node != null
  }

  async function rename(oldPath: string, newPath: string): Promise<void> {
    const node = getNodeByPath(oldPath)

    if (!node) {
      throw new VfsError('ENOENT', `Path not found: ${oldPath}`, oldPath)
    }

    // Create parent of destination if needed
    const newParentPath = getParentPath(newPath)
    if (newParentPath !== '/') {
      await mkdir(newParentPath)
    }

    const newParent = getNodeByPath(newParentPath)
    if (!newParent) {
      throw new VfsError('ENOENT', `Destination parent not found: ${newParentPath}`, newParentPath)
    }

    // If it's a directory, update all children's paths
    if (node.type === 'directory') {
      await renameDirectory(node, newPath, newParent.id)
    } else {
      // Update the node
      await deleteNode(oldPath)
      const updatedNode: VfsNode = {
        ...node,
        name: getNameFromPath(newPath),
        parentId: newParent.id,
        path: newPath,
        updatedAt: Date.now()
      }
      await saveNode(updatedNode)
    }

    notifyWatchers({ type: 'rename', path: newPath, oldPath })
  }

  async function renameDirectory(node: VfsNode, newPath: string, newParentId: string): Promise<void> {
    // First get all children before modifying
    const children = getChildNodes(node.id)

    // Delete old path entry
    await deleteNode(node.path)

    // Update the directory itself
    const updatedNode: VfsNode = {
      ...node,
      name: getNameFromPath(newPath),
      parentId: newParentId,
      path: newPath,
      updatedAt: Date.now()
    }
    await saveNode(updatedNode)

    // Then update all children recursively
    for (const child of children) {
      const childNewPath = `${newPath}/${child.name}`
      if (child.type === 'directory') {
        await renameDirectory(child, childNewPath, node.id)
      } else {
        await deleteNode(child.path)
        const updatedChild: VfsNode = {
          ...child,
          path: childNewPath,
          updatedAt: Date.now()
        }
        await saveNode(updatedChild)
      }
    }
  }

  async function copy(srcPath: string, destPath: string): Promise<void> {
    const srcNode = getNodeByPath(srcPath)

    if (!srcNode) {
      throw new VfsError('ENOENT', `Source not found: ${srcPath}`, srcPath)
    }

    if (srcNode.type === 'file') {
      // Copy file
      const data = await readFile(srcPath)
      await writeFile(destPath, data)
    } else {
      // Copy directory recursively
      await mkdir(destPath)

      const children = getChildNodes(srcNode.id)
      for (const child of children) {
        const childSrcPath = `${srcPath}/${child.name}`
        const childDestPath = `${destPath}/${child.name}`
        await copy(childSrcPath, childDestPath)
      }
    }
  }

  function watch(path: string, callback: VfsWatchCallback): Unsubscribe {
    if (!watchers.has(path)) {
      watchers.set(path, new Set())
    }

    watchers.get(path)!.add(callback)

    return () => {
      const pathWatchers = watchers.get(path)
      if (pathWatchers) {
        pathWatchers.delete(callback)
        if (pathWatchers.size === 0) {
          watchers.delete(path)
        }
      }
    }
  }

  return {
    mkdir,
    readdir,
    rmdir,
    readFile,
    readTextFile,
    writeFile,
    deleteFile: deleteFileImpl,
    stat,
    exists,
    rename,
    copy,
    watch
  }
}

/**
 * Reset the VFS (for testing)
 */
export async function resetVfs(): Promise<void> {
  // Clear caches
  nodeCache = null
  contentCache = null

  // Close and delete database
  if (sharedDb && sharedStorageAdapter) {
    sharedStorageAdapter.close(sharedDb)
    await sharedStorageAdapter.delete(VFS_DB_NAME)
  }

  sharedDb = null
  sharedStorageAdapter = null
}
