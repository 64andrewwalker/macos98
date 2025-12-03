# Internal API Design Review

> **Review Date**: December 3, 2025  
> **Scope**: TypeScript service interfaces (Platform, Kernel, UI Shell, App Framework)  
> **Status**: Complete

---

## Executive Summary

The macOS 98 project has a well-structured internal API with clear separation of concerns across 5 layers. This review identifies consistency issues, design improvements, and best practices compliance.

**Overall Grade: B+** (Good, with minor issues)

---

## 1. API Inventory

| Layer | Service | Interface |
|-------|---------|-----------|
| **Platform** | Storage | `Database`, `StorageAdapter` |
| | Timer | `TimerManager` |
| | System | `SystemInfo` |
| **Kernel** | EventBus | `EventBus`, `EventChannel` |
| | TaskManager | `TaskManager`, `Task` |
| | VFS | `VirtualFileSystem`, `VfsStat` |
| | Permissions | `PermissionManager` |
| **UI Shell** | WindowManager | `WindowManager`, `Window` |
| | DesktopService | `DesktopService`, `DesktopIcon` |
| | SystemOverlay | `SystemOverlayService` |
| **App Framework** | Manifest | `AppManifest` |
| | Context | `AppContext` |
| | Runtime | `AppRuntime`, `AppInstance` |

---

## 2. Consistency Analysis

### ✅ Strengths

| Pattern | Compliance |
|---------|------------|
| Unsubscribe pattern | 100% - All subscriptions return `Unsubscribe` function |
| JSDoc comments | 95% - Most methods have documentation |
| Interface naming | 90% - Clear, descriptive names |
| Async/await usage | 100% - Consistent Promise-based APIs |

### 🔴 Issues Found

#### Issue 1: Duplicate `AppManifest` Definition

**Location**: 
- `src/kernel/permissions/types.ts:23-39`
- `src/app-framework/manifest/types.ts:13-37`

**Problem**: Two different interfaces with the same name, causing confusion.

```typescript
// kernel/permissions/types.ts
interface AppManifest {
  id: string
  name: string
  version: string
  icon?: string        // Optional
  entry?: string       // Extra field
  permissions: {...}   // Required
}

// app-framework/manifest/types.ts
interface AppManifest {
  id: string
  name: string
  version: string
  icon: string         // Required
  permissions?: {...}  // Optional
  menus?: AppMenu[]    // Extra fields
  fileAssociations?: FileAssociation[]
  window?: WindowConfig
}
```

**Recommendation**: Use a single canonical `AppManifest` in `app-framework/manifest/types.ts` and import it in permissions.

**Priority**: 🔴 High

---

#### Issue 2: Timestamp Type Inconsistency

**Location**: `src/kernel/vfs/types.ts`

**Problem**: `VfsNode` uses `number` timestamps, `VfsStat` uses `Date` objects.

```typescript
interface VfsNode {
  createdAt: number  // Unix timestamp
  updatedAt: number
}

interface VfsStat {
  createdAt: Date    // Date object
  updatedAt: Date
}
```

**Recommendation**: Standardize on `Date` for external APIs, `number` for internal storage.

**Priority**: 🟡 Medium

---

#### Issue 3: Inconsistent Sync/Async Patterns

**Problem**: Some services are sync, others async, without clear reasoning.

| Service | Pattern | Notes |
|---------|---------|-------|
| VFS | Async | ✅ Correct (I/O operations) |
| WindowManager | Sync | ⚠️ Returns Window, but could fail |
| EventBus | Sync | ✅ Correct (in-memory) |
| AppRuntime | Mixed | `launchApp` async, `registerApp` sync |

**Recommendation**: Document sync/async rationale in each interface.

**Priority**: 🟡 Medium

---

#### Issue 4: Missing Error Types

**Problem**: Only VFS defines custom error types. Other services use generic errors.

```typescript
// VFS has this ✓
class VfsError extends Error {
  code: VfsErrorCode
  path?: string
}

// Other services lack error types
interface WindowManager {
  openWindow(options): Window  // What if it fails?
}
```

**Recommendation**: Add error types for:
- `WindowManagerError` (e.g., max windows reached)
- `PermissionError` (access denied)
- `AppRuntimeError` (launch failed)

**Priority**: 🟡 Medium

---

## 3. Design Patterns Review

### Creational Patterns

| Pattern | Usage | Status |
|---------|-------|--------|
| Factory | `createEventBus()`, `createVfs()` | ✅ Consistent |
| Singleton | System bootstrap | ✅ Properly implemented |
| Builder | Not used | N/A |

### Structural Patterns

| Pattern | Usage | Status |
|---------|-------|--------|
| Facade | `SystemServices` | ✅ Clean aggregation |
| Adapter | `ScopedFileSystem` | ✅ Good VFS sandboxing |
| Decorator | Not used | N/A |

### Behavioral Patterns

| Pattern | Usage | Status |
|---------|-------|--------|
| Observer | `EventBus.subscribe()` | ✅ Well implemented |
| Command | Menu actions | ✅ Via `onMenuAction` |
| Strategy | Not used | N/A |

---

## 4. Interface Contract Analysis

### VirtualFileSystem

```typescript
interface VirtualFileSystem {
  // ✅ POSIX-like naming (mkdir, rmdir, readdir)
  // ✅ Consistent path-based operations
  // ✅ Error codes follow POSIX conventions
  // ⚠️ No recursive delete (rm -rf)
  // ⚠️ No glob patterns support
}
```

