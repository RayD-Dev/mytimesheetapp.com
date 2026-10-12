# Mock-up rounds

**How to review.** In `mockup/`, run `npm run dev`. Open the board at http://localhost:5180/#/board, or on your phone at the "Network" address Vite prints (same Wi-Fi). The ☰ Mock button switches screens, states and variants.

**How to give feedback.** Refer to change IDs ("R2-3: totals too small", "revert R2-4"), pick variants ("timesheet v=b"), or describe what you see ("on the phone, Thursday's warning wraps badly").

Decisions that should outlast the mock-up move into `DESIGN.md` (decision log) as soon as they're made.

---

## Frozen · 12/10/2026
R6 is the final round. Every page and state is captured at phone and desktop width in `approved/`, the reference for the engineered front end. Any later design change needs a new round here, and the affected screenshots replaced.

---

## R6 · 12/10/2026 · Telling status groups apart (Approvals and Admin)
**Look at:**
- `v=a`: http://localhost:5180/#/approvals?v=a and http://localhost:5180/#/admin?v=a
- `v=b`: http://localhost:5180/#/approvals?v=b and http://localhost:5180/#/admin?v=b

**Question:** pick `v=a` or `v=b`.

**Feedback that started it**
- "In the 'To approve', 'Approved' & 'Rejected' sections I think these sections look the same, maybe an emoji or different colour or something to differentiate these sections, should be done for the manager as well"

**Changes**
- R6-1 Each group's heading takes its status colour and icon, plus a count. The colours and icons match the status labels used everywhere else:
  - To approve: blue, clock
  - Approved: green, tick
  - Rejected: red, return arrow

  Icons rather than emoji: emoji render differently on every device, and the colour is never the only signal.
  - `v=a` coloured heading text, icon and count, with a 2px rule in the status colour
  - `v=b` a lightly tinted band, with a coloured icon and the count on the right
- R6-2 Rows still to approve keep bold names; approved and rejected rows go to regular weight, so the remaining work stands out. The summary line ("3 to approve · …") is gone, since each heading now has its count.
- R6-3 Admin's "not approved yet" list (also a manager view) splits into "Waiting for your approval" with a *Review* link, and "Rejected, waiting for the employee", using the same headings.

**Feedback**
- "I like it" · picked `v=b` (tinted band)

**Decided → DESIGN.md**
- Status groups get a tinted heading band: the status icon in its colour, the title, and the count on the right. Remaining-work rows bold, finished rows regular weight. `v=a` retired.
- Admin (R5) approved as built, together with R6.

## R5 · 12/10/2026 · Admin (FR-04 to FR-06, FR-22 to FR-25)
**Look at:** http://localhost:5180/#/board?screen=admin, or http://localhost:5180/#/admin and try Add employee, Reset password and Deactivate.
**Questions:** R5-1 section order; R5-3 temporary passwords shown once; anything else.

**Correction affecting R1–R4:** the mock dates had the wrong weekdays (06/10/2026 is a Tuesday). Every screen now uses Monday 05/10/2026 to Friday 16/10/2026, with dates checked by code. Nothing about the designs changed.

**Changes**
- R5-1 One Admin page, in order of how often it's used: the fortnight PDF (every fortnight), then Employees (now and then), then Pay schedule (set once). On first run the pay schedule moves to the top with "Staff can't enter hours until you set this".
- R5-2 Fortnight PDF:
  - A fortnight picker, then "4 not approved yet, so not in the PDF", listing each person with "Submitted, review it →" or "Rejected, waiting for Lee" (FR-23). It notes that people with no hours aren't listed.
  - *Download PDF* shows how many approved timesheets it contains. When everything is approved: "All 5 timesheets for this fortnight are approved."
- R5-3 Employees:
  - Name, email, status, and *Reset password* and *Deactivate* (a ⋯ menu on phones). You can't deactivate yourself; deactivated people show the date.
  - *Add employee* asks for name and email, then shows a temporary password once with Copy: "You won't see this password again". *Reset password* works the same way.
  - *Deactivate* confirms: "won't be able to sign in. Their timesheets are kept" (FR-25).
- R5-4 Pay schedule:
  - Once set: "Fortnights start every second Monday, counting from 12/01/2026", locked once timesheets exist (FR-05).
  - First run: a calendar where only Mondays can be picked (FR-04), then *Save pay schedule*.
- Fixed before review: the calendar enlarged to 40px days; form inputs to 44px; employee columns aligned; "Reset password" kept on one line.

**Feedback**
- Approved together with R6: "I like it"

**Decided → DESIGN.md**
- Admin approved as built: PDF, then Employees, then Pay schedule (top on first run); temporary passwords shown once with Copy; Mondays-only calendar.

## R4 · 11/10/2026 · Approvals (FR-15 to FR-19)
**Look at:** http://localhost:5180/#/board?screen=approvals and `?screen=approvals-fortnight-timesheet`, or start at http://localhost:5180/#/approvals and click Priya.
**Questions:** R4-3 confirm before approving, or approve in one tap; R4-4 "Next to approve"; R4-5 the manager's phone menu.

