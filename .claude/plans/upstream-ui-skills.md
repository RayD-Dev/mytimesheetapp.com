# Plan: bring upstream UI skills into our UI loop

**Status:** approved 12/10/2026 (D1–D5 accepted as recommended), not started. Start only after the UI Design session finishes its mock-up rounds, because it uses `.claude/skills/` every round. Part of the end-to-end skill plan in `ui-e2e-skill.md`.

**Goal:** use taste-skill, Emil Kowalski's skills and Vercel's Web Interface Guidelines inside our existing loop (`ui-craft`, `ui-motion`, `ui-audit`, `ui-mockup`, `ui-visual-check`), without overriding decisions already made in `DESIGN.md`.

## Decisions (all accepted 12/10/2026)

| # | Decision | Accepted |
|---|---|---|
| D1 | How to install and update | Pinned copies with reviewed updates (Phase 1). Alternatives: `npx skills add` and `update` (no pinning or diff), or taste-skill's plugin marketplace (installs all 13 of its skills everywhere). |
| D2 | Which skills to bring in | The picks below. |
| D3 | Disabled Submit (Round 2 approved it disabled until every tick is done) | Follow Vercel: keep *Submit timesheet* enabled; on press, say what's missing and focus the first unticked item. A disabled button can't be focused, so screen-reader users never hear why. |
| D4 | Em dashes and "·" in UI copy | Adopt taste-skill's rules: no em dashes, at most one middle dot per line. The scanner enforces both. Today's screens have no em dashes and 2 middle dots. |
| D5 | Weekly update check | Yes: a scheduled task that only reports what changed upstream. |

## Picks

