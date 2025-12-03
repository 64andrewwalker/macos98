/**
 * Critical Tests: System Bootstrap
 *
 * Tests core system initialization and lifecycle.
 * These tests verify the foundation of the entire application.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { enableVfsInMemoryMode, disableVfsInMemoryMode } from '../kernel/vfs'

// We need to reset modules between tests to test initialization
let bootstrap: typeof import('./bootstrap')

describe('System Bootstrap', () => {
  beforeEach(async () => {
    // Enable in-memory VFS for fast tests
    enableVfsInMemoryMode()

    // Reset module state
    vi.resetModules()
    bootstrap = await import('./bootstrap')
  })

  afterEach(async () => {
    // Shutdown system if running
    await bootstrap.shutdownSystem()
    disableVfsInMemoryMode()
  })

  describe('initializeSystem', () => {
    it('should_create_all_services_when_called', async () => {
      // Act
      const services = await bootstrap.initializeSystem()

      // Assert
      expect(services).toBeDefined()
      expect(services.eventBus).toBeDefined()
      expect(services.taskManager).toBeDefined()
      expect(services.vfs).toBeDefined()
      expect(services.permissions).toBeDefined()
      expect(services.windowManager).toBeDefined()
      expect(services.appRuntime).toBeDefined()
    })

    it('should_return_same_instance_when_called_multiple_times', async () => {
      // Act
      const services1 = await bootstrap.initializeSystem()
      const services2 = await bootstrap.initializeSystem()

      // Assert - Same reference (singleton)
      expect(services1).toBe(services2)
    })

    it('should_register_all_apps_when_initialized', async () => {
      // Act
      const services = await bootstrap.initializeSystem()
      const installedApps = services.appRuntime.getInstalledApps()

      // Assert - All 6 apps should be registered
      expect(installedApps.length).toBe(6)

      const appIds = installedApps.map(app => app.id)
      expect(appIds).toContain('calculator')
      expect(appIds).toContain('tictactoe')
      expect(appIds).toContain('about')
      expect(appIds).toContain('background-switcher')
      expect(appIds).toContain('text-editor')
      expect(appIds).toContain('finder')
    })
  })

  describe('getSystemServices', () => {
    it('should_return_null_before_initialization', async () => {
      // Assert
      expect(bootstrap.getSystemServices()).toBeNull()
    })

    it('should_return_services_after_initialization', async () => {
      // Arrange
      const initServices = await bootstrap.initializeSystem()

      // Act
      const services = bootstrap.getSystemServices()

      // Assert
      expect(services).toBe(initServices)
    })
  })

  describe('shutdownSystem', () => {
    it('should_clear_services_when_called', async () => {
      // Arrange
      await bootstrap.initializeSystem()
      expect(bootstrap.getSystemServices()).not.toBeNull()

      // Act
      await bootstrap.shutdownSystem()

      // Assert
      expect(bootstrap.getSystemServices()).toBeNull()
    })

    it('should_not_throw_when_called_without_initialization', async () => {
      // Act & Assert - Should not throw
      await expect(bootstrap.shutdownSystem()).resolves.toBeUndefined()
    })

    it('should_allow_re_initialization_after_shutdown', async () => {
      // Arrange
      await bootstrap.initializeSystem()
      await bootstrap.shutdownSystem()

      // Act - Reset modules to clear singleton state
      vi.resetModules()
      bootstrap = await import('./bootstrap')
      enableVfsInMemoryMode()
      const services2 = await bootstrap.initializeSystem()

      // Assert - New instance created
      expect(services2).toBeDefined()
      expect(services2.eventBus).toBeDefined()
    })
  })

  describe('App Launch Integration', () => {
    it('should_launch_calculator_via_app_runtime', async () => {
      // Arrange
      const services = await bootstrap.initializeSystem()

      // Act
      const task = await services.appRuntime.launchApp('calculator')

      // Assert
      expect(task).toBeDefined()
      expect(task.appId).toBe('calculator')
      // Task starts in 'ready' state and transitions to 'running'
      expect(['ready', 'running']).toContain(task.state)
    })

    it('should_create_window_when_app_launches', async () => {
      // Arrange
      const services = await bootstrap.initializeSystem()

      // Act
      await services.appRuntime.launchApp('calculator')
      const windows = services.windowManager.getAllWindows()

      // Assert - Calculator should have opened a window
      expect(windows.length).toBeGreaterThan(0)
    })

    it('should_cleanup_windows_when_app_terminates', async () => {
      // Arrange
      const services = await bootstrap.initializeSystem()
      const task = await services.appRuntime.launchApp('calculator')
      const windowsBefore = services.windowManager.getAllWindows()
      expect(windowsBefore.length).toBeGreaterThan(0)

      // Act - terminateApp takes taskId, not appId
      await services.appRuntime.terminateApp(task.id)
      const windowsAfter = services.windowManager.getAllWindows()

      // Assert
      expect(windowsAfter.length).toBe(0)
    })
  })
})