**Changes**
- R4-1 Approvals list:
  - A fortnight picker and a one-line summary ("3 to approve · 1 approved · 1 rejected").
  - Groups: To approve, Approved, and "Rejected, waiting for the employee".
  - Each row shows the name (your own marked "(you)"), when it was submitted, any warnings, and the fortnight total. The whole row opens the timesheet.
  - Empty states: nothing submitted yet; and nothing to approve, with a link to the PDF on Admin.
- R4-2 One timesheet: "{name} Timesheet", the pay period and when it was submitted, then a warning summary ("1 day has a warning. Check it before you approve."). Below that, the same read-only sheet as the employee's, with warnings on their days (FR-15). It ends with **Signatures** as on the paper sheet: the employee's signature, name and confirmation time, next to the approver's empty line.
- R4-3 Approve opens a short confirmation showing your signature: "Your signature and today's date and time are added. Approved timesheets can't be changed." Reject asks for a required reason, shown to the employee at the top of their timesheet (FR-17). Afterwards you return to the list with a "Timesheet rejected" toast.
- R4-4 After approving: both signatures are filled in, plus a "Next to approve: Tom Ng" button, so you can work through the queue without going back to the list.
- R4-5 Your own timesheet: "When you approve it, it's marked Self-approved on screen and in the PDF" (FR-19). First approval without a signature: the same set-up inline (FR-20).
- R4-6 The manager's top bar on phones: the current page plus a Menu (My timesheet, Approvals, Admin, Profile, Sign out), because five links don't fit at 375px. Desktop and employees are unchanged.
- Fixed before review: menu rows enlarged to 44px (theme-wide); the "Submitted" date line spacing and its wrapping on phones.

**Feedback**
- R4-1: "mention the Current fortnight and previous in brackets in the fortnight dropdown"
- R4-3: "Can we make the approve button green"
- "I really like the rest"

