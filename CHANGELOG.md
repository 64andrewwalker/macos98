# Changelog

All notable changes to the macOS 98 Desktop Simulator project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added

#### 5-Layer Architecture (New)
- **Platform Layer** - Browser API abstractions ✓ verified
  - `src/platform/storage/` - IndexedDB wrapper (27 tests)
  - `src/platform/timer/` - Managed timers (37 tests)
  - `src/platform/system/` - Capability detection (25 tests)

- **Kernel Layer** - OS-like services ✓ verified
  - `src/kernel/event-bus/` - Pub/sub messaging (19 tests)
  - `src/kernel/task-manager/` - App lifecycle management (27 tests)
  - `src/kernel/vfs/` - Virtual file system with IndexedDB persistence (46 tests)
  - `src/kernel/permissions/` - File/service access control (16 tests)

- **UI Shell Layer** - Desktop services ✓ verified
  - `src/ui-shell/window-manager/` - Window lifecycle & z-ordering (37 tests)
  - `src/ui-shell/desktop/` - Icon management (32 tests)
  - `src/ui-shell/system-overlay/` - Portal overlays for modals (21 tests)

- **App Framework Layer** - Application lifecycle ✓ verified
  - `src/app-framework/manifest/` - App metadata & validation (23 tests)
  - `src/app-framework/context/` - Sandboxed app resources (34 tests)
  - `src/app-framework/runtime/` - Launch/terminate management (30 tests)

- **System Bootstrap** - Service initialization ✓ verified
  - `src/system/bootstrap.ts` - Initializes all subsystems
  - `src/system/SystemContext.tsx` - React provider for services
  - `src/system/hooks.ts` - `useSystem`, `useAppRuntime`, `useVfs` hooks

#### Migrated Applications (6 apps)
- `src/apps/calculator/` - Calculator with manifest ✓ verified
- `src/apps/tictactoe/` - TicTacToe game with manifest ✓ verified
- `src/apps/about/` - About dialog with manifest ✓ verified
- `src/apps/background-switcher/` - Background changer with manifest ✓ verified
- `src/apps/text-editor/` - Text editor with VFS persistence ✓ verified
- `src/apps/finder/` - File browser with VFS integration ✓ verified

#### New Components
- `src/components/os/OpenDialog.tsx` - Mac OS 9 style file picker ✓ verified
- `src/components/os/OpenDialog.module.scss` - Retro file dialog styling ✓ verified

#### New Features
- **File > Open** - Opens VFS file browser dialog ✓ verified
- **File > Print** - Triggers browser print dialog ✓ verified
- **VFS Persistence** - Files survive page refresh via IndexedDB ✓ verified
- **AppRuntime Integration** - Calculator, TicTacToe, About launch via new system ✓ verified

#### Documentation
- `docs/architecture-redesign.md` - Full migration plan ✓ verified
- `docs/reports/analysis-report.md` - Codebase analysis ✓ verified
- `docs/reports/sync-audit-report.md` - Doc-code alignment audit ✓ verified
- `docs/reports/api-review.md` - Internal API design review ✓ verified
- `TODO.md` - Progress tracking document ✓ verified

#### Tests
- Added 781 tests total (up from ~200)
- Critical tests for System Bootstrap (11 tests)
- Critical tests for System Hooks (8 tests)
- Critical tests for OpenDialog (11 tests)

### Changed

- **Desktop.tsx** - Now renders windows from both legacy and new WindowManager ✓ verified
- **MenuBar.tsx** - Uses AppRuntime for "About This Computer" ✓ verified
- **TextEditor.tsx** - Saves content to VFS for persistence ✓ verified
- **App.tsx** - Wrapped with `SystemProvider` ✓ verified
- **test/setup.ts** - Added `fake-indexeddb` for test environment ✓ verified

### Removed

- `src/hooks/useDesktopLogic.tsx` - Legacy hook deleted ✓ verified
  - Desktop.tsx refactored to use DesktopService, WindowManager
  - Icon management now uses UI Shell layer
- `src/hooks/useDesktopLogic.test.tsx` - Legacy tests deleted ✓ verified

### Fixed

- **Duplicate AppManifest** - Consolidated to single `PermissionAppManifest` ✓ verified
- **Timestamp inconsistency** - Documented in API review
- **TextEditor persistence** - Now saves/loads from VFS ✓ verified

### Security

- No security-related changes in this release

---

## Committed Changes (Git History)

### feat: Architecture & Infrastructure
- `3dd6412` docs: add design docs ✓
- `5343a3b` feat: Add GitHub Actions for CI/CD ✓
- `e99b06c` feat: Add `useDesktopLogic` hook ✓

### feat: UI Components
- `47e1910` feat: Add background mode selection (fill, fit, tile) ✓
- `082fc69` feat: Add DesktopContext and BackgroundSwitcher ✓
- `3a7dea7` feat: add new background images ✓

### refactor: Design System
- `0b9c0b7` refactor: Complete SCSS design system token migration ✓
- `2acece3` refactor: Remove all legacy gray color tokens ✓
- `b7c1177` refactor: Consolidate design system to sustainable 5-gray core ✓
- `950fc9a` refactor: Complete SCSS design system ✓
- `2c33d59` feat: Introduce structured SCSS design system ✓

### fix: Bug Fixes
- `6973de4` fix: enforce 2px grid and system tokens ✓
- `be8ad2a` fix: update Calculator and Finder display logic ✓
- `deccc71` fix: improve DesktopIcon prop handling ✓
- `f999b76` fix: improve Finder double-click handling ✓

### docs: Documentation
- `9d9c099` docs: restructure project documentation ✓
- `76cc932` feat: Expand project documentation ✓
- `3e7ca89` docs: Add comprehensive Design System v2 spec ✓

---

## Verification Summary

| Category | Claims | Verified | Unverified |
|----------|--------|----------|------------|
| Platform Layer | 3 modules | 3 ✓ | 0 |
| Kernel Layer | 4 modules | 4 ✓ | 0 |
| UI Shell Layer | 3 modules | 3 ✓ | 0 |
| App Framework | 3 modules | 3 ✓ | 0 |
| Migrated Apps | 6 apps | 6 ✓ | 0 |
| New Features | 4 features | 4 ✓ | 0 |
| Documentation | 5 docs | 5 ✓ | 0 |
| **Total** | **28** | **28 ✓** | **0** |

---

## Breaking Changes

### API Changes
- `PermissionManager.registerApp()` now accepts `PermissionAppManifest` instead of `AppManifest`
  - **Migration**: Update imports from `kernel/permissions/types`
  - **Impact**: Low (internal API only)

### Behavior Changes
- None

### Removed Features
- None

---

## Test Coverage

```
Test Files:  40 passed (40)
Tests:       781 passed | 1 skipped (782)
Duration:    ~3s
```

| Layer | Tests |
|-------|-------|
| Platform | 89 |
| Kernel | 108 |
| UI Shell | 90 |
| App Framework | 87 |
| System | 19 |
| Components | 388+ |

---

## Dependencies

### Added
- `fake-indexeddb` - IndexedDB mock for tests

### Updated
- None

### Removed
- None

---

## Unverified Claims

**None** - All changelog entries have been verified against the codebase.

---

## Contributors

- Architecture redesign and implementation session (December 3, 2025)

---

*Generated: December 3, 2025*

