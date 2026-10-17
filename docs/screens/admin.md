# Admin (`/admin`)

**Who:** Manager only
**Requirements:** FR-01, FR-04, FR-05, FR-06, FR-22, FR-23, FR-24, FR-25, FR-26; business name (R7-8, conversation decision C-5; needs a PRD requirement)
**Approved:** rounds R5 and R6 on 12/10/2026, with R7 on 18/10/2026 for the Business name section and the loading and load-failed states
**Screenshots:** `mockup/approved/admin-*` and `mockup/approved/admin--*`
**Mock-up page:** `mockup/src/pages/admin/index.vue`

The manager's page for the fortnight PDF, the employee list, the pay schedule, and the business name.

## States

| State | When | What's shown | Screenshots |
|---|---|---|---|
| PDF: some not approved | Pay schedule set; the selected fortnight has timesheets not yet approved (mock: 1 approved, 4 not) | Sections in order: Fortnight PDF, Employees, Pay schedule (set), Business name (set). PDF section shows the caution line, two status-group bands (Waiting for your approval 3, Rejected, waiting for the employee 1), the "no hours" note, and *Download PDF* with "1 approved timesheet" | `admin-state-pdf-some` |
| PDF: all approved | Every timesheet in the fortnight is approved or self-approved (mock: 5) | Green line "All 5 timesheets for this fortnight are approved."; *Download PDF* with "5 approved timesheets"; no groups | `admin-state-pdf-all` |
| First run | Pay schedule not set (FR-04, FR-06) | Pay schedule moves to the top with the warning, explanation, "Choose a Monday" and *Save pay schedule* (disabled); PDF section says "Available once the pay schedule is set."; Employees shows only the manager; Business name is last, with an empty field and *Save business name* (disabled) and the note about "Timesheets" | `admin-state-setup` |
| Choosing a Monday | "Choose a Monday" pressed on first run | Calendar popover (October 2026, weeks start Monday); only Mondays selectable | `admin--calendar` |
| Add employee form | *Add employee* pressed | Modal "Add employee": Full name, Email, note; *Cancel*, *Add employee* (disabled until name present and email contains "@") | `admin--add-employee` |
| Employee added | Form submitted | Modal "{name} added": temporary password shown once with *Copy*, then *Done* | `admin--employee-added` |
| Deactivate confirmation | *Deactivate* pressed on an active employee | Modal "Deactivate {name}?" naming the consequence; *Cancel*, *Deactivate* (danger) | `admin--deactivate` |
| Reset password: confirm | *Reset password* pressed | Modal "Reset {first name}'s password?" with consequence text; *Cancel*, *Reset password* | none (source only) |
| Password reset | Reset confirmed | Modal "New temporary password for {first name}": password once with *Copy*, *Done* | `admin--reset-password` |
| Row actions menu (phone) | ⋯ pressed on an employee row | Menu with Reset password and Deactivate (danger) | none (source only) |
| Copied (toast) | *Copy* pressed | Toast "Copied" | none (source only) |
| Loading (R7-7) | Data takes longer than about 300 ms | Top bar, then the title "Admin" and ruled placeholder lines instead of the sections (shared `LoadState` part); nothing shown if loading is faster | `admin-state-loading` |
| Load failed (R7-7) | The page's data couldn't be fetched | Top bar, the title "Admin", then "Couldn't load the admin page" with the explanation and *Try again* (shared `LoadState` part) | `admin-state-load-failed` |
| Business name | *Change business name* pressed (mock `business-name`: the name is "Harbour Street Bakery") | Last section "Business name" shows the field with the current name filled in, *Cancel* and *Save business name* | `admin-state-business-name` |

## Layout

