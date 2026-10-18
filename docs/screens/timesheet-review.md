# Submit review (`/timesheet/review`)

**Who:** Employees and managers submitting their own timesheet
**Requirements:** FR-11, FR-14, FR-20, FR-27
**Approved:** round R2 on 11/10/2026, with R8 on 18/10/2026 for the submit-failed state and the corrected no-warnings state
**Screenshots:** `mockup/approved/timesheet-review--*`
**Mock-up page:** `mockup/src/pages/timesheet/review.vue`

Check every day with hours, confirm any warning days, see or set up the signature, tick the declaration, then Submit timesheet.

In the real app this is a full-screen step on phones and a dialog on desktop, opened from Submit on My timesheet (DESIGN.md sections 5 and 7). It has its own route in the mock-up so it can be reviewed; the mock-up renders it over a dimmed copy of My timesheet.

## States

Screenshot names omit the `@375x812` / `@1280x800` suffix; every name exists at both sizes.

| State | When | What's shown | Screenshots |
|---|---|---|---|
| Ready, top | Opened from Submit; one warning day (Thu 08/10/2026, 1h 00m), nothing ticked | Title, pay period, intro, Week 1 with the tinted warning day and its unticked "Yes…" tick, week totals, start of Fortnight total | `timesheet-review--ready-top` |
| Ready, bottom | Same, scrolled to the end | Week 2, Fortnight total and note, "Your signature" with the saved typed signature, unticked declaration, disabled Submit timesheet, hint "To submit, confirm Thu 08/10/2026 and tick the declaration." | `timesheet-review--ready-bottom` |
| Ticked | Warning day and declaration both ticked | Declaration ticked, Submit timesheet enabled, no hint | `timesheet-review--ticked-bottom` |
| Submit failed (R8-4) | Mock `submit-failed`: everything ticked, *Submit timesheet* pressed, and the server or connection failed | As Ticked, plus a red inline message above the button: "Your timesheet wasn't submitted. Check your connection and try again. Your hours are saved." and a toast "Timesheet not submitted"; *Submit timesheet* stays enabled, so pressing it again retries | `timesheet-review--submit-failed` |
| No warnings | No day has a warning; only the declaration is needed | Week 1 with no tinted days and no day ticks. Thursday is 7:30 AM to 4:30 PM with a 30 min break (8h 30m), so nothing warns (fixed in R8-3; the screenshot was replaced) | `timesheet-review--no-warnings-top` |
| No signature, type | First submit; no saved signature; "Type it" selected | "Set up your signature" with Type it / Draw it, name field, three style options, "Use this signature"; Submit timesheet disabled, hint lists the signature first | `timesheet-review--no-signature-type` |
| No signature, draw | Same, "Draw it" selected | Drawing area on a signature line, "Clear drawing" (disabled until something is drawn), "Use this signature" (enabled; it checks on press) | `timesheet-review--no-signature-draw` |
| Week with no hours | A week has no day with hours | Under the week heading: "No hours this week" (mock-up source only; not screenshotted) | none |

## Layout

- **Phone (375px):**
  - Full-screen step with a header: title "Review and submit", the pay period beneath it in mono, and a close button (X) at the top right. The header stays fixed while the body scrolls.
  - Body, in order: intro line; Week 1 (rule, days with hours only, week total); Week 2 (same); Fortnight total (double-ruled) with the note; signature section; a rule; declaration; Submit timesheet (full width); hint; "Back to timesheet" ghost button underneath.
  - Each day: weekday and date with day hours on the right; times and break on one mono line below. Warning days run edge to edge with a caution tint, the warning line and the tick.
- **Desktop:**
  - A centred dialog about 672px wide (`sm:max-w-2xl`) over the dimmed My timesheet; header and body as on phone; the body scrolls inside the dialog.
  - The final row puts "Back to timesheet" on the left and Submit timesheet on the right, with the hint right-aligned under the button.

## Copy

