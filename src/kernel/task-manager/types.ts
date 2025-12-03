/**
 * TaskManager Types - Kernel Layer
 *
 * Manages Task lifecycle. A Task is an abstraction for a running App instance.
 * Based on design-docs/04-kernel-layer-spec.md
 */

import type { Unsubscribe } from '../event-bus/types'

export type TaskState =
  | 'ready'       // Created, waiting to run
  | 'running'     // Currently active
  | 'suspended'   // Paused
  | 'terminated'  // Ended

export interface Task {
  /** Unique identifier for this task instance */
  id: string
  /** The app this task belongs to */
  appId: string
  /** Current lifecycle state */
  state: TaskState
  /** Unix timestamp when task was created */
  createdAt: number
  // Note: context is added by AppFramework layer, not here
}

export type TaskStateChangeCallback = (task: Task, prevState: TaskState) => void

export interface TaskManager {
  // Lifecycle management
  /**
   * Create a new task for the given app
   * Initial state is 'ready'
   */
  spawn(appId: string): Task

  /**
   * Pause a running task
   * Transitions from 'running' to 'suspended'
   */
  suspend(taskId: string): void

  /**
   * Resume a suspended task
   * Transitions from 'suspended' to 'running'
   */
  resume(taskId: string): void

  /**
   * Terminate a task and clean up
   * Transitions to 'terminated' then removes from registry
   */
  kill(taskId: string): void

  // Queries
  /** Get task by ID, undefined if not found or terminated */
  getTask(taskId: string): Task | undefined

  /** Get all tasks for a specific app */
  getTasksByApp(appId: string): Task[]

  /** Get all active tasks (not terminated) */
  getAllTasks(): Task[]

  /** Get only running tasks */
  getRunningTasks(): Task[]

  // Events
  /**
   * Subscribe to task state changes
   * Called when any task changes state
   */
  onTaskStateChange(callback: TaskStateChangeCallback): Unsubscribe
}

