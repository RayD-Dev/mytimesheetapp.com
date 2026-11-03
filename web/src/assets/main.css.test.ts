import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const css = readFileSync('src/assets/main.css', 'utf8') // vitest runs from web/

// The colour roles DESIGN.md section 4 names. Components use them as bg-sheet, text-ink-muted and so on.
const colourRoles = [
  'paper', 'sheet', 'ink', 'ink-muted', 'rule', 'control-border',
  'accent', 'caution', 'caution-bg', 'danger', 'approved', 'info',
]

it.each(colourRoles)('defines the %s colour token', (role) => {
  expect(css).toMatch(new RegExp(`--color-${role}: *#[0-9A-Fa-f]{6}`))
})

it('defines the font families', () => {
  for (const font of ['sans', 'mono', 'signature']) expect(css).toContain(`--font-${font}:`)
})

it('keeps theme tokens static so every utility exists without being referenced', () => {
  expect(css).toContain('@theme static')
})

it('removes motion offsets when the user prefers reduced motion', () => {
  expect(css).toMatch(/prefers-reduced-motion: reduce\)[^}]*--motion-rise: 0px/)
})
