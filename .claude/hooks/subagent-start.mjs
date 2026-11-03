// Reminds every sub-agent of the working rules before it starts, so a short brief still carries them.
import { answer, readEvent } from './lib.mjs'

const event = readEvent()

const rules = [
  'Project rules (hook reminder, they apply on top of your brief):',
  '- Read .claude/skills/ui-e2e/references/standards.md. It wins over ponytail and pstack wherever they differ (ranking: Tests, Readable, Defensive, Maintainable, Short).',
  '- Read .claude/skills/ui-e2e/references/engineering-practices.md for how ponytail and pstack are used here. Read only the skill files your brief names.',
  '- Never commit, push, merge or open a PR. Report back and the main session decides.',
  '- Never mention Claude or AI in code, comments, docs or commit text.',
  '- Never hand-edit web/src/shared/api/generated/ (regenerate it) or docs/notion/.',
]

if (event.agent_type === 'general-purpose') {
  rules.push('- You are a read-only reviewer: do not edit files. Send back a short, ranked list of findings.')
}

answer({ hookSpecificOutput: { hookEventName: 'SubagentStart', additionalContext: rules.join('\n') } })
