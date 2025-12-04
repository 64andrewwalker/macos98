/**
 * AppContext Tests - App Framework Layer
 *
 * TDD tests for application context with resource management.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { createAppContext } from './context'
import type { AppContext, AppContextDependencies } from './types'
import type { AppManifest } from '../manifest'
import type { VirtualFileSystem } from '../../kernel/vfs/types'
import type { EventBus } from '../../kernel/event-bus/types'
import type { Window } from '../../ui-shell'

// Mock dependencies
function createMockDeps(): AppContextDependencies {
  const manifest: AppManifest = {
    id: 'test-app',
    name: 'Test App',
    version: '1.0.0',
    icon: '/icon.png',
    permissions: {
      fs: [{ path: '/allowed', mode: 'readwrite' }],
      services: ['clipboard']
    }
  }

  const eventBus: EventBus = {
    publish: vi.fn(),
    subscribe: vi.fn(() => vi.fn()), // Returns a new mock unsubscribe for each call
    subscribeOnce: vi.fn(() => vi.fn()),
    createChannel: vi.fn()
  }

  const vfs: Partial<VirtualFileSystem> = {
    readFile: vi.fn().mockResolvedValue('file content'),
    writeFile: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
    readdir: vi.fn().mockResolvedValue(['file1.txt', 'file2.txt']),
    stat: vi.fn().mockResolvedValue({ type: 'file', size: 100, updatedAt: new Date(), createdAt: new Date() }),
    exists: vi.fn().mockResolvedValue(true),
    deleteFile: vi.fn().mockResolvedValue(undefined),
    rmdir: vi.fn().mockResolvedValue(undefined)
  }

  const mockWindow: Window = {
    id: 'win-1',
    appId: 'test-app',
    title: 'Test Window',
    bounds: { x: 100, y: 100, width: 400, height: 300 },
    state: 'normal',
    focused: true
  }

  const windowManager = {
    openWindow: vi.fn(() => mockWindow),
    closeWindow: vi.fn(),
    getWindowsByApp: vi.fn(() => [mockWindow]),
    closeAllWindows: vi.fn()
  }

  const permissionChecker = {
    canAccessPath: vi.fn((appId: string, path: string) => path.startsWith('/allowed')),
    canUseService: vi.fn((appId: string, service: string) => service === 'clipboard')
  }

  const services = new Map<string, unknown>([
    ['clipboard', { copy: vi.fn(), paste: vi.fn() }]
  ])

  return {
    appId: 'test-app',
    taskId: 'task-123',
    manifest,
    vfs: vfs as VirtualFileSystem,
    eventBus,
    windowManager,
    permissionChecker,
    services
  }
}

describe('AppContext', () => {
  let deps: AppContextDependencies
  let ctx: AppContext

  beforeEach(() => {
    vi.useFakeTimers()
    deps = createMockDeps()
    ctx = createAppContext(deps)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('identity', () => {
    it('should expose appId', () => {
      expect(ctx.appId).toBe('test-app')
    })

    it('should expose taskId', () => {
      expect(ctx.taskId).toBe('task-123')
    })

    it('should expose manifest', () => {
      expect(ctx.manifest.id).toBe('test-app')
      expect(ctx.manifest.name).toBe('Test App')
    })
  })

  describe('timers', () => {
    it('should create and execute setTimeout', () => {
      const callback = vi.fn()
      ctx.setTimeout(callback, 1000)

      expect(callback).not.toHaveBeenCalled()
      vi.advanceTimersByTime(1000)
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should return timer id from setTimeout', () => {
      const id = ctx.setTimeout(() => {}, 1000)
      expect(typeof id).toBe('number')
    })

    it('should allow clearing setTimeout', () => {
      const callback = vi.fn()
      const id = ctx.setTimeout(callback, 1000)

      ctx.clearTimeout(id)
      vi.advanceTimersByTime(1000)

      expect(callback).not.toHaveBeenCalled()
    })

    it('should create and execute setInterval', () => {
      const callback = vi.fn()
      ctx.setInterval(callback, 500)

      vi.advanceTimersByTime(500)
      expect(callback).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(500)
      expect(callback).toHaveBeenCalledTimes(2)
    })

    it('should allow clearing setInterval', () => {
      const callback = vi.fn()
      const id = ctx.setInterval(callback, 500)

      vi.advanceTimersByTime(500)
      expect(callback).toHaveBeenCalledTimes(1)

      ctx.clearInterval(id)
      vi.advanceTimersByTime(1000)
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should cleanup all timers on dispose', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      ctx.setTimeout(callback1, 1000)
      ctx.setInterval(callback2, 500)

      ctx.dispose()
      vi.advanceTimersByTime(2000)

      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).not.toHaveBeenCalled()
    })
  })

  describe('events', () => {
    it('should subscribe to events', () => {
      const handler = vi.fn()
      ctx.addEventListener('test-event', handler)

      expect(deps.eventBus.subscribe).toHaveBeenCalledWith('test-event', handler)
    })

    it('should unsubscribe from events', () => {
      const handler = vi.fn()
      ctx.addEventListener('test-event', handler)
      ctx.removeEventListener('test-event', handler)

      // The unsubscribe function returned by subscribe should be called
      const mockUnsubscribe = (deps.eventBus.subscribe as ReturnType<typeof vi.fn>).mock.results[0].value
      expect(mockUnsubscribe).toHaveBeenCalled()
    })

    it('should cleanup all event listeners on dispose', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      ctx.addEventListener('event1', handler1)
      ctx.addEventListener('event2', handler2)

      ctx.dispose()

      // Both unsubscribe functions should have been called
      const results = (deps.eventBus.subscribe as ReturnType<typeof vi.fn>).mock.results
      expect(results[0].value).toHaveBeenCalled()
      expect(results[1].value).toHaveBeenCalled()
    })
  })

  describe('scoped file system', () => {
    it('should allow reading from permitted paths', async () => {
      const content = await ctx.fs.readFile('/allowed/file.txt')
      expect(content).toBe('file content')
      expect(deps.vfs.readFile).toHaveBeenCalledWith('/allowed/file.txt')
    })

    it('should reject reading from non-permitted paths', async () => {
      await expect(ctx.fs.readFile('/forbidden/file.txt')).rejects.toThrow('Permission denied')
    })

    it('should allow writing to permitted paths', async () => {
      await ctx.fs.writeFile('/allowed/file.txt', 'new content')
      expect(deps.vfs.writeFile).toHaveBeenCalledWith('/allowed/file.txt', 'new content')
    })

    it('should reject writing to non-permitted paths', async () => {
      await expect(ctx.fs.writeFile('/forbidden/file.txt', 'data')).rejects.toThrow('Permission denied')
    })

    it('should provide readTextFile', async () => {
      const text = await ctx.fs.readTextFile('/allowed/file.txt')
      expect(text).toBe('file content')
    })

    it('should provide mkdir', async () => {
      await ctx.fs.mkdir('/allowed/newdir')
      expect(deps.vfs.mkdir).toHaveBeenCalledWith('/allowed/newdir')
    })

    it('should provide readdir', async () => {
      const files = await ctx.fs.readdir('/allowed')
      expect(files).toEqual(['file1.txt', 'file2.txt'])
    })

    it('should provide stat', async () => {
      const stat = await ctx.fs.stat('/allowed/file.txt')
      expect(stat.isDirectory).toBe(false)
      expect(stat.size).toBe(100)
    })

    it('should provide exists', async () => {
      const exists = await ctx.fs.exists('/allowed/file.txt')
      expect(exists).toBe(true)
    })

    it('should provide remove for files', async () => {
      await ctx.fs.remove('/allowed/file.txt')
      expect(deps.vfs.deleteFile).toHaveBeenCalledWith('/allowed/file.txt')
    })

    it('should provide remove for directories', async () => {
      vi.mocked(deps.vfs.stat).mockResolvedValueOnce({ type: 'directory', size: 0, name: 'dir', path: '/allowed/dir', updatedAt: new Date(), createdAt: new Date() })
      await ctx.fs.remove('/allowed/dir')
      expect(deps.vfs.rmdir).toHaveBeenCalledWith('/allowed/dir')
    })
  })

  describe('services', () => {
    it('should return permitted service', () => {
      const clipboard = ctx.getService('clipboard')
      expect(clipboard).toBeDefined()
    })

    it('should return undefined for non-permitted service', () => {
      const service = ctx.getService('network')
      expect(service).toBeUndefined()
    })
  })

  describe('windows', () => {
    it('should open window with appId', () => {
      ctx.openWindow({ title: 'New Window' })
      expect(deps.windowManager.openWindow).toHaveBeenCalledWith({
        title: 'New Window',
        appId: 'test-app'
      })
    })

    it('should close window', () => {
      ctx.closeWindow('win-1')
      expect(deps.windowManager.closeWindow).toHaveBeenCalledWith('win-1')
    })

    it('should get windows for this app', () => {
      const windows = ctx.getWindows()
      expect(windows).toHaveLength(1)
      expect(windows[0].id).toBe('win-1')
    })

    it('should close all windows on dispose', () => {
      ctx.dispose()
      expect(deps.windowManager.closeAllWindows).toHaveBeenCalledWith('test-app')
    })
  })

  describe('terminate callbacks', () => {
    it('should register terminate callback', () => {
      const callback = vi.fn()
      ctx.onTerminate(callback)

      ctx.dispose()
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should allow unregistering terminate callback', () => {
      const callback = vi.fn()
      const unsubscribe = ctx.onTerminate(callback)

      unsubscribe()
      ctx.dispose()

      expect(callback).not.toHaveBeenCalled()
    })

    it('should continue with other callbacks if one throws', () => {
      const callback1 = vi.fn(() => { throw new Error('oops') })
      const callback2 = vi.fn()

      vi.spyOn(console, 'error').mockImplementation(() => {})

      ctx.onTerminate(callback1)
      ctx.onTerminate(callback2)

      ctx.dispose()

      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
    })
  })

  describe('dispose', () => {
    it('should prevent new operations after dispose', () => {
      ctx.dispose()

      expect(() => ctx.setTimeout(() => {}, 100)).toThrow('disposed')
      expect(() => ctx.setInterval(() => {}, 100)).toThrow('disposed')
      expect(() => ctx.addEventListener('event', () => {})).toThrow('disposed')
      expect(() => ctx.getService('clipboard')).toThrow('disposed')
      expect(() => ctx.openWindow({ title: 'Test' })).toThrow('disposed')
    })

    it('should be idempotent', () => {
      ctx.dispose()
      expect(() => ctx.dispose()).not.toThrow()
    })
  })
})

