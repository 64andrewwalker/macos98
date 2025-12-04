/**
 * Critical Tests: OpenDialog Component
 *
 * Tests the file browser dialog's UI and basic interactions.
 * VFS integration is tested via System Bootstrap tests.
 */

// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import OpenDialog from './OpenDialog'

// Mock folder icon
vi.mock('../../assets/folder_icon.png', () => ({ default: 'folder-icon.png' }))

// Mock SystemContext to return null (no VFS)
vi.mock('../../system/context', () => ({
  SystemContext: {
    Provider: ({ children }: { children: React.ReactNode }) => children
  }
}))

// Mock React.useContext to return null
vi.mock('react', async () => {
  const actual = await vi.importActual('react')
  return {
    ...actual,
    useContext: () => null
  }
})

describe('OpenDialog', () => {
  const mockOnClose = vi.fn()
  const mockOnOpen = vi.fn()

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should_render_dialog_title', () => {
      // Act
      render(<OpenDialog onClose={mockOnClose} onOpen={mockOnOpen} />)

      // Assert - Find title by class or structure (since "Open" appears twice)
      const header = document.querySelector('[class*="header"]')
      expect(header).toBeInTheDocument()
      expect(header?.textContent).toBe('Open')
    })

    it('should_render_cancel_button', () => {
      // Act
      render(<OpenDialog onClose={mockOnClose} onOpen={mockOnOpen} />)

      // Assert
      expect(screen.getByText('Cancel')).toBeInTheDocument()
    })

    it('should_render_open_button_disabled_initially', () => {
      // Act
      render(<OpenDialog onClose={mockOnClose} onOpen={mockOnOpen} />)

      // Assert
      const openButton = screen.getByRole('button', { name: 'Open' })
      expect(openButton).toBeDisabled()
    })

    it('should_render_path_selector', () => {
      // Act
      render(<OpenDialog onClose={mockOnClose} onOpen={mockOnOpen} />)

      // Assert
      const select = document.querySelector('select')
      expect(select).toBeInTheDocument()
    })

    it('should_render_up_button', () => {
      // Act
      render(<OpenDialog onClose={mockOnClose} onOpen={mockOnOpen} />)

      // Assert
      expect(screen.getByText('▲')).toBeInTheDocument()
    })

    it('should_show_no_files_when_vfs_unavailable', () => {
      // Act
      render(<OpenDialog onClose={mockOnClose} onOpen={mockOnOpen} />)

      // Assert - Without VFS, should show "No files"
      expect(screen.getByText('No files')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should_call_onClose_when_cancel_clicked', () => {
      // Act
      render(<OpenDialog onClose={mockOnClose} onOpen={mockOnOpen} />)
      fireEvent.click(screen.getByText('Cancel'))

      // Assert
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })

    it('should_not_call_onOpen_when_nothing_selected', () => {
      // Act
      render(<OpenDialog onClose={mockOnClose} onOpen={mockOnOpen} />)
      const openButton = screen.getByRole('button', { name: 'Open' })
      fireEvent.click(openButton)

      // Assert
      expect(mockOnOpen).not.toHaveBeenCalled()
    })

    it('should_render_overlay_for_modal_backdrop', () => {
      // Act
      render(<OpenDialog onClose={mockOnClose} onOpen={mockOnOpen} />)

      // Assert
      const overlay = document.querySelector('[class*="overlay"]')
      expect(overlay).toBeInTheDocument()
    })
  })

  describe('Path Display', () => {
    it('should_show_current_directory_name', () => {
      // Act
      render(<OpenDialog onClose={mockOnClose} onOpen={mockOnOpen} />)

      // Assert - Default path is /Users/default/Documents, so "Documents" should show
      expect(screen.getByText('Documents')).toBeInTheDocument()
    })

    it('should_have_path_options_in_selector', () => {
      // Act
      render(<OpenDialog onClose={mockOnClose} onOpen={mockOnOpen} />)

      // Assert
      expect(screen.getByText('/')).toBeInTheDocument()
      expect(screen.getByText('/Users')).toBeInTheDocument()
      expect(screen.getByText('/Users/default')).toBeInTheDocument()
      expect(screen.getByText('/Users/default/Documents')).toBeInTheDocument()
    })
  })
})
