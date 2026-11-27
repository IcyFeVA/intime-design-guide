import { CircleDashed, Radio } from 'lucide-react'
import { shiftCodeMap } from '../../tokens/schedule'
import {
  PARTIAL_OVERTIME_HOURS, coverageLevel, formatHour, dayOf, formatHeader, rand, segmentHours, segmentKind, weekdayIndex, type Chip, type DayCoverage, type Segment,
} from '../schedule/data'
import type { EmployeeProfile } from '../schedule/profiles'
import { courtDate, haddadFriday, type Attachments, type WorkforceChip } from './attachments'

/* ------------------------------------------------------------------ */
/* Workforce Scheduling mock data: one patrol unit in three watches.   */
/* ------------------------------------------------------------------ */

export type WatchId = 'day' | 'swing' | 'night'
export type WorkforceRank = 'PO' | 'Cpl' | 'Sgt' | 'Lt'

export const rankLabels: Record<WorkforceRank, string> = { PO: 'Police officer', Cpl: 'Corporal', Sgt: 'Sergeant', Lt: 'Lieutenant' }
const rankOrder: WorkforceRank[] = ['Lt', 'Sgt', 'Cpl', 'PO']

export interface WorkforceMember {
  id: string
  first: string
  last: string
  initials: string
  rank: WorkforceRank
  /** Day the current rank took effect (day number, as `dayOf`) */
  rankEffective: number
  /** Precedence number: a lower number comes first. People can share one. */
  precedence: number
  /** Sergeants and lieutenants count towards the watch's supervisors */
  supervisor: boolean
  /** Activities this person isn't certified for (mock: everyone else is certified for everything) */
  lacks?: string[]
  watch: WatchId
  /** Cells per day. A second cell on the same day goes to an extra row. */
  chips: (day: number) => Chip[]
}

export interface WatchCoverage extends DayCoverage {
  supervisors: { have: number; need: number }
}

export interface Watch {
  id: WatchId
  /** "Day" */
  title: string
  /** "Day Patrol" */
  unit: string
  code: 'PatD' | 'PatS' | 'PatN'
  start: number
  end: number
  members: WorkforceMember[]
  coverage: (day: number) => WatchCoverage
}

/** A shift nobody holds yet. `live`: posted to employees, who can sign up. */
export interface OpenShift {
  id: string
  day: number
  watch: WatchId
  code: string
  start: number
  end: number
  status: 'open' | 'live'
  needed: number
  /** People already given the shift (assign mode). It leaves the schedule when nobody is needed any more. */
  filled?: number
  location: string
  /** Fields set in the details panel (activity, customer…); defaults apply when missing */
  details?: SegmentDetails
  /** Tags, assets, tasks and a note on the shift */
  attachments?: Attachments
  /** Set in the panel when the shift is worked at another branch; missing = `HOME_BRANCH` */
  branch?: string
}

/* ------------------------------------------------------------------ */
/* Edits made in the details panel                                     */
/* ------------------------------------------------------------------ */

export type TimeBank = 'Overtime' | 'Comp Time' | 'Holiday'

/** A segment's fields in the details panel. Every segment of a block can have its own. */
export interface SegmentDetails {
  activity: string
  location: string | null
  modifier: string
  /** "Bank this time": hours put into a time bank instead of paid */
  bank: { bank: TimeBank; amount: number } | null
  customer: string
  unit: string
  acting: string
  /**
   * Actual start and end (hours, end past 24 = next day), when they differ from the schedule. `day` is the actual
   * date when it was changed (day number); missing means the scheduled day.
   */
  actual: { start: number; end: number; day?: number } | null
}

/** A segment as the panel edits it: a stable id and its fields. Unedited mock segments have neither. */
export type WorkforceSegment = Segment & { id?: string; details?: SegmentDetails }

