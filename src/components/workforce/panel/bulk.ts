import { formatHeader, segmentHours, segmentKind, type Chip, type Segment } from '../../schedule/data'
import { shiftCodeMap } from '../../../tokens/schedule'
import { dayKey, findWatch, shortName, type OpenShiftEdit, type SegmentDetails, type Watch, type WorkforceMember, type WorkforceSegment } from '../data'
import { assignDay, flattenDay, regroupDay, type PanelItem } from '../model'
import type { EditCommit } from '../useScheduleEdits'
import type { LeaveRequest } from './LeaveEntry'
import { segmentDetails } from './options'
import { normalizeEnd } from './format'

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
/** An error inside a sentence: "Overlaps PatD …" → "overlaps PatD …" (codes keep their case) */
const lowerFirst = (text: string) => text.charAt(0).toLowerCase() + text.slice(1)
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

/** A working segment the bulk form shows and edits: of a selected, unlocked cell, or a selected open shift */
export interface BulkSegment {
  day: number
  code: string
  start: number
  end: number
  details: SegmentDetails
}

const openDetails = (shift: OpenItem['shift']) =>
  segmentDetails({ code: shift.code, details: shift.details }, findWatch(shift.watch).unit, shift.id, shift.location)

/** The working segments of the selected cells (leave and locked cells left out) and the selected open shifts */
export function bulkSegments(selection: BulkSelection): BulkSegment[] {
  const segments: BulkSegment[] = []
  for (const day of selection.days) {
    for (const line of ownLines(day)) {
      const chip = day.blocks[line]
      chip.segments.forEach((segment: WorkforceSegment, index) => {
        if (isLeave(segment)) return
        const details = segmentDetails(segment, unitOf(day, chip), `${day.key}:${segment.id ?? `s${line}.${index}`}`)
        segments.push({ day: day.day, code: segment.code, ...segmentHours(segment), details })
      })
    }
  }
  for (const { shift } of selection.open) {
    segments.push({ day: shift.day, code: shift.code, start: shift.start, end: shift.end, details: openDetails(shift) })
  }
  return segments
}

/** The shared value of a field, or null when the cells differ (or there are none) */
export const commonValue = <T,>(values: T[]): T | null => (values.length && values.every((value) => value === values[0]) ? values[0] : null)

/** What a bulk change does to one segment: a new code and/or fields, or null to leave it */
export type SegmentChange = (segment: BulkSegment) => { code?: string; details?: SegmentDetails } | null

/** Skipped cells, for the status line */
function skippedCells(selection: BulkSelection, leaveOnly: number, extra: string[] = []) {
  const locked = lockedCount(selection)
  const empty = selection.days.filter((day) => !day.lines.length).length
  return [
    ...(locked ? [plural(locked, 'locked cell')] : []),
    ...(leaveOnly ? [plural(leaveOnly, 'leave cell')] : []),
    ...(empty ? [plural(empty, 'empty cell')] : []),
    ...extra,
  ]
}

/**
 * Changes every working segment of the selected unlocked cells, and the selected open shifts. Leave segments and
 * locked cells stay. Segment ids are filled in as `s{block}.{index}`, as `flattenDay` does, so the mock defaults hold.
 */
export function changeSegments(selection: BulkSelection, change: SegmentChange): BulkResult {
  const days: [string, Chip[]][] = []
  let changed = 0
  let leaveOnly = 0
  for (const day of selection.days) {
    const own = ownLines(day)
    let touched = false
    const chips = day.blocks.map((chip, line) => {
      if (!own.includes(line)) return chip
      if (chip.segments.every(isLeave)) {
        leaveOnly += 1
        return chip
      }
      let chipChanged = false
      const segments = chip.segments.map((segment: WorkforceSegment, index) => {
        if (isLeave(segment)) return segment
        const id = segment.id ?? `s${line}.${index}`
        const details = segmentDetails(segment, unitOf(day, chip), `${day.key}:${id}`)
        const next = change({ day: day.day, code: segment.code, ...segmentHours(segment), details })
        if (!next) return segment
        chipChanged = true
        return { ...segment, id, details: next.details ?? details, code: next.code ?? segment.code }
      })
      if (!chipChanged) return chip
      changed += 1
      touched = true
      return { ...chip, segments }
    })
    if (touched) days.push([day.key, chips])
  }
  const open: [string, OpenShiftEdit][] = []
  for (const { shift } of selection.open) {
    const next = change({ day: shift.day, code: shift.code, start: shift.start, end: shift.end, details: openDetails(shift) })
    if (!next) continue
    open.push([shift.id, { ...(next.code ? { code: next.code } : {}), ...(next.details ? { details: next.details } : {}) }])
  }
  return { commit: { days, open }, changed: changed + open.length, skipped: skippedCells(selection, leaveOnly) }
}

