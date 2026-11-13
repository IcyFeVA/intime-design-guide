# InTime Design Guide

Design guide for InTime's police/fire workforce scheduling app. Vite + React 19 + TypeScript, **Mantine 9** (core, hooks, spotlight), **lucide-react**, react-router 7 (hash routes: `/#/patterns/navigation?section=pinning`). Dark-first with a light toggle. All data is illustrative: no persistence, network calls or auth.

`.github/copilot-instructions.md` holds the same project rules for Copilot. Keep the two in sync.

## Commands

- `npm run dev`: dev server on http://localhost:5173
- `npx tsc -b`: type-check (faster than `npm run build`)
- `npx eslint src`: lint
- Run both after every change. They must pass with no output.

## Adding a page (checklist)

1. **Register** it in `src/content/pages.ts`. The registry drives the sidebar, ⌘K search (pages and sections), the TOC, the Overview cards and prev/next links, so nothing else needs wiring.
   - Fields: `path`, `title`, `group` (`Getting started | Foundations | Components | Patterns | Resources`), `icon` (Lucide, import at the top of the file), `status`, `updated` (YYYY-MM-DD, today), `description` (one sentence; shown in the header and cards), `keywords` (search synonyms), `sections: s(['id', 'Title'], …)`, `component: lazy(() => import('../pages/<group>/<Name>'))`.
   - Order inside a group = sidebar order.
2. **Create** `src/pages/<group>/<Name>.tsx` with a default export. Pattern:
   ```tsx
   <>
     <PageHeader />                       {/* reads title/status/description from the registry */}
     <Section id="…" title="…" description="…">…</Section>   {/* one per registered section, same ids/titles */}
   </>
   ```
   Section ids **must** match the registry, or the TOC and search links break.
3. **Changelog**: add an entry at the **top** of `src/content/changelog.ts` (`date`, `page` path, `summary`, optional `changes[]`).
4. Put page-specific styles in a sibling `<Name>.module.css`.
5. If a pattern or component will be reused on other pages, put it in `src/components/<name>/` and its data/tokens in `src/tokens/<name>.ts` (see Navigation below).
6. Add Figma screenshots the user provides to `public/figma/<page>-<what>.png`. Show them in a `figma` section with `<img src={`${import.meta.env.BASE_URL}figma/…`}>` (never a bare `/figma/…`, it breaks on GitHub Pages) and descriptive `alt`. Otherwise use `<FigmaSlot title notes />`.
7. Verify in the browser (see below), then type-check and lint.

Typical section set for a component/pattern page: live demos, then `guidelines` (DoDont), then `figma` (Figma reference). Look at `src/pages/patterns/Navigation.tsx` as the most complete example.

## Status lifecycle

`TokenStatus = 'draft' | 'review' | 'confirmed'` (`src/tokens/types.ts`), shown as Draft / Needs review / Confirmed. There is no "approved". When the user says a page is approved, set the page (and its tokens) to `confirmed` **and add a changelog entry** at the top of `src/content/changelog.ts` (`page` is the page path, or `null` for several pages at once). Do both in the same change, without being asked. Pages start as `draft` unless matched to a Figma frame.

## Building blocks (`src/components`)

