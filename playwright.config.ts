import { defineConfig } from '@playwright/test'
const production = Boolean(process.env.ALE_PRODUCTION)
const port = production ? 4173 : 5173
const url = `http://127.0.0.1:${port}`
export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './build/test-results',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  use: { baseURL: url, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: {
    command: `npm run ${production ? 'preview' : 'dev'} -- --host 127.0.0.1 --port ${port} --strictPort`,
    url,
    reuseExistingServer: !production && !process.env.CI,
  },
})
