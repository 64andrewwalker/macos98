// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ContextMenu from './ContextMenu'

const baseProps = {
  x: 10,
  y: 20,
  visible: true,
  items: [
    { label: 'Open', action: vi.fn() },
    { label: 'Delete', action: vi.fn() }
  ],
  onClose: vi.fn()
}

afterEach(() => {
  vi.useRealTimers()
})

describe('ContextMenu', () => {
  it('does not render when not visible', () => {
    render(<ContextMenu {...baseProps} visible={false} />)
    expect(screen.queryByText('Open')).not.toBeInTheDocument()
  })

  it('renders items and handles item click', () => {
    const onClose = vi.fn()
    const action = vi.fn()

    render(<ContextMenu {...baseProps} onClose={onClose} items={[{ label: 'Open', action }]} />)

    fireEvent.click(screen.getByText('Open'))

    expect(action).toHaveBeenCalledTimes(1)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes when clicking outside', () => {
    vi.useFakeTimers()
    const onClose = vi.fn()

    render(<ContextMenu {...baseProps} onClose={onClose} />)

    vi.runAllTimers()
    fireEvent.click(document.body)

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
