/**
 * TextEditor Save Functionality - Smoke Tests
 *
 * Tests the save functionality including:
 * - VFS integration and persistence
 * - Save button states
 * - Error handling
 * - Content synchronization
 * - HTML formatting preservation
 */

// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TextEditor from './TextEditor'
import { SystemContext } from '../../system/context'
import type { SystemServices } from '../../system/bootstrap'

// Mock VFS
const createMockVfs = () => ({
  exists: vi.fn().mockResolvedValue(false),
  readTextFile: vi.fn().mockResolvedValue(''),
  writeFile: vi.fn().mockResolvedValue(undefined),
  mkdir: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
  deleteFile: vi.fn(),
  rmdir: vi.fn()
})

describe('TextEditor Save Functionality', () => {
  let mockVfs: ReturnType<typeof createMockVfs>
  let mockOnSave: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockVfs = createMockVfs()
    mockOnSave = vi.fn()
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  const renderEditorWithVfs = (props?: Partial<{
    fileId: string
    fileName: string
    initialContent: string
  }>) => {
    const systemContext = {
      vfs: mockVfs
    } as unknown as SystemServices

    return render(
      <SystemContext.Provider value={systemContext}>
        <TextEditor
          fileId={props?.fileId ?? 'test-file'}
          fileName={props?.fileName ?? 'Test.txt'}
          initialContent={props?.initialContent ?? ''}
          onSave={mockOnSave}
        />
      </SystemContext.Provider>
    )
  }

  const renderEditorWithoutVfs = (props?: Partial<{
    fileId: string
    fileName: string
    initialContent: string
  }>) => {
    return render(
      <TextEditor
        fileId={props?.fileId ?? 'test-file'}
        fileName={props?.fileName ?? 'Test.txt'}
        initialContent={props?.initialContent ?? ''}
        onSave={mockOnSave}
      />
    )
  }

  describe('Save Button States', () => {
    it('shows save button without asterisk when content is clean', () => {
      renderEditorWithVfs()
      
      const saveButton = screen.getByRole('button', { name: /save/i })
      expect(saveButton).toBeInTheDocument()
      expect(saveButton.textContent).not.toContain('*')
    })

    it('shows asterisk on save button when content is modified', async () => {
      const user = userEvent.setup()
      renderEditorWithVfs()
      
      const editor = screen.getByTestId('text-editor-content')
      await user.click(editor)
      await user.type(editor, 'New content')
      
      const saveButton = screen.getByRole('button', { name: /save/i })
      expect(saveButton.textContent).toContain('*')
    })

    it('shows "Saving..." text while save is in progress', async () => {
      // Make writeFile slow
      mockVfs.writeFile.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      const user = userEvent.setup()
      renderEditorWithVfs()
      
      const editor = screen.getByTestId('text-editor-content')
      await user.click(editor)
      await user.type(editor, 'Test')
      
      const saveButton = screen.getByRole('button', { name: /save/i })
      
      // Start save but don't wait for it
      fireEvent.click(saveButton)
      
      // Should show saving state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument()
      })
    })

    it('disables save button while saving', async () => {
      mockVfs.writeFile.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
      
      const user = userEvent.setup()
      renderEditorWithVfs()
      
      const editor = screen.getByTestId('text-editor-content')
      await user.click(editor)
      await user.type(editor, 'Test')
      
      const saveButton = screen.getByRole('button', { name: /save/i })
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        expect(saveButton).toBeDisabled()
      })
    })

    it('removes asterisk after successful save', async () => {
      mockVfs.writeFile.mockResolvedValue(undefined)
      
      const user = userEvent.setup()
      renderEditorWithVfs()
      
      const editor = screen.getByTestId('text-editor-content')
      await user.click(editor)
      await user.type(editor, 'Test')
      
      const saveButton = screen.getByRole('button', { name: /save/i })
      expect(saveButton.textContent).toContain('*')
      
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(saveButton.textContent).not.toContain('*')
      })
    })
  })

  describe('VFS Integration', () => {
    it('writes content to VFS as HTML on save', async () => {
      const user = userEvent.setup()
      renderEditorWithVfs({ fileId: 'my-file' })
      
      const editor = screen.getByTestId('text-editor-content')
      await user.click(editor)
      await user.type(editor, 'Hello World')
      
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)
      
      // Should save to .html file for rich content
      await waitFor(() => {
        expect(mockVfs.writeFile).toHaveBeenCalledWith(
          '/Users/default/Documents/my-file.html',
          expect.stringContaining('Hello World')
        )
      })
    })

    it('loads existing HTML content from VFS on mount', async () => {
      // Mock exists to return true for .html file
      mockVfs.exists.mockImplementation((path: string) => 
        Promise.resolve(path.endsWith('.html'))
      )
      mockVfs.readTextFile.mockResolvedValue('<b>Saved</b> content from VFS')
      
      renderEditorWithVfs({ fileId: 'existing-file' })
      
      // First checks for .html file
      await waitFor(() => {
        expect(mockVfs.exists).toHaveBeenCalledWith('/Users/default/Documents/existing-file.html')
      })
      
      await waitFor(() => {
        const editor = screen.getByTestId('text-editor-content')
        // textContent strips HTML tags
        expect(editor.textContent).toBe('Saved content from VFS')
        // innerHTML preserves them
        expect(editor.innerHTML).toContain('<b>Saved</b>')
      })
    })

    it('falls back to .txt file if .html does not exist', async () => {
      // Mock exists to return true only for .txt file
      mockVfs.exists.mockImplementation((path: string) => 
        Promise.resolve(path.endsWith('.txt'))
      )
      mockVfs.readTextFile.mockResolvedValue('Plain text content')
      
      renderEditorWithVfs({ fileId: 'old-file' })
      
      // First checks .html, then falls back to .txt
      await waitFor(() => {
        expect(mockVfs.exists).toHaveBeenCalledWith('/Users/default/Documents/old-file.html')
      })
      
      await waitFor(() => {
        expect(mockVfs.exists).toHaveBeenCalledWith('/Users/default/Documents/old-file.txt')
      })
      
      await waitFor(() => {
        const editor = screen.getByTestId('text-editor-content')
        expect(editor.textContent).toBe('Plain text content')
      })
    })

    it('uses initialContent when VFS file does not exist', async () => {
      mockVfs.exists.mockResolvedValue(false)
      
      renderEditorWithVfs({ 
        fileId: 'new-file',
        initialContent: 'Initial content'
      })
      
      // Checks for .html first
      await waitFor(() => {
        expect(mockVfs.exists).toHaveBeenCalledWith('/Users/default/Documents/new-file.html')
      })
      
      // VFS content should not be loaded since file doesn't exist
      await waitFor(() => {
        expect(mockVfs.readTextFile).not.toHaveBeenCalled()
      })
    })

    it('calls onSave callback with plain text content', async () => {
      const user = userEvent.setup()
      renderEditorWithVfs({ fileId: 'callback-file' })
      
      const editor = screen.getByTestId('text-editor-content')
      await user.click(editor)
      await user.type(editor, 'Content')
      
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)
      
      // onSave receives plain text for compatibility
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith('callback-file', 'Content')
      })
    })
  })

  describe('Error Handling', () => {
    it('handles VFS write failure gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockVfs.writeFile.mockRejectedValue(new Error('Write failed'))
      
      const user = userEvent.setup()
      renderEditorWithVfs()
      
      const editor = screen.getByTestId('text-editor-content')
      await user.click(editor)
      await user.type(editor, 'Test')
      
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to save:', expect.any(Error))
      })
      
      // Button should be re-enabled after error
      await waitFor(() => {
        expect(saveButton).not.toBeDisabled()
      })
      
      consoleSpy.mockRestore()
    })

    it('handles VFS load failure gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockVfs.exists.mockRejectedValue(new Error('Read failed'))
      
      renderEditorWithVfs({ initialContent: 'Fallback content' })
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Failed to load from VFS:', expect.any(Error))
      })
      
      // Should still show initial content
      const editor = screen.getByTestId('text-editor-content')
      expect(editor.textContent).toBe('Fallback content')
      
      consoleSpy.mockRestore()
    })
  })

  describe('Without VFS (Legacy Mode)', () => {
    it('only calls onSave callback when VFS is not available', async () => {
      const user = userEvent.setup()
      renderEditorWithoutVfs({ fileId: 'no-vfs-file' })
      
      const editor = screen.getByTestId('text-editor-content')
      await user.click(editor)
      await user.type(editor, 'No VFS content')
      
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith('no-vfs-file', 'No VFS content')
      })
    })

    it('clears dirty state after save without VFS', async () => {
      const user = userEvent.setup()
      renderEditorWithoutVfs()
      
      const editor = screen.getByTestId('text-editor-content')
      await user.click(editor)
      await user.type(editor, 'Test')
      
      const saveButton = screen.getByRole('button', { name: /save/i })
      expect(saveButton.textContent).toContain('*')
      
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(saveButton.textContent).not.toContain('*')
      })
    })
  })

  describe('Content Persistence with Formatting', () => {
    it('persists HTML content correctly across VFS operations', async () => {
      const user = userEvent.setup()
      
      // First render - create new file
      const { unmount } = renderEditorWithVfs({ fileId: 'persist-test' })
      
      const editor = screen.getByTestId('text-editor-content')
      await user.click(editor)
      await user.type(editor, 'Persistent data')
      
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(mockVfs.writeFile).toHaveBeenCalledWith(
          '/Users/default/Documents/persist-test.html',
          expect.stringContaining('Persistent data')
        )
      })
      
      unmount()
      
      // Simulate VFS having the saved content
      mockVfs.exists.mockImplementation((path: string) => 
        Promise.resolve(path.endsWith('.html'))
      )
      mockVfs.readTextFile.mockResolvedValue('Persistent data')
      
      // Second render - should load from VFS
      renderEditorWithVfs({ fileId: 'persist-test' })
      
      await waitFor(() => {
        const reloadedEditor = screen.getByTestId('text-editor-content')
        expect(reloadedEditor.textContent).toBe('Persistent data')
      })
    })

    it('preserves HTML formatting when saving', async () => {
      renderEditorWithVfs()
      
      const editor = screen.getByTestId('text-editor-content')
      // Set HTML content directly
      editor.innerHTML = '<b>Bold</b> and <i>italic</i>'
      fireEvent.input(editor)
      
      const saveButton = screen.getByRole('button', { name: /save/i })
      fireEvent.click(saveButton)
      
      await waitFor(() => {
        const savedContent = mockVfs.writeFile.mock.calls[0][1] as string
        expect(savedContent).toContain('<b>Bold</b>')
        expect(savedContent).toContain('<i>italic</i>')
      })
    })

    it('handles special characters in content', async () => {
      const user = userEvent.setup()
      renderEditorWithVfs()
      
      const editor = screen.getByTestId('text-editor-content')
      await user.click(editor)
      
      // Type special characters - note: userEvent may have issues with some chars
      editor.textContent = '特殊字符 & <script>alert("xss")</script>'
      fireEvent.input(editor)
      
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(mockVfs.writeFile).toHaveBeenCalled()
      })
    })

    it('handles empty content save', async () => {
      const user = userEvent.setup()
      renderEditorWithVfs({ initialContent: 'Initial' })
      
      const editor = screen.getByTestId('text-editor-content')
      await user.click(editor)
      
      // Clear content
      editor.textContent = ''
      fireEvent.input(editor)
      
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(mockVfs.writeFile).toHaveBeenCalledWith(
          expect.any(String),
          ''
        )
      })
    })

    it('handles very long content', async () => {
      const longContent = 'A'.repeat(10000)
      mockVfs.exists.mockImplementation((path: string) => 
        Promise.resolve(path.endsWith('.html'))
      )
      mockVfs.readTextFile.mockResolvedValue(longContent)
      
      renderEditorWithVfs()
      
      await waitFor(() => {
        const editor = screen.getByTestId('text-editor-content')
        expect(editor.textContent).toBe(longContent)
      })
    })
  })

  describe('Status Bar Integration', () => {
    it('shows "Modified" in status bar when dirty', async () => {
      const user = userEvent.setup()
      renderEditorWithVfs()
      
      // Initially no "Modified" text
      expect(screen.queryByText('Modified')).not.toBeInTheDocument()
      
      const editor = screen.getByTestId('text-editor-content')
      await user.click(editor)
      await user.type(editor, 'X')
      
      // Should show "Modified"
      await waitFor(() => {
        expect(screen.getByText('Modified')).toBeInTheDocument()
      })
    })

    it('removes "Modified" from status bar after save', async () => {
      const user = userEvent.setup()
      renderEditorWithVfs()
      
      const editor = screen.getByTestId('text-editor-content')
      await user.click(editor)
      await user.type(editor, 'X')
      
      await waitFor(() => {
        expect(screen.getByText('Modified')).toBeInTheDocument()
      })
      
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(screen.queryByText('Modified')).not.toBeInTheDocument()
      })
    })
  })

  describe('File ID Handling', () => {
    it('uses correct VFS path based on fileId', async () => {
      const user = userEvent.setup()
      renderEditorWithVfs({ fileId: 'my-special-file' })
      
      const editor = screen.getByTestId('text-editor-content')
      await user.click(editor)
      await user.type(editor, 'Test')
      
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(mockVfs.writeFile).toHaveBeenCalledWith(
          '/Users/default/Documents/my-special-file.html',
          expect.any(String)
        )
      })
    })

    it('handles fileId with path separators', async () => {
      mockVfs.exists.mockResolvedValue(false)
      renderEditorWithVfs({ fileId: 'subdir/nested-file' })
      
      await waitFor(() => {
        expect(mockVfs.exists).toHaveBeenCalledWith(
          '/Users/default/Documents/subdir/nested-file.html'
        )
      })
    })
  })

  describe('Multiple Save Operations', () => {
    it('handles rapid successive saves', async () => {
      const user = userEvent.setup()
      renderEditorWithVfs()
      
      const editor = screen.getByTestId('text-editor-content')
      await user.click(editor)
      await user.type(editor, 'Test')
      
      const saveButton = screen.getByRole('button', { name: /save/i })
      
      // Click save multiple times quickly
      await user.click(saveButton)
      await user.click(saveButton)
      await user.click(saveButton)
      
      // Should handle gracefully (button disabled during save)
      await waitFor(() => {
        // At least one save should complete
        expect(mockVfs.writeFile.mock.calls.length).toBeGreaterThanOrEqual(1)
      })
    })

    it('saves latest content after multiple edits', async () => {
      const user = userEvent.setup()
      renderEditorWithVfs()
      
      const editor = screen.getByTestId('text-editor-content')
      await user.click(editor)
      
      // Multiple edits
      await user.type(editor, 'First')
      editor.innerHTML = 'Second'
      fireEvent.input(editor)
      editor.innerHTML = 'Final content'
      fireEvent.input(editor)
      
      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)
      
      await waitFor(() => {
        expect(mockVfs.writeFile).toHaveBeenLastCalledWith(
          expect.any(String),
          'Final content'
        )
      })
    })
  })
})
