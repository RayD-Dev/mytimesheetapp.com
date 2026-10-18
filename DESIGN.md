# Design

**Status:** Draft · **Last updated:** 2026-10-18 · Requirements live in Notion: [PRD](https://app.notion.com/p/3f5771bd4d438156a93ec42b3548821d), [HL design](https://app.notion.com/p/3f4771bd4d4380e28d76d2038edbfac4), [FE detailed design](https://app.notion.com/p/3f5771bd4d43819981e0f96e66fae263). This file records only what shapes the interface. If it disagrees with the PRD, the PRD wins: fix this file.

Read by the `ui-craft`, `ui-motion`, `ui-audit` and `ui-visual-check` skills in `.claude/skills/`.

## 1. Product context

- **What it is:** a self-hosted timesheet app for one small business. Staff record a fortnight of shifts; the owner approves and signs each timesheet, then downloads one PDF for the accountant.
- **Who, where, how often:**
  - *Employees* are casual staff on their phones, often right after a shift, a few times a fortnight.
  - *The manager* is the owner, who is also the admin. Approves on desktop or phone, once a fortnight.
- **Screen jobs:**
  - *My timesheet:* enter start, rest break and finish for each weekday, check totals, submit.
  - *Approvals:* review the fortnight's submitted timesheets and approve or reject each one.
  - *Admin:* pay schedule, employees, PDF download.
  - *Profile:* signature and password.
  - *Sign-in pages:* Keycloak's sign in, new password and reset pages, themed to match.
- **What users must feel:** the numbers are right, nothing I typed is lost, and approval is final.
- **Register:** product UI. Restraint, density where it helps, one confident element per screen.

## 2. Hard constraints

- **Phone first:** My timesheet works at 375px wide with no sideways scrolling. Desktop shows a table with one row per day; phone shows a stacked card per day.
- **Paper sheet fidelity:** columns and labels follow the business's paper timesheet, in this order: Date, Start time, Rest break (mins), Finish time, Total hours. Weeks are headed Week 1 and Week 2, Monday to Friday only.
- **Dates:** DD/MM/YYYY everywhere, e.g. 05/10/2026. Where a weekday is shown, it's kept separate from the date (Mon 05/10/2026), matching the PDF's Day and Date columns (FR-22). The pay period reads "05/10/2026 to 16/10/2026" (Monday of week 1 to Friday of week 2).
- **Times:** always a 12-hour clock with AM/PM (7:30 AM), never the device's 24-hour format. Use Nuxt UI `UInputTime` with `:hour-cycle="12"`, not the native time input.
- **Hours:** `{h}h {mm}m (decimal)`, e.g. 8h 10m (8.17), 0h 45m (0.75), 76h 30m (76.50). FR-11's note sits under the totals: "Totals are calculated from exact times and may differ slightly from the sum of the rounded daily figures."
- **Figures:** times and hours use tabular figures, right-aligned in tables. Formatting comes from one shared formatter or component, never inline.
- **Saving:** autosave only, with no Save button. A quiet status shows "Saving…", "Saved" or "Not saved".
- **Warnings (FR-27)** never block. They show on the day's row and in the submit review.
- **Accessibility:** WCAG 2.2 AA is the M2 target. The quality floor applies from M1: visible focus, ≥4.5:1 text contrast, ≥3:1 control borders, targets ≥44px on phones, inputs ≥16px.
- **Browsers:** current Chrome, Edge, Firefox and Safari, on desktop and phone. English only.
- **Component library:** Nuxt UI v4 (MIT) in plain Vue 3 + Vite, with Tailwind CSS v4. Wiring is in `.claude/skills/ui-craft/references/tokens.md`.
- **Fonts:** open-licence (OFL) and self-hosted with the app via `@fontsource`. No calls to Google Fonts.

## 3. Visual direction: Ledger

*The paper timesheet, made exact.* Chosen 2026-10-11 over Signage and Stamp (options in `.claude/skills/ui-craft/references/directions.md`).

- **Feel:** ink on ruled paper. The screen, the PDF and the business's paper sheet look like one document, so staff see the same figures the accountant does.
- **Signature element:** the fortnight total is double-ruled, the accounting convention for a final total. All figures are right-aligned in the mono face. Use the double rule only for the fortnight total; week totals get a single rule.
- **Structure:** hairline rules instead of boxes and shadows. A table on desktop that mirrors the paper sheet; ruled day cards on phones.
- **Risk:** it can feel austere. Mitigate with a confident size for the fortnight total and well-written empty and status states. If staff struggle to read it on phones, swap the UI font for Atkinson Hyperlegible Next and keep everything else.

## 4. Tokens

Implemented in `mockup/src/assets/main.css` (`@theme` and `:root`). The file moves to the real app unchanged.

- **Type:**
  - UI: IBM Plex Sans 400 / 600. Figures (times, hours, totals): IBM Plex Mono 400 / 500, `tabular-nums`.
  - Scale: 14 (secondary), 16 (body and inputs), 20 (section headings), 24 (page title), 32 (fortnight total, the one display moment).
  - Line height 1.5 for body, 1.25 for headings.
- **Colour roles** (contrast checked against `sheet` #FFFFFF):

  | Role | Hex | Use | Contrast |
  |---|---|---|---|
  | `paper` | #FAFAF8 | page background | — |
  | `sheet` | #FFFFFF | raised surface (the timesheet) | — |
  | `ink` | #1B2330 | text | 15.8:1 |
  | `ink-muted` | #586273 | secondary text, placeholders | 6.2:1 |
  | `rule` | #D5DAE1 | decorative lines | — |
  | `control-border` | #7D8796 | input outlines | 3.6:1 |
  | `accent` | #2547A6 | primary action, focus, links (white on it 8.3:1) | 8.3:1 |
  | `caution` / `caution-bg` | #8A5300 / #FFF3D1 | FR-27 warnings | 5.7:1 |
  | `danger` | #B3261E | Reject, errors, "Not saved" | 6.5:1 |
  | `approved` | #1D7148 | Approved, Self-approved | 6.0:1 |

- **Space:** 4px base: 4, 8, 12, 16, 24, 32, 48.
- **Radius:** 2px for controls, 4px for phone day cards (`--ui-radius: 0.125rem`).
- **Elevation:** none; use rules and the paper/sheet step. Only dialogs and menus get a shadow.
- **Motion:** the ui-motion skill's tokens. Almost none in this direction; saved and status changes cross-fade.

## 5. Components and patterns

- **Timesheet:** a table on desktop and a ruled block per day on phones. It's the same component reflowing, not two separate screens. On phones, days without hours collapse to "Add hours"; future days say "Hours can't be added for future days".
- **Top bar:** My timesheet, Profile, and Sign out on the right. Managers also get Approvals and Admin; on phones they see the current page and a Menu (with Sign out inside), because five links don't fit.
- **Status groups** (Approvals list, Admin's "not approved yet" list) each start with a tinted band: the status icon in its colour (To approve: blue clock; Approved: green tick; Rejected: red return arrow), the title, and the count on the right. Rows still to approve have bold names; finished rows use regular weight.
- **Approve** uses the Approved green (`approved` role, white text 6.0:1), so the action matches the status it creates. Every other primary action uses the accent blue. Approving asks for confirmation, because it signs and locks the timesheet.
- **Status:** Draft, Submitted, Approved, Rejected and Self-approved. Each is shown as a word with an icon, never colour alone. Submitted and Approved timesheets look settled and read-only, not like a disabled form.
- **Rejected:** the manager's reason sits at the top of the timesheet, which is editable again.
- **Submit review:** a full-screen step on phones (`UModal` fullscreen). The ticks and the *Submit timesheet* button come after the totals.
- **Warnings:** a row-level caution tint plus icon and text, e.g. "This shift is 1h 00m. Is AM/PM correct?"
- **Destructive actions** (Clear, Reject) ask for confirmation in a dialog that names the consequence.
- **Empty and blocked states** use the PRD's exact wording, e.g. FR-06: "Your manager hasn't set up the pay schedule yet".
- **Sign-in pages** (a Keycloak login theme): the business name above a ruled sheet with the double rule under it, "Timesheets" beneath the name (alone until the name is set). An optional logo sits beside the name, at most 48px high and 240px wide; the name wraps underneath when a wide logo leaves it less than 160px. One sheet per step: Sign in, Choose a new password, Reset your password, Check your email, This link has expired. Errors sit in a tinted box above the fields. M1 password rule: at least 8 characters, with letters and numbers.
- **Loading and failed to load** are the same on every page: the page title, then ruled placeholder lines (shown only after about 300 ms); or "Couldn't load {what}. Check your internet connection, then try again." with *Try again*.
- **Not saved:** the save status turns red ("Not saved", with a cloud-off icon), and a box above the weeks explains that changes are kept on screen and retried, with *Try now*.
- **Changed on another device:** a dismissible notice at the top of the timesheet, never a toast, because the person needs to check their last change.
- **Session ended:** a dialog that can't be dismissed, "You've been signed out… Your saved hours are safe", with *Sign in again*.
- **Errors** (round R8; never a toast alone):
  - Form errors when a button is pressed: the field turns red (`aria-invalid`) with a message under it, focus moves to the first bad field, and a toast says what didn't happen. Buttons stay enabled and check on press; the submit review keeps its disabled button and hint.
  - Failed actions (submit, approve, PDF, save): a red inline message by the button plus a toast.
  - While typing (FR-09 on a day): red field and message, no toast.
  - Keycloak's pages have no toasts: red field plus the tinted box above the form.
- **Not found and no access** keep the top bar with nothing underlined, and offer *Go to My timesheet*.

## 6. Vocabulary

- **Actions:**
  - *Submit* opens the review, and *Submit timesheet* sends it from the review. Never "Send": one action keeps one name.
  - *Clear*
  - *Approve*
  - *Reject* (with a reason)
  - *Replace* (signature)
  - *Download PDF*
- **Statuses:** Draft, Submitted, Approved, Rejected, Self-approved.
- **Fortnights:** "Current fortnight" and "Previous fortnight"; in pickers and lists, the dates followed by "(current)" or "(previous)".
- **Declaration:** "I confirm these hours are correct".
- **Save status:** "Saving…", "Saved", "Not saved".
- **Retry:** *Try again* after a failed load; *Try now* for a failed save that is already retrying on its own.

## 7. Decision log

| Date | Decision | Why |
|---|---|---|
| 2026-10-11 | Component library: **Nuxt UI v4** with Tailwind v4 | MIT; real 12-hour typed time field (`UInputTime`, `hourCycle: 12`); fullscreen modal, drawer and toast built in; built on Reka UI, so there's an escape hatch. PrimeVue was ruled out because v5 (July 2026) moved to a commercial licence. |
| 2026-10-11 | Screens are drafted in a throwaway mock-up (`mockup/`, ui-mockup skill) and reviewed in rounds before the real front end is engineered | Fast feedback on look and flow without engineering cost. The mock-up uses the real components and tokens, so approved screens carry over exactly; only the tokens, the theme and these decisions move to the real app. |
| 2026-10-11 | Visual direction: **Ledger** (IBM Plex Sans and Mono, ink on ruled paper, double-ruled fortnight total) | Turns the PRD's requirement that the screen and PDF copy the paper sheet into the identity, so staff and the accountant see one document. |
| 2026-10-11 | The review's final button is *Submit timesheet*, not *Send* | One action keeps one name across the button, review, status and log. |
| 2026-10-11 | Dates are DD/MM/YYYY (05/10/2026), with the weekday kept separate | The owner's choice. Keeping the weekday separate matches the PDF's Day and Date columns. |
| 2026-10-11 | My timesheet approved in mock-up round R1 (see `mockup/ROUNDS.md`) | Owner reviewed every state at phone and desktop size. |
| 2026-10-11 | Time entry: Nuxt UI's segmented `UInputTime`, with 44px segments on phones | The owner's choice over a typed-time-plus-AM/PM-switch variant. |
| 2026-10-11 | Phones: days without hours collapse to an "Add hours" button | Keeps a fortnight short on a phone; filled days always show their fields. |
| 2026-10-11 | My timesheet heading is "{name} Timesheet"; the PDF keeps "Employee Timesheet" (FR-22) | The owner's choice. The name in the heading makes the separate Employee row unnecessary. |
| 2026-10-11 | Sign out lives in the top bar | The owner's choice. |
| 2026-10-11 | Submit review approved in round R2: ticks and *Submit timesheet* after the totals; each warning day ticked as "Yes, {start} to {finish} is correct"; a hint lists what's left; afterwards, back to the timesheet with a "Timesheet submitted" toast | Repeating the times makes people read them. The toast is fine for M1; a confirmation page can come later. |
| 2026-10-11 | Profile approved in round R3: name from the sign-in account, signature with Replace, Change password via the sign-in page | Owner reviewed every state. |
| 2026-10-11 | Typed signatures: the user types their name and picks one of three styles (La Belle Aurore, the default; Herr Von Muellerhoff; Mrs Saint Delafield), all SIL OFL and self-hosted. The style is saved with the signature; drawing remains the alternative | The owner's choice: a signature should feel like the person's own. Resolves the FE doc's open question on the typed-signature font. |
| 2026-10-12 | Approvals approved in round R4 (list grouped by status; read-only sheet with Signatures; confirm before approving; "Next to approve"; Self-approved notice; manager phone Menu). Approve is green; fortnights are labelled "(current)" and "(previous)", and My timesheet's switch says "Current fortnight" | The owner's review. One name per thing: "current" everywhere, not "this". |
| 2026-10-12 | The mock-up lives in `mockup/`, and `mockup/src/pages/` mirrors the real app's routes (FE design section 6): `/timesheet`, `/timesheet/review`, `/approvals`, `/approvals/:fortnight/:timesheet`, `/admin`, `/profile` | The owner's suggestion. The folders read like a sitemap, and the real app's routes match the mock-up's one-to-one, so screenshots compare directly. The review is a full-screen step in the real app; it has its own URL in the mock-up so it can be reviewed. |
| 2026-10-12 | Admin approved in round R5: PDF first, then Employees, then Pay schedule (moved to the top on first run); temporary passwords shown once with Copy; a Mondays-only calendar | The order follows how often each task happens. |
| 2026-10-12 | Status groups are told apart by tinted heading bands with icon, colour and count (round R6, variant b) | The owner found the three Approvals groups looked the same. Icons rather than emoji, so they render the same everywhere and colour is never the only signal. |
| 2026-10-12 | Mock-up frozen after round R6. The approved screenshots in `mockup/approved/` (every page and state, phone and desktop) are the visual reference for the engineered front end | So the real build can be checked against what the owner approved, image by image. |
| 2026-10-18 | Round R7 approved: sign-in pages, session ended, not found, no access, deactivated, Not saved, changed on another device, and loading and failed states. Added to `mockup/approved/` | Covers the M1 screens and states the first freeze didn't draw. |
| 2026-10-18 | The sign-in pages get the Ledger look as a Keycloak theme | The owner: "the idea is for a consistent & coherent ui". |
| 2026-10-18 | The manager sets the business name on Admin; the sign-in pages show it above "Timesheets" | The owner's suggestion. New, so the PRD needs a matching requirement. |
| 2026-10-18 | M1 password rule: at least 8 characters, with letters and numbers | The owner's choice for now; it's a Keycloak setting and can change later. |
| 2026-10-18 | No two-factor sign-in in M1 | The owner's call. The system design's SD-03 needs updating to match. |
| 2026-10-18 | A version conflict shows as an inline notice, not a toast | The owner's choice: a toast is easy to miss. |
| 2026-10-18 | Round R8 approved: optional business logo, shown beside the business name on the sign-in pages; basic error messages | The owner: "Lets have the business name configured by the admin, with an optional logo"; "Beside name thanks". |
| 2026-10-18 | Errors: red field with a message plus a toast; failed actions get an inline message plus a toast; never a toast alone | The owner: "I don't like toast only notification, it would be good to have field highlight + toast". |

## Open questions

- [ ] On a real iPhone and Android phone, check that the AM/PM segment of `UInputTime` is easy to change. On a keyboard it changes by typing "a" or "p" or with the arrow keys; which phone keyboard appears for it hasn't been verified. If it's awkward, revisit the typed-time-plus-AM/PM-switch variant from R1.
