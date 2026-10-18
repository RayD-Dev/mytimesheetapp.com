# Upstream skills: where they plug in, and where we differ

Twelve skills from taste-skill, Emil Kowalski and Vercel's Web Interface Guidelines are vendored in `.claude/skills/`, pinned and updated through `.claude/skills/_upstream/`. They're general advice; `DESIGN.md` and our `ui-*` skills carry this product's decisions.

**Order of authority:** `DESIGN.md`, then our `ui-*` skills, then the upstream skills.

**Read, don't invoke.** Open the named file and section at the step that needs it. Emil's skills answer a bare invocation with only a "ready" message, and `design-taste-frontend` is about 23k tokens, so never load it whole.

## Where each one is used

| Step | Upstream file and section | Used by |
|---|---|---|
| Building any screen | `web-design-guidelines/build-rules.md` (all; it's short) | ui-craft section 5 |
| Phone layout | `mobile-native/SKILL.md`, sections "Baseline" and "Never Ship" | ui-craft section 5, ui-visual-check |
| Forms, buttons and copy cross-check | `design-taste-frontend/SKILL.md` sections 4.5, 4.6 and 4.9 "COPY SELF-AUDIT", section 9 "AI TELLS" | ui-craft section 6, ui-audit critique |
| Code review pass | `web-design-guidelines/command.md` (rules and output format) | ui-audit pass 3 |
| Critique checklist | `redesign-existing-projects/SKILL.md` "Design Audit" only, not "Upgrade Techniques" | ui-audit critique |
| Worst-case data | `break-ui/SKILL.md` and `CATALOG.md` | ui-mockup round checks |
| New motion | `animate/SKILL.md` "The Build Sequence", `RECIPES.md` | ui-motion |
| Reviewing motion | `review-animations/SKILL.md` format, `STANDARDS.md` values | ui-motion section 6 |
| Janky motion | `animation-performance/SKILL.md` | ui-motion |
| "What could animate?" | `find-animation-opportunities/SKILL.md` (expect mostly rejections here) | ui-motion |
| Whole-app motion audit | `improve-animations/SKILL.md`; plans go in `.claude/plans/animation/` | ui-motion |
| Naming an effect in feedback | `animation-vocabulary/SKILL.md` | ui-motion |

## Where we differ, and why

| Upstream says | We do | Because |
|---|---|---|
| Title Case for headings and buttons (Vercel) | Sentence case | DESIGN.md vocabulary; Title Case is Vercel's house style |
| Layered shadows (Vercel); tinted shadows, grain, noise (taste-skill) | Hairline rules; a shadow only on dialogs and menus | DESIGN.md section 4, elevation |
| APCA contrast (Vercel) | WCAG 2.2 AA ratios | DESIGN.md's accessibility target |
| Dark mode by default (taste-skill, mobile-native's `theme-color` pair) | Light only, one `theme-color` | DESIGN.md has no dark theme |
| Stagger group entrances; 200–300ms transitions on all controls (Emil, taste-skill) | No stagger; instant feedback on frequent actions | ui-motion's frequency table |
| Springs and bounce for "alive" elements (Emil, taste-skill) | No overshoot | ui-motion: the app should read as precise |
| `Intl` for dates, not hardcoded formats (Vercel) | DD/MM/YYYY from the one shared formatter module (FR-11). If it uses `Intl`, it pins a locale rather than following the device | DESIGN.md hard constraint; every screen and the PDF must match |
| `overscroll-behavior: none` on `html` (Emil) | Vercel's version: only inside `@media (pointer: fine)` | Pull-to-refresh keeps working on phones |
| React, Motion, GSAP, Tailwind utility defaults, other design systems (taste-skill) | Vue 3, Nuxt UI themed through tokens, CSS transitions | Decided stack (FE design doc section 4) |
| Lucide icons discouraged; Phosphor preferred (taste-skill) | Whatever DESIGN.md names, from one set | One icon family per app; DESIGN.md decides |
| Eyebrow and hero rules, logo walls, bento, marquees (taste-skill) | Not applicable | Marketing-page rules; this is product UI |

## Adopted from upstream

- **No em dashes in UI copy, and at most one middle dot (·) per line** (taste-skill sections 9.G and 9.F). The scanner checks both.
- **`…` not `...`**, and loading text ends with it: "Saving…" (Vercel).
- **Submit stays enabled until the request starts.** Pressing it early says what's missing and moves focus to the first gap; it's disabled only while sending, with a spinner (Vercel, Forms).
- **Never disable zoom** (`user-scalable=no`, `maximum-scale=1`); fix input font size instead (Vercel, mobile-native). The scanner checks it.
- **Worst-case data** as a mock-up state on every new screen (break-ui).
