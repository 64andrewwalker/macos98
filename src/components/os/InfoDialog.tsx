import React from 'react';
import styles from './InfoDialog.module.scss';

interface InfoDialogProps {
    iconData?: {
        label: string;
        icon: string;
        x: number;
        y: number;
        id: string;
    };
    onClose: () => void;
}

const InfoDialog: React.FC<InfoDialogProps> = ({ iconData, onClose }) => {
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
                                <img src={iconData.icon} alt={iconData.label} />
                            </div>
                            <div className={styles.infoRow}>
                                <label>Name:</label>
                                <span>{iconData.label}</span>
                            </div>
                            <div className={styles.infoRow}>
                                <label>Type:</label>
                                <span>
                                    {iconData.id.startsWith('folder') ? 'Folder' :
                                        iconData.id === 'hd' ? 'Hard Drive' :
                                            iconData.id === 'trash' ? 'Trash' : 'Application'}
                                </span>
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
