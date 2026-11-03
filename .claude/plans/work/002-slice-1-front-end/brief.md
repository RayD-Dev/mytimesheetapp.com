# 002 Slice 1 front end: Profile signature, My timesheet and Submit

**Goal:** Build the real front end for slice 1: the app shell, Profile with a signature, My timesheet with autosave, and the submit review. It should match the approved mock-up and pass every end-of-slice check.
**Status:** Approved 03/11/2026, with the engineering decisions C-4 to C-10 and AC-29 added in review

## Why

Staff need to record a fortnight of shifts on their phones and submit them, signed, so the business can stop using paper (PRD section 2). Slice 1 is the first usable piece. Delivery order: (1) Profile signature, My timesheet and submit (PRD section 4, AD-16). The design is approved and frozen (rounds R1–R8, `mockup/approved/`), so this brief is about engineering it. Source: conversation 18/10/2026, "Lets continue with the next steps". The decisions that were open before slice 1 were made on 03/11/2026 and are recorded as C-4 to C-10; the tickets are in the readiness checklist in Notion ("M1 (MVP) Readiness Checklist and Build Tickets").

## Requirements

| ID | Requirement | Source |
|---|---|---|
| FR-01 | Sign in with your own account (Keycloak). Profile's *Change password* goes to Keycloak and back | PRD section 6, Access |
| FR-02 | Employees see only their own timesheets | PRD section 6, Access |
| FR-06 | Until the pay schedule is set: "Your manager hasn't set up the pay schedule yet", and no hours can be entered | PRD section 6, Pay schedule |
| FR-07 | One timesheet per fortnight; switch between the current and previous fortnight; a rejected one is fixable whatever its fortnight | PRD section 6 |
| FR-08 | Monday to Friday, each with start time, rest break (mins) and finish time; every day optional | PRD section 6 |
| FR-09 | Start and finish both needed, finish after start, break shorter than the shift, no future days | PRD section 6 |
| FR-10 | Hours previewed while typing; the server's figure replaces the preview | PRD section 6 |
| FR-11 | 12-hour times; hours as `8h 10m (8.17)`, rounded half-up for display only; totals past 24 hours; the totals note | PRD section 6 |
| FR-12 | Autosave as a draft; never-submitted drafts show their expiry date | PRD section 6 |
| FR-13 | Clear after a confirmation; a cleared rejected timesheet shows its deletion date | PRD section 6 |
| FR-14 | Submit once a day has hours; review; declaration plus a tick per warning day; signature, name, date and time applied; read-only afterwards | PRD section 6 |
| FR-17 | A rejected timesheet shows the manager's reason and is editable (shown in slice 1; rejecting arrives in slice 2) | PRD section 6 |
| FR-20 | Profile: draw or type a signature (three styles), replace it; prompted at first submit | PRD section 6; DESIGN.md decision log (styles) |
| FR-21 | Replacing a signature doesn't change submitted timesheets | PRD section 6 |
| FR-27 | Warn on 1 hour or less, or more than 12 hours, worked; never block | PRD section 6 |
| D-1 | Screens match the approved screenshots (as updated by R9, C-10) page for page and state for state; differences are bugs unless recorded in the spec | `mockup/approved/README.md`; ui-e2e skill |
| D-2 | Shared states from R7–R8: loading, failed to load, session ended, not found, no access, Not saved, changed on another device, and the error rule (red field plus a toast; never a toast alone) | `docs/screens/*.md`; DESIGN.md section 5 |
| D-3 | Coding standards and check gates | `.claude/skills/ui-e2e/references/standards.md` (agreed 12/10/2026) |
| C-1 | Contract first: write the slice 1 OpenAPI contract, then build and test the front end against a mock API generated from it; the real back end follows the same contract in its own plan | Conversation 18/10/2026: chose "Contract first, mock API" |
| C-2 | The Keycloak sign-in pages (R7–R8 design: sign in, wrong password, signed out, deactivated, choose a new password, reset, link expired) are themed in this slice, with a local Keycloak for development | Conversation 18/10/2026: chose "Yes, in slice 1" |
| C-3 | The business name and logo on the sign-in pages arrive with slice 3; until then they show "Timesheets" | PRD FR-28; `docs/screens/sign-in.md` |
| C-4 | Browser sign-in: the Spring Boot app is the Keycloak client and the browser holds only an HttpOnly session cookie, so the front end has no sign-in token code; its only security detail is reading the CSRF token and sending it as a header. Sessions last 30 minutes idle and 8 hours absolute (autosaves count as activity), and Keycloak's own session uses the same values. API calls carry a CSRF header. The mock API uses a signed-in flag and returns the same 401 as the real API. The back end builds this as ticket BE-09 | Conversation 03/11/2026; Notion page "Browser Sign-In: Decision, Pros and Cons, and Security Threats" |
| C-5 | Contract: REST with OpenAPI 3 stays (AD-02, AD-13). The back-end plan adds oasdiff and a test that the generated spec equals the committed one | Conversation 03/11/2026: "Yes, keep OpenAPI"; Notion page "API Contract Options: OpenAPI vs Protobuf" |
| C-6 | Tooling: pnpm for the web app, with its version pinned through Corepack; `signature_pad` for drawing, used only inside our own wrapper component with a fixed 2.5 px stroke | Conversation 03/11/2026: "Yes, pnpm", "Yes, signature_pad" |
| C-7 | Autosave: a day saves 1 second after the last change and when the field loses focus; one save queue for the whole timesheet, because the version belongs to the timesheet; 10 second request timeout. Only network failures, timeouts and 5xx errors are retried, up to 10 times after the first attempt, waiting 2, 4, 8, 16, 32 and then 60 seconds, with jitter; coming back online or the tab becoming visible brings the next attempt forward but adds none. After the 10th failure saving stops, the timesheet is read-only, a message says what is safe, why saving failed and that a reload is needed, and *Try again* stays. When the tab is hidden or closed, one last save is sent with `fetch` and `keepalive`. 400, 409 and 401 are never retried | Conversation 03/11/2026: "Yes, keep Try again" |
| C-8 | Larger text and zoom: My timesheet, Submit review and Profile work at 320 px wide and with text up to 150%, with no sideways scroll (the mock-up check on 03/11/2026 found the Start and Finish time fields wider than the screen below 336 px). Approvals, Admin and the other screens follow with M2's WCAG work | Conversation 03/11/2026: "Fix core screens in M1" |
| C-9 | Passwords: the M1 rule stays at 8 characters with letters and numbers (PRD FR-01). Keycloak also refuses breached passwords, using the Have I Been Pwned Pwned Passwords range API (ticket BE-10), so the "choose a new password" page needs a message for it | Conversation 03/11/2026: "happy with A but with using a breached password api check" |
| C-10 | Mock-up round R9 comes first for the new states: the stopped-saving state, the idle-timeout warning (C-11), the 320 px and larger-text layout of the three core screens, and the breached-password message. The affected screenshots in `mockup/approved/` are replaced and the screen specs, DESIGN.md and ROUNDS.md updated. Building FE-10 and the screens R9 changes waits for it | Conversation 03/11/2026; design rule in `mockup/ROUNDS.md` |
| C-11 | Idle warning: two minutes before the 30-minute idle timeout a warning appears with *Stay signed in*, so typing after a quiet expiry isn't lost. The session ends only if the person doesn't respond | Conversation 03/11/2026: "Yes, warn 2 minutes before" |
| C-12 | Signature storage: the drawn or typed image, its kind, the typed text and the style are saved and replaced together in one request, so they can't disagree. The image is the record that submissions and approvals copy; text and style only pre-fill the editor | Conversation 03/11/2026: "Shouldn't we just update the image and signature?" |

