/**
 * Storage Adapter Implementation - Platform Layer
 *
 * Encapsulates IndexedDB with a simple async interface.
 * Includes in-memory fallback for testing environments.
 * Based on design-docs/03-platform-layer-spec.md
 */

import type { StorageAdapter, Database, Transaction, UpgradeFn } from './types'

// In-memory storage for testing (when IndexedDB is problematic)
const inMemoryDatabases = new Map<string, Map<string, Map<IDBValidKey, unknown>>>()

// Flag to use in-memory storage (set to true for testing)
let useInMemory = false

/**
 * Enable in-memory mode (for testing)
 */
export function enableInMemoryMode(): void {
  useInMemory = true
}

/**
 * Disable in-memory mode (use real IndexedDB)
 */
export function disableInMemoryMode(): void {
  useInMemory = false
}

/**
 * Check if in-memory mode is enabled
 */
export function isInMemoryMode(): boolean {
  return useInMemory
}

/**
 * In-memory Database implementation for testing
 */
class InMemoryDatabase implements Database {
  private stores: Map<string, Map<IDBValidKey, unknown>>
  readonly name: string
  private closed = false

  constructor(name: string, storeNames: string[]) {
    this.name = name
    this.stores = new Map()
    for (const storeName of storeNames) {
      this.stores.set(storeName, new Map())
    }
    inMemoryDatabases.set(name, this.stores)
  }

  private getStore(storeName: string): Map<IDBValidKey, unknown> {
    const store = this.stores.get(storeName)
    if (!store) {
      throw new Error(`Object store "${storeName}" not found`)
    }
    return store
  }

  _close(): void {
    this.closed = true
  }

  get _isClosed(): boolean {
    return this.closed
  }

  async get<T>(store: string, key: IDBValidKey): Promise<T | undefined> {
    return this.getStore(store).get(key) as T | undefined
  }

  async put<T>(store: string, key: IDBValidKey, value: T): Promise<void> {
    this.getStore(store).set(key, value)
  }

  async delete(store: string, key: IDBValidKey): Promise<void> {
    this.getStore(store).delete(key)
  }

  async clear(store: string): Promise<void> {
    this.getStore(store).clear()
  }

  async getAll<T>(store: string): Promise<T[]> {
    return Array.from(this.getStore(store).values()) as T[]
  }

  async getAllKeys(store: string): Promise<IDBValidKey[]> {
    return Array.from(this.getStore(store).keys())
  }

  async transaction<T>(
    _stores: string[],
    _mode: 'readonly' | 'readwrite',
    fn: (tx: Transaction) => Promise<T>
  ): Promise<T> {
    const txProxy: Transaction = {
      get: async <V>(store: string, key: IDBValidKey) => {
        return this.get<V>(store, key)
      },
      put: async <V>(store: string, key: IDBValidKey, value: V) => {
        return this.put(store, key, value)
      },
      delete: async (store: string, key: IDBValidKey) => {
        return this.delete(store, key)
      },
      getAll: async <V>(store: string) => {
        return this.getAll<V>(store)
      }
    }
    return fn(txProxy)
  }
}

/**
 * Real IndexedDB Database implementation
 */
class IndexedDBDatabase implements Database {
  private idb: IDBDatabase
  private closed = false

  constructor(idb: IDBDatabase) {
    this.idb = idb
  }

  get name(): string {
    return this.idb.name
  }

  get _isClosed(): boolean {
    return this.closed
  }

  _close(): void {
    if (!this.closed) {
      this.idb.close()
      this.closed = true
    }
  }

