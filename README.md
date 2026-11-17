# InTime Design Guide

A design guide for InTime's ([intime.com](https://www.intime.com)) police and fire workforce scheduling web app. It's built with the same stack as the product, Mantine and Lucide, so developers can copy the tokens, components, and snippets straight into the app.

The guide is dark-first and has a light-mode preview toggle. Every value starts as **Draft** and moves to **Confirmed** once it's matched to a production Figma frame.

## Run locally

```sh
npm install
npm run dev
```

Other scripts: `npm run build`, `npm run lint`, `npm run preview`.

## Structure

| Path | Purpose |
| --- | --- |
| `src/tokens/*` | Single source of truth for colors, typography, spacing, radius, shadows, motion, icons, and shift states. Each value has a `status`. |
| `src/theme.ts` | Mantine theme generated from the tokens. |
| `src/content/pages.ts` | Page registry. It drives the sidebar, the ⌘K search, the table of contents, the overview cards, and the previous/next links. |
| `src/content/changelog.ts` | Guide history, newest first. |
| `src/components/*` | Guide building blocks: `Section`, `Preview`, `CodeBlock`, `CopyValue`, `DoDont`, `FigmaSlot`, `PropsTable`, `StatusBadge`, and the layout. |
| `src/pages/**` | One file per route. Routes use hash URLs, e.g. `/#/foundations/colors?section=brand`. |

## Updating from Figma

1. Share the Figma frame or screenshot along with context: which page it covers and what it confirms.
2. Edit the matching values in `src/tokens/*`. Don't hard-code them in pages.
3. Flip each value's `status` to `confirmed`, and do the same for the page in `src/content/pages.ts`. Bump the page's `updated` date.
4. Replace the page's `<FigmaSlot>` with the real reference, then add an entry to `src/content/changelog.ts`.

## Updating theme colors from Figma

The six themes (Light, Terra, Candy, Dark, Dusk, Miami Vice) are raw Figma variable exports in `src/tokens/themes/`. The guide, the Colors page and every download on the Theme Export page (`/#/resources/theme-export`) are built from these files.

### Changing an existing theme

1. Export the theme's variables from Figma as CSS.
2. Open the matching file in `src/tokens/themes/`: `dark.css`, `light.css`, `dusk.css`, `miami-vice.css`, `terra.css` or `candy.css`.
3. Replace everything below the first comment line with the new export. Keep that comment line.
4. Check the Colors page and its "All color tokens" table for missing values.

Nothing else needs editing.

### Adding a new theme

1. Save the export as `src/tokens/themes/<name>.css`, with the same one-line comment at the top.
2. Add it to the `themes` list in `src/tokens/themes/index.ts`: an id, a label, `light` or `dark`, a status and a one-line description. It then shows up everywhere, including the download files and the theme switcher code on Theme Export.

### When the export uses a new color family

If a value points at a Figma color the guide doesn't know yet, such as `var(--orange-orange-6)`, the Colors page marks it with a `*` and shows the raw `var(...)` instead of a color. Add the color family to `primitivePalettes` near the top of `src/tokens/themes/index.ts`. Figma's color families map to Mantine's default palettes, and the primary color is cyan.

## Gotchas

### Theme exports

- **Check a dark export before saving it.** Figma has exported a "dark" file that was a copy of light. Compare it with the current file before overwriting.
- **Only colors become CSS variables.** `--radius-*`, `--padding-*` and `--spacing-*` in the exports are ignored. Use `var(--mantine-radius-*)`, `var(--mantine-spacing-*)` or plain px.
- **A `*` in the Colors tables means an assumed value.** The export pointed at a Figma color, and the guide filled it in from Mantine's default palette. The real Figma value may differ slightly.
- **Watch for leftover cyan in non-cyan themes.** Some tokens in Dusk, Miami Vice, Terra and Candy still point at the cyan primary color, probably copied over from Dark or Light. The Theme Export page has a hidden "Values to check" section that lists them. Set `SHOW_TO_CHECK` to `true` in `src/pages/resources/ThemeExport.tsx` and add `'to-check'` back to the page's sections in `src/content/pages.ts`.
- **Windows line endings are fine.** Figma exports use them, and the parser handles both.

### Using the exported theme in the app

- Import `intime-themes.css` **after** `@mantine/core/styles.css`.
- A theme only applies when `<html>` has both its `data-intime-theme` attribute and the matching Mantine color scheme. `useIntimeTheme()` sets both. Setting only the attribute does nothing.
- Dark and Light also apply when there's no attribute, so an app that only toggles light and dark keeps working.
- Only the primary color follows the theme: `color="intime"`, or no color. Other palettes (`red`, `teal`, …) stay Mantine's defaults. Use the theme tokens for status colors.

### Writing guide pages

- **Never use hex values in CSS.** Use the theme tokens (`--background-body`, `--text-dimmed`, …) so every theme works.
- **Section ids must match the page registry** in `src/content/pages.ts`, or the table of contents and search links break.
- **Some section ids are hidden.** `component` and `usage` sections are hidden while `SHOW_CODE` is off, and `figma` sections while `SHOW_FIGMA` is off (`src/content/flags.ts`). Don't use those ids for content that must be visible.
- **Prefix files from `public/`** with `import.meta.env.BASE_URL`. A bare `/figma/…` path breaks on GitHub Pages.
- **When a page is approved**, set it and its tokens to `confirmed` and add a changelog entry.
- **Mantine popovers and menus render in a portal**, so they escape `overflow: hidden` demo frames.
- **`ScrollArea` inside a flex column** needs `min-height: 0` and `flex: 1` to scroll.
- **Run `npx tsc -b` and `npx eslint src` after every change.** Both must pass with no output.

## Adding a page

Add an entry to `src/content/pages.ts` with its sections. Create the page file, start it with `<PageHeader />`, and add one `<Section id=…>` for each registered section, using the same ids.
