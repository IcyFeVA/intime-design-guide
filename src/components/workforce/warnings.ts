import { formatDuration, formatHeader, formatMonthDay, segmentHours, segmentKind, weekdayIndex, type Chip, type Segment } from '../schedule/data'
import { subtract, type Span, type WorkforceMember, type WorkforceSegment } from './data'
import { activityOf } from './panel/options'
import { formatSpan } from './panel/format'

/* ------------------------------------------------------------------ */
/* Scheduling warnings. They never block a change: it saves, then the  */
/* warning shows in the panel and as a mark on the grid cell.          */
/* ------------------------------------------------------------------ */

/** Hours someone may work in a week (Monday to Sunday) before the hours cap warns */
export const WEEKLY_HOURS_CAP = 60
/** Hours off someone needs between one day's work and the next */
export const MIN_REST_HOURS = 8

export type WarningKind = 'conflict' | 'rest' | 'qualification' | 'hours'

export interface ScheduleWarning {
  kind: WarningKind
  /** "Over weekly hours cap" */
  title: string
  /** "Week of Jun 1 · 60h of 50h" */
  detail: string
  /** The day's cells (blocks) it is about, by index: they get the ⚠ mark */
  blocks: number[]
}

const isLeave = (segment: Segment) => segmentKind(segment) === 'leave'
const isWork = (segment: Segment) => !isLeave(segment) && !segment.cancelled
/** "PatD 07:00–17:00" */
const label = (segment: Segment) => `${segment.code} ${formatSpan(segmentHours(segment).start, segmentHours(segment).end)}`
const place = (chip: Chip) => (chip.branch ? chip.branch.split(' - ')[0] : chip.outOfUnit ? chip.unit ?? 'another unit' : null)

/** What's left of `span` once the leave is taken off */
const minusLeave = (span: Span, leave: Span[]) => leave.reduce<Span[]>((spans, off) => spans.flatMap((part) => subtract(part, off)), [span])

/** Hours worked on a day, wherever they're worked: working segments minus any leave over them */
export function workedHours(chips: Chip[]): number {
  const segments = chips.flatMap((chip) => chip.segments)
  const leave = segments.filter(isLeave).map(segmentHours)
  return segments.filter(isWork).reduce((total, segment) =>
    total + minusLeave(segmentHours(segment), leave).reduce((sum, part) => sum + part.end - part.start, 0), 0)
}

/** Double booked (working twice at once) or on leave for a whole assignment */
function conflicts(chips: Chip[]): ScheduleWarning[] {
  const warnings: ScheduleWarning[] = []
  const work = chips.flatMap((chip, block) => chip.segments.filter(isWork).map((segment) => ({ segment, block, span: segmentHours(segment) })))
  for (const [i, a] of work.entries()) {
    for (const b of work.slice(i + 1)) {
      if (a.block === b.block || a.span.start >= b.span.end || b.span.start >= a.span.end) continue
      const where = place(chips[b.block]) ?? place(chips[a.block])
      warnings.push({
        kind: 'conflict',
        title: where ? `Double booked with ${where}` : 'Double booked',
        detail: `${label(a.segment)} overlaps ${label(b.segment)}`,
        blocks: [a.block, b.block],
      })
    }
  }
  const leave = chips.flatMap((chip) => chip.segments.filter(isLeave))
  for (const { segment, block, span } of work) {
    const covering = leave.filter((off) => segmentHours(off).start < span.end && segmentHours(off).end > span.start)
    if (!covering.length || minusLeave(span, covering.map(segmentHours)).length) continue
    warnings.push({ kind: 'conflict', title: `Already on ${covering[0].code}`, detail: `For all of ${label(segment)}`, blocks: [block] })
  }
  return warnings
}

/** Too little rest between the last work on the two days before and the day's first work */
function rest(member: WorkforceMember, day: number, chips: Chip[]): ScheduleWarning | null {
  const first = chips
    .flatMap((chip, block) => chip.segments.filter(isWork).map((segment) => ({ segment, block, start: segmentHours(segment).start })))
    .sort((a, b) => a.start - b.start)[0]
  if (!first) return null
  let previous: { segment: Segment; day: number; end: number } | null = null
  for (const before of [day - 1, day - 2]) {
    for (const segment of member.chips(before).flatMap((chip) => chip.segments).filter(isWork)) {
      const end = segmentHours(segment).end - (day - before) * 24
      if (!previous || end > previous.end) previous = { segment, day: before, end }
    }
  }
  if (!previous) return null
  const gap = first.start - previous.end
  if (gap >= MIN_REST_HOURS) return null
  const after = `${previous.segment.code} on ${formatHeader(previous.day)}`
  return {
    kind: 'rest',
    title: gap > 0 ? `Only ${formatDuration(gap)} rest after ${after}` : `No rest after ${after}`,
    detail: `${MIN_REST_HOURS}h minimum · ${label(first.segment)}`,
    blocks: [first.block],
  }
}

/** Activities the person isn't certified for. A segment's activity is its own field, or its shift code's. */
function qualifications(member: WorkforceMember, chips: Chip[]): ScheduleWarning[] {
  return (member.lacks ?? []).flatMap((activity) => {
    const hits = chips.flatMap((chip, block) => chip.segments
      .filter((segment: WorkforceSegment) => isWork(segment) && (segment.details?.activity ?? activityOf(segment.code)) === activity)
      .map((segment) => ({ segment, block })))
    if (!hits.length) return []
    return [{ kind: 'qualification' as const, title: `Not certified for ${activity}`, detail: hits.map((hit) => label(hit.segment)).join(', '), blocks: [...new Set(hits.map((hit) => hit.block))] }]
  })
}

/** Over the weekly cap: warns from the day the week's hours go over, on each day with work after that */
function hoursCap(member: WorkforceMember, day: number, chips: Chip[]): ScheduleWarning | null {
  const today = workedHours(chips)
  if (!today) return null
  const monday = day - weekdayIndex(day)
  const hoursOn = (d: number) => (d === day ? today : workedHours(member.chips(d)))
  let upToToday = 0
  for (let d = monday; d <= day; d += 1) upToToday += hoursOn(d)
  if (upToToday <= WEEKLY_HOURS_CAP) return null
  let week = upToToday
  for (let d = day + 1; d < monday + 7; d += 1) week += hoursOn(d)
  const block = chips.findIndex((chip) => chip.segments.some(isWork))
  return { kind: 'hours', title: 'Over weekly hours cap', detail: `Week of ${formatMonthDay(monday)} · ${formatDuration(week)} of ${WEEKLY_HOURS_CAP}h`, blocks: [block] }
}

/** Everything to warn about on a person's day, most serious first */
export function dayWarnings(member: WorkforceMember, day: number): ScheduleWarning[] {
  const chips = member.chips(day)
  if (!chips.length) return []
  return [
    ...conflicts(chips),
    rest(member, day, chips),
    ...qualifications(member, chips),
    hoursCap(member, day, chips),
  ].filter((warning): warning is ScheduleWarning => warning !== null)
}
