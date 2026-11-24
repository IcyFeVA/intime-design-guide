import type { TokenStatus } from './types'

/**
 * Which theme token colors each schedule and calendar cell, per theme.
 * `background` is a theme token name without `--` (e.g. `soft3`).
 * Special cases add a `border`, `text` or `hatch` (stripes, see `cellPatterns.ts`) token on top of the background.
 */
export interface CellColor {
  background: string
  border?: string
  text?: string
  /** Stripes laid over the background */
  hatch?: string
}

export interface CellKind {
  key: string
  label: string
  usage: string
  /** Text in the sample cell on the Colors page. Default "PatD". */
  sample?: string
}

export const cellColorsStatus: TokenStatus = 'confirmed'

export const cellKinds: CellKind[] = [
  { key: 'activity', label: 'Activity', usage: 'A scheduled shift or assignment.' },
  { key: 'activity-out', label: 'Activity (out of unit/branch)', usage: 'An assignment outside the member’s own unit or branch.' },
  { key: 'leave', label: 'Leave', usage: 'Time off: sick, PTO or vacation.' },
  { key: 'overtime', label: 'Overtime', usage: 'Hours beyond the regular schedule.' },
  { key: 'task', label: 'Task', usage: 'A task on the employee calendar.' },
  { key: 'signups', label: 'Sign-ups', usage: 'Open shifts a member can sign up for.' },
  { key: 'all-day-event', label: 'All-day event', usage: 'Calendar events that last the whole day.' },
  { key: 'all-day-leave', label: 'All-day leave', usage: 'Leave that covers the whole day.' },
  { key: 'ruler-date', label: 'Schedule ruler (date)', usage: 'Date header of the schedule ruler.' },
  { key: 'ruler-cell', label: 'Schedule ruler (cell)', usage: 'Day cells of the schedule ruler.' },
  { key: 'pending', label: 'Pending', usage: 'Requests waiting for approval.' },
  { key: 'expired', label: 'Inactive', usage: 'Days on and after an employee’s expiry day: thin stripes on the empty cell.', sample: '' },
]

const shared = {
  signups: { background: 'background-primary-light', border: 'border-primary-default' },
  'all-day-event': { background: 'background-info-light', text: 'text-info' },
  pending: { background: 'background-warning-light', border: 'border-warning-default', text: 'text-warning-default' },
} satisfies Record<string, CellColor>

const theme = (
  activity: string, leave: string, overtime: string, task: string, rulerDate: string, rulerCell: string, outHatch: string, expiredHatch: string,
): Record<string, CellColor> => ({
  activity: { background: activity },
  'activity-out': { background: activity, hatch: outHatch },
  expired: { background: 'background-body', hatch: expiredHatch },
  leave: { background: leave },
  overtime: { background: overtime },
  task: { background: task },
  'all-day-leave': { background: leave },
  'ruler-date': { background: rulerDate },
  'ruler-cell': { background: rulerCell },
  ...shared,
})

/** Keyed by theme id from `themes/index.ts`, then by cell kind key. */
export const cellColors: Record<string, Record<string, CellColor>> = {
  // Out-of-unit stripes are one step away from the activity fill; expired stripes are a quiet neutral.
  //                    activity  leave    overtime task     ruler date ruler cell out stripes expired stripes
  dark: theme(          'base3',  'base5', 'deep6', 'base8', 'soft4',   'soft7',   'soft3',    'base8'),
  light: theme(         'soft3',  'soft5', 'deep7', 'soft8', 'deep4',   'base2',   'base3',    'deep8'),
  dusk: theme(          'base3',  'base5', 'soft7', 'deep8', 'base7',   'soft1',   'soft3',    'base8'),
  'miami-vice': theme(  'soft3',  'soft5', 'deep7', 'deep8', 'deep8',   'soft1',   'deep3',    'deep8'),
  terra: theme(         'soft6',  'soft4', 'deep7', 'soft8', 'soft2',   'base5',   'base6',    'base8'),
  candy: theme(         'base3',  'base6', 'base2', 'base8', 'base1',   'deep3',   'deep3',    'base8'),
}

/** `var(--token)` for a cell's color in the dark and light themes, for the guide's runtime variables. `light` is left out when both match. */
export function cellVar(cell: string, field: keyof CellColor = 'background'): { value: string; light?: string } {
  const value = `var(--${cellColors.dark[cell][field]})`
  const light = `var(--${cellColors.light[cell][field]})`
  return { value, light: light === value ? undefined : light }
}
