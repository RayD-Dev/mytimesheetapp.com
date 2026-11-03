# Upstream skills

Forty-two skills in `.claude/skills/` are copies of skills published in public GitHub repos (all MIT licensed; each keeps its `LICENSE`). This folder records where each one came from and keeps them up to date on our terms.

- `manifest.json` lists, for every skill, the commit it was copied from (`pins`), which upstream file became which local file, and any local change.
- `patches/` holds our local changes as unified diffs.
- `sync.mjs` checks and updates skills. It needs Node 20+ and git, nothing else.

## Policy

Updates are pinned and reviewed. Nothing follows upstream automatically, and a skill never changes without someone reading what changed first.

1. Run `node .claude/skills/_upstream/sync.mjs check`.
2. Read the diff for each skill that reports `update available`.
3. Pull one skill at a time with `node .claude/skills/_upstream/sync.mjs pull <skill>`.
4. Look at the result with `git diff`, then commit it.

Never pull a skill whose diff you have not read. Never edit a vendored file directly: `check` reports that as `DRIFT`, and `pull` refuses to overwrite it.

## Local changes

A local change is a patch in `patches/`, named in the skill's `patch` field, with a plain-English reason in `localChanges`. The local file is always the upstream file at the pinned commit with that patch applied, so `check` can tell an intended change from a stray edit. Patches use `a/SKILL.md` and `b/SKILL.md` as labels, with the path relative to the skill folder.

When upstream changes the lines a patch touches, `pull` stops, changes nothing, and names the hunk that no longer applies. To refresh the patch:

1. Note the commit `pull` reported. Download the new upstream file at that commit, for example
   `curl -sL https://raw.githubusercontent.com/<owner>/<repo>/<sha>/<upstream path> -o upstream.md`.
   The upstream path and repo are in `manifest.json`.
2. Copy it to `local.md` and make the local change again in the copy.
3. Recreate the patch:
   `diff -u --strip-trailing-cr --label a/SKILL.md --label b/SKILL.md upstream.md local.md > .claude/skills/_upstream/patches/<skill>.patch`
4. Run `pull <skill> --to <sha>` again, using the same commit, then review and commit.

To add a local change to a skill that has none, make the same kind of patch against the pinned upstream file and add `patch` and `localChanges` to its entry in `manifest.json`.

## Vendored skills

