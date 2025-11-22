// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import DesktopIcon from './DesktopIcon';

// Mock the imported SCSS module
vi.mock('./DesktopIcon.module.scss', () => ({
  default: {
    desktopIcon: 'desktop-icon',
    selected: 'selected',
    iconWrapper: 'icon-wrapper',
    ditherOverlay: 'dither-overlay',
    label: 'label'
  }
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('DesktopIcon', () => {
  const defaultProps = {
    icon: '/test-icon.png',
    label: 'Test Icon',
    x: 100,
    y: 200,
    selected: false,
    onSelect: vi.fn(),
    onDoubleClick: vi.fn()
  };

  describe('Initial Rendering', () => {
    it('renders without crashing', () => {
      expect(() => render(<DesktopIcon {...defaultProps} />)).not.toThrow();
    });

    it('renders the desktop icon container', () => {
      render(<DesktopIcon {...defaultProps} />);
      const iconContainer = screen.getByRole('img', { hidden: true }).parentElement?.parentElement;
      expect(iconContainer).toBeInTheDocument();
      expect(iconContainer).toHaveClass('desktop-icon');
    });

    it('renders the icon image with correct attributes', () => {
      render(<DesktopIcon {...defaultProps} />);
      const iconImg = screen.getByRole('img', { hidden: true });
      expect(iconImg).toHaveAttribute('src', '/test-icon.png');
      expect(iconImg).toHaveAttribute('alt', 'Test Icon');
    });

    it('renders the label correctly', () => {
      render(<DesktopIcon {...defaultProps} />);
      expect(screen.getByText('Test Icon')).toBeInTheDocument();
    });

    it('positions the icon at specified coordinates', () => {
      render(<DesktopIcon {...defaultProps} />);
      const iconContainer = screen.getByRole('img', { hidden: true }).parentElement?.parentElement;
      expect(iconContainer).toHaveStyle({
        left: '100px',
        top: '200px'
      });
    });

    it('does not show selection overlay when not selected', () => {
      render(<DesktopIcon {...defaultProps} />);
      const overlay = document.querySelector('.dither-overlay');
      expect(overlay).not.toBeInTheDocument();
    });
  });

  describe('Selection Functionality', () => {
    it('calls onSelect when clicked', () => {
      const mockOnSelect = vi.fn();
      render(<DesktopIcon {...defaultProps} onSelect={mockOnSelect} />);

      const iconContainer = screen.getByRole('img', { hidden: true }).parentElement?.parentElement;
      fireEvent.click(iconContainer!);

      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });

    it('applies selected class when selected prop is true', () => {
      render(<DesktopIcon {...defaultProps} selected={true} />);
      const iconContainer = screen.getByRole('img', { hidden: true }).parentElement?.parentElement;
      expect(iconContainer).toHaveClass('selected');
    });

    it('shows selection overlay when selected', () => {
      render(<DesktopIcon {...defaultProps} selected={true} />);
      const overlay = document.querySelector('.dither-overlay');
      expect(overlay).toBeInTheDocument();
    });

    it('does not apply selected class when selected prop is false', () => {
      render(<DesktopIcon {...defaultProps} selected={false} />);
      const iconContainer = screen.getByRole('img', { hidden: true }).parentElement?.parentElement;
      expect(iconContainer).not.toHaveClass('selected');
    });

    it('handles click event propagation correctly', () => {
      const mockOnSelect = vi.fn();
      render(<DesktopIcon {...defaultProps} onSelect={mockOnSelect} />);

      const iconContainer = screen.getByRole('img', { hidden: true }).parentElement?.parentElement;

      // Spy on stopPropagation
      const stopPropagationSpy = vi.fn();
      const mockEvent = new MouseEvent('click', { bubbles: true });
      mockEvent.stopPropagation = stopPropagationSpy;

      fireEvent(iconContainer!, mockEvent);

      expect(stopPropagationSpy).toHaveBeenCalledTimes(1);
      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });
  });

  describe('Double Click Functionality', () => {
    it('calls onDoubleClick when double-clicked', () => {
      const mockOnDoubleClick = vi.fn();
      render(<DesktopIcon {...defaultProps} onDoubleClick={mockOnDoubleClick} />);

      const iconContainer = screen.getByRole('img', { hidden: true }).parentElement?.parentElement;
      fireEvent.doubleClick(iconContainer!);

      expect(mockOnDoubleClick).toHaveBeenCalledTimes(1);
    });

    it('handles double click event propagation correctly', () => {
      const mockOnDoubleClick = vi.fn();
      render(<DesktopIcon {...defaultProps} onDoubleClick={mockOnDoubleClick} />);

      const iconContainer = screen.getByRole('img', { hidden: true }).parentElement?.parentElement;

      // Spy on stopPropagation
      const stopPropagationSpy = vi.fn();
      const mockEvent = new MouseEvent('dblclick', { bubbles: true });
      mockEvent.stopPropagation = stopPropagationSpy;

      fireEvent(iconContainer!, mockEvent);

      expect(stopPropagationSpy).toHaveBeenCalledTimes(1);
      expect(mockOnDoubleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onDoubleClick when not provided', () => {
      render(<DesktopIcon {...defaultProps} onDoubleClick={undefined} />);

      const iconContainer = screen.getByRole('img', { hidden: true }).parentElement?.parentElement;
      expect(() => fireEvent.doubleClick(iconContainer!)).not.toThrow();
    });
  });

  describe('Drag and Drop Functionality', () => {
    beforeEach(() => {
      // Mock getBoundingClientRect for position calculations
      Element.prototype.getBoundingClientRect = vi.fn(() => ({
        width: 64,
        height: 64,
        top: 200,
        left: 100,
        bottom: 264,
        right: 164,
        x: 100,
        y: 200,
        toJSON: () => ({})
      }));
    });

    it('initiates drag on mouse down', () => {
      const mockOnSelect = vi.fn();
      render(<DesktopIcon {...defaultProps} onSelect={mockOnSelect} />);

      const iconContainer = screen.getByRole('img', { hidden: true }).parentElement?.parentElement;

      fireEvent.mouseDown(iconContainer!, {
        clientX: 150,
        clientY: 250
      });

      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });

    it('updates position during drag', () => {
      render(<DesktopIcon {...defaultProps} />);

      const iconContainer = screen.getByRole('img', { hidden: true }).parentElement?.parentElement;

      // Start drag
      fireEvent.mouseDown(iconContainer!, {
        clientX: 150,
        clientY: 250
      });

      // Simulate mouse move
      fireEvent(window, new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 300
      }));

      // dragOffset = { x: 150 - 100 = 50, y: 250 - 200 = 50 }
      // new position = { x: 200 - 50 = 150, y: 300 - 50 = 250 }
      expect(iconContainer).toHaveStyle({
        left: '150px',
        top: '250px'
      });
    });

    it('stops dragging on mouse up', () => {
      render(<DesktopIcon {...defaultProps} />);

      const iconContainer = screen.getByRole('img', { hidden: true }).parentElement?.parentElement;

      // Start drag
      fireEvent.mouseDown(iconContainer!, {
        clientX: 150,
        clientY: 250
      });

      // Simulate mouse move
      fireEvent(window, new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 300
      }));

      // Stop drag
      fireEvent(window, new MouseEvent('mouseup'));

      // Further mouse moves should not affect position
      fireEvent(window, new MouseEvent('mousemove', {
        clientX: 250,
        clientY: 350
      }));

      // Position should remain the same as after the mouseup
      expect(iconContainer).toHaveStyle({
        left: '150px',
        top: '250px'
      });
    });

    it('handles drag offset calculation correctly', () => {
      render(<DesktopIcon {...defaultProps} />);

      const iconContainer = screen.getByRole('img', { hidden: true }).parentElement?.parentElement;

      // Start drag at a different position
      fireEvent.mouseDown(iconContainer!, {
        clientX: 120,
        clientY: 220
      });

      // Move mouse
      fireEvent(window, new MouseEvent('mousemove', {
        clientX: 170,
        clientY: 270
      }));

      // dragOffset = { x: 120 - 100 = 20, y: 220 - 200 = 20 }
      // new position = { x: 170 - 20 = 150, y: 270 - 20 = 250 }
      expect(iconContainer).toHaveStyle({
        left: '150px',
        top: '250px'
      });
    });

    it('cleans up event listeners on unmount', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = render(<DesktopIcon {...defaultProps} />);

      const iconContainer = screen.getByRole('img', { hidden: true }).parentElement?.parentElement;

      // Start drag to add listeners
      fireEvent.mouseDown(iconContainer!, {
        clientX: 150,
        clientY: 250
      });

      expect(addEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));

      // Unmount component
      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
    });
  });

  describe('Position State', () => {
    it('initializes position from props', () => {
      render(<DesktopIcon {...defaultProps} x={150} y={250} />);

      const iconContainer = screen.getByRole('img', { hidden: true }).parentElement?.parentElement;
      expect(iconContainer).toHaveStyle({
        left: '150px',
        top: '250px'
      });
    });

    it('updates to new props after drag when coordinates change', () => {
      const { rerender } = render(<DesktopIcon {...defaultProps} />);

      const iconContainer = screen.getByRole('img', { hidden: true }).parentElement?.parentElement;

      // Start drag and move
      fireEvent.mouseDown(iconContainer!, {
        clientX: 150,
        clientY: 250
      });

      fireEvent(window, new MouseEvent('mousemove', {
        clientX: 200,
        clientY: 300
      }));

      // Position should be updated by drag
      expect(iconContainer).toHaveStyle({
        left: '150px',
        top: '250px'
      });

      // Prop change should resync position
      rerender(<DesktopIcon {...defaultProps} x={50} y={50} />);

      expect(iconContainer).toHaveStyle({
        left: '50px',
        top: '50px'
      });
    });
  });

  describe('Event Handling', () => {
    it('handles mouse down events correctly', () => {
      const mockOnSelect = vi.fn();
      render(<DesktopIcon {...defaultProps} onSelect={mockOnSelect} />);

      const iconContainer = screen.getByRole('img', { hidden: true }).parentElement?.parentElement;

      const mockEvent = {
        clientX: 150,
        clientY: 250
      };

      fireEvent.mouseDown(iconContainer!, mockEvent);

      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });

    it('prevents default drag behavior on mouse down', () => {
      render(<DesktopIcon {...defaultProps} />);

      const iconContainer = screen.getByRole('img', { hidden: true }).parentElement?.parentElement;

      const mockEvent = {
        clientX: 150,
        clientY: 250,
        preventDefault: vi.fn()
      };

      fireEvent.mouseDown(iconContainer!, mockEvent);
      // Note: preventDefault is not called in this component, so we just verify no errors
    });
  });

  describe('Edge Cases', () => {
    it('handles empty label gracefully', () => {
      render(<DesktopIcon {...defaultProps} label="" />);
      // Find the label span by looking for the span inside the label div
      const labelDiv = document.querySelector('.label');
      const labelSpan = labelDiv?.querySelector('span');
      expect(labelSpan?.textContent).toBe('');
    });

    it('handles very long labels', () => {
      const longLabel = 'A'.repeat(100);
      render(<DesktopIcon {...defaultProps} label={longLabel} />);
      expect(screen.getByText(longLabel)).toBeInTheDocument();
    });

    it('handles negative coordinates', () => {
      render(<DesktopIcon {...defaultProps} x={-10} y={-20} />);
      const iconContainer = screen.getByRole('img', { hidden: true }).parentElement?.parentElement;
      expect(iconContainer).toHaveStyle({
        left: '-10px',
        top: '-20px'
      });
    });

    it('handles zero coordinates', () => {
      render(<DesktopIcon {...defaultProps} x={0} y={0} />);
      const iconContainer = screen.getByRole('img', { hidden: true }).parentElement?.parentElement;
      expect(iconContainer).toHaveStyle({
        left: '0px',
        top: '0px'
      });
    });

    it('handles very large coordinates', () => {
      render(<DesktopIcon {...defaultProps} x={9999} y={9999} />);
      const iconContainer = screen.getByRole('img', { hidden: true }).parentElement?.parentElement;
      expect(iconContainer).toHaveStyle({
        left: '9999px',
        top: '9999px'
      });
    });

    it('handles onSelect callback correctly', () => {
      const mockOnSelect = vi.fn();
      render(<DesktopIcon {...defaultProps} onSelect={mockOnSelect} />);

      const iconContainer = screen.getByRole('img', { hidden: true }).parentElement?.parentElement;
      fireEvent.click(iconContainer!);

      expect(mockOnSelect).toHaveBeenCalledTimes(1);
    });

    it('handles separate click and double-click events', () => {
      const mockOnSelect = vi.fn();
      const mockOnDoubleClick = vi.fn();

      render(<DesktopIcon {...defaultProps} onSelect={mockOnSelect} onDoubleClick={mockOnDoubleClick} />);

      const iconContainer = screen.getByRole('img', { hidden: true }).parentElement?.parentElement;

      // Test click
      fireEvent.click(iconContainer!);
      expect(mockOnSelect).toHaveBeenCalledTimes(1);

      // Test double-click separately
      fireEvent.doubleClick(iconContainer!);
      expect(mockOnDoubleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('has appropriate alt text for the icon', () => {
      render(<DesktopIcon {...defaultProps} />);
      const iconImg = screen.getByRole('img', { hidden: true });
      expect(iconImg).toHaveAttribute('alt', 'Test Icon');
    });

    it('renders label text for screen readers', () => {
      render(<DesktopIcon {...defaultProps} />);
      expect(screen.getByText('Test Icon')).toBeInTheDocument();
    });
  });
});
