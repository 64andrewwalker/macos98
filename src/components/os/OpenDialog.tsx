import React, { useState, useEffect, useContext } from 'react'
import styles from './OpenDialog.module.scss'
import { SystemContext } from '../../system/context'
import folderIcon from '../../assets/folder_icon.png'

interface OpenDialogProps {
  onClose: () => void
  onOpen: (path: string) => void
}

interface FileEntry {
  name: string
  type: 'file' | 'directory'
  path: string
}

const OpenDialog: React.FC<OpenDialogProps> = ({ onClose, onOpen }) => {
  const systemContext = useContext(SystemContext)
  const vfs = systemContext?.vfs

  const [currentPath, setCurrentPath] = useState('/Users/default/Documents')
  const [entries, setEntries] = useState<FileEntry[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const loadDirectory = async () => {
      if (!vfs) {
        if (!cancelled) {
          setEntries([])
          setLoading(false)
        }
        return
      }

      if (!cancelled) setLoading(true)
      
      try {
        const names = await vfs.readdir(currentPath)
        if (cancelled) return
        
        const fileEntries: FileEntry[] = []

        for (const name of names) {
          const fullPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`
          try {
            const stat = await vfs.stat(fullPath)
            fileEntries.push({
              name,
              type: stat.type,
              path: fullPath
            })
          } catch {
            // Skip entries we can't stat
          }
        }

        // Sort: directories first, then files, alphabetically
        fileEntries.sort((a, b) => {
          if (a.type !== b.type) {
            return a.type === 'directory' ? -1 : 1
          }
          return a.name.localeCompare(b.name)
        })

        if (!cancelled) {
          setEntries(fileEntries)
          setSelectedFile(null)
        }
      } catch {
        if (!cancelled) setEntries([])
      }
      
      if (!cancelled) setLoading(false)
    }

    loadDirectory()

    return () => {
      cancelled = true
    }
  }, [currentPath, vfs])

  const handleDoubleClick = (entry: FileEntry) => {
    if (entry.type === 'directory') {
      setCurrentPath(entry.path)
    } else {
      onOpen(entry.path)
    }
  }

  const handleOpen = () => {
    if (selectedFile) {
      const entry = entries.find(e => e.path === selectedFile)
      if (entry?.type === 'file') {
        onOpen(selectedFile)
      } else if (entry?.type === 'directory') {
        setCurrentPath(selectedFile)
      }
    }
  }

  const goUp = () => {
    if (currentPath === '/') return
    const parts = currentPath.split('/')
    parts.pop()
    setCurrentPath(parts.length === 1 ? '/' : parts.join('/'))
  }

  const getFileIcon = (entry: FileEntry) => {
    if (entry.type === 'directory') {
      return folderIcon
    }
    // Use a generic document icon for files
    return 'data:image/svg+xml,' + encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
        <rect x="4" y="2" width="24" height="28" fill="white" stroke="black" stroke-width="1"/>
        <line x1="8" y1="10" x2="24" y2="10" stroke="#666" stroke-width="1"/>
        <line x1="8" y1="14" x2="24" y2="14" stroke="#666" stroke-width="1"/>
        <line x1="8" y1="18" x2="20" y2="18" stroke="#666" stroke-width="1"/>
      </svg>
    `)
  }

  const currentDirName = currentPath === '/' ? 'Root' : currentPath.split('/').pop() || 'Root'

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.header}>
          <span className={styles.title}>Open</span>
        </div>

        <div className={styles.toolbar}>
          <select
            className={styles.pathSelect}
            value={currentPath}
            onChange={(e) => setCurrentPath(e.target.value)}
          >
            <option value="/">/</option>
            <option value="/Users">/Users</option>
            <option value="/Users/default">/Users/default</option>
            <option value="/Users/default/Documents">/Users/default/Documents</option>
          </select>
          <button className={styles.upButton} onClick={goUp} disabled={currentPath === '/'}>
            ▲
          </button>
        </div>

        <div className={styles.locationBar}>
          <img src={folderIcon} alt="" className={styles.locationIcon} />
          <span>{currentDirName}</span>
        </div>

        <div className={styles.fileList}>
          {loading ? (
            <div className={styles.loading}>Loading...</div>
          ) : entries.length === 0 ? (
            <div className={styles.empty}>No files</div>
          ) : (
            entries.map(entry => (
              <div
                key={entry.path}
                className={`${styles.fileItem} ${selectedFile === entry.path ? styles.selected : ''}`}
                onClick={() => setSelectedFile(entry.path)}
                onDoubleClick={() => handleDoubleClick(entry)}
              >
                <img src={getFileIcon(entry)} alt="" className={styles.fileIcon} />
                <span className={styles.fileName}>{entry.name}</span>
              </div>
            ))
          )}
        </div>

        <div className={styles.buttons}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.openButton}
            onClick={handleOpen}
            disabled={!selectedFile}
          >
            Open
          </button>
        </div>
      </div>
    </div>
  )
}

export default OpenDialog