**Suggested Additions**:
```typescript
// Recursive operations
rmdirRecursive(path: string): Promise<void>

// Pattern matching
glob(pattern: string): Promise<string[]>
```

---

### WindowManager

```typescript
interface WindowManager {
  // ✅ Clear lifecycle methods
  // ✅ Event subscription pattern
  // ⚠️ No z-order control beyond focus
  // ⚠️ No window constraints (keep on screen)
}
```

**Suggested Additions**:
```typescript
// Z-order control
bringToFront(windowId: string): void
sendToBack(windowId: string): void

// Constraints
setConstraints(windowId: string, constraints: WindowConstraints): void
```

---

### AppRuntime

```typescript
interface AppRuntime {
  // ✅ Clear separation of registration and lifecycle
  // ✅ File association handling
  // ⚠️ No app state persistence
  // ⚠️ No app restart mechanism
}
```

**Suggested Additions**:
```typescript
// Lifecycle extensions
restartApp(taskId: string): Promise<Task>

// State management
saveAppState(taskId: string): Promise<void>
restoreAppState(taskId: string): Promise<void>
```

---

## 5. Type Safety Review

### Generic Type Usage

| Service | Generics | Assessment |
|---------|----------|------------|
| EventBus | `subscribe<T>()` | ✅ Proper generic events |
| VFS | None needed | N/A |
| WindowManager | None needed | N/A |

### Discriminated Unions

```typescript
// ✅ Good: AppMenuItem
type AppMenuItem =
  | { type: 'action'; label: string; action: string }
  | { type: 'separator' }
  | { type: 'submenu'; label: string; items: AppMenuItem[] }

// ✅ Good: VfsErrorCode
type VfsErrorCode = 'ENOENT' | 'EEXIST' | 'ENOTDIR' | ...
```

### Null Safety

| Pattern | Usage | Status |
|---------|-------|--------|
| Optional chaining | Used where needed | ✅ |
| Undefined vs null | Inconsistent | ⚠️ |
| Non-null assertions | Minimal | ✅ |

---

## 6. Documentation Quality

### JSDoc Coverage

| File | Coverage | Quality |
|------|----------|---------|
| `vfs/types.ts` | 100% | ✅ Excellent |
| `event-bus/types.ts` | 100% | ✅ Excellent |
| `window-manager/types.ts` | 100% | ✅ Excellent |
| `runtime/types.ts` | 90% | ✅ Good |
| `permissions/types.ts` | 80% | ⚠️ Missing some |

### Example Quality

Most interfaces lack usage examples. **Recommendation**: Add `@example` tags.

```typescript
/**
 * Read file contents
 * @example
 * const content = await vfs.readTextFile('/Users/default/Documents/README.txt')
 * console.log(content)
 */
readTextFile(path: string): Promise<string>
```

---

## 7. Breaking Change Risk

### Low Risk Changes
- Adding new optional fields to interfaces
- Adding new methods to services
- Adding new error codes

### High Risk Changes
- Changing `AppManifest` structure (affects all apps)
- Modifying `VfsError` codes
- Changing `Task` state machine

### Versioning Strategy

Currently: No versioning on internal APIs.

**Recommendation**: Add version comments for major interfaces:

```typescript
/**
 * @since 1.0.0
 * @version 1.0.0
 */
interface VirtualFileSystem { ... }
```

---

## 8. Action Items

### 🔴 High Priority

| Issue | Action | Effort |
|-------|--------|--------|
| Duplicate AppManifest | Consolidate to single definition | 2h |

### 🟡 Medium Priority

| Issue | Action | Effort |
|-------|--------|--------|
| Timestamp inconsistency | Standardize on Date objects | 1h |
| Missing error types | Add WindowManagerError, etc. | 3h |
| Add JSDoc examples | Document usage patterns | 2h |

### 🟢 Low Priority (Future)

| Issue | Action | Effort |
|-------|--------|--------|
| Recursive delete | Add rmdirRecursive | 1h |
| Glob patterns | Add glob method | 4h |
| App state persistence | Add save/restore | 8h |

---

## 9. Compliance Summary

| Criterion | Score | Notes |
|-----------|-------|-------|
| Naming conventions | 90% | Minor inconsistencies |
| Type safety | 95% | Excellent TypeScript usage |
| Documentation | 85% | Missing examples |
| Error handling | 70% | Only VFS has custom errors |
| Consistency | 80% | Duplicate AppManifest |
| **Overall** | **B+** | Good, minor improvements needed |

---

## Appendix: Type Definition Locations

```
src/
├── platform/
│   ├── storage/types.ts      # Database, StorageAdapter
│   ├── timer/types.ts        # TimerManager, TimerId
│   └── system/types.ts       # SystemInfo, Capabilities
├── kernel/
│   ├── event-bus/types.ts    # EventBus, EventChannel, Unsubscribe
│   ├── task-manager/types.ts # TaskManager, Task, TaskState
│   ├── vfs/types.ts          # VirtualFileSystem, VfsStat, VfsError
│   └── permissions/types.ts  # PermissionManager, PathPermission
├── ui-shell/
│   ├── window-manager/types.ts   # WindowManager, Window
│   ├── desktop/types.ts          # DesktopService, DesktopIcon
│   └── system-overlay/types.ts   # SystemOverlayService
└── app-framework/
    ├── manifest/types.ts     # AppManifest, FileAssociation
    ├── context/types.ts      # AppContext, ScopedFileSystem
    └── runtime/types.ts      # AppRuntime, AppInstance, AppFactory
```

---

*End of API Review*

