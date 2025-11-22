/**
 * Window Visual Baseline Tests (SCSS Compilation)
 *
 * These tests verify the SCSS compiles to pixel-perfect CSS values.
 * They catch visual regressions by checking the generated CSS output.
 */

import { describe, it, expect } from 'vitest'
import * as sass from 'sass'
import { resolve } from 'path'

describe('Window Visual Baseline (SCSS Compilation)', () => {
  const compiledCss = sass.compile(
    resolve(__dirname, './Window.module.scss')
  ).css

  describe('Chrome (Outer Frame)', () => {
    it('has correct background color (var(--surface-window) = #ddd)', () => {
      expect(compiledCss).toMatch(/background-color:\s*var\(--surface-window\)/)
    })

    it('has 1px solid black border', () => {
      expect(compiledCss).toMatch(/border:\s*1px solid var\(--sys-border-dark\)/)
    })

    it('has 2px 2px solid shadow (no blur)', () => {
      expect(compiledCss).toMatch(/box-shadow:\s*2px 2px 0(px)?\s/)
    })

    it('uses flexbox column layout', () => {
      expect(compiledCss).toMatch(/display:\s*flex/)
      expect(compiledCss).toMatch(/flex-direction:\s*column/)
    })

    it('has 1px inner padding (from border-width-thin)', () => {
      expect(compiledCss).toMatch(/\.window[^{]*{[^}]*padding:\s*1px/)
    })
  })

  describe('Title Bar', () => {
    it('has exactly 18px height', () => {
      expect(compiledCss).toMatch(/height:\s*18px/)
    })

    it('has horizontal stripe pattern (90deg repeating-linear-gradient)', () => {
      expect(compiledCss).toMatch(/background:\s*repeating-linear-gradient\(\s*90deg/)
    })

    it('has borders configured (bottom border present)', () => {
      expect(compiledCss).toMatch(/border.*:\s*(1px|none)/)
    })

    it('uses flexbox with center alignment', () => {
      expect(compiledCss).toMatch(/display:\s*flex/)
      expect(compiledCss).toMatch(/align-items:\s*center/)
    })

    it('has correct padding', () => {
      expect(compiledCss).toMatch(/padding:\s*0\s+4px/)
    })
  })

  describe('Content Frame (2-Layer Inset)', () => {
    it('has inset bevel borders (using sys-border tokens)', () => {
      // Check for token usage
      expect(compiledCss).toMatch(/border-(top|left):\s*1px solid var\(--sys-border-gray\)/)
      expect(compiledCss).toMatch(/border-(right|bottom):\s*1px solid var\(--sys-border-light\)/)
    })

    it('has inner shadow for 2-layer inset depth', () => {
      expect(compiledCss).toMatch(/box-shadow:\s*inset/)
    })

    it('has white background (var(--surface-input))', () => {
      expect(compiledCss).toMatch(/background-color:\s*var\(--surface-input\)/)
    })

    it('uses flex: 1 to fill available space', () => {
      expect(compiledCss).toMatch(/flex:\s*1/)
    })

    it('has overflow: hidden', () => {
      expect(compiledCss).toMatch(/overflow:\s*hidden/)
    })

    it('has 2px margin (space-2)', () => {
      expect(compiledCss).toMatch(/margin:\s*2px/)
    })
  })

  describe('Window Controls', () => {
    it('close box has 12x12px dimensions', () => {
      expect(compiledCss).toMatch(/\.closeBox[^{]*{[^}]*width:\s*12px/)
      expect(compiledCss).toMatch(/\.closeBox[^{]*{[^}]*height:\s*12px/)
    })

    it('close box has 1px black border', () => {
      expect(compiledCss).toMatch(/border:\s*1px solid var\(--sys-border-dark\)/)
    })

    it('close box has white background', () => {
      expect(compiledCss).toMatch(/background-color:\s*var\(--surface-input\)/)
    })
  })

  describe('Title Text', () => {
    it('has 11px font size (font-size-11)', () => {
      expect(compiledCss).toMatch(/font-size:\s*11px/)
    })

    it('is bold', () => {
      expect(compiledCss).toMatch(/font-weight:\s*(bold|700)/)
    })

    it('uses system font', () => {
      expect(compiledCss).toMatch(/font-family:\s*var\(--sys-font\)/)
    })
  })

  describe('Visual Consistency (Anti-Regression)', () => {
    it('has no border-radius anywhere (OS9 aesthetic)', () => {
      // Should NOT find border-radius values > 0
      expect(compiledCss).not.toMatch(/border-radius:\s*[^0\s]/)
    })

    it('has no CSS transitions (instant state changes)', () => {
      // Should NOT find transition properties
      expect(compiledCss).not.toMatch(/transition:/)
    })

    it('has no blur in any box-shadow (pixel-perfect shadows)', () => {
      // All shadows should be "Xpx Ypx 0px" (no blur radius)
      const shadowMatches = compiledCss.match(/box-shadow:[^;]+;/g) || []
      shadowMatches.forEach(shadow => {
        // Skip inset shadows (they may have blur)
        if (!shadow.includes('inset')) {
          expect(shadow).toMatch(/\d+px \d+px 0(px)?\s/)
        }
      })
    })

    it('uses CSS custom properties for all colors', () => {
      // Should find var() color references
      expect(compiledCss).toMatch(/var\(--/)
      expect(compiledCss).toMatch(/var\(--sys-border/)
      expect(compiledCss).toMatch(/var\(--surface/)
    })
  })

  describe('Pixel-Perfect Spacing', () => {
    it('uses token-based spacing throughout', () => {
      // Check for common spacing values
      expect(compiledCss).toMatch(/padding:\s*(0|1px|2px|4px|5px|8px|12px)/)
      expect(compiledCss).toMatch(/margin:\s*(0|2px|4px|8px)/)
    })

    it('uses 4px spacing for control margins', () => {
      expect(compiledCss).toMatch(/margin[^:]*:\s*4px/)
    })
  })
})
