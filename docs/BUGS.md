## Known Issues and Risks

### Automated Checks
- `pnpm test` passes (Vitest), but Finder emits a console warning when an icon src is empty.
- `pnpm lint` currently fails with 13 errors (`src/components/apps/TextEditor.tsx`, `src/components/os/Desktop.tsx`, `src/components/os/DesktopIcon.tsx`, `src/components/apps/TicTacToe.tsx`, and several tests), blocking CI-quality validation.

### Desktop Text Editor Status Counters
- Location: `src/components/apps/TextEditor.tsx` around the `getStats` call.
- Problem: Status bar line/character counts read `editorRef.current` during render and never update after the first keystroke because `onInput` only flips `isDirty` once. A user can type and see stale counts (often stuck at 0/0) unless another state change happens.
- Fix: Track content in state (or use a `useEffect` tied to `onInput`) and derive stats from state; avoid reading refs during render.

### Finder Icons Without Source
- Location: `src/components/apps/Finder.tsx` (`<img src={item.icon}>` in icon/list views).
- Problem: Items without an icon render `<img src="">`, triggering browser re-requests of the current page and the Vitest stderr warning. Real users with missing/undefined icons will see network noise and broken image glyphs.
- Fix: Skip the `<img>` when the icon is falsy or provide a fallback asset for empty/missing icons.

### New Folder Creation Skips Undo History
- Location: `src/components/os/Desktop.tsx`, `openWindow('new_folder', ...)` path and MenuBar File → New Folder.
- Problem: New folders made through the File menu are created via `openWindow` without recording history, so Edit → Undo has no effect. Context-menu New Folder does record history, creating inconsistent behavior.
- Fix: Route both folder-creation paths through a shared helper that logs to `history` (and consider moving `Date.now()` usage out of render to satisfy lint purity rules).

### Type-Safety and Lint Debt
- Locations: `TicTacToe.tsx` (any-typed board and helper), `DesktopIcon.tsx` (unused expression `onDoubleClick && onDoubleClick()`), `Desktop.tsx` (any-typed history items, impure `Date.now()` in render), plus multiple test files typed as `any`.
- Impact: `pnpm lint` fails, so contributors cannot rely on lint to gate changes; the impure/time-based IDs also risk flaky rendering if components re-render mid-event.
- Fix: Replace `any` with explicit types, switch to optional chaining for callbacks, and move time-based ID generation into event handlers or helpers.