**Follow-up changes (same round)**
- R4-7 Fortnight options read "06/10/2026 to 17/10/2026 (current)" and "… (previous)". The picker uses the regular font so the full label fits on a phone. My timesheet's switch now says "Current fortnight" (was "This fortnight"), so one thing keeps one name.
- R4-8 Approve, on the page and in the confirmation, uses the Approved green (#1D7148; white text 6.0:1).

**Decided → DESIGN.md**
- Approvals approved as built: grouped list, read-only sheet with Signatures, a confirmation before approving, "Next to approve" afterwards, Self-approved notice, and the manager's phone Menu.
- Approve is green (the Approved status colour); everything else primary stays accent blue.
- Fortnight vocabulary: "Current fortnight" and "Previous fortnight"; in lists, "(current)" and "(previous)".

## R3 · 11/10/2026 · Profile (FR-20, FR-21)
**Look at:** http://localhost:5180/#/board?screen=profile; compare fonts at `#/profile?state=signed&v=a`, `v=b` and `v=c`.
**Questions:** R3-2 pick the typed-signature font (a, b or c); anything else on the page.

**Changes**
- R3-1 Profile page in the same document style:
  - **Name** from the sign-in account, with "Ask your manager if it's wrong".
  - **Signature:** the current signature on its signature line, "Saved 02/10/2026", *Replace signature*, and "Timesheets you've already submitted keep the signature they were signed with" (FR-21).
  - **Password:** *Change password* goes to the sign-in page and back, so the app never handles passwords.
- R3-2 Typed-signature font, three OFL options:
  - `v=a` Mrs Saint Delafield (formal script, the placeholder from R2)
  - `v=b` Herr Von Muellerhoff (quick, realistic)
  - `v=c` La Belle Aurore (handwritten, easiest to read)
- R3-3 States:
  - Typed or drawn signature.
  - No signature: "You'll need one before your first submit".
  - Replacing: the same set-up as the submit review, with Cancel and *Save new signature*.
  - Back from changing password: a "Password changed" toast.
- R3-4 Typed signatures now shrink to fit their line instead of clipping, as the real app will when it saves the signature as an image. Applies everywhere signatures appear.
- R3-5 The top bar is shared by all screens; managers will also see Approvals and Admin.

**Feedback**
- R3-2: "I think maybe it would make sense to give the user a choice between a few signature fonts, let's just say 3 different options"
- After R3-6: "I like it" (Profile approved)

**Follow-up changes (same round)**
- R3-6 "Type it" now offers a choice of three styles, each previewing the person's name: Style 1 La Belle Aurore (default), Style 2 Herr Von Muellerhoff, Style 3 Mrs Saint Delafield. The chosen style is saved with the signature, and replacing starts on the current style. The font variants (`v=a/b/c`) are retired.
- Fixed before review: the style list caused sideways scrolling on phones (a fieldset and a grid track that wouldn't shrink); radio buttons raised to 24px.

**Decided → DESIGN.md**
- Typed signatures: the user picks one of three OFL script styles. This closes the FE doc's open question on which OFL font to use.

## R2 · 11/10/2026 · Submit review (FR-14, FR-20)
**Look at:** http://localhost:5180/#/board?screen=timesheet-review, or click Submit on http://localhost:5180/#/timesheet?state=draft and go through it.
**Questions:** R2-2 tick wording; R2-4 what happens after submitting; anything about the flow.

**Changes**
- R2-1 Submit opens "Review and submit": a full-screen step on phones, a dialog on desktop, as in the FE design. It lists only days with hours (times, break, hours), week totals, and the double-ruled fortnight total with FR-11's note. The ticks and *Submit timesheet* come after the totals.
- R2-2 Each warning day stays tinted, with its own tick: "Yes, 7:30 AM to 8:30 AM is correct". Repeating the times makes people read them.
- R2-3 Signature: shows the saved signature, the name, and "The date and time are added when you submit". On a first submit, "Set up your signature" appears inline (FR-20): Type it, with a script-font preview on a signature line, or Draw it, with finger or mouse.
- R2-4 The declaration "I confirm these hours are correct" comes last. *Submit timesheet* stays disabled until everything is done, and the hint says what's left: "To submit, confirm Thu 09/10/2026 and tick the declaration."
- R2-5 After submitting: back to the timesheet, now Submitted and read-only. A toast says "Timesheet submitted. Your manager will review it." The status label settles in briefly; this is the screen's one considered animation.
- Fixed before review: toast and dialog close buttons enlarged to 44px (theme-wide); a long typed signature kept on one line.

**Feedback**
- R2-2: "This is great"
- R2-5: "This is fine for now" · "I really like this, let's continue"

**Decided → DESIGN.md**
- The submit review is approved as built: a full-screen step on phones and a dialog on desktop. Ticks and *Submit timesheet* come after the totals; each warning day has its own "Yes, {start} to {finish} is correct" tick; the hint lists what's left.
- After submitting, return to the timesheet with a "Timesheet submitted" toast (fine for now; a confirmation page could come later).

## R1 · 11/10/2026 · My timesheet in Ledger
**Look at:** http://localhost:5180/#/board?screen=timesheet (phone: http://192.168.4.26:5180/#/board?screen=timesheet)
**Questions:** R1-2 time entry, pick `v=a` or `v=b`; R1-3 collapsed empty days on phones; R1-1 title and Sign out placement.

**Changes**
- R1-1 Document header like the paper sheet: title "Employee Timesheet", Employee and Pay period, a status label with icon (Draft, Rejected, Submitted, Approved) and the save status; a Previous/This fortnight switch; "Kept until 01/11/2026 if not submitted" on drafts. Top bar: My timesheet, Profile, Sign out.
- R1-2 Time entry, two variants:
  - `v=a` Nuxt UI's segmented time field, enlarged. Its segments are still 40×36px on phones, and AM/PM can only be changed by typing "a" or "p", which a numeric keypad doesn't have.
  - `v=b` typed time ("730", "7:30" or 24-hour "17:30") plus a large AM/PM switch. Passes every touch-target check, and makes AM/PM an explicit choice, the FR-27 mistake.
- R1-3 Desktop: the paper sheet's table (Date, Start time, Rest break (mins), Finish time, Total hours), same columns in both weeks. Phone: one ruled block per day; empty days collapse to "Add hours"; future days say "Hours can't be added for future days".
- R1-4 FR-27 warnings tint the day's row, with an icon and "This shift is 1h 00m. Is AM/PM correct?". FR-09 problems ("Finish time must be after start time") appear inline in red.
- R1-5 Week totals get a single rule; the fortnight total is 32px, double-ruled, with FR-11's note underneath.
- R1-6 States:
  - Rejected: the manager's reason comes first.
  - Submitted and Approved: read-only, with the submitted and approved details in the header.
  - No pay schedule: FR-06 message.
  - No hours: Submit disabled with "Add hours to at least one day to submit".
  - Clear: asks for confirmation, and for rejected timesheets mentions the 3-month deletion.

**Feedback**
- R1-3: "I like this, keep this" (collapsed empty days on phones)
- R1-2: "I like `v=a`"
- R1-1: "Maybe {Employee Name} Timesheet is better?" · "Sign-out button is good" · "I'm happy with this"

**Decided → DESIGN.md**
- Time entry is Nuxt UI's segmented field (`UInputTime`), with segments enlarged to 44px on phones. Variant b retired.
- Phones: empty days collapse behind "Add hours".
- Heading is "{name} Timesheet"; the Employee row is dropped as redundant. The PDF keeps "Employee Timesheet" (FR-22).
- Sign out stays in the top bar.

<!-- Newest round first. Template:

## R<n> · <date> · <goal of the round>
**Look at:** #/board?screen=<slug> · questions: <what to decide>
**Changes**
- R<n>-1 <screen/state>: <change>
**Feedback** (user's words, trimmed)
- …
**Decided → DESIGN.md**
- …
-->
