# Tokens and Nuxt UI wiring

This project uses **Nuxt UI v4 in a plain Vue 3 + Vite app**, styled with **Tailwind CSS v4**. Nuxt UI is MIT-licensed and built on Reka UI. Tokens flow one way:

```
DESIGN.md (decisions)  →  tokens.css (@theme + :root)  →  ui-theme.css (Nuxt UI mapping)  →  Nuxt UI variables and Tailwind utilities  →  components
```

Components use only Tailwind utilities generated from tokens (`bg-paper`, `text-ink-muted`, `border-rule`) or Nuxt UI's semantic props (`color="primary"`). A hex value inside a `.vue` file means a token is missing: add the token, don't inline the colour.

Nuxt UI changes quickly. Before overriding something, check the installed version's theme for the component: the component's docs page has a Theme section, and the generated theme files sit in the folder that the `#build/ui` alias in `tsconfig` points to. Don't guess slot names.

## 1. Setup (once)

```bash
npm install @nuxt/ui tailwindcss
npm install @fontsource/ibm-plex-sans @fontsource/ibm-plex-mono   # whichever fonts DESIGN.md picks
```

`vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'

export default defineConfig({
  plugins: [
    vue(),
    ui({
      colorMode: false, // no dark mode until DESIGN.md defines a dark palette; avoids a half-themed dark UI
      ui: {
        colors: { primary: 'blue', neutral: 'slate' }, // nearest built-in scales; exact roles are pinned in :root below
        // Global component overrides go here (section 4)
      },
    }),
  ],
})
```

`src/main.ts`: import the fonts and CSS, then `app.use(router)` and `app.use(ui)` from `@nuxt/ui/vue-plugin`. `App.vue` wraps `<RouterView />` in `<UApp>`, which is required for toasts, tooltips and overlays. Add `class="isolate"` to `#app` in `index.html`.

## 2. The token file

In the real app the design values live in `src/assets/tokens.css` and the mapping onto Nuxt UI's variables in `src/assets/ui-theme.css`; `main.css` only imports them. `tokens.css` is the only place raw colour values may appear. The example below shows both files as one, for brevity.

```css
@import "tailwindcss";
@import "@nuxt/ui";

@theme static {
  /* Type: DESIGN.md → Typography */
  --font-sans: "IBM Plex Sans", ui-sans-serif, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;

  /* Colour roles: DESIGN.md → Colour. Each becomes a utility: bg-paper, text-ink-muted, border-rule… */
  --color-paper: #FAFAF8;
  --color-sheet: #FFFFFF;
  --color-ink: #1B2330;
  --color-ink-muted: #586273;
  --color-rule: #D5DAE1;
  --color-control-border: #7D8796;
  --color-accent: #2547A6;
  --color-caution: #8A5300;
  --color-caution-bg: #FFF3D1;
  --color-danger: #B3261E;
  --color-approved: #1D7148;

  /* Motion: owned by ui-motion */
  --ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1);
  --ease-in-out-strong: cubic-bezier(0.77, 0, 0.175, 1);
  --ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
}

/* Point Nuxt UI's semantic variables at the roles, so every library component follows DESIGN.md */
:root {
  --ui-primary: var(--color-accent);
  --ui-warning: var(--color-caution);
  --ui-error: var(--color-danger);
  --ui-success: var(--color-approved);

  --ui-text-highlighted: var(--color-ink);
  --ui-text: var(--color-ink);
  --ui-text-toned: var(--color-ink-muted);
  --ui-text-muted: var(--color-ink-muted);
  --ui-text-dimmed: var(--color-ink-muted); /* placeholders must still reach 4.5:1 */

  --ui-bg: var(--color-sheet);
  --ui-bg-muted: var(--color-paper);
  --ui-border: var(--color-rule);
  --ui-border-muted: var(--color-rule);
  --ui-border-accented: var(--color-control-border); /* input outlines: needs ≥3:1 */

  --ui-radius: 0.125rem; /* rounded-* utilities are multiples of this */
}
```

The values above are the Ledger tokens recorded in DESIGN.md section 4. DESIGN.md is the source of truth if they ever differ.

Nuxt UI's variables (v4): text `--ui-text-dimmed | -muted | -toned | (base) | -highlighted | -inverted`; backgrounds `--ui-bg | -muted | -elevated | -accented | -inverted`; borders `--ui-border | -muted | -accented | -inverted`; semantic `--ui-primary | secondary | success | info | warning | error`; layout `--ui-radius`, `--ui-container`, `--ui-header-height`. Light-mode overrides go in `:root` and dark-mode overrides in `.dark`.

## 3. Figures

Times, hours and totals use the figures font and tabular numerals: `font-mono tabular-nums`, right-aligned in tables. Make it a component (e.g. `<Hours :minutes="490" />`, which renders `8h 10m (8.17)`) so formatting and styling live in one place. Never format hours inline in templates.

## 4. Theming Nuxt UI components

How overrides are applied, lowest priority first: the theme's slot classes, then matched variants, then global config (`vite.config.ts` → `ui.ui.<component>`), then the `ui` prop, then the `class` prop. Classes merge through tailwind-merge. A function in place of a class string replaces the classes instead of merging.

- **Global first.** Put house style in `vite.config.ts` under `ui.ui.<component>` (`slots`, `variants`, `compoundVariants`, `defaultVariants`), so every instance matches.
- **Per instance only when meaning differs**, through the `ui` prop or `class`. If you keep repeating the same `ui` prop, it belongs in global config.
- **Phones:** Nuxt UI's medium inputs use `text-sm` (14px), which makes iOS zoom in on focus. Set input text to `text-base` through the size variants you use, for `input`, `inputTime`, `inputNumber`, `select` and `textarea`. Confirm with ui-visual-check, which reports any input under 16px.
- **Move away from template defaults:** the font, neutral tint, primary colour, radius, button weight, and overlay shadows (keep a shadow only on things that float).
- **Reka UI underneath.** If Nuxt UI lacks a component, build it on the matching Reka UI primitive with the same tokens, rather than adding a second component library.

Nuxt UI components this app will likely use: `UInputTime` with `:hour-cycle="12"` for start and finish times (check that typing works on a real phone); `UCalendar` or `UInputDate` with a disabled-date rule for the Mondays-only pay-schedule picker; `UModal` with `fullscreen` on phones for the submit review; `UDrawer` for phone sheets; `UToast`; `UTable` for Approvals on desktop.

## 5. Adding a token

1. Add it to DESIGN.md with its role and the reason.
2. Add it to the `@theme` block in `tokens.css` (a mapping onto a Nuxt UI variable goes in `ui-theme.css`).
3. Use the generated utility. Run ui-audit: raw-colour findings should go down, not up.
