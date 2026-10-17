# Sign-in pages (Keycloak login theme; not an app route; mock-up `#/sign-in`)

**Who:** Everyone (employees and the manager), before they are signed in
**Requirements:** FR-01, FR-25; conversation decisions C-5 (business name set on Admin), C-6 (M1 password rule: at least 8 characters, letters and numbers), C-7 (no two-factor sign-in in M1)
**Approved:** round R7 on 18/10/2026
**Screenshots:** `mockup/approved/sign-in-state-*` (each at `@375x812` and `@1280x800`)
**Mock-up page:** `mockup/src/pages/sign-in/index.vue`

Keycloak's own pages, themed in Ledger so signing in looks like the rest of the app. The app never handles passwords (FR-01); every page here is rendered by Keycloak through a login theme.

## States

The mock-up's `?state=` values exist only in the mock-up. In the real app Keycloak chooses the page from the flow the person is in. Screenshot names omit the `@375x812` / `@1280x800` suffix; every name exists at both sizes.

| State | When | What's shown | Screenshots |
|---|---|---|---|
| Sign in | Default; the person opens the app or a link while signed out | Business name and "Timesheets" above a ruled sheet; h1 "Sign in"; Email and Password (show/hide button) fields; *Sign in*; *Forgot your password?* | `sign-in-state-sign-in` |
| Wrong password | Email and password don't match | As Sign in, with a red-tinted alert above the form: "That email and password don't match. Try again, or reset your password."; email field filled in | `sign-in-state-wrong-password` |
| Signed out | After *Sign out* | As Sign in, with a green "You've signed out." line above the form | `sign-in-state-signed-out` |
| Deactivated (R7-5) | The manager deactivated the account (FR-25) | As Sign in, with a red-tinted alert: heading "This account has been deactivated" and an explanation | `sign-in-state-deactivated` |
| First sign-in | Signed in with a temporary password (FR-01) | h1 "Choose a new password", intro for a temporary password; New password and Type it again; *Save password* | `sign-in-state-first-sign-in` |
| Change password | From Profile's *Change password* | As First sign-in, with a different intro and a *Cancel* button next to *Save password* | `sign-in-state-change-password` |
| Forgot password | *Forgot your password?* pressed | h1 "Reset your password"; Email; *Email me a reset link*; *Back to sign in* | `sign-in-state-forgot` |
| Reset link sent | Reset requested | h1 "Check your email"; the address shown in bold; *Back to sign in* | `sign-in-state-reset-sent` |
| Link expired | A reset link opened after it stopped working | h1 "This link has expired"; explanation; *Get a new link* | `sign-in-state-link-expired` |
| No business name | First run, before the manager sets the business name (R7-8) | The header shows "Timesheets" alone, in larger text; the sheet is the Sign in page | `sign-in-state-no-business-name` |
| Worst case | A 70-character email address and a 63-character business name, with an error | Business name wraps onto two lines; the long email address in the field; the wrong-password alert | `sign-in-state-worst` |

## Layout