/** Changes to an open shift. `deleted` takes it off the schedule. */
export type OpenShiftEdit = Partial<Pick<OpenShift, 'code' | 'start' | 'end' | 'details' | 'filled' | 'attachments' | 'branch'>> & { deleted?: boolean }

/** Everything changed in the demo. A person's day is replaced as a whole (`memberId@day` → its cells). */
export interface ScheduleEdits {
  days: ReadonlyMap<string, Chip[]>
  open: ReadonlyMap<string, OpenShiftEdit>
}

export const noEdits: ScheduleEdits = { days: new Map(), open: new Map() }
export const dayKey = (memberId: string, day: number) => `${memberId}@${day}`

/** The cell's last segment that ends after midnight (end past 24), if any: the shift runs into the next day */
export const overnightSegment = (chip: Chip) => chip.segments.findLast((segment) => segmentHours(segment).end > 24)

/** "B. Haddad" */
export const shortName = (member: Pick<WorkforceMember, 'first' | 'last'>) => `${member.first[0]}. ${member.last}`

/* ------------------------------------------------------------------ */
/* Schedules                                                           */
/* ------------------------------------------------------------------ */

const c = (code: string, extra: Partial<Segment> = {}): Segment => ({ code, ...extra })
/**
 * A shift that runs into overtime: the regular segment, then a touching overtime segment for its last
 * PARTIAL_OVERTIME_HOURS. Two segments, so the cell is split diagonally; one overtime segment alone is solid red.
 */
const holdover = (code: string, extra: Partial<Segment> = {}): Segment[] => {
  const { start, end } = segmentHours({ code, ...extra })
  const split = end - PARTIAL_OVERTIME_HOURS
  return [c(code, { ...extra, start, end: split }), c(code, { ...extra, start: split, end, overtime: 'full' })]
}
const cell = (segments: Segment[], extra: Partial<Omit<Chip, 'segments'>> = {}): Chip => ({ segments, ...extra })
/** Working for another unit in the same precinct */
const ou = (segments: Segment[], unit: string): Chip => cell(segments, { outOfUnit: true, unit })
/** A court date: the court sets it, so the scheduler can't change it */
const court = (start: number, end: number, file: string, note: string): WorkforceChip => ({ ...cell([c('Court', { start, end })], { locked: COURT }), attachments: courtDate(file, note) })
const COURT = 'Kings County Court'

/** The precinct the demo's unit belongs to, and another one people are sometimes lent to */
export const HOME_BRANCH = '99th Precinct - Brooklyn'
export const OTHER_BRANCH = '84th Precinct - Brooklyn'
/** Units in the same precinct that borrow people (out of unit) */
const lendingUnits = ['Special Ops', 'K9 Unit']

/** Per watch: the block code, a court or detail that shares the main cell, and an extra assignment outside the block. */
const watchCodes: Record<WatchId, { base: string; split: Segment[]; extra: Segment }> = {
  day: { base: 'PatD', split: [c('C-AM'), c('PatD', { start: 12 })], extra: c('ExP', { overtime: 'full' }) },
  swing: { base: 'PatS', split: [c('C-PM'), c('PatS', { start: 16 })], extra: c('Spe', { overtime: 'full', start: 7, end: 11 }) },
  night: { base: 'PatN', split: [c('ExP'), c('PatN', { start: 20 })], extra: c('Court', { overtime: 'full' }) },
}

