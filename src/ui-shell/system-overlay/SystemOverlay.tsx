/**
 * SystemOverlay Component - UI Shell Layer
 *
 * React component that renders overlays via portal.
 * Based on design-docs/05-ui-shell-layer-spec.md
 */

import React, { useSyncExternalStore, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { SystemOverlayService, OverlayItem } from './types'
import styles from './SystemOverlay.module.scss'

export interface SystemOverlayProps {
  service: SystemOverlayService
  /** Custom container element (defaults to document.body) */
  container?: Element
}

/**
 * SystemOverlay component renders all active overlays via React Portal
 */
export function SystemOverlay({ service, container }: SystemOverlayProps) {
  // Use useSyncExternalStore for proper React 18 external state subscription
  const overlays = useSyncExternalStore<OverlayItem[]>(
    (onStoreChange) => service.onChange(onStoreChange),
    () => service.getOverlays(),
    () => [] // Server snapshot
  )

  // Handle click outside to close dropdowns/context menus
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      // Only handle clicks directly on the backdrop
      if (e.target === e.currentTarget) {
        // Close context menus and dropdowns on backdrop click
        service.hideAll('contextMenu')
        service.hideAll('dropdown')
      }
    },
    [service]
  )

  // Don't render anything if no overlays
  if (overlays.length === 0) {
    return null
  }

  const portalTarget = container ?? document.body

  return createPortal(
    <div className={styles.overlayContainer} onClick={handleBackdropClick}>
      {overlays.map((overlay) => (
        <div
          key={overlay.id}
          className={`${styles.overlayItem} ${styles[overlay.type]}`}
          style={
            overlay.position
              ? { left: overlay.position.x, top: overlay.position.y }
              : undefined
          }
        >
          {overlay.content}
        </div>
      ))}
    </div>,
    portalTarget
  )
}

