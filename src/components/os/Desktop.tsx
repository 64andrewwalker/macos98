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
import trashIcon from '../../assets/trash_icon.png';
import folderIcon from '../../assets/folder_icon.png';
import calcIcon from '../../assets/calculator.png';
import gameIcon from '../../assets/joystick.png';
import Calculator from '../apps/Calculator';
import TicTacToe from '../apps/TicTacToe';
import About from '../apps/About';
import Finder, { type Breadcrumb } from '../apps/Finder';
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

type ClipboardData = DesktopIconData & { _cut?: boolean };

type HistoryAction =
    | { type: 'create_folder'; data: DesktopIconData }
    | { type: 'paste'; data: DesktopIconData }
    | { type: 'cut_paste'; data: { original: DesktopIconData; newIcon: DesktopIconData } };

// Generate unique IDs using a counter fallback for environments without crypto.randomUUID
let idCounter = 0;
const generateId = (prefix: string) => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return `${prefix}_${crypto.randomUUID()}`;
    }
    idCounter += 1;
    return `${prefix}_${idCounter}`;
};

const Desktop: React.FC = () => {
    const [windows, setWindows] = useState<WindowData[]>([]);
    const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
    const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; visible: boolean }>({
        x: 0,
        y: 0,
        visible: false
    });
    const [clipboard, setClipboard] = useState<ClipboardData | null>(null);
    const [history, setHistory] = useState<HistoryAction[]>([]);
    const [showInfoDialog, setShowInfoDialog] = useState(false);

    const [icons, setIcons] = useState<DesktopIconData[]>([
        {
            id: 'hd',
            label: 'Macintosh HD',
            icon: hdIcon,
            type: 'system',
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
                    openFinder('docs', 'Documents', docsIcon.children, [{ id: 'docs', name: 'Documents' }]);
                }
            }
        },
        {
            id: 'calc',
            label: 'Calculator',
            icon: calcIcon,
            type: 'app',
            x: 20,
            y: 220,
            onDoubleClick: () => openWindow('calc', 'Calculator', <Calculator />, 200, 300)
        },
        {
            id: 'game',
            label: 'TicTacToe',
            icon: gameIcon,
            type: 'app',
            x: 20,
            y: 310,
            onDoubleClick: () => openWindow('game', 'TicTacToe', <TicTacToe />, 200, 250)
        },
        {
            id: 'trash',
            label: 'Trash',
            icon: trashIcon,
            type: 'system',
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

    const updateIconPosition = (id: string, position: { x: number; y: number }) => {
        setIcons(prevIcons => prevIcons.map(icon => icon.id === id ? { ...icon, x: position.x, y: position.y } : icon));
    };

    const createNewFolder = (position?: { x?: number; y?: number }) => {
        setIcons(prevIcons => {
            const baseX = 150 + (prevIcons.length % 5) * 100;
            const baseY = 50 + Math.floor(prevIcons.length / 5) * 100;
            const newId = generateId('folder');
            const newFolder: DesktopIconData = {
                id: newId,
                label: 'New Folder',
                icon: folderIcon,
                type: 'folder',
                x: position?.x ?? baseX,
                y: position?.y ?? baseY,
                onDoubleClick: () => openWindow(newId, 'New Folder', <div><p>Empty folder</p></div>)
            };

            setHistory(prevHistory => [...prevHistory, { type: 'create_folder', data: newFolder }]);
            setSelectedIconId(newId);
            return [...prevIcons, newFolder];
        });
    };

    const openFinder = (folderId: string, folderName: string, items: FileItem[], path: Breadcrumb[]) => {
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
                    const folder = findFolderById(id);
                    if (folder && folder.children) {
                        const existingIndex = path.findIndex(crumb => crumb.id === id);
                        const nextPath = existingIndex >= 0
                            ? path.slice(0, existingIndex + 1)
                            : [...path, { id, name: folder.name }];

                        openFinder(id, folder.name, folder.children, nextPath);
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

        setIcons(prevIcons => prevIcons.map(icon => {
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
            createNewFolder();
            return;
        }

        setWindows(prevWindows => {
            if (prevWindows.find(w => w.id === id)) {
                setActiveWindowId(id);
                return prevWindows;
            }

            const newWindow: WindowData = {
                id,
                title,
                x: 100 + prevWindows.length * 20,
                y: 100 + prevWindows.length * 20,
                width,
                height,
                content
            };
            setActiveWindowId(id);
            return [...prevWindows, newWindow];
        });
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
            setClipboard({ ...icon, _cut: true });
        }
    };

    const handlePaste = () => {
        if (!clipboard) return;

        const { _cut, ...clipboardData } = clipboard;
        const newIcon: DesktopIconData = {
            ...clipboardData,
            id: `${clipboardData.id}_copy_${generateId('copy')}`,
            x: clipboardData.x + 20,
            y: clipboardData.y + 20,
            label: clipboardData.label.includes('copy') ? clipboardData.label : `${clipboardData.label} copy`
        };

        setIcons(prevIcons => {
            if (_cut) {
                setHistory(prevHistory => [...prevHistory, { type: 'cut_paste', data: { original: clipboardData, newIcon } }]);
                setClipboard(null);
                return [...prevIcons.filter(i => i.id !== clipboardData.id), newIcon];
            }

            setHistory(prevHistory => [...prevHistory, { type: 'paste', data: newIcon }]);
            return [...prevIcons, newIcon];
        });

        setSelectedIconId(newIcon.id);
    };

    const handleUndo = () => {
        setHistory(prevHistory => {
            if (prevHistory.length === 0) return prevHistory;

            const lastAction = prevHistory[prevHistory.length - 1];

            setIcons(prevIcons => {
                if (lastAction.type === 'create_folder' || lastAction.type === 'paste') {
                    return prevIcons.filter(i => i.id !== lastAction.data.id);
                }

                if (lastAction.type === 'cut_paste') {
                    return [
                        ...prevIcons.filter(i => i.id !== lastAction.data.newIcon.id),
                        lastAction.data.original
                    ];
                }

                return prevIcons;
            });

            return prevHistory.slice(0, -1);
        });
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
                createNewFolder({
                    x: 150 + (icons.length * 10),
                    y: 50 + (icons.length * 10)
                });
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
                        onMove={(position) => updateIconPosition(icon.id, position)}
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
                onClose={() => setContextMenu(prev => ({ ...prev, visible: false }))}
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
