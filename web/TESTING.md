# Front-end testing guide

How tests are written in the web app. Read this before adding or changing a test. It is written for people and for any tool that edits this repository.

Agreed 06/11/2026, after checking the Vue, Vitest, Playwright and Testing Library docs, Google's Software Engineering at Google, Martin Fowler's writing on tests, and GitLab's front-end testing guide. "Where this comes from" at the end lists the sources.

## The goal of a test

A test is a cost. It has to be written, reviewed, run and kept up to date. It earns its place by failing for a real reason, which means a rule or behaviour that someone relies on.

We want few tests that each guard something, not many tests that restate the code. Before adding a test, answer 3 questions.

1. Which layer is the lowest one that can fail for this reason?
2. Which acceptance criterion, requirement or bug does it guard?
3. Does a row in an existing table already cover it?

If there is no answer to question 2, don't write the test. Deleting a test that guards nothing is fine.

## Layers

Test at the lowest layer that can fail for the reason, and don't repeat the same assertion in two layers. No layer has a fixed share of the tests. Many are unit tests, a good number are component tests, and very few are end to end.

| Layer | What it guards | Examples here |
|---|---|---|
| Static | Impossible states and style mistakes | Strict TypeScript, ESLint, Stylelint. Make a bad state unrepresentable instead of testing for it |
| Unit | Rules and calculations in plain functions | Hours and time formatting, validation, the save queue, `useAfterDelay` |
| Component | What a user sees and does in one component | The sign-out event, retry after a failed load, the links a manager sees |
| Contract | The shape of the API | Types and response schemas generated from the OpenAPI spec, `pnpm codegen:check` |
| End to end | A few critical journeys, in a real browser | Sign in, fill a timesheet, submit, approve. At 375px and 1280px |

Put hard logic in a plain function and test it as a unit. A component test then only needs to show that the component uses it.

## Writing concise tests

### 1. One behaviour per test

Name the test for the behaviour and tie it to the requirement. No loops and no conditionals inside a test.

```ts
// Do
it('shows Approvals and Admin to a manager (FR-01)', () => { ... })

// Don't: one test, three behaviours
it('renders the top bar', () => {
  expect(links).toEqual([...])
  expect(emitted).toHaveLength(1)
  expect(wrapper.classes()).toContain('border-b')
})
```

### 2. Parameterise when only the data changes

Use `it.each` with a table of inputs and expected results. The title shows each row.

```ts
// Example: a formatter, one row per case
it.each([
  { minutes: 0, text: '0h 00m' },
  { minutes: 5, text: '0h 05m' },
  { minutes: 490, text: '8h 10m' },
  { minutes: 4590, text: '76h 30m' },
])('formats $minutes minutes as $text', ({ minutes, text }) => {
  expect(formatHours(minutes)).toBe(text)
})

// Example: the same component with different props
it.each([
  { manager: false, links: ['My timesheet', 'Profile'] },
  { manager: true, links: ['My timesheet', 'Approvals', 'Admin', 'Profile'] },
])('shows $links when manager is $manager', ({ manager, links }) => {
  expect(linkNames(mount(TopBar, { props: { manager }, global }))).toEqual(links)
})
```

Don't put different behaviours in one table to save lines. A table is for one rule with many inputs.

```ts
// Don't: three behaviours behind one table
it.each([
  ['renders the title', () => expect(title).toBe('Approvals')],
  ['emits retry', () => expect(emitted).toHaveLength(1)],
  ['has a button', () => expect(button.exists()).toBe(true)],
])('%s', (_name, check) => check())
```

### 3. Find things the way a user does

Query by role, then label, then visible text. Use `data-testid` only when nothing else works. The project uses Vue Test Utils, which has no role query of its own, so select on the element's role or attribute and on its text. Adding Testing Library for `getByRole` is a separate decision.

```ts
// Do
wrapper.findAll('button').find((b) => b.text() === 'Try again')
wrapper.find('[role="alert"]')

// Don't
wrapper.find('.mt-6.h-11')
wrapper.find('button:nth-child(2)')
```

### 4. Assert what comes out, not how it works

Check rendered output, emitted events and calls at the boundary. Never read `wrapper.vm`, refs or private state, and don't assert class names. A test that mirrors the implementation breaks on a harmless refactor and passes when the wiring is broken.

```ts
// Do
await wrapper.find('button').trigger('click')
expect(wrapper.emitted('signOut')).toHaveLength(1)

// Don't
expect(wrapper.vm.isOpen).toBe(false)
```

### 5. Mount the real thing

Use `mount` with the real child components. Stub a child only when it is heavy or irrelevant to the behaviour. Don't use shallow mounting by default, because it hides the wiring the test is meant to check.

### 6. Fake the clock for delays

Autosave pauses, retries and the 300 ms loading delay use fake timers, so the test is fast and exact.

```ts
beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

it('shows the placeholder only after 300 ms', async () => {
  const wrapper = mount(PageLoading, { props: { title: 'Approvals', what: 'approvals' }, global })
  await vi.advanceTimersByTimeAsync(299)
  expect(wrapper.find('[role="status"]').exists()).toBe(false)
  await vi.advanceTimersByTimeAsync(1)
  expect(wrapper.find('[role="status"]').exists()).toBe(true)
})
```

