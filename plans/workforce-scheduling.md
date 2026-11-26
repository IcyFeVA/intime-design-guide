# Workforce Scheduling demo: plan

> **Living plan.** Read this first when working on the Workforce Scheduling page. Tick the progress checklist,
> and add to "Later" and "Open questions" instead of starting over. Reference screenshots: `public/figma/workforce-scheduling-*.png`. The details panel's scenarios and review: see "Details panel scenarios" and `plans/workforce-panel-review.md`.

## Start here: remaining steps

**"Continue with the next step" means: build the first unchecked step below.** Each step names where its spec is.
The decisions there are final unless the user changes them; ask only about the open questions a step lists.

Done: 1. panel core · 2. scenarios (leave, out of unit/branch) · 3. assign mode · 4. warnings, plus locked
court dates, out of branch editable and the always-visible employee search. Details in the "Step N as built"
sections and the 2026-11-26 sections below.

- [ ] **5. Bulk panel** (several cells selected). Spec: "Details panel scenarios" → **Bulk**; `plans/workforce-panel-review.md` item 12; screenshot `public/figma/workforce-scheduling-panel-bulk.png`. Replace today's `BulkItems` (list of cells + "Apply to all") in `WorkforcePanel.tsx`:
  - [ ] No list of the selected cells. The selection help line ("Shift-click or drag to select several cells") moves to the Blank (`none`) empty state.
  - [ ] A shift code picker + "Assign to N": gives every selected person-day the shift in one save (reuse `assignDay`; locked cells and open shifts are skipped, the status line says why).
  - [ ] A collapsed "Change fields" section (Activity, Location, Hours modifier, Unit…) that autosaves to every selected cell's segments.
  - [ ] Footer: Assign + Leave + ⋯ (Load from template, Paste, History, Delete all with a confirm). Leave adds leave to every selected day; Delete all is one Undo step.
- [ ] **6. Attachments tab.** Spec: "Details panel scenarios" → **Tabs and Attachments**, the "Attachments tab (2026-11-25, user)" section; review items 1 and 13; screenshots `-panel-attachments.png` (its free-text inputs are wrong) and `-add-task.png`. Replace the placeholder in `PanelTabs` (`panel/parts.tsx`):
  - [ ] Tabs "Details · Attachments (n)", n = all four sections.
  - [ ] Four sections, always shown with their count and "None yet.": Tags, Assets, Tasks, Notes.
  - [ ] Tags and Assets: one grouped, searchable picker ("Vehicle › Lambo 05"); tags only get "Custom…" (turns it into a text input). Added items are removable chips ("Vehicle · Lambo 05 ✕"). Mock categories: tags (Vehicle, Radio, Court file, Custom…), assets (Vehicle, Radio, Body camera…), 3–6 police/fire values each.
  - [ ] Tasks: "+ Add task" opens the calendar's `TaskFormModal` (`calendar/CalendarModals.tsx`), which first needs a `contained` option to stay in the demo frame. Added tasks list with their time and reminder count.
  - [ ] Notes: add and list notes; the latest note also shows read-only at the end of the Details tab.
  - Open question to ask: do attachments belong to the whole day, an assignment or a segment? Can one asset be on two people at once (warn)?
- [ ] **7. Employee row** (`panel/EmployeeRow.tsx`). Spec: "Details panel scenarios" → **Employee row**; review item 8.
  - [ ] Hours: a popover with this week and this period, overtime and time bank balances (the source of "16 avail." in Bank this time, `bankAvailable` in `panel/options.ts`). Use `workedHours` / `WEEKLY_HOURS_CAP` from `workforce/warnings.ts`.
  - [ ] Crosshair = Find in schedule: scrolls the grid to the person's row and highlights it.
  - [ ] Chevron menu: Message, Call, View profile (opens `EmployeeDetailsModal` with `workforceProfile`, `contained`), View schedule.
- [ ] **8. Smaller gaps** (from the "Not yet" lines of steps 1–3):
  - [ ] Picking another employee in the panel moves the assignment to them (today "Preview only").
  - [ ] Save the Branch field.
  - [ ] Context menu: Copy/Paste and Fill (could reuse assign mode); the others stay preview.
  - [ ] Reopen a moved single assignment in the panel after "Move to another day".

