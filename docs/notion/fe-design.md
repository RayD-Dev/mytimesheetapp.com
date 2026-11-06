<!-- Read-only copy of Detailed Design Doc — FE: https://app.notion.com/p/3f5771bd4d43819981e0f96e66fae263
     Notion is the master; comment and edit there, then run docs-sync.
     Notion last edited: 2026-11-04T04:23:44.120Z · Synced: 04/11/2026 -->
<content>
<callout icon="🎨" color="gray_bg">
<b>Status:</b> Draft · <b>Last updated:</b> <date start="2026-11-04" /> · <b>Type:</b> Detailed design for the web front end. Companion to <mention url="https://app.notion.com/p/3f4771bd4d4380e28d76d2038edbfac4" /> (architecture), the <mention url="https://app.notion.com/p/3f5771bd4d438156a93ec42b3548821d" /> (requirements) and <mention url="https://app.notion.com/p/3f5771bd4d43813e90c8e11492d92e2b" />.
</callout>

<table-of-contents />

---

## 1. Overview

A Vue 3 + TypeScript single-page app, served as static files from its own container, on the same domain as the API (<code>/</code> → web app, <code>/api</code> → backend). Built in end-to-end slices together with the backend (AD-16): M1.1 Profile signature, My timesheet and submit, M1.2 approvals, M1.3 admin page, M1.4 PDF. Works in desktop and phone browsers; My timesheet is usable at 375 px wide without sideways scrolling. English only; accessibility (WCAG 2.2 AA) follows after M1, in M2.

---

## 2. Rendering strategy — SPA vs SSR

The HL design chose a client-rendered <b>single-page app (SPA)</b>. Alternatives considered:

| Approach | How it works | Pros | Cons |
| --- | --- | --- | --- |
| <b>SPA — client-side rendering</b> <i>(chosen)</i> | Server sends static HTML + JS; the browser builds every page | Hosted as static files (nginx) — cheap, simple, no extra runtime; clean FE/BE split; easy to cache on a CDN later | Slower first load (JS must download first); poor SEO — irrelevant behind a login |
| <b>SSR — server-side rendering</b> (Nuxt) | A Node server renders HTML per request, then the browser takes over ("hydration") | Faster first paint; SEO for public pages; the Nuxt server can double as a Backend-for-Frontend for login (see section 3) | Another runtime (Node) to run, scale, secure and patch; code runs on both server and client, so more complex (hydration bugs); higher infra cost |
| <b>SSG — static site generation</b> | Pages rendered to HTML at build time | Fastest possible load, great SEO | Only suits content that's the same for everyone — not a logged-in app |

<b>Why SPA:</b> every screen is behind a login, so SSR's main benefits (SEO, first paint for anonymous visitors) don't apply, while its costs (a Node server tier) do. <b>Revisit if:</b> we need public pages (a marketing site would be a separate SSG site).

---

## 3. Browser authentication

The browser must log users in via Keycloak (OIDC). How tokens are handled is the most security-sensitive front-end decision.

### Option A — SPA as a public OIDC client (Authorization Code + PKCE)

The Vue app redirects to Keycloak, receives tokens, and sends the access token as a bearer token on every API call.

<columns>
<column>
<b>Pros</b>

- Simplest to build; well-supported libraries
- API stays fully stateless (bearer tokens only)
- One authentication path for the web app, Swagger and other clients
</column>
<column>
<b>Cons</b>

- Tokens live in browser JavaScript — any XSS bug can steal them
- Refresh tokens in the browser need rotation and careful handling
- Browser third-party-cookie restrictions break "silent" token renewal
- Current OAuth guidance for browser apps discourages it for sensitive data
</column>
</columns>

### Option B — Backend-for-Frontend (BFF)

A server-side component logs in to Keycloak as a confidential client and keeps the tokens. The browser only holds a secure, HttpOnly session cookie. Inside one app, as chosen here, the server authorises each request from its own session and relays no tokens. A separate gateway would attach the access token when forwarding API calls.

<columns>
<column>
<b>Pros</b>

- Tokens never reach the browser — XSS can't steal them
- Confidential client (has a secret), stronger than a public client
- Recommended approach in current OAuth guidance for browser-based apps
- Simpler front-end code; logout and revocation handled server-side
</column>
<column>
<b>Cons</b>

