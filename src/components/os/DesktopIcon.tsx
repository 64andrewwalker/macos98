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
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x, y });
    const positionRef = useRef({ x, y });
    const prevPropsRef = useRef({ x, y });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    // Sync props to state when props change
    // If dragging when props change, stop dragging and sync to new position
    // Using useLayoutEffect to update before paint
    React.useLayoutEffect(() => {
        if (prevPropsRef.current.x !== x || prevPropsRef.current.y !== y) {
            const newPosition = { x, y };
            setPosition(newPosition);
            positionRef.current = newPosition;
            prevPropsRef.current = newPosition;
            // If we were dragging when props changed, stop dragging
            if (isDragging) {
                setIsDragging(false);
            }
        }
    }, [x, y, isDragging]);

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