/** Five days on, two off, with sick days, leave, training, overtime, out-of-unit work and the odd extra assignment. */
function rotation(seed: number, watch: WatchId, offset: number) {
  const { base, split, extra } = watchCodes[watch]
  return (day: number): Chip[] => {
    const r = rand(seed * 10_007 + day)
    const r2 = rand(seed * 7_919 + day * 31)
    if ((day + offset) % 7 >= 5) return r < 0.06 ? [cell([c(base, { overtime: 'full' })])] : []
    let main: Chip
    if (r < 0.05) main = cell([c('Sick')])
    else if (r < 0.08) main = cell([c('PTO')])
    else if (r < 0.1) main = cell([c('Vac')])
    else if (r < 0.15) main = r2 < 0.3 ? ou([c('Train')], 'Training') : cell([c('Train')])
    else if (r < 0.19) main = cell(holdover(base))
    else if (r < 0.22) main = ou([c(base)], lendingUnits[Math.floor(r2 * lendingUnits.length)])
    else if (r < 0.27) main = cell(split)
    else if (r < 0.29) main = cell([c('Spe')])
    else main = cell([c(base)])
    // The odd extra assignment, on a working day only and never at the same time as the main one
    const clash = main.segments.some((segment) => segmentKind(segment) === 'leave'
      || (segmentHours(segment).start < segmentHours(extra).end && segmentHours(extra).start < segmentHours(segment).end))
    return r2 > 0.965 && !clash ? [main, cell([extra])] : [main]
  }
}

/** Hand-made days in the week of Jun 1–7, 2026, so the demo opens on familiar cases. Index 0 = Monday. */
function curated(seed: number, watch: WatchId, offset: number, week: Record<number, Chip[]>) {
  const fallback = rotation(seed, watch, offset)
  const first = dayOf(2026, 6, 1)
  return (day: number) => {
    const index = day - first
    return index >= 0 && index < 7 && index in week ? week[index] : fallback(day)
  }
}

/** A special event segment with its fields set, as if typed in the panel */
const barclaysEvent: WorkforceSegment = {
  code: 'Spe',
  start: 6,
  end: 10,
  details: { activity: 'Special event', location: 'Barclays Center', modifier: 'None', bank: null, customer: 'Barclays Center', unit: 'Swing Patrol', acting: 'None', actual: null },
}

type Spec = [id: string, first: string, last: string, rank: WorkforceRank, offset: number, week?: Record<number, Chip[]>, lacks?: string[]]

