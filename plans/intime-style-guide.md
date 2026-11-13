# InTime Design Guide: Scaffold Plan

## Goal
Replace the sign-in demo with a dark-themed, easy-to-navigate design guide for InTime's (intime.com) police and fire department workforce scheduling web app. Build it with Mantine, the same library the production app uses, and Lucide icons. Fill it with realistic starter values tagged **Draft**. The structure should make later updates from real Figma frames quick, data-driven edits.

## Decisions (confirmed with user)
- Replace the sign-in demo entirely. The guide becomes the app.
- Build the UI with Mantine components and theme tokens. Use Lucide for icons.
- Placeholder values: realistic starter values, each marked "Draft".
- Page set: the full set (listed below).
- Navigation: grouped sidebar, deep-linkable routes, Ctrl/Cmd+K search, and an on-page table of contents.
- Developer tools: copy buttons for hex values, CSS variables, and Mantine tokens, plus TSX usage snippets.
- Routing: React Router with hash URLs (`/#/foundations/colors`), so refreshes and shared links work on the static deploy.
- Theme: dark by default, with a light-mode preview toggle.
- Fonts: Inter for UI, JetBrains Mono for code, both from Google Fonts. Draft.
- Palette: a public-safety draft palette. Slate neutrals, blue primary, Police (blue) and Fire (red) accents, and semantic shift-state colors.

## Dependencies
- Add `react-router` (v7) and use `createHashRouter`.
- Add `@mantine/spotlight` (same major version as `@mantine/core`, ^9) for Cmd+K search.
- Install with `npm install` so `package-lock.json` updates. The existing `.figma/make/dev.json` reinstalls dependencies when the lockfile changes.
- Load fonts with a Google Fonts `<link>` in `index.html` (Inter 400/500/600/700, JetBrains Mono 400/500). Update the title to "InTime Design Guide", the description, and set `theme-color` to the dark surface color.

## Architecture
```
src/
  main.tsx                 MantineProvider + Spotlight + RouterProvider
  theme.ts                 createTheme: colors, fonts, radius, spacing, shadows, component defaults
  tokens/                  single source of truth, edited when Figma frames arrive
    colors.ts              palettes + semantic tokens {name, value, cssVar, mantine, usage, status}
    typography.ts          type scale {role, size, lineHeight, weight, usage, status}
    spacing.ts, radius.ts, shadows.ts, motion.ts, breakpoints.ts, zIndex.ts
    icons.ts               curated Lucide icons grouped by domain
    status.ts              shift/duty states (label, color token, icon, meaning)
  content/
    pages.ts               page registry: {path, title, group, icon, description, status, keywords, component}
    changelog.ts           entries {date, page, summary}
  components/              guide building blocks
    AppShellLayout.tsx     header, grouped sidebar nav, main content, TOC aside
    PageHeader.tsx         title, description, status badge, last-updated
    Section.tsx            anchored h2 with id; feeds the TOC
    TableOfContents.tsx    built from Section ids; scroll-spy
    StatusBadge.tsx        Draft / Confirmed / Needs review
    TokenSwatch.tsx, TokenTable.tsx
    CopyValue.tsx          Mantine CopyButton + Tooltip ("Copied")
    CodeBlock.tsx          JetBrains Mono block with copy; plain, no highlighter
    Preview.tsx            framed demo area with optional "show code" toggle
    DoDont.tsx             paired do/don't guidance cards
    FigmaSlot.tsx          dashed "Awaiting Figma frame" placeholder with notes
  pages/                   one file per route (default exports)
  styles/global.css        minimal resets + scrollbar/selection for dark mode
```
- Delete `src/App.tsx`, `src/App.css`, and the old `index.css` contents. Do the same for any sign-in-only styling.
- Pages read only from `tokens/*`. A Figma update should mean editing a token file, flipping `status` to `confirmed`, and adding a changelog entry.
- `pages.ts` drives the sidebar, the search actions, the Overview page cards, and the Previous/Next links at the bottom of each page.

