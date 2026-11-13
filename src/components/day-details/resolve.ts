import type { CalendarEvent } from '../calendar/events'
import { dayOf } from '../schedule/data'

/** One scheduled activity on the day, before leave is applied. Hours 0–24. */
export interface DayActivity {
  id: string
  /** Shift code or activity name, e.g. "PatG" */
  title: string
  start: number
  end: number
  kind?: 'activity' | 'overtime'
}

/** Leave on the day. With `replaces` it covers one activity; without, it covers the whole day. */
export interface DayLeave {
  /** e.g. "Vacation", "Sick" */
  type: string
  /** Id of the activity the leave replaces. Leave out for an all-day leave. */
  replaces?: string
}

type Span = [number, number]

/** `span` minus every span in `cuts`, as zero or more pieces. */
function subtract(span: Span, cuts: Span[]): Span[] {
  let pieces: Span[] = [span]
  for (const [cutStart, cutEnd] of cuts) {
    pieces = pieces.flatMap(([start, end]): Span[] => {
      if (cutEnd <= start || cutStart >= end) return [[start, end]]
      return ([[start, cutStart], [cutEnd, end]] as Span[]).filter(([a, b]) => b > a)
    })
  }
  return pieces
}

/**
 * Turns the scheduled activities and leave for a day into what the day details show.
 * Leave always wins:
 * - All-day leave: an "On Leave: <type>" bar in the all-day row, and every activity becomes "<type> from: <activity>".
 * - Leave on one activity: that activity's hours become leave. Where it overlapped another activity, the block says
 *   "<type> from: <activity>", and the other activity is cut back to start or end at the leave.
 */
export function resolveDay(day: number, activities: DayActivity[], leaves: DayLeave[]): CalendarEvent[] {
  const allDay = leaves.find((leave) => !leave.replaces)
  if (allDay) {
    return [
      { id: 'all-day-leave', day, kind: 'leave', title: `On Leave: ${allDay.type}` },
      ...activities.map((activity): CalendarEvent => ({
        id: activity.id, day, kind: 'leave', title: `${allDay.type} from: ${activity.title}`, start: activity.start, end: activity.end,
      })),
    ]
  }

  const leaveFor = new Map(leaves.map((leave) => [leave.replaces!, leave.type]))
  const replaced = activities.filter((activity) => leaveFor.has(activity.id))
  const kept = activities.filter((activity) => !leaveFor.has(activity.id))
  const events: CalendarEvent[] = []

  for (const activity of replaced) {
    const type = leaveFor.get(activity.id)!
    const overlaps = kept
      .map((other): Span => [Math.max(activity.start, other.start), Math.min(activity.end, other.end)])
      .filter(([start, end]) => end > start)
    subtract([activity.start, activity.end], overlaps).forEach(([start, end], index) =>
      events.push({ id: `${activity.id}-leave-${index}`, day, kind: 'leave', title: type, start, end }))
    overlaps.forEach(([start, end], index) =>
      events.push({ id: `${activity.id}-overlap-${index}`, day, kind: 'leave', title: `${type} from: ${activity.title}`, start, end }))
  }

  const leaveSpans = replaced.map((activity): Span => [activity.start, activity.end])
  for (const activity of kept) {
    subtract([activity.start, activity.end], leaveSpans).forEach(([start, end], index) =>
      events.push({ id: `${activity.id}-${index}`, day, kind: activity.kind ?? 'activity', title: activity.title, start, end }))
  }

  return events.sort((a, b) => (a.start ?? -1) - (b.start ?? -1))
}

/* ------------------------------------------------------------------ */
/* Mock scenarios                                                      */
/* ------------------------------------------------------------------ */

export const DAY_DETAILS_DAY = dayOf(2026, 9, 23)
export const DAY_DETAILS_NOW = 10.5

export type DayScenarioKey = 'back-to-back' | 'partial-leave' | 'all-day-leave'

export interface DayScenario {
  key: DayScenarioKey
  label: string
  name: string
  activities: DayActivity[]
  leaves: DayLeave[]
}

const patG = (end: number): DayActivity => ({ id: 'patg', title: 'PatG', start: 3, end })
const patD: DayActivity = { id: 'patd', title: 'PatD', start: 7, end: 12 }

export const dayScenarios: DayScenario[] = [
  { key: 'back-to-back', label: 'Back-to-back', name: 'Ronald Richards', activities: [patG(7), patD], leaves: [] },
  { key: 'partial-leave', label: 'Leave on one activity', name: 'Ronald Richards', activities: [patG(8), patD], leaves: [{ type: 'Vacation', replaces: 'patg' }] },
  { key: 'all-day-leave', label: 'All-day leave', name: 'Ronald Richards', activities: [patG(7), patD], leaves: [{ type: 'Vacation' }] },
]

export const findScenario = (key: DayScenarioKey) => dayScenarios.find((scenario) => scenario.key === key)!
