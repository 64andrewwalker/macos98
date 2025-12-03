/**
 * Timer Manager Types - Platform Layer
 *
 * Encapsulates timer APIs with unified management and cleanup.
 * Based on design-docs/03-platform-layer-spec.md
 */

export type TimerId = number

export type FrameCallback = (time: DOMHighResTimeStamp) => void

export type IdleCallback = (deadline: IdleDeadline) => void

export interface IdleOptions {
  timeout?: number
}

/**
 * Managed timer interface that tracks all timers for cleanup
 */
export interface TimerManager {
  // Standard timers
  /**
   * Set a timeout that will be tracked for cleanup
   */
  setTimeout(callback: () => void, ms: number): TimerId

  /**
   * Set an interval that will be tracked for cleanup
   */
  setInterval(callback: () => void, ms: number): TimerId

  /**
   * Clear a timeout
   */
  clearTimeout(id: TimerId): void

  /**
   * Clear an interval
   */
  clearInterval(id: TimerId): void

  // Frame scheduling
  /**
   * Request animation frame, tracked for cleanup
   */
  requestAnimationFrame(callback: FrameCallback): TimerId

  /**
   * Cancel animation frame
   */
  cancelAnimationFrame(id: TimerId): void

  // Idle scheduling
  /**
   * Request idle callback, tracked for cleanup
   * @note Falls back to setTimeout if requestIdleCallback not supported
   */
  requestIdleCallback(callback: IdleCallback, options?: IdleOptions): TimerId

  /**
   * Cancel idle callback
   */
  cancelIdleCallback(id: TimerId): void

  // Bulk cleanup
  /**
   * Clear all timers (timeouts, intervals, animation frames, idle callbacks)
   * Used for app cleanup on termination
   */
  clearAll(): void

  // Stats (optional, for debugging)
  /**
   * Get count of active timers
   */
  getActiveCount(): {
    timeouts: number
    intervals: number
    animationFrames: number
    idleCallbacks: number
  }
}

