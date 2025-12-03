/**
 * Desktop E2E Tests
 * 
 * Tests desktop icons, window management, and basic navigation.
 */

import { test, expect } from '@playwright/test'

test.describe('Desktop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for desktop to load
    await expect(page.getByText('Macintosh HD')).toBeVisible()
  })

  test('displays all desktop icons', async ({ page }) => {
    // Verify all default icons are present
    await expect(page.getByText('Macintosh HD')).toBeVisible()
    await expect(page.getByText('Documents')).toBeVisible()
    await expect(page.getByText('Calculator')).toBeVisible()
    await expect(page.getByText('TicTacToe')).toBeVisible()
    await expect(page.getByText('Trash')).toBeVisible()
  })

  test('opens Documents folder on double-click', async ({ page }) => {
    // Double-click Documents
    await page.getByText('Documents').first().dblclick()
    
    // Verify Finder window opens
    await expect(page.locator('text=README.txt')).toBeVisible()
    await expect(page.locator('text=Notes.txt')).toBeVisible()
    await expect(page.locator('text=Work')).toBeVisible()
  })

  test('opens Calculator on double-click', async ({ page }) => {
    // Double-click Calculator
    await page.getByText('Calculator').first().dblclick()
    
    // Verify Calculator window opens
    await expect(page.locator('button:has-text("7")')).toBeVisible()
    await expect(page.locator('button:has-text("8")')).toBeVisible()
    await expect(page.locator('button:has-text("+")')).toBeVisible()
    await expect(page.locator('button:has-text("=")')).toBeVisible()
  })

  test('opens TicTacToe on double-click', async ({ page }) => {
    // Double-click TicTacToe
    await page.getByText('TicTacToe').first().dblclick()
    
    // Verify TicTacToe window opens
    await expect(page.locator('text=Next player:')).toBeVisible()
    await expect(page.locator('button:has-text("New Game")')).toBeVisible()
  })

  test('opens multiple windows', async ({ page }) => {
    // Open Calculator
    await page.getByText('Calculator').first().dblclick()
    await expect(page.locator('button:has-text("7")')).toBeVisible()
    
    // Open TicTacToe
    await page.getByText('TicTacToe').first().dblclick()
    await expect(page.locator('text=Next player:')).toBeVisible()
    
    // Both windows should be visible
    await expect(page.locator('text=Calculator').first()).toBeVisible()
    await expect(page.locator('text=Next player:')).toBeVisible()
  })
})

