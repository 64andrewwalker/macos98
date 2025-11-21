import React, { useState, useEffect } from 'react';
import styles from './MenuBar.module.scss';
import appleLogo from '../../assets/apple_logo.png';

interface MenuBarProps {
    onOpenWindow: (id: string, title: string, content: React.ReactNode, width?: number, height?: number) => void;
}

const MenuBar: React.FC<MenuBarProps> = ({ onOpenWindow }) => {
    const [time, setTime] = useState(new Date());
    const [activeMenu, setActiveMenu] = useState<string | null>(null);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const menuBar = document.querySelector(`.${styles.menuBar}`);

            // Only close menu if click is outside the menuBar
            if (menuBar && !menuBar.contains(target)) {
                setActiveMenu(null);
            }
        };

        window.addEventListener('click', handleClickOutside);

        return () => {
            clearInterval(timer);
            window.removeEventListener('click', handleClickOutside);
        };
    }, []);

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    const handleMenuClick = (menu: string) => {
        setActiveMenu(activeMenu === menu ? null : menu);
    };

    const handleMenuHover = (menu: string) => {
        if (activeMenu) {
            setActiveMenu(menu);
        }
    };

    return (
        <div className={styles.menuBar}>
            <div className={styles.left}>
                <div
                    className={`${styles.menuItem} ${styles.appleLogo} ${activeMenu === 'apple' ? styles.active : ''} `}
                    onClick={(e) => { e.stopPropagation(); handleMenuClick('apple'); }}
                    onMouseEnter={() => handleMenuHover('apple')}
                >
                    <img src={appleLogo} alt="Apple" />
                    {activeMenu === 'apple' && (
                        <div className={styles.dropdown}>
                            <div className={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); onOpenWindow('about', 'About This Computer', null); setActiveMenu(null); }}>About This Computer...</div>
                        </div>
                    )}
                </div>
                <div
                    className={`${styles.menuItem} ${activeMenu === 'file' ? styles.active : ''}`}
                    onClick={(e) => { e.stopPropagation(); handleMenuClick('file'); }}
                    onMouseEnter={() => handleMenuHover('file')}
                >
                    File
                    {activeMenu === 'file' && (
                        <div className={styles.dropdown}>
                            <div className={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); onOpenWindow('new_folder', 'New Folder', null); setActiveMenu(null); }}>New Folder</div>
                            <div className={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); alert('Open feature not implemented yet.'); setActiveMenu(null); }}>Open</div>
                            <div className={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); alert('Print feature not implemented yet.'); setActiveMenu(null); }}>Print</div>
                            <div className={styles.separator}></div>
                            <div className={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); alert('Close feature not implemented yet.'); setActiveMenu(null); }}>Close</div>
                        </div>
                    )}
                </div>

                <div
                    className={`${styles.menuItem} ${activeMenu === 'edit' ? styles.active : ''}`}
                    onClick={(e) => { e.stopPropagation(); handleMenuClick('edit'); }}
                    onMouseEnter={() => handleMenuHover('edit')}
                >
                    Edit
                    {activeMenu === 'edit' && (
                        <div className={styles.dropdown}>
                            <div className={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); alert('Undo not implemented.'); setActiveMenu(null); }}>Undo</div>
                            <div className={styles.separator}></div>
                            <div className={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); alert('Cut not implemented.'); setActiveMenu(null); }}>Cut</div>
                            <div className={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); alert('Copy not implemented.'); setActiveMenu(null); }}>Copy</div>
                            <div className={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); alert('Paste not implemented.'); setActiveMenu(null); }}>Paste</div>
                            <div className={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); alert('Clear not implemented.'); setActiveMenu(null); }}>Clear</div>
                        </div>
                    )}
                </div>
                <div className={styles.menuItem}>View</div>
                <div className={styles.menuItem}>Special</div>
            </div>
            <div className={styles.right}>
                <div className={styles.clock}>{formatTime(time)}</div>
            </div>
        </div>
    );
};

export default MenuBar;
