import type { TokenStatus } from './types'
import type { ScheduleRange } from './schedule'

/* ------------------------------------------------------------------ */
/* Views: five date ranges, each with three densities (later)          */
/* ------------------------------------------------------------------ */

export type WorkforceRange = ScheduleRange | 'day'

export interface WorkforceRangeDef {
  key: WorkforceRange
  label: string
  /** Not built yet: the grid shows an empty state */
  placeholder?: boolean
  status: TokenStatus
}

/** Every range fits the width: day columns share the space, and the cell layout follows the column width (see `cellLayouts`). One day is at most `--workforce-day-max-width` wide, centered. */
export const workforceRanges: WorkforceRangeDef[] = [
  { key: 'day', label: 'One Day', status: 'draft' },
  { key: 'week', label: 'One Week', status: 'confirmed' },
  { key: '2weeks', label: 'Two Weeks', status: 'confirmed' },
  { key: '3weeks', label: 'Three Weeks', status: 'confirmed' },
  { key: 'month', label: 'One Month', status: 'confirmed' },
]

/* ------------------------------------------------------------------ */
/* Cell layouts: picked from the measured day column width              */
/* ------------------------------------------------------------------ */

export type CellLayout = 'comfortable' | 'compact' | 'mini'

export const cellLayouts: { key: CellLayout; label: string; minWidth: number; shows: string; status: TokenStatus }[] = [
  { key: 'comfortable', label: 'Full', minWidth: 96, shows: 'Full codes, dividers between assignments, OT and OU tags with labels. Usually one week.', status: 'confirmed' },
  { key: 'compact', label: 'Compact', minWidth: 48, shows: 'Up to two codes stacked, OU as an icon. Usually two or three weeks.', status: 'confirmed' },
  { key: 'mini', label: 'Mini', minWidth: 0, shows: 'Shorter 32px cells with no codes: the fill, out-of-unit stripes and arrow, and a bar for cancelled. Codes are in the tooltip and the panel. Usually one month.', status: 'confirmed' },
]

/** Day column width in px below which the name column switches to `--workforce-label-width-narrow` */
export const NARROW_LABEL_BELOW = 48

export const cellLayoutFor = (columnWidth: number): CellLayout =>
  cellLayouts.find((layout) => columnWidth >= layout.minWidth)?.key ?? 'mini'

/* ------------------------------------------------------------------ */
/* Details panel placement                                              */
/* ------------------------------------------------------------------ */

export type PanelPlacement = 'docked' | 'drawer'

export const panelPlacements: { key: PanelPlacement; label: string; description: string; status: TokenStatus }[] = [
  { key: 'docked', label: 'Docked', description: 'Beside the grid, which gets narrower. The default.', status: 'draft' },
  { key: 'drawer', label: 'Drawer', description: 'Over the right edge of the grid, which keeps its full width.', status: 'draft' },
]

/** How much each cell shows. Detailed only applies where its text fits (the Full cell layout); narrower days show Compact cells. Stacked fits any width. */
export type ViewDensity = 'detailed' | 'compact' | 'stacked'

/** Target screen width for the desktop design: a 14-inch MacBook Pro at its default 1512 × 982. The demo's Target resolution button opens at this width. */
export const TARGET_WIDTH = 1512

export const DEFAULT_VIEW_DENSITY: ViewDensity = 'compact'

export const viewDensities: { key: ViewDensity; label: string; description: string; available: boolean; status: TokenStatus }[] = [
  { key: 'detailed', label: 'Detailed', description: 'Activity names and times, with overtime split out. Needs wide days, usually one week.', available: true, status: 'confirmed' },
  { key: 'compact', label: 'Compact', description: 'Shift codes only, so any range reads at a glance. The default.', available: true, status: 'confirmed' },
  { key: 'stacked', label: 'Stacked', description: 'Colored bars without text, one per assignment, with overtime split out. Fits the most people on screen, at any range.', available: true, status: 'confirmed' },
]

/** What the grid's member and open-shift cells show: codes (Team View's cells), names and times, or bars. */
export type CellView = 'codes' | 'detailed' | 'stacked'

/** Detailed only when the days are wide enough (Full layout); Stacked at any width; Compact always shows codes. */
export const cellViewFor = (view: ViewDensity, layout: CellLayout): CellView =>
  view === 'stacked' ? 'stacked' : view === 'detailed' && layout === 'comfortable' ? 'detailed' : 'codes'

