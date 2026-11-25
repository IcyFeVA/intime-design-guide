# Workforce Scheduling demo: plan

> **Living plan.** Read this first when working on the Workforce Scheduling page. Tick the progress checklist,
> and add to "Later" and "Open questions" instead of starting over. Reference screenshots: `public/figma/workforce-scheduling-*.png`.

## Context

InTime needs a desktop demo of the **Workforce Scheduling** view: an advanced Team View for schedulers.
Reference: two user screenshots (the week grid with Day/Swing/Night watches and staffing rows, and the right
"Editing" panel), saved in step 0 as `public/figma/workforce-scheduling-desktop.png` and `-panel.png`.
This first pass is a static, interactive demo page. Cells can be selected like in Excel (single, range, several),
a docked right panel shows the selected activity, and time-of-day cells open the coverage drawer as in Team View.
View densities, the Day view, attachments, notes and most toolbar actions come later, so the code must leave room for them.

## Decisions (confirmed with the user, 2026-11-23)

- **Page**: Patterns group, right after Location View. `/patterns/workforce-scheduling`, "Workforce Scheduling", status `draft`. **Confirmed 2026-11-24** (user approved; tokens confirmed too, except the Day range placeholder and the hidden `panelPlacements`).
- **Frame**: reuse `DesktopDemoFrame` (collapsed AppNav, top bar, title row, toolbar, Target resolution, Full screen, Reset demo). Target resolution (`targetWidth={TARGET_WIDTH}`, 1512px) opens full screen but caps the width, for screenshots at the 14-inch MacBook size. Leave out the screenshot's breadcrumb bar and its "Layout 1 2" control.
- **Visuals**: Mantine + Lucide only. Cells use Team View's `ShiftChip` design, **not** the screenshot's cells. Coverage uses Team View's `BodiesValue` / `HoursValue` / `TimeOfDayBar` and `CoverageDrawer`.
- **Mock dates**: Team View's. Weeks start Monday, `MOCK_TODAY` = Fri, Jun 5, 2026.
- **Grid rows**: (1) a pinned Open shifts row under the dates; (2) collapsible DAY / SWING / NIGHT watch groups with officer count and a daily bodies badge (▼8/9); (3) a collapsible Staffing block per group (Bodies, Supervisors, Hours, Time of day) that shows "▼ 7 days under" when collapsed; (4) rank badge (Cpl, Sgt, Lt) and a supervisor icon by names, plus a highlight on the active cell's row and column headers.
- **Selection** works like Excel on employee cells and filled open-shift cells. Coverage and group rows can't be selected. Empty employee cells can be selected and show a **+ on hover**.
- **Open-shift cells**: Team View chip shape, no fill, dashed border, an icon plus label before the code: `CircleDashed` "Open", `Radio` "Live".
- **Panel**: docked right, so the grid shrinks. Opens on a cell click (on pointer up), closes with its X, and the toolbar toggle does both. It has five modes (see Panel spec).
- **Form**: inputs can be edited locally and reset when the selection changes. **The grid data never changes.** Assign, Leave, Add segment, Set actual and the icon buttons show a "Preview only" hint (`role="status"` demo bar).
- **Bulk panel**: summary line, a list of the selected cells, shared fields, footer actions.
- **Ranges**: 5 views: 1 Day, 1 Week, 2 Weeks, 3 Weeks, 1 Month (numerals since 2026-11-24, user). ~~**Day is a placeholder** (empty state "Day view is coming")~~ (built 2026-11-24, see "Day view"); the stepper moves one day at a time.
- **View density menu**: ~~Detailed (active); Compact and Stacked disabled, marked "Coming soon".~~ Since 2026-11-24 see "View densities" below. Kept in state, applied as `data-view` on the grid. 5 ranges × 3 densities = 15 combinations eventually. View density (row layout) is separate from chip density, which still follows the range.
- **Toolbar**: mostly visual. Working: range menu, date stepper, Sort (`SortModal`), density menu, panel toggle. Under staffed (5), Posts (2), Mandate and Undo render and show a "Preview only" hint.
- **Employee search** (2026-11-24): a search button after "Employee" in the corner header swaps the label for an input ("Search employees…"); X or Escape swaps it back. The input doesn't filter yet.
- ~~Clicking a name opens `EmployeeDetailsModal`~~ (replaced 2026-11-24: a name selects its row). Clicking a time-of-day cell opens `CoverageDrawer` (`contained`, as in Team View).

## Panel spec (from the panel screenshot)

Width `--workforce-panel-width` (380px), full height of the workspace, left border `--border-default`. A shell with header, body and pinned footer slots. Content is keyed by the selection signature, so the form resets.

