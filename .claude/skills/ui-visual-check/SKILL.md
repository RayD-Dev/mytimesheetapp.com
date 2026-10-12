---
name: ui-visual-check
description: Look at the UI instead of guessing. Captures screenshots at phone (375px) and desktop widths with Playwright, runs layout checks (sideways scroll, clipped text, small tap targets, inputs that make iOS zoom, low contrast, overlapping controls, console errors, fonts not loading), then reads the images and fixes problems before reporting back. Use this after any visible UI change, before telling the user UI work is done, when the user reports a layout or mobile bug, when comparing a built screen against a mock-up, or whenever you'd otherwise be guessing how a screen renders.
---

# UI visual check

Writing UI code without looking at it is how overlapping labels, sideways scrolling on phones and unreadable grey text reach the user. This skill closes the loop: render, measure, look, fix, then report.

## 1. Get the app running

- Find the dev URL. For Vite it's usually `http://localhost:5173/`; check `package.json` scripts and the dev server output. The mock-up sandbox (ui-mockup) runs on its own port.
- If it isn't running, start it in the background (e.g. `npm run dev`). Wait until `curl -s -o /dev/null -w "%{http_code}" <url>` returns 200. Don't start a second server if one is already up.
- **Signed-in pages:** pass a Playwright storage-state file (`--storage-state`) made with a test user, or use the app's dev sign-in. Never use a real person's credentials.

## 2. Make sure Playwright is available

The script resolves Playwright from the current folder's `node_modules`, so run it from the app's folder.

- Check with `npx playwright --version`. Playwright is in this project's planned stack (FE design §4), so it's expected as a dev dependency.
- If it's missing from `package.json`, ask before adding it. Then run `npm i -D @playwright/test` and `npx playwright install chromium`.

## 3. Capture and check

```bash
node <repo>/.claude/skills/ui-visual-check/scripts/snap.mjs --url http://localhost:5173/ --routes "#/timesheet,#/approvals"
```

- **Defaults:** viewports `375x812,1280x800`, Chromium, reduced motion (so nothing is captured mid-transition), full-page screenshots at 1× to keep images small, output in `.ui-snapshots/`. Keep that folder out of git.
- **States behind interactions:** write a scenarios file and pass `--scenarios scenarios.json`:
  ```json
  [{ "name": "submit-review", "path": "#/timesheet?state=filled",
     "steps": [{ "click": "text=Submit" }, { "waitFor": "[role=dialog]" }] }]
  ```
  Steps can be `click`, `fill: [selector, value]`, `press`, `hover`, `scroll` (bring an element into view, e.g. inside a scrolling dialog), `waitFor` or `wait` (milliseconds). For dialogs, add `--viewport-only`: full-page captures show the page behind a dialog, not the dialog's hidden content. In the mock-up sandbox, most states are URLs (`?state=`), so routes are usually enough.
- **iPhone-specific rendering:** add `--browser webkit` (needs `npx playwright install webkit`).
- **Other options:** `--viewports 375x812,768x1024,1440x900`, `--wait-for <selector>`, `--viewport-only`, `--dpr 2` (for checking fine detail), `--color-scheme dark`, `--motion`.

**Windows Git Bash rewrites arguments that start with `/`**, so `#/timesheet` becomes a file path. Prefix the command with `MSYS_NO_PATHCONV=1` and give the script path as `C:/…` or a relative path, or run it from PowerShell. The script refuses routes that look like file paths, and flags pages that render no text, so a wrong route can't pass silently.

The script prints a report and also writes `report.md` and `report.json` next to the screenshots.

| Check | Level | Why it matters here |
|---|---|---|
| Sideways scroll, with the elements causing it | fail | The PRD promises no sideways scrolling at 375px |
| Tap targets under 24px | fail | WCAG 2.2 minimum; mis-taps on rows |
| Touch targets under 44px | warn | Recommended size for thumbs |
| Inputs under 16px on phones | fail | iOS zooms the whole page on focus |
| Text contrast under 4.5:1 (3:1 for large) | fail | Readability outdoors and for older staff |
| Clipped text, overlapping controls, sideways-scrolling regions | warn | Usually a layout bug |
| Console errors, broken images, failed requests | fail or warn | The screen may not be what you think it is |
| Fonts not loaded | warn | You're looking at a fallback font, not the design |

## 4. Look at the screenshots

The automated checks only find mechanical problems. Open every screenshot with the Read tool and look at it as a designer would. Check against DESIGN.md:

- Is the hierarchy right? On My timesheet, the day rows and the fortnight total should read first.
- Is alignment consistent: numbers right-aligned in tabular figures, labels on a shared edge?
- Is spacing on the scale and consistent between like elements?
- Does the phone layout become stacked cards, with the primary action reachable?
- Do realistic extremes hold up: long names, 76h 30m totals, every day filled?
- Do all statuses use words and an icon, not colour alone?
- Does anything look like a library default rather than the chosen direction?

To compare with a mock-up or an earlier round, view the two screenshots one after the other and name the differences.

## 5. Fix, re-run, report

- Fix the failures and anything wrong in the screenshots, then re-run only the affected routes.
- Stop after about three rounds. If something still isn't right, report it plainly rather than looping.
- In the reply, cover:
  - what was checked (routes × viewports)
  - what was found and fixed
  - what's left, with screenshot paths

  Don't paste the whole report.

## When Playwright isn't an option

If the session has a built-in browser tool, for example the desktop app's browser pane, use it instead: open the URL, set the viewport to 375×812 and then a desktop size, take screenshots and apply the same checklist. Say that the automated measurements weren't run.

## Turning checks into tests

This loop is fast feedback, not the test suite. When a check matters on every build, such as no sideways scroll on My timesheet at 375px, add it as a real Playwright test in the app's e2e suite (FE design §10).
