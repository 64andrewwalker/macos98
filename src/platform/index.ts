/**
 * Platform Layer
 *
 * Encapsulates browser APIs for testability and abstraction:
 * - Storage: IndexedDB wrapper with simple async interface
 * - Timer: Managed timers with cleanup support
 * - System: Browser capability detection and system info
 *
 * Based on design-docs/03-platform-layer-spec.md
 */

// Storage
export { createStorageAdapter } from './storage'
export type {
  StorageAdapter,
  Database,
  Transaction,
  UpgradeFn
} from './storage'

// Timer
export { createTimerManager } from './timer'
export type {
  TimerManager,
  TimerId,
  FrameCallback,
  IdleCallback,
  IdleOptions
} from './timer'

// System
export { createSystemInfo } from './system'
export type {
  SystemInfo,
  StorageEstimate
} from './system'

