# Architecture Overview

## Tech Stack
- **Runtime**: React 19, TypeScript (ES2022 target, strict mode)
- **Build Tools**: Vite with esbuild and HMR, pnpm package manager
- **Styling**: SCSS/Sass with CSS modules, CSS variables for theming
- **Testing**: Vitest, @testing-library/react, jsdom
- **Quality**: ESLint with flat config, typescript-eslint

## Project Structure
- **Entry Points**: `src/main.tsx`, `src/App.tsx`
- **OS Shell**: `src/components/os/` (Desktop, MenuBar, Window, dialogs)
- **Applications**: `src/components/apps/` (Finder, Calculator, TicTacToe, About, TextEditor)
- **Styles**: `src/styles/` (Global styles, tokens, mixins)
- **Assets**: `src/assets/` (Images, icons)
- **Tests**: Colocated `*.test.tsx` files

## Architecture Patterns

### Component Hierarchy
- **Shell vs Apps**: OS shell components are separated from application components.
- **Window Management**: Z-index based stacking with active window tracking.
- **File System**: In-memory simulation with recursive structures.

### State Management
- **Local State**: `useState` for component-specific concerns.
- **Global State**: Context API (`DesktopContext`) for shared concerns like background settings.
- **No External Libraries**: No Redux or Zustand; simple React state primitives.

### Data Flow
- **Prop Drilling**: Parent-to-child callbacks for state updates.
- **Event Handling**: Mouse events for dragging, proper cleanup in `useEffect`.

## Domain Context
The project simulates the classic macOS user interface with authentic retro aesthetics:
- **Retro Visual Design**: 3D beveled borders, system fonts (Chicago/Geneva), pixelated images.
- **Window Chrome**: Classic Mac OS window styling.
- **Desktop Paradigm**: Icons, draggable windows, context menus.
- **System Apps**: Functional Calculator, Finder, TextEditor.
