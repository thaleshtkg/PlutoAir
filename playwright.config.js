/**
 * Playwright Test Configuration
 * For end-to-end validation of Flight Booking Application
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './AutomationTests/E2ETests/Browser',
  testMatch: '**/*.spec.js',
  
  // Maximum time one test can run
  timeout: 120000, // 2 minutes
  
  // Test execution settings
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Run tests sequentially
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'test-results/html' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],
  
  // Shared settings for all tests
  use: {
    // Base URL for navigation
    baseURL: 'http://localhost:5173',
    
    // Browser context options
    viewport: { width: 1280, height: 720 },
    
    // Collect trace on failure
    trace: 'retain-on-failure',
    
    // Screenshots
    screenshot: 'only-on-failure',
    
    // Video recording
    video: 'retain-on-failure',
    
    // Navigation timeout
    navigationTimeout: 30000,
    
    // Action timeout
    actionTimeout: 10000,
  },

  // Keep test artifacts outside reporter folder.
  outputDir: 'test-artifacts',

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment to test on other browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Run local dev servers before starting tests (optional)
  // webServer: [
  //   {
  //     command: 'cd frontend && npm run dev',
  //     url: 'http://localhost:5173',
  //     reuseExistingServer: !process.env.CI,
  //     timeout: 120000,
  //   },
  //   {
  //     command: 'cd backend && npm run dev',
  //     url: 'http://localhost:5000',
  //     reuseExistingServer: !process.env.CI,
  //     timeout: 120000,
  //   },
  // ],
});
