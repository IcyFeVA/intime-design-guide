import { formatHour, segmentHours, segmentKind, type Chip, type Segment } from '../schedule/data'
import {
  daysUnder, openShifts, sortWorkforce, type OpenShift, type OpenShiftEdit, type Watch, type WatchId, type WorkforceMember, type WorkforceSegment,
  type WorkforceSort,
} from './data'

/* ------------------------------------------------------------------ */
/* Grid model: the rendered rows, worked out once per structure change */
/* (range, date, collapse, sort, filter), never per selection change.  */
/* ------------------------------------------------------------------ */

export type StaffingMetric = 'bodies' | 'supervisors' | 'hours' | 'timeOfDay'

export const staffingMetrics: { key: StaffingMetric; label: string }[] = [
  { key: 'bodies', label: 'Bodies' },
  { key: 'supervisors', label: 'Supervisors' },
  { key: 'hours', label: 'Hours' },
  { key: 'timeOfDay', label: 'Time of day' },
]

export type EmployeeFilter = 'all' | 'scheduled' | 'supervisors'

export interface UnderAlert {
  watch: Watch
  day: number
  have: number
  need: number
}

export type GridRow =
  | { kind: 'open'; key: string; line: number; lines: number; cells: (OpenShift | null)[] }
  | { kind: 'group'; key: string; watch: Watch; expanded: boolean; count: number }
  | { kind: 'staffing-toggle'; key: string; watch: Watch; expanded: boolean; daysUnder: number }
  | { kind: 'staffing'; key: string; watch: Watch; metric: StaffingMetric }
  | { kind: 'member'; key: string; watch: Watch; member: WorkforceMember; line: number; overflow: boolean; cells: (Chip | null)[] }

/** Key of the date row in the selection hook: its cells select a day, the corner selects everything */
export const HEADER_ROW = 'head'

export interface GridModel {
  rows: GridRow[]
  /** Row keys in render order */
  rowKeys: string[]
  /** `HEADER_ROW` then `rowKeys`: every row the keyboard can reach, for the selection hook */
  navRows: string[]
  /** All lines of a person (or all open shift lines): what a click on a row header selects */
  rowGroup: (row: string) => readonly string[]
  byKey: Map<string, GridRow>
  days: number[]
  /** Open and live shifts in the range */
  openCount: number
  /** Watch-days below the bodies target in the range */
  underCount: number
  /** Each watch-day below the bodies target, by watch then day: the Understaffed menu */
  underAlerts: UnderAlert[]
  isSelectable: (row: string, day: number) => boolean
  /** A person's extra line falls back to their first line, e.g. when an edit removes the line */
  fallbackRow: (row: string) => string | null
}

export interface GridModelInput {
  watches: Watch[]
  days: number[]
  collapsed: ReadonlySet<WatchId>
  staffingCollapsed: ReadonlySet<WatchId>
  sort: WorkforceSort
  direction: 'asc' | 'desc'
  filter: EmployeeFilter
  /** Open shifts changed in the panel */
  openEdits?: ReadonlyMap<string, OpenShiftEdit>
}

export const memberRowKey = (memberId: string, line: number) => `m:${memberId}:${line}`
const fallbackRow = (row: string) => (/^m:.+:[1-9]\d*$/.test(row) ? row.replace(/:\d+$/, ':0') : null)

