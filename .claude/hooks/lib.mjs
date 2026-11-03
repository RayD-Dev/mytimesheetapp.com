// Shared helpers for the project hooks. Hooks read the event as JSON on stdin and answer with JSON on stdout.
import { readFileSync } from 'node:fs'
import { relative, resolve, isAbsolute } from 'node:path'

export function readEvent() {
  try {
    return JSON.parse(readFileSync(0, 'utf8'))
  } catch {
    return {}
  }
}

export function projectDir(event) {
  return resolve(process.env.CLAUDE_PROJECT_DIR ?? event.cwd ?? process.cwd())
}

// Repo-relative path with forward slashes, or null when the file is outside the repo.
export function repoPath(event, file) {
  if (typeof file !== 'string' || file === '') return null
  const root = projectDir(event)
  const rel = relative(root, isAbsolute(file) ? file : resolve(root, file)).replaceAll('\\', '/')
  return rel.startsWith('..') ? null : rel
}

export function answer(output) {
  process.stdout.write(JSON.stringify(output))
}

export function permission(decision, reason) {
  answer({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: decision,
      permissionDecisionReason: reason,
    },
  })
}
