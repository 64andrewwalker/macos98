/**
 * AppRuntime Tests - App Framework Layer
 *
 * TDD tests for app lifecycle management.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createAppRuntime } from './runtime'
import type { AppRuntime, AppRuntimeDependencies, AppFactory } from './types'
import type { AppManifest } from '../manifest'
import type { AppContext } from '../context'
import type { Task } from '../../kernel/task-manager/types'

// Mock factory for testing
function createMockDeps(): AppRuntimeDependencies {
  let taskIdCounter = 0

  const taskManager = {
    spawn: vi.fn((appId: string): Task => {
      taskIdCounter += 1
      return {
        id: `task-${taskIdCounter}`,
        appId,
        state: 'running',
        createdAt: Date.now()
      }
    }),
    kill: vi.fn(() => true),
    getTask: vi.fn(),
    getTasksByApp: vi.fn(() => [])
  }

  const contexts = new Map<string, AppContext>()

  const createAppContext = vi.fn((taskId: string, manifest: AppManifest): AppContext => {
    const ctx = {
      appId: manifest.id,
      taskId,
      manifest,
      fs: {} as AppContext['fs'],
      setTimeout: vi.fn(),
      setInterval: vi.fn(),
      clearTimeout: vi.fn(),
      clearInterval: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      getService: vi.fn(),
      openWindow: vi.fn(),
      closeWindow: vi.fn(),
      getWindows: vi.fn(() => []),
      onTerminate: vi.fn(() => () => {}),
      dispose: vi.fn()
    }
    contexts.set(taskId, ctx)
    return ctx
  })

  const eventBus = {
    publish: vi.fn()
  }

  return { taskManager, createAppContext, eventBus }
}

describe('AppRuntime', () => {
  let deps: AppRuntimeDependencies
  let runtime: AppRuntime

  const calcManifest: AppManifest = {
    id: 'calculator',
    name: 'Calculator',
    version: '1.0.0',
    icon: '/icons/calculator.png'
  }

  const textEditManifest: AppManifest = {
    id: 'text-edit',
    name: 'TextEdit',
    version: '1.0.0',
    icon: '/icons/textedit.png',
    fileAssociations: [
      { mimeTypes: ['text/plain'], extensions: ['.txt', '.md'], role: 'editor' }
    ]
  }

  beforeEach(() => {
    deps = createMockDeps()
    runtime = createAppRuntime(deps)
  })

  describe('registerApp', () => {
    it('should register an app', () => {
      const factory: AppFactory = () => ({})
      runtime.registerApp(calcManifest, factory)

      expect(runtime.getInstalledApps()).toHaveLength(1)
      expect(runtime.getInstalledApps()[0].id).toBe('calculator')
    })

    it('should publish registration event', () => {
      runtime.registerApp(calcManifest, () => ({}))
      expect(deps.eventBus.publish).toHaveBeenCalledWith(
        'system',
        'app.registered',
        { appId: 'calculator' }
      )
    })
  })

  describe('unregisterApp', () => {
    it('should unregister an app', () => {
      runtime.registerApp(calcManifest, () => ({}))
      runtime.unregisterApp('calculator')

      expect(runtime.getInstalledApps()).toHaveLength(0)
    })

    it('should publish unregistration event', () => {
      runtime.registerApp(calcManifest, () => ({}))
      runtime.unregisterApp('calculator')

      expect(deps.eventBus.publish).toHaveBeenCalledWith(
        'system',
        'app.unregistered',
        { appId: 'calculator' }
      )
    })
  })

  describe('launchApp', () => {
    it('should throw for unregistered app', async () => {
      await expect(runtime.launchApp('unknown')).rejects.toThrow('App not registered')
    })

    it('should create task and context', async () => {
      runtime.registerApp(calcManifest, () => ({}))
      const task = await runtime.launchApp('calculator')

      expect(task.appId).toBe('calculator')
      expect(deps.taskManager.spawn).toHaveBeenCalledWith('calculator')
      expect(deps.createAppContext).toHaveBeenCalledWith(task.id, calcManifest)
    })

    it('should call onLaunch', async () => {
      const onLaunch = vi.fn()
      runtime.registerApp(calcManifest, () => ({ onLaunch }))

      await runtime.launchApp('calculator')

      expect(onLaunch).toHaveBeenCalled()
    })

    it('should call openFile if file option provided', async () => {
      const openFile = vi.fn()
      runtime.registerApp(textEditManifest, () => ({ openFile }))

      await runtime.launchApp('text-edit', { file: '/docs/readme.txt' })

      expect(openFile).toHaveBeenCalledWith('/docs/readme.txt')
    })

    it('should make launched app active', async () => {
      const onActivate = vi.fn()
      runtime.registerApp(calcManifest, () => ({ onActivate }))

      const task = await runtime.launchApp('calculator')

      expect(onActivate).toHaveBeenCalled()
      expect(runtime.getActiveApp()?.task.id).toBe(task.id)
    })

    it('should publish launched event', async () => {
      runtime.registerApp(calcManifest, () => ({}))
      const task = await runtime.launchApp('calculator')

      expect(deps.eventBus.publish).toHaveBeenCalledWith(
        'system',
        'app.launched',
        { appId: 'calculator', taskId: task.id }
      )
    })

    it('should cleanup on launch failure', async () => {
      const onLaunch = vi.fn(() => { throw new Error('Launch failed') })
      runtime.registerApp(calcManifest, () => {
        return { onLaunch }
      })

      await expect(runtime.launchApp('calculator')).rejects.toThrow('Launch failed')

      expect(runtime.getRunningApps()).toHaveLength(0)
      expect(deps.taskManager.kill).toHaveBeenCalled()
    })
  })

  describe('terminateApp', () => {
    it('should call onTerminate', async () => {
      const onTerminate = vi.fn()
      runtime.registerApp(calcManifest, () => ({ onTerminate }))

      const task = await runtime.launchApp('calculator')
      await runtime.terminateApp(task.id)

      expect(onTerminate).toHaveBeenCalled()
    })

    it('should dispose context', async () => {
      runtime.registerApp(calcManifest, () => ({}))

      const task = await runtime.launchApp('calculator')
      const ctx = deps.createAppContext.mock.results[0].value as AppContext

      await runtime.terminateApp(task.id)

      expect(ctx.dispose).toHaveBeenCalled()
    })

    it('should kill task', async () => {
      runtime.registerApp(calcManifest, () => ({}))

      const task = await runtime.launchApp('calculator')
      await runtime.terminateApp(task.id)

      expect(deps.taskManager.kill).toHaveBeenCalledWith(task.id)
    })

    it('should remove from running apps', async () => {
      runtime.registerApp(calcManifest, () => ({}))

      const task = await runtime.launchApp('calculator')
      expect(runtime.getRunningApps()).toHaveLength(1)

      await runtime.terminateApp(task.id)
      expect(runtime.getRunningApps()).toHaveLength(0)
    })

    it('should publish terminated event', async () => {
      runtime.registerApp(calcManifest, () => ({}))

      const task = await runtime.launchApp('calculator')
      await runtime.terminateApp(task.id)

      expect(deps.eventBus.publish).toHaveBeenCalledWith(
        'system',
        'app.terminated',
        { appId: 'calculator', taskId: task.id }
      )
    })

    it('should be no-op for unknown task', async () => {
      await expect(runtime.terminateApp('unknown')).resolves.not.toThrow()
    })
  })

  describe('terminateAllApps', () => {
    it('should terminate all running apps', async () => {
      runtime.registerApp(calcManifest, () => ({}))
      runtime.registerApp(textEditManifest, () => ({}))

      await runtime.launchApp('calculator')
      await runtime.launchApp('text-edit')
      expect(runtime.getRunningApps()).toHaveLength(2)

      await runtime.terminateAllApps()
      expect(runtime.getRunningApps()).toHaveLength(0)
    })
  })

  describe('isAppRunning', () => {
    it('should return true for running app', async () => {
      runtime.registerApp(calcManifest, () => ({}))
      await runtime.launchApp('calculator')

      expect(runtime.isAppRunning('calculator')).toBe(true)
    })

    it('should return false for not running app', () => {
      runtime.registerApp(calcManifest, () => ({}))
      expect(runtime.isAppRunning('calculator')).toBe(false)
    })
  })

  describe('getRunningInstance', () => {
    it('should return running app by task id', async () => {
      runtime.registerApp(calcManifest, () => ({}))
      const task = await runtime.launchApp('calculator')

      const runningApp = runtime.getRunningInstance(task.id)
      expect(runningApp).toBeDefined()
      expect(runningApp?.manifest.id).toBe('calculator')
    })

    it('should return undefined for unknown task', () => {
      expect(runtime.getRunningInstance('unknown')).toBeUndefined()
    })
  })

  describe('file associations', () => {
    it('should find app for file extension', () => {
      runtime.registerApp(textEditManifest, () => ({}))

      expect(runtime.getAppForFile('/docs/readme.txt')?.id).toBe('text-edit')
      expect(runtime.getAppForFile('/docs/notes.md')?.id).toBe('text-edit')
      expect(runtime.getAppForFile('/docs/image.png')).toBeUndefined()
    })

    it('should return undefined for file without extension', () => {
      runtime.registerApp(textEditManifest, () => ({}))
      expect(runtime.getAppForFile('/docs/Makefile')).toBeUndefined()
    })

    it('should open file with associated app', async () => {
      const openFile = vi.fn()
      runtime.registerApp(textEditManifest, () => ({ openFile }))

      const task = await runtime.openFile('/docs/readme.txt')

      expect(task).toBeDefined()
      expect(openFile).toHaveBeenCalledWith('/docs/readme.txt')
    })

    it('should return undefined when no app for file', async () => {
      const task = await runtime.openFile('/docs/image.png')
      expect(task).toBeUndefined()
    })
  })

  describe('activation', () => {
    it('should track active app', async () => {
      runtime.registerApp(calcManifest, () => ({}))
      runtime.registerApp(textEditManifest, () => ({}))

      const task1 = await runtime.launchApp('calculator')
      expect(runtime.getActiveApp()?.task.id).toBe(task1.id)

      const task2 = await runtime.launchApp('text-edit')
      expect(runtime.getActiveApp()?.task.id).toBe(task2.id)
    })

    it('should call onDeactivate on previous app', async () => {
      const onDeactivate1 = vi.fn()
      const onActivate2 = vi.fn()

      runtime.registerApp(calcManifest, () => ({ onDeactivate: onDeactivate1 }))
      runtime.registerApp(textEditManifest, () => ({ onActivate: onActivate2 }))

      await runtime.launchApp('calculator')
      await runtime.launchApp('text-edit')

      expect(onDeactivate1).toHaveBeenCalled()
      expect(onActivate2).toHaveBeenCalled()
    })

    it('should activate another app when active is terminated', async () => {
      runtime.registerApp(calcManifest, () => ({}))
      runtime.registerApp(textEditManifest, () => ({}))

      const task1 = await runtime.launchApp('calculator')
      const task2 = await runtime.launchApp('text-edit')

      await runtime.terminateApp(task2.id)

      expect(runtime.getActiveApp()?.task.id).toBe(task1.id)
    })

    it('should return undefined when no active app', () => {
      expect(runtime.getActiveApp()).toBeUndefined()
    })
  })
})

