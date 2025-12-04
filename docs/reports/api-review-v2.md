# Internal API Design Review v2

> **Date**: December 2024  
> **Scope**: Internal TypeScript service interfaces  
> **Status**: ✅ Comprehensive review complete

## Executive Summary

This review audits the internal API design of the macOS 98 project for consistency, type safety, and best practices. As a frontend-only application, there is no REST API; instead, we review the internal service interfaces that form the architecture's backbone.

**Overall Score: 92/100** - Excellent API design with minor improvements possible.

## Review Methodology

### Criteria

| Criterion | Weight | Score | Notes |
|-----------|--------|-------|-------|
| Naming Consistency | 20% | 95 | Excellent verb-noun patterns |
| Type Safety | 25% | 90 | Strong typing, minor gaps |
| Error Handling | 15% | 88 | Good VfsError pattern, inconsistent elsewhere |
| Documentation | 15% | 95 | Comprehensive JSDoc comments |
| Interface Cohesion | 15% | 92 | Well-defined boundaries |
| Return Type Consistency | 10% | 90 | Mostly async-first design |

## Layer-by-Layer Analysis

### 1. Kernel Layer APIs

#### VirtualFileSystem (`src/kernel/vfs/types.ts`)

**Strengths:**
- ✅ POSIX-inspired error codes (`ENOENT`, `EEXIST`, etc.)
- ✅ Consistent async pattern (`Promise<T>`)
- ✅ Clear separation of file vs directory operations
- ✅ Custom error class with structured error codes
- ✅ Comprehensive JSDoc documentation

**API Surface:**

```typescript
interface VirtualFileSystem {
  // Directory: mkdir, readdir, rmdir
  // File: readFile, readTextFile, writeFile, deleteFile
  // Common: stat, exists, rename, copy
  // Events: watch
}
```

**Issues Found:** None critical.

**Recommendation:** Consider adding `appendFile()` for log-style writes.

---

#### EventBus (`src/kernel/event-bus/types.ts`)

**Strengths:**
- ✅ Generic type support `<T>` for type-safe events
- ✅ Clean `Unsubscribe` pattern
- ✅ Channel isolation for app-specific events
- ✅ `subscribeOnce` for one-time handlers

**API Surface:**

```typescript
interface EventBus {
  publish<T>(event: string, payload?: T): void
  subscribe<T>(event: string, callback: EventCallback<T>): Unsubscribe
  subscribeOnce<T>(event: string, callback: EventCallback<T>): Unsubscribe
  createChannel(namespace: string): EventChannel
}
```

**Issues Found:**
- ⚠️ `SystemEvents` type defined but not enforced at compile time

**Recommendation:** Consider type-safe event names:

```typescript
// Future enhancement
publish<K extends keyof SystemEvents>(event: K, payload: SystemEvents[K]): void
```

---

#### TaskManager (`src/kernel/task-manager/types.ts`)

**Strengths:**
- ✅ Clear lifecycle states: `ready → running → suspended → terminated`
- ✅ Consistent naming: `spawn`, `suspend`, `resume`, `kill`
- ✅ Query methods follow `getX` / `getAllX` pattern
- ✅ Event subscription with `Unsubscribe` return

**API Surface:**

```typescript
interface TaskManager {
  // Lifecycle: spawn, suspend, resume, kill
  // Queries: getTask, getTasksByApp, getAllTasks, getRunningTasks
  // Events: onTaskStateChange
}
```

**Issues Found:** None.

---

#### PermissionManager (`src/kernel/permissions/types.ts`)

**Strengths:**
- ✅ Clean separation from full `AppManifest` (uses `PermissionAppManifest`)
- ✅ Path-based permissions with mode (`read`/`write`/`readwrite`)
- ✅ Predefined `SystemService` type for common services

**API Surface:**

```typescript
interface PermissionManager {
  canAccessPath(appId: string, path: string, mode: 'read' | 'write'): boolean
  canUseService(appId: string, service: string): boolean
  registerApp(appId: string, manifest: PermissionAppManifest): void
  unregisterApp(appId: string): void
  getAppPermissions(appId: string): AppPermissions | undefined
}
```

**Issues Found:** None.

---

### 2. UI Shell Layer APIs

#### WindowManager (`src/ui-shell/window-manager/types.ts`)

**Strengths:**
- ✅ Comprehensive window states: `normal`, `minimized`, `maximized`, `collapsed`
- ✅ Full window lifecycle: open, close, focus, minimize, maximize, restore
- ✅ Position/size operations: `moveWindow`, `resizeWindow`, `setBounds`
- ✅ Event system with `WindowEvent` type

**API Surface:**

