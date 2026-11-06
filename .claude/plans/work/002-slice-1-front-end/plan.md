# 002 Slice 1 front end: plan

**Brief:** `./brief.md` (approved 03/11/2026)
**Branch:** `feat/slice-1-front-end`
**Status:** Approved 03/11/2026 (v2, reviewed by an Opus agent and revised). Round R9 (mock-up) gates the parts marked **R9**.

## Decisions this plan depends on

| Decision | Choice | Recorded in |
|---|---|---|
| Browser sign-in | Cookie session: Spring Boot is the Keycloak client; the browser holds an HttpOnly session cookie; the session row lives in PostgreSQL, so API instances keep no session in memory. Writes carry a CSRF header. Idle 30 min, absolute 8 h. AD-07 is reworded to match; JWT bearer auth comes with the public API in M4 | Brief C-4 and conversation 03/11/2026. Notion edits pending (HL design AD-07, section 2.1 and 5.1, AD-15; FE design sections 3, 4, 12, 13; BE design sections 5, 7, 12) |
| Package manager | pnpm, pinned through Corepack | Brief C-6. Not yet in Notion (FE design section 12) |
| Signature drawing | `signature_pad`, only inside one wrapper component, fixed 2.5 px stroke | Brief C-6. Not yet in Notion |
| Signature storage | Image, kind (drawn or typed), text and style are saved together in one `PUT` and replaced together, so they cannot disagree. The image is the record: submissions and approvals copy the image; text and style only pre-fill the editor | Conversation 03/11/2026 |
| Autosave | 1 s debounce plus blur; one queue per timesheet; 10 s request timeout; first attempt plus 10 retries, waiting 2, 4, 8, 16, 32 and then 60 s (jittered); `keepalive` send when the tab is hidden | Brief C-7 and conversation 03/11/2026. Not yet in Notion |
| Idle warning | A warning 2 minutes before the 30-minute idle timeout, with *Stay signed in*. New state in round R9 | Conversation 03/11/2026 |
| Password rule and breach check | 8 characters with letters and numbers; Keycloak refuses breached passwords (ticket BE-10); message wording agreed with BE-10 | Brief C-9 |
| Contract | REST with OpenAPI 3; the spec is the single source of types and run-time schemas | Brief C-1, C-5; AD-02, AD-13 |
| Project folder | `web/` at the repo root: one Vite app, feature folders, `shared/` for formatters, validation, API client and UI parts | Conversation 03/11/2026 |
| API client | orval generates TypeScript types, client functions and zod schemas from `contract/openapi.yaml`. Nothing hand-written; generated files are never edited. Task 3 confirms with the pinned orval that response checks hook in without hand-written glue | Conversation 03/11/2026 |
| Mock API | MSW; handlers typed against the generated types; the same handlers run in dev, Vitest and Playwright. Never in the production build | Conversation 03/11/2026 |
| State | One plain TypeScript save-queue module with its own tests. Pinia holds only what screens show (session, timesheet, save status) | Conversation 03/11/2026 |
| Keycloak sign-in pages | Keycloak login theme in `keycloak/theme/`, tested against a local Keycloak | Brief C-2 |

## API contract

Source: `contract/openapi.yaml`, written in task 1 and agreed with the back-end ticket BE-09. Endpoints follow the slice 1 sketch in the BE design (section 4.1), plus the additions below.

| Endpoint | Fields used | Notes |
|---|---|---|
| `GET /api/v1/me` | name, roles, today (business time zone), `payScheduleSet`, `signatureSet`, `currentFortnightStart`, `previousFortnightStart`, `periodLengthDays`, `idleExpiresAt`, `absoluteExpiresAt`, `serverNow` | Sets the CSRF cookie before the first write. 401 when signed out. Does not reset the idle timer |
| `GET /api/v1/session/login?returnTo=` | `returnTo` | `navigation` operation: the front end sets `location`, it is not a fetch call. The server sanitises `returnTo` (relative path, no `//`, no backslash); anything else goes to `/timesheet`. Never answers 400 or 401 |
| `POST /api/v1/session/logout` | none | A `navigation` operation: a real form POST with a hidden `_csrf` (the XSRF-TOKEN cookie value), not fetch. Answers 303 to Keycloak's end-session URL with `id_token_hint`. Idempotent: with no session it is 303 to sign-in |
| `POST /api/v1/session/keepalive` | none | *Stay signed in* from the idle warning. Needs the CSRF header. Returns the three expiry fields; never extends past `absoluteExpiresAt` |
| `GET /api/v1/session/change-password` | none | `navigation` operation. Redirects to Keycloak's password page (`kc_action=UPDATE_PASSWORD`); with no session it redirects to sign-in with `returnTo=/profile`. On success returns to `/profile?passwordChanged=1`; on cancel or error to `/profile` |
| `GET`, `PUT /api/v1/me/signature` | image (PNG, at most 300000 characters), kind (`typed` or `drawn`), text, style, `savedAt` | `PUT` takes image, kind, text and style together and returns the saved signature (200). `typed` needs text and style |
| `GET /api/v1/me/timesheets/{fortnightStart}` | status, version, `periodStart`, `periodEnd`, rejection reason, deletion date, days (start, break, finish, minutes, warnings), totals (`weeks` list of `{weekStart, minutes}`, `fortnightMinutes`) | Totals and warnings from the server. The current and previous fortnights always return 200 (an empty draft, version 0); other fortnights return 404 |
| `PUT /api/v1/me/timesheets/{fortnightStart}/days/{date}` | version; start, break, finish | Returns the new version, the day's figures and warnings, the totals, the three expiry fields and the deletion date if any |
| `DELETE /api/v1/me/timesheets/{fortnightStart}?version=` | version (query parameter, no body) | Clear. Returns the deletion date for a rejected timesheet |
| `POST /api/v1/me/timesheets/{fortnightStart}/submit` | version, declaration, warning-day ticks | Submitted data is the version the page last received. Returns the updated timesheet (200) |

