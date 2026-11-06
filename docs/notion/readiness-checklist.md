<!-- Read-only copy of M1 (MVP) Readiness Checklist and Build Tickets: https://app.notion.com/p/408771bd4d43817a9954e1bd945a95ac
     Notion is the master; comment and edit there, then run docs-sync.
     Notion last edited: 2026-11-04T05:17:55.856Z · Synced: 04/11/2026 -->
<content>
<callout icon="✅" color="gray_bg">
<b>Status:</b> Draft · <b>Last updated:</b> <date start="2026-11-04" /> · <b>Type:</b> Delivery plan. What is left before M1 (the MVP) can ship, cut into tickets of 5 points (about a week) or less. Companion to the Product Requirements (PRD), HL Design Doc, System Design and the two Detailed Design Docs in this project.
</callout>

<table-of-contents />

---

## 1. Summary

M1 is designed, and M1.1's front end is being built against a mock API. Its tasks are in review or waiting their turn, none is on <code>main</code> yet, and no back-end or deployment code exists. The <mention url="https://app.notion.com/p/40e771bd4d4381348afbc4f4257c51f4" /> has the live status. M1.1 is about 81 points of work (47 front end, 34 back end), all in tickets of 5 points or less. At 1 point a working day for one engineer, that is about 81 engineer-days.

---

## 2. Where we are

- <b>Design:</b> rounds R1 to R8 are frozen, with 157 approved screenshots and a spec for every M1 page.
- <b>Requirements:</b> the PRD has no open questions. M1 is built in four end-to-end slices: M1.1 Profile signature, My timesheet and submit, M1.2 Approvals, M1.3 Admin, M1.4 PDF.
- <b>Plans:</b> work 001 (screen specs and round R7) is approved and done. Work 002 (M1.1 front end) has an approved brief with 29 acceptance criteria and the decisions below, and an approved plan (both 03/11/2026), and is being built. Plan, brief and task status: <mention url="https://app.notion.com/p/40e771bd4d4381348afbc4f4257c51f4" />.
- <b>Approach for M1.1:</b> contract first. Write the M1.1 OpenAPI contract, build the front end against a mock API generated from it, and have a separate back-end plan build the real API to the same contract.
- <b>Other work in flight:</b> a session is looking for the business's domain name and a brandable name.

---

## 3. Decide before M1.1 starts

The browser sign-in approach was the biggest decision, because it shapes the API contract, the Caddy setup and the Keycloak client. It is now made.

