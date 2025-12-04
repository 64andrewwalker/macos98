/**
 * MenuBar E2E Tests
 * 
 * Tests menu bar functionality.
 */

import { test, expect } from '@playwright/test'

test.describe('MenuBar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for desktop to load
    await expect(page.getByText('Macintosh HD')).toBeVisible()
  })

  test('displays Apple menu', async ({ page }) => {
    await expect(page.locator('img[alt="Apple"]')).toBeVisible()
  })

  test('displays File menu', async ({ page }) => {
    await expect(page.locator('text=File').first()).toBeVisible()
  })

  test('displays Edit menu', async ({ page }) => {
    await expect(page.locator('text=Edit').first()).toBeVisible()
  })

  test('displays View menu', async ({ page }) => {
    await expect(page.locator('text=View').first()).toBeVisible()
  })

  test('displays Special menu', async ({ page }) => {
    await expect(page.locator('text=Special').first()).toBeVisible()
  })

  test('displays clock', async ({ page }) => {
    // Clock should show time format (e.g., "0:16" or "12:30")
    await expect(page.locator('text=/\\d+:\\d+/')).toBeVisible()
  })

  test('Apple menu opens About This Computer', async ({ page }) => {
    // Click Apple logo
    await page.locator('img[alt="Apple"]').click()
    
    // Menu should open with About option
    await expect(page.locator('text=About This Computer')).toBeVisible()
    
    // Click About
    await page.locator('text=About This Computer').click()
    
    // About dialog should open
    await expect(page.locator('text=About This Mac')).toBeVisible()
    await expect(page.locator('text=Macintosh System 7')).toBeVisible()
  })

  test('File menu opens with items', async ({ page }) => {
    // Click File menu
    await page.locator('text=File').first().click()
    
    // Should show menu items
    await expect(page.locator('text=New Folder')).toBeVisible()
    await expect(page.locator('text=Open')).toBeVisible()
    await expect(page.locator('text=Print')).toBeVisible()
    await expect(page.locator('text=Close')).toBeVisible()
  })

  test('Edit menu opens with items', async ({ page }) => {
    // Click Edit menu
    await page.locator('text=Edit').first().click()
    
    // Should show menu items
    await expect(page.locator('text=Undo')).toBeVisible()
    await expect(page.locator('text=Cut')).toBeVisible()
    await expect(page.locator('text=Copy')).toBeVisible()
    await expect(page.locator('text=Paste')).toBeVisible()
    await expect(page.locator('text=Clear')).toBeVisible()
  })

  test('File > Open opens Open dialog', async ({ page }) => {
    // Click File menu
    await page.locator('text=File').first().click()
    
    // Click Open
    await page.locator('text=Open').click()
    
    // Open dialog should appear - look for dialog elements
    // The dialog has a header with "Open" title and shows path like "/" or "Desktop"
    await expect(page.getByRole('heading', { name: 'Open' }).or(page.locator('text=Cancel'))).toBeVisible()
  })

  test('File > New Folder creates a folder', async ({ page }) => {
    // Click File menu
    await page.locator('text=File').first().click()
    
    // Click New Folder
    await page.locator('text=New Folder').click()
    
    // New folder icon should appear
    await expect(page.locator('text=New Folder').first()).toBeVisible()
  })

  test('File > Close closes active window', async ({ page }) => {
    // First open a window (Calculator)
    await page.getByText('Calculator').first().dblclick()
    await expect(page.locator('button:has-text("=")')).toBeVisible()
    
    // Click File menu
    await page.locator('text=File').first().click()
    
    // Click Close
    await page.locator('text=Close').click()
    
    // Calculator window should be closed (no = button visible)
    await expect(page.locator('button:has-text("=")')).not.toBeVisible()
  })
})
