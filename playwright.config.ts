import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  globalSetup: './e2e/global-setup.ts',
  use: {
    baseURL: 'https://localhost:8080',
    headless: true,
    // Vite dev uses a self-signed cert in development
    ignoreHTTPSErrors: true,
  },
  webServer: {
    command: 'npm run dev',
    url: 'https://localhost:8080',
    reuseExistingServer: true,
    timeout: 30_000,
    ignoreHTTPSErrors: true,
  },
});
