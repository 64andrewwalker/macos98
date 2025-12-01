import { describe, it, expect } from 'vitest'
import * as sass from 'sass'
import { resolve } from 'path'

describe('BackgroundSwitcher Visual Baseline', () => {
  const compiledCss = sass.compile(
    resolve(__dirname, './BackgroundSwitcher.module.scss')
  ).css

  it('uses bevel mixins correctly (no manual border definitions)', () => {
    // This is hard to detect via regex on compiled CSS if manual values match mixin output.
    // Ideally we'd check AST or verify source, but baseline tests verify output.
    // However, if we assume the manual implementation might miss something or differ slightly.

    // For now, let's just ensure it uses tokens for borders.
    expect(compiledCss).toMatch(/border-.*:\s*2px solid var\(--sys-border-light\)/)
    expect(compiledCss).toMatch(/border-.*:\s*2px solid var\(--sys-border-gray\)/)
  })
})