  get<T>(store: string, key: IDBValidKey): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      try {
        const tx = this.idb.transaction(store, 'readonly')
        const objectStore = tx.objectStore(store)
        const request = objectStore.get(key)

        request.onsuccess = () => resolve(request.result as T | undefined)
        request.onerror = () => reject(request.error)
        tx.onerror = () => reject(tx.error)
      } catch (err) {
        reject(err)
      }
    })
  }

  put<T>(store: string, key: IDBValidKey, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const tx = this.idb.transaction(store, 'readwrite')
        const objectStore = tx.objectStore(store)
        objectStore.put(value, key)

        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      } catch (err) {
        reject(err)
      }
    })
  }

  delete(store: string, key: IDBValidKey): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const tx = this.idb.transaction(store, 'readwrite')
        const objectStore = tx.objectStore(store)
        objectStore.delete(key)

        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      } catch (err) {
        reject(err)
      }
    })
  }

  clear(store: string): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const tx = this.idb.transaction(store, 'readwrite')
        const objectStore = tx.objectStore(store)
        objectStore.clear()

        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      } catch (err) {
        reject(err)
      }
    })
  }

  getAll<T>(store: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      try {
        const tx = this.idb.transaction(store, 'readonly')
        const objectStore = tx.objectStore(store)
        const request = objectStore.getAll()

        request.onsuccess = () => resolve(request.result as T[])
        request.onerror = () => reject(request.error)
        tx.onerror = () => reject(tx.error)
      } catch (err) {
        reject(err)
      }
    })
  }

  getAllKeys(store: string): Promise<IDBValidKey[]> {
    return new Promise((resolve, reject) => {
      try {
        const tx = this.idb.transaction(store, 'readonly')
        const objectStore = tx.objectStore(store)
        const request = objectStore.getAllKeys()

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
        tx.onerror = () => reject(tx.error)
      } catch (err) {
        reject(err)
      }
    })
  }

  transaction<T>(
    stores: string[],
    mode: 'readonly' | 'readwrite',
    fn: (tx: Transaction) => Promise<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      try {
        const tx = this.idb.transaction(stores, mode)
        let result: T

        const txProxy: Transaction = {
          get: <V>(store: string, key: IDBValidKey): Promise<V | undefined> => {
            return new Promise((res, rej) => {
              const request = tx.objectStore(store).get(key)
              request.onsuccess = () => res(request.result as V | undefined)
              request.onerror = () => rej(request.error)
            })
          },
          put: <V>(store: string, key: IDBValidKey, value: V): Promise<void> => {
            return new Promise((res, rej) => {
              const request = tx.objectStore(store).put(value, key)
              request.onsuccess = () => res()
              request.onerror = () => rej(request.error)
            })
          },
          delete: (store: string, key: IDBValidKey): Promise<void> => {
            return new Promise((res, rej) => {
              const request = tx.objectStore(store).delete(key)
              request.onsuccess = () => res()
              request.onerror = () => rej(request.error)
            })
          },
          getAll: <V>(store: string): Promise<V[]> => {
            return new Promise((res, rej) => {
              const request = tx.objectStore(store).getAll()
              request.onsuccess = () => res(request.result as V[])
              request.onerror = () => rej(request.error)
            })
          }
        }

        fn(txProxy)
          .then((r) => { result = r })
          .catch(reject)

        tx.oncomplete = () => resolve(result)
        tx.onerror = () => reject(tx.error)
      } catch (err) {
        reject(err)
      }
    })
  }
}

/**
 * Create a new StorageAdapter instance
 */
export function createStorageAdapter(): StorageAdapter {
  // Track created stores for in-memory mode
  const createdStores = new Map<string, string[]>()

  function open(dbName: string, version: number, upgrade: UpgradeFn): Promise<Database> {
    if (useInMemory) {
      return new Promise((resolve) => {
        // Check if database already exists
        const existingDb = inMemoryDatabases.get(dbName)
        const existingStores = createdStores.get(dbName) || []

        // Create a mock IDBDatabase for the upgrade function
        const mockStores = new Set<string>(existingStores)
        const mockIdb = {
          createObjectStore: (name: string) => {
            mockStores.add(name)
            return {} // Mock store
          },
          objectStoreNames: {
            contains: (name: string) => mockStores.has(name)
          }
        } as unknown as IDBDatabase

        // Run upgrade if needed
        const oldVersion = existingDb ? (createdStores.get(dbName)?.length ? 1 : 0) : 0
        if (oldVersion < version) {
          upgrade(mockIdb, oldVersion, version)
        }

        const storeNames = Array.from(mockStores)
        createdStores.set(dbName, storeNames)

        resolve(new InMemoryDatabase(dbName, storeNames))
      })
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, version)

      request.onerror = () => reject(request.error)

      request.onsuccess = () => {
        const idb = request.result
        resolve(new IndexedDBDatabase(idb))
      }

      request.onupgradeneeded = (event) => {
        const idb = request.result
        const oldVersion = event.oldVersion
        const newVersion = event.newVersion ?? version
        upgrade(idb, oldVersion, newVersion)
      }
    })
  }

  function close(db: Database): void {
    const impl = db as InMemoryDatabase | IndexedDBDatabase
    if (impl._close) {
      impl._close()
    }
  }

  function deleteDatabase(dbName: string): Promise<void> {
    if (useInMemory) {
      inMemoryDatabases.delete(dbName)
      createdStores.delete(dbName)
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(dbName)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  return {
    open,
    close,
    delete: deleteDatabase
  }
}