| Source | Bring in | Left out, and why |
|---|---|---|
| [taste-skill](https://github.com/Leonxlnx/taste-skill) | `design-taste-frontend`, `redesign-existing-projects` | The other 11 (v1, gpt-taste, soft, minimalist, brutalist, stitch, output, image and brand generation). They target marketing pages or generate images, and several contradict Ledger or `ui-motion`. |
| [Emil Kowalski](https://github.com/emilkowalski/skill) | `emil-design-eng`, `animate`, `review-animations`, `improve-animations`, `find-animation-opportunities`, `animation-performance`, `animation-vocabulary`, `mobile-native`, `break-ui` | `animate-expo`, `write-swift` (wrong platform); `ask-sonner` (React toast library, and we use Nuxt UI Toast); `apple-design` (gesture-heavy); `prototype` (duplicates `ui-mockup` variants); `pick-ui-library` (React list, and Nuxt UI is already chosen). |
| [Vercel guidelines](https://vercel.com/design/guidelines) | `web-design-guidelines` skill, plus `command.md` (review rules) and `AGENTS.md` (build rules) | The rest of vercel-labs/agent-skills (React, Next.js, deploys). |
| [awesome-design-skills](https://github.com/bergside/awesome-design-skills) | Nothing | 67 generated style presets that would compete with the Ledger direction. |

Versions reviewed on 12/10/2026 (diff against these in Phase 0):

| Repo | Commit | Date |
|---|---|---|
| Leonxlnx/taste-skill | d237dd3 | 11/10/2026 |
| emilkowalski/skill | 2d22863 | 11/10/2026 |
| vercel-labs/web-interface-guidelines | 434b7f9 | 05/10/2026 |
| vercel-labs/agent-skills | 063bee9 | 28/08/2026 |

All four are MIT licensed. A scan found no instructions to fetch, run or install anything, apart from taste-skill's appendix listing install commands for other design systems.

## Phase 0: Before starting

1. Confirm UI Design has finished, or at least has no round in progress.
2. Clone the four repos into the scratchpad and diff each pick against the commit above. Read any changes in full.
3. Read in full the files not yet reviewed: `improve-animations` (with `AUDIT.md` and `PLAN-TEMPLATE.md`), `animation-performance`, `animation-vocabulary`, `animate/RECIPES.md` and `break-ui/CATALOG.md`.

## Phase 1: Install (assuming D1 = pinned copies)

1. Copy each pick unchanged into `.claude/skills/<install-name>/`, keeping the upstream folder contents. Add each repo's `LICENSE` to its folders.
2. Write `.claude/skills/UPSTREAM.md`, a manifest with one row per skill: source repo, path, pinned commit, date, and any local changes.
3. Make only these local changes, and list each in the manifest:
   - `web-design-guidelines`: read the pinned `command.md` next to it instead of downloading the rules on every review.
   - `design-taste-frontend` and `redesign-existing-projects`: add `disable-model-invocation: true`, so they run only when our skills or the user call them. Both are marketing-page skills that could otherwise trigger on "make it look better" and pull in GSAP, grain or stagger.
4. Write `.claude/skills/_upstream/sync.mjs`, using Node and git only:
   - `check` clones each repo shallowly into a temp folder and lists picked skills that changed since their pin, with the diff.
   - `pull <skill>` copies the new version over, re-applies the listed local changes and moves the pin.
   - It never runs anything from the downloaded repos.
5. D5: a weekly scheduled task that runs `check` and reports. It never pulls.

## Phase 2: Integration with our skills

**Rules for every edit:**
- Order of authority: `DESIGN.md` first, then our `ui-*` skills, then upstream skills. Say this once in `ui-craft`, and briefly where each upstream skill is referenced.
- Point at specific sections at specific steps, rather than invoking whole skills. Emil's skills reply only "I'm ready…" when invoked without a question, and `design-taste-frontend` is 1,228 lines, about 23k tokens.

| Our skill | Change |
|---|---|
| `ui-craft` | Add the order of authority. Use Vercel `AGENTS.md` as the quality floor while building; `mobile-native`'s baseline (viewport meta, tap highlight, 16px inputs, safe areas, hover gating) for phone screens; taste-skill §4.5–4.6 (button and form rules) and §9 (giveaways) as a cross-check. Add a list of known conflicts and their resolutions (below). |
| `ui-motion` | Credit `emil-design-eng` as the source. New motion follows `animate`'s build sequence using our tokens; reviews use `review-animations` and its `STANDARDS.md`; jank goes to `animation-performance`; "what could animate?" goes to `find-animation-opportunities`, expecting mostly rejections; `animation-vocabulary` helps name motion in feedback. Our no-stagger rule and no-overshoot rule win. |
| `ui-audit` | Add a third pass, a Vercel review with `file:line` output from `command.md` on changed files. Add taste-skill §4.9 (copy self-check) and the `redesign-existing-projects` checklist to the critique. Add the Vercel findings to the report shape. |
| `ui-audit` scanner | New rules for D4 (em dash, more than one middle dot per line), `...` in UI strings (use `…`), and viewport zoom disabled (`user-scalable=no`, `maximum-scale=1`). Test on a planted file and on `mockup/src/pages`. |
| `ui-mockup` | In "Check before the user sees it": run `break-ui` on new screens through a `worst` state in the existing mock bar rather than a new toggle; run the Vercel pass; run `review-animations` if motion changed. In "Promoting": keep the worst-case fixtures as regression data. |
| `ui-visual-check` | The report lists `mobile-native`'s checks that only a real phone can confirm (sticky hover, tap delay, safe areas, keyboard). |

Conflicts and their resolutions, to record in `ui-craft`:

| Upstream says | We do | Because |
|---|---|---|
| Title Case for headings and buttons (Vercel) | Sentence case | DESIGN.md vocabulary; Vercel house style |
| Layered shadows (Vercel), tinted shadows and grain (taste-skill) | Hairline rules; shadows only on dialogs and menus | DESIGN.md §4 elevation |
| APCA contrast (Vercel) | WCAG 2.2 AA | DESIGN.md accessibility target |
| Dark mode by default (taste-skill) | Light only | DESIGN.md has no dark theme |
| Stagger group entrances, 200–300ms on all controls (Emil, taste-skill) | No stagger; instant feedback on frequent actions | `ui-motion` frequency table |
| `Intl` dates, not hardcoded formats (Vercel) | DD/MM/YYYY produced through `Intl` with a fixed locale | Hard constraint in DESIGN.md |
| `overscroll-behavior: none` on `html` (Emil) | Vercel's version: only for fine pointers, so pull-to-refresh still works on phones | Phone-first users |
| React, Motion, GSAP, Tailwind, design-system installs (taste-skill) | Vue, Nuxt UI, CSS transitions | Decided stack |

## Phase 3: Verify

1. Run `sync.mjs check` against the pins and expect no changes. Then pin one skill to an older commit and confirm `check` shows the diff and `pull` restores it.
2. Run the scanner against `mockup/src/pages` and a planted file with each new rule.
3. Dry-run one screen through the updated loop: Vercel pass, `break-ui` worst case, and `ui-visual-check`. Confirm the report reads well and nothing contradicts DESIGN.md.
4. Confirm the skill list shows the new skills, and that the two taste-skill ones don't trigger by themselves.

## Phase 4: Record

1. Add D3 and D4 to DESIGN.md's decision log, done by or after UI Design.
2. If D3 changes Submit, run it as a mock-up round (Submit review and My timesheet "No hours" state) so you see it before it's engineered.
3. Update the Notion FE design doc's tooling section to name the upstream skills and the update process.
