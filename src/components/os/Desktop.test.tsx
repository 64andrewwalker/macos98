// @vitest-environment jsdom
import type { ReactNode } from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
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

    describe('Icon Interactions', () => {
        it('double-clicking Macintosh HD opens a window', () => {
            renderDesktop();
            const hdIcon = screen.getByTestId('desktop-icon-macintosh-hd');

            fireEvent.doubleClick(hdIcon);

            expect(screen.getByTestId('window-macintosh-hd')).toBeInTheDocument();
            expect(screen.getByTestId('window-title-macintosh-hd')).toHaveTextContent('Macintosh HD');
        });

        it('double-clicking Calculator opens calculator window', () => {
            renderDesktop();
            const calcIcon = screen.getByTestId('desktop-icon-calculator');

            fireEvent.doubleClick(calcIcon);

            expect(screen.getByTestId('window-calculator')).toBeInTheDocument();
            expect(screen.getByTestId('calculator-app')).toBeInTheDocument();
        });

        it('double-clicking TicTacToe opens game window', () => {
            renderDesktop();
            const gameIcon = screen.getByTestId('desktop-icon-tictactoe');

            fireEvent.doubleClick(gameIcon);

            expect(screen.getByTestId('window-tictactoe')).toBeInTheDocument();
            expect(screen.getByTestId('tictactoe-app')).toBeInTheDocument();
        });

        it('clicking an icon selects it', () => {
            renderDesktop();
            const hdIcon = screen.getByTestId('desktop-icon-macintosh-hd');

            fireEvent.click(hdIcon);

            expect(hdIcon).toHaveAttribute('data-selected', 'true');
        });

        it('icon selection can be changed', () => {
            renderDesktop();
            const hdIcon = screen.getByTestId('desktop-icon-macintosh-hd');
            const calcIcon = screen.getByTestId('desktop-icon-calculator');

            // Select first icon
            fireEvent.click(hdIcon);
            expect(hdIcon).toHaveAttribute('data-selected', 'true');

            // Select second icon
            fireEvent.click(calcIcon);
            expect(calcIcon).toHaveAttribute('data-selected', 'true');
            expect(hdIcon).toHaveAttribute('data-selected', 'false');
        });
    });

    describe('Window Management', () => {
        it('opens different windows independently', () => {
            renderDesktop();

            fireEvent.doubleClick(screen.getByTestId('desktop-icon-macintosh-hd'));
            expect(screen.getByTestId('window-macintosh-hd')).toBeInTheDocument();

            // Close first window and open second
            fireEvent.click(screen.getByTestId('window-close-macintosh-hd'));
            fireEvent.doubleClick(screen.getByTestId('desktop-icon-calculator'));
            expect(screen.getByTestId('window-calculator')).toBeInTheDocument();
        });

        it('double-clicking same icon twice opens only one window', () => {
            renderDesktop();
            const hdIcon = screen.getByTestId('desktop-icon-macintosh-hd');

            fireEvent.doubleClick(hdIcon);
            fireEvent.doubleClick(hdIcon);

            const hdWindows = screen.getAllByTestId('window-macintosh-hd');
            expect(hdWindows).toHaveLength(1);
        });

        it('can close windows', () => {
            renderDesktop();

            fireEvent.doubleClick(screen.getByTestId('desktop-icon-macintosh-hd'));
            expect(screen.getByTestId('window-macintosh-hd')).toBeInTheDocument();

            fireEvent.click(screen.getByTestId('window-close-macintosh-hd'));
            expect(screen.queryByTestId('window-macintosh-hd')).not.toBeInTheDocument();
        });

        it('newly opened window shows active state', () => {
            renderDesktop();

            fireEvent.doubleClick(screen.getByTestId('desktop-icon-calculator'));
            expect(screen.getByTestId('window-calculator')).toHaveAttribute('data-active', 'true');
        });
    });

    describe('Menu Bar Integration', () => {
        it('menu bar can open About window', () => {
            renderDesktop();

            fireEvent.click(screen.getByTestId('menubar-about'));

            expect(screen.getByTestId('window-about')).toBeInTheDocument();
            expect(screen.getByTestId('about-app')).toBeInTheDocument();
        });

        it('undo removes a new folder created from the File menu', () => {
            renderDesktop();

            fireEvent.click(screen.getByTestId('menubar-new-folder'));
            expect(screen.getByTestId('desktop-icon-new-folder')).toBeInTheDocument();

            fireEvent.click(screen.getByTestId('menubar-undo'));
            expect(screen.queryByTestId('desktop-icon-new-folder')).not.toBeInTheDocument();
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

        it('New Folder creates a new desktop icon', () => {
            renderDesktop();
            const desktop = screen.getByTestId('menubar').parentElement as HTMLElement;

            fireEvent.contextMenu(desktop);
            fireEvent.click(screen.getByTestId('context-menu-item-new-folder'));

            // Should have created a new folder icon
            expect(screen.getByTestId('desktop-icon-new-folder')).toBeInTheDocument();
        });

        it('Clean Up rearranges icons', () => {
            renderDesktop();
            const desktop = screen.getByTestId('menubar').parentElement as HTMLElement;

            // Move icon (simulated by updating style or just checking it exists before cleanup)
            // Since we can't easily drag in jsdom without complex setup, we'll rely on the context menu action triggering the logic.
            // We verify that the action is callable.

            fireEvent.contextMenu(desktop);
            const cleanUpItem = screen.getByTestId('context-menu-item-clean-up');

            // Clicking it should not throw
            expect(() => fireEvent.click(cleanUpItem)).not.toThrow();

            // We can't easily verify exact positions in integration test without mocking getBoundingClientRect or similar,
            // but we verified the logic in the hook test.
            // Here we ensure the integration works (menu item calls the function).
        });
    });

    describe('State Management', () => {
        it('maintains icon selection state correctly', () => {
            renderDesktop();
            const hdIcon = screen.getByTestId('desktop-icon-macintosh-hd');
            const calcIcon = screen.getByTestId('desktop-icon-calculator');

            fireEvent.click(hdIcon);
            expect(hdIcon).toHaveAttribute('data-selected', 'true');

            fireEvent.click(calcIcon);
            expect(calcIcon).toHaveAttribute('data-selected', 'true');
            expect(hdIcon).toHaveAttribute('data-selected', 'false');
        });

        it('window has proper title', () => {
            renderDesktop();

            fireEvent.doubleClick(screen.getByTestId('desktop-icon-calculator'));
            expect(screen.getByTestId('window-title-calculator')).toHaveTextContent('Calculator');
        });

        it('closing active window updates active state', () => {
            renderDesktop();

            fireEvent.doubleClick(screen.getByTestId('desktop-icon-macintosh-hd'));
            expect(screen.getByTestId('window-macintosh-hd')).toHaveAttribute('data-active', 'true');

            fireEvent.click(screen.getByTestId('window-close-macintosh-hd'));
            expect(screen.queryByTestId('window-macintosh-hd')).not.toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('handles rapid icon double-clicks', () => {
            renderDesktop();
            const hdIcon = screen.getByTestId('desktop-icon-macintosh-hd');

            fireEvent.doubleClick(hdIcon);
            fireEvent.doubleClick(hdIcon);
            fireEvent.doubleClick(hdIcon);

            const hdWindows = screen.getAllByTestId('window-macintosh-hd');
            expect(hdWindows).toHaveLength(1);
        });

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

        it('can open different types of windows', () => {
            renderDesktop();

            fireEvent.doubleClick(screen.getByTestId('desktop-icon-trash'));
            expect(screen.getByTestId('window-trash')).toBeInTheDocument();
            expect(screen.getByTestId('window-title-trash')).toHaveTextContent('Trash');
        });
    });
});