/* ------------------------------------------------------------------ */
/* CSS variables                                                       */
/* ------------------------------------------------------------------ */

export interface WorkforceToken {
  name: `--workforce-${string}`
  value: string
  kind: 'size' | 'color'
  usage: string
  status: TokenStatus
}

const t = (name: WorkforceToken['name'], value: string, kind: WorkforceToken['kind'], usage: string): WorkforceToken =>
  ({ name, value, kind, usage, status: 'confirmed' })

/** Workforce Scheduling grid and panel. All aliases of theme tokens, so they follow the dark and light schemes. */
export const workforceTokens: WorkforceToken[] = [
  t('--workforce-label-width', '232px', 'size', 'Width of the pinned name column.'),
  t('--workforce-label-width-narrow', '168px', 'size', 'Name column when day columns would be narrower than 48px, e.g. a month. Rank badges and supervisor icons hide if they don’t fit.'),
  t('--workforce-mini-chip-height', '32px', 'size', 'Shift cell height in the Mini layout (very narrow days, e.g. a month), so more people fit.'),
  t('--workforce-mini-row-height', '44px', 'size', 'Row height in the Mini layout: the cell plus 6px above and below.'),
  t('--workforce-detailed-chip-height', '44px', 'size', 'Shift cell height in the Detailed view: a name over its times, or two one-line assignments.'),
  t('--workforce-detailed-row-height', '56px', 'size', 'Row height in the Detailed view: the cell plus 6px above and below.'),
  t('--workforce-stacked-chip-height', '16px', 'size', 'Height of each assignment bar in the Stacked view. More assignments make the row taller.'),
  t('--workforce-stacked-row-height', '28px', 'size', 'Row height in the Stacked view with one assignment: the bar plus 6px above and below.'),
  t('--workforce-day-max-width', '800px', 'size', 'Widest the grid gets for one day, names included. It is centered, as in the calendar’s day view.'),
  t('--workforce-header-height', '56px', 'size', 'Height of the date row, which stays pinned while the grid scrolls.'),
  t('--workforce-panel-width', '380px', 'size', 'Width of the details panel on the right.'),
  t('--workforce-selected-bg', 'var(--background-primary-light)', 'color', 'Background of a selected cell, around its shift.'),
  t('--workforce-selected-border', 'var(--border-primary-default)', 'color', 'Outline around a selected range of cells.'),
  t('--workforce-active-outline', 'var(--background-primary-filled)', 'color', 'Outline of the active cell, the one the panel and the keyboard work on.'),
  t('--workforce-header-active-bg', 'var(--background-primary-light)', 'color', 'Name and date headers of the active cell.'),
  t('--workforce-header-active-text', 'var(--text-primary-default)', 'color', 'Text and underline of the active cell’s headers.'),
  t('--workforce-add-icon', 'var(--text-dimmed)', 'color', 'Plus shown on an empty cell on hover.'),
  t('--workforce-open-border', 'var(--border-default)', 'color', 'Dashed outline of an open or live shift.'),
]

export const workforceCssVariables: Record<string, string> = Object.fromEntries(workforceTokens.map((token) => [token.name, token.value]))

/* ------------------------------------------------------------------ */
/* Fitting the days to the width                                        */
/* ------------------------------------------------------------------ */

const tokenPx = (name: string) => parseFloat(workforceTokens.find((token) => token.name === name)!.value)
export const LABEL_WIDTH = tokenPx('--workforce-label-width')
export const LABEL_WIDTH_NARROW = tokenPx('--workforce-label-width-narrow')
export const PANEL_WIDTH = tokenPx('--workforce-panel-width')
export const DAY_MAX_WIDTH = tokenPx('--workforce-day-max-width')

/**
 * Days always share the full width. From the grid's measured width (the scroll area, without a vertical scrollbar):
 * day columns with the wide name column; if they'd be narrower than NARROW_LABEL_BELOW, the narrow name column instead;
 * then the cell layout from the resulting column width. Deterministic, so it can't flip back and forth.
 */
export function fitColumns(width: number, dayCount: number) {
  const days = Math.max(1, dayCount)
  const wide = (width - LABEL_WIDTH) / days
  const narrowLabel = width > 0 && wide < NARROW_LABEL_BELOW
  const column = narrowLabel ? (width - LABEL_WIDTH_NARROW) / days : wide
  return { narrowLabel, column, layout: width > 0 ? cellLayoutFor(column) : 'comfortable' as CellLayout }
}
