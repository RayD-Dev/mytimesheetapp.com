# Admin (`/admin`)

**Who:** Manager only
**Requirements:** FR-01, FR-04, FR-05, FR-06, FR-22, FR-23, FR-24, FR-25, FR-26, FR-28 (business name and optional logo; R7-8 and R8-1)
**Approved:** rounds R5 and R6 on 12/10/2026, with R7 on 18/10/2026 for the Business name section and the loading and load-failed states, and R8 on 18/10/2026 for the logo and the error states
**Screenshots:** `mockup/approved/admin-*` and `mockup/approved/admin--*`
**Mock-up page:** `mockup/src/pages/admin/index.vue`

The manager's page for the fortnight PDF, the employee list, the pay schedule, and the business name and logo.

## States

| State | When | What's shown | Screenshots |
|---|---|---|---|
| PDF: some not approved | Pay schedule set; the selected fortnight has timesheets not yet approved (mock: 1 approved, 4 not) | Sections in order: Fortnight PDF, Employees, Pay schedule (set), Business name and logo (set). PDF section shows the caution line, two status-group bands (Waiting for your approval 3, Rejected, waiting for the employee 1), the "no hours" note, and *Download PDF* with "1 approved timesheet" | `admin-state-pdf-some` |
| PDF: all approved | Every timesheet in the fortnight is approved or self-approved (mock: 5) | Green line "All 5 timesheets for this fortnight are approved."; *Download PDF* with "5 approved timesheets"; no groups | `admin-state-pdf-all` |
| First run | Pay schedule not set (FR-04, FR-06) | Pay schedule moves to the top with the warning, explanation, "Choose a Monday" and *Save pay schedule* (disabled); PDF section says "Available once the pay schedule is set."; Employees shows only the manager; Business name and logo is last, with an empty name field, *Save business name* (enabled; it checks on press) and the note about "Timesheets" | `admin-state-setup` |
| Choosing a Monday | "Choose a Monday" pressed on first run | Calendar popover (October 2026, weeks start Monday); only Mondays selectable | `admin--calendar` |
| Add employee form | *Add employee* pressed | Modal "Add employee": Full name, Email, note; *Cancel*, *Add employee* (enabled; it checks on press) | `admin--add-employee` |
| Add employee error (R8-4) | *Add employee* pressed with the name missing or the email wrong (mock: name empty, email already used by Lee Wong) | The same dialog; Full name red with "Enter their full name."; Email red with "Lee Wong already uses this email."; focus on Full name; a toast "Employee not added" behind the dialog | `admin--add-employee-error` |
| Employee added | Form submitted | Modal "{name} added": temporary password shown once with *Copy*, then *Done* | `admin--employee-added` |
| Deactivate confirmation | *Deactivate* pressed on an active employee | Modal "Deactivate {name}?" naming the consequence; *Cancel*, *Deactivate* (danger) | `admin--deactivate` |
| Reset password: confirm | *Reset password* pressed | Modal "Reset {first name}'s password?" with consequence text; *Cancel*, *Reset password* | none (source only) |
| Password reset | Reset confirmed | Modal "New temporary password for {first name}": password once with *Copy*, *Done* | `admin--reset-password` |
| Row actions menu (phone) | ⋯ pressed on an employee row | Menu with Reset password and Deactivate (danger) | none (source only) |
| Copied (toast) | *Copy* pressed | Toast "Copied" | none (source only) |
| Loading (R7-7) | Data takes longer than about 300 ms | Top bar, then the title "Admin" and ruled placeholder lines instead of the sections (shared `LoadState` part); nothing shown if loading is faster | `admin-state-loading` |
| Load failed (R7-7) | The page's data couldn't be fetched | Top bar, the title "Admin", then "Couldn't load the admin page" with the explanation and *Try again* (shared `LoadState` part) | `admin-state-load-failed` |
| PDF failed (R8-4) | *Download PDF* pressed and the server couldn't make the PDF | As PDF: some not approved, with a red inline message under the button: "The PDF couldn't be made. Try again in a moment." (`role="alert"`) and a toast "PDF not downloaded"; the button stays enabled | `admin-state-pdf-failed` |
| Business name | *Change business name* pressed (mock `business-name`: the name is "Harbour Street Bakery") | Last section "Business name and logo" shows, under Name, the field with the current name filled in, *Cancel* and *Save business name* | `admin-state-business-name` |
| Logo (R8-1) | A logo is uploaded | Under the Logo part (marked optional): the logo preview (64px high, up to 240px wide, on a bordered white box), *Replace logo* and *Remove logo*, then the format note | `admin-state-logo` |
| Logo too big (R8-4) | A chosen file is over 1 MB (mock: 3.2 MB), so it isn't used | No logo (or the old one stays). *Upload logo* turns red; under the format note a red message "That file is 3.2 MB. Logos can be up to 1 MB." (`role="alert"`) and a toast "Logo not saved" | `admin-state-logo-too-big` |
| No logo (default) | No logo uploaded yet; the default in the other states | Logo part: "Without one, the sign-in page shows the name on its own.", *Upload logo*, then the format note | none (visible at the bottom of the PDF: some not approved screenshot) |
| Name empty on save (source only) | *Save business name* pressed with the field empty or only spaces | Field red with "Enter the business name.", focus on it, and a toast "Business name not saved" | none (source only) |

