import React from 'react';
import styles from './Desktop.module.scss';
import MenuBar from './MenuBar';
import DesktopIcon from './DesktopIcon';
import Window from './Window';
import ContextMenu from './ContextMenu';
import type { ContextMenuItem } from './ContextMenu';
import InfoDialog from './InfoDialog';
import BackgroundSwitcher from '../apps/BackgroundSwitcher';
import { useDesktopLogic, type FileItem } from '../../hooks/useDesktopLogic';

export type { FileItem };

const Desktop: React.FC = () => {
    const {
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
    } = useDesktopLogic();

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
            label: 'Change Background...',
            action: () => {
                openWindow('background_switcher', 'Change Background', <BackgroundSwitcher />, 600, 500);
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
            label: 'Clean Up',
            action: handleCleanUp
        },
        { separator: true },
        {
            label: 'Get Info',
            action: () => setShowInfoDialog(true)
        }
    ];

    const getBackgroundStyle = () => {
        const baseStyle: React.CSSProperties = {
            backgroundImage: `url(${backgroundImage})`
        };

        switch (backgroundMode) {
            case 'fill':
                return { ...baseStyle, backgroundSize: 'cover', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' };
            case 'fit':
                return { ...baseStyle, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center', backgroundColor: 'var(--gray-0)' };
            case 'tile':
                return { ...baseStyle, backgroundSize: 'auto', backgroundRepeat: 'repeat' };
            default:
                return baseStyle;
        }
    };

    return (
        <div
            className={styles.desktop}
            style={getBackgroundStyle()}
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
                        onDoubleClick={() => handleIconDoubleClick(icon.id)}
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
                    isActive={window.id === activeWindowId}
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
