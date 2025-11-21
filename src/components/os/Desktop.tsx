import React, { useState } from 'react';
import styles from './Desktop.module.scss';
import MenuBar from './MenuBar';
import DesktopIcon from './DesktopIcon';
import Window from './Window';
import ContextMenu from './ContextMenu';
import type { ContextMenuItem } from './ContextMenu';
import InfoDialog from './InfoDialog';
import patternBg from '../../assets/pattern_bg.png';
import hdIcon from '../../assets/hd_icon.png';
import trashIcon from '../../assets/trash_icon_transparent.png';
import folderIcon from '../../assets/folder_icon.png';
import calcIcon from '../../assets/calculator.png';
import gameIcon from '../../assets/joystick.png';
import Calculator from '../apps/Calculator';
import TicTacToe from '../apps/TicTacToe';
import About from '../apps/About';
import Finder from '../apps/Finder';
import TextEditor from '../apps/TextEditor';

export interface FileItem {
    id: string;
    name: string;
    type: 'folder' | 'file' | 'app';
    icon: string;
    children?: FileItem[];
    content?: string; // For text files
}

interface WindowData {
    id: string;
    title: string;
    x: number;
    y: number;
    width: number;
    height: number;
    content: React.ReactNode;
}

interface DesktopIconData {
    id: string;
    label: string;
    icon: string;
    x: number;
    y: number;
    type?: 'folder' | 'file' | 'app' | 'system';
    children?: FileItem[];
    onDoubleClick: () => void;
}