1. **Header**: "Editing: Tue, Jun 2, 2026 · Swing Patrol" (open shift) or "Editing: Fri, Jun 5, 2026 · B. Haddad" (assigned), with a dimmed subtitle ("Open shift · 1 of 1 still needed" / "Patrol · Swing watch"). Close `ActionIcon` (X, tooltip "Close panel").
2. **Tabs** (Mantine `Tabs`): Details · Attachments (0) · Notes. Attachments and Notes show short empty states for now.
3. **Details tab**:
   - Employee row: a searchable `Select` employee picker. With no employee it shows a dashed-circle `UserPlus` and "Select employee"; when assigned it shows an initials avatar, name and rank. Next to it: `Button` "Hours" (`Clock`), `ActionIcon` `Crosshair` and `ActionIcon` `ChevronDown`. All have tooltips and are preview-only.
   - Branch `Select`, label inline on the left: "99th Precinct - Brooklyn".
   - Segment card, outlined `--text-primary-default`: a code badge with the `--schedule-regular` fill ("PatS"), the time in mono ("12:00–22:00"), then `Radio` (Post as live), `UserSearch` (Find an employee), `Ban` (Cancel segment) and `Ellipsis`. Below it, a subtle "+ Add segment" button.
   - Times card (bordered): Scheduled (date `Select` "Jun 2"), Start and End (`TimeInput`, `@mantine/dates`), and Hours (read-only, computed). Below it, "+ Set actual".
   - Fields in two columns: Activity (Patrol) | Location (Sector B); Hours modifier (None) + `Checkbox` "Bank this time"; Unit (Swing Patrol) | Rank (acting) (None); Customer (City of New York) at full width.
4. **Footer** (top border): `Button` "Assign" (`Plus`, primary), `Button` "Leave" (default, `Plane`, assigned mode only), and an `Ellipsis` menu (Copy, Swap, Delete; preview-only).

**Modes** (from `derivePanelMode(selection, model)`):

| Mode | What the panel shows | Footer |
| --- | --- | --- |
| `open-shift` | As in the screenshot | Assign, more |
| `assigned` | Employee filled in | Assign, Leave, more |
| `new` (empty cell) | Title "New activity: Fri, Jun 5, 2026 · B. Haddad", employee filled in, a shift code `Select` + times instead of the segment card | Assign, more |
| `bulk` | No tabs. "6 cells selected · 4 activities, 2 empty", a scrollable list (initials, name, date, code chip or "Empty"), shared fields Activity / Location / Hours modifier / Unit | Assign, Leave, more |
| `none` (toggled open, nothing selected) | "Select a cell to see its details." | none |

## Architecture

New folder `src/components/workforce/`. Don't extend `ScheduleGrid`: it is a static `role="table"` used by two confirmed pages.

| File | Role |
| --- | --- |
| `data.ts` | Mock watches, members, open shifts, coverage (see Mock data) |
| `model.ts` | `buildGridModel({ watches, days, collapsed, staffingCollapsed, sort, direction }): GridModel`: a flat `GridRow[]` union (`open`, `group`, `staffing-toggle`, `staffing`, `member`) with the per-day `cells` worked out once, plus `isSelectable(row, day)`. Memoised on the structure, never on the selection. |
| `useGridSelection.ts` | A generic selection and roving-focus hook (below). Knows nothing about workforce data. |
| `WorkforceGrid.tsx` + `Workforce.module.css` | `role="grid"` rendering. Memoised `MemberCell` / `OpenCell` get only primitive props (`chip`, `selected`, `active`, `edges`, `tabStop`, `density`). CSS uses `composes: cell from '../schedule/Schedule.module.css'` (and `dayHeader`, `label`, `coverageCell`, `coverageLabel`, `groupTitle`, `scroller`) to reuse Team View styles. |
| `OpenShiftChip.tsx` | The dashed open/live chip |
| `WorkforcePanel.tsx` | Panel shell, the five modes, `derivePanelMode` |
| `WorkforceChrome.tsx` | Toolbar, density menu, preview-only buttons, panel toggle (`PanelRightOpen`/`PanelRightClose`, `aria-pressed`) |
| `useWorkforceDemo.ts` | Page state + `reset()` (range, anchor, density, sort, collapsed sets, panel, selection, hint) |

