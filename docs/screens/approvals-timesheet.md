# One timesheet (`/approvals/:fortnight/:timesheet`)

**Who:** Manager
**Requirements:** FR-15, FR-16, FR-17, FR-18, FR-19, FR-20, FR-27
**Approved:** round R4 on 12/10/2026, with R6 on 12/10/2026 for the status bands (these affect the Approvals list only; this page has no status groups), R7 on 18/10/2026 for the loading and load-failed states, and R8 on 18/10/2026 for the error states
**Screenshots:** `mockup/approved/approvals-2026-10-05-*`, `mockup/approved/approve--*` (each at `@375x812` and `@1280x800`)
**Mock-up page:** `mockup/src/pages/approvals/[fortnight]/[timesheet].vue`

Read one person's submitted timesheet, then approve and sign it, or reject it with a reason. Managers can't edit anyone's entries (FR-18).

## States

| State | When | What's shown | Screenshots |
|---|---|---|---|
| Submitted | Mock `submitted`: Priya's timesheet, one warning day | Header with Submitted status, warning summary, read-only sheet, Signatures (employee signed, approver line empty), Approve and Reject | `approvals-2026-10-05-priya-state-submitted` |
| Approve confirmation | Mock `approving`: Approve pressed | Modal "Approve Priya's timesheet?" with the manager's signature, Approve and Cancel, over the dimmed page | `approve--confirm` |
| Reject dialog | Mock `rejecting`: Reject pressed | Modal "Reject Priya's timesheet?" with required Reason textarea, Cancel and Reject timesheet (enabled; it checks on press). Screenshot shows a typed reason | `approve--reject-reason` |
| Reject error (R8-4) | Mock `reject-error`: *Reject timesheet* pressed with no reason | The dialog stays open; Reason is red with "Give a reason, so Priya knows what to fix."; focus on the textarea; a toast "Not rejected" behind the dialog | `approve--reject-error` |
| Approve failed (R8-4) | Mock `approve-failed`: *Approve* pressed in the confirmation and the server or connection failed | The confirmation modal stays open; above its buttons a red inline message "Couldn't approve. Check your connection and try again. Nothing has changed." and a toast "Not approved" with the same text; *Approve* stays enabled to try again | `approve--approve-failed` |
| Approved | Mock `approved`: just approved | Status Approved (green); warning summary and Approve and Reject gone; Approver signature, name and "Approved" time filled; "Approved timesheets can't be changed." and Next to approve button | `approvals-2026-10-05-priya-state-approved` |
| Approved, signatures in view | Same as Approved, scrolled to the bottom | Both signatures filled, then the Next to approve footer | `approve--approved-signatures` |
| First approval | Mock `first-approval`: manager has no signature (FR-20) | Approver column holds the signature set-up (Type it / Draw it, name, three styles, Use this signature); Approve disabled with "Set up your signature to approve." | `approvals-2026-10-05-priya-state-first-approval` |
| Own timesheet | Mock `own`: manager's own (Sam Okafor), FR-19 | Info notice about Self-approved; Approver label "Approver (self-approved)"; Approve and Reject | `approvals-2026-10-05-priya-state-own` |
| Rejected | Mock `rejected`: Lee Wong, waiting for the employee | Status Rejected (red); rejection panel with time and reason; read-only sheet; Approver "Not approved"; no Approve or Reject | `approvals-2026-10-05-lee-state-rejected` |
| Loading (R7-7) | Data takes longer than about 300 ms | Top bar, then the title "Timesheet" and ruled placeholder lines instead of the back link, the sheet, the signatures (shared `LoadState` part); the sheet and title show at once and the lines only after about 300 ms, so fast loads do not flash | `approvals-2026-10-05-priya-state-loading` |
| Load failed (R7-7) | The page's data couldn't be fetched | Top bar, the title "Timesheet", then "Couldn't load this timesheet" with the explanation and *Try again* (shared `LoadState` part) | `approvals-2026-10-05-priya-state-load-failed` |

Source only, no screenshot: after approving the manager's own timesheet the status reads `Self-approved`, the toast reads `Timesheet self-approved`, and the confirmation modal is titled `Approve your own timesheet?` with "It's marked Self-approved on screen and in the PDF." (Approving Priya's toasts `Timesheet approved`; the toast is in the source but not in the screenshots.)

