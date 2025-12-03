/**
 * AppManifest Tests - App Framework Layer
 *
 * TDD tests for manifest validation and registry.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  validateManifest,
  createManifest,
  createManifestRegistry,
  type ManifestRegistry
} from './manifest'
import type { AppManifest } from './types'

describe('validateManifest', () => {
  it('should reject non-object manifest', () => {
    expect(validateManifest(null).valid).toBe(false)
    expect(validateManifest(undefined).valid).toBe(false)
    expect(validateManifest('string').valid).toBe(false)
    expect(validateManifest(123).valid).toBe(false)
  })

  it('should require id field', () => {
    const result = validateManifest({
      name: 'Test',
      version: '1.0.0',
      icon: '/icon.png'
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.field === 'id')).toBe(true)
  })

  it('should validate id format', () => {
    const valid = validateManifest({
      id: 'my-app',
      name: 'Test',
      version: '1.0.0',
      icon: '/icon.png'
    })
    expect(valid.valid).toBe(true)

    const invalid = validateManifest({
      id: 'MyApp',
      name: 'Test',
      version: '1.0.0',
      icon: '/icon.png'
    })
    expect(invalid.valid).toBe(false)
    expect(invalid.errors[0].field).toBe('id')
  })

  it('should require name field', () => {
    const result = validateManifest({
      id: 'test',
      version: '1.0.0',
      icon: '/icon.png'
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.field === 'name')).toBe(true)
  })

  it('should require version field', () => {
    const result = validateManifest({
      id: 'test',
      name: 'Test',
      icon: '/icon.png'
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.field === 'version')).toBe(true)
  })

  it('should validate semantic version format', () => {
    const valid1 = validateManifest({
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      icon: '/icon.png'
    })
    expect(valid1.valid).toBe(true)

    const valid2 = validateManifest({
      id: 'test',
      name: 'Test',
      version: '2.1.3-beta.1',
      icon: '/icon.png'
    })
    expect(valid2.valid).toBe(true)

    const invalid = validateManifest({
      id: 'test',
      name: 'Test',
      version: 'v1.0',
      icon: '/icon.png'
    })
    expect(invalid.valid).toBe(false)
    expect(invalid.errors[0].field).toBe('version')
  })

  it('should require icon field', () => {
    const result = validateManifest({
      id: 'test',
      name: 'Test',
      version: '1.0.0'
    })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.field === 'icon')).toBe(true)
  })

  it('should validate permissions structure', () => {
    const valid = validateManifest({
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      icon: '/icon.png',
      permissions: {
        fs: [{ path: '/home', mode: 'read' }],
        services: ['clipboard']
      }
    })
    expect(valid.valid).toBe(true)

    const invalidFs = validateManifest({
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      icon: '/icon.png',
      permissions: {
        fs: 'invalid'
      }
    })
    expect(invalidFs.valid).toBe(false)
  })

  it('should validate fileAssociations structure', () => {
    const valid = validateManifest({
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      icon: '/icon.png',
      fileAssociations: [
        { mimeTypes: ['text/plain'], extensions: ['.txt'], role: 'editor' }
      ]
    })
    expect(valid.valid).toBe(true)

    const invalidRole = validateManifest({
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      icon: '/icon.png',
      fileAssociations: [
        { mimeTypes: ['text/plain'], extensions: ['.txt'], role: 'invalid' }
      ]
    })
    expect(invalidRole.valid).toBe(false)
  })

  it('should collect multiple errors', () => {
    const result = validateManifest({})
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(1)
  })
})

describe('createManifest', () => {
  it('should create manifest with defaults', () => {
    const manifest = createManifest({
      id: 'my-app',
      name: 'My App'
    })

    expect(manifest.id).toBe('my-app')
    expect(manifest.name).toBe('My App')
    expect(manifest.version).toBe('1.0.0')
    expect(manifest.icon).toBe('/icons/my-app.png')
  })

  it('should allow overriding defaults', () => {
    const manifest = createManifest({
      id: 'my-app',
      name: 'My App',
      version: '2.0.0',
      icon: '/custom/icon.png'
    })

    expect(manifest.version).toBe('2.0.0')
    expect(manifest.icon).toBe('/custom/icon.png')
  })
})

describe('ManifestRegistry', () => {
  let registry: ManifestRegistry

  const validManifest: AppManifest = {
    id: 'test-app',
    name: 'Test App',
    version: '1.0.0',
    icon: '/icon.png'
  }

  beforeEach(() => {
    registry = createManifestRegistry()
  })

  describe('register', () => {
    it('should register a valid manifest', () => {
      registry.register(validManifest)
      expect(registry.get('test-app')).toEqual(validManifest)
    })

    it('should throw on invalid manifest', () => {
      expect(() => registry.register({} as AppManifest)).toThrow()
    })

    it('should allow overwriting existing manifest', () => {
      registry.register(validManifest)

      const updated = { ...validManifest, name: 'Updated Name' }
      registry.register(updated)

      expect(registry.get('test-app')?.name).toBe('Updated Name')
    })
  })

  describe('unregister', () => {
    it('should remove a registered manifest', () => {
      registry.register(validManifest)
      registry.unregister('test-app')
      expect(registry.get('test-app')).toBeUndefined()
    })

    it('should be no-op for non-existent app', () => {
      expect(() => registry.unregister('non-existent')).not.toThrow()
    })
  })

  describe('get', () => {
    it('should return manifest by id', () => {
      registry.register(validManifest)
      expect(registry.get('test-app')).toEqual(validManifest)
    })

    it('should return undefined for unknown id', () => {
      expect(registry.get('unknown')).toBeUndefined()
    })
  })

  describe('getAll', () => {
    it('should return all registered manifests', () => {
      const manifest2: AppManifest = {
        id: 'another-app',
        name: 'Another App',
        version: '1.0.0',
        icon: '/icon2.png'
      }

      registry.register(validManifest)
      registry.register(manifest2)

      const all = registry.getAll()
      expect(all).toHaveLength(2)
      expect(all.map(m => m.id).sort()).toEqual(['another-app', 'test-app'])
    })

    it('should return empty array when no apps registered', () => {
      expect(registry.getAll()).toEqual([])
    })
  })

  describe('findByExtension', () => {
    it('should find apps by file extension', () => {
      const textEditor: AppManifest = {
        id: 'text-editor',
        name: 'TextEdit',
        version: '1.0.0',
        icon: '/icon.png',
        fileAssociations: [
          { mimeTypes: ['text/plain'], extensions: ['.txt', '.md'], role: 'editor' }
        ]
      }

      registry.register(validManifest)
      registry.register(textEditor)

      expect(registry.findByExtension('.txt')).toEqual([textEditor])
      expect(registry.findByExtension('txt')).toEqual([textEditor])
      expect(registry.findByExtension('.pdf')).toEqual([])
    })
  })

  describe('findByMimeType', () => {
    it('should find apps by MIME type', () => {
      const imageViewer: AppManifest = {
        id: 'image-viewer',
        name: 'Preview',
        version: '1.0.0',
        icon: '/icon.png',
        fileAssociations: [
          { mimeTypes: ['image/png', 'image/jpeg'], extensions: ['.png', '.jpg'], role: 'viewer' }
        ]
      }

      registry.register(validManifest)
      registry.register(imageViewer)

      expect(registry.findByMimeType('image/png')).toEqual([imageViewer])
      expect(registry.findByMimeType('image/gif')).toEqual([])
    })
  })
})