export function buildGridModel({ watches, days, collapsed, staffingCollapsed, sort, direction, filter, openEdits }: GridModelInput): GridModel {
  const rows: GridRow[] = []

  const openByDay = days.map((day) => openShifts(day, openEdits))
  const openLines = Math.max(1, ...openByDay.map((shifts) => shifts.length))
  for (let line = 0; line < openLines; line += 1) {
    rows.push({ kind: 'open', key: `open:${line}`, line, lines: openLines, cells: openByDay.map((shifts) => shifts[line] ?? null) })
  }

  for (const watch of watches) {
    const members = sortWorkforce(watch.members, sort, direction).filter((member) =>
      filter === 'all' || (filter === 'supervisors' ? member.supervisor : days.some((day) => member.chips(day).length > 0)))
    const expanded = !collapsed.has(watch.id)
    rows.push({ kind: 'group', key: `group:${watch.id}`, watch, expanded, count: members.length })
    if (!expanded) continue

    const staffingExpanded = !staffingCollapsed.has(watch.id)
    rows.push({ kind: 'staffing-toggle', key: `staffing:${watch.id}`, watch, expanded: staffingExpanded, daysUnder: daysUnder(watch, days) })
    if (staffingExpanded) {
      for (const { key } of staffingMetrics) rows.push({ kind: 'staffing', key: `staffing:${watch.id}:${key}`, watch, metric: key })
    }

    for (const member of members) {
      const chipsByDay = days.map((day) => member.chips(day))
      const lines = Math.max(1, ...chipsByDay.map((chips) => chips.length))
      for (let line = 0; line < lines; line += 1) {
        rows.push({ kind: 'member', key: memberRowKey(member.id, line), watch, member, line, overflow: line > 0, cells: chipsByDay.map((chips) => chips[line] ?? null) })
      }
    }
  }

  const underAlerts = watches.flatMap((watch) => days.flatMap((day) => {
    const { have, need } = watch.coverage(day).bodies
    return have < need ? [{ watch, day, have, need }] : []
  }))

  const byKey = new Map(rows.map((row) => [row.key, row]))
  const groups = new Map<string, string[]>()
  for (const row of rows) {
    const id = row.kind === 'member' ? `m:${row.member.id}` : row.kind === 'open' ? 'open' : row.key
    groups.set(id, [...(groups.get(id) ?? []), row.key])
  }
  const groupOf = new Map<string, string[]>()
  for (const keys of groups.values()) for (const key of keys) groupOf.set(key, keys)
  const dayIndex = new Map(days.map((day, index) => [day, index]))

  return {
    rows,
    rowKeys: rows.map((row) => row.key),
    navRows: [HEADER_ROW, ...rows.map((row) => row.key)],
    rowGroup: (key) => groupOf.get(key) ?? [key],
    byKey,
    days,
    openCount: openByDay.reduce((sum, shifts) => sum + shifts.length, 0),
    underCount: underAlerts.length,
    underAlerts,
    fallbackRow,
    isSelectable: (key, day) => {
      const row = byKey.get(key)
      const index = dayIndex.get(day)
      if (!row || index === undefined) return false
      if (row.kind === 'member') return row.line === 0 || row.cells[index] !== null
      if (row.kind === 'open') return row.cells[index] !== null
      return false
    },
  }
}

/* ------------------------------------------------------------------ */
/* Blocks: segments that touch make one block, which is one grid cell. */
/* A segment that doesn't touch goes into a block (and line) of its own. */
/* ------------------------------------------------------------------ */

const isLeave = (segment: Segment) => segmentKind(segment) === 'leave'
const span = (segment: Segment) => `${segment.code} ${formatHour(segmentHours(segment).start)}–${formatHour(segmentHours(segment).end)}`

/**
 * Groups a day's segments into blocks (indexes into `segments`, each block in time order, blocks by start).
 * Touching = one ends when the next starts. Working segments may not overlap; a leave that overlaps a working
 * segment stays in its block (a partial leave). `focus` is the segment being edited: errors name what it clashes with.
 */
