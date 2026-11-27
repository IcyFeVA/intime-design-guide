import { formatHeader, segmentHours, segmentKind, type Chip } from '../schedule/data'
import { dayKey, findWatch, HOME_BRANCH, shortName, stillNeeded, type OpenShift, type WorkforceMember, type WorkforceSegment } from './data'
import { assignDay } from './model'
import { hoursSummary } from './hours'
import { dayWarnings, type ScheduleWarning } from './warnings'
import { segmentDetails } from './panel/options'
import { formatSpan } from './panel/format'

/* ------------------------------------------------------------------ */
/* Fill: give an open shift to people, picked from a list of candidates */
/* ------------------------------------------------------------------ */

/** What a person gets when they fill the shift: its segment with its fields (location, activity…), and its branch */
export function openShiftChip(shift: OpenShift): Chip {
  const segment: WorkforceSegment = { code: shift.code, start: shift.start, end: shift.end, details: shift.details }
  const chip: Chip = { segments: [{ ...segment, details: segmentDetails(segment, findWatch(shift.watch).unit, shift.id, shift.location) } as WorkforceSegment] }
  if (shift.branch && shift.branch !== HOME_BRANCH) chip.branch = shift.branch
  return chip
}

/** "PatS 12:00–22:00, Tue, Jun 2" */
export const describeShift = (shift: OpenShift) => `${shift.code} ${formatSpan(shift.start, shift.end)}, ${formatHeader(shift.day)}`

export type FillGroup = 'available' | 'warnings' | 'busy'

export interface FillCandidate {
  member: WorkforceMember
  group: FillGroup
  /** Why they can't take it: "Works PatS 12:00–22:00", "On Vac" */
  busy?: string
  /** What filling it would warn about (rest, hours cap, certification) */
  warnings: ScheduleWarning[]
  /** Hours scheduled this week, before the shift */
  weekHours: number
  /** Their other work that day, or null for a day off */
  sameDay: string | null
}

const spanOf = (chip: Chip) => {
  const hours = chip.segments.map(segmentHours)
  return { start: Math.min(...hours.map((h) => h.start)), end: Math.max(...hours.map((h) => h.end)) }
}
const chipLabel = (chip: Chip) => {
  const { start, end } = spanOf(chip)
  return `${chip.segments[0].code} ${formatSpan(start, end)}`
}

/** The person's cell that is at the same time as the shift: they're busy then */
function clashOf(chips: Chip[], shift: OpenShift): string | undefined {
  const clash = chips.find((chip) => {
    const { start, end } = spanOf(chip)
    return start < shift.end && end > shift.start
  })
  if (!clash) return undefined
  if (clash.segments.every((segment) => segmentKind(segment) === 'leave')) return `On ${clash.segments[0].code}`
  if (clash.locked) return `${chipLabel(clash)} set by ${clash.locked}`
  return `Works ${chipLabel(clash)}${clash.branch ? ` at ${clash.branch.split(' - ')[0]}` : ''}`
}

/** Everyone who could fill the shift, with what stops them or what it would warn about */
export function fillCandidates(shift: OpenShift, people: WorkforceMember[]): FillCandidate[] {
  const chip = openShiftChip(shift)
  return people.map((member) => {
    const chips = member.chips(shift.day)
    const weekHours = hoursSummary(member, shift.day).week.scheduled
    const sameDay = chips.length ? chips.map(chipLabel).join(', ') : null
    const busy = clashOf(chips, shift)
    if (busy) return { member, group: 'busy', busy, warnings: [], weekHours, sameDay }
    const result = assignDay(chips, [], chip)
    if (result.error) return { member, group: 'busy', busy: result.error[0].toUpperCase() + result.error.slice(1), warnings: [], weekHours, sameDay }
    const after: WorkforceMember = { ...member, chips: (day) => (day === shift.day ? result.chips : member.chips(day)) }
    const warnings = dayWarnings(after, shift.day)
    return { member, group: warnings.length ? 'warnings' : 'available', warnings, weekHours, sameDay }
  })
}

export type FindList = 'best' | 'hours' | 'precedence'

export const findLists: { value: FindList; label: string; description: string }[] = [
  { value: 'best', label: 'Best match', description: 'Same watch first, then fewest hours this week' },
  { value: 'hours', label: 'Fewest hours', description: 'Fewest hours scheduled this week first' },
  { value: 'precedence', label: 'Precedence', description: 'By precedence number, lowest first' },
]

const groupOrder: Record<FillGroup, number> = { available: 0, warnings: 1, busy: 2 }

/** Candidates in a find list's order: available, then with warnings, then busy */
export function sortCandidates(candidates: FillCandidate[], shift: OpenShift, list: FindList): FillCandidate[] {
  const compare = (a: FillCandidate, b: FillCandidate) => {
    if (list === 'precedence') return a.member.precedence - b.member.precedence
    if (list === 'best') {
      const watch = Number(b.member.watch === shift.watch) - Number(a.member.watch === shift.watch)
      if (watch) return watch
    }
    return a.weekHours - b.weekHours
  }
  return [...candidates].sort((a, b) => groupOrder[a.group] - groupOrder[b.group] || a.warnings.length - b.warnings.length || compare(a, b)
    || a.member.last.localeCompare(b.member.last))
}

/** Auto Fill: the first people the list offers who can take it without a warning, as many as still needed */
export const autoFill = (sorted: FillCandidate[], shift: OpenShift) =>
  sorted.filter((candidate) => candidate.group === 'available').slice(0, stillNeeded(shift)).map((candidate) => candidate.member.id)

/**
 * Gives the shift to `people` (in order, while places are left). Busy people are skipped. The open shift's
 * `filled` count goes up by the people who got it, so it leaves the grid once nobody else is needed.
 */
export function fillOpenShift(shift: OpenShift, people: WorkforceMember[]) {
  const chip = openShiftChip(shift)
  const days: [string, Chip[]][] = []
  const filled: WorkforceMember[] = []
  const skipped: string[] = []
  let places = stillNeeded(shift)
  for (const member of people) {
    const who = shortName(member)
    if (places <= 0) { skipped.push(`${who} (nobody else is needed)`); continue }
    const chips = member.chips(shift.day)
    const busy = clashOf(chips, shift)
    if (busy) { skipped.push(`${who} (${busy[0].toLowerCase()}${busy.slice(1)})`); continue }
    const result = assignDay(chips, [], chip)
    if (result.error) { skipped.push(`${who} (${result.error})`); continue }
    days.push([dayKey(member.id, shift.day), result.chips])
    filled.push(member)
    places -= 1
  }
  return { days, filled, skipped, left: places, filledCount: (shift.filled ?? 0) + filled.length }
}
