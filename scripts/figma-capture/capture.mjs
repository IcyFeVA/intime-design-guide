#!/usr/bin/env node
/**
 * Capture a rendered element of the running design guide as layout data for Figma.
 *
 * Opens a page in headless Chromium, optionally clicks through some UI to set up a state,
 * then walks the DOM of one root element and records every visible box (fill, border, radius,
 * shadow, gradient), text run (font, size, weight, color) and inline SVG icon, with positions
 * relative to the root. Writes <out>.json (for build.mjs) and <out>.png (to compare against).
 *
 *   node scripts/figma-capture/capture.mjs --route /patterns/workforce-scheduling \
 *     --click 'role=button[name="Target resolution"]' --out workforce-compact
 *
 * Options (all optional except --route):
 *   --route <hash route>   Page to open, e.g. /patterns/workforce-scheduling
 *   --url <base>           Dev server (default http://localhost:5173)
 *   --wait <selector>      Wait for this before clicking (default: none)
 *   --click <selector>     Playwright selector to click, in order. Repeatable.
 *   --root <selector>      Element to capture (default [data-target], the demo frame in Target resolution)
 *   --width <px>           Viewport width (default 1512)
 *   --height <px>          Root height to capture (default 982). The viewport is resized so a
 *                          full-screen root ends up exactly this tall.
 *   --scheme dark|light    Color scheme (default dark)
 *   --out <name>           Output name (default capture), written to scripts/figma-capture/out/
 *   CHROME=<path>          Chromium binary (default: newest one in ~/.cache/ms-playwright)
 */
import { chromium } from 'playwright-core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))

function parseArgs(argv) {
  const opts = { click: [] }
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i].replace(/^--/, '')
    const value = argv[i + 1]
    if (key === 'click') opts.click.push(value)
    else opts[key] = value
    i++
  }
  return opts
}

function findChrome() {
  if (process.env.CHROME) return process.env.CHROME
  const cache = path.join(os.homedir(), '.cache', 'ms-playwright')
  const dirs = fs.existsSync(cache) ? fs.readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1])) : []
  for (const dir of dirs) {
    for (const rel of ['chrome-linux64/chrome', 'chrome-linux/chrome', 'chrome-mac/Chromium.app/Contents/MacOS/Chromium', 'chrome-win/chrome.exe']) {
      const candidate = path.join(cache, dir, rel)
      if (fs.existsSync(candidate)) return candidate
    }
  }
  throw new Error('No Chromium found. Run `npx playwright install chromium` or set CHROME=/path/to/chrome.')
}

const opts = parseArgs(process.argv.slice(2))
if (!opts.route) throw new Error('Missing --route, e.g. --route /patterns/workforce-scheduling')
const width = Number(opts.width || 1512)
const height = Number(opts.height || 982)
const rootSelector = opts.root || '[data-target]'
const outDir = path.join(here, 'out')
const outName = opts.out || 'capture'
fs.mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch({ executablePath: findChrome() })
const page = await browser.newPage({ viewport: { width, height: height + 200 }, deviceScaleFactor: 1 })
const base = opts.url || 'http://localhost:5173'
await page.goto(base)
await page.evaluate((scheme) => localStorage.setItem('intime-guide-color-scheme', scheme), opts.scheme || 'dark')
await page.goto(`${base}/#${opts.route}`)
await page.reload()
if (opts.wait) await page.waitForSelector(opts.wait)
for (const selector of opts.click) {
  await page.locator(selector).first().click()
  await page.waitForTimeout(500)
}
await page.waitForSelector(rootSelector)
// Resize so a full-screen root is exactly `height` tall
const top = await page.evaluate((sel) => document.querySelector(sel).getBoundingClientRect().top, rootSelector)
await page.setViewportSize({ width, height: Math.round(height + top) })
await page.waitForTimeout(600)
await page.mouse.move(0, 0)
await page.waitForTimeout(200)
await page.locator(rootSelector).first().screenshot({ path: path.join(outDir, `${outName}.png`) })

