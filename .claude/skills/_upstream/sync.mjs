#!/usr/bin/env node
// Keeps the vendored ("upstream") skills in .claude/skills/ pinned, checked and updatable.
// See README.md in this folder. Node built-ins and git only.
//
//   node sync.mjs list
//   node sync.mjs check [skill ...]
//   node sync.mjs pull <skill> [--to <sha>] [--force]
//
// Nothing fetched from an upstream repo is ever executed or imported: files are read as text
// with `git show` from a bare, working-tree-less repo in a temp directory.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = path.resolve(HERE, '..');
const MANIFEST_PATH = path.join(HERE, 'manifest.json');

const FETCH_TIMEOUT_MS = 180_000;
const SHA_RE = /^[0-9a-f]{40}$/;
const SAFE_REF_RE = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;
const DRIFT_DIFF_LINES = 60;

// ---------------------------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------------------------

/** An expected failure (bad input, network, patch no longer applies): message only, no stack. */
class UserError extends Error {}

const lf = (text) => text.replace(/\r\n/g, '\n');
const short = (sha) => sha.slice(0, 7);
const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const escapeRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const firstLines = (text, n = 3) =>
  String(text).trim().split('\n').map((l) => l.trim()).filter(Boolean).slice(0, n).join(' | ');

const tempDirs = new Set();

function makeTempDir(prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.add(dir);
  return dir;
}

function removeTempDir(dir) {
  tempDirs.delete(dir);
  try {
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  } catch {
    // Best effort: a leftover temp dir is harmless.
  }
}

function cleanupTempDirs() {
  for (const dir of [...tempDirs]) removeTempDir(dir);
}

process.on('exit', cleanupTempDirs);
process.on('SIGINT', () => {
  cleanupTempDirs();
  process.exit(130);
});

const GIT_ENV = {
  ...process.env,
  GIT_TERMINAL_PROMPT: '0', // never wait for credentials
  GIT_ALLOW_PROTOCOL: 'https', // only ever talk https to upstream
  LC_ALL: 'C', // stable git messages for the few we parse
  LANGUAGE: 'C',
};

/** Run git without a shell. Returns stdout as a Buffer. Throws GitError on failure. */
function git(args, { cwd, input, okStatus = [], timeout } = {}) {
  try {
    return execFileSync('git', ['-c', 'core.autocrlf=false', '-c', 'core.safecrlf=false', ...args], {
      cwd,
      input,
      env: GIT_ENV,
      stdio: ['pipe', 'pipe', 'pipe'],
      maxBuffer: 512 * 1024 * 1024,
      timeout,
      windowsHide: true,
    });
  } catch (error) {
    if (error.code === 'ENOENT') throw new UserError('git was not found on PATH. Install git and try again.');
    if (okStatus.includes(error.status)) return error.stdout;
    const detail = error.code === 'ETIMEDOUT' ? 'timed out' : String(error.stderr ?? error.message);
    throw new GitError(`git ${args[0]} failed: ${firstLines(detail)}`, String(error.stderr ?? ''));
  }
}

class GitError extends Error {
  constructor(message, stderr) {
    super(message);
    this.stderr = stderr;
  }
}

function safeRelativePath(p, what) {
  const normal = path.posix.normalize(String(p).replace(/\\/g, '/'));
  if (normal.startsWith('/') || normal === '..' || normal.startsWith('../') || /^[A-Za-z]:/.test(normal)) {
    throw new UserError(`manifest: ${what} must be a relative path inside the skill, got "${p}"`);
  }
  return normal;
}

// ---------------------------------------------------------------------------------------------
// Manifest
// ---------------------------------------------------------------------------------------------

function readManifestText() {
  try {
    return lf(fs.readFileSync(MANIFEST_PATH, 'utf8'));
  } catch (error) {
    throw new UserError(`cannot read ${MANIFEST_PATH}: ${error.message}`);
  }
}

