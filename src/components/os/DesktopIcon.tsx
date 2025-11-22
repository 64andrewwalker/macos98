import React, { useState, useEffect } from 'react';
import styles from './DesktopIcon.module.scss';

interface DesktopIconProps {
    icon: string;
    label: string;
    x: number;
    y: number;
    onDoubleClick?: () => void;
    selected: boolean;
    onSelect: () => void;
}

const DesktopIcon: React.FC<DesktopIconProps> = ({ icon, label, x, y, onDoubleClick, selected, onSelect }) => {
    const [position, setPosition] = useState({ x, y });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        onSelect();
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y
        });
    };

    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragOffset.x,
                    y: e.clientY - dragOffset.y
                });
            }
        };

        const handleGlobalMouseUp = () => {
            setIsDragging(false);
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleGlobalMouseMove);
            window.addEventListener('mouseup', handleGlobalMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isDragging, dragOffset]);

    return (
        <div
            className={`${styles.desktopIcon} ${selected ? styles.selected : ''} `}
            style={{ left: position.x, top: position.y }}
            onMouseDown={handleMouseDown}
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick?.(); }}
        >
            <div className={styles.iconWrapper}>
                <img src={icon} alt={label} />
                {selected && <div className={styles.ditherOverlay}></div>}
            </div>
            <div className={styles.label}>
                <span>{label}</span>
            </div>
        </div>
    );
};

export default DesktopIcon;
