import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { findMockLeaks } from './check-build'

let dist: string

beforeEach(() => {
  dist = mkdtempSync(join(tmpdir(), 'dist-'))
  mkdirSync(join(dist, 'assets'))
  writeFileSync(join(dist, 'assets', 'index.js'), 'console.log(1)')
  writeFileSync(join(dist, 'assets', 'index.js.map'), '{"sources":["../src/main.ts"]}')
})

afterEach(() => rmSync(dist, { recursive: true, force: true }))

it('passes when the build holds no mock files', () => {
  expect(findMockLeaks(dist)).toEqual([])
})

it('fails when the MSW worker file is in the build', () => {
  writeFileSync(join(dist, 'mockServiceWorker.js'), '')
  expect(findMockLeaks(dist)).toHaveLength(1)
})

it('fails when a source map lists a file from src/mocks', () => {
  writeFileSync(join(dist, 'assets', 'index.js.map'), '{"sources":["../src/mocks/handlers.ts"]}')
  expect(findMockLeaks(dist)).toHaveLength(1)
})
