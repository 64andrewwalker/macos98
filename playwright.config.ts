import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E Test Configuration
 * 
 * Usage:
 * - Start dev server: pnpm dev
 * - Run tests: pnpm test:e2e
 * - Run with UI: pnpm test:e2e:ui
 * - View report: pnpm test:e2e:report
 * 
 * For CI, set CI=true to auto-start the server.
 */

const PORT = process.env.PORT || '5173'
const BASE_URL = `http://localhost:${PORT}/macos98/`

export default defineConfig({
  testDir: './e2e',
  
  // Run tests in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter to use
  reporter: process.env.CI ? 'github' : 'html',
  
  // Global timeout for each test
  timeout: 30 * 1000,
  
  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: BASE_URL,
    
    // Collect trace when retrying the failed test
    trace: 'on-first-retry',
    
    // Take screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Run your local dev server before starting the tests (CI only)
  ...(process.env.CI ? {
    webServer: {
      command: `pnpm dev --port ${PORT}`,
      url: BASE_URL,
      reuseExistingServer: false,
      timeout: 120 * 1000,
    }
  } : {}),
})
