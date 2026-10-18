---
name: ui-craft
description: Design and build distinctive, intentional UI instead of generic AI-default styling (Inter everywhere, purple gradients, rounded card grids, shadow-lg on everything). Use this whenever you create or restyle any screen, component, layout, form, table, dialog, theme, design token, colour, font or UI copy — including Vue components, CSS, Tailwind classes and component-library theming — even if the request is just "build the approvals screen", "add a profile page" or "make it look better". Also use it when choosing a visual direction, fonts, a palette or a component library's theme.
---

# UI craft

Language models drift towards the statistical average of the web: Inter, a purple-to-blue gradient, a grid of identical rounded cards with soft shadows, a fade-up on every section. Each choice is individually defensible; together they read as "nobody decided anything". This skill replaces habit with decisions: ground the design in the subject, commit to a small token system, apply it with restraint, then look at the result.

Companion skills: **ui-motion** (any animation or transition), **ui-audit** (scan and critique), **ui-visual-check** (screenshots at phone and desktop widths), **ui-mockup** (throwaway mock-up rounds before engineering). Use them at the steps below rather than improvising. When the user is still exploring how a screen should look, build it in the mock-up first (ui-mockup), not in the production app.

Upstream skills from taste-skill, Emil Kowalski and Vercel are installed alongside. The order of authority is `DESIGN.md`, then the `ui-*` skills, then upstream. Read the upstream sections named at each step below rather than invoking whole skills. `references/upstream.md` maps where each one plugs in and lists where this project deliberately differs (sentence case, no layered shadows, WCAG not APCA, light only, no stagger). Check it before following upstream advice that seems to contradict this skill.

## 1. Load the design context

Read `DESIGN.md` at the project root before designing anything. It holds the product context (who uses this, on what device, for which job), the hard constraints, the chosen visual direction, the tokens, and the vocabulary for actions and statuses. Treat it as the brief from a client who has already rejected generic work.

- If `DESIGN.md` is missing, create it from `references/design-md-template.md`, filling the product section from whatever requirements exist (PRD, README, issue). Ask the user only for what you can't infer.
- If the request contradicts `DESIGN.md`, say so and ask; don't silently fork the system.
- When you make a design decision that future screens should follow, record it in `DESIGN.md`'s decision log — that's how the next session stays consistent.

## 2. Know which register you're in

**Product UI** (forms, tables, dashboards, settings, workflows) and **brand UI** (landing pages, marketing, portfolios) need opposite instincts. Most "make it less generic" advice — atmospheric backgrounds, huge type contrast, orchestrated page-load reveals — is brand advice. Applied to a data-entry screen it makes the tool slower and harder to trust.