- Sessions are stateful — needs a shared session store (can be PostgreSQL, so no new infrastructure)
- Cookie-based, so CSRF protection is required
- An extra component or responsibility to run
- Two auth paths: cookies for the web app, bearer tokens for Swagger / API clients
</column>
</columns>

Where a BFF could live: inside the Spring Boot app (simplest), a separate gateway (e.g. Spring Cloud Gateway), or a Nuxt server (only if we move to SSR).

### Option C — Token-mediating backend

A backend performs the login and keeps the refresh token, but hands the short-lived access token to the SPA.

<columns>
<column>
<b>Pros</b>

- Refresh token is protected server-side
- API stays bearer-token based
</column>
<column>
<b>Cons</b>

- Access token is still exposed to XSS
- Complexity of both A and B, without B's full protection
</column>
</columns>

### Decision

<b>Option B, inside the Spring Boot app, with sessions in PostgreSQL. Decided 03/11/2026 (AD-15).</b> The front end has no token code: it sends the cookie and a CSRF header, and a 401 shows the "You've been signed out" dialog. Pros, cons, threats and settings: <mention url="https://app.notion.com/p/40d771bd4d438124b4fecedf6b8ebbfd" />.

<i>M1 note:</i> M1 serves one small self-hosted business, but staff sign in from their phones over the internet and the app holds the record of what they're owed, so this holds even in M1. Swagger UI is only a developer tool and there's no public API until M4, so Option B's "two auth paths" cost is small in M1.

---

## 4. Tech stack

| Area | Choice | Licence |
| --- | --- | --- |
| Framework | Vue 3 + TypeScript | MIT / Apache 2.0 |
| Build tooling | Vite | MIT |
| Package manager | pnpm, version pinned through Corepack. The throwaway mock-up stays on npm | MIT |
| Routing / state | Vue Router, Pinia (official Vue libraries) | MIT |
| Component library | Nuxt UI (v4), built on Reka UI and Tailwind CSS v4. Used in the plain Vue + Vite app through its Vite plugin (<code>@nuxt/ui/vite</code>); it doesn't need the Nuxt framework, so the SPA decision (section 2) stands | MIT |
| Signature drawing | signature\_pad, used only inside our own small wrapper component with a fixed 2.5 px stroke; no third-party Vue wrapper | MIT |
| Typed-signature font | Three bundled script fonts the person picks from: La Belle Aurore (the default), Herr Von Muellerhoff and Mrs Saint Delafield (mock-up round R3) | SIL OFL 1.1 (allowed, HL section 11) |
| 12-hour time input | Nuxt UI <code>UInputTime</code> with <code>:hour-cycle="12"</code> and <code>granularity="minute"</code>; its value is a <code>Time</code> from <code>@internationalized/date</code> | MIT / Apache 2.0 |
| Unit / component tests | Vitest, Vue Test Utils | MIT |
| End-to-end tests | Playwright | Apache 2.0 |
| Static file server | nginx | BSD-2-Clause |

---

## 5. Project structure

<i>TBD — folder layout within the monorepo, feature modules.</i>

---

## 6. Screens & navigation

Routes and layouts for the screens listed in the PRD (section 5). <i>Proposed.</i>

| Route | Screen | Who | Part |
| --- | --- | --- | --- |
| Keycloak pages | Sign in, password change at first sign-in, password reset (FR-01). Styled in the app's look as a Keycloak theme, headed by the business name, with the optional logo beside it (FR-28) | Everyone | M1.1 |
| <code>/timesheet</code>, <code>/timesheet/:fortnightStart</code> | My timesheet — current or previous fortnight. <code>/</code> redirects here. | Employees, Managers | M1.1 |
| <code>/approvals/:fortnightStart?</code> | Approvals — the fortnight's submitted timesheets, with any warnings | Managers | M1.2 |
| <code>/approvals/:fortnightStart/:timesheetId</code> | One timesheet: approve (with signature) or reject (with reason) | Managers | M1.2 |
| <code>/admin</code> | Admin — pay schedule, employees, PDF download, business name and logo | Managers | M1.3 (PDF in M1.4) |
| <code>/profile</code> | Profile — set up or replace signature; change password | Everyone | M1.1 |

### 6.1 My timesheet

