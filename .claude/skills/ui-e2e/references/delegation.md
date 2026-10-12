# Delegating to sub-agents

The main session plans, decides and reviews. Sub-agents on cheaper models do the work they can do from a written brief. The user-level agents in `~/.claude/agents/` and the delegation rule in `~/.claude/CLAUDE.md` apply; this file adds what's specific to UI work.

## Who does what

| Agent | Model | Give it |
|---|---|---|
| `implementer` | Sonnet | One plan task: components, pages, stores, tests, fixes until the check passes, applying review findings; also screen specs from an approved mock-up |
| `mechanic` | Haiku | Exact-spec edits: fixtures and worst-case data, renames, wiring generated API code, commit messages from a diff |
| `runner` | Haiku | The check commands: type-check, lint, tests, build, the ui-audit scan, ui-visual-check captures. Failures come back summarised |
| `Explore` | Haiku | Finding things: where a component is used, what the mock-up page shows in a state, what a doc section says |

**Stays in the main session:**
- briefs, plans and settling ambiguity
- design calls, and judging screenshots against the approved ones
- unknown-cause debugging
- sign-in, permissions, approvals and data access
- reviewing every result
- jobs of about 20 lines or fewer, where briefing costs more than doing

**If an agent type isn't found** (the session started before the agent was added), use `general-purpose` with `model: sonnet` or `model: haiku` to match the table. Paste the working rules from `~/.claude/agents/<name>.md` at the top of the brief. Never run `general-purpose` without a model; it would use the main session's model.

## Writing the brief

Sub-agents don't see the conversation, so every brief names:

1. **Files:** what to read first and what it may change. Each task owns its files.
2. **The task:** what to build, the decisions already made, and the acceptance criteria it covers, copied in rather than referenced vaguely.
3. **Rules to follow:** `.claude/skills/ui-e2e/references/standards.md`. For UI, also `ui-craft` and `ui-motion`, the page's `docs/screens/<page>.md`, and its approved screenshots in `mockup/approved/`.
4. **The check command**, and what passing means.
5. **What to send back:** files changed with one line each, the check result, and anything skipped or uncertain. No full logs or pasted code.

If the plan task is written well, the brief is mostly that task copied in. A brief that needs a long explanation means the plan is missing something; fix the plan instead.

## When a result comes back

Check, in this order:
1. The diff touches only the task's files.
2. Tests exist for each acceptance criterion it covers, and they test behaviour by role and label.
3. The standards ranking was followed where it applies. Look especially for hand-written API types, guards for impossible states, comments that restate code, and long expressions.
4. No dependency was added that the plan didn't name.
5. For UI: the screen matches the approved screenshot at both widths (ui-visual-check), or the difference is listed in the spec's "Changes since approval".

A task that fails its check twice comes back to the main session. Don't send it to the same agent a third time.

## Running in parallel

Send independent tasks in one message, so they run at the same time. Two writing agents never share a file. The runner can check one task while the implementer builds the next, as long as the files don't overlap.
