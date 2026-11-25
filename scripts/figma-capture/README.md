# Figma capture

Copies a live demo from the design guide into Figma as editable layers: text, vector icons and boxes, grouped by area and by grid row, with colors bound to the file's `Tokens` variables (Dark mode). It's a faithful snapshot, not a component library.

It runs in two steps: `capture.mjs` reads the rendered page in a headless browser, and `build.mjs` turns that into scripts for the Figma MCP `use_figma` tool. An agent (Claude Code with the Figma connector) runs those scripts. The project skill `.claude/skills/figma-push` describes the whole workflow, so in Claude Code you can just ask for it.

## 1. Capture

Start the dev server (`npm run dev`), then:

```sh
npm run figma:capture -- --route /patterns/workforce-scheduling --wait '#desktop' \
  --click 'role=button[name="Target resolution"]' \
  --out workforce-compact
```

`--click` is repeatable and runs in order, so you can click the demo into any state first. Examples for the Workforce Scheduling demo:

| State | Clicks (after Target resolution) |
| --- | --- |
| Detailed density | `--click '[data-target] [aria-label^="View density"]' --click 'role=menuitem[name=/Detailed/]'` |
| Stacked density | same, with `/Stacked/` |
| Collapse the Day watch's Staffing | `--click '[data-target] button[aria-expanded="true"]:has-text("Staffing")'` |

Other options: `--height` (default 982, the root is captured at exactly this height), `--width` (1512), `--root` (default `[data-target]`, the demo frame in Target resolution), `--scheme light`, `CHROME=/path/to/chrome`.

Output goes to `scripts/figma-capture/out/` (git-ignored): `<name>.png` to check the state, `<name>.json` for the next step.

## 2. Build

Take the target frame's node id from its Figma link (`?node-id=26592-46691` → `26592:46691`):

```sh
npm run figma:build -- --in workforce-compact --parent 26592:46691
```

This writes `<name>.chunk-1.js`, `-2.js`, … Each chunk fits in one `use_figma` call. Run them in order: chunk 1 creates (or replaces) a frame named `Workforce Scheduling` inside the parent, and later chunks add to it.

| Option | Use |
| --- | --- |
| `--name <layer>` | Name of the frame created in the parent |
| `--keep` | Add to the existing frame instead of replacing it |
| `--groups "Row 17,Row 18"` | Only these groups (prefix match). Handy to redo a few rows |
| `--collection`, `--mode` | Variables to bind colors to (default `Tokens` / `Dark`) |
| `--max <bytes>` | Chunk size (default 45000) |

## 3. Run in Figma

Paste each chunk's full content as the `code` of a `use_figma` call (fileKey from the Figma link), in order. Each returns what it created and how many colors it bound to variables. Then take a screenshot of the parent and compare it with `<name>.png`.

## What it handles

- Fills, per-side borders, dashed borders, radii, box shadows (including inset), solid and diagonal-split gradients, and the out-of-unit hatch (also when it's drawn in `::before`).
- Text runs with font, weight, size, color, letter spacing, uppercase and ellipsis. Inline runs on one baseline (`6` `/` `8`) are merged.
- Inline SVG icons, including CSS rotation (collapsed chevrons, ▼ arrows).
- Layer groups: `Navigation`, `Top bar`, `Title row`, `Toolbar`, then one frame per grid row, named after its row header (`Row 11 · T. Nguyen`).
- Skips visually hidden screen-reader text and anything clipped out of view.

Not handled: images, radial gradients, blur effects. Layers use absolute positions, not auto-layout.
