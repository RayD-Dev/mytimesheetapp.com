import { defineConfig } from '@playwright/test'

// Runs the Keycloak specs alone against the local Keycloak (keycloak/compose.yml):
//   pnpm exec playwright test -c e2e/keycloak/playwright.config.ts
// Each spec sets its own viewport, so the same specs also run under the root config.
export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  projects: [{ name: 'keycloak' }],
  reporter: [['list']],
  outputDir: '../../test-results/keycloak',
})
