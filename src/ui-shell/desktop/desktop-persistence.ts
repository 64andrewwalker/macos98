/**
 * Desktop Persistence - UI Shell Layer
 * 
 * Handles saving and loading desktop settings (wallpaper, icon positions)
 * to localStorage for persistence across page reloads.
 */

import type { IconPosition } from './types'

const STORAGE_KEY = 'macos98-desktop-settings'

/**
 * Desktop settings that can be persisted
 */
export interface DesktopSettings {
  /** Wallpaper URL or asset path */
  wallpaper: string
  /** Wallpaper display mode */
  wallpaperMode: 'tile' | 'center' | 'fill' | 'fit'
  /** Map of icon ID to position */
  iconPositions: Record<string, IconPosition>
}

/**
 * Type guard to validate DesktopSettings structure
 */
function isValidDesktopSettings(obj: unknown): obj is DesktopSettings {
  if (typeof obj !== 'object' || obj === null) return false
  
  const settings = obj as Record<string, unknown>
  
  if (typeof settings.wallpaper !== 'string') return false
  if (!['tile', 'center', 'fill', 'fit'].includes(settings.wallpaperMode as string)) return false
  if (typeof settings.iconPositions !== 'object' || settings.iconPositions === null) return false
  
  // Validate each icon position
  const positions = settings.iconPositions as Record<string, unknown>
  for (const key in positions) {
    const pos = positions[key] as Record<string, unknown>
    if (typeof pos !== 'object' || pos === null) return false
    if (typeof pos.x !== 'number' || typeof pos.y !== 'number') return false
  }
  
  return true
}

/**
 * Save desktop settings to localStorage
 */
export function saveDesktopSettings(settings: DesktopSettings): void {
  try {
    const json = JSON.stringify(settings)
    localStorage.setItem(STORAGE_KEY, json)
  } catch (e) {
    console.error('Failed to save desktop settings:', e)
  }
}

/**
 * Load desktop settings from localStorage
 * Returns null if no settings are saved or data is invalid
 */
export function loadDesktopSettings(): DesktopSettings | null {
  try {
    const json = localStorage.getItem(STORAGE_KEY)
    if (!json) return null
    
    const parsed = JSON.parse(json)
    
    if (!isValidDesktopSettings(parsed)) {
      return null
    }
    
    return parsed
  } catch (e) {
    console.error('Failed to load desktop settings:', e)
    return null
  }
}

/**
 * Clear saved desktop settings
 */
export function clearDesktopSettings(): void {
  localStorage.removeItem(STORAGE_KEY)
}

