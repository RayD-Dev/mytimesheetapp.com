#!/usr/bin/env node
// slop-scan.mjs: deterministic scanner for generic "AI default" UI tells.
// Zero dependencies. Usage: node slop-scan.mjs [paths…] [--json] [--strict] [--config file] [--limit n]
import fs from 'node:fs'
import path from 'node:path'

const USAGE = `Usage: node slop-scan.mjs [paths…] [options]
  paths            files or folders (default: ./src if present, else .)
  --json           machine-readable output
  --strict         exit 2 when any critical or major finding remains
  --config <file>  config file (default: .slopscan.json in the current folder)
  --limit <n>      max findings listed in text output (default 80)`

// ---------- args and config ----------
const opts = { json: false, strict: false, config: '.slopscan.json', limit: 80, paths: [] }
const argv = process.argv.slice(2)
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === '--json') opts.json = true
  else if (a === '--strict') opts.strict = true
  else if (a === '--config') opts.config = argv[++i]
  else if (a === '--limit') opts.limit = Number(argv[++i]) || 80
  else if (a === '-h' || a === '--help') { console.log(USAGE); process.exit(0) }
  else if (a.startsWith('--')) { console.error(`Unknown option ${a}\n${USAGE}`); process.exit(1) }
  else opts.paths.push(a)
}
if (!opts.paths.length) opts.paths.push(fs.existsSync('src') ? 'src' : '.')

let config = { ignoreRules: [], ignoreFiles: [], allowCopy: [], tokenFiles: [] }
if (opts.config && fs.existsSync(opts.config)) {
  try { config = { ...config, ...JSON.parse(fs.readFileSync(opts.config, 'utf8')) } }
  catch (e) { console.error(`Can't parse ${opts.config}: ${e.message}`); process.exit(1) }
}
const globRe = (g) => new RegExp('^' + g.replace(/[.+^${}()|[\]\\]/g, '\\$&')
  .replace(/\*\*\/?/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\?/g, '.').replace(/\u0000/g, '.*') + '$')
const ignoreFileRes = config.ignoreFiles.map(globRe)
const tokenFileRes = config.tokenFiles.map(globRe)
const allowCopy = new Set(config.allowCopy.map((s) => s.toLowerCase()))
const ignoredRules = new Set(config.ignoreRules)

// ---------- file collection ----------
const EXTS = new Set(['.vue', '.css', '.scss', '.less', '.html', '.ts', '.tsx', '.js', '.jsx', '.mjs'])
const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', '.git', '.claude', 'coverage', '.nuxt', '.output', '.vite', '.ui-snapshots', '.nuxt-ui'])
const rel = (p) => path.relative(process.cwd(), p).split(path.sep).join('/') || '.'
function collect(p, out) {
  if (!fs.existsSync(p)) { console.error(`Not found: ${p}`); process.exit(1) }
  const st = fs.statSync(p)
  if (st.isDirectory()) {
    for (const name of fs.readdirSync(p)) if (!SKIP_DIRS.has(name)) collect(path.join(p, name), out)
  } else if (EXTS.has(path.extname(p)) && !/\.d\.ts$/.test(p) && !ignoreFileRes.some((r) => r.test(rel(p)))) out.push(p)
  return out
}
const files = [...new Set(opts.paths.flatMap((p) => collect(p, [])))]

