// @vitest-environment node
import { describe, it, expect } from 'vitest'
import * as sass from 'sass'

describe('Calculator styles', () => {
  it('define retro display and button colors/borders via design tokens', () => {
    const result = sass.compile(new URL('./Calculator.module.scss', import.meta.url).pathname)

    // Calculator body uses the system background color
    expect(result.css).toMatch(/\.calculator[^{]*\{[^}]*background-color:\s*(var\(--sys-bg-color\)|#dddddd)/)

    // Display uses a white surface with gray bevel
    expect(result.css).toMatch(/\.display[^{]*\{[^}]*background-color:\s*#ffffff/)
    expect(result.css).toMatch(/\.display[^{]*\{[^}]*border:\s*1px solid (var\(--sys-border-gray\)|#808080)/)

    // Buttons use retro 3D bevel using light and dark border tokens/values
    expect(result.css).toMatch(/button[^{]*\{[^}]*background-color:\s*(var\(--sys-bg-color\)|#dddddd)/)
    expect(result.css).toMatch(/button[^{]*\{[^}]*border:\s*1px solid (var\(--sys-border-dark\)|#000000)/)
  })
})
