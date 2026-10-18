# Plan: end-to-end UI skill (mock-up → plan code → write code)

**Status:** decisions in progress, 12/10/2026. Build after the UI Design session finishes. Includes `upstream-ui-skills.md`.

**Goal:** one repeatable loop, Brief → Design → Plan → Build → QA, that reuses the five `ui-*` skills. The Opus session does the thinking (briefs, plans, design calls, reviews). Sonnet sub-agents write code and run commands.

## Decided

| ID | Decision |
|---|---|
| F1 | Git repo at the project root, branch `main` (done 12/10/2026; no commits yet). |
| F2 | Notion stays the master, because comments there are how feedback is given. A read-only copy goes in `docs/`, refreshed by one command, plus a one-page requirements index (one line per FR, decision and roadmap item) that plans cite by ID. |
| F3 | The FE doc's open sections (section 3 sign-in, section 5 structure, section 7 API client, section 8 state, section 10 testing, section 11 build, package manager) are proposed once by the Plan step, decided by the user, logged in the FE doc's decision log, and settled before slice 1 code. |
| D1 | Keep the code-first mock-up; no Figma MCP. Revisit only if a human designer joins or feedback needs to happen in Figma. |
| D2 | Execute `upstream-ui-skills.md` as written (D1–D5 accepted). |
| P3 | "Seams, not features": each plan lists the roadmap items its code affects and leaves room only where it's free (weekdays and period length from the API, validation in one module, access checked by role). Nothing built ahead of its milestone. |
| P4 | On every change: type-check and lint, unit tests, `ui-audit` scan. At the end of each slice, all seven must pass: type-check and lint, unit tests (test-first for formatters and hour calculations), component tests, end-to-end tests at 375px and desktop, comparison with approved mock-up screenshots, `ui-audit`, automated accessibility checks. |
| A1 | One thin coordinating skill that reuses the `ui-*` skills unchanged, with brief and plan templates and coding standards as reference files. |
| A2 | The user approves the brief, the mock-up, the plan, and the finished slice in the browser. Checks run automatically in between. This also answers P1: briefs are approved. |
| P2 | Coding qualities rank **Tests → Readable → Defensive → Maintainable → Short** (user's choices, 12/10/2026). Resolutions in "Coding standards" below; they become the skill's standards reference file. |
| P2a | API responses are validated at run time (defensive wins). To keep one source of truth, the runtime schemas are generated from the OpenAPI spec alongside the types, never hand-written. The generator is chosen with the API client (F3, FE doc section 7). |
| P2b | TypeScript `strict` plus `noUncheckedIndexedAccess`. |
| W1–W3 | Use the user-level agents from `~/.claude/agents/` under the delegation rule in `~/.claude/CLAUDE.md`: `implementer` (Sonnet) writes code from the plan; `runner` (Haiku) runs checks; `mechanic` (Haiku) does fixtures and renames; `Explore` (Haiku) searches. Two failed checks take the task back to the main session. Add a project-level agent only for UI-specific instructions the `ui-*` skills don't already carry. |
| W4 | Token rules: short main file; references load only at the step that needs them; docs through the index; upstream skills read by section; screenshots only of changed screens. |

## Coding standards (P2)

The ranking **Tests → Readable → Defensive → Maintainable → Short**, the conflict rules, the future-milestone seams and the check gates live in `.claude/skills/ui-e2e/references/standards.md`. That file is the single source.

## Decided 12/10/2026 ("lets just do it": recommendations adopted)

| ID | Decision |
|---|---|
| D3 | A spec file per screen in `docs/screens/<page>.md`, from the ui-e2e screen-spec template. `DESIGN.md` keeps only app-wide rules. |
| P5 | `ui-e2e` covers the front end, with an API-contract step. A back-end skill comes later. |
| A1a | Skill name `ui-e2e`; the docs command is a separate `docs-sync` skill. |
| G1 | The mock-up was frozen and committed on `main` (342c053). Tooling is built on branch `ui-tooling`, which merges when the user approves it. |
| U3 | *Submit timesheet* stays enabled and points to what's missing when pressed early. This changes Round 2's approved design, so the user sees it in mock-up round R7, and the affected screenshots are replaced, before it's built. |

## Build status

Built on `ui-tooling`, 12/10/2026:
- The upstream-skills plan: 12 skills vendored, with manifest, patches and `sync.mjs`.
- `ui-*` integration.
- Four new scanner rules.
- `ui-e2e`: SKILL.md plus standards, brief, plan, screen-spec and delegation references.
- `docs-sync`, and the first copy of the Notion docs into `docs/`.

Next, through `ui-e2e`:
1. Round R7 for U3.
2. Screen specs for the five pages.
3. Slice 1's brief, which also settles the FE doc's open questions and brings the FE doc up to date with the mock-up decisions.
