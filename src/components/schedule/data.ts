import type { ReactNode } from 'react'
import { shiftCodeMap, type ScheduleRange, type ShiftKind } from '../../tokens/schedule'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface Segment {
  code: string
  /** Shown instead of the code, e.g. the person's surname in Location View */
  label?: string
  /** Hours 0–24. Default from the shift code. */
  start?: number
  end?: number
  /** `full`: the whole assignment is overtime. `partial`: part of it is (e.g. a holdover). */
  overtime?: 'full' | 'partial'
  cancelled?: boolean
}

/** One cell: one or more assignments a member holds on a day. */
export interface Chip {
  segments: Segment[]
  /** Working for another unit */
  outOfUnit?: boolean
  /** Part of the day is this kind without its own code (e.g. leave), shown as a diagonal split */
  partialKind?: ShiftKind
}

export interface ScheduleMember {
  id: string
  name: string
  initials: string
  rank: string
  /** Cells per day number. A second cell on the same day goes to an overflow row. */
  chips: (day: number) => Chip[]
  /** First day the employee is no longer active (contract ended, left the agency). Cells from this day on show as expired. */
  expiresOn?: number
}

/* ------------------------------------------------------------------ */
/* Grid rows. Team View rows are members, Location View rows are posts. */
/* ------------------------------------------------------------------ */

export interface ScheduleRow {
  id: string
  /** Plain name for the mobile row label, tooltips and screen readers */
  name: string
  /** Desktop row header. Defaults to `name`. */
  label?: ReactNode
  /** Cells per day, one per line. `null` is an empty line (e.g. an unfilled position). */
  chips: (day: number) => (Chip | null)[]
  /** Minimum number of lines, e.g. positions on a post. Default 1. */
  lines?: number
  /** `overflow`: extra lines are a lighter overflow row (Team View). `position`: every line is a position (Location View). */
  extraLines?: 'overflow' | 'position'
  /** First day the row's person is no longer active. Cells from this day on show as expired, without shifts. */
  expiresOn?: number
}

export const isExpired = (row: Pick<ScheduleRow, 'expiresOn'>, day: number) => row.expiresOn !== undefined && day >= row.expiresOn
/** The day that carries the "Expired" label: the expiry day, or the first visible day when the range starts later. */
export const expiredLabelDay = (row: Pick<ScheduleRow, 'expiresOn'>, days: number[]) => days.find((day) => isExpired(row, day))

export interface ScheduleSection {
  id: string
  /** Header content: a team name or a location path */
  title: ReactNode
  /** Plain title for screen readers */
  name: string
  rows: ScheduleRow[]
  coverage?: (day: number) => DayCoverage
}

export const rowLines = (row: ScheduleRow, chipsByDay: (Chip | null)[][]) =>
  Math.max(row.lines ?? 1, ...chipsByDay.map((chips) => chips.length))

export type CoverageLevel = 'under' | 'over' | 'met'

export interface DayCoverage {
  bodies: { have: number; need: number }
  hours: { value: number; direction?: 'down' | 'up' }
  /** Stretches of the day (hours 0–24) below or above target */
  timeOfDay: { from: number; to: number; level: 'under' | 'over' }[]
}

export interface ScheduleGroup {
  id: string
  title: string
  members: ScheduleMember[]
  coverage: (day: number) => DayCoverage
}

/* ------------------------------------------------------------------ */
/* Dates. A "day" is the number of days since 1970-01-01 (UTC).        */
/* ------------------------------------------------------------------ */

