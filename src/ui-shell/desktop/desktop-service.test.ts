/**
 * Desktop Service Tests - UI Shell Layer
 *
 * Tests for icon management, selection, and wallpaper.
 * Based on design-docs/05-ui-shell-layer-spec.md
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createDesktopService } from './desktop-service'
import type { DesktopService } from './types'

describe('DesktopService', () => {
  let desktop: DesktopService

  beforeEach(() => {
    desktop = createDesktopService()
  })

  describe('wallpaper', () => {
    it('should set wallpaper', () => {
      desktop.setWallpaper('/images/wallpaper.jpg')

      expect(desktop.getWallpaper()).toBe('/images/wallpaper.jpg')
    })

    it('should set wallpaper mode', () => {
      desktop.setWallpaper('/images/wallpaper.jpg', 'fill')

      expect(desktop.getWallpaperMode()).toBe('fill')
    })

    it('should default to tile mode', () => {
      expect(desktop.getWallpaperMode()).toBe('tile')
    })

    it('should emit wallpaperChanged event', () => {
      const spy = vi.fn()
      desktop.onChange(spy)

      desktop.setWallpaper('/images/wallpaper.jpg')

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'wallpaperChanged' })
      )
    })
  })

  describe('addIcon', () => {
    it('should add icon with generated id', () => {
      const icon = desktop.addIcon({
        name: 'Documents',
        icon: '/icons/folder.png',
        position: { x: 100, y: 100 },
        target: { type: 'folder', path: '/Documents' }
      })

      expect(icon.id).toBeDefined()
      expect(icon.id.length).toBeGreaterThan(0)
    })

    it('should store icon properties', () => {
      const icon = desktop.addIcon({
        name: 'Calculator',
        icon: '/icons/calc.png',
        position: { x: 200, y: 50 },
        target: { type: 'app', appId: 'calculator' }
      })

      expect(icon.name).toBe('Calculator')
      expect(icon.icon).toBe('/icons/calc.png')
      expect(icon.position).toEqual({ x: 200, y: 50 })
      expect(icon.target).toEqual({ type: 'app', appId: 'calculator' })
    })

    it('should emit iconAdded event', () => {
      const spy = vi.fn()
      desktop.onChange(spy)

      desktop.addIcon({
        name: 'Test',
        icon: '/test.png',
        position: { x: 0, y: 0 },
        target: { type: 'app', appId: 'test' }
      })

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'iconAdded' })
      )
    })
  })

  describe('removeIcon', () => {
    it('should remove icon by id', () => {
      const icon = desktop.addIcon({
        name: 'Test',
        icon: '/test.png',
        position: { x: 0, y: 0 },
        target: { type: 'app', appId: 'test' }
      })

      expect(desktop.getIcon(icon.id)).toBeDefined()

      desktop.removeIcon(icon.id)

      expect(desktop.getIcon(icon.id)).toBeUndefined()
    })

    it('should emit iconRemoved event', () => {
      const icon = desktop.addIcon({
        name: 'Test',
        icon: '/test.png',
        position: { x: 0, y: 0 },
        target: { type: 'app', appId: 'test' }
      })

      const spy = vi.fn()
      desktop.onChange(spy)

      desktop.removeIcon(icon.id)

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'iconRemoved', iconId: icon.id })
      )
    })

    it('should handle removing non-existent icon gracefully', () => {
      expect(() => desktop.removeIcon('nonexistent')).not.toThrow()
    })

    it('should clear selection when icon is removed', () => {
      const icon = desktop.addIcon({
        name: 'Test',
        icon: '/test.png',
        position: { x: 0, y: 0 },
        target: { type: 'app', appId: 'test' }
      })

      desktop.selectIcon(icon.id)
      expect(desktop.getSelectedIconIds()).toContain(icon.id)

      desktop.removeIcon(icon.id)

      expect(desktop.getSelectedIconIds()).not.toContain(icon.id)
    })
  })

  describe('moveIcon', () => {
    it('should update icon position', () => {
      const icon = desktop.addIcon({
        name: 'Test',
        icon: '/test.png',
        position: { x: 0, y: 0 },
        target: { type: 'app', appId: 'test' }
      })

      desktop.moveIcon(icon.id, { x: 150, y: 250 })

      expect(desktop.getIcon(icon.id)?.position).toEqual({ x: 150, y: 250 })
    })

    it('should emit iconMoved event', () => {
      const icon = desktop.addIcon({
        name: 'Test',
        icon: '/test.png',
        position: { x: 0, y: 0 },
        target: { type: 'app', appId: 'test' }
      })

      const spy = vi.fn()
      desktop.onChange(spy)

      desktop.moveIcon(icon.id, { x: 150, y: 250 })

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'iconMoved', iconId: icon.id })
      )
    })

    it('should handle moving non-existent icon gracefully', () => {
      expect(() => desktop.moveIcon('nonexistent', { x: 0, y: 0 })).not.toThrow()
    })
  })

  describe('getAllIcons', () => {
    it('should return all icons', () => {
      desktop.addIcon({ name: 'A', icon: '/a.png', position: { x: 0, y: 0 }, target: { type: 'app', appId: 'a' } })
      desktop.addIcon({ name: 'B', icon: '/b.png', position: { x: 100, y: 0 }, target: { type: 'app', appId: 'b' } })
      desktop.addIcon({ name: 'C', icon: '/c.png', position: { x: 200, y: 0 }, target: { type: 'app', appId: 'c' } })

      expect(desktop.getAllIcons()).toHaveLength(3)
    })

    it('should return empty array when no icons', () => {
      expect(desktop.getAllIcons()).toEqual([])
    })

    it('should return a copy of icons array', () => {
      desktop.addIcon({ name: 'Test', icon: '/test.png', position: { x: 0, y: 0 }, target: { type: 'app', appId: 'test' } })

      const icons = desktop.getAllIcons()
      icons.pop() // Modify the returned array

      expect(desktop.getAllIcons()).toHaveLength(1)
    })
  })

  describe('arrangeIcons', () => {
    it('should arrange icons in a grid', () => {
      desktop.addIcon({ name: 'A', icon: '/a.png', position: { x: 500, y: 500 }, target: { type: 'app', appId: 'a' } })
      desktop.addIcon({ name: 'B', icon: '/b.png', position: { x: 600, y: 600 }, target: { type: 'app', appId: 'b' } })
      desktop.addIcon({ name: 'C', icon: '/c.png', position: { x: 700, y: 700 }, target: { type: 'app', appId: 'c' } })

      desktop.arrangeIcons()

      const icons = desktop.getAllIcons()
      // First icon should be at top-left margin
      expect(icons[0].position.x).toBe(20)
      expect(icons[0].position.y).toBe(20)
    })
  })

  describe('selection', () => {
    it('should select an icon', () => {
      const icon = desktop.addIcon({
        name: 'Test',
        icon: '/test.png',
        position: { x: 0, y: 0 },
        target: { type: 'app', appId: 'test' }
      })

      desktop.selectIcon(icon.id)

      expect(desktop.getSelectedIconIds()).toContain(icon.id)
    })

    it('should clear previous selection when selecting without multi', () => {
      const icon1 = desktop.addIcon({ name: 'A', icon: '/a.png', position: { x: 0, y: 0 }, target: { type: 'app', appId: 'a' } })
      const icon2 = desktop.addIcon({ name: 'B', icon: '/b.png', position: { x: 100, y: 0 }, target: { type: 'app', appId: 'b' } })

      desktop.selectIcon(icon1.id)
      desktop.selectIcon(icon2.id)

      expect(desktop.getSelectedIconIds()).toEqual([icon2.id])
    })

    it('should add to selection with multi=true', () => {
      const icon1 = desktop.addIcon({ name: 'A', icon: '/a.png', position: { x: 0, y: 0 }, target: { type: 'app', appId: 'a' } })
      const icon2 = desktop.addIcon({ name: 'B', icon: '/b.png', position: { x: 100, y: 0 }, target: { type: 'app', appId: 'b' } })

      desktop.selectIcon(icon1.id)
      desktop.selectIcon(icon2.id, true)

      expect(desktop.getSelectedIconIds()).toContain(icon1.id)
      expect(desktop.getSelectedIconIds()).toContain(icon2.id)
    })

    it('should clear selection', () => {
      const icon = desktop.addIcon({ name: 'Test', icon: '/test.png', position: { x: 0, y: 0 }, target: { type: 'app', appId: 'test' } })

      desktop.selectIcon(icon.id)
      expect(desktop.getSelectedIconIds()).toHaveLength(1)

      desktop.clearSelection()

      expect(desktop.getSelectedIconIds()).toHaveLength(0)
    })

    it('should emit selectionChanged event', () => {
      const icon = desktop.addIcon({ name: 'Test', icon: '/test.png', position: { x: 0, y: 0 }, target: { type: 'app', appId: 'test' } })

      const spy = vi.fn()
      desktop.onChange(spy)

      desktop.selectIcon(icon.id)

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'selectionChanged' })
      )
    })

    it('should get selected icons', () => {
      const icon1 = desktop.addIcon({ name: 'A', icon: '/a.png', position: { x: 0, y: 0 }, target: { type: 'app', appId: 'a' } })
      const icon2 = desktop.addIcon({ name: 'B', icon: '/b.png', position: { x: 100, y: 0 }, target: { type: 'app', appId: 'b' } })

      desktop.selectIcon(icon1.id)
      desktop.selectIcon(icon2.id, true)

      const selected = desktop.getSelectedIcons()
      expect(selected).toHaveLength(2)
      expect(selected.map(i => i.id)).toContain(icon1.id)
      expect(selected.map(i => i.id)).toContain(icon2.id)
    })

    it('should handle selecting non-existent icon gracefully', () => {
      expect(() => desktop.selectIcon('nonexistent')).not.toThrow()
      expect(desktop.getSelectedIconIds()).toHaveLength(0)
    })
  })

  describe('icon double-click', () => {
    it('should trigger double-click callback', () => {
      const icon = desktop.addIcon({ name: 'Test', icon: '/test.png', position: { x: 0, y: 0 }, target: { type: 'app', appId: 'test' } })

      const spy = vi.fn()
      desktop.onIconDoubleClick(spy)

      desktop.triggerIconDoubleClick(icon.id)

      expect(spy).toHaveBeenCalledWith(icon)
    })

    it('should allow unsubscribing from double-click', () => {
      const icon = desktop.addIcon({ name: 'Test', icon: '/test.png', position: { x: 0, y: 0 }, target: { type: 'app', appId: 'test' } })

      const spy = vi.fn()
      const unsubscribe = desktop.onIconDoubleClick(spy)

      unsubscribe()
      desktop.triggerIconDoubleClick(icon.id)

      expect(spy).not.toHaveBeenCalled()
    })

    it('should not trigger for non-existent icon', () => {
      const spy = vi.fn()
      desktop.onIconDoubleClick(spy)

      desktop.triggerIconDoubleClick('nonexistent')

      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('context menu', () => {
    it('should trigger context menu callback', () => {
      const spy = vi.fn()
      desktop.onContextMenu(spy)

      desktop.triggerContextMenu(150, 200)

      expect(spy).toHaveBeenCalledWith({ x: 150, y: 200, iconId: undefined })
    })

    it('should include icon id when provided', () => {
      const icon = desktop.addIcon({ name: 'Test', icon: '/test.png', position: { x: 0, y: 0 }, target: { type: 'app', appId: 'test' } })

      const spy = vi.fn()
      desktop.onContextMenu(spy)

      desktop.triggerContextMenu(150, 200, icon.id)

      expect(spy).toHaveBeenCalledWith({ x: 150, y: 200, iconId: icon.id })
    })

    it('should allow unsubscribing from context menu', () => {
      const spy = vi.fn()
      const unsubscribe = desktop.onContextMenu(spy)

      unsubscribe()
      desktop.triggerContextMenu(150, 200)

      expect(spy).not.toHaveBeenCalled()
    })
  })

  describe('event subscription', () => {
    it('should allow unsubscribing from onChange', () => {
      const spy = vi.fn()
      const unsubscribe = desktop.onChange(spy)

      desktop.setWallpaper('/test.jpg')
      expect(spy).toHaveBeenCalled()

      spy.mockClear()
      unsubscribe()

      desktop.setWallpaper('/test2.jpg')
      expect(spy).not.toHaveBeenCalled()
    })
  })
})