**Small changes to shared code** (no behaviour change on existing pages):
- `schedule/ShiftChip.tsx`: add `interactive?: boolean` (default `true`). When false it renders a `span`, `aria-hidden`, and keeps the tooltip. Add `tooltip?: boolean` to turn the tooltip off while dragging.
- `schedule/Coverage.tsx`: add `noun` to `BodiesValue` (for "supervisors").
- `schedule/data.ts`: export `rand`. `rangeDays` / `shiftRange` accept `ScheduleRange | 'day'`.
- `schedule/ScheduleChrome.tsx`: `RangeStepper` gets a day mode (`PeriodPicker {kind:'day'}`, ±1 day, "Previous day"/"Next day"). `PickerMenu` options get an optional `disabled` and `description`; don't set `display:block` on items (CLAUDE.md gotcha).
- `schedule/profiles.ts`: export `build` as `buildProfile` for workforce members.
- `tokens/schedule.ts`: add `PatS` (Swing patrol, 12–22) and `C-PM` (Court, afternoon, 12–16).

**Grid structure and ARIA**
- Columns: `var(--workforce-label-width) repeat(N, minmax(colMin, 1fr))`. Rows use `display: contents`, as in `ScheduleGrid`.
- Order: header, open shifts (up to 2 lines), then per watch: group header, the Staffing toggle and its four rows when expanded, then members (extra lines via `rowLines`). Collapsed rows are not rendered.
- Sticky: corner (top + left, z 5), open-row labels (top offset `calc(var(--workforce-header-height) + line * var(--schedule-row-height))` + left, z 4), day headers (top, z 3), open-row cells (top, z 3), member labels (left, z 1). The header gets an exact `height`. The scroller gets `scroll-padding-top` and `scroll-padding-left` so `scrollIntoView` never hides a cell under the pinned parts.
- ARIA:
  - The grid is `role="grid" aria-multiselectable="true" aria-label="Workforce schedule"`.
  - Day headers are `columnheader` with the full date plus ", today". Each row has a `rowheader` and gridcells.
  - Selectable cells get `aria-selected`. Cells that can't be selected leave it out.
  - Group and Staffing headers contain a button with `aria-expanded`. Names are buttons with `aria-haspopup="dialog"`. Time-of-day cells get `aria-haspopup="dialog"`.
  - A visually hidden `role="status"` announces "6 cells selected".

**Selection model (`useGridSelection`)**
- **State**: `useReducer` holding `{ selected: Set<"row@day">, base, anchor, focus, active }`.
  - `selected = base ∪ rect(anchor, focus)`, filtered by `isSelectable`.
  - The rectangle is measured in rendered-row × day-index space.
- **Mouse**:
  - Click selects one cell.
  - Ctrl/⌘+click toggles a cell and makes it the new anchor.
  - Shift+click extends from the anchor.
  - Drag selects a rectangle: start on `pointerdown`, follow with delegated `pointerover` on `data-row`/`data-day`, end on a window `pointerup`. The grid has `user-select: none`.
  - The panel opens on pointer up, never in the middle of a drag.
- **Keyboard**: one tab stop (roving tabindex), as in the ARIA grid pattern.

  | Keys | Action |
  | --- | --- |
  | Arrows | Move and select, as in Excel |
  | Shift+Arrows | Extend |
  | Home / End | First / last day |
  | Ctrl+Home / End | First / last selectable cell |
  | PageUp / PageDown | Previous / next watch |
  | Ctrl/⌘+A | Select all visible (`preventDefault`) |
  | Space | Toggle the cell |
  | Shift+Space | Select the row |
  | Enter | Open the panel and focus its heading |
  | Escape | First reduces the selection to the active cell, then closes the panel (`stopPropagation` only when handled, so Full screen stays open) |

- Moving with the keyboard never opens the panel. If the panel is already open, its content follows the selection.
- **When the structure changes** (range, date, collapse), compare a row/day signature during render and prune cells that are no longer visible. Don't `setState` in an effect: the `react-hooks` lint rule flags it.
  - Week → month keeps the selection.
  - Next/Previous clears it.
  - Collapsing a group drops that group's cells.
- **Visuals**:
  - A selected cell gets the `--workforce-selected-bg` tint around the chip.
  - `::after` borders driven by `data-edges` draw one outline around each range.
  - The active cell gets a 2px `--workforce-active-outline`.
  - The `Plus` icon fades in on empty cells on hover or when active.
  - The active row and column headers get `--workforce-header-active-*`.
  - Transitions are 220ms `cubic-bezier(0.2, 0, 0, 1)`, turned off under `prefers-reduced-motion`.