Error bodies carry a stable `code` and are one closed union discriminated by it, so the client maps them to the designed messages: `VERSION_CONFLICT` and `TIMESHEET_NOT_EDITABLE` (409), `SIGNATURE_REQUIRED`, `NO_HOURS`, `WARNING_TICKS_MISMATCH`, `PAY_SCHEDULE_NOT_SET` (422, one code each), `BAD_REQUEST` (400, body cannot be parsed), `CSRF_TOKEN_INVALID` (403), and per-field codes on 400 `VALIDATION_FAILED` (`FINISH_BEFORE_START`, `BREAK_TOO_LONG`, `FUTURE_DAY`, `START_MISSING`, `FINISH_MISSING`; fields `start`, `breakMinutes`, `finish`, `date`, `version`).

- Every write (`PUT`, `POST`, `DELETE`) carries the CSRF header, declared once as a second security scheme (`csrfHeader`) rather than a parameter, so only `client.ts` adds it. The mock refuses a write without it with 403, as the real API does (AC-29).
- `/api/**` never redirects. An invalid or expired session returns 401 before any CSRF check, so a lapsed session never shows as a 403. Every endpoint except the two `navigation` ones declares its 401 and a `default` error response. Mock and real API return the same body (AC-22).
- All `date-time` values are UTC with a `Z` suffix. The idle warning counts down against `serverNow`, not the browser clock.
- Shared hours cases live in `contract/fixtures/hours-cases.json`, which the back end also reads.

If the back-end plan changes any of this, the contract changes first and every generated file is regenerated.

## Tasks

Each task is one agent's work (5 points at most). Every task's check includes the base gate `pnpm -C web typecheck && pnpm -C web lint && pnpm -C web test`; UI tasks also run `pnpm -C web audit`.

