import { createHash } from 'node:crypto'
import { expect, type Page, type TestInfo } from '@playwright/test'

// Test values from keycloak/realm/timesheet-realm.json. They exist only in the local realm.
export const keycloakUrl = process.env.KEYCLOAK_URL ?? 'http://localhost:8180'
export const password = 'timesheet-test-1'
export const users = {
  employee: 'priya.rk@example.com',
  deactivated: 'dana.former@example.com',
} as const

export const sizes = [
  { name: '375x812', width: 375, height: 812, controlHeight: 44 },
  { name: '1280x800', width: 1280, height: 800, controlHeight: 36 },
] as const

const redirectUri = 'http://localhost:8080/login/oauth2/code/keycloak'
const codeVerifier = 'a'.repeat(64)

/** The authorization request the app's server sends: code flow with PKCE, as the realm requires. */
export function authUrl(): string {
  const params = new URLSearchParams({
    client_id: 'timesheet-web',
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid',
    state: 'e2e',
    code_challenge: createHash('sha256').update(codeVerifier).digest('base64url'),
    code_challenge_method: 'S256',
  })
  return `${keycloakUrl}/realms/timesheet/protocol/openid-connect/auth?${params}`
}

export const logoutUrl = `${keycloakUrl}/realms/timesheet/protocol/openid-connect/logout?client_id=timesheet-web`

/** Nothing listens on the app's callback address here, so answer it ourselves. */
export async function stubAppCallback(page: Page): Promise<void> {
  await page.route(`${redirectUri}*`, (route) => route.fulfill({ status: 200, body: 'signed in' }))
}

export async function fillSignIn(page: Page, email: string, pass: string): Promise<void> {
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password', { exact: true }).fill(pass)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

export async function expectNoSidewaysScroll(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
  expect(overflow).toBeLessThanOrEqual(0)
}

/** Saved beside the report for the side-by-side read against mockup/approved/sign-in-state-*. */
export async function captureState(page: Page, testInfo: TestInfo, state: string, size: string): Promise<void> {
  const path = testInfo.outputPath(`sign-in-state-${state}@${size}.png`)
  await page.screenshot({ path, fullPage: true })
  await testInfo.attach(`sign-in-state-${state}@${size}`, { path, contentType: 'image/png' })
}
