import type { CalendarEventKind, CalendarView } from '../../tokens/calendar'
import { MOCK_TODAY, dayOf, formatFullDate, formatMonthDay, formatRange, formatWeekday, shiftRange, startOfWeek, weekdayIndex } from '../schedule/data'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export interface TaskReminder {
  /** e.g. "Day of event", "1 day before" */
  when: string
  /** e.g. "Every Sunday". Leave out for a one-off reminder. */
  repeats?: string
  /** e.g. "October 9, 2026" or "Until removed" */
  until?: string
  /** Only for tasks from a scheduler: has the employee acknowledged it? */
  acknowledged?: boolean
}

/** Extra details shown for an activity or overtime assignment. Everything is optional. */
export interface AssignmentDetails {
  hoursModifier?: string
  timebank?: string
  bankedHours?: string
  location?: { name: string; address?: string }
  activity?: string
  unit?: string
  rank?: string
  trackingTags?: { label: string; values: string[] }[]
  assets?: { label: string; values: string[] }[]
  /** A second activity inside the assignment, e.g. an unpaid lunch */
  additional?: { hours: string; activity: string; hoursModifier: string }
}

export interface LeaveDetails {
  /** Groups the days of one leave, so every day opens the same details */
  id: string
  from: { day: number; hour: number }
  to: { day: number; hour: number }
  /** Assignments the leave replaces */
  replaces: { day: number; start: number; end: number }[]
  rank: string
  unit: string
}

export interface CalendarEvent {
  id: string
  day: number
  title: string
  kind: CalendarEventKind
  /** Hours 0–24 (0.5 = 30 min). A task may have a start only. Leave out both for an all-day event. */
  start?: number
  end?: number
  pending?: boolean
  outOfUnit?: boolean
  cancelled?: boolean
  note?: string
  reminders?: TaskReminder[]
  /** Tasks: the activity the task belongs to */
  activity?: string
  /** Tasks set by someone else are read-only */
  assignedBy?: string
  details?: AssignmentDetails
  leave?: LeaveDetails
}

export interface SignUp {
  id: string
  day: number
  title: string
  start: number
  end: number
  activity: string
  tag: string
  overtime?: boolean
  splits?: number
  signUps: number
  positions: number
  filled: number
}

export interface Holiday {
  day: number
  title: string
}

export const isAllDay = (event: CalendarEvent) => event.start === undefined
export const isTimed = (event: CalendarEvent) => event.start !== undefined

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

