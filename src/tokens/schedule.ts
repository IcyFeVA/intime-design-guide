import type { TokenStatus } from './types'
import { cellVar, type CellColor } from './cellColors'

/* ------------------------------------------------------------------ */
/* Shift kinds and codes                                               */
/* ------------------------------------------------------------------ */

/** The three fills a shift cell can have. A cell that mixes kinds is split diagonally. */
export type ShiftKind = 'regular' | 'leave' | 'overtime'

export const shiftKinds: { key: ShiftKind; label: string; meaning: string; cssVar: string }[] = [
  { key: 'regular', label: 'Regular', meaning: 'A scheduled shift or assignment: patrol, court, training, office.', cssVar: '--schedule-regular' },
  { key: 'leave', label: 'Leave', meaning: 'Time off: sick, PTO or vacation.', cssVar: '--schedule-leave' },
  { key: 'overtime', label: 'Overtime', meaning: 'Hours beyond the regular schedule. Always paired with the OT tag.', cssVar: '--schedule-overtime' },
]

export interface ShiftCode {
  code: string
  label: string
  kind: ShiftKind
  /** Default start and end hour (0–24) */
  start: number
  end: number
}

/** Short codes shown in cells. Real codes come from each agency's setup. */
export const shiftCodes: ShiftCode[] = [
  { code: 'PatD', label: 'Day patrol', kind: 'regular', start: 7, end: 17 },
  { code: 'PatG', label: 'General patrol', kind: 'regular', start: 8, end: 18 },
  { code: 'PatS', label: 'Swing patrol', kind: 'regular', start: 12, end: 22 },
  { code: 'PatN', label: 'Night patrol', kind: 'regular', start: 19, end: 24 },
  { code: 'ExP', label: 'Extra patrol', kind: 'regular', start: 17, end: 20 },
  { code: 'C-AM', label: 'Court, morning', kind: 'regular', start: 8, end: 12 },
  { code: 'C-PM', label: 'Court, afternoon', kind: 'regular', start: 12, end: 16 },
  { code: 'Court', label: 'Court', kind: 'regular', start: 13, end: 17 },
  { code: 'Train', label: 'Training', kind: 'regular', start: 8, end: 16 },
  { code: 'Spe', label: 'Special detail', kind: 'regular', start: 10, end: 18 },
  { code: 'Office', label: 'Office duty', kind: 'regular', start: 9, end: 17 },
  { code: 'Act Sup', label: 'Acting supervisor', kind: 'regular', start: 12, end: 17 },
  { code: 'Sick', label: 'Sick leave', kind: 'leave', start: 0, end: 24 },
  { code: 'PTO', label: 'Paid time off', kind: 'leave', start: 7, end: 12 },
  { code: 'Vac', label: 'Vacation', kind: 'leave', start: 7, end: 10 },
]

export const shiftCodeMap: Record<string, ShiftCode> = Object.fromEntries(shiftCodes.map((code) => [code.code, code]))

/* ------------------------------------------------------------------ */
/* Date ranges                                                         */
/* ------------------------------------------------------------------ */

export type ScheduleRange = 'week' | '2weeks' | '3weeks' | 'month'

export const scheduleRanges: { key: ScheduleRange; label: string; days: number | 'month'; density: 'comfortable' | 'compact'; columnMin: number; cell: string }[] = [
  { key: 'week', label: 'One Week', days: 7, density: 'comfortable', columnMin: 120, cell: 'Full codes, dividers between assignments, OT and OU tags with labels.' },
  { key: '2weeks', label: 'Two Weeks', days: 14, density: 'compact', columnMin: 56, cell: 'Up to two codes stacked, truncated. OU as an icon only.' },
  { key: '3weeks', label: 'Three Weeks', days: 21, density: 'compact', columnMin: 56, cell: 'As two weeks. The grid scrolls sideways; names stay pinned.' },
  { key: 'month', label: 'One Month', days: 'month', density: 'compact', columnMin: 56, cell: 'As two weeks, for the calendar month.' },
]

/* ------------------------------------------------------------------ */
/* CSS variables                                                       */
/* ------------------------------------------------------------------ */

export interface ScheduleToken {
  name: `--schedule-${string}`
  /** Dark value, or the value for both schemes when `light` is not set */
  value: string
  light?: string
  kind: 'size' | 'color'
  usage: string
  status: TokenStatus
}

