// Tests run against the local server at phone, tablet and desktop width.
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests', timeout: 30000,
  webServer: { command: 'node scripts/serve.mjs 8099', url: 'http://localhost:8099', reuseExistingServer: true },
  use: { baseURL: 'http://localhost:8099', serviceWorkers: 'block' },
  projects: [
    { name: 'phone', use: { viewport: { width: 380, height: 800 }, isMobile: true, hasTouch: true } },
    { name: 'tablet', use: { viewport: { width: 820, height: 1180 } } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 900 } } },
  ],
});
