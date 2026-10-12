# Plan: end-to-end UI skill (mock-up → plan code → write code)

**Status:** decisions in progress, 12/10/2026. Build after the UI Design session finishes. Includes `upstream-ui-skills.md`.

**Goal:** one repeatable loop, Brief → Design → Plan → Build → QA, that reuses the five `ui-*` skills. The Opus session does the thinking (briefs, plans, design calls, reviews). Sonnet sub-agents write code and run commands.

## Decided

| ID | Decision |
|---|---|
| F1 | Git repo at the project root, branch `main` (done 12/10/2026; no commits yet). |
| F2 | Notion stays the master, because comments there are how feedback is given. A read-only copy goes in `docs/`, refreshed by one command, plus a one-page requirements index (one line per FR, decision and roadmap item) that plans cite by ID. |
| F3 | The FE doc's open sections (§3 sign-in, §5 structure, §7 API client, §8 state, §10 testing, §11 build, package manager) are proposed once by the Plan step, decided by the user, logged in the FE doc's decision log, and settled before slice 1 code. |
| D1 | Keep the code-first mock-up; no Figma MCP. Revisit only if a human designer joins or feedback needs to happen in Figma. |
| D2 | Execute `upstream-ui-skills.md` as written (D1–D5 accepted). |
| P3 | "Seams, not features": each plan lists the roadmap items its code affects and leaves room only where it's free (weekdays and period length from the API, validation in one module, access checked by role). Nothing built ahead of its milestone. |
| P4 | On every change: type-check and lint, unit tests, `ui-audit` scan. At the end of each slice, all seven must pass: type-check and lint, unit tests (test-first for formatters and hour calculations), component tests, end-to-end tests at 375px and desktop, comparison with approved mock-up screenshots, `ui-audit`, automated accessibility checks. |
| A1 | One thin coordinating skill that reuses the `ui-*` skills unchanged, with brief and plan templates and coding standards as reference files. |
| A2 | The user approves the brief, the mock-up, the plan, and the finished slice in the browser. Checks run automatically in between. This also answers P1: briefs are approved. |
| P2 | Coding qualities rank **Tests → Readable → Defensive → Maintainable → Short** (user's choices, 12/10/2026). Resolutions in "Coding standards" below; they become the skill's standards reference file. |
| P2a | API responses are validated at run time (defensive wins). To keep one source of truth, the runtime schemas are generated from the OpenAPI spec alongside the types, never hand-written. The generator is chosen with the API client (F3, FE doc §7). |
| P2b | TypeScript `strict` plus `noUncheckedIndexedAccess`. |
| W1–W3 | Use the user-level agents from `~/.claude/agents/` under the delegation rule in `~/.claude/CLAUDE.md`: `implementer` (Sonnet) writes code from the plan; `runner` (Haiku) runs checks; `mechanic` (Haiku) does fixtures and renames; `Explore` (Haiku) searches. Two failed checks take the task back to the main session. Add a project-level agent only for UI-specific instructions the `ui-*` skills don't already carry. |
| W4 | Token rules: short main file; references load only at the step that needs them; docs through the index; upstream skills read by section; screenshots only of changed screens. |

## Coding standards (P2)

When qualities conflict, the higher one wins: **Tests → Readable → Defensive → Maintainable → Short.**

| Conflict | Winner | Rule |
|---|---|---|
| Readable vs short (expressions) | Readable | Name a step when a line holds more than one idea. "Short" means fewer layers and files, not denser lines. |
| Readable vs short (types) | Readable | Write types on exported functions, component props and events, API calls, and any local whose type isn't obvious at a glance. Trivial locals stay inferred. |
| Defensive vs short | Defensive | Check every value where it enters: API responses (P2a), form input, the URL, and values from third-party components (time input, signature pad). Extra lines are accepted. |
| Defensive vs readable | Readable | Failure handling lives in one module per concern (for example autosave: debounce, retry, version conflict, "Not saved", leave warning) that exposes a plain status. Screens show the status; main paths stay flat with early returns. |
| Defensive vs maintainable (duplicate rules) | Defensive | Keep FR-09 validation in the browser and on the server. Limit drift with one front-end validation module tested against the server's shared cases. The server's verdict wins. |
| Defensive vs maintainable (API checks) | Defensive | Runtime validation of API responses, generated from the spec (P2a). |
| Defensive vs short (strict TypeScript) | Defensive | `noUncheckedIndexedAccess` on (P2b). |
| Maintainable vs short | Maintainable | A rule or concept that appears twice gets one shared module, even at the cost of more files. Formatters, hour calculations and validation are shared from day one. Code that only looks alike stays separate. Future seams only where free (P3). |
| Maintainable vs readable (splitting) | Readable | Split by the parts the domain names (day row, week totals, submit review), not by line count. A page file reads top to bottom. |
| Tests vs short and readable | Tests | Tests find elements by role and label, which doubles as an accessibility check. Logic lives in plain functions tested directly. Test behaviour from acceptance criteria, not internals. |
| Defensive vs tests | Tests | No guards for states the types already rule out; make impossible states unrepresentable instead, so every branch can be tested. |
| Intent vs short (comments) | Why only | Comment only why, mostly requirement links (`// FR-27: warn, never block`). Never restate what the code does. |

## Open

| ID | Question | Recommendation |
|---|---|---|
| D3 | A spec file per screen in `docs/screens/`, with `DESIGN.md` keeping only app-wide rules | Yes. |
| P5 | Scope: front end only, with an API-spec step; back-end skill later | Yes. |
| A1a | Skill name | `ui-e2e`. |
| G1 | First commit: now (UI Design mid-round) or after UI Design finishes | After UI Design finishes, so the first commit is a settled state. |
| U3 | Upstream plan D3 makes *Submit timesheet* enabled (says what's missing on press), changing Round 2's approved design | Keep the change; it goes through a mock-up round before it's built. |
