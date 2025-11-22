import React, { useState } from 'react';
import styles from './BackgroundSwitcher.module.scss';
import { backgroundAssets } from '../../assets/background/backgroundAssets';
import { useDesktop } from '../../contexts/DesktopContext';

const BackgroundSwitcher: React.FC = () => {
    const { backgroundImage, setBackgroundImage } = useDesktop();
    const [selectedId, setSelectedId] = useState<string>('');

    const handleSelectBackground = (image: string, id: string) => {
        setBackgroundImage(image);
        setSelectedId(id);
    };

    const { backgroundMode, setBackgroundMode } = useDesktop();

    return (
        <div className={styles.backgroundSwitcher}>
            <div className={styles.header}>
                <h3>Choose a Desktop Background</h3>
            </div>
            <div className={styles.controls}>
                <div className={styles.modeGroup}>
                    <label>Mode:</label>
                    <div className={styles.buttonGroup}>
                        {(['fill', 'fit', 'tile'] as const).map((mode) => (
                            <button
                                key={mode}
                                className={`${styles.modeButton} ${backgroundMode === mode ? styles.active : ''}`}
                                onClick={() => setBackgroundMode(mode)}
                            >
                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className={styles.grid}>
                {backgroundAssets.map((bg) => (
                    <div
                        key={bg.id}
                        className={`${styles.preview} ${selectedId === bg.id || backgroundImage === bg.image
                            ? styles.selected
                            : ''
                            }`}
                        onClick={() => handleSelectBackground(bg.image, bg.id)}
                    >
                        <div className={styles.imageContainer}>
                            <img src={bg.image} alt={`${bg.name} background`} />
                        </div>
                        <div className={styles.name}>{bg.name}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BackgroundSwitcher;
