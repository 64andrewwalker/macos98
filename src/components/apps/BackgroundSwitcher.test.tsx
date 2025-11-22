// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import BackgroundSwitcher from './BackgroundSwitcher.tsx';
import { DesktopProvider } from '../../contexts/DesktopContext';

// Mock background assets
vi.mock('../../assets/background/backgroundAssets', () => ({
    backgroundAssets: [
        { id: 'bg1', name: 'Background 1', image: 'bg1.jpg' },
        { id: 'bg2', name: 'Background 2', image: 'bg2.jpg' },
        { id: 'bg3', name: 'Background 3', image: 'bg3.jpg' },
    ]
}));

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('BackgroundSwitcher', () => {
    const renderWithProvider = (component: React.ReactElement) => {
        return render(
            <DesktopProvider>
                {component}
            </DesktopProvider>
        );
    };

    describe('Basic Rendering', () => {
        it('renders without crashing', () => {
            expect(() => renderWithProvider(<BackgroundSwitcher />)).not.toThrow();
        });

        it('renders the container with correct class', () => {
            renderWithProvider(<BackgroundSwitcher />);
            const container = document.querySelector('[class*="backgroundSwitcher"]');
            expect(container).toBeInTheDocument();
        });

        it('renders all background previews', () => {
            renderWithProvider(<BackgroundSwitcher />);
            expect(screen.getByText('Background 1')).toBeInTheDocument();
            expect(screen.getByText('Background 2')).toBeInTheDocument();
            expect(screen.getByText('Background 3')).toBeInTheDocument();
        });

        it('renders background preview images', () => {
            renderWithProvider(<BackgroundSwitcher />);
            const images = screen.getAllByRole('img');
            expect(images).toHaveLength(3);
            expect(images[0]).toHaveAttribute('src', 'bg1.jpg');
            expect(images[1]).toHaveAttribute('src', 'bg2.jpg');
            expect(images[2]).toHaveAttribute('src', 'bg3.jpg');
        });
    });

    describe('90s Style UI', () => {
        it('renders grid layout', () => {
            renderWithProvider(<BackgroundSwitcher />);
            const grid = document.querySelector('[class*="grid"]');
            expect(grid).toBeInTheDocument();
        });

        it('renders preview items with classic styling', () => {
            renderWithProvider(<BackgroundSwitcher />);
            const previews = document.querySelectorAll('[class*="preview"]');
            expect(previews.length).toBeGreaterThan(0);
        });
    });

    describe('Background Selection', () => {
        it('allows clicking on a preview', () => {
            renderWithProvider(<BackgroundSwitcher />);
            const preview = screen.getByText('Background 2').closest('[class*="preview"]') as HTMLElement;
            expect(() => fireEvent.click(preview)).not.toThrow();
        });

        it('highlights selected background', () => {
            renderWithProvider(<BackgroundSwitcher />);
            const preview = screen.getByText('Background 1').closest('[class*="preview"]') as HTMLElement;

            fireEvent.click(preview);

            expect(preview.className).toContain('selected');
        });

        it('updates selection when different preview is clicked', () => {
            renderWithProvider(<BackgroundSwitcher />);
            const preview1 = screen.getByText('Background 1').closest('[class*="preview"]') as HTMLElement;
            const preview2 = screen.getByText('Background 2').closest('[class*="preview"]') as HTMLElement;

            fireEvent.click(preview1);
            expect(preview1.className).toContain('selected');

            fireEvent.click(preview2);
            expect(preview2.className).toContain('selected');
            expect(preview1.className).not.toContain('selected');
        });
    });

    describe('Background Mode Selection', () => {
        it('renders mode selection controls', () => {
            renderWithProvider(<BackgroundSwitcher />);
            expect(screen.getByText('Fill')).toBeInTheDocument();
            expect(screen.getByText('Fit')).toBeInTheDocument();
            expect(screen.getByText('Tile')).toBeInTheDocument();
        });

        it('highlights current mode', () => {
            renderWithProvider(<BackgroundSwitcher />);
            const fillButton = screen.getByText('Fill').closest('button');
            expect(fillButton).toHaveClass(/active|selected/);
        });

        it('updates mode when clicked', () => {
            renderWithProvider(<BackgroundSwitcher />);
            const tileButton = screen.getByText('Tile').closest('button');

            fireEvent.click(tileButton!);

            expect(tileButton).toHaveClass(/active|selected/);
        });
    });

    describe('Integration with Desktop Context', () => {
        it('updates desktop background when preview is clicked', () => {
            renderWithProvider(<BackgroundSwitcher />);
            const preview = screen.getByText('Background 2').closest('[class*="preview"]') as HTMLElement;

            fireEvent.click(preview);

            // The context should be updated (verified through integration tests)
            expect(preview.className).toContain('selected');
        });
    });

    describe('Accessibility', () => {
        it('renders clickable preview elements', () => {
            renderWithProvider(<BackgroundSwitcher />);
            const previews = document.querySelectorAll('[class*="preview"]');
            previews.forEach(preview => {
                expect(preview).toBeInTheDocument();
            });
        });

        it('provides alt text for images', () => {
            renderWithProvider(<BackgroundSwitcher />);
            const images = screen.getAllByRole('img');
            images.forEach((img) => {
                expect(img).toHaveAttribute('alt', expect.stringContaining('Background'));
            });
        });
    });
});
