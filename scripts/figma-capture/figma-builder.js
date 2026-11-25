// Figma plugin-side builder. build.mjs prepends `const META, P, S, GROUPS, DATA` and the
// whole file runs through the Figma MCP `use_figma` tool (top-level await, `return` = output).
// Not a module: do not import it.
//
// META: { parentId, name, width, height, replace, first, collection, mode }
// P: palette of [r, g, b, a] (0–1); S: { id: svg string }; GROUPS: { name: [x, y, w, h] }
// DATA: [[groupName, [node, …]], …] where node.t is r (box), x (text) or s (svg).

const parent = await figma.getNodeByIdAsync(META.parentId);
if (!parent || !('children' in parent)) throw new Error(`Parent ${META.parentId} not found or not a frame`);
let root = parent.children.find((n) => n.name === META.name);
if (META.first && root && META.replace) { root.remove(); root = null; }
if (!root) {
  root = figma.createFrame();
  root.name = META.name;
  parent.appendChild(root);
  root.x = 0; root.y = 0;
  root.resize(META.width, META.height);
  root.clipsContent = true;
  root.fills = [];
}

// Colors → variables of one collection/mode, matched by resolved value
const collections = await figma.variables.getLocalVariableCollectionsAsync();
const collection = collections.find((c) => c.name === META.collection);
const mode = collection?.modes.find((m) => m.name === META.mode);
if (collection && mode) root.setExplicitVariableModeForCollection(collection, mode.modeId);
const varMap = [];
if (collection && mode) {
  for (const id of collection.variableIds) {
    const v = await figma.variables.getVariableByIdAsync(id);
    if (!v || v.resolvedType !== 'COLOR') continue;
    let val = v.valuesByMode[mode.modeId];
    for (let i = 0; i < 5 && val && val.type === 'VARIABLE_ALIAS'; i++) {
      const a = await figma.variables.getVariableByIdAsync(val.id);
      val = a ? a.valuesByMode[Object.keys(a.valuesByMode)[0]] : null;
    }
    if (val && 'r' in val) varMap.push({ v, c: val });
  }
}
const near = (a, b) => Math.abs(a - b) <= 1.6 / 255;
const findVar = (c) => varMap.find(({ c: x }) => near(x.r, c[0]) && near(x.g, c[1]) && near(x.b, c[2]) && Math.abs((x.a ?? 1) - c[3]) < 0.02);
let bound = 0, raw = 0;
const paint = (i) => {
  const c = P[i];
  const p = { type: 'SOLID', color: { r: c[0], g: c[1], b: c[2] }, opacity: c[3] };
  const hit = findVar(c);
  if (hit) { bound++; return figma.variables.setBoundVariableForPaint(p, 'color', hit.v); }
  raw++; return p;
};
const rgba = (i) => { const c = P[i]; return { r: c[0], g: c[1], b: c[2], a: c[3] }; };
const effect = (sh) => {
  const e = { type: sh.inset ? 'INNER_SHADOW' : 'DROP_SHADOW', color: rgba(sh.c), offset: { x: sh.x, y: sh.y }, radius: sh.blur, spread: sh.spread, visible: true, blendMode: 'NORMAL' };
  if (!sh.inset) e.showShadowBehindNode = false;
  const hit = findVar(P[sh.c]);
  return hit ? figma.variables.setBoundVariableForEffect(e, 'color', hit.v) : e;
};

// Fonts: load what the data needs; fall back to Roboto Regular when a family is missing
const WEIGHTS = { 100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 800: 'ExtraBold', 900: 'Black' };
const available = new Set((await figma.listAvailableFontsAsync()).map((f) => `${f.fontName.family}|${f.fontName.style}`));
const fontOf = (n) => {
  let style = WEIGHTS[n.fw] || 'Regular';
  if (n.it) style = style === 'Regular' ? 'Italic' : `${style} Italic`;
  const family = n.f || 'Roboto';
  for (const candidate of [{ family, style }, { family, style: Number(n.fw) >= 600 ? 'Bold' : 'Regular' }, { family: 'Roboto', style }, { family: 'Roboto', style: 'Regular' }]) {
    if (available.has(`${candidate.family}|${candidate.style}`)) return candidate;
  }
  return { family: 'Inter', style: 'Regular' };
};
const fonts = new Map();
for (const [, list] of DATA) for (const n of list) if (n.t === 'x') { const f = fontOf(n); fonts.set(`${f.family}|${f.style}`, f); }
await Promise.all([...fonts.values()].map((f) => figma.loadFontAsync(f)));

// Group frames (absolute layout, sized to their content)
const groupFrame = (name) => {
  let g = root.children.find((n) => n.name === name);
  if (!g) {
    const [x, y, w, h] = GROUPS[name];
    g = figma.createFrame(); g.name = name; g.fills = []; g.clipsContent = false;
    root.appendChild(g); g.x = x; g.y = y; g.resize(Math.max(w, 1), Math.max(h, 1));
  }
  return g;
};

