/**
 * TaskManager Tests - Kernel Layer
 *
 * TDD tests based on design-docs/04-kernel-layer-spec.md
 * These tests define the expected behavior BEFORE implementation.
 *
 * Run: pnpm test src/kernel/task-manager/task-manager.test.ts
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TaskManager } from './types'

import { createTaskManager } from './task-manager'

describe('TaskManager', () => {
  let taskManager: TaskManager

  beforeEach(() => {
    taskManager = createTaskManager()
  })

  describe('spawn', () => {
    it('should create a new task with unique id', () => {
      const task = taskManager.spawn('finder')

      expect(task.id).toBeDefined()
      expect(task.id).toBeTypeOf('string')
      expect(task.id.length).toBeGreaterThan(0)
    })

    it('should set appId to the provided app identifier', () => {
      const task = taskManager.spawn('calculator')

      expect(task.appId).toBe('calculator')
    })

    it('should initialize task in ready state', () => {
      const task = taskManager.spawn('finder')

      expect(task.state).toBe('ready')
    })

    it('should set createdAt timestamp', () => {
      const before = Date.now()
      const task = taskManager.spawn('finder')
      const after = Date.now()

      expect(task.createdAt).toBeGreaterThanOrEqual(before)
      expect(task.createdAt).toBeLessThanOrEqual(after)
    })

    it('should generate unique ids for multiple spawns', () => {
      const task1 = taskManager.spawn('finder')
      const task2 = taskManager.spawn('finder')
      const task3 = taskManager.spawn('calculator')

      expect(task1.id).not.toBe(task2.id)
      expect(task1.id).not.toBe(task3.id)
      expect(task2.id).not.toBe(task3.id)
    })

    it('should allow spawning multiple instances of same app', () => {
      const task1 = taskManager.spawn('finder')
      const task2 = taskManager.spawn('finder')

      expect(task1.appId).toBe('finder')
      expect(task2.appId).toBe('finder')
      expect(taskManager.getTasksByApp('finder')).toHaveLength(2)
    })
  })

  describe('state transitions', () => {
    it('should transition from ready to running on resume', () => {
      const task = taskManager.spawn('finder')
      expect(task.state).toBe('ready')

      taskManager.resume(task.id)

      expect(taskManager.getTask(task.id)?.state).toBe('running')
    })

    it('should transition from running to suspended on suspend', () => {
      const task = taskManager.spawn('finder')
      taskManager.resume(task.id)
      expect(taskManager.getTask(task.id)?.state).toBe('running')

      taskManager.suspend(task.id)

      expect(taskManager.getTask(task.id)?.state).toBe('suspended')
    })

    it('should transition from suspended to running on resume', () => {
      const task = taskManager.spawn('finder')
      taskManager.resume(task.id)
      taskManager.suspend(task.id)
      expect(taskManager.getTask(task.id)?.state).toBe('suspended')

      taskManager.resume(task.id)

      expect(taskManager.getTask(task.id)?.state).toBe('running')
    })
  })

  describe('kill', () => {
    it('should remove task from registry after kill', () => {
      const task = taskManager.spawn('finder')
      expect(taskManager.getTask(task.id)).toBeDefined()

      taskManager.kill(task.id)

      expect(taskManager.getTask(task.id)).toBeUndefined()
    })

    it('should handle killing non-existent task gracefully', () => {
      expect(() => taskManager.kill('non-existent-id')).not.toThrow()
    })

    it('should not affect other tasks when one is killed', () => {
      const task1 = taskManager.spawn('finder')
      const task2 = taskManager.spawn('calculator')

      taskManager.kill(task1.id)

      expect(taskManager.getTask(task1.id)).toBeUndefined()
      expect(taskManager.getTask(task2.id)).toBeDefined()
    })

    it('should allow killing task from any state', () => {
      const readyTask = taskManager.spawn('app1')
      const runningTask = taskManager.spawn('app2')
      taskManager.resume(runningTask.id)
      const suspendedTask = taskManager.spawn('app3')
      taskManager.resume(suspendedTask.id)
      taskManager.suspend(suspendedTask.id)

      taskManager.kill(readyTask.id)
      taskManager.kill(runningTask.id)
      taskManager.kill(suspendedTask.id)

      expect(taskManager.getAllTasks()).toHaveLength(0)
    })
  })

  describe('queries', () => {
    it('should return task by id with getTask', () => {
      const spawned = taskManager.spawn('finder')

      const retrieved = taskManager.getTask(spawned.id)

      expect(retrieved).toBeDefined()
      expect(retrieved?.id).toBe(spawned.id)
      expect(retrieved?.appId).toBe('finder')
    })

    it('should return undefined for non-existent task', () => {
      const result = taskManager.getTask('does-not-exist')

      expect(result).toBeUndefined()
    })

    it('should return all tasks for an app with getTasksByApp', () => {
      taskManager.spawn('finder')
      taskManager.spawn('finder')
      taskManager.spawn('calculator')

      const finderTasks = taskManager.getTasksByApp('finder')
      const calcTasks = taskManager.getTasksByApp('calculator')

      expect(finderTasks).toHaveLength(2)
      expect(calcTasks).toHaveLength(1)
      expect(finderTasks.every(t => t.appId === 'finder')).toBe(true)
    })

    it('should return empty array for app with no tasks', () => {
      const tasks = taskManager.getTasksByApp('nonexistent-app')

      expect(tasks).toEqual([])
    })

    it('should return all active tasks with getAllTasks', () => {
      taskManager.spawn('finder')
      taskManager.spawn('calculator')
      const toKill = taskManager.spawn('textedit')
      taskManager.kill(toKill.id)

      const allTasks = taskManager.getAllTasks()

      expect(allTasks).toHaveLength(2)
    })

    it('should return only running tasks with getRunningTasks', () => {
      const task1 = taskManager.spawn('finder')
      const task2 = taskManager.spawn('calculator')
      taskManager.spawn('textedit') // stays in ready

      taskManager.resume(task1.id)
      taskManager.resume(task2.id)
      taskManager.suspend(task2.id)

      const running = taskManager.getRunningTasks()

      expect(running).toHaveLength(1)
      expect(running[0].id).toBe(task1.id)
    })
  })

  describe('onTaskStateChange', () => {
    it('should emit event when task state changes', () => {
      const spy = vi.fn()
      taskManager.onTaskStateChange(spy)
      const task = taskManager.spawn('finder')

      taskManager.resume(task.id)

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ id: task.id, state: 'running' }),
        'ready'
      )
    })

    it('should emit event on suspend', () => {
      const spy = vi.fn()
      taskManager.onTaskStateChange(spy)
      const task = taskManager.spawn('finder')
      taskManager.resume(task.id)
      spy.mockClear()

      taskManager.suspend(task.id)

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ state: 'suspended' }),
        'running'
      )
    })

    it('should emit event on kill with terminated state', () => {
      const spy = vi.fn()
      taskManager.onTaskStateChange(spy)
      const task = taskManager.spawn('finder')
      taskManager.resume(task.id)
      spy.mockClear()

      taskManager.kill(task.id)

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ state: 'terminated' }),
        'running'
      )
    })

    it('should allow unsubscribing from state changes', () => {
      const spy = vi.fn()
      const unsubscribe = taskManager.onTaskStateChange(spy)
      const task = taskManager.spawn('finder')

      unsubscribe()
      taskManager.resume(task.id)

      expect(spy).not.toHaveBeenCalled()
    })

    it('should support multiple listeners', () => {
      const spy1 = vi.fn()
      const spy2 = vi.fn()
      taskManager.onTaskStateChange(spy1)
      taskManager.onTaskStateChange(spy2)
      const task = taskManager.spawn('finder')

      taskManager.resume(task.id)

      expect(spy1).toHaveBeenCalled()
      expect(spy2).toHaveBeenCalled()
    })
  })
})

describe('TaskManager - Edge Cases', () => {
  let taskManager: TaskManager

  beforeEach(() => {
    taskManager = createTaskManager()
  })

  it('should handle suspend on non-running task gracefully', () => {
    const task = taskManager.spawn('finder') // state: ready

    // Should not throw, might be a no-op or log warning
    expect(() => taskManager.suspend(task.id)).not.toThrow()
  })

  it('should handle resume on already running task gracefully', () => {
    const task = taskManager.spawn('finder')
    taskManager.resume(task.id)

    // Should not throw
    expect(() => taskManager.resume(task.id)).not.toThrow()
    expect(taskManager.getTask(task.id)?.state).toBe('running')
  })

  it('should handle operations on non-existent task gracefully', () => {
    expect(() => taskManager.suspend('fake-id')).not.toThrow()
    expect(() => taskManager.resume('fake-id')).not.toThrow()
    expect(() => taskManager.kill('fake-id')).not.toThrow()
  })
})