const t = (name: ScheduleToken['name'], value: string, kind: ScheduleToken['kind'], usage: string, light?: string): ScheduleToken =>
  ({ name, value, light, kind, usage, status: 'confirmed' })

const mix = (token: string, percent: number) => `color-mix(in srgb, var(${token}) ${percent}%, transparent)`

/** A variable that points at the shift cell color for `cell` (Colors page), in the dark and light themes. */
const fromCell = (name: ScheduleToken['name'], cell: string, field: keyof CellColor, usage: string, status: TokenStatus = 'confirmed'): ScheduleToken =>
  ({ name, ...cellVar(cell, field), kind: 'color', usage, status })

/**
 * Schedule grid variables. Fills and stripes point at the shift cell colors (`cellColors.ts`) per scheme.
 * Everything else aliases theme tokens, so it follows the dark and light schemes. No literal colors.
 */
export const scheduleTokens: ScheduleToken[] = [
  t('--schedule-label-width', '200px', 'size', 'Width of the pinned name column on desktop.'),
  t('--schedule-row-height', '52px', 'size', 'Height of a member row, an overflow row and a coverage row.'),
  t('--schedule-chip-height', '40px', 'size', 'Height of a shift cell. Leaves 6px above and below inside the row.'),
  fromCell('--schedule-regular', 'activity', 'background', 'Fill for regular shifts and assignments.'),
  fromCell('--schedule-leave', 'leave', 'background', 'Fill for sick, PTO and vacation.'),
  fromCell('--schedule-overtime', 'overtime', 'background', 'Fill for overtime.'),
  fromCell('--schedule-hatch', 'activity-out', 'hatch', 'Stripes laid over a cell when the member works out of unit.'),
  fromCell('--schedule-expired-hatch', 'expired', 'hatch', 'Thin stripes over the cells of an inactive employee, from the expiry day on. Also the dashed outline of their initials.'),
  t('--schedule-expired-text', 'var(--text-dimmed)', 'color', 'The “Inactive” label and icon on the first inactive day.'),
  t('--schedule-chip-text', 'var(--text-default)', 'color', 'Codes and tags inside a shift cell.'),
  t('--schedule-chip-divider', mix('--neutral-black', 25), 'color', 'Line between two assignments in one cell.'),
  t('--schedule-boundary', 'var(--text-info)', 'color', 'Vertical line where a new schedule period starts.'),
  t('--schedule-today-bg', mix('--background-info', 16), 'color', 'Background of today’s column header.'),
  t('--schedule-today-text', 'var(--text-info)', 'color', 'Text of today’s column header.'),
  t('--schedule-group-bg', 'var(--background-default)', 'color', 'Team header rows (e.g. “Patrol Alpha”, “Coverage display”).'),
  t('--schedule-overflow-bg', mix('--background-default', 70), 'color', 'Second row for a member who has more than one cell on a day.'),
  t('--schedule-under-bg', mix('--text-error-default', 18), 'color', 'Coverage below target.'),
  t('--schedule-under-text', 'var(--text-error-default)', 'color', 'Coverage value below target, and its outline on the time-of-day bar.'),
  t('--schedule-over-bg', mix('--text-warning-default', 18), 'color', 'Coverage above target.'),
  t('--schedule-over-text', 'var(--text-warning-default)', 'color', 'Coverage value above target, and its outline on the time-of-day bar.'),
  t('--schedule-met-bg', mix('--text-success-default', 16), 'color', 'Coverage on target. Also the empty track of the time-of-day bar.'),
  t('--schedule-met-text', 'var(--text-success-default)', 'color', 'Coverage value on target.'),
  t('--schedule-hour-under', 'var(--text-error-default)', 'color', 'Hour blocks and markers below target in the coverage details.'),
  t('--schedule-hour-met', 'var(--text-dimmed)', 'color', 'Hour blocks and markers on target in the coverage details.'),
  t('--schedule-hour-over', 'var(--text-warning-default)', 'color', 'Hour blocks and markers above target in the coverage details.'),
]

export const scheduleCssVariables: Record<string, string> = Object.fromEntries(
  scheduleTokens.filter((token) => !token.light).map((token) => [token.name, token.value]),
)
export const scheduleDarkVariables: Record<string, string> = Object.fromEntries(
  scheduleTokens.filter((token) => token.light).map((token) => [token.name, token.value]),
)
export const scheduleLightVariables: Record<string, string> = Object.fromEntries(
  scheduleTokens.filter((token) => token.light).map((token) => [token.name, token.light!]),
)