## Theme and visual direction
- Mantine `defaultColorScheme="dark"`. A `localStorageColorSchemeManager` persists the toggle choice. The header has a sun/moon `ActionIcon` labeled "Preview light mode".
- Dark surfaces: a custom `dark` palette on deep slate (around #0B0F14 for the body, #11161D for surfaces, #18202A for raised surfaces, #263140 for borders). This gives a crisp, operational, control-room feel without pure black.
- `primaryColor`: a custom `intime` blue (10 shades, around #3B82F6 at shade 6). Accents: `police` blue-indigo and `fire` red-orange. Semantic colors: success, warning, danger, info.
- Shift-state tokens: On duty, Scheduled, Overtime, Open shift, Leave/PTO, Sick, Training, Conflict, Off. Each has a color, an icon, and a meaning.
- Default radius `sm` (6px), compact density, and tabular numerals (`font-variant-numeric: tabular-nums`) on time and number displays.
- Use exhibition-quality restraint: one accent per view, clear hierarchy, and generous whitespace inside a dense information layout.

## Layout and navigation
- Mantine `AppShell`:
  - Header (56px): InTime wordmark (text plus a simple Lucide `Clock`/`Shield` mark, marked as a draft logo), a "Design Guide" label, a version badge (`v0.1 Draft`), a search trigger showing `⌘K`/`Ctrl K`, and the theme toggle.
  - Navbar (260px): `NavLink` items grouped under Foundations, Components, Patterns, and Resources. Each item has a Lucide icon and a small dot showing whether the page is a draft. The active route is highlighted. On mobile the navbar collapses behind a `Burger`.
  - Main: max content width of about 960px.
  - Aside (220px, hidden below `lg`): "On this page" TOC with scroll-spy.
- Spotlight indexes every page plus each page's sections and keywords, for example "overtime" leads to Status & Shift States.
- Pressing `/` or Cmd/Ctrl+K opens search. Section headings have hover anchor links that copy a deep URL.
- Unknown routes show a 404 page linking back to Overview.

## Pages (routes)
**Getting started**
- `/` Overview: purpose, how to use the guide, status legend (Draft / Confirmed / Needs review), page cards by group, and recent changelog entries.

**Foundations**
- `/foundations/colors`: brand, neutrals (dark and light), Police/Fire accents, semantic colors, and shift states. Swatches show hex, CSS variable (`--mantine-color-intime-6`), Mantine token (`intime.6`), a contrast-ratio note, and usage. Each value has a copy button.
- `/foundations/typography`: font families, a type scale table with live specimens (Display, H1 to H4, Body L/M/S, Label, Caption, Mono), a numerals and time-format section (24h vs 12h, tabular numbers), and snippets for `<Title>`/`<Text>`.
- `/foundations/icons`: searchable grid of curated Lucide icons grouped by domain (scheduling, personnel, departments/units, status, actions, navigation). Clicking copies `import { X } from 'lucide-react'`. Also covers size and stroke rules (16/20/24, stroke 1.75) and labeling for accessibility.
- `/foundations/spacing-layout`: spacing scale visualizer, breakpoints, grid/containers, and AppShell layout dimensions.
- `/foundations/radius-elevation`: radius scale, shadow/elevation levels shown on dark surfaces, and z-index layers.
- `/foundations/motion`: durations and easing tokens with a hover/play demo, and reduced-motion guidance.

**Components** (Mantine-based; each has a live Preview, a props/variants table, a code snippet, do/don't guidance, and a FigmaSlot)
- `/components/buttons`: variants, sizes, icon buttons, loading/disabled, and destructive actions.
- `/components/forms`: inputs, selects, date/time-style inputs built from core inputs (no new dates package), validation states, and the field layout pattern.
- `/components/data-tables`: roster table with sticky header, sorting UI, row states, and density options.
- `/components/shift-cells`: calendar day cells and shift blocks (time range, assignee, unit, state color), plus compact and expanded variants.
- `/components/status-badges`: shift states and department tags (Police/Fire). Each state has an icon and text label, not color alone.
- `/components/feedback`: alerts, notifications, modals/confirmations, and tooltips.

**Patterns**
- `/patterns/schedule-views`: illustrative day/week/month views and a shift-swap request card. These are static mock data only, with no persistence.
- `/patterns/states`: empty, loading (skeleton), error, and no-permission states.

**Resources**
- `/resources/accessibility`: contrast targets, focus states, keyboard navigation, color-independent status, and touch targets.
- `/resources/tokens`: full theme export with copyable `theme.ts` and CSS variables, plus naming conventions.
- `/resources/changelog`: entries from `changelog.ts`, and how to submit Figma frames for updates.

## Behavior and edge cases
- Copy actions use Mantine `CopyButton` and show "Copied" feedback for 1.5s. They fall back gracefully if the clipboard API is unavailable.
- Search with no results shows "No matches" with a link to Overview.
- On route change, scroll to the top unless a hash anchor is present.
- Every page shows its status badge. Draft values have a subtle "Draft" chip.
- Accessibility: semantic headings in order, visible focus rings, `aria-label` on icon-only controls, and AA contrast for text on dark surfaces.
- Responsiveness: usable at 320px. The TOC hides below `lg`, and the navbar collapses below `sm`.
- Light preview mode uses Mantine's light scheme with the same tokens, so components render correctly in both modes.

## Verification
- `npm run lint` and `npm run build` (tsc + vite) pass.
- Rerun `figma make verify-bootstrap` after the dependency change. Confirm the preview serves `/` and that hash routes load on refresh.
- Manually check in the preview: every sidebar link resolves, Cmd+K finds pages and sections, copy buttons copy the right values, the theme toggle persists, the TOC tracks scrolling, and the mobile layout collapses correctly.
- Rerun `figma make verify-deploy` and `figma make verify-deploy-preview` to confirm the static `dist` output still validates.
- Update `README.md` and `.github/copilot-instructions.md` to describe the guide's structure and the "edit tokens, flip status, add changelog" update workflow, and remove the sign-in demo references.

## Out of scope
- Real authentication, backend, or data persistence.
- Extracting real brand values from intime.com. These will come from the user's Figma frames.
- A syntax-highlighting library or the Mantine dates package. Add these later if real designs need them.
