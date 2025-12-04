/**
 * TextEditor E2E Tests
 * 
 * Tests text editor functionality including save, formatting, and persistence.
 */

import { test, expect } from '@playwright/test'

test.describe('TextEditor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for desktop to load
    await expect(page.getByText('Documents').first()).toBeVisible()
    
    // Open Documents folder
    await page.getByText('Documents').first().dblclick()
    await expect(page.locator('text=README.txt')).toBeVisible()
    
    // Open README.txt
    await page.locator('text=README.txt').first().dblclick()
    await expect(page.locator('[data-testid="text-editor-content"]')).toBeVisible()
  })

  test('opens file with content', async ({ page }) => {
    const editor = page.locator('[data-testid="text-editor-content"]')
    await expect(editor).toContainText('Welcome to macOS 90s')
  })

  test('shows character count in status bar', async ({ page }) => {
    await expect(page.locator('text=Characters:')).toBeVisible()
  })

  test('shows line count in status bar', async ({ page }) => {
    await expect(page.locator('text=Lines:')).toBeVisible()
  })

  test('can edit content', async ({ page }) => {
    const editor = page.locator('[data-testid="text-editor-content"]')
    
    // Focus and type
    await editor.click()
    await page.keyboard.type('Test input ')
    
    // Should show Modified indicator
    await expect(page.locator('text=Modified')).toBeVisible()
  })

  test('save button shows asterisk when modified', async ({ page }) => {
    const editor = page.locator('[data-testid="text-editor-content"]')
    
    // Focus and type
    await editor.click()
    await page.keyboard.type('X')
    
    // Save button should show asterisk
    await expect(page.locator('button:has-text("Save *")')).toBeVisible()
  })

  test('save button removes asterisk after save', async ({ page }) => {
    const editor = page.locator('[data-testid="text-editor-content"]')
    
    // Focus and type
    await editor.click()
    await page.keyboard.type('X')
    
    // Click save
    await page.locator('button:has-text("Save")').click()
    
    // Wait for save to complete - asterisk should disappear
    await expect(page.locator('button:has-text("Save")')).not.toContainText('*')
    await expect(page.locator('text=Modified')).not.toBeVisible()
  })

  test('has formatting toolbar', async ({ page }) => {
    // Check toolbar buttons exist
    await expect(page.locator('button[title*="Bold"]')).toBeVisible()
    await expect(page.locator('button[title*="Italic"]')).toBeVisible()
    await expect(page.locator('button[title*="Underline"]')).toBeVisible()
  })

  test('has font selector', async ({ page }) => {
    // Check font select exists
    await expect(page.locator('select').first()).toBeVisible()
    
    // Should have Geneva option
    await expect(page.locator('option:has-text("Geneva")')).toBeAttached()
  })

  test('has font size selector', async ({ page }) => {
    // Check size select exists with size options
    await expect(page.locator('option:has-text("12")')).toBeAttached()
    await expect(page.locator('option:has-text("18")')).toBeAttached()
  })

  test('has help button', async ({ page }) => {
    await expect(page.locator('button[title*="Help"]')).toBeVisible()
  })

  test('help dialog opens and closes', async ({ page }) => {
    // Click help button
    await page.locator('button[title*="Help"]').click()
    
    // Help dialog should open
    await expect(page.locator('text=Text Editor Help')).toBeVisible()
    
    // Click OK to close
    await page.locator('button:has-text("OK")').click()
    
    // Dialog should close
    await expect(page.locator('text=Text Editor Help')).not.toBeVisible()
  })
})

test.describe('TextEditor Persistence', () => {
  test('content persists after save and reload', async ({ page }) => {
    await page.goto('/')
    
    // Open Documents and Notes.txt
    await page.getByText('Documents').first().dblclick()
    await expect(page.locator('text=Notes.txt')).toBeVisible()
    await page.locator('text=Notes.txt').first().dblclick()
    await expect(page.locator('[data-testid="text-editor-content"]')).toBeVisible()
    
    // Clear and add unique content
    const editor = page.locator('[data-testid="text-editor-content"]')
    const uniqueText = `Test persistence ${Date.now()}`
    
    await editor.click()
    await page.keyboard.press('Control+a')
    await page.keyboard.type(uniqueText)
    
    // Save
    await page.locator('button:has-text("Save")').click()
    
    // Wait for save to complete
    await expect(page.locator('button:has-text("Save")')).not.toContainText('*')
    
    // Reload page
    await page.reload()
    
    // Reopen the file
    await page.getByText('Documents').first().dblclick()
    await expect(page.locator('text=Notes.txt')).toBeVisible()
    await page.locator('text=Notes.txt').first().dblclick()
    await expect(page.locator('[data-testid="text-editor-content"]')).toBeVisible()
    
    // Verify content persisted
    await expect(page.locator('[data-testid="text-editor-content"]')).toContainText(uniqueText)
  })
})

