// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import Desktop from './Desktop';

vi.mock('../../assets/pattern_bg.png', () => ({ default: 'pattern-bg.png' }));
vi.mock('../../assets/hd_icon.png', () => ({ default: 'hd-icon.png' }));
vi.mock('../../assets/trash_icon.png', () => ({ default: 'trash-icon.png' }));
vi.mock('../../assets/folder_icon.png', () => ({ default: 'folder-icon.png' }));
vi.mock('../../assets/calculator.png', () => ({ default: 'calculator-icon.png' }));
vi.mock('../../assets/joystick.png', () => ({ default: 'joystick-icon.png' }));
vi.mock('../../assets/apple_logo.png', () => ({ default: 'apple-logo.png' }));

const findDesktopIconByLabel = (label: string) => {
    const matches = screen.getAllByText(label);
    for (const el of matches) {
        const iconRoot = el.closest('div[style]');
        if (iconRoot && iconRoot.getAttribute('style')?.includes('left')) {
            return iconRoot as HTMLElement;
        }
    }
    throw new Error(`Desktop icon with label "${label}" not found`);
};

afterEach(() => {
    cleanup();
});

describe('Desktop integration', () => {
    it('keeps dragged icon position after desktop re-renders', async () => {
        render(<Desktop />);

        const hdIcon = findDesktopIconByLabel('Macintosh HD');
        expect(hdIcon.style.left).toBe('20px');

        fireEvent.mouseDown(hdIcon, { clientX: 20, clientY: 40 });
        fireEvent.mouseMove(window, { clientX: 120, clientY: 140 });
        fireEvent.mouseUp(window);

        await waitFor(() => expect(hdIcon.style.left).toBe('120px'));

        const docsIcon = findDesktopIconByLabel('Documents');
        fireEvent.doubleClick(docsIcon);
        await screen.findAllByText('Documents');

        const hdIconAfter = findDesktopIconByLabel('Macintosh HD');
        expect(hdIconAfter.style.left).toBe('120px');
    });

    it('preserves new desktop items when saving from TextEditor', async () => {
        const { container } = render(<Desktop />);

        const docsIcon = findDesktopIconByLabel('Documents');
        fireEvent.doubleClick(docsIcon);

        const readmeLabel = await screen.findByText('README.txt');
        const readmeIcon = readmeLabel.closest('[class*="iconItem"]') as HTMLElement;
        fireEvent.doubleClick(readmeIcon);

        const saveButton = await screen.findByRole('button', { name: /save/i });

        const desktop = container.querySelector('[class*="desktop"]') as HTMLElement;
        fireEvent.contextMenu(desktop);

        const newFolderMenuItem = await screen.findByText('New Folder');
        fireEvent.click(newFolderMenuItem);

        const newFolderIcon = await waitFor(() => findDesktopIconByLabel('New Folder'));
        expect(newFolderIcon).toBeInTheDocument();

        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(findDesktopIconByLabel('New Folder')).toBeInTheDocument();
        });
    });
});
