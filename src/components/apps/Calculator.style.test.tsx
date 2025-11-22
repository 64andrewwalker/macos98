// @vitest-environment node
import { describe, it, expect } from 'vitest'
import * as sass from 'sass'

describe('Calculator styles', () => {
  it('define retro display and button colors/borders via design tokens', () => {
    const result = sass.compile(new URL('./Calculator.module.scss', import.meta.url).pathname)

    // Calculator body uses the window background variable
    expect(result.css).toMatch(/\.calculator[^{]*\{[^}]*background-color:\s*var\(--surface-window\)/)

    // Display uses white surface (surface-input) with gray bevel
    expect(result.css).toMatch(/\.display[^{]*\{[^}]*background-color:\s*var\(--surface-input\)/)
    expect(result.css).toMatch(/\.display[^{]*\{[^}]*border:\s*1px solid var\(--sys-border-gray\)/)

    // Buttons use retro 3D bevel using light and dark border tokens/values
    expect(result.css).toMatch(/button[^{]*\{[^}]*background-color:\s*var\(--surface-window\)/)
    expect(result.css).toMatch(/button[^{]*\{[^}]*border-top:\s*1px solid var\(--sys-border-light\)/)
  })
})