const specs: Record<WatchId, Spec[]> = {
  day: [
    // Scenario 3, leave: on vacation all day Tue. Locked court dates (set by the court): Nguyen Wed, Kowalski Tue, Garcia Fri
    ['nguyen', 'Thomas', 'Nguyen', 'PO', 0, { 1: [cell([c('Vac', { start: 0, end: 24 })])], 2: [court(8, 12, '#PKXD393', 'Testifying in People v. Marsh, Part 14. Bring the arrest report.')] }],
    ['kowalski', 'Sofia', 'Kowalski', 'PO', 1, { 1: [court(13, 17, '#PKXD402', 'Grand jury, room 512. Wear the dress uniform.')] }],
    ['okafor', 'Raymond', 'Okafor', 'Cpl', 2],
    ['alvarez', 'Marco', 'Alvarez', 'Sgt', 3, { 0: [cell([c('C-AM'), c('PatD', { start: 12 })])] }],
    // Scenario 7, out of unit: lent to Special Ops on Tue
    ['garcia', 'Lucia', 'Garcia', 'PO', 4, { 1: [ou([c('PatD')], 'Special Ops')], 4: [court(13, 17, '#QRTB118', 'Suppression hearing, Part 3. The ADA will call by 12:00.')] }],
    ['brennan', 'Kevin', 'Brennan', 'Sgt', 5, { 3: [cell([c('C-AM'), c('PatD', { start: 12 }), c('ExP', { overtime: 'full' })])] }],
    // Scenario 6, two assignments on Wed: PatD + Spe OT that touch (one cell), then Spe after a gap (a second line)
    // Also a warning: not certified for special details
    ['anderson', 'Jamal', 'Anderson', 'PO', 6, {
      2: [cell([c('PatD', { start: 8, end: 16 }), c('Spe', { start: 16, end: 17, overtime: 'full' })]), cell([c('Spe', { start: 18, end: 19 })])],
      3: [cell([c('Train')])],
    }, ['Special detail']],
    // Scenario 5, partial leave: sick for the last 3 hours of Wed's shift
    ['rodriguez', 'Elena', 'Rodriguez', 'PO', 0, { 2: [cell([c('PatD', { start: 8, end: 16 }), c('Sick', { start: 13, end: 16 })])] }],
    // Scenario 8, out of branch: working at the 84th Precinct on Thu (muted, but the scheduler can change it)
    ['patel', 'Dev', 'Patel', 'PO', 1, { 3: [cell([c('PatD')], { branch: OTHER_BRANCH })] }],
    // Warning, on leave: scheduled on Fri, but on vacation for all of it
    ['lee', 'Christine', 'Lee', 'PO', 2, { 4: [cell([c('PatD'), c('Vac', { start: 7, end: 17 })])] }],
    ['haddad', 'Bilal', 'Haddad', 'PO', 3, { 0: [cell([c('PatD')])], 1: [cell([c('PatD')])], 2: [cell([c('PatD')])], 3: [cell([c('PatD')])], 4: [{ ...cell([c('PatD')]), attachments: haddadFriday } as WorkforceChip], 5: [], 6: [] }],
    // Warning, double booked: the 84th Precinct has him on a detail during Wed's patrol
    ['johnson', 'Aaron', 'Johnson', 'PO', 4, { 2: [cell([c('PatD')]), cell([c('Spe', { start: 15, end: 19 })], { branch: OTHER_BRANCH })] }],
  ],
  swing: [
    ['russo', 'Vincent', 'Russo', 'PO', 5],
    ['thompson', 'Sarah', 'Thompson', 'Cpl', 6],
    ['fitzgerald', 'Patrick', 'Fitzgerald', 'Sgt', 0, { 1: [cell([c('Train', { start: 8, end: 11 }), c('C-PM'), ...holdover('PatS', { start: 16 })])] }],
    // Two warnings on Tue: a 06:00 event at Barclays Center 7h after Monday's late swing, and not certified for special events
    ['petrov', 'Oksana', 'Petrov', 'PO', 1, {
      0: [cell(holdover('PatS', { end: 23 }))],
      1: [cell([barclaysEvent]), cell([c('PatS')])],
    }, ['Special event']],
    ['abara', 'Nnamdi', 'Abara', 'PO', 2],
    ['williams', 'Monique', 'Williams', 'Sgt', 3],
    ['davis', 'Keith', 'Davis', 'PO', 4],
    ['mensah', 'Isaac', 'Mensah', 'PO', 5],
    ['yamamoto', 'Hana', 'Yamamoto', 'PO', 6],
    ['silva', 'Gabriel', 'Silva', 'PO', 0],
  ],
  night: [
    // Warning, minimum rest: training at 06:00 after Monday's night shift
    ['cohen', 'Yael', 'Cohen', 'PO', 1, { 0: [cell([c('PatN')])], 1: [cell([c('Train', { start: 6, end: 10 })]), cell([c('PatN')])] }],
    // Overnight overlap (proposal): shifts that end the next morning. Murphy two nights in a row, Rossi on Thu.
    ['murphy', 'Declan', 'Murphy', 'Sgt', 2, { 1: [cell([c('PatN', { start: 22, end: 32 })])], 2: [cell([c('PatN', { start: 22, end: 32 })])] }],
    ['rossi', 'Angela', 'Rossi', 'PO', 3, { 3: [cell([c('PatN', { start: 23, end: 31 })])] }],
    ['kim', 'Joon', 'Kim', 'PO', 4],
    ['santos', 'Luis', 'Santos', 'Cpl', 5],
    ['walsh', 'Fiona', 'Walsh', 'PO', 6],
    ['ivanova', 'Nadia', 'Ivanova', 'PO', 0],
    ['brooks', 'Ethan', 'Brooks', 'PO', 1],
    ['quinn', 'Peter', 'Quinn', 'Lt', 2],
    ['dubois', 'Theo', 'Dubois', 'PO', 3],
  ],
}