| # | Task | Agent | Owns files | Covers | Waits for | Status |
|---|---|---|---|---|---|---|
| 1 | Slice 1 OpenAPI contract | implementer, main session reviews | `contract/openapi.yaml` | AC-26, AC-29, AC-22 | — | Done (branch task/01-contract) |
| 2 | Scaffold `web/`, scripts, production-build check | implementer | `web/` config, `package.json`, lint and build config | D-3 | — | Todo |
| 3 | Generate types, client and schemas; client wrapper | implementer, main session reviews | `web/orval.config.ts`, `web/src/shared/api/` | AC-26 | 1, 2 | Todo |
| 4 | MSW mock API with seeded states | implementer | `web/src/mocks/` | AC-22, AC-23, AC-29, AC-11, AC-26 | 3 | Todo |
| 5 | Shared time, hours and validation modules | implementer (tests first) | `web/src/shared/time/`, `web/src/shared/validation/`, `contract/fixtures/hours-cases.json` | AC-5, AC-6, AC-7, AC-8 | 2 | Todo |
| 6 | Session store, route guards, idle warning, session-ended dialog | implementer, main session reviews | `web/src/features/auth/`, `web/src/app/router.ts` | AC-1, AC-2, AC-22, AC-30 | 3, 4, **R9** (idle warning) | Todo |
| 7 | Top bar, not found, no access, loading and failed states | implementer | `web/src/features/shell/`, `web/src/shared/ui/state/` | AC-2, AC-23 | 2 | Todo |
| 8 | Save queue (plain module) | implementer (tests first), main session reviews | `web/src/features/timesheet/save-queue/` | AC-9, AC-10, AC-11, AC-27 | 3 | Todo |
| 9 | 12-hour time input wrapper | implementer | `web/src/shared/ui/time-input/` | AC-28 | 2 | Todo |
| 10 | My timesheet: load, header and read-only states | implementer | `web/src/features/timesheet/page/` | AC-3, AC-4, AC-12, AC-18 | 4, 5, 6, 7, **R9** (320 px) | Todo |
| 11 | My timesheet: day rows, preview, errors and warnings | implementer | `web/src/features/timesheet/days/` | AC-5, AC-7, AC-8 | 5, 9, 10, **R9** (320 px) | Todo |
| 12 | My timesheet: save wiring and save states | implementer, main session reviews | `web/src/features/timesheet/saving/` | AC-9, AC-10, AC-11 | 8, 11, **R9** (stopped-saving state) | Todo |
| 13 | My timesheet: Clear and the Submit button | implementer | `web/src/features/timesheet/actions/` | AC-13, AC-14 | 10, 12 | Todo |
| 14 | Submit review and submit | implementer, main session reviews | `web/src/features/timesheet/submit/` | AC-15, AC-17 | 8, 13, 15, **R9** (320 px) | Todo |
| 15 | Signature component | implementer | `web/src/shared/signature/` | AC-16 | 2 | Todo |
| 16 | Profile page and Change password | implementer, main session reviews | `web/src/features/profile/` | AC-19, AC-20, AC-21 | 4, 6, 15, **R9** (320 px) | Todo |
| 17 | Keycloak base theme, sign-in states, local Keycloak | implementer, main session reviews | `keycloak/` (theme, realm import, compose), `web/e2e/keycloak/` | AC-25 (first part), C-2 | 2 | Todo |
| 18 | Keycloak password and reset pages | implementer, main session reviews | `keycloak/theme/` password and reset templates | AC-25 (rest), C-9 | 17, **R9** (breach message) | Todo |
| 19 | End-to-end, screenshot and accessibility suite | implementer | `web/e2e/` except `keycloak/`, `web/playwright.config.ts` | AC-1, AC-24 | 10 to 14, 16, 17, 18 | Todo |

Routes: each feature exports its own routes; task 6 assembles them in `router.ts` and may add a route only through that export.

Parallel groups (no shared files): {1, 2}; then {3, 5, 7, 9, 15, 17}; then {4, 8}; then {6}; then {10, 16}; then {11, 12}; then {13, 18}; then {14}; then {19}. Tasks with an **R9** mark build their non-R9 parts first and wait for R9 on the rest.

Every AC from 1 to 30 appears in at least one task. AC-20 has no slice 1 screen that shows a submitted timesheet's signature, so it is tested at the data layer: replacing a signature sends only the signature `PUT` and leaves the timesheet response unchanged; the full behaviour is covered by the back-end plan (FR-21).

## Practices (ponytail and pstack)

Rules in `.claude/skills/ui-e2e/references/engineering-practices.md`; `standards.md` wins where they differ. Each brief names these paths (under `.claude/skills/`), at most four per task, and adds `ponytail-review` to the review of every diff. Every agent that runs a ponytail or pstack skill (review, audit, interrogate, architect, reflect) is `general-purpose` with `model: opus` (Opus 5.5) at high effort and is read-only; implementers stay on Sonnet.

| Tasks | Agent reads | Extra review |
|---|---|---|
| All implementer tasks | `ponytail/SKILL.md` (full), `typescript-best-practices/SKILL.md`, `principle-type-system-discipline/SKILL.md` | `ponytail-review` on the diff |
| 5, 8 (tests first) | add `tdd/SKILL.md`, `principle-prove-it-works/SKILL.md` | main session reads against the fixtures |
| 1, 3, 4 (contract, client, mock) | add `principle-boundary-discipline/SKILL.md` | `blast-radius` before any contract change after task 1 |
| 6, 8, 12, 14, 16, 17, 18, 3 (security or data-loss) | add `principle-test-behavior-not-implementation/SKILL.md` | Opus `interrogate` pass, then the main session's line-by-line read |
| Plan changes | `architect`, `principle-sequence-verifiable-units` | Opus `interrogate` on the plan |
| Close-out | | `ponytail-debt`, `ponytail-audit`, `unslop`, `reflect` |

### Task 1: Slice 1 OpenAPI contract

- **Read first:** `docs/notion/be-design.md` section 4.1, 5; `brief.md` C-1, C-4, C-7, AC-22, AC-29; `docs/notion/fe-design.md` section 7.1; the API contract table above.
- **Do:** write `contract/openapi.yaml` (OpenAPI 3.1) with every endpoint in the table: request and response schemas, error bodies with `code` values, the CSRF header on writes, 24-hour `HH:mm` times and integer minutes. No backend code.
- **Tests first:** validate the spec with `@redocly/cli lint` (task 2 adds `contract:lint`).
- **Check:** `pnpm -C web contract:lint`
- **Done when:** the spec lints clean; every endpoint has its 401; no field uses a 12-hour time or a decimal; every error `code` above exists in the spec.
- **Don't:** write code in `web/` or the back end; add endpoints beyond the table.

