// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDesktopLogic } from './useDesktopLogic';
import { DesktopProvider } from '../contexts/DesktopContext';

// Mock dependencies
vi.mock('../assets/hd_icon.png', () => ({ default: 'hd-icon.png' }));
vi.mock('../assets/trash_icon.png', () => ({ default: 'trash-icon.png' }));
vi.mock('../assets/folder_icon.png', () => ({ default: 'folder-icon.png' }));
vi.mock('../assets/calculator.png', () => ({ default: 'calculator-icon.png' }));
vi.mock('../assets/joystick.png', () => ({ default: 'joystick-icon.png' }));

// Mock components used in openWindow
vi.mock('../components/apps/Calculator', () => ({ default: () => <div>Calculator</div> }));
vi.mock('../components/apps/TicTacToe', () => ({ default: () => <div>TicTacToe</div> }));
vi.mock('../components/apps/About', () => ({ default: () => <div>About</div> }));
vi.mock('../components/apps/Finder', () => ({ default: () => <div>Finder</div> }));
vi.mock('../components/apps/TextEditor', () => ({ default: () => <div>TextEditor</div> }));

describe('useDesktopLogic', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <DesktopProvider>{children}</DesktopProvider>
    );

    it('initializes with default icons', () => {
        const { result } = renderHook(() => useDesktopLogic(), { wrapper });

        expect(result.current.icons.length).toBeGreaterThan(0);
        expect(result.current.icons.find(i => i.id === 'hd')).toBeDefined();
        expect(result.current.icons.find(i => i.id === 'trash')).toBeDefined();
    });

    it('opens a window when openWindow is called', () => {
        const { result } = renderHook(() => useDesktopLogic(), { wrapper });

        act(() => {
            result.current.openWindow('test-window', 'Test Window', <div>Content</div>);
        });

        expect(result.current.windows).toHaveLength(1);
        expect(result.current.windows[0].id).toBe('test-window');
        expect(result.current.activeWindowId).toBe('test-window');
    });

    it('closes a window', () => {
        const { result } = renderHook(() => useDesktopLogic(), { wrapper });

        act(() => {
            result.current.openWindow('test-window', 'Test Window', <div>Content</div>);
        });
        expect(result.current.windows).toHaveLength(1);

        act(() => {
            result.current.closeWindow('test-window');
        });
        expect(result.current.windows).toHaveLength(0);
    });

    it('selects an icon', () => {
        const { result } = renderHook(() => useDesktopLogic(), { wrapper });

        act(() => {
            result.current.setSelectedIconId('hd');
        });

        expect(result.current.selectedIconId).toBe('hd');
    });

    it('creates a new folder', () => {
        const { result } = renderHook(() => useDesktopLogic(), { wrapper });
        const initialCount = result.current.icons.length;

        act(() => {
            result.current.createNewFolder();
        });

        expect(result.current.icons.length).toBe(initialCount + 1);
        const newFolder = result.current.icons.find(i => i.label === 'New Folder');
        expect(newFolder).toBeDefined();
    });

    it('handleCleanUp rearranges icons', () => {
        const { result } = renderHook(() => useDesktopLogic(), { wrapper });

        // Move an icon to a weird position
        act(() => {
            result.current.updateIconPosition('hd', { x: 500, y: 500 });
        });

        const movedIcon = result.current.icons.find(i => i.id === 'hd');
        expect(movedIcon?.x).toBe(500);
        expect(movedIcon?.y).toBe(500);

        // Run cleanup
        act(() => {
            result.current.handleCleanUp();
        });

        const cleanedIcon = result.current.icons.find(i => i.id === 'hd');
        // Should be back to grid position (20, 20 based on current logic for first icon)
        expect(cleanedIcon?.x).toBe(20);
        expect(cleanedIcon?.y).toBe(40);
    });

    it('handleIconDoubleClick opens appropriate window', () => {
        const { result } = renderHook(() => useDesktopLogic(), { wrapper });

        act(() => {
            result.current.handleIconDoubleClick('calc');
        });

        expect(result.current.windows.find(w => w.title === 'Calculator')).toBeDefined();
    });
});