function loadManifest() {
  const text = readManifestText();
  let manifest;
  try {
    manifest = JSON.parse(text);
  } catch (error) {
    throw new UserError(`manifest.json is not valid JSON: ${error.message}`);
  }
  validateManifest(manifest);
  return { manifest, text };
}

function validateManifest(manifest) {
  const sources = manifest.sources ?? {};
  for (const [name, source] of Object.entries(sources)) {
    if (typeof source.repo !== 'string' || !source.repo.startsWith('https://')) {
      throw new UserError(`manifest: source "${name}" needs an https:// repo URL`);
    }
  }
  for (const [name, skill] of Object.entries(manifest.skills ?? {})) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) throw new UserError(`manifest: odd skill name "${name}"`);
    for (const [source, sha] of Object.entries(skill.pins ?? {})) {
      if (!sources[source]) throw new UserError(`manifest: ${name} pins unknown source "${source}"`);
      if (!SHA_RE.test(sha)) throw new UserError(`manifest: ${name} pin for ${source} is not a full commit SHA`);
    }
    if (!skill.files?.length) throw new UserError(`manifest: ${name} has no files`);
    for (const file of skill.files) {
      safeRelativePath(file.to, `${name} file "to"`);
      safeRelativePath(file.path, `${name} file "path"`);
      if (!skill.pins?.[file.source]) {
        throw new UserError(`manifest: ${name} file ${file.to} comes from "${file.source}", which has no pin`);
      }
    }
    if (skill.upstreamDir && !skill.pins?.[skill.upstreamDir.source]) {
      throw new UserError(`manifest: ${name} upstreamDir source "${skill.upstreamDir.source}" has no pin`);
    }
    if (skill.patch) safeRelativePath(skill.patch, `${name} patch`);
  }
}

function getSkill(manifest, name) {
  const skill = manifest.skills[name];
  if (!skill) {
    throw new UserError(`unknown skill "${name}". Known skills: ${Object.keys(manifest.skills).join(', ')}`);
  }
  return skill;
}

/**
 * Change a skill's pins by editing the manifest text in place, so the hand-formatted layout
 * (one-line pins and file entries) survives. Falls back to a plain 2-space rewrite if the
 * text edit cannot be verified.
 */