### Task 2: Scaffold `web/`, scripts, production-build check

- **Read first:** `standards.md` (stack, checks); `docs/notion/fe-design.md` section 4.
- **Do:** Vite + Vue 3 + TypeScript in `web/` with `strict` and `noUncheckedIndexedAccess`; Vue Router, Pinia, Nuxt UI v4 through its Vite plugin (no Nuxt framework), Tailwind v4, Vitest with Vue Test Utils, Playwright, ESLint with Vue and TypeScript rules. pnpm via Corepack (`packageManager` pinned). Scripts: `typecheck`, `lint`, `test`, `test:components`, `codegen`, `codegen:check`, `contract:lint`, `test:e2e`, `audit` (the ui-audit scanner with `--strict`; path read from the ui-audit skill), and `check:build` (builds, then fails if `mockServiceWorker.js` or any `src/mocks` code is in `dist/`).
- **Tests first:** a smoke test mounting the root component; a `check:build` test that fails when a mock file is in the build.
- **Check:** `pnpm -C web typecheck && pnpm -C web lint && pnpm -C web test && pnpm -C web check:build`
- **Done when:** all nine scripts run and pass on the empty app.
- **Don't:** add any screen or library beyond the stack above; touch `docs/` or `mockup/`.

### Task 3: Generate types, client and schemas; client wrapper

- **Read first:** `contract/openapi.yaml`; standards "Defensive vs maintainable (API checks)".
- **Do:** `web/orval.config.ts` generating into `web/src/shared/api/generated/` (types, client functions, zod schemas). `web/src/shared/api/client.ts` is the only place requests are sent: it adds the CSRF header from the cookie on writes, checks every response and every request body against its zod schema, raises one typed "unauthorised" event on 401 (task 6 listens), and has a `keepalive` send mode that still adds the CSRF header. Confirm with the pinned orval that the checks hook in without hand-written glue; if not, stop and report.
- **Also:** exclude the `navigation` tag in `orval.config.ts` (login and change-password are page navigations, not fetch calls); add `@redocly/cli` as a pinned devDependency and use it in `contract:lint` instead of `npx`; check the generated zod accepts `Z` date-times, discriminated error unions and the `csrfHeader` scheme without a header argument, and raise it if not.
- **Tests first:** header present on `PUT`/`POST`/`DELETE`, absent on `GET`; a response failing its schema throws; a 401 raises the event; the `keepalive` mode carries the header.
- **Check:** `pnpm -C web codegen && pnpm -C web codegen:check && pnpm -C web typecheck && pnpm -C web lint && pnpm -C web test`
- **Done when:** `codegen:check` passes on a clean tree; nothing under `generated/` is hand-edited; no other file calls `fetch`.
- **Don't:** hand-write a schema; add a second client.
- **Review:** the main session reads `client.ts` line by line (CSRF, 401 handling).

### Task 4: MSW mock API with seeded states

