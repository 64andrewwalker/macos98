// @vitest-environment node
import { describe, it, expect } from 'vitest'
import * as sass from 'sass'

describe('MenuBar styles', () => {
  it('define retro menu background and border colors via design tokens', () => {
    const result = sass.compile(new URL('./MenuBar.module.scss', import.meta.url).pathname)

    // Menu bar background should use surface-input variable (white)
    expect(result.css).toMatch(/background-color:\s*var\(--surface-input\)/)

    // Menu bar bottom border should use the dark border token/variable where applied
    expect(result.css).toMatch(/border.*:\s*1px solid var\(--sys-border-dark\)/)
  })
})
