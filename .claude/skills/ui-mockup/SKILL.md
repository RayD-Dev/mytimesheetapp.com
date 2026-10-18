---
name: ui-mockup
description: Fast, throwaway mock-up loop for UI on the real stack (Vite + Nuxt UI + the project's design tokens), with hardcoded data and fake interactions, so the user can review and steer screens before any production front end is engineered. Runs feedback in numbered rounds with a review board of every screen and state at phone and desktop size, and variants to pick from. Use this whenever the user wants to draft, mock up, prototype, sketch or explore a screen or flow, compare layouts or visual directions, or iterate on UI feedback before building it properly. Also use it when an approved mock-up is ready to be engineered into the real app.
---

# UI mock-up loop

**Cheap code, expensive decisions.** The mock-up exists so the user can make design decisions quickly by looking at real screens. Its code is disposable. What it produces is decisions, and those decisions are kept.

| Throwaway (stays in `mockup/`) | Keeper (moves to the real app) |
|---|---|
| Page files, fixtures, fake interactions, `mock.ts`, the board | Tokens in `src/assets/main.css`, component theme in `vite.config.ts`, fonts |
| Shortcuts: inline logic, hardcoded strings, no types or tests | Decisions in `DESIGN.md`, copy, the states each screen needs |
| | Approved screenshots, the visual reference for the real build |

Because the keeper layer is real (real Nuxt UI components and real tokens), what the user approves is what the engineered app will look like.

## Setup (once per project)

```bash
cp -r .claude/skills/ui-mockup/assets/sandbox mockup
cp .claude/skills/ui-mockup/assets/ROUNDS.md mockup/ROUNDS.md
cd mockup && npm install
npm run dev        # run in the background; Vite prints Local and Network URLs (port 5180)
```

- **Phone:** open the Network URL on a phone on the same Wi-Fi. On Windows, allow Node through the firewall for private networks if asked.
- **Template:** a Vite + Vue + Nuxt UI app with:
  - the Ledger token file and fonts (DESIGN.md section 4)
  - FR-11 formatters (`fmt.ts`)
  - fake data with realistic extremes and DD/MM/YYYY dates (`fixtures.ts`)
  - a mock bar (☰ Mock) for switching screens, states and variants, hidden in screenshots and board frames
- **Pages mirror the site.** `src/pages/` has the same structure as the real app's routes (FE design section 6): folders are URL segments, `index.vue` is a folder's own page, and `[name]` is a URL parameter. Each page is routed automatically and appears on the board. For this project:
  ```
  src/pages/timesheet/index.vue                     → #/timesheet
  src/pages/timesheet/review.vue                    → #/timesheet/review   (a full-screen step in the real app)
  src/pages/approvals/index.vue                     → #/approvals
  src/pages/approvals/[fortnight]/[timesheet].vue   → #/approvals/2026-10-05/priya
  src/pages/admin/index.vue                         → #/admin
  src/pages/profile/index.vue                       → #/profile
  ```
  A page with parameters exports `example`, a concrete URL for the board and mock bar. Import with `@/` (`@/parts/TopBar.vue`, `@/fixtures`), so folder depth doesn't matter. Shared pieces go in `src/parts/`.

## Writing mock pages

Each page is one file. Export its metadata from a plain `<script>` block, and read the state from the URL:

```vue
<script lang="ts">
export const title = 'My timesheet'
export const order = 1
export const states = { draft: 'Draft, 4 days, one AM/PM warning', empty: 'No hours yet', rejected: 'Rejected with reason', approved: 'Approved, read-only', full: 'Every day 12h 30m (big totals)' }
export const variants = { a: 'Totals in a footer row', b: 'Totals in a sticky bar' } // only while a question is open
</script>
<script setup lang="ts">
import { useMock } from '@/mock'
import { fortnight, worked, warning } from '@/fixtures'
import { hours, time } from '@/fmt'
const { state, v } = useMock(states)
</script>
```

**Spend tokens on what the user sees, not on code quality:**
- Hardcode freely. Use inline logic and `v-if="state === 'rejected'"` branches. No stores, API layer, types beyond the inline ones, tests or reusable abstractions, unless they save tokens right now.
- Fake only the interactions that change what the user sees: typing a time updates the hours preview, Submit opens the review, pressing Submit timesheet early points to what's still unticked, Approve flips the status.
- Edit surgically. Change only the lines a piece of feedback touches; never regenerate a whole file.
- Reuse `fmt.ts` and `fixtures.ts` rather than retyping data.

**Never cut corners on what the user judges:**
- Real Nuxt UI components and tokens only (ui-craft). No raw colours or one-off sizes; the scanner checks.
- The PRD's exact copy, labels and column order (DESIGN.md sections 2 and 6).
- Every state the requirements name, with realistic data: long names, 76h 30m totals, warnings, empty.
- Real calendar facts. Generate dates in fixtures with code, or check every weekday with code; never type "Mon 06/10/2026" from memory. A fortnight that starts on the wrong weekday breaks the requirements and undermines trust in every screen.
- Phone first at 375px, then desktop.
- Motion only where ui-motion says it explains something.

## The round loop

1. **Read** `mockup/ROUNDS.md` (latest round, open feedback) and `DESIGN.md`.
2. **Plan** the round as a short list of changes with IDs (`R3-1`, `R3-2`, …). For any open question you'd otherwise guess at, build 2–3 variants behind `?v=` instead. Choosing between variants is faster for the user than describing a change, and cheaper than another round. Retire variants once one is picked.
3. **Build** following ui-craft.
4. **Check before the user sees it:**
   - `node .claude/skills/ui-audit/scripts/slop-scan.mjs mockup/src/pages mockup/src/parts`, run from the repo root, and fix real findings.
   - ui-visual-check on the pages and states you changed, from `mockup/`. Pass the states as routes, e.g. `--routes "#/timesheet?state=draft,#/timesheet?state=rejected"`. Mind the Git Bash note in that skill.
   - Look at the screenshots and fix what's off.
   - If a new page looks unstyled in places (for example a grid collapsing to one column) while `npx vite build` output contains the class, the dev server's Tailwind missed the new file: restart `npm run dev`.
   - Full-page screenshots show the page behind a dialog, not the dialog's hidden content. For dialogs, use a scenario with `scroll` steps and `--viewport-only`.
   - **New page or new state: try to break it.**
     - Add a `worst` state with realistic worst-case data, following Phases 1–4 of `../break-ui/SKILL.md` and its `CATALOG.md`: long and short names, 76h 30m totals, every status at once, empty, exactly one item.
     - Feed the data in through `fixtures.ts`, never by editing markup, and switch it from the existing mock bar rather than a new toggle.
     - Fix what's plainly a bug. Put the judgment calls, such as truncating or wrapping a name, to the user with the round.
   - The guidelines review from ui-audit (pass 2) on the pages you changed. If motion changed, review it as ui-motion section 6 describes.

   The user's attention is for taste and flow, not for catching overflow bugs.
5. **Present** in a few lines:
   - what changed (IDs)
   - where to look, e.g. `http://localhost:5180/#/board?screen=timesheet`
   - the specific decisions you need ("pick v=a or v=b for totals")

   Don't paste code. Attach a screenshot only if the user can't run the mock-up.
6. **Record** the round in `ROUNDS.md`: changes, the user's feedback (trimmed, in their words), and decisions. Promote lasting decisions into `DESIGN.md` straight away.

Reading feedback: map it to IDs, screens and states. If a comment is ambiguous and cheap to show, make variants rather than asking. If it conflicts with the PRD or DESIGN.md, say so before changing anything.

## Order of screens for this project

The direction (Ledger), the button vocabulary and the date format are already decided in DESIGN.md. Follow the PRD's delivery slices:

1. **My timesheet:** states draft with an AM/PM warning, empty, rejected, submitted, approved, full, and pay schedule not set (FR-06). Desktop table, phone day cards, and the double-ruled fortnight total.
2. **Submit review:** the declaration, a tick for each warning day, and *Submit timesheet*. Includes the first-time signature prompt.
3. **Profile:** draw or type a signature, Replace.
4. **Approvals:** the fortnight list, then one timesheet with Approve and Reject.
5. **Admin:** pay schedule, employees, PDF download.

All five were reviewed in rounds R1–R6 and frozen on 12/10/2026 (see `mockup/ROUNDS.md` and `mockup/approved/`). Later changes need a new round and replacement screenshots.

## Promoting an approved mock-up into the real app

When the user says a screen or the whole mock-up is approved:

1. **Freeze.** Mark the final round in `ROUNDS.md`. Capture approved screenshots with ui-visual-check into `mockup/approved/`, one per page × state × viewport, and commit them.
2. **Carry over the keeper layer unchanged:** `main.css` tokens, the `vite.config.ts` component theme, and fonts. Formatting rules become properly tested formatters, shared with the PDF tests (FR-11).
3. **Write the spec the code can't carry.** One file per page in `docs/screens/<page>.md`, from the ui-e2e skill's screen-spec template: states, exact copy, interactions, components and requirement IDs, taken from the mock-up and ROUNDS.md. `DESIGN.md` keeps only app-wide rules, so it stays small enough to read on every design step. The mock code itself is not copied. Keep the `worst` fixtures as regression data for the real app's tests.
4. **Engineer** the real screens through the ui-e2e skill: brief, plan, build, then checks. It uses ui-craft and ui-motion for the UI work.
5. **Verify against the mock-up.** Run ui-visual-check on the real screens and compare them with `mockup/approved/` screenshots side by side. The routes are the same, so the same `--routes` list works for both. Run ui-audit. Differences are either bugs or deliberate changes recorded in DESIGN.md.
6. When every screen is engineered, archive or delete `mockup/`. The approved screenshots and DESIGN.md remain.

Never copy mock page code into the real app, and never add real auth or API calls to the mock-up. Either one blurs the line that keeps the mock-up fast.
