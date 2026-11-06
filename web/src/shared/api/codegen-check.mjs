// Regenerates into a scratch folder and fails when it differs from the committed generated/.
import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const here = import.meta.dirname
const scratch = join(here, 'generated-check')

// Line endings are ignored so a Windows checkout compares equal.
const readTree = (root) =>
  new Map(
    readdirSync(root, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => {
        const file = join(entry.parentPath, entry.name)
        return [file.slice(root.length), readFileSync(file, 'utf8').replaceAll('\r', '')]
      }),
  )

let stale
try {
  rmSync(scratch, { recursive: true, force: true })
  const run = spawnSync('pnpm', ['exec', 'orval'], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, CODEGEN_DIR: 'generated-check' },
  })
  if (run.status !== 0) process.exit(run.status ?? 1)

  const fresh = readTree(scratch)
  const committed = existsSync(join(here, 'generated')) ? readTree(join(here, 'generated')) : new Map()
  stale = [...new Set([...fresh.keys(), ...committed.keys()])].filter(
    (file) => !file.endsWith('.gitattributes') && fresh.get(file) !== committed.get(file),
  )
} finally {
  rmSync(scratch, { recursive: true, force: true })
}

if (stale.length > 0) {
  console.error(`generated/ is out of date, run pnpm codegen. Differs: ${stale.join(', ')}`)
  process.exit(1)
}
console.log('codegen:check: generated/ matches the contract')
