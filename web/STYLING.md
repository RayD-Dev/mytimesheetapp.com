# Front-end styling guide

How components and CSS are written in the web app. Read this before editing or adding any `.vue` file or stylesheet. It is written for people and for any tool that edits this repository.

Agreed 06/11/2026, after checking the Vue style guide, the Tailwind and Nuxt UI docs, and the design systems of GitHub Primer, Atlassian, Adobe Spectrum, Google Material and GOV.UK.

The 6 principles apply to any Vue and Tailwind project. "How this is wired in the project" says where things live here. Colours, type and spacing are decided in [`DESIGN.md`](../DESIGN.md) section 4.

## 1. Style in the template with utility classes

A component has no `<style>` block and no `style` attribute. Utility classes can't leak between components, which is what the Vue style guide's scoping rule is for.

```vue
<!-- Do -->
<section class="bg-sheet border border-rule p-4">
  <h2 class="text-xl font-semibold">Totals</h2>
</section>

<!-- Don't -->
<section style="background: #fff; padding: 16px">
  <h2 class="totals-title">Totals</h2>
</section>
<style scoped>
.totals-title { font-size: 20px; font-weight: 600; }
</style>
```

## 2. Take every value from the tokens, by role

Colours, fonts, radius and motion come from the design tokens. Use them as role utilities (`bg-sheet`, `text-ink-muted`) or through the component library's `color` props. Never Tailwind's default palette, never raw hex, and no arbitrary values except a real one-off with a comment saying why.

```vue
<!-- Do -->
<p class="text-ink-muted">Saved 2 minutes ago</p>

<!-- Don't -->
<p class="text-gray-500">Saved 2 minutes ago</p>
<p class="text-[#586273]">Saved 2 minutes ago</p>
<div class="w-[13px]" />
```

## 3. Extract a component for repeated structure

When the same group of elements appears on 2 or more screens, make it a component. Don't extract only to shorten a class list, and don't turn a repeated class list into an `@apply` class. Shared components go in `src/shared/ui/`. One used by a single feature stays in that feature's folder.

```vue
<!-- Before: the same wrapper on 2 screens -->
<main class="mx-auto max-w-5xl md:px-4 md:py-8">
  <article class="bg-sheet px-4 pt-6 pb-10 md:border md:border-rule md:px-8">
    ...
  </article>
</main>

<!-- After -->
<PageSheet>
  ...
</PageSheet>
```

## 4. Customise library components through their own API

Global first, through the `ui` option in `vite.config.ts`, so every instance matches. Per instance only when the meaning differs, through `class` or `ui`. Never `:deep()` into the library's internals and never `!important`.

Nuxt UI applies overrides in this order, lowest priority first: the theme's slot classes, matched variants, the global config, the `ui` prop, then the `class` prop.

```vue
<!-- One instance whose meaning differs -->
<UButton size="xl" class="mt-8" to="/timesheet">Go to My timesheet</UButton>
```

```ts
// vite.config.ts: house style for every button (example)
ui({ colorMode: false, ui: { button: { slots: { base: 'font-semibold' } } } })
```

## 5. Custom CSS is the exception

Use a `<style>` block or `@apply` only where utilities can't reach: third-party or `v-html` content, complex parent-child state, and keyframes. Use `<style scoped>`, avoid element selectors, say why in a comment, and put the block last.

```vue
<template>
  <div class="rich-text" v-html="html" />
</template>

<style scoped>
@reference "../assets/main.css"; /* needed to use @apply in a component */

/* v-html content has no classes of its own, so scoped styles can't reach it without :deep */
.rich-text :deep(a) { @apply text-accent underline; }
</style>
```

## 6. Names and layout follow the Vue style guide

PascalCase file names, multi-word component names, and one attribute per line when there are several. `eslint-plugin-vue` (`flat/recommended`) enforces the layout rules.

```vue
<UButton
  size="xl"
  class="mt-8"
  to="/timesheet"
>
  Go to My timesheet
</UButton>
```

## How this is wired in the project

All global CSS lives in 3 files in `src/assets/`. Nothing else is global.

```
tokens.css      the design values: colours, fonts, easing, durations, motion
ui-theme.css    maps those values onto Nuxt UI's --ui-* variables
main.css        imports only: Tailwind, Nuxt UI, then the two files above
```

A token is a CSS variable in `tokens.css`. The `--color-*` name becomes the utility, so this one line gives `text-ink-muted`, `bg-ink-muted` and `border-ink-muted`.

```css
@theme static {
  --color-ink-muted: #586273; /* secondary text */
}
```

To add a token: record it in `DESIGN.md` section 4 and its decision log with the reason, add it to the `@theme` block in `tokens.css` (a mapping onto a Nuxt UI variable goes in `ui-theme.css`), then use the generated utility.

- **`DESIGN.md` owns the values.** Raw hex appears only in `tokens.css`.
- **Name colours for their job**, such as `--color-ink-muted`, not their value. There are no component-level tokens until one component must be themed apart from the rest.
- **Comment a token** whose job isn't clear from its name. Contrast ratios live in one place, `DESIGN.md` section 4.
- **Reduced motion is handled once.** `tokens.css` sets the motion offsets to 0 under `prefers-reduced-motion: reduce`. New motion uses the `--duration-*` and `--motion-*` variables, never literal values.
- **Light only.** No dark mode and no `prefers-color-scheme` rules (`colorMode: false`).
- **Rename a token in one change.** Update every use in the same PR, and search for the class name too, because Stylelint only sees CSS.
- **What checks it.** `pnpm lint` runs Stylelint, which fails on a `var(--x)` with no definition. A token used only in components isn't covered.