const watchSeeds: Record<WatchId, number> = { day: 100, swing: 200, night: 300 }

const buildMembers = (watch: WatchId): WorkforceMember[] => specs[watch].map(([id, first, last, rank, offset, week, lacks], index) => ({
  id,
  first,
  last,
  initials: `${first[0]}${last[0]}`,
  rank,
  rankEffective: dayOf(2025 - ((watchSeeds[watch] / 100 + index * 3) % 9), ((index * 5 + offset) % 12) + 1, ((index * 11) % 27) + 1),
  precedence: 1 + ((watchSeeds[watch] / 100 + index * 7) % 5),
  supervisor: rank === 'Sgt' || rank === 'Lt',
  lacks,
  watch,
  chips: week ? curated(watchSeeds[watch] + index, watch, offset, week) : rotation(watchSeeds[watch] + index, watch, offset),
}))

/* ------------------------------------------------------------------ */
/* Coverage: counted from the schedule, so the badges match the grid.  */
/* ------------------------------------------------------------------ */

/** Staff needed per watch, Monday to Sunday */
const needs: Record<WatchId, number[]> = {
  day: [8, 8, 8, 8, 8, 6, 6],
  swing: [6, 6, 6, 6, 7, 7, 6],
  night: [6, 6, 6, 6, 6, 6, 6],
}

export type Span = { start: number; end: number }
const isLeave = (segment: Segment) => segmentKind(segment) === 'leave'
/** `span` without the hours of `off` */
export const subtract = (span: Span, off: Span): Span[] => (off.end <= span.start || off.start >= span.end
  ? [span]
  : [{ start: span.start, end: off.start }, { start: off.end, end: span.end }].filter((part) => part.end > part.start))

/**
 * When someone is on the street for the watch: working segments (not cancelled, not lent to another unit or
 * precinct), minus a partial leave in the same cell.
 */
const workingSpans = (chips: Chip[]): Span[] => chips.flatMap((chip) => {
  if (chip.outOfUnit || chip.branch) return []
  const leave = chip.segments.filter(isLeave).map(segmentHours)
  return chip.segments
    .filter((segment) => !segment.cancelled && !isLeave(segment))
    .flatMap((segment) => leave.reduce<Span[]>((spans, off) => spans.flatMap((span) => subtract(span, off)), [segmentHours(segment)]))
})

function watchCoverage(members: WorkforceMember[], id: WatchId, start: number, end: number) {
  const cache = new Map<number, WatchCoverage>()
  return (day: number): WatchCoverage => {
    const cached = cache.get(day)
    if (cached) return cached
    const need = needs[id][weekdayIndex(day)]
    const perHour = Array.from({ length: 24 }, () => 0)
    let bodies = 0
    let supervisors = 0
    let hours = 0
    for (const member of members) {
      const spans = workingSpans(member.chips(day))
      if (!spans.length) continue
      bodies += 1
      if (member.supervisor) supervisors += 1
      const covered = new Set<number>()
      for (const { start: from, end: to } of spans) {
        hours += Math.min(to, 24) - from
        for (let hour = Math.floor(from); hour < Math.min(Math.ceil(to), 24); hour += 1) covered.add(hour)
      }
      covered.forEach((hour) => { perHour[hour] += 1 })
    }
    const target = need * (end - start)
    const gap = hours - target
    const timeOfDay: DayCoverage['timeOfDay'] = []
    for (let hour = start; hour < end; hour += 1) {
      const level = coverageLevel(perHour[hour], need)
      if (level === 'met') continue
      const last = timeOfDay[timeOfDay.length - 1]
      if (last && last.to === hour && last.level === level) last.to = hour + 1
      else timeOfDay.push({ from: hour, to: hour + 1, level })
    }
    const result: WatchCoverage = {
      bodies: { have: bodies, need },
      supervisors: { have: supervisors, need: 1 },
      hours: Math.abs(gap) < 1 ? { value: hours } : { value: Math.abs(gap), direction: gap < 0 ? 'down' : 'up' },
      timeOfDay,
    }
    cache.set(day, result)
    return result
  }
}