/** 7.5 → "07:30", 24 → "24:00" */
export const formatTime = (hour: number) => {
  const minutes = Math.round(hour * 60)
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

export const formatTimeRange = (start: number, end: number) => `${formatTime(start)}–${formatTime(end)}`

/** 4.5 → "4h 30m", 0.75 → "45m" */
export const formatDuration = (hours: number) => {
  const minutes = Math.round(hours * 60)
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return [h && `${h}h`, m && `${m}m`].filter(Boolean).join(' ') || '0m'
}

/** "8.0 hrs" */
export const formatHours = (hours: number) => `${hours.toFixed(1)} hrs`

/** Time line of an event: "08:00–10:00", "Start time: 16:00" or "All day" */
export const eventTime = (event: CalendarEvent) =>
  event.start === undefined ? 'All day' : event.end === undefined ? `Start time: ${formatTime(event.start)}` : formatTimeRange(event.start, event.end)

/** Title as shown on the calendar: pending and tasks get a prefix. */
export const eventLabel = (event: CalendarEvent) => `${event.pending ? 'Pending: ' : ''}${event.kind === 'task' ? 'Task: ' : ''}${event.title}`

/** Accessible name of an event button. */
export function describeEvent(event: CalendarEvent) {
  const parts = [
    eventLabel(event),
    formatFullDate(event.day),
    eventTime(event),
    event.kind,
    event.outOfUnit && 'out of branch or unit',
    event.cancelled && 'cancelled',
    event.note && 'has a note',
    event.reminders?.length && 'has reminders',
  ]
  return parts.filter(Boolean).join(', ')
}

/** ISO week number */
export function weekNumber(day: number) {
  const thursday = day - weekdayIndex(day) + 3
  const year = new Date(thursday * 86_400_000).getUTCFullYear()
  return Math.floor((thursday - dayOf(year, 1, 1)) / 7) + 1
}

const monthYear = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const monthYearShort = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
const weekdayLong = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' })
const toDate = (day: number) => new Date(day * 86_400_000)

export const formatMonthYear = (day: number, short = false) => (short ? monthYearShort : monthYear).format(toDate(day))
export const formatWeekdayLong = (day: number) => weekdayLong.format(toDate(day))
/** "Fri, Jun 5, 2026" */
export const formatShortDate = (day: number) => `${formatWeekday(day)}, ${formatMonthDay(day)}, ${toDate(day).getUTCFullYear()}`

/* ------------------------------------------------------------------ */
/* Views                                                               */
/* ------------------------------------------------------------------ */

/** Days shown by a view. Month pads to whole weeks; agenda runs seven days from the anchor. */
export function viewDays(view: CalendarView, anchor: number): number[] {
  if (view === 'day') return [anchor]
  if (view === 'agenda') return Array.from({ length: 7 }, (_, index) => anchor + index)
  if (view === 'week') return Array.from({ length: 7 }, (_, index) => startOfWeek(anchor) + index)
  const d = toDate(anchor)
  const first = dayOf(d.getUTCFullYear(), d.getUTCMonth() + 1, 1)
  const last = dayOf(d.getUTCFullYear(), d.getUTCMonth() + 2, 0)
  const start = startOfWeek(first)
  const end = startOfWeek(last) + 6
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
}

export function stepView(view: CalendarView, anchor: number, direction: 1 | -1) {
  if (view === 'month') return shiftRange('month', anchor, direction)
  return anchor + direction * (view === 'day' ? 1 : 7)
}

/** Label of the date button. */
export function viewLabel(view: CalendarView, anchor: number, short = false) {
  if (view === 'month') return formatMonthYear(anchor, short)
  if (view === 'day') return short ? `${formatMonthDay(anchor)}, ${toDate(anchor).getUTCFullYear()}` : formatShortDate(anchor)
  const days = viewDays(view, anchor)
  if (!short) return formatRange(days)
  return sameMonth(days[0], days[6]) ? `${formatMonthDay(days[0])} – ${toDate(days[6]).getUTCDate()}` : `${formatMonthDay(days[0])} – ${formatMonthDay(days[6])}`
}

/** A new pay period starts every 14 days from Jun 1, 2026 (vertical line). */
const PERIOD_ANCHOR = dayOf(2026, 6, 1)
export const isPeriodStart = (day: number) => (((day - PERIOD_ANCHOR) % 14) + 14) % 14 === 0

/** Same-month check for dimming the leading and trailing days of the month view. */
export const sameMonth = (a: number, b: number) => toDate(a).getUTCMonth() === toDate(b).getUTCMonth()

/** Sort: all-day first, then by start time. */
export const byStart = (a: CalendarEvent, b: CalendarEvent) => (a.start ?? -1) - (b.start ?? -1) || a.title.localeCompare(b.title)

/* ------------------------------------------------------------------ */
/* Mock data. "Today" is Friday, June 5, 2026 at 10:30.                */
/* ------------------------------------------------------------------ */

export const MOCK_NOW = 10.5
export { MOCK_TODAY }

const jun = (date: number) => dayOf(2026, 6, date)
const jul = (date: number) => dayOf(2026, 7, date)

const PROFILE = { rank: 'Sergeant', unit: 'Patrol D4' }

let nextId = 0
const ev = (day: number, title: string, kind: CalendarEventKind, start?: number, end?: number, extra: Partial<CalendarEvent> = {}): CalendarEvent =>
  ({ id: `e${nextId++}`, day, title, kind, start, end, ...extra })

const vacation: LeaveDetails = {
  id: 'vacation-jun',
  from: { day: jun(17), hour: 0 },
  to: { day: jun(19), hour: 24 },
  replaces: [{ day: jun(17), start: 7, end: 15 }, { day: jun(18), start: 7, end: 15 }, { day: jun(19), start: 7, end: 15 }],
  ...PROFILE,
}

const pendingVacation: LeaveDetails = {
  id: 'vacation-jul',
  from: { day: jul(2), hour: 16 },
  to: { day: jul(3), hour: 24 },
  replaces: [{ day: jul(3), start: 7, end: 15 }],
  ...PROFILE,
}

const cleanDeskReminders: TaskReminder[] = [
  { when: 'Day of event', repeats: 'Every Sunday', until: 'October 9, 2026', acknowledged: true },
  { when: '1 day before', repeats: 'Every week', until: 'October 9, 2026', acknowledged: false },
]

/** Hand-made June 2026, matching the Figma frames. Other weeks are generated. */
function curatedEvents(): CalendarEvent[] {
  nextId = 0
  return [
    ev(jun(1), 'Weapon Training', 'overtime', 8, 10),
    ev(jun(1), 'Patrol D4', 'activity', 11, 19),
    ev(jun(2), 'Office Duty', 'activity', 10, 12),
    ev(jun(2), 'Office Duty', 'activity', 14.5, 17.5),
    ev(jun(3), 'Paperwork', 'activity', 7.5, 12),
    ev(jun(3), 'Compensating', 'leave', 12, 16),
    ev(jun(3), 'Court Appearance', 'activity', 7, 10.5, { pending: true }),
    ev(jun(4), 'Seawall Patrol', 'activity', 9.5, 12),
    ev(jun(5), 'Clean Desk', 'task', 6, undefined, { activity: 'Break', assignedBy: 'Sgt. Torres', reminders: cleanDeskReminders, note: 'Clear the desk before the audit on Monday.' }),
    ev(jun(5), 'Patrol G', 'activity', 5, 9),
    ev(jun(5), 'Patrol D', 'activity', 9, 14, { reminders: [{ when: 'Day of event' }] }),
    ev(jun(5), 'Detention Review', 'task', 16, 16.75, { activity: 'Paperwork', reminders: [{ when: 'Day of event' }] }),
    ev(jun(6), 'Course: De-escalation', 'activity', 6.5, 14),
    ev(jun(7), 'Submit Timesheet', 'task', 16, undefined, { activity: 'Paperwork' }),
    ev(jun(8), 'Traffic Detail', 'overtime', 7.5, 13.5),
    ev(jun(9), 'Renew Firearms Permit', 'task', 16, undefined, { note: 'Bring the range card.' }),
    ev(jun(9), 'Office Duty', 'activity', 14.5, 17.5),
    ev(jun(10), 'Community Patrol', 'activity', 16, 20),
    ev(jun(11), 'Gun Range', 'activity', 9.5, 14, { cancelled: true }),
    ev(jun(12), 'Security', 'overtime', 10, 20, {
      note: 'Hand the radio back to dispatch at the end of the shift.',
      details: {
        hoursModifier: 'OT · Overtime',
        timebank: 'Comp time',
        bankedHours: '04:30',
        location: { name: '911 Call Centre', address: '1147 Davie St, Vancouver, BC V6E 1N2' },
        activity: 'Patrol',
        trackingTags: [{ label: 'Laptop ID', values: ['#4654'] }, { label: 'Case IDs', values: ['#2202', '#ICQ401'] }],
        assets: [{ label: 'Vehicles', values: ['Cruiser #701', 'Air 1 #HB4282'] }],
        additional: { hours: '01:00', activity: 'Lunch', hoursModifier: 'Unpaid' },
      },
    }),
    ev(jun(15), 'Weapon Training', 'activity', 9.5, 13.5, { pending: true }),
    ev(jun(16), 'Security', 'overtime', 10, 12.5),
    ev(jun(16), 'Patrol D4', 'activity', 13, 17),
    ev(jun(17), 'Vacation', 'leave', undefined, undefined, { leave: vacation }),
    ev(jun(18), 'Vacation', 'leave', undefined, undefined, { leave: vacation }),
    ev(jun(19), 'Vacation', 'leave', undefined, undefined, { leave: vacation }),
    ev(jun(20), 'Meeting: Staff Shortage', 'overtime', 6.5, 13.5),
    ev(jun(20), 'Office Duty', 'activity', 7.5, 11),
    ev(jun(20), 'Order Uniform', 'task', 16),
    ev(jun(23), 'Meeting: New Gear', 'overtime', 7, 13.5),
    ev(jun(24), 'Check Radio Batteries', 'task', 8, undefined, { reminders: [{ when: 'Day of event' }] }),
    ev(jun(24), 'Sign Court Notice', 'task', 12, undefined, { reminders: [{ when: 'Day of event' }] }),
    ev(jun(24), 'Update Contact Card', 'task', 15, undefined, { reminders: [{ when: '1 day before' }] }),
    ev(jun(26), 'Compensating', 'leave', 12, 14),
    ev(jun(29), 'Court Appearance', 'activity', 6, 8),
    ev(jun(30), 'Seawall Patrol', 'activity', 7, 15, { outOfUnit: true, reminders: [{ when: 'Day of event' }], details: { unit: 'Marine Unit', activity: 'Patrol' } }),
    ev(jun(30), 'Traffic Detail', 'overtime', 15, 19),
    ev(jul(1), 'Security', 'overtime', 9, 16, { pending: true }),
    ev(jul(2), 'Office: Front Desk', 'activity', 8.5, 16),
    ev(jul(2), 'Vacation', 'leave', undefined, undefined, { pending: true, leave: pendingVacation }),
    ev(jul(3), 'Vacation', 'leave', undefined, undefined, { pending: true, leave: pendingVacation }),
    ev(jul(4), 'Community Patrol', 'activity', 12.5, 17),
  ]
}

const CURATED_FROM = jun(1)
const CURATED_TO = jul(5)

/** Simple rotation outside the hand-made weeks, so stepping through time is never empty. */
function generatedEvents(from: number, to: number): CalendarEvent[] {
  const events: CalendarEvent[] = []
  for (let day = from; day <= to; day++) {
    if (day >= CURATED_FROM && day <= CURATED_TO) continue
    const weekday = weekdayIndex(day)
    if (weekday < 4) events.push({ id: `g${day}`, day, title: 'Patrol D4', kind: 'activity', start: 7, end: 15 })
    else if (weekday === 4) events.push({ id: `g${day}`, day, title: 'Office Duty', kind: 'activity', start: 8, end: 16 })
    if (day % 9 === 0 && weekday < 5) events.push({ id: `g${day}-ot`, day, title: 'Traffic Detail', kind: 'overtime', start: 15, end: 19 })
    if (day % 11 === 0) events.push({ id: `g${day}-t`, day, title: 'Submit Timesheet', kind: 'task', start: 16 })
  }
  return events
}

/** The demo's starting events: June 2026 by hand, a year around it generated. */
export const initialEvents = (): CalendarEvent[] => [...curatedEvents(), ...generatedEvents(jun(1) - 190, jun(1) + 210)]

export const mockHolidays: Holiday[] = [
  { day: dayOf(2026, 5, 18), title: 'Victoria Day' },
  { day: jul(1), title: 'Canada Day' },
  { day: dayOf(2026, 8, 3), title: 'B.C. Day' },
]

export const mockSignUps: SignUp[] = [
  { id: 's1', day: jun(6), title: 'Long Weekend Coverage', start: 8, end: 16, activity: 'Extra Patrol', tag: 'OT - Min. Staffing', overtime: true, splits: 3, signUps: 3, positions: 2, filled: 2 },
  { id: 's2', day: jun(6), title: 'Parade Traffic Control', start: 10, end: 14, activity: 'Traffic Detail', tag: 'Paid Duty', signUps: 1, positions: 4, filled: 1 },
  { id: 's3', day: jun(26), title: 'Long Weekend Coverage', start: 8, end: 16, activity: 'Extra Patrol', tag: 'OT - Min. Staffing', overtime: true, splits: 3, signUps: 3, positions: 2, filled: 2 },
  { id: 's4', day: jun(26), title: 'Night Market Detail', start: 18, end: 23, activity: 'Special Detail', tag: 'Paid Duty', signUps: 2, positions: 3, filled: 0 },
  { id: 's5', day: jul(3), title: 'Long Weekend Coverage', start: 8, end: 16, activity: 'Extra Patrol', tag: 'OT - Min. Staffing', overtime: true, signUps: 0, positions: 2, filled: 0 },
]

export const PROFILE_DEFAULTS = PROFILE
