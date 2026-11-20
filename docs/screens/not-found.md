# Page not found (any unknown URL, and manager pages opened by employees)

**Who:** Everyone signed in (employees and the manager).
**Requirements:** FR-03 (only managers use Approvals and Admin) and FR-02; no other FR. Decision R7-3. R7-4 (a separate No access page) is replaced, see Changes since approval.
**Approved:** round R7 on 18/10/2026
**Screenshots:** `mockup/approved/not-found-*` (each at `@375x812` and `@1280x800`)
**Mock-up page:** `mockup/src/pages/not-found.vue`

One short dead-end page that keeps the top bar and offers one way back. In the real app, Not found is the catch-all route. An employee who opens a manager route (a role check on `/approvals`, `/approvals/:fortnight/:timesheet` and `/admin`) sees the same page, so a page they may not use reveals nothing about itself: not that it exists, not which role it needs.

## States

The mock-up's `?state=` values exist only in the mock-up. Screenshot names omit the `@375x812` / `@1280x800` suffix; every name exists at both sizes.

| State | When | What's shown | Screenshots |
|---|---|---|---|
| Not found (R7-3) | The URL matches no route: a mistyped or old link | Top bar with no page underlined; h1 "Page not found"; a muted line; *Go to My timesheet* | `not-found-state-not-found` |
| Not found, for a manager's page | A signed-in employee opens a manager's page (Approvals or Admin) | The same as Not found above, so the two cannot be told apart | `not-found-state-not-found` |

## Layout

- **Phone (375px):** the top bar (employee version: My timesheet, Profile, Sign out), then one white sheet, full width: title (`h1`, 24px), body text, then the button 32px below the text. No page is underlined in the top bar.
- **Desktop:** the sheet is centred, max width about 768px, bordered, on the paper background, with about 32px above. The button is 36px tall; on phone it is 44px.
- The top bar is the same as on every page: it is not given a current page here (R7, "fixed before review": the bar no longer underlines a page you aren't on).

## Copy

| Where | Text |
|---|---|
| Not found: title | "Page not found" |
| Not found: body | "The link may be old or mistyped. Your timesheets are all still there." |
| Button | "Go to My timesheet" |
| Top bar | "My timesheet", "Profile", "Sign out" |

## Interactions

| Trigger | Result | Requirement |
|---|---|---|
| Open an unknown URL | Shows Not found; the URL is kept | R7-3 |
| Employee opens `/approvals`, `/approvals/...` or `/admin` | Shows Not found; the URL is kept; the page's data is never requested | FR-03, need to know |
| *Go to My timesheet* | Opens `/timesheet` | n/a |
| Top bar links | Normal navigation | n/a |

## Components

| Part | Built from | Notes |
|---|---|---|
| Top bar | `TopBar` part with no `current` and not `manager` | No link is underlined or marked current |
| Sheet | `article` on the sheet colour, border on desktop only | |
| Button | `UButton` size xl, primary | 44px on phone, 36px on desktop |

## Data

| Shown | From the API | Format |
|---|---|---|
| Role check | The signed-in user's role from the Keycloak token (manager or employee) | Decides which page shows |

## Edge cases

- **Manager opens an unknown URL:** gets Not found; the mock-up shows the employee top bar, the real app should show the manager's (Approvals, Admin) — see Open questions.
- **Signed out:** an unknown URL while signed out goes to the sign-in page first (assumed; see Open questions).

## Accessibility

- One `h1`.
- The button is a link to `/timesheet` with a visible name; 44px target on phone.
- Focus order: top bar, then the button.
- The page title (browser tab) should say "Page not found" so screen-reader users learn what happened (not in the mock-up).

## Motion

None.

## Changes since approval

| Change | Why | User's OK |
|---|---|---|
| R7-4 (No access page, "This page is for managers") is replaced by the Not found page. The name, the lock icon and the "ask your manager" line are gone. `mockup/approved/not-found-state-no-access*` no longer applies | Need to know: a person without permission should get no more information than they need, and the old page named the page and the role it needs | 20/11/2026 |

## Open questions

1. **Manager's top bar.** The mock-up always draws the employee top bar here (no `manager`). A manager who opens an unknown URL should see Approvals and Admin too.
2. **Signed out.** The mock-up doesn't show what happens for an unknown URL or a manager route when nobody is signed in; assumed to go to sign-in (`sign-in.md`).
3. **Server errors and 403s.** A manager route requested with a valid-looking role but a back-end 403 isn't designed; assumed to show Not found.
