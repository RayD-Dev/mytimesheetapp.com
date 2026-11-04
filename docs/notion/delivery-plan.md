<!-- Read-only copy of M1 (MVP) Delivery Plan: https://app.notion.com/p/40e771bd4d4381348afbc4f4257c51f4
     Notion is the master; comment and edit there, then run docs-sync.
     Notion last edited: 2026-11-04T03:50:51.641Z · Synced: 04/11/2026 -->
<content>
M1 (MVP) is delivered in 4 parts, M1.1 to M1.4. Each part is usable by someone and comes with its own API and screens (AD-16). Older pages and commits call these parts slice 1 to slice 4.

| Part | Was called | What it delivers | Status |
| --- | --- | --- | --- |
| M1.1 | Slice 1 | Profile signature, My timesheet and submit | Front end in progress |
| M1.2 | Slice 2 | Approvals | Not started |
| M1.3 | Slice 3 | Admin page, business name and logo | Not started |
| M1.4 | Slice 4 | PDF | Not started |

The milestones after this stay as they are in the <mention url="https://app.notion.com/p/3f5771bd4d438156a93ec42b3548821d" /> roadmap: M2, M3, M4 and Later. Until M1.3 exists, people and the pay schedule are set up in Keycloak and configuration.

## M1.1 front end

Approved 03/11/2026. The front end is built against a mock API generated from the OpenAPI contract, and the real back end follows the same contract in its own plan. So M1.1 does not save real data until that back end exists.

The full plan lives in the repo, and this page is the summary.

- [Plan](https://github.com/RayD-Dev/mytimesheetapp.com/blob/main/.claude/plans/work/002-slice-1-front-end/plan.md) and [brief](https://github.com/RayD-Dev/mytimesheetapp.com/blob/main/.claude/plans/work/002-slice-1-front-end/brief.md) on <code>main</code>, available once [PR 14](https://github.com/RayD-Dev/mytimesheetapp.com/pull/14) merges
- [Plan](https://github.com/RayD-Dev/mytimesheetapp.com/blob/docs/m1-part-names/.claude/plans/work/002-slice-1-front-end/plan.md) and [brief](https://github.com/RayD-Dev/mytimesheetapp.com/blob/docs/m1-part-names/.claude/plans/work/002-slice-1-front-end/brief.md) on the review branch until then

### Tasks

Status as of 04/11/2026. The [open pull requests](https://github.com/RayD-Dev/mytimesheetapp.com/pulls) show the live state.

| Task | What | Status |
| --- | --- | --- |
| 1 | OpenAPI contract | In review, [PR 4](https://github.com/RayD-Dev/mytimesheetapp.com/pull/4) |
| 2 | Scaffold <code>web/</code> | In review, [PR 5](https://github.com/RayD-Dev/mytimesheetapp.com/pull/5) |
| 2b | Design tokens and fonts | In review, [PR 12](https://github.com/RayD-Dev/mytimesheetapp.com/pull/12) |
| 3 | Generated API client and wrapper | In review, [PR 11](https://github.com/RayD-Dev/mytimesheetapp.com/pull/11), sign out as a form in [PR 13](https://github.com/RayD-Dev/mytimesheetapp.com/pull/13) |
| 4 | Mock API with seeded states | Waiting for PR 11 to merge |
| 5 | Time, hours and validation modules | In review, [PR 7](https://github.com/RayD-Dev/mytimesheetapp.com/pull/7) |
| 6 | Session store, route guards, idle warning, session-ended dialog | Waiting for mock-up round R9 |
| 7 | Top bar, not found, no access, loading and failed states | In review, [PR 8](https://github.com/RayD-Dev/mytimesheetapp.com/pull/8) |
| 8 | Save queue | Waiting for PR 11 to merge |
| 9 | 12-hour time input | In review, [PR 6](https://github.com/RayD-Dev/mytimesheetapp.com/pull/6) |
| 10 | My timesheet: load, header and read-only states | Waiting for mock-up round R9 |
| 11 | My timesheet: day rows, preview, errors and warnings | Waiting for mock-up round R9 |
| 12 | My timesheet: save wiring and save states | Waiting for mock-up round R9 |
| 13 | My timesheet: Clear and the Submit button | Waiting for mock-up round R9 |
| 14 | Submit review and submit | Waiting for mock-up round R9 |
| 15 | Signature component | In review, [PR 9](https://github.com/RayD-Dev/mytimesheetapp.com/pull/9) |
| 16 | Profile page and Change password | Waiting for mock-up round R9 |
| 17 | Keycloak base theme, sign-in states, local Keycloak | Draft, [PR 10](https://github.com/RayD-Dev/mytimesheetapp.com/pull/10), not yet run against Keycloak |
| 18 | Keycloak password and reset pages | Waiting for mock-up round R9 |
| 19 | End-to-end, screenshot and accessibility suite | Not started |
</content>
