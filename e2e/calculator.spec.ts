/**
 * Calculator E2E Tests
 * 
 * Tests calculator functionality including basic operations.
 */

import { test, expect } from '@playwright/test'

test.describe('Calculator', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for desktop to load and open Calculator
    await expect(page.getByText('Calculator').first()).toBeVisible()
    await page.getByText('Calculator').first().dblclick()
    // Wait for Calculator to open
    await expect(page.locator('button:has-text("=")')).toBeVisible()
  })

  // Helper to get the display value (first text after "Calculator" title that's not a button)
  async function getDisplay(page: Parameters<typeof test>[0]['page']): Promise<string> {
    // The display is the StaticText between the window title and the buttons
    // Look for text that's a number and not inside a button
    const display = page.locator('text=/^-?\\d*\\.?\\d+$/').first()
    return await display.textContent() || '0'
  }

  test('displays initial value of 0', async ({ page }) => {
    const displayValue = await getDisplay(page)
    expect(displayValue).toBe('0')
  })

  test('performs addition: 7 + 8 = 15', async ({ page }) => {
    await page.locator('button:has-text("7")').click()
    await page.locator('button:has-text("+")').click()
    await page.locator('button:has-text("8")').click()
    await page.locator('button:has-text("=")').click()
    
    // Verify result - check that 15 appears somewhere in the calculator area
    const displayValue = await getDisplay(page)
    expect(displayValue).toBe('15')
  })

  test('performs subtraction: 9 - 4 = 5', async ({ page }) => {
    await page.locator('button:has-text("9")').click()
    await page.locator('button:has-text("-")').click()
    await page.locator('button:has-text("4")').click()
    await page.locator('button:has-text("=")').click()
    
    const displayValue = await getDisplay(page)
    expect(displayValue).toBe('5')
  })

  test('performs multiplication: 6 * 7 = 42', async ({ page }) => {
    await page.locator('button:has-text("6")').click()
    await page.locator('button:has-text("*")').click()
    await page.locator('button:has-text("7")').click()
    await page.locator('button:has-text("=")').click()
    
    const displayValue = await getDisplay(page)
    expect(displayValue).toBe('42')
  })

  test('performs division: 8 / 2 = 4', async ({ page }) => {
    await page.locator('button:has-text("8")').click()
    await page.locator('button:has-text("/")').click()
    await page.locator('button:has-text("2")').click()
    await page.locator('button:has-text("=")').click()
    
    const displayValue = await getDisplay(page)
    expect(displayValue).toBe('4')
  })

  test('clears display with C button', async ({ page }) => {
    // Enter some numbers
    await page.locator('button:has-text("5")').click()
    await page.locator('button:has-text("5")').click()
    
    // Clear
    await page.locator('button:has-text("C")').click()
    
    // Verify display is 0
    const displayValue = await getDisplay(page)
    expect(displayValue).toBe('0')
  })

  test('handles decimal numbers', async ({ page }) => {
    await page.locator('button:has-text("3")').click()
    await page.locator('button:has-text(".")').click()
    await page.locator('button:has-text("5")').click()
    
    const displayValue = await getDisplay(page)
    expect(displayValue).toBe('3.5')
  })

  test('performs chain calculation: 2 + 3 * 4 = 20', async ({ page }) => {
    await page.locator('button:has-text("2")').click()
    await page.locator('button:has-text("+")').click()
    await page.locator('button:has-text("3")').click()
    await page.locator('button:has-text("*")').click()
    await page.locator('button:has-text("4")').click()
    await page.locator('button:has-text("=")').click()
    
    // Note: Calculator evaluates left to right (2+3=5, 5*4=20)
    const displayValue = await getDisplay(page)
    expect(displayValue).toBe('20')
  })
})
