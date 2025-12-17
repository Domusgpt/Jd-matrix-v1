import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;
const HOST = '0.0.0.0';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  fullyParallel: true,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${PORT}`,
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `API_KEY=${process.env.API_KEY || 'dummy'} npm run dev -- --host ${HOST} --port ${PORT}`,
    port: PORT,
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
