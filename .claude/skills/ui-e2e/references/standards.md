# Front-end standards

The user agreed these on 12/10/2026. Plans cite them, and reviews check against them.

## Stack (FE design doc section 4)

Vue 3 with TypeScript, Vite, Vue Router, Pinia, and Nuxt UI v4 through its Vite plugin, without the Nuxt framework. Tests use Vitest with Vue Test Utils, and Playwright for end to end. Still undecided in the FE doc, and settled in a plan before the code that needs them: project structure (section 5), API client (section 7), state (section 8), testing set-up (section 10), build (section 11), browser sign-in (section 3), and npm or pnpm.

TypeScript runs with `strict` and `noUncheckedIndexedAccess`.

## When qualities conflict

The higher one wins: **Tests → Readable → Defensive → Maintainable → Short.**

| Conflict | Winner | Rule |
|---|---|---|
| Readable vs short (expressions) | Readable | Name a step when a line holds more than one idea. "Short" means fewer layers and files, not denser lines. |
| Readable vs short (types) | Readable | Write types on exported functions, component props and events, API calls, and any local whose type isn't obvious at a glance. Trivial locals stay inferred. |
| Defensive vs short | Defensive | Check every value where it enters: API responses, form input, the URL, and values from third-party components (time input, signature pad). Extra lines are accepted. |
| Defensive vs readable | Readable | Failure handling lives in one module per concern that exposes a plain status. For example, autosave handles the typing pause, retries, version conflicts, "Not saved" and the warning before leaving. Screens show the status; main paths stay flat with early returns. |
| Defensive vs maintainable (duplicate rules) | Defensive | Keep FR-09 validation in the browser and on the server. One front-end validation module is tested against the same shared cases as the server. The server's verdict wins. |
| Defensive vs maintainable (API checks) | Defensive | API responses are validated at run time. Both the types and the runtime schemas are generated from the OpenAPI spec, never hand-written, so there is still one source of truth. |
| Defensive vs short (strict TypeScript) | Defensive | `noUncheckedIndexedAccess` stays on. |
| Maintainable vs short | Maintainable | A rule or concept that appears twice gets one shared module, even at the cost of more files. Formatters, hour calculations and validation are shared from day one. Code that only looks alike stays separate. |
| Maintainable vs readable (splitting) | Readable | Split by the parts the domain names (day row, week totals, submit review), not by line count. A page file reads top to bottom. |
| Tests vs short and readable | Tests | Tests find elements by role and label, which doubles as an accessibility check. Logic lives in plain functions tested directly. Test behaviour from acceptance criteria, not internals. |
| Defensive vs tests | Tests | No guards for states the types already rule out. Make impossible states unrepresentable instead, so every branch can be tested. |
| Intent vs short (comments) | Why only | Comment only why, mostly requirement links (`// FR-27: warn, never block`). Never restate what the code does. |

## Future milestones: seams, not features

Build only the current milestone. Leave a seam only where it costs nothing today. Each plan lists the roadmap items its code touches (`docs/INDEX.md`, roadmap section) and the seams it leaves.

| Roadmap item | Free seam in M1 code |
|---|---|
| Weekend and overnight shifts (M2) | Days to show come from the API, not a hard-coded Monday to Friday. "Finish after start" lives only in the validation module. |
| More managers, reporting lines (M2) | Access is checked by role, never by "the one manager". Approval lists come from the API. |
| Recall and amendments (M2) | Status is a closed union generated from the API, and every status-dependent branch handles it exhaustively, so a new status fails type-check. |
| More soft warnings (M2) | Warnings render from the server's list, not from FR-27 hard-coded in the screen. |
| Configurable periods: weekly, monthly (M3) | Period start, length and labels come from the API, never `14` or "fortnight" computed in the client. Labels can say "fortnight" today. |
| Tenants, per-tenant sign-in (M3) | The API base URL and sign-in live in one module each; nothing else knows about either. |
| Projects and other dimensions, pay rates (M4) | Hours and totals are always the server's figures; the client only previews. |
| Multiple languages (Later) | UI text is whole sentences, never assembled from fragments. |

## Checks

| Gate | Every change | End of slice |
|---|---|---|
| Type-check and lint | ✓ | ✓ |
| Unit tests (written before the code for formatters, hour calculations and validation) | ✓ | ✓ |
| ui-audit scan (`--strict`) | ✓ | ✓ |
| Component tests |  | ✓ |
| End-to-end tests at 375×812 and 1280×800 |  | ✓ |
| Screenshot comparison with `mockup/approved/` (ui-visual-check) |  | ✓ |
| ui-audit guidelines review and critique |  | ✓ |
| Automated accessibility check (axe, no serious or critical findings) |  | ✓ |

All end-of-slice gates must pass before the user is asked to try the slice. The exact commands go in each plan once the project structure is decided.