- <b>Header:</b> the employee's name (from the login) and the pay period, Monday of week 1 to Friday of week 2, with a switch between the current and previous fortnight only; dates are never typed (FR-07). Whenever the timesheet has a deletion date, the header shows it: a never-submitted draft's expiry date (FR-12) or a cleared rejected timesheet's deletion date (FR-13).
- <b>Week 1 and Week 2:</b> Monday to Friday only; there are no weekend shifts in M1 (FR-08). Each day has Date, Start time, Rest break (mins), Finish time and Total hours, in that order and with the labels of the business's current sheet. Start and finish times show a 12-hour clock with AM/PM (FR-11).
- <b>Totals:</b> each day, week and the fortnight, as <code>{hours}h {minutes}m</code> with two-digit minutes (8h 00m, 0h 45m); week and fortnight totals can pass 24 hours (76h 30m) (FR-11). Every hours figure also shows decimal hours in brackets, e.g. 8h 10m (8.17), and the totals carry FR-11's note: "Totals are calculated from exact times and may differ slightly from the sum of the rounded daily figures."
- <b>Buttons:</b> Submit (enabled once at least one day has hours, also before the fortnight ends; opens the review below, FR-14) and Clear (after a confirmation, FR-13). No Save button; a small "Saving… / Saved" status instead.
- <b>Warnings:</b> a day with 1 hour or less, or more than 12 hours, of worked time (after the break) shows a non-blocking warning on its row, e.g. "This shift is 1h 00m. Is AM/PM correct?" (FR-27). Like the hours, it's previewed while typing and replaced by the server's result after each autosave.
- <b>Submit review (FR-14):</b> Submit opens a review of every day with hours (times, rest break, hours), any warnings, and the week and fortnight totals. Before sending, the employee ticks one declaration, "I confirm these hours are correct", plus a separate tick for each day with a warning; Send stays disabled until all are ticked. If they have no signature yet, the review asks them to set one up there, using the Profile page's component (FR-20). Their signature, name, and the date and time are then applied (FR-14). On a phone it's a full-screen step, with the ticks and Send after the totals.
- <b>States:</b> the FR-06 message instead of the form until the pay schedule is set. Submitted and Approved are read-only, showing the status. Rejected is editable, with the manager's reason at the top, even when its fortnight is no longer the current or previous one, and it shows no expiry date because it never expires while it has hours (FR-07, FR-12, FR-17). Clearing a rejected timesheet starts a 3-month countdown to deletion unless hours are entered again, and the header then shows the deletion date (FR-13); <i>proposed:</i> Clear's confirmation says so too. Days after today are disabled (FR-09).
- <b>Desktop:</b> a table with one row per day, in the same column order as the PDF and the business's paper sheet. <b>Phone (375 px):</b> each day becomes a stacked card, with no sideways scrolling.
- <b>Time inputs:</b> must always show 12-hour times with AM/PM. Native <code><input type="time"></code> follows the device's locale and can show a 24-hour clock, so use Nuxt UI's <code>UInputTime</code> with <code>:hour-cycle="12"</code> and <code>granularity="minute"</code>. It's a typed, segmented field (hour, minute, AM/PM), not a picker. Its docs say the display also follows the app's <code>locale</code>, so set <code>hour-cycle</code> explicitly and check on iOS and Android at 375 px that AM/PM always shows. Its value is a <code>Time</code> from <code>@internationalized/date</code>, with no date or time zone, so it maps straight to and from the API's 24-hour <code>HH:mm</code> and the device's time zone can't shift it.

### 6.2 Approvals

- Pick a fortnight; see its submitted timesheets with each person's name and fortnight total. Any FR-27 warnings show on the days they apply to (FR-15).
- Open one to see the read-only timesheet, with hours in both forms and FR-11's note, the employee's confirmation date and time, and Approve and Reject. Reject asks for a reason (FR-17); Approve records the date and time (FR-16).
- A manager without a signature is prompted to set one up at their first approval, using the Profile page's component (FR-20).
- On a manager's own timesheet, the screen says it will be marked Self-approved (FR-19).

### 6.3 Admin

- <b>Pay schedule:</b> set the first fortnight's start date, with a date picker that offers Mondays only (FR-04); read-only once any timesheet exists, including an unsubmitted draft (FR-05).
- <b>Employees:</b> add (with a temporary password), deactivate and reset password (FR-24). M1 has one manager, whose role is set in Keycloak, not on this page.
- <b>PDF:</b> pick a fortnight, see which timesheets aren't approved yet (leaving out empty ones), then download (FR-22, FR-23).
- <b>Business name and logo:</b> shown above the sign-in box; the name is set the first time and changed later. The logo is optional: upload, replace or remove a PNG or JPG up to 1 MB (no SVG). On the sign-in pages it sits beside the name, at most 48 px high and 240 px wide, and the name wraps underneath when a wide logo leaves too little room (FR-28).

