# Page not found and no access (any unknown URL; manager routes for employees)

**Who:** Everyone signed in (employees and the manager). No access applies to employees.
**Requirements:** FR-01 (roles: only the manager sees Approvals and Admin); no other FR. Decisions R7-3 and R7-4.
**Approved:** round R7 on 18/10/2026
**Screenshots:** `mockup/approved/not-found-*` (each at `@375x812` and `@1280x800`)
**Mock-up page:** `mockup/src/pages/not-found.vue`

Two short dead-end pages that keep the top bar and offer one way back. In the real app, Not found is the catch-all route; No access is shown when an employee opens a manager route (a role check on `/approvals`, `/approvals/:fortnight/:timesheet` and `/admin`).

## States

The mock-up's `?state=` values exist only in the mock-up. Screenshot names omit the `@375x812` / `@1280x800` suffix; every name exists at both sizes.

| State | When | What's shown | Screenshots |
|---|---|---|---|
| Not found (R7-3) | The URL matches no route: a mistyped or old link | Top bar with no page underlined; h1 "Page not found"; a muted line; *Go to My timesheet* | `not-found-state-not-found` |
| No access (R7-4) | A signed-in employee opens a manager's page (Approvals or Admin) | Top bar with no page underlined; h1 "This page is for managers" with a lock icon; the person's name; a muted line; *Go to My timesheet* | `not-found-state-no-access` |

## Layout

- **Phone (375px):** the top bar (employee version: My timesheet, Profile, Sign out), then one white sheet, full width: title (`h1`, 24px), body text, then the button 32px below the text. No page is underlined in the top bar.
- **Desktop:** the sheet is centred, max width about 768px, bordered, on the paper background, with about 32px above. The button is 36px tall; on phone it is 44px.
- The top bar is the same as on every page: it is not given a current page here (R7, "fixed before review": the bar no longer underlines a page you aren't on).

## Copy

| Where | Text |
|---|---|
| Not found: title | "Page not found" |
| Not found: body | "The link may be old or mistyped. Your timesheets are all still there." |
| No access: title | "This page is for managers" |
| No access: body | "You're signed in as {name}, and Approvals is only for managers." (the name is bold) |
| No access: help | "If you think you should have access, ask your manager." |
| Button (both) | "Go to My timesheet" |
| Top bar | "My timesheet", "Profile", "Sign out" |

## Interactions

| Trigger | Result | Requirement |
|---|---|---|
| Open an unknown URL | Shows Not found; the URL is kept | R7-3 |
| Employee opens `/approvals`, `/approvals/...` or `/admin` | Shows No access; the URL is kept; the page's data is never requested | R7-4, FR-01 |
| *Go to My timesheet* | Opens `/timesheet` | n/a |
| Top bar links | Normal navigation | n/a |

## Components

| Part | Built from | Notes |
|---|---|---|
| Top bar | `TopBar` part with no `current` and not `manager` | No link is underlined or marked current |
| Sheet | `article` on the sheet colour, border on desktop only | |
| Lock icon | `UIcon` lock, 24px, muted | No access title only |
| Button | `UButton` size xl, primary | 44px on phone, 36px on desktop |

## Data

| Shown | From the API | Format |
|---|---|---|
| Name in No access | Signed-in user's name (proposed `me.name`, the same field as the timesheet heading) | Plain text, bold |
| Role check | The signed-in user's role from the Keycloak token (manager or employee) | Decides which page shows |

## Edge cases

- **Long name:** wraps inside the sentence in No access (not in a screenshot).
- **Manager opens an unknown URL:** gets Not found; the mock-up shows the employee top bar, the real app should show the manager's (Approvals, Admin) — see Open questions.
- **Which page was blocked:** the No access body says "Approvals" whichever manager page was opened (also Admin).
- **Signed out:** an unknown URL while signed out goes to the sign-in page first (assumed; see Open questions).

## Accessibility

- One `h1` per state; the lock icon is decorative.
- The button is a link to `/timesheet` with a visible name; 44px target on phone.
- Focus order: top bar, then the button.
- The page title (browser tab) should say "Page not found" or "No access" so screen-reader users learn what happened (not in the mock-up).

## Motion

None.

## Changes since approval

| Change | Why | User's OK |
|---|---|---|

## Open questions

1. **Manager's top bar.** The mock-up always draws the employee top bar here (no `manager`). A manager who opens an unknown URL should see Approvals and Admin too.
2. **Wording for Admin.** "Approvals is only for managers." is fixed in the source, so an employee opening Admin would be told it is Approvals. The copy for Admin is not designed.
3. **Signed out.** The mock-up doesn't show what happens for an unknown URL or a manager route when nobody is signed in; assumed to go to sign-in (`sign-in.md`).
4. **Server errors and 403s.** A manager route requested with a valid-looking role but a back-end 403 isn't designed; assumed to show No access.