## Layout

- **Phone (375px):** Top bar (current page, Menu). A 44px "Approvals" back link above the sheet. Sheet: title and status stacked (title wraps, status below); Pay period and Submitted as a two-column list; notices; Week 1 and Week 2 as ruled day blocks (day, date, hours on one line; times and break below; warning inside the tinted block); week totals with a single rule; fortnight total (32px, double rule) with FR-11 note; Signatures (Employee above Approver); full-width Approve (green) above full-width Reject (outline red).
- **Desktop:** Back link above a bordered card. Title left, status right. Same notices. Each week is the paper table (Date, Start time, Rest break (mins), Finish time, Total hours) with the warning on a tinted second row. Signatures side by side. Reject (outline) at the left and Approve (green) at the right of the same row. In the Approved state the footer is a rule, the note on the left and Next to approve on the right.
- **Loading and load failed (R7-7):** the top bar stays; the sheet (same width as this page's sheet) shows only the title "Timesheet", then either ruled placeholder lines (a short line, then five ruled rows with a long and a short placeholder) or a ruled block with the failure heading, one line of text and *Try again* (44px on phone, 36px on desktop). Nothing else from the page is shown.

## Copy

| Where | Text |
|---|---|
| Back link | `Approvals` |
| Title | `{name} Timesheet`, e.g. `Priya Ramaswamy-Kingsley Timesheet` |
| Status | `Submitted`, `Approved`, `Self-approved`, `Rejected` |
| Header labels | `Pay period`, `Submitted` |
| Values | `05/10/2026 to 16/10/2026`, `16/10/2026 at 4:05 PM` |
| Warning summary | `1 day has a warning. Check it before you approve.` / `{n} days have a warning. Check them before you approve.` |
| Own notice | `This is your own timesheet. When you approve it, it's marked Self-approved on screen and in the PDF.` (Self-approved in bold) |
| Week headings | `Week 1`, `Week 2` |
| Table columns (desktop) | `Date`, `Start time`, `Rest break (mins)`, `Finish time`, `Total hours` |
| Day, desktop | `Mon 05/10/2026`, `7:30 AM`, `30`, `4:30 PM`, `8h 30m (8.50)` |
| Day, phone | `7:30 AM to 4:30 PM, 30 min break` |
| Day warning | `This shift is 1h 00m. Is AM/PM correct?` |
| Totals | `Week 1 total`, `Week 2 total`, `Fortnight total`, `25h 45m (25.75)` |
| FR-11 note | `Totals are calculated from exact times and may differ slightly from the sum of the rounded daily figures.` |
| Signatures heading | `Signatures` |
| Signature labels | `Employee`, `Approver`, `Approver (self-approved)` |
| Employee line | `{name}`, `Confirmed 16/10/2026 at 4:05 PM` |
| Approver, empty | `Your signature and the date and time are added when you approve.` |
| Approver, approved | `Sam Okafor`, `Approved 19/10/2026 at 9:12 AM`; image alt `Your signature` |
| Approver, rejected | `Not approved` |
| Approver, no signature | `You need a signature before your first approval. It's saved to your profile.` |
| Approve button hint | `Set up your signature to approve.` |
| Buttons | `Approve`, `Reject` |
| Approve modal title | `Approve Priya's timesheet?` / `Approve your own timesheet?` |
| Approve modal body | `Your signature and today's date and time are added. Approved timesheets can't be changed.` / `It's marked Self-approved on screen and in the PDF.` |
| Approve modal buttons | `Cancel`, `Approve` |
| Reject modal title | `Reject Priya's timesheet?` |
| Reject field | `Reason` (required), `Priya sees this at the top of the timesheet, so say what to fix.` |
| Reject modal buttons | `Cancel`, `Reject timesheet` |
| Approved footer | `Approved timesheets can't be changed.`, `Next to approve: Tom Ng` |
| Rejected panel | `You rejected this timesheet`, `19/10/2026 at 8:40 AM`, reason, `It comes back here when Lee submits it again.` |
| Toasts | `Timesheet approved`, `Timesheet self-approved`; on the list: `Timesheet rejected` |
| Reject error (R8-4) | Field message `Give a reason, so {first name} knows what to fix.`; toast title `Not rejected`, description `Add a reason first.` |
| Approve failed (R8-4) | Inline message `Couldn't approve. Check your connection and try again. Nothing has changed.`; toast title `Not approved`, description the same sentence |
| Signature set-up (inline) | Reuses the Profile page's component: `Type it`, `Draw it`, `Your name as you sign it`, `Choose a style`, `Use this signature` |
| Loading (R7-7) | Title "Timesheet"; screen-reader text "Loading this timesheet…" |
| Load failed (R7-7) | Heading "Couldn't load this timesheet"; "Check your internet connection, then try again."; button "Try again" |

## Interactions

| Trigger | Result | Requirement |
|---|---|---|
| Back link | Returns to `/approvals` | FR-15 |
| Approve | Opens confirmation modal showing the manager's signature | FR-16 |
| Approve in modal | Closes modal; page becomes Approved: both signatures, "Approved" time, Next to approve; toast | FR-16 |
| Cancel or close in modal | Closes; nothing changes | FR-16 |
| Reject | Opens reason dialog | FR-17 |
| Reject timesheet with a non-blank reason | Goes to `/approvals` with the "Timesheet rejected" toast; the row moves to Rejected | FR-17 |
| Reject timesheet with the reason empty or only spaces | Dialog stays open; Reason turns red with its message, focus moves to it, toast "Not rejected". The button stays enabled and checks on press | FR-17, R8-4 |
| Approve in modal fails | Modal stays open with the inline message above its buttons and the toast "Not approved"; nothing is approved; pressing *Approve* again retries | FR-16, R8-4 |
| Errors (app-wide rule, R8-4) | Form errors on button press: the field turns red with a message under it, focus moves to the first bad field, and a toast says what didn't happen. Failed actions: an inline message by the button plus a toast, never a toast alone. Live typing errors: red field and message, no toast. Keycloak pages: red field plus the alert box, no toasts | R8-4 |
| Use this signature (first approval) | Approver line fills; Approve becomes enabled; signature saved to profile | FR-20 |
| Next to approve: {name} | Opens the next Submitted timesheet in the list (the manager's own one opens the `own` state) | FR-15 |
| Edit any entry | Not possible; sheet is read-only | FR-18 |
| Data slow to load | The sheet and title show at once. After about 300 ms the placeholder lines appear under the title | R7-7 |
| Load fails | Load-failed view; *Try again* repeats the request (mock: button does nothing) | R7-7 |

## Components

| Part | Built from | Notes |
|---|---|---|
| Top bar | Shared `TopBar` (`manager`) | See `approvals.md` for the phone Menu |
| Read-only sheet | Shared `ReadOnlySheet` | Table on desktop and ruled day blocks on phone; the same component the employee sees when Submitted or Approved |
| Status | Icon and word | Clock blue Submitted; circle-check green Approved; undo-2 red Rejected |
| Signature line | Shared `SignatureText` | Typed signature, shrinks 32px to 20px to fit; drawn signature is an image |
| Signature set-up | Shared `SignatureSetup` | Same component as Profile and the submit review |
| Approve | `UButton` colour `success` | Approved green; white text 6.0:1 |
| Reject | `UButton` outline, colour `error` | Primary action on the dialog's button is solid red |
| Dialogs | `UModal` | 44px buttons; stacked Approve over Cancel on phones |
| Reason field error | `UFormField` with `error` on the `UTextarea` | Focus goes to the first `aria-invalid` field |
| Approve failed message | `section` with `role="alert"`, `danger` tinted border and background, circle-alert icon | In the modal footer, above the buttons |
| Next to approve | `UButton` accent, trailing arrow | Only after approval and only if someone else is still Submitted |
| Loading / failed | `LoadState` part (shared by every page), `title` "Timesheet", `what` "this timesheet" | `USkeleton` placeholders; failed uses a cloud-off icon in `danger` and `UButton` with rotate-cw icon. See `timesheet.md` for the full description |

## Data

All API field names are proposed (no OpenAPI spec yet).

| Shown | From the API | Format |
|---|---|---|
| Name in title and dialogs | Employee name (proposed) | `{name} Timesheet`; first word in dialogs |
| Status | Timesheet status (proposed) | Word plus icon |
| Pay period | Fortnight start and end (proposed) | `DD/MM/YYYY to DD/MM/YYYY` |
| Submitted time | Submission date and time (proposed) | `DD/MM/YYYY at h:mm AM/PM` |
| Each day | Date, start, rest break, finish, worked time, warning flag (proposed) | Weekday separate from date; 12-hour times; `8h 30m (8.50)`; break in minutes |
| Warnings | Per-day warning from the server (proposed) | Day tint and text; summary counts days |
| Week and fortnight totals | Totals from exact minutes (proposed) | `17h 45m (17.75)` shared formatter |
| Employee signature | Signature image saved with the submission (proposed) | Image on a signature line |
| Employee confirmation time | Submission time (proposed) | `Confirmed DD/MM/YYYY at h:mm AM/PM` |
| Approver and approval time | Approving manager's name and approval time (proposed) | `Approved DD/MM/YYYY at h:mm AM/PM` |
| Rejection | Rejection time and reason (proposed) | Time in mono; reason as a quote |
| Next in queue | Next Submitted timesheet for the fortnight (proposed) | Name in button |
| Manager's signature | Profile signature (proposed) | Image |
| Approve failure | A failed or timed-out approve call; nothing changes on the server (proposed: the call is safe to repeat) | Inline message plus toast |

## Edge cases

- Long names: the title wraps on phones; the status goes under it. On desktop the status sits on the right.
- Days with no hours show only weekday and date.
- Several warnings: the summary pluralises ("2 days have a warning"... see Copy); every warning day is tinted. Lee's rejected sheet has two warning days (Mon and Tue).
- `76h 30m (76.50)` fortnight total (Sam's) must not wrap.
- A long typed signature shrinks to fit one line.
- Next to approve is hidden when nobody else is Submitted.
- The warning summary is hidden once approved or rejected, while day tints remain.

## Accessibility

- One `h1` (the title); weeks, Signatures and dialog titles are headings.
- Status is icon plus word. Warnings are icon plus text, not only tint.
- Dialogs trap focus and return it to the Approve or Reject button on close (to confirm in the build).
- The drawn-signature image has alt text `Your signature`; the typed signature has no alt text in the mock-up (to settle).
- The Approve button is disabled with a visible hint explaining why.
- Errors (R8-4): the Reason field has `aria-invalid="true"` and its message attached when empty, and focus moves to it on a press. The approve-failed message is `role="alert"`, so it is announced; the error toasts are announced too. Each uses an icon and words, not colour alone.
- Targets are 44px or more on phones.
- Loading view: `aria-busy="true"` on the sheet, `role="status"` with screen-reader-only text "Loading this timesheet…"; the placeholders are decorative. Load-failed view: `role="alert"`, so the failure is announced. The `h1` stays in both.

## Motion

None specified beyond the dialogs' and toast's built-in transitions.

## Changes since approval

| Change | Why | User's OK |
|---|---|---|

## Open questions

- Lee's rejected sheet shows warnings on Mon and Tue, but the rejection reason talks about Thursday 08/10/2026. It looks like leftover mock data (the reason is shared with Priya's); confirm no design meaning.
- The rejected panel says "You rejected this timesheet" always. If a manager other than the viewer rejected it, the wording needs deciding (M1 has one manager).
- Priya's approved screenshots show approval time 19/10/2026 and submission 16/10/2026. These are mock data. In the real app "today's date and time" comes from the server.
- The mock says "Confirmed" for the employee's time and shows the same value as Submitted. Confirm they are the same field.
- After approving the last timesheet, "Next to approve" disappears and nothing replaces it (no link back). Intended?
- The toast `Timesheet approved` is not visible in the approved screenshots; its wording comes from source only.
- Reject: is the reason length limited? Not in the mock-up.
- Page behaviour when the timesheet is later edited by the employee after rejection and then resubmitted: the mock-up shows only "It comes back here when {first name} submits it again."
- The `:fortnight` segment is `2026-10-05` (fortnight start) in the mock; confirm for the API.
