# Project Context

## Purpose
macOS 98 is a late-90s Mac OS desktop simulator built with modern web technologies. It recreates the aesthetic and functionality of classic Mac OS (OS 9 era) as a fully interactive web application, featuring:

- A functional desktop environment with draggable, resizable windows
- Native-style applications (Calculator, Finder, TextEditor, TicTacToe, BackgroundSwitcher)
- Dynamic background customization with multiple themes and display modes
- Simulated file system with nested folders and file operations
- Copy/paste/cut/undo operations
- Context menus, menu bar, and desktop icon management
- Window state management (collapse, zoom, focus, z-index stacking)

## Tech Stack
- **Runtime**: React 19.2.0, TypeScript 5.9.3 (ES2022 target, strict mode)
- **Build Tools**: Vite 7.2.4 with esbuild and HMR, pnpm package manager
- **Styling**: SCSS/Sass 1.94.2 with CSS modules, CSS variables for theming
- **Testing**: Vitest 4.0.12, @testing-library/react 16.3.0, jsdom 27.2.0, @testing-library/user-event 14.6.1
- **Quality**: ESLint 9.39.1 with flat config, typescript-eslint 8.46.4

## Project Conventions

### Code Style
- **TypeScript**: Strict mode enabled, functional components only, explicit prop typing with interfaces
- **Indentation**: 2 spaces, no semicolons
- **File Organization**: PascalCase component names matching file names
- **Imports**: Organized as React → external libraries → local modules
- **Type Exports**: Use `export type` for interfaces/types
- **Colocated Tests**: Each component has `Component.test.tsx` and `Component.module.scss` in the same directory

### Architecture Patterns
- **Component Hierarchy**: OS shell components (`src/components/os/`) separated from application components (`src/components/apps/`)
- **State Management**:
  - Local state via `useState` for component-specific concerns (window positions, form inputs)
  - Global state via Context API (`DesktopContext`) for shared concerns (background settings)
  - No external state libraries (Redux, Zustand, etc.)
- **Prop Drilling**: Parent-to-child callbacks for state updates
- **Window Management**: Z-index based stacking with active window tracking
- **File System**: In-memory simulation with `FileItem` interface and recursive children
- **Clipboard & History**: Undo stack maintained in Desktop component for user actions
- **Event Handling**: Mouse events for dragging (onMouseDown, onMouseMove, onMouseUp), proper cleanup in useEffect
- **Component Data Attributes**: Use `data-testid` for reliable test queries

### Testing Strategy
- **Approach**: Test-Driven Development (TDD) - write test cases first, then implement code
- **Mandatory**: Tests required before feature implementation or bug fixes
- **Focus**: User-visible behavior over implementation details
- **Test Types**:
  - Unit tests for component behavior
  - Integration tests for multi-component interactions (Desktop.integration.test.tsx)
  - Context tests for provider/consumer patterns
- **Configuration**: Vitest with jsdom environment, globals enabled
- **Coverage**: 14 test files covering 16 non-test source files

### Git Workflow
- **Branch Strategy**: Feature branches from `main`, using OpenSpec system for AI-assisted changes
- **Main Branch**: `main`
- **Commit Messages**: Conventional Commits format (`feat:`, `fix:`, `chore:`, etc.), present tense, concise
- **Pull Requests**:
  - Include summary, linked issues, screenshots for UI changes
  - Must pass: `pnpm lint`, `pnpm test`, `pnpm build`
  - Separate PRs for different change types (no mixed refactor + feature)
  - Asset additions require source/license attribution
- **AI Workflow**: Use `/openspec:proposal` for planning, `/openspec:apply` for implementation, `/openspec:archive` after deployment

## Domain Context
This project simulates the classic macOS user interface with authentic retro aesthetics:

- **Retro Visual Design**: 3D beveled borders, system fonts (Chicago/Geneva), pixelated images
- **Window Chrome**: Classic Mac OS window styling with title bars, close boxes, collapse/zoom widgets
- **Desktop Paradigm**: Icons on desktop, draggable windows, right-click context menus
- **System Apps**: Calculator with working arithmetic, Finder for file browsing, TextEditor for editing, games
- **Background Themes**: Multiple gaming/retro-themed backgrounds with fill/fit/tile display modes

The project aims to be both nostalgic and functional, using modern web technologies to recreate the classic computing experience.

## Important Constraints
- **No External APIs**: Application is fully self-contained with no backend integration
- **In-Memory State**: File system and all data exist only in browser memory (no persistence)
- **Browser Compatibility**: Requires modern browser supporting ES2022, React 19, and CSS modules
- **Font Dependency**: Chicago font loaded from external CDN (onlinewebfonts.com) with fallback to Geneva/sans-serif
- **Asset Size**: Multiple high-quality background images bundled with app
- **TypeScript Strict Mode**: All code must pass strict type checking
- **Test Coverage**: New features and bug fixes require accompanying tests

## External Dependencies
**No Runtime API Integrations**: The application has no backend, database, or external service integrations.

**External Resources**:
- Chicago font: Loaded from `https://db.onlinewebfonts.com/t/1064f0ad1cb65fdab43bb592ddd8aa91.woff2`
- All other assets (backgrounds, icons) are bundled within the application

**Development Dependencies Only**:
- Build tooling: Vite, esbuild, Rollup
- Testing framework: Vitest, Testing Library, jsdom
- Code quality: ESLint, TypeScript compiler