## What the user sees

| Page | Spec | Screenshots |
|---|---|---|
| Sign-in pages (Keycloak theme) | `docs/screens/sign-in.md` | `sign-in-state-*` (no-logo states) |
| App shell: top bar (employee and manager), not found, no access, session ended | `docs/screens/not-found.md`, `timesheet.md` | `not-found-state-*`, `timesheet--session-ended` |
| My timesheet (`/timesheet`) | `docs/screens/timesheet.md` | `timesheet-state-*`, `timesheet--after-submit` |
| Submit review (`/timesheet/review`, a full-screen step) | `docs/screens/timesheet-review.md` | `timesheet-review--*` |
| Profile (`/profile`) | `docs/screens/profile.md` | `profile-state-*`, `profile--password-changed` |

## Acceptance criteria

Each one becomes at least one test.

| AC | Given, when, then | Covers |
|---|---|---|
| AC-1 | Given a signed-out visitor, when they open any app URL, then they're sent to sign in and come back to that URL afterwards | FR-01, C-4 |
| AC-2 | Given an employee, when they open `/approvals` or `/admin`, then they see "This page is for managers" with *Go to My timesheet*; an unknown URL shows "Page not found" | FR-02, D-2 |
| AC-3 | Given no pay schedule, when an employee opens My timesheet, then they see the FR-06 message and no fields | FR-06 |
| AC-4 | Given the current fortnight, when the employee switches to Previous fortnight, then the pay period and the days change; no other fortnight can be chosen | FR-07 |
| AC-5 | Given a day, when the employee types times, then the day, week and fortnight hours preview at once in `{h}h {mm}m (decimal)` form, and the server's figures replace them after the save | FR-10, FR-11 |
| AC-6 | Given shared fixture cases (0h 45m, 8h 00m, 8h 10m (8.17), 76h 30m, three days of 8h 10m = 24h 30m (24.50)), when formatted, then the web app's output matches the cases the server uses | FR-11 |
| AC-7 | Given a day with a start and no finish, or finish before start, or break as long as the shift, then that field turns red with its message and no toast; a future day can't be filled in | FR-09, D-2 |
| AC-8 | Given a day of 1h 00m or 12h 30m worked, then the row is tinted with "This shift is {h}h {mm}m. Is AM/PM correct?", and saving still works | FR-27 |
| AC-9 | Given an edit, when the employee stops typing for 1 second or leaves the field, then the day saves with no Save button, and the status shows "Saving…" then "Saved"; edits made during a save wait in one queue and go in the next request with the version from the last response | FR-12, C-7 |
| AC-10 | Given no connection, when a save fails, then the status shows "Not saved" with the box and a toast, the app retries after 2, 4, 8, 16, 32 and then 60 seconds (10 retries at most, only for network failures, timeouts and 5xx errors), and leaving the page asks for confirmation. After the 10th failure the timesheet becomes read-only with a message that says the latest changes weren't saved, that hours saved before the last saved time are safe, why saving failed (no connection or a server error) and that a reload is needed; *Try again* stays and saves at once when pressed | FE design section 7.1, D-2, C-7 |
| AC-11 | Given the timesheet changed on another device, when a save is refused for its version, then the timesheet reloads and shows the "changed on another device" notice | FE design section 7.1, D-2 |
| AC-12 | Given a never-submitted draft, then the header shows "Kept until {date} if not submitted" from the API | FR-12 |
| AC-13 | Given *Clear*, when confirmed, then all hours go; on a rejected timesheet the dialog mentions the 3-month deletion and the header shows the deletion date | FR-13 |
| AC-14 | Given no day with hours, then *Submit* is disabled with "Add hours to at least one day to submit." | FR-14 |
| AC-15 | Given *Submit*, then the review lists only days with hours, the totals, a tick per warning day ("Yes, {start} to {finish} is correct") and the declaration; *Submit timesheet* stays disabled with a hint naming what's left | FR-14, FR-27 |
| AC-16 | Given an employee with no signature, when they reach the review, then they set one up there (type with a style, or draw) before submitting | FR-20 |
| AC-17 | Given everything ticked, when *Submit timesheet* succeeds, then they return to a read-only Submitted timesheet with the "Timesheet submitted" toast; when it fails, the inline message and a toast show and nothing is lost | FR-14, D-2 |
| AC-18 | Given Submitted, Approved or Rejected timesheets, then each shows its status word and icon; Submitted and Approved are read-only; Rejected shows the reason first and is editable | FR-14, FR-17 |
| AC-19 | Given Profile, when the employee types their name and picks one of three styles, or draws, and saves, then the signature is stored and shown with "Saved {date}"; an empty name or blank drawing shows the red field and a toast | FR-20, D-2 |
| AC-20 | Given a replaced signature, then a submitted timesheet still shows the old one | FR-21 |
| AC-21 | Given *Change password*, then the app sends the user to Keycloak's password page and shows "Password changed" when they come back | FR-01 |
| AC-22 | Given the session ends while a page is open, then the "You've been signed out" dialog shows, and signing in again returns to the page; a save refused with 401 is not retried, and the mock API returns the same 401 as the real one | D-2, C-4, C-7 |
| AC-23 | Given slow or failed loading, then each page shows its loading lines (after about 300 ms) or "Couldn't load {what}" with *Try again* | D-2 |
| AC-25 | Given the Keycloak pages, then sign in, wrong password (both fields red plus the box), signed out, deactivated, choose a new password (with the 8-character rule, the breached-password message and the other errors), reset and link expired match `sign-in-state-*` (as updated by R9) without a logo | FR-01, FR-25, C-2, C-9 |
| AC-26 | Given the mock API, then every request and response the front end makes matches the OpenAPI contract, checked by the generated runtime schemas | C-1, D-3 |
| AC-24 | Given every page and state above, at 375×812 and 1280×800, then the screens match `mockup/approved/` (as updated by R9), with no sideways scroll, and axe finds nothing serious or critical; and My timesheet, Submit review and Profile have no sideways scroll at 320×640 and with text up to 150% | D-1, D-3, C-8 |
| AC-27 | Given unsaved changes, when the tab is hidden or closed, then one last save is sent with `keepalive` | C-7 |
| AC-28 | Given the time input, when the employee types the hour, the minute and then a or p, then the time is set with the right AM or PM (checked on an iPhone 03/11/2026; Android still to check) | FR-11 |
| AC-29 | Given any request that changes data (save, clear, submit, signature), when the front end sends it, then it carries the CSRF header, and the mock API refuses one without it with the same 403 as the real API; the header rule is part of the contract | C-4, C-1 |
| AC-30 | Given a signed-in session with 2 minutes left before the idle timeout, then a warning shows with *Stay signed in*; pressing it keeps the session, and ignoring it ends the session with the "You've been signed out" dialog | C-11, C-4 |

