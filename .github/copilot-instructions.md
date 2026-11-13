# Copilot Instructions

## Project Intent
- This is the InTime (intime.com) design guide for a police and fire workforce scheduling web app. It is iterated from Figma frames.
- Build with Mantine components and Lucide React icons, the same stack as the product.
- All schedule data is illustrative mock data. Do not add persistence, network requests, or authentication.

## Content Model
- Token values live only in `src/tokens/*`. `src/theme.ts` derives the Mantine theme from them.
- `src/content/pages.ts` registers every page and its sections. Section ids must match the `<Section id>` values on the page.
- Values have a status of `draft`, `review`, or `confirmed`. When a Figma frame confirms a value, update the token, set its status to `confirmed`, and add a `src/content/changelog.ts` entry.

## UI Conventions
- Keep the Mantine core and spotlight stylesheets imported in `src/main.tsx`, and keep the app wrapped in `MantineProvider`. The default scheme is dark.
- Prefer Mantine components and theme tokens over hand-built equivalents.
- Use CSS variables (`--intime-surface`, `--intime-surface-raised`, `--intime-border`, `--mantine-color-*`) so both color schemes work.
- Show shift states with an icon and a label, never color alone.
- Preserve responsive layouts, semantic labels, keyboard access, and visible focus states.

## Commands
- `npm run dev` starts the local app.
- `npm run build` type-checks and builds for production.
- `npm run lint` checks the source with ESLint.
