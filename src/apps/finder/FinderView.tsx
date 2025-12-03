/**
 * Finder View Component
 */

import React, { useState, useEffect, useCallback } from 'react'
import styles from './Finder.module.scss'

import folderIcon from '../../assets/folder_icon.png'

export interface FinderViewProps {
  initialPath?: string
  onOpenFile?: (path: string) => void
  onNavigate?: (path: string) => void
  readdir: (path: string) => Promise<string[]>
  stat: (path: string) => Promise<{ isDirectory: boolean; size: number; mtime: number }>
}

export interface FileItem {
  id: string
  name: string
  type: 'folder' | 'file'
  path: string
  size?: number
  icon?: string
}

export interface Breadcrumb {
  name: string
  path: string
}

export const FinderView: React.FC<FinderViewProps> = ({
  initialPath = '/',
  onOpenFile,
  onNavigate,
  readdir,
  stat
}) => {
  const [currentPath, setCurrentPath] = useState(initialPath)
  const [items, setItems] = useState<FileItem[]>([])
  const [viewMode, setViewMode] = useState<'icon' | 'list'>('icon')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Build breadcrumb path
  const getBreadcrumbs = useCallback((path: string): Breadcrumb[] => {
    const parts = path.split('/').filter(Boolean)
    const breadcrumbs: Breadcrumb[] = [{ name: 'Macintosh HD', path: '/' }]
    
    let currentPathBuild = ''
    for (const part of parts) {
      currentPathBuild += '/' + part
      breadcrumbs.push({ name: part, path: currentPathBuild })
    }
    
    return breadcrumbs
  }, [])

  // Load directory contents
  const loadDirectory = useCallback(async (path: string) => {
    setIsLoading(true)
    setError(null)
    setSelectedId(null)

    try {
      const entries = await readdir(path)
      const fileItems: FileItem[] = []

      for (const name of entries) {
        const fullPath = path === '/' ? `/${name}` : `${path}/${name}`
        try {
          const info = await stat(fullPath)
          fileItems.push({
            id: fullPath,
            name,
            type: info.isDirectory ? 'folder' : 'file',
            path: fullPath,
            size: info.size,
            icon: info.isDirectory ? folderIcon : undefined
          })
        } catch {
          // Skip items we can't stat
        }
      }

      // Sort: folders first, then alphabetically
      fileItems.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })

      setItems(fileItems)
      setCurrentPath(path)
      onNavigate?.(path)
    } catch (err) {
      setError(`Failed to load directory: ${err}`)
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }, [readdir, stat, onNavigate])

  // Initial load
  useEffect(() => {
    loadDirectory(currentPath)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDoubleClick = (item: FileItem) => {
    if (item.type === 'folder') {
      loadDirectory(item.path)
    } else {
      onOpenFile?.(item.path)
    }
  }

  const handleBreadcrumbClick = (breadcrumb: Breadcrumb) => {
    setSelectedId(null)
    loadDirectory(breadcrumb.path)
  }

  const handleGoUp = () => {
    if (currentPath === '/') return
    const parentPath = currentPath.substring(0, currentPath.lastIndexOf('/')) || '/'
    loadDirectory(parentPath)
  }

  const renderIconVisual = (item: FileItem, size: 'large' | 'small') => {
    const placeholderLabel = `${item.name} icon placeholder`
    
    if (item.icon) {
      const className = size === 'large' ? styles.icon : styles.smallIcon
      const altText = size === 'large' ? item.name : ''
      return <img src={item.icon} alt={altText} className={className} />
    }

    // Default file icon
    const iconChar = item.type === 'folder' ? '📁' : '📄'
    
    if (size === 'small') {
      return (
        <span className={styles.smallIconPlaceholder} role="img" aria-label={placeholderLabel}>
          {iconChar}
        </span>
      )
    }

    return (
      <div className={styles.iconPlaceholder} role="img" aria-label={placeholderLabel}>
        {iconChar}
      </div>
    )
  }

  const breadcrumbs = getBreadcrumbs(currentPath)

  return (
    <div className={styles.finder}>
      {/* Toolbar */}
      <div className={styles.toolbar}>
        <button 
          className={styles.navButton}
          onClick={handleGoUp}
          disabled={currentPath === '/'}
          title="Go to parent folder"
        >
          ⬆
        </button>
        
        <div className={styles.breadcrumb}>
          {breadcrumbs.map((segment, index) => (
            <React.Fragment key={segment.path}>
              <span
                className={styles.breadcrumbItem}
                onClick={() => handleBreadcrumbClick(segment)}
              >
                {segment.name}
              </span>
              {index < breadcrumbs.length - 1 && <span className={styles.separator}>›</span>}
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
        {isLoading && (
          <div className={styles.loading}>Loading...</div>
        )}
        
        {error && (
          <div className={styles.error}>{error}</div>
        )}
        
        {!isLoading && !error && items.length === 0 && (
          <div className={styles.empty}>This folder is empty</div>
        )}
        
        {!isLoading && !error && viewMode === 'icon' && (
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
        )}
        
        {!isLoading && !error && viewMode === 'list' && (
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
                    <td>{item.type === 'folder' ? 'Folder' : 'Document'}</td>
                    <td>{item.type === 'file' ? `${item.size || 0} bytes` : '--'}</td>
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
        {selectedId && ` • "${items.find(i => i.id === selectedId)?.name}" selected`}
      </div>
    </div>
  )
}

export default FinderView
