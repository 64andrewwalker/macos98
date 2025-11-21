// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import Finder, { type FileItem } from './Finder';

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

describe('Finder', () => {
    const mockOnNavigate = vi.fn();
    const mockOnOpenFile = vi.fn();

    const mockItems: FileItem[] = [
        {
            id: 'folder1',
            name: 'Documents',
            type: 'folder',
            icon: '/folder-icon.png'
        },
        {
            id: 'file1',
            name: 'readme.txt',
            type: 'file',
            icon: '/file-icon.png',
            content: 'This is a test file content.'
        },
        {
            id: 'app1',
            name: 'Calculator',
            type: 'app',
            icon: '/app-icon.png'
        }
    ];

    const mockPath = ['Macintosh HD', 'Users', 'Documents'];

    const defaultProps = {
        items: mockItems,
        path: mockPath,
        onNavigate: mockOnNavigate,
        onOpenFile: mockOnOpenFile
    };

    describe('Basic Rendering', () => {
        it('renders without crashing', () => {
            expect(() => render(<Finder {...defaultProps} />)).not.toThrow();
        });

        it('renders the finder container', () => {
            render(<Finder {...defaultProps} />);
            const finder = document.querySelector('[class*="finder"]');
            expect(finder).toBeInTheDocument();
        });

        it('renders the toolbar and content area', () => {
            render(<Finder {...defaultProps} />);
            const toolbar = document.querySelector('[class*="toolbar"]');
            const content = document.querySelector('[class*="content"]');
            expect(toolbar).toBeInTheDocument();
            expect(content).toBeInTheDocument();
        });

        it('renders the status bar', () => {
            render(<Finder {...defaultProps} />);
            const statusBar = document.querySelector('[class*="statusBar"]');
            expect(statusBar).toBeInTheDocument();
            expect(screen.getByText('3 items')).toBeInTheDocument();
        });
    });

    describe('Breadcrumb Navigation', () => {
        it('renders breadcrumb path correctly', () => {
            render(<Finder {...defaultProps} />);

            expect(screen.getByText('Macintosh HD')).toBeInTheDocument();
            expect(screen.getByText('Users')).toBeInTheDocument();
            const documentSegments = screen.getAllByText('Documents');
            expect(documentSegments.length).toBeGreaterThan(0);
        });

        it('renders breadcrumb separators', () => {
            render(<Finder {...defaultProps} />);

            const separators = screen.getAllByText('›');
            expect(separators).toHaveLength(2);
        });

        it('calls handleBreadcrumbClick when breadcrumb is clicked', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
            render(<Finder {...defaultProps} />);

            const firstBreadcrumb = screen.getByText('Macintosh HD');
            fireEvent.click(firstBreadcrumb);

            expect(consoleSpy).toHaveBeenCalledWith('Navigate to breadcrumb index:', 0);
            consoleSpy.mockRestore();
        });

        it('handles empty path', () => {
            render(<Finder {...defaultProps} path={[]} />);
            const separators = screen.queryAllByText('›');
            expect(separators).toHaveLength(0);
        });

        it('handles single item path', () => {
            render(<Finder {...defaultProps} path={['Root']} />);

            expect(screen.getByText('Root')).toBeInTheDocument();
            const separators = screen.queryAllByText('›');
            expect(separators).toHaveLength(0);
        });
    });

    describe('View Mode Toggle', () => {
        it('renders view toggle buttons', () => {
            render(<Finder {...defaultProps} />);

            expect(screen.getByTitle('Icon View')).toBeInTheDocument();
            expect(screen.getByTitle('List View')).toBeInTheDocument();
        });

        it('starts in icon view by default', () => {
            render(<Finder {...defaultProps} />);

            const iconView = document.querySelector('[class*="iconView"]');
            expect(iconView).toBeInTheDocument();

            const listView = document.querySelector('[class*="listView"]');
            expect(listView).not.toBeInTheDocument();
        });

        it('switches to list view when list button is clicked', () => {
            render(<Finder {...defaultProps} />);

            const listButton = screen.getByTitle('List View');
            fireEvent.click(listButton);

            const listView = document.querySelector('[class*="listView"]');
            expect(listView).toBeInTheDocument();

            const iconView = document.querySelector('[class*="iconView"]');
            expect(iconView).not.toBeInTheDocument();
        });

        it('switches back to icon view when icon button is clicked', () => {
            render(<Finder {...defaultProps} />);

            const listButton = screen.getByTitle('List View');
            fireEvent.click(listButton);

            const iconButton = screen.getByTitle('Icon View');
            fireEvent.click(iconButton);

            const iconView = document.querySelector('[class*="iconView"]');
            expect(iconView).toBeInTheDocument();

            const listView = document.querySelector('[class*="listView"]');
            expect(listView).not.toBeInTheDocument();
        });

        it('highlights active view mode button', () => {
            render(<Finder {...defaultProps} />);

            const iconButton = screen.getByTitle('Icon View') as HTMLElement;
            const listButton = screen.getByTitle('List View') as HTMLElement;

            expect(iconButton.className).toContain('active');
            expect(listButton.className).not.toContain('active');

            fireEvent.click(listButton);

            expect(iconButton.className).not.toContain('active');
            expect(listButton.className).toContain('active');
        });
    });

    describe('Icon View', () => {
        it('renders all items as icons', () => {
            render(<Finder {...defaultProps} />);

            mockItems.forEach(item => {
                const iconElement = screen.getByAltText(item.name);
                expect(iconElement).toBeInTheDocument();

                const nameElements = screen.getAllByText(item.name);
                const iconNameElement = nameElements.find(el => el.closest('[class*="iconView"]'));
                expect(iconNameElement).toBeInTheDocument();
            });
        });

        it('handles item selection', () => {
            render(<Finder {...defaultProps} />);

            const firstItem = screen.getAllByText('Documents').find(el =>
                el.closest('[class*="iconItem"]')
            )!.closest('[class*="iconItem"]') as HTMLElement;
            expect(firstItem.className).not.toContain('selected');

            fireEvent.click(firstItem);
            expect(firstItem.className).toContain('selected');

            const secondItem = screen.getByText('readme.txt').closest('[class*="iconItem"]') as HTMLElement;
            fireEvent.click(secondItem);
            expect(secondItem.className).toContain('selected');
            expect(firstItem.className).not.toContain('selected');
        });

        it('calls onNavigate when folder is double-clicked', () => {
            render(<Finder {...defaultProps} />);

            const folderItem = screen.getAllByText('Documents').find(el =>
                el.closest('[class*="iconItem"]')
            )!.closest('[class*="iconItem"]') as HTMLElement;
            fireEvent.doubleClick(folderItem);

            expect(mockOnNavigate).toHaveBeenCalledWith('folder1');
        });

        it('calls onOpenFile when file with content is double-clicked', () => {
            render(<Finder {...defaultProps} />);

            const fileItem = screen.getByText('readme.txt').closest('[class*="iconItem"]') as HTMLElement;
            fireEvent.doubleClick(fileItem);

            expect(mockOnOpenFile).toHaveBeenCalledWith('file1', 'readme.txt', 'This is a test file content.');
        });

        it('does not call onOpenFile when file has no content', () => {
            const itemsWithoutContent = [
                {
                    id: 'file2',
                    name: 'empty.txt',
                    type: 'file' as const,
                    icon: '/file-icon.png'
                }
            ];

            render(<Finder {...defaultProps} items={itemsWithoutContent} />);

            const fileItem = screen.getByText('empty.txt').closest('[class*="iconItem"]') as HTMLElement;
            fireEvent.doubleClick(fileItem);

            expect(mockOnOpenFile).not.toHaveBeenCalled();
        });

        it('does not call navigation callbacks for app items', () => {
            render(<Finder {...defaultProps} />);

            const appItem = screen.getByText('Calculator').closest('[class*="iconItem"]') as HTMLElement;
            fireEvent.doubleClick(appItem);

            expect(mockOnNavigate).not.toHaveBeenCalled();
            expect(mockOnOpenFile).not.toHaveBeenCalled();
        });
    });

    describe('List View', () => {
        beforeEach(() => {
            render(<Finder {...defaultProps} />);
            const listButton = screen.getByTitle('List View');
            fireEvent.click(listButton);
        });

        it('renders table with correct headers', () => {
            expect(screen.getByText('Name')).toBeInTheDocument();
            expect(screen.getByText('Type')).toBeInTheDocument();
            expect(screen.getByText('Size')).toBeInTheDocument();
        });

        it('renders all items in table rows', () => {
            mockItems.forEach(item => {
                const nameElements = screen.getAllByText(item.name);
                const tableNameElement = nameElements.find(el => el.closest('tbody'));
                expect(tableNameElement).toBeInTheDocument();
            });
        });

        it('displays correct type labels', () => {
            const folderType = screen.getAllByText('Folder').find(el => el.closest('tbody'));
            const fileType = screen.getAllByText('File').find(el => el.closest('tbody'));

            expect(folderType).toBeInTheDocument();
            expect(fileType).toBeInTheDocument();
        });

        it('displays file size for files', () => {
            expect(screen.getByText('28 bytes')).toBeInTheDocument();
        });

        it('displays "--" for non-file items', () => {
            const sizeCells = screen.getAllByText('--');
            expect(sizeCells).toHaveLength(2);
        });

        it('handles item selection in list view', () => {
            const rows = screen.getAllByRole('row');
            const firstRow = rows[1]; // Skip header row

            expect((firstRow as HTMLElement).className).not.toContain('selected');

            fireEvent.click(firstRow);
            expect((firstRow as HTMLElement).className).toContain('selected');
        });

        it('calls onNavigate when folder row is double-clicked', () => {
            const folderRow = screen.getAllByText('Documents').find(el =>
                el.closest('tbody')
            )!.closest('tr') as HTMLElement;
            fireEvent.doubleClick(folderRow);

            expect(mockOnNavigate).toHaveBeenCalledWith('folder1');
        });

        it('calls onOpenFile when file row is double-clicked', () => {
            const fileRow = screen.getByText('readme.txt').closest('tr') as HTMLElement;
            fireEvent.doubleClick(fileRow);

            expect(mockOnOpenFile).toHaveBeenCalledWith('file1', 'readme.txt', 'This is a test file content.');
        });
    });

    describe('Status Bar', () => {
        it('displays correct item count for single item', () => {
            render(<Finder {...defaultProps} items={[mockItems[0]]} />);
            expect(screen.getByText('1 item')).toBeInTheDocument();
        });

        it('displays correct item count for multiple items', () => {
            render(<Finder {...defaultProps} />);
            expect(screen.getByText('3 items')).toBeInTheDocument();
        });

        it('displays correct count for zero items', () => {
            render(<Finder {...defaultProps} items={[]} />);
            expect(screen.getByText('0 items')).toBeInTheDocument();
        });
    });

    describe('Empty State', () => {
        it('handles empty items array', () => {
            expect(() => render(<Finder {...defaultProps} items={[]} />)).not.toThrow();
        });

        it('displays zero items in status bar', () => {
            render(<Finder {...defaultProps} items={[]} />);
            expect(screen.getByText('0 items')).toBeInTheDocument();
        });

        it('renders empty icon view', () => {
            render(<Finder {...defaultProps} items={[]} />);
            const iconView = document.querySelector('[class*="iconView"]');
            expect(iconView).toBeInTheDocument();
            expect(iconView?.children).toHaveLength(0);
        });

        it('renders empty list view', () => {
            render(<Finder {...defaultProps} items={[]} />);
            const listButton = screen.getByTitle('List View');
            fireEvent.click(listButton);

            const tbody = document.querySelector('tbody');
            expect(tbody?.children).toHaveLength(0);
        });
    });

    describe('Edge Cases', () => {
        it('handles items without icons gracefully', () => {
            const itemsWithoutIcons = [{
                id: 'test',
                name: 'Test Item',
                type: 'file' as const,
                icon: ''
            }];

            render(<Finder {...defaultProps} items={itemsWithoutIcons} />);

            const icon = screen.getByAltText('Test Item');
            expect(icon).toBeInTheDocument();
        });

        it('handles file content of various lengths', () => {
            const emptyFile = {
                id: 'empty',
                name: 'empty.txt',
                type: 'file' as const,
                icon: '/file-icon.png',
                content: ''
            };

            const longFile = {
                id: 'long',
                name: 'long.txt',
                type: 'file' as const,
                icon: '/file-icon.png',
                content: 'a'.repeat(1000)
            };

            render(<Finder {...defaultProps} items={[emptyFile, longFile]} />);

            fireEvent.click(screen.getByTitle('List View'));

            expect(screen.getByText('0 bytes')).toBeInTheDocument();
            expect(screen.getByText('1000 bytes')).toBeInTheDocument();
        });

        it('handles undefined content for files', () => {
            const fileWithoutContent = {
                id: 'no-content',
                name: 'no-content.txt',
                type: 'file' as const,
                icon: '/file-icon.png'
            };

            render(<Finder {...defaultProps} items={[fileWithoutContent]} />);

            fireEvent.click(screen.getByTitle('List View'));

            expect(screen.getByText('0 bytes')).toBeInTheDocument();
        });

        it('maintains selection state correctly', () => {
            render(<Finder {...defaultProps} />);

            const firstItem = screen.getAllByText('Documents').find(el =>
                el.closest('[class*="iconItem"]')
            )!.closest('[class*="iconItem"]') as HTMLElement;
            const secondItem = screen.getByText('readme.txt').closest('[class*="iconItem"]') as HTMLElement;

            fireEvent.click(firstItem);
            expect(firstItem.className).toContain('selected');

            fireEvent.click(secondItem);
            expect(secondItem.className).toContain('selected');
            expect(firstItem.className).not.toContain('selected');
        });

        it('handles view mode switching with selection', () => {
            render(<Finder {...defaultProps} />);

            const firstItem = screen.getAllByText('Documents').find(el =>
                el.closest('[class*="iconItem"]')
            )!.closest('[class*="iconItem"]') as HTMLElement;
            fireEvent.click(firstItem);

            const listButton = screen.getByTitle('List View');
            fireEvent.click(listButton);

            const folderRow = screen.getAllByText('Documents').find(el => el.closest('tbody'))!.closest('tr') as HTMLElement;
            expect(folderRow.className).toContain('selected');
        });
    });

    describe('Accessibility', () => {
        it('has proper alt text for all icons', () => {
            render(<Finder {...defaultProps} />);

            mockItems.forEach(item => {
                const icon = screen.getByAltText(item.name);
                expect(icon).toBeInTheDocument();
            });
        });

        it('has descriptive button titles', () => {
            render(<Finder {...defaultProps} />);

            expect(screen.getByTitle('Icon View')).toBeInTheDocument();
            expect(screen.getByTitle('List View')).toBeInTheDocument();
        });
    });

    describe('State Management', () => {
        it('maintains view mode state', () => {
            const { rerender } = render(<Finder {...defaultProps} />);

            const listButton = screen.getByTitle('List View');
            fireEvent.click(listButton);

            rerender(<Finder {...defaultProps} />);
            expect(document.querySelector('[class*="listView"]')).toBeInTheDocument();
        });

        it('maintains selection state', () => {
            const { rerender } = render(<Finder {...defaultProps} />);

            const initialItem = screen.getAllByText('Documents').find(el =>
                el.closest('[class*="iconItem"]')
            )!.closest('[class*="iconItem"]') as HTMLElement;
            fireEvent.click(initialItem);

            rerender(<Finder {...defaultProps} />);

            const refreshedItem = screen.getAllByText('Documents').find(el =>
                el.closest('[class*="iconItem"]')
            )!.closest('[class*="iconItem"]') as HTMLElement;
            expect(refreshedItem.className).toContain('selected');
        });

        it('resets selection when items change', () => {
            const { rerender } = render(<Finder {...defaultProps} />);

            const firstItem = screen.getAllByText('Documents').find(el =>
                el.closest('[class*="iconItem"]')
            )!.closest('[class*="iconItem"]') as HTMLElement;
            fireEvent.click(firstItem);

            rerender(<Finder {...defaultProps} items={[mockItems[1]]} />);

            const newItem = screen.getByText('readme.txt').closest('[class*="iconItem"]') as HTMLElement;
            expect(newItem.className).not.toContain('selected');
        });
    });
});
