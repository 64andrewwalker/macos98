import React, { useState } from 'react';
import styles from './Finder.module.scss';

export interface FileItem {
    id: string;
    name: string;
    type: 'folder' | 'file' | 'app';
    icon: string;
    children?: FileItem[];
    content?: string;
}

interface FinderProps {
    items: FileItem[];
    path: string[];
    onNavigate: (folderId: string) => void;
    onOpenFile: (fileId: string, fileName: string, content: string) => void;
}

const Finder: React.FC<FinderProps> = ({
    items,
    path,
    onNavigate,
    onOpenFile
}) => {
    const [viewMode, setViewMode] = useState<'icon' | 'list'>('icon');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const handleDoubleClick = (item: FileItem) => {
        if (item.type === 'folder') {
            onNavigate(item.id);
            return;
        }
        if (item.type === 'file') {
            onOpenFile(item.id, item.name, item.content ?? '');
        }
    };

    const handleBreadcrumbClick = (index: number) => {
        // Navigate back to a parent folder
        // This will be implemented when we have parent tracking
        console.log('Navigate to breadcrumb index:', index);
    };

    const renderIconVisual = (item: FileItem, size: 'large' | 'small') => {
        const placeholderLabel = `${item.name} icon placeholder`;
        if (item.icon) {
            const className = size === 'large' ? styles.icon : styles.smallIcon;
            const altText = size === 'large' ? item.name : '';
            return <img src={item.icon} alt={altText} className={className} />;
        }

        if (size === 'small') {
            return (
                <span className={styles.smallIconPlaceholder} role="img" aria-label={placeholderLabel}>
                    ?
                </span>
            );
        }

        return (
            <div className={styles.iconPlaceholder} role="img" aria-label={placeholderLabel}>
                ?
            </div>
        );
    };

    return (
        <div className={styles.finder}>
            {/* Toolbar */}
            <div className={styles.toolbar}>
                <div className={styles.breadcrumb}>
                    {path.map((segment, index) => (
                        <React.Fragment key={index}>
                            <span
                                className={styles.breadcrumbItem}
                                onClick={() => handleBreadcrumbClick(index)}
                            >
                                {segment}
                            </span>
                            {index < path.length - 1 && <span className={styles.separator}>›</span>}
                        </React.Fragment>
                    ))}
                </div>
                <div className={styles.viewToggle}>
                    <button
                        className={`${styles.viewButton} ${viewMode === 'icon' ? styles.active : ''}`}
                        onClick={() => setViewMode('icon')}
                        title="Icon View"
                    >
                        ⊞
                    </button>
                    <button
                        className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
                        onClick={() => setViewMode('list')}
                        title="List View"
                    >
                        ☰
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className={styles.content}>
                {viewMode === 'icon' ? (
                    <div className={styles.iconView}>
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className={`${styles.iconItem} ${selectedId === item.id ? styles.selected : ''}`}
                                onClick={() => setSelectedId(item.id)}
                                onDoubleClick={() => handleDoubleClick(item)}
                            >
                                {renderIconVisual(item, 'large')}
                                <span className={styles.label}>{item.name}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.listView}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Type</th>
                                    <th>Size</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item) => (
                                    <tr
                                        key={item.id}
                                        className={selectedId === item.id ? styles.selected : ''}
                                        onClick={() => setSelectedId(item.id)}
                                        onDoubleClick={() => handleDoubleClick(item)}
                                    >
                                        <td>
                                            {renderIconVisual(item, 'small')}
                                            {item.name}
                                        </td>
                                        <td>{item.type === 'folder' ? 'Folder' : 'File'}</td>
                                        <td>{item.type === 'file' ? `${item.content?.length || 0} bytes` : '--'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Status Bar */}
            <div className={styles.statusBar}>
                {items.length} item{items.length !== 1 ? 's' : ''}
            </div>
        </div>
    );
};

export default Finder;
