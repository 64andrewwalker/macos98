/**
 * EventBus Types - Kernel Layer
 *
 * Provides global publish/subscribe mechanism for system events and App IPC.
 * Based on design-docs/04-kernel-layer-spec.md
 */

export type Unsubscribe = () => void

export type EventCallback<T = unknown> = (payload: T) => void

export interface EventBus {
  /**
   * Publish an event to all subscribers
   */
  publish<T>(event: string, payload?: T): void

  /**
   * Subscribe to an event
   * @returns Unsubscribe function
   */
  subscribe<T>(event: string, callback: EventCallback<T>): Unsubscribe

  /**
   * Subscribe to an event, automatically unsubscribe after first call
   */
  subscribeOnce<T>(event: string, callback: EventCallback<T>): Unsubscribe

  /**
   * Create an isolated channel for app-specific events
   * Events published on a channel only reach that channel's subscribers
   */
  createChannel(namespace: string): EventChannel
}

export interface EventChannel {
  /**
   * Publish event within this channel only
   */
  publish<T>(event: string, payload?: T): void

  /**
   * Subscribe to events within this channel only
   */
  subscribe<T>(event: string, callback: EventCallback<T>): Unsubscribe

  /**
   * Destroy channel and unsubscribe all listeners
   */
  destroy(): void
}

// System event types based on spec
export interface SystemEvents {
  'system.boot': Record<string, never>
  'system.shutdown': Record<string, never>
  'app.launched': { appId: string; taskId: string }
  'app.terminated': { appId: string; taskId: string }
  'window.opened': { windowId: string; appId: string }
  'window.closed': { windowId: string }
  'window.focused': { windowId: string }
  'fs.changed': { type: 'create' | 'update' | 'delete' | 'rename'; path: string; oldPath?: string }
  'settings.changed': { key: string; value: unknown }
}