**Layout**: inside `DesktopDemoFrame`, a `.workspace` flex row (`min-height: 0`) holds `.gridArea` (`flex 1; min-width 0`) and `WorkforcePanel`, with a fixed width and no `Splitter`.
- Only the panel animates (Mantine `Transition`: opacity + `translateX(16px → 0)`, 0ms when `useReducedMotion()`).
- After the panel opens, scroll the active cell into view on the next frame.
- Overlays (`CoverageDrawer` called directly with a `CoverageSelection`, `EmployeeDetailsModal`, `SortModal`) render inside the workspace so they stay contained.

**Tokens: `src/tokens/workforce.ts`** (status `draft`), merged into `cssVariablesResolver` in `src/theme.ts` like the schedule tokens:
- `WorkforceRange = ScheduleRange | 'day'`.
- `workforceRanges`: day is a placeholder; week is 120px / comfortable; 2weeks, 3weeks and month are 56px / compact.
- `ViewDensity = 'detailed' | 'compact' | 'stacked'`.
- `viewDensities`: `{ key, label, description, available }`.
- `--workforce-*` variables (all scheme-independent `var()` aliases, so they go in `variables`):

  | Variable | Value |
  | --- | --- |
  | `--workforce-label-width` | 232px |
  | `--workforce-header-height` | 56px |
  | `--workforce-panel-width` | 380px |
  | `--workforce-selected-bg` | `var(--background-primary-light)` |
  | `--workforce-selected-border` | `var(--border-primary-default)` |
  | `--workforce-active-outline` | `var(--background-primary-filled)` |
  | `--workforce-header-active-bg` | `var(--background-primary-light)` |
  | `--workforce-header-active-text` | `var(--text-primary-default)` |
  | `--workforce-add-icon` | `var(--text-dimmed)` |
  | `--workforce-open-border` | `var(--border-default)` |

**Mock data (`workforce/data.ts`)**
- `Watch { id: 'day'|'swing'|'night'; title; code: PatD|PatS|PatN; members; coverage(day): WatchCoverage }`, where `WatchCoverage` is `DayCoverage` plus `supervisors {have, need}`.
- `WorkforceMember { id, first, last, initials, rank: PO|Cpl|Sgt|Lt, supervisor, chips(day) }`.
- `OpenShift { id, day, watch, code, start, end, status: 'open'|'live', needed }`.
- Day has 12 officers, Swing 10 and Night 10, with realistic names: T. Nguyen, B. Haddad (Swing, with an activity on Fri, Jun 5), Sgt M. Alvarez, and so on.
- Rotation is deterministic, using the exported `rand`, plus a curated week of Jun 1–7. Include leave, overtime, out of unit, Court, Train and two-chip days.
- `bodies.have` and `supervisors.have` are worked out from the chips (not leave, not cancelled), so the badges match the grid. `need` comes from a weekday table. `hours` and `timeOfDay` come from the existing `coverage(seed)`.
- Open shifts: 0–2 a day; Tue Jun 2 is PatS 12:00–22:00, 1 needed.
- Helpers: `daysUnder(watch, days)` and `workforceProfile(id)`.

## Page: `src/pages/patterns/WorkforceScheduling.tsx`

Registry entry after Location View: icon `Grid3x3` (or `TableProperties`), `draft`, `updated` set to today, keywords (workforce, scheduling, select, bulk edit, assign, open shifts, staffing, density).

| Section | id | Content |
| --- | --- | --- |
| Desktop | `desktop` | `.page-wide` > `Preview flush` > the demo |
| Selecting cells | `selection` | Mouse and keyboard table using `ShortcutKeys` |
| Details panel | `panel` | The five modes, what opens and closes it |
| Groups and staffing | `rows` | Open shifts, watch groups, Staffing block, rank marks |
| Views and densities | `views` | 5 × 3 matrix; Day, Compact and Stacked marked "Coming soon" |
| Using the components | `component` | Hidden by `SHOW_CODE`; write it anyway |
| Tokens | `tokens` | `--workforce-*` with `CopyValue` |
| Guidelines | `guidelines` | `DoDont` |
| Figma reference | `figma` | Hidden by `SHOW_FIGMA`; both screenshots, `import.meta.env.BASE_URL` |

Add a changelog entry at the top of `src/content/changelog.ts`.

## Steps and progress (tick as you go in `plans/workforce-scheduling.md`)

