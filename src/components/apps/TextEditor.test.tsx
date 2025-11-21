// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import TextEditor from './TextEditor'

const defaultProps = {
  fileId: 'file-1',
  fileName: 'notes.rtf',
  initialContent: 'Hello World',
  onSave: vi.fn()
}

const getEditor = () => screen.getByTestId('text-editor-content')

beforeEach(() => {
  defaultProps.onSave.mockClear()
  ;(document as any).execCommand = vi.fn()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('TextEditor', () => {
  it('renders toolbar controls and status bar info', () => {
    render(<TextEditor {...defaultProps} />)

    expect(screen.getByTitle('Bold (粗体)')).toBeInTheDocument()
    expect(screen.getByTitle('Italic (斜体)')).toBeInTheDocument()
    expect(screen.getByTitle('Underline (下划线)')).toBeInTheDocument()
    expect(screen.getByTitle('Align Left')).toBeInTheDocument()
    expect(screen.getByTitle('Center')).toBeInTheDocument()
    expect(screen.getByTitle('Align Right')).toBeInTheDocument()
    expect(screen.getByTitle('Word Wrap')).toBeInTheDocument()
    expect(screen.getByTitle('Show Ruler')).toBeInTheDocument()
    expect(screen.getByTitle('Save (保存)')).toHaveTextContent('💾 Save')
    expect(screen.getByText(defaultProps.fileName)).toBeInTheDocument()
    expect(screen.getByText('Lines: 1')).toBeInTheDocument()
    expect(screen.getByText('Characters: 0')).toBeInTheDocument()
  })

  it('loads initial content into the editor area', async () => {
    render(<TextEditor {...defaultProps} />)

    const editor = getEditor()
    await waitFor(() => expect(editor.innerText).toBe(defaultProps.initialContent))
  })

  it('applies formatting commands and alignment', () => {
    render(<TextEditor {...defaultProps} />)

    fireEvent.click(screen.getByTitle('Bold (粗体)'))
    fireEvent.click(screen.getByTitle('Italic (斜体)'))
    fireEvent.click(screen.getByTitle('Underline (下划线)'))
    fireEvent.click(screen.getByTitle('Center'))

    expect(document.execCommand).toHaveBeenCalledWith('bold')
    expect(document.execCommand).toHaveBeenCalledWith('italic')
    expect(document.execCommand).toHaveBeenCalledWith('underline')
    expect(document.execCommand).toHaveBeenCalledWith('justifyCenter')
    expect(getEditor().style.textAlign).toBe('center')
  })

  it('changes font family and size', () => {
    render(<TextEditor {...defaultProps} />)

    fireEvent.change(screen.getByDisplayValue('Geneva'), { target: { value: 'Times' } })
    fireEvent.change(screen.getByDisplayValue('12'), { target: { value: '18' } })

    expect(document.execCommand).toHaveBeenCalledWith('fontName', false, 'Times')
    expect(getEditor().style.fontSize).toBe('18px')
  })

  it('toggles word wrap and ruler visibility', () => {
    render(<TextEditor {...defaultProps} />)

    const editor = getEditor()
    const wordWrapButton = screen.getByTitle('Word Wrap')
    expect(editor.style.whiteSpace).toBe('pre-wrap')

    fireEvent.click(wordWrapButton)
    expect(editor.style.whiteSpace).toBe('pre')

    const rulerButton = screen.getByTitle('Show Ruler')
    expect(screen.queryByText('0')).not.toBeInTheDocument()
    fireEvent.click(rulerButton)
    expect(screen.getByText('0')).toBeInTheDocument()
    expect(screen.getByText('95')).toBeInTheDocument()
  })

  it('marks content as dirty, updates stats, and saves changes', async () => {
    render(<TextEditor {...defaultProps} />)

    const editor = getEditor()
    editor.innerText = 'Line 1\nLine 2'
    editor.innerHTML = 'Line 1<br>Line 2'
    fireEvent.input(editor)

    await waitFor(() => {
      expect(screen.getByText('Lines: 2')).toBeInTheDocument()
      expect(screen.getByText('Characters: 13')).toBeInTheDocument()
    })

    const saveButton = screen.getByTitle('Save (保存)')
    expect(saveButton).toHaveTextContent('Save *')

    fireEvent.click(saveButton)
    expect(defaultProps.onSave).toHaveBeenCalledWith('file-1', 'Line 1<br>Line 2')
    expect(saveButton).toHaveTextContent('💾 Save')
  })

  it('opens and closes the help dialog', () => {
    render(<TextEditor {...defaultProps} />)

    fireEvent.click(screen.getByTitle('Help (帮助)'))
    expect(screen.getByText('Text Editor Help')).toBeInTheDocument()

    fireEvent.click(screen.getByText('OK'))
    expect(screen.queryByText('Text Editor Help')).not.toBeInTheDocument()
  })
})
