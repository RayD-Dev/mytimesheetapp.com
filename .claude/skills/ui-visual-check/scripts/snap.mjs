#!/usr/bin/env node
// snap.mjs: screenshot routes at several viewports with Playwright and run layout checks.
// Playwright is resolved from the current folder's node_modules (run it from the app folder).
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'

const USAGE = `Usage: node snap.mjs --url <base> [options]
  --url <base>            app URL, e.g. http://localhost:5173/  (required)
  --routes <a,b,…>        paths or hash routes relative to --url (default: the URL itself)
  --scenarios <file>      JSON list of {name, path, steps:[{click|fill|press|hover|scroll|waitFor|wait}]}
  --viewports <WxH,…>     default 375x812,1280x800
  --out <dir>             default .ui-snapshots
  --browser <name>        chromium (default) | webkit (closest to iOS Safari) | firefox
  --storage-state <file>  Playwright storage state for signed-in pages (test users only)
  --wait-for <selector>   wait for this selector before checking
  --wait <ms>             extra settle time after load (default 300)
  --viewport-only         screenshot the viewport instead of the full page
  --dpr <n>               device pixel ratio (default 1, keeps images small)
  --color-scheme <s>      light | dark
  --motion                allow animations (default: reduced motion, so nothing is captured mid-transition)`

// ---------- args ----------
const opts = { routes: [''], viewports: '375x812,1280x800', out: '.ui-snapshots', browser: 'chromium', wait: 300, fullPage: true, dpr: 1, motion: false }
const argv = process.argv.slice(2)
for (let i = 0; i < argv.length; i++) {
  const a = argv[i], v = () => argv[++i]
  switch (a) {
    case '--url': opts.url = v(); break
    case '--routes': opts.routes = v().split(',').map((s) => s.trim()); break
    case '--scenarios': opts.scenarios = v(); break
    case '--viewports': opts.viewports = v(); break
    case '--out': opts.out = v(); break
    case '--browser': opts.browser = v(); break
    case '--storage-state': opts.storageState = v(); break
    case '--wait-for': opts.waitFor = v(); break
    case '--wait': opts.wait = Number(v()); break
    case '--viewport-only': opts.fullPage = false; break
    case '--dpr': opts.dpr = Number(v()); break
    case '--color-scheme': opts.colorScheme = v(); break
    case '--motion': opts.motion = true; break
    case '-h': case '--help': console.log(USAGE); process.exit(0)
    default: console.error(`Unknown argument ${a}\n${USAGE}`); process.exit(1)
  }
}
if (!opts.url) { console.error(USAGE); process.exit(1) }

// ---------- playwright ----------
async function loadPlaywright() {
  const req = createRequire(path.join(process.cwd(), 'noop.js'))
  for (const name of ['playwright', '@playwright/test', 'playwright-core']) {
    try {
      const mod = await import(pathToFileURL(req.resolve(name)).href)
      const pw = mod[opts.browser] ? mod : mod.default
      if (pw?.[opts.browser]) return pw
    } catch {}
  }
  console.error('Playwright not found from ' + process.cwd() + '.\nInstall it in the app folder: npm i -D @playwright/test && npx playwright install ' + opts.browser)
  process.exit(1)
}

