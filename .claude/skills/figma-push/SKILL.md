---
name: figma-push
description: Copy a live demo from this design guide into a Figma frame as editable layers (text, icons, boxes, colors bound to Tokens variables). Use when the user asks to add, push, sync or recreate a demo, page section or view state (e.g. a density, a collapsed row) in Figma, or to update such a frame after the demo changed.
---

# Push a demo to Figma

The tooling lives in `scripts/figma-capture/` (read its README for all options). Don't rebuild layouts by hand or write new capture code: capture the real demo in the state the user wants, build chunks, run them.

## Steps

1. **Parse the Figma link**: fileKey from `/design/<fileKey>/`, node id from `?node-id=26592-46691` → `26592:46691`. Call `create_session`, load the `figma-use` and `figma-generate-design` skill resources once (required before `use_figma`). Inspect the target node (type, size, existing children) with a read-only `use_figma` or `get_metadata`. If it already holds content the user may have edited, say what will be replaced.
2. **Start the dev server** in the background (`npm run dev`) unless `curl -s localhost:5173` already answers.
3. **Capture** the state the user asked for: `npm run figma:capture -- --route <route> --wait '#<first section id>' --click '<selector>' … --out <name>`. Set the state with clicks rather than editing layers later (density menu, collapse toggles, filters). See the README for Workforce recipes. Match `--height` to the target frame. Read `out/<name>.png` to check the state before building.
4. **Build**: `npm run figma:build -- --in <name> --parent <node id>`. Use `--groups` to redo only some rows, `--keep` to add to an existing frame.
5. **Run** each `out/<name>.chunk-N.js` in order: read the file and pass its exact content as `code` to `use_figma` (`skillNames: "resource:figma-use,resource:figma-generate-design"`). Never retype or edit the data by hand. Check each result's `failed` list.
6. **Verify** with `get_screenshot` of the parent and compare it with the PNG. Fix with small targeted `use_figma` edits, not a full rebuild.
7. Stop the dev server if you started it.

## Edits on an existing pushed frame

Pushed frames have one layer group per grid row (`Row 11 · T. Nguyen`), so many edits are simple without a new capture:
- **Remove a row**: delete its group, then move the groups below it up by its height.
- **Make room**: move groups down, and stretch the `Background` rectangles and the frames when the frame gets taller.
- **Changed demo state or new rows**: capture again with the right clicks and build with `--groups` and `--keep`. For rows that aren't in view, capture with a larger `--height` and then move the new groups into place.

Frames pushed before this tooling existed use older group names (`Officers`, `Staffing`, …) and need the same kind of edits, by y position.

## Gotchas

- `use_figma` requests must stay under about 100 KB. Chunks default to 45 KB; lower `--max` if a call is rejected.
- Text that sits in one element as several text nodes is merged in the capture; check the PNG if a label reads oddly (missing spaces).
- Only what fits in `--height` is captured. Use a larger `--height` to get more rows.
