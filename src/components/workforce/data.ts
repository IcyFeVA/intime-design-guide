import { CircleDashed, Radio } from 'lucide-react'
import { shiftCodeMap } from '../../tokens/schedule'
import {
  coverageLevel, formatHour, dayOf, formatHeader, rand, segmentHours, segmentKind, weekdayIndex, type Chip, type DayCoverage, type Segment,
} from '../schedule/data'
import type { EmployeeProfile } from '../schedule/profiles'

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
  location: string
}

/** "B. Haddad" */
export const shortName = (member: Pick<WorkforceMember, 'first' | 'last'>) => `${member.first[0]}. ${member.last}`

/* ------------------------------------------------------------------ */
/* Schedules                                                           */
/* ------------------------------------------------------------------ */

const c = (code: string, extra: Partial<Segment> = {}): Segment => ({ code, ...extra })
const cell = (segments: Segment[], outOfUnit?: boolean): Chip => ({ segments, outOfUnit })

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
    else if (r < 0.15) main = cell([c('Train')], r2 < 0.3)
    else if (r < 0.19) main = cell([c(base, { overtime: 'partial' })])
    else if (r < 0.22) main = cell([c(base)], true)
    else if (r < 0.27) main = cell(split)
    else if (r < 0.29) main = cell([c('Spe')])
    else main = cell([c(base)])
    return r2 > 0.965 ? [main, cell([extra])] : [main]
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

type Spec = [id: string, first: string, last: string, rank: WorkforceRank, offset: number, week?: Record<number, Chip[]>]

const specs: Record<WatchId, Spec[]> = {
  day: [
    ['nguyen', 'Thomas', 'Nguyen', 'PO', 0, { 1: [cell([c('Vac')])] }],
    ['kowalski', 'Sofia', 'Kowalski', 'PO', 1],
    ['okafor', 'Raymond', 'Okafor', 'Cpl', 2],
    ['alvarez', 'Marco', 'Alvarez', 'Sgt', 3, { 0: [cell([c('C-AM'), c('PatD', { start: 12 })])] }],
    ['garcia', 'Lucia', 'Garcia', 'PO', 4],
    ['brennan', 'Kevin', 'Brennan', 'Sgt', 5, { 3: [cell([c('C-AM'), c('PatD', { start: 12 }), c('ExP', { overtime: 'full' })])] }],
    ['anderson', 'Jamal', 'Anderson', 'PO', 6, { 2: [cell([c('PatD')]), cell([c('ExP', { overtime: 'full' })])], 3: [cell([c('Train')])] }],
    ['rodriguez', 'Elena', 'Rodriguez', 'PO', 0],
    ['patel', 'Dev', 'Patel', 'PO', 1],
    ['lee', 'Christine', 'Lee', 'PO', 2],
    ['haddad', 'Bilal', 'Haddad', 'PO', 3, { 0: [cell([c('PatD')])], 1: [cell([c('PatD')])], 2: [cell([c('PatD')])], 3: [cell([c('PatD')])], 4: [cell([c('PatD')])], 5: [], 6: [] }],
    ['johnson', 'Aaron', 'Johnson', 'PO', 4],
  ],
  swing: [
    ['russo', 'Vincent', 'Russo', 'PO', 5],
    ['thompson', 'Sarah', 'Thompson', 'Cpl', 6],
    ['fitzgerald', 'Patrick', 'Fitzgerald', 'Sgt', 0, { 1: [cell([c('Train', { start: 8, end: 11 }), c('C-PM'), c('PatS', { start: 16, overtime: 'partial' })])] }],
    ['petrov', 'Oksana', 'Petrov', 'PO', 1],
    ['abara', 'Nnamdi', 'Abara', 'PO', 2],
    ['williams', 'Monique', 'Williams', 'Sgt', 3],
    ['davis', 'Keith', 'Davis', 'PO', 4],
    ['mensah', 'Isaac', 'Mensah', 'PO', 5],
    ['yamamoto', 'Hana', 'Yamamoto', 'PO', 6],
    ['silva', 'Gabriel', 'Silva', 'PO', 0],
  ],
  night: [
    ['cohen', 'Yael', 'Cohen', 'PO', 1],
    ['murphy', 'Declan', 'Murphy', 'Sgt', 2],
    ['rossi', 'Angela', 'Rossi', 'PO', 3],
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

const buildMembers = (watch: WatchId): WorkforceMember[] => specs[watch].map(([id, first, last, rank, offset, week], index) => ({
  id,
  first,
  last,
  initials: `${first[0]}${last[0]}`,
  rank,
  rankEffective: dayOf(2025 - ((watchSeeds[watch] / 100 + index * 3) % 9), ((index * 5 + offset) % 12) + 1, ((index * 11) % 27) + 1),
  precedence: 1 + ((watchSeeds[watch] / 100 + index * 7) % 5),
  supervisor: rank === 'Sgt' || rank === 'Lt',
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

/** Segments that put someone on the street for the watch: not leave, not cancelled, not lent to another unit. */
const workingSegments = (chips: Chip[]) => chips.flatMap((chip) => (chip.outOfUnit ? [] : chip.segments))
  .filter((segment) => !segment.cancelled && segmentKind(segment) !== 'leave')

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
      const segments = workingSegments(member.chips(day))
      if (!segments.length) continue
      bodies += 1
      if (member.supervisor) supervisors += 1
      const covered = new Set<number>()
      for (const segment of segments) {
        const { start: from, end: to } = segmentHours(segment)
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
export function openShifts(day: number): OpenShift[] {
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

/** "Open shift, Swing patrol 12:00–22:00, 1 still needed" */
export const describeOpenShift = (shift: OpenShift) =>
  `${openStatus[shift.status].label} shift, ${shiftCodeMap[shift.code]?.label ?? shift.code} ${formatHour(shift.start)}–${formatHour(shift.end)}, ${shift.location}, ${shift.needed} still needed`

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
