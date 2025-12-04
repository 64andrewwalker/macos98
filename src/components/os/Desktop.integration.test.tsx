// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import Desktop from './Desktop';
import { DesktopProvider } from '../../contexts/DesktopContext';

vi.mock('../../assets/pattern_bg.png', () => ({ default: 'pattern-bg.png' }));
vi.mock('../../assets/hd_icon.png', () => ({ default: 'hd-icon.png' }));
vi.mock('../../assets/trash_icon.png', () => ({ default: 'trash-icon.png' }));
vi.mock('../../assets/folder_icon.png', () => ({ default: 'folder-icon.png' }));
vi.mock('../../assets/calculator.png', () => ({ default: 'calculator-icon.png' }));
vi.mock('../../assets/joystick.png', () => ({ default: 'joystick-icon.png' }));
vi.mock('../../assets/apple_logo.png', () => ({ default: 'apple-logo.png' }));

// Initial icons state
const initialIconsData = [
    { id: 'icon_1', name: 'Macintosh HD', icon: 'hd-icon.png', position: { x: 20, y: 20 }, target: { type: 'system' } },
    { id: 'icon_2', name: 'Documents', icon: 'folder-icon.png', position: { x: 20, y: 110 }, target: { type: 'folder', path: '/Users/default/docs' } },
    { id: 'icon_3', name: 'Calculator', icon: 'calculator-icon.png', position: { x: 20, y: 200 }, target: { type: 'app', appId: 'calc' } },
    { id: 'icon_4', name: 'TicTacToe', icon: 'joystick-icon.png', position: { x: 20, y: 290 }, target: { type: 'app', appId: 'game' } },
    { id: 'icon_5', name: 'Trash', icon: 'trash-icon.png', position: { x: 20, y: 380 }, target: { type: 'system' } }
];

// State for mocked services
let mockIcons = [...initialIconsData];
let mockSelectedIconIds: string[] = [];
let mockWindows: Array<{ id: string; title: string; bounds: { x: number; y: number; width: number; height: number }; focused: boolean; content: ReactNode }> = [];
let iconIdCounter = 100;
let windowIdCounter = 0;

// Mock system hooks
vi.mock('../../system', () => ({
    useAppRuntime: () => ({
        launchApp: vi.fn().mockRejectedValue(new Error('Not available in test')),
        getInstalledApps: vi.fn().mockReturnValue([])
    }),
    useVfs: () => ({
        readdir: vi.fn().mockResolvedValue([]),
        stat: vi.fn().mockResolvedValue({ type: 'file' }),
        readTextFile: vi.fn().mockResolvedValue(''),
        writeFile: vi.fn().mockResolvedValue(undefined)
    })
}));

// Mock ui-shell hooks
vi.mock('../../ui-shell/context/hooks', () => ({
    useWindows: () => ({
        windows: mockWindows,
        focusedWindow: mockWindows.find(w => w.focused),
        focusWindow: vi.fn((windowId: string) => {
            mockWindows = mockWindows.map(w => ({ ...w, focused: w.id === windowId }));
        }),
        closeWindow: vi.fn((windowId: string) => {
            mockWindows = mockWindows.filter(w => w.id !== windowId);
        }),
        openWindow: vi.fn((opts: { title: string; content: ReactNode; width?: number; height?: number; appId?: string }) => {
            windowIdCounter++;
            const newWindow = {
                id: `window_${windowIdCounter}`,
                title: opts.title,
                bounds: { x: 100, y: 100, width: opts.width || 400, height: opts.height || 300 },
                focused: true,
                content: opts.content
            };
            mockWindows = [...mockWindows.map(w => ({ ...w, focused: false })), newWindow];
            return newWindow;
        }),
        closeAllWindows: vi.fn()
    }),
    useDesktop: () => ({
        icons: mockIcons,
        selectedIconIds: mockSelectedIconIds,
        wallpaper: '',
        wallpaperMode: 'fill' as const,
        setWallpaper: vi.fn(),
        addIcon: vi.fn((icon: Omit<typeof mockIcons[0], 'id'>) => {
            iconIdCounter++;
            const newIcon = { ...icon, id: `icon_${iconIdCounter}` };
            mockIcons = [...mockIcons, newIcon];
            return newIcon;
        }),
        removeIcon: vi.fn((iconId: string) => {
            mockIcons = mockIcons.filter(i => i.id !== iconId);
        }),
        moveIcon: vi.fn((iconId: string, position: { x: number; y: number }) => {
            mockIcons = mockIcons.map(i => i.id === iconId ? { ...i, position } : i);
        }),
        getIcon: vi.fn((iconId: string) => mockIcons.find(i => i.id === iconId)),
        arrangeIcons: vi.fn(),
        selectIcon: vi.fn((iconId: string) => {
            mockSelectedIconIds = [iconId];
        }),
        clearSelection: vi.fn(() => {
            mockSelectedIconIds = [];
        }),
        onIconDoubleClick: vi.fn(),
        onContextMenu: vi.fn(),
        triggerIconDoubleClick: vi.fn(),
        triggerContextMenu: vi.fn()
    }),
    useDesktopServiceInstance: () => ({
        removeIcon: vi.fn((iconId: string) => {
            mockIcons = mockIcons.filter(i => i.id !== iconId);
        })
    })
}));

// Mock config to prevent initialization from adding more icons
vi.mock('../../config/initialState', () => ({
    initialIcons: [],
    InitialFileItem: undefined,
    InitialIconData: undefined
}));

beforeEach(() => {
    // Reset mock state before each test
    mockIcons = [...initialIconsData];
    mockSelectedIconIds = [];
    mockWindows = [];
    iconIdCounter = 100;
    windowIdCounter = 0;
});

afterEach(() => {
    cleanup();
});

// Helper to render Desktop with provider
const renderDesktop = () => {
    return render(
        <DesktopProvider>
            <Desktop />
        </DesktopProvider>
    );
};

describe('Desktop integration', () => {
    it('renders desktop with icons', () => {
        renderDesktop();

        // Check that icons are rendered
        expect(screen.getByText('Macintosh HD')).toBeInTheDocument();
        expect(screen.getByText('Documents')).toBeInTheDocument();
        expect(screen.getByText('Calculator')).toBeInTheDocument();
    });

    it('shows context menu on right click', () => {
        const { container } = renderDesktop();
        const desktop = container.querySelector('[class*="desktop"]') as HTMLElement;
        
        fireEvent.contextMenu(desktop);
        
        expect(screen.getByText('New Folder')).toBeInTheDocument();
        expect(screen.getByText('Clean Up')).toBeInTheDocument();
    });

    it('can interact with icons', () => {
        renderDesktop();
        
        const hdIcon = screen.getByText('Macintosh HD');
        expect(hdIcon).toBeInTheDocument();
        
        // Click should not throw
        expect(() => fireEvent.click(hdIcon)).not.toThrow();
    });
});