function watch(id: WatchId, title: string, code: Watch['code'], start: number, end: number): Watch {
  const members = buildMembers(id)
  return { id, title, unit: `${title} Patrol`, code, start, end, members, coverage: watchCoverage(members, id, start, end) }
}

export const watches: Watch[] = [
  watch('day', 'Day', 'PatD', 7, 17),
  watch('swing', 'Swing', 'PatS', 12, 22),
  watch('night', 'Night', 'PatN', 19, 24),
]

/** The watches with the panel's edits applied: changed days replace the mock cells, and coverage is counted again. */
/** Hours modifiers that make a segment overtime */
export const isOvertimeModifier = (modifier: string) => modifier.startsWith('Overtime')

/**
 * Once a segment has fields, its hours modifier decides overtime: an Overtime modifier makes the segment overtime
 * (red, with the clock), any other clears it. Run on every saved day, so the grid follows the panel.
 */
export function syncOvertime(chips: Chip[]): Chip[] {
  return chips.map((chip) => {
    let changed = false
    const segments = chip.segments.map((segment: WorkforceSegment) => {
      if (!segment.details) return segment
      const overtime = isOvertimeModifier(segment.details.modifier) ? segment.overtime ?? 'full' : undefined
      if (overtime === segment.overtime) return segment
      changed = true
      const next = { ...segment, overtime }
      if (!overtime) delete next.overtime
      return next
    })
    return changed ? { ...chip, segments } : chip
  })
}

export function applyEdits(edits: ScheduleEdits): Watch[] {
  if (!edits.days.size) return watches
  return watches.map((base) => {
    const members = base.members.map((member) => ({
      ...member,
      chips: (day: number) => edits.days.get(dayKey(member.id, day)) ?? member.chips(day),
    }))
    return { ...base, members, coverage: watchCoverage(members, base.id, base.start, base.end) }
  })
}

export const allMembers = watches.flatMap((item) => item.members)
export const findWatch = (id: WatchId) => watches.find((item) => item.id === id)!

/** Days in the range where the watch has fewer people than it needs. */
export const daysUnder = (item: Watch, days: number[]) => days.filter((day) => {
  const { have, need } = item.coverage(day).bodies
  return have < need
}).length

/* ------------------------------------------------------------------ */
/* Open shifts                                                         */
/* ------------------------------------------------------------------ */

const sectors = ['Sector A', 'Sector B', 'Sector C', 'Sector D']
const openCache = new Map<number, OpenShift[]>()

/** 0–2 open or live shifts a day. Tue, Jun 2 has three: the open Swing Patrol shift from the Figma frame, a live Day Patrol and an open Night Patrol. */
export function openShifts(day: number, edits?: ReadonlyMap<string, OpenShiftEdit>): OpenShift[] {
  const shifts = baseOpenShifts(day)
  if (!edits?.size) return shifts
  return shifts.flatMap((shift) => {
    const edit = edits.get(shift.id)
    if (!edit) return [shift]
    const { deleted, ...patch } = edit
    const next = { ...shift, ...patch }
    return deleted || stillNeeded(next) <= 0 ? [] : [next]
  })
}

