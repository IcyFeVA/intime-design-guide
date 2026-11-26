import { formatHeader, segmentKind, type Chip, type Segment } from '../../schedule/data'
import { shiftCodeMap } from '../../../tokens/schedule'
import { dayKey, findWatch, shortName, type OpenShiftEdit, type SegmentDetails, type Watch, type WorkforceMember, type WorkforceSegment } from '../data'
import { assignDay, flattenDay, regroupDay, type PanelItem } from '../model'
import type { EditCommit } from '../useScheduleEdits'
import type { LeaveRequest } from './LeaveEntry'
import { segmentDetails } from './options'

/* ------------------------------------------------------------------ */
/* Bulk edits: what the panel does to several selected cells at once.  */
/* Each action is one commit, so one Undo reverts all of it.           */
/* ------------------------------------------------------------------ */

type OpenItem = Extract<PanelItem, { kind: 'open-shift' }>

/** A person's day with the lines selected on it (none when the day is empty) */
export interface BulkDay {
  key: string
  member: WorkforceMember
  watch: Watch
  day: number
  blocks: Chip[]
  lines: number[]
}

export interface BulkSelection {
  days: BulkDay[]
  open: OpenItem[]
}

/** The fields "Change fields" sets on every selected cell */
export type BulkField = 'activity' | 'location' | 'modifier' | 'unit'

/** What an action saves, how many cells it changed, and why others were left alone */
export interface BulkResult {
  commit: EditCommit
  changed: number
  skipped: string[]
}

export const plural = (count: number, word: string, many = `${word}s`) => `${count} ${count === 1 ? word : many}`
const isLeave = (segment: Segment) => segmentKind(segment) === 'leave'
const ownLines = (day: BulkDay) => day.lines.filter((line) => !day.blocks[line].locked)
const lockedLines = (day: BulkDay) => day.lines.length - ownLines(day).length
const unitOf = (day: BulkDay, chip: Chip) => (chip.outOfUnit ? chip.unit ?? day.watch.unit : day.watch.unit)
const newId = (prefix: string) => `${prefix}${Math.random().toString(36).slice(2, 8)}`

/** Groups the selected cells by person-day (two lines of one day are one day) and open shift */
export function bulkSelection(items: PanelItem[]): BulkSelection {
  const days = new Map<string, BulkDay>()
  const open: OpenItem[] = []
  for (const item of items) {
    if (item.kind === 'open-shift') {
      open.push(item)
      continue
    }
    const key = dayKey(item.member.id, item.day)
    const entry = days.get(key) ?? { key, member: item.member, watch: item.watch, day: item.day, blocks: item.blocks, lines: [] }
    if (item.chip && item.blocks[item.line]) entry.lines.push(item.line)
    days.set(key, entry)
  }
  return { days: [...days.values()], open }
}

/** Selected cells that aren't locked, open shifts included: what Delete all removes */
export const deletableCount = (selection: BulkSelection) =>
  selection.days.reduce((sum, day) => sum + ownLines(day).length, 0) + selection.open.length

/** Person-days "Assign to N" can give the shift: all but the days where only locked cells are selected */
export const assignableDays = (selection: BulkSelection) => selection.days.filter((day) => !day.lines.length || ownLines(day).length)

/** The selected cells that aren't locked */
export const ownChips = (selection: BulkSelection) => selection.days.flatMap((day) => ownLines(day).map((line) => day.blocks[line]))

export const lockedCount = (selection: BulkSelection) => selection.days.reduce((sum, day) => sum + lockedLines(day), 0)

/** "Assign to N": every selected person-day gets a shift with the code's default hours, in place of the selected cells */
export function assignCode(selection: BulkSelection, code: string): BulkResult {
  const definition = shiftCodeMap[code]
  const chip: Chip = { segments: [{ code, start: definition.start, end: definition.end }] }
  const days: [string, Chip[]][] = []
  const problems: string[] = []
  let locked = 0
  for (const day of selection.days) {
    const own = ownLines(day)
    if (day.lines.length && !own.length) {
      locked += 1
      continue
    }
    const result = assignDay(day.blocks, own, chip)
    if (result.error) problems.push(`${shortName(day.member)}, ${formatHeader(day.day)} (${result.error})`)
    else if (result.changed) days.push([day.key, result.chips])
  }
  const skipped = [
    ...(locked ? [`${plural(locked, 'locked day')}`] : []),
    ...(selection.open.length ? [`${plural(selection.open.length, 'open shift')} (assign those from the shift itself)`] : []),
    ...problems,
  ]
  return { commit: { days }, changed: days.length, skipped }
}