- [x] 0. Copy this plan to `plans/workforce-scheduling.md`. Copy the screenshots (`…/images/1.png`, `2.png` from this session) to `public/figma/workforce-scheduling-desktop.png` and `-panel.png`. Add a pointer line to CLAUDE.md "Repo state" and `.github/copilot-instructions.md` ("`plans/workforce-scheduling.md` is the living plan for the Workforce Scheduling page; read it first and update its checklist"). Add a project memory pointing to the plan.
- [x] 1. Tokens: `PatS`, `C-PM`, `src/tokens/workforce.ts`, the `theme.ts` merge.
- [x] 2. Shared changes (ShiftChip, Coverage, data, RangeStepper, PickerMenu, profiles).
- [x] 3. `workforce/data.ts` + `model.ts`. Check headcounts and "days under".
- [x] 4. Static `WorkforceGrid`: sticky rows, collapse, staffing, open shifts, drawer, employee modal.
- [x] 5. `useGridSelection` + memoised cells + selection visuals.
- [x] 6. Workspace layout + `WorkforcePanel` (all five modes, local form state).
- [x] 7. Toolbar, density menu, Day placeholder, `useWorkforceDemo` + Reset demo.
- [x] 8. Page, registry, changelog. Add the component row to the CLAUDE.md building-blocks table and the copilot instructions.
- [x] 9. Verify (below).

## As built (2026-11-23), differences from the plan above

- Demo state and composition live in `workforce/WorkforceDemo.tsx` (no separate `useWorkforceDemo.ts`); the page just renders `<WorkforceDemo />`.
- Search, Sort, View density, Undo and the panel toggle sit on the right of the **title row** (`DesktopDemoFrame` `actions`), so the filter toolbar fits on one row. Below 1300px of toolbar width Approvals/Posts/Mandate show icons only; below 1150px "understaffed" shows only its count (container queries in `Workforce.module.css`).
- No `PickerMenu` or `profiles.ts` changes were needed: the density menu is its own `DensityMenu`, and `workforceProfile(id)` in `workforce/data.ts` builds the employee details.
- B. Haddad is in the **Day** watch (as in the screenshot), PatD Mon–Fri in the week of Jun 1.
- `BodiesValue` got `minimum` (supervisors above need count as on target) besides `noun`.
- `openStatus`, `describeOpenShift` and `workforceTeams` live in `workforce/data.ts` (react-refresh lint: component files export components only).
- Escape: Mantine modals listen on the window in the capture phase, so the grid spreads `selection.escapeProps` (`data-mantine-stop-propagation`) on its focus targets while it needs Escape (several cells selected or panel open). The panel also closes on Escape unless a field or dropdown has focus.
- PageUp/PageDown move 10 rows (not by watch).
- A drag or click reveals the clicked cell after the panel opens (double rAF + `scrollIntoView`); a double click no longer selects page text.
- Page sections: desktop, selection, panel, rows, views, component (hidden), tokens, guidelines, figma (hidden).

## Fit to width and panel placement (2026-11-23, confirmed with user)

Requirement: schedulers see every day of every range without a horizontal scrollbar. Target resolution **1512 × 982** (14-inch MacBook, overlay scrollbars).

