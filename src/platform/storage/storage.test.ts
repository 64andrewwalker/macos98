/**
 * Storage Adapter Tests - Platform Layer
 *
 * TDD tests based on design-docs/03-platform-layer-spec.md
 * Tests IndexedDB wrapper functionality.
 *
 * Run: pnpm test src/platform/storage/storage.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import type { StorageAdapter, Database } from './types'
import { createStorageAdapter, enableInMemoryMode, disableInMemoryMode } from './storage'

// Use in-memory mode for tests to avoid jsdom/fake-indexeddb issues
beforeAll(() => {
  enableInMemoryMode()
})

afterAll(() => {
  disableInMemoryMode()
})

const TEST_DB_NAME = 'test-storage-db'

describe('StorageAdapter', () => {
  let storage: StorageAdapter

  beforeEach(() => {
    storage = createStorageAdapter()
  })

  afterEach(async () => {
    // Clean up test database
    await storage.delete(TEST_DB_NAME)
  })

  describe('open', () => {
    it('should open a new database', async () => {
      const db = await storage.open(TEST_DB_NAME, 1, (idb) => {
        idb.createObjectStore('items')
      })

      expect(db).toBeDefined()
      expect(db.name).toBe(TEST_DB_NAME)
    })

    it('should call upgrade function on first open', async () => {
      let upgradeCalled = false
      let receivedOldVersion = -1
      let receivedNewVersion = -1

      await storage.open(TEST_DB_NAME, 1, (_idb, oldVersion, newVersion) => {
        upgradeCalled = true
        receivedOldVersion = oldVersion
        receivedNewVersion = newVersion
      })

      expect(upgradeCalled).toBe(true)
      expect(receivedOldVersion).toBe(0)
      expect(receivedNewVersion).toBe(1)
    })

    it('should call upgrade function on version bump', async () => {
      // First open at version 1
      const db1 = await storage.open(TEST_DB_NAME, 1, (idb) => {
        idb.createObjectStore('items')
      })
      storage.close(db1)

      // Upgrade to version 2
      let upgradeOldVersion = -1
      const db2 = await storage.open(TEST_DB_NAME, 2, (_idb, oldVersion) => {
        upgradeOldVersion = oldVersion
      })

      expect(upgradeOldVersion).toBe(1)
      storage.close(db2)
    })

    it('should not call upgrade when reopening same version', async () => {
      // First open
      const db1 = await storage.open(TEST_DB_NAME, 1, (idb) => {
        idb.createObjectStore('items')
      })
      storage.close(db1)

      // Reopen same version
      let upgradeCalled = false
      const db2 = await storage.open(TEST_DB_NAME, 1, () => {
        upgradeCalled = true
      })

      expect(upgradeCalled).toBe(false)
      storage.close(db2)
    })
  })

  describe('close', () => {
    it('should close database connection', async () => {
      const db = await storage.open(TEST_DB_NAME, 1, (idb) => {
        idb.createObjectStore('items')
      })

      // Should not throw
      expect(() => storage.close(db)).not.toThrow()
    })

    it('should handle closing already closed database', async () => {
      const db = await storage.open(TEST_DB_NAME, 1, (idb) => {
        idb.createObjectStore('items')
      })

      storage.close(db)
      // Second close should not throw
      expect(() => storage.close(db)).not.toThrow()
    })
  })

  describe('delete', () => {
    it('should delete an existing database', async () => {
      // Create database
      const db = await storage.open(TEST_DB_NAME, 1, (idb) => {
        idb.createObjectStore('items')
      })
      await db.put('items', 'key1', { data: 'value' })
      storage.close(db)

      // Delete database
      await storage.delete(TEST_DB_NAME)

      // Verify it's gone by opening fresh
      let wasUpgradeNeeded = false
      const db2 = await storage.open(TEST_DB_NAME, 1, () => {
        wasUpgradeNeeded = true
      })

      expect(wasUpgradeNeeded).toBe(true) // Upgrade runs because DB was deleted
      storage.close(db2)
    })

    it('should handle deleting non-existent database', async () => {
      // Should not throw
      await expect(storage.delete('nonexistent-db')).resolves.not.toThrow()
    })
  })
})

describe('Database', () => {
  let storage: StorageAdapter
  let db: Database

  beforeEach(async () => {
    storage = createStorageAdapter()
    db = await storage.open(TEST_DB_NAME, 1, (idb) => {
      idb.createObjectStore('items')
      idb.createObjectStore('users')
    })
  })

  afterEach(async () => {
    storage.close(db)
    await storage.delete(TEST_DB_NAME)
  })

  describe('put / get', () => {
    it('should put and get a value', async () => {
      await db.put('items', 'key1', { name: 'test' })

      const result = await db.get<{ name: string }>('items', 'key1')

      expect(result).toEqual({ name: 'test' })
    })

    it('should return undefined for non-existent key', async () => {
      const result = await db.get('items', 'nonexistent')

      expect(result).toBeUndefined()
    })

    it('should overwrite existing value', async () => {
      await db.put('items', 'key1', { name: 'original' })
      await db.put('items', 'key1', { name: 'updated' })

      const result = await db.get<{ name: string }>('items', 'key1')

      expect(result).toEqual({ name: 'updated' })
    })

    it('should handle different key types', async () => {
      await db.put('items', 'string-key', { type: 'string' })
      await db.put('items', 123, { type: 'number' })

      expect(await db.get('items', 'string-key')).toEqual({ type: 'string' })
      expect(await db.get('items', 123)).toEqual({ type: 'number' })
    })

    it('should handle complex values', async () => {
      const complexValue = {
        nested: { deep: { value: 42 } },
        array: [1, 2, 3],
        date: new Date('2025-01-01').toISOString(),
        null: null
      }

      await db.put('items', 'complex', complexValue)
      const result = await db.get('items', 'complex')

      expect(result).toEqual(complexValue)
    })
  })

  describe('delete', () => {
    it('should delete a value', async () => {
      await db.put('items', 'key1', { name: 'test' })
      expect(await db.get('items', 'key1')).toBeDefined()

      await db.delete('items', 'key1')

      expect(await db.get('items', 'key1')).toBeUndefined()
    })

    it('should handle deleting non-existent key', async () => {
      // Should not throw
      await expect(db.delete('items', 'nonexistent')).resolves.not.toThrow()
    })
  })

  describe('clear', () => {
    it('should clear all values in a store', async () => {
      await db.put('items', 'key1', { a: 1 })
      await db.put('items', 'key2', { b: 2 })
      await db.put('items', 'key3', { c: 3 })

      await db.clear('items')

      expect(await db.get('items', 'key1')).toBeUndefined()
      expect(await db.get('items', 'key2')).toBeUndefined()
      expect(await db.get('items', 'key3')).toBeUndefined()
    })

    it('should not affect other stores', async () => {
      await db.put('items', 'key1', { a: 1 })
      await db.put('users', 'user1', { name: 'Alice' })

      await db.clear('items')

      expect(await db.get('items', 'key1')).toBeUndefined()
      expect(await db.get('users', 'user1')).toEqual({ name: 'Alice' })
    })
  })

  describe('getAll', () => {
    it('should get all values in a store', async () => {
      await db.put('items', 'a', { id: 'a' })
      await db.put('items', 'b', { id: 'b' })
      await db.put('items', 'c', { id: 'c' })

      const all = await db.getAll<{ id: string }>('items')

      expect(all).toHaveLength(3)
      expect(all).toContainEqual({ id: 'a' })
      expect(all).toContainEqual({ id: 'b' })
      expect(all).toContainEqual({ id: 'c' })
    })

    it('should return empty array for empty store', async () => {
      const all = await db.getAll('items')

      expect(all).toEqual([])
    })
  })

  describe('getAllKeys', () => {
    it('should get all keys in a store', async () => {
      await db.put('items', 'key1', { a: 1 })
      await db.put('items', 'key2', { b: 2 })
      await db.put('items', 'key3', { c: 3 })

      const keys = await db.getAllKeys('items')

      expect(keys).toHaveLength(3)
      expect(keys).toContain('key1')
      expect(keys).toContain('key2')
      expect(keys).toContain('key3')
    })

    it('should return empty array for empty store', async () => {
      const keys = await db.getAllKeys('items')

      expect(keys).toEqual([])
    })
  })

  describe('transaction', () => {
    it('should execute operations in a transaction', async () => {
      await db.transaction(['items'], 'readwrite', async (tx) => {
        await tx.put('items', 'tx-key1', { value: 1 })
        await tx.put('items', 'tx-key2', { value: 2 })
      })

      expect(await db.get('items', 'tx-key1')).toEqual({ value: 1 })
      expect(await db.get('items', 'tx-key2')).toEqual({ value: 2 })
    })

    it('should return value from transaction', async () => {
      await db.put('items', 'existing', { count: 5 })

      const result = await db.transaction(['items'], 'readonly', async (tx) => {
        const item = await tx.get<{ count: number }>('items', 'existing')
        return item?.count ?? 0
      })

      expect(result).toBe(5)
    })

    it('should allow reading from multiple stores', async () => {
      await db.put('items', 'item1', { type: 'item' })
      await db.put('users', 'user1', { type: 'user' })

      const results = await db.transaction(['items', 'users'], 'readonly', async (tx) => {
        const item = await tx.get('items', 'item1')
        const user = await tx.get('users', 'user1')
        return { item, user }
      })

      expect(results.item).toEqual({ type: 'item' })
      expect(results.user).toEqual({ type: 'user' })
    })

    it('should support getAll in transaction', async () => {
      await db.put('items', 'a', { id: 'a' })
      await db.put('items', 'b', { id: 'b' })

      const all = await db.transaction(['items'], 'readonly', async (tx) => {
        return tx.getAll<{ id: string }>('items')
      })

      expect(all).toHaveLength(2)
    })
  })
})

describe('Database - Error Handling', () => {
  let storage: StorageAdapter
  let db: Database

  beforeEach(async () => {
    storage = createStorageAdapter()
    db = await storage.open(TEST_DB_NAME, 1, (idb) => {
      idb.createObjectStore('items')
    })
  })

  afterEach(async () => {
    storage.close(db)
    await storage.delete(TEST_DB_NAME)
  })

  it('should throw when accessing non-existent store', async () => {
    await expect(db.get('nonexistent-store', 'key')).rejects.toThrow()
  })

  it('should throw when putting to non-existent store', async () => {
    await expect(db.put('nonexistent-store', 'key', {})).rejects.toThrow()
  })
})