// ---------- helpers ----------
const blank = (s) => s.replace(/[^\n]/g, ' ')
const stripComments = {
  style: (t) => t.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/(^|[^:"'])\/\/.*$/gm, (m, p) => p + blank(m.slice(p.length))),
  script: (t) => t.replace(/\/\*[\s\S]*?\*\//g, blank).replace(/(^|[^:"'`\\])\/\/.*$/gm, (m, p) => p + blank(m.slice(p.length))),
  template: (t) => t.replace(/<!--[\s\S]*?-->/g, blank),
}
const isTokenFile = (f) => /(^|[/._-])(tokens?|themes?|palette|preset|variables|vars|colou?rs?|main)\.(css|scss|less|ts|js|mjs)$/i.test(f)
  || /(vite|tailwind|uno)\.config\./.test(f) || tokenFileRes.some((r) => r.test(f))

function sectionsOf(file, text) {
  const ext = path.extname(file)
  const out = []
  const blocks = (tag, kind) => {
    const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi')
    for (const m of text.matchAll(re)) out.push({ kind, offset: m.index + m[0].indexOf('>') + 1, text: m[1] })
  }
  if (ext === '.vue') {
    const start = text.search(/<template\b/)
    const end = text.lastIndexOf('</template>')
    if (start >= 0 && end > start) {
      const open = text.indexOf('>', start) + 1
      out.push({ kind: 'template', offset: open, text: text.slice(open, end) })
    }
    blocks('style', 'style'); blocks('script', 'script')
  } else if (ext === '.html') {
    const markup = text.replace(/<(style|script)\b[^>]*>[\s\S]*?<\/\1>/gi, blank)
    out.push({ kind: 'template', offset: 0, text: markup })
    blocks('style', 'style'); blocks('script', 'script')
  } else if (['.css', '.scss', '.less'].includes(ext)) out.push({ kind: 'style', offset: 0, text })
  else out.push({ kind: 'script', offset: 0, text })
  return out.map((s) => ({ ...s, text: stripComments[s.kind](s.text) }))
}

// colour parsing → hsl (h 0-360, s/l 0-1)
function parseColor(c) {
  c = c.trim().toLowerCase()
  let r, g, b
  let m = c.match(/^#([0-9a-f]{3,8})$/)
  if (m) {
    let h = m[1]
    if (h.length === 3 || h.length === 4) h = [...h.slice(0, 3)].map((x) => x + x).join('')
    ;[r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  } else if ((m = c.match(/^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/))) [r, g, b] = m.slice(1, 4).map(Number)
  else if ((m = c.match(/^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/))) return { h: +m[1] % 360, s: m[2] / 100, l: m[3] / 100 }
  else return null
  ;[r, g, b] = [r / 255, g / 255, b / 255]
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min
  if (!d) return { h: 0, s: 0, l }
  const s = d / (1 - Math.abs(2 * l - 1))
  let h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return { h: (h * 60 + 360) % 360, s, l }
}
const COLOR_RE = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/g
const PURPLE_NAMES = /\b(purple|violet|indigo|fuchsia|magenta|orchid|plum|mediumpurple|blueviolet|darkviolet|rebeccapurple)\b/i
const isPurple = (c) => { const x = parseColor(c); return !!x && x.h >= 235 && x.h <= 320 && x.s >= 0.3 && x.l >= 0.15 && x.l <= 0.9 }
const isColorful = (c) => { const x = parseColor(c); return !!x && x.s >= 0.3 && x.l > 0.1 && x.l < 0.95 }

function balancedArgs(text, openIdx) { // text[openIdx] === '('
  let depth = 0
  for (let i = openIdx; i < text.length; i++) {
    if (text[i] === '(') depth++
    else if (text[i] === ')' && --depth === 0) return text.slice(openIdx + 1, i)
  }
  return text.slice(openIdx + 1, openIdx + 400)
}

// declarations: property: value (CSS)
function* decls(text, propRe) {
  const re = new RegExp(`(?<![\\w-])(${propRe})\\s*:\\s*([^;{}]+)`, 'gi')
  for (const m of text.matchAll(re)) yield { index: m.index, prop: m[1].toLowerCase(), value: m[2] }
}
// quoted strings (class lists, labels…)
function* quoted(text) {
  for (const m of text.matchAll(/(["'`])((?:\\.|(?!\1)[^\\\n])*)\1/g)) yield { index: m.index + 1, value: m[2] }
}
function* rx(text, re) { for (const m of text.matchAll(re)) yield m }

// UI-visible strings: template text nodes + label-like attributes; script string literals
function uiStrings(sec) {
  const out = []
  if (sec.kind === 'template') {
    for (const m of sec.text.matchAll(/>([^<>]+)</g)) {
      const t = m[1].replace(/\{\{[\s\S]*?\}\}/g, blank)
      if (t.trim()) out.push({ index: m.index + 1, value: t })
    }
    for (const m of sec.text.matchAll(/\s(?:label|title|placeholder|description|aria-label|alt)\s*=\s*"([^"]*)"/g)) out.push({ index: m.index, value: m[1] })
  } else if (sec.kind === 'script') {
    for (const q of quoted(sec.text)) if (/[A-Za-z]{2,}\s/.test(q.value) || /^[A-Z][a-z]+!?$/.test(q.value)) out.push(q)
  }
  return out
}

// Visible copy for the punctuation rules (em-dash, middot-chain, three-dots). Same sources as uiStrings, read more strictly:
// template text is taken after tags and {{ }} are blanked (so `=>` or spread inside a directive never looks like copy),
// string literals inside {{ }} and bound label-like attributes count, and script literals skip uiStrings' "reads like a
// sentence" test, because a string holding a dash, a middle dot or "..." is prose either way ('Saving...', a lone dash). Comments are
// already blanked; console.* arguments are developer output, not UI.
const LABEL_ATTRS = 'label|title|placeholder|description|aria-label|alt'
function copyStrings(sec) {
  const out = []
  const literals = (text, base, skip) => {
    for (const q of quoted(text)) if (!skip || !skip(q)) out.push({ index: base + q.index, value: q.value.replace(/\$\{[^}]*\}/g, blank) })
  }
  if (sec.kind === 'template') {
    let plain = sec.text.replace(/\{\{[\s\S]*?\}\}/g, (m, at) => { literals(m.slice(2, -2), at + 2); return blank(m) })
    for (const m of sec.text.matchAll(new RegExp(`\\s(?:${LABEL_ATTRS})\\s*=\\s*"([^"]*)"`, 'g'))) out.push({ index: m.index + m[0].length - m[1].length - 1, value: m[1] })
    for (const m of sec.text.matchAll(new RegExp(`\\s(?::|v-bind:)(?:${LABEL_ATTRS})\\s*=\\s*"([^"]*)"`, 'g'))) literals(m[1], m.index + m[0].length - m[1].length - 1)
    plain = plain.replace(TAG_RE, blank)
    for (const m of plain.matchAll(/[^\n]+/g)) if (m[0].trim()) out.push({ index: m.index, value: m[0] })
  } else if (sec.kind === 'script') {
    literals(sec.text, 0, (q) => /console\.\w+\(\s*$/.test(sec.text.slice(Math.max(0, q.index - 40), q.index - 1)))
  }
  return out
}
const around = (v, i, len = 1) => `"${v.slice(Math.max(0, i - 14), i + len + 14).trim()}"`
// `...` that is code or a path, not copy: spread (`...args`, `[...xs]`, `{ ...a }`) that slipped into a "string" through mis-paired
// quotes or code in a message (an identifier or bracket straight after the dots, an opener, comma or operator straight before), and
// ranges or URLs with a word on both sides (`main...feature`).
const codeDots = (v, i) => (/[\w$([{]/.test(v[i + 3] || '') && /[([{,=:?&|]\s*$/.test(v.slice(0, i))) || (/\w/.test(v[i - 1] || '') && /\w/.test(v[i + 3] || ''))

// template tags
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr'])
const TAG_RE = /<(\/?)([A-Za-z][\w.:-]*)((?:\s+[^\s"'>/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'=<>`]+))?)*)\s*(\/?)>/g
const attr = (attrs, name) => { const m = attrs.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*"([^"]*)"`)); return m ? m[1] : null }

// ---------- rules ----------
const GENERIC_FONTS = ['inter', 'roboto', 'arial', 'helvetica', 'helvetica neue', 'open sans', 'lato', 'system-ui', '-apple-system', 'blinkmacsystemfont', 'segoe ui', 'sans-serif', 'ui-sans-serif']
const OVERUSED_FONTS = ['poppins', 'montserrat', 'space grotesk', 'dm sans', 'plus jakarta sans', 'manrope']
function fontHits(sec, list) {
  const hits = []
  const check = (name, index) => {
    const n = name.trim().replace(/^['"]|['"]$/g, '').toLowerCase()
    if (list.includes(n)) hits.push({ index, detail: `font "${name.trim().replace(/['"]/g, '')}"` })
  }
  if (sec.kind !== 'template') {
    for (const d of decls(sec.text, 'font-family|--font-[\\w-]+')) {
      const first = d.value.split(',')[0]
      if (!/var\(/.test(first)) check(first, d.index)
    }
    for (const m of rx(sec.text, /fontFamily\s*:\s*(?:\{\s*[\w'"]+\s*:\s*)?\[?\s*['"]([^'",]+)/g)) check(m[1], m.index)
  }
  for (const m of rx(sec.text, /@fontsource(?:-variable)?\/([a-z0-9-]+)|fonts\.googleapis\.com\/css2?\?family=([A-Za-z+]+)/g)) {
    check((m[1] || m[2]).replace(/[-+]/g, ' '), m.index)
  }
  return hits
}

const RULES = [
  // Typography
  { id: 'font-generic', sev: 'major', why: 'Inter, Roboto, Arial and system stacks are the first fonts every generator reaches for.', fix: 'Choose a family for the subject (ui-craft directions.md) and self-host it.',
    find: (sec) => fontHits(sec, GENERIC_FONTS) },
  { id: 'font-overused', sev: 'minor', why: 'Poppins, Montserrat, Space Grotesk and friends became the second-order default.', fix: 'Pick from the subject\'s vernacular; check it isn\'t the starter-template font.',
    find: (sec) => fontHits(sec, OVERUSED_FONTS) },
  { id: 'gradient-text', sev: 'major', why: 'Gradient text is decoration standing in for hierarchy.', fix: 'Use size and weight; colour only when it carries meaning.',
    find: (sec) => [...rx(sec.text, sec.kind === 'style' ? /background-clip\s*:\s*text/gi : /(?<![\w-])bg-clip-text(?![\w-])/g)].map((m) => ({ index: m.index })) },
  { id: 'eyebrow-caps', sev: 'minor', why: 'All-caps letter-spaced labels above sections are the landing-page "eyebrow" pattern.', fix: 'A clear heading; uppercase only where it is the domain\'s own convention.',
    find: (sec) => sec.kind === 'style'
      ? [...rx(sec.text, /\{[^{}]*\}/g)].filter((m) => /text-transform\s*:\s*uppercase/i.test(m[0]) && /letter-spacing\s*:\s*(?!0|normal)/i.test(m[0])).map((m) => ({ index: m.index }))
      : [...quoted(sec.text)].filter((q) => /(?<![\w-])uppercase(?![\w-])/.test(q.value) && /(?<![\w-])tracking-(?:wide|wider|widest|\[)/.test(q.value)).map((q) => ({ index: q.index })) },
  { id: 'tiny-text', sev: 'minor', why: 'Text under 12px crams content instead of editing it, and is hard to read on phones.', fix: 'Cut or restructure; 14px minimum for secondary text, 16px for inputs on phones.',
    find: (sec) => {
      const hits = []
      const test = (v, u, index) => { const px = u === 'px' ? +v : +v * 16; if (px > 0 && px < 12) hits.push({ index, detail: `${v}${u}` }) }
      if (sec.kind === 'style') for (const d of decls(sec.text, 'font-size')) { const m = d.value.match(/^\s*(\d*\.?\d+)(px|rem|em)\b/); if (m) test(m[1], m[2], d.index) }
      else for (const m of rx(sec.text, /(?<![\w-])text-\[(\d*\.?\d+)(px|rem)\]/g)) test(m[1], m[2], m.index)
      return hits
    } },

  // Colour
  { id: 'ai-gradient', sev: 'critical', why: 'Purple, violet and indigo gradients are the most recognisable AI-default look.', fix: 'A flat surface from the palette; depth from a border or a surface step.',
    find: (sec) => {
      const hits = []
      for (const m of rx(sec.text, /(?:repeating-)?(?:linear|radial|conic)-gradient\(/gi)) {
        const args = balancedArgs(sec.text, m.index + m[0].length - 1)
        const colors = args.match(COLOR_RE) || []
        if (colors.some(isPurple) || PURPLE_NAMES.test(args)) hits.push({ index: m.index, detail: colors.filter(isPurple).slice(0, 3).join(', ') || args.match(PURPLE_NAMES)[0] })
      }
      if (sec.kind !== 'style') for (const m of rx(sec.text, /(?<![\w-])(?:from|via|to)-(?:purple|violet|indigo|fuchsia)-\d{2,3}(?![\w-])/g)) hits.push({ index: m.index, detail: m[0] })
      return hits
    } },
  { id: 'ai-purple', sev: 'major', why: 'Indigo and violet are the default "brand" colours of generated apps.', fix: 'An accent drawn from the subject, defined as a token.',
    find: (sec) => {
      const hits = []
      const noGradient = sec.text.replace(/(?:linear|radial|conic)-gradient\([^;{}]*/gi, blank)
      for (const m of rx(noGradient, COLOR_RE)) if (isPurple(m[0]) && parseColor(m[0]).s >= 0.4) hits.push({ index: m.index, detail: m[0] })
      if (sec.kind !== 'style') {
        for (const m of rx(sec.text, /(?<![\w-])(?:bg|text|border|ring|outline|fill|stroke|shadow|accent|decoration|divide)-(?:indigo|violet|purple)-\d{2,3}(?![\w-])/g)) hits.push({ index: m.index, detail: m[0] })
        for (const m of rx(sec.text, /(?:primary|secondary)\s*:\s*['"](indigo|violet|purple)['"]|color=["'](indigo|violet|purple)["']/g)) hits.push({ index: m.index, detail: m[0] })
      }
      return hits
    } },
  { id: 'decorative-gradient', sev: 'minor', why: 'Gradient washes add atmosphere without information; in a tool they compete with content.', fix: 'Solid surfaces; keep gradients for things that show a real continuum.',
    find: (sec) => {
      const hits = []
      for (const m of rx(sec.text, /(?:linear|radial|conic)-gradient\(/gi)) {
        const args = balancedArgs(sec.text, m.index + m[0].length - 1)
        const colors = args.match(COLOR_RE) || []
        if (!colors.some(isPurple) && !PURPLE_NAMES.test(args) && !/transparent|mask/i.test(args)) hits.push({ index: m.index })
      }
      if (sec.kind !== 'style') for (const m of rx(sec.text, /(?<![\w-])bg-(?:gradient-to|linear-to|radial|conic)(?:-[\w]+)?(?![\w-])/g)) hits.push({ index: m.index, detail: m[0] })
      return hits
    } },
  { id: 'pure-black', sev: 'minor', why: 'Pure black and flat grey look untuned against tinted surfaces.', fix: 'Tinted neutrals from the palette (ink, ink-muted).',
    find: (sec) => sec.kind === 'style'
      ? [...decls(sec.text, 'color|background|background-color|fill|stroke|border-color')].filter((d) => /^\s*(#000(000)?|black|#808080|gr[ae]y|rgb\(\s*0\s*,\s*0\s*,\s*0\s*\))\s*(!important)?\s*$/i.test(d.value)).map((d) => ({ index: d.index, detail: `${d.prop}: ${d.value.trim()}` }))
      : [...rx(sec.text, /(?<![\w-])(?:text|bg)-black(?![\w/-])/g)].map((m) => ({ index: m.index, detail: m[0] })) },
  { id: 'glow', sev: 'major', why: 'Coloured glows are the "dark-mode SaaS" cliché.', fix: 'No glow; use contrast, borders and surface steps.',
    find: (sec) => {
      const hits = []
      if (sec.kind === 'style') {
        for (const d of decls(sec.text, 'box-shadow|filter')) {
          if (/(?:^|,|\(|\s)0(?:px)?\s+0(?:px)?\s+(?:[89]|\d{2,})px/.test(d.value) && (d.value.match(COLOR_RE) || []).some(isColorful)) hits.push({ index: d.index, detail: d.value.trim().slice(0, 60) })
        }
      } else for (const m of rx(sec.text, /(?<![\w-])(?:shadow|drop-shadow)-(?:[a-z]+)-\d{3}(?:\/\d+)?(?![\w-])/g)) if (!/(?:gray|slate|zinc|neutral|stone|black)/.test(m[0])) hits.push({ index: m.index, detail: m[0] })
      return hits
    } },

  // Layout and surfaces
  { id: 'nested-cards', sev: 'major', why: 'Cards inside cards use boxes as a substitute for hierarchy.', fix: 'One level of container; group with space and rules.',
    find: (sec) => {
      if (sec.kind !== 'template') return []
      const hits = [], stack = []
      // <UCard>, <v-card>, <el-card>, <DayCard>, or a class token like "card" / "day-card" (not BEM parts like "card__title")
      const isCard = (name, attrs) => /^card$|-card$|(?:^|[a-z])Card$/i.test(name) && !/[a-z]card$/.test(name)
        || (attr(attrs, 'class') || '').split(/\s+/).some((c) => /^(?:[\w-]*-)?card$/.test(c))
      for (const m of rx(sec.text, TAG_RE)) {
        const [, closing, name, attrs, self] = m
        if (closing) { const i = stack.map((s) => s.name).lastIndexOf(name); if (i >= 0) stack.length = i; continue }
        const card = isCard(name, attrs)
        if (card && stack.some((s) => s.card)) hits.push({ index: m.index, detail: `<${name}> inside a card` })
        if (!self && !VOID.has(name.toLowerCase())) stack.push({ name, card })
      }
      return hits
    } },
  { id: 'heavy-shadow', sev: 'minor', why: 'Soft large shadows on everything are the card-grid default; product UI reads better with rules and surface steps.', fix: 'Borders or a surface step; one shadow only for things that float (menus, dialogs).',
    find: (sec) => sec.kind === 'style'
      ? [...decls(sec.text, 'box-shadow')].filter((d) => { const m = d.value.match(/-?\d*\.?\d+(?:px)?\s+-?\d*\.?\d+(?:px)?\s+(\d+)px/); return m && +m[1] >= 24 && !(d.value.match(COLOR_RE) || []).some(isColorful) }).map((d) => ({ index: d.index, detail: d.value.trim().slice(0, 50) }))
      : [...rx(sec.text, /(?<![\w-])shadow-(?:lg|xl|2xl)(?![\w-])/g)].map((m) => ({ index: m.index, detail: m[0] })) },
  { id: 'pillowy-radius', sev: 'minor', why: 'Large radii on containers make every surface look like the same rounded card.', fix: 'Use the radius tokens (2–3 values); reserve full rounding for pills and avatars.',
    find: (sec) => sec.kind === 'style'
      ? [...decls(sec.text, 'border-radius')].filter((d) => { const m = d.value.match(/^\s*(\d+)px/); return m && +m[1] >= 16 && +m[1] < 999 }).map((d) => ({ index: d.index, detail: d.value.trim() }))
      : [...rx(sec.text, /(?<![\w-])rounded-(?:2xl|3xl)(?![\w-])/g)].map((m) => ({ index: m.index, detail: m[0] })) },
  { id: 'glassmorphism', sev: 'major', why: 'Frosted-glass panels are trend residue; they hurt legibility and scroll performance on phones.', fix: 'Opaque surfaces from the palette.',
    find: (sec) => [...rx(sec.text, sec.kind === 'style' ? /backdrop-filter\s*:\s*[^;]*blur/gi : /(?<![\w-])backdrop-blur(?:-\w+)?(?![\w-])/g)].map((m) => ({ index: m.index })) },
  { id: 'side-stripe', sev: 'minor', why: 'A thick coloured stripe on one side of a card is the "alert card" template.', fix: 'A status chip with icon and text, or a full-row tint for row-level warnings.',
    find: (sec) => [...rx(sec.text, sec.kind === 'style' ? /border-(?:left|inline-start)(?:-width)?\s*:\s*(?:[3-9]|\d{2,})px/gi : /(?<![\w-])border-(?:l|s)-(?:4|8|\[\d+px\])(?![\w-])/g)].map((m) => ({ index: m.index, detail: m[0] })) },
  { id: 'hover-lift', sev: 'minor', why: 'Cards lifting on hover is motion with no meaning, and phones never see it.', fix: 'Hover only where something is clickable, as a subtle colour change.',
    find: (sec) => sec.kind === 'style'
      ? [...rx(sec.text, /:hover[^{]*\{[^}]*transform\s*:[^;}]*(?:translateY\(\s*-|scale\(\s*1\.(?:0[2-9]|[1-9]))/gi)].map((m) => ({ index: m.index }))
      : [...rx(sec.text, /(?<![\w-])(?:group-)?hover:(?:-translate-y-[\w.[\]]+|scale-1(?:0[2-9]|[1-9]\d))(?![\w-])/g)].map((m) => ({ index: m.index, detail: m[0] })) },
  { id: 'important', sev: 'minor', why: '!important usually means fighting the component library instead of theming it.', fix: 'Use the library\'s theme config or the component\'s ui prop.',
    find: (sec) => sec.kind === 'style' ? [...rx(sec.text, /!important/g)].map((m) => ({ index: m.index })) : [] },

  // Motion
  { id: 'transition-all', sev: 'major', why: 'transition: all animates things you didn\'t intend (layout, colour flashes) and costs performance.', fix: 'List properties: transform, opacity, background-color.',
    find: (sec) => sec.kind === 'style'
      ? [...decls(sec.text, 'transition|transition-property')].filter((d) => /(?:^|,)\s*all\b/.test(d.value) || (d.prop === 'transition' && /^\s*\d*\.?\d+m?s\b/.test(d.value))).map((d) => ({ index: d.index, detail: `${d.prop}: ${d.value.trim().slice(0, 40)}` }))
      : [...rx(sec.text, /(?<![\w-])transition-all(?![\w-])/g)].map((m) => ({ index: m.index })) },
  { id: 'bounce-easing', sev: 'major', why: 'Bounce and elastic easing feel toy-like and slow down repeated work.', fix: 'Strong ease-out: cubic-bezier(0.23, 1, 0.32, 1) (see ui-motion).',
    find: (sec) => {
      const hits = []
      for (const m of rx(sec.text, /cubic-bezier\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)/g)) if (+m[2] < 0 || +m[2] > 1 || +m[4] < 0 || +m[4] > 1) hits.push({ index: m.index, detail: m[0] })
      for (const m of rx(sec.text, /(?:@keyframes\s+|animation(?:-name)?\s*:\s*[^;]*?\b|(?<![\w-])animate-)(bounce|elastic|wobble|jello|rubber-?band|tada|swing)\w*/gi)) hits.push({ index: m.index, detail: m[1] })
      for (const m of rx(sec.text, /\bbounce\s*:\s*(0?\.\d+|\d+(?:\.\d+)?)/g)) if (+m[1] >= 0.3) hits.push({ index: m.index, detail: m[0] })
      return hits
    } },
  { id: 'ease-in', sev: 'minor', why: 'ease-in is slowest at the start, exactly when the user is waiting for a response.', fix: 'ease-out for entering, ease-in-out for moving.',
    find: (sec) => sec.kind === 'style'
      ? [...decls(sec.text, 'transition|transition-timing-function|animation|animation-timing-function')].filter((d) => /\bease-in\b(?!-)/.test(d.value)).map((d) => ({ index: d.index }))
      : [...rx(sec.text, /(?<![\w-])ease-in(?![\w-])/g)].map((m) => ({ index: m.index })) },
  { id: 'layout-animation', sev: 'minor', why: 'Animating width, height, top, left or margin forces layout on every frame and stutters on phones.', fix: 'transform and opacity; the grid-rows technique for expand and collapse.',
    find: (sec) => sec.kind === 'style'
      ? [...decls(sec.text, 'transition|transition-property')].filter((d) => /\b(?:width|height|max-height|top|left|right|bottom|margin(?:-\w+)?|padding(?:-\w+)?)\b/.test(d.value)).map((d) => ({ index: d.index, detail: d.value.trim().slice(0, 40) }))
      : [...rx(sec.text, /(?<![\w-])transition-\[[^\]]*(?:width|height|top|left|margin|padding)[^\]]*\]/g)].map((m) => ({ index: m.index, detail: m[0] })) },
  { id: 'slow-motion', sev: 'minor', why: 'UI transitions over ~400ms make the interface feel like it is in the way.', fix: '120–250ms for UI; up to 400ms only for large drawers.',
    find: (sec) => {
      const hits = []
      if (sec.kind === 'style') {
        for (const d of decls(sec.text, 'transition|transition-duration|animation|animation-duration')) {
          if (/infinite/.test(d.value)) continue
          const m = d.value.match(/(\d*\.?\d+)(ms|s)\b/)
          if (m && (m[2] === 's' ? +m[1] * 1000 : +m[1]) > 400) hits.push({ index: d.index, detail: m[0] })
        }
      } else for (const m of rx(sec.text, /(?<![\w-])duration-(\d+)(?![\w-])/g)) if (+m[1] > 400) hits.push({ index: m.index, detail: m[0] })
      return hits
    } },

  // Accessibility floor
  { id: 'outline-none', sev: 'major', why: 'Removing the focus outline without a replacement leaves keyboard users lost.', fix: 'A :focus-visible ring using the focus token.',
    find: (sec, ctx) => {
      if (ctx.hasFocusVisible) return []
      return [...rx(sec.text, sec.kind === 'style' ? /outline\s*:\s*(?:none|0)\b/gi : /(?<![\w-])(?:focus:)?outline-none(?![\w-])/g)].map((m) => ({ index: m.index }))
    } },
  { id: 'div-button', sev: 'major', why: 'A clickable div or span is not focusable and is not announced as a control.', fix: 'Use <button> or <a>, or the library\'s Button.',
    find: (sec) => sec.kind !== 'template' ? [] : [...rx(sec.text, TAG_RE)]
      .filter((m) => !m[1] && /^(div|span|li|td|tr|p|section|article|img)$/i.test(m[2]) && /(?:@click|v-on:click|onClick)\s*=/.test(m[3]) && !/\brole\s*=|\btabindex\s*=/.test(m[3]))
      .map((m) => ({ index: m.index, detail: `<${m[2]} @click>` })) },
  { id: 'img-alt', sev: 'major', why: 'Images without alt text are read out as file names.', fix: 'Meaningful alt, or alt="" for decoration.',
    find: (sec) => sec.kind !== 'template' ? [] : [...rx(sec.text, TAG_RE)].filter((m) => !m[1] && /^img$/i.test(m[2]) && !/(?:^|\s)(?::|v-bind:)?alt\s*=/.test(m[3])).map((m) => ({ index: m.index })) },
  { id: 'zoom-disabled', sev: 'critical', why: 'user-scalable=no and maximum-scale=1 block pinch-zoom, which locks out people who need larger text.', fix: 'Remove it from the viewport tag; to stop iOS zooming into inputs, make them at least 16px.',
    find: (sec) => sec.kind === 'style' ? [] : [...rx(sec.text, /user-scalable\s*=\s*(?:no|0)(?![\w.])|maximum-scale\s*=\s*1(?:\.0+)?(?![\d.])/gi)].map((m) => ({ index: m.index, detail: m[0] })) },

  // Copy
  { id: 'slop-copy', sev: 'minor', why: 'Apologetic, vague or marketing copy inside a tool explains nothing.', fix: 'Say what happened and what to do, in the users\' own words.',
    find: (sec) => {
      const hits = []
      const PATTERNS = [
        [/lorem ipsum/i, 'major'], [/\b(?:oops|whoops)\b/i, 'major'], [/something went wrong/i, 'major'],
        [/\b(?:unlock|supercharge[sd]?|seamless(?:ly)?|effortless(?:ly)?|elevate|empower|revolutioni[sz]e|game[- ]chang(?:er|ing)|cutting[- ]edge|next[- ]level|delightful)\b/i, 'minor'],
        [/\bclick here\b/i, 'minor'],
      ]
      for (const s of uiStrings(sec)) for (const [re, sev] of PATTERNS) {
        const m = s.value.match(re)
        if (m && !allowCopy.has(m[0].toLowerCase())) hits.push({ index: s.index + (m.index || 0), detail: `"${m[0]}"`, sev })
      }
      return hits
    } },
  { id: 'generic-cta', sev: 'minor', why: 'A generic button label doesn\'t say what will happen.', fix: 'Name the outcome ("Submit timesheet"), or add the domain\'s agreed term to allowCopy in .slopscan.json.',
    find: (sec) => uiStrings(sec).filter((s) => /^\s*(submit|click here|click me|learn more)\s*$/i.test(s.value) && !allowCopy.has(s.value.trim().toLowerCase()))
      .map((s) => ({ index: s.index, detail: `"${s.value.trim()}"` })) },
  { id: 'emoji-ui', sev: 'minor', why: 'Emoji in interface text reads as forced cheer and renders differently on every device.', fix: 'Words, or a proper icon from the icon set.',
    find: (sec) => uiStrings(sec).filter((s) => /(?![©®™])\p{Extended_Pictographic}/u.test(s.value)).map((s) => ({ index: s.index, detail: s.value.trim().slice(0, 30) })) },
  { id: 'exclaim', sev: 'minor', why: 'Exclamation marks in a tool sound like marketing.', fix: 'Calm, specific statements ("Timesheet submitted").',
    find: (sec) => uiStrings(sec).filter((s) => /[A-Za-z]!\s*$/.test(s.value)).map((s) => ({ index: s.index, detail: `"${s.value.trim().slice(0, 40)}"` })) },
  { id: 'em-dash', sev: 'major', why: 'Em and en dashes are the most recognisable AI-writing tell, and this project bans them in UI copy.', fix: 'Use a full stop, comma, colon or brackets; write ranges with "to" (06/10/2026 to 17/10/2026).',
    find: (sec) => copyStrings(sec).flatMap((s) => [...s.value.matchAll(/[\u2013\u2014]/g)].map((m) => ({ index: s.index + m.index, detail: around(s.value, m.index) }))) },
  { id: 'middot-chain', sev: 'minor', why: 'Metadata strips chained with middle dots are a templated look; one separator on a line is fine.', fix: 'Split into separate lines, or use words ("3 to approve, 1 approved, 1 rejected").',
    find: (sec) => {
      const lines = new Map() // dots counted per source line, across every piece of copy on it
      for (const s of copyStrings(sec)) for (const m of s.value.matchAll(/\u00B7/g)) {
        const at = s.index + m.index, line = sec.text.slice(0, at).split('\n').length
        const e = lines.get(line) || { index: at, n: 0 }
        e.index = Math.min(e.index, at); e.n++; lines.set(line, e)
      }
      return [...lines.values()].filter((e) => e.n > 1).map((e) => ({ index: e.index, detail: `${e.n} middle dots on one line` }))
    } },
  { id: 'three-dots', sev: 'minor', why: 'Three full stops are a typewriter stand-in for the ellipsis character.', fix: 'Use the ellipsis character: "Saving…".',
    find: (sec) => copyStrings(sec).flatMap((s) => [...s.value.matchAll(/(?<!\.)\.\.\.(?!\.)/g)].filter((m) => !codeDots(s.value, m.index)).map((m) => ({ index: s.index + m.index, detail: around(s.value, m.index, 3) }))) },
]
const RAW_COLOR = { id: 'raw-color', sev: 'minor', why: 'Raw colour values in components drift from the design system; every screen ends up slightly different.', fix: 'Reference tokens (bg-paper, var(--color-ink)); add a token if one is missing.' }
const NO_REDUCED = { id: 'no-reduced-motion', sev: 'major', why: 'Animation without a prefers-reduced-motion alternative can cause discomfort for some users.', fix: 'Add the reduced-motion block from ui-motion recipes (§1).' }
const RULE_INFO = Object.fromEntries([...RULES, RAW_COLOR, NO_REDUCED].map((r) => [r.id, { severity: r.sev, why: r.why, fix: r.fix }]))

// ---------- scan ----------
const findings = []
let hasMotion = null, hasReducedMotion = false
const MOTION_RE = /@keyframes|(?<![\w-])(?:transition|animation)\s*:|<Transition(?:Group)?\b|(?<![\w-])animate-(?!none)[\w-]+|(?<![\w-])transition(?:-(?:colors|opacity|transform))?(?![\w-:])/
const REDUCED_RE = /prefers-reduced-motion|motion-reduce:|motion-safe:/

for (const file of files) {
  const text = fs.readFileSync(file, 'utf8')
  const f = rel(file)
  const lineStarts = [0]
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') lineStarts.push(i + 1)
  const lineOf = (idx) => { let lo = 0, hi = lineStarts.length - 1; while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (lineStarts[mid] <= idx) lo = mid; else hi = mid - 1 } return lo + 1 }

  // inline suppressions (read before comments are blanked)
  const fileIgnores = new Set(), lineIgnores = new Map()
  text.split('\n').forEach((line, i) => {
    const m = line.match(/slop-ignore(-file)?\s+([\w-]+(?:\s*,\s*[\w-]+)*)/)
    if (!m) return
    const ids = m[2].split(/\s*,\s*/)
    if (m[1]) ids.forEach((id) => fileIgnores.add(id))
    else for (const ln of [i + 1, i + 2]) { const s = lineIgnores.get(ln) || new Set(); ids.forEach((id) => s.add(id)); lineIgnores.set(ln, s) }
  })
  const suppressed = (id, line) => ignoredRules.has(id) || fileIgnores.has(id) || fileIgnores.has('all') || lineIgnores.get(line)?.has(id) || lineIgnores.get(line)?.has('all')

  const sections = sectionsOf(file, text)
  const ctx = { hasFocusVisible: /focus-visible(?!:outline-none)/.test(text) }
  if (REDUCED_RE.test(text)) hasReducedMotion = true
  if (!hasMotion && sections.some((s) => MOTION_RE.test(s.text))) hasMotion = f

  const seen = new Set()
  for (const sec of sections) {
    for (const rule of RULES) {
      for (const hit of rule.find(sec, ctx)) {
        const line = lineOf(sec.offset + hit.index)
        const key = `${rule.id}:${line}`
        if (seen.has(key) || suppressed(rule.id, line)) continue
        seen.add(key)
        findings.push({ file: f, line, rule: rule.id, severity: hit.sev || rule.sev, detail: hit.detail || '' })
      }
    }
  }

  // raw colours, aggregated per file
  if (!isTokenFile(f) && !suppressed('raw-color', 0)) {
    const lines = []
    for (const sec of sections) {
      const scan = sec.kind === 'style' ? sec.text.replace(/--[\w-]+\s*:[^;]*/g, blank)
        : sec.kind === 'template' ? [...sec.text.matchAll(/style\s*=\s*"[^"]*"|\[(?:#|rgb|hsl)[^\]]*\]/g)].reduce((acc, m) => acc + ' '.repeat(Math.max(0, m.index - acc.length)) + m[0], '')
        : [...quoted(sec.text)].filter((q) => /^\s*(#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\()/.test(q.value)).reduce((acc, q) => acc + ' '.repeat(Math.max(0, q.index - acc.length)) + q.value, '')
      for (const m of scan.matchAll(/(?<![&\w])#[0-9a-fA-F]{3,8}\b|(?<![\w-])(?:rgba?|hsla?|oklch)\([^)]*\)/g)) {
        const line = lineOf(sec.offset + m.index)
        if (!suppressed('raw-color', line)) lines.push(line)
      }
    }
    if (lines.length >= 3) findings.push({ file: f, line: Math.min(...lines), rule: 'raw-color', severity: lines.length >= 10 ? 'major' : 'minor', detail: `${lines.length} raw colour values (lines ${[...new Set(lines)].sort((a, b) => a - b).slice(0, 6).join(', ')}${lines.length > 6 ? ', …' : ''})` })
  }
}

// project-level: reduced motion (also look in the project's stylesheets outside the scanned paths)
if (hasMotion && !hasReducedMotion && !ignoredRules.has('no-reduced-motion')) {
  const extra = fs.existsSync('src') ? collect('src', []).filter((p) => /\.(css|scss|vue)$/.test(p)) : []
  if (!extra.some((p) => REDUCED_RE.test(fs.readFileSync(p, 'utf8')))) findings.push({ file: hasMotion, line: 1, rule: 'no-reduced-motion', severity: 'major', detail: 'animations found, no prefers-reduced-motion handling anywhere' })
}

// ---------- score ----------
const WEIGHT = { critical: 12, major: 6, minor: 2 }
const perRule = {}
for (const x of findings) perRule[x.rule] = (perRule[x.rule] || 0) + WEIGHT[x.severity]
const penalty = Object.entries(perRule).reduce((sum, [id, p]) => sum + Math.min(p, WEIGHT[RULE_INFO[id].severity] * 3), 0)
const score = Math.max(0, 100 - penalty)
const band = score >= 90 ? 'Intentional' : score >= 75 ? 'Mostly clean' : score >= 50 ? 'Generic in places' : 'Reads as AI default'
const ORDER = { critical: 0, major: 1, minor: 2 }
findings.sort((a, b) => ORDER[a.severity] - ORDER[b.severity] || a.file.localeCompare(b.file) || a.line - b.line)

if (opts.json) {
  const rulesHit = [...new Set(findings.map((x) => x.rule))]
  console.log(JSON.stringify({ score, band, files: files.length, findings, rules: Object.fromEntries(rulesHit.map((id) => [id, RULE_INFO[id]])) }, null, 2))
} else {
  const out = [`UI slop scan · ${files.length} file${files.length === 1 ? '' : 's'} · ${findings.length} finding${findings.length === 1 ? '' : 's'}`, `Score ${score}/100 — ${band}`]
  let shown = 0
  for (const sev of ['critical', 'major', 'minor']) {
    const list = findings.filter((x) => x.severity === sev)
    if (!list.length) continue
    out.push('', sev)
    for (const x of list) {
      if (shown++ >= opts.limit) continue
      out.push(`  ${`${x.file}:${x.line}`.padEnd(42)} ${x.rule.padEnd(20)} ${x.detail}`)
    }
  }
  if (shown > opts.limit) out.push(`  …and ${shown - opts.limit} more (use --limit or --json)`)
  const counts = findings.reduce((acc, x) => ((acc[x.rule] = (acc[x.rule] || 0) + 1), acc), {})
  if (findings.length) {
    out.push('', 'Why and how to fix')
    for (const [id, n] of Object.entries(counts)) out.push(`  ${id} ×${n}: ${RULE_INFO[id].why} → ${RULE_INFO[id].fix}`)
    out.push('', 'Intentional? Add `slop-ignore <rule> -- <reason>` on or above the line, or configure .slopscan.json.',
      'Catalogue: .claude/skills/ui-craft/references/anti-patterns.md')
  }
  console.log(out.join('\n'))
}
process.exit(opts.strict && findings.some((x) => x.severity !== 'minor') ? 2 : 0)
