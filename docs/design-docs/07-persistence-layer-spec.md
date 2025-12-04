# Persistence Layer Specification

> **Version**: 1.0.0  
> **Status**: Implemented  
> **Last Updated**: December 2024

## Overview

This document describes the persistence architecture for macOS 98, which handles saving and restoring user data across page reloads.

## Current Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Persistence Layer                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────┐    ┌─────────────────────┐                 │
│  │   VFS (IndexedDB)   │    │ Settings (localStorage)│              │
│  │                     │    │                     │                 │
│  │  • File content     │    │  • Wallpaper        │                 │
│  │  • Folder structure │    │  • Icon positions   │                 │
│  │  • Rich text HTML   │    │  • User preferences │                 │
│  └─────────────────────┘    └─────────────────────┘                 │
│           ▲                          ▲                              │
│           │                          │                              │
├───────────┼──────────────────────────┼──────────────────────────────┤
│           │                          │                              │
│  ┌────────┴────────┐      ┌─────────┴──────────┐                   │
│  │  StorageAdapter │      │ desktop-persistence │                   │
│  │  (Platform)     │      │ (UI Shell)          │                   │
│  └─────────────────┘      └────────────────────┘                   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Storage Keys

| Key | Storage | Contents |
|-----|---------|----------|
| `macos98-vfs-*` | IndexedDB | Virtual file system nodes |
| `macos98-wallpaper` | localStorage | Wallpaper image + mode |
| `macos98-desktop-settings` | localStorage | Icon positions |

## APIs

### 1. VFS Persistence (IndexedDB)

```typescript
// src/kernel/vfs/vfs.ts
interface VirtualFileSystem {
  // File operations (auto-persisted)
  writeFile(path: string, content: Uint8Array): Promise<void>
  readFile(path: string): Promise<Uint8Array>
  deleteFile(path: string): Promise<void>
  
  // Directory operations (auto-persisted)
  mkdir(path: string): Promise<void>
  rmdir(path: string): Promise<void>
  readdir(path: string): Promise<string[]>
}
```

**Storage**: Uses `StorageAdapter` from Platform layer (`src/platform/storage/storage.ts`)

**Persistence Mode**:
- Production: IndexedDB (persistent)
- Testing: In-memory (via `enableVfsInMemoryMode()`)

### 2. Desktop Settings Persistence (localStorage)

```typescript
// src/ui-shell/desktop/desktop-persistence.ts
interface DesktopSettings {
  wallpaper: string
  wallpaperMode: 'tile' | 'center' | 'fill' | 'fit'
  iconPositions: Record<string, { x: number; y: number }>
}

// API
function saveDesktopSettings(settings: DesktopSettings): void
function loadDesktopSettings(): DesktopSettings | null
function clearDesktopSettings(): void
```

### 3. Wallpaper Settings (localStorage)

```typescript
// src/contexts/DesktopContext.tsx
interface WallpaperSettings {
  image: string      // Asset path
  mode: 'fill' | 'fit' | 'tile'
}

// Storage Key: 'macos98-wallpaper'
```

## Auto-Save Behavior

### DesktopService

| Event | Trigger | Saved Data |
|-------|---------|------------|
| Icon moved | `moveIcon()` | All icon positions |
| Wallpaper changed | `setWallpaper()` | Wallpaper URL + mode |

**Enable**: `createDesktopService({ autoSave: true })`

### DesktopContext (Legacy)

| Event | Trigger | Saved Data |
|-------|---------|------------|
| Background changed | `setBackgroundImage()` | Image + mode |
| Mode changed | `setBackgroundMode()` | Image + mode |

## Restore Behavior

### On Page Load

```
1. ShellProvider initializes
   └── createDesktopService({ autoSave: true })
       ├── Add initial icons with stable IDs
       └── Call restoreState()
           ├── Load icon positions from localStorage
           └── Apply saved positions to icons

2. DesktopProvider initializes
   └── loadWallpaperSettings()
       ├── Load from localStorage
       └── Use defaults if not found
```

### Stable Icon IDs

Icons use predictable IDs for position persistence:

```typescript
// Format: desktop-icon-{legacyId}
'desktop-icon-hd'     // Macintosh HD
'desktop-icon-docs'   // Documents
'desktop-icon-calc'   // Calculator
'desktop-icon-game'   // TicTacToe
'desktop-icon-trash'  // Trash
```

## Data Flow

```
User Action                Storage                    Restore
──────────────────────────────────────────────────────────────────
Drag icon        ──►  localStorage.setItem()  ──►  restoreState()
                      'macos98-desktop-settings'
                      
Change wallpaper ──►  localStorage.setItem()  ──►  loadWallpaperSettings()
                      'macos98-wallpaper'
                      
Save file        ──►  IndexedDB.put()         ──►  vfs.readFile()
                      'macos98-vfs-nodes'
```

## Testing

### Unit Tests

```bash
pnpm test src/ui-shell/desktop/desktop-persistence.test.ts
pnpm test src/ui-shell/desktop/desktop-service-persistence.test.ts
```

### Integration

```bash
pnpm test:e2e e2e/text-editor.spec.ts  # Tests file persistence
```

### Manual Testing

1. Change wallpaper → Refresh → Verify wallpaper restored
2. Drag icon → Refresh → Verify position restored
3. Edit file → Save → Refresh → Verify content restored

## Future Enhancements

### Phase 2: Unified Persistence Service

```typescript
// Proposed: src/platform/persistence/persistence.ts
interface PersistenceService {
  // Generic key-value storage
  set<T>(key: string, value: T): Promise<void>
  get<T>(key: string): Promise<T | null>
  delete(key: string): Promise<void>
  
  // Namespace support
  createNamespace(prefix: string): PersistenceService
  
  // Sync across tabs
  onSync(callback: (key: string, value: unknown) => void): Unsubscribe
}
```

### Phase 3: Cloud Sync (Optional)

```typescript
interface CloudSyncAdapter {
  push(data: SerializedState): Promise<void>
  pull(): Promise<SerializedState>
  sync(): Promise<SyncResult>
}
```

## Related Documents

- [`03-platform-layer-spec.md`](./03-platform-layer-spec.md) - StorageAdapter
- [`05-ui-shell-layer-spec.md`](./05-ui-shell-layer-spec.md) - DesktopService
- [`../tdd-session-persistence.md`](../tdd-session-persistence.md) - TDD session log

