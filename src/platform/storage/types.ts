/**
 * Storage Adapter Types - Platform Layer
 *
 * Encapsulates IndexedDB with a simple async interface.
 * Based on design-docs/03-platform-layer-spec.md
 */

/**
 * Database upgrade function called when version changes
 */
export type UpgradeFn = (
  db: IDBDatabase,
  oldVersion: number,
  newVersion: number
) => void

/**
 * Transaction interface for atomic operations
 */
export interface Transaction {
  /** Get a value from a store */
  get<T>(store: string, key: IDBValidKey): Promise<T | undefined>
  /** Put a value into a store */
  put<T>(store: string, key: IDBValidKey, value: T): Promise<void>
  /** Delete a value from a store */
  delete(store: string, key: IDBValidKey): Promise<void>
  /** Get all values from a store */
  getAll<T>(store: string): Promise<T[]>
}

/**
 * Database instance with CRUD operations
 */
export interface Database {
  /** The underlying database name */
  readonly name: string

  // Basic CRUD
  /** Get a single value by key */
  get<T>(store: string, key: IDBValidKey): Promise<T | undefined>
  /** Put a value (insert or update) */
  put<T>(store: string, key: IDBValidKey, value: T): Promise<void>
  /** Delete a value by key */
  delete(store: string, key: IDBValidKey): Promise<void>
  /** Clear all values in a store */
  clear(store: string): Promise<void>

  // Bulk operations
  /** Get all values in a store */
  getAll<T>(store: string): Promise<T[]>
  /** Get all keys in a store */
  getAllKeys(store: string): Promise<IDBValidKey[]>

  // Transactions
  /**
   * Execute operations in a transaction
   * @param stores - Object stores to include in transaction
   * @param mode - Transaction mode
   * @param fn - Function to execute within transaction
   */
  transaction<T>(
    stores: string[],
    mode: 'readonly' | 'readwrite',
    fn: (tx: Transaction) => Promise<T>
  ): Promise<T>
}

/**
 * Storage adapter for managing IndexedDB databases
 */
export interface StorageAdapter {
  /**
   * Open or create a database
   * @param dbName - Database name
   * @param version - Schema version
   * @param upgrade - Migration function called on version change
   */
  open(dbName: string, version: number, upgrade: UpgradeFn): Promise<Database>

  /**
   * Close a database connection
   */
  close(db: Database): void

  /**
   * Delete a database entirely
   */
  delete(dbName: string): Promise<void>
}