**After each step:** `npx tsc -b` and `npx eslint src` print nothing; check it in the browser (dark and light,
see CLAUDE.md); tick it here; add a "Step N as built" section (what changed, decisions made without the user,
"Not yet"); add a changelog entry at the top of `src/content/changelog.ts` and a page section if users need
to know; update the Workforce row in CLAUDE.md and `.github/copilot-instructions.md`; move new deferred
items to "Later" and new questions to "Open questions".

Open questions that block nothing yet (ask when the step touches them): see "Open questions" below, e.g. leave
approval states, whether all-day leave frees an open shift, the real hours cap and rest minimum.

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
- **Form**: ~~inputs can be edited locally and reset when the selection changes. **The grid data never changes.**~~ Replaced 2026-11-25 by autosave (see "Details panel scenarios" → Save model and "Step 1 as built"). Assign, Leave, Add segment, Set actual and the icon buttons show a "Preview only" hint (`role="status"` demo bar).
- **Bulk panel**: summary line, a list of the selected cells, shared fields, footer actions.
- **Ranges**: 5 views: 1 Day, 1 Week, 2 Weeks, 3 Weeks, 1 Month (numerals since 2026-11-24, user). ~~**Day is a placeholder** (empty state "Day view is coming")~~ (built 2026-11-24, see "Day view"); the stepper moves one day at a time.
- **View density menu**: ~~Detailed (active); Compact and Stacked disabled, marked "Coming soon".~~ Since 2026-11-24 see "View densities" below. Kept in state, applied as `data-view` on the grid. 5 ranges × 3 densities = 15 combinations eventually. View density (row layout) is separate from chip density, which still follows the range.
- **Toolbar**: mostly visual. Working: range menu, date stepper, Sort (`SortModal`), density menu, panel toggle. Under staffed (5), Posts (2), Mandate and Undo render and show a "Preview only" hint.
- **Employee search** (2026-11-24; changed 2026-11-26, user): the corner header is always the "Search employees…" input (no "Employee" label or search button, one click less). X (shown once there's text) or Escape clears it. The input doesn't filter yet.
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

## Details panel scenarios (2026-11-25, user)

Spec only; nothing built yet. The UI review session (`plans/workforce-panel-review.md`) comes first, then the build.
Prototype screenshot: `public/figma/workforce-scheduling-panel-blocks.png` (J. Anderson, one cell with touching PatD + Spe OT, panel editing three segments, "Over weekly hours cap" banner). More screenshots are coming; add each one to the Screenshot column.

**Assignment rules** (user):
- An assignment is made of **segments**. Segments that **touch** (one ends when the next starts, e.g. PatD 08–16 + Spe OT 16–17) form one **block** = one grid cell (`Chip.segments`).
- A segment that **doesn't touch** (Spe 18–19 after 08–16) is a separate block = an extra grid line (a second `Chip` on that day).
- Segments can be typed into the panel, so the panel has to work out the blocks too.

**Decisions** (user, 2026-11-25):
- **Blank** = panel open with nothing selected (the `none` mode). The empty-cell `new` mode stays as an extra state.
- **Same-day assignments**: the panel shows the person's **whole day as blocks**, whichever grid line was clicked. The clicked block is expanded; the others are collapsed to a summary line.
- **Typed times that no longer touch**: the segment **moves into a new block right away** with an inline note ("Doesn't touch 08:00–16:00. It shows on its own line.") and Undo. Nothing is blocked.
- **Partial leave**: a leave segment **inside the block**, overlapping the base (PatD 08–16 + Sick 13–16). The panel says "5h worked · 3h leave"; the grid keeps the diagonal split (`Chip.partialKind`).
- **Out of unit** (another unit, same precinct): **editable**, with a banner ("Working for Special Ops · out of unit"); the Unit field shows the other unit.
- **Out of branch** (another precinct): **read-only**, with a banner naming the precinct and an "Open in 84th Precinct" link (preview only).
- **Notes** move into the Attachments tab (one tab). Its name is decided in the review session.
- **Field scope** (review item 3):
  - Employee and Branch are shared at the top.
  - Every other field is **per segment**: times, Activity, Location, Hours modifier, Bank, Customer, Unit, Rank (acting). ~~They live inside the selected segment, which expands like an accordion.~~ They're in **one form below the segment list** (changed 2026-11-25, see "Step 1 as built").
  - Checking **Bank this time** reveals a Time bank `Select` (Overtime, Comp Time, Holiday) and "Amount (h) · 16 avail.".
- **Blocks UI** (review item 4; **replaced 2026-11-25** by the indented list, see "Step 1 as built"):
  - One card per block, with a header showing the times and total; collapsed blocks shrink to the header.
  - One "+ Add segment" at the end of the day; the new segment touches the last one, and the times decide the block.
  - Partial leave is an indented row under the segment it overlaps, and the header reads "5h worked · 3h leave".
- **No Times card** (review item 2; **reversed 2026-11-25**: the Times card is back in the form):
  - Times are edited in the expanded segment's row.
  - The date belongs to the block: "Move to another day" moves all its segments, and "+1 day" marks times past midnight.
  - Set actual is per segment: Actual start/end, with the scheduled times dimmed.
- **Save model** (review item 9). This **replaces** "The grid data never changes" from the 2026-11-23 decisions.
  - **Autosave**: a field saves when you leave it. The demo keeps an editable copy of the mock data, so the grid re-splits cells and lines live, toolbar Undo works, and Reset demo restores it.
  - Invalid times aren't saved: the field shows an error and the last valid value is kept.
  - The footer is the same everywhere: **Assign + Leave + ⋯ (History, Delete)**, with buttons that don't apply disabled.
  - **Assign** on a filled cell copies the shift into an assign mode: click cells to give them the shift, Escape ends it.
  - **Leave** opens an inline leave entry (type, All day or from–to, defaulting to the expanded block).
  - Assign mode replaces a filled cell's assignment (Undo reverts), and a drag assigns a range.
- **Warnings** (review item 7):
  - Four kinds: hours cap, minimum rest, missing qualification, double booked / on leave.
  - They form one stack under the employee row ("2 warnings ›" when there are several), and the block's header gets a ⚠ mark.
  - They never block saving; the grid cell gets a small ⚠ mark.
  - Mock data needs a few people who trigger each one.
- **Out of unit / branch** (review item 10):
  - Out of branch in the grid is a muted cell with a "↗ 84th" tag; out of unit keeps its hatching.
  - The out-of-branch panel shows plain label + value pairs.
  - Banners: "Working for Special Ops (out of unit)" and "Working at 84th Precinct. Only 84th Precinct can change this." + "Open in 84th Precinct".
  - This needs a new legend item (`legendItems`).
- **Bulk** (review item 12):
  - No list of the selected cells.
  - A shift code picker + "Assign to N", then a collapsed "Change fields" section that autosaves to every selected cell.
  - Footer: Assign + Leave + ⋯ (Load from template, Paste, History, Delete all with a confirm).
  - The selection help line moves to the Blank empty state.
- **Tabs and Attachments** (review items 1 and 13). These override the free-text and two-dropdown descriptions in "Attachments tab" below.
  - Two tabs: Details · Attachments (n); the latest note also shows read-only at the end of Details.
  - Tags and assets use one grouped, searchable picker (category › value, Custom… for tags only) and show as removable chips.
  - All four sections are always shown, with "None yet.".
- **Small items** (review items 5, 6 and 11):
  - Segment icons (live, find, cancel) show only on the expanded segment; other rows show just ⋯.
  - Durations read "8h" / "7h 30m", ends past midnight show "+1", and a span over 16h gets a field warning.
  - The header title is the name (or "Open shift · Swing Patrol"), with "Wed, Feb 18, 2026 · Day watch" as the subtitle; "Editing:" is gone.
  - Branch's label goes on top.
- **Employee row** (review item 8):
  - **Hours** opens a popover with the person's hours (week, period, overtime, bank balances, the source of "16 avail.").
  - **Crosshair** = Find in schedule (scrolls to the person's row and highlights it).
  - **Chevron** = a menu of actions: Message, Call, View profile (`EmployeeDetailsModal`), View schedule.

| # | Scenario | Mock trigger (week of Jun 1–7) | Panel | Screenshot |
| --- | --- | --- | --- | --- |
| 1 | Blank | Panel toggle, no selection | Hint (exists) | |
| 2 | Assignment | B. Haddad, Fri Jun 5, PatD (exists) | One block, one segment. Footer Save, Leave, ⋯ | |
| 3 | Leave | T. Nguyen, Tue Jun 2, Vac (exists) | Leave type, all day or times, approval state. No Activity, Location or Customer. Footer: Cancel leave | |
| 4 | Open shift | Tue Jun 2, PatS 12–22 (exists) | As today: no employee, "1 of 1 still needed" | `-panel.png` |
| 4b | Live post | Tue Jun 2, PatD 07–17 live (exists) | Title names the unit ("Special Ops" in the prototype), subtitle "Live post · 2 of 4 still needed". One segment; fields carry the post's values (Special Event, Barclays Center, OT) | `-panel-live.png` |
| 5 | Partial leave | **new**: E. Rodriguez, Wed Jun 3, PatD 08–16 + Sick 13–16 | Leave segment nested under the base, "5h worked · 3h leave" | |
| 6 | Multiple blocks | **new** (replaces the curated day): J. Anderson, Wed Jun 3, PatD 08–16 + Spe OT 16–17 (block 1), Spe 18–19 (block 2) | Two blocks, touching segments chained; shows the "doesn't touch" note | `-panel-blocks.png` |
| 7 | Out of unit | **new**: L. Garcia, Tue Jun 2, PatD for Special Ops | Banner, editable, Unit = Special Ops | |
| 8 | Out of branch | **new**: D. Patel, Thu Jun 4, at 84th Precinct - Brooklyn | Banner, read-only, "Open in 84th Precinct" | |
| + | New (empty cell) | Any empty member cell | As today | |
| + | Bulk | Several cells | Ours: list of cells + "Apply to all" fields. Prototype: a hint line, a Shift `Select` + "Assign to 2", then Load from template, Paste, Delete all. Which one wins is review item 12 | `-panel-bulk.png` |

**Block rules**
- Touching = the end time equals the next start time. Sort the segments by start, then chain them.
- A leave segment that overlaps a working segment stays in that block (partial leave).
- A day can have any number of blocks; they're listed by start time.
- A segment whose end is before its start runs overnight (20:00–04:00) and gets a "+1 day" mark.

**Validation states to design**
- End before start where an overnight shift isn't likely. The screenshot shows "20:00–18:00" computed as 22h.
- Working segments that overlap, inside a block or across blocks.
- A zero-length segment.
- Warnings such as the weekly hours cap (see the review doc).

**Model changes for the build**
- `PanelItem 'assigned'` carries all of the day's chips (`blocks`) and the clicked index, so either grid line opens the same panel.
- A `leave` kind for cells that are leave only.
- `Chip` gets optional `unit` (out of unit) and `branch` (out of branch).
- A pure `groupBlocks(segments)` helper in `workforce/model.ts`, shared by the panel and the mock data.
- Out of branch needs its own mark in the grid; only out of unit is hatched today (review item).

### Step 1 as built (2026-11-25): panel core

- [x] Editable data: `applyEdits(edits)` + `ScheduleEdits` / `OpenShiftEdit` / `SegmentDetails` / `WorkforceSegment` in `data.ts`; `openShifts(day, edits)`; `useScheduleEdits` (commit, undo, reset, 50 steps). The demo builds the grid from the edited watches; staffing and alerts follow.
- [x] `groupBlocks` / `flattenDay` / `regroupDay` in `model.ts`. `PanelItem` is now `day` (all blocks + clicked `line` + that line's `chip`) or `open-shift`; the panel is keyed by person and day.
- [x] Panel split into `workforce/panel/`: `DayEditor`, `OpenShiftEditor`, `BlockCard` (block header, rows, expanded segment), `SegmentFields`, `EmployeeRow`, `parts` (footer, tabs), `options`, `format`.
- [x] Times are saved when focus leaves the start/end pair (or on Enter), so changing both doesn't save a half-edit.
- [x] Split/join note ("Doesn't touch …" / "Touches …, so it joins that line.") with Undo. Overlap and zero length aren't saved (field error); > 16h warns ("Longer than 16h. Is that right?").
- [x] Block ⋯: Move to another day… (DatePicker popover; the block regroups with that day, an overlap refuses the move) and Delete block. Footer Delete deletes the open block.
- [x] Toolbar Undo works (disabled when there's nothing to undo); Ctrl/⌘+Z outside inputs. Status line copy updated.
- [x] `useGridSelection` got `fallbackRow` (`model.fallbackRow`): when an edit removes or empties a person's extra line, the selection moves to their first line, so the panel stays.
- [x] `formatHour` prints real minutes; `formatDuration` ("7h 30m") in `schedule/data.ts`.
- **Changed after trying it (2026-11-25, user):** the block cards with fields inside the segment were hard to read. Now: **one list** of the day's segments, each block's first segment as the **root** and touching segments **indented** (`CornerDownRight`); a non-touching assignment starts a new root. The root row shows the block total under its times ("12h total · 07:00–19:00") and its ⋯ has Move to another day… / Delete assignment. **One form below the list** for the selected segment: the **Times card is back** (Scheduled = moves the assignment, Start, End, Hours, Set actual), then Shift code, Activity, Location, Customer, Hours modifier + Bank, Unit, Rank. Icons (live, find, cancel) only on the selected row. Files: `panel/SegmentList.tsx`, `panel/TimesCard.tsx` (BlockCard removed). This overrides review items 2 and 4 and the "fields inside the segment" part of item 3.
- **Typed times** (2026-11-25, user): no time picker and no AM/PM. `panel/TimeField.tsx` is a plain `TextInput` (mono, `inputMode="numeric"`, selects on focus) that accepts 8, 0800, 830, 1730, 8:30, 8.30 and 8h30 (`parseTime` in `panel/format.ts`) and tidies to `HH:MM` on blur. Used for Start/End and the actual times.
- **Page regrouped** (2026-11-25, user): Desktop, then groups **The grid** (selection, rows, views, sizing), **The details panel** (`panel` "What it shows", `assignments`, `editing`, `times` "Typing times" with a try-it field) and **Reference** (component, tokens, guidelines, figma). Group headings are registry sections with `'group'` (`s()` in `pages.ts`), rendered as `Section size="display"`; the TOC indents the sections under them.
- Not yet: Branch isn't saved (local state, per day). The employee picker on a day says "Preview only" (reassigning is assign mode, step 3). A collapsed single block isn't reopened automatically after a move.

### Step 2 as built (2026-11-25): scenarios

- [x] `Chip` (`schedule/data.ts`) has `unit` (out of unit) and `branch` (out of branch); `describeChip` names them, `branchShort` gives "84th". `regroupDay` keeps both, and refuses a block that would mix another branch's segments with ours.
- [x] Mock days (week of Jun 1–7): T. Nguyen Tue Vac all day (3), E. Rodriguez Wed PatD 08–16 + Sick 13–16 (5), J. Anderson Wed PatD 08–16 + Spe OT 16–17 and Spe 18–19 (6), L. Garcia Tue PatD for Special Ops (7), D. Patel Thu PatD at 84th Precinct - Brooklyn (8). Random out-of-unit cells name a unit (Special Ops, K9 Unit, Training). `HOME_BRANCH`/`OTHER_BRANCH` in `data.ts`; `branches` in `panel/options.ts` lists both.
- [x] Coverage: out-of-branch cells don't count; a partial leave takes its hours off the working segment (`workingSpans`).
- [x] Grid: out of branch is muted (`--schedule-branch-bg`/`-text`, draft) with "↗ 84th" in ShiftChip, DetailedChip and StackedChip; no OU or OT tag on it. Legend adds Partial leave and Out of branch.
- [x] Panel: `AssignmentBanner` (parts.tsx) for the selected block. Out of unit: "Working for Special Ops (out of unit)", editable, Unit defaults to the chip's unit. Out of branch: "Working at 84th Precinct. Only 84th Precinct can change this." + "Open in 84th Precinct" (preview), `ReadOnlyFields` (label + value pairs), Branch shows the other precinct read-only, rows have no actions, Delete is off. Each block's root row names where it's worked under its times ("↗ Special Ops", "↗ 84th Precinct").
- [x] Leave entry (`panel/LeaveEntry.tsx`), from the footer's Leave: type (leave codes), Part of day (from–to, defaults to the selected block; nests as a partial leave) or All day (replaces this branch's blocks with one 00:00–24:00 leave cell, "Replaces … Undo brings it back."). Cancel/Escape close it; Enter adds.
- [x] A selected leave segment: Times card (no Set actual, no 16h warning) + Leave type only; no live/find/cancel icons. Footer Delete reads "Delete leave" for a leave-only block. 00:00–24:00 shows "All day" (24:00 in the End field; `endValue`, `TimeField` keeps 24:00).
- [x] Page: new sections `leave` "Adding leave" and `elsewhere` "Out of unit and branch"; scenario days listed under Assignments and segments.
- Decided without the user (check): All day **replaces** the day's assignments (Undo restores) rather than nesting a 24h leave in each block. Out of unit is a cell flag, so changing a segment's Unit field doesn't make it out of unit, and Branch still isn't saved (changing it to another precinct would lock the day).
- Not yet: leave approval states (open question); the freed shift after all-day leave doesn't become an open shift.

### Step 3 as built (2026-11-26): assign mode

- [x] Footer **Assign** copies the selected block (all its segments and its out-of-unit flag; never another branch's, Assign is disabled there) into assign mode. On an empty day it first gives that day the watch's regular shift (`watch.code`, `start`–`end`), then starts. While on, the footer button reads **Done assigning** (every panel state, bulk included).
- [x] `workforce/AssignBar.tsx`: a bar floating over the bottom of the grid (`.assignBar` in `WorkforceDemo.module.css`): "Assigning [codes] 07:00–17:00", "From B. Haddad, Fri, Jun 5. Click or drag cells to assign it. Esc stops.", Done. The scroller gets `data-assigning`: people's cells show `cursor: copy` and a dashed outline on hover.
- [x] Cells get the shift through the normal selection: a click, a drag, Shift-click or Enter ends with `onActivate(via, target)`; `useGridSelection` now passes `GridActivation` (`kind` cells/rows/columns and the cells selected then, kept in a layout-effect ref for the end of a drag). Only `cells` activations assign; name and date headers select as usual. One commit per click or drag = one Undo step.
- [x] `assignDay(chips, lines, source)` (`model.ts`): replaces the clicked lines and any of this branch's cells the copy overlaps; another branch's cells stay, and overlapping one skips that day ("works at 84th Precinct then"). Days that already hold exactly this are skipped (`changed: false`), so Ctrl-clicking more cells doesn't re-save earlier ones.
- [x] Open shifts and live posts: `AssignSource.openShift` (`{ id, day }`). Only person-days on the shift's day take it; each fills one place (`OpenShift.filled`, `stillNeeded()` in `data.ts`; `openShifts` drops it at 0, the heading reads "1 of 2 still needed"). When it's filled, assign mode stops.
- [x] Escape ends assign mode first (a window capture listener while it's on), unless a field, dropdown, menu or dialog has focus. Reset demo ends it.
- [x] The status line reports each assign ("Assigned PatD 07:00–17:00 to B. Haddad, Sat, Jun 6. Undo reverts it.", or "to 4 cells") and why cells were skipped.
- [x] Page: new section `assigning` "Assigning a shift" (The details panel group); changelog.
- Decided without the user (check): clicking any person's cell while assigning gives it the shift, so you stop to look around; name/date headers don't assign a whole row or day; an empty day's Assign uses the watch's regular shift rather than asking for a code.
- Not yet: the employee picker in the panel (reassigning a day, or picking who gets an open shift) is still preview only; the context menu's Fill/Paste don't use assign mode; bulk Assign (code picker + "Assign to N") is the bulk step.

### Step 4 as built (2026-11-26): warnings

- [x] `workforce/warnings.ts`: `dayWarnings(member, day)` returns `ScheduleWarning[]` (`kind`, `title`, `detail`, `blocks` = the day's cells it's about), most serious first: **double booked** (working segments in two cells at once; "Double booked with 84th Precinct", "PatD 07:00–17:00 overlaps Spe 15:00–19:00"), **already on leave** (leave covers all of a working segment; "Already on Vac"), **minimum rest** (< `MIN_REST_HOURS` 8h between the latest work on the two days before and the day's first work; "Only 7h rest after PatS on Mon, Jun 1", "8h minimum · Spe 06:00–10:00"), **not certified** (`WorkforceMember.lacks`, matched against each segment's activity field or its code's activity), **over weekly hours cap** (> `WEEKLY_HOURS_CAP` 60h Monday–Sunday, counted wherever worked, minus leave; shows from the day the week goes over, on days with work; "Week of Jun 1 · 70h of 60h"). `workedHours(chips)`; `subtract`/`Span` now exported from `data.ts`.
- [x] Grid: `buildGridModel` gives member rows `warnings` (per day, this line's warning titles or null). `MemberCell` draws a 16px `TriangleAlert` (was 12px; user, 2026-11-26) in the cell's top-left (`.warnMark`, warning-filled fill, black stroke) in every density and adds "Warning: …" to its label. Legend row "Warning" (`legendItems` key `warning`, draft).
- [x] Panel: `panel/Warnings.tsx` `WarningStack` under the employee row (`--background-warning-light`, `--border-warning-default`). One warning shows as is; several collapse to "N warnings" (toggle). Rows about an assignment are buttons that select its root segment (›); the hours cap row isn't. The block's root row gets a ⚠ before its duration (`BlockInfo.warning`).
- [x] Warnings never block; they're derived from the edited schedule, so they follow saves and Undo at once (e.g. assign B. Haddad's Friday to Sat + Sun → Sun "70h of 60h").
- [x] Mock days: A. Johnson Wed (PatD + Spe at 84th 15–19, double booked), C. Lee Fri (PatD + Vac 07–17), Y. Cohen Mon PatN then Tue Train 06–10 + PatN (rest), J. Anderson lacks Special detail (Wed), O. Petrov Mon PatS to 23:00, Tue Spe 06–10 at Barclays Center with activity Special event + PatS, lacks Special event (two warnings). The rotation's random extra assignment now only lands on working days without overlapping the main one (it made spurious double bookings).
- [x] Page: section `warnings` (table of the five, how they show, try-it); changelog.
- Decided without the user (check): the cap is 60h (50h flagged almost every weekend overtime); the hours cap marks only days from the crossing on, not the whole week (the prototype shows it on a Wednesday); a split shift within one day (J. Anderson 17:00 → 18:00) doesn't count as rest; double booked and leave are one warning kind (`conflict`).
- Note: a mock day that is already double booked can't save other edits until the overlap is fixed (`regroupDay` refuses overlaps: "Overlaps … Not saved."). Deleting or moving either assignment works.

### Locked assignments; out of branch editable (2026-11-26, user)

- **Out of branch is editable** (user: the scheduler can change another precinct's assignment). It keeps its grid look (muted, "↗ 84th") and still doesn't count towards staffing. Banner: "Working at 84th Precinct (out of branch)" + "Open in 84th Precinct" (preview). This overrides "Out of branch: read-only" in the 2026-11-25 decisions and step 2.
- **Locked** replaces it as the read-only case: `Chip.locked` = who set it (e.g. "Kings County Court"), for assignments set outside scheduling such as court dates. Grid: the same muted cell as out of branch with a `Lock` icon instead of the arrow (ShiftChip, DetailedChip, StackedChip via `data-branch`). Panel: gray banner "Set by Kings County Court. You can’t change it here.", `ReadOnlyFields`, no row actions, Assign and Delete off; the root row's tag reads "🔒 Set by Kings County Court". `regroupDay` refuses joining a locked block ("Touches an assignment set by …"); `assignDay` skips a day whose locked cell it would overlap; all-day leave keeps locked cells. Counts towards staffing like any assignment. Legend row Locked (draft).
- Mock: Court 08–12 T. Nguyen Wed, Court 13–17 S. Kowalski Tue and L. Garcia Fri (`court()` in `data.ts`), near the top of the Day watch.
- Page: `elsewhere` is now "Out of unit, out of branch and locked" (three columns).
- **Out of branch simplified** (2026-11-26, user): cells show only the ↗ arrow (no "84th"; `branchShort` removed); the banner is just "Working out of branch" (no "Open in 84th Precinct" link); the root row's tag reads "Out of branch". Screen-reader labels still name the precinct (`describeChip`). Earlier mentions of "↗ 84th" in this plan are outdated.

### Attachments tab (2026-11-25, user)

Prototype: `public/figma/workforce-scheduling-panel-attachments.png` (S. Kowalski). It has three sections, Tags, Assets and Tasks, each with a count and an empty state ("None yet."). **The prototype's free-text inputs are wrong** (user). The correct behavior:

- **Tags**: two dropdowns. Pick a **category** first (e.g. Vehicle), then a **value** from that category (e.g. "Lambo 05"), then Add. The category **Custom** swaps the value dropdown for a text input, for free values like "Courtfile #PKXD393". Added tags show as removable chips ("Vehicle · Lambo 05").
- **Assets**: the same category → value dropdowns, with **no Custom category** (user). Assets come from a fixed inventory.
- **Tasks**: "+ Add task" opens the calendar's task modal (`TaskFormModal` in `calendar/CalendarModals.tsx`; screenshot `public/figma/workforce-scheduling-add-task.png`): Task name (required), Start date (the assignment's day by default), All day / Set time, Activity, Recurrence, reminders (Add reminder; Repeats, Every…, Until…) and an optional note, then Cancel / Submit. Added tasks are listed with their time and reminder count. The modal needs a `contained` option to stay inside the demo frame, which it doesn't have yet.
- **Notes**: the Notes tab moves in here as a fourth section (the user's decision). The tab's count covers all four sections.
- Mock data to add: tag categories (Vehicle, Radio, Court file, Custom…) and asset categories (Vehicle, Radio, Body camera…), each with 3–6 police/fire values (e.g. "Car 4417", "Engine 12", "Radio R-208").

## Later (out of scope now, keep room for them)

- Saved filters: actually filter the rows (members need language/certification/OT-list attributes so the counts match).
- Employee search: filter the member rows by the corner input (name, rank, badge).
- Tell the user when Detailed falls back to Compact cells (e.g. a note in the density menu); the grid knows (`cellViewFor` returns `codes`) but the demo doesn't.
- Day view (hour timeline; see `MobileSchedule` `DayView` and `calendar/TimeGridView` for prior art).
- Attachments and Notes tabs (Notes merge into Attachments, 2026-11-25).
- Details panel scenarios: steps 1–4 built. What's left is tracked in **"Start here: remaining steps"** at the top.
- Assign / Leave / Add segment / Set actual actually changing the grid; Undo.
- Cells from the current app's legend that the grid doesn't show yet (see Legend), then add them to `legendItems`.
- Coverage alerts actions (Post this shift, Find-Fill), Search, Approvals, Posts, Mandate.
- Keyboard shortcuts scope in `src/tokens/shortcuts.ts`; copy/paste of cells; resizable panel.
- Mobile layout.
- Panel as a drawer over the grid (built, hidden): bring back the pin in the panel header and document it.

## Open questions (ask the user when relevant)

- Warnings (step 4): the real hours cap and rest minimum, and whether they vary by rank or contract. Should a warning ask for a reason (override) before saving? Which certifications exist, per activity?
- Assign mode (step 3): should a name or date header assign the whole row or day while assigning? Should picking another employee in the panel move the assignment to them?
- All-day leave replaces the day's assignments (step 2). Should the freed shift become an open shift, or should the assignment stay, marked as on leave?
- Should changing a segment's Unit to another unit make the assignment out of unit (striped), and Branch to another precinct make it out of branch (read-only)?

- Details panel: the open UI decisions are tracked in `plans/workforce-panel-review.md`, not here. Leave approval states (pending, approved, denied) and how they show in the panel are open too.
- Attachments: do tags, assets and tasks belong to the whole day, a block or a segment? Can the same asset (e.g. "Car 4417") be on two people at the same time, and should that warn?

- Schedule rulers ("Add new ruler" in the context menu): what a ruler shows on the grid and how it is edited.
- Context menu: what do Load from template, Pre-fill, Leave, Post, Fill and History open? (Probably the panel's modes and the Find-Fill flow.)
- ~~Meaning of the employee-row icons~~ Answered 2026-11-25 (review item 8): Hours = hours summary popover, Crosshair = Find in schedule, Chevron = person actions menu.
- Real values for Customer, Hours modifier and Rank (acting).
- ~~Where should employee details open?~~ The chevron menu's "View profile" (2026-11-25).
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