const Desktop: React.FC = () => {
    const [windows, setWindows] = useState<WindowData[]>([]);
    const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
    const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean }>({
        x: 0,
        y: 0,
        visible: false
    });
    const [clipboard, setClipboard] = useState<DesktopIconData | null>(null);
    const [history, setHistory] = useState<{ type: string; data: any }[]>([]);
    const [showInfoDialog, setShowInfoDialog] = useState(false);

    const [icons, setIcons] = useState<DesktopIconData[]>([
        {
            id: 'hd',
            label: 'Macintosh HD',
            icon: hdIcon,
            x: 20, // Top-right is traditional, but let's stick to left for now or move to right? 
            // User said "piled up", usually means they are on top of each other.
            // My previous coords were 20,40 then 20,140 etc. Vertical stack.
            // Let's move them to the right side like real Mac OS.
            y: 40,
            onDoubleClick: () => openWindow('hd', 'Macintosh HD', <div><p>78.4 MB in disk</p><p>0 items</p></div>)
        },
        {
            id: 'docs',
            label: 'Documents',
            icon: folderIcon,
            type: 'folder',
            x: 20,
            y: 130,
            children: [
                { id: 'file_readme', name: 'README.txt', type: 'file', icon: folderIcon, content: 'Welcome to macOS 90s!\n\nThis is a retro simulation of classic Mac OS.\n\nEnjoy!' },
                { id: 'file_notes', name: 'Notes.txt', type: 'file', icon: folderIcon, content: 'My notes...' },
                {
                    id: 'folder_work', name: 'Work', type: 'folder', icon: folderIcon, children: [
                        { id: 'file_project', name: 'Project.txt', type: 'file', icon: folderIcon, content: 'Project details here.' }
                    ]
                }
            ],
            onDoubleClick: () => {
                const docsIcon = icons.find(i => i.id === 'docs');
                if (docsIcon && docsIcon.children) {
                    openFinder('docs', 'Documents', docsIcon.children, ['Documents']);
                }
            }
        },
        {
            id: 'calc',
            label: 'Calculator',
            icon: calcIcon,
            x: 20,
            y: 220,
            onDoubleClick: () => openWindow('calc', 'Calculator', <Calculator />, 200, 300)
        },
        {
            id: 'game',
            label: 'TicTacToe',
            icon: gameIcon,
            x: 20,
            y: 310,
            onDoubleClick: () => openWindow('game', 'TicTacToe', <TicTacToe />, 200, 250)
        },
        {
            id: 'trash',
            label: 'Trash',
            icon: trashIcon,
            x: 20,
            y: 400,
            onDoubleClick: () => openWindow('trash', 'Trash', <div><p>Trash is empty</p></div>)
        }
    ]);

    // Helper to find folder by ID recursively
    const findFolderById = (id: string, searchItems: FileItem[] = []): FileItem | null => {
        for (const item of searchItems) {
            if (item.id === id) return item;
            if (item.children) {
                const found = findFolderById(id, item.children);
                if (found) return found;
            }
        }
        // Also search in desktop icons
        for (const icon of icons) {
            if (icon.id === id && icon.children) {
                return {
                    id: icon.id,
                    name: icon.label,
                    type: 'folder',
                    icon: icon.icon,
                    children: icon.children
                };
            }
            if (icon.children) {
                const found = findFolderById(id, icon.children);
                if (found) return found;
            }
        }
        return null;
    };

    const openFinder = (folderId: string, folderName: string, items: FileItem[], path: string[]) => {
        const windowId = `finder_${folderId}`;

        // Check if window already exists
        if (windows.find(w => w.id === windowId)) {
            setActiveWindowId(windowId);
            return;
        }

        openWindow(
            windowId,
            folderName,
            <Finder
                items={items}
                path={path}
                onNavigate={(id) => {
                    const folder = findFolderById(id, items);
                    if (folder && folder.children) {
                        openFinder(id, folder.name, folder.children, [...path, folder.name]);
                    }
                }}
                onOpenFile={(fileId, fileName, content) => {
                    openWindow(
                        `file_${fileId}`,
                        fileName,
                        <TextEditor
                            fileId={fileId}
                            fileName={fileName}
                            initialContent={content}
                            onSave={(id, newContent) => updateFileContent(id, newContent)}
                        />,
                        600,
                        500
                    );
                }}
            />,
            500,
            400
        );
    };

    const updateFileContent = (fileId: string, newContent: string) => {
        const updateInArray = (items: FileItem[]): FileItem[] => {
            return items.map(item => {
                if (item.id === fileId) {
                    return { ...item, content: newContent };
                }
                if (item.children) {
                    return { ...item, children: updateInArray(item.children) };
                }
                return item;
            });
        };

        setIcons(icons.map(icon => {
            if (icon.children) {
                return { ...icon, children: updateInArray(icon.children) };
            }
            return icon;
        }));
    };

    const openWindow = (id: string, title: string, content: React.ReactNode, width: number = 400, height: number = 300) => {
        if (id === 'about') {
            width = 300;
            height = 200;
            content = <About />;
        } else if (id === 'new_folder') {
            // Create a new folder icon
            const newId = `folder_${Date.now()}`;

            // Simple offset logic: find a spot that isn't taken, or just stack with offset
            // For now, let's just cascade them
            const startX = 150;
            const startY = 50;

            setIcons([...icons, {
                id: newId,
                label: 'New Folder',
                icon: folderIcon,
                x: startX + (icons.length % 5) * 100, // Grid-like placement
                y: startY + Math.floor(icons.length / 5) * 100,
                onDoubleClick: () => openWindow(newId, 'New Folder', <div><p>Empty folder</p></div>)
            }]);
            return;
        }

        if (windows.find(w => w.id === id)) {
            setActiveWindowId(id);
            return;
        }
        const newWindow: WindowData = {
            id,
            title,
            x: 100 + windows.length * 20,
            y: 100 + windows.length * 20,
            width,
            height,
            content
        };
        setWindows([...windows, newWindow]);
        setActiveWindowId(id);
    };

    const closeWindow = (id: string) => {
        setWindows(windows.filter(w => w.id !== id));
        if (activeWindowId === id) {
            setActiveWindowId(null);
        }
    };

    const closeActiveWindow = () => {
        if (activeWindowId) {
            closeWindow(activeWindowId);
        }
    };

    const focusWindow = (id: string) => {
        setActiveWindowId(id);
    };

    const handleCopy = () => {
        if (!selectedIconId) return;
        const icon = icons.find(i => i.id === selectedIconId);
        if (icon) {
            setClipboard({ ...icon });
        }
    };

    const handleCut = () => {
        if (!selectedIconId) return;
        const icon = icons.find(i => i.id === selectedIconId);
        if (icon) {
            setClipboard({ ...icon, _cut: true } as any);
            // Mark visually or handle differently if needed
        }
    };

    const handlePaste = () => {
        if (!clipboard) return;

        const newIcon: DesktopIconData = {
            ...clipboard,
            id: `${clipboard.id}_copy_${Date.now()}`,
            x: clipboard.x + 20,
            y: clipboard.y + 20,
            label: clipboard.label.includes('copy') ? clipboard.label : `${clipboard.label} copy`
        };

        // If this was a cut operation, remove the original
        if ((clipboard as any)._cut) {
            const filteredIcons = icons.filter(i => i.id !== clipboard.id);
            setHistory([...history, { type: 'cut_paste', data: { original: clipboard, new: newIcon } }]);
            setIcons([...filteredIcons, newIcon]);
            setClipboard(null);
        } else {
            setHistory([...history, { type: 'paste', data: newIcon }]);
            setIcons([...icons, newIcon]);
        }
        setSelectedIconId(newIcon.id);
    };

    const handleUndo = () => {
        if (history.length === 0) return;

        const lastAction = history[history.length - 1];

        if (lastAction.type === 'create_folder' || lastAction.type === 'paste') {
            // Remove the created icon
            setIcons(icons.filter(i => i.id !== lastAction.data.id));
        } else if (lastAction.type === 'cut_paste') {
            // Restore original, remove the pasted copy
            setIcons([
                ...icons.filter(i => i.id !== lastAction.data.new.id),
                lastAction.data.original
            ]);
        }

        setHistory(history.slice(0, -1));
    };

    const handleClear = () => {
        setSelectedIconId(null);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            visible: true
        });
    };

    const contextMenuItems: ContextMenuItem[] = [
        {
            label: 'New Folder',
            action: () => {
                const newId = `folder_${Date.now()}`;
                const newFolder: DesktopIconData = {
                    id: newId,
                    label: 'New Folder',
                    icon: folderIcon,
                    x: 150 + (icons.length * 10),
                    y: 50 + (icons.length * 10),
                    onDoubleClick: () => openWindow(newId, 'New Folder', <div><p>Empty folder</p></div>)
                };
                setIcons([...icons, newFolder]);
                setHistory([...history, { type: 'create_folder', data: newFolder }]);
            }
        },
        {
            label: 'Refresh',
            action: () => {
                // Could add refresh logic here if needed
                console.log('Refresh desktop');
            }
        },
        { separator: true },
        {
            label: 'Get Info',
            action: () => setShowInfoDialog(true)
        }
    ];

    return (
        <div
            className={styles.desktop}
            style={{ backgroundImage: `url(${patternBg})` }}
            onClick={() => setActiveWindowId(null)}
            onMouseDown={(e) => {
                // Only deselect if clicking directly on the desktop background
                if (e.target === e.currentTarget) {
                    setSelectedIconId(null);
                }
            }}
            onContextMenu={handleContextMenu}
        >
            <MenuBar
                onOpenWindow={openWindow}
                onCloseActiveWindow={closeActiveWindow}
                onUndo={handleUndo}
                onCut={handleCut}
                onCopy={handleCopy}
                onPaste={handlePaste}
                onClear={handleClear}
                hasSelection={selectedIconId !== null}
                hasClipboard={clipboard !== null}
                canUndo={history.length > 0}
            />
            <div className={styles.iconContainer}>
                {icons.map(icon => (
                    <DesktopIcon
                        key={icon.id}
                        icon={icon.icon}
                        label={icon.label}
                        x={icon.x}
                        y={icon.y}
                        onDoubleClick={icon.onDoubleClick}
                        selected={selectedIconId === icon.id}
                        onSelect={() => setSelectedIconId(icon.id)}
                    />
                ))}
            </div>
            {windows.map(window => (
                <Window
                    key={window.id}
                    id={window.id}
                    title={window.title}
                    x={window.x}
                    y={window.y}
                    width={window.width}
                    height={window.height}
                    isActive={activeWindowId === window.id}
                    onClose={() => closeWindow(window.id)}
                    onFocus={() => focusWindow(window.id)}
                >
                    {window.content}
                </Window>
            ))}
            <ContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                visible={contextMenu.visible}
                items={contextMenuItems}
                onClose={() => setContextMenu({ ...contextMenu, visible: false })}
            />
            {showInfoDialog && (
                <InfoDialog
                    iconData={selectedIconId ? icons.find(i => i.id === selectedIconId) : undefined}
                    onClose={() => setShowInfoDialog(false)}
                />
            )}
        </div>
    );
};

export default Desktop;