| Skill | Source | Local change |
| --- | --- | --- |
| `design-taste-frontend` | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | Manual-only (`disable-model-invocation`): a marketing-page skill that would otherwise trigger on product UI work. Our `ui-*` skills read named sections of it. |
| `redesign-existing-projects` | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | Manual-only (`disable-model-invocation`): its upgrade techniques (grain, stagger, springs) contradict `ui-motion` and `DESIGN.md`. `ui-audit` reads its audit checklist. |
| `emil-design-eng` | [emilkowalski/skill](https://github.com/emilkowalski/skill) | None |
| `animate` | [emilkowalski/skill](https://github.com/emilkowalski/skill) | None |
| `review-animations` | [emilkowalski/skill](https://github.com/emilkowalski/skill) | None |
| `improve-animations` | [emilkowalski/skill](https://github.com/emilkowalski/skill) | None |
| `find-animation-opportunities` | [emilkowalski/skill](https://github.com/emilkowalski/skill) | None |
| `animation-performance` | [emilkowalski/skill](https://github.com/emilkowalski/skill) | None |
| `animation-vocabulary` | [emilkowalski/skill](https://github.com/emilkowalski/skill) | None |
| `mobile-native` | [emilkowalski/skill](https://github.com/emilkowalski/skill) | None |
| `break-ui` | [emilkowalski/skill](https://github.com/emilkowalski/skill) | None |
| `web-design-guidelines` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills) and [vercel-labs/web-interface-guidelines](https://github.com/vercel-labs/web-interface-guidelines) | Reads the pinned `command.md` instead of fetching the rules from the web on every review. Upstream `AGENTS.md` is stored as `build-rules.md` so Claude Code doesn't auto-load it whenever a file in this folder is read. |
| `ponytail` | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) | Manual-only (`disable-model-invocation`): read when a brief or the `ui-e2e` skill names it. |
| `ponytail-review` | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) | Manual-only (`disable-model-invocation`): read when a brief or the `ui-e2e` skill names it. |
| `ponytail-audit` | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) | Manual-only (`disable-model-invocation`): read when a brief or the `ui-e2e` skill names it. |
| `ponytail-debt` | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) | Manual-only (`disable-model-invocation`): read when a brief or the `ui-e2e` skill names it. |
| `typescript-best-practices` | [backnotprop/pstack](https://github.com/backnotprop/pstack) | None (upstream already sets `disable-model-invocation`) |
| `tdd` | [backnotprop/pstack](https://github.com/backnotprop/pstack) | None (upstream already sets `disable-model-invocation`) |
| `blast-radius` | [backnotprop/pstack](https://github.com/backnotprop/pstack) | None (upstream already sets `disable-model-invocation`) |
| `interrogate` | [backnotprop/pstack](https://github.com/backnotprop/pstack) | None (upstream already sets `disable-model-invocation`) |
| `how` | [backnotprop/pstack](https://github.com/backnotprop/pstack) | None (upstream already sets `disable-model-invocation`) |
| `why` | [backnotprop/pstack](https://github.com/backnotprop/pstack) | None (upstream already sets `disable-model-invocation`) |
| `architect` | [backnotprop/pstack](https://github.com/backnotprop/pstack) | None (upstream already sets `disable-model-invocation`) |
| `arena` | [backnotprop/pstack](https://github.com/backnotprop/pstack) | None (upstream already sets `disable-model-invocation`) |
| `unslop` | [backnotprop/pstack](https://github.com/backnotprop/pstack) | None (upstream already sets `disable-model-invocation`) |
| `technical-writing` | [backnotprop/pstack](https://github.com/backnotprop/pstack) | None (upstream already sets `disable-model-invocation`) |
| `reflect` | [backnotprop/pstack](https://github.com/backnotprop/pstack) | None (upstream already sets `disable-model-invocation`) |
| `correct` | [backnotprop/pstack](https://github.com/backnotprop/pstack) | None (upstream already sets `disable-model-invocation`) |
| `ketchup` | [backnotprop/pstack](https://github.com/backnotprop/pstack) | None (upstream already sets `disable-model-invocation`) |
| `principle-prove-it-works` | [backnotprop/pstack](https://github.com/backnotprop/pstack) | None (upstream already sets `disable-model-invocation`) |
| `principle-test-behavior-not-implementation` | [backnotprop/pstack](https://github.com/backnotprop/pstack) | None (upstream already sets `disable-model-invocation`) |
| `principle-boundary-discipline` | [backnotprop/pstack](https://github.com/backnotprop/pstack) | None (upstream already sets `disable-model-invocation`) |
| `principle-type-system-discipline` | [backnotprop/pstack](https://github.com/backnotprop/pstack) | None (upstream already sets `disable-model-invocation`) |
| `principle-fix-root-causes` | [backnotprop/pstack](https://github.com/backnotprop/pstack) | None (upstream already sets `disable-model-invocation`) |
| `principle-guard-the-context-window` | [backnotprop/pstack](https://github.com/backnotprop/pstack) | None (upstream already sets `disable-model-invocation`) |
| `principle-laziness-protocol` | [backnotprop/pstack](https://github.com/backnotprop/pstack) | None (upstream already sets `disable-model-invocation`) |
| `principle-subtract-before-you-add` | [backnotprop/pstack](https://github.com/backnotprop/pstack) | None (upstream already sets `disable-model-invocation`) |
| `principle-sequence-verifiable-units` | [backnotprop/pstack](https://github.com/backnotprop/pstack) | None (upstream already sets `disable-model-invocation`) |
| `principle-model-the-domain` | [backnotprop/pstack](https://github.com/backnotprop/pstack) | None (upstream already sets `disable-model-invocation`) |
| `principle-minimize-reader-load` | [backnotprop/pstack](https://github.com/backnotprop/pstack) | None (upstream already sets `disable-model-invocation`) |
| `principle-attack-the-premise` | [backnotprop/pstack](https://github.com/backnotprop/pstack) | None (upstream already sets `disable-model-invocation`) |
| `principle-encode-lessons-in-structure` | [backnotprop/pstack](https://github.com/backnotprop/pstack) | None (upstream already sets `disable-model-invocation`) |

Only skill text is vendored: `SKILL.md`, any `references/` files and the `LICENSE`. Ponytail's hooks and band, and pstack's scripts, `poteto-mode`, `setup-pstack`, `no-comments`, `swarm` and `benny` are deliberately not vendored. None of the chosen skills has a `scripts/` folder. Both new repos are MIT licensed. They are manual-only, so briefs and the main session name them explicitly.

## Commands

Run them from the repo root.

```
node .claude/skills/_upstream/sync.mjs list
node .claude/skills/_upstream/sync.mjs check [skill ...]
node .claude/skills/_upstream/sync.mjs pull <skill> [--to <sha>] [--force]
```

- `list` shows each skill, the commit it is pinned to and whether it carries a patch. It needs no network.
- `check` does three things for each skill (all of them by default):
  - **Drift:** compares every local file with the pinned upstream file plus its patch, and shows any difference.
  - **Updates:** fetches the latest default-branch commit and prints a diff of each mapped file from the pin to the latest.
  - **Folder changes:** lists files added to or removed from the upstream skill folder that the manifest doesn't map.

  It ends with one status line per skill: `up to date`, `update available` or `DRIFT`. Exit code 0 means everything is up to date, 1 means updates are available, 2 means drift or an error.
- `pull <skill>` writes that skill's files from upstream (the latest commit, or `--to <sha>`), re-applies its patch and moves its pins in `manifest.json`. It builds everything in memory first, so if the patch no longer applies, nothing on disk changes. It refuses to overwrite drifted files unless you pass `--force`. For `web-design-guidelines`, which has two sources, give the commit as `--to <source>=<sha>`; a source you leave out goes to its latest commit.

Behind the scenes, `sync.mjs` fetches each repo into a temporary directory with no working tree (one upstream repo has paths too long for Windows), reads files as text with `git show`, and deletes the directory afterwards. It never runs or imports anything from upstream. Line endings are normalised to LF before comparing, so a CRLF copy of an unchanged file is not drift; files that `pull` rewrites are written with LF.