export function groupBlocks(segments: Segment[], focus?: number): { blocks: number[][]; error?: string } {
  const hours = segments.map(segmentHours)
  const zero = segments.findIndex((_, index) => hours[index].end <= hours[index].start)
  if (zero >= 0) return { blocks: [], error: `Starts and ends at ${formatHour(hours[zero].start)}` }

  const working = segments.map((_, index) => index).filter((index) => !isLeave(segments[index])).sort((a, b) => hours[a].start - hours[b].start)
  for (const a of working) {
    for (const b of working) {
      if (a >= b || hours[a].start >= hours[b].end || hours[b].start >= hours[a].end) continue
      const other = focus === b ? a : b
      return { blocks: [], error: `Overlaps ${span(segments[other])}` }
    }
  }

  const blocks: { items: number[]; start: number; end: number }[] = []
  for (const index of working) {
    const last = blocks[blocks.length - 1]
    if (last && hours[index].start <= last.end) {
      last.items.push(index)
      last.end = Math.max(last.end, hours[index].end)
    } else blocks.push({ items: [index], start: hours[index].start, end: hours[index].end })
  }
  for (const index of segments.map((_, i) => i).filter((i) => isLeave(segments[i]))) {
    const host = blocks.find((block) => hours[index].start < block.end && hours[index].end > block.start)
    if (host) host.items.push(index)
    else blocks.push({ items: [index], start: hours[index].start, end: hours[index].end })
  }
  return {
    blocks: blocks
      .sort((a, b) => a.start - b.start)
      .map((block) => block.items.sort((a, b) => hours[a].start - hours[b].start || Number(isLeave(segments[a])) - Number(isLeave(segments[b])))),
  }
}

/** A day's segments as one list, each with an id and the block it came from */
export interface DaySegment {
  segment: WorkforceSegment & { id: string }
  /** Index of the block (chip) it was in */
  from: number
}

export function flattenDay(chips: Chip[]): DaySegment[] {
  return chips.flatMap((chip, block) => chip.segments.map((segment: WorkforceSegment, index) => ({
    segment: { ...segment, id: segment.id ?? `s${block}.${index}` },
    from: block,
  })))
}

/** Rebuilds a day's cells from its segments. Each new block keeps the cell flags (out of unit…) of its first segment's old block. */
export function regroupDay(chips: Chip[], items: DaySegment[], focusId?: string): { chips: Chip[]; error?: string } {
  const focus = focusId === undefined ? undefined : items.findIndex((item) => item.segment.id === focusId)
  const { blocks, error } = groupBlocks(items.map((item) => item.segment), focus)
  if (error) return { chips, error }
  return {
    chips: blocks.map((block) => {
      const old: Partial<Chip> = chips[items[block[0]].from] ?? {}
      return { outOfUnit: old.outOfUnit, partialKind: old.partialKind, segments: block.map((index) => items[index].segment) }
    }),
  }
}

/* ------------------------------------------------------------------ */
/* What the details panel shows for a selection                        */
/* ------------------------------------------------------------------ */

export type PanelItem =
  | { kind: 'open-shift'; key: string; day: number; shift: OpenShift }
  /** A person's day: every block, and the line that was selected (`chip` is that line's cell, or null when empty) */
  | { kind: 'day'; key: string; day: number; member: WorkforceMember; watch: Watch; blocks: Chip[]; line: number; chip: Chip | null }

export type PanelContent =
  | { mode: 'none' }
  | PanelItem & { mode: 'single' }
  | { mode: 'bulk'; items: PanelItem[] }

export function panelItem(model: GridModel, row: string, day: number): PanelItem | null {
  const gridRow = model.byKey.get(row)
  const index = model.days.indexOf(day)
  if (!gridRow || index < 0) return null
  const key = `${row}@${day}`
  if (gridRow.kind === 'open') {
    const shift = gridRow.cells[index]
    return shift ? { kind: 'open-shift', key, day, shift } : null
  }
  if (gridRow.kind === 'member') {
    const { member, watch, line } = gridRow
    return { kind: 'day', key, day, member, watch, blocks: member.chips(day), line, chip: gridRow.cells[index] }
  }
  return null
}

export function panelContent(model: GridModel, cells: { row: string; day: number }[]): PanelContent {
  const items = cells.map((cell) => panelItem(model, cell.row, cell.day)).filter((item): item is PanelItem => item !== null)
  if (items.length === 0) return { mode: 'none' }
  if (items.length === 1) return { ...items[0], mode: 'single' }
  return { mode: 'bulk', items }
}
