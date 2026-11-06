# Working in this repository

For anyone, or any tool, that edits this repository.

## Front end (`web/`)

Before adding or changing a `.vue` file or a stylesheet, read [`web/STYLING.md`](web/STYLING.md). It sets how components are styled, how design tokens are used and where global CSS lives. If a change would break one of its rules, say so in the pull request instead of working around it.

Colours, type, spacing and the visual direction are decided in [`DESIGN.md`](DESIGN.md). Change a design value there first, then in `web/src/assets/tokens.css`.

Before adding or changing a test, read [`web/TESTING.md`](web/TESTING.md). It sets which layer a test belongs to, how to keep tests few and concise, and when to parameterise. Every new test should answer the 3 questions at the top of it.
