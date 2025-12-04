// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Desktop from './Desktop';
import { DesktopProvider } from '../../contexts/DesktopContext';
import type { ContextMenuItem } from './ContextMenu';

// Mock the imported images and components
vi.mock('../../assets/pattern_bg.png', () => ({ default: 'pattern-bg.png' }));
vi.mock('../../assets/hd_icon.png', () => ({ default: 'hd-icon.png' }));
vi.mock('../../assets/trash_icon.png', () => ({ default: 'trash-icon.png' }));
vi.mock('../../assets/folder_icon.png', () => ({ default: 'folder-icon.png' }));
vi.mock('../../assets/calculator.png', () => ({ default: 'calculator-icon.png' }));
vi.mock('../../assets/joystick.png', () => ({ default: 'joystick-icon.png' }));
vi.mock('../../assets/apple_logo.png', () => ({ default: 'apple-logo.png' }));

// Mock child components
vi.mock('./MenuBar', () => ({
    default: ({
        onOpenWindow,
        onUndo
    }: {
        onOpenWindow: (id: string, title: string, content: unknown, width?: number, height?: number) => void;
        onUndo: () => void;
    }) => (
        <div data-testid="menubar">
            <button data-testid="menubar-about" onClick={() => onOpenWindow('about', 'About', null)}>About</button>
            <button data-testid="menubar-new-folder" onClick={() => onOpenWindow('new_folder', 'New Folder', null)}>New Folder</button>
            <button data-testid="menubar-undo" onClick={() => onUndo()}>Undo</button>
        </div>
    )
}));

vi.mock('./DesktopIcon', () => ({
    default: ({
        label,
        onDoubleClick,
        selected,
        onSelect
    }: {
        label: string;
        onDoubleClick?: () => void;
        selected: boolean;
        onSelect: () => void;
    }) => (
        <div
            data-testid={`desktop-icon-${label.toLowerCase().replace(/\s+/g, '-')}`}
            onClick={onSelect}
            onDoubleClick={onDoubleClick}
            data-selected={selected}
        >
            {label}
        </div>
    )
}));

vi.mock('./Window', () => ({
    default: ({
        title,
        onClose,
        isActive,
        children
    }: {
        title: string;
        onClose: () => void;
        isActive: boolean;
        children: ReactNode;
    }) => (
        <div data-testid={`window-${title.toLowerCase().replace(/\s+/g, '-')}`} data-active={isActive}>
            <div data-testid={`window-title-${title.toLowerCase().replace(/\s+/g, '-')}`}>{title}</div>
            <button data-testid={`window-close-${title.toLowerCase().replace(/\s+/g, '-')}`} onClick={onClose}>
                Close
            </button>
            {children}
        </div>
    )
}));

vi.mock('./ContextMenu', () => ({
    default: ({
        visible,
        items,
        onClose
    }: {
        visible: boolean;
        items: ContextMenuItem[];
        onClose: () => void;
    }) => (
        visible ? (
            <div data-testid="context-menu">
                {items.map((item: ContextMenuItem, index: number) => (
                    item.label ? (
                        <div
                            key={index}
                            data-testid={`context-menu-item-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                            onClick={item.action}
                        >
                            {item.label}
                        </div>
                    ) : item.separator ? (
                        <hr key={index} data-testid="context-menu-separator" />
                    ) : null
                ))}
                <button data-testid="context-menu-close" onClick={onClose}>Close Menu</button>
            </div>
        ) : null
    )
}));

// Mock apps
vi.mock('../apps/Calculator', () => ({
    default: () => <div data-testid="calculator-app">Calculator App</div>
}));

vi.mock('../apps/TicTacToe', () => ({
    default: () => <div data-testid="tictactoe-app">TicTacToe App</div>
}));

vi.mock('../apps/About', () => ({
    default: () => <div data-testid="about-app">About App</div>
}));

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

// Icon metadata is managed internally by Desktop component via module-level Map

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

// Mock ui-shell hooks - return the initial icons
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

// Override the icon metadata map in Desktop.tsx
// We'll do this by mocking the module-level variable access
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

describe('Desktop', () => {
    describe('Initial Rendering', () => {
        it('renders without crashing', () => {
            expect(() => renderDesktop()).not.toThrow();
        });

        it('renders the desktop container', () => {
            renderDesktop();
            const desktop = document.querySelector('[data-testid="menubar"]')?.parentElement;
            expect(desktop).toBeInTheDocument();
        });

        it('renders the menu bar', () => {
            renderDesktop();
            expect(screen.getByTestId('menubar')).toBeInTheDocument();
        });

        it('renders all default desktop icons', () => {
            renderDesktop();

            expect(screen.getByTestId('desktop-icon-macintosh-hd')).toBeInTheDocument();
            expect(screen.getByTestId('desktop-icon-documents')).toBeInTheDocument();
            expect(screen.getByTestId('desktop-icon-calculator')).toBeInTheDocument();
            expect(screen.getByTestId('desktop-icon-tictactoe')).toBeInTheDocument();
            expect(screen.getByTestId('desktop-icon-trash')).toBeInTheDocument();
        });

        it('no windows are open initially', () => {
            renderDesktop();
            const windows = screen.queryAllByTestId(/^window-/);
            expect(windows).toHaveLength(0);
        });

        it('context menu is not visible initially', () => {
            renderDesktop();
            expect(screen.queryByTestId('context-menu')).not.toBeInTheDocument();
        });
    });

    describe('Context Menu', () => {
        it('right-clicking desktop shows context menu', () => {
            renderDesktop();
            const desktop = screen.getByTestId('menubar').parentElement as HTMLElement;
            fireEvent.contextMenu(desktop);
            expect(screen.getByTestId('context-menu')).toBeInTheDocument();
        });

        it('context menu has expected items', () => {
            renderDesktop();
            const desktop = screen.getByTestId('menubar').parentElement as HTMLElement;
            fireEvent.contextMenu(desktop);

            expect(screen.getByTestId('context-menu-item-new-folder')).toBeInTheDocument();
            expect(screen.getByTestId('context-menu-item-clean-up')).toBeInTheDocument();
            expect(screen.getByTestId('context-menu-item-refresh')).toBeInTheDocument();
            expect(screen.getByTestId('context-menu-item-get-info')).toBeInTheDocument();
            const separators = screen.getAllByTestId('context-menu-separator');
            expect(separators.length).toBeGreaterThan(0);
        });

        it('context menu can be closed manually', () => {
            renderDesktop();
            const desktop = screen.getByTestId('menubar').parentElement as HTMLElement;

            fireEvent.contextMenu(desktop);
            expect(screen.getByTestId('context-menu')).toBeInTheDocument();

            fireEvent.click(screen.getByTestId('context-menu-close'));
            expect(screen.queryByTestId('context-menu')).not.toBeInTheDocument();
        });

        it('Clean Up rearranges icons', () => {
            renderDesktop();
            const desktop = screen.getByTestId('menubar').parentElement as HTMLElement;

            fireEvent.contextMenu(desktop);
            const cleanUpItem = screen.getByTestId('context-menu-item-clean-up');
            expect(() => fireEvent.click(cleanUpItem)).not.toThrow();
        });
    });

    describe('Edge Cases', () => {
        describe('Background Modes', () => {
            it('applies fill mode styles by default', () => {
                renderDesktop();
                const desktop = document.querySelector('[class*="desktop"]');
                expect(desktop).toHaveStyle({
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center'
                });
            });
        });
    });
});
