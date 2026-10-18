# DESIGN.md template

Copy this to the project root as `DESIGN.md` and fill it in. Keep it short: it is read at the start of every UI task. Link to requirement docs rather than copying them, and record only what shapes the interface.

```markdown
# Design

Status · last updated · links to requirements (PRD, design docs)

## 1. Product context
- **What it is:** one or two sentences.
- **Who uses it, where, how often:** roles, devices, conditions (on a phone at the end of a shift; at a desk once a fortnight).
- **The job of each main screen:** one line each.
- **What users must feel:** e.g. "the numbers are right and nothing I typed is lost".
- **Register:** product UI or brand UI (see ui-craft section 2).

## 2. Hard constraints
Things the design may not break: viewport promises, formats, labels that must match a paper form, accessibility targets, browsers, languages, the component library.

## 3. Visual direction
Name, one-line feel, signature element, risk and mitigation. "Not chosen yet" is a valid state; ui-craft proposes options.

## 4. Tokens
Type (families, scale, weights), colour roles with hex values and checked contrast, space, radius, elevation, motion. Point to the token file that implements them.

## 5. Components and patterns
House rules for recurring patterns: tables vs cards, forms, status display, empty, loading and error states, dialogs on phones.

## 6. Vocabulary
The exact names of actions, statuses and messages, so every screen uses the same words.

## 7. Decision log
Date · decision · why.
```
