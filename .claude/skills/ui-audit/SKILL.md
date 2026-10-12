---
name: ui-audit
description: Audit UI code and screens for generic "AI slop" tells, design-system drift and quality-floor gaps. A deterministic scanner scores the code 0–100 and lists findings by file and line, then a short critique covers what static checks can't see. Use this after building or changing any UI and before handing UI work back, and whenever the user asks for a design review, critique, polish pass or "vibe score", or asks whether something looks AI-generated, generic, templated or off-brand.
---

# UI audit

Two passes, because they catch different things:

1. **Scan.** A deterministic scanner finds the tells that live in code: default fonts, purple gradients, glassmorphism, nested cards, `transition: all`, bounce easing, raw colours instead of tokens, removed focus outlines, clickable divs, marketing copy. It's fast, repeatable and cheap to run after every change.
2. **Critique.** Judgment on the rendered screen: hierarchy, rhythm, fit to the subject, consistency with DESIGN.md. A clean scan is not proof of good design.

## 1. Scan

```bash
node .claude/skills/ui-audit/scripts/slop-scan.mjs <paths…>
```

- Pass the files or folders you changed, e.g. `mockup/src/pages/timesheet/index.vue` or `mockup/src`. With no paths it scans `src` if present, else the current folder.
- It scans `.vue .css .scss .less .html .ts .tsx .js .jsx` files and skips `node_modules`, `dist`, `.git` and `.claude`.
- Options:
  - `--json` gives machine-readable output.
  - `--strict` exits with code 2 if any critical or major finding remains (for hooks and CI).
  - `--config <file>` defaults to `.slopscan.json` in the current folder.

The output is a score with a band, findings grouped by severity (`file:line rule-id detail`), then one "why and fix" line per rule that fired. Rule details and alternatives are in `../ui-craft/references/anti-patterns.md`.

| Score | Band |
|---|---|
| 90–100 | Intentional |
| 75–89 | Mostly clean |
| 50–74 | Generic in places |
| below 50 | Reads as AI default |

### Acting on findings

- **Fix real findings at the source.** Swap a raw colour for a token, `transition: all` for named properties, a clickable `div` for a `<button>`.
- **Don't game the score.** Renaming a purple variable or splitting a gradient across lines to dodge a regex leaves the look and hides the problem. If the look is wrong, change the look.
- **Keep justified exceptions, and say why.** Some findings are right in context. The *Submit* label is the PRD's own term, and a stamp metaphor may need uppercase. Suppress them where they occur:
  - On the line or the line above: `<!-- slop-ignore generic-cta -- PRD FR-14 term -->` or `/* slop-ignore eyebrow-caps -- stamp metaphor, DESIGN.md §3 */`. Several rules can be listed with commas. A reason after `--` is expected.
  - Project-wide, in `.slopscan.json`:
    ```json
    {
      "ignoreRules": [],
      "ignoreFiles": ["src/legacy/**"],
      "allowCopy": ["Submit"],
      "tokenFiles": ["src/assets/css/main.css"]
    }
    ```
    `allowCopy` exempts specific words from the copy rules. `tokenFiles` lists where raw colours belong. Files named like `tokens`, `theme`, `palette` or `main.css` are treated as token files automatically.

## 2. Critique

Look at the rendered screen. Use ui-visual-check screenshots at phone and desktop widths if you can't see it otherwise. Go through `references/critique-rubric.md` and note at most five issues, most important first. Each one names the element, what's wrong, why it matters to *this* product's users, and the change.

## 3. Report

When you report back, use this shape. It's short enough to read, and specific enough to act on.

```
UI audit — <scope>
Scan: 62 → 91 (Intentional). Fixed: ai-gradient ×1, raw-color ×7, transition-all ×2.
Kept on purpose: generic-cta ×1 ("Submit" is the PRD's term).
Critique:
1. Fortnight total doesn't stand out from the week totals — make it the screen's one confident element (DESIGN.md §3 signature).
2. …
```

If you only scanned and didn't fix, say so, and list the top findings rather than every line.
