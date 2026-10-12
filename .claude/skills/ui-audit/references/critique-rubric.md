# Critique rubric

Use this on the rendered screen, not the code. Score each area pass, weak or fail in your head, and report only the weak and failed ones, at most five issues, most important first.

## 1. Fit to the subject
- Could this screen belong to any SaaS product, or only to this one? Point to what makes it specific: the paper sheet's structure, the domain's words, the figures.
- Is the register right? A tool should feel like a tool, not a landing page.
- Does it match DESIGN.md's direction and signature element, used once and where it matters?

## 2. Hierarchy
- Squint test: blur your eyes. Is the first thing you see the most important thing (on My timesheet, today's row and the fortnight total)?
- Is there exactly one primary action per view, and is it obvious?
- Do size and weight do the work, rather than boxes, colours and icons?

## 3. Structure and rhythm
- Do spacing values come from the scale, with consistent gaps between like things?
- Is alignment deliberate: text left, numbers right, a shared edge for labels and fields?
- Are containers earning their place? No cards in cards, no boxes around single items.

## 4. Numbers and data
- Are figures tabular and aligned, so columns can be compared at a glance?
- Is formatting identical everywhere (7:30 AM; 8h 10m (8.17))?
- Does the layout survive realistic extremes: long names, 76h 30m totals, every day filled, no days filled?

## 5. States
- Are empty, loading, error, read-only, warning and rejected states designed, not just default?
- Do read-only states look final rather than disabled?
- Does every status use words and an icon as well as colour?

## 6. Phone
- At 375px: no sideways scroll, comfortable tap targets, inputs at least 16px, the primary action reachable.
- Do tables become something readable (cards), not a squeezed table?
- Does anything rely on hover?

## 7. Copy
- Is it the users' language, with consistent names for actions and statuses (DESIGN.md §6)?
- Do errors explain what to do?
- Is there any marketing voice, apology, exclamation mark or emoji?

## 8. Motion (if any)
- Does each animation explain a change? Is it under 300ms, with no bounce, and does it respect reduced motion? (See ui-motion.)

## Writing an issue

> **Element** — what's wrong → why it matters to these users → the change.
>
> *Example:* **Week totals** — same size and weight as the daily hours → staff can't find the figure they check before submitting → set week totals in the figures font at the next size up, separated by a rule, double-ruled for the fortnight.
