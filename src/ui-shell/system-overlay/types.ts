/**
 * SystemOverlay Types - UI Shell Layer
 *
 * Portal container for modals, dropdowns, tooltips, and notifications.
 * Based on design-docs/05-ui-shell-layer-spec.md
 */

import type { Unsubscribe } from '../../kernel/event-bus/types'

export interface OverlayPosition {
  x: number
  y: number
}

export type OverlayType = 'modal' | 'dropdown' | 'tooltip' | 'notification' | 'contextMenu'

export interface OverlayItem {
  id: string
  type: OverlayType
  position?: OverlayPosition
  content: React.ReactNode
  /** Auto-dismiss after ms (for notifications/tooltips) */
  autoHideMs?: number
  /** Callback when overlay is closed */
  onClose?: () => void
}

export interface ShowOverlayOptions {
  type: OverlayType
  content: React.ReactNode
  position?: OverlayPosition
  autoHideMs?: number
  onClose?: () => void
}

export interface SystemOverlayService {
  /**
   * Show an overlay
   * @returns Overlay ID for later dismissal
   */
  show(options: ShowOverlayOptions): string

  /**
   * Hide a specific overlay
   */
  hide(overlayId: string): void

  /**
   * Hide all overlays of a specific type
   */
  hideAll(type?: OverlayType): void

  /**
   * Get all active overlays
   */
  getOverlays(): OverlayItem[]

  /**
   * Subscribe to overlay changes
   */
  onChange(callback: () => void): Unsubscribe
}

