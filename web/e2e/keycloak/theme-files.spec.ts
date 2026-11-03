import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

// Static checks on the theme and realm files. They need no Keycloak, so they guard the
// parts a typo would only show up in a running Keycloak.
const keycloakDir = join(import.meta.dirname, '..', '..', '..', 'keycloak')
const read = (...path: string[]): string => readFileSync(join(keycloakDir, ...path), 'utf8')
const login = (file: string): string => read('theme', 'timesheet', 'login', file)

const wrongPassword = "That email and password don''t match. Try again, or reset your password."

test('the signed-out line uses the key Keycloak sends after logout', () => {
  const messages = login('messages/messages_en.properties')
  expect(messages).toContain("successLogout=You''ve signed out.")
  expect(messages).not.toContain('loggedOutMessage')
  expect(login('info.ftl')).toContain('msg("successLogout")')
})

test('the masthead treats the realm name as "no business name"', () => {
  expect(login('template.ftl')).toContain('(realm.displayName != realm.name)?then(realm.displayName, "")')
})

test('lockouts and unknown users share the wrong-password wording', () => {
  const messages = login('messages/messages_en.properties')
  for (const key of ['invalidUserMessage', 'invalidPasswordMessage', 'accountTemporarilyDisabledMessage', 'accountPermanentlyDisabledMessage']) {
    expect(messages).toContain(`${key}=${wrongPassword}`)
  }
})

test('the shell shows the attempted username and a real button for another way', () => {
  const template = login('template.ftl')
  expect(template).toContain('auth.attemptedUsername')
  expect(template).toContain('url.loginRestartFlowUrl')
  expect(template).toContain('<button type="submit" id="try-another-way"')
  expect(template).not.toContain('href="#"')
  expect(login('login.ftl')).toContain('<#if !usernameHidden??>')
})

test('the info page sanitises a message header', () => {
  expect(login('info.ftl')).toContain('${kcSanitize(msg(messageHeader))?no_esc}')
})

test('failed sign-ins point both fields at the alert', () => {
  const form = login('login.ftl')
  expect(form.match(/aria-describedby="(username|password)-error\$\{alertRef\}"/g)).toHaveLength(2)
  expect(login('template.ftl')).toContain('id="kc-alert"')
})

test('the realm is local-only and keeps names and passwords inside the app', () => {
  const realm = JSON.parse(read('realm', 'timesheet-realm.local.json'))
  const profileConfig = realm.components['org.keycloak.userprofile.UserProfileProvider'][0].config['kc.user.profile.config'][0]
  const attributes: { name: string; permissions: { edit: string[] } }[] = JSON.parse(profileConfig).attributes
  for (const name of ['firstName', 'lastName']) {
    expect(attributes.find((attribute) => attribute.name === name)?.permissions.edit).toEqual(['admin'])
  }
  expect(realm.bruteForceProtected).toBe(true)
  expect(realm.users.map((user: { username: string }) => user.username)).toContain('lockout.test@example.com')

  const compose = read('compose.yml')
  expect(compose.split('\n')[0]).toMatch(/LOCAL IMPORT ONLY, TEST CREDENTIALS/)
  expect(compose).toContain('./realm:/opt/keycloak/data/import:ro')
  expect(compose).not.toMatch(/:9000"/)
})
