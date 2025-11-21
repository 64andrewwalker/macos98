// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Desktop from './Desktop';

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
    default: ({ onOpenWindow }: { onOpenWindow: Function }) => (
        <div data-testid="menubar">
            <button data-testid="menubar-about" onClick={() => onOpenWindow('about', 'About', null)}>About</button>
        </div>
    )
}));

vi.mock('./DesktopIcon', () => ({
    default: ({ label, onDoubleClick, selected, onSelect }: any) => (
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
    default: ({ title, onClose, isActive, children }: any) => (
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
    default: ({ visible, items, onClose }: any) => (
        visible ? (
            <div data-testid="context-menu">
                {items.map((item: any, index: number) => (
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

describe('Desktop', () => {
    describe('Initial Rendering', () => {
        it('renders without crashing', () => {
            expect(() => render(<Desktop />)).not.toThrow();
        });

        it('renders the desktop container', () => {
            render(<Desktop />);
            const desktop = document.querySelector('[data-testid="menubar"]')?.parentElement;
            expect(desktop).toBeInTheDocument();
        });

        it('renders the menu bar', () => {
            render(<Desktop />);
            expect(screen.getByTestId('menubar')).toBeInTheDocument();
        });

        it('renders all default desktop icons', () => {
            render(<Desktop />);

            expect(screen.getByTestId('desktop-icon-macintosh-hd')).toBeInTheDocument();
            expect(screen.getByTestId('desktop-icon-documents')).toBeInTheDocument();
            expect(screen.getByTestId('desktop-icon-calculator')).toBeInTheDocument();
            expect(screen.getByTestId('desktop-icon-tictactoe')).toBeInTheDocument();
            expect(screen.getByTestId('desktop-icon-trash')).toBeInTheDocument();
        });

        it('no windows are open initially', () => {
            render(<Desktop />);
            const windows = screen.queryAllByTestId(/^window-/);
            expect(windows).toHaveLength(0);
        });

        it('context menu is not visible initially', () => {
            render(<Desktop />);
            expect(screen.queryByTestId('context-menu')).not.toBeInTheDocument();
        });
    });

    describe('Icon Interactions', () => {
        it('double-clicking Macintosh HD opens a window', () => {
            render(<Desktop />);
            const hdIcon = screen.getByTestId('desktop-icon-macintosh-hd');

            fireEvent.doubleClick(hdIcon);

            expect(screen.getByTestId('window-macintosh-hd')).toBeInTheDocument();
            expect(screen.getByTestId('window-title-macintosh-hd')).toHaveTextContent('Macintosh HD');
        });

        it('double-clicking Calculator opens calculator window', () => {
            render(<Desktop />);
            const calcIcon = screen.getByTestId('desktop-icon-calculator');

            fireEvent.doubleClick(calcIcon);

            expect(screen.getByTestId('window-calculator')).toBeInTheDocument();
            expect(screen.getByTestId('calculator-app')).toBeInTheDocument();
        });

        it('double-clicking TicTacToe opens game window', () => {
            render(<Desktop />);
            const gameIcon = screen.getByTestId('desktop-icon-tictactoe');

            fireEvent.doubleClick(gameIcon);

            expect(screen.getByTestId('window-tictactoe')).toBeInTheDocument();
            expect(screen.getByTestId('tictactoe-app')).toBeInTheDocument();
        });

        it('clicking an icon selects it', () => {
            render(<Desktop />);
            const hdIcon = screen.getByTestId('desktop-icon-macintosh-hd');

            fireEvent.click(hdIcon);

            expect(hdIcon).toHaveAttribute('data-selected', 'true');
        });

        it('icon selection can be changed', () => {
            render(<Desktop />);
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
            render(<Desktop />);

            fireEvent.doubleClick(screen.getByTestId('desktop-icon-macintosh-hd'));
            expect(screen.getByTestId('window-macintosh-hd')).toBeInTheDocument();

            // Close first window and open second
            fireEvent.click(screen.getByTestId('window-close-macintosh-hd'));
            fireEvent.doubleClick(screen.getByTestId('desktop-icon-calculator'));
            expect(screen.getByTestId('window-calculator')).toBeInTheDocument();
        });

        it('double-clicking same icon twice opens only one window', () => {
            render(<Desktop />);
            const hdIcon = screen.getByTestId('desktop-icon-macintosh-hd');

            fireEvent.doubleClick(hdIcon);
            fireEvent.doubleClick(hdIcon);

            const hdWindows = screen.getAllByTestId('window-macintosh-hd');
            expect(hdWindows).toHaveLength(1);
        });

        it('can close windows', () => {
            render(<Desktop />);

            fireEvent.doubleClick(screen.getByTestId('desktop-icon-macintosh-hd'));
            expect(screen.getByTestId('window-macintosh-hd')).toBeInTheDocument();

            fireEvent.click(screen.getByTestId('window-close-macintosh-hd'));
            expect(screen.queryByTestId('window-macintosh-hd')).not.toBeInTheDocument();
        });

        it('newly opened window shows active state', () => {
            render(<Desktop />);

            fireEvent.doubleClick(screen.getByTestId('desktop-icon-calculator'));
            expect(screen.getByTestId('window-calculator')).toHaveAttribute('data-active', 'true');
        });
    });

    describe('Menu Bar Integration', () => {
        it('menu bar can open About window', () => {
            render(<Desktop />);

            fireEvent.click(screen.getByTestId('menubar-about'));

            expect(screen.getByTestId('window-about')).toBeInTheDocument();
            expect(screen.getByTestId('about-app')).toBeInTheDocument();
        });
    });

    describe('Context Menu', () => {
        it('right-clicking desktop shows context menu', () => {
            render(<Desktop />);
            const desktop = screen.getByTestId('menubar').parentElement as HTMLElement;

            fireEvent.contextMenu(desktop);

            expect(screen.getByTestId('context-menu')).toBeInTheDocument();
        });

        it('context menu has expected items', () => {
            render(<Desktop />);
            const desktop = screen.getByTestId('menubar').parentElement as HTMLElement;

            fireEvent.contextMenu(desktop);

            expect(screen.getByTestId('context-menu-item-new-folder')).toBeInTheDocument();
            expect(screen.getByTestId('context-menu-item-refresh')).toBeInTheDocument();
            expect(screen.getByTestId('context-menu-item-get-info')).toBeInTheDocument();
            expect(screen.getByTestId('context-menu-separator')).toBeInTheDocument();
        });

        it('context menu can be closed manually', () => {
            render(<Desktop />);
            const desktop = screen.getByTestId('menubar').parentElement as HTMLElement;

            fireEvent.contextMenu(desktop);
            expect(screen.getByTestId('context-menu')).toBeInTheDocument();

            fireEvent.click(screen.getByTestId('context-menu-close'));
            expect(screen.queryByTestId('context-menu')).not.toBeInTheDocument();
        });

        it('New Folder creates a new desktop icon', () => {
            render(<Desktop />);
            const desktop = screen.getByTestId('menubar').parentElement as HTMLElement;

            fireEvent.contextMenu(desktop);
            fireEvent.click(screen.getByTestId('context-menu-item-new-folder'));

            // Should have created a new folder icon
            expect(screen.getByTestId('desktop-icon-new-folder')).toBeInTheDocument();
        });

        it('clicking outside context menu closes it', () => {
            render(<Desktop />);
            const desktop = screen.getByTestId('menubar').parentElement as HTMLElement;

            fireEvent.contextMenu(desktop);
            expect(screen.getByTestId('context-menu')).toBeInTheDocument();

            fireEvent.click(screen.getByTestId('context-menu-close'));
            expect(screen.queryByTestId('context-menu')).not.toBeInTheDocument();
        });
    });

    describe('State Management', () => {
        it('maintains icon selection state correctly', () => {
            render(<Desktop />);
            const hdIcon = screen.getByTestId('desktop-icon-macintosh-hd');
            const calcIcon = screen.getByTestId('desktop-icon-calculator');

            fireEvent.click(hdIcon);
            expect(hdIcon).toHaveAttribute('data-selected', 'true');

            fireEvent.click(calcIcon);
            expect(calcIcon).toHaveAttribute('data-selected', 'true');
            expect(hdIcon).toHaveAttribute('data-selected', 'false');
        });

        it('window has proper title', () => {
            render(<Desktop />);

            fireEvent.doubleClick(screen.getByTestId('desktop-icon-calculator'));
            expect(screen.getByTestId('window-title-calculator')).toHaveTextContent('Calculator');
        });

        it('closing active window updates active state', () => {
            render(<Desktop />);

            fireEvent.doubleClick(screen.getByTestId('desktop-icon-macintosh-hd'));
            expect(screen.getByTestId('window-macintosh-hd')).toHaveAttribute('data-active', 'true');

            fireEvent.click(screen.getByTestId('window-close-macintosh-hd'));
            expect(screen.queryByTestId('window-macintosh-hd')).not.toBeInTheDocument();
        });
    });

    describe('Edge Cases', () => {
        it('handles rapid icon double-clicks', () => {
            render(<Desktop />);
            const hdIcon = screen.getByTestId('desktop-icon-macintosh-hd');

            fireEvent.doubleClick(hdIcon);
            fireEvent.doubleClick(hdIcon);
            fireEvent.doubleClick(hdIcon);

            const hdWindows = screen.getAllByTestId('window-macintosh-hd');
            expect(hdWindows).toHaveLength(1);
        });

        it('can open different types of windows', () => {
            render(<Desktop />);

            fireEvent.doubleClick(screen.getByTestId('desktop-icon-trash'));
            expect(screen.getByTestId('window-trash')).toBeInTheDocument();
            expect(screen.getByTestId('window-title-trash')).toHaveTextContent('Trash');
        });
    });
});