/**
 * New times from a bulk edit: the typed start and/or end, the segment's own for the other. An end at or before the
 * start is the next day, as in the single-cell form. Null when it would start and end at the same time.
 */
export function applyTimes(span: { start: number; end: number }, times: { start?: number; end?: number }) {
  const start = times.start ?? span.start
  const end = times.end ?? (span.end % 24 || 24)
  if (start % 24 === end % 24 && !(start === 0 && end === 24)) return null
  return { start, end: normalizeEnd(start, end) }
}

/**
 * Scheduled times on every selected assignment with one working segment, and on open shifts. Assignments split into
 * several working segments are skipped (which one would get the times?), and so are days where the new times clash.
 */
export function changeTimes(selection: BulkSelection, times: { start?: number; end?: number }): BulkResult {
  const days: [string, Chip[]][] = []
  const problems: string[] = []
  let changed = 0
  let split = 0
  let leaveOnly = 0
  for (const day of selection.days) {
    const own = ownLines(day)
    const items = flattenDay(day.blocks)
    let count = 0
    let error = null as string | null
    const next = items.map((item) => {
      if (!own.includes(item.from)) return item
      const working = items.filter((other) => other.from === item.from && !isLeave(other.segment))
      if (isLeave(item.segment) || working.length !== 1) return item
      const span = applyTimes(segmentHours(item.segment), times)
      if (!span) {
        error = 'starts and ends at the same time'
        return item
      }
      count += 1
      return { ...item, segment: { ...item.segment, ...span } }
    })
    for (const line of own) {
      const segments = day.blocks[line].segments
      if (segments.every(isLeave)) leaveOnly += 1
      else if (segments.filter((segment) => !isLeave(segment)).length > 1) split += 1
    }
    if (!count && !error) continue
    const result = error ? { chips: day.blocks, error } : regroupDay(day.blocks, next)
    if (result.error) problems.push(`${shortName(day.member)}, ${formatHeader(day.day)} (${lowerFirst(result.error)})`)
    else {
      days.push([day.key, result.chips])
      changed += count
    }
  }
  const open: [string, OpenShiftEdit][] = []
  for (const { shift } of selection.open) {
    const span = applyTimes(shift, times)
    if (span) open.push([shift.id, span])
  }
  const extra = [...(split ? [`${plural(split, 'split assignment')} (set those one at a time)`] : []), ...problems]
  return { commit: { days, open }, changed: changed + open.length, skipped: skippedCells(selection, leaveOnly, extra) }
}

/**
 * Scheduled date: moves every selected, unlocked cell to `to`, as moving one assignment does. A person's cells from
 * several days all go to that day; when they would clash there, that person's cells stay. Open shifts stay too.
 */
export function moveCells(selection: BulkSelection, to: number): BulkResult {
  const days: [string, Chip[]][] = []
  const problems: string[] = []
  let changed = 0
  const byMember = new Map<string, BulkDay[]>()
  for (const day of selection.days) {
    if (day.day === to || !ownLines(day).length) continue
    byMember.set(day.member.id, [...(byMember.get(day.member.id) ?? []), day])
  }
  for (const sources of byMember.values()) {
    const member = sources[0].member
    const target = member.chips(to)
    const moving = sources.flatMap((day) => ownLines(day).map((line) => day.blocks[line]))
    const moved = moving.flatMap((chip, index) => chip.segments.map((segment: WorkforceSegment) => ({ segment: { ...segment, id: newId('m') }, from: target.length + index })))
    const result = regroupDay([...target, ...moving], [...flattenDay(target), ...moved])
    if (result.error) {
      problems.push(`${shortName(member)} (${lowerFirst(result.error)})`)
      continue
    }
    for (const day of sources) days.push([day.key, day.blocks.filter((_, line) => !ownLines(day).includes(line))])
    days.push([dayKey(member.id, to), result.chips])
    changed += moving.length
  }
  const locked = lockedCount(selection)
  const skipped = [
    ...(locked ? [plural(locked, 'locked cell')] : []),
    ...(selection.open.length ? [`${plural(selection.open.length, 'open shift')} (their date can’t change)`] : []),
    ...problems,
  ]
  return { commit: { days }, changed, skipped }
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
    if (result.error) problems.push(`${shortName(day.member)}, ${formatHeader(day.day)} (${lowerFirst(result.error)})`)
    else days.push([day.key, result.chips])
  }
  const skipped = [
    ...(selection.open.length ? [plural(selection.open.length, 'open shift')] : []),
    ...problems,
  ]
  return { commit: { days }, changed: days.length, skipped }
}
