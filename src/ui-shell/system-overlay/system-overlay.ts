/**
 * SystemOverlay Service - UI Shell Layer
 *
 * Manages overlay items (modals, dropdowns, etc).
 * Based on design-docs/05-ui-shell-layer-spec.md
 */

import type {
  SystemOverlayService,
  OverlayItem,
  ShowOverlayOptions,
  OverlayType
} from './types'
import type { Unsubscribe } from '../../kernel/event-bus/types'

// Generate unique overlay IDs
let overlayIdCounter = 0
function generateOverlayId(): string {
  overlayIdCounter += 1
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `overlay_${crypto.randomUUID()}`
  }
  return `overlay_${overlayIdCounter}_${Date.now()}`
}

/**
 * Create a new SystemOverlayService instance
 */
export function createSystemOverlayService(): SystemOverlayService {
  const overlays: OverlayItem[] = []
  const listeners = new Set<() => void>()
  const autoHideTimers = new Map<string, ReturnType<typeof setTimeout>>()

  function notifyChange(): void {
    for (const callback of listeners) {
      callback()
    }
  }

  function show(options: ShowOverlayOptions): string {
    const id = generateOverlayId()

    const overlay: OverlayItem = {
      id,
      type: options.type,
      content: options.content,
      position: options.position,
      autoHideMs: options.autoHideMs,
      onClose: options.onClose
    }

    overlays.push(overlay)

    // Set up auto-hide if specified
    if (options.autoHideMs && options.autoHideMs > 0) {
      const timer = setTimeout(() => {
        hide(id)
      }, options.autoHideMs)
      autoHideTimers.set(id, timer)
    }

    notifyChange()
    return id
  }

  function hide(overlayId: string): void {
    const index = overlays.findIndex(o => o.id === overlayId)
    if (index === -1) return

    const overlay = overlays[index]

    // Clear auto-hide timer if exists
    const timer = autoHideTimers.get(overlayId)
    if (timer) {
      clearTimeout(timer)
      autoHideTimers.delete(overlayId)
    }

    overlays.splice(index, 1)

    // Call onClose callback
    if (overlay.onClose) {
      overlay.onClose()
    }

    notifyChange()
  }

  function hideAll(type?: OverlayType): void {
    const toRemove = type
      ? overlays.filter(o => o.type === type)
      : [...overlays]

    for (const overlay of toRemove) {
      hide(overlay.id)
    }
  }

  function getOverlays(): OverlayItem[] {
    return [...overlays]
  }

  function onChange(callback: () => void): Unsubscribe {
    listeners.add(callback)
    return () => {
      listeners.delete(callback)
    }
  }

  return {
    show,
    hide,
    hideAll,
    getOverlays,
    onChange
  }
}

