import React, { useEffect, useRef } from 'react';
import styles from './ContextMenu.module.scss';

export interface ContextMenuItem {
    label?: string;
    action?: () => void;
    separator?: boolean;
}

interface ContextMenuProps {
    x: number;
    y: number;
    visible: boolean;
    items: ContextMenuItem[];
    onClose: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, visible, items, onClose }) => {
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!visible) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        // Small delay to prevent the right-click from immediately closing
        setTimeout(() => {
            document.addEventListener('click', handleClickOutside);
        }, 0);

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [visible, onClose]);

    if (!visible) return null;

    return (
        <div
            ref={menuRef}
            className={styles.contextMenu}
            style={{ left: `${x}px`, top: `${y}px` }}
        >
            {items.map((item, index) => {
                if (item.separator) {
                    return <div key={index} className={styles.separator}></div>;
                }
                return (
                    <div
                        key={index}
                        className={styles.menuItem}
                        onClick={() => {
                            if (item.action) {
                                item.action();
                            }
                            onClose();
                        }}
                    >
                        {item.label}
                    </div>
                );
            })}
        </div>
    );
};

export default ContextMenu;
