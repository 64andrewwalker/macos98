import { describe, it, expect } from 'vitest'
import * as sass from 'sass'
import { resolve } from 'path'

describe('InfoDialog Visual Baseline', () => {
  const compiledCss = sass.compile(
    resolve(__dirname, './InfoDialog.module.scss')
  ).css

  it('buttons use solid borders (not outset style)', () => {
    // native 'outset' style is forbidden, we use bevel-outset mixin which uses solid borders
    expect(compiledCss).not.toMatch(/border.*:\s*[^;]*outset/)
  })

  it('buttons use correct bevel colors', () => {
    // Should have specific light/gray borders
    expect(compiledCss).toMatch(/\.button[^{]*{[^}]*border-top:\s*2px solid var\(--sys-border-light\)/)
  })
})