In product UI, distinctiveness comes from: a deliberate typeface, a precise and restrained palette, structure that mirrors the domain (here: the business's paper timesheet), excellent numbers, crisp states, and copy in the users' own words. Concentrate boldness in one place per screen — for example the fortnight total — and keep everything else quiet.

## 3. Choose a direction (only if DESIGN.md has none)

Read `references/directions.md`. Propose 2–3 directions grounded in the subject — each with a name, a one-line feel, a type pairing, 5–6 named colours with hex values, density, corner radius, and one signature element that carries meaning. Recommend one and say why in a sentence. Let the user choose, then write the choice and its tokens into `DESIGN.md`.

Before proposing, check your own list: if a direction would fit any SaaS product equally well, it isn't grounded yet.

## 4. Plan tokens before writing components

Write or update the token file first (see `references/tokens.md` for structure and component-library wiring). Components reference tokens only; a raw hex value or one-off pixel size inside a component is design-system drift, and **ui-audit** will flag it.

Minimum token set:
- **Type**: families (UI, figures), a scale with 5–7 steps, weights actually used (usually two), line heights.
- **Colour roles**, not just swatches: surface, raised surface, text, muted text, line (decorative), control border (≥3:1 against its background), accent, focus ring, and semantic roles (warning, danger, success, info) each with text and background variants.
- **Space**: a 4px-based scale. **Radius**: 2–3 values. **Elevation**: prefer borders and surface steps over shadows in product UI; at most one shadow for things that genuinely float (menus, dialogs).
- **Motion**: durations and easings, owned by **ui-motion**.

## 5. Build rules

Vercel's `../web-design-guidelines/build-rules.md` is the interaction and accessibility floor under everything below: keyboard, focus, forms, targets, content handling. For phone layouts, also apply the "Baseline" section of `../mobile-native/SKILL.md`: viewport meta, tap highlight, 16px inputs, safe areas, `:active` press feedback, hover gating. Where either conflicts with DESIGN.md, `references/upstream.md` says which wins.

### Typography
- One family, or two clearly different ones (e.g. a sans for UI and a mono for figures). Choose deliberately; Inter, Roboto, Arial, Open Sans, Lato, Poppins, Montserrat and bare system stacks are the habitual defaults — don't use them as the identity unless DESIGN.md says so.
- Figures that people compare or add up (times, hours, totals, money) use tabular figures: a monospace face or `font-variant-numeric: tabular-nums` on a font you've verified supports it. Right-align numeric columns.
- Product UI uses a modest scale (ratio ~1.2) with one confident display moment, not 3× jumps everywhere.
- Body text and every input at least 16px on phones (iOS zooms the page when a focused input is smaller).
- Keep prose under ~75 characters per line.
- Avoid the three typographic tells: highlighting one word of a heading in an accent colour or gradient, all-caps letter-spaced "eyebrow" labels above sections, and gradient text.

### Colour
- Use the palette's roles as named in DESIGN.md. One accent, used for the primary action, focus and links — not sprinkled on decoration.
- Tinted neutrals rather than pure `#000`/`#808080`; they make the palette feel chosen.
- Semantic colours never stand alone: pair them with an icon and words ("Rejected: reason below"), so meaning survives colour blindness and greyscale printing.
- Contrast: text ≥4.5:1 (≥3:1 for 24px+ or 19px+ bold); input borders, focus rings and icons that carry meaning ≥3:1.
- Avoid the stock AI palettes: purple/indigo gradients on white, warm cream with terracotta, near-black with a neon accent.

### Layout and structure
- Structure must carry information. Borders, dividers, numbering and labels each mean something; numbering only for real sequences.
- Cards are for things that are separate objects (on a phone, each day of the timesheet is legitimately a card). Never put cards inside cards, and don't wrap whole pages in a card.
- Mirror the domain's own structure where users already know it. For this project, the timesheet table follows the paper sheet's columns and labels exactly (see DESIGN.md).
- Design mobile-first at 375px with no sideways scrolling, then widen. On phones, keep the primary action reachable at the bottom of the flow; touch targets ≥44px (never below 24px).
- Use one spacing scale; align to a grid; let vertical rhythm, not boxes, group things.

### Components and states
For every interactive component, design each state on purpose: default, hover (pointer devices only), focus-visible (always visible — never remove outlines without a replacement), active/pressed, disabled, loading, empty, error, and read-only. Read-only (e.g. Submitted, Approved) should look settled and final — clear text and a status, not a greyed-out disabled form.

Submit-type buttons stay enabled until the request starts. Pressing one early says what's missing next to the gap and moves focus to the first gap. The button is disabled only while sending, with a spinner and its label kept. A disabled button can't be focused, so a screen-reader user never learns why it won't work.

Use the component library for behaviour and accessibility (dialogs, popovers, date and time fields, focus traps) and theme it through tokens. Don't restyle a component by fighting its CSS with `!important`; use its theming API or pass-through slots.

### Copy
- Write from the user's side, in their words. Use DESIGN.md's vocabulary so the same action has the same name everywhere ("Submit" on the button, the review, the toast and the log).
- Buttons name the outcome ("Submit timesheet", "Approve and sign") unless the domain's own term is better and agreed in DESIGN.md.
- Errors say what happened and what to do next, without apologising or joking: "Finish time must be after start time" — not "Oops! Something went wrong".
- No marketing voice inside a tool: no "Unlock", "Seamless", "Supercharge", exclamation marks or emoji in UI text.
- No em dashes or en dashes in UI text; use a full stop, comma, colon or "to" for ranges. At most one middle dot (·) per line. Use `…`, not `...`, and end loading text with it ("Saving…"). The scanner checks all three.
- Format numbers and times exactly as DESIGN.md specifies; inconsistent formatting reads as broken.

## 6. Check your work before handing it back

1. Run **ui-audit**'s scanner on the files you changed and fix what's real.
2. Run **ui-visual-check** at phone and desktop widths and look at the screenshots. Fix overflow, clipping, misalignment and anything that doesn't match DESIGN.md.
3. Read `references/anti-patterns.md` once against the rendered screen — static checks can't see hierarchy or rhythm. For forms, buttons and copy, also cross-check sections 4.5, 4.6 and 4.9 ("COPY SELF-AUDIT") of `../design-taste-frontend/SKILL.md`. Read only those sections; most of that skill is for marketing pages.
4. In your reply, state the key choices in two or three lines (e.g. "Totals use the figures font, double-ruled like a ledger; warnings use the caution role with an icon") so the user can push back on decisions rather than discover them.

A quality floor applies to everything, regardless of direction: responsive down to 375px, visible keyboard focus, accessible contrast, and no layout shift when data loads.
