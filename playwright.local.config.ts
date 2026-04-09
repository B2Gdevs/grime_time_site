import { defineConfig } from '@playwright/test'

import baseConfig from './playwright.config'

const webServer =
  !baseConfig.webServer || Array.isArray(baseConfig.webServer)
    ? baseConfig.webServer
    : {
        ...baseConfig.webServer,
        reuseExistingServer: true,
      }

export default defineConfig({
  ...baseConfig,
  ...(webServer ? { webServer } : {}),
})
