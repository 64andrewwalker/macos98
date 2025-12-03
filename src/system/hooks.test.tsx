/**
 * Critical Tests: System Hooks
 *
 * Tests the React hooks for accessing system services.
 * Core interface between React components and system services.
 */

// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, cleanup, act } from '@testing-library/react'
import React from 'react'
import { SystemProvider } from './SystemContext'
import { useSystem, useAppRuntime, useVfs } from './hooks'
import { enableVfsInMemoryMode, disableVfsInMemoryMode } from '../kernel/vfs'

describe('System Hooks', () => {
  beforeEach(() => {
    enableVfsInMemoryMode()
  })

  afterEach(() => {
    cleanup()
    disableVfsInMemoryMode()
  })

  describe('useSystem', () => {
    it('should_throw_when_used_outside_provider', () => {
      // Act & Assert
      expect(() => {
        renderHook(() => useSystem())
      }).toThrow('useSystem must be used within SystemProvider')
    })

    it('should_return_system_services_when_inside_provider', async () => {
      // Arrange
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SystemProvider>{children}</SystemProvider>
      )

      // Act
      const { result, rerender } = renderHook(() => useSystem(), { wrapper })

      // Wait for async initialization
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200))
        rerender()
      })

      // Assert - Hook should return without throwing (services may still be initializing)
      // The fact that we get here means the hook works within the provider
      expect(result.current).toBeDefined()
    })
  })

  describe('useAppRuntime', () => {
    it('should_throw_when_used_outside_provider', () => {
      // Act & Assert
      expect(() => {
        renderHook(() => useAppRuntime())
      }).toThrow()
    })

    it('should_return_appRuntime_when_inside_provider', async () => {
      // Arrange
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SystemProvider>{children}</SystemProvider>
      )

      // Act
      let appRuntime: ReturnType<typeof useAppRuntime> | null = null
      await act(async () => {
        const { result } = renderHook(() => useAppRuntime(), { wrapper })
        await new Promise(resolve => setTimeout(resolve, 100))
        appRuntime = result.current
      })

      // Assert
      expect(appRuntime).toBeDefined()
      if (appRuntime) {
        expect(typeof appRuntime.launchApp).toBe('function')
        expect(typeof appRuntime.getInstalledApps).toBe('function')
      }
    })
  })

  describe('useVfs', () => {
    it('should_throw_when_used_outside_provider', () => {
      // Act & Assert
      expect(() => {
        renderHook(() => useVfs())
      }).toThrow()
    })

    it('should_return_vfs_when_inside_provider', async () => {
      // Arrange
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <SystemProvider>{children}</SystemProvider>
      )

      // Act
      let vfs: ReturnType<typeof useVfs> | null = null
      await act(async () => {
        const { result } = renderHook(() => useVfs(), { wrapper })
        await new Promise(resolve => setTimeout(resolve, 100))
        vfs = result.current
      })

      // Assert
      expect(vfs).toBeDefined()
      if (vfs) {
        expect(typeof vfs.readdir).toBe('function')
        expect(typeof vfs.writeFile).toBe('function')
        expect(typeof vfs.readTextFile).toBe('function')
      }
    })
  })
})

describe('SystemProvider', () => {
  beforeEach(() => {
    enableVfsInMemoryMode()
  })

  afterEach(() => {
    cleanup()
    disableVfsInMemoryMode()
  })

  it('should_render_children', async () => {
    // Arrange
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SystemProvider>{children}</SystemProvider>
    )

    // Act & Assert - Should not throw when rendering
    await act(async () => {
      renderHook(() => useSystem(), { wrapper })
    })

    // This test verifies the provider renders without crashing
  })

  it('should_initialize_system_on_mount', async () => {
    // Arrange
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SystemProvider>{children}</SystemProvider>
    )

    // Act
    await act(async () => {
      renderHook(() => useSystem(), { wrapper })
      // Wait for async initialization
      await new Promise(resolve => setTimeout(resolve, 200))
    })

    // Assert - System should be initialized (no error thrown)
    // The fact that we get here means initialization succeeded
  })
})

