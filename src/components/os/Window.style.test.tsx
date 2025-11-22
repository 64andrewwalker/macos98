// @vitest-environment node
import { describe, it, expect } from 'vitest'
import * as sass from 'sass'

describe('Window styles', () => {
  it('define retro window background and border colors via design tokens', () => {
    const result = sass.compile(new URL('./Window.module.scss', import.meta.url).pathname)

    // Window background should be driven by the system background token/variable
    expect(result.css).toMatch(/background-color:\s*var\(--sys-bg-color\)/)

    // Window border should use the dark border token/variable
    expect(result.css).toMatch(/border:\s*1px solid var\(--sys-border-dark\)/)
  })
})
