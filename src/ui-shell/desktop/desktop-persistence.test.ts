/**
 * Desktop Persistence Tests (TDD)
 * 
 * Tests for persisting desktop state (wallpaper, icon positions) to storage.
 * Following TDD: RED → GREEN → REFACTOR
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  saveDesktopSettings,
  loadDesktopSettings,
  type DesktopSettings
} from './desktop-persistence'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: vi.fn(() => { store = {} }),
    get length() { return Object.keys(store).length },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null)
  }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })

describe('Desktop Persistence', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  describe('saveDesktopSettings', () => {
    it('should save wallpaper URL to localStorage', () => {
      const settings: DesktopSettings = {
        wallpaper: '/assets/wallpaper.png',
        wallpaperMode: 'fill',
        iconPositions: {}
      }

      saveDesktopSettings(settings)

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'macos98-desktop-settings',
        expect.any(String)
      )

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
      expect(savedData.wallpaper).toBe('/assets/wallpaper.png')
    })

    it('should save wallpaper mode to localStorage', () => {
      const settings: DesktopSettings = {
        wallpaper: '/assets/bg.png',
        wallpaperMode: 'tile',
        iconPositions: {}
      }

      saveDesktopSettings(settings)

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
      expect(savedData.wallpaperMode).toBe('tile')
    })

    it('should save icon positions to localStorage', () => {
      const settings: DesktopSettings = {
        wallpaper: '',
        wallpaperMode: 'fill',
        iconPositions: {
          'icon-1': { x: 100, y: 200 },
          'icon-2': { x: 300, y: 400 }
        }
      }

      saveDesktopSettings(settings)

      const savedData = JSON.parse(localStorageMock.setItem.mock.calls[0][1])
      expect(savedData.iconPositions['icon-1']).toEqual({ x: 100, y: 200 })
      expect(savedData.iconPositions['icon-2']).toEqual({ x: 300, y: 400 })
    })
  })

  describe('loadDesktopSettings', () => {
    it('should return null when no settings are saved', () => {
      const settings = loadDesktopSettings()
      expect(settings).toBeNull()
    })

    it('should load saved wallpaper settings', () => {
      const savedSettings: DesktopSettings = {
        wallpaper: '/assets/saved-bg.png',
        wallpaperMode: 'fit',
        iconPositions: {}
      }
      localStorageMock.setItem('macos98-desktop-settings', JSON.stringify(savedSettings))

      const settings = loadDesktopSettings()

      expect(settings).not.toBeNull()
      expect(settings!.wallpaper).toBe('/assets/saved-bg.png')
      expect(settings!.wallpaperMode).toBe('fit')
    })

    it('should load saved icon positions', () => {
      const savedSettings: DesktopSettings = {
        wallpaper: '',
        wallpaperMode: 'fill',
        iconPositions: {
          'calc': { x: 50, y: 100 },
          'finder': { x: 150, y: 100 }
        }
      }
      localStorageMock.setItem('macos98-desktop-settings', JSON.stringify(savedSettings))

      const settings = loadDesktopSettings()

      expect(settings!.iconPositions['calc']).toEqual({ x: 50, y: 100 })
      expect(settings!.iconPositions['finder']).toEqual({ x: 150, y: 100 })
    })

    it('should return null for invalid JSON', () => {
      localStorageMock.setItem('macos98-desktop-settings', 'invalid-json')

      const settings = loadDesktopSettings()

      expect(settings).toBeNull()
    })

    it('should return null for incomplete settings', () => {
      localStorageMock.setItem('macos98-desktop-settings', JSON.stringify({ wallpaper: 'test' }))

      const settings = loadDesktopSettings()

      // Should return null or provide defaults for missing fields
      expect(settings).toBeNull()
    })
  })

  describe('persistence integration', () => {
    it('should round-trip settings correctly', () => {
      const original: DesktopSettings = {
        wallpaper: '/bg/pattern.png',
        wallpaperMode: 'tile',
        iconPositions: {
          'hd': { x: 20, y: 20 },
          'documents': { x: 20, y: 110 },
          'calculator': { x: 20, y: 200 }
        }
      }

      saveDesktopSettings(original)
      const loaded = loadDesktopSettings()

      expect(loaded).toEqual(original)
    })
  })
})