/** The values a field has across the selected cells' working segments (and open shifts) */
export function fieldValues(selection: BulkSelection, field: BulkField): (string | null)[] {
  const values: (string | null)[] = []
  for (const day of selection.days) {
    for (const line of ownLines(day)) {
      const chip = day.blocks[line]
      chip.segments.forEach((segment: WorkforceSegment, index) => {
        if (isLeave(segment)) return
        values.push(segmentDetails(segment, unitOf(day, chip), `${day.key}:${segment.id ?? `s${line}.${index}`}`)[field])
      })
    }
  }
  for (const { shift } of selection.open) {
    values.push(segmentDetails({ code: shift.code, details: shift.details }, findWatch(shift.watch).unit, shift.id, shift.location)[field])
  }
  return values
}

/** The shared value of a field, or null when the cells differ (or there are none) */
export const commonValue = <T,>(values: T[]): T | null => (values.length && values.every((value) => value === values[0]) ? values[0] : null)

/** Sets one field on every selected cell's working segments and open shifts. Leave segments and locked cells stay. */
export function changeField(selection: BulkSelection, change: Partial<SegmentDetails>): BulkResult {
  const days: [string, Chip[]][] = []
  let changed = 0
  let leaveOnly = 0
  let empty = 0
  for (const day of selection.days) {
    const own = ownLines(day)
    if (!day.lines.length) empty += 1
    if (!own.length) continue
    let touched = false
    const chips = day.blocks.map((chip, line) => {
      if (!own.includes(line)) return chip
      if (chip.segments.every(isLeave)) {
        leaveOnly += 1
        return chip
      }
      changed += 1
      touched = true
      return {
        ...chip,
        segments: chip.segments.map((segment: WorkforceSegment, index) => {
          if (isLeave(segment)) return segment
          const id = segment.id ?? `s${line}.${index}`
          return { ...segment, id, details: { ...segmentDetails(segment, unitOf(day, chip), `${day.key}:${id}`), ...change } }
        }),
      }
    })
    if (touched) days.push([day.key, chips])
  }
  const open: [string, OpenShiftEdit][] = selection.open.map(({ shift }) => [shift.id, {
    details: { ...segmentDetails({ code: shift.code, details: shift.details }, findWatch(shift.watch).unit, shift.id, shift.location), ...change },
  }])
  const locked = lockedCount(selection)
  const skipped = [
    ...(locked ? [plural(locked, 'locked cell')] : []),
    ...(leaveOnly ? [plural(leaveOnly, 'leave cell')] : []),
    ...(empty ? [plural(empty, 'empty cell')] : []),
  ]
  return { commit: { days, open }, changed: changed + open.length, skipped }
}

/** Removes the selected cells (open shifts too), except locked ones */
export function deleteAll(selection: BulkSelection): BulkResult {
  const days: [string, Chip[]][] = selection.days
    .filter((day) => ownLines(day).length)
    .map((day) => [day.key, day.blocks.filter((_, line) => !ownLines(day).includes(line))])
  const open: [string, OpenShiftEdit][] = selection.open.map(({ shift }) => [shift.id, { deleted: true }])
  const locked = lockedCount(selection)
  return { commit: { days, open }, changed: deletableCount(selection), skipped: locked ? [plural(locked, 'locked cell')] : [] }
}

/**
 * Leave on every selected person-day. All day replaces the day's assignments (locked ones stay), as for one cell.
 * Part of the day nests inside an assignment it overlaps; a day where it would clash is skipped.
 */
export function addLeave(selection: BulkSelection, leave: LeaveRequest): BulkResult {
  const days: [string, Chip[]][] = []
  const problems: string[] = []
  for (const day of selection.days) {
    const segment: WorkforceSegment = { id: newId('l'), code: leave.code, start: leave.allDay ? 0 : leave.start, end: leave.allDay ? 24 : leave.end }
    if (leave.allDay) {
      days.push([day.key, [{ segments: [segment] }, ...day.blocks.filter((chip) => chip.locked)]])
      continue
    }
    const result = regroupDay(day.blocks, [...flattenDay(day.blocks), { segment: { ...segment, id: segment.id! }, from: day.blocks.length }])
    if (result.error) problems.push(`${shortName(day.member)}, ${formatHeader(day.day)} (${result.error.toLowerCase()})`)
    else days.push([day.key, result.chips])
  }
  const skipped = [
    ...(selection.open.length ? [plural(selection.open.length, 'open shift')] : []),
    ...problems,
  ]
  return { commit: { days }, changed: days.length, skipped }
}
