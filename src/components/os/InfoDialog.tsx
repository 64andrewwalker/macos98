import React from 'react';
import styles from './InfoDialog.module.scss';

interface IconData {
    label: string;
    icon?: string;
    x: number;
    y: number;
    id: string;
    type?: 'folder' | 'file' | 'app' | 'system';
    children?: unknown[];
}

interface InfoDialogProps {
    iconData?: IconData;
    onClose: () => void;
}

const InfoDialog: React.FC<InfoDialogProps> = ({ iconData, onClose }) => {
    const getTypeLabel = (data: IconData) => {
        if (data.type === 'folder' || data.children || data.id.startsWith('folder')) return 'Folder';
        if (data.id === 'hd') return 'Hard Drive';
        if (data.id === 'trash') return 'Trash';
        if (data.type === 'file') return 'File';
        if (data.type === 'app') return 'Application';
        return 'Application';
    };

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
                <div className={styles.titleBar}>
                    <span>Get Info</span>
                </div>
                <div className={styles.content}>
                    {iconData ? (
                        <>
                            <div className={styles.iconPreview}>
                                {iconData.icon ? (
                                    <img src={iconData.icon} alt={iconData.label} />
                                ) : (
                                    <div className={styles.placeholder} role="img" aria-label={`${iconData.label} icon placeholder`}>?</div>
                                )}
                            </div>
                            <div className={styles.infoRow}>
                                <label>Name:</label>
                                <span>{iconData.label}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <label>Type:</label>
                                <span>{getTypeLabel(iconData)}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <label>Position:</label>
                                <span>({Math.round(iconData.x)}, {Math.round(iconData.y)})</span>
                            </div>
                            <div className={styles.infoRow}>
                                <label>ID:</label>
                                <span>{iconData.id}</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={styles.infoRow}>
                                <label>Desktop</label>
                            </div>
                            <div className={styles.infoRow}>
                                <span>This is the main desktop area.</span>
                            </div>
                        </>
                    )}
                </div>
                <div className={styles.buttonBar}>
                    <button className={styles.button} onClick={onClose}>OK</button>
                </div>
            </div>
        </div>
    );
};

export default InfoDialog;