| Where | Text |
|---|---|
| Title | "Review and submit" |
| Subtitle | "Pay period 05/10/2026 to 16/10/2026" |
| Intro | "Check each day before you submit. You can't change a timesheet once it's submitted." |
| Week headings | "Week 1", "Week 2" |
| Day lines | "Mon 05/10/2026" + "8h 30m (8.50)"; "7:30 AM to 4:30 PM, 30 min break" |
| Warning | "This shift is 1h 00m. Is AM/PM correct?" |
| Warning-day tick | "Yes, 7:30 AM to 8:30 AM is correct" (`Yes, {start} to {finish} is correct`) |
| Week totals | "Week 1 total", "Week 2 total" |
| Empty week | "No hours this week" |
| Fortnight total | "Fortnight total" |
| Totals note | "Totals are calculated from exact times and may differ slightly from the sum of the rounded daily figures." |
| Signature heading (saved) | "Your signature" |
| Signature caption | "{name}. The date and time are added when you submit." (e.g. "Priya Ramaswamy-Kingsley. The date and time are added when you submit.") |
| Signature heading (none) | "Set up your signature" |
| Signature intro (none) | "You need a signature before your first submit. It's saved to your profile and added to each timesheet you submit." |
| Set-up mode switch (group label "How to make your signature") | "Type it", "Draw it" |
| Type mode | Label "Your name as you sign it"; legend "Choose a style"; options "Style 1", "Style 2", "Style 3" (accessible names), each previewing the name |
| Draw mode | "Sign with your finger or mouse."; canvas label "Signature drawing area"; "Clear drawing" |
| Set-up button | "Use this signature" |
| Drawn signature alt text | "Your signature" |
| Declaration | "I confirm these hours are correct" |
| Primary action | "Submit timesheet" |
| Signature errors (R8-4) | Type mode, name blank: "Type your name as you sign it."; draw mode, nothing drawn: "Draw your signature in the box." |
| Submit failed (R8-4) | Inline: "Your timesheet wasn't submitted. Check your connection and try again. Your hours are saved."; toast title "Timesheet not submitted", description "Check your connection and try again." |
| Hint | "To submit, {list}." where list items are "set up your signature", "confirm Thu 08/10/2026" (one per unticked warning day), "tick the declaration", joined with ", " and a final " and ". Examples: "To submit, confirm Thu 08/10/2026 and tick the declaration."; "To submit, set up your signature, confirm Thu 08/10/2026 and tick the declaration." |
| Secondary action | "Back to timesheet" |

Hours format: `8h 30m (8.50)`. Times: `7:30 AM`. Dates: `05/10/2026`.

## Interactions

| Trigger | Result | Requirement |
|---|---|---|
| Open from "Submit" on My timesheet | Review opens listing only days with start and finish | FR-14 |
| Tick a "Yes, {start} to {finish} is correct" box | Removes that day from the hint list | FR-14, FR-27 |
| Tick "I confirm these hours are correct" | Removes "tick the declaration" from the hint | FR-14 |
| All items done (signature present, every warning day ticked, declaration ticked) | Submit timesheet enabled and the hint disappears | FR-14 |
| Press "Submit timesheet" | Returns to My timesheet, now Submitted and read-only, with the toast "Timesheet submitted" / "Your manager will review it." | FR-14 |
| Press "Submit timesheet" and it fails | Stays on the review with the inline message above the button and the toast "Timesheet not submitted"; ticks are kept; nothing is submitted. The submit review keeps its approved disabled button and hint for what is still missing; it does not use the check-on-press pattern | FR-14, R8-4 |
| Errors (app-wide rule, R8-4) | Form errors on button press: the field turns red with a message under it, focus moves to the first bad field, and a toast says what didn't happen. Failed actions: an inline message by the button plus a toast, never a toast alone. Live typing errors: red field and message, no toast. Keycloak pages: red field plus the alert box, no toasts | R8-4 |
| Press "Back to timesheet", close (X) or dismiss the dialog | Returns to My timesheet as an editable draft; ticks are not kept | FR-14 |
| Switch "Type it" / "Draw it" | Shows that set-up mode | FR-20 |
| Edit the name field | All three style previews update; the error message goes as soon as the field is edited | FR-20 |
| "Use this signature" with a blank name, or nothing drawn | Nothing is saved; the field shows its message and has `aria-invalid`, and focus moves to it. The button stays enabled and checks on press. The component also emits `invalid`; this screen does not use it, so there is no toast here (see Open questions) | FR-20, R8-4 |
| Pick a style | Selected option gets a dark border and a paper fill | FR-20 |
| Draw on the canvas (finger or mouse) | Enables "Clear drawing" and removes any "Draw your signature in the box." message | FR-20 |
| "Clear drawing" | Wipes the canvas; "Clear drawing" is disabled again | FR-20 |
| "Use this signature" | Replaces the set-up with "Your signature" showing the result; "set up your signature" leaves the hint | FR-20 |

## Components

