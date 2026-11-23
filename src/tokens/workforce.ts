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

/** Every range fits the width: day columns share the space, and the cell layout follows the column width (see `cellLayouts`). */
export const workforceRanges: WorkforceRangeDef[] = [
  { key: 'day', label: 'One Day', placeholder: true, status: 'draft' },
  { key: 'week', label: 'One Week', status: 'draft' },
  { key: '2weeks', label: 'Two Weeks', status: 'draft' },
  { key: '3weeks', label: 'Three Weeks', status: 'draft' },
  { key: 'month', label: 'One Month', status: 'draft' },
]

/* ------------------------------------------------------------------ */
/* Cell layouts: picked from the measured day column width              */
/* ------------------------------------------------------------------ */

export type CellLayout = 'comfortable' | 'compact' | 'mini'

export const cellLayouts: { key: CellLayout; label: string; minWidth: number; shows: string; status: TokenStatus }[] = [
  { key: 'comfortable', label: 'Full', minWidth: 96, shows: 'Full codes, dividers between assignments, OT and OU tags with labels. Usually one week.', status: 'draft' },
  { key: 'compact', label: 'Compact', minWidth: 48, shows: 'Up to two codes stacked, OU as an icon. Usually two or three weeks.', status: 'draft' },
  { key: 'mini', label: 'Mini', minWidth: 0, shows: 'No codes: the fill, out-of-unit stripes and arrow, and a bar for cancelled. Codes are in the tooltip and the panel. Usually one month.', status: 'draft' },
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

/** How much each row shows. Separate from the cell layout, which follows the column width. */
export type ViewDensity = 'detailed' | 'compact' | 'stacked'

export const viewDensities: { key: ViewDensity; label: string; description: string; available: boolean; status: TokenStatus }[] = [
  { key: 'detailed', label: 'Detailed', description: 'Full rows with every shift cell, as in Team View.', available: true, status: 'draft' },
  { key: 'compact', label: 'Compact', description: 'Shorter rows, so more people fit on screen.', available: false, status: 'draft' },
  { key: 'stacked', label: 'Stacked', description: 'A person’s activities for a day stacked in one cell.', available: false, status: 'draft' },
]

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
  ({ name, value, kind, usage, status: 'draft' })

/** Workforce Scheduling grid and panel. All aliases of theme tokens, so they follow the dark and light schemes. */
export const workforceTokens: WorkforceToken[] = [
  t('--workforce-label-width', '232px', 'size', 'Width of the pinned name column.'),
  t('--workforce-label-width-narrow', '168px', 'size', 'Name column when day columns would be narrower than 48px, e.g. a month. Rank badges and supervisor icons hide if they don’t fit.'),
  t('--workforce-header-height', '56px', 'size', 'Height of the date row. The open shifts row is pinned right below it.'),
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
