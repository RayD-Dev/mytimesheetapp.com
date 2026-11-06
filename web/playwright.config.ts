import { defineConfig } from '@playwright/test'

// Projects (phone and desktop sizes) and the web server come with the end-to-end suite.
export default defineConfig({
  testDir: 'e2e',
  // The Keycloak specs need the local Keycloak: pnpm test:e2e:keycloak.
  testIgnore: 'keycloak/**',
})
