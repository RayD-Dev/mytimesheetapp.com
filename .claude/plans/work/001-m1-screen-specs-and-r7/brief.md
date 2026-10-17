# 001 M1 screen specs and mock-up round R7

**Goal:** Finish M1's UI design: write a spec for every approved screen, and mock up the M1 screens and states not yet mocked, stopping at the approved mock-up.
**Status:** Approved 13/10/2026

## Why

The mock-up is frozen after R6 with 73 screenshots (`mockup/approved/`). Engineering needs a spec per page, and some M1 screens and states the PRD and FE design need were never drawn. Source: conversation 13/10/2026, "for both mocked & non-mocked screens for m1".

## Requirements

| ID | Requirement | Source |
|---|---|---|
| C-1 | Write `docs/screens/<page>.md` for the six approved pages, taken from the mock-up, `ROUNDS.md` and the approved screenshots | Conversation 13/10/2026: "building on top of the 73 screenshots, the approved/ README, and the DESIGN.md and ROUNDS.md updates" |
| C-2 | Mock up the M1 screens and states that are not yet drawn, in round R7 | Conversation 13/10/2026: "for both mocked & non-mocked screens for m1" |
| C-3 | Stop at the approved mock-up: no plan, no engineering | Conversation 13/10/2026: "UI design only till mockup" |
| C-4 | Version conflict shows as an inline notice | Conversation 18/10/2026: "Happy for this" |
| C-5 | The manager sets the business name on Admin; the sign-in pages show it | Conversation 18/10/2026: "Maybe admin can configure this?" |
| C-6 | M1 password rule: at least 8 characters, with letters and numbers | Conversation 18/10/2026: "8 Character Minimum with a mixture of letters and numbers" |
| C-7 | No two-factor sign-in in M1 | Conversation 18/10/2026: "No" |
| FR-01 | Sign in, first-sign-in password change, password reset (Keycloak's pages) | fe-design.md §6 route table |
| FR-25 | Deactivated people can't sign in | prd.md §6 Admin page |
| FR-06 | Pay schedule not set message | prd.md §6 |
| FE-7.1 | Not saved / retry; version conflict reloads and tells the user | fe-design.md §7.1 |

## What the user sees

**A. Specs only (no new design):** My timesheet, Submit review, Approvals, One timesheet, Admin, Profile. Each gets `docs/screens/<page>.md`.

**B. Proposed R7 mock-ups (not yet drawn):**
1. Sign-in, first-sign-in password change and password reset, styled in Ledger as a Keycloak theme (the app never handles passwords).
2. Signed out: session expired, with a way back in.
3. Not found (bad URL or a fortnight outside current/previous).
4. No access: an employee opening Approvals or Admin.
5. Deactivated person trying to sign in.
6. Not saved on My timesheet (the autosave failure state, FE §7.1) and the version-conflict "timesheet changed on another device" notice.
7. Loading and failed-to-load states for each page.

## Acceptance criteria

| AC | Given, when, then | Covers |
|---|---|---|
| AC-1 | Given each approved page, when its spec is read, then every state, copy string, interaction and component is traceable to a screenshot | C-1 |
| AC-2 | Given R7, when the user reviews the board, then each new screen exists at 375px and 1280px with no sideways scroll and passes the ui-visual-check floor | C-2 |
| AC-3 | Given R7 is approved, when screenshots are frozen, then they are added to `mockup/approved/`, its README, `ROUNDS.md` and `DESIGN.md` are updated | C-2 |

## Out of scope

Plan and build (later brief). M2 features: recall, amendments, weekend shifts, audit history, reports, email notifications. Changes to the six approved designs.

## Future impact

M2 recall and amendments will add states to My timesheet and Approvals; the specs leave "Changes since approval" and open questions to hold them.

## Open questions

None. Resolved 13/10/2026 ("yes do it"): the R7 list is approved as written. Keycloak pages get the Ledger look in M1 (a custom Keycloak theme): conversation 13/10/2026, "the idea is for a consistent & coherent ui".