function manifestTextWithPins(text, manifest, skillName, newPins) {
  const expected = structuredClone(manifest);
  Object.assign(expected.skills[skillName].pins, newPins);

  const attempt = () => {
    const skillsAt = text.indexOf('"skills"');
    const keyRe = new RegExp(`"${escapeRe(skillName)}"\\s*:\\s*\\{`, 'g');
    keyRe.lastIndex = Math.max(skillsAt, 0);
    const keyMatch = keyRe.exec(text);
    if (!keyMatch) return null;
    const pinsRe = /"pins"\s*:\s*\{/g;
    pinsRe.lastIndex = keyMatch.index;
    const pinsMatch = pinsRe.exec(text);
    if (!pinsMatch) return null;
    const bodyStart = pinsMatch.index + pinsMatch[0].length;
    const bodyEnd = text.indexOf('}', bodyStart);
    if (bodyEnd === -1) return null;
    let body = text.slice(bodyStart, bodyEnd);
    for (const [source, sha] of Object.entries(newPins)) {
      const pairRe = new RegExp(`("${escapeRe(source)}"\\s*:\\s*")[^"]*(")`);
      if (!pairRe.test(body)) return null;
      body = body.replace(pairRe, (_, open, close) => `${open}${sha}${close}`);
    }
    return text.slice(0, bodyStart) + body + text.slice(bodyEnd);
  };

  const edited = attempt();
  if (edited !== null) {
    try {
      if (JSON.stringify(JSON.parse(edited)) === JSON.stringify(expected)) return { text: edited, reformatted: false };
    } catch {
      // fall through to the rewrite
    }
  }
  return { text: `${JSON.stringify(expected, null, 2)}\n`, reformatted: true };
}

// ---------------------------------------------------------------------------------------------
// Upstream repos (never checked out)
// ---------------------------------------------------------------------------------------------

class Repo {
  constructor(name, url) {
    this.name = name;
    this.url = url;
    this.dir = null;
    this.resolved = new Map(); // ref -> sha | Error
    this.texts = new Map(); // `${sha}:${path}` -> string | null
  }

  init() {
    if (this.dir) return;
    this.dir = makeTempDir(`upstream-${this.name}-`);
    git(['init', '-q'], { cwd: this.dir });
    // A named remote so the partial clone's missing blobs can be fetched on demand.
    git(['remote', 'add', 'origin', this.url], { cwd: this.dir });
  }

  /** Fetch `ref` (a SHA, branch or HEAD) and return the full commit SHA. */
  resolve(ref, depth = 1) {
    const cacheKey = `${ref}@${depth}`;
    const cached = this.resolved.get(cacheKey);
    if (cached instanceof Error) throw cached;
    if (cached) return cached;
    try {
      if (!SHA_RE.test(ref) && ref !== 'HEAD' && !SAFE_REF_RE.test(ref)) {
        throw new UserError(`"${ref}" is not a valid commit SHA or ref name`);
      }
      this.init();
      try {
        git(
          ['fetch', '--quiet', '--no-tags', '--depth', String(depth), '--filter=blob:none', 'origin', ref],
          { cwd: this.dir, timeout: FETCH_TIMEOUT_MS },
        );
      } catch (error) {
        if (error instanceof GitError) {
          throw new UserError(`could not fetch ${ref} from ${this.url} (${error.message.replace(/^git fetch failed: /, '')})`);
        }
        throw error;
      }
      const sha = git(['rev-parse', '--verify', 'FETCH_HEAD^{commit}'], { cwd: this.dir }).toString().trim();
      this.resolved.set(cacheKey, sha);
      return sha;
    } catch (error) {
      if (error instanceof UserError) this.resolved.set(cacheKey, error);
      throw error;
    }
  }

  has(commit, file) {
    return git(['ls-tree', '-z', '--name-only', commit, '--', file], { cwd: this.dir }).length > 0;
  }

  /** File contents (LF-normalised text) at a commit, or null if the file does not exist there. */
  text(commit, file) {
    const key = `${commit}:${file}`;
    if (this.texts.has(key)) return this.texts.get(key);
    let result = null;
    if (this.has(commit, file)) {
      try {
        result = lf(git(['show', `${commit}:${file}`], { cwd: this.dir, timeout: FETCH_TIMEOUT_MS }).toString('utf8'));
      } catch (error) {
        if (error instanceof GitError) throw new UserError(`could not read ${file} from ${this.name}@${short(commit)} (${error.message})`);
        throw error;
      }
    }
    this.texts.set(key, result);
    return result;
  }

  /** All file paths under `dir` at a commit. */
  listFiles(commit, dir) {
    const out = git(['ls-tree', '-r', '-z', '--name-only', commit, '--', `${dir}/`], { cwd: this.dir }).toString('utf8');
    return out.split('\0').filter(Boolean);
  }
}

class Repos {
  constructor(manifest) {
    this.manifest = manifest;
    this.byName = new Map();
  }

  get(name) {
    if (!this.byName.has(name)) this.byName.set(name, new Repo(name, this.manifest.sources[name].repo));
    return this.byName.get(name);
  }

  latest(name) {
    return this.get(name).resolve('HEAD');
  }
}

// ---------------------------------------------------------------------------------------------
// Building "upstream plus patch" for a skill at given commits
// ---------------------------------------------------------------------------------------------

class PatchError extends UserError {}

/** Map local file name -> upstream text at the given commits. Throws if a mapped file is missing. */
function upstreamFiles(skillName, skill, repos, commits) {
  const files = new Map();
  for (const file of skill.files) {
    const commit = commits[file.source];
    const text = repos.get(file.source).text(commit, file.path);
    if (text === null) {
      throw new UserError(
        `${skillName}: ${file.path} does not exist in ${file.source}@${short(commit)}. The manifest needs updating by hand.`,
      );
    }
    files.set(file.to, text);
  }
  return files;
}

function readPatch(skill) {
  const patchPath = path.join(HERE, skill.patch);
  try {
    return lf(fs.readFileSync(patchPath, 'utf8'));
  } catch (error) {
    throw new UserError(`cannot read patch ${skill.patch}: ${error.message}`);
  }
}

function writeTree(dir, files) {
  for (const [name, text] of files) {
    const target = path.join(dir, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, text);
  }
}

/** Apply the skill's patch (if any) to upstream files. Returns a new Map. Throws PatchError. */
function applyPatch(skillName, skill, files, describeTarget) {
  if (!skill.patch) return files;
  const patchText = readPatch(skill);
  const work = makeTempDir('upstream-patch-');
  try {
    writeTree(work, files);
    try {
      git(['apply', '--whitespace=nowarn', '-'], { cwd: work, input: patchText });
    } catch (error) {
      if (!(error instanceof GitError)) throw error;
      throw new PatchError(
        `${skill.patch} no longer applies to ${describeTarget}.\n${explainPatchFailure(work, patchText, error.stderr)}`,
      );
    }
    const patched = new Map();
    for (const name of files.keys()) patched.set(name, lf(fs.readFileSync(path.join(work, name), 'utf8')));
    return patched;
  } finally {
    removeTempDir(work);
  }
}

/** Split a unified diff into sections of {file, header, hunks}. Each hunk is an array of lines. */
function parsePatch(text) {
  const lines = text.split('\n');
  if (lines.at(-1) === '') lines.pop();
  const sections = [];
  let current = null;
  let i = 0;
  while (i < lines.length) {
    const hunkHead = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/.exec(lines[i]);
    if (hunkHead && current) {
      let oldLeft = hunkHead[2] === undefined ? 1 : Number(hunkHead[2]);
      let newLeft = hunkHead[4] === undefined ? 1 : Number(hunkHead[4]);
      const body = [lines[i++]];
      while (i < lines.length && (oldLeft > 0 || newLeft > 0 || lines[i].startsWith('\\'))) {
        const line = lines[i++];
        body.push(line);
        if (line.startsWith('\\')) continue;
        if (line === '' || line[0] === ' ') {
          oldLeft--;
          newLeft--;
        } else if (line[0] === '-') oldLeft--;
        else if (line[0] === '+') newLeft--;
      }
      current.hunks.push(body);
    } else {
      if (!current || current.hunks.length > 0) {
        current = { file: null, header: [], hunks: [] };
        sections.push(current);
      }
      current.header.push(lines[i]);
      const plus = /^\+\+\+ (?:b\/)?(.+?)\s*$/.exec(lines[i]);
      if (plus) current.file = plus[1];
      i++;
    }
  }
  return sections;
}

/** Say which hunks fail, by trying each one alone against the files in `work`. */
function explainPatchFailure(work, patchText, gitStderr) {
  const out = [];
  try {
    const sections = parsePatch(patchText);
    for (const section of sections) {
      section.hunks.forEach((hunk, index) => {
        const mini = `${[...section.header, ...hunk].join('\n')}\n`;
        try {
          git(['apply', '--check', '--whitespace=nowarn', '-'], { cwd: work, input: mini });
        } catch {
          out.push(`  failed: hunk ${index + 1} of ${section.hunks.length} in ${section.file ?? '(unknown file)'}  ${hunk[0]}`);
        }
      });
    }
  } catch {
    // Diagnostics only; the git message below still says what happened.
  }
  if (out.length === 0) out.push('  failed: (could not pin the failure to one hunk)');
  out.push(`  git said: ${firstLines(gitStderr, 4)}`);
  return out.join('\n');
}

function readLocal(skillName, name) {
  try {
    return lf(fs.readFileSync(path.join(SKILLS_DIR, skillName, name), 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw new UserError(`cannot read ${skillName}/${name}: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------------------------
// Diffs
// ---------------------------------------------------------------------------------------------

/** Unified diff of two texts (either may be null for a missing file), headed `a/<label>` / `b/<label>`. */
function unifiedDiff(label, before, after) {
  const dir = makeTempDir('upstream-diff-');
  try {
    const aPath = path.join(dir, 'a', ...label.split('/'));
    const bPath = path.join(dir, 'b', ...label.split('/'));
    if (before !== null) {
      fs.mkdirSync(path.dirname(aPath), { recursive: true });
      fs.writeFileSync(aPath, before);
    }
    if (after !== null) {
      fs.mkdirSync(path.dirname(bPath), { recursive: true });
      fs.writeFileSync(bPath, after);
    }
    const left = before === null ? '/dev/null' : `a/${label}`;
    const right = after === null ? '/dev/null' : `b/${label}`;
    const out = git(['diff', '--no-index', '--no-color', '--no-ext-diff', '--no-prefix', '--', left, right], {
      cwd: dir,
      okStatus: [1],
    }).toString('utf8');
    const lines = lf(out).split('\n');
    const start = lines.findIndex((l) => l.startsWith('--- '));
    return (start === -1 ? lines : lines.slice(start)).join('\n').trimEnd();
  } finally {
    removeTempDir(dir);
  }
}

function indent(text, spaces = 4) {
  const pad = ' '.repeat(spaces);
  return text.split('\n').map((l) => (l ? pad + l : l)).join('\n');
}

// ---------------------------------------------------------------------------------------------
// Drift: does each local file equal pinned upstream + patch?
// ---------------------------------------------------------------------------------------------

/** Returns { expected: Map|null, problems: [{to, kind, expected, actual}], error: string|null }. */
function findDrift(skillName, skill, repos, commits) {
  let expected;
  try {
    const raw = upstreamFiles(skillName, skill, repos, commits);
    const describe = Object.entries(commits).map(([s, c]) => `${s}@${short(c)}`).join(', ');
    expected = applyPatch(skillName, skill, raw, describe);
  } catch (error) {
    if (error instanceof UserError) return { expected: null, problems: [], error: error.message };
    throw error;
  }
  const problems = [];
  for (const [to, text] of expected) {
    const actual = readLocal(skillName, to);
    if (actual === null) problems.push({ to, kind: 'missing', expected: text, actual });
    else if (actual !== text) problems.push({ to, kind: 'differs', expected: text, actual });
  }
  return { expected, problems, error: null };
}

function localOnlyFiles(skillName, skill) {
  const root = path.join(SKILLS_DIR, skillName);
  const mapped = new Set(skill.files.map((f) => path.posix.normalize(f.to)));
  const found = [];
  const walk = (dir, rel) => {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const relPath = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isDirectory()) walk(path.join(dir, entry.name), relPath);
      else if (!mapped.has(relPath)) found.push(relPath);
    }
  };
  walk(root, '');
  return found;
}

// ---------------------------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------------------------

function cmdList() {
  const { manifest } = loadManifest();
  const rows = Object.entries(manifest.skills).map(([name, skill]) => [
    name,
    Object.entries(skill.pins).map(([source, sha]) => `${source}@${short(sha)}`).join(', '),
    skill.patch ? 'patched' : '',
  ]);
  const header = ['skill', 'source@pin', 'local change'];
  const widths = header.map((h, c) => Math.max(h.length, ...rows.map((r) => r[c].length)));
  const line = (cells) => cells.map((cell, c) => cell.padEnd(widths[c])).join('  ').trimEnd();
  console.log(line(header));
  console.log(line(widths.map((w) => '-'.repeat(w))));
  for (const row of rows) console.log(line(row));
  return 0;
}

function cmdCheck(names) {
  const { manifest } = loadManifest();
  const selected = names.length ? names : Object.keys(manifest.skills);
  for (const name of selected) getSkill(manifest, name); // fail early on typos
  const repos = new Repos(manifest);
  const results = [];

  for (const name of selected) {
    const skill = manifest.skills[name];
    const result = { name, status: 'up to date', detail: '' };
    results.push(result);
    const sections = [];
    try {
      const pinned = {};
      for (const [source, sha] of Object.entries(skill.pins)) {
        process.stderr.write(`  ${name}: fetching ${source}@${short(sha)}\n`);
        pinned[source] = repos.get(source).resolve(sha);
      }

      // (a) Drift
      const drift = findDrift(name, skill, repos, pinned);
      if (drift.error) {
        result.status = 'DRIFT';
        result.detail = 'pinned upstream plus patch could not be built';
        sections.push(`${drift.error}`);
      } else if (drift.problems.length) {
        result.status = 'DRIFT';
        result.detail = drift.problems.map((p) => p.to).join(', ');
        for (const p of drift.problems) {
          if (p.kind === 'missing') {
            sections.push(`DRIFT: ${p.to} is missing locally`);
            continue;
          }
          const diff = unifiedDiff(p.to, p.expected, p.actual).split('\n');
          const shown = diff.slice(0, DRIFT_DIFF_LINES).join('\n');
          const more = diff.length > DRIFT_DIFF_LINES ? `\n... (${diff.length - DRIFT_DIFF_LINES} more lines)` : '';
          sections.push(
            `DRIFT: ${p.to} differs from pinned upstream${skill.patch ? ' plus patch' : ''} (pinned+patch -> local):\n${indent(shown + more)}\n` +
              '  Local edits belong in a patch (see README.md), or revert the file.',
          );
        }
      }
      const extras = localOnlyFiles(name, skill);
      if (extras.length) sections.push(`note: local files not in the manifest: ${extras.join(', ')}`);

      // (b) Updates
      const latest = {};
      for (const source of Object.keys(skill.pins)) {
        process.stderr.write(`  ${name}: fetching ${source} HEAD\n`);
        latest[source] = repos.latest(source);
      }
      const moved = Object.keys(skill.pins).filter((s) => latest[s] !== pinned[s]);
      const changedFiles = [];
      for (const file of skill.files) {
        if (latest[file.source] === pinned[file.source]) continue;
        const repo = repos.get(file.source);
        const before = repo.text(pinned[file.source], file.path);
        const after = repo.text(latest[file.source], file.path);
        if (before === after) continue;
        changedFiles.push(file.to);
        const verb = after === null ? 'removed upstream' : before === null ? 'added upstream' : 'changed upstream';
        sections.push(
          `${file.to} ${verb} (${file.source} ${short(pinned[file.source])} -> ${short(latest[file.source])}):\n${indent(unifiedDiff(file.path, before, after))}`,
        );
      }

      // (c) Folder changes
      const folderNotes = [];
      const dirSpec = skill.upstreamDir;
      if (dirSpec && latest[dirSpec.source] !== pinned[dirSpec.source]) {
        const repo = repos.get(dirSpec.source);
        const before = new Set(repo.listFiles(pinned[dirSpec.source], dirSpec.path));
        const after = new Set(repo.listFiles(latest[dirSpec.source], dirSpec.path));
        const inManifest = new Set(skill.files.filter((f) => f.source === dirSpec.source).map((f) => f.path));
        for (const f of [...after].filter((f) => !before.has(f) && !inManifest.has(f))) {
          folderNotes.push(`added upstream, not vendored: ${f}`);
        }
        for (const f of [...before].filter((f) => !after.has(f) && !inManifest.has(f))) {
          folderNotes.push(`removed upstream: ${f}`);
        }
      }
      if (folderNotes.length) {
        sections.push(`folder changes in ${dirSpec.source}:${dirSpec.path}/\n${folderNotes.map((n) => `  ${n}`).join('\n')}`);
      }

      if (result.status !== 'DRIFT' && (changedFiles.length || folderNotes.length)) {
        result.status = 'update available';
        const parts = [];
        if (changedFiles.length) parts.push(plural(changedFiles.length, 'file') + ' changed');
        if (folderNotes.length) parts.push(plural(folderNotes.length, 'folder change'));
        result.detail = `${moved.map((s) => `${s} ${short(pinned[s])} -> ${short(latest[s])}`).join(', ')}; ${parts.join(', ')}`;
      } else if (result.status === 'up to date' && moved.length) {
        result.detail = `${moved.map((s) => `${s} is now at ${short(latest[s])}`).join(', ')}; none of the new commits touch this skill`;
      } else if (result.status === 'DRIFT' && (changedFiles.length || folderNotes.length)) {
        result.detail += `; also ${plural(changedFiles.length, 'upstream file change')}`;
      }
    } catch (error) {
      if (!(error instanceof UserError)) throw error;
      result.status = 'ERROR';
      result.detail = error.message;
    }

    if (sections.length) {
      console.log(`\n=== ${name} ===`);
      for (const section of sections) console.log(section);
    }
  }

  const label = { 'up to date': 'up to date', 'update available': 'update available', DRIFT: 'DRIFT', ERROR: 'ERROR' };
  const width = Math.max(...results.map((r) => r.name.length));
  console.log('\nStatus');
  for (const r of results) {
    console.log(`  ${r.name.padEnd(width)}  ${label[r.status]}${r.detail ? `  (${r.detail})` : ''}`);
  }
  const count = (s) => results.filter((r) => r.status === s).length;
  const bad = count('DRIFT') + count('ERROR');
  console.log(
    `\n${plural(results.length, 'skill')} checked: ${count('up to date')} up to date, ${count('update available')} update available, ${bad} with drift or errors.`,
  );
  if (bad) return 2;
  return count('update available') ? 1 : 0;
}

function parsePullArgs(args) {
  const out = { skill: null, to: [], force: false };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--to') {
      const value = args[++i];
      if (!value) throw new UserError('--to needs a commit SHA');
      out.to.push(value);
    } else if (arg.startsWith('--to=')) {
      out.to.push(arg.slice(5));
    } else if (arg === '--force') {
      out.force = true;
    } else if (arg.startsWith('-')) {
      throw new UserError(`unknown option "${arg}"`);
    } else if (out.skill === null) {
      out.skill = arg;
    } else {
      throw new UserError('pull takes one skill at a time');
    }
  }
  if (!out.skill) throw new UserError('usage: node sync.mjs pull <skill> [--to <sha>] [--force]');
  return out;
}

function cmdPull(args) {
  const { skill: name, to, force } = parsePullArgs(args);
  const { manifest, text: manifestText } = loadManifest();
  const skill = getSkill(manifest, name);
  const sources = Object.keys(skill.pins);

  // --to <sha> for a one-source skill; --to <source>=<sha> for any skill (needed for several sources).
  const targets = {};
  for (const value of to) {
    const eq = value.indexOf('=');
    let source;
    let ref;
    if (eq > 0 && manifest.sources[value.slice(0, eq)]) {
      source = value.slice(0, eq);
      ref = value.slice(eq + 1);
    } else if (sources.length === 1) {
      source = sources[0];
      ref = value;
    } else {
      throw new UserError(`${name} has several sources (${sources.join(', ')}); use --to <source>=<sha>`);
    }
    if (!sources.includes(source)) throw new UserError(`${name} does not use source "${source}"`);
    targets[source] = ref;
  }

  const repos = new Repos(manifest);

  // Refuse to overwrite local edits that are not in a patch.
  const pinned = {};
  for (const source of sources) pinned[source] = repos.get(source).resolve(skill.pins[source]);
  const drift = findDrift(name, skill, repos, pinned);
  if (drift.error) {
    // Expected while refreshing a patch: the new patch fits the target, not the old pin.
    process.stderr.write(`  warning: cannot compare the current files with their pin, so local edits are not checked:\n${indent(drift.error, 4)}\n`);
  } else if (drift.problems.length && !force) {
    throw new UserError(
      `${name}: local files differ from the pinned upstream${skill.patch ? ' plus patch' : ''}: ${drift.problems.map((p) => p.to).join(', ')}.\n` +
        'Pulling would overwrite them. Put the changes in a patch first (see README.md), or pass --force. Nothing was changed.',
    );
  }

  const next = {};
  for (const source of sources) {
    process.stderr.write(`  fetching ${source} ${targets[source] ?? 'HEAD'}\n`);
    next[source] = repos.get(source).resolve(targets[source] ?? 'HEAD');
  }

  // Build everything in memory first; touch the disk only when all of it worked.
  const raw = upstreamFiles(name, skill, repos, next);
  const describe = sources.map((s) => `${s}@${short(next[s])}`).join(', ');
  let wanted;
  try {
    wanted = applyPatch(name, skill, raw, describe);
  } catch (error) {
    if (!(error instanceof PatchError)) throw error;
    throw new UserError(
      `${error.message}\nNothing was changed. Refresh the patch against that upstream file, then pull again (README.md, "Refreshing a patch").`,
    );
  }

  const newPins = {};
  for (const source of sources) newPins[source] = next[source];
  const edit = manifestTextWithPins(manifestText, manifest, name, newPins);

  const changed = [];
  const same = [];
  for (const [to, content] of wanted) (readLocal(name, to) === content ? same : changed).push(to);
  for (const to of changed) {
    const target = path.join(SKILLS_DIR, name, to);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, wanted.get(to));
  }
  const pinsMoved = sources.filter((s) => skill.pins[s] !== next[s]);
  if (edit.text !== manifestText) fs.writeFileSync(MANIFEST_PATH, edit.text);

  console.log(`${name}: ${sources.map((s) => `${s} ${short(skill.pins[s])} -> ${short(next[s])}`).join(', ')}`);
  if (skill.patch) console.log(`  patch ${skill.patch} applied`);
  if (changed.length) console.log(`  files changed: ${changed.join(', ')}`);
  console.log(`  files unchanged: ${same.length ? same.join(', ') : '(none)'}`);
  if (!pinsMoved.length) console.log('  pins unchanged');
  if (edit.reformatted) console.log('  warning: manifest.json was rewritten as plain 2-space JSON (its hand layout could not be kept)');
  if (changed.length || pinsMoved.length) console.log('Review the result and commit it.');
  return 0;
}

const USAGE = `Usage:
  node sync.mjs list
  node sync.mjs check [skill ...]
  node sync.mjs pull <skill> [--to <sha>] [--force]

check  compares each skill's files with its pinned upstream commit (drift) and with the
       latest upstream commit (updates). Exit 0: all up to date; 1: updates available; 2: drift or error.
pull   writes one skill's files from upstream (latest, or --to <sha>), re-applies its patch and
       moves its pins. For a skill with several sources use --to <source>=<sha>.
list   shows each skill, its pinned commits and whether it carries a local patch.`;

function main(argv) {
  const [command, ...rest] = argv;
  switch (command) {
    case 'list':
      return cmdList();
    case 'check':
      return cmdCheck(rest);
    case 'pull':
      return cmdPull(rest);
    case undefined:
    case 'help':
    case '--help':
    case '-h':
      console.log(USAGE);
      return command === undefined ? 2 : 0;
    default:
      throw new UserError(`unknown command "${command}"\n\n${USAGE}`);
  }
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  if (error instanceof UserError) {
    console.error(`error: ${error.message}`);
  } else {
    console.error(`unexpected error: ${error?.message ?? error}`);
    if (process.env.DEBUG) console.error(error?.stack);
  }
  process.exitCode = 2;
} finally {
  cleanupTempDirs();
}
