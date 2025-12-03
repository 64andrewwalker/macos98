/**
 * SystemOverlay Service Tests
 *
 * TDD tests for the overlay management service.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSystemOverlayService, type SystemOverlayService } from './index'

describe('SystemOverlayService', () => {
  let service: SystemOverlayService

  beforeEach(() => {
    service = createSystemOverlayService()
  })

  describe('show', () => {
    it('should add an overlay and return its id', () => {
      const id = service.show({
        type: 'modal',
        content: 'Test content'
      })

      expect(id).toBeDefined()
      expect(typeof id).toBe('string')
      expect(service.getOverlays()).toHaveLength(1)
    })

    it('should store overlay with correct properties', () => {
      const id = service.show({
        type: 'tooltip',
        content: 'Tooltip text',
        position: { x: 100, y: 200 }
      })

      const overlays = service.getOverlays()
      expect(overlays[0]).toEqual({
        id,
        type: 'tooltip',
        content: 'Tooltip text',
        position: { x: 100, y: 200 },
        autoHideMs: undefined,
        onClose: undefined
      })
    })

    it('should allow multiple overlays', () => {
      service.show({ type: 'modal', content: 'Modal 1' })
      service.show({ type: 'tooltip', content: 'Tooltip' })
      service.show({ type: 'notification', content: 'Notice' })

      expect(service.getOverlays()).toHaveLength(3)
    })

    it('should notify listeners when overlay is shown', () => {
      const listener = vi.fn()
      service.onChange(listener)

      service.show({ type: 'modal', content: 'Test' })

      expect(listener).toHaveBeenCalledTimes(1)
    })
  })

  describe('hide', () => {
    it('should remove an overlay by id', () => {
      const id1 = service.show({ type: 'modal', content: 'Modal 1' })
      const id2 = service.show({ type: 'modal', content: 'Modal 2' })

      service.hide(id1)

      const overlays = service.getOverlays()
      expect(overlays).toHaveLength(1)
      expect(overlays[0].id).toBe(id2)
    })

    it('should do nothing for non-existent id', () => {
      service.show({ type: 'modal', content: 'Test' })

      service.hide('non-existent')

      expect(service.getOverlays()).toHaveLength(1)
    })

    it('should call onClose callback when hiding', () => {
      const onClose = vi.fn()
      const id = service.show({
        type: 'modal',
        content: 'Test',
        onClose
      })

      service.hide(id)

      expect(onClose).toHaveBeenCalledTimes(1)
    })

    it('should notify listeners when overlay is hidden', () => {
      const id = service.show({ type: 'modal', content: 'Test' })
      const listener = vi.fn()
      service.onChange(listener)

      service.hide(id)

      expect(listener).toHaveBeenCalledTimes(1)
    })
  })

  describe('hideAll', () => {
    it('should remove all overlays when no type specified', () => {
      service.show({ type: 'modal', content: 'Modal' })
      service.show({ type: 'tooltip', content: 'Tooltip' })
      service.show({ type: 'notification', content: 'Notice' })

      service.hideAll()

      expect(service.getOverlays()).toHaveLength(0)
    })

    it('should remove only overlays of specified type', () => {
      service.show({ type: 'modal', content: 'Modal' })
      service.show({ type: 'tooltip', content: 'Tooltip 1' })
      service.show({ type: 'tooltip', content: 'Tooltip 2' })

      service.hideAll('tooltip')

      const overlays = service.getOverlays()
      expect(overlays).toHaveLength(1)
      expect(overlays[0].type).toBe('modal')
    })

    it('should call onClose for each hidden overlay', () => {
      const onClose1 = vi.fn()
      const onClose2 = vi.fn()

      service.show({ type: 'modal', content: 'Modal 1', onClose: onClose1 })
      service.show({ type: 'modal', content: 'Modal 2', onClose: onClose2 })

      service.hideAll('modal')

      expect(onClose1).toHaveBeenCalledTimes(1)
      expect(onClose2).toHaveBeenCalledTimes(1)
    })
  })

  describe('autoHideMs', () => {
    it('should auto-hide after specified time', () => {
      vi.useFakeTimers()

      service.show({
        type: 'notification',
        content: 'Auto-hide',
        autoHideMs: 3000
      })

      expect(service.getOverlays()).toHaveLength(1)

      vi.advanceTimersByTime(3000)

      expect(service.getOverlays()).toHaveLength(0)

      vi.useRealTimers()
    })

    it('should clear auto-hide timer when manually hidden', () => {
      vi.useFakeTimers()

      const onClose = vi.fn()
      const overlayId = service.show({
        type: 'notification',
        content: 'Auto-hide',
        autoHideMs: 3000,
        onClose
      })

      // Hide manually before timeout
      service.hide(overlayId)
      expect(onClose).toHaveBeenCalledTimes(1)

      // Advance past the auto-hide time
      vi.advanceTimersByTime(3000)

      // onClose should not be called again
      expect(onClose).toHaveBeenCalledTimes(1)

      vi.useRealTimers()
    })
  })

  describe('getOverlays', () => {
    it('should return a copy of overlays array', () => {
      service.show({ type: 'modal', content: 'Test' })

      const overlays1 = service.getOverlays()
      const overlays2 = service.getOverlays()

      expect(overlays1).not.toBe(overlays2)
      expect(overlays1).toEqual(overlays2)
    })
  })

  describe('onChange', () => {
    it('should allow multiple listeners', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      service.onChange(listener1)
      service.onChange(listener2)

      service.show({ type: 'modal', content: 'Test' })

      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)
    })

    it('should return unsubscribe function', () => {
      const listener = vi.fn()
      const unsubscribe = service.onChange(listener)

      service.show({ type: 'modal', content: 'Test 1' })
      expect(listener).toHaveBeenCalledTimes(1)

      unsubscribe()

      service.show({ type: 'modal', content: 'Test 2' })
      expect(listener).toHaveBeenCalledTimes(1)
    })
  })

  describe('overlay types', () => {
    it('should support modal type', () => {
      service.show({ type: 'modal', content: 'Modal' })
      expect(service.getOverlays()[0].type).toBe('modal')
    })

    it('should support dropdown type', () => {
      service.show({ type: 'dropdown', content: 'Dropdown' })
      expect(service.getOverlays()[0].type).toBe('dropdown')
    })

    it('should support tooltip type', () => {
      service.show({ type: 'tooltip', content: 'Tooltip' })
      expect(service.getOverlays()[0].type).toBe('tooltip')
    })

    it('should support notification type', () => {
      service.show({ type: 'notification', content: 'Notification' })
      expect(service.getOverlays()[0].type).toBe('notification')
    })

    it('should support contextMenu type', () => {
      service.show({ type: 'contextMenu', content: 'Context Menu' })
      expect(service.getOverlays()[0].type).toBe('contextMenu')
    })
  })
})