### 7. Mock at the boundary, and only there

The boundary is the network. Prefer real code, then a simple fake, and mock only what can't be checked another way. Test a Pinia store with a real store, and a component with a testing store when it needs one. Don't mock a module just to count how often it was called.

Mock Service Worker is the usual way to fake the network, because a wrong request fails the test. It is not a dependency yet. Adding it is its own change.

## What not to test

- Types, constants and one-line pass-throughs.
- Behaviour of a library (Vue, Vue Router, Nuxt UI, Pinia).
- Whole-component snapshots. They record bugs as well as correct output, and nobody reads them.
- Static copy and layout. The approved screenshots in `mockup/approved/` and the end-of-slice screenshot comparison cover wording and layout. A test covers copy only when the text carries behaviour, such as an error message that depends on the input.
- A state the types already rule out.

## End to end, accessibility and visual checks

- Cover only the key journeys. Push every other check down a layer. If an end-to-end test repeats a lower-level one, delete it.
- Use user-facing locators, web-first assertions and isolated tests. Stub third-party services.
- Run at a phone project and a desktop project (375x812 and 1280x800).
- Run axe for the WCAG A and AA rules in the end-to-end suite. It finds many problems but not all, and doesn't replace a manual check.
- Screenshot baselines depend on the operating system and browser, so make them on the CI machine only.

## Coverage

There is no coverage target. Use the report to find code nobody has tested, not as a score. A required percentage is easy to meet with tests that check nothing.

## Reviewing tests written by a tool

AI tools write too many tests. Published experience reports describe tests that check the implementation's output against itself, and tests that lock in a bug. Read each new test with the 3 questions above and look for these.

- It repeats another test with a different name.
- It asserts something the code obviously does, such as that a prop appears in the output.
- It changes whenever the code is refactored.
- It could be a row in an existing table.
- It was changed together with the code so that it passes.

## Where tests live

| What | Where | Run with |
|---|---|---|
| Unit tests | `name.test.ts` beside the code | `pnpm test` |
| Component tests | `Name.component.test.ts` beside the component | `pnpm test`, or `pnpm test:components` for these only |
| End-to-end tests | `web/e2e/` | `pnpm test:e2e` |

Tests for formatters, hour calculations, validation and the save queue are written before the code (`.claude/skills/ui-e2e/references/standards.md`). Everything else gets tests alongside the code.

## Where this comes from

Sources were opened by the research for this guide. Where one could not be checked, it is listed below the table and not relied on.

| Source | What this guide takes from it |
|---|---|
| [Vue testing guide](https://vuejs.org/guide/scaling-up/testing.html) | Test the public interface, don't mock child components, don't rely only on snapshots, move hard logic into a tested function |
| [Software Engineering at Google, ch. 11](https://abseil.io/resources/swe-book/html/ch11.html), [12](https://abseil.io/resources/swe-book/html/ch12.html) and [13](https://abseil.io/resources/swe-book/html/ch13.html) | Test size and scope, one behaviour per test, no logic in tests, prefer real implementations over mocks, coverage only shows that a line ran |
| [The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html) | Push each test as low as it can go, delete high-level tests that duplicate lower ones |
| [Test coverage (Fowler)](https://martinfowler.com/bliki/TestCoverage.html), [Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html) | No coverage target, mock-heavy tests couple to the implementation |
| [The Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications), [Testing implementation details](https://kentcdodds.com/blog/testing-implementation-details), [Stop mocking fetch](https://kentcdodds.com/blog/stop-mocking-fetch) | Mostly integration-style tests, assert behaviour, mock the network |
| [Testing Library queries](https://testing-library.com/docs/queries/about/) | Query by role, label and text, test id last |
| [Vue Test Utils](https://test-utils.vuejs.org/guide/advanced/stubs-shallow-mount) | Prefer `mount`, stub only some children, assert with `emitted()` |
| [GitLab front-end testing guide](https://docs.gitlab.com/development/testing_guide/frontend_testing/) | Test the template and not `wrapper.vm`, don't test library internals, snapshot risks |
| [Vitest](https://vitest.dev/api/), [timers](https://vitest.dev/guide/mocking/timers) and [Pinia testing](https://pinia.vuejs.org/cookbook/testing.html) | `it.each` and its titles, fake timers, real store versus testing store |
| [Playwright best practices](https://playwright.dev/docs/best-practices), [accessibility](https://playwright.dev/docs/accessibility-testing) and [screenshots](https://playwright.dev/docs/test-snapshots) | User-facing locators, web-first assertions, isolation, axe limits, baselines per environment |
| [TDD in the agent loop](https://martinfowler.com/articles/exploring-gen-ai/tdd-in-the-agent-loop.html) | Agents write tests that check the implementation against itself. A small sample |

Project decisions with no published source behind them: not testing static copy, not mixing different behaviours into one parameterised table, and no coverage percentage for this app. Not checked: Google Testing Blog posts on end-to-end tests, change-detector tests and coverage, which did not load, and any Google guidance on parameterised tests, which was not found.