- **Read first:** `brief.md` AC-22, AC-23, AC-26, AC-29; `docs/screens/timesheet.md` (states); `mockup/approved/README.md`.
- **Do:** handlers in `web/src/mocks/` typed with the generated types. A signed-in flag (dev console and Playwright). Signed out: the same 401 as the real API. Writes without the CSRF header: 403. Check every request body against the generated schema and fail loudly on mismatch (AC-26). Seeded data for each state the approved screenshots show: draft, empty, rejected (with reason), submitted, approved, full, no pay schedule, warning days, a stale-version conflict, a missing signature. Delay and failure switches for AC-23 and AC-10. Used in dev and tests only (task 2's build check guards this).
- **Tests first:** 401 when signed out, 403 without the header, 409 `VERSION_CONFLICT`, 400 with field `code`s, a request body that breaks the schema fails.
- **Check:** `pnpm -C web codegen:check && pnpm -C web typecheck && pnpm -C web lint && pnpm -C web test && pnpm -C web check:build`
- **Done when:** every contract endpoint has a handler and every seeded state loads.
- **Don't:** keep state in browser storage; copy response shapes by hand.

### Task 5: Shared time, hours and validation modules

- **Read first:** `docs/notion/fe-design.md` section 9; `docs/notion/be-design.md` section 3.3; brief AC-5 to AC-8, FR-11.
- **Do:** `web/src/shared/time/` (12-hour times, `{h}h {mm}m`, decimals half-up to 2 places in integer arithmetic `(minutes * 100 + 30) div 60`, the totals note, date formatters used on every screen) and `web/src/shared/validation/` (FR-09 rules, FR-27 rule, worked-minutes preview for a day, week and fortnight preview totals). Shared cases in `contract/fixtures/hours-cases.json`: 0h 45m, 8h 00m, 8h 10m (8.17), 76h 30m, three days of 8h 10m = 24h 30m (24.50), warnings at 1h 00m and 12h 30m, and the FR-09 failures.
- **Tests first:** the fixture file and its test runner come before any implementation; the tests read the same JSON the back end will.
- **Check:** `pnpm -C web typecheck && pnpm -C web lint && pnpm -C web test`
- **Done when:** every fixture case passes; no floating point in the rounding path; no Vue import.
- **Don't:** display anything.

### Task 6: Session store, route guards, idle warning, session-ended dialog

- **Read first:** `docs/screens/not-found.md`, `docs/screens/timesheet.md` (session ended), `docs/screens/sign-in.md`; brief C-4, AC-1, AC-2, AC-22; the contract's session endpoints.
- **Do:** a Pinia session store from `GET /me`; guards that send a signed-out visitor to `GET /session/login?returnTo=<relative path>` and back (AC-1) and show "This page is for managers" to employees (AC-2); sign out as a real `<form method=post action=/api/v1/session/logout>` with a hidden `_csrf` input read from the XSRF-TOKEN cookie, submitted by the Sign out button (not fetch), landing on Keycloak's signed-out page; the session-ended dialog (cannot be dismissed, *Sign in again*) opened by task 3's unauthorised event (AC-22); the idle warning two minutes before `idleExpiresAt`, with *Stay signed in* calling `/session/keepalive` (design from R9). Assembles every feature's routes in `router.ts`.
- **Tests first:** guard tests (signed out, employee on a manager page, unknown URL); a `returnTo` that is not a relative path is never sent; the dialog opens on a 401; the idle warning shows at the right time and *Stay signed in* resets it.
- **Check:** `pnpm -C web typecheck && pnpm -C web lint && pnpm -C web test && pnpm -C web test:components`
- **Done when:** the tests pass against the mock API.
- **Don't:** store a token, session or any user data in browser storage; the only cookie read is the CSRF token; no sign-in form (sign-in is Keycloak's).
- **Review:** the main session reads the guards, the `returnTo` handling and the sign-out request line by line.

### Task 7: Top bar, not found, no access, loading and failed states

- **Read first:** `docs/screens/not-found.md`; `docs/notion/fe-design.md` section 7.2; `mockup/approved/` `not-found-state-*`.
- **Do:** the top bar (employee and manager variants), "Page not found", "This page is for managers", and the shared loading (after about 300 ms) and "Couldn't load {what}" states with *Try again*.
- **Tests first:** the loading lines appear only after 300 ms; *Try again* re-runs the load; each page renders its variant.
- **Check:** `pnpm -C web typecheck && pnpm -C web lint && pnpm -C web test:components && pnpm -C web audit`
- **Done when:** component tests pass for each state.
- **Don't:** write route guards (task 6).

### Task 8: Save queue

- **Read first:** brief C-7, AC-9 to AC-11, AC-27; `docs/notion/fe-design.md` section 7.1.
- **Do:** a plain TypeScript module, no Vue or Pinia. One queue per timesheet, a 1 s debounce per day plus a flush on blur, one request in flight; edits during a save wait and go in the next request with the version from the last response. Retry only on network errors, timeouts and 5xx: first attempt plus 10 retries, waiting 2, 4, 8, 16, 32, then 60 s, jittered; a 10 s timeout; an `online` or visible-again event brings the next attempt forward without adding one. After the last failure report "stopped". Never retry 400, 401, 403 or 409. A timed-out request that actually went through returns a 409 on retry: on a 409 the queue asks the page to reload and show the conflict notice (AC-11), losing nothing it can't recover from the reload. On `visibilitychange` to hidden and on `pagehide`, send what is pending with the `keepalive` mode through the client wrapper (CSRF header included); a `keepalive` send while another request is in flight uses the latest known version and then waits. `beforeunload` asks for confirmation while anything is unsaved.
- **Tests first:** one test per rule using fake timers and a fake client, including: the wait sequence; 400, 401, 403 and 409 never retried; the false-409-after-timeout path; the `keepalive` send on hide and on pagehide; no new attempt added by `online`.
- **Check:** `pnpm -C web typecheck && pnpm -C web lint && pnpm -C web test`
- **Done when:** all retry, ordering and keepalive tests pass; the module imports nothing from Vue or Pinia.
- **Don't:** persist drafts in `localStorage` or IndexedDB (AD-18).
- **Review:** the main session reads the queue against C-7 before task 12.

### Task 9: 12-hour time input wrapper

