/**
 * VFS (Virtual File System) Tests - Kernel Layer
 *
 * TDD tests based on design-docs/04-kernel-layer-spec.md
 * These tests define the expected behavior BEFORE implementation.
 *
 * Run: pnpm test src/kernel/vfs/vfs.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import type { VirtualFileSystem } from './types'
import { VfsError } from './types'

import { createVfs, resetVfs, enableVfsInMemoryMode, disableVfsInMemoryMode } from './vfs'

// Use in-memory mode for testing
beforeAll(() => {
  enableVfsInMemoryMode()
})

afterAll(() => {
  disableVfsInMemoryMode()
})

describe('VFS - Directory Operations', () => {
  let vfs: VirtualFileSystem

  beforeEach(async () => {
    await resetVfs()
    vfs = await createVfs()
  })

  afterEach(async () => {
    await resetVfs()
  })

  describe('mkdir', () => {
    it('should create a directory at given path', async () => {
      await vfs.mkdir('/test')

      const exists = await vfs.exists('/test')
      expect(exists).toBe(true)
    })

    it('should create nested directories', async () => {
      await vfs.mkdir('/parent/child/grandchild')

      expect(await vfs.exists('/parent')).toBe(true)
      expect(await vfs.exists('/parent/child')).toBe(true)
      expect(await vfs.exists('/parent/child/grandchild')).toBe(true)
    })

    it('should not throw if directory already exists', async () => {
      await vfs.mkdir('/existing')

      await expect(vfs.mkdir('/existing')).resolves.not.toThrow()
    })

    it('should throw EEXIST if file exists at path', async () => {
      await vfs.writeFile('/somefile', 'content')

      await expect(vfs.mkdir('/somefile')).rejects.toThrow(VfsError)
      await expect(vfs.mkdir('/somefile')).rejects.toMatchObject({ code: 'EEXIST' })
    })
  })

  describe('readdir', () => {
    it('should return list of entry names in directory', async () => {
      await vfs.mkdir('/mydir')
      await vfs.writeFile('/mydir/file1.txt', 'a')
      await vfs.writeFile('/mydir/file2.txt', 'b')
      await vfs.mkdir('/mydir/subdir')

      const entries = await vfs.readdir('/mydir')

      expect(entries).toContain('file1.txt')
      expect(entries).toContain('file2.txt')
      expect(entries).toContain('subdir')
      expect(entries).toHaveLength(3)
    })

    it('should return empty array for empty directory', async () => {
      await vfs.mkdir('/empty')

      const entries = await vfs.readdir('/empty')

      expect(entries).toEqual([])
    })

    it('should throw ENOENT for non-existent directory', async () => {
      await expect(vfs.readdir('/nonexistent')).rejects.toThrow(VfsError)
      await expect(vfs.readdir('/nonexistent')).rejects.toMatchObject({ code: 'ENOENT' })
    })

    it('should throw ENOTDIR if path is a file', async () => {
      await vfs.writeFile('/afile', 'data')

      await expect(vfs.readdir('/afile')).rejects.toThrow(VfsError)
      await expect(vfs.readdir('/afile')).rejects.toMatchObject({ code: 'ENOTDIR' })
    })
  })

  describe('rmdir', () => {
    it('should remove an empty directory', async () => {
      await vfs.mkdir('/toremove')
      expect(await vfs.exists('/toremove')).toBe(true)

      await vfs.rmdir('/toremove')

      expect(await vfs.exists('/toremove')).toBe(false)
    })

    it('should throw ENOTEMPTY if directory has contents', async () => {
      await vfs.mkdir('/notempty')
      await vfs.writeFile('/notempty/file.txt', 'data')

      await expect(vfs.rmdir('/notempty')).rejects.toThrow(VfsError)
      await expect(vfs.rmdir('/notempty')).rejects.toMatchObject({ code: 'ENOTEMPTY' })
    })

    it('should throw ENOENT for non-existent directory', async () => {
      await expect(vfs.rmdir('/ghost')).rejects.toMatchObject({ code: 'ENOENT' })
    })

    it('should throw ENOTDIR if path is a file', async () => {
      await vfs.writeFile('/notadir', 'content')

      await expect(vfs.rmdir('/notadir')).rejects.toMatchObject({ code: 'ENOTDIR' })
    })
  })
})

describe('VFS - File Operations', () => {
  let vfs: VirtualFileSystem

  beforeEach(async () => {
    await resetVfs()
    vfs = await createVfs()
    await vfs.mkdir('/test')
  })

  afterEach(async () => {
    await resetVfs()
  })

  describe('writeFile / readFile', () => {
    it('should write and read a text file', async () => {
      await vfs.writeFile('/test/hello.txt', 'Hello, World!')

      const content = await vfs.readTextFile('/test/hello.txt')

      expect(content).toBe('Hello, World!')
    })

    it('should overwrite existing file', async () => {
      await vfs.writeFile('/test/file.txt', 'original')
      await vfs.writeFile('/test/file.txt', 'updated')

      const content = await vfs.readTextFile('/test/file.txt')

      expect(content).toBe('updated')
    })

    it('should create parent directories if needed', async () => {
      await vfs.writeFile('/deep/nested/path/file.txt', 'deep content')

      expect(await vfs.exists('/deep/nested/path/file.txt')).toBe(true)
      expect(await vfs.exists('/deep/nested/path')).toBe(true)
    })

    it('should handle empty file', async () => {
      await vfs.writeFile('/test/empty.txt', '')

      const content = await vfs.readTextFile('/test/empty.txt')

      expect(content).toBe('')
    })

    it('should handle unicode content', async () => {
      const unicodeContent = '你好世界 🌍 مرحبا'
      await vfs.writeFile('/test/unicode.txt', unicodeContent)

      const content = await vfs.readTextFile('/test/unicode.txt')

      expect(content).toBe(unicodeContent)
    })

    it('should throw ENOENT when reading non-existent file', async () => {
      await expect(vfs.readFile('/nonexistent')).rejects.toThrow(VfsError)
      await expect(vfs.readFile('/nonexistent')).rejects.toMatchObject({ code: 'ENOENT' })
    })

    it('should throw EISDIR when reading a directory', async () => {
      await vfs.mkdir('/adir')

      await expect(vfs.readFile('/adir')).rejects.toMatchObject({ code: 'EISDIR' })
    })
  })

  describe('deleteFile', () => {
    it('should delete an existing file', async () => {
      await vfs.writeFile('/test/todelete.txt', 'bye')
      expect(await vfs.exists('/test/todelete.txt')).toBe(true)

      await vfs.deleteFile('/test/todelete.txt')

      expect(await vfs.exists('/test/todelete.txt')).toBe(false)
    })

    it('should throw ENOENT for non-existent file', async () => {
      await expect(vfs.deleteFile('/ghost.txt')).rejects.toMatchObject({ code: 'ENOENT' })
    })

    it('should throw EISDIR when trying to delete directory', async () => {
      await vfs.mkdir('/cantdelete')

      await expect(vfs.deleteFile('/cantdelete')).rejects.toMatchObject({ code: 'EISDIR' })
    })
  })
})

describe('VFS - Common Operations', () => {
  let vfs: VirtualFileSystem

  beforeEach(async () => {
    await resetVfs()
    vfs = await createVfs()
  })

  afterEach(async () => {
    await resetVfs()
  })

  describe('stat', () => {
    it('should return correct stat for file', async () => {
      await vfs.writeFile('/test/file.txt', 'content')

      const stat = await vfs.stat('/test/file.txt')

      expect(stat.type).toBe('file')
      expect(stat.name).toBe('file.txt')
      expect(stat.path).toBe('/test/file.txt')
      expect(stat.size).toBe(7) // 'content'.length
      expect(stat.createdAt).toBeInstanceOf(Date)
      expect(stat.updatedAt).toBeInstanceOf(Date)
    })

    it('should return correct stat for directory', async () => {
      await vfs.mkdir('/mydir')

      const stat = await vfs.stat('/mydir')

      expect(stat.type).toBe('directory')
      expect(stat.name).toBe('mydir')
      expect(stat.path).toBe('/mydir')
    })

    it('should throw ENOENT for non-existent path', async () => {
      await expect(vfs.stat('/nowhere')).rejects.toMatchObject({ code: 'ENOENT' })
    })

    it('should update updatedAt on file modification', async () => {
      await vfs.writeFile('/test/mod.txt', 'original')
      const stat1 = await vfs.stat('/test/mod.txt')

      // Small delay to ensure different timestamp
      await new Promise(r => setTimeout(r, 10))
      await vfs.writeFile('/test/mod.txt', 'modified')
      const stat2 = await vfs.stat('/test/mod.txt')

      expect(stat2.updatedAt.getTime()).toBeGreaterThan(stat1.updatedAt.getTime())
    })
  })

  describe('exists', () => {
    it('should return true for existing file', async () => {
      await vfs.writeFile('/exists.txt', 'yes')

      expect(await vfs.exists('/exists.txt')).toBe(true)
    })

    it('should return true for existing directory', async () => {
      await vfs.mkdir('/existsdir')

      expect(await vfs.exists('/existsdir')).toBe(true)
    })

    it('should return false for non-existent path', async () => {
      expect(await vfs.exists('/nope')).toBe(false)
    })
  })

  describe('rename', () => {
    it('should rename a file', async () => {
      await vfs.writeFile('/old.txt', 'data')

      await vfs.rename('/old.txt', '/new.txt')

      expect(await vfs.exists('/old.txt')).toBe(false)
      expect(await vfs.exists('/new.txt')).toBe(true)
      expect(await vfs.readTextFile('/new.txt')).toBe('data')
    })

    it('should move a file to different directory', async () => {
      await vfs.mkdir('/dest')
      await vfs.writeFile('/source.txt', 'moving')

      await vfs.rename('/source.txt', '/dest/moved.txt')

      expect(await vfs.exists('/source.txt')).toBe(false)
      expect(await vfs.exists('/dest/moved.txt')).toBe(true)
    })

    it('should rename a directory', async () => {
      await vfs.mkdir('/olddir')
      await vfs.writeFile('/olddir/file.txt', 'inside')

      await vfs.rename('/olddir', '/newdir')

      expect(await vfs.exists('/olddir')).toBe(false)
      expect(await vfs.exists('/newdir')).toBe(true)
      expect(await vfs.exists('/newdir/file.txt')).toBe(true)
    })
  })

  describe('copy', () => {
    it('should copy a file', async () => {
      await vfs.writeFile('/original.txt', 'copy me')

      await vfs.copy('/original.txt', '/duplicate.txt')

      expect(await vfs.exists('/original.txt')).toBe(true)
      expect(await vfs.exists('/duplicate.txt')).toBe(true)
      expect(await vfs.readTextFile('/duplicate.txt')).toBe('copy me')
    })

    it('should copy a directory recursively', async () => {
      await vfs.mkdir('/srcdir')
      await vfs.writeFile('/srcdir/file1.txt', 'one')
      await vfs.mkdir('/srcdir/sub')
      await vfs.writeFile('/srcdir/sub/file2.txt', 'two')

      await vfs.copy('/srcdir', '/destdir')

      expect(await vfs.exists('/destdir')).toBe(true)
      expect(await vfs.exists('/destdir/file1.txt')).toBe(true)
      expect(await vfs.exists('/destdir/sub/file2.txt')).toBe(true)
      expect(await vfs.readTextFile('/destdir/sub/file2.txt')).toBe('two')
    })
  })
})

describe('VFS - Watch', () => {
  let vfs: VirtualFileSystem

  beforeEach(async () => {
    await resetVfs()
    vfs = await createVfs()
    await vfs.mkdir('/watched')
  })

  afterEach(async () => {
    await resetVfs()
  })

  it('should emit create event when file is created', async () => {
    const spy = vi.fn()
    vfs.watch('/watched', spy)

    await vfs.writeFile('/watched/new.txt', 'data')

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'create', path: '/watched/new.txt' })
    )
  })

  it('should emit update event when file is modified', async () => {
    await vfs.writeFile('/watched/existing.txt', 'original')
    const spy = vi.fn()
    vfs.watch('/watched', spy)

    await vfs.writeFile('/watched/existing.txt', 'updated')

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'update', path: '/watched/existing.txt' })
    )
  })

  it('should emit delete event when file is deleted', async () => {
    await vfs.writeFile('/watched/todelete.txt', 'bye')
    const spy = vi.fn()
    vfs.watch('/watched', spy)

    await vfs.deleteFile('/watched/todelete.txt')

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'delete', path: '/watched/todelete.txt' })
    )
  })

  it('should emit rename event with oldPath', async () => {
    await vfs.writeFile('/watched/before.txt', 'content')
    const spy = vi.fn()
    vfs.watch('/watched', spy)

    await vfs.rename('/watched/before.txt', '/watched/after.txt')

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'rename',
        path: '/watched/after.txt',
        oldPath: '/watched/before.txt'
      })
    )
  })

  it('should stop emitting after unsubscribe', async () => {
    const spy = vi.fn()
    const unsubscribe = vfs.watch('/watched', spy)

    unsubscribe()
    await vfs.writeFile('/watched/ignored.txt', 'data')

    expect(spy).not.toHaveBeenCalled()
  })

  it('should only emit for paths under watched directory', async () => {
    await vfs.mkdir('/other')
    const spy = vi.fn()
    vfs.watch('/watched', spy)

    await vfs.writeFile('/other/file.txt', 'elsewhere')

    expect(spy).not.toHaveBeenCalled()
  })
})

describe('VFS - Persistence', () => {
  it('should persist files across VFS instances', async () => {
    // First instance - write file
    const vfs1 = await createVfs()
    await vfs1.writeFile('/persist.txt', 'I will survive')

    // Simulate page refresh by creating new instance
    const vfs2 = await createVfs()
    const exists = await vfs2.exists('/persist.txt')
    const content = await vfs2.readTextFile('/persist.txt')

    expect(exists).toBe(true)
    expect(content).toBe('I will survive')

    await resetVfs()
  })

  it('should persist directory structure across instances', async () => {
    const vfs1 = await createVfs()
    await vfs1.mkdir('/Users/default/Documents')
    await vfs1.writeFile('/Users/default/Documents/file.txt', 'nested')

    const vfs2 = await createVfs()

    expect(await vfs2.exists('/Users/default/Documents')).toBe(true)
    expect(await vfs2.exists('/Users/default/Documents/file.txt')).toBe(true)
  })
})

describe('VFS - Initial Directory Structure', () => {
  let vfs: VirtualFileSystem

  beforeEach(async () => {
    await resetVfs()
    vfs = await createVfs()
  })

  afterEach(async () => {
    await resetVfs()
  })

  it('should have root directory', async () => {
    expect(await vfs.exists('/')).toBe(true)
  })

  it('should have System directory structure', async () => {
    expect(await vfs.exists('/System')).toBe(true)
    expect(await vfs.exists('/System/Settings')).toBe(true)
    expect(await vfs.exists('/System/Library')).toBe(true)
  })

  it('should have Applications directory', async () => {
    expect(await vfs.exists('/Applications')).toBe(true)
  })

  it('should have Users directory structure', async () => {
    expect(await vfs.exists('/Users')).toBe(true)
    expect(await vfs.exists('/Users/default')).toBe(true)
    expect(await vfs.exists('/Users/default/Desktop')).toBe(true)
    expect(await vfs.exists('/Users/default/Documents')).toBe(true)
  })
})

