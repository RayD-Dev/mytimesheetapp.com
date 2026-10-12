# Approved screens

Frozen on 12/10/2026, after mock-up rounds R1–R6 (`../ROUNDS.md`). These screenshots are the visual reference for the engineered front end: the real app should look like this, page for page and state for state. Differences are either bugs or deliberate changes recorded in `DESIGN.md`.

Every image exists at phone (`@375x812`) and desktop (`@1280x800`) width. Full-page captures show whole pages; `--` names are viewport captures of dialogs, toasts and scrolled positions. Mock dates: Monday 05/10/2026 to Friday 16/10/2026.

| Page (route) | Full-page states | Dialogs, toasts and scrolled views |
|---|---|---|
| My timesheet (`/timesheet`) | `timesheet-state-` draft, empty, rejected, submitted, approved, full, no-schedule | `timesheet--after-submit` |
| Submit review (`/timesheet/review`) | — | `timesheet-review--` ready-top, ready-bottom, ticked-bottom, no-warnings-top, no-signature-type, no-signature-draw |
| Profile (`/profile`) | `profile-state-` signed, drawn, no-signature, replacing | `profile--password-changed` |
| Approvals (`/approvals`) | `approvals-state-` waiting, all-done, none | `approvals--after-reject`, `approvals--manager-menu` (phone only) |
| One timesheet (`/approvals/:fortnight/:timesheet`) | `approvals-2026-10-05-priya-state-` submitted, approved, first-approval, own; `approvals-2026-10-05-lee-state-rejected` | `approve--` confirm, reject-reason, approved-signatures |
| Admin (`/admin`) | `admin-state-` pdf-some, pdf-all, setup | `admin--` calendar, add-employee, employee-added, deactivate, reset-password |

## Comparing the engineered app

The real app's routes match these (`DESIGN.md` decision log), so capture it the same way with the ui-visual-check skill and compare image by image:

```bash
node .claude/skills/ui-visual-check/scripts/snap.mjs --url http://localhost:5173/ --routes "/timesheet,/approvals,/admin,/profile" --out .ui-snapshots
```

The `?state=` values exist only in the mock-up. In the real app, reach each state through real data (test users and seeded timesheets).

Don't edit these images. If a design changes after this freeze, run a new mock-up round and replace the affected files, noting it in `ROUNDS.md`.