### 6.4 Profile

- <b>Signature:</b> draw it (signature pad), or type text, their name by default, to generate one. Both produce a PNG that's uploaded to the API. The page shows the current signature with a Replace option (FR-20). The same component is used for the prompts at first submit and first approval.
- <b>Change password:</b> sends the user to Keycloak's password page and back (an application-initiated action), so the app never handles passwords.

---

## 7. API integration

<i>TBD — generating a typed client from the OpenAPI spec, error handling, loading states.</i>

### 7.1 Autosave

- Each day saves 1 second after the last change and when the user leaves the field. The whole timesheet shares one save queue, because the version belongs to the timesheet. Each request carries that version (AD-18) and times out after 10 seconds.
- The response carries the server's calculated hours, which replace the on-screen preview, and the timesheet's deletion date if it has one (FR-12, FR-13). Entering hours in a cleared rejected timesheet removes its deletion date.
- A version conflict (the timesheet changed on another device) reloads the timesheet and tells the user with an inline notice at the top of the timesheet, not a toast (mock-up round R7).
- If a save fails (e.g. no signal on a phone), the change stays in memory, the status shows "Not saved", and the app warns before the page is left. Only network failures, timeouts and 5xx errors are retried: 10 times, with waits of 2, 4, 8, 16, 32 and then 60 seconds, with jitter. The browser coming back online, or the tab becoming visible, brings the next attempt forward but adds none. No timesheet data in browser storage.
- After the 10th failure, saving stops and the timesheet becomes read-only. A message says what is safe (hours saved before the last saved time), why saving failed (no connection or a server error) and that a reload is needed, and a manual Try again stays. Designed in mock-up round R9.
- When the tab is hidden or closed, one last save is sent with fetch keepalive.

### 7.2 Loading and errors

- <b>Loading:</b> every page shows its title and ruled placeholder lines, only if loading takes longer than about 300 ms, so fast loads don't flash (mock-up round R7).
- <b>Failed to load:</b> "Couldn't load \{what\}. Check your internet connection, then try again." with a <i>Try again</i> button (R7).
- <b>Session ended:</b> a dialog that can't be dismissed, "You've been signed out", saying saved hours are safe, with <i>Sign in again</i> (R7).
- <b>A failed action</b> (submit, approve, PDF download, save): a red inline message next to the button plus a toast, never a toast alone (round R8).

---

## 8. State management

<i>TBD</i>

---

## 9. Forms, validation & time display

<i>TBD — client-side validation mirroring backend rules.</i>

- Client-side checks mirror FR-09 for instant feedback: start and finish both needed, finish after start on the same day, break shorter than the shift, no future days. The server's verdict wins. Warnings (FR-27) are previewed the same way and never block.
- Hours are previewed while typing (FR-10) and replaced by the server's figure after each autosave.
- <b>Showing errors (mock-up round R8):</b> buttons stay enabled and check the form when pressed. Each field with a problem turns red (<code>aria-invalid</code>) with a message under it, focus moves to the first one, and a toast says what didn't happen. Errors found while typing, such as FR-09 on a day, show on the field without a toast. Keycloak's pages have no toasts, so they show the red field plus a message box above the form. Server-side validation errors map back onto the same fields.
- Shared formatters, used on every screen (FR-11): times on a 12-hour clock with AM/PM (7:30 AM); hours as <code>{hours}h {minutes}m</code>, always both parts with two-digit minutes (12h 30m, 8h 00m, 0h 45m), followed by decimal hours in brackets, e.g. 8h 10m (8.17); totals past 24 hours allowed (76h 30m). Decimals are rounded half-up to 2 places from the server's exact minutes, in integer arithmetic (no floating point), the same rule as the PDF. FR-11's note sits under the totals. The rule's test cases live in one shared fixture file in the monorepo, run by both the web app's and the backend's tests. A shift reads e.g. "7:30 AM to 8:30 PM, 30 min break, 12h 30m". The PDF template follows the same rules (BE section 3.3), tested against the same cases.
- <s>Displaying times across time zones and DST.</s> All times are in the business's time zone (PRD section 2), so they're shown exactly as entered, with no conversion. "Today" and the current fortnight come from the API, not the device clock, so a phone set to another zone can't shift them.

