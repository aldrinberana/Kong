import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import * as dotenv from 'dotenv';

//dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, 
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 1,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: process.env.KONG_MANAGER_URL ?? 'http://localhost:8002',
    headless: process.env.HEADLESS !== 'false',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],
  // Global setup/teardown hooks
  globalSetup: path.resolve(__dirname, 'utils/global-setup.ts'),
  globalTeardown: path.resolve(__dirname, 'utils/global-teardown.ts'),
});