- **Read first:** `docs/notion/fe-design.md` section 6.1 (time inputs) and 12 (Android check open).
- **Do:** a wrapper around Nuxt UI `UInputTime` with `hour-cycle` 12 and minute granularity, value a `Time` from `@internationalized/date`, mapped to and from `HH:mm`. Its own accessible label and error slot; the type-hour-minute-then-a-or-p path (AC-28).
- **Tests first:** `07:30` to 7:30 AM and back; 12:00 and 00:00; typing "7", "30", "p" sets 7:30 PM.
- **Check:** `pnpm -C web typecheck && pnpm -C web lint && pnpm -C web test:components`
- **Done when:** mapping and typing tests pass; iPhone checked 03/11/2026; Android is still a manual check.
- **Don't:** use a native `<input type="time">`.

### Task 10: My timesheet: load, header and read-only states (**R9**)

- **Read first:** `docs/screens/timesheet.md`; `mockup/approved/README.md` (`timesheet-state-*`, `timesheet--*`); `mockup/ROUNDS.md` R1 and R7.
- **Do:** load the timesheet for the route; the header (name, pay period, status word and icon, save status slot, deletion date); the Previous/Current fortnight switch using `currentFortnightStart` and `previousFortnightStart` from `/me`; the FR-06 message; Submitted and Approved read-only; Rejected with the reason first and editable; loading and failed states from task 7.
- **Tests first:** one test per state (draft, empty, rejected, submitted, approved, no schedule); only the two fortnights can be chosen (AC-4); the deletion date shows from the API (AC-12).
- **Check:** `pnpm -C web typecheck && pnpm -C web lint && pnpm -C web test:components && pnpm -C web audit`
- **Done when:** every state in `mockup/approved/README.md` for this page renders; the 320 px layout waits for R9.
- **Don't:** compute fortnights in the client; add a Save button.

### Task 11: My timesheet: day rows, preview, errors and warnings (**R9**)

- **Read first:** `docs/screens/timesheet.md`; `mockup/ROUNDS.md` R1; task 5's modules.
- **Do:** a table on desktop and stacked cards on phone; empty days collapse to *Add hours*; future days disabled; the preview from task 5 as the employee types; the warning tint and message; FR-09 errors red inline with no toast; the server's figures replace the preview after a save.
- **Tests first:** typing updates day, week and fortnight preview at once (AC-5); a start without a finish, a finish before the start, and a break as long as the shift show a red field and no toast (AC-7); warning days tint at 1h 00m and 12h 30m (AC-8); the server's response replaces the preview figure.
- **Check:** `pnpm -C web typecheck && pnpm -C web lint && pnpm -C web test:components && pnpm -C web audit`
- **Done when:** component tests pass; the 320 px and 150% text layout waits for R9.
- **Don't:** import the save queue (task 12 wires it); compute hours outside task 5's modules.

### Task 12: My timesheet: save wiring and save states (**R9**)

- **Read first:** brief AC-9 to AC-11; task 8's queue; `mockup/approved/` `timesheet-state-not-saved`, `timesheet-state-conflict`; R7 and R9.
- **Do:** connect each day's edits to the save queue; show "Saving…" then "Saved"; "Not saved" with the box and a toast; the stopped-saving state (read-only, the message, *Try again*); the "changed on another device" notice after a reload; use the latest version for each request.
- **Tests first:** status text sequence; "Not saved" box and toast on failure (AC-10); after the last retry the timesheet is read-only and *Try again* saves at once; a 409 reloads and shows the notice (AC-11).
- **Check:** `pnpm -C web typecheck && pnpm -C web lint && pnpm -C web test:components && pnpm -C web audit`
- **Done when:** the states above pass against the mock API.
- **Don't:** add retry logic here (it lives in task 8).
- **Review:** the main session reads the wiring against C-7.

### Task 13: My timesheet: Clear and the Submit button

- **Read first:** `docs/screens/timesheet.md`; brief AC-13, AC-14.
- **Do:** *Clear* with its confirmation (the rejected-timesheet variant mentions the 3-month deletion) and the header's deletion date afterwards (AC-13); *Submit* disabled with "Add hours to at least one day to submit." until a day has hours (AC-14).
- **Tests first:** the Clear dialog text per status; confirming clears all hours; *Submit* disabled and enabled by the hours.
- **Check:** `pnpm -C web typecheck && pnpm -C web lint && pnpm -C web test:components && pnpm -C web audit`
- **Done when:** AC-13 and AC-14 tests pass.
- **Don't:** open the review (task 14).

### Task 14: Submit review and submit (**R9**)

