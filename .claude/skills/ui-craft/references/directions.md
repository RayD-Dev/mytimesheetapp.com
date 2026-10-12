# Choosing a visual direction

A direction is grounded when it could only belong to this product. Get there from the subject, not from a mood board of other apps.

## Method

1. **Subject and vernacular.** What artefacts do users already know from this domain? (Paper forms, ledgers, signs, tickets, dashboards in a cab, a clinic's appointment card.) Their conventions are free familiarity: double-ruled totals in accounting, yellow for caution on signage, a stamp for approval.
2. **Conditions of use.** Device, light, hurry, gloves, glare, age range, how often per day. These set density, contrast and target sizes before taste does.
3. **Trust and tone.** What must the UI make people feel? (Certain the numbers are right; that nothing they typed was lost; that approval is final.)
4. **One signature element** that carries meaning and appears where it matters. Everything else stays quiet.
5. **Name the risk** of the direction (e.g. "can feel austere") and how you'll mitigate it.

**Component library defaults count as defaults too.** This project uses Nuxt UI, whose docs and starter templates pair Public Sans with a green primary, slate neutrals and medium rounding. A direction that keeps that combination will look like a Nuxt UI template, however carefully it's built.

Fonts: use open-licence (SIL OFL) families and self-host them with the app, e.g. via `@fontsource` or `@fontsource-variable` packages. That keeps the app working offline or behind a firewall and avoids third-party font requests. Before committing to a font, check it has the weights you need, clear `1/l/I` and `0/O`, and tabular figures if it will set numbers.

## Category starting points

Use these as starting points for thinking, not a menu to copy. Every pairing listed is OFL.

| Category | Feel to aim for | Type pairings | Palette approach | Density | Avoid |
|---|---|---|---|---|---|
| Workforce and operations (timesheets, rosters, field service) | Readable at a glance, on a phone, in a hurry | Atkinson Hyperlegible Next + Atkinson Hyperlegible Mono; IBM Plex Sans + IBM Plex Mono; Archivo (tabular figures) | High-contrast neutrals; signage semantics (yellow = caution, red = stop, green = done) | Comfortable on phones (44–48px targets), compact tables on desktop | Pastel dashboards, playful illustration, tiny grey text |
| Finance, payroll, accounting | Precise, auditable, calm | IBM Plex Sans + IBM Plex Mono; Source Serif 4 headings + Source Sans 3; Instrument Sans + JetBrains Mono | Ink blues or greens; red only for errors or negatives | Compact; figures right-aligned | Crypto neon, gradients, decorative charts |
| Healthcare and care | Reassuring, plain, accessible | Atkinson Hyperlegible Next; Lexend + Source Serif 4 | Calm mid-tones with strong text contrast; colour never alone | Generous | Clinical cold-blue everything; dense jargon |
| Developer tools | Fast, keyboard-first, information-dense | Geist + Geist Mono; IBM Plex Sans + Martian Mono | Drawn from IDE themes; one sharp accent | Dense | Near-black with neon accent (the stock "dev" look) |
| Editorial, docs, content | Reading comfort, authority | Newsreader or Literata for text + a plain sans for UI; Fraunces for display | Paper and ink, one accent for links | Airy, narrow measure | Centred everything; card grids for articles |
| Civic and public services | Plain, trustworthy, inclusive | Public Sans; Source Sans 3 | One strong civic colour, neutral rest | Comfortable | Brand flourishes, cleverness |
| Commerce and retail | Product first, frictionless checkout | Hanken Grotesk; Schibsted Grotesk | Neutral frame so product imagery carries colour | Medium | Banner clutter, fake urgency |
| Brand and creative (landing pages, portfolios) | Memorable, expressive | Instrument Serif + Instrument Sans; Bricolage Grotesque; Syne for display | Bold and committed — one dominant colour | Varies | The purple gradient hero with three feature cards |

## Directions for the timesheet app

The context, from `DESIGN.md`: casual staff entering a fortnight of shifts on their phones, an owner approving and signing, and a PDF that copies the business's paper timesheet for the accountant. The most important feeling is *the numbers are right and nothing I typed is lost*.

All contrast ratios below were checked against WCAG 2.2: text pairs ≥4.5:1, control borders ≥3:1.

### A. Ledger — "the paper timesheet, made exact" *(chosen 2026-10-11, see DESIGN.md)*

- **Feel:** ink on ruled paper; no shadows; the screen, the PDF and the old paper sheet look like one document.
- **Type:** IBM Plex Sans 400/600 for UI; IBM Plex Mono 400/500 for times, hours and totals. It's one superfamily, so it reads as a single precise voice. (Not Public Sans: it's the font in Nuxt UI's own docs and templates.)
- **Colour:**
  - `paper` #FAFAF8 page · `sheet` #FFFFFF raised surface
  - `ink` #1B2330 text (15.8:1) · `ink-muted` #586273 secondary text (6.2:1)
  - `rule` #D5DAE1 decorative lines · `control-border` #7D8796 input borders (3.6:1)
  - `accent` fountain-pen blue #2547A6 for primary action, focus and links (8.3:1; white on it 8.3:1)
  - `caution` #8A5300 on #FFF3D1 (5.7:1) · `danger` #B3261E (6.5:1) · `approved` #1D7148 (6.0:1)
- **Shape:** radius 2px controls, 4px phone day-cards; elevation by hairline rules, one shadow for dialogs only.
- **Density:** 40px table rows on desktop; 48px controls on phones.
- **Signature:** totals are double-ruled like a ledger's final total, figures right-aligned in the mono face. It's meaningful (an accounting convention for "this is the total") and it echoes the PDF.
- **Motion:** almost none; saved and status changes cross-fade.
- **Risk:** can feel austere. Mitigate with a confident size for the fortnight total and well-written empty states.

### B. Signage — "readable at a glance, in the sun, on a cracked phone"

- **Feel:** wayfinding signage; big, bold, unambiguous.
- **Type:** Atkinson Hyperlegible Next (designed by the Braille Institute for low-vision legibility) + Atkinson Hyperlegible Mono for figures.
- **Colour:**
  - `concrete` #F3F4F1 page · `sheet` #FFFFFF
  - `ink` #101418 (18.5:1) · `ink-muted` #4E5661 (7.4:1) · `control-border` #7A838F (3.8:1)
  - `accent` guide-sign green #00663A (white on it 7.1:1)
  - `caution` hi-vis yellow #FFD43B background with ink text (13.0:1) — yellow means caution, as on signs
  - `danger` #B3261E (6.5:1) · `info` / Submitted #1D4E89 (8.4:1)
- **Shape:** radius 6px; 48px targets; bold weights.
- **Signature:** statuses as solid "sign plates" (colour block + icon + word); an oversized fortnight total.
- **Risk:** Approved and the primary button share green. Separate them by shape (plate vs button), or move Approved to ink with a check icon.

### C. Stamp — "approval is a physical act"

- **Feel:** a clean office form, with statuses applied like rubber stamps next to the signatures.
- **Type:** Red Hat Text + Red Hat Mono.
- **Colour:**
  - `canvas` #F4F5F7 page · `sheet` #FFFFFF
  - `graphite` #22262C (15.2:1) · `steel` #5F6670 (5.8:1) · `control-border` #848B95 (3.4:1)
  - `accent` stamp-pad blue #2B50C8 (6.8:1)
  - `approved` #157347 (5.9:1) · `rejected` #C0262D (5.9:1) · `caution` #8B5A00 on #FFF1C2 (5.2:1)
- **Shape:** radius 4px; light borders.
- **Signature:** status marks drawn as outlined stamps. This is the one place uppercase lettering is right, because it's the metaphor. Approve gets the app's single orchestrated motion: a short "stamp" settle (see ui-motion).
- **Risk:** kitsch if the stamp idea spreads beyond status marks. Keep it to statuses.

**Why A is recommended:** the PRD makes the paper sheet the reference for both the screen and the PDF, so staff see the same figures the accountant does. A turns that requirement into the identity. If staff legibility on phones turns out to matter more than ledger character, keep A's palette and structure and swap the UI font for Atkinson Hyperlegible Next.
