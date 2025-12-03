# Documentation Reorganization Log

**Date**: 2025-12-03
**Status**: Completed

## Changes

1.  **Created `docs/` Directory Structure**:
    - `docs/api/`
    - `docs/guides/`
    - `docs/contributing/`

2.  **Consolidated Documentation**:
    - Created `docs/getting-started.md` (merged content from `README.md` and `GEMINI.md`).
    - Created `docs/architecture.md` (merged content from `openspec/project.md` and `GEMINI.md`).
    - Created `docs/contributing/guidelines.md` (merged content from `GEMINI.md` and `openspec/project.md`).

3.  **Moved and Renamed Files**:
    - `DESIGN_SYSTEM.md` -> `docs/guides/design-system.md`
    - `COMPONENT_BLUEPRINTS.md` -> `docs/guides/component-blueprints.md`
    - `INTERACTION_BLUEPRINT.md` -> `docs/guides/interaction-blueprint.md`
    - `SCSS_LINTING.md` -> `docs/guides/scss-linting.md`

4.  **Updated References**:
    - Updated internal links in moved files to point to the new locations.
    - Updated `README.md` to serve as an index for the new documentation structure.

## Inventory

### Root
- `README.md`: Entry point.
- `GEMINI.md`: Agent context/guidelines (kept for system compatibility).
- `AGENTS.md`, `CLAUDE.md`: Agent instructions (kept for system compatibility).

### Docs
- `docs/getting-started.md`: Setup and usage.
- `docs/architecture.md`: Technical overview.
- `docs/contributing/guidelines.md`: Dev guidelines.
- `docs/guides/design-system.md`: Visual specs.
- `docs/guides/component-blueprints.md`: Component architecture.
- `docs/guides/interaction-blueprint.md`: Interaction models.
- `docs/guides/scss-linting.md`: Linting rules.
