/**
 * WindowManager Tests - UI Shell Layer
 *
 * Tests for window lifecycle, focus, and z-ordering.
 * Based on design-docs/05-ui-shell-layer-spec.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createWindowManager } from './window-manager'
import type { WindowManager } from './types'

describe('WindowManager', () => {
  let wm: WindowManager

  beforeEach(() => {
    wm = createWindowManager()
  })

  describe('openWindow', () => {
    it('should create a new window with unique id', () => {
      const win = wm.openWindow({
        appId: 'finder',
        title: 'Finder'
      })

      expect(win.id).toBeDefined()
      expect(win.id.length).toBeGreaterThan(0)
    })

    it('should set window properties from options', () => {
      const win = wm.openWindow({
        appId: 'calculator',
        title: 'Calculator',
        content: 'test content'
      })

      expect(win.appId).toBe('calculator')
      expect(win.title).toBe('Calculator')
      expect(win.content).toBe('test content')
    })

    it('should use default bounds when not specified', () => {
      const win = wm.openWindow({
        appId: 'test',
        title: 'Test'
      })

      expect(win.bounds.width).toBeGreaterThan(0)
      expect(win.bounds.height).toBeGreaterThan(0)
    })

    it('should use specified initial bounds', () => {
      const win = wm.openWindow({
        appId: 'test',
        title: 'Test',
        x: 50,
        y: 100,
        width: 500,
        height: 400
      })

      expect(win.bounds).toEqual({ x: 50, y: 100, width: 500, height: 400 })
    })

    it('should cascade windows when opened sequentially', () => {
      const win1 = wm.openWindow({
        appId: 'test',
        title: 'Test 1'
      })

      const win2 = wm.openWindow({
        appId: 'test',
        title: 'Test 2'
      })

      // Second window should be offset from first
      expect(win2.bounds.x).toBeGreaterThan(win1.bounds.x)
      expect(win2.bounds.y).toBeGreaterThan(win1.bounds.y)
    })

    it('should set initial state to normal', () => {
      const win = wm.openWindow({
        appId: 'test',
        title: 'Test'
      })

      expect(win.state).toBe('normal')
    })

    it('should auto-focus newly opened window', () => {
      const win = wm.openWindow({
        appId: 'test',
        title: 'Test'
      })

      expect(wm.getFocusedWindow()).toBe(win)
      expect(win.focused).toBe(true)
    })

    it('should emit opened and focused events', () => {
      const spy = vi.fn()
      wm.onWindowChange(spy)

      wm.openWindow({
        appId: 'test',
        title: 'Test'
      })

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'opened' })
      )
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'focused' })
      )
    })

    it('should use system appId when not specified', () => {
      const win = wm.openWindow({ title: 'Test' })
      expect(win.appId).toBe('system')
    })
  })

  describe('closeWindow', () => {
    it('should remove window from list', () => {
      const win = wm.openWindow({
        appId: 'test',
        title: 'Test'
      })

      expect(wm.getWindow(win.id)).toBeDefined()

      wm.closeWindow(win.id)

      expect(wm.getWindow(win.id)).toBeUndefined()
    })

    it('should emit closed event', () => {
      const spy = vi.fn()
      const win = wm.openWindow({
        appId: 'test',
        title: 'Test'
      })

      wm.onWindowChange(spy)
      wm.closeWindow(win.id)

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'closed', windowId: win.id })
      )
    })

    it('should focus next window when focused window is closed', () => {
      const win1 = wm.openWindow({
        appId: 'test',
        title: 'Test 1'
      })

      const win2 = wm.openWindow({
        appId: 'test',
        title: 'Test 2'
      })

      expect(wm.getFocusedWindow()?.id).toBe(win2.id)

      wm.closeWindow(win2.id)

      expect(wm.getFocusedWindow()?.id).toBe(win1.id)
    })

    it('should handle closing non-existent window gracefully', () => {
      expect(() => wm.closeWindow('nonexistent')).not.toThrow()
    })
  })

  describe('closeAllWindows', () => {
    it('should close all windows for an app', () => {
      wm.openWindow({ appId: 'finder', title: 'F1' })
      wm.openWindow({ appId: 'finder', title: 'F2' })
      wm.openWindow({ appId: 'calculator', title: 'Calc' })

      expect(wm.getWindowsByApp('finder')).toHaveLength(2)

      wm.closeAllWindows('finder')

      expect(wm.getWindowsByApp('finder')).toHaveLength(0)
      expect(wm.getWindowsByApp('calculator')).toHaveLength(1)
    })
  })

  describe('focusWindow', () => {
    it('should bring window to front (z-order)', () => {
      const win1 = wm.openWindow({
        appId: 'test',
        title: 'Test 1'
      })

      const win2 = wm.openWindow({
        appId: 'test',
        title: 'Test 2'
      })

      // win2 is on top
      expect(wm.getAllWindows()[1].id).toBe(win2.id)

      wm.focusWindow(win1.id)

      // win1 is now on top
      expect(wm.getAllWindows()[1].id).toBe(win1.id)
      expect(wm.getFocusedWindow()?.id).toBe(win1.id)
    })

    it('should update focused property on windows', () => {
      const win1 = wm.openWindow({ appId: 'test', title: 'Test 1' })
      const win2 = wm.openWindow({ appId: 'test', title: 'Test 2' })

      expect(wm.getWindow(win1.id)?.focused).toBe(false)
      expect(wm.getWindow(win2.id)?.focused).toBe(true)

      wm.focusWindow(win1.id)

      expect(wm.getWindow(win1.id)?.focused).toBe(true)
      expect(wm.getWindow(win2.id)?.focused).toBe(false)
    })

    it('should emit focus and blur events', () => {
      const win1 = wm.openWindow({
        appId: 'test',
        title: 'Test 1'
      })

      const win2 = wm.openWindow({
        appId: 'test',
        title: 'Test 2'
      })

      const spy = vi.fn()
      wm.onWindowChange(spy)

      wm.focusWindow(win1.id)

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'blurred', windowId: win2.id })
      )
      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'focused', windowId: win1.id })
      )
    })

    it('should handle focusing non-existent window gracefully', () => {
      expect(() => wm.focusWindow('nonexistent')).not.toThrow()
    })
  })

  describe('window state', () => {
    it('should minimize window', () => {
      const win = wm.openWindow({
        appId: 'test',
        title: 'Test'
      })

      wm.minimizeWindow(win.id)

      expect(wm.getWindow(win.id)?.state).toBe('minimized')
    })

    it('should maximize window', () => {
      const win = wm.openWindow({
        appId: 'test',
        title: 'Test'
      })

      wm.maximizeWindow(win.id)

      expect(wm.getWindow(win.id)?.state).toBe('maximized')
    })

    it('should collapse window', () => {
      const win = wm.openWindow({
        appId: 'test',
        title: 'Test'
      })

      wm.collapseWindow(win.id)

      expect(wm.getWindow(win.id)?.state).toBe('collapsed')
    })

    it('should restore window to normal', () => {
      const win = wm.openWindow({
        appId: 'test',
        title: 'Test'
      })

      wm.minimizeWindow(win.id)
      expect(wm.getWindow(win.id)?.state).toBe('minimized')

      wm.restoreWindow(win.id)
      expect(wm.getWindow(win.id)?.state).toBe('normal')
    })

    it('should emit stateChanged event', () => {
      const win = wm.openWindow({
        appId: 'test',
        title: 'Test'
      })

      const spy = vi.fn()
      wm.onWindowChange(spy)

      wm.minimizeWindow(win.id)

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'stateChanged', windowId: win.id })
      )
    })
  })

  describe('move and resize', () => {
    it('should move window', () => {
      const win = wm.openWindow({
        appId: 'test',
        title: 'Test'
      })

      wm.moveWindow(win.id, 200, 300)

      expect(wm.getWindow(win.id)?.bounds.x).toBe(200)
      expect(wm.getWindow(win.id)?.bounds.y).toBe(300)
    })

    it('should emit moved event', () => {
      const win = wm.openWindow({
        appId: 'test',
        title: 'Test'
      })

      const spy = vi.fn()
      wm.onWindowChange(spy)

      wm.moveWindow(win.id, 200, 300)

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'moved', windowId: win.id })
      )
    })

    it('should resize window', () => {
      const win = wm.openWindow({
        appId: 'test',
        title: 'Test'
      })

      wm.resizeWindow(win.id, 600, 500)

      expect(wm.getWindow(win.id)?.bounds.width).toBe(600)
      expect(wm.getWindow(win.id)?.bounds.height).toBe(500)
    })

    it('should respect minimum size on resize', () => {
      const win = wm.openWindow({
        appId: 'test',
        title: 'Test',
        minSize: { width: 200, height: 150 }
      })

      wm.resizeWindow(win.id, 50, 50)

      expect(wm.getWindow(win.id)?.bounds.width).toBe(200)
      expect(wm.getWindow(win.id)?.bounds.height).toBe(150)
    })

    it('should not resize non-resizable window', () => {
      const win = wm.openWindow({
        appId: 'test',
        title: 'Test',
        resizable: false,
        width: 300,
        height: 200
      })

      wm.resizeWindow(win.id, 600, 500)

      expect(wm.getWindow(win.id)?.bounds.width).toBe(300)
      expect(wm.getWindow(win.id)?.bounds.height).toBe(200)
    })

    it('should set bounds partially', () => {
      const win = wm.openWindow({
        appId: 'test',
        title: 'Test',
        x: 100,
        y: 100,
        width: 300,
        height: 200
      })

      wm.setBounds(win.id, { x: 50 })

      const bounds = wm.getWindow(win.id)?.bounds
      expect(bounds?.x).toBe(50)
      expect(bounds?.y).toBe(100)
      expect(bounds?.width).toBe(300)
      expect(bounds?.height).toBe(200)
    })
  })

  describe('setTitle', () => {
    it('should update window title', () => {
      const win = wm.openWindow({
        appId: 'test',
        title: 'Original Title'
      })

      wm.setTitle(win.id, 'New Title')

      expect(wm.getWindow(win.id)?.title).toBe('New Title')
    })
  })

  describe('queries', () => {
    it('should get window by id', () => {
      const win = wm.openWindow({
        appId: 'test',
        title: 'Test'
      })

      expect(wm.getWindow(win.id)).toBe(win)
    })

    it('should return undefined for non-existent window', () => {
      expect(wm.getWindow('nonexistent')).toBeUndefined()
    })

    it('should get windows by app', () => {
      wm.openWindow({ appId: 'finder', title: 'F1' })
      wm.openWindow({ appId: 'finder', title: 'F2' })
      wm.openWindow({ appId: 'calc', title: 'C' })

      const finderWindows = wm.getWindowsByApp('finder')

      expect(finderWindows).toHaveLength(2)
      expect(finderWindows.every(w => w.appId === 'finder')).toBe(true)
    })

    it('should get all windows in z-order', () => {
      const win1 = wm.openWindow({ appId: 'a', title: '1' })
      const win2 = wm.openWindow({ appId: 'a', title: '2' })
      const win3 = wm.openWindow({ appId: 'a', title: '3' })

      const all = wm.getAllWindows()

      // Order: win1 (back), win2, win3 (front)
      expect(all[0].id).toBe(win1.id)
      expect(all[1].id).toBe(win2.id)
      expect(all[2].id).toBe(win3.id)
    })

    it('should get focused window', () => {
      wm.openWindow({ appId: 'a', title: '1' })
      const win2 = wm.openWindow({ appId: 'a', title: '2' })

      expect(wm.getFocusedWindow()?.id).toBe(win2.id)
    })

    it('should return undefined when no windows', () => {
      expect(wm.getFocusedWindow()).toBeUndefined()
    })
  })

  describe('event subscription', () => {
    it('should allow unsubscribing', () => {
      const spy = vi.fn()
      const unsubscribe = wm.onWindowChange(spy)

      wm.openWindow({ appId: 'a', title: '1' })
      expect(spy).toHaveBeenCalled()

      spy.mockClear()
      unsubscribe()

      wm.openWindow({ appId: 'a', title: '2' })
      expect(spy).not.toHaveBeenCalled()
    })
  })
})
