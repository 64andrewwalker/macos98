# Getting Started

## Introduction
macOS 98 is a late-90s Mac OS desktop simulator built with React 19, TypeScript, Vite, and SCSS modules. It recreates the aesthetic and functionality of classic Mac OS (OS 9 era) as a fully interactive web application.

## Prerequisites
- Node.js (Latest LTS recommended)
- pnpm (Preferred package manager)

## Installation
```bash
pnpm install
```

## Development
Start the development server with HMR:
```bash
pnpm dev
```

## Building
Type-check and build for production:
```bash
pnpm build
```

## Preview
Serve the built output for smoke-testing:
```bash
pnpm preview
```

## Testing
Run tests with Vitest and Testing Library:
```bash
pnpm test
```
To run a specific test suite:
```bash
pnpm test src/components/apps/Calculator.test.tsx
```

## Linting
Run ESLint across TS/TSX sources:
```bash
pnpm lint
```
