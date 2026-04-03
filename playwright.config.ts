import { defineConfig, devices } from '@playwright/test'

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import 'dotenv/config'

const playwrightBaseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3100'
const defaultWebServerCommand =
  process.platform === 'win32'
    ? 'cmd /c "npm run build && npm run start -- --hostname localhost --port 3100"'
    : 'npm run build && npm run start -- --hostname localhost --port 3100'

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Keep the suite deterministic locally because tests share seeded Payload state. */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: playwrightBaseURL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
  ],
  webServer: {
    command: process.env.PLAYWRIGHT_WEB_SERVER_COMMAND || defaultWebServerCommand,
    reuseExistingServer: false,
    timeout: 300_000,
    url: playwrightBaseURL,
  },
})
