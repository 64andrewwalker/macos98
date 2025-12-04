# Architecture Overview

macOS 98 uses a **5-layer architecture** designed for maintainability, testability, and separation of concerns.

## Layer Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Applications                          │
│   Calculator │ TextEditor │ Finder │ TicTacToe │ About      │
├─────────────────────────────────────────────────────────────┤
│                      App Framework                           │
│         AppManifest │ AppContext │ AppRuntime               │
├─────────────────────────────────────────────────────────────┤
│                        UI Shell                              │
│      WindowManager │ DesktopService │ SystemOverlay         │
├─────────────────────────────────────────────────────────────┤
│                         Kernel                               │
│   VirtualFileSystem │ EventBus │ TaskManager │ Permissions  │
├─────────────────────────────────────────────────────────────┤
│                        Platform                              │
│        StorageAdapter │ TimerManager │ SystemInfo           │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

| Category | Technology |
|----------|------------|
| Runtime | React 19, TypeScript (ES2022, strict mode) |
| Build | Vite with esbuild and HMR |
| Package Manager | pnpm |
| Styling | SCSS modules, CSS variables |
| Testing | Vitest, @testing-library/react, jsdom |
| Quality | ESLint (flat config), typescript-eslint |

## Project Structure

```
src/
├── platform/          # Browser API abstractions
│   ├── storage/       # IndexedDB wrapper
│   ├── timer/         # Managed timers
│   └── system/        # Capability detection
├── kernel/            # OS-like services
│   ├── vfs/           # Virtual file system
│   ├── event-bus/     # Pub/sub messaging
│   ├── task-manager/  # Process lifecycle
│   └── permissions/   # Access control
├── ui-shell/          # Desktop services
│   ├── window-manager/
│   ├── desktop/
│   └── system-overlay/
├── app-framework/     # App lifecycle
│   ├── manifest/
│   ├── context/
│   └── runtime/
├── apps/              # Migrated applications
├── components/        # React components
│   ├── os/            # Shell UI (Desktop, MenuBar, Window)
│   └── apps/          # App UI (legacy location)
├── system/            # Bootstrap & providers
└── styles/            # Global SCSS
```

## Key Patterns

### Layered Dependencies
- Each layer only depends on layers below it
- Platform has no internal dependencies
- Apps use App Framework APIs, not kernel directly

### State Management
- **Local**: `useState` for component state
- **Services**: Singleton services initialized at bootstrap
- **Context**: React Context for service injection

### Persistence
- VFS backed by IndexedDB via Platform StorageAdapter
- In-memory mode for testing

## Detailed Documentation

- [Full Architecture Redesign](./architecture-redesign.md) - Complete migration proposal
- [Design Specifications](./design-docs/index.md) - Layer-by-layer specs
- [API Review](./reports/api-review.md) - Internal service audit

## Domain Context

The project simulates classic Mac OS (OS 9 era):
- **Visual Design**: 3D beveled borders, Chicago/Geneva fonts
- **Desktop Paradigm**: Icons, draggable windows, menus
- **System Apps**: Calculator, Finder, TextEditor, TicTacToe
