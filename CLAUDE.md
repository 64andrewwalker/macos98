<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# Repository Guidelines

This project simulates a late-90s Mac OS desktop using React 19, TypeScript, Vite, and SCSS modules. Use the conventions below to keep contributions consistent and shippable.

## Project Structure & Module Organization
- Entry points live in `src/main.tsx` and `src/App.tsx`; desktop shell components sit in `src/components/os` (Desktop, MenuBar, Window, dialogs), and app modules in `src/components/apps` (Finder, Calculator, TicTacToe, About, TextEditor).
- Shared styles are in `src/styles` with `global.scss` imported once in `App`; component-scoped styles use `*.module.scss`. Images/icons live in `src/assets`. Static public assets go in `public`.
- Tests are colocated beside components as `*.test.tsx`; test utilities load from `src/test/setup.ts`.
- Build artifacts land in `dist`. Avoid editing generated files directly.

## Build, Test, and Development Commands
- `pnpm install` — install dependencies (prefer pnpm to match the lockfile).
- `pnpm dev` — start Vite with HMR for local development.
- `pnpm build` — type-check via `tsc -b` then produce a production build.
- `pnpm preview` — serve the built output for smoke-testing.
- `pnpm lint` — run ESLint across TS/TSX sources.
- `pnpm test` — execute Vitest + Testing Library in jsdom; append a path to target a single suite (e.g., `pnpm test src/components/apps/Calculator.test.tsx`).

## Coding Style & Naming Conventions
- Stick to TypeScript functional components, 2-space indentation, and the existing no-semicolon style. Keep props typed explicitly and prefer React hooks.
- Name components and files in PascalCase; hooks in camelCase; SCSS modules as `Component.module.scss`.
- Keep UI text and layout authentic to the Mac OS 9 aesthetic; reuse existing styles before adding new globals. Place reusable visuals in `src/assets` and import via Vite paths.
- Ensure code is ESLint-clean before submitting; no formatter is configured, so match surrounding style.

## Testing Guidelines
- Vitest with `@testing-library/react` and `@testing-library/jest-dom` is configured in `vitest.config.ts`; jsdom is the default environment.
- **Test-Driven Development (TDD)**: Write tests first before implementing new features or fixes. This ensures behavior is clearly defined and code remains reliable.
- Mirror the existing pattern of colocated `*.test.tsx` files. Focus on user-visible behavior: menu interactions, window state, keyboard/mouse flows, and calculator/game logic.
- Use accessible queries (`getByRole`, `getByText`) and avoid brittle snapshot assertions. Prefer small, focused tests over broad integration where possible.

## Commit & Pull Request Guidelines
- Follow the existing Conventional Commit pattern seen in history (`feat: ...`, `fix: ...`, `chore: ...`). Use present tense and keep messages concise.
- For PRs, include: a one-paragraph summary, linked issues, screenshots or recordings for UI changes, and a brief checklist of commands run (`pnpm lint`, `pnpm test`, `pnpm build` if relevant).
- Avoid large mixed changes; keep refactors and features separate. When adding assets, note their source and license in the PR description if non-original.