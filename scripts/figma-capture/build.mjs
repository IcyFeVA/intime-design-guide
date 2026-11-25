#!/usr/bin/env node
/**
 * Turn a capture (capture.mjs) into self-contained scripts for the Figma MCP `use_figma` tool.
 * Each chunk stays under the tool's request limit; run them in order (chunk 1 creates the frame).
 *
 *   node scripts/figma-capture/build.mjs --in workforce-compact --parent 26592:46691
 *
 * Options:
 *   --in <name>          Capture name in scripts/figma-capture/out/ (required)
 *   --parent <node id>   Figma frame to build into, e.g. 26592:46691 from ?node-id=26592-46691 (required)
 *   --name <layer>       Name of the frame created inside the parent (default "Workforce Scheduling")
 *   --keep               Add to an existing frame of that name instead of replacing it
 *   --groups <a,b>       Only these groups (comma-separated; prefix match, e.g. "Row 1" or "Toolbar")
 *   --collection <name>  Variable collection to bind colors to (default Tokens)
 *   --mode <name>        Mode to match colors against and set on the frame (default Dark)
 *   --max <bytes>        Max chunk size (default 45000)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const args = {}
for (let i = 2; i < process.argv.length; i++) {
  const key = process.argv[i].replace(/^--/, '')
  if (key === 'keep') { args.keep = true; continue }
  args[key] = process.argv[++i]
}
if (!args.in || !args.parent) throw new Error('Usage: build.mjs --in <capture name> --parent <figma node id>')
const outDir = path.join(here, 'out')
const capture = JSON.parse(fs.readFileSync(path.join(outDir, `${args.in}.json`), 'utf8'))
const only = args.groups ? args.groups.split(',').map((s) => s.trim()) : null
const maxBytes = Number(args.max || 45000)

// Merge inline runs on one baseline with the same style ("6" "/" "8" → "6/8")
const nodes = []
for (const n of capture.nodes) {
  const p = nodes[nodes.length - 1]
  if (p && p.t === 'x' && n.t === 'x' && p.g === n.g && !p.lines && !n.lines && Math.abs(p.b[1] - n.b[1]) < 0.5 && p.fs === n.fs && p.fw === n.fw && p.f === n.f && String(p.c) === String(n.c)) {
    const gap = n.b[0] - (p.b[0] + p.b[2])
    if (gap > -0.5 && gap < 6) {
      p.s = `${p.s}${gap > 2 ? ' ' : ''}${n.s}`
      p.b = [p.b[0], p.b[1], Math.round((n.b[0] + n.b[2] - p.b[0]) * 10) / 10, p.b[3]]
      continue
    }
  }
  nodes.push({ ...n })
}

// Groups in first-appearance order; Background always first
const order = ['Background']
for (const n of nodes) if (!order.includes(n.g)) order.push(n.g)
const byGroup = new Map(order.map((g) => [g, []]))
for (const n of nodes) byGroup.get(n.g).push(n)
const bbox = {}
for (const [g, list] of byGroup) {
  if (!list.length) continue
  const x1 = Math.min(...list.map((n) => n.b[0])), y1 = Math.min(...list.map((n) => n.b[1]))
  const x2 = Math.max(...list.map((n) => n.b[0] + n.b[2])), y2 = Math.max(...list.map((n) => n.b[1] + n.b[3]))
  bbox[g] = [x1, y1, Math.round((x2 - x1) * 10) / 10, Math.round((y2 - y1) * 10) / 10]
}

// Palette and SVG dedupe
const palette = [], svgs = []
const pi = (c) => { if (!c) return undefined; const k = JSON.stringify(c); let i = palette.indexOf(k); if (i < 0) { palette.push(k); i = palette.length - 1 } return i }
const si = (s) => { let i = svgs.indexOf(s); if (i < 0) { svgs.push(s); i = svgs.length - 1 } return i }
const encode = (n) => {
  const o = { ...n }
  delete o.g
  if (o.bg) o.bg = pi(o.bg)
  if (o.bgi) o.bgi = o.bgi.map((l) => (l.k === 'd' ? { ...l, a: pi(l.a), b: pi(l.b) } : { ...l, c: pi(l.c) }))
  if (o.bc) o.bc = o.bc.map((c) => (c ? pi(c) : null))
  if (o.sh) o.sh = o.sh.map((s) => ({ ...s, c: pi(s.c) }))
  if (o.t === 'x') { o.c = pi(o.c); if (!o.lines) delete o.lh; if (o.f === 'Roboto') delete o.f }
  if (o.t === 's') o.svg = si(o.svg)
  for (const k of Object.keys(o)) if (o[k] === undefined) delete o[k]
  return o
}

const selected = order.filter((g) => byGroup.get(g).length && (!only || only.some((p) => g.startsWith(p))))
const encoded = selected.map((g) => [g, byGroup.get(g).map(encode)])

// Chunk by size
const builder = fs.readFileSync(path.join(here, 'figma-builder.js'), 'utf8').replace(/^\/\/.*\n/gm, '')
// Budget: builder + palette + group boxes are fixed; each node adds its JSON, plus its SVG the first time a chunk uses it
const chunks = []
const fixed = builder.length + JSON.stringify(palette).length + 1500
let cur = [], size = fixed, seen = new Set()
for (const [g, list] of encoded) {
  let part = []
  for (const n of list) {
    const extra = n.t === 's' && !seen.has(n.svg) ? svgs[n.svg].length + 20 : 0
    const s = JSON.stringify(n).length + 1 + extra + g.length / 4
    if (size + s > maxBytes && (part.length || cur.length)) {
      if (part.length) cur.push([g, part])
      chunks.push(cur); cur = []; part = []; size = fixed; seen = new Set()
    }
    if (n.t === 's') seen.add(n.svg)
    part.push(n); size += s + (n.t === 's' && extra ? 0 : 0)
  }
  if (part.length) cur.push([g, part])
}
if (cur.length) chunks.push(cur)

for (const old of fs.readdirSync(outDir).filter((f) => f.startsWith(`${args.in}.chunk-`))) fs.unlinkSync(path.join(outDir, old))
const files = chunks.map((chunk, i) => {
  const used = JSON.stringify(chunk)
  const P = palette.map((p) => JSON.parse(p))
  const S = Object.fromEntries(svgs.map((s, j) => [j, s]).filter(([j]) => new RegExp(`"svg":${j}[,}]`).test(used)))
  const G = Object.fromEntries(chunk.map(([g]) => [g, bbox[g]]))
  const meta = { parentId: args.parent.replace('-', ':'), name: args.name || 'Workforce Scheduling', width: capture.width, height: capture.height, replace: !args.keep, first: i === 0, collection: args.collection || 'Tokens', mode: args.mode || 'Dark' }
  const code = `const META = ${JSON.stringify(meta)};\nconst P = ${JSON.stringify(P)};\nconst S = ${JSON.stringify(S)};\nconst GROUPS = ${JSON.stringify(G)};\nconst DATA = ${used};\n${builder}`
  const file = path.join(outDir, `${args.in}.chunk-${i + 1}.js`)
  fs.writeFileSync(file, code)
  return { file: path.relative(process.cwd(), file), bytes: code.length, groups: chunk.map(([g, l]) => `${g} (${l.length})`).join(', ') }
})
console.log(`${files.length} chunk(s) for use_figma, run in order:`)
for (const f of files) console.log(`  ${f.file}  ${(f.bytes / 1024).toFixed(1)} KB  ${f.groups}`)
