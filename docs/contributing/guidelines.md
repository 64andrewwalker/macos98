# Contributing Guidelines

## Coding Style
- **TypeScript**: Strict mode enabled, functional components only.
- **Indentation**: 2 spaces.
- **Semicolons**: No semicolons (as per existing style).
- **Props**: Explicitly typed with interfaces.
- **Hooks**: Prefer React hooks over class components.

## Naming Conventions
- **Components/Files**: PascalCase (e.g., `MyComponent.tsx`).
- **Hooks**: camelCase (e.g., `useWindowLogic.ts`).
- **SCSS Modules**: `Component.module.scss`.

## Testing Guidelines
- **Framework**: Vitest + Testing Library.
- **TDD**: Write tests *first* before implementing features or fixes.
- **Focus**: User-visible behavior (interactions, flows) rather than implementation details.
- **Queries**: Use accessible queries (`getByRole`, `getByText`). Avoid brittle snapshots.

## Commit & Pull Requests
- **Commits**: Use Conventional Commits (`feat:`, `fix:`, `chore:`). Use present tense.
- **Pull Requests**:
  - Include a summary.
  - Link related issues.
  - Attach screenshots/recordings for UI changes.
  - Ensure `pnpm lint`, `pnpm test`, and `pnpm build` pass.
  - Keep refactors and features separate.