function baseOpenShifts(day: number): OpenShift[] {
  const cached = openCache.get(day)
  if (cached) return cached
  const shifts: OpenShift[] = []
  if (day === dayOf(2026, 6, 2)) {
    shifts.push(
      { id: `open-${day}-0`, day, watch: 'swing', code: 'PatS', start: 12, end: 22, status: 'open', needed: 1, location: 'Sector B' },
      { id: `open-${day}-1`, day, watch: 'day', code: 'PatD', start: 7, end: 17, status: 'live', needed: 1, location: 'Sector A' },
      { id: `open-${day}-2`, day, watch: 'night', code: 'PatN', start: 19, end: 24, status: 'open', needed: 2, location: 'Sector D' },
    )
  } else {
    const r = rand(day * 131 + 7)
    const count = r < 0.4 ? 0 : r < 0.85 ? 1 : 2
    for (let index = 0; index < count; index += 1) {
      const pick = rand(day * 977 + index * 13)
      const item = watches[Math.floor(pick * watches.length)]
      shifts.push({
        id: `open-${day}-${index}`,
        day,
        watch: item.id,
        code: item.code,
        start: item.start,
        end: item.end,
        status: rand(day * 53 + index) < 0.45 ? 'live' : 'open',
        needed: pick > 0.8 ? 2 : 1,
        location: sectors[Math.floor(rand(day * 7 + index) * sectors.length)],
      })
    }
  }
  openCache.set(day, shifts)
  return shifts
}

export const openStatus = {
  open: { label: 'Open', icon: CircleDashed, meaning: 'Nobody holds this shift yet.' },
  live: { label: 'Live', icon: Radio, meaning: 'Posted to employees, who can sign up.' },
} as const

/** How many more people the shift needs */
export const stillNeeded = (shift: OpenShift) => shift.needed - (shift.filled ?? 0)

/** "Open shift, Swing patrol 12:00–22:00, 1 still needed" */
export const describeOpenShift = (shift: OpenShift) =>
  `${openStatus[shift.status].label} shift, ${shiftCodeMap[shift.code]?.label ?? shift.code} ${formatHour(shift.start)}–${formatHour(shift.end)}, ${shift.location}, ${stillNeeded(shift)} still needed`

/** Saved employee filters, as set up in Employee Settings. Counts are for the whole unit. */
export const savedFilters: { key: string; label: string; description?: string; count: number }[] = [
  { key: 'all', label: 'All employees', count: 32 },
  { key: 'spanish', label: 'Spanish Speaking', description: 'Language attribute: Spanish', count: 9 },
  { key: 'level1', label: 'Level 1 Certified', description: 'Certification: Level 1 (active)', count: 24 },
  { key: 'supervisors', label: 'Supervisors', description: 'Employees flagged as supervisors', count: 6 },
  { key: 'fto', label: 'Field Training Officers', description: 'Certification: FTO', count: 5 },
  { key: 'ot', label: 'OT Volunteers', description: 'Signed up on the voluntary OT list', count: 12 },
  { key: 'firearms', label: 'Firearms Qualified', description: 'Certification: Firearms (current)', count: 26 },
]

/** The agency's units, as a tree. A unit with children can be picked as a whole (e.g. Patrol and its five watches). */
export interface UnitNode {
  key: string
  label: string
  children?: UnitNode[]
}

const leaf = (key: string, label: string): UnitNode => ({ key, label })

export const unitTree: UnitNode[] = [
  { key: 'command', label: 'Command', children: [leaf('am-command', 'AM Command'), leaf('pm-command', 'PM Command')] },
  { key: 'special-ops', label: 'Special Ops', children: [leaf('k9', 'K9 Unit'), { key: 'swat', label: 'SWAT', children: [leaf('sub-swat', 'Sub SWAT')] }] },
  {
    key: 'patrol',
    label: 'Patrol',
    children: [leaf('day-patrol', 'Day Patrol'), leaf('swing-patrol', 'Swing Patrol'), leaf('night-patrol', 'Night Patrol'), leaf('floaters', 'Floaters'), leaf('trainees', 'Trainees')],
  },
  {
    key: 'communications',
    label: 'Communications',
    children: [
      { key: 'dispatch', label: 'Dispatch', children: [leaf('dispatch-day', 'Dispatch Day'), leaf('dispatch-swing', 'Dispatch Swing'), leaf('dispatch-night', 'Dispatch Night')] },
      { key: 'call-taker', label: 'Call Taker', children: [leaf('call-taker-day', 'Call Taker Day'), leaf('call-taker-swing', 'Call Taker Swing'), leaf('call-taker-night', 'Call Taker Night')] },
    ],
  },
  leaf('training', 'Training'),
]