// ---------- targets ----------
const slug = (s) => (s.replace(/^[#/]+/, '').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '') || 'home').slice(0, 60)
const targets = opts.scenarios
  ? JSON.parse(fs.readFileSync(opts.scenarios, 'utf8')).map((s) => ({ name: slug(s.name || s.path || ''), raw: s.path || '', url: new URL(s.path || '', opts.url).href, steps: s.steps || [] }))
  : opts.routes.map((r) => ({ name: slug(r), raw: r, url: r ? new URL(r, opts.url).href : opts.url, steps: [] }))
for (const t of targets) if (!/^(https?|file):/.test(t.url) || /(?:^|[#/])[A-Za-z]:[\\/]|Program Files/i.test(t.raw)) {
  console.error(`Route resolved to "${t.url}", which looks like a file path, not an app route.\n` +
    'Git Bash rewrites arguments that start with /. Run with MSYS_NO_PATHCONV=1 (and give the script path as C:/… or relative), or run from PowerShell.')
  process.exit(1)
}
const viewports = opts.viewports.split(',').map((v) => { const [w, h] = v.trim().split('x').map(Number); return { w, h } })

// ---------- in-page checks ----------
function pageChecks({ touch }) {
  const vw = document.documentElement.clientWidth
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1
  const cx = canvas.getContext('2d', { willReadFrequently: true })
  const rgba = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = '#000'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
  const over = (top, bottom) => { const a = top[3]; return [0, 1, 2].map((i) => top[i] * a + bottom[i] * (1 - a)).concat(1) }
  const lum = ([r, g, b]) => [r, g, b].map((c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4 }).reduce((s, c, i) => s + c * [0.2126, 0.7152, 0.0722][i], 0)
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05) }
  const hex = (c) => '#' + c.slice(0, 3).map((n) => Math.round(n).toString(16).padStart(2, '0')).join('')
  const sel = (el) => {
    const parts = []
    for (let e = el, i = 0; e && e.nodeType === 1 && i < 3; e = e.parentElement, i++) {
      let s = e.tagName.toLowerCase()
      if (e.id) { parts.unshift(s + '#' + e.id); break }
      const cls = [...e.classList].filter((c) => /^[a-zA-Z][\w-]*$/.test(c)).slice(0, 2)
      if (cls.length) s += '.' + cls.join('.')
      parts.unshift(s)
    }
    return parts.join(' > ')
  }
  // 1px boxes are visually-hidden helpers (sr-only text, a form library's hidden input), not what users see
  const visible = (el) => { const r = el.getBoundingClientRect(), cs = getComputedStyle(el); return r.width > 1 && r.height > 1 && cs.visibility !== 'hidden' && +cs.opacity > 0 && !el.closest('[aria-hidden="true"]') }
  const group = (list) => Object.values(list.reduce((acc, x) => { const k = x.sel + '|' + (x.key || ''); (acc[k] ||= { ...x, count: 0 }).count++; return acc }, {}))
  const all = [...document.body.querySelectorAll('*')]
  const out = { docWidth: document.documentElement.scrollWidth, viewportWidth: vw, textLength: document.body.innerText.trim().length }

  // 1. sideways scroll: report elements that stick out while their parent doesn't (the root causes)
  out.overflowX = out.docWidth > vw + 1
  out.overflowCauses = []
  const clippedByAncestor = (el) => { for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) if (getComputedStyle(e).overflowX !== 'visible' && e.getBoundingClientRect().right <= vw + 1) return true; return false }
  if (out.overflowX) for (const el of all) {
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.right <= vw + 1) continue
    const p = el.parentElement?.getBoundingClientRect()
    if ((p && p.right > vw + 1) || clippedByAncestor(el)) continue
    out.overflowCauses.push({ sel: sel(el), right: Math.round(r.right), width: Math.round(r.width) })
    if (out.overflowCauses.length >= 8) break
  }
  // regions that scroll sideways on their own (e.g. a table in an overflow-x:auto wrapper)
  out.scrollRegions = all.filter((el) => /auto|scroll/.test(getComputedStyle(el).overflowX) && el.scrollWidth > el.clientWidth + 1 && visible(el))
    .slice(0, 5).map((el) => ({ sel: sel(el), scrollWidth: el.scrollWidth, clientWidth: el.clientWidth }))

  // 2. clipped text
  const hasText = (el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
  out.clipped = group(all.filter((el) => hasText(el) && visible(el) && el.scrollWidth > el.clientWidth + 1 && /hidden|clip/.test(getComputedStyle(el).overflowX))
    .map((el) => ({ sel: sel(el), key: getComputedStyle(el).textOverflow === 'ellipsis' ? 'ellipsis' : 'cut', text: el.textContent.trim().slice(0, 40) }))).slice(0, 10)

  // 3. tap targets and 4. small inputs
  const interactive = all.filter((el) => el.matches('a[href],button,input:not([type=hidden]),select,textarea,summary,[role=button],[role=link],[role=checkbox],[role=radio],[role=switch],[role=tab],[role=menuitem],[role=spinbutton],[role=combobox],[tabindex]:not([tabindex="-1"])') && visible(el))
  const small = [], belowRec = []
  for (const el of interactive) {
    const r = el.getBoundingClientRect()
    if (el.tagName === 'A' && getComputedStyle(el).display === 'inline') continue // inline links are exempt
    const item = { sel: sel(el), key: `${Math.round(r.width)}x${Math.round(r.height)}` }
    if (r.width < 24 || r.height < 24) small.push(item)
    else if (touch && (r.width < 44 || r.height < 44)) belowRec.push(item)
  }
  out.smallTargets = group(small).slice(0, 10)
  out.targetsBelow44 = touch ? group(belowRec).slice(0, 10) : []
  out.smallInputs = touch ? group(all.filter((el) => el.matches('input:not([type=checkbox]):not([type=radio]):not([type=range]),select,textarea,[contenteditable=true],[contenteditable=""],[role=spinbutton]') && visible(el) && parseFloat(getComputedStyle(el).fontSize) < 16)
    .map((el) => ({ sel: sel(el), key: getComputedStyle(el).fontSize }))).slice(0, 10) : []

  // 5. text contrast (skips text over images or gradients, and disabled controls)
  const low = []
  for (const el of all.filter((e) => hasText(e) && visible(e)).slice(0, 2000)) {
    if (el.closest('[disabled],[aria-disabled="true"]')) continue
    const cs = getComputedStyle(el)
    let bg = [255, 255, 255, 1], layers = [], unknown = false
    for (let e = el; e; e = e.parentElement) {
      const s = getComputedStyle(e)
      if (s.backgroundImage !== 'none') { unknown = true; break }
      const c = rgba(s.backgroundColor)
      if (c[3] > 0) layers.push(c)
      if (c[3] >= 1) break
    }
    if (unknown) continue
    for (const c of layers.reverse()) bg = over(c, bg)
    const fg = over(rgba(cs.color), bg)
    const size = parseFloat(cs.fontSize), large = size >= 24 || (size >= 18.66 && +cs.fontWeight >= 700)
    const r = ratio(fg, bg), need = large ? 3 : 4.5
    if (r < need) low.push({ sel: sel(el), key: `${r.toFixed(2)}:1 ${hex(fg)} on ${hex(bg)} (needs ${need}:1)`, text: el.textContent.trim().slice(0, 30) })
  }
  out.lowContrast = group(low).slice(0, 12)

  // 6. overlapping controls
  out.overlaps = []
  const boxes = interactive.slice(0, 300).map((el) => [el, el.getBoundingClientRect()])
  for (let i = 0; i < boxes.length && out.overlaps.length < 8; i++) for (let j = i + 1; j < boxes.length; j++) {
    const [a, ra] = boxes[i], [b, rb] = boxes[j]
    if (a.contains(b) || b.contains(a)) continue
    const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top)
    if (w > 0 && h > 0 && w * h > 0.25 * Math.min(ra.width * ra.height, rb.width * rb.height)) { out.overlaps.push({ a: sel(a), b: sel(b) }); if (out.overlaps.length >= 8) break }
  }

  // 7. images and 8. fonts actually rendering
  out.brokenImages = [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc || i.src).slice(0, 5)
  const fams = {}
  for (const el of all.filter(hasText)) { const f = getComputedStyle(el).fontFamily.split(',')[0].trim().replace(/["']/g, ''); fams[f] = (fams[f] || 0) + 1 }
  const generic = /^(serif|sans-serif|monospace|system-ui|ui-[\w-]+|-apple-system|cursive|fantasy)$/i
  // document.fonts.check() returns true for undeclared families, so look for an actual loaded @font-face
  const faces = [...document.fonts]
  out.fonts = Object.entries(fams).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([family, count]) => {
    const own = faces.filter((f) => f.family.replace(/["']/g, '') === family)
    return { family, count, loaded: generic.test(family) || own.some((f) => f.status === 'loaded'), declared: own.length > 0 }
  })
  return out
}

// ---------- run ----------
const pw = await loadPlaywright()
fs.mkdirSync(opts.out, { recursive: true })
const browser = await pw[opts.browser].launch()
const results = []
for (const vp of viewports) {
  const touch = vp.w < 768
  const context = await browser.newContext({
    viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: opts.dpr,
    ...(touch && opts.browser !== 'firefox' ? { isMobile: true, hasTouch: true } : {}),
    reducedMotion: opts.motion ? 'no-preference' : 'reduce',
    ...(opts.colorScheme ? { colorScheme: opts.colorScheme } : {}),
    ...(opts.storageState ? { storageState: opts.storageState } : {}),
  })
  for (const t of targets) {
    const page = await context.newPage()
    const r = { target: t.name, url: t.url, viewport: `${vp.w}x${vp.h}`, consoleErrors: [], failedRequests: [], errors: [] }
    page.on('console', (m) => m.type() === 'error' && r.consoleErrors.push(m.text().slice(0, 200)))
    page.on('pageerror', (e) => r.consoleErrors.push(String(e.message || e).slice(0, 200)))
    page.on('response', (res) => res.status() >= 400 && r.failedRequests.push(`${res.status()} ${res.url()}`))
    page.on('requestfailed', (req) => r.failedRequests.push(`failed ${req.url()}`))
    try {
      try { await page.goto(t.url, { waitUntil: 'networkidle', timeout: 15000 }) }
      catch (e) { if (!/Timeout/i.test(e.message)) throw e; r.errors.push('network never went idle; checked anyway') }
      await page.evaluate(() => document.fonts && document.fonts.ready)
      if (opts.waitFor) await page.waitForSelector(opts.waitFor, { timeout: 10000 })
      for (const s of t.steps) {
        if (s.click) await page.click(s.click)
        else if (s.fill) await page.fill(s.fill[0], s.fill[1])
        else if (s.press) await page.keyboard.press(s.press)
        else if (s.hover) await page.hover(s.hover)
        else if (s.scroll) await page.locator(s.scroll).first().scrollIntoViewIfNeeded() // e.g. content inside a scrolling dialog
        else if (s.waitFor) await page.waitForSelector(s.waitFor, { timeout: 10000 })
        else if (s.wait) await page.waitForTimeout(s.wait)
      }
      await page.waitForTimeout(opts.wait)
      r.screenshot = path.join(opts.out, `${t.name}@${vp.w}x${vp.h}.png`).split(path.sep).join('/')
      await page.screenshot({ path: r.screenshot, fullPage: opts.fullPage })
      Object.assign(r, await page.evaluate(pageChecks, { touch }))
    } catch (e) { r.errors.push(String(e.message || e).split('\n')[0]) }
    results.push(r)
    await page.close()
  }
  await context.close()
}
await browser.close()

// ---------- report ----------
const lines = [`# UI visual check`, `${opts.url} · ${opts.browser} · ${viewports.map((v) => `${v.w}x${v.h}`).join(', ')} · ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`]
let fails = 0, warns = 0
const fail = (s) => { fails++; lines.push(`- ✗ ${s}`) }, warn = (s) => { warns++; lines.push(`- ! ${s}`) }
const list = (xs, fmt) => xs.map(fmt).join('; ')
for (const r of results) {
  lines.push('', `## ${r.target} @ ${r.viewport}${r.screenshot ? ` → ${r.screenshot}` : ''}`)
  const before = fails + warns
  r.errors.forEach((e) => (/checked anyway/.test(e) ? warn : fail)(e))
  if (r.screenshot && r.textLength === 0) fail('The page rendered no text. Wrong route, a crash, or still loading (try --wait-for)')
  if (r.overflowX) fail(`Sideways scroll: page is ${r.docWidth}px wide in a ${r.viewportWidth}px viewport. Causes: ${list(r.overflowCauses, (o) => `${o.sel} (right edge ${o.right}px)`)}`)
  if (r.scrollRegions?.length) warn(`Regions that scroll sideways: ${list(r.scrollRegions, (s) => `${s.sel} (${s.scrollWidth}px in ${s.clientWidth}px)`)}`)
  if (r.clipped?.length) warn(`Clipped text: ${list(r.clipped, (c) => `${c.sel} [${c.key}] "${c.text}"${c.count > 1 ? ` ×${c.count}` : ''}`)}`)
  if (r.smallTargets?.length) fail(`Tap targets under 24px: ${list(r.smallTargets, (t) => `${t.sel} ${t.key}${t.count > 1 ? ` ×${t.count}` : ''}`)}`)
  if (r.targetsBelow44?.length) warn(`Touch targets under 44px: ${list(r.targetsBelow44, (t) => `${t.sel} ${t.key}${t.count > 1 ? ` ×${t.count}` : ''}`)}`)
  if (r.smallInputs?.length) fail(`Inputs under 16px (iOS zooms on focus): ${list(r.smallInputs, (t) => `${t.sel} ${t.key}${t.count > 1 ? ` ×${t.count}` : ''}`)}`)
  if (r.lowContrast?.length) fail(`Low text contrast: ${list(r.lowContrast, (c) => `${c.sel} ${c.key} "${c.text}"${c.count > 1 ? ` ×${c.count}` : ''}`)}`)
  if (r.overlaps?.length) warn(`Overlapping controls: ${list(r.overlaps, (o) => `${o.a} ↔ ${o.b}`)}`)
  if (r.brokenImages?.length) fail(`Broken images: ${r.brokenImages.join(', ')}`)
  const missing = (r.fonts || []).filter((f) => !f.loaded)
  if (missing.length) warn(`Fonts not loaded from the app (system font or fallback): ${missing.map((f) => `${f.family}${f.declared ? ' (declared, failed to load)' : ' (no @font-face)'}`).join(', ')}`)
  if (r.consoleErrors.length) fail(`Console errors: ${[...new Set(r.consoleErrors)].slice(0, 5).join(' | ')}`)
  if (r.failedRequests.length) warn(`Failed requests: ${[...new Set(r.failedRequests)].slice(0, 5).join(' | ')}`)
  if (fails + warns === before) lines.push('- ✓ No layout issues found')
  if (r.fonts?.length) lines.push(`- Fonts in use: ${r.fonts.map((f) => `${f.family} (${f.count})`).join(', ')}`)
}
lines.push('', `Summary: ${results.length} screenshot${results.length === 1 ? '' : 's'}, ${fails} failure${fails === 1 ? '' : 's'}, ${warns} warning${warns === 1 ? '' : 's'}. Automated checks don't judge design; look at the screenshots.`)
fs.writeFileSync(path.join(opts.out, 'report.json'), JSON.stringify(results, null, 2))
fs.writeFileSync(path.join(opts.out, 'report.md'), lines.join('\n') + '\n')
console.log(lines.join('\n'))
process.exit(results.every((r) => !r.screenshot) ? 1 : 0)
