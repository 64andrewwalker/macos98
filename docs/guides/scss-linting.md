# SCSS Linting Guide

This project uses [stylelint](https://stylelint.io/) to enforce design system consistency and prevent common styling mistakes.

## Quick Start

```bash
# Lint all SCSS files
npm run lint:css

# Auto-fix formatting issues
npm run lint:css -- --fix

# Lint both JavaScript and SCSS
npm run lint:all
```

## Design System Enforcement

The linter enforces the macOS 98 design system principles defined in `openspec/changes/refactor-scss-design-system/design.md`.

### Enforced Rules

#### 🎨 No Literal Hex Colors (Strict)

**Rule**: `color-no-hex`

Literal hex colors are **forbidden** in component files. All colors must come from design tokens.

❌ **Wrong**:
```scss
.button {
  background: #dddddd;
  color: #000000;
  border: 1px solid #808080;
}
```

✅ **Correct**:
```scss
@use '@/styles/tokens' as *;

.button {
  background: tokens.$color-window-bg;
  color: tokens.$color-text;
  border: tokens.$border-width-thin tokens.$border-style tokens.$color-border-gray;
}
```

**Exceptions**:
- `src/styles/_tokens.scss` (where tokens are defined)
- `src/styles/global.scss` (CSS custom properties)

#### 📐 Spacing & Sizing Best Practices

While we cannot automatically enforce spacing tokens due to SCSS preprocessing limitations, the design system requires:

**Policy** (enforced via code review):
- All spacing values (`padding`, `margin`, `gap`) must use tokens from `_tokens.scss`
- All sizing values (`width`, `height`, etc.) must use tokens
- Exception: `0` values don't require tokens

✅ **Correct**:
```scss
@use '@/styles/tokens' as *;

.container {
  padding: tokens.$space-8;
  margin: tokens.$space-4 0;  // 0 is allowed
  width: tokens.$size-200;
  gap: tokens.$space-12;
}
```

#### 🚫 Deprecated Properties & Keywords

The linter catches deprecated CSS:
- `word-wrap` → use `overflow-wrap`
- `word-break: break-word` → use `overflow-wrap: break-word`

#### 📝 Formatting Standards

- Consistent indentation
- Short hex notation (`#fff` not `#ffffff`)
- Legacy color functions (`rgba(0, 0, 0, 0.5)` not `rgb(0 0 0 / 50%)`)
- Quoted font family names (`'Geneva'` not `Geneva`)
- Quoted URLs (`url('image.png')`)
- No units on zero values (`0` not `0px`)

## Configuration

The linting configuration is in `.stylelintrc.json`:

- **Base**: `stylelint-config-standard-scss`
- **Plugins**: `stylelint-scss`
- **Custom rules**: See `.stylelintrc.json` for details

### File-Specific Overrides

Token definition files have relaxed rules:
- `src/styles/_tokens.scss` - hex colors allowed (this is where they're defined)
- `src/styles/global.scss` - hex colors allowed (CSS custom properties)

## Integration

### Pre-commit Hooks (Recommended)

Add to your workflow:

```bash
# In .husky/pre-commit or similar
npm run lint:all
```

### CI/CD

Add to GitHub Actions or your CI pipeline:

```yaml
- name: Lint SCSS
  run: npm run lint:css
```

### Editor Integration

**VS Code**: Install the [Stylelint extension](https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint)

Add to `.vscode/settings.json`:
```json
{
  "stylelint.validate": ["css", "scss"],
  "editor.codeActionsOnSave": {
    "source.fixAll.stylelint": true
  }
}
```

## Troubleshooting

### "Unexpected hex color"

You're using a literal color value. Import and use a token instead:

```scss
@use '@/styles/tokens' as *;
// Then use tokens.$color-*
```

### "Expected modern notation"

Fix deprecated syntax:
```bash
npm run lint:css -- --fix
```

## Design System Reference

For the complete design system documentation, see:
- **📘 Design System v2** (PRIMARY): `design-system.md` — Official visual specification with mixin API reference
- **Proposal**: `openspec/changes/refactor-scss-design-system/proposal.md`
- **Design Document**: `openspec/changes/refactor-scss-design-system/design.md`
- **Token Reference**: `src/styles/_tokens.scss`
- **Mixin Library**: `src/styles/_mixins.scss`

## Why Strict Linting?

The linter enforces the [Design Principles](openspec/changes/refactor-scss-design-system/design.md#design-principles) from our design system:

1. **Pixel Realism** - Authentic Mac OS 8-9 aesthetic
2. **Strict Consistency** - Unified visual language across all components
3. **Token-Driven Architecture** - Single source of truth for all visual properties
4. **Mixins as Framework API** - Reusable patterns, zero duplication

By catching violations at lint time, we maintain visual consistency and prevent design system drift.
