# Approved screens

Frozen on 12/10/2026 after mock-up rounds R1–R6, extended on 18/10/2026 by R7 (the M1 screens and states not drawn before) and R8 (business logo and error messages; `../ROUNDS.md`). These screenshots are the visual reference for the engineered front end: the real app should look like this, page for page and state for state. Differences are either bugs or deliberate changes recorded in `DESIGN.md`.

Every image exists at phone (`@375x812`) and desktop (`@1280x800`) width. Full-page captures show whole pages; `--` names are viewport captures of dialogs, toasts and scrolled positions. Mock dates: Monday 05/10/2026 to Friday 16/10/2026.

| Page (route) | Full-page states | Dialogs, toasts and scrolled views |
|---|---|---|
| Sign-in pages (Keycloak theme, mock-up `#/sign-in`) | `sign-in-state-` sign-in, wrong-password, signed-out, deactivated, first-sign-in, change-password, forgot, reset-sent, link-expired, no-business-name, logo, password-error, forgot-error, worst | — |
| My timesheet (`/timesheet`) | `timesheet-state-` draft, empty, rejected, submitted, approved, full, no-schedule, not-saved, conflict, day-error, loading, load-failed | `timesheet--after-submit`, `timesheet--session-ended` |
| Submit review (`/timesheet/review`) | — | `timesheet-review--` ready-top, ready-bottom, ticked-bottom, no-warnings-top, no-signature-type, no-signature-draw, submit-failed |
| Profile (`/profile`) | `profile-state-` signed, drawn, no-signature, replacing, signature-error, loading, load-failed | `profile--password-changed` |
| Approvals (`/approvals`) | `approvals-state-` waiting, all-done, none, loading, load-failed | `approvals--after-reject`, `approvals--manager-menu` (phone only) |
| One timesheet (`/approvals/:fortnight/:timesheet`) | `approvals-2026-10-05-priya-state-` submitted, approved, first-approval, own, loading, load-failed; `approvals-2026-10-05-lee-state-rejected` | `approve--` confirm, reject-reason, approved-signatures, reject-error, approve-failed |
| Not found, no access (catch-all route; mock-up `#/not-found`) | `not-found-state-` not-found, no-access | — |
| Admin (`/admin`) | `admin-state-` pdf-some, pdf-all, setup, business-name, logo, logo-too-big, pdf-failed, loading, load-failed | `admin--` calendar, add-employee, employee-added, deactivate, reset-password, add-employee-error |

## Comparing the engineered app

The real app's routes match these (`DESIGN.md` decision log), so capture it the same way with the ui-visual-check skill and compare image by image:

```bash
node .claude/skills/ui-visual-check/scripts/snap.mjs --url http://localhost:5173/ --routes "/timesheet,/approvals,/admin,/profile" --out .ui-snapshots
```

The `?state=` values exist only in the mock-up. In the real app, reach each state through real data (test users and seeded timesheets).

Don't edit these images. If a design changes after this freeze, run a new mock-up round and replace the affected files, noting it in `ROUNDS.md`.