| Component | Use |
| --- | --- |
| `PageHeader` | First element of every page. No props. |
| `Section` | `id`, `title`, `description?`, `size?: 'display'`. Anchored h2 with a copy-link button. |
| `Preview` | Framed demo. `title?`, `code?` (string; adds a "Show code" toggle), `align?: 'center' \| 'start'`, `flush?` (no padding/dot grid; use for full-bleed mocks). Its stage is flex-wrap with a 12px gap. |
| `CodeBlock` | `code`, `title?` (default "TSX"). Plain, with a copy button. |
| `CopyValue` | Mono chip that copies `value`; `display?`, `label?`. Use for tokens and CSS vars. |
| `DoDont` | `doItems`, `dontItems` string arrays. |
| `PropsTable` | `rows: { prop, type, default?, description }[]`. |
| `FigmaSlot` | Placeholder for a missing Figma frame: `title`, `notes`. |
| `StatusBadge` | `status`. |
| `app-nav/AppNav` | The real product sidebar (roles, collapsed rail, pin/overlay). Reuse it in app-shell mocks. Props are documented on the Navigation page. |
| `schedule/ScheduleGrid`, `MobileSchedule`, `ShiftChip`, `Coverage`, `LocationPath` | Schedule grid (desktop, 1–4 weeks), mobile week/day, shift cells, coverage values and location breadcrumbs. Both take `sections`: build them with `teamSections` or `locationSections`/`locationPeopleSections` (`schedule/sections.tsx`). Mock data in `schedule/data.ts` (members, dates), `schedule/locations.ts` and `schedule/profiles.ts` (employee details). `onRowClick`/`onCoverageClick` open `CoverageDrawer` and `EmployeeDetailsModal` (`schedule/ScheduleDetails.tsx`); `useCoverageDrawer(variant)` wires up the drawer in one line; pass `contained` to keep them inside a demo frame (the frame needs `transform: translateZ(0)`, and the overlay's `inner` needs `left: 0`). Demo shell (app frame, phone, pickers, Unit/Location tabs) in `schedule/ScheduleChrome.tsx`: `DesktopDemoFrame` takes `title`, `actions` and `nav` for other pages; `PhoneFrame`, `MobileDemoBar` and `MobileStage` build custom phone demos. Documented on the Team View and Location View pages. |
| `calendar/CalendarViews` (`MonthView`, `TimeGridView`, `AgendaView`, `EventChip`, `CalendarLegend`), `CalendarToolbar`, `CalendarModals`, `useCalendarModals` | Employee calendar: month, week/day timeline and agenda, event details, sign-ups and the add/edit task form. Mock events and date helpers in `calendar/events.ts`. Documented on the Calendar page. |
| `pages/foundations/TokenSwatch` | Color swatch used by the Colors page. |

For tables, use `<Table.ScrollContainer minWidth={560} className="doc-table"><Table verticalSpacing="sm" horizontalSpacing="md">…`.

## Styling rules

- **Only use CSS variables, never hex values**, so dark and light both work.
  - Theme tokens (from the Figma export) are global vars without a prefix: `--background-body`, `--background-body-alt`, `--background-default(-hover)`, `--background-primary-light`, `--background-info`, `--text-default`, `--text-dimmed`, `--text-primary-default`, `--border-default`, `--neutral-black`, etc. The full list is in `src/tokens/themes/dark.css` and `light.css`.
  - Only **color** tokens are exposed. `--radius-*`, `--padding-*` and `--spacing-*` from the export are **not** defined at runtime (`isColorToken` filters them out). Use `var(--mantine-radius-xs|sm|md|lg|xl)` (2/6/8/12/16px), `var(--mantine-spacing-*)` or literal px.
  - Guide aliases: `--intime-surface`, `--intime-surface-raised`, `--intime-border`, plus `--mantine-color-body|text|dimmed|default-border`.
  - Navigation vars: `--nav-*` (see `src/tokens/navigation.ts`).
- **Adding new global CSS vars**: define them as data in `src/tokens/<x>.ts` (with `status` and `usage`) and merge them into `cssVariablesResolver` in `src/theme.ts`. Scheme-independent values (including `var()` aliases to theme tokens) go in `variables`; per-scheme literals go in `light`/`dark`. List them on the page with `CopyValue`.
- Mantine's palette: primary color key `intime` (= cyan ramp, `primaryShade` 8 light / 9 dark). Also `police`, `fire`, and the Mantine defaults. Use `color="intime"` and `c="dimmed"`.
- Mantine CSS is in `@layer mantine`, so unlayered CSS-module rules override it without `!important`. Use `classNames={{ root: classes.x, … }}` to style component parts.
- Global helper classes (`src/styles/global.css`): `.tabular` (tabular numbers), `.doc-table`, `.preview*`, `.figma-slot`, `.do-dont`, `.page-container` (max-width 1000px).
- Icons: Lucide, `size` 16–20, `strokeWidth={1.75}` in nav-like UI. Decorative icons get `aria-hidden`; icon-only buttons need `aria-label` and a `Tooltip`. The theme sets Tooltip `withArrow` and `openDelay: 150`.
- Motion: 220ms `cubic-bezier(0.2, 0, 0, 1)`. Add `@media (prefers-reduced-motion: reduce)` to disable transitions.
- Interactive demos: wrap in `Preview`, give stateful demos a "Reset demo" control, and add a `role="status"` hint when an action is preview-only.

## Copy style

Plain, short sentences in sentence case. Explain behavior ("Pinning keeps the navigation open and moves the page to its right."), not implementation. Use realistic police/fire mock data (e.g. "99th Precinct - Brooklyn", "Engine 12", "Patrol D4"). Shift states always pair an icon with a label (`src/tokens/status.ts`).

## Tokens map (`src/tokens`)

- `themes/dark.css`, `themes/light.css`: raw Figma variable exports, pasted verbatim. `themes/index.ts` parses them and resolves `var(--primary-primary-color-N)`-style primitives to Mantine default ramps (primary = cyan). Watch for user pastes where the "dark" block is a copy of light. Compare against the existing file before overwriting.
- `colors.ts` (palettes), `typography.ts` (Roboto + Cousine, heading/body scales), `scales.ts` (spacing, radius, shadows, breakpoints, z-index, motion, app-shell `layout`), `icons.ts` (curated Lucide set), `status.ts` (shift states, departments), `navigation.ts` (nav roles, items, variants, `--nav-*` vars), `schedule.ts` (shift kinds and codes, date ranges, `--schedule-*` vars), `calendar.ts` (event kinds and modifiers, calendar views, `--calendar-*` vars).
- `src/theme.ts` builds the Mantine theme and `cssVariablesResolver` from these. Change token files, not the theme.

## Verifying UI in a browser

Playwright browsers are cached at `~/.cache/ms-playwright/chromium-*/chrome-linux64/chrome`. Python playwright is not installed. To take screenshots:
```sh
cd <scratchpad> && npm init -y && npm i playwright-core
# script: chromium.launch({ executablePath: '<cached chrome>' }), goto http://localhost:5173/#/<path>,
# waitForSelector('#<first-section-id>'), locator('#<section>').screenshot(...)
```
Check both schemes: `localStorage.setItem('intime-guide-color-scheme', 'light')`, then reload. Exercise menus, tooltips and toggles, not just the static render.

## Mantine gotchas found so far

- `NavLink` with no `label` still renders an empty flex-1 body, which pushes icons to the left. Hide the body (`classNames.body`) in icon-only mode, and make sections `display:flex; align-items:center` so icons don't sit high.
- A `Menu.Item` with a description: don't set `display:block` on the item, or the `rightSection` (check icon) wraps underneath.
- `Menu.Target > Tooltip > UnstyledButton` works for a tooltip on a menu trigger.
- `ScrollArea` inside a flex column needs `min-height: 0` (and `flex: 1`) to scroll.
- `useUncontrolled` (from `@mantine/hooks`) is the pattern for components that are optionally controlled.
- Popovers and menus render in a portal, so they escape `overflow: hidden` demo frames.

## Repo state

- Git repo on `master`. Commit only when asked, ending messages with the Co-Authored-By line from the system reminder.
- `.figma/` holds Figma Make config. Leave it alone and keep it committed.
- `plans/intime-style-guide.md` is the original scaffold plan and is partly outdated (it says Inter/blue; the current design uses Roboto/cyan).

## Deployment

- Hosted on GitHub Pages at https://icyfeva.github.io/intime-design-guide/. `.github/workflows/deploy.yml` builds and deploys on every push to `master`.
- `vite.config.ts` sets `base: '/intime-design-guide/'` only when `GITHUB_ACTIONS` is set. Locally the base is `/`.
- Never use root-absolute URLs (`/figma/…`) for files in `public/`. Prefix them with `import.meta.env.BASE_URL`. Hash routes need no extra config.
