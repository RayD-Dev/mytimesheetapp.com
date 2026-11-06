# Profile (`/profile`)

**Who:** Everyone (employees and the manager)
**Requirements:** FR-01, FR-20, FR-21, FR-26
**Approved:** round R3 on 11/10/2026, with R7 on 18/10/2026 for the loading and load-failed states, and R8 on 18/10/2026 for the signature error
**Screenshots:** `mockup/approved/profile-*`
**Mock-up page:** `mockup/src/pages/profile/index.vue`

Shows the signed-in person's name, lets them set up or replace the signature used on timesheets, and sends them to the sign-in page to change their password.

## States

| State | When | What's shown | Screenshots |
|---|---|---|---|
| Typed signature | Signature exists, typed | Name; signature in the chosen style on its signature line; "Saved {date}"; *Replace signature*; FR-21 note; Password section | `profile-state-signed` |
| Drawn signature | Signature exists, drawn | Same as above, with the drawn image (alt "Your signature") left-aligned on the line | `profile-state-drawn` |
| No signature | Never set up | Info line "You don't have a signature yet. You'll need one before your first submit."; signature set-up open, action *Save signature*, no Cancel | `profile-state-no-signature` |
| Signature error (R8-4) | *Save signature* pressed with no name typed (mock `signature-error`: no signature yet, "Type it" with the name field empty) | As No signature; the name field is red with "Type your name as you sign it." under it, and a toast "Signature not saved" with "Fix the highlighted field."; focus on the field. Drawing with nothing drawn shows "Draw your signature in the box." under the canvas | `profile-state-signature-error` |
| Replacing | *Replace signature* pressed | Signature set-up open in place of the current signature, on the current style if typed; action *Save new signature*, with *Cancel* | `profile-state-replacing` |
| Password changed | Back from the sign-in page after changing password | Page as in "Typed signature", plus a success toast "Password changed" | `profile--password-changed` |
| Signature saved (toast only) | After *Save signature* or *Save new signature* | Page returns to the signature display; toast "Signature saved" (first time) or "Signature replaced"; saved date updates | none (source only) |
| Loading (R7-7) | Data takes longer than about 300 ms | Top bar, then the title "Profile" and ruled placeholder lines instead of the signature and the password (shared `LoadState` part); the sheet and title show at once and the lines only after about 300 ms, so fast loads do not flash | `profile-state-loading` |
| Load failed (R7-7) | The page's data couldn't be fetched | Top bar, the title "Profile", then "Couldn't load your profile" with the explanation and *Try again* (shared `LoadState` part) | `profile-state-load-failed` |

## Layout

