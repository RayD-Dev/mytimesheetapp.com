# <NNN> <Title>: plan

**Brief:** `./brief.md` (approved <DD/MM/YYYY>)
**Branch:** `<slice-branch>`
**Status:** Draft | Approved <DD/MM/YYYY> | Done <DD/MM/YYYY>

## Decisions this plan depends on

| Decision | Choice | Recorded in |
|---|---|---|
| API client | <choice> | FE design doc decision log, <date> |

## API contract

| Endpoint | Fields used | Notes |
|---|---|---|

Types and runtime schemas are generated from the OpenAPI spec. If the spec doesn't exist yet, this table is the request to the back-end plan.

## Tasks

| # | Task | Agent | Owns files | Covers | Status |
|---|---|---|---|---|---|
| 1 | <name> | implementer | `src/...` | AC-1, AC-2 | Todo |

Tasks that share no files can run in parallel.

### Task 1: <name>

- **Read first:** <spec, standards, existing files to imitate>
- **Do:** <what to build, with the decisions already made>
- **Tests first:** <the tests to write before the code, named from the acceptance criteria>
- **Check:** `<exact command>`
- **Done when:** <checkable result>
- **Don't:** <boundaries: files not to touch, no new dependencies, nothing beyond this task>

## Future impact and seams

| Roadmap item | Seam left |
|---|---|

## End-of-slice checks

<The gates from `standards.md` with exact commands.>

## Risks

<What could go wrong and the fallback.>