---

## 10. Testing strategy

<i>TBD</i> — includes Playwright runs at desktop and 375 px phone widths (PRD section 5).

---

## 11. Build & deployment

<i>TBD — container image, runtime configuration, caching.</i>

---

## 12. Open questions

- [x] Browser authentication approach — <b>Decided 03/11/2026:</b> a cookie session in the Spring Boot app (section 3, AD-15)
- [x] Component library — <b>Decided:</b> Nuxt UI (section 4)
- [x] Package manager — <b>Decided 03/11/2026:</b> pnpm (section 4)
- [x] Signature drawing library — <b>Decided 03/11/2026:</b> signature\_pad. The typed-signature fonts are decided too (section 4)
- [x] Autosave debounce, and how long to retry when offline — <b>Decided 03/11/2026:</b> section 7.1
- [x] Check Nuxt UI's <code>UInputTime</code> on an iPhone, typing with the phone keyboard — <b>Done 03/11/2026</b> (Readiness Checklist section 3)
- [ ] Check <code>UInputTime</code> on an Android phone at 375 px: AM/PM always shown with <code>hour-cycle</code> 12, and typing works with the phone keyboard. Also check whether a one-digit hour moves on by itself
- [x] Show the deletion date on a cleared rejected timesheet, like the draft expiry date? — <b>Decided:</b> yes; both show their deletion date (FR-12, FR-13)
- [x] Form of the employee's confirmation in the submit review — <b>Resolved (FR-14):</b> one declaration plus a tick for each day with a warning

---

## 13. Decision log