- [x] <b>Browser sign-in approach (AD-15).</b> Decided 03/11/2026: the Spring Boot app signs in to Keycloak and keeps the tokens on the server; the browser holds only an HttpOnly session cookie, with sessions in PostgreSQL. Adds ticket BE-09. Pros, cons, threats and mitigations: <mention url="https://app.notion.com/p/40d771bd4d438124b4fecedf6b8ebbfd" />.
- [x] <b>Session timeouts:</b> decided 03/11/2026: 30 minutes idle and 8 hours absolute. Autosaves count as activity. Keycloak's own session idle and maximum are set to the same values, so a signed-out person must retype their password and an unlocked phone can't sign straight back in.
- [x] <b>Password policy:</b> decided 03/11/2026: keep 8 characters with letters and numbers (PRD FR-01 and the sign-in screens stay as they are) and add a check against known breached passwords using the free Have I Been Pwned Pwned Passwords range API (no key, no rate limit, only the first 5 characters of the password's SHA-1 hash leave the server). Keycloak has no built-in check, so it is a small custom password policy provider (ticket BE-10); if the service can't be reached the password is accepted and a warning is logged. Brute-force protection stays on.
- [x] <b>Passkeys:</b> the owner asked for passkey support on 03/11/2026. Keycloak supports them officially from 26.4, beside the password. Rough extra work about 10 points: realm set-up, a passkey button in the sign-in theme, an Add a passkey action on Profile, real-device tests, plus a design round. Passkeys are tied to the final domain name, so the domain must be settled before anyone registers one. Decided 03/11/2026: M2, with the two-factor work. Settle the final domain first, because passkeys are tied to it.
- [x] <b>API contract format.</b> Decided 03/11/2026: keep REST with OpenAPI 3 (AD-02, AD-13), with oasdiff and a spec contract test in CI (BE-07). Nothing in the design docs changes. Comparison: <mention url="https://app.notion.com/p/408771bd4d4381e08220dc1d7848ac68" />.
- [x] <b>Package manager:</b> decided 03/11/2026: pnpm for the web app, with the version pinned through Corepack. Chosen for stricter dependency resolution and because it blocks dependency install scripts by default. The throwaway mock-up stays on npm.
- [x] <b>Signature drawing library.</b> Decided 03/11/2026: signature\_pad (MIT, built-in types, no dependencies), used only inside our own small wrapper component with a fixed 2.5 px stroke. No third-party Vue wrapper.
- [x] <b>Autosave debounce and retry.</b> Decided 03/11/2026: save a day 1 second after the last change and on leaving the field; one save queue for the whole timesheet, because the version belongs to the timesheet; 10-second request timeout. Retry only network failures, timeouts and 5xx errors, 10 times with waits of 2, 4, 8, 16, 32 and then 60 seconds, with jitter; the browser coming back online or the tab becoming visible brings the next attempt forward but adds none. After the 10th failure, saving stops: the timesheet becomes read-only, a message says what is safe (hours saved before the last saved time), why saving failed (no connection or a server error) and that a reload is needed, and a manual Try again stays. When the tab is hidden or closed, one last save is sent with fetch keepalive. New design state, so it needs mock-up round R9 (ticket R9).
- [x] <b>UInputTime check on iPhone.</b> Done 03/11/2026 by the owner on the mock-up in Safari: the hour and minute segments show the number keypad, tapping AM/PM shows the letter keyboard and typing a or p switches it, a two-digit hour moves on to the minutes, then to AM/PM, and the segments are easy to hit with a thumb. The markup matches (hour and minute inputmode numeric, AM/PM text). Not yet tried: an Android phone, and whether a one-digit hour moves on by itself. Check Android when a device is at hand.
- [x] <b>Larger text and zoom.</b> Checked 03/11/2026 with a script on the mock-up screens. Clean at 375 px, text 75%, desktop zoom up to 200% and zoom out to 50%. It scrolls sideways from text 125% and at phone widths under 336 px (iPhone page zoom above about 112%). The cause is the Start and Finish time fields, which are wider than the screen, plus the top bar, the approvals timesheet and the sign-in header at larger text. Approvals and Admin also cut off the fortnight label and emails with an ellipsis from text 125%. Decided 03/11/2026: fix My timesheet, Submit review and Profile in M1 through round R9 (320 px wide and text up to 150%, no sideways scroll); Approvals, Admin and the other screens follow with M2's WCAG work.
- [x] <b>Approve the M1.1 brief</b> (work 002). Approved 03/11/2026 after review, which added AC-29 (CSRF header), assigned AC-20, 27 and 28 to tickets, and noted that older rejected timesheets are settled in M1.2. The plan is approved too: <mention url="https://app.notion.com/p/40e771bd4d4381348afbc4f4257c51f4" />.

---

## 4. Build work, in tickets

Every ticket is 5 points or less, sized for a single engineer, so each one ends merged on main with its tests and check gates green. Stop, review or change direction after any ticket.<br /><b>Sizing (agreed 29/10/2026):</b> story points on the scale 1, 2, 3, 5. One point is about one working day of focused work for one engineer, so 5 is about a week. Anything bigger is split before it starts. Points measure size, not elapsed time with sub-agents helping. These are first-pass estimates; for the front end, the approved plan has since replaced the tickets with tasks (section 4.2).<br /><b>Rules for every ticket:</b> its own branch; the diff and the tests are reviewed before it merges; the acceptance criteria (AC) it covers become tests inside the same ticket; the check gates in the ui-e2e standards pass.

### 4.1 Checkpoints

A checkpoint is a group of tickets that ends in something you can click through or read. It is the natural place to pause and review progress.

| Checkpoint | Tickets | What can be reviewed | Points |
| --- | --- | --- | --- |
| A Foundations | P-1, FE-01 to 03 | Decisions closed, plan approved, contract written, mock API running, empty app builds, local Keycloak runs, all gates green | 10 |
| B Sign-in and shell | FE-04 to 05 | Sign in locally, top bar, not found, no access, session ended, loading and failed states | 5 |
| C Profile | FE-06 | Create, replace and save a signature; Change password round trip | 3 |
| D My timesheet | R9, FE-07 to 11 | Enter a fortnight, live hours, warnings, autosave, offline, capped retry and conflict behaviour, Clear | 17 |
| E Submit | FE-12 to 13 | Empty timesheet to submitted and read-only, with signature | 6 |
| F Theme and polish | FE-14 to 15 | Themed Keycloak pages, visual match to the mock-up, axe clean. <b>Front end done on the mock API</b> | 6 |
| G Back-end skeleton | BE-00 to 02, BE-09, BE-10 | Back-end plan approved; builds, migrates, signs in through Keycloak with a cookie session, rejects calls without one and refuses breached passwords | 15 |
| H M1.1 API | BE-03 to 07 | Contract tests pass; hours cases match the front end | 16 |
| I Join up | BE-08 | Front end on the real API. <b>M1.1 works end to end</b> | 3 |

### 4.2 Front end tickets (work 002, against the mock API)

The approved plan replaced FE-01 to FE-15 with tasks 1 to 19, tracked on the <mention url="https://app.notion.com/p/40e771bd4d4381348afbc4f4257c51f4" />. Mock-up round R9 stays a step of its own that several tasks wait for. This table stays as the first estimate.

| ID | Ticket | ACs | Pts |
| --- | --- | --- | --- |
| P-1 | Close the open decisions above and approve the plan | none | 1 |
| FE-01 | Write the M1.1 OpenAPI contract (including the CSRF header rule) and generate the mock API, client and runtime schemas from it | AC-26, 29 | 4 |
| FE-02 | Scaffold (Vite, Nuxt UI, design tokens, fonts) and quality gates (lint, type check, tests, secret scan, CI, axe and screenshot harness) | none | 3 |
| FE-03 | Local Keycloak for development: realm, test users | none | 2 |
| FE-04 | Sign-in redirect and return to the original URL; app shell and top bar for employee and manager; not found; no access | AC-1, 2 | 3 |
| FE-05 | Session ended dialog, loading and failed-to-load patterns, the error rule | AC-22, 23 | 2 |
| FE-06 | Profile: typed signature in three styles, draw and replace, show date; Change password round trip | AC-19, 21 | 3 |
| FE-07 | Hours calculation and formatting module with the shared test cases; My timesheet pay period header, fortnight switch, pay schedule not set message | AC-3, 4, 6 | 3 |
| FE-08 | Day rows with the 12-hour time input and live day, week and fortnight totals | AC-5, 28 | 3 |
| FE-09 | Validation messages, soft warnings, future days locked | AC-7, 8 | 2 |
| R9 | Mock-up round R9: the stopped-saving state (header status, read-only look, message for no connection and for a server error, Try again); My timesheet, Submit review and Profile at 320 px wide and text up to 150% with no sideways scroll (time fields shrink or stack, top bar wraps); the breached-password error message on the choose-a-new-password page; update the screen specs, AC-10, AC-24 and AC-25 | AC-10, AC-24, AC-25 | 2 |
| FE-10 | Autosave (1 s debounce, one save queue) with Saving and Saved and draft expiry date; Not saved with capped retry (10 retries, 2 s up to 60 s), stopped state with Try again, leave-page confirmation and last-chance save, changed-on-another-device notice | AC-9, 10, 11, 12, 27 | 5 |
| FE-11 | Clear with confirmation, rejected timesheet header and deletion date | AC-13 | 2 |
| FE-12 | Submit review screen: day list, totals, warning ticks, declaration | AC-14, 15 | 3 |
| FE-13 | Signature set-up at review, submit success and failure, read-only statuses, rejected reason | AC-16, 17, 18, 20 | 3 |
| FE-14 | Keycloak theme: sign in, wrong password, signed out, deactivated, choose new password, reset, link expired | AC-25 | 3 |
| FE-15 | End-of-slice pass: match the approved mock-up at 375 and 1280 px, plus 320 px and text up to 150% on My timesheet, Submit review and Profile, axe, no sideways scroll, fixes | AC-24 | 3 |
| Front end total: 47 points. |  |  |  |

### 4.3 Back end tickets (their own plan, can start alongside FE-01)

| ID | Ticket | Pts |
| --- | --- | --- |
| BE-00 | Back-end plan from the M1.1 contract | 1 |
| BE-01 | Maven skeleton, container image, CI gates, secret scan | 2 |
| BE-02 | PostgreSQL, Flyway, tenant ID on records, integration test set-up; OIDC token validation and role checks (employee, manager) | 4 |
| BE-03 | Pay schedule and fortnight rules (seeded until M1.3); hours calculation in whole minutes, including daylight-saving change days, with the shared cases | 3 |
| BE-04 | Timesheet draft endpoints with versions and conflict refusal; entry validation and warning flags | 4 |
| BE-05 | Draft expiry job with database lock, Clear, 3-month deletion | 3 |
| BE-06 | Signature endpoints (store, replace, keep a copy per submission); submit, with the audit log written in the same transaction | 4 |
| BE-07 | Contract tests against the OpenAPI file: the generated spec must equal the committed one, plus an oasdiff breaking-change check in CI | 2 |
| BE-08 | Switch the front end from the mock to the real API and fix the gaps. Run at least one end-to-end pass against the real API. The mock API stays for development and tests, with its handlers kept in step with the contract, and the <code>check:build</code> check that keeps it out of the production build stays too | 3 |
| BE-09 | Cookie sign-in: Spring Security login with Keycloak, JDBC sessions, CSRF protection, logout, and deleting a person's sessions when they are deactivated or their password is reset. Build right after BE-02. Rough estimate | 5 |
| BE-10 | Breached-password check in Keycloak: a custom password policy provider that asks the Pwned Passwords range API (2 second timeout, accepts and logs a warning if unreachable), packaged into our Keycloak image, a pinned Keycloak version with a test that fails when an upgrade breaks it, and the realm's brute-force protection settings. Rough estimate | 3 |
| Back end total: 34 points. |  |  |

### 4.4 M1.2 to M1.4

Very rough guesses, to be split into tickets of 5 points or less at their own plan stage with ui-e2e.

| Part | Delivers | Rough points |
| --- | --- | --- |
| M1.2 Approvals | Approvals list and one timesheet, approve and reject, manager signature, self-approved marking | 18 |
| M1.3 Admin | Pay schedule, employees (add, deactivate, reset password), business name and logo, sign-in pages show them | 20 |
| M1.4 PDF | A4 PDF per fortnight from approved timesheets, with the not-yet-approved list; PDF library spike first | 13 |
| Go-live | Install, backup and restore test, rehearsal (see section 5) | to be sized |

---

## 5. Go-live and hosting

None of this blocks building, but all of it must be done before real staff use the app. M1 runs on a home machine behind a rented relay server (AD-21), so these are real purchases and set-up tasks. Source: the System Design open questions.

- [ ] Choose the relay provider and the business's domain name
- [ ] Choose off-site backup storage; confirm restic, the retention, and backup credentials that can't delete
- [ ] Choose a container registry for the web and API images
- [ ] Confirm the monitor on the relay (Uptime Kuma proposed)
- [ ] Check the home machine meets the requirements, including a TPM 2.0 chip
- [ ] Buy and set up the OpenWrt router, and confirm a wired device can't use the eero guest network
- [ ] Get an email (SMTP) account for the business, for password-reset emails
- [ ] Write the backup and restore procedure, and test a restore before go-live
- [ ] Rehearse the install on a spare machine (no staging server in M1)

---

## 6. Spikes and product checks

- [ ] <b>PDF library spike (before M1.4):</b> confirm OpenHTMLtoPDF (community fork) on Java 25 by rendering the sample sheet. BE Detailed Design, section 3.3.
- [ ] <b>Business name and logo on the sign-in pages (decide before M1.3):</b> the API sets them as Keycloak's realm display name, or the sign-in theme reads them from a public app endpoint. The logo leans towards the public endpoint. BE Detailed Design, open questions.
- [ ] <b>Weekends:</b> confirm the business doesn't work weekends, since M1 records Monday to Friday only (PRD product risks).
- [ ] <b>Observability:</b> decide whether M1 needs more than logs (System Design open questions).

---

## 7. After the MVP

From the PRD roadmap. Each milestone is planned when the one before it is done.

| Milestone | Focus | Features | Decide early |
| --- | --- | --- | --- |
| M2 | Usability and control | Recall; amendments to approved timesheets; weekend and overnight shifts; multiple managers and approver overrides; email notifications and reminders; Excel export; audit history screen; basic reports; more soft warnings; WCAG 2.2 AA accessibility; two-factor sign-in and passkeys (about 10 points; the final domain must be settled first) | Keep the seams for recall, amendments and weekend shifts that the M1.1 plan lists |
| M3 | Cloud and SaaS | Cloud hosting; multiple businesses (tenants) and onboarding; Platform Admin; per-tenant single sign-on; configurable periods; self-service data access and erasure (GDPR) | Tenant isolation strategy (shared schema with row-level security or schema per tenant); revisit data retention against GDPR |
| M4 | Business features | Dimensions (projects, clients, sites); pay rates including evening, weekend and holiday; employee levels; billing and invoicing; payroll and accounting integrations; public API and webhooks | none yet |
| Later | Enterprise extras | Multi-level approvals; CSV export; leave tracking; advanced analytics; native mobile apps; multiple languages; data residency; tamper-evident log; configurable data retention | none yet |

---

## 8. Related documents

- <mention url="https://app.notion.com/p/3f5771bd4d438156a93ec42b3548821d" />
- <mention url="https://app.notion.com/p/3f4771bd4d4380e28d76d2038edbfac4" />
- <mention url="https://app.notion.com/p/3f6771bd4d4381fbadd6f819e59e08fd" />
- <mention url="https://app.notion.com/p/3f5771bd4d43819981e0f96e66fae263" />
- <mention url="https://app.notion.com/p/3f5771bd4d43813e90c8e11492d92e2b" />
- <mention url="https://app.notion.com/p/40d771bd4d438124b4fecedf6b8ebbfd" />
- <mention url="https://app.notion.com/p/40e771bd4d4381348afbc4f4257c51f4" />

---

## 9. Revision history

| Date | Change |
| --- | --- |
| <date start="2026-11-04" /> | Sections 1 and 2 and the brief item in section 3 now match the build, and point to the M1 (MVP) Delivery Plan for live status. Section 4.2 notes that the approved plan replaced the front-end tickets with tasks 1 to 19; the tickets themselves are unchanged. BE-08 now records that the mock API stays for development and tests after the switch, and adds an end-to-end pass against the real API. |
</content>
