<!-- Read-only copy of Detailed Design Doc — BE: https://app.notion.com/p/3f5771bd4d43813e90c8e11492d92e2b
     Notion is the master; comment and edit there, then run docs-sync.
     Notion last edited: 2026-10-17T14:50:57.177Z · Synced: 18/10/2026 -->
<content>
<callout icon="🛠️" color="gray_bg">
	**Status:** Draft · **Last updated:** <mention-date start="2026-10-18"/> · **Type:** Detailed design — system logic and implementation decisions. Companion to <mention-page url="https://app.notion.com/p/3f4771bd4d4380e28d76d2038edbfac4"/>, which owns the architecture, and the <mention-page url="https://app.notion.com/p/3f6771bd4d4381fbadd6f819e59e08fd"/>, which owns how the system runs and why. Requirements live in the <mention-page url="https://app.notion.com/p/3f5771bd4d438156a93ec42b3548821d"/>.
</callout>
<table_of_contents/>
---
## 1. Domain model
*Proposed for M1 — to confirm while building slice 1.*
<table header-row="true">
<tr>
<td>Entity</td>
<td>Holds</td>
<td>Rules</td>
</tr>
<tr>
<td>**Business** (the tenant)</td>
<td>Name, optional logo (PNG or JPG image), time zone, pay schedule start date</td>
<td>One row in M1; every other record carries its ID (AD-03). A manager sets the business name and an optional logo on the admin page, and the sign-in pages show them (FR-28). A manager sets the start date, which must be a Monday (FR-04), from configuration until the admin page exists (slice 3). Locked once any timesheet exists, including an unsubmitted draft; a deleted draft stops counting (FR-05).</td>
</tr>
<tr>
<td>**Person**</td>
<td>Keycloak user ID, display name, active flag</td>
<td>The name comes from the login and isn't editable in the app. Created on first sign-in or from the admin page. Deactivated, never deleted (FR-25). Roles live in Keycloak (section 5).</td>
</tr>
<tr>
<td>**Timesheet**</td>
<td>Person, fortnight start date, status (Draft / Submitted / Approved), rejection reason, ever submitted, last changed (UTC), cleared at (UTC), version</td>
<td>One per person per fortnight (FR-07): unique on person + fortnight start. `last changed` drives the 15-day expiry of drafts that were never submitted; a rejected timesheet with hours never expires (FR-12, FR-17). `cleared at` drives the 3-month deletion of a cleared rejected timesheet, and entering hours again resets it (FR-13). `version` gives optimistic concurrency for autosave, approve and reject.</td>
</tr>
<tr>
<td>**Timesheet day**</td>
<td>Date, start time, rest break (minutes), finish time, worked minutes</td>
<td>Only filled-in weekdays are stored: Monday to Friday, as weekend shifts are M2 (FR-08). Worked minutes are calculated by the server (FR-10).</td>
</tr>
<tr>
<td>**Signature**</td>
<td>Person (anyone), PNG image, how it was made (drawn / typed text)</td>
<td>The person's current signature, set on the Profile page (FR-20). Replacing it stores a new one.</td>
</tr>
<tr>
<td>**Submission**</td>
<td>Timesheet, submitted at (UTC), employee's name, copy of their signature image, declaration ticked, warning days ticked, submitted minutes</td>
<td>Written once per submit and never updated (FR-14, FR-21). A resubmit after rejection adds a new one; the PDF prints the latest.</td>
</tr>
<tr>
<td>**Approval**</td>
<td>Timesheet, approver, approved at (UTC), copy of the signature image, self-approved flag</td>
<td>Written once at approval (FR-16, FR-19, FR-21) and never updated.</td>
</tr>
<tr>
<td>**Log entry**</td>
<td>Actor, action, subject, at (UTC), details (JSONB)</td>
<td>Append-only (FR-26).</td>
</tr>
</table>
**Fortnights** aren't stored: fortnight *n* starts at the start date + 14 × *n* days. The start date is a Monday (FR-04), so Week 1 and Week 2 each run Monday to Sunday. Only Monday to Friday can hold hours in M1 (FR-08), and the pay period shown runs from Monday of week 1 to Friday of week 2 (FR-22). The current fortnight is the one containing today in the business's time zone.
**Drafts** (FR-12, FR-13): a Draft timesheet is created by the first autosave. Submit turns it into a Submitted timesheet, so the draft no longer exists. Clear deletes its days; a timesheet that was never submitted is deleted outright, while a rejected one keeps its row and records when it was cleared. It's deleted 3 months later unless hours are entered again, and that deletion is logged (FR-13); the log keeps its submit and reject history. **Draft expiry** (FR-12): a draft that has never been submitted is kept for 15 days after its last change. A rejected timesheet with hours never expires (FR-17). *Proposed:* the expiry date is the business-time-zone date of the last change + 15 days, and the draft goes at the end of that day, so it is never kept for less than 15 days. The API returns the timesheet's deletion date, if it has one, for the screen to show: a never-submitted draft's expiry, or a cleared rejected timesheet's deletion (FR-12, FR-13). A daily job deletes expired never-submitted drafts the same way Clear does, without logging, and cleared rejected timesheets 3 months after clearing, with a log entry (FR-13). *Proposed:* the 3 months end at the end of the same calendar day in the business's time zone. The API also treats anything past its date as gone if the job hasn't run yet.
---
## 2. Business rules
### 2.1 Timesheet lifecycle & approvals
States and transitions are defined in the PRD (section 6); this section covers the rules behind them.
- **Draft → Submitted** — by the owner only, once at least one day has hours (also before the fortnight ends), every filled-in day is valid (section 2.2), the employee has ticked the declaration and each day with a warning, and they have a signature (FR-14, FR-20). The server works out the warning days again at submit and refuses a tick list that doesn't match them. Warnings don't block, but each needs its tick (FR-27). Writes a Submission with a copy of the signature (FR-21). The submitted hours and the declaration are logged (FR-26), and the timesheet becomes read-only to the employee (FR-14).
- **Draft → deleted** — if it was never submitted: on Clear, or 15 days after the last change (FR-12, FR-13). If it was rejected: only after it has been cleared, 3 months after clearing unless hours are entered again, and that deletion is logged (FR-13, FR-17).
- **Submitted → Approved** — by the manager (M1 has one), once they have a signature (FR-20; prompted at their first approval if not). Writes an Approval with a copy of the signature image (FR-21), marked Self-approved when the approver owns the timesheet (FR-19). Final in M1 (FR-16).
- **Submitted → Draft (reject)** — by the manager; a non-blank reason is required and shown to the employee until they submit again (FR-17).
- Managers can't edit anyone's entries (FR-18): the API has no endpoint that would let them.
- Authorisation checks the Manager role, never a count of managers, so M2 can add more managers, reporting lines and approver overrides without rework.
- Approve and reject check the status and version in the same transaction, so a repeated click (or, from M2, a second manager) can't act twice on one timesheet.
- Every transition writes its log entry in the same transaction (AD-06).
- **Editing window:** an employee can start or edit the current or previous fortnight (FR-07). A rejected timesheet stays editable and submittable whatever its fortnight (FR-07, FR-17).
- **Later:** recall and amendments to approved timesheets arrive in M2; multi-level approvals are Later.
### 2.2 Time entry validation
Decided so far (PRD FR-08 – FR-10, FR-27):
- One row per weekday (Monday to Friday) with start time, rest break (minutes) and finish time; weekend shifts are M2. Every day is optional; a filled-in day needs both a start and a finish time.
- Impossible entries are rejected (e.g. finish at or before start). Finish must be after start **on the same day** — no overnight shifts in M1 (they arrive in M2).
- The break must be shorter than the shift, and not negative.
- ~~Overlapping entries for the same person are rejected.~~ **Overlaps can't happen in M1:** there is one row per day and shifts don't cross midnight. Revisit with overnight shifts in M2.
- **Future-dated entries are rejected in M1:** days after today, in the business's time zone, can't be filled in. Leave entries are not in M1 (Later); once leave is introduced, future dates will be allowed for leave only.
- No maximum-hours-per-day limit in M1.
- Worked minutes = finish − start − break, calculated by the server in whole minutes and stored (FR-10). The web app's preview is never trusted.
- **Soft warning (FR-27):** a day with 1 hour or less, or more than 12 hours, of worked time (after the break) gets a warning ("Is AM/PM correct?") on its row, in the submit review and on Approvals (FR-15). It never blocks saving or submitting. The server works it out alongside the worked minutes and returns it with the day.
Proposed approach (to confirm):
- **Unusual → warn, don't block:** FR-27 warnings show to the employee and to the manager on Approvals in M1; more soft warnings (e.g. unusually long weeks) are M2.
- **Policy → configurable per org:** later.
- Drafts may hold incomplete days while the employee types: each autosave returns per-day errors, and Submit is refused until every filled-in day is valid.
- Times travel through the API as 24-hour `HH:mm`, to the minute, and hours as integer minutes. The 12-hour display, the `{hours}h {minutes}m` form and the decimal hours (FR-11) are formatting in the web app and the PDF template only.
### 2.3 Time & time zone handling
M1 resolves most of these: all times are in the business's single time zone (PRD section 2), and shifts start and finish on the same day (FR-09). Each day stores a local date and local start and finish times; system timestamps (log, submissions, approvals) are UTC instants.
Known edge cases:
- **Daylight saving transitions** — durations are computed from absolute instants (local times resolved in the business's time zone), not wall-clock times. A 01:00–03:00 entry is 1 h on spring-forward night and 3 h on fall-back night.
- **Non-existent and ambiguous local times** — e.g. 02:30 doesn't exist on spring-forward night and 01:30 happens twice on fall-back night. ~~The API accepts timestamps with an explicit UTC offset so there's no ambiguity.~~ M1 stores local times, so *proposed:* a non-existent time is rejected and an ambiguous one takes the earlier offset (`java.time`'s default). Rare for daytime casual shifts.
- **Entries crossing midnight** — does the entry belong to its start day, or is it split across days? **Out of M1:** no overnight shifts. Revisit in M2.
- **Entries crossing a period boundary** — e.g. a night shift spanning the last day of a weekly period. **Can't happen in M1** (same-day shifts, fortnights only). Revisit with overnight shifts in M2 and configurable periods in M3.
- **Whose time zone defines a period** — the org's or the employee's, for distributed teams. **Resolved:** the business's (PRD section 2).
- **Travelling employees** — ~~each entry stores the time zone it was recorded in, so history always displays correctly.~~ **Not in M1:** every time is in the business's time zone. Per-entry zones only if a later milestone needs them.
- **"Future" is relative** — an employee in UTC+12 must not be wrongly blocked or allowed. **Resolved:** "after today" uses today's date in the business's time zone, from the server's clock.
- **Time zone rule changes** — governments change DST rules; rely on the runtime's time zone database and keep it patched.
---
## 3. Tech stack & build
### 3.1 Build tool — Maven vs Gradle
<table header-row="true">
<tr>
<td></td>
<td>Maven</td>
<td>Gradle</td>
</tr>
<tr>
<td>**Style**</td>
<td>Declarative XML; every project looks the same</td>
<td>Scripted (Kotlin DSL with autocomplete), very flexible</td>
</tr>
<tr>
<td>**Learning curve**</td>
<td>Low; most enterprise Java developers know it</td>
<td>Steeper; builds can become hard-to-follow custom code</td>
</tr>
<tr>
<td>**Build speed**</td>
<td>Slower; mostly rebuilds everything</td>
<td>Faster: incremental builds and build cache</td>
</tr>
<tr>
<td>**Stability**</td>
<td>Very predictable; upgrades rarely break anything</td>
<td>Major upgrades sometimes break plugins</td>
</tr>
<tr>
<td>**Verbosity**</td>
<td>Verbose</td>
<td>Concise</td>
</tr>
<tr>
<td>**Best fit**</td>
<td>Standard apps, teams that value consistency</td>
<td>Large multi-module builds, custom build logic</td>
</tr>
</table>
Both are Apache 2.0. **Decision: Maven with the Maven Wrapper** — a single modular monolith won't benefit much from Gradle's speed, and Maven's predictability suits an enterprise codebase.
### 3.2 Libraries & versions
*TBD*
### 3.3 PDF generation
The PDF (FR-22) has one A4 portrait page per approved timesheet, copying the business's current paper timesheet: the title "Employee Timesheet", the employee's name, the pay period (Monday of week 1 to Friday of week 2), then Week 1 and Week 2 tables with Day, Date, Start Time, Rest Break (mins), Finish Time and Total Hours excluding breaks for Monday to Friday, each with a weekly total, then the fortnight total. A signature section follows: the employee's name, signature image and confirmation date and time (from the latest Submission, FR-14) and the approver's name, signature image and approval date and time, plus any Self-approved mark (FR-16, FR-19). Labels follow the current sheet's wording. Each day shows its times on a 12-hour clock with AM/PM and its hours as `{hours}h {minutes}m` with two-digit minutes, e.g. 7:30 AM to 8:30 PM, 30 min break, 12h 30m; week and fortnight totals use the same form and can pass 24 hours (76h 30m) (FR-11). The template follows the same formatting rules as the web app, tested against the same cases. Every hours figure, on screen and in the PDF, also shows decimal hours in brackets, e.g. 8h 10m (8.17) (FR-11). The server keeps exact values (whole minutes) and works out every total from them; rounding to 2 places, half-up, happens only for display. In integer arithmetic, hundredths = (minutes × 100 + 30) div 60, so there's no floating-point error, and a tie can't occur, because minutes × 100 ÷ 60 never ends in exactly .5. A week's decimal can differ from the sum of its rounded days (three days of 8h 10m show 8.17 each; the week shows 24h 30m (24.50)), so the PDF carries FR-11's note: "Totals are calculated from exact times and may differ slightly from the sum of the rounded daily figures."
<table header-row="true">
<tr>
<td>Library</td>
<td>How a page is built</td>
<td>Fit</td>
</tr>
<tr>
<td>**OpenHTMLtoPDF**</td>
<td>An HTML + CSS template (e.g. Thymeleaf) rendered to PDF; `@page` sets A4 portrait</td>
<td>Best fit: the page is a set of styled tables like the paper sheet, and the signature is an image. Supports CSS 2.1 and paged media only (no flexbox or grid), so the template is table-based. LGPL 2.1 or later. The original project (danfickle/openhtmltopdf) is no longer maintained; use the community fork ([github.com/openhtmltopdf/openhtmltopdf](http://github.com/openhtmltopdf/openhtmltopdf), Maven group `io.github.openhtmltopdf`), which released 1.1.37 in January 2026. It's tested up to Java 21, so check it on Java 25.</td>
</tr>
<tr>
<td>**OpenPDF**</td>
<td>Java code builds tables and paragraphs</td>
<td>Workable, but the layout lives in code and is harder to keep looking like the paper sheet. LGPL / MPL.</td>
</tr>
<tr>
<td>**Apache PDFBox**</td>
<td>Low-level drawing: text, lines and images at coordinates</td>
<td>Most work for a table layout; better suited to editing existing PDFs. Apache 2.0.</td>
</tr>
</table>
**Decision: OpenHTMLtoPDF** (community fork) with a server-side template, rendered on request (no background jobs in M1), with an OFL-licensed font embedded so the PDF looks the same everywhere. The fork is tested up to Java 21, so a short spike rendering the sample sheet on Java 25 comes first. The template copies the business's current sheet; keep the sample next to the template as the reference for visual checks.
---
## 4. API design
*TBD — conventions, error format, pagination, versioning.*
### 4.1 M1 endpoints by slice *(proposed sketch)*
Each slice delivers its endpoints with its screens (AD-16), so these firm up slice by slice.
<table header-row="true">
<tr>
<td>Slice</td>
<td>Endpoints</td>
</tr>
<tr>
<td>**1. Profile signature, My timesheet and submit**</td>
<td>`GET /api/v1/me` (name, roles, today, whether the pay schedule is set, whether a signature is set) · `GET` and `PUT /api/v1/me/signature` · `GET /api/v1/me/timesheets/{fortnightStart}` (with calculated hours, warnings and the deletion date, if any) · `PUT /api/v1/me/timesheets/{fortnightStart}/days/{date}` (autosave one day, with the version; returns the new deletion date, if any) · `DELETE /api/v1/me/timesheets/{fortnightStart}` (Clear; for a rejected timesheet, returns its deletion date) · `POST /api/v1/me/timesheets/{fortnightStart}/submit` (with the declaration and the ticked warning days; refused without a signature)</td>
</tr>
<tr>
<td>**2. Approvals**</td>
<td>`GET /api/v1/fortnights/{start}/timesheets` (with status and warnings) · `GET /api/v1/timesheets/{id}` · `POST /api/v1/timesheets/{id}/approve` (refused without a signature) · `POST /api/v1/timesheets/{id}/reject` (reason)</td>
</tr>
<tr>
<td>**3. Admin page**</td>
<td>`GET` and `PUT /api/v1/pay-schedule` (start date must be a Monday) · `GET` and `PUT /api/v1/business` (business name, FR-28) · `PUT` and `DELETE /api/v1/business/logo` (PNG or JPG, up to 1 MB; the server checks the type from the file's content, not its name, and refuses anything else, including SVG, which can carry scripts) · `GET` and `POST /api/v1/employees` · `POST /api/v1/employees/{id}/deactivate` · `POST /api/v1/employees/{id}/reset-password`</td>
</tr>
<tr>
<td>**4. PDF**</td>
<td>`GET /api/v1/fortnights/{start}/pdf`. The not-yet-approved list (FR-23) comes from slice 2's fortnight query and leaves out empty timesheets.</td>
</tr>
</table>
Before slice 3, the pay schedule start date comes from configuration and people are created in Keycloak; a Person row is created at first sign-in.
---
## 5. Security
*TBD — authentication flow, secrets.*
M1 roles and accounts (PRD section 3, FR-01 – FR-03, FR-24, FR-25):
- Two Keycloak realm roles, `employee` and `manager`. M1 has exactly one manager, who is also an employee and the admin. Authorisation checks the `manager` role, never a count, so M2 can add more managers without rework.
- The manager role is set in Keycloak, not from the admin page (FR-24). If the only manager is away, whoever runs the server gives a second person the role in the Keycloak admin console (PRD section 12), following the runbook (System Design section 11.5).
- Accounts are created with a temporary password and Keycloak's *Update Password* required action (FR-01). Keycloak's password policy requires at least 8 characters, with letters and numbers (FR-01). No two-factor sign-in in M1. Password reset uses Keycloak's own emails, so the install needs an email (SMTP) account (PRD section 7).
- *Change password* on the Profile page sends the user to Keycloak's own password page (an application-initiated action, `kc_action=UPDATE_PASSWORD`) and back, so the app never handles passwords.
- The admin page (slice 3) manages employee accounts (add, deactivate, reset password) through the Keycloak Admin API, using a service account limited to user management (the business name and logo may need more; see the open question in section 11). It can't grant the manager role. Deactivate disables the Keycloak user (FR-25). Each change is also written to the app's log (FR-26).
- Account changes made directly in Keycloak (at install, before slice 3, or in an emergency) are recorded by Keycloak's admin events, turned on with no expiry and covered by the Keycloak database backup (FR-26).
- **Token validation:** the API checks each token's issuer against Keycloak's public URL but fetches the signing keys from Keycloak's internal address, so the issuer and the keys URL are configured separately rather than found by discovery (System Design section 2.5). Keycloak runs under `/auth`, trusts forwarded headers from Caddy only, and has its Account Console turned off (System Design SD-02).
---
## 6. Multi-tenancy
*TBD before M3 — isolation strategy (current lean: shared schema + PostgreSQL row-level security), tenant resolution.*
M1 constraint: one business per install, but every tenant-owned table has a business ID from the first migration, so M3 adds businesses without changing M1 data (PRD section 2, AD-03).
---
## 7. Data & persistence
*TBD — schema, audit trail storage, migrations, soft deletes, concurrency.*
M1 schema rules, following from the PRD and the HL design:
- Hours are stored exactly, as integer minutes (FR-10): times are entered to the minute, so minutes lose nothing. Every total is a sum of minutes. Decimal hours are never stored, only worked out for display on screen and in the PDF (FR-11). Weekly and fortnight totals can pass 24 hours, so they're sums of minutes, never time-of-day types.
- Timesheets record when they last changed and whether they were ever submitted, for the 15-day expiry of never-submitted drafts (FR-12). Each submit writes a Submission with the employee's signature copy, for the PDF (FR-14, FR-21, FR-22).
- Day times are stored as a local `date` and `time` in the business's time zone; system timestamps as `timestamptz`.
- Never-submitted drafts are deleted on Clear or expiry and aren't business records. A cleared rejected timesheet is deleted 3 months after clearing, and that deletion is logged (FR-13). Other submitted and approved timesheets, people and the log are never deleted.
- Signature images are stored in PostgreSQL, so a database backup covers them; each submission and approval keeps its own copy (FR-21). The business logo is stored the same way (FR-28).
- The log table is append-only: the app's database user can't update or delete its rows.
- Optimistic locking (`version`) on timesheets, for autosave from two devices and for approve / reject races.
---
## 8. Observability
*TBD*
---
## 9. Environments & deployment
Environments, install prerequisites, and backup and restore moved to the <mention-page url="https://app.notion.com/p/3f6771bd4d4381fbadd6f819e59e08fd"/> (sections 6, 11.1 and 9). Backend-specific build and runtime detail (the API image, JVM settings, Spring configuration) goes here. *TBD*
---
## 10. Testing strategy
*TBD — tools, coverage thresholds, test environments.*
---
## 11. Open questions
- [x] Should approvers see soft warnings (e.g. more than 12 h in a day)? — **Resolved:** FR-27 warns on days with 1 hour or less, or more than 12 hours, of worked time; the manager sees them on Approvals (FR-15). More warnings are M2
- [x] Which time zone defines a timesheet period — org or employee? — **Resolved:** the business's single time zone (PRD section 2)
- [x] Entries crossing midnight or a period boundary — assign to start day or split? — **Out of M1:** no overnight shifts (FR-09); revisit in M2
- [ ] Tenant isolation strategy: shared schema + RLS vs schema-per-tenant — *needed by M3*
- [x] PDF library: OpenPDF, Apache PDFBox or OpenHTMLtoPDF — **Decided:** OpenHTMLtoPDF, community fork (section 3.3)
- [x] Exports: generated on request, or as background jobs for large reports? — **M1:** on request (one fortnight for one small business); revisit with M2's reports
- [x] Export contents and layout (per employee, per project, approval status, totals) — **Defined by FR-22:** one A4 portrait page per approved timesheet, copying the business's current paper timesheet (PRD Q3, resolved)
- [x] Draft expiry — **Resolved (FR-12):** 15 days after the last change for drafts that were never submitted, shown on the timesheet; a daily job (section 1)
- [x] Does draft expiry apply to a rejected timesheet the employee hasn't touched? — **Resolved:** no, rejected timesheets with hours never expire; cleared ones are deleted 3 months after clearing (FR-12, FR-13, FR-17)
- [x] Does a draft count as a timesheet for the FR-05 start-date lock? — **Resolved (FR-05):** yes, and a deleted draft stops counting
- [x] Backup tooling and retention period — **Moved** to the System Design (sections 9.3 and 14); proposed: nightly `pg_dump` + restic
- [x] Decimal hours, e.g. 8h 10m (8.17) — **Resolved (FR-11):** both forms on every hours figure, on screen and in the PDF, with decimals from exact totals rounded to 2 places for display
- [x] Rounding mode for decimal hours — **Resolved (FR-11):** half-up to 2 places, for display only; with whole minutes a tie can't occur (section 3.3)
- [ ] Confirm OpenHTMLtoPDF (community fork) on Java 25 with a spike that renders the sample sheet (section 3.3)
- [ ] How the sign-in pages get the business name and logo (FR-28): the API sets them as Keycloak's realm display name (the logo only fits as an image in the realm's HTML display name, and the admin page's service account would then need to manage realm settings, not just users), or the sign-in theme reads both from a public app endpoint that returns only the name and logo. The logo leans towards the public endpoint. Decide before slice 3
- [x] Form of the employee's confirmation on submit — **Resolved (FR-14):** one declaration plus a tick for each day with a warning
- [x] FR-27: does "shift" mean the worked hours or finish − start? — **Resolved:** worked time after the break
---
## 12. Decision log
<table header-row="true">
<tr>
<td>Date</td>
<td>Decision</td>
</tr>
<tr>
<td><mention-date start="2026-10-10"/></td>
<td>~~Time entries use start and end times, time-zone aware; duration is derived~~ — superseded <mention-date start="2026-10-11"/>: start and finish times in the business's single time zone; duration is still derived</td>
</tr>
<tr>
<td><mention-date start="2026-10-10"/></td>
<td>~~Future-dated entries allowed only for leave (leave is Later)~~ — superseded <mention-date start="2026-10-11"/>: no leave in M1, so all future-dated entries are rejected</td>
</tr>
<tr>
<td><mention-date start="2026-10-10"/></td>
<td>No maximum-hours-per-day limit in M1</td>
</tr>
<tr>
<td><mention-date start="2026-10-10"/></td>
<td>Build tool: Maven, using the Maven Wrapper</td>
</tr>
<tr>
<td><mention-date start="2026-10-10"/></td>
<td>~~Overlapping entries for the same person are rejected~~ — superseded <mention-date start="2026-10-11"/>: one row per day makes overlaps impossible in M1</td>
</tr>
<tr>
<td><mention-date start="2026-10-10"/></td>
<td>No leave entries in M1, so all future-dated entries are rejected</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>All times are in the business's single time zone: days store a local date and start and finish times; system timestamps are UTC (PRD section 2)</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>One row per day with start time, rest break and finish time; no overnight shifts in M1 (FR-08, FR-09)</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>Hours calculated by the server and stored as whole minutes (FR-10)</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>Drafts are Draft timesheets on the server, autosaved; never-submitted ones expire 15 days after their last change (FR-12)</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>Each approval stores its own copy of the signature image (FR-21)</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>PDF generated on request in M1, no background jobs; HTML-to-PDF (OpenHTMLtoPDF) ~~is the lean~~ — decided <mention-date start="2026-10-11"/> (section 3.3)</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>A documented, tested backup and restore is part of M1 (PRD section 7)</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>One manager in M1, set in Keycloak; authorisation checks the manager role, not a count (PRD section 3)</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>API carries 24-hour times and integer minutes; 12-hour times and `{hours}h {minutes}m` are display formatting (FR-11)</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>Field names follow the business's paper sheet: start time, rest break, finish time (FR-08)</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>Pay schedule start date must be a Monday (FR-04)</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>PDF is A4 portrait and copies the business's current timesheet, including the employee's confirmation (FR-22)</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>Employee confirmation is stored with the submission, logged and printed on the PDF (FR-14, FR-26)</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>Soft warnings (FR-27) are worked out by the server with the hours, returned per day, and never block</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>Everyone has a stored signature (Profile page); each submission and approval keeps a copy (FR-20, FR-21)</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>Weekdays (Monday to Friday) only in M1; weekend shifts are M2 (FR-08)</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>Only never-submitted drafts expire; rejected timesheets with hours never expire and stay editable outside the window; cleared ones are deleted after 3 months (FR-07, FR-12, FR-13, FR-17)</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>Decimal hours are worked out from exact minutes for display only, on screen and in the PDF, never stored (FR-11)</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>Keycloak admin events on, kept indefinitely, for account changes made in Keycloak (FR-26)</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>Unsubmitted drafts count for the FR-05 start-date lock; deleted ones stop counting (FR-05)</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>A cleared rejected timesheet is deleted 3 months after clearing unless hours are entered again; the deletion is logged (FR-13)</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>Exact values are stored as whole minutes; decimals are rounded half-up to 2 places with integer arithmetic, only for display (FR-11)</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>PDF library: OpenHTMLtoPDF, from the maintained community fork (Maven group `io.github.openhtmltopdf`)</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>Tokens are checked against Keycloak's public issuer URL, with signing keys fetched from Keycloak's internal address (System Design section 2.5)</td>
</tr>
<tr>
<td><mention-date start="2026-10-18"/></td>
<td>M1 password policy: at least 8 characters, with letters and numbers; no two-factor sign-in in M1 (FR-01)</td>
</tr>
<tr>
<td><mention-date start="2026-10-18"/></td>
<td>The business name is stored on the Business record and set from the admin page (FR-28)</td>
</tr>
<tr>
<td><mention-date start="2026-10-18"/></td>
<td>An optional business logo (PNG or JPG, up to 1 MB, no SVG) is stored on the Business record in PostgreSQL and set from the admin page (FR-28)</td>
</tr>
</table>
---
## 13. Revision history
<table header-row="true">
<tr>
<td>Date</td>
<td>Change</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>Aligned with the rewritten PRD: milestones (M1 (MVP), M2, M3, Later) replace version numbers. Added a proposed M1 domain model, lifecycle rules, PDF library comparison (lean: OpenHTMLtoPDF), endpoints by slice, roles and accounts, schema rules, install prerequisites and backup/restore. Re-scoped time handling for one business time zone and same-day shifts; closed the time zone, midnight-crossing and export questions; overlap check dropped (one row per day); leave stays out of M1.</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>Followed three later PRD changes: 15-day draft expiry from the last change, shown on the timesheet (FR-12, Q1 resolved); 12-hour times and `{hours}h {minutes}m` in the PDF and API notes (FR-11); one manager in M1, so the admin page manages employees only and the manager role is set in Keycloak (FR-24, Q2 resolved). Added a runbook prerequisite and an open question on expiry of rejected timesheets.</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>Followed the PRD changes from the business's paper timesheet (Q3 resolved): PDF is A4 portrait and copies that sheet (FR-22); fields renamed to start time, rest break and finish time; Monday start date (FR-04); employee confirmation on submit, stored, logged and printed (FR-14); soft warnings for shifts under 1 hour or over 12 hours (FR-27). Added open questions for PRD Q4 and Q5 and for what "shift" means in FR-27.</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>Followed the final PRD changes: signatures for everyone with a new Submission entity holding the employee's signature copy (FR-14, FR-20, FR-21); submit rules (a day with hours, the declaration, a tick per warning day); PDF decimal hours and Monday to Friday rows (FR-11, FR-22); weekdays only; FR-27 boundary and warnings on Approvals; rejected timesheets never expire; SMTP account and Keycloak admin events as install requirements; Profile signature moved to slice 1. Closed the matching open questions; the FR-05 drafts assumption stays open.</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>Followed the last PRD round: FR-05 drafts assumption confirmed; a `cleared at` field and a logged 3-month deletion of cleared rejected timesheets (FR-13); exact minutes stored, with decimals rounded half-up with integer arithmetic only for display, plus FR-11's note; date and time for confirmation and approval on the PDF (FR-16, FR-22); empty timesheets left out of FR-23's list. OpenHTMLtoPDF: the original project isn't maintained, so the design names the community fork and adds a Java 25 spike; the PDF uses an OFL font.</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>PDF library decided: OpenHTMLtoPDF (community fork). The Java 25 spike stays open. A cleared rejected timesheet's deletion date is returned for the screen to show, like a draft's expiry date (FR-13).</td>
</tr>
<tr>
<td><mention-date start="2026-10-11"/></td>
<td>Moved environments, install prerequisites, and backup and restore (section 9) to the new System Design; backup tooling question moved with them. Added token validation and Keycloak hosting notes to section 5; the runbook now lives in the System Design.</td>
</tr>
<tr>
<td><mention-date start="2026-10-18"/></td>
<td>Followed mock-up round R7: business name on the Business record with a slice 3 endpoint, and an open question on how the sign-in pages get it (FR-28); M1 password policy and no two-factor sign-in (FR-01). Marked the old future-dated entries decision as superseded. Section references are now written as words.</td>
</tr>
<tr>
<td><mention-date start="2026-10-18"/></td>
<td>Followed mock-up round R8: an optional business logo on the Business record, with slice 3 endpoints to upload and remove it (PNG or JPG, up to 1 MB, no SVG); the open question on how the sign-in pages get the name now covers the logo too (FR-28).</td>
</tr>
<tr>
<td><mention-date start="2026-10-18"/></td>
<td>Consistency fixes from the docs index: section 5 points to the open question on the service account's rights for the business name and logo; two old decision-log rows marked superseded (time-zone aware entries) and decided (OpenHTMLtoPDF).</td>
</tr>
</table>
</content>