## Out of scope

- Approvals and Admin (slices 2 and 3), the PDF (slice 4), and the business name and logo (slice 3). Until slice 3, the sign-in pages show "Timesheets".
- Back-end code. This brief covers the front end; the API contract it needs goes to the back-end plan (ui-e2e skill, step 3).
- M2 items: recall, amendments, weekend shifts, and passkeys with the two-factor work (they need the final domain name first).
- Larger-text and zoom fixes for Approvals, Admin and the other screens (M2's WCAG work).
- A screen that lists or removes a person's passkeys or sessions.

## Future impact

These roadmap items touch this code; the plan lists the seam each one gets (standards, "Future milestones"): weekend and overnight shifts, recall and amendments, more soft warnings, configurable periods (M3), tenants and per-tenant sign-in (M3), pay rates (M4), and multiple languages (Later).

## Open questions

None blocking. Answered in conversation 18/10/2026:
- Back end: contract first. The slice 1 OpenAPI contract is written now. The front end is built and tested against a mock API generated from it, and a separate back-end plan builds the real API to the same contract (C-1).
- The Keycloak sign-in pages (R7 theme) are in this slice, with a local Keycloak for development (C-2).

Answered in conversation 03/11/2026: C-4 to C-10 above (sign-in approach, contract format, package manager, signature library, autosave retry, larger text and zoom, session timeouts, password policy, passkeys moved to M2).

Still open, none blocking: the time input needs a check on an Android phone (the fallback is the typed-time variant with an AM/PM switch from mock-up round R1); the Keycloak back-channel logout with Spring's CSRF protection and the first request from an emailed link under `SameSite=Strict` are to be tested in BE-09. FR-07 lets a rejected timesheet be fixed whatever its fortnight, but AC-4 offers only the current and previous fortnight; how an older rejected timesheet is opened is not specified (nothing can be rejected until slice 2, so the plan notes it and slice 2 settles it). An edit made in the last second before the session ends is lost; the session-ended dialog already says only saved hours are safe.
