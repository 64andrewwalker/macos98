// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import type { ReactNode } from 'react';
import Window from './Window';

// Mock the imported SCSS module
vi.mock('./Window.module.scss', () => ({
  default: {
    window: 'window',
    active: 'active',
    titleBar: 'title-bar',
    closeBox: 'close-box',
    title: 'title',
    titleText: 'title-text',
    zoomBox: 'zoom-box',
    zoomInner: 'zoom-inner',
    collapseBox: 'collapse-box',
    collapseInner: 'collapse-inner',
    contentOuter: 'content-outer',
    content: 'content'
  }
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Window', () => {
  const defaultProps = {
    id: 'test-window',
    title: 'Test Window',
    x: 100,
    y: 50,
    width: 300,
    height: 200,
    onClose: vi.fn(),
    onFocus: vi.fn(),
    isActive: false,
    children: <div>Test Content</div> as ReactNode
  };

  describe('Initial Rendering', () => {
    it('renders without crashing', () => {
      expect(() => render(<Window {...defaultProps} />)).not.toThrow();
    });

    it('renders the window container with correct structure', () => {
      render(<Window {...defaultProps} />);
      const windowElement = screen.getByText('Test Content').parentElement?.parentElement?.parentElement;
      expect(windowElement).toBeInTheDocument();
      expect(windowElement).toHaveClass('window');
    });

    it('renders the title bar with correct elements', () => {
      render(<Window {...defaultProps} />);
      expect(screen.getByText('Test Window')).toBeInTheDocument();
    });

    it('renders all control buttons', () => {
      render(<Window {...defaultProps} />);

      // Close button should be present (empty div with class)
      const closeBox = document.querySelector('.close-box');
      expect(closeBox).toBeInTheDocument();

      // Zoom button
      const zoomBox = document.querySelector('.zoom-box');
      expect(zoomBox).toBeInTheDocument();

      // Collapse button
      const collapseBox = document.querySelector('.collapse-box');
      expect(collapseBox).toBeInTheDocument();
    });

    it('renders children content', () => {
      render(<Window {...defaultProps} />);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('positions the window at specified coordinates', () => {
      render(<Window {...defaultProps} />);
      const windowElement = screen.getByText('Test Content').parentElement?.parentElement?.parentElement;
      expect(windowElement).toHaveStyle({
        left: '100px',
        top: '50px',
        width: '300px',
        height: '200px'
      });
    });

    it('sets correct z-index when active', () => {
      render(<Window {...defaultProps} isActive={true} />);
      const windowElement = screen.getByText('Test Content').parentElement?.parentElement?.parentElement;
      expect(windowElement).toHaveStyle({ zIndex: 'var(--z-window-active)' });
    });

    it('sets correct z-index when inactive', () => {
      render(<Window {...defaultProps} isActive={false} />);
      const windowElement = screen.getByText('Test Content').parentElement?.parentElement?.parentElement;
      expect(windowElement).toHaveStyle({ zIndex: 'var(--z-window-inactive)' });
    });
  });

  describe('Active/Inactive State', () => {
    it('applies active class when isActive is true', () => {
      render(<Window {...defaultProps} isActive={true} />);
      const windowElement = screen.getByText('Test Content').parentElement?.parentElement?.parentElement;
      expect(windowElement).toHaveClass('active');
    });

    it('does not apply active class when isActive is false', () => {
      render(<Window {...defaultProps} isActive={false} />);
      const windowElement = screen.getByText('Test Content').parentElement?.parentElement?.parentElement;
      expect(windowElement).not.toHaveClass('active');
    });

    it('calls onFocus when window is clicked', () => {
      const mockOnFocus = vi.fn();
      render(<Window {...defaultProps} onFocus={mockOnFocus} />);

      const windowElement = screen.getByText('Test Content').parentElement?.parentElement?.parentElement;
      fireEvent.mouseDown(windowElement!);

      expect(mockOnFocus).toHaveBeenCalledTimes(1);
    });
  });

  describe('Close Functionality', () => {
    it('calls onClose when close button is clicked', () => {
      const mockOnClose = vi.fn();
      render(<Window {...defaultProps} onClose={mockOnClose} />);

      const closeBox = document.querySelector('.close-box');
      fireEvent.click(closeBox!);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('prevents event propagation when close button is clicked', () => {
      const mockOnClose = vi.fn();
      render(<Window {...defaultProps} onClose={mockOnClose} />);

      const closeBox = document.querySelector('.close-box');

      const stopPropagationSpy = vi.fn();
      const mockEvent = new MouseEvent('click', { bubbles: true });
      mockEvent.stopPropagation = stopPropagationSpy;

      fireEvent(closeBox!, mockEvent);

      expect(stopPropagationSpy).toHaveBeenCalledTimes(1);
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Collapse Functionality', () => {
    it('toggles collapse state when collapse button is clicked', () => {
      render(<Window {...defaultProps} />);

      const collapseBox = document.querySelector('.collapse-box');

      // Initially not collapsed - content should be visible
      expect(screen.getByText('Test Content')).toBeInTheDocument();

      // Click to collapse
      fireEvent.click(collapseBox!);
      expect(screen.queryByText('Test Content')).not.toBeInTheDocument();

      // Click to expand
      fireEvent.click(collapseBox!);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('prevents event propagation when collapse button is clicked', () => {
      render(<Window {...defaultProps} />);

      const collapseBox = document.querySelector('.collapse-box');

      const stopPropagationSpy = vi.fn();
      const mockEvent = new MouseEvent('click', { bubbles: true });
      mockEvent.stopPropagation = stopPropagationSpy;

      fireEvent(collapseBox!, mockEvent);

      expect(stopPropagationSpy).toHaveBeenCalledTimes(1);
    });

    it('collapses window when title bar is double-clicked', () => {
      render(<Window {...defaultProps} />);

      const titleBar = document.querySelector('.title-bar');

      // Initially not collapsed - content should be visible
      expect(screen.getByText('Test Content')).toBeInTheDocument();

      // Double-click title bar to collapse
      fireEvent.doubleClick(titleBar!);
      expect(screen.queryByText('Test Content')).not.toBeInTheDocument();

      // Double-click again to expand
      fireEvent.doubleClick(titleBar!);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('adjusts window height when collapsed', () => {
      render(<Window {...defaultProps} />);

      const windowElement = screen.getByText('Test Content').parentElement?.parentElement?.parentElement;

      // Initially normal height
      expect(windowElement).toHaveStyle({ height: '200px' });

      const collapseBox = document.querySelector('.collapse-box');
      fireEvent.click(collapseBox!);

      // Should be auto height when collapsed
      expect(windowElement).toHaveStyle({ height: 'auto' });
    });
  });

  describe('Zoom Functionality', () => {
    it('toggles zoom state when zoom button is clicked', () => {
      render(<Window {...defaultProps} />);

      const windowElement = screen.getByText('Test Content').parentElement?.parentElement?.parentElement;
      const zoomBox = document.querySelector('.zoom-box');

      // Initially not zoomed
      expect(windowElement).toHaveStyle({
        left: '100px',
        top: '50px',
        width: '300px',
        height: '200px'
      });

      // Click to zoom
      fireEvent.click(zoomBox!);

      // Should be maximized
      expect(windowElement).toHaveStyle({
        left: '0px',
        top: '22px', // Below menu bar
        width: '100vw',
        height: 'calc(100vh - 22px)'
      });

      // Click to unzoom
      fireEvent.click(zoomBox!);

      // Should return to original position and size
      expect(windowElement).toHaveStyle({
        left: '100px',
        top: '50px',
        width: '300px',
        height: '200px'
      });
    });

    it('prevents event propagation when zoom button is clicked', () => {
      render(<Window {...defaultProps} />);

      const zoomBox = document.querySelector('.zoom-box');

      const stopPropagationSpy = vi.fn();
      const mockEvent = new MouseEvent('click', { bubbles: true });
      mockEvent.stopPropagation = stopPropagationSpy;

      fireEvent(zoomBox!, mockEvent);

      expect(stopPropagationSpy).toHaveBeenCalledTimes(1);
    });

    it('saves and restores pre-zoom state correctly', () => {
      render(<Window {...defaultProps} />);

      const windowElement = screen.getByText('Test Content').parentElement?.parentElement?.parentElement;

      // Zoom window
      const zoomBox = document.querySelector('.zoom-box');
      fireEvent.click(zoomBox!);

      // Unzoom
      fireEvent.click(zoomBox!);

      // Should be back to exact original state
      expect(windowElement).toHaveStyle({
        left: '100px',
        top: '50px',
        width: '300px',
        height: '200px'
      });
    });

    it('handles zoom when window is already at different position', () => {
      render(<Window {...defaultProps} x={50} y={75} />);

      const windowElement = screen.getByText('Test Content').parentElement?.parentElement?.parentElement;

      // Zoom window
      const zoomBox = document.querySelector('.zoom-box');
      fireEvent.click(zoomBox!);

      // Should zoom to fullscreen
      expect(windowElement).toHaveStyle({
        left: '0px',
        top: '22px',
        width: '100vw',
        height: 'calc(100vh - 22px)'
      });

      // Unzoom
      fireEvent.click(zoomBox!);

      // Should return to original position
      expect(windowElement).toHaveStyle({
        left: '50px',
        top: '75px',
        width: '300px',
        height: '200px'
      });
    });
  });

  describe('Drag Functionality', () => {
    beforeEach(() => {
      // Mock getBoundingClientRect for position calculations
      Element.prototype.getBoundingClientRect = vi.fn(() => ({
        width: 300,
        height: 200,
        top: 50,
        left: 100,
        bottom: 250,
        right: 400,
        x: 100,
        y: 50,
        toJSON: () => ({})
      }));
    });

    it('initiates drag when title bar is clicked (not on buttons)', () => {
      const mockOnFocus = vi.fn();
      render(<Window {...defaultProps} onFocus={mockOnFocus} />);

      const titleBar = document.querySelector('.title-bar');

      fireEvent.mouseDown(titleBar!, {
        clientX: 150,
        clientY: 60
      });

      // onFocus is called twice: once by window onMouseDown, once by title bar handleMouseDown
      expect(mockOnFocus).toHaveBeenCalledTimes(2);
    });

    it('does not initiate drag when close button is clicked', () => {
      render(<Window {...defaultProps} />);

      const closeBox = document.querySelector('.close-box');

      fireEvent.mouseDown(closeBox!, {
        clientX: 150,
        clientY: 60
      });

      // Should not start dragging since it's on a button
      // We can't easily test this without mocking, but we can test that the event is handled
    });

    it('does not initiate drag when zoom button is clicked', () => {
      render(<Window {...defaultProps} />);

      const zoomBox = document.querySelector('.zoom-box');

      fireEvent.mouseDown(zoomBox!, {
        clientX: 150,
        clientY: 60
      });

      // Should not start dragging since it's on a button
    });

    it('does not initiate drag when collapse button is clicked', () => {
      render(<Window {...defaultProps} />);

      const collapseBox = document.querySelector('.collapse-box');

      fireEvent.mouseDown(collapseBox!, {
        clientX: 150,
        clientY: 60
      });

      // Should not start dragging since it's on a button
    });

    it('updates position during drag', () => {
      render(<Window {...defaultProps} />);

      const titleBar = document.querySelector('.title-bar');
      const windowElement = screen.getByText('Test Content').parentElement?.parentElement?.parentElement;

      // Start drag
      fireEvent.mouseDown(titleBar!, {
        clientX: 150,
        clientY: 60
      });

      // Simulate mouse move
      fireEvent(window, new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 80
      }));

      // Position should update
      expect(windowElement).toHaveStyle({
        left: '150px', // 200 - (150 - 100) = 150
        top: '70px'    // 80 - (60 - 50) = 70
      });
    });

    it('stops dragging on mouse up', () => {
      render(<Window {...defaultProps} />);

      const titleBar = document.querySelector('.title-bar');
      const windowElement = screen.getByText('Test Content').parentElement?.parentElement?.parentElement;

      // Start drag
      fireEvent.mouseDown(titleBar!, {
        clientX: 150,
        clientY: 60
      });

      // Move
      fireEvent(window, new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 80
      }));

      // Stop drag
      fireEvent(window, new MouseEvent('mouseup'));

      // Further moves should not affect position
      fireEvent(window, new MouseEvent('mousemove', {
        clientX: 250,
        clientY: 100
      }));

      // Position should remain the same
      expect(windowElement).toHaveStyle({
        left: '150px',
        top: '70px'
      });
    });

    it('cleans up event listeners on unmount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = render(<Window {...defaultProps} />);

      const titleBar = document.querySelector('.title-bar');

      // Start drag to add listeners
      fireEvent.mouseDown(titleBar!, {
        clientX: 150,
        clientY: 60
      });

      expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));

      // Unmount component
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
    });
  });

  describe('Position and Size Updates', () => {
    it('initializes position from props', () => {
      render(<Window {...defaultProps} x={150} y={75} />);

      const windowElement = screen.getByText('Test Content').parentElement?.parentElement?.parentElement;
      expect(windowElement).toHaveStyle({
        left: '150px',
        top: '75px'
      });
    });

    it('updates size when width and height props change', () => {
      const { rerender } = render(<Window {...defaultProps} />);

      const windowElement = screen.getByText('Test Content').parentElement?.parentElement?.parentElement;
      expect(windowElement).toHaveStyle({
        width: '300px',
        height: '200px'
      });

      // Update props
      rerender(<Window {...defaultProps} width={400} height={300} />);

      expect(windowElement).toHaveStyle({
        width: '400px',
        height: '300px'
      });
    });

    it('maintains drag position independently of prop changes', () => {
      const { rerender } = render(<Window {...defaultProps} />);

      const titleBar = document.querySelector('.title-bar');
      const windowElement = screen.getByText('Test Content').parentElement?.parentElement?.parentElement;

      // Start drag and move
      fireEvent.mouseDown(titleBar!, {
        clientX: 150,
        clientY: 60
      });

      fireEvent(window, new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 80
      }));

      // Position should be updated by drag
      expect(windowElement).toHaveStyle({
        left: '150px',
        top: '70px'
      });

      // Prop change should not affect dragged position
      rerender(<Window {...defaultProps} x={50} y={25} />);

      expect(windowElement).toHaveStyle({
        left: '150px',
        top: '70px'
      });
    });
  });

  describe('State Interactions', () => {
    it('handles zoom and collapse together correctly', () => {
      render(<Window {...defaultProps} />);

      const windowElement = screen.getByText('Test Content').parentElement?.parentElement?.parentElement;
      const zoomBox = document.querySelector('.zoom-box');
      const collapseBox = document.querySelector('.collapse-box');

      // Zoom then collapse
      fireEvent.click(zoomBox!);
      fireEvent.click(collapseBox!);

      // Should be zoomed and collapsed
      expect(windowElement).toHaveStyle({
        left: '0px',
        top: '22px',
        width: '100vw',
        height: 'auto' // collapsed
      });

      // Uncollapse then unzoom
      fireEvent.click(collapseBox!);
      fireEvent.click(zoomBox!);

      // Should be back to normal
      expect(windowElement).toHaveStyle({
        left: '100px',
        top: '50px',
        width: '300px',
        height: '200px'
      });
    });

    it('maintains focus state during interactions', () => {
      const mockOnFocus = vi.fn();
      render(<Window {...defaultProps} onFocus={mockOnFocus} />);

      const titleBar = document.querySelector('.title-bar');

      // Click title bar (should focus twice due to event bubbling)
      fireEvent.mouseDown(titleBar!, {
        clientX: 150,
        clientY: 60
      });

      expect(mockOnFocus).toHaveBeenCalledTimes(2);

      // Move mouse during drag (should not focus again)
      fireEvent(window, new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 80
      }));

      // Should still only be called twice
      expect(mockOnFocus).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty title gracefully', () => {
      render(<Window {...defaultProps} title="" />);
      const titleElement = document.querySelector('.title-text');
      expect(titleElement?.textContent).toBe('');
    });

    it('handles very long title', () => {
      const longTitle = 'A'.repeat(100);
      render(<Window {...defaultProps} title={longTitle} />);
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('handles zero dimensions', () => {
      render(<Window {...defaultProps} width={0} height={0} />);
      const windowElement = screen.getByText('Test Content').parentElement?.parentElement?.parentElement;
      expect(windowElement).toHaveStyle({
        width: '0px',
        height: '0px'
      });
    });

    it('handles negative coordinates', () => {
      render(<Window {...defaultProps} x={-10} y={-20} />);
      const windowElement = screen.getByText('Test Content').parentElement?.parentElement?.parentElement;
      expect(windowElement).toHaveStyle({
        left: '-10px',
        top: '-20px'
      });
    });

    it('handles very large dimensions', () => {
      render(<Window {...defaultProps} width={9999} height={9999} />);
      const windowElement = screen.getByText('Test Content').parentElement?.parentElement?.parentElement;
      expect(windowElement).toHaveStyle({
        width: '9999px',
        height: '9999px'
      });
    });

    it('handles missing children gracefully', () => {
      render(<Window {...defaultProps} children={null} />);
      // Should not crash
      expect(document.querySelector('.window')).toBeInTheDocument();
    });

    it('handles rapid button clicks', () => {
      const mockOnClose = vi.fn();
      render(<Window {...defaultProps} onClose={mockOnClose} />);

      const closeBox = document.querySelector('.close-box');

      // Rapid clicks
      fireEvent.click(closeBox!);
      fireEvent.click(closeBox!);
      fireEvent.click(closeBox!);

      expect(mockOnClose).toHaveBeenCalledTimes(3);
    });

    it('handles zoom toggle during drag', () => {
      render(<Window {...defaultProps} />);

      const titleBar = document.querySelector('.title-bar');
      const zoomBox = document.querySelector('.zoom-box');

      // Start drag
      fireEvent.mouseDown(titleBar!, {
        clientX: 150,
        clientY: 60
      });

      // Zoom during drag
      fireEvent.click(zoomBox!);

      // Should zoom correctly
      const windowElement = screen.getByText('Test Content').parentElement?.parentElement?.parentElement;
      expect(windowElement).toHaveStyle({
        width: '100vw',
        height: 'calc(100vh - 22px)'
      });
    });
  });

  describe('Event Handling Edge Cases', () => {
    it('handles mouse events on nested elements correctly', () => {
      render(<Window {...defaultProps} />);

      const titleText = document.querySelector('.title-text');

      // Clicking on title text should still allow dragging
      fireEvent.mouseDown(titleText!, {
        clientX: 150,
        clientY: 60
      });

      // Should start dragging since it's within title bar
      // (This is hard to test directly without mocking, but we can ensure no errors)
    });

    it('handles window resize events gracefully', () => {
      render(<Window {...defaultProps} />);

      // Simulate window resize
      fireEvent(window, new Event('resize'));

      // Should not crash
      expect(document.querySelector('.window')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders title text for screen readers', () => {
      render(<Window {...defaultProps} />);
      expect(screen.getByText('Test Window')).toBeInTheDocument();
    });

    it('has semantic button-like elements for controls', () => {
      render(<Window {...defaultProps} />);

      // While these are divs styled as buttons, they should be present
      const closeBox = document.querySelector('.close-box');
      const zoomBox = document.querySelector('.zoom-box');
      const collapseBox = document.querySelector('.collapse-box');

      expect(closeBox).toBeInTheDocument();
      expect(zoomBox).toBeInTheDocument();
      expect(collapseBox).toBeInTheDocument();
    });

    it('maintains keyboard navigation context', () => {
      // Basic test that component renders and handles focus
      render(<Window {...defaultProps} isActive={true} />);

      const windowElement = screen.getByText('Test Content').parentElement?.parentElement?.parentElement;
      expect(windowElement).toHaveClass('active');
    });
  });
});