| Part | Built from | Notes |
|---|---|---|
| Review container | `UModal`, `fullscreen` on phones (width under 768px), dialog on wider screens | Title and description in the modal header; built-in close button, enlarged to 44px |
| Warning day | Tinted row + triangle-alert icon + `caution` text | Edge to edge inside the modal body |
| Day ticks and declaration | `UCheckbox`, 24px box | Declaration label is semibold |
| Fortnight total | Mono 24px, double bottom rule | Same signature element as My timesheet |
| Typed signature | `SignatureText` | Script font on a signature line, 32px shrinking to 20px to fit |
| Drawn signature | Image, max 320px wide, 80px tall, rule beneath | |
| Signature set-up | `SignatureSetup` part | `UFieldGroup` toggle, `UInput`, radio list of three styles (24px radios), canvas 160px tall |
| Submit timesheet | `UButton` size xl, 44px | Full width on phone |
| Submit failed message | `section` with `role="alert"`, `danger` tinted border and background, circle-alert icon | Above *Submit timesheet*, in the same column |
| Back to timesheet | `UButton` ghost, neutral | |

## Data

All API field names are proposed; the OpenAPI spec doesn't exist yet.

| Shown | From the API | Format |
|---|---|---|
| Pay period | Proposed `fortnight.start`, `fortnight.end` | `05/10/2026 to 16/10/2026` |
| Days with hours | Proposed `days[]` with start and finish present | `Mon` + `05/10/2026`; `7:30 AM to 4:30 PM, 30 min break` |
| Day hours | Proposed `days[].workedMinutes` | `8h 30m (8.50)` |
| Day warning | Proposed `days[].warning` (FR-27, server-calculated) | "This shift is {hm}. Is AM/PM correct?" |
| Week and fortnight totals | Proposed `weekTotals[]`, `fortnightTotal` | `25h 45m (25.75)` |
| Saved signature | Proposed `signature` from the profile (typed text and style, or an image) | Typed script or image |
| Employee name | Proposed `employee.name` | Plain text under the signature |
| Submit | Proposed submit action on the timesheet; server applies signature, name, date and time | Date and time added on submit (not shown here) |

## Edge cases

- **Long name:** the signature shrinks from 32px to 20px to stay on one line; the style previews do the same.
- **Several warning days:** each has its own tick; the hint lists each as "confirm {weekday} {date}".
- **Everything missing:** hint reads "To submit, set up your signature, confirm … and tick the declaration."
- **No hours in a week:** "No hours this week" (source only).
- **Long shift:** a day over 12 hours also shows the warning (for example 7:30 AM to 8:30 PM, 13h 00m).
- **Large totals:** week and fortnight totals such as `76h 30m (76.50)` use the same formatter as My timesheet. The review has no worst-case screenshot.

## Accessibility

- The modal has a title and description (pay period); the My timesheet page behind it is `aria-hidden` in the mock-up.
- Day and totals headings are `h3`s, so the modal title is the top-level heading; the signature section also uses an `h3`.
- Each warning-day tick has its own full-sentence label, so it can't be mistaken for another day's.
- The hint says what is left but has no live-region markup in the mock-up source.
- Errors (R8-4): the submit-failed message is `role="alert"`, so it is announced; the error toast is announced too. In signature set-up an invalid field has `aria-invalid="true"` and its message attached, and focus moves to it on a press. Each uses an icon and words, not colour alone.
- Style radios have accessible names "Style 1" to "Style 3"; the drawing canvas is labelled "Signature drawing area". Drawing needs a pointer; the typed alternative is the keyboard route.
- Quality floor: 24px checkboxes and radios, 44px buttons.
- Focus on open, focus return on close and trapping are Nuxt UI modal defaults and aren't shown in the screenshots.

## Motion

None on this screen beyond the modal's built-in open and close. The status settle after submitting belongs to My timesheet.

## Changes since approval

| Change | Why | User's OK |
|---|---|---|

## Open questions

1. **Warning for long shifts.** The text "Is AM/PM correct?" is shown for a 13h 00m shift; FR-27 only gives the 1-hour example.
2. **What happens to ticks when going back.** The mock-up returns to a draft and the ticks reset on re-opening; confirm this is intended.
3. **Drawn signature size.** The mock-up stores a data URL; the real format and size are undecided (FE design says the real app renders an image of fixed width).
4. **Other submit problems.** A failed submit is designed (R8-4). Not designed: the timesheet changed on another device or was rejected by the server, a slow submit, and a double-press.
5. **Empty week.** "No hours this week" exists in the source but isn't screenshotted; Submit can be reached with all hours in one week.
6. **Close button and Escape.** The mock-up treats closing the dialog like "Back to timesheet"; there's no confirmation when ticks are lost.
7. **Real route.** DESIGN.md says the review is a full-screen step in the real app that has its own URL only in the mock-up, but this spec's route is `/timesheet/review`; confirm whether the real app uses a route or in-page state.
8. **Hint announcement.** Should the hint be a live region so screen-reader users hear what's left as they tick?
9. ~~Signature errors and the toast.~~ Resolved: the submit review and the first-approval set-up also show the "Signature not saved" toast when `SignatureSetup` emits `invalid`, matching the app-wide rule.
