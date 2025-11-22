import React, { useState, useEffect, useRef } from 'react';
import styles from './DesktopIcon.module.scss';

interface DesktopIconProps {
    icon: string;
    label: string;
    x: number;
    y: number;
    onDoubleClick?: () => void;
    selected: boolean;
    onSelect: () => void;
    onMove?: (position: { x: number; y: number }) => void;
}

const DesktopIcon: React.FC<DesktopIconProps> = ({ icon, label, x, y, onDoubleClick, selected, onSelect, onMove }) => {
    const [position, setPosition] = useState({ x, y });
    const positionRef = useRef({ x, y });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const syncedPosition = { x, y };
        setPosition(syncedPosition);
        positionRef.current = syncedPosition;
    }, [x, y]);

    const handleMouseDown = (e: React.MouseEvent) => {
        onSelect();
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - positionRef.current.x,
            y: e.clientY - positionRef.current.y
        });
    };

    useEffect(() => {
        const handleGlobalMouseMove = (e: MouseEvent) => {
            if (isDragging) {
                const newPosition = {
                    x: e.clientX - dragOffset.x,
                    y: e.clientY - dragOffset.y
                };
                positionRef.current = newPosition;
                setPosition(newPosition);
            }
        };

        const handleGlobalMouseUp = () => {
            setIsDragging(false);
            if (isDragging) {
                onMove?.(positionRef.current);
            }
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleGlobalMouseMove);
            window.addEventListener('mouseup', handleGlobalMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleGlobalMouseMove);
            window.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [isDragging, dragOffset, onMove]);

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