| Date | Decision |
| --- | --- |
| <date start="2026-10-10" /> | Vue 3 + TypeScript single-page app (client-side rendering) |
| <date start="2026-10-10" /> | English only in M1; accessibility (WCAG 2.2 AA) after M1, in M2 |
| <date start="2026-10-11" /> | Built in end-to-end slices together with the backend, not after it (AD-16) |
| <date start="2026-10-11" /> | Autosave to server-side drafts; only Submit and Clear buttons, no Save (FR-12 – FR-14, AD-18) |
| <date start="2026-10-11" /> | My timesheet works at 375 px wide without sideways scrolling (PRD section 5) |
| <date start="2026-10-11" /> | Shifts show 12-hour times with AM/PM and hours as <code>{hours}h {minutes}m</code> with two-digit minutes (FR-11) |
| <date start="2026-10-11" /> | The timesheet shows the expiry date of a never-submitted draft, 15 days after its last change (FR-12) |
| <date start="2026-10-11" /> | Timesheet columns and labels follow the business's paper sheet: Date, Start time, Rest break (mins), Finish time, Total hours (PRD section 5) |
| <date start="2026-10-11" /> | Submit opens a review step, and the employee confirms the hours before sending (FR-14) |
| <date start="2026-10-11" /> | Soft warning on days with 1 hour or less, or more than 12 hours, of worked time, never blocking (FR-27) |
| <date start="2026-10-11" /> | Profile page with a signature for everyone; the same component prompts at first submit and first approval (FR-20) |
| <date start="2026-10-11" /> | Monday to Friday only in M1 (FR-08) |
| <date start="2026-10-11" /> | Submit enabled once a day has hours; the review needs one declaration plus a tick for each day with a warning (FR-14) |
| <date start="2026-10-11" /> | FR-27 warnings also shown on Approvals (FR-15) |
| <date start="2026-10-11" /> | Hours on screen show decimals too, e.g. 8h 10m (8.17), with FR-11's note under the totals; one rounding rule shared with the PDF through common test cases (FR-11) |
| <date start="2026-10-11" /> | Time inputs use a component that always shows 12-hour time, not the native time input (FR-11) |
| <date start="2026-10-11" /> | Component library: Nuxt UI (v4) in the plain Vue + Vite SPA, without the Nuxt framework |
| <date start="2026-10-11" /> | 12-hour time input: Nuxt UI <code>UInputTime</code>, <code>hour-cycle</code> 12, minute granularity (FR-11) |
| <date start="2026-10-11" /> | The timesheet shows its deletion date whenever it has one: a never-submitted draft's expiry, or a cleared rejected timesheet's deletion (FR-12, FR-13) |
| <date start="2026-10-18" /> | Sign-in pages use the app's look as a Keycloak theme, headed by the business name (FR-28) |
| <date start="2026-10-18" /> | A version conflict shows as an inline notice at the top of the timesheet |
| <date start="2026-10-18" /> | Optional business logo (PNG or JPG, up to 1 MB) set on Admin and shown beside the business name on the sign-in pages (FR-28) |
| <date start="2026-10-18" /> | Errors: the field turns red with a message plus a toast; failed actions get an inline message plus a toast; never a toast alone (the owner's call in round R8) |
| <date start="2026-10-18" /> | Typed signatures offer three bundled OFL script fonts: La Belle Aurore (the default), Herr Von Muellerhoff and Mrs Saint Delafield (mock-up round R3) |
| <date start="2026-11-03" /> | Browser sign-in: a cookie session in the Spring Boot app, with no token code in the front end (section 3, AD-15) |
| <date start="2026-11-03" /> | Package manager: pnpm, version pinned through Corepack |
| <date start="2026-11-03" /> | Signature drawing: signature\_pad inside our own wrapper component |
| <date start="2026-11-03" /> | Autosave: 1 second after the last change, one save queue, capped retries, then read-only (section 7.1) |

---

## 14. Revision history

| Date | Change |
| --- | --- |
| <date start="2026-10-11" /> | Aligned with the rewritten PRD: milestones (M1 (MVP), M2, M4) replace MVP / post-MVP wording; built in end-to-end slices instead of after the backend. Added proposed routes and layouts for My timesheet, Approvals and Admin; autosave behaviour; validation and "7h 30m" display; signature capture. Time display re-scoped to the business's single time zone. Browser sign-in options unchanged, with an M1 note. |
| <date start="2026-10-11" /> | Followed three later PRD changes: 12-hour times with AM/PM and <code>{hours}h {minutes}m</code> hours (FR-11), with a note that native time inputs can show 24-hour time; the draft's expiry date shown on the timesheet (FR-12); one manager in M1, so the Admin page manages employees only (FR-24). |
| <date start="2026-10-11" /> | Followed the PRD changes from the business's paper timesheet (Q3 resolved): column order and labels from that sheet (start time, rest break, finish time, total hours); a submit review with the employee's confirmation (FR-14, form per PRD Q5); soft warnings for shifts under 1 hour or over 12 hours (FR-27); a Mondays-only start date picker (FR-04). |
| <date start="2026-10-11" /> | Followed the final PRD changes: new Profile page (signature, change password) in slice 1, with signature prompts at first submit and first approval (FR-20); Monday to Friday only; Submit enabled once a day has hours, with one declaration plus warning-day ticks (FR-14); FR-27 boundary and warnings on Approvals (FR-15); rejected timesheets editable outside the window and never expiring (FR-07, FR-17). Closed the Q5 open question. |
| <date start="2026-10-11" /> | Followed the last PRD round: decimal hours and FR-11's note on screen too, with one rounding rule shared with the PDF; cleared rejected timesheets deleted after 3 months (FR-13); confirmation and approval date and time; empty timesheets left out of FR-23's list; FR-05 counts unsubmitted drafts. Technical follow-ups: typed-signature font licence now allowed (OFL); a 12-hour time input named (PrimeVue DatePicker as the candidate) and API time conversion without UTC. |
| <date start="2026-10-11" /> | Component library decided: Nuxt UI, used without the Nuxt framework, so the SPA stands. The 12-hour time input is now Nuxt UI's <code>UInputTime</code>, replacing the PrimeVue candidate. A cleared rejected timesheet shows its deletion date, like a draft's expiry date (FR-13). |
| <date start="2026-10-18" /> | Followed mock-up round R7: Keycloak pages in the app's look, headed by the business name; business name on Admin (FR-28); version conflicts shown as an inline notice. Section references are now written as words. |
| <date start="2026-10-18" /> | Followed mock-up round R8: optional business logo on Admin, shown beside the name on the sign-in pages (FR-28); new section 7.2 on loading, failed loads, session end and failed actions; how errors are shown on forms (section 9). |
| <date start="2026-10-18" /> | Recorded the typed-signature fonts chosen in mock-up round R3 (section 4); the signature drawing library stays open. |
| <date start="2026-11-04" /> | Recorded the decisions of 03/11/2026: browser sign-in (section 3), pnpm and signature\_pad (section 4), and the autosave timing and retry rules (section 7.1). Closed those open questions in section 12. The <code>UInputTime</code> check is split: iPhone done, Android still open. |
</content>
