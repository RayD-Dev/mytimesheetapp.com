// Keeps AI attribution out of commits and PRs, and asks before anything leaves the machine or merges.
import { permission, readEvent } from './lib.mjs'

const command = readEvent().tool_input?.command ?? ''

const writesHistory = /\bgit\b[^\n|;&]*\bcommit\b|\bgh\s+pr\s+(create|edit)\b/.test(command)
const attribution = /co-authored-by:\s*claude|generated (with|by)[^\n]*claude|noreply@anthropic\.com|claude code|\u{1F916}/iu

if (writesHistory && attribution.test(command)) {
  permission('deny', 'No AI attribution in commits or PRs. Remove the Claude trailer or "generated with" line and run it again.')
} else if (/\bgit\b[^\n|;&]*\bpush\b/.test(command)) {
  const forced = /\s(--force\b|--force-with-lease\b|-f\b)/.test(command)
  permission('ask', forced ? 'Force push rewrites remote history. Confirm with the user.' : 'Push only when the user has asked for it.')
} else if (/\bgh\s+pr\s+merge\b/.test(command)) {
  permission('ask', 'Merge only when the user has approved the slice.')
}
