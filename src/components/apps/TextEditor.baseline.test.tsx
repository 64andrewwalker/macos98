import { describe, it, expect } from 'vitest'
import * as sass from 'sass'
import { resolve } from 'path'

describe('TextEditor Visual Baseline', () => {
  const compiledCss = sass.compile(
    resolve(__dirname, './TextEditor.module.scss')
  ).css

  it('saveButton uses toolbar button styling', () => {
    // Should have bevel-outset (2px)
    expect(compiledCss).toMatch(/border-.*:\s*2px solid var\(--sys-border-light\)/)
  })

  it('ruler uses semantic colors', () => {
    // Background should be surface-input (not raw gray)
    expect(compiledCss).toMatch(/\.ruler[^{]*{[^}]*background-color:\s*var\(--surface-input\)/)
    // Text should be text-disabled
    expect(compiledCss).toMatch(/\.ruler[^{]*{[^}]*color:\s*var\(--text-disabled\)/)
  })

  it('okButton uses dialog button mixin', () => {
    // Should use bevel-outset
    expect(compiledCss).toMatch(/\.okButton[^{]*{[^}]*border-.*:\s*2px solid var\(--sys-border-light\)/)
    // Should not use 'outset' style
    expect(compiledCss).not.toMatch(/\.okButton[^{]*{[^}]*border-style:\s*outset/)
  })
})