- **Read first:** `docs/screens/timesheet-review.md`; brief AC-15, AC-17; `mockup/approved/` `timesheet-review--*`.
- **Do:** a full-screen review on phone and a dialog on desktop at `/timesheet/review`; lists only days with hours; one tick per warning day and the declaration; *Submit timesheet* disabled with a hint naming what is left; the signature step when none is set (task 15's component). Before sending, flush the save queue and use the latest version; block submit while the status is "Not saved" or saving has stopped. A failed submit keeps the ticks and data and shows the inline message plus a toast; success returns to the read-only timesheet with the toast.
- **Tests first:** the button stays disabled until every tick is set; the hint changes per missing item; submit waits for pending saves and uses the latest version; submit is blocked in the stopped state; a failed submit keeps the ticks.
- **Check:** `pnpm -C web typecheck && pnpm -C web lint && pnpm -C web test:components && pnpm -C web audit`
- **Done when:** AC-15 and AC-17 tests pass against the mock API.
- **Don't:** send a submit without a signature; compute totals here.
- **Review:** the main session reads the flush-then-submit order.

### Task 15: Signature component

- **Read first:** `docs/screens/profile.md`; `mockup/ROUNDS.md` R3; brief AC-16.
- **Do:** `web/src/shared/signature/`: a wrapper around `signature_pad` with a fixed 2.5 px stroke; three typed styles (La Belle Aurore default, Herr Von Muellerhoff, Mrs Saint Delafield, bundled under OFL); the typed preview shrinks to fit its line; exports the PNG plus kind, text and style together.
- **Tests first:** an empty name or a blank drawing is rejected; the export carries image, kind, text and style together; changing the style changes the export.
- **Check:** `pnpm -C web typecheck && pnpm -C web lint && pnpm -C web test:components && pnpm -C web audit`
- **Done when:** the tests pass; `signature_pad` is imported only here.
- **Don't:** call the API (pages do).

### Task 16: Profile page and Change password (**R9**)

- **Read first:** `docs/screens/profile.md`; brief AC-19 to AC-21; `mockup/approved/` `profile-state-*`, `profile--password-changed`; the contract's session and signature endpoints.
- **Do:** name from the login with "Ask your manager if it's wrong"; the saved signature with "Saved {date}" and *Replace signature*; replacing sends one `PUT` with image, kind, text and style (AC-19); empty name or blank drawing: red field plus a toast. *Change password* goes to `GET /session/change-password`; the "Password changed" toast shows only when the URL has `passwordChanged=1` and the flag is then removed from the URL (AC-21). The signature prompt at first submit reuses task 15.
- **Tests first:** the replace request body; the empty cases; the toast shows with the flag and not without it; replacing a signature does not reload or change the timesheet (AC-20, data layer).
- **Check:** `pnpm -C web typecheck && pnpm -C web lint && pnpm -C web test:components && pnpm -C web audit`
- **Done when:** the tests pass; the 320 px layout waits for R9.
- **Don't:** handle a password anywhere in the app.
- **Review:** the main session reads the Change password redirect and the signature request.

### Task 17: Keycloak base theme, sign-in states, local Keycloak

- **Read first:** `docs/screens/sign-in.md`; `mockup/approved/` `sign-in-state-*`; brief C-2, C-3.
- **Do:** a Keycloak login theme in `keycloak/theme/` (the app's look; the approved screenshots show a business name, slice 1 shows "Timesheets", recorded in the spec's "Changes since approval"). States: sign in, wrong password (both fields red plus the box), signed out, deactivated. `keycloak/compose.yml` with a pinned Keycloak, a realm import with an employee and a manager test user, and a local mail catcher for reset emails. The login page returns to the app through the contract's `returnTo` flow.
- **Tests first:** Playwright specs in `web/e2e/keycloak/` check each state at 375 px and 1280 px against the approved screenshots.
- **Check:** `docker compose -f keycloak/compose.yml up -d` then `pnpm -C web test:e2e --project=keycloak`
- **Done when:** every state renders at both widths.
- **Don't:** add a logo or a stored business name (slice 3).
- **Note:** the sign-out e2e path must use the `id_token_hint` redirect once BE-09 implements it.
- **Review:** the main session reads the template form actions and hidden fields.

### Task 18: Keycloak password and reset pages (**R9**)

- **Read first:** `docs/screens/sign-in.md`; `mockup/approved/` `sign-in-state-*`; brief C-9, AC-25.
- **Do:** choose a new password (the 8-character rule, the breached-password message agreed with BE-10, the other errors), forgot, reset sent, link expired, and the Change password page that Profile returns from. Confirm with the pinned Keycloak how its "letters and numbers" policy names its message.
- **Tests first:** Playwright specs per state at both widths; the mail catcher receives the reset email.
- **Check:** `docker compose -f keycloak/compose.yml up -d` then `pnpm -C web test:e2e --project=keycloak`
- **Done when:** every state renders at both widths and the reset email arrives.
- **Don't:** change the base theme (task 17).
- **Review:** the main session reads the password form actions.

### Task 19: End-to-end, screenshot and accessibility suite

- **Read first:** `.claude/skills/ui-visual-check/`; `mockup/approved/README.md`; standards "Checks".
- **Do:** Playwright specs for AC-1 (redirect to sign-in and back against the mock) and AC-24 (every page and state at 375×812 and 1280×800; no sideways scroll; axe with no serious or critical findings); a 320×640 run on My timesheet, Submit review and Profile, with 150% text simulated by raising the root font size to 24 px and repeating the sideways-scroll check. Screenshots are captured with `snap.mjs` from each seeded mock state; the comparison with `mockup/approved/` is a side-by-side read by the main session, and each difference is fixed or recorded in the screen spec's "Changes since approval".
- **Tests first:** the specs are the tests.
- **Check:** `pnpm -C web test:e2e`
- **Done when:** every spec passes; screenshot differences are fixed or recorded.
- **Don't:** change the approved screenshots.

## Future impact and seams

| Roadmap item | Seam left |
|---|---|
| Weekend and overnight shifts (M2) | Days come from the API. Validation lives only in `shared/validation/`, so "finish after start" changes in one place |
| More managers, reporting lines (M2) | Route and API checks use the role from `/me`; approval lists come from the API |
| Recall and amendments (M2) | Status is the generated closed union; every status branch is exhaustive, so a new status fails type-check |
| More soft warnings (M2) | Warnings render from the server's list, not from FR-27 in the screen |
| Configurable periods (M3) | Fortnight starts and length come from `/me`; the client never computes 14 days |
| Tenants, per-tenant sign-in (M3) | The API base URL and the sign-in redirect each live in one module |
| Projects, pay rates (M4) | Totals and hours are the server's figures; the client only previews |
| Public API, bearer auth (M4) | All requests go through one client module, so adding a second auth path touches one file |
| Multiple languages (Later) | UI text is whole sentences, never built from fragments |

## End-of-slice checks

From `standards.md`, with the commands set in tasks 2 and 19:

| Gate | Command |
|---|---|
| Type-check | `pnpm -C web typecheck` |
| Lint | `pnpm -C web lint` |
| Unit tests | `pnpm -C web test` |
| Component tests | `pnpm -C web test:components` |
| Contract is in step | `pnpm -C web contract:lint && pnpm -C web codegen:check` |
| No mocks in the production build | `pnpm -C web check:build` |
| ui-audit scan (`--strict`) | `pnpm -C web audit` |
| End-to-end, 375×812, 1280×800, 320×640 | `pnpm -C web test:e2e` |
| Screenshots | `node .claude/skills/ui-visual-check/scripts/snap.mjs --url http://localhost:5173/ --routes "/timesheet,/timesheet/review,/profile" --out .ui-snapshots`, then side-by-side review against `mockup/approved/` |
| Accessibility (axe) | inside `test:e2e` |
| ui-audit review and critique | main session, after the scan |

Manual, recorded at close-out: the iPhone time-input check (AC-28, done 03/11/2026) and the Android check (open); the sign-in theme on a real phone.

## Risks

| Risk | Fallback |
|---|---|
| R9 is not approved in time | Tasks with an R9 mark build their other parts first; the R9 parts wait |
| Back end lags the contract | The mock stands in for the contract; the back-end plan builds to the same spec (C-1); `codegen:check` catches drift |
| orval cannot run schema checks without hand-written glue | Task 3 stops and reports; the fallback is `openapi-typescript` with `openapi-fetch` and generated zod schemas |
| Spring's CSRF setup for a single-page app differs from the contract | Task 1 confirms the header and cookie names with BE-09 before anything is generated |
| Keycloak theme work beyond estimate | Ship the states that match the mock first; the breached-password message can follow BE-10 |
| Android time input misbehaves (AC-28) | The typed-time variant with an AM/PM switch from mock-up R1 needs a new round |
| Notion still says JWT bearer (AD-07) and "To be decided" (FE design section 3) | Decided 03/11/2026 (see Decisions); Notion edits pending before the back-end plan starts |
| Older rejected timesheet opened from outside the two fortnights | Not in slice 1 (nothing can be rejected until slice 2); the brief lists it as open |
| An edit typed after the session quietly expires | The idle warning (R9) and the session-ended dialog; only saved hours are safe |

## Notes for the back-end plan

- The contract in `contract/openapi.yaml` is the source; the back-end plan adds oasdiff and checks the generated spec against the committed one (C-5).
- `contract/fixtures/hours-cases.json` is shared with the back end (task 5).
- BE-09 (cookie session, CSRF, session endpoints, `returnTo` check) and BE-10 (breached-password check) are the back-end tickets this front end depends on.
