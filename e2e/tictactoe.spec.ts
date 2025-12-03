/**
 * TicTacToe E2E Tests
 * 
 * Tests TicTacToe game functionality.
 */

import { test, expect } from '@playwright/test'

test.describe('TicTacToe', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for desktop to load and open TicTacToe
    await expect(page.getByText('TicTacToe').first()).toBeVisible()
    await page.getByText('TicTacToe').first().dblclick()
    // Wait for game to open
    await expect(page.locator('text=Next player:')).toBeVisible()
  })

  test('starts with player X', async ({ page }) => {
    await expect(page.locator('text=Next player: X')).toBeVisible()
  })

  test('alternates between X and O', async ({ page }) => {
    // Game should start with X
    await expect(page.locator('text=Next player: X')).toBeVisible()
    
    // Get game board buttons (all buttons except "New Game")
    const cells = page.locator('button').filter({ hasNot: page.locator('text=New Game') })
    
    // Click first empty cell
    await cells.first().click()
    
    // Should be O's turn now
    await expect(page.locator('text=Next player: O')).toBeVisible()
    
    // Click another cell
    await cells.nth(1).click()
    
    // Should be X's turn again
    await expect(page.locator('text=Next player: X')).toBeVisible()
  })

  test('New Game button resets the game', async ({ page }) => {
    // Get cells
    const cells = page.locator('button').filter({ hasNot: page.locator('text=New Game') })
    
    // Make a move
    await cells.first().click()
    
    // Click New Game
    await page.locator('button:has-text("New Game")').click()
    
    // Should reset to X's turn
    await expect(page.locator('text=Next player: X')).toBeVisible()
  })

  test('can win the game (X wins)', async ({ page }) => {
    // Get all buttons except New Game
    const cells = page.locator('button').filter({ hasNot: page.locator('text=New Game') })
    
    // Play a winning game for X (top row)
    // X plays top-left (index 0)
    await cells.nth(0).click()
    // O plays middle-left (index 3)
    await cells.nth(3).click()
    // X plays top-middle (index 1)
    await cells.nth(1).click()
    // O plays bottom-left (index 6)
    await cells.nth(6).click()
    // X plays top-right (index 2) - X wins!
    await cells.nth(2).click()
    
    // Should show winner
    await expect(page.locator('text=Winner: X')).toBeVisible()
  })
})
