import { expect, test } from '@playwright/test'
import {
  authUrl, captureState, expectNoSidewaysScroll, fillSignIn, logoutUrl, password, sizes, stubAppCallback, users,
} from './keycloak'

// AC-25 (first part): sign in, wrong password, signed out and deactivated, at both sizes.
// The approved screenshots are compared by eye (captureState); these specs check what the
// design says in words: copy, roles, red fields, control height and no sideways scroll.
const danger = 'rgb(179, 38, 30)'

for (const size of sizes) {
  test.describe(`Keycloak sign-in at ${size.name}`, () => {
    test.use({ viewport: { width: size.width, height: size.height } })

    test.beforeEach(async ({ page }) => {
      await stubAppCallback(page)
      await page.goto(authUrl())
    })

    test('sign in shows the sheet with email, password and the forgot link', async ({ page }, testInfo) => {
      await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()
      await expect(page.getByText('Timesheets', { exact: true })).toBeVisible()
      await expect(page.getByLabel('Email')).toBeVisible()
      await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Forgot your password?' })).toBeVisible()
      await expect(page.getByRole('alert')).toHaveCount(0)

      const button = await page.getByRole('button', { name: 'Sign in' }).boundingBox()
      expect(button?.height).toBe(size.controlHeight)
      await expectNoSidewaysScroll(page)
      await captureState(page, testInfo, 'sign-in', size.name)
    })

    test('the eye button shows and hides the password', async ({ page }) => {
      const field = page.getByLabel('Password', { exact: true })
      await expect(field).toHaveAttribute('type', 'password')
      await page.getByRole('button', { name: 'Show password' }).click()
      await expect(field).toHaveAttribute('type', 'text')
      await page.getByRole('button', { name: 'Hide password' }).click()
      await expect(field).toHaveAttribute('type', 'password')
    })

    test('an empty form asks for each field and focuses the first', async ({ page }) => {
      await page.getByRole('button', { name: 'Sign in' }).click()
      await expect(page.getByText('Enter your email address.')).toBeVisible()
      await expect(page.getByText('Enter your password.')).toBeVisible()
      await expect(page.getByLabel('Email')).toBeFocused()
      await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true')

      await page.getByLabel('Email').fill('not-an-email')
      await page.getByRole('button', { name: 'Sign in' }).click()
      await expect(page.getByText('Enter an email address, like name@example.com.')).toBeVisible()
    })

    test('a wrong password keeps the email, turns both fields red and explains in the alert', async ({ page }, testInfo) => {
      await fillSignIn(page, users.employee, 'not-the-password-1')

      await expect(page.getByRole('alert')).toContainText("That email and password don't match. Try again, or reset your password.")
      const email = page.getByLabel('Email')
      const pass = page.getByLabel('Password', { exact: true })
      await expect(email).toHaveValue(users.employee)
      await expect(email).toHaveAttribute('aria-invalid', 'true')
      await expect(pass).toHaveAttribute('aria-invalid', 'true')
      await expect(email).toHaveCSS('border-top-color', danger)
      await expect(pass).toHaveCSS('border-top-color', danger)
      await expect(page.locator('.field-error:not([hidden])')).toHaveCount(0)
      await expectNoSidewaysScroll(page)
      await captureState(page, testInfo, 'wrong-password', size.name)

      // A correct sign-in afterwards also clears Keycloak's failed-attempt count for this user.
      await pass.fill(password)
      await page.getByRole('button', { name: 'Sign in' }).click()
      await page.waitForURL(/localhost:8080\/login\/oauth2\/code\/keycloak/)
    })

    test('after Sign out the page says so and offers Sign in', async ({ page }, testInfo) => {
      await fillSignIn(page, users.employee, password)
      await page.waitForURL(/localhost:8080\/login\/oauth2\/code\/keycloak/)

      await page.goto(logoutUrl)
      await page.getByRole('button', { name: /sign out|log ?out/i }).click()

      await expect(page.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible()
      await expect(page.getByRole('status')).toContainText("You've signed out.")
      await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible()
      await expectNoSidewaysScroll(page)
      await captureState(page, testInfo, 'signed-out', size.name)
    })

    test('a deactivated account gets the deactivated alert and no session', async ({ page }, testInfo) => {
      await fillSignIn(page, users.deactivated, password)

      const alert = page.getByRole('alert')
      await expect(alert).toContainText('This account has been deactivated')
      await expect(alert).toContainText("You can't sign in any more. If you think that's a mistake, ask your manager.")
      await expect(page).not.toHaveURL(/localhost:8080/)
      await expectNoSidewaysScroll(page)
      await captureState(page, testInfo, 'deactivated', size.name)
    })
  })
}