/** Recently used units, newest first. `parent` is shown dimmed after the name. */
export const recentUnits: { key: string; parent?: string }[] = [{ key: 'patrol' }, { key: 'night-patrol', parent: 'Patrol' }]

export const findUnit = (key: string, nodes: UnitNode[] = unitTree): UnitNode | undefined => {
  for (const node of nodes) {
    if (node.key === key) return node
    const found = node.children && findUnit(key, node.children)
    if (found) return found
  }
  return undefined
}

/** Units whose name matches, with their parents for context. A matching parent keeps all its children. */
export const filterUnits = (query: string, nodes: UnitNode[] = unitTree): UnitNode[] => {
  const q = query.trim().toLowerCase()
  if (!q) return nodes
  return nodes.flatMap((node) => {
    if (node.label.toLowerCase().includes(q)) return [node]
    const children = filterUnits(q, node.children ?? [])
    return children.length ? [{ ...node, children }] : []
  })
}

/* ------------------------------------------------------------------ */
/* Sorting and employee details                                        */
/* ------------------------------------------------------------------ */

export type WorkforceSort = 'watch' | 'name' | 'rank' | 'rankEffective' | 'rankPrecedence' | 'precedence' | 'precedenceRank'

type Compare = (a: WorkforceMember, b: WorkforceMember) => number
const byName: Compare = (a, b) => a.last.localeCompare(b.last) || a.first.localeCompare(b.first)
const byRank: Compare = (a, b) => rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank)
const byRankEffective: Compare = (a, b) => a.rankEffective - b.rankEffective
const byPrecedence: Compare = (a, b) => a.precedence - b.precedence

/** Each sort compares by these in turn; the name breaks any tie. `watch` keeps the roster order. */
const sortKeys: Record<Exclude<WorkforceSort, 'watch'>, Compare[]> = {
  name: [],
  rank: [byRank],
  rankEffective: [byRank, byRankEffective],
  rankPrecedence: [byRank, byPrecedence],
  precedence: [byPrecedence],
  precedenceRank: [byPrecedence, byRank],
}

export const sortWorkforce = (members: WorkforceMember[], sort: WorkforceSort, direction: 'asc' | 'desc') => {
  const sorted = sort === 'watch' ? members : [...members].sort((a, b) => {
    for (const compare of sortKeys[sort]) {
      const result = compare(a, b)
      if (result) return result
    }
    return byName(a, b)
  })
  return direction === 'desc' ? [...sorted].reverse() : sorted
}

const yearsByRank: Record<WorkforceRank, number> = { Lt: 22, Sgt: 15, Cpl: 9, PO: 3 }

/** Details for the employee modal. */
export function workforceProfile(id: string): EmployeeProfile | null {
  const index = allMembers.findIndex((member) => member.id === id)
  if (index < 0) return null
  const member = allMembers[index]
  const years = yearsByRank[member.rank] + (index % 6)
  return {
    id: member.id,
    first: member.first,
    last: member.last,
    initials: member.initials,
    rank: rankLabels[member.rank],
    team: `${findWatch(member.watch).unit}, 99th Precinct`,
    firstEmployed: dayOf(2026 - years, ((index * 5) % 12) + 1, ((index * 7) % 27) + 1),
    email: `${member.first[0].toLowerCase()}.${member.last.toLowerCase()}@99precinct.example`,
    mobile: `(718) 555-02${String(10 + index).padStart(2, '0')}`,
    employeeId: String(14200 + index * 41),
  }
}

/** "Fri, Jun 5, 2026" */
export const formatLongDay = (day: number) => `${formatHeader(day)}, ${new Date(day * 86_400_000).getUTCFullYear()}`
