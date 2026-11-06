# Timesheet web app

Vite, Vue 3, TypeScript, Vue Router, Pinia, Nuxt UI v4 (Vite plugin, no Nuxt) and Tailwind v4.

## Package manager

pnpm, pinned in `packageManager` and run through Corepack. On this machine `corepack enable` needs admin rights, so use
`corepack enable --install-directory ~/bin` with `~/bin` on PATH.

Corepack reads `packageManager` from the folder you run in. Run pnpm from `web/` (`cd web`); `pnpm -C web ...` from the repo root uses Corepack's default pnpm instead.

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev`, `pnpm build` | Vite dev server, production build |
| `pnpm typecheck` | `vue-tsc --noEmit` |
| `pnpm lint` | ESLint (Vue and TypeScript rules) and Stylelint (CSS variables that are not defined) |
| `pnpm test` | Vitest, all unit and component tests |
| `pnpm test:components` | Vitest on `*.component.test.ts` only |
| `pnpm codegen`, `pnpm codegen:check` | Placeholders until task 3 |
| `pnpm contract:lint` | Redocly lint of `../contract/openapi.yaml` |
| `pnpm test:e2e` | Playwright |
| `pnpm run audit` | ui-audit scanner with `--strict` on `src`. Run it as `pnpm run audit`: bare `pnpm audit` is pnpm's own security audit |

## Styling

Components are styled with Tailwind utility classes and the design tokens, with no `<style>` blocks by default. The rules and examples are in [`STYLING.md`](STYLING.md). Read it before editing a `.vue` file or a stylesheet.

## Testing

Tests are few, concise and written at the lowest layer that can fail for the reason. The rules and examples are in [`TESTING.md`](TESTING.md). Read it before adding or changing a test.
