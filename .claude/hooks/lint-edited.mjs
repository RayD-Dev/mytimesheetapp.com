// After an edit to a web/src .ts or .vue file, lint just that file and hand any problems back to the model.
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { answer, projectDir, readEvent, repoPath } from './lib.mjs'

const MAX_LINES = 40

const event = readEvent()
const path = repoPath(event, event.tool_input?.file_path)
if (!path || !/^web\/src\/.+\.(ts|vue)$/.test(path) || path.startsWith('web/src/shared/api/generated/')) process.exit(0)

const webDir = join(projectDir(event), 'web')
const eslint = join(webDir, 'node_modules', 'eslint', 'bin', 'eslint.js')
if (!existsSync(eslint)) process.exit(0) // not installed yet, nothing to run

const run = spawnSync(process.execPath, [eslint, '--no-warn-ignored', path.replace(/^web\//, '')], {
  cwd: webDir,
  encoding: 'utf8',
  timeout: 60_000,
})
if (run.status === 0) process.exit(0)

const report = (run.stdout || run.stderr || 'eslint did not finish').trim().split('\n').slice(0, MAX_LINES).join('\n')
answer({ decision: 'block', reason: `eslint found problems in ${path}. Fix them:\n${report}` })