- **Phone (375px):** one white sheet, full width. Order: title, Name row with its note, rule, Signature section, rule, Password section. All buttons are 44px high and sit under their text (no side-by-side except *Save new signature* and *Cancel*). Style options stack one per row. The toast sits at the bottom.
- **Desktop:** the same single column in a centred sheet (max 3xl, bordered, on the paper background), top bar above. Buttons are 36px high. The signature line and set-up fields are capped at a narrow width (about 384px), so they don't stretch.
- The top bar is shared: employees see My timesheet, Profile, Sign out; managers also see Approvals and Admin (Menu on phones). The approved screenshots show the employee bar only.
- **Loading and load failed (R7-7):** the top bar stays; the sheet (same width as this page's sheet) shows only the title "Profile", then either ruled placeholder lines (a short line, then five ruled rows with a long and a short placeholder) or a ruled block with the failure heading, one line of text and *Try again* (44px on phone, 36px on desktop). Nothing else from the page is shown.

## Copy

| Where | Text |
|---|---|
| Page title | "Profile" |
| Name label | "Name" |
| Name note | "Your name comes from your sign-in account. Ask your manager if it's wrong." |
| Signature heading | "Signature" |
| Signature intro | "Added to each timesheet you submit, as on the paper sheet." |
| Signature caption | "Saved {DD/MM/YYYY}" |
| Replace button | "Replace signature" |
| Replace note (FR-21) | "Timesheets you've already submitted keep the signature they were signed with." |
| No-signature notice | "You don't have a signature yet. You'll need one before your first submit." |
| Set-up mode switch | "Type it" / "Draw it" (group label "How to make your signature") |
| Type: field label | "Your name as you sign it" |
| Type: style legend | "Choose a style" |
| Type: style options | "Style 1", "Style 2", "Style 3" (radio labels; each row previews the typed name) |
| Draw: hint | "Sign with your finger or mouse." |
| Draw: canvas label | "Signature drawing area" |
| Draw: clear | "Clear drawing" |
| Set-up actions | "Save signature" (first time), "Save new signature" (replacing), "Cancel" (replacing only). Default label when the component is reused elsewhere: "Use this signature" |
| Password heading | "Password" |
| Password text | "You'll change it on the sign-in page, then come back here." |
| Password button | "Change password" (trailing arrow icon) |
| Toast, first save | "Signature saved" |
| Toast, replace | "Signature replaced" |
| Toast, password | Title "Password changed"; description "Use your new password next time you sign in." |
| Signature errors (R8-4) | Type mode, name blank: "Type your name as you sign it."; draw mode, nothing drawn: "Draw your signature in the box." |
| Toast, signature error (R8-4) | Title "Signature not saved"; description "Fix the highlighted field." |
| Loading (R7-7) | Title "Profile"; screen-reader text "Loading your profile…" |
| Load failed (R7-7) | Heading "Couldn't load your profile"; "Check your internet connection, then try again."; button "Try again" |

## Interactions

| Trigger | Result | Requirement |
|---|---|---|
| Open page with a signature | Shows it with saved date and *Replace signature* | FR-20 |
| Open page with no signature | Set-up opens at once with the notice | FR-20 |
| *Replace signature* | Swaps the display for the set-up; starts on "Type it", name pre-filled, current style pre-selected if the signature is typed | FR-20 |
| *Cancel* | Back to the current signature, nothing changed | FR-20 |
| "Type it" / "Draw it" | Switches the set-up mode; switching to "Draw it" gives a blank canvas | FR-20 |
| Edit typed name | Every style row previews the edited name; text shrinks to fit its line (32px down to 20px) | FR-20 |
| Pick a style | Selects it (default Style 1); saved with the signature | FR-20 |
| Draw on canvas | Pointer, touch or mouse strokes; "Clear drawing" enables once something is drawn | FR-20 |
| Save action | Always enabled; checks on press. With a typed name or something drawn: saves, leaves set-up, shows toast, updates "Saved" date. Earlier submitted timesheets keep their old signature | FR-20, FR-21 |
| Save action with a blank name (type) or nothing drawn (draw) | Nothing is saved; the field shows its message and has `aria-invalid`, focus moves to it, and the toast "Signature not saved" appears. Typing in the field removes the message; drawing removes the other one | FR-20, R8-4 |
| Errors (app-wide rule, R8-4) | Form errors on button press: the field turns red with a message under it, focus moves to the first bad field, and a toast says what didn't happen. Failed actions: an inline message by the button plus a toast, never a toast alone. Live typing errors: red field and message, no toast. Keycloak pages: red field plus the alert box, no toasts | R8-4 |
| *Change password* | Goes to the sign-in (Keycloak) page and returns here; the app never handles a password. On return, shows the "Password changed" toast | FR-01 |
| Data slow to load | The sheet and title show at once. After about 300 ms the placeholder lines appear under the title | R7-7 |
| Load fails | Load-failed view; *Try again* repeats the request (mock: button does nothing) | R7-7 |

## Components

| Part | Built from | Notes |
|---|---|---|
| Page shell | `TopBar` (`current="profile"`), centred sheet | Top bar shared by all screens (R3-5) |
| Name row | Definition list (`dl`) | Read-only; no edit control |
| Signature display, typed | `SignatureText` | See below |
| Signature display, drawn | `img` (320x80 style area, `object-contain`, bottom rule) | `alt="Your signature"` |
| Signature set-up | `SignatureSetup` | Shared component, described in full below |
| Buttons | Nuxt UI `UButton`, neutral outline, `size="xl"`, `h-11` on phone, `md:h-9` on desktop | |
| Toasts | Nuxt UI `useToast`, success colour with circle-check icon | |

### Signature set-up (shared component)

Reused by this page, by the submit review (first submit, FR-14/FR-20) and by the one-timesheet approval screen (manager's first approval). Behaviour is the same everywhere; only the props differ.

| Aspect | Detail |
|---|---|
| Props | `name` (default text, the person's name); `actionLabel` (default "Use this signature"; Profile passes "Save signature" or "Save new signature"); `cancellable` (shows *Cancel*; Profile sets it only when replacing); `initialStyle` (style to start on); `showError` (mock-up only: opens in the error state, for the `signature-error` screenshot) |
| Events | `done` with the signature; `cancel`; `invalid` (R8-4: the action was pressed with a blank name or nothing drawn; the parent decides whether to toast. Profile does) |
| Mode switch | Segmented pair "Type it" (default) and "Draw it"; selected one is solid, the other outline; each 44px high on phone |
| Type mode | Text input "Your name as you sign it", pre-filled with the name, editable; fieldset "Choose a style" with three radio rows (24px radios, rows at least 56px high, whole row clickable). Each row previews the current text in its script font without a signature line. The selected row has an ink border on a paper tint. |
| Draw mode | Hint, 160px-high canvas (full width, control-border outline, ink stroke 2.5px, round caps) with a faint baseline rule across it, then "Clear drawing" as a link-style button. Output is an image. |
| Actions | Primary-position button (neutral outline) with the action label, always enabled and validating on press (R8-4); optional ghost *Cancel*. They wrap on a narrow screen. |
| Validation (R8-4) | Type mode: a blank name gives "Type your name as you sign it." under the field (red, `aria-invalid`), cleared when the person types. Draw mode: nothing drawn gives "Draw your signature in the box." under the canvas, cleared when the person draws; the canvas has `aria-invalid` and can take focus. On failure the component emits `invalid` and moves focus to the first invalid element. |
| Result | Typed: `{ text, style }`. Drawn: image. The style is saved with a typed signature so the same look is reused when replacing. |

Typed styles (from `mockup/src/signature.ts`), all SIL OFL and self-hosted:

| Label | Font | Default |
|---|---|---|
| Style 1 | La Belle Aurore | yes |
| Style 2 | Herr Von Muellerhoff | |
| Style 3 | Mrs Saint Delafield | |
| Loading / failed | `LoadState` part (shared by every page), `title` "Profile", `what` "your profile" | `USkeleton` placeholders; failed uses a cloud-off icon in `danger` and `UButton` with rotate-cw icon. See `timesheet.md` for the full description |

`SignatureText` draws a typed signature on its signature line (bottom rule in ink, max width about 384px, single line, no wrapping). Font size starts at 32px and shrinks to a floor of 20px until the text fits; it refits on resize, on text change and when fonts finish loading. The real app renders the signature to an image of fixed width (FR-20), so the same fit rule applies when saving.

## Data

All API fields are proposed (no OpenAPI spec yet). The app never sees or stores a password.

| Shown | From the API | Format |
|---|---|---|
| Name | Signed-in user's display name (from the sign-in account, proposed `user.name`) | As given; read-only |
| Signature image | Current signature image (proposed `signature.imageUrl`) | Image on a signature line |
| Signature kind and style | Proposed `signature.kind` ("typed" or "drawn") and `signature.style` ("Style 1" to "Style 3", typed only); typed text proposed `signature.text` | Used to start the replace flow on the same style |
| "Saved" date | Proposed `signature.savedAt` | DD/MM/YYYY |
| Has a signature | Whether `signature` exists | Switches between display and set-up |
| Save signature | Proposed upload of image, plus text and style when typed | Image and metadata |
| Password change | No API call from the app: redirect to Keycloak's change-password action and back | Not applicable |

## Edge cases

- **Long name:** "Priya Ramaswamy-Kingsley" (the mock-up name) fits on one line on a phone; typed signatures shrink to fit (down to 20px) and never wrap or clip.
- **No signature:** the set-up is open straight away with no *Cancel*, because there is nothing to go back to.
- **Replacing a drawn signature:** starts on "Type it" with the default style (no typed style to restore).
- **Typed name emptied:** style previews are blank; pressing the save action shows "Type your name as you sign it." (R8-4).
- **Drawn, nothing drawn yet:** "Clear drawing" is disabled; pressing the save action shows "Draw your signature in the box." (R8-4).
- **Phone toast over content:** the "Password changed" toast covers the bottom of the page (see screenshot); it is dismissible.

## Accessibility

- One `h1` "Profile"; `h2` for Signature and Password.
- Mode switch is a labelled group ("How to make your signature"). Style choices are a fieldset with the legend "Choose a style" and native radios, each with an `aria-label` of its label ("Style 1" and so on); arrow keys move between them.
- The signature image has `alt="Your signature"`; the drawing canvas has `aria-label="Signature drawing area"`. A canvas cannot be used with a keyboard, so "Type it" is the keyboard route.
- Toasts must be announced politely (status role) and not take focus.
- Errors (R8-4): an invalid name field has `aria-invalid="true"` with its message attached; the empty canvas is `aria-invalid` and focusable for that case, with its message under it. Focus moves to the first invalid element on a press. The error toast "Signature not saved" is announced. Each uses an icon and words, not colour alone.
- Buttons and radios meet the 44px phone target; visible focus ring in the accent colour.
- Active top-bar link has `aria-current="page"`.
- Loading view: `aria-busy="true"` on the sheet, `role="status"` with screen-reader-only text "Loading your profile…"; the placeholders are decorative. Load-failed view: `role="alert"`, so the failure is announced. The `h1` stays in both.

## Motion

None beyond Nuxt UI's defaults for the toast (slide in, progress bar, dismiss).

## Changes since approval

| Change | Why | User's OK |
|---|---|---|

## Open questions

1. **What the API stores.** The FE design (section 6.4) says both typed and drawn signatures produce a PNG that is uploaded; R3-6 says the chosen style is saved with a typed signature. Needs a decision: image only, or image plus text and style (and which wins if they disagree).
2. **"Saved" date source.** The mock-up hard-codes 02/10/2026 and, after saving, 16/10/2026. Real data should come from the server's save time.
3. **How the "Password changed" toast is triggered.** The mock-up uses a state flag. The real trigger (return parameter from Keycloak, or something else) isn't settled.
4. **Errors not designed:** failed upload or save (by the app-wide rule: an inline message by the button plus a toast), and returning from the sign-in page without changing the password. Blank-signature errors are designed (R8-4). (Loading and a failed load are in R7; an expired session shows the dialog described in `timesheet.md`, assumed to work the same here.)
5. **Leaving the set-up with unsaved input** (navigating away mid-draw or mid-edit): no warning is designed.
6. **Manager view of this page** isn't in the screenshots (Approvals and Admin links in the top bar). The page body is assumed identical.
7. **FR-26:** the signature change is logged server-side; no UI implication, noted for completeness.