const hatchFrame = (h, w, hgt, rad) => {
  const f = figma.createFrame(); f.name = 'Hatch'; f.fills = []; f.clipsContent = true; f.resize(Math.max(w, 1), Math.max(hgt, 1));
  if (rad !== undefined) { if (typeof rad === 'number') f.cornerRadius = rad; else [f.topLeftRadius, f.topRightRadius, f.bottomRightRadius, f.bottomLeftRadius] = rad; }
  const c = P[h.c];
  let lines = '';
  for (let k = 0; k * h.p <= (w + hgt) / Math.SQRT2 + h.p; k++) { const d = Math.SQRT2 * (k * h.p + h.w / 2); lines += `<line x1="${d}" y1="0" x2="0" y2="${d}" />`; }
  const sv = figma.createNodeFromSvg(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${hgt}" viewBox="0 0 ${w} ${hgt}"><g stroke="rgb(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)})" stroke-opacity="${c[3]}" stroke-width="${h.w}">${lines}</g></svg>`);
  sv.name = 'stripes'; f.appendChild(sv); sv.x = 0; sv.y = 0;
  return f;
};

const stop = (i, position) => ({ position, color: rgba(i) });
let count = 0;
const failed = [];
for (const [gname, list] of DATA) {
  const g = groupFrame(gname);
  const [gx, gy] = GROUPS[gname];
  for (const n of list) {
    const [x, y, w, h] = n.b;
    let node;
    try {
      if (n.t === 'r') {
        const hatch = (n.bgi || []).find((l) => l.k === 'h');
        if (hatch && !n.bg && n.bgi.length === 1 && !n.bw) {
          node = hatchFrame(hatch, w, h, n.rad);
        } else {
          node = figma.createRectangle();
          node.name = n.bw ? 'Box' : 'Fill';
          node.resize(Math.max(w, 0.01), Math.max(h, 0.01));
          const fills = n.bg !== undefined ? [paint(n.bg)] : [];
          for (const l of [...(n.bgi || [])].reverse()) {
            if (l.k === 's') fills.push(paint(l.c));
            else if (l.k === 'd') fills.push({ type: 'GRADIENT_LINEAR', gradientTransform: [[0.5, -0.5, 0.5], [0.5, 0.5, 0]], gradientStops: [stop(l.a, 0), stop(l.a, 0.5), stop(l.b, 0.5), stop(l.b, 1)] });
          }
          node.fills = fills;
          if (n.bw) {
            node.strokes = [paint(n.bc.find((c) => c !== null))];
            node.strokeAlign = 'INSIDE';
            const [t, r, b, l] = n.bw;
            if (t === r && r === b && b === l) node.strokeWeight = t;
            else { node.strokeTopWeight = t; node.strokeRightWeight = r; node.strokeBottomWeight = b; node.strokeLeftWeight = l; }
            if (n.dash) node.dashPattern = [4, 3];
          }
          if (n.rad !== undefined) { if (typeof n.rad === 'number') node.cornerRadius = n.rad; else [node.topLeftRadius, node.topRightRadius, node.bottomRightRadius, node.bottomLeftRadius] = n.rad; }
          if (n.sh) node.effects = n.sh.map(effect);
          if (hatch) { g.appendChild(node); node.x = x - gx; node.y = y - gy; count++; node = hatchFrame(hatch, w, h, n.rad); }
        }
      } else if (n.t === 'x') {
        node = figma.createText();
        node.fontName = fontOf(n);
        node.characters = n.up ? n.s.toUpperCase() : n.s;
        node.fontSize = n.fs;
        if (n.ls) node.letterSpacing = { unit: 'PIXELS', value: n.ls };
        if (n.c !== undefined) node.fills = [paint(n.c)];
        if (n.u) node.textDecoration = 'UNDERLINE';
        if (n.lines) { node.textAutoResize = 'HEIGHT'; node.resize(w + 2, node.height); if (n.lh) node.lineHeight = { unit: 'PIXELS', value: n.lh }; }
        else if (n.ell) { node.textAutoResize = 'HEIGHT'; node.resize(Math.max(n.ell, 4), node.height); node.textTruncation = 'ENDING'; node.maxLines = 1; }
        else node.textAutoResize = 'WIDTH_AND_HEIGHT';
        node.name = n.s.slice(0, 40);
      } else {
        node = figma.createNodeFromSvg(S[n.svg]);
        node.name = 'icon';
        node.resize(Math.max(w, 1), Math.max(h, 1));
      }
    } catch (e) { failed.push(`${n.t} ${n.s || ''} ${e.message}`.slice(0, 120)); continue; }
    if (n.o !== undefined) node.opacity = n.o;
    g.appendChild(node);
    if (n.rot) {
      // Rotate clockwise (CSS) around the box center
      const a = n.rot * Math.PI / 180, cos = Math.cos(a), sin = Math.sin(a);
      const cx = x - gx + w / 2, cy = y - gy + h / 2;
      node.relativeTransform = [[cos, -sin, cx - (cos * w / 2 - sin * h / 2)], [sin, cos, cy - (sin * w / 2 + cos * h / 2)]];
    } else {
      const lh = n.lines && n.lh ? (n.lh - n.fs * 1.172) / 2 : 0;
      node.x = x - gx; node.y = y - gy - lh;
    }
    count++;
  }
}
return { rootId: root.id, created: count, colorsBoundToVariables: bound, rawColors: raw, failed, groups: DATA.map(([g, l]) => `${g}: ${l.length}`) };