## Layout

- **Phone (375px):** one white sheet. Top bar shows "Admin" and a Menu button (manager's phone bar). Sections stack, each starting with an ink rule and `h2`: Fortnight PDF, Employees, Pay schedule, Business name. On first run Pay schedule comes first. The fortnight picker is full width. Each employee is a two-line row (name bold, email small beneath) with a ⋯ button at the right (44px); deactivated people show "Deactivated {date}" at the right instead. Download PDF sits left, with the count beside it. Modal footers stack, primary first, Cancel under it (modals are full width minus a margin).
- **Desktop:** centred sheet (max 5xl, bordered). Fortnight picker and PDF list are capped to a readable width (picker about 384px, list about 576px) and left-aligned. Employees is a four-column row: name, email, status, actions (*Reset password* and *Deactivate* as ghost buttons, no ⋯). Modals are centred, narrow, footer buttons right-aligned.
- **Order:** by how often each is used: Fortnight PDF, Employees, Pay schedule (R5-1), then Business name and logo (R7-8 and R8-1, last because it is set once). On first run Pay schedule moves to the top; Business name and logo stays last.
- **Business name and logo section (R7-8, R8-1):** ink rule, `h2` "Business name and logo", one line of help, then two parts. Name (`h3`): set, the name in larger semibold text and an outline *Change business name* button (44px on phone, 36px on desktop); editing or not set, a labelled field (maximum 80 characters) with *Save business name* beside it on desktop (field, then Cancel and Save on one row) and stacked on phone (Save above Cancel; field full width). Logo (`h3`, marked "(optional)"): without a logo, a line of help and an outline *Upload logo* button with an upload icon; with a logo, the preview and, under it, *Replace logo* (outline) and *Remove logo* (ghost), side by side on desktop and stacked on phone. The format note comes last, then any error.
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
| Section heading (R8-1) | "Business name and logo"; part headings "Name" and "Logo" with "(optional)" in muted text |
| Logo, none | "Without one, the sign-in page shows the name on its own."; button "Upload logo" |
| Logo, set | Image alt text "Your logo"; buttons "Replace logo", "Remove logo" |
| Logo format note | "PNG or JPG, up to 1 MB. A logo on a white or clear background works best." |
| Logo too big | "That file is {size} MB. Logos can be up to 1 MB." (mock: "That file is 3.2 MB. Logos can be up to 1 MB."); toast title "Logo not saved" with the same message |
| Toast, logo saved | Title "Logo saved" |
| Business name empty | Field message "Enter the business name."; toast title "Business name not saved", description "Fix the highlighted field." |
| Add employee errors | Full name: "Enter their full name."; Email: "Enter an email address, like name@example.com." or "{name} already uses this email." (mock: "Lee Wong already uses this email."); toast title "Employee not added", description "Fix the highlighted fields." |
| PDF failed | Inline "The PDF couldn't be made. Try again in a moment."; toast title "PDF not downloaded" with the same description |

## Interactions

| Trigger | Result | Requirement |
|---|---|---|
| Change fortnight | Reloads the not-approved list and approved count for that fortnight | FR-22, FR-23 |
| *Review* on a row | Opens that person's timesheet on Approvals (`/approvals/{fortnight}/{timesheet}`) | FR-23 |
| *Download PDF* | Downloads the fortnight's PDF of approved timesheets; disabled when none are approved | FR-22 |
| *Add employee* (page button) | Opens the add form, empty | FR-24 |
| Add form valid, *Add employee* | Creates the account; modal switches to the temporary password view | FR-01, FR-24 |
| *Add employee* with the name empty, or the email malformed or already used | Dialog stays open; the bad fields turn red with their messages, focus moves to the first, and a toast "Employee not added" appears. The button stays enabled and checks on press | FR-24, R8-4 |
| *Download PDF* fails | Red inline message under the button plus a toast "PDF not downloaded"; the button stays enabled, so the manager can try again | FR-22, R8-4 |
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
| *Save business name* with the field empty or only spaces | Field turns red with "Enter the business name.", focus moves to it, toast "Business name not saved". The button is never disabled; it checks on press | R7-8, R8-4 |
| *Save business name* | Trims the text, saves it, closes the field and shows the name; toast "Business name saved"; the sign-in pages show it (see `sign-in.md`) | R7-8 |
| *Cancel* | Closes the field without saving (only offered when a name is already set) | R7-8 |
| First run (no name) | The field is open from the start and there is no *Cancel* | R7-8 |
| *Upload logo* / *Replace logo* | Opens the file picker, limited to PNG and JPG | R8-1 |
| Choose a file of 1 MB or less | Shows it as the logo and the toast "Logo saved"; the sign-in pages use it (see `sign-in.md`) | R8-1 |
| Choose a file over 1 MB | The file is not used; the old logo, if any, stays; red message by the button and the toast "Logo not saved" | R8-1, R8-4 |
| *Remove logo* | Removes the logo at once (no confirmation, no toast in the mock-up); the sign-in page shows the name on its own | R8-1 |
| Errors (app-wide rule, R8-4) | Form errors on button press: the field turns red with a message under it, focus moves to the first bad field, and a toast says what didn't happen. Failed actions: an inline message by the button plus a toast, never a toast alone. Live typing errors: red field and message, no toast. Keycloak pages: red field plus the alert box, no toasts | R8-4 |

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
| Business name form | `UFormField` (with `error`) + `UInput` (size xl, `maxlength` 80, 44px on phone, 36px on desktop) in a `form` | Submit on Enter works (native form); buttons `UButton` primary and outline neutral |
| Logo | Hidden `input type="file"` (`accept` PNG and JPEG), opened by `UButton` outline with an upload icon; preview `img` | Preview `h-16 max-w-60`, `object-contain`, bordered, `alt="Your logo"`. *Upload logo* turns `error` colour with `aria-invalid` when the last file was refused |
| Logo error, PDF failed | `p` or `section` with `role="alert"`, circle-alert icon, `danger` text or tinted border and background | Under the format note; under *Download PDF* |
| Add employee fields | `UFormField` with `error` | Focus goes to the first `aria-invalid` field |
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
| Logo | **Proposed:** `logoUrl` (string, absent until uploaded) on the business settings; `PUT /api/v1/business/logo` uploads or replaces it (multipart file) and `DELETE /api/v1/business/logo` removes it. Back end checks the file: PNG or JPG only (by content, not just the name), up to 1 MB; SVG is refused because it can carry scripts. The sign-in pages show it (see `sign-in.md`) | PNG or JPG, up to 1 MB; shown at most 48px high and 240px wide on the sign-in pages |
| Add employee errors | **Proposed:** a duplicate email comes back as a field error from the add call (the mock-up knows only lee.wong@example.com); empty name and malformed email are checked on the page first | Message per field |
| PDF failure | A failed or timed-out PDF call | Inline message plus toast |
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
- **Only spaces:** Save shows "Enter the business name." (R8-4); it is no longer disabled.
- **Logo, shapes:** the preview and the sign-in page keep any shape inside 240 by 64px (preview) and 240 by 48px (sign-in); a very wide logo becomes a thin strip (see `sign-in.md`).
- **Logo refused:** a refused file leaves the old logo in place; the error stays until another file is chosen or the page reloads.
- **Logo, no logo set:** the preview is not shown; only the help line and *Upload logo*.

## Accessibility

- Heading outline: `h1` "Admin", `h2` per section, `h3` for each status group.
- Labels: the picker has a visible label; Full name and Email are required fields with visible labels and descriptions; icon-only phone menu button has `aria-label` "Actions for {name}".
- Status groups never rely on colour alone: icon, title and count.
- Modals trap focus and close with Escape or the X; focus should return to the control that opened them.
- The temporary password is selectable text in a `code` box; *Copy* confirms with a toast, which should be announced politely.
- Calendar: arrow-key date navigation (library behaviour); non-Mondays are disabled, not hidden.
- Targets 44px on phones; inputs 16px or larger.
- Loading view: `aria-busy="true"` on the sheet, `role="status"` with screen-reader-only text "Loading the admin page…"; the placeholders are decorative. Load-failed view: `role="alert"`, so the failure is announced. The `h1` stays in both.
- Business name: the field has a visible label. After saving or cancelling, focus should return to *Change business name* (to confirm in the build); the "Business name saved" toast should be announced politely.
- Errors (R8-4): a field with a problem has `aria-invalid="true"` and its message attached; on a button press focus moves to the first invalid field. The logo error and the PDF-failed message are `role="alert"`, so they are announced; error toasts are announced too. Each uses an icon and words, not colour alone. *Upload logo* is `aria-invalid` after a refused file.
- Logo: the hidden file input is not in the tab order; *Upload logo* and *Replace logo* open the picker. The preview has `alt` "Your logo"; on the sign-in page the logo is decorative.

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
5. **Add employee, server failure.** Empty name, malformed email and a used email are designed (R8-4). A failed add call (connection or server) has no design yet; by the app-wide rule it would be an inline message by *Add employee* plus a toast.
6. **Copy failure.** The mock-up copies with the clipboard and shows "Copied" regardless; behaviour when the clipboard isn't available is not defined.
7. **Closing the password dialog by X or Escape** also loses the password; no extra "are you sure" is designed.
8. **Reactivating** a deactivated person: not in the design or in FR-24.
9. **Download PDF** loading and the "nothing approved" state are not designed; the button is just disabled at 0. A failed PDF is designed (R8-4).
10. **Picker range:** the mock-up lists three fortnights. Which fortnights the real list offers (all since the schedule start?) isn't settled.
11. **Focus and DOM order on first run.** The page reorders sections with CSS so Pay schedule is first visually but last in the source. The real build should order the DOM to match, otherwise keyboard and screen reader order differs from what is seen.
12. **Review link target.** The mock-up passes a mock state to the approvals URL; the real link is `/approvals/{fortnight}/{timesheet}`.
13. **Manager's own deactivation and role:** the manager row has no actions; M1 has one manager whose role is set in Keycloak, not on this page (fe-design section 6.3).
14. ~~Business name requirement.~~ Resolved: PRD FR-28 (business name and optional logo).
15. **How the sign-in pages get the name and logo.** Open in the BE design (section 11): the Keycloak realm display name, or a public app endpoint that returns only the name and logo. The logo makes the public endpoint more likely. Decide before M1.3.
16. **Business name, server failure.** An empty name now shows an error on press (R8-4). A failed save has no design. The name cannot be cleared once set, so the "Until you set it" note only appears before the first save. Any other rule (special characters, repeated spaces) is not defined.
17. **Who can change it.** The manager only (Admin is manager-only); not stated in the R7 notes.
18. **Logo storage and checks.** Proposed `PUT` and `DELETE /api/v1/business/logo`; where the file is kept, how a public URL is served to the sign-in pages, and the content check (PNG or JPG, 1 MB) are for the HLD. The mock-up checks size only (the real check also looks at the file type).
19. **Logo upload feedback.** The mock-up shows "Logo saved" at once; a slow or failed upload (connection, server) and *Remove logo* confirmation or toast are not designed. Image dimensions have no minimum or maximum other than the display limits.
20. ~~Logo requirement.~~ Resolved: PRD FR-28.