- **Phone (375px):** paper background, content in a column with 16px side margins and about 32px above. At the top: the business name (semibold, 20px, wraps and balances) with "Timesheets" under it in small muted text, over a thick double rule (the same rule as the paper timesheet's heading). Below, a white bordered sheet with the page title (`h1`, 24px), any message, then the form. Fields are 44px tall, full width. Buttons are full width and 44px. *Forgot your password?* and *Back to sign in* are link buttons 44px tall under the form. On Choose a new password the buttons stack with *Save password* above *Cancel*.
- **Desktop:** the same column, centred, at most about 384px wide, about 64px below the top. Sheet side padding is larger. Fields and buttons are 36px tall. On Choose a new password, *Cancel* and *Save password* sit side by side, right-aligned (Cancel left of Save).
- **No top bar.** The person is not signed in, so there is no navigation.

## Copy

| Where | Text |
|---|---|
| Header, business name | The business name from Admin (e.g. "Harbour Street Bakery"), with "Timesheets" under it |
| Header, no business name | "Timesheets" alone |
| Sign in: title | "Sign in" |
| Sign in: fields | "Email"; "Password"; password button accessible names "Show password" / "Hide password" |
| Sign in: buttons | "Sign in"; link "Forgot your password?" |
| Signed out | "You've signed out." |
| Wrong password | "That email and password don't match. Try again, or reset your password." |
| Deactivated: heading | "This account has been deactivated" |
| Deactivated: body | "You can't sign in any more. If you think that's a mistake, ask your manager." |
| Choose password: title | "Choose a new password" |
| Choose password: intro, first sign-in | "You signed in with a temporary password. Choose your own to carry on." |
| Choose password: intro, from Profile | "You'll go back to your profile afterwards." |
| Choose password: fields | "New password" with help "At least 8 characters, with letters and numbers."; "Type it again" |
| Choose password: buttons | "Save password"; "Cancel" (from Profile only) |
| Forgot: title | "Reset your password" |
| Forgot: body | "Enter your email and we'll send you a link to choose a new password." |
| Forgot: buttons | "Email me a reset link"; link "Back to sign in" |
| Reset sent: title | "Check your email" |
| Reset sent: body | "If {email} has an account, we've sent it a link to choose a new password." |
| Reset sent: note | "The link only works for a short time. Nothing there? Check your junk folder, or ask your manager to reset your password." |
| Reset sent: button | "Back to sign in" |
| Link expired: title | "This link has expired" |
| Link expired: body | "Reset links only work for a short time. Ask for a new one and use it straight away." |
| Link expired: button | "Get a new link" |

## Interactions

| Trigger | Result | Requirement |
|---|---|---|
| *Sign in* with correct details | Signs in and goes to the app (first sign-in with a temporary password goes to Choose a new password first) | FR-01 |
| *Sign in* with wrong details | Shows the wrong-password alert; the email stays filled in | FR-01 |
| Sign in as a deactivated person | Shows the deactivated alert; no session is created | FR-25 |
| Press the eye button in the password field | Shows or hides the password; label switches between "Show password" and "Hide password" | FR-01 |
| *Forgot your password?* | Opens the Forgot page | FR-01 |
| *Email me a reset link* | Keycloak sends the email; shows "Check your email" (the same message whether or not the address has an account) | FR-01 |
| Open an expired reset link | Shows "This link has expired" | FR-01 |
| *Get a new link* | Opens the Forgot page | FR-01 |
| *Back to sign in* | Opens the Sign in page | n/a |
| *Save password* | Saves the new password. First sign-in: goes to the app. From Profile: goes back to Profile, which shows the "Password changed" toast (see `profile.md`) | FR-01, C-6 |
| *Cancel* (from Profile only) | Goes back to Profile without changing the password | FR-01 |
| After *Sign out* | Opens this page with the "You've signed out." line | n/a |
| Session ended while a page was open | Dialog on that page ("You've been signed out", see `timesheet.md`); *Sign in again* opens this page; signing in brings the person back | n/a |
| Password rule | At least 8 characters, with letters and numbers; set as a Keycloak policy, so it can change later. Two-factor sign-in is not offered in M1 | C-6, C-7 |

## Components

| Part | Built from | Notes |
|---|---|---|
| Page shell | Plain `div` on the paper colour; `main` at `max-w-sm` | No `TopBar` |
| Header | Business name `p` and "Timesheets" `p` over a `border-b-4 border-double` rule | The business name is balanced text so it wraps evenly |
| Sheet | `article` on the sheet colour with a rule border | |
| Fields | `UFormField` + `UInput`, size xl, 44px tall on phone, 36px on desktop | Email: `autocomplete="username"`; Password: `current-password`; new passwords: `new-password` |
| Show/hide password | `UButton` link variant with eye / eye-off icon, inside the field's trailing slot | 44px on phone, 36px on desktop |
| Alerts | `section` with `role="alert"`; `danger` tinted border and background | Wrong password: circle-alert icon and one line; deactivated: user-x icon, `h2`, body |
| Signed-out line | `p` with `role="status"` and circle-check icon in the approved colour | |
| Buttons | `UButton` size xl: primary full width on Sign in, Forgot, Link expired; primary and outline neutral on Choose a new password | Link buttons for *Forgot your password?* and *Back to sign in* (arrow-left icon) |

## Data

These pages come from Keycloak, not the app's API. Nothing is proposed for the app's API except the business name.

| Shown | From | Format |
|---|---|---|
| Business name | **Proposed:** the Keycloak realm's display name, which the app sets when the manager saves the business name on Admin (see `admin.md`); the login theme reads it from the realm. Empty until set | Plain text, up to 80 characters |
| Email in the form after an error | The address the person typed (Keycloak) | Plain text |
| Email in "Check your email" | The address the person typed (Keycloak) | Bold, may break anywhere (`break-all`) |
| Deactivated state | Keycloak user disabled by the app when the manager deactivates the person | n/a |
| Password rule | Keycloak password policy | At least 8 characters, letters and numbers |

## Edge cases

- **Long business name:** a 63-character name ("The Original Harbour Street Bakery & Wholesale Catering Company") wraps onto two lines on phone and desktop, balanced; "Timesheets" stays beneath it. The Admin field allows 80 characters.
- **Long email address:** a 70-character address stays inside the field (it scrolls inside the input); in "Check your email" it breaks across lines.
- **No business name:** only "Timesheets", larger; used until the manager saves a name.
- **Wrong password plus long email:** the alert and the form both fit at 375px (the `worst` state).
- **Password help:** the rule is shown as help text under New password; a Keycloak validation message when the rule is broken is not designed (see Open questions).

## Accessibility

- One `h1` per page (the page title). The deactivated alert's heading is an `h2`.
- Every field has a visible label. The password show/hide button is icon-only with `aria-label` "Show password" / "Hide password".
- The wrong-password and deactivated alerts have `role="alert"` and use an icon plus words, not colour alone. The signed-out line has `role="status"`.
- `autocomplete` values let password managers fill: `username`, `current-password`, `new-password`.
- Quality floor (DESIGN.md §2): 44px targets and 16px inputs on phones, visible focus.
- Focus order follows reading order. On Choose a new password the markup puts *Cancel* before *Save password* on both sizes (phone shows Save above Cancel by reversing the column).

## Motion

None.

## Changes since approval

| Change | Why | User's OK |
|---|---|---|

## Open questions

1. **Business name from the realm display name.** Proposed here, not decided: the app sets Keycloak's realm display name when the manager saves the business name. Needs checking that the login theme can read it and what happens if the update fails.
2. **Password rule feedback.** The mock-up shows the rule as help text only. The message when a new password breaks the rule, or when "Type it again" doesn't match, is Keycloak's and isn't designed here.
3. **Where Cancel goes.** *Cancel* on Choose a new password goes to `/profile` in the mock-up; in the real app Keycloak needs a return address for "from Profile" (and the "Password changed" toast on Profile has the same unsettled trigger, see `profile.md`).
4. **Deactivated wording.** R7-5 copy was approved as written. The alert shows after a correct password only, or after any attempt? Keycloak normally tells a disabled account apart only when the password is right; confirm to avoid revealing which emails exist.
5. **Email text.** The wording of Keycloak's emails (reset link, temporary password) is not designed here.
6. **Reset sent wording.** The page says "If {email} has an account" for every address; confirm this is what Keycloak's theme shows (it avoids revealing who has an account).
7. **Sign-in after the session ended.** The timesheet dialog says signing in again brings the person back to where they were; the return address handling is not designed.
8. **Not designed:** Keycloak's own error page (for example, a broken link) and a failed page load.
