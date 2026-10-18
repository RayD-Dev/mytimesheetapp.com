# Approvals (`/approvals`)

**Who:** Manager (the owner, who is also the admin). Employees never see this page.
**Requirements:** FR-15, FR-19, FR-27 (warnings shown on rows); FR-16, FR-17 and FR-20 are on the timesheet page (`approvals-timesheet.md`)
**Approved:** round R4 on 12/10/2026, with R6 on 12/10/2026 for the status-group bands and R7 on 18/10/2026 for the loading and load-failed states
**Screenshots:** `mockup/approved/approvals-state-*`, `mockup/approved/approvals--*` (each at `@375x812` and `@1280x800`; the manager menu one is phone only)
**Mock-up page:** `mockup/src/pages/approvals/index.vue`

Pick a fortnight, see who has submitted, and open a timesheet to approve or reject it.

## States

| State | When | What's shown | Screenshots |
|---|---|---|---|
| Waiting | Mock `waiting`: three to approve (one is the manager's own), one approved, one rejected | Fortnight picker, then three status groups in order: To approve (3), Approved (1), Rejected, waiting for the employee (1) | `approvals-state-waiting` |
| All done | Mock `all-done`: everything submitted is approved | To approve (0) with "Nothing to approve..." and a PDF link; Approved (4), the manager's own row says Self-approved; Rejected group still lists Lee Wong | `approvals-state-all-done` |
| None | Mock `none`: nothing submitted this fortnight | Picker and an empty-state heading and line; no groups | `approvals-state-none` |
| After reject | Mock `after-reject`: arriving from rejecting Priya | "Timesheet rejected" toast; Priya's row has moved from To approve (2) to Rejected (2) | `approvals--after-reject` |
| Manager menu | Phone only: tap Menu in the top bar | Dropdown: My timesheet, Approvals (current, highlighted), Admin, Profile, rule, Sign out with icon | `approvals--manager-menu` |
| Loading (R7-7) | Data takes longer than about 300 ms | Top bar, then the title "Approvals" and ruled placeholder lines instead of the fortnight picker, the groups (shared `LoadState` part); nothing shown if loading is faster | `approvals-state-loading` |
| Load failed (R7-7) | The page's data couldn't be fetched | Top bar, the title "Approvals", then "Couldn't load approvals" with the explanation and *Try again* (shared `LoadState` part) | `approvals-state-load-failed` |

Empty group: a group with no rows other than To approve shows "None" in muted text (source only; not in a screenshot, since every shown group has rows).

## Layout

- **Phone (375px):** Top bar: current page name ("Approvals", underlined) on the left, Menu button on the right. Then one white sheet: page title, Fortnight select (full width, 44px), then the groups stacked. Each group starts with a full-width tinted band. Each row is a two-line block: name (wraps) and fortnight total on the right on the first line; then "Submitted {date} at {time}" or the status, then the warning line, each on its own line. The whole row is the tap target (min 56px).
- **Desktop:** Top bar shows My timesheet, Approvals (current), Admin, Profile, and Sign out on the right. The sheet is a bordered card on the paper background, max width 1024px. The select is at most 384px wide. Rows are one line, in columns: name, submitted time or status, warnings ("No warnings" when none), fortnight total, chevron.
- **Loading and load failed (R7-7):** the top bar stays; the sheet (same width as this page's sheet) shows only the title "Approvals", then either ruled placeholder lines (a short line, then five ruled rows with a long and a short placeholder) or a ruled block with the failure heading, one line of text and *Try again* (44px on phone, 36px on desktop). Nothing else from the page is shown.

## Copy

Exact text, in DESIGN.md's vocabulary.

| Where | Text |
|---|---|
| Page title | `Approvals` |
| Picker label | `Fortnight` |
| Picker options | `05/10/2026 to 16/10/2026 (current)`, `21/09/2026 to 02/10/2026 (previous)`, `07/09/2026 to 18/09/2026` |
| Group titles | `To approve`, `Approved`, `Rejected, waiting for the employee` |
| Own row suffix | ` (you)` |
| To-approve row, time | `Submitted 16/10/2026 at 4:05 PM` |
| Finished row, status | `Approved`, `Self-approved`, `Rejected` |
| Warnings | `1 warning`, `2 warnings`, `No warnings` (desktop only when none) |
| Fortnight total | `25h 45m (25.75)` |
| Empty group | `None` |
| To approve, all done | `Nothing to approve. Every submitted timesheet for this fortnight is approved.` |
| Link in that state | `Download the fortnight's PDF on the Admin page` (to `/admin`) |
| Empty heading | `No timesheets submitted for this fortnight yet` |
| Empty line | `They'll appear here as people submit them.` |
| Toast title and line | `Timesheet rejected` / `Priya Ramaswamy-Kingsley can now correct it.` |
| Back link target on the timesheet page | `Approvals` |
| Top bar (phone, manager) | `Menu`; items `My timesheet`, `Approvals`, `Admin`, `Profile`, `Sign out` |
| Top bar (desktop) | `My timesheet`, `Approvals`, `Admin`, `Profile`, `Sign out` |
| Loading (R7-7) | Title "Approvals"; screen-reader text "Loading approvals…" |
| Load failed (R7-7) | Heading "Couldn't load approvals"; "Check your internet connection, then try again."; button "Try again" |

## Interactions

| Trigger | Result | Requirement |
|---|---|---|
| Change fortnight select | Lists that fortnight's timesheets. The mock keeps the same data whichever option is chosen | FR-15 |
| Tap or click anywhere on a row | Opens `/approvals/:fortnight/:timesheet` for that person | FR-15 |
| Click "Download the fortnight's PDF on the Admin page" | Goes to `/admin` | FR-22 |
| Arrive from rejecting a timesheet | List shows "Timesheet rejected" toast, row moved to Rejected | FR-17 |
| Tap Menu (phone) | Opens the dropdown; choosing an item navigates; Sign out signs out | DESIGN.md section 5 |
| Tap a top-bar link (desktop) | Navigates to that page | DESIGN.md section 5 |
| Data slow to load | After about 300 ms the loading view replaces the page content | R7-7 |
| Load fails | Load-failed view; *Try again* repeats the request (mock: button does nothing) | R7-7 |

## Components

| Part | Built from | Notes |
|---|---|---|
| Top bar | Shared `TopBar` (`manager`), `UDropdownMenu`, `UButton` | Phone shows the current page and Menu; five links don't fit at 375px |
| Fortnight picker | `UFormField` + `USelect` | Regular font, tabular figures, 44px tall on phones, so the full label fits |
| Status group heading | Shared `StatusHeading` | Tinted band (`bg-info/10`, `bg-approved/10`, `bg-danger/10`), icon in status colour (clock, circle-check, undo-2), title, count right in mono. An `h2` |
| Row | Anchor link in a list | Bold name for To approve; regular weight for finished rows. Warning uses caution colour with triangle-alert icon |
| Status in row | Icon + word | Approved and Self-approved: green circle-check; Rejected: red undo-2 |
| Empty states | Heading + muted paragraph | PDF link is a 44px-tall underlined accent link |
| Toast | `useToast` | neutral colour, undo-2 icon |
| Loading / failed | `LoadState` part (shared by every page), `title` "Approvals", `what` "approvals" | `USkeleton` placeholders; failed uses a cloud-off icon in `danger` and `UButton` with rotate-cw icon. See `timesheet.md` for the full description |

## Data

All API field names are proposed (no OpenAPI spec yet).

| Shown | From the API | Format |
|---|---|---|
| Fortnight options | List of fortnights with start, end, and whether current or previous (proposed) | `DD/MM/YYYY to DD/MM/YYYY`, then ` (current)` or ` (previous)` |
| Person's name | Employee name (proposed) | Plain; ` (you)` added when it is the signed-in manager |
| Timesheet status | Timesheet status (proposed) | Submitted, Approved, Self-approved, Rejected; decides the group |
| Submitted time | Submission date and time (proposed) | `DD/MM/YYYY at h:mm AM/PM` |
| Warning count | Number of days with FR-27 warnings (proposed; server-worked-out, per BE decision log) | `1 warning` / `N warnings` |
| Fortnight total | Total worked minutes (proposed) | `8h 10m (8.17)` shared formatter, mono, right-aligned |
| Group count | Count of rows in the group (derived) | Mono number |

## Edge cases

- Long names wrap on phones ("Priya Ramaswamy-Kingsley", "Alexandra Featherstonehaugh") and stay on one line on desktop.
- The largest total is `76h 30m (76.50)`; it must not wrap.
- A group heading that wraps on phones ("Rejected, waiting for the employee") keeps the count aligned right.
- Every group can be empty; only To approve has custom empty text when everything is approved. For Approved and Rejected the mock shows "None".
- The manager's own timesheet appears in the list like any other, with ` (you)`.
- Rejected rows can carry warnings (Lee Wong, `2 warnings`).
- Approved rows can carry warnings (Priya after approval in `all-done`: `1 warning`).

## Accessibility

- One `h1` ("Approvals"), each group heading is an `h2`.
- Each row is a single link; its accessible name should include the person's name, status and total (to confirm in the build).
- Status is never colour alone: icon plus word on every finished row; group bands carry an icon and a title.
- The select has a visible label ("Fortnight").
- Targets are 44px or more on phones: select, rows (min 56px), Menu, the PDF link.
- The toast should be announced politely (not shown in the screenshots; to confirm).
- Loading view: `aria-busy="true"` on the sheet, `role="status"` with screen-reader-only text "Loading approvals…"; the placeholders are decorative. Load-failed view: `role="alert"`, so the failure is announced. The `h1` stays in both.

## Motion

None specified in the mock-up beyond the toast's built-in enter and exit.

## Changes since approval

| Change | Why | User's OK |
|---|---|---|

## Open questions

- Does changing the fortnight select reload the list? The mock keeps the same people whichever option is picked, and the URL carries no fortnight.
- The row link in the mock always goes to `2026-10-05` whatever fortnight is selected. The `:fortnight` route segment's format (`2026-10-05`, the fortnight start) is the mock's; confirm for the real app.
- Warnings on already-approved and rejected rows (R6-2 doesn't mention them): kept as shown in the screenshots?
- A fortnight with no timesheets shows only the empty heading; there is no separate treatment for a previous fortnight that is still unapproved. Not in the mock-up.
- Row sort order within a group is not specified (mock order: Priya, Tom, Sam).
