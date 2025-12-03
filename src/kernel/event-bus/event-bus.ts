/**
 * EventBus Implementation - Kernel Layer
 *
 * Provides global publish/subscribe mechanism for system events and App IPC.
 * Based on design-docs/04-kernel-layer-spec.md
 */

import type { EventBus, EventCallback, EventChannel, Unsubscribe } from './types'

/**
 * Create a new EventBus instance
 */
export function createEventBus(): EventBus {
  // Map of event name -> Set of callbacks
  const subscribers = new Map<string, Set<EventCallback<unknown>>>()

  // Track one-time subscribers for auto-cleanup
  const onceWrappers = new WeakMap<EventCallback<unknown>, EventCallback<unknown>>()

  function subscribe<T>(event: string, callback: EventCallback<T>): Unsubscribe {
    if (!subscribers.has(event)) {
      subscribers.set(event, new Set())
    }

    const eventSubscribers = subscribers.get(event)!
    eventSubscribers.add(callback as EventCallback<unknown>)

    // Return unsubscribe function
    let unsubscribed = false
    return () => {
      if (unsubscribed) return
      unsubscribed = true
      eventSubscribers.delete(callback as EventCallback<unknown>)
    }
  }

  function subscribeOnce<T>(event: string, callback: EventCallback<T>): Unsubscribe {
    // Wrapper that auto-unsubscribes after first call
    const wrapper: EventCallback<T> = (payload) => {
      unsubscribe()
      callback(payload)
    }

    // Store reference so we can unsubscribe the wrapper
    onceWrappers.set(callback as EventCallback<unknown>, wrapper as EventCallback<unknown>)

    const unsubscribe = subscribe(event, wrapper)
    return unsubscribe
  }

  function publish<T>(event: string, payload?: T): void {
    const eventSubscribers = subscribers.get(event)
    if (!eventSubscribers) return

    // Call all subscribers with the payload
    for (const callback of eventSubscribers) {
      callback(payload)
    }
  }

  function createChannel(namespace: string): EventChannel {
    // Channel has its own isolated subscriber map
    const channelSubscribers = new Map<string, Set<EventCallback<unknown>>>()
    let destroyed = false

    return {
      publish<T>(event: string, payload?: T): void {
        if (destroyed) return

        const eventKey = `${namespace}:${event}`
        const subs = channelSubscribers.get(eventKey)
        if (!subs) return

        for (const callback of subs) {
          callback(payload)
        }
      },

      subscribe<T>(event: string, callback: EventCallback<T>): Unsubscribe {
        if (destroyed) {
          // Return no-op unsubscribe for destroyed channel
          return () => {}
        }

        const eventKey = `${namespace}:${event}`
        if (!channelSubscribers.has(eventKey)) {
          channelSubscribers.set(eventKey, new Set())
        }

        const subs = channelSubscribers.get(eventKey)!
        subs.add(callback as EventCallback<unknown>)

        let unsubscribed = false
        return () => {
          if (unsubscribed || destroyed) return
          unsubscribed = true
          subs.delete(callback as EventCallback<unknown>)
        }
      },

      destroy(): void {
        if (destroyed) return
        destroyed = true

        // Clear all channel subscribers
        channelSubscribers.clear()
      }
    }
  }

  return {
    publish,
    subscribe,
    subscribeOnce,
    createChannel
  }
}