- **Phone (375px):** one white sheet. Top bar shows "Admin" and a Menu button (manager's phone bar). Sections stack, each starting with an ink rule and `h2`: Fortnight PDF, Employees, Pay schedule, Business name. On first run Pay schedule comes first. The fortnight picker is full width. Each employee is a two-line row (name bold, email small beneath) with a ⋯ button at the right (44px); deactivated people show "Deactivated {date}" at the right instead. Download PDF sits left, with the count beside it. Modal footers stack, primary first, Cancel under it (modals are full width minus a margin).
- **Desktop:** centred sheet (max 5xl, bordered). Fortnight picker and PDF list are capped to a readable width (picker about 384px, list about 576px) and left-aligned. Employees is a four-column row: name, email, status, actions (*Reset password* and *Deactivate* as ghost buttons, no ⋯). Modals are centred, narrow, footer buttons right-aligned.
- **Order:** by how often each is used: Fortnight PDF, Employees, Pay schedule (R5-1), then Business name (R7-8, last because it is set once). On first run Pay schedule moves to the top; Business name stays last.
- **Business name section (R7-8):** ink rule, `h2` "Business name", one line of help. Set: the name in larger semibold text and an outline *Change business name* button (44px on phone, 36px on desktop). Editing or not set: a labelled field (maximum 80 characters) with *Save business name* beside it on desktop (field, then Cancel and Save on one row) and stacked on phone (Save above Cancel; field full width).
- **Status groups** (R6, variant b) use the shared `StatusHeading` in its small form: tinted band, status icon in its colour, title, count on the right (blue clock = waiting for approval; red return arrow = rejected). Names in "Waiting for your approval" are bold; the rejected row is regular weight.
- **Loading and load failed (R7-7):** the top bar stays; the sheet (same width as this page's sheet) shows only the title "Admin", then either ruled placeholder lines (a short line, then five ruled rows with a long and a short placeholder) or a ruled block with the failure heading, one line of text and *Try again* (44px on phone, 36px on desktop). Nothing else from the page is shown.

## Copy

| Where | Text |
|---|---|
| Page title | "Admin" |
| PDF heading | "Fortnight PDF for the accountant" |
| PDF intro | "One A4 page per approved timesheet, signed by the employee and you." |
| Picker label | "Fortnight" |
| Picker options | "{DD/MM/YYYY} to {DD/MM/YYYY} (current)", "... (previous)", or the dates alone for older ones, e.g. "05/10/2026 to 16/10/2026 (current)" |
| Not-approved line | "{n} not approved yet, so not in the PDF" |
| Group titles | "Waiting for your approval", "Rejected, waiting for the employee" |
| Row, waiting | "{name}" (manager's own: "{name} (you)") with link "Review" and arrow |
| Row, rejected | "{name}" with "Waiting for {first name}" |
| No-hours note | "People with no hours this fortnight aren't listed." |
| All approved | "All {n} timesheets for this fortnight are approved." |
| Download | "Download PDF"; beside it "{n} approved timesheet" / "{n} approved timesheets" |
| PDF blocked | "Available once the pay schedule is set." |
| Employees heading | "Employees" |
| Add button | "Add employee" |
| Manager row | "{name} (you, manager)" |
| Status | "Active"; "Deactivated {DD/MM/YYYY}" |
| Row actions | "Reset password", "Deactivate"; phone menu button label "Actions for {name}" |
| Employees note | "Deactivated people can't sign in. Their timesheets are kept." |
| Pay schedule heading | "Pay schedule" |
| Pay schedule, set | "Fortnights start every second Monday, counting from {DD/MM/YYYY}." and "This can't be changed now that timesheets exist." |
| Pay schedule, first run | Warning "Staff can't enter hours until you set this."; "Choose the Monday your first fortnight starts. Fortnights then repeat every 14 days, the same for everyone. Once anyone enters hours, it can't be changed." |
| Date field | Label "First fortnight starts"; button "Choose a Monday", then "Monday {DD/MM/YYYY}" once picked |
| Save | "Save pay schedule" |
| Add: title | "Add employee" |
| Add: fields | "Full name" (required); "Email" (required) with description "For password reset emails." |
| Add: note | "You'll get a temporary password to give them. They choose their own when they first sign in." |
| Add: buttons | "Cancel", "Add employee" |
| Added: title | "{name} added" |
| Added: body | "Give {first name} this temporary password. They'll choose their own when they first sign in." |
| Added: warning | "You won't see this password again. If it's lost, reset it from the employee list." |
| Added: buttons | "Copy", "Done" |
| Deactivate: title | "Deactivate {name}?" |
| Deactivate: body | "{first name} won't be able to sign in. Their timesheets are kept, including any waiting for approval." |
| Deactivate: buttons | "Cancel", "Deactivate" |
| Reset: title | "Reset {first name}'s password?" |
| Reset: body | "Their current password stops working. You'll get a temporary password to give them, and they'll choose a new one when they sign in." |
| Reset: buttons | "Cancel", "Reset password" |
| Reset done: title | "New temporary password for {first name}" |
| Reset done: note | "You won't see this password again." |
| Reset done: buttons | "Copy", "Done" |
| Toast | "Copied" |
| Loading (R7-7) | Title "Admin"; screen-reader text "Loading the admin page…" |
| Load failed (R7-7) | Heading "Couldn't load the admin page"; "Check your internet connection, then try again."; button "Try again" |
| Business name heading | "Business name" |
| Business name help | "Shown above the sign-in box, so staff know they're in the right place." |
| Business name field | Label "Business name" (maximum 80 characters) |
| Business name buttons | "Change business name", "Cancel", "Save business name" |
| Business name, not set | Under the empty field: "Until you set it, the sign-in page just says "Timesheets"." |
| Toast, business name saved | Title "Business name saved" |

## Interactions

| Trigger | Result | Requirement |
|---|---|---|
| Change fortnight | Reloads the not-approved list and approved count for that fortnight | FR-22, FR-23 |
| *Review* on a row | Opens that person's timesheet on Approvals (`/approvals/{fortnight}/{timesheet}`) | FR-23 |
| *Download PDF* | Downloads the fortnight's PDF of approved timesheets; disabled when none are approved | FR-22 |
| *Add employee* (page button) | Opens the add form, empty | FR-24 |
| Add form valid, *Add employee* | Creates the account; modal switches to the temporary password view | FR-01, FR-24 |
| *Copy* | Copies the temporary password; toast "Copied" | FR-24 |
| *Done* / close (X) | Closes the modal; the password is gone and can't be shown again | FR-24 |
| *Reset password* (desktop button or phone menu) | Opens the confirm modal for that person | FR-24 |
| *Reset password* in the modal | Shows the new temporary password once | FR-01, FR-24 |
| *Deactivate* (desktop button or phone menu) | Opens the confirm modal | FR-24, FR-25 |
| *Deactivate* in the modal | Deactivates; the person can't sign in; their timesheets are kept | FR-25 |
| "Choose a Monday" | Opens the calendar; non-Mondays are disabled; picking a Monday closes it and shows "Monday {date}" | FR-04 |
| *Save pay schedule* | Saves the schedule; disabled until a Monday is chosen | FR-04 |
| Pay schedule once timesheets exist | Read-only text with a lock icon | FR-05 |
| Manager row | No Reset or Deactivate offered (you can't deactivate yourself) | FR-25 |
| Account changes, PDF download, pay schedule set | Logged server-side (no UI) | FR-26 |
| Data slow to load | After about 300 ms the loading view replaces the page content | R7-7 |
| Load fails | Load-failed view; *Try again* repeats the request (mock: button does nothing) | R7-7 |
| *Change business name* | Replaces the name with a field holding it, with *Cancel* and *Save business name* | R7-8 |
| Edit the field | *Save business name* is disabled while the field is empty or only spaces | R7-8 |
| *Save business name* | Trims the text, saves it, closes the field and shows the name; toast "Business name saved"; the sign-in pages show it (see `sign-in.md`) | R7-8 |
| *Cancel* | Closes the field without saving (only offered when a name is already set) | R7-8 |
| First run (no name) | The field is open from the start and there is no *Cancel* | R7-8 |

## Components

| Part | Built from | Notes |
|---|---|---|
| Page shell | `TopBar` (`current="admin"`, manager) | Menu on phones |
| Fortnight picker | `UFormField` + `USelect`, size xl, 44px on phone | Tabular figures |
| Status group heading | `StatusHeading` (`small`, renders `h3`) | Kinds "todo" (clock, blue) and "back" (return arrow, red); count in mono |
| Employee list | Ruled list with a grid row; `UButton` ghost; `UDropdownMenu` on phones | Phone ⋯ button 44px, `aria-label` "Actions for {name}" |
| Download | `UButton` primary, download icon, 44px | |
| Pay schedule picker | `UPopover` + `UCalendar` (size xl, 40px days, weeks start Monday, non-Mondays disabled) | |
| Dialogs | `UModal` with title, body and footer | Close X, 44px |
| Temporary password | Mono `code` box with `UButton` Copy (copy icon) | |
| Toast | `useToast`, neutral, copy-check icon | |
| Loading / failed | `LoadState` part (shared by every page), `title` "Admin", `what` "the admin page" | `USkeleton` placeholders; failed uses a cloud-off icon in `danger` and `UButton` with rotate-cw icon. See `timesheet.md` for the full description |
| Business name form | `UFormField` + `UInput` (size xl, `maxlength` 80, 44px on phone, 36px on desktop) in a `form` | Submit on Enter works (native form); buttons `UButton` primary and outline neutral |
| Business name toast | `useToast`, success colour, circle-check icon | |

## Data

All API fields are proposed (no OpenAPI spec yet). Passwords are never handled by the app (Keycloak); temporary passwords are generated by the back end and returned once.

| Shown | From the API | Format |
|---|---|---|
| Fortnight options | List of fortnights from the pay schedule, with current and previous flagged (proposed `fortnights[].start`, `.end`, `.label`) | "{DD/MM/YYYY} to {DD/MM/YYYY}" plus "(current)" or "(previous)" |
| Timesheets for the fortnight | Per fortnight: each person's name, status, own-timesheet flag, timesheet id (proposed `timesheets[]`) | Name; status maps to the group |
| Not-approved count | Count of those not Approved or Self-approved, empty ones left out | Integer |
| Approved count | Count of Approved and Self-approved | Integer; "timesheet" or "timesheets" |
| Download PDF | PDF file for the fortnight (proposed `GET .../fortnights/{start}/pdf`) | A4 PDF |
| Employee list | Name, email, active flag, manager flag, deactivation date (proposed `employees[]`) | Name, email, "Active" or "Deactivated {DD/MM/YYYY}" |
| Add employee | POST name and email; response carries the one-time temporary password | Plain text, shown once |
| Reset password | POST for an employee; response carries a one-time temporary password | Plain text, shown once |
| Deactivate | POST for an employee | None |
| Pay schedule start | Start date of the first fortnight; whether any timesheet exists (locks it) (proposed `paySchedule.start`, `.locked`) | DD/MM/YYYY; Monday |
| Pay schedule set? | Whether a start date exists | Drives first-run layout |
| Business name | Proposed `businessName` (string, maximum 80 characters, empty or absent until set). Read and written from Admin; the back end sets it as the Keycloak realm display name so the login theme can show it (proposed; see Open questions) | Plain text; trimmed on save |

## Edge cases

- **Long names:** "Alexandra Featherstonehaugh" and "Priya Ramaswamy-Kingsley" fit on one line on phone and desktop; email truncates with an ellipsis on phones if too long.
- **First run:** only the manager is in the employee list; PDF section is blocked; Pay schedule on top.
- **Nothing approved:** *Download PDF* disabled, "0 approved timesheets" (source behaviour; no screenshot).
- **All approved:** group lists disappear; green confirmation shows.
- **Only one group has rows:** the empty group's band is not shown.
- **Singular/plural:** "1 approved timesheet" vs "5 approved timesheets".
- **Deactivated person:** muted text, date in mono, no actions; on phones the date replaces the ⋯ button.
- **Empty people list:** people with no hours are never listed (note under the list).
- **Single-word names:** "Waiting for {first name}" uses the first word of the name.
- **Phone modals:** Cancel stacks under the primary button.
- **Long business name:** the sign-in pages wrap a 63-character name onto two lines (see `sign-in.md`); the field allows up to 80 characters. The Admin section shows the name at 18px semibold and the mock-up does not show how a very long one wraps there.
- **Not set:** first run only; the sign-in page shows "Timesheets" alone.
- **Only spaces:** Save stays disabled.

## Accessibility

- Heading outline: `h1` "Admin", `h2` per section, `h3` for each status group.
- Labels: the picker has a visible label; Full name and Email are required fields with visible labels and descriptions; icon-only phone menu button has `aria-label` "Actions for {name}".
- Status groups never rely on colour alone: icon, title and count.
- Modals trap focus and close with Escape or the X; focus should return to the control that opened them.
- The temporary password is selectable text in a `code` box; *Copy* confirms with a toast, which should be announced politely.
- Calendar: arrow-key date navigation (library behaviour); non-Mondays are disabled, not hidden.
- Targets 44px on phones; inputs 16px or larger.
- Loading view: `aria-busy="true"` on the sheet, `role="status"` with screen-reader-only text "Loading the admin page…"; the placeholders are decorative. Load-failed view: `role="alert"`, so the failure is announced. The `h1` stays in both.
- Business name: the field has a visible label; Save is disabled (not hidden) while empty. After saving or cancelling, focus should return to *Change business name* (to confirm in the build); the "Business name saved" toast should be announced politely.

## Motion

None specified for this page. Nuxt UI defaults apply to modals, the popover, the menu and the toast.

## Changes since approval

| Change | Why | User's OK |
|---|---|---|

## Open questions

1. **Fixture mismatch.** The mock-up's pay schedule start (12/01/2026) is 266 days (19 weeks) before the current fortnight start (05/10/2026), so it is not a multiple of 14 days. Real data will be consistent; the copy is unaffected.
2. **Past Mondays.** Does the calendar allow any past Monday, or only future or recent ones? The mock-up allows every Monday (screenshot shows 5, 12, 19 and 26 October all enabled). FR-04 says only "must be a Monday".
3. **Save pay schedule feedback.** No confirmation, toast or resulting state was designed; after saving, the page presumably shows the set state, but that isn't specified.
4. **Reset password confirm step and phone ⋯ menu** have no approved screenshot (source only).
5. **Add employee errors** are not designed: duplicate email, invalid email beyond the "@" check, server failure. The mock-up enables the button when the email contains "@".
6. **Copy failure.** The mock-up copies with the clipboard and shows "Copied" regardless; behaviour when the clipboard isn't available is not defined.
7. **Closing the password dialog by X or Escape** also loses the password; no extra "are you sure" is designed.
8. **Reactivating** a deactivated person: not in the design or in FR-24.
9. **Download PDF** loading, failure and "nothing approved" states are not designed; the button is just disabled at 0.
10. **Picker range:** the mock-up lists three fortnights. Which fortnights the real list offers (all since the schedule start?) isn't settled.
11. **Focus and DOM order on first run.** The page reorders sections with CSS so Pay schedule is first visually but last in the source. The real build should order the DOM to match, otherwise keyboard and screen reader order differs from what is seen.
12. **Review link target.** The mock-up passes a mock state to the approvals URL; the real link is `/approvals/{fortnight}/{timesheet}`.
13. **Manager's own deactivation and role:** the manager row has no actions; M1 has one manager whose role is set in Keycloak, not on this page (fe-design §6.3).
14. **Business name requirement.** There is no PRD requirement for it yet (R7 decision: "needs a PRD requirement"). The FR number is to be added.
15. **Where the name is stored.** Proposed: the back end saves it as the Keycloak realm display name when the manager saves it, so the login theme can read it without calling the app. Needs confirming against what Keycloak allows and how a failed sync is shown.
16. **Save feedback and errors.** The mock-up shows a toast and no error state (server failure). The name cannot be cleared once set (Save is disabled when empty), so the "Until you set it" note only appears before the first save. Any other rule (special characters, repeated spaces) is not defined.
17. **Who can change it.** The manager only (Admin is manager-only); not stated in the R7 notes.
