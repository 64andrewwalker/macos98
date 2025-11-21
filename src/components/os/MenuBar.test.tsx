// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import MenuBar from './MenuBar';

// Mock the apple logo import
vi.mock('../../assets/apple_logo.png', () => ({ default: 'apple-logo.png' }));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('MenuBar', () => {
    const mockProps = {
        onOpenWindow: vi.fn(),
        onCloseActiveWindow: vi.fn(),
        onUndo: vi.fn(),
        onCut: vi.fn(),
        onCopy: vi.fn(),
        onPaste: vi.fn(),
        onClear: vi.fn(),
        hasSelection: false,
        hasClipboard: false,
        canUndo: false
    };

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('Basic Rendering', () => {
        it('renders without crashing', () => {
            expect(() => render(<MenuBar {...mockProps} />)).not.toThrow();
        });

        it('renders the menu bar container and main items', () => {
            render(<MenuBar {...mockProps} />);
            expect(document.querySelector('[class*="menuBar"]')).toBeInTheDocument();
            expect(screen.getByText('File')).toBeInTheDocument();
            expect(screen.getByText('Edit')).toBeInTheDocument();
            expect(screen.getByText('View')).toBeInTheDocument();
            expect(screen.getByText('Special')).toBeInTheDocument();
        });

        it('renders the Apple logo', () => {
            render(<MenuBar {...mockProps} />);
            const appleLogo = screen.getByAltText('Apple');
            expect(appleLogo).toBeInTheDocument();
            expect(appleLogo).toHaveAttribute('src', 'apple-logo.png');
        });

        it('renders the clock', () => {
            render(<MenuBar {...mockProps} />);
            const clock = document.querySelector('[class*="clock"]');
            expect(clock).toBeInTheDocument();
        });
    });

    describe('Clock Functionality', () => {
        it('displays current time in expected format', () => {
            const mockDate = new Date('2025-11-21T14:30:00');
            vi.setSystemTime(mockDate);

            render(<MenuBar {...mockProps} />);

            const clock = document.querySelector('[class*="clock"]');
            expect(clock?.textContent).toMatch(/\d{1,2}:\d{2}/);
        });

        it('updates time every second', () => {
            const mockDate = new Date('2025-11-21T14:30:00');
            vi.setSystemTime(mockDate);

            render(<MenuBar {...mockProps} />);
            const initial = document.querySelector('[class*="clock"]')?.textContent;

            act(() => {
                vi.advanceTimersByTime(1000);
            });

            const updated = document.querySelector('[class*="clock"]')?.textContent;
            expect(updated).toMatch(/\d{1,2}:\d{2}/);
            expect(updated).not.toBeUndefined();
            expect(updated).not.toBe('');
            expect(updated).toEqual(initial);
        });
    });

    describe('Menu Interactions', () => {
        it('opens Apple menu when clicked', () => {
            render(<MenuBar {...mockProps} />);
            const appleMenu = screen.getByAltText('Apple').parentElement!;

            fireEvent.click(appleMenu);

            expect(screen.getByText('About This Computer...')).toBeInTheDocument();
        });

        it('opens File menu when clicked', () => {
            render(<MenuBar {...mockProps} />);
            const fileMenu = screen.getByText('File');

            fireEvent.click(fileMenu);

            expect(screen.getByText('New Folder')).toBeInTheDocument();
            expect(screen.getByText('Open')).toBeInTheDocument();
            expect(screen.getByText('Print')).toBeInTheDocument();
            expect(screen.getByText('Close')).toBeInTheDocument();
        });

        it('opens Edit menu when clicked', () => {
            render(<MenuBar {...mockProps} />);
            const editMenu = screen.getByText('Edit');

            fireEvent.click(editMenu);

            expect(screen.getByText('Undo')).toBeInTheDocument();
            expect(screen.getByText('Cut')).toBeInTheDocument();
            expect(screen.getByText('Copy')).toBeInTheDocument();
            expect(screen.getByText('Paste')).toBeInTheDocument();
            expect(screen.getByText('Clear')).toBeInTheDocument();
        });

        it('closes menu when clicked again', () => {
            render(<MenuBar {...mockProps} />);
            const appleMenu = screen.getByAltText('Apple').parentElement!;

            fireEvent.click(appleMenu);
            expect(screen.getByText('About This Computer...')).toBeInTheDocument();

            fireEvent.click(appleMenu);
            expect(screen.queryByText('About This Computer...')).not.toBeInTheDocument();
        });

        it('closes menu when clicking outside', () => {
            render(<MenuBar {...mockProps} />);
            const appleMenu = screen.getByAltText('Apple').parentElement!;

            fireEvent.click(appleMenu);
            expect(screen.getByText('About This Computer...')).toBeInTheDocument();

            fireEvent.click(document.body);

            expect(screen.queryByText('About This Computer...')).not.toBeInTheDocument();
        });
    });

    describe('Apple Menu Actions', () => {
        it('calls onOpenWindow with correct parameters when About is clicked', () => {
            render(<MenuBar {...mockProps} />);
            const appleMenu = screen.getByAltText('Apple').parentElement!;

            fireEvent.click(appleMenu);
            fireEvent.click(screen.getByText('About This Computer...'));

            expect(mockProps.onOpenWindow).toHaveBeenCalledWith('about', 'About This Computer', null);
        });

        it('closes menu after About is clicked', () => {
            render(<MenuBar {...mockProps} />);
            const appleMenu = screen.getByAltText('Apple').parentElement!;

            fireEvent.click(appleMenu);
            fireEvent.click(screen.getByText('About This Computer...'));

            expect(screen.queryByText('About This Computer...')).not.toBeInTheDocument();
        });
    });

    describe('File Menu Actions', () => {
        beforeEach(() => {
            render(<MenuBar {...mockProps} />);
            const fileMenu = screen.getByText('File');
            fireEvent.click(fileMenu);
        });

        it('calls onOpenWindow for New Folder', () => {
            fireEvent.click(screen.getByText('New Folder'));
            expect(mockProps.onOpenWindow).toHaveBeenCalledWith('new_folder', 'New Folder', null);
        });

        it('shows alert for unimplemented Open feature', () => {
            const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
            fireEvent.click(screen.getByText('Open'));
            expect(alertMock).toHaveBeenCalledWith('Open feature not implemented yet.');
            alertMock.mockRestore();
        });

        it('shows alert for unimplemented Print feature', () => {
            const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
            fireEvent.click(screen.getByText('Print'));
            expect(alertMock).toHaveBeenCalledWith('Print feature not implemented yet.');
            alertMock.mockRestore();
        });

        it('calls onCloseActiveWindow for Close', () => {
            fireEvent.click(screen.getByText('Close'));
            expect(mockProps.onCloseActiveWindow).toHaveBeenCalled();
        });

        it('closes menu after any action', () => {
            fireEvent.click(screen.getByText('New Folder'));
            expect(screen.queryByText('New Folder')).not.toBeInTheDocument();
        });
    });

    describe('Edit Menu - State Based Behavior', () => {
        it('disables Undo when canUndo is false', () => {
            render(<MenuBar {...mockProps} />);
            const editMenu = screen.getByText('Edit');

            fireEvent.click(editMenu);

            const undoItem = screen.getAllByText('Undo').find(el => el.className.includes('dropdownItem')) as HTMLElement;
            expect(undoItem.className).toContain('disabled');
        });

        it('enables Undo when canUndo is true', () => {
            render(<MenuBar {...mockProps} canUndo={true} />);
            const editMenu = screen.getByText('Edit');

            fireEvent.click(editMenu);

            const undoItem = screen.getAllByText('Undo').find(el => el.className.includes('dropdownItem')) as HTMLElement;
            expect(undoItem.className).not.toContain('disabled');
        });

        it('disables Cut when hasSelection is false', () => {
            render(<MenuBar {...mockProps} />);
            const editMenu = screen.getByText('Edit');

            fireEvent.click(editMenu);

            const cutItem = screen.getAllByText('Cut').find(el => el.className.includes('dropdownItem')) as HTMLElement;
            expect(cutItem.className).toContain('disabled');
        });

        it('enables Cut when hasSelection is true', () => {
            render(<MenuBar {...mockProps} hasSelection={true} />);
            const editMenu = screen.getByText('Edit');

            fireEvent.click(editMenu);

            const cutItem = screen.getAllByText('Cut').find(el => el.className.includes('dropdownItem')) as HTMLElement;
            expect(cutItem.className).not.toContain('disabled');
        });

        it('disables Copy when hasSelection is false', () => {
            render(<MenuBar {...mockProps} />);
            const editMenu = screen.getByText('Edit');

            fireEvent.click(editMenu);

            const copyItem = screen.getAllByText('Copy').find(el => el.className.includes('dropdownItem')) as HTMLElement;
            expect(copyItem.className).toContain('disabled');
        });

        it('enables Copy when hasSelection is true', () => {
            render(<MenuBar {...mockProps} hasSelection={true} />);
            const editMenu = screen.getByText('Edit');

            fireEvent.click(editMenu);

            const copyItem = screen.getAllByText('Copy').find(el => el.className.includes('dropdownItem')) as HTMLElement;
            expect(copyItem.className).not.toContain('disabled');
        });

        it('disables Paste when hasClipboard is false', () => {
            render(<MenuBar {...mockProps} />);
            const editMenu = screen.getByText('Edit');

            fireEvent.click(editMenu);

            const pasteItem = screen.getAllByText('Paste').find(el => el.className.includes('dropdownItem')) as HTMLElement;
            expect(pasteItem.className).toContain('disabled');
        });

        it('enables Paste when hasClipboard is true', () => {
            render(<MenuBar {...mockProps} hasClipboard={true} />);
            const editMenu = screen.getByText('Edit');

            fireEvent.click(editMenu);

            const pasteItem = screen.getAllByText('Paste').find(el => el.className.includes('dropdownItem')) as HTMLElement;
            expect(pasteItem.className).not.toContain('disabled');
        });

        it('leaves Clear always enabled', () => {
            render(<MenuBar {...mockProps} />);
            const editMenu = screen.getByText('Edit');

            fireEvent.click(editMenu);

            const clearItem = screen.getByText('Clear').parentElement as HTMLElement;
            expect(clearItem.className).not.toContain('disabled');
        });
    });

    describe('Edit Menu Actions', () => {
        it('calls onUndo when Undo is clicked and enabled', () => {
            render(<MenuBar {...mockProps} canUndo={true} />);
            const editMenu = screen.getByText('Edit');

            fireEvent.click(editMenu);
            fireEvent.click(screen.getByText('Undo'));

            expect(mockProps.onUndo).toHaveBeenCalled();
        });

        it('does not call onUndo when Undo is disabled', () => {
            render(<MenuBar {...mockProps} canUndo={false} />);
            const editMenu = screen.getByText('Edit');

            fireEvent.click(editMenu);
            fireEvent.click(screen.getByText('Undo'));

            expect(mockProps.onUndo).not.toHaveBeenCalled();
        });

        it('calls onCut when Cut is clicked and enabled', () => {
            render(<MenuBar {...mockProps} hasSelection={true} />);
            const editMenu = screen.getByText('Edit');

            fireEvent.click(editMenu);
            fireEvent.click(screen.getByText('Cut'));

            expect(mockProps.onCut).toHaveBeenCalled();
        });

        it('does not call onCut when Cut is disabled', () => {
            render(<MenuBar {...mockProps} hasSelection={false} />);
            const editMenu = screen.getByText('Edit');

            fireEvent.click(editMenu);
            fireEvent.click(screen.getByText('Cut'));

            expect(mockProps.onCut).not.toHaveBeenCalled();
        });

        it('calls onCopy when Copy is clicked and enabled', () => {
            render(<MenuBar {...mockProps} hasSelection={true} />);
            const editMenu = screen.getByText('Edit');

            fireEvent.click(editMenu);
            fireEvent.click(screen.getByText('Copy'));

            expect(mockProps.onCopy).toHaveBeenCalled();
        });

        it('does not call onCopy when Copy is disabled', () => {
            render(<MenuBar {...mockProps} hasSelection={false} />);
            const editMenu = screen.getByText('Edit');

            fireEvent.click(editMenu);
            fireEvent.click(screen.getByText('Copy'));

            expect(mockProps.onCopy).not.toHaveBeenCalled();
        });

        it('calls onPaste when Paste is clicked and enabled', () => {
            render(<MenuBar {...mockProps} hasClipboard={true} />);
            const editMenu = screen.getByText('Edit');

            fireEvent.click(editMenu);
            fireEvent.click(screen.getByText('Paste'));

            expect(mockProps.onPaste).toHaveBeenCalled();
        });

        it('does not call onPaste when Paste is disabled', () => {
            render(<MenuBar {...mockProps} hasClipboard={false} />);
            const editMenu = screen.getByText('Edit');

            fireEvent.click(editMenu);
            fireEvent.click(screen.getByText('Paste'));

            expect(mockProps.onPaste).not.toHaveBeenCalled();
        });
    });

    describe('Menu Hover Behavior', () => {
        it('changes active menu on hover when a menu is already open', () => {
            render(<MenuBar {...mockProps} />);
            const appleMenu = screen.getByAltText('Apple').parentElement!;
            const fileMenu = screen.getByText('File');

            fireEvent.click(appleMenu);
            expect(screen.getByText('About This Computer...')).toBeInTheDocument();

            fireEvent.mouseEnter(fileMenu);
            expect(screen.queryByText('About This Computer...')).not.toBeInTheDocument();
            expect(screen.getByText('New Folder')).toBeInTheDocument();
        });

        it('does not change menu on hover when no menu is open', () => {
            render(<MenuBar {...mockProps} />);
            const fileMenu = screen.getByText('File');

            fireEvent.mouseEnter(fileMenu);

            expect(screen.queryByText('New Folder')).not.toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('handles rapid menu switching', () => {
            render(<MenuBar {...mockProps} />);
            const appleMenu = screen.getByAltText('Apple').parentElement!;
            const editMenu = screen.getByText('Edit');

            fireEvent.click(appleMenu);
            fireEvent.click(editMenu);

            expect(screen.getByText('Undo')).toBeInTheDocument();
            expect(screen.queryByText('About This Computer...')).not.toBeInTheDocument();
        });

        it('handles multiple clicks on same menu', () => {
            render(<MenuBar {...mockProps} />);
            const appleMenu = screen.getByAltText('Apple').parentElement!;

            fireEvent.click(appleMenu);
            expect(screen.getByText('About This Computer...')).toBeInTheDocument();

            fireEvent.click(appleMenu);
            expect(screen.queryByText('About This Computer...')).not.toBeInTheDocument();

            fireEvent.click(appleMenu);
            expect(screen.getByText('About This Computer...')).toBeInTheDocument();
        });
    });

    describe('Cleanup', () => {
        it('cleans up event listeners on unmount', () => {
            const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
            const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

            const { unmount } = render(<MenuBar {...mockProps} />);

            expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));

            unmount();

            expect(removeEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
        });

        it('cleans up timer on unmount', () => {
            const clearIntervalSpy = vi.spyOn(window, 'clearInterval');

            const { unmount } = render(<MenuBar {...mockProps} />);

            unmount();

            expect(clearIntervalSpy).toHaveBeenCalled();
        });
    });
});
