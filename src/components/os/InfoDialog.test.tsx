// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import InfoDialog from './InfoDialog';

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('InfoDialog', () => {
    const mockOnClose = vi.fn();

    const mockIconData = {
        label: 'Test Folder',
        icon: '/folder-icon.png',
        x: 100.5,
        y: 200.7,
        id: 'folder-123'
    };

    describe('Basic Rendering', () => {
        it('renders without crashing', () => {
            expect(() => render(<InfoDialog onClose={mockOnClose} />)).not.toThrow();
        });

        it('renders the overlay and dialog', () => {
            render(<InfoDialog onClose={mockOnClose} />);
            const overlay = document.querySelector('[class*="overlay"]');
            const dialog = document.querySelector('[class*="dialog"]');
            expect(overlay).toBeInTheDocument();
            expect(dialog).toBeInTheDocument();
        });

        it('renders the title bar with "Get Info"', () => {
            render(<InfoDialog onClose={mockOnClose} />);
            const titleBar = document.querySelector('[class*="titleBar"]');
            expect(titleBar).toBeInTheDocument();
            expect(titleBar).toHaveTextContent('Get Info');
        });

        it('renders the OK button', () => {
            render(<InfoDialog onClose={mockOnClose} />);
            const okButton = screen.getByRole('button', { name: 'OK' });
            expect(okButton).toBeInTheDocument();
        });
    });

    describe('With Icon Data', () => {
        beforeEach(() => {
            render(<InfoDialog iconData={mockIconData} onClose={mockOnClose} />);
        });

        it('renders the icon preview', () => {
            const iconImg = screen.getByAltText('Test Folder');
            expect(iconImg).toBeInTheDocument();
            expect(iconImg).toHaveAttribute('src', '/folder-icon.png');
        });

        it('displays the name field', () => {
            expect(screen.getByText('Name:')).toBeInTheDocument();
            expect(screen.getByText('Test Folder')).toBeInTheDocument();
        });

        it('displays the correct type for folder', () => {
            expect(screen.getByText('Type:')).toBeInTheDocument();
            expect(screen.getByText('Folder')).toBeInTheDocument();
        });

        it('displays the position with rounded coordinates', () => {
            expect(screen.getByText('(101, 201)')).toBeInTheDocument();
        });

        it('displays the ID', () => {
            expect(screen.getByText('ID:')).toBeInTheDocument();
            expect(screen.getByText('folder-123')).toBeInTheDocument();
        });
    });

    describe('Type Determination', () => {
        it('displays "Hard Drive" for hd id', () => {
            const hdData = { ...mockIconData, id: 'hd' };
            render(<InfoDialog iconData={hdData} onClose={mockOnClose} />);
            expect(screen.getByText('Hard Drive')).toBeInTheDocument();
        });

        it('displays "Trash" for trash id', () => {
            const trashData = { ...mockIconData, id: 'trash' };
            render(<InfoDialog iconData={trashData} onClose={mockOnClose} />);
            expect(screen.getByText('Trash')).toBeInTheDocument();
        });

        it('displays "Application" for other ids', () => {
            const appData = { ...mockIconData, id: 'calculator' };
            render(<InfoDialog iconData={appData} onClose={mockOnClose} />);
            expect(screen.getByText('Application')).toBeInTheDocument();
        });

        it('prefers explicit type when id is not folder-prefixed', () => {
            const docsFolder = { ...mockIconData, id: 'docs', type: 'folder' as const };
            render(<InfoDialog iconData={docsFolder} onClose={mockOnClose} />);

            expect(screen.getByText('Folder')).toBeInTheDocument();
        });
    });

    describe('Without Icon Data (Desktop Info)', () => {
        beforeEach(() => {
            render(<InfoDialog onClose={mockOnClose} />);
        });

        it('displays desktop information', () => {
            expect(screen.getByText('Desktop')).toBeInTheDocument();
            expect(screen.getByText('This is the main desktop area.')).toBeInTheDocument();
        });

        it('does not show icon preview', () => {
            const iconImg = screen.queryByRole('img');
            expect(iconImg).not.toBeInTheDocument();
        });

        it('does not show detailed info fields', () => {
            expect(screen.queryByText('Name:')).not.toBeInTheDocument();
            expect(screen.queryByText('Type:')).not.toBeInTheDocument();
            expect(screen.queryByText('Position:')).not.toBeInTheDocument();
            expect(screen.queryByText('ID:')).not.toBeInTheDocument();
        });
    });

    describe('Event Handling', () => {
        it('calls onClose when OK button is clicked', () => {
            render(<InfoDialog onClose={mockOnClose} />);
            const okButton = screen.getByRole('button', { name: 'OK' });

            fireEvent.click(okButton);

            expect(mockOnClose).toHaveBeenCalledTimes(1);
        });

        it('calls onClose when overlay is clicked', () => {
            render(<InfoDialog onClose={mockOnClose} />);
            const overlay = document.querySelector('[class*="overlay"]') as HTMLElement;

            fireEvent.click(overlay);

            expect(mockOnClose).toHaveBeenCalled();
        });

        it('does not call onClose when dialog content is clicked', () => {
            render(<InfoDialog onClose={mockOnClose} />);
            const titleBar = document.querySelector('[class*="titleBar"]') as HTMLElement;

            fireEvent.click(titleBar);

            expect(mockOnClose).not.toHaveBeenCalled();
        });

        it('does not trigger close when dialog wrapper is clicked', () => {
            render(<InfoDialog onClose={mockOnClose} />);
            const dialog = document.querySelector('[class*="dialog"]') as HTMLElement;

            fireEvent.click(dialog);

            expect(mockOnClose).not.toHaveBeenCalled();
        });
    });

    describe('Edge Cases', () => {
        it('handles icon data with zero coordinates', () => {
            const zeroCoordData = { ...mockIconData, x: 0, y: 0 };
            render(<InfoDialog iconData={zeroCoordData} onClose={mockOnClose} />);

            expect(screen.getByText('(0, 0)')).toBeInTheDocument();
        });

        it('handles icon data with negative coordinates', () => {
            const negativeCoordData = { ...mockIconData, x: -10.7, y: -20.3 };
            render(<InfoDialog iconData={negativeCoordData} onClose={mockOnClose} />);

            expect(screen.getByText('(-11, -20)')).toBeInTheDocument();
        });

        it('handles empty label gracefully', () => {
            const emptyLabelData = { ...mockIconData, label: '' };
            render(<InfoDialog iconData={emptyLabelData} onClose={mockOnClose} />);

            const iconImg = screen.getByAltText('');
            expect(iconImg).toBeInTheDocument();
            const nameRow = screen.getByText('Name:').closest('div');
            expect(nameRow).toBeInTheDocument();
        });

        it('handles missing icon property', () => {
            const { icon, ...noIconData } = mockIconData;
            expect(icon).toBeDefined();
            expect(() => render(<InfoDialog iconData={noIconData} onClose={mockOnClose} />)).not.toThrow();
        });
    });

    describe('Accessibility', () => {
        it('has proper alt text for icons', () => {
            render(<InfoDialog iconData={mockIconData} onClose={mockOnClose} />);
            const iconImg = screen.getByAltText('Test Folder');
            expect(iconImg).toBeInTheDocument();
        });

        it('has accessible button text', () => {
            render(<InfoDialog onClose={mockOnClose} />);
            const okButton = screen.getByRole('button', { name: 'OK' });
            expect(okButton).toBeInTheDocument();
        });
    });

    describe('State Management', () => {
        it('maintains icon data display consistency on rerender', () => {
            const { rerender } = render(<InfoDialog iconData={mockIconData} onClose={mockOnClose} />);

            expect(screen.getByText('Test Folder')).toBeInTheDocument();

            const newIconData = { ...mockIconData, label: 'Updated Folder' };
            rerender(<InfoDialog iconData={newIconData} onClose={mockOnClose} />);

            expect(screen.getByText('Updated Folder')).toBeInTheDocument();
        });

        it('switches between icon and desktop modes correctly', () => {
            const { rerender } = render(<InfoDialog iconData={mockIconData} onClose={mockOnClose} />);

            expect(screen.getByText('Test Folder')).toBeInTheDocument();
            expect(screen.queryByText('Desktop')).not.toBeInTheDocument();

            rerender(<InfoDialog onClose={mockOnClose} />);

            expect(screen.getByText('Desktop')).toBeInTheDocument();
            expect(screen.queryByText('Test Folder')).not.toBeInTheDocument();
        });
    });
});
