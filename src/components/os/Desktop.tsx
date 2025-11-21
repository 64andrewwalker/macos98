import React, { useState } from 'react';
import styles from './Desktop.module.scss';
import MenuBar from './MenuBar';
import DesktopIcon from './DesktopIcon';
import Window from './Window';
import ContextMenu from './ContextMenu';
import type { ContextMenuItem } from './ContextMenu';
import patternBg from '../../assets/pattern_bg.png';
import hdIcon from '../../assets/hd_icon_transparent.png';
import trashIcon from '../../assets/trash_icon_transparent.png';
import folderIcon from '../../assets/folder_icon.png';
import calcIcon from '../../assets/calculator.png';
import gameIcon from '../../assets/joystick.png';
import Calculator from '../apps/Calculator';
import TicTacToe from '../apps/TicTacToe';
import About from '../apps/About';

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
    onDoubleClick?: () => void;
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
            x: 20,
            y: 130,
            onDoubleClick: () => openWindow('docs', 'Documents', <div><p>Empty folder</p></div>)
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

    const focusWindow = (id: string) => {
        setActiveWindowId(id);
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
            action: () => alert('Get Info not implemented yet.')
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
            <MenuBar onOpenWindow={openWindow} />
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
        </div>
    );
};

export default Desktop;
