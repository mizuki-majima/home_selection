import { defineConfig, devices } from '@playwright/test';

// ローカルにブラウザが入っている場合は PW_CHROMIUM_PATH で指定できる
const executablePath = process.env.PW_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:4321/home_selection/',
    launchOptions: { executablePath },
  },
  webServer: {
    command: 'npm run preview -- --port 4321',
    url: 'http://localhost:4321/home_selection/',
    reuseExistingServer: true,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
});
