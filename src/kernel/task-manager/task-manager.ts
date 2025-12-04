/**
 * TaskManager Implementation - Kernel Layer
 *
 * Manages Task lifecycle. A Task is an abstraction for a running App instance.
 * Based on design-docs/04-kernel-layer-spec.md
 */

import type {
  Task,
  TaskManager,
  TaskState,
  TaskStateChangeCallback
} from './types'
import type { Unsubscribe } from '../event-bus/types'

// Generate unique IDs
let taskIdCounter = 0
function generateTaskId(): string {
  taskIdCounter += 1
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `task_${crypto.randomUUID()}`
  }
  return `task_${taskIdCounter}_${Date.now()}`
}

/**
 * Create a new TaskManager instance
 */
export function createTaskManager(): TaskManager {
  // Map of taskId -> Task
  const tasks = new Map<string, Task>()

  // State change listeners
  const stateChangeListeners = new Set<TaskStateChangeCallback>()

  function notifyStateChange(task: Task, prevState: TaskState): void {
    for (const listener of stateChangeListeners) {
      listener(task, prevState)
    }
  }

  function spawn(appId: string): Task {
    const task: Task = {
      id: generateTaskId(),
      appId,
      state: 'ready',
      createdAt: Date.now()
    }

    tasks.set(task.id, task)
    return task
  }

  function suspend(taskId: string): void {
    const task = tasks.get(taskId)
    if (!task) return

    // Only suspend if running
    if (task.state !== 'running') return

    const prevState = task.state
    task.state = 'suspended'
    notifyStateChange(task, prevState)
  }

  function resume(taskId: string): void {
    const task = tasks.get(taskId)
    if (!task) return

    // Can resume from ready or suspended states
    if (task.state !== 'ready' && task.state !== 'suspended') return

    const prevState = task.state
    task.state = 'running'
    notifyStateChange(task, prevState)
  }

  function kill(taskId: string): void {
    const task = tasks.get(taskId)
    if (!task) return

    const prevState = task.state

    // Transition to terminated first (for listeners)
    task.state = 'terminated'
    notifyStateChange(task, prevState)

    // Then remove from registry
    tasks.delete(taskId)
  }

  function getTask(taskId: string): Task | undefined {
    return tasks.get(taskId)
  }

  function getTasksByApp(appId: string): Task[] {
    const result: Task[] = []
    for (const task of tasks.values()) {
      if (task.appId === appId) {
        result.push(task)
      }
    }
    return result
  }

  function getAllTasks(): Task[] {
    return Array.from(tasks.values())
  }

  function getRunningTasks(): Task[] {
    const result: Task[] = []
    for (const task of tasks.values()) {
      if (task.state === 'running') {
        result.push(task)
      }
    }
    return result
  }

  function onTaskStateChange(callback: TaskStateChangeCallback): Unsubscribe {
    stateChangeListeners.add(callback)

    return () => {
      stateChangeListeners.delete(callback)
    }
  }

  return {
    spawn,
    suspend,
    resume,
    kill,
    getTask,
    getTasksByApp,
    getAllTasks,
    getRunningTasks,
    onTaskStateChange
  }
}

