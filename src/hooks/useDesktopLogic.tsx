import React, { useState } from 'react';
import Calculator from '../components/apps/Calculator';
import TicTacToe from '../components/apps/TicTacToe';
import About from '../components/apps/About';
import Finder, { type Breadcrumb } from '../components/apps/Finder';
import TextEditor from '../components/apps/TextEditor';
import { useDesktop } from '../contexts/DesktopContext';
import { initialIcons } from '../config/initialState';
import { arrangeIcons } from '../utils/iconLayout';
import folderIcon from '../assets/folder_icon.png';

export interface FileItem {
    id: string;
    name: string;
    type: 'folder' | 'file' | 'app' | 'system';
    icon: string;
    children?: FileItem[];
    content?: string; // For text files
}

export interface WindowData {
    id: string;
    title: string;
    x: number;
    y: number;
    width: number;
    height: number;
    content: React.ReactNode;
}

export interface DesktopIconData {
    id: string;
    label: string;
    icon: string;
    x: number;
    y: number;
    type?: 'folder' | 'file' | 'app' | 'system';
    children?: FileItem[];
    onDoubleClick: () => void;
}

export type ClipboardData = DesktopIconData & { _cut?: boolean };

export type HistoryAction =
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

export const useDesktopLogic = () => {
    const { backgroundImage, backgroundMode } = useDesktop();
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

    // Initialize icons from config, but we need to attach handlers.
    // We'll do this in a lazy way or just map them initially.
    // Since handlers need access to `openWindow` etc, we can't define them in the config.
    // We need a way to map IDs to handlers.

    // Initialize icons from config
    const [icons, setIcons] = useState<DesktopIconData[]>(() => {
        const hydratedIcons: DesktopIconData[] = initialIcons.map(iconData => {
            // Map InitialFileItem[] to FileItem[] if necessary, but for now they match structure
            // We need to cast or map children recursively if types don't align perfectly,
            // but here they seem compatible enough for the purpose of this state.
            // However, InitialIconData.children is InitialFileItem[], DesktopIconData.children is FileItem[].
            // They are structurally identical.

            const baseIcon: DesktopIconData = {
                ...iconData,
                x: 20,
                y: 20,
                onDoubleClick: () => { }, // Placeholder
                // We need to ensure children are mapped correctly if types were stricter,
                // but TypeScript might complain about type mismatch if we don't cast or map.
                // Let's assume compatible for now or map if needed.
                children: iconData.children as unknown as FileItem[] | undefined
            };
            return baseIcon;
        });

        return arrangeIcons(hydratedIcons);
    });



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

    const handleCleanUp = () => {
        setIcons(prevIcons => arrangeIcons(prevIcons));
    };

    // Centralized double click handler
    const handleIconDoubleClick = (id: string) => {
        const icon = icons.find(i => i.id === id);
        if (!icon) return;

        if (icon.id === 'hd') {
            openWindow('hd', 'Macintosh HD', <div><p>78.4 MB in disk</p><p>0 items</p></div>);
        } else if (icon.id === 'docs') {
            if (icon.children) {
                openFinder('docs', 'Documents', icon.children, [{ id: 'docs', name: 'Documents' }]);
            }
        } else if (icon.id === 'calc') {
            openWindow('calc', 'Calculator', <Calculator />, 200, 300);
        } else if (icon.id === 'game') {
            openWindow('game', 'TicTacToe', <TicTacToe />, 200, 250);
        } else if (icon.id === 'trash') {
            openWindow('trash', 'Trash', <div><p>Trash is empty</p></div>);
        } else if (icon.type === 'folder') {
            // Generic folder opening
            openWindow(icon.id, icon.label, <div><p>Empty folder</p></div>);
        }
    };

    return {
        windows,
        activeWindowId,
        selectedIconId,
        contextMenu,
        clipboard,
        history,
        showInfoDialog,
        icons,
        backgroundImage,
        backgroundMode,
        setContextMenu,
        setShowInfoDialog,
        setSelectedIconId,
        setActiveWindowId,
        openWindow,
        closeWindow,
        closeActiveWindow,
        focusWindow,
        handleCopy,
        handleCut,
        handlePaste,
        handleUndo,
        handleClear,
        handleContextMenu,
        updateIconPosition,
        createNewFolder,
        handleCleanUp,
        handleIconDoubleClick
    };
};