export const dayOf = (year: number, month: number, date: number) => Date.UTC(year, month - 1, date) / 86_400_000
const toDate = (day: number) => new Date(day * 86_400_000)
const fmt = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'UTC' })
const weekdayShort = fmt({ weekday: 'short' })
const monthDay = fmt({ month: 'short', day: 'numeric' })
const fullDate = fmt({ weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

/** Monday = 0 … Sunday = 6 */
export const weekdayIndex = (day: number) => (toDate(day).getUTCDay() + 6) % 7
export const dayNumber = (day: number) => toDate(day).getUTCDate()
export const formatWeekday = (day: number) => weekdayShort.format(toDate(day))
export const formatMonthDay = (day: number) => monthDay.format(toDate(day))
export const formatFullDate = (day: number) => fullDate.format(toDate(day))
export const formatHeader = (day: number) => `${formatWeekday(day)}, ${formatMonthDay(day)}`
/** 24.5 → "00:30": shifts past midnight wrap around */
export const formatHour = (hour: number) => `${String(Math.floor(hour) % 24).padStart(2, '0')}:${hour % 1 ? '30' : '00'}`

/** "Today" in the demos, so the mock data and the Figma frames line up. */
export const MOCK_TODAY = dayOf(2026, 6, 5)
/** A new schedule period starts every 7 days from this date (vertical line in the grid). */
const PERIOD_ANCHOR = dayOf(2026, 6, 2)
export const isPeriodStart = (day: number) => (((day - PERIOD_ANCHOR) % 7) + 7) % 7 === 0

export const startOfWeek = (day: number) => day - weekdayIndex(day)
const startOfMonth = (day: number) => { const d = toDate(day); return dayOf(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) }
const daysInMonth = (day: number) => { const d = toDate(day); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate() }

/** Visible days for a range that contains `anchor`. */
export function rangeDays(range: ScheduleRange, anchor: number): number[] {
  const start = range === 'month' ? startOfMonth(anchor) : startOfWeek(anchor)
  const count = range === 'month' ? daysInMonth(anchor) : { week: 7, '2weeks': 14, '3weeks': 21 }[range]
  return Array.from({ length: count }, (_, index) => start + index)
}

/** Move the anchor one range forward or back. */
export function shiftRange(range: ScheduleRange, anchor: number, direction: 1 | -1): number {
  if (range !== 'month') return anchor + direction * { week: 7, '2weeks': 14, '3weeks': 21 }[range]
  const d = toDate(anchor)
  return dayOf(d.getUTCFullYear(), d.getUTCMonth() + 1 + direction, 1)
}

export function formatRange(days: number[]): string {
  const first = toDate(days[0])
  const last = toDate(days[days.length - 1])
  return `${formatMonthDay(days[0])} – ${formatMonthDay(days[days.length - 1])}, ${(first.getUTCFullYear() === last.getUTCFullYear() ? last : first).getUTCFullYear()}`
}

/* ------------------------------------------------------------------ */
/* Chip helpers                                                        */
/* ------------------------------------------------------------------ */

export const segmentKind = (segment: Segment): ShiftKind =>
  segment.overtime === 'full' ? 'overtime' : shiftCodeMap[segment.code]?.kind ?? 'regular'
export const segmentHours = (segment: Segment) => {
  const code = shiftCodeMap[segment.code]
  return { start: segment.start ?? code?.start ?? 7, end: segment.end ?? code?.end ?? 17 }
}

/** The two fills of a cell: the same twice for a solid cell, two kinds for a diagonal split. */
export function chipFills(chip: Chip): [ShiftKind, ShiftKind] {
  const kinds: ShiftKind[] = []
  for (const segment of chip.segments) {
    kinds.push(segmentKind(segment))
    if (segment.overtime === 'partial') kinds.push('overtime')
  }
  if (chip.partialKind) kinds.push(chip.partialKind)
  const unique = [...new Set(kinds)]
  return [unique[0], unique[unique.length - 1]]
}

export const chipHasOvertime = (chip: Chip) => chip.segments.some((segment) => segment.overtime)

export function describeChip(chip: Chip): string {
  const parts = chip.segments.map((segment) => {
    const code = shiftCodeMap[segment.code]
    const { start, end } = segmentHours(segment)
    const extras = [segment.overtime === 'full' && 'overtime', segment.overtime === 'partial' && 'partly overtime', segment.cancelled && 'cancelled'].filter(Boolean)
    return `${segment.label ? `${segment.label}, ` : ''}${code?.label ?? segment.code} ${formatHour(start)}–${formatHour(end)}${extras.length ? ` (${extras.join(', ')})` : ''}`
  })
  return `${parts.join(', ')}${chip.partialKind ? `. Partly ${chip.partialKind}` : ''}${chip.outOfUnit ? '. Out of unit' : ''}`
}

/* ------------------------------------------------------------------ */
/* Mock data                                                           */
/* ------------------------------------------------------------------ */

/** Deterministic pseudo-random number in [0, 1) */
function rand(seed: number) {
  let x = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b)
  x ^= x >>> 13
  x = Math.imul(x, 0xc2b2ae35)
  x ^= x >>> 16
  return (x >>> 0) / 4_294_967_296
}

const c = (code: string, extra: Partial<Segment> = {}): Segment => ({ code, ...extra })
const chip = (segments: Segment[], outOfUnit?: boolean): Chip => ({ segments, outOfUnit })

/** Rotating schedule with occasional sick days, leave, overtime and out-of-unit work. */
function generated(memberIndex: number, base: string, offset: number) {
  return (day: number): Chip[] => {
    const r = rand(memberIndex * 10_007 + day)
    const r2 = rand(memberIndex * 7_919 + day * 31)
    const working = (day + offset) % 7 < 5
    if (!working) return r < 0.07 ? [chip([c(base, { overtime: 'full' })])] : []
    let cell: Chip
    if (r < 0.07) cell = chip([c('Sick')])
    else if (r < 0.1) cell = chip([c('PTO')])
    else if (r < 0.17) cell = chip([c('Train')], r2 < 0.3)
    else if (r < 0.21) cell = chip([c(base, { overtime: 'partial' })])
    else if (r < 0.25) cell = chip([c(base)], true)
    else if (r < 0.27) cell = chip([c(base, { cancelled: true })])
    else if (r < 0.31) cell = chip([c(base), c('PTO')])
    else if (r < 0.34) cell = chip([c(base, { end: 12 }), c(base === 'C-AM' ? 'Court' : 'C-AM', { start: 12, end: 16 })])
    else cell = chip([c(base)])
    return r2 > 0.97 ? [cell, chip([c('Court', { overtime: 'full', start: 17, end: 21 })])] : [cell]
  }
}

/** Hand-made week of Jun 1–7, 2026 (matches the Figma frame); generated before and after. */
function curated(memberIndex: number, base: string, offset: number, week: (Chip[] | null)[]) {
  const fallback = generated(memberIndex, base, offset)
  const first = dayOf(2026, 6, 1)
  return (day: number) => {
    const index = day - first
    return index >= 0 && index < 7 ? week[index] ?? [] : fallback(day)
  }
}

const one = (...segments: Segment[]) => [chip(segments)]
const ou = (...segments: Segment[]) => [chip(segments, true)]

const member = (id: string, name: string, initials: string, rank: string, chips: ScheduleMember['chips'], expiresOn?: number): ScheduleMember =>
  ({ id, name, initials, rank, expiresOn, chips: expiresOn === undefined ? chips : (day) => (day >= expiresOn ? [] : chips(day)) })

const alpha: ScheduleMember[] = [
  member('rr', 'Richards', 'RR', 'Lieutenant', curated(1, 'PatD', 2, [null, one(c('PatG')), one(c('PatD')), one(c('PatD')), one(c('PatD')), one(c('PatD', { overtime: 'partial', end: 19 })), one(c('PatD'))])),
  member('gt', 'Torres', 'GT', 'Sergeant', curated(2, 'PatD', 0, [one(c('PatD'), c('ExP')), null, one(c('Sick')), one(c('Sick')), one(c('Train')), one(c('Train')), one(c('Spe'))])),
  member('em', 'Marino', 'EM', 'Sergeant', curated(3, 'PatD', 1, [null, ou(c('PatD', { end: 12 }), c('Train', { start: 12 })), null, ou(c('Vac'), c('PatD', { start: 10, end: 12 }), c('Act Sup', { overtime: 'partial', end: 19 })), one(c('PatD', { end: 13 }), c('PTO', { start: 13, end: 17 })), one(c('PatD')), null])),
  member('sp', 'Petrov', 'SP', 'Officer', curated(4, 'PatD', 4, [null, null, null, one(c('PatD', { cancelled: true })), one(c('PatD', { cancelled: true })), one(c('PatD')), null])),
  member('fd', 'Dijkstra', 'FD', 'Officer', curated(5, 'PatD', 3, [one(c('PatD')), one(c('PatD', { end: 12 }), c('C-AM', { start: 12, end: 16 })), [chip([c('Train')]), chip([c('PTO', { start: 16, end: 18 }), c('Court', { start: 18, end: 21, overtime: 'partial' })])], null, null, null, one(c('PatD', { overtime: 'full' }))])),
  member('eh', 'Haddad', 'EH', 'Officer', curated(6, 'C-AM', 0, [one(c('C-AM')), ou(c('C-AM')), one(c('C-AM')), ou(c('PatD', { cancelled: true }), c('PTO', { start: 12, end: 17 })), null, null, null])),
  member('pz', 'Haddad', 'PZ', 'Officer', curated(7, 'C-AM', 0, [one(c('C-AM')), one(c('C-AM')), one(c('C-AM')), ou(c('C-AM', { overtime: 'partial', end: 15 })), null, null, null])),
  member('ct', 'Tanaka', 'CT', 'Detective', curated(8, 'PatD', 5, [one(c('PatD')), one(c('Sick')), null, one(c('Train')), ou(c('Train')), null, one(c('PatD'))]), dayOf(2026, 6, 3)),
]

const bravo: ScheduleMember[] = [
  member('db', 'Bakker', 'DB', 'Sergeant', generated(11, 'PatD', 1)),
  member('ai', 'Ibrahim', 'AI', 'Officer', generated(12, 'PatD', 3)),
  member('lb', 'Bennett', 'LB', 'Officer', generated(13, 'PatG', 5)),
  member('mc', 'Caldwell', 'MC', 'Officer', generated(14, 'C-AM', 2)),
  member('rh', 'Hoffman', 'RH', 'Detective', generated(15, 'PatD', 6)),
  member('am', 'Mahmoud', 'AM', 'Officer', generated(16, 'PatG', 4)),
]

const blue: ScheduleMember[] = [
  member('nl', 'Nielsen', 'KN', 'Sergeant', generated(21, 'PatN', 0)),
  member('sz', 'Suzuki', 'HS', 'Officer', generated(22, 'PatN', 2)),
  member('vb', 'Vandenberg', 'TV', 'Officer', generated(23, 'PatN', 4)),
  member('os', 'Osei', 'KO', 'Officer', generated(24, 'PatN', 6)),
  member('fr', 'Farrell', 'BF', 'Detective', generated(25, 'PatN', 1)),
]

const orange: ScheduleMember[] = [
  member('ms', 'Mensah', 'AM', 'Sergeant', generated(31, 'PatN', 3)),
  member('rz', 'Ramirez', 'LR', 'Officer', generated(32, 'PatN', 5)),
  member('vg', 'Vogel', 'JV', 'Officer', generated(33, 'PatN', 0)),
  member('kh', 'Khan', 'SK', 'Officer', generated(34, 'PatN', 2)),
  member('vs', 'Visser', 'MV', 'Officer', generated(35, 'PatN', 4)),
]

const bodiesCycle = [[8, 10], [7, 9], [6, 5], [6, 6], [4, 4], [4, 6], [8, 8], [12, 16], [6, 5], [6, 6], [4, 4]]
const hoursCycle: DayCoverage['hours'][] = [
  { value: 2.5, direction: 'down' }, { value: 10 }, { value: 8.5 }, { value: 4.5, direction: 'up' }, { value: 3, direction: 'down' },
  { value: 6 }, { value: 8.5 }, { value: 12.5, direction: 'down' }, { value: 10 }, { value: 4.5, direction: 'up' },
]
const todCycle: DayCoverage['timeOfDay'][] = [
  [{ from: 0, to: 7, level: 'under' }, { from: 7, to: 10, level: 'over' }, { from: 10, to: 13, level: 'under' }],
  [], [],
  [{ from: 7, to: 14, level: 'over' }],
  [{ from: 13, to: 18, level: 'under' }],
  [], [],
  [{ from: 0, to: 9, level: 'under' }],
  [{ from: 3, to: 6, level: 'under' }, { from: 6, to: 9, level: 'over' }, { from: 9, to: 12, level: 'under' }],
]

/** Mock coverage that cycles through the values in the Figma frames. */
export function coverage(seed: number) {
  return (day: number): DayCoverage => {
    const [have, need] = bodiesCycle[(day + seed) % bodiesCycle.length]
    return { bodies: { have, need }, hours: hoursCycle[(day + seed) % hoursCycle.length], timeOfDay: todCycle[(day + seed) % todCycle.length] }
  }
}

/** Day 0 of the cycles lines up with Jun 1, 2026 for Patrol Alpha. */
const cycleStart = (length: number) => (length - (dayOf(2026, 6, 1) % length)) % length

export const scheduleUnits: { key: string; label: string; groups: ScheduleGroup[] }[] = [
  {
    key: 'day-patrol',
    label: 'Day Patrol',
    groups: [
      { id: 'patrol-alpha', title: 'Patrol Alpha', members: alpha, coverage: coverage(cycleStart(bodiesCycle.length * hoursCycle.length * todCycle.length)) },
      { id: 'patrol-bravo', title: 'Patrol Bravo', members: bravo, coverage: coverage(3) },
    ],
  },
  {
    key: 'night-patrol',
    label: 'Night Patrol',
    groups: [
      { id: 'team-blue', title: 'Team Blue', members: blue, coverage: coverage(5) },
      { id: 'team-orange', title: 'Team Orange', members: orange, coverage: coverage(8) },
    ],
  },
]

/** A stretch of the day in the coverage details: staff required against staff scheduled. */
export interface CoverageWindow {
  from: number
  to: number
  level: CoverageLevel
  required: number
  actual: number
}

/** Splits the day at the time-of-day segments. Gaps between them are on target. Mock numbers scale with the day's need. */
export function coverageWindows(day: DayCoverage): CoverageWindow[] {
  const base = Math.max(1, Math.round(day.bodies.need / 4))
  const stretches: { from: number; to: number; level: CoverageLevel }[] = []
  let hour = 0
  for (const segment of [...day.timeOfDay].sort((a, b) => a.from - b.from)) {
    if (segment.from > hour) stretches.push({ from: hour, to: segment.from, level: 'met' })
    stretches.push(segment)
    hour = segment.to
  }
  if (hour < 24) stretches.push({ from: hour, to: 24, level: 'met' })
  return stretches.map((stretch, index) => {
    const required = base + (index % 2)
    const actual = stretch.level === 'under' ? Math.max(0, required - 1 - (index % 2)) : stretch.level === 'over' ? required + 1 : required
    return { ...stretch, required, actual }
  })
}

/** Level of each hour, 0–23. */
export const hourLevels = (windows: CoverageWindow[]): CoverageLevel[] =>
  Array.from({ length: 24 }, (_, hour) => windows.find((window) => hour >= window.from && hour < window.to)?.level ?? 'met')

export const coverageLevel = (have: number, need: number): CoverageLevel => (have < need ? 'under' : have > need ? 'over' : 'met')
export const hoursLevel = (hours: DayCoverage['hours']): CoverageLevel => (hours.direction === 'down' ? 'under' : hours.direction === 'up' ? 'over' : 'met')

const rankOrder = ['Lieutenant', 'Sergeant', 'Detective', 'Officer']
export type ScheduleSort = 'team' | 'name' | 'rank'
/** `team` keeps the order the team was set up in. */
export const sortMembers = (members: ScheduleMember[], sort: ScheduleSort) => sort === 'team' ? members : [...members].sort((a, b) =>
  sort === 'rank' ? rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank) || a.name.localeCompare(b.name) : a.name.localeCompare(b.name) || a.initials.localeCompare(b.initials))