const data = await page.evaluate((sel) => {
  const root = document.querySelector(sel)
  const R = root.getBoundingClientRect()
  const nodes = []
  const num = (v) => parseFloat(v) || 0
  const r1 = (v) => Math.round(v * 10) / 10
  const rel = (r) => [r1(r.x - R.x), r1(r.y - R.y), r1(r.width), r1(r.height)]
  const parseColor = (s) => {
    if (!s || s === 'transparent') return null
    let m = s.match(/rgba?\(([^)]+)\)/)
    let p
    if (m) {
      const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number)
      p = [v[0] / 255, v[1] / 255, v[2] / 255, v[3] ?? 1]
    } else if ((m = s.match(/color\(srgb ([^)]+)\)/))) {
      const v = m[1].split(/[ /]+/).filter(Boolean).map(Number)
      p = [v[0], v[1], v[2], v[3] ?? 1]
    } else return null
    if (p[3] === 0) return null
    return p.map((x) => Math.round(x * 1000) / 1000)
  }
  const colorRe = /(rgba?\([^)]*\)|color\(srgb[^)]*\))/
  const parseShadows = (s) => {
    if (!s || s === 'none') return null
    return s.split(/,(?![^(]*\))/).map((part) => {
      const cm = part.match(colorRe)
      const rest = part.replace(cm ? cm[0] : '', '')
      const [x = 0, y = 0, blur = 0, spread = 0] = rest.replace('inset', '').trim().split(/\s+/).map(parseFloat)
      return { inset: rest.includes('inset'), x, y, blur, spread, c: cm ? parseColor(cm[0]) : [0, 0, 0, 1] }
    }).filter((sh) => sh.c)
  }
  const parseLayers = (img) => {
    if (!img || img === 'none') return null
    const layers = img.split(/,(?![^(]*\))(?=\s*(?:repeating-)?(?:linear|radial)-gradient)/).map((x) => x.trim())
    const out = layers.map((layer) => {
      const colors = (layer.match(new RegExp(colorRe.source, 'g')) || []).map(parseColor)
      const real = colors.filter(Boolean)
      if (layer.startsWith('repeating-linear-gradient')) {
        const px = (layer.match(/(\d+(?:\.\d+)?)px/g) || []).map(parseFloat)
        return real[0] ? { k: 'h', c: real[0], w: px[1] ?? 2, p: px[px.length - 1] ?? 9 } : null
      }
      if (!real.length) return null
      if (layer.includes('to right top') && real.length >= 2 && real[0].join() !== real[1].join()) return { k: 'd', a: real[0], b: real[1] }
      return { k: 's', c: real[0] }
    }).filter(Boolean)
    return out.length ? out : null
  }
  const radii = (cs, r) => {
    const v = [cs.borderTopLeftRadius, cs.borderTopRightRadius, cs.borderBottomRightRadius, cs.borderBottomLeftRadius].map(num).map((x) => Math.min(x, r.height / 2, r.width / 2))
    if (!v.some(Boolean)) return undefined
    return v.every((x) => x === v[0]) ? v[0] : v
  }
  const visible = (el) => {
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || num(cs.opacity) < 0.01) return false
    const r = el.getBoundingClientRect()
    // Visually hidden helpers (1px clipped boxes) carry screen-reader text only
    if (cs.position === 'absolute' && r.width <= 1 && r.height <= 1 && cs.overflow === 'hidden') return false
    return true
  }
  const clipOf = (el) => {
    let c = { l: R.x, t: R.y, r: R.right, b: R.bottom }
    for (let p = el; p && p !== root.parentElement; p = p.parentElement) {
      if (p === el && p.nodeType !== 1) continue
      const cs = getComputedStyle(p)
      if (p !== el && (cs.overflow !== 'visible' || cs.overflowX !== 'visible' || cs.overflowY !== 'visible')) {
        const pr = p.getBoundingClientRect()
        c = { l: Math.max(c.l, pr.x), t: Math.max(c.t, pr.y), r: Math.min(c.r, pr.right), b: Math.min(c.b, pr.bottom) }
      }
    }
    return c
  }
  const clipped = (r, c) => r.right <= c.l || r.bottom <= c.t || r.x >= c.r || r.y >= c.b || r.width <= 0 || r.height <= 0
  const intersect = (r, c) => ({ x: Math.max(r.x, c.l), y: Math.max(r.y, c.t), width: Math.min(r.right, c.r) - Math.max(r.x, c.l), height: Math.min(r.bottom, c.b) - Math.max(r.y, c.t) })

  // Layer groups: grid rows are named after their row header; known chrome areas by class name
  const areas = [['nav', 'Navigation'], ['topBar', 'Top bar'], ['titleRow', 'Title row'], ['toolbar', 'Toolbar']]
  const rowNames = new Map()
  const groupOf = (el) => {
    const row = el.closest('[role="row"]')
    if (row && root.contains(row)) {
      if (!rowNames.has(row)) {
        const header = row.querySelector('[role="rowheader"], [role="columnheader"]')
        let label = (header?.innerText || '').replace(/\s+/g, ' ').trim()
        if (row.querySelector('[role="columnheader"]')) label = 'Day headers'
        label = label.replace(/\s+,/g, ',')
        if (!label) label = 'Row'
        const index = rowNames.size + 1
        rowNames.set(row, `Row ${String(index).padStart(2, '0')} · ${label.slice(0, 40)}`)
      }
      return rowNames.get(row)
    }
    for (let p = el; p && p !== root; p = p.parentElement) {
      if (p.tagName === 'NAV') return 'Navigation'
      const cls = typeof p.className === 'string' ? p.className : ''
      for (const [frag, name] of areas) if (new RegExp(`(^|\\s)_?${frag}_`).test(cls)) return name
    }
    return 'Background'
  }

  const textStyle = (el) => {
    const cs = getComputedStyle(el)
    return {
      f: cs.fontFamily.split(',')[0].replace(/["']/g, '').trim(), fs: num(cs.fontSize), fw: cs.fontWeight, it: cs.fontStyle === 'italic' || undefined,
      c: parseColor(cs.color), ls: num(cs.letterSpacing) || undefined, lh: cs.lineHeight === 'normal' ? undefined : num(cs.lineHeight),
      up: cs.textTransform === 'uppercase' || undefined, u: cs.textDecorationLine.includes('underline') || undefined,
    }
  }

  const walk = (el, opacity) => {
    if (!visible(el)) return
    const cs = getComputedStyle(el)
    const op = opacity * num(cs.opacity)
    const r = el.getBoundingClientRect()
    const group = groupOf(el)
    if (el.tagName.toLowerCase() === 'svg') {
      const clip = clipOf(el)
      if (clipped(r, clip)) return
      const clone = el.cloneNode(true)
      clone.setAttribute('width', r.width); clone.setAttribute('height', r.height)
      for (const n of [clone, ...clone.querySelectorAll('*')]) {
        for (const a of [...n.attributes]) if (a.name === 'class' || a.name === 'style' || a.name.startsWith('data-') || a.name.startsWith('aria-')) n.removeAttribute(a.name)
      }
      const svg = clone.outerHTML.replace(/currentColor/g, cs.color).replace(/\s+/g, ' ').replace(/> </g, '><')
      // CSS rotation (e.g. a collapsed chevron): clockwise degrees around the center
      let rot = 0
      const m = cs.transform.match(/matrix\(([^)]+)\)/)
      if (m) { const [a, b] = m[1].split(',').map(Number); rot = Math.round(Math.atan2(b, a) * 180 / Math.PI) }
      const box = rot % 180 !== 0 ? { x: r.x + (r.width - r.height) / 2, y: r.y + (r.height - r.width) / 2, width: r.height, height: r.width } : r
      nodes.push({ t: 's', g: group, b: rel(box), svg, rot: rot || undefined, o: op < 0.999 ? op : undefined })
      return
    }
    const clip = clipOf(el)
    const bg = parseColor(cs.backgroundColor)
    const bgi = parseLayers(cs.backgroundImage)
    const sides = ['Top', 'Right', 'Bottom', 'Left']
    const bw = sides.map((s) => (cs[`border${s}Style`] === 'none' ? 0 : num(cs[`border${s}Width`])))
    const bc = sides.map((s, i) => (bw[i] ? parseColor(cs[`border${s}Color`]) : null))
    const hasBorder = bw.some((w, i) => w && bc[i])
    const sh = parseShadows(cs.boxShadow)
    if ((bg || bgi || hasBorder || sh) && !clipped(r, clip)) {
      const box = intersect(r, clip)
      const node = { t: 'r', g: group, b: rel(box), rad: radii(cs, r), o: op < 0.999 ? op : undefined }
      if (bg) node.bg = bg
      if (bgi) node.bgi = bgi
      if (hasBorder) { node.bw = bw.map((w, i) => (bc[i] ? w : 0)); node.bc = bc; if (cs.borderTopStyle === 'dashed' || cs.borderLeftStyle === 'dashed') node.dash = 1 }
      if (sh) node.sh = sh
      nodes.push(node)
    }
    // Pseudo-element stripes (e.g. the out-of-unit hatch drawn in ::before)
    const before = getComputedStyle(el, '::before')
    if (before.content !== 'none' && before.display !== 'none' && !clipped(r, clip)) {
      const layers = parseLayers(before.backgroundImage)
      const hatch = layers?.find((l) => l.k === 'h')
      if (hatch) nodes.push({ t: 'r', g: group, b: rel(intersect(r, clip)), rad: radii(cs, r), bgi: [hatch], o: op < 0.999 ? op : undefined })
    }
    // Text: consecutive text nodes become one run when they sit on one line
    let run = []
    const flush = () => {
      if (!run.length) return
      const text = run.map((n) => n.textContent).join('').replace(/\s+/g, ' ').trim()
      const range = document.createRange()
      range.setStartBefore(run[0]); range.setEndAfter(run[run.length - 1])
      run = []
      if (!text) return
      const rects = [...range.getClientRects()].filter((x) => x.width > 0)
      const tr = range.getBoundingClientRect()
      let c = clipOf(el)
      if (cs.overflow !== 'visible') c = { l: Math.max(c.l, r.x), t: Math.max(c.t, r.y), r: Math.min(c.r, r.right), b: Math.min(c.b, r.bottom) }
      if (!rects.length || clipped(tr, c)) return
      const lines = new Set(rects.map((x) => Math.round(x.top))).size
      const node = { t: 'x', g: group, b: rel(tr), s: text, ...textStyle(el), o: op < 0.999 ? op : undefined }
      if (lines > 1) node.lines = lines
      if (cs.textOverflow === 'ellipsis' && el.scrollWidth > el.clientWidth + 1) node.ell = r1(Math.min(c.r, r.right - num(cs.paddingRight)) - tr.x)
      nodes.push(node)
    }
    for (const child of el.childNodes) {
      if (child.nodeType === 3) { run.push(child); continue }
      flush()
      if (child.nodeType === 1) walk(child, op)
    }
    flush()
  }
  walk(root, 1)
  return { width: Math.round(R.width), height: Math.round(R.height), nodes }
}, rootSelector)

fs.writeFileSync(path.join(outDir, `${outName}.json`), JSON.stringify(data))
const groups = [...new Set(data.nodes.map((n) => n.g))]
console.log(`Captured ${data.nodes.length} layers in ${groups.length} groups, ${data.width}×${data.height}`)
console.log(`  ${path.relative(process.cwd(), path.join(outDir, outName))}.json / .png`)
await browser.close()
