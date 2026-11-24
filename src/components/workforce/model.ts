import type { Chip } from '../schedule/data'
import { daysUnder, openShifts, sortWorkforce, type OpenShift, type Watch, type WatchId, type WorkforceMember, type WorkforceSort } from './data'

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

export const employeeFilters: { key: EmployeeFilter; label: string }[] = [
  { key: 'all', label: 'All employees' },
  { key: 'scheduled', label: 'Scheduled in range' },
  { key: 'supervisors', label: 'Supervisors' },
]

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
  isSelectable: (row: string, day: number) => boolean
}

export interface GridModelInput {
  watches: Watch[]
  days: number[]
  collapsed: ReadonlySet<WatchId>
  staffingCollapsed: ReadonlySet<WatchId>
  sort: WorkforceSort
  direction: 'asc' | 'desc'
  filter: EmployeeFilter
}

export const memberRowKey = (memberId: string, line: number) => `m:${memberId}:${line}`

export function buildGridModel({ watches, days, collapsed, staffingCollapsed, sort, direction, filter }: GridModelInput): GridModel {
  const rows: GridRow[] = []

  const openByDay = days.map((day) => openShifts(day))
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
    underCount: watches.reduce((sum, watch) => sum + daysUnder(watch, days), 0),
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
/* What the details panel shows for a selection                        */
/* ------------------------------------------------------------------ */

export type PanelItem =
  | { kind: 'open-shift'; key: string; day: number; shift: OpenShift }
  | { kind: 'assigned'; key: string; day: number; member: WorkforceMember; watch: Watch; chip: Chip }
  | { kind: 'new'; key: string; day: number; member: WorkforceMember; watch: Watch }

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
    const chip = gridRow.cells[index]
    return chip
      ? { kind: 'assigned', key, day, member: gridRow.member, watch: gridRow.watch, chip }
      : { kind: 'new', key, day, member: gridRow.member, watch: gridRow.watch }
  }
  return null
}

export function panelContent(model: GridModel, cells: { row: string; day: number }[]): PanelContent {
  const items = cells.map((cell) => panelItem(model, cell.row, cell.day)).filter((item): item is PanelItem => item !== null)
  if (items.length === 0) return { mode: 'none' }
  if (items.length === 1) return { ...items[0], mode: 'single' }
  return { mode: 'bulk', items }
}