```typescript
interface WindowManager {
  // Lifecycle: openWindow, closeWindow, closeAllWindows
  // Operations: focusWindow, minimizeWindow, maximizeWindow, collapseWindow, restoreWindow
  // Position: moveWindow, resizeWindow, setBounds, setTitle
  // Queries: getWindow, getWindowsByApp, getAllWindows, getFocusedWindow
  // Events: onWindowChange
}
```

**Issues Found:**
- ⚠️ Some methods lack return value confirmation (e.g., `closeWindow` doesn't return success/failure)

**Recommendation:** Consider returning boolean for operations that may fail silently.

---

#### DesktopService (`src/ui-shell/desktop/types.ts`)

**Strengths:**
- ✅ Strongly typed `IconTarget` with union type
- ✅ Clear event types for desktop changes
- ✅ Multi-select support in `selectIcon(iconId, multi?)`
- ✅ Trigger methods for external callers

**API Surface:**

```typescript
interface DesktopService {
  // Wallpaper: setWallpaper, getWallpaper, getWallpaperMode
  // Icons: addIcon, removeIcon, moveIcon, getIcon, getAllIcons, arrangeIcons
  // Selection: selectIcon, clearSelection, getSelectedIcons, getSelectedIconIds
  // Events: onChange, onIconDoubleClick, onContextMenu
  // Triggers: triggerIconDoubleClick, triggerContextMenu
}
```

**Issues Found:** None.

---

### 3. App Framework Layer APIs

#### AppManifest (`src/app-framework/manifest/types.ts`)

**Strengths:**
- ✅ Well-structured application metadata
- ✅ File associations with MIME types and extensions
- ✅ Menu configuration support
- ✅ Validation result type for manifest checking

**API Surface:**

```typescript
interface AppManifest {
  id: string
  name: string
  version: string
  icon: string
  permissions?: AppPermissionDeclaration
  menus?: AppMenu[]
  fileAssociations?: FileAssociation[]
  window?: WindowConfig
}
```

**Issues Found:** None.

---

#### AppContext (`src/app-framework/context/types.ts`)

**Strengths:**
- ✅ Resource auto-cleanup via `dispose()`
- ✅ Managed timers that auto-cancel on dispose
- ✅ Scoped file system with permission checking
- ✅ Clean `onTerminate` callback pattern

**API Surface:**

```typescript
interface AppContext {
  // Identity: appId, taskId, manifest (readonly)
  // Timers: setTimeout, setInterval, clearTimeout, clearInterval
  // Events: addEventListener, removeEventListener
  // FS: fs (ScopedFileSystem)
  // Services: getService<T>
  // Windows: openWindow, closeWindow, getWindows
  // Lifecycle: onTerminate, dispose
}
```

**Issues Found:**
- ⚠️ `ScopedFileSystem.stat()` returns different shape than `VfsStat`

**Recommendation:** Align return types or document the difference:

```typescript
// Current ScopedFileSystem.stat()
{ isDirectory: boolean; size: number; mtime: number }

// VfsStat
{ type: 'file' | 'directory'; name: string; path: string; size: number; mimeType?: string; createdAt: Date; updatedAt: Date }
```

Consider creating a simplified `FileStat` type for consistency.

---

#### AppRuntime (`src/app-framework/runtime/types.ts`)

**Strengths:**
- ✅ Clean factory pattern: `AppFactory = (ctx: AppContext) => AppInstance`
- ✅ Optional lifecycle hooks in `AppInstance`
- ✅ File association support via `getAppForFile` and `openFile`
- ✅ Foreground management with `activateApp`

**API Surface:**

```typescript
interface AppRuntime {
  // Registration: registerApp, unregisterApp
  // Lifecycle: launchApp, terminateApp, terminateAllApps
  // Queries: getInstalledApps, getRunningApps, isAppRunning, getRunningInstance
  // Files: getAppForFile, openFile
  // Foreground: activateApp, getActiveApp
}
```

**Issues Found:** None.

---

### 4. Platform Layer APIs

#### StorageAdapter (`src/platform/storage/storage.ts`)

**Strengths:**
- ✅ In-memory fallback for testing
- ✅ Transaction support for atomic operations
- ✅ Generic type support for stored values

**API Surface:**

```typescript
interface Database {
  get<T>(store: string, key: IDBValidKey): Promise<T | undefined>
  put<T>(store: string, key: IDBValidKey, value: T): Promise<void>
  delete(store: string, key: IDBValidKey): Promise<void>
  clear(store: string): Promise<void>
  getAll<T>(store: string): Promise<T[]>
  getAllKeys(store: string): Promise<IDBValidKey[]>
  transaction<T>(stores: string[], mode: 'readonly' | 'readwrite', fn: (tx: Transaction) => Promise<T>): Promise<T>
}
```

**Issues Found:** None.

---

## Naming Conventions Audit

### Verified Patterns

| Pattern | Usage | Compliance |
|---------|-------|------------|
| `getX()` | Query single item | ✅ Consistent |
| `getAllX()` | Query collection | ✅ Consistent |
| `getXByY()` | Filtered query | ✅ Consistent |
| `onX()` | Event subscription | ✅ Consistent |
| `createX()` | Factory function | ✅ Consistent |
| `Unsubscribe` | Cleanup return | ✅ Consistent |

### Verb Usage

| Verb | Context | Compliance |
|------|---------|------------|
| `open/close` | Windows | ✅ |
| `add/remove` | Icons | ✅ |
| `spawn/kill` | Tasks | ✅ |
| `register/unregister` | Apps | ✅ |
| `publish/subscribe` | Events | ✅ |
| `launch/terminate` | Apps (high-level) | ✅ |

---

## Error Handling Patterns

### Current Implementation

| Layer | Error Pattern | Quality |
|-------|---------------|---------|
| VFS | `VfsError` with POSIX codes | ⭐⭐⭐⭐⭐ |
| EventBus | Silent (no errors) | ⭐⭐⭐ |
| TaskManager | Silent failures | ⭐⭐⭐ |
| WindowManager | Silent failures | ⭐⭐⭐ |
| AppRuntime | Throws on launch failure | ⭐⭐⭐⭐ |

### Recommendations

1. **Consider structured errors for all layers:**

```typescript
class SystemError extends Error {
  constructor(
    public code: string,
    message: string,
    public context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'SystemError'
  }
}
```

2. **Add Result type for operations that may fail:**

```typescript
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E }
```

---

## Type Safety Assessment

### Strong Points

- ✅ All interfaces use TypeScript interfaces (not `any`)
- ✅ Generic types where appropriate (`EventCallback<T>`, `getService<T>`)
- ✅ Union types for finite options (`TaskState`, `WindowState`, `VfsErrorCode`)
- ✅ `readonly` for identity properties (`appId`, `taskId`, `manifest`)

### Improvement Opportunities

1. **Stricter path types:**

```typescript
// Consider branded types for paths
type VfsPath = string & { readonly _brand: unique symbol }
```

2. **Type-safe event names:**

```typescript
interface TypedEventBus {
  publish<K extends keyof SystemEvents>(event: K, payload: SystemEvents[K]): void
}
```

---

## Documentation Quality

### JSDoc Coverage

| Module | Coverage | Quality |
|--------|----------|---------|
| VFS Types | 100% | ⭐⭐⭐⭐⭐ |
| EventBus Types | 100% | ⭐⭐⭐⭐⭐ |
| TaskManager Types | 100% | ⭐⭐⭐⭐⭐ |
| WindowManager Types | 100% | ⭐⭐⭐⭐⭐ |
| DesktopService Types | 100% | ⭐⭐⭐⭐⭐ |
| AppManifest Types | 100% | ⭐⭐⭐⭐⭐ |
| AppContext Types | 100% | ⭐⭐⭐⭐⭐ |
| AppRuntime Types | 100% | ⭐⭐⭐⭐⭐ |

**Excellent documentation coverage with clear descriptions.**

---

## Action Items

### Completed (from previous review)

- [x] Rename `AppManifest` in permissions to `PermissionAppManifest`
- [x] Add optional chaining for `manifest.permissions.fs` and `manifest.permissions.services`

### Recommended (Non-Blocking)

| Priority | Item | Effort |
|----------|------|--------|
| Low | Add `appendFile()` to VFS | S |
| Low | Align `ScopedFileSystem.stat()` with `VfsStat` | M |
| Low | Add type-safe event names to EventBus | M |
| Low | Add Result type for fallible operations | M |
| Low | Consider branded types for paths | L |

### Future Considerations

- Rate limiting for event publishing (prevent event storms)
- Timeout configuration for async operations
- Cancellation tokens for long-running operations

---

## Conclusion

The internal API design demonstrates excellent consistency and follows TypeScript best practices. The layered architecture maintains clear boundaries between components, and the use of interfaces enables easy testing and mocking.

**Key Strengths:**
- Consistent naming conventions across all layers
- Comprehensive type definitions with proper generics
- Excellent documentation coverage
- Clean separation of concerns
- Resource lifecycle management (Unsubscribe pattern)

**Areas for Future Enhancement:**
- Unified error handling across layers
- Type-safe event system
- Branded types for domain-specific strings

**Recommendation:** No immediate action required. The API is well-designed and production-ready.

