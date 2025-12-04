/**
 * Timer Manager Implementation - Platform Layer
 *
 * Encapsulates timer APIs with unified management and cleanup.
 * Based on design-docs/03-platform-layer-spec.md
 */

import type { TimerManager, TimerId, FrameCallback, IdleCallback, IdleOptions } from './types'

// Counter for generating unique timer IDs (needed for Node.js/jsdom compatibility)
let nextId = 1

/**
 * Create a new TimerManager instance
 */
export function createTimerManager(): TimerManager {
  // Track active timers for cleanup (maps our ID to native handle)
  const timeouts = new Map<TimerId, ReturnType<typeof globalThis.setTimeout>>()
  const intervals = new Map<TimerId, ReturnType<typeof globalThis.setInterval>>()
  const animationFrames = new Map<TimerId, number>()
  const idleCallbacks = new Map<TimerId, number | ReturnType<typeof globalThis.setTimeout>>()

  function setTimeout(callback: () => void, ms: number): TimerId {
    const id = nextId++
    const handle = globalThis.setTimeout(() => {
      timeouts.delete(id)
      callback()
    }, ms)
    timeouts.set(id, handle)
    return id
  }

  function clearTimeout(id: TimerId): void {
    const handle = timeouts.get(id)
    if (handle !== undefined) {
      globalThis.clearTimeout(handle)
      timeouts.delete(id)
    }
  }

  function setInterval(callback: () => void, ms: number): TimerId {
    const id = nextId++
    const handle = globalThis.setInterval(callback, ms)
    intervals.set(id, handle)
    return id
  }

  function clearInterval(id: TimerId): void {
    const handle = intervals.get(id)
    if (handle !== undefined) {
      globalThis.clearInterval(handle)
      intervals.delete(id)
    }
  }

  function requestAnimationFrame(callback: FrameCallback): TimerId {
    const id = nextId++
    const handle = globalThis.requestAnimationFrame((time) => {
      animationFrames.delete(id)
      callback(time)
    })
    animationFrames.set(id, handle)
    return id
  }

  function cancelAnimationFrame(id: TimerId): void {
    const handle = animationFrames.get(id)
    if (handle !== undefined) {
      globalThis.cancelAnimationFrame(handle)
      animationFrames.delete(id)
    }
  }

  function requestIdleCallback(callback: IdleCallback, options?: IdleOptions): TimerId {
    const id = nextId++

    // Fall back to setTimeout if requestIdleCallback not supported
    if (typeof globalThis.requestIdleCallback !== 'function') {
      const handle = globalThis.setTimeout(() => {
        idleCallbacks.delete(id)
        // Create a mock IdleDeadline
        const deadline: IdleDeadline = {
          didTimeout: true,
          timeRemaining: () => 0
        }
        callback(deadline)
      }, options?.timeout ?? 0)
      idleCallbacks.set(id, handle)
      return id
    }

    const handle = globalThis.requestIdleCallback((deadline) => {
      idleCallbacks.delete(id)
      callback(deadline)
    }, options)
    idleCallbacks.set(id, handle)
    return id
  }

  function cancelIdleCallback(id: TimerId): void {
    const handle = idleCallbacks.get(id)
    if (handle !== undefined) {
      if (typeof globalThis.cancelIdleCallback !== 'function') {
        globalThis.clearTimeout(handle as ReturnType<typeof globalThis.setTimeout>)
      } else {
        globalThis.cancelIdleCallback(handle as number)
      }
      idleCallbacks.delete(id)
    }
  }

  function clearAll(): void {
    // Clear all timeouts
    for (const handle of timeouts.values()) {
      globalThis.clearTimeout(handle)
    }
    timeouts.clear()

    // Clear all intervals
    for (const handle of intervals.values()) {
      globalThis.clearInterval(handle)
    }
    intervals.clear()

    // Clear all animation frames
    for (const handle of animationFrames.values()) {
      globalThis.cancelAnimationFrame(handle)
    }
    animationFrames.clear()

    // Clear all idle callbacks
    for (const handle of idleCallbacks.values()) {
      if (typeof globalThis.cancelIdleCallback !== 'function') {
        globalThis.clearTimeout(handle as ReturnType<typeof globalThis.setTimeout>)
      } else {
        globalThis.cancelIdleCallback(handle as number)
      }
    }
    idleCallbacks.clear()
  }

  function getActiveCount(): {
    timeouts: number
    intervals: number
    animationFrames: number
    idleCallbacks: number
  } {
    return {
      timeouts: timeouts.size,
      intervals: intervals.size,
      animationFrames: animationFrames.size,
      idleCallbacks: idleCallbacks.size
    }
  }

  return {
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    requestAnimationFrame,
    cancelAnimationFrame,
    requestIdleCallback,
    cancelIdleCallback,
    clearAll,
    getActiveCount
  }
}

