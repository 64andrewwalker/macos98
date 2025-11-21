import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import styles from './Window.module.scss';

interface WindowProps {
    id: string;
    title: string;
    x: number;
    y: number;
    width: number;
    height: number;
    onClose: () => void;
    onFocus: () => void;
    isActive: boolean;
    children: ReactNode;
}

const Window: React.FC<WindowProps> = ({ title, x, y, width, height, onClose, onFocus, isActive, children }) => {
    const [position, setPosition] = useState({ x, y });
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isZoomed, setIsZoomed] = useState(false);
    const [preZoomState, setPreZoomState] = useState({ x, y, width, height });

    const handleCollapse = () => {
        setIsCollapsed(!isCollapsed);
    };

    const handleZoom = () => {
        if (!isZoomed) {
            setPreZoomState({ x: position.x, y: position.y, width, height });
            setPosition({ x: 0, y: 22 }); // Below menu bar
            // Ideally we'd pass window size or use 100vw/vh, but for now let's just make it big
            // We can't easily change props 'width'/'height' from here without callback, 
            // so we'll handle style overrides in render.
        } else {
            setPosition({ x: preZoomState.x, y: preZoomState.y });
        }
        setIsZoomed(!isZoomed);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        onFocus();
        // Only drag if clicking the title bar and not buttons
        if ((e.target as HTMLElement).closest(`.${styles.titleBar}`) &&
            !(e.target as HTMLElement).closest(`.${styles.closeBox}`) &&
            !(e.target as HTMLElement).closest(`.${styles.collapseBox}`) &&
            !(e.target as HTMLElement).closest(`.${styles.zoomBox}`)) {
            setIsDragging(true);
            setDragOffset({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
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
            className={`${styles.window} ${isActive ? styles.active : ''}`}
            style={{
                left: position.x,
                top: position.y,
                width: isZoomed ? '100vw' : width,
                height: isCollapsed ? 'auto' : (isZoomed ? 'calc(100vh - 22px)' : height),
                zIndex: isActive ? 100 : 1
            }}
            onMouseDown={() => onFocus()}
        >
            <div className={styles.titleBar} onMouseDown={handleMouseDown} onDoubleClick={handleCollapse}>
                <div className={styles.closeBox} onClick={(e) => { e.stopPropagation(); onClose(); }}></div>
                <div className={styles.title}>
                    <span className={styles.titleText}>{title}</span>
                </div>
                <div className={styles.zoomBox} onClick={(e) => { e.stopPropagation(); handleZoom(); }}>
                    <div className={styles.zoomInner}></div>
                </div>
                <div className={styles.collapseBox} onClick={(e) => { e.stopPropagation(); handleCollapse(); }}>
                    <div className={styles.collapseInner}></div>
                </div>
            </div>
            {!isCollapsed && (
                <div className={styles.contentOuter}>
                    <div className={styles.content}>
                        {children}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Window;