- [x] Day columns are `minmax(0, 1fr)` and the grid is `width: 100%`; no minimum column width. `workforceRanges` no longer carries `density`/`columnMin`.
- [x] The grid measures its scroller (`useElementSize`) and picks the **cell layout from the column width**, not the range (`cellLayouts` / `cellLayoutFor` in `src/tokens/workforce.ts`): Full ≥ 96px, Compact 48–96px, Mini < 48px.
- [x] Mini (`ShiftChip` density `mini`, shared): no codes; keeps the fill (incl. diagonal splits), out-of-unit hatching and OU arrow, and a bar for cancelled. Overtime shows a centered clock (`.miniOt`, 2026-11-25, user: color alone isn't enough); above the bar when cancelled. Open shifts show the icon only. Coverage values drop to 11px; hours lose decimals (`HoursValue digits`); the group badge drops its arrow.
- [x] When columns would be < 48px with the 232px name column, the name column switches to `--workforce-label-width-narrow` (168px, set inline on the scroller). Rank badges and the supervisor shield hide via a container query when the name column is under 200px (user: OK to hide them).
- [x] Mini date headers stack the weekday over the date.
- [x] Mini cells are 32px high and rows 44px (`--workforce-mini-chip-height` / `--workforce-mini-row-height`, set as `--schedule-chip-height` / `--schedule-row-height` on the scroller), 2026-11-24.
- Panel placement (docked or drawer) was tried and is **hidden for now** (2026-11-24, user): the panel is always docked and the pin button isn't shown. The code stays for later: `WorkforcePanel` `placement` / `onPlacementChange` (the pin only renders with `onPlacementChange`), `panelPlacements` in `src/tokens/workforce.ts`, `.panel[data-placement='drawer']` CSS. It's not mentioned on the page.
- [x] Page section `sizing` ("Sizing for screens") explains the rule for developers; its example table is computed with `fitColumns` (now in `src/tokens/workforce.ts`, shared with the grid), 2026-11-24.
- Measured at 1512 × 982 in Full screen: week 174px (docked 120), 2 weeks 87 (60), 3 weeks 58 (43, Mini), month 43 (30), all Mini for the month; overflowX = 0 in every case.

Ideas not built yet: collapse the name column to initials; a per-user setting that remembers docked vs drawer; show the drawer over the grid without covering the selected cell (e.g. scroll or flip side).

- Open shifts are **not pinned** (2026-11-24, user): they are the first rows and scroll with the grid. Only the date row and the name column stay pinned.

- Row and column selection (2026-11-24, user): a click on a name selects the person's row (all their lines, via `model.rowGroup`), a click on a date selects that day, the "Employee" corner selects nothing (since 2026-11-24; it holds the search), Open shifts selects all open shifts. Shift/Ctrl/drag extend or add, Space/Enter on a header select it, Ctrl/⌘+Space selects the active cell's day. The date row is part of keyboard navigation (`HEADER_ROW` first in `model.navRows`). Fully selected rows/days highlight their headers. **Names no longer open `EmployeeDetailsModal`**; `workforceProfile` stays in data.ts for when employee details come back (open question where: maybe the panel's chevron button).

## View densities (2026-11-24, confirmed with user)

- [x] **Compact** = the grid as it was (shift codes). It is the default (`DEFAULT_VIEW_DENSITY`) and Reset demo goes back to it.
- [x] **Detailed** = `DetailedChip`: each assignment's activity name (`shiftCodeMap` label) and times, as in the calendar month cells. `chipParts(chip)` (`schedule/data.ts`) splits a cell into parts in time order; a partly-overtime segment becomes the regular part plus an overtime part for its last `PARTIAL_OVERTIME_HOURS` (2). Overtime parts are red (`--schedule-overtime`) with the Clock + OT tag (user: red, not the activity color). Leave covering 24h says "All day".
- [x] One part: two lines (name + tags, times). Two or more parts: one-line bordered containers stacked (name, times, tags). Containers aren't clickable; the cell is the target.
- [x] A separate assignment on the same day still goes to the extra line (user: keep the extra line), not into the same cell.
- [x] Detailed only where the column is Full (≥ 96px, `showsDetailed`, now `cellViewFor`); narrower days show Compact cells (user: fall back). Scroller gets `data-cells="detailed"`, which sets `--workforce-detailed-chip-height` 44px / `--workforce-detailed-row-height` 56px and taller open-shift rows.
- [x] Container queries on `.detailed` (its width ≈ day column − 15px): < 190px stacked lines show codes and tag icons only; < 150px single parts' tags icon only; < 135px stacked lines tighter with 11px times; < 125px stacked lines show hours only ("08–12", `formatHours(…, true)`); < 100px (columns just above 96px) everything tighter. Open chips (`open-chip` container): name hides < 130px, 11px times < 85px. Fixed after review (2026-11-24): codes, the OT icon and times were clipped at 96–120px columns.
- [x] Three assignments in one cell (2026-11-24, user): K. Brennan Thu Jun 4 (C-AM, PatD 12–17, ExP OT) and P. Fitzgerald Tue Jun 2 (Train 08–11, C-PM, PatS 16–22 partly overtime → four containers). The row grows to fit. In the Compact view, Full-layout cells show all codes side by side and Compact-layout cells show two and "…".
- [x] Open shifts in Detailed: icon, Open/Live, activity name over the times (`OpenShiftChip density="detailed"`).
- [x] Page: "Detailed cells" specimens and notes in `views`; tokens; guideline; changelog.
- [x] **Stacked** density (2026-11-24, user): `StackedChip`, the same parts as Detailed (`chipParts`) as plain bars, no text, tags or icons. Each bar 16px (`--workforce-stacked-chip-height`), gap 2px; one-bar rows 28px (`--workforce-stacked-row-height`); more bars make the row taller. Separate same-day assignments stay on the extra line (user). Applies at every width, month included (user; `cellViewFor`). Open shifts keep the Open/Live icon (user). Cancelled = a bar across, as Mini. Kinds show by color and stripes only, no OT/OU marks (confirmed by user, 2026-11-24). Every bar stays 16px, so two bars make a 45px row; most month rows end up 45px (confirmed by user, 2026-11-24). In Stacked the name column has no vertical padding and the cells 5px, so rows stay 28px.

## Day view (2026-11-24, user)

- [x] One Day replaces the placeholder: the same grid with one day column, at most `--workforce-day-max-width` (800px, names included) wide and centered with side borders, like the calendar's day view (user). `WorkforceGrid` fits the columns to `min(width, DAY_MAX_WIDTH)` and sets `data-single-day` on the scroller. The header shows the full date. All three densities work. The Day range token stays `draft` until approved.
- Not built: an hour timeline inside the day (see the prototype screenshot and `calendar/TimeGridView`).

## Sort fields and collapse all (2026-11-24, user, from a screenshot of the current app's sort menu)

- [x] Sort fields: Watch order, Name, Rank, Rank then effective date, Rank then precedence, Precedence, Precedence then rank (`WorkforceSort`, `sortKeys` in `data.ts`). The name breaks remaining ties; Descending reverses the whole list. Members got mock `rankEffective` (day number) and `precedence` (1–5, shared by several people).
- [x] Collapse all / Expand all: an icon button after Sort in the title row (`ChevronsDownUp` / `ChevronsUpDown`, tooltip). It collapses or expands every watch and its staffing block at once. It is a separate button, not part of the Sort modal, because it acts at once while the modal applies on Apply. The title-row icon buttons now have tooltips.

## Saved filters menu (2026-11-24, user, from a screenshot of the current app)

- [x] The Employees picker is `SavedFiltersMenu` (`WorkforceChrome.tsx`): a funnel button "All employees", then "Saved filters" with All employees (dot) and six saved filters (label, description, count) from `savedFilters` in `data.ts`, and a footnote. **No functionality** (user): All employees stays selected; the others show a "Preview only" hint. The old All / Scheduled in range / Supervisors options are gone; `buildGridModel` keeps its `filter` input (the demo passes `'all'`).

- [x] No funnel icon on the saved filters button (user).

## Unit picker (2026-11-24, user, from screenshots of the current app)

- [x] `workforce/UnitPicker.tsx`: a Mantine `Combobox` opened from a "Patrol" button. `Combobox.Search` ("Search units…"), a "Recently used" group (History icon, parent unit dimmed) and "All units" as an indented tree (`unitTree` in `data.ts`; 14px per level; units with sub-units bold with their count; check on the current unit). Hover highlights like the arrow keys. Search filters the list (matches plus their parents; hides Recently used). **No functionality** (user): picking any unit but Patrol shows a "Preview only" hint. Replaces the old Team `PickerMenu` and `workforceTeams`.

## Coverage alerts (2026-11-24, user, from screenshots of the current app)

- [x] The Understaffed button opens `workforce/CoverageAlerts.tsx`, a Mantine `Popover` (`trapFocus`, Escape closes): "Coverage alerts", "Days below the section minimum for Patrol · full unit", then one row per watch-day below the bodies minimum (`model.underAlerts`, by watch then day; `underCount` is its length): red triangle, "Day · Mon, Jun 1, 2026", "6 of 8 minimum scheduled", and two icon buttons with tooltips: Post this shift (`Radio`) and Find-Fill · Mandatory OT (`UserSearch`), filled primary on hover. **No functionality** (user): the actions close the popover and show a "Preview only" hint. Scrolls past 360px (month view).

## Legend (2026-11-24, user, from a screenshot of the current app)

- [x] `workforce/WorkforceLegend.tsx`: a `BookOpen` icon button (tooltip "Legend") between Undo and the panel toggle opens a `Popover` (bottom-end, 440px, `trapFocus`). Each row draws the **real cell for the current view density** (`ShiftChip` / `DetailedChip` / `StackedChip` / `OpenShiftChip`, Full layout) next to its name and meaning. Rows and copy are draft tokens: `legendItems` in `src/tokens/workforce.ts`.
- Only cells the grid shows today are listed (my default; the user didn't pick between leaving them out and "Coming soon" rows). Left out from the current app's legend until the grid shows them: Officer in charge (cross-hatched, shield), On-Call (dashed, phone), Trainee pairing (graduation cap, "Train Meet"), Pending leave request (hourglass badge in the corner), Pre-fill with OT (red border + OT tag), Statutory holiday (Hol badge in the day header), Leave over shift (diagonal stripes, leave icon + label).

## Approvals overlay (2026-11-25, user)

The toolbar's Approvals button opens the Approvals screen on top of the schedule (`DesktopDemoFrame` `overlay` + `overlayOpen`, built with `FramePage`). It covers everything below the top bar, opens on the Activity tab and stays mounted while hidden, so the schedule and the approvals keep their state and switching is instant. A "← Back to Scheduling" link (`FramePage` `back`) sits before the title, only in this case. Focus moves to the back link on open and back to the Approvals button on close; the schedule is `inert` meanwhile. The button's count is the live number of open requests across all tabs. Reset demo closes it.

## Context menu (2026-11-25, user)

- [x] Right-click (or the Menu key / Shift+F10) on a row header, a date header or a selectable cell opens `workforce/GridContextMenu.tsx`, a Mantine `Menu` with `Menu.ContextMenu` around the grid (opens at the cursor). `useGridSelection`'s `onContextMenu` option first selects the row, day or cell unless it is already fully selected (spreadsheet behavior), then reports the target; elsewhere in the grid it suppresses the browser menu. No visible title; the dropdown's `aria-label` says what it acts on ("Wed, Jun 3", "3 days", "M. Alvarez", "4 rows", "12 cells"). Items (from the user's screenshot, 2026-11-25): Copy (Ctrl C), Paste (Ctrl V, disabled until Copy), Load from template…, Pre-fill | Leave, Post, Fill | Add new ruler (a schedule ruler for the selected days; user, menu entry only), History. **No functionality**: each shows a "Preview only" hint.

## Later (out of scope now, keep room for them)

- Saved filters: actually filter the rows (members need language/certification/OT-list attributes so the counts match).
- Employee search: filter the member rows by the corner input (name, rank, badge).
- Tell the user when Detailed falls back to Compact cells (e.g. a note in the density menu); the grid knows (`cellViewFor` returns `codes`) but the demo doesn't.
- Day view (hour timeline; see `MobileSchedule` `DayView` and `calendar/TimeGridView` for prior art).
- Attachments and Notes tabs.
- Assign / Leave / Add segment / Set actual actually changing the grid; Undo.
- Cells from the current app's legend that the grid doesn't show yet (see Legend), then add them to `legendItems`.
- Coverage alerts actions (Post this shift, Find-Fill), Search, Approvals, Posts, Mandate.
- Keyboard shortcuts scope in `src/tokens/shortcuts.ts`; copy/paste of cells; resizable panel.
- Mobile layout.
- Panel as a drawer over the grid (built, hidden): bring back the pin in the panel header and document it.

## Open questions (ask the user when relevant)

- Schedule rulers ("Add new ruler" in the context menu): what a ruler shows on the grid and how it is edited.
- Context menu: what do Load from template, Pre-fill, Leave, Post, Fill and History open? (Probably the panel's modes and the Find-Fill flow.)
- Meaning of the employee-row icons `Crosshair` and `ChevronDown`, and of the "Hours" button (tooltips are guesses for now).
- Real values for Customer, Hours modifier and Rank (acting).
- Where should employee details open now that names select rows? (e.g. the chevron next to the employee picker in the panel)
- Naming: the view density "Compact" and the cell layout "Compact" (48–96px columns) share a name. Rename one?
- Precedence and the rank effective date aren't shown anywhere in the demo, so those sorts look arbitrary. What exactly is "precedence" in InTime, and should either value appear (e.g. in the name tooltip or employee details)?
- How much of a partly-overtime shift is overtime? The mock data has no hours, so the demo uses the last 2 hours.
- The coverage drawer's Req/Act numbers come from Team View's mock `coverageWindows`, so they don't match the watch's bodies count.

## Verification

- `npx tsc -b` and `npx eslint src` print nothing.
- `npm run dev`, then Playwright screenshots (see CLAUDE.md) of `/#/patterns/workforce-scheduling` in dark and light, and with `reducedMotion: 'reduce'`.
- Exercise these:
  - Click B. Haddad on Fri, Jun 5: `assigned` panel, grid shrinks, row and column headers highlighted.
  - Click an empty cell: + on hover, `new` mode.
  - Click the Tue, Jun 2 open shift: matches the panel screenshot.
  - Shift+click, Ctrl+click and a drag rectangle (`mouse.down/move/up`): `bulk` mode, panel opens only on mouse up.
  - Tab into the grid, then arrows, Shift+arrows, Home/End, Ctrl+A (page text not selected), Escape twice (focus returns to the cell; Full screen stays open).
  - Collapse a group that has selected cells: they drop out. Staffing collapsed shows "N days under".
  - Week → month keeps the selection; Next clears it. Day shows the placeholder. The density menu offers Compact (default), Detailed and Stacked.
  - Time-of-day cell opens the drawer inside the frame. A name selects its row, a date its day; the corner selects nothing. X and the toolbar toggle close the panel. Reset demo restores everything.
  - Scroll month view right and down: the header, open row and names stay pinned.
