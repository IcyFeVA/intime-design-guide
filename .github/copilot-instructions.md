# Copilot Instructions

## Project Intent
- This is the InTime (intime.com) design guide for a police and fire workforce scheduling web app. It is iterated from Figma frames.
- Build with Mantine components and Lucide React icons, the same stack as the product.
- All schedule data is illustrative mock data. Do not add persistence, network requests, or authentication.

## Content Model
- Token values live only in `src/tokens/*`. `src/theme.ts` derives the Mantine theme from them.
- Theme exports in `src/tokens/themes/*.css` lose opacity in Figma's export. `exportAlphaFixes` in `src/tokens/themes/index.ts` adds 16% to solid `background-*-light`, 20% to `-light-hover` and 0% to `background-transparent`. Use those tokens as they are; don't color-mix them again.
- `src/content/pages.ts` registers every page and its sections. Section ids must match the `<Section id>` values on the page. A third item `'group'` marks a group heading (render `<Section size="display">` without children); the TOC indents the sections after it.
- Code is hidden for now: `SHOW_CODE = false` in `src/content/flags.ts` hides sections with ids in `CODE_SECTION_IDS` (`component` "Using the components", `usage` "Usage in code") from the page, TOC and search, and hides the `Preview` "Show code" toggle. Keep writing them with those ids so they return when the flag is on.
- Figma references are hidden for now: `SHOW_FIGMA = false` in `src/content/flags.ts` hides sections with ids in `FIGMA_SECTION_IDS` (`figma` "Figma reference") the same way. Keep adding them as usual.
- `.page-wide` (global.css) breaks a demo out of the 1000px page column to fill the main column, up to 1920px. Used for the Desktop demos on Team View, Location View and Calendar.
- `plans/workforce-scheduling.md` is the living plan for the Workforce Scheduling page. Read it before working on that page. Its "Start here: remaining steps" checklist says what to build next ("continue with the next step" = the first unchecked step). Tick it when done and write a "Step N as built" section. `plans/workforce-panel-review.md` holds the panel review's decisions the steps point to.
- Values have a status of `draft`, `review`, or `confirmed`. When a Figma frame confirms a value, update the token, set its status to `confirmed`, and add a `src/content/changelog.ts` entry. The same applies when the user approves a page: set the page and its tokens to `confirmed` and add the changelog entry in the same change, without being asked.

## UI Conventions
- Keep the Mantine core, dates and spotlight stylesheets imported in `src/main.tsx`, and keep the app wrapped in `MantineProvider` and `DatesProvider` (weeks start on Monday). The default scheme is dark.
- Date buttons open `PeriodPicker` (month, day or a block of days) or `RangePicker` (start and end day) from `src/components/date-picker/DatePickers.tsx`. On phones, the schedule's sliders button opens `FilterSheet` (`src/components/schedule/FilterSheet.tsx`).
- Desktop Sort buttons open `SortModal` (`src/components/sort/SortModal.tsx`): direction, then one field, Cancel/Apply. Don't use a dropdown for sorting.
- Dialogs inside a phone demo are full screen below the status bar: spread `phoneModalProps` (`src/components/phone-modal/phoneModalProps.ts`) over the `Modal` and wrap the content in `PhoneModalBody`. `SortModal` and the Approvals `VisibilityModal` take `fullScreen` for this.
- Keyboard shortcuts use `ShortcutsModal`, `ShortcutsPanel` (the quick reference Ctrl/⌘ / opens, docked at the bottom, on the current page's tab) and `ShortcutKeys` (`src/components/shortcuts/`); actions and blocked keys live in `src/tokens/shortcuts.ts`. Every shortcut needs Ctrl/⌘ or Alt/⌥ (or is a function key), can be changed or turned off, shows its current keys in tooltips and menus with `aria-keyshortcuts`, and is hidden on touch-only devices.
- Workforce Scheduling (`src/components/workforce/`) selects cells like a spreadsheet with `useGridSelection` (right-click opens `GridContextMenu`, a Mantine `Menu.ContextMenu`) and edits them in a docked `WorkforcePanel` (a person's whole day as one segment list, touching segments indented under their block's first one, and one form below for the selected segment; `groupBlocks`/`regroupDay` in `workforce/model.ts`, parts in `workforce/panel/`; Leave opens `LeaveEntry`; out-of-unit chips (`unit`) get a banner, out-of-branch chips (`branch`) are muted in the grid but editable, and locked chips (`locked`, e.g. court dates) are muted with a lock and read-only in the panel). The footer's Assign starts assign mode (`AssignBar`, `assignDay` in `workforce/model.ts`): each clicked or dragged cell gets a copy of the selected block; an open shift fills one place per person. Several selected cells get `panel/BulkEditor` (logic in `panel/bulk.ts`, one commit per action): a shift picker + "Assign to N" (`assignDay` per person-day; locked cells and open shifts skipped), a collapsed "Change fields" (Activity, Location, Hours modifier, Unit on every selected segment), Leave for every day, and ⋯ Delete all (confirm); `WorkforcePanel`'s `onStatus` reports what each did. Warnings (`dayWarnings` in `workforce/warnings.ts`: double booked, on leave, minimum rest, not certified, weekly hours cap) never block; they show under the panel's employee row (`panel/Warnings.tsx`) and as a ⚠ on the grid cell. Panel changes autosave: `useScheduleEdits` keeps the edits and undo history, `applyEdits(edits)` builds the watches the grid shows; it reuses the schedule components and Team View's cell design. View densities: Compact (default, shift codes) and Detailed (`DetailedChip`: activity names and times, overtime split into its own container), Detailed only where days are 96px or wider; Stacked (`StackedChip`: a 16px colored bar per assignment, no text) at any width.
- Prefer Mantine components and theme tokens over hand-built equivalents.
- Use CSS variables (`--intime-surface`, `--intime-surface-raised`, `--intime-border`, `--mantine-color-*`) so both color schemes work.
- Show shift states with an icon and a label, never color alone.
- Preserve responsive layouts, semantic labels, keyboard access, and visible focus states.

## Commands
- `npm run dev` starts the local app.
- `npm run build` type-checks and builds for production.
- `npm run lint` checks the source with ESLint.
- `npm run figma:capture` and `npm run figma:build` copy a live demo into a Figma frame as editable layers. See `scripts/figma-capture/README.md`.

## Deployment
- Hosted on GitHub Pages at https://icyfeva.github.io/intime-design-guide/. `.github/workflows/deploy.yml` deploys on every push to `master`.
- `vite.config.ts` sets `base: '/intime-design-guide/'` only when `GITHUB_ACTIONS` is set.
- Never use root-absolute URLs (`/figma/…`) for files in `public/`. Prefix them with `import.meta.env.BASE_URL`.
