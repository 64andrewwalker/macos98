/**
 * Desktop Service Persistence Integration Tests (TDD)
 * 
 * Tests for DesktopService methods that handle persistence.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createDesktopService } from './desktop-service'
import * as persistence from './desktop-persistence'

// Mock the persistence module
vi.mock('./desktop-persistence', () => ({
  saveDesktopSettings: vi.fn(),
  loadDesktopSettings: vi.fn(),
  clearDesktopSettings: vi.fn()
}))

describe('DesktopService Persistence Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('saveState', () => {
    it('should save current wallpaper to persistence', () => {
      const service = createDesktopService()
      service.setWallpaper('/bg/test.png', 'fill')

      service.saveState()

      expect(persistence.saveDesktopSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          wallpaper: '/bg/test.png',
          wallpaperMode: 'fill'
        })
      )
    })

    it('should save all icon positions to persistence', () => {
      const service = createDesktopService()
      const icon1 = service.addIcon({
        name: 'Calculator',
        icon: '/icons/calc.png',
        position: { x: 100, y: 200 },
        target: { type: 'app', appId: 'calculator' }
      })
      const icon2 = service.addIcon({
        name: 'Finder',
        icon: '/icons/finder.png',
        position: { x: 100, y: 300 },
        target: { type: 'app', appId: 'finder' }
      })

      service.saveState()

      expect(persistence.saveDesktopSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          iconPositions: expect.objectContaining({
            [icon1.id]: { x: 100, y: 200 },
            [icon2.id]: { x: 100, y: 300 }
          })
        })
      )
    })

    it('should auto-save when wallpaper changes', () => {
      const service = createDesktopService({ autoSave: true })

      service.setWallpaper('/bg/new.png', 'tile')

      expect(persistence.saveDesktopSettings).toHaveBeenCalled()
    })

    it('should auto-save when icon is moved', () => {
      const service = createDesktopService({ autoSave: true })
      const icon = service.addIcon({
        name: 'Test',
        icon: '/icons/test.png',
        position: { x: 0, y: 0 },
        target: { type: 'app', appId: 'test' }
      })

      vi.clearAllMocks() // Clear the addIcon auto-save

      service.moveIcon(icon.id, { x: 200, y: 300 })

      expect(persistence.saveDesktopSettings).toHaveBeenCalled()
    })
  })

  describe('restoreState', () => {
    it('should restore wallpaper from persistence', () => {
      vi.mocked(persistence.loadDesktopSettings).mockReturnValue({
        wallpaper: '/bg/saved.png',
        wallpaperMode: 'fit',
        iconPositions: {}
      })

      const service = createDesktopService()
      service.restoreState()

      expect(service.getWallpaper()).toBe('/bg/saved.png')
      expect(service.getWallpaperMode()).toBe('fit')
    })

    it('should restore icon positions from persistence', () => {
      const service = createDesktopService()
      const icon = service.addIcon({
        name: 'Calculator',
        icon: '/icons/calc.png',
        position: { x: 0, y: 0 },
        target: { type: 'app', appId: 'calculator' }
      })

      vi.mocked(persistence.loadDesktopSettings).mockReturnValue({
        wallpaper: '',
        wallpaperMode: 'fill',
        iconPositions: {
          [icon.id]: { x: 500, y: 600 }
        }
      })

      service.restoreState()

      const restoredIcon = service.getIcon(icon.id)
      expect(restoredIcon?.position).toEqual({ x: 500, y: 600 })
    })

    it('should do nothing if no saved state exists', () => {
      vi.mocked(persistence.loadDesktopSettings).mockReturnValue(null)

      const service = createDesktopService()
      service.setWallpaper('/default.png', 'fill')

      service.restoreState()

      // Should remain unchanged
      expect(service.getWallpaper()).toBe('/default.png')
    })
  })

  describe('auto-restore on creation', () => {
    it('should auto-restore state when autoRestore option is true', () => {
      vi.mocked(persistence.loadDesktopSettings).mockReturnValue({
        wallpaper: '/bg/auto-restored.png',
        wallpaperMode: 'tile',
        iconPositions: {}
      })

      const service = createDesktopService({ autoRestore: true })

      expect(service.getWallpaper()).toBe('/bg/auto-restored.png')
    })
  })
})

