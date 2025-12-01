import { describe, it, expect } from 'vitest'
import * as sass from 'sass'
import { resolve } from 'path'

describe('DesktopIcon Visual Baseline', () => {
  const compiledCss = sass.compile(
    resolve(__dirname, './DesktopIcon.module.scss')
  ).css

  it('has no border-radius (OS9 aesthetic)', () => {
    expect(compiledCss).not.toMatch(/border-radius/)
  })
})
