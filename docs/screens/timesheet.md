# My timesheet (`/timesheet`)

**Who:** Employees and managers (each sees their own timesheet)
**Requirements:** FR-06, FR-07, FR-08, FR-09, FR-10, FR-11, FR-12, FR-13, FR-14, FR-17, FR-27
**Approved:** round R1 on 11/10/2026, with R7 on 18/10/2026 for the not-saved, conflict, session-ended, loading and load-failed states
**Screenshots:** `mockup/approved/timesheet-*` (the review's `timesheet-review--*` files are in `timesheet-review.md`)
**Mock-up page:** `mockup/src/pages/timesheet/index.vue`

Enter start time, rest break and finish time for each weekday of a fortnight, check the totals, then Submit.

## States

The mock-up's `?state=` values exist only in the mock-up. In the real app each state comes from real data. Screenshot names omit the `@375x812` / `@1280x800` suffix; every name exists at both sizes.

| State | When | What's shown | Screenshots |
|---|---|---|---|
| Draft | Editable timesheet with some hours (mock: 4 days, one AM/PM warning, 25h 45m (25.75)) | Editable fields; "Saved" and "Draft" in the header; "Kept until 30/10/2026 if not submitted"; Thu 08/10/2026 tinted with a warning; Submit and Clear enabled | `timesheet-state-draft` |
| Empty | Editable, no hours entered | No save status and no status label (they appear once any day has data); all totals `0h 00m (0.00)`; no "Kept until" line; phone: every past day collapsed to "Add hours"; Submit disabled with a hint; Clear disabled | `timesheet-state-empty` |
| Rejected | Manager rejected it; editable | Header status "Rejected" with "Saved"; a boxed reason block above the weeks; no "Kept until" line; Submit and Clear enabled | `timesheet-state-rejected` |
| Submitted | Waiting for approval; read-only | "Submitted" status; "Submitted" date row; waiting message; plain text values instead of fields; no Submit, Clear or save status | `timesheet-state-submitted` |
| Approved | Approved by manager; read-only | "Approved" status; "Submitted" and "Approved" rows (approver name and date and time); read-only values; no buttons | `timesheet-state-approved` |
| Full | Every fillable day filled (mock: 9 days, 76h 30m (76.50)) | As Draft, no warnings; week 1 `42h 30m (42.50)`, week 2 `34h 00m (34.00)`; Fri 16/10/2026 not fillable | `timesheet-state-full` |
| No pay schedule | Manager hasn't set the pay schedule (FR-06) | Heading and title only, then the FR-06 message; no pay period, switch, weeks, totals or buttons | `timesheet-state-no-schedule` |
| Just submitted | Returned from the review after Submit timesheet | Submitted state plus a "Timesheet submitted" toast; the status label settles in with a short animation | `timesheet--after-submit` |
| Clear confirmation | Clear pressed | Dialog "Clear this timesheet?" (mock-up source only; not screenshotted) | none |
| Day with a problem | A filled day fails FR-09 | Red inline message on the day (mock-up source only; not screenshotted) | none |
| Saving | Right after any edit | Header shows "Saving…", then "Saved" (source only; "Saved" is in the draft screenshots) | none |
| Not saved (R7-6) | Autosave is failing, e.g. no signal; the app keeps retrying (FE design §7.1). Mock: editable draft | Header status turns red: cloud-off icon and "Not saved" (replaces "Saving…" / "Saved"); a red-tinted box under the header: "Your latest changes aren't saved yet" with an explanation and *Try now*; fields stay editable | `timesheet-state-not-saved` |
| Changed on another device (R7-6) | The server reports a newer version than the one being edited; the app reloaded the latest (version conflict). Mock: `conflict` | Editable draft with a dismissible blue-tinted notice at the top: "This timesheet was changed on another device"; header shows "Saved" | `timesheet-state-conflict` |
| Session ended (R7-2) | The session expired while the page was open. Mock: `session-ended` | The editable draft stays visible behind a modal "You've been signed out" that can't be dismissed (no X, no Escape, no click outside); one button, *Sign in again* | `timesheet--session-ended` |
| Loading (R7-7) | Data takes longer than about 300 ms | Top bar, then the title "{name} Timesheet" and ruled placeholder lines (shared `LoadState` part); nothing shown if loading is faster | `timesheet-state-loading` |
| Load failed (R7-7) | The timesheet couldn't be fetched | Top bar, the title, then "Couldn't load your timesheet" with the explanation and *Try again* (shared `LoadState` part) | `timesheet-state-load-failed` |

## Layout

- **Phone (375px):**
  - Top bar (My timesheet, Profile, Sign out), then one white sheet, full width.
  - Heading `{name} Timesheet`, wrapping onto two lines for long names.
  - Under it, the save status and the status label (Draft, Rejected, Submitted, Approved).
  - Then a label/value list (Pay period; Submitted and Approved when they apply), then the Previous/Current fortnight switch, then the "Kept until" line on drafts.
  - Rejected reason block and Submitted message come next, then Week 1 and Week 2.
  - Each week is a ruled list, one block per day: weekday and date on the left, day hours on the right.
    - Empty days show an "Add hours" link-button, which expands Start time, Rest break (mins) and Finish time as label/field rows.
    - Days with hours show their fields (editable) or one line like `7:30 AM to 4:30 PM, 30 min break` (read-only).
  - Week total follows each week, then the double-ruled Fortnight total with FR-11's note.
  - Submit is full width; Clear sits below it as a ghost button.
- **Desktop:**
  - Same sheet, centred, max about 1000px wide, with a border on the paper background.
  - The status area is on the right of the heading line; the switch and "Kept until" line share one row.
  - Each week is a table with the paper sheet's columns: Date, Start time, Rest break (mins), Finish time, Total hours.
  - Weekday is bold and the date is mono, in one cell.
  - Warnings and problems sit in a second row under the day, spanning the table.
  - Week total is right-aligned under Total hours.
  - Clear is at the bottom left, Submit at the bottom right.

- **Loading and load failed (R7-7):** the top bar stays; the sheet shows only the title, then either ruled placeholder lines (a short line, then five ruled rows with a long and a short placeholder) or a ruled block with the failure heading, one line of text and *Try again* (44px on phone, 36px on desktop). No pay period, switch, weeks or buttons.
- **Not saved and conflict (R7-6):** both sit between the header rows (Pay period, Submitted) and the weeks, full width of the sheet, above the rejected block when there is one. The conflict notice is a row: icon, text, dismiss button at the right.
- **Session ended (R7-2):** a modal over the page. Phone: full width minus a margin, button full width. Desktop: centred, button right-aligned.

## Copy

| Where | Text |
|---|---|
| Top bar | "My timesheet", "Profile", "Sign out" |
| Heading | "{name} Timesheet" (e.g. "Priya Ramaswamy-Kingsley Timesheet") |
| Save status | "Saving…", "Saved" |
| Status labels | "Draft", "Rejected", "Submitted", "Approved" |
| Header rows | "Pay period", "Submitted", "Approved" |
| Fortnight switch (group label "Fortnight") | "Previous fortnight", "Current fortnight" |
| Draft expiry | "Kept until 30/10/2026 if not submitted" |
| Rejected block title | "Rejected by Sam Okafor" |
| Rejected block body | The manager's reason, e.g. "Thursday 08/10/2026 shows 7:30 AM to 8:30 AM. Did you mean 8:30 PM?" |
| Rejected block footer | "Correct the hours below, then submit again." |
| Submitted message | "Waiting for approval. Submitted timesheets can't be changed; if something's wrong, ask your manager to reject it." |
| No-schedule heading | "Your manager hasn't set up the pay schedule yet" |
| No-schedule body | "You'll be able to enter your hours once it's set up." |
| Week headings | "Week 1", "Week 2" |
| Table columns (desktop) | "Date", "Start time", "Rest break (mins)", "Finish time", "Total hours" |
| Phone field labels | "Start time", "Rest break (mins)", "Finish time" |
| Today marker | "Today" |
| Future day | "Hours can't be added for future days" |
| Empty day (phone) | "Add hours" |
| Read-only shift line (phone) | `{start} to {finish}, {n} min break` e.g. "7:30 AM to 4:30 PM, 30 min break" |
| Week totals | "Week 1 total", "Week 2 total" |
| Fortnight total | "Fortnight total" |
| Totals note | "Totals are calculated from exact times and may differ slightly from the sum of the rounded daily figures." |
| FR-27 warning | "This shift is 1h 00m. Is AM/PM correct?" (`{hm}` is the day's worked time, no decimals) |
| FR-09 problems | "Add a finish time"; "Add a start time"; "Finish time must be after start time"; "Rest break must be shorter than the shift" |
| Primary action | "Submit" |
| Submit hint (no hours) | "Add hours to at least one day to submit." |
| Secondary action | "Clear" |
| Clear dialog title | "Clear this timesheet?" |
| Clear dialog body | "All hours for 05/10/2026 to 16/10/2026 will be removed. This can't be undone." |
| Clear dialog, rejected only | "A cleared rejected timesheet is deleted after 3 months unless you enter hours again." |
| Clear dialog buttons | "Keep hours", "Clear timesheet" |
| Not saved: status | "Not saved" |
| Not saved: box title | "Your latest changes aren't saved yet" |
| Not saved: box body | "We can't reach the server, so they're kept on this screen and we'll keep trying. Leave this page open until it says Saved." |
| Not saved: button | "Try now" |
| Conflict: title | "This timesheet was changed on another device" |
| Conflict: body | "We loaded the latest version. Check your last change is still there." |
| Conflict: dismiss button | Icon only; accessible name "Dismiss" |
| Session ended: title | "You've been signed out" |
| Session ended: body | "For your security, you're signed out after a while without using the app. Your saved hours are safe." and, muted, "Sign in again to carry on where you left off." |
| Session ended: button | "Sign in again" |
| Loading | Title "{name} Timesheet"; screen-reader text "Loading your timesheet…" |
| Load failed | Heading "Couldn't load your timesheet"; "Check your internet connection, then try again."; button "Try again" |
| Toast after submit | Title "Timesheet submitted"; description "Your manager will review it." |
| Field labels (accessible names) | "{Weekday} {date} start time", "{Weekday} {date} finish time", "{Weekday} {date} rest break in minutes" |
| Empty time field | segments show `-- : --` and AM |

Hours format: `8h 30m (8.50)`. Times: `7:30 AM`. Dates: `05/10/2026`, weekday separate (`Mon 05/10/2026`).

## Interactions

| Trigger | Result | Requirement |
|---|---|---|
| Edit a start time, rest break or finish time | Value saves automatically; header shows "Saving…" then "Saved" (mock: 700 ms); day, week and fortnight totals update at once (FR-10 preview) | FR-10, FR-12 |
| Press "Add hours" (phone) | Day expands to its three fields; stays expanded until the state changes | FR-08 |
| Type in a time field | Segmented 12-hour field: hour, minute, AM/PM | FR-11 |
| Day worked time is 1h or less, or over 12h | Row tinted with the FR-27 warning; saving and Submit stay enabled | FR-27 |
| Day is incomplete or invalid | Red inline message; day shows no hours | FR-09 |
| Press "Previous fortnight" / "Current fortnight" | Selected button turns solid and the Pay period changes (mock: label only; see Open questions) | FR-07 |
| Press "Submit" (enabled once a day has valid hours) | Opens the review at `/timesheet/review` | FR-14 |
| Press "Clear" (enabled once any day has data) | Opens the Clear dialog | FR-13 |
| "Keep hours" | Closes the dialog, nothing changes | FR-13 |
| "Clear timesheet" | Empties every day, closes the dialog, shows "Saving…" then "Saved" | FR-13 |
| Return from the review after Submit timesheet | Read-only Submitted view with the toast | FR-14 |
| Autosave fails | Header shows "Not saved" and the box appears; edits stay on screen and are retried automatically; fields stay editable (mock: the state is fixed and nothing retries) | FE design §7.1 |
| Press "Try now" | Retries the save at once; the box is expected to go and the header to show "Saved" on success (mock: does nothing) | FE design §7.1 |
| Server reports a newer version | Page reloads the latest timesheet and shows the conflict notice at the top | FE design §7.1 |
| Press "Dismiss" on the conflict notice | Notice closes; it comes back only if the state changes (mock) | n/a |
| Session ends | Modal opens over the page; *Sign in again* goes to the sign-in page (`sign-in.md`), and signing in brings the person back here (modal text: "carry on where you left off") | R7-2 |
| Data slow to load | After about 300 ms the loading view replaces the sheet | R7-7 |
| Load fails | Load-failed view; *Try again* repeats the request (mock: button does nothing) | R7-7 |
| Press "Sign out" / "Profile" / "My timesheet" | Top-bar navigation | n/a |

## Components

| Part | Built from | Notes |
|---|---|---|
| Top bar | `TopBar` part | Employee version: My timesheet, Profile, Sign out |
| Sheet | `article` on `sheet` colour | Border on desktop only |
| Status and save status | Icon + text | Icons: pencil-line (Draft), undo-2 (Rejected), clock (Submitted), circle-check (Approved), check (Saved). `role="status"` on the save status |
| Fortnight switch | `UFieldGroup` of two `UButton` | Selected is solid, other is outline; 44px tall on phone, 36px on desktop |
| Rejected block | Bordered box with `danger` tint | Heading, date and time, quote, instruction |
| Time fields | `TimeField` part over `UInputTime`, `hour-cycle` 12 | 44px segments on phone |
| Rest break | `UInput` type number, `inputmode` numeric, min 0 | Right-aligned mono, 80px wide, 44px tall on phone |
| Desktop table | Native `table` | Fixed columns; second row for warning or problem |
| Phone day blocks | Ordered list | Rule between days |
| "Add hours" | `UButton` variant link | 44px tall |
| Warning / problem | Icon (triangle-alert / circle-alert) + text | Warning uses `caution` and `caution-bg`; problem uses `danger` |
| Fortnight total | Mono 32px, double bottom rule | Only the fortnight total is double-ruled |
| Clear dialog | `UModal` | Buttons: outline "Keep hours", error "Clear timesheet" |
| Toast | Nuxt UI toast | Success colour, circle-check icon |
| Not-saved status | Cloud-off icon + "Not saved", `danger` colour, semibold | Inside the save status `p` with `role="status"` |
| Not-saved box | `section` with `role="alert"`; `danger` tinted border and background | Title `h2` with cloud-off icon; *Try now* is `UButton` outline neutral with rotate-cw icon, 44px on phone, 36px on desktop |
| Conflict notice | `section` with `role="status"`; `info` tinted border and background | refresh-cw icon, title `h2`, body; ghost icon button (x, 44px, `aria-label` "Dismiss") |
| Session-ended dialog | `UModal`, `dismissible` false, no close button | Footer button full width on phone, auto width right-aligned from `sm` up |
| Loading / failed | `LoadState` part (shared by every page) | `title` = "{name} Timesheet", `what` = "your timesheet"; `USkeleton` placeholders; failed uses a cloud-off icon in `danger` and `UButton` with rotate-cw icon |

## Data

All API field names are proposed; the OpenAPI spec doesn't exist yet.

| Shown | From the API | Format |
|---|---|---|
| Employee name | Signed-in user's name (proposed `employee.name`) | Plain text in heading |
| Pay period | Fortnight start and end (proposed `fortnight.start`, `fortnight.end`) | `05/10/2026 to 16/10/2026` |
| Status | Timesheet status (proposed `status`: draft, submitted, approved, rejected) | Word + icon |
| Submitted date and time | Proposed `submittedAt` | `16/10/2026 at 4:05 PM` |
| Approver and approval time | Proposed `approvedBy`, `approvedAt` | `Sam Okafor, 19/10/2026 at 9:12 AM` |
| Rejecter, time, reason | Proposed `rejection.by`, `rejection.at`, `rejection.reason` | Name, `19/10/2026 at 8:40 AM`, text |
| Draft expiry | Proposed `expiresOn` | `30/10/2026` |
| Per day: date, weekday | Proposed `days[].date` | `Mon` + `05/10/2026` |
| Per day: start, finish | Proposed `days[].start`, `days[].finish` (24-hour `HH:mm`) | `7:30 AM` |
| Per day: rest break | Proposed `days[].breakMinutes` | Whole minutes |
| Per day: total hours | Proposed `days[].workedMinutes` (server-calculated) | `8h 30m (8.50)` |
| Per day: warning | Proposed `days[].warning` (server-calculated, FR-27) | Text built as "This shift is {hm}. Is AM/PM correct?" |
| Week and fortnight totals | Proposed `weekTotals[]`, `fortnightTotal` (minutes) | `17h 45m (17.75)`; can pass 24h (`76h 30m (76.50)`) |
| Pay schedule set? | Whether a start date exists | Drives the FR-06 state |
| Future day | Day is after today | Not fillable |

## Edge cases

- **Long name:** "Priya Ramaswamy-Kingsley Timesheet" wraps to two lines on phone; the status area drops below the heading.
- **Totals over 24 hours:** 76h 30m (76.50) fortnight total fits at 32px on phone; week 1 shows `42h 30m (42.50)`.
- **Empty:** totals show `0h 00m (0.00)`; Submit and Clear are disabled; the save and status labels are hidden.
- **One item:** an empty day on phone is only a heading line plus "Add hours".
- **Warning and problem on one day:** the problem message replaces the warning message; in the source the row tint follows the warning rule alone, so the tint can remain.
- **Today and future:** "Today" marks Thu 15/10/2026 and is fillable; Fri 16/10/2026 says "Hours can't be added for future days" and has no hours or total.
- **Read-only with empty days:** days with no hours show only the weekday and date.

## Accessibility

- One `h1` (the heading); "Week 1", "Week 2" and "Fortnight total" are `h2`; the rejected block title is an `h2`.
- The fortnight switch is a group labelled "Fortnight".
- Every time field and rest-break input has an accessible name that includes the weekday and date (see Copy).
- The save status has `role="status"`, so changes are announced politely.
- Status is a word plus an icon, never colour alone; warnings and problems are text plus icon.
- The not-saved box has `role="alert"`, so it is announced as soon as it appears; the header status stays `role="status"` and reads "Not saved". Neither relies on colour alone (icon and words).
- The conflict notice has `role="status"` (polite); its dismiss button is icon-only with `aria-label` "Dismiss" and is 44px.
- The session-ended modal can't be closed except by *Sign in again* (`dismissible` false, no X); focus is trapped in it and its title is its accessible name.
- Loading view: `aria-busy="true"` on the sheet, `role="status"` with screen-reader-only text "Loading your timesheet…"; the placeholders are decorative. Load-failed view: `role="alert"`, so the failure is announced.
- Quality floor (DESIGN.md §2): 44px targets and 16px inputs on phones, visible focus.
- Focus order follows reading order: top bar, switch, days top to bottom (start, break, finish), Clear, Submit on desktop (Clear before Submit in the markup); on phone Submit appears above Clear visually while Clear comes first in the markup. See Open questions.
- Not visible in screenshots: the table has no `caption` or accessible name in the mock-up source.

## Motion

The R7 states add no motion of their own (the loading placeholders use the Nuxt UI skeleton's default pulse). Only the status label settles in (scale from 1.04 and opacity from 0.4 to 1, 240 ms, strong ease-out) when arriving from the review after submitting; none with reduced motion. Saved and Saving… changes cross-fade per DESIGN.md §4 (not implemented in the mock-up source). Nothing else animates.

## Changes since approval

| Change | Why | User's OK |
|---|---|---|

## Open questions

1. **Previous fortnight.** The mock-up's switch changes only the Pay period label (to `21/09/2026 to 02/10/2026`); no previous-fortnight data or state was designed or screenshotted. FE design §6.1 also uses `/timesheet/:fortnightStart`, while the mock-up has one route.
2. **Deletion date after Clear.** FE design §6.1 and FR-13 say the header shows the deletion date for a cleared rejected timesheet. The mock-up shows no such date after Clear, and the Clear dialog's 3-month sentence is marked *proposed* in the FE design.
3. **Not-saved details.** The mock-up fixes the state and *Try now* does nothing. Not specified: how often the app retries, whether *Try now* shows progress, and how recovery looks (does the box just disappear and the header return to "Saved"?). The box tells people to leave the page open; closing the tab loses the changes.
4. **Save status when empty.** The mock-up hides "Saved" and the "Draft" label until at least one day has data, so a brand-new timesheet shows no status. After Clear, the status disappears too. Confirm this is intended.
5. **Finish time default.** The source passes `default-pm` to the finish field, but `TimeField` doesn't declare it and the screenshots show finish fields defaulting to AM. Is a PM default wanted (not documented anywhere)?
6. **Phone button order.** On phone, Submit is shown above Clear (reversed flex column) while Clear comes first in the markup; confirm the intended tab order.
7. **Wording of the FR-27 warning for long shifts.** The same text, "Is AM/PM correct?", is shown for shifts over 12 hours (e.g. 13h 00m, see the review's no-warnings screenshot). FR-27 gives only the 1-hour example.
8. **Mock data oddities.** Submitted and approved times (16/10/2026 and 19/10/2026) are after "today" (15/10/2026). Assumed to be mock data only.
9. **Other failures.** Submit failing (network or server error on the review page) and a failed *Clear* have no design; R7 covers loading, a failed load and a failed autosave only.
10. **Rest-break validation.** Input is `min="0"`; behaviour for non-integer or very large values isn't shown. Only "Rest break must be shorter than the shift" is designed.
