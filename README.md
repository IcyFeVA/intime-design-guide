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

## Adding a page

Add an entry to `src/content/pages.ts` with its sections. Create the page file, start it with `<PageHeader />`, and add one `<Section id=…>` for each registered section, using the same ids.
