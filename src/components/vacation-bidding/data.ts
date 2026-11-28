import { MOCK_TODAY, dayNumber, dayOf, formatMonthDay, startOfWeek, weekdayIndex } from '../schedule/data'
import type { BidKind, BidMode, BidState, LeaveTypeKey, TeamBidStatus } from '../../tokens/bidding'

/* A "day" is the number of days since 1970-01-01 (UTC), as in schedule/data.ts. */

export interface BidRequest {
  id: string
  type: LeaveTypeKey
  start: number
  /** Same as start for a single day */
  end: number
  /** “HH:MM” on the first day; 00:00 by default */
  startTime?: string
  /** “HH:MM” on the last day; 24:00 (end of day) by default */
  endTime?: string
  note?: string
  /** Only these days are worked, between start and end (shift bids). All days when not set */
  days?: number[]
  /** A shift on offer this request is for (all at once, or a shift bid), and its name */
  shiftId?: string
  title?: string
  /** After an all-at-once bid closes */
  outcome?: 'awarded' | 'denied'
}

export const FULL_DAY = { start: '00:00', end: '24:00' }

/** Times, when the request does not cover full days: “08:00–16:00”. */
export const requestTimes = (request: Pick<BidRequest, 'startTime' | 'endTime'>) => {
  const start = request.startTime ?? FULL_DAY.start
  const end = request.endTime ?? FULL_DAY.end
  return start === FULL_DAY.start && end === FULL_DAY.end ? null : `${start}–${end}`
}

/** Hours left in each time bank on the request's start date (mock). */
export const timeBanks: { type: LeaveTypeKey; hours: number }[] = [
  { type: 'comp-time', hours: 44 },
  { type: 'vacation', hours: 82 },
]

export interface Bid {
  id: string
  title: string
  /** Vacation (your own leave requests) or shift bid (shifts on offer). Vacation when not set */
  kind?: BidKind
  mode: BidMode
  /** The leave period people bid on */
  period: [number, number]
  /** Time left in the bid window, e.g. “11h 45m” */
  remaining: string
  state: BidState
  /** Ranked: index 0 is your first choice */
  requests: BidRequest[]
  /** Employees ahead of you while queued */
  ahead: number
  submittedOn?: number
}

/** All at once: a block of leave the agency offers. Employees select and rank these instead of adding their own. */
export interface OfferedShift {
  id: string
  title: string
  start: number
  end: number
  startTime?: string
  endTime?: string
  /** Mock: someone with more seniority wants it too, so it is denied when the bid closes */
  contested?: boolean
  /** Shift bids: the days worked between start and end (all days when not set) */
  days?: number[]
  /** Shift bids: places, places already taken, and how many others signed up */
  slots?: number
  filled?: number
  signUps?: number
}

/** Shift bids: Full once every place is taken. */
export const isFull = (shift: OfferedShift) => shift.slots !== undefined && (shift.filled ?? 0) >= shift.slots

/**
 * Shift bids: title, first day (days after the bid period starts), length, times, weekdays worked (0 = Monday),
 * places, places taken, sign-ups, contested.
 */
const shiftPlan: [string, number, number, [string, string], number[], number, number, number, boolean][] = [
  ['Community', 43, 10, ['07:00', '15:00'], [0, 1, 2, 3, 4], 6, 1, 5, false],
  ['Day Patrol', 45, 12, ['08:00', '17:30'], [2, 3, 4, 5, 6], 6, 3, 5, false],
  ['Office: Admin', 64, 12, ['08:00', '16:00'], [0, 1, 2, 3, 4], 6, 0, 2, false],
  ['Night Patrol', 43, 14, ['22:00', '06:00'], [0, 1, 2, 3], 6, 6, 9, false],
  ['Security', 71, 12, ['06:00', '14:00'], [0, 1, 2, 3, 4], 6, 5, 7, true],
  ['Day Patrol: Weekends', 62, 23, ['08:00', '17:30'], [5, 6], 6, 3, 5, false],
]

const shiftOffersFor = (bid: Bid): OfferedShift[] =>
  shiftPlan.flatMap(([title, offset, length, times, weekdays, slots, filled, signUps, contested], index) => {
    const start = bid.period[0] + offset
    const end = Math.min(bid.period[1], start + length - 1)
    const days = Array.from({ length: end - start + 1 }, (_, i) => start + i).filter((day) => weekdays.includes(weekdayIndex(day)))
    if (start > bid.period[1] || !days.length) return []
    /*
     * Once closed, everyone who signed up got a place, up to the places there are. Contested shifts went to people
     * with more seniority, so they are full. Your awarded place counts too.
     */
    const id = `${bid.id}-offer-${index}`
    const youAwarded = bid.requests.some((request) => request.shiftId === id && request.outcome === 'awarded')
    const taken = bid.state !== 'closed' ? filled : contested ? slots : Math.min(slots, signUps + (youAwarded ? 1 : 0))
    return [{ id, title, start: days[0], end: days[days.length - 1], startTime: times[0], endTime: times[1], days, slots, filled: taken, signUps, contested }]
  })

/** Title, first day (days after the bid period starts), length, times, contested. */
const offerPlan: [(season: string) => string, number, number, [string, string] | null, boolean][] = [
  [(season) => `${season} Block A: No Weekends`, 13, 12, null, false],
  [(season) => `${season} Block A: Incl. Weekends`, 13, 14, null, false],
  [() => 'Holiday Week', 27, 7, null, true],
  [() => 'Day Watch Week', 41, 5, ['07:00', '15:00'], false],
  [(season) => `${season} Block B: Incl. Weekends`, 69, 14, null, true],
  [() => 'Half Days', 83, 5, ['10:00', '14:00'], false],
]

/** The shifts on offer in an all-at-once bid (mock). */
export const offeredShiftsFor = (bid: Bid): OfferedShift[] => {
  if (bid.kind === 'shift') return shiftOffersFor(bid)
  const season = bid.title.split(' ')[0]
  return offerPlan.map(([title, offset, length, times, contested], index) => ({
    id: `${bid.id}-offer-${index}`,
    title: title(season),
    start: bid.period[0] + offset,
    end: Math.min(bid.period[1], bid.period[0] + offset + length - 1),
    ...(times ? { startTime: times[0], endTime: times[1] } : {}),
    contested,
  }))
}

/** A request for a shift on offer. */
export const requestForShift = (shift: OfferedShift): BidRequest => ({
  id: `request-${shift.id}`, type: 'vacation', start: shift.start, end: shift.end, startTime: shift.startTime, endTime: shift.endTime, days: shift.days, shiftId: shift.id, title: shift.title,
})

/** Whether a request covers a day: inside its range and, for shifts, one of its days. */
export const coversDay = (request: Pick<BidRequest, 'start' | 'end' | 'days'>, day: number) =>
  day >= request.start && day <= request.end && (!request.days || request.days.includes(day))

/** Days a request covers: every day of the range, or only the shift's days. */
export const requestDayCount = (request: Pick<BidRequest, 'start' | 'end' | 'days'>) => request.days?.length ?? request.end - request.start + 1

const year = (day: number) => new Date(day * 86_400_000).getUTCFullYear()

const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
const monthOf = (day: number) => new Date(day * 86_400_000).getUTCMonth()

/** Short range for the Date Range field: “Jun 15 – 22, 2027”, “Jun 28 – Jul 3, 2027”. */
export function formatRangeShort(start: number, end: number) {
  if (start === end || year(start) !== year(end)) return formatSpan(start, end)
  const tail = monthOf(start) === monthOf(end) ? String(dayNumber(end)) : monthDay.format(new Date(end * 86_400_000))
  return `${monthDay.format(new Date(start * 86_400_000))} – ${tail}, ${year(end)}`
}

/** “Jun 15, 2027”, or “Jun 15 – Jun 24, 2027”, with both years when they differ. */
export function formatSpan(start: number, end: number) {
  if (start === end) return `${formatMonthDay(start)}, ${year(start)}`
  if (year(start) === year(end)) return `${formatMonthDay(start)} – ${formatMonthDay(end)}, ${year(end)}`
  return `${formatMonthDay(start)}, ${year(start)} – ${formatMonthDay(end)}, ${year(end)}`
}

export const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

export const spanDays = (request: Pick<BidRequest, 'start' | 'end'>) => request.end - request.start + 1

/** Weeks (Monday first) that cover a request, for the calendar under an open row. */
export function requestWeeks(request: Pick<BidRequest, 'start' | 'end'>): number[][] {
  const weeks: number[][] = []
  for (let monday = startOfWeek(request.start); monday <= request.end; monday += 7) {
    weeks.push(Array.from({ length: 7 }, (_, index) => monday + index))
  }
  return weeks
}

/** Day number in a calendar cell. The first of a month (and the first cell) also names the month. */
export const calendarDayLabel = (day: number, first: boolean) => (first || dayNumber(day) === 1 ? formatMonthDay(day) : String(dayNumber(day)))

export const SUBMITTED_ON = MOCK_TODAY

const summer = { id: 'summer', title: 'Summer Vacation Bid', period: [dayOf(2027, 6, 1), dayOf(2027, 8, 30)] as [number, number], remaining: '11h 45m', requests: [], ahead: 0 }
const spring = { id: 'spring', title: 'Spring Vacation Bid', period: [dayOf(2027, 3, 1), dayOf(2027, 5, 31)] as [number, number], remaining: '4 days 2h', requests: [], ahead: 3 }
const winter = { id: 'winter', title: 'Winter Vacation Bid', period: [dayOf(2026, 10, 1), dayOf(2027, 1, 30)] as [number, number], remaining: '', ahead: 0, submittedOn: dayOf(2026, 5, 20) }
const fall = { id: 'fall', title: 'Fall Vacation Bid', period: [dayOf(2026, 9, 1), dayOf(2026, 11, 30)] as [number, number], remaining: '', requests: [], ahead: 0 }
const holiday = { id: 'holiday', title: 'Holiday Vacation Bid', period: [dayOf(2026, 12, 14), dayOf(2027, 1, 3)] as [number, number], remaining: '', requests: [], ahead: 0, submittedOn: dayOf(2026, 5, 28) }

/** One bid per state, so every card in the list is a different example. Pending: submit the Summer bid. */
const turnBasedBids = (): Bid[] => [
  { ...summer, mode: 'turn-based', state: 'your-turn' },
  { ...spring, mode: 'turn-based', state: 'queued' },
  {
    ...winter, mode: 'turn-based', state: 'closed', requests: [
      { id: 'winter-1', type: 'vacation', start: dayOf(2026, 10, 12), end: dayOf(2026, 10, 16), note: 'Family visit', outcome: 'awarded' },
      { id: 'winter-2', type: 'banked-ot', start: dayOf(2026, 11, 23), end: dayOf(2026, 11, 25), outcome: 'denied' },
      { id: 'winter-3', type: 'comp-time', start: dayOf(2026, 12, 28), end: dayOf(2026, 12, 28), outcome: 'awarded' },
    ],
  },
  { ...fall, mode: 'turn-based', state: 'expired' },
  { ...holiday, mode: 'turn-based', state: 'taken-down' },
]

const allAtOnceBids = (): Bid[] => {
  const closed: Bid = { ...winter, mode: 'all-at-once', state: 'closed', requests: [] }
  const offers = offeredShiftsFor(closed)
  closed.requests = [offers[0], offers[2], offers[3]].map((shift) => ({ ...requestForShift(shift), outcome: shift.contested ? 'denied' : 'awarded' }))
  return [
    { ...summer, mode: 'all-at-once', state: 'open' },
    closed,
    { ...fall, mode: 'all-at-once', state: 'expired' },
    { ...holiday, mode: 'all-at-once', state: 'taken-down' },
  ]
}

/* ---------- Shift bids ---------- */

const winterCoverage = { id: 'winter-coverage', title: 'Winter Coverage 2026', kind: 'shift' as const, period: [dayOf(2026, 11, 1), dayOf(2027, 1, 31)] as [number, number], remaining: '11h 45m', requests: [], ahead: 0 }
const springCoverage = { id: 'spring-coverage', title: 'Spring Coverage 2027', kind: 'shift' as const, period: [dayOf(2027, 3, 1), dayOf(2027, 5, 31)] as [number, number], remaining: '4 days 2h', requests: [], ahead: 3 }
const fallCoverage = { id: 'fall-coverage', title: 'Fall Coverage 2026', kind: 'shift' as const, period: [dayOf(2026, 8, 1), dayOf(2026, 10, 31)] as [number, number], remaining: '', ahead: 0, submittedOn: dayOf(2026, 5, 12) }
const spring2026 = { id: 'spring-2026', title: 'Spring 2026', kind: 'shift' as const, period: [dayOf(2026, 3, 1), dayOf(2026, 6, 30)] as [number, number], remaining: '', requests: [], ahead: 0 }
const summerCoverage = { id: 'summer-coverage', title: 'Summer Coverage 2026', kind: 'shift' as const, period: [dayOf(2026, 6, 1), dayOf(2026, 8, 31)] as [number, number], remaining: '', requests: [], ahead: 0, submittedOn: dayOf(2026, 5, 20) }

/** A closed shift bid: three ranked shifts, the contested ones denied. */
const closedShiftBid = (mode: BidMode): Bid => {
  const closed: Bid = { ...fallCoverage, mode, state: 'closed', requests: [] }
  const offers = offeredShiftsFor(closed)
  closed.requests = [offers[1], offers[0], offers[4]].filter(Boolean).map((shift) => ({ ...requestForShift(shift), outcome: shift.contested ? 'denied' : 'awarded' }))
  return closed
}

/** One shift bid per state, as for vacation bids. Spring 2026 closed before you picked, so it is Missed. */
const shiftBids = (mode: BidMode): Bid[] => [
  { ...winterCoverage, mode, state: mode === 'turn-based' ? 'your-turn' : 'open' },
  ...(mode === 'turn-based' ? [{ ...springCoverage, mode, state: 'queued' as const }] : []),
  closedShiftBid(mode),
  { ...spring2026, mode, state: 'expired' },
  { ...summerCoverage, mode, state: 'taken-down' },
]

export const initialBids = (mode: BidMode = 'turn-based', kind: BidKind = 'vacation'): Bid[] =>
  kind === 'shift' ? shiftBids(mode) : mode === 'turn-based' ? turnBasedBids() : allAtOnceBids()

/* ---------- Team Bids ---------- */

export interface TeamBid {
  id: string
  name: string
  status: TeamBidStatus
  start: number
  end: number
}

/** Name, status, first day (days after the bid period starts) and length. Laid out for the Summer bid (Jun 1). */
const teamPlan: [string, TeamBidStatus, number, number][] = [
  ['Alvarez', 'awarded', 6, 5], ['Brennan', 'awarded', 13, 5], ['Chen', 'pending', 14, 5], ['Delgado', 'pending', 20, 5],
  ['Okafor', 'awarded', 27, 5], ['Kowalski', 'pending', 28, 5], ['Haas', 'pending', 29, 3], ['Quinn', 'awarded', 30, 2], ['Nakamura', 'pending', 30, 1],
  ['Sullivan', 'awarded', 41, 5], ['Torres', 'pending', 48, 5], ['Murphy', 'pending', 48, 1], ['Fisher', 'awarded', 55, 5],
  ['Reyes', 'awarded', 62, 5], ['Kent', 'pending', 64, 1], ['Jackson', 'pending', 69, 5],
  ['Taylor', 'awarded', 76, 5], ['Parker', 'pending', 76, 2], ['Jordan', 'pending', 76, 1], ['Adams', 'pending', 77, 1], ['Vance', 'awarded', 83, 5],
]

/** Everyone else's leave in a bid (mock): awarded and pending, inside the bid period. */
export const teamBidsFor = (bid: Bid): TeamBid[] =>
  teamPlan
    .map(([name, status, offset, length], index) => ({ id: `${bid.id}-team-${index}`, name, status, start: bid.period[0] + offset, end: Math.min(bid.period[1], bid.period[0] + offset + length - 1) }))
    .filter((item) => item.start <= bid.period[1])

/* ---------- View Sign-Ups (all at once) ---------- */

export interface SignUp {
  name: string
  rank: 'Lieutenant' | 'Sergeant' | 'Police Officer'
  /** True when awarded, false when not (closed); not set while still pending */
  awarded?: boolean
  you?: boolean
}

/** Everyone else who signed up, in the List Organizer's order (mock). `awarded` is what they get when the bid closes. */
const otherSignUps: [string, SignUp['rank'], boolean][] = [
  ['Mei Delgado', 'Lieutenant', true], ['Bram Abbas', 'Lieutenant', false], ['Ida Brandt', 'Sergeant', false], ['Gabriel Haddad', 'Sergeant', false],
  ['Carlos Marino', 'Sergeant', true], ['Rafael Bianchi', 'Sergeant', false], ['Antoine Mensah', 'Sergeant', true], ['Mateo Fujimoto', 'Sergeant', false],
  ['Arjun Ortega', 'Sergeant', true], ['Amir Dijkstra', 'Police Officer', false], ['Alex Bergman', 'Police Officer', false],
]

/** Where you sit in the List Organizer's order */
const YOUR_PLACE = 4

/**
 * Sign-ups for an all-at-once bid. You appear once you submit. Nobody knows who is awarded until the bid closes,
 * so `awarded` is only set on a closed bid.
 */
export function signUpsFor(bid: Bid): SignUp[] {
  const closed = bid.state === 'closed'
  const list: SignUp[] = otherSignUps.map(([name, rank, awarded]) => ({ name, rank, awarded: closed ? awarded : undefined }))
  if (bid.submittedOn !== undefined && bid.state !== 'expired') {
    const youAwarded = bid.requests.some((request) => request.outcome === 'awarded')
    list.splice(YOUR_PLACE, 0, { name: 'John B. McLane', rank: 'Sergeant', you: true, awarded: closed ? youAwarded : undefined })
  }
  return list
}

/**
 * Shift bids: who signed up for one shift, in the List Organizer's order. You appear once your bid is submitted
 * with the shift in it. Awarded matches the places filled: turn-based, the employees who bid before you took them;
 * all at once, nobody is awarded until the bid closes.
 */
export function shiftSignUpsFor(bid: Bid, shift: OfferedShift): SignUp[] {
  const index = Number(shift.id.split('-').pop()) || 0
  const count = shift.signUps ?? 0
  const closed = bid.state === 'closed'
  const mine = bid.submittedOn !== undefined && bid.state !== 'expired' ? bid.requests.find((request) => request.shiftId === shift.id) : undefined
  /* Your awarded place counts toward the places filled */
  const othersAwarded = (shift.filled ?? 0) - (mine?.outcome === 'awarded' ? 1 : 0)
  const others = Array.from({ length: count }, (_, i) => otherSignUps[(index * 3 + i) % otherSignUps.length])
  const known = closed || bid.mode === 'turn-based'
  /* Not awarded yet while the bid is live: undefined, shown as Pending */
  const list: SignUp[] = others.map(([name, rank], i) => ({ name, rank, awarded: known && i < othersAwarded ? true : closed ? false : undefined }))
  if (mine) {
    /* Right after the employees who were awarded a place, once that is known */
    list.splice(Math.min(known ? othersAwarded : YOUR_PLACE, list.length), 0, { name: 'John B. McLane', rank: 'Sergeant', you: true, awarded: closed ? mine.outcome === 'awarded' : undefined })
  }
  return list
}

/** Moves the item at `from` to `to`, shifting the ones in between. */
export function move<T>(list: T[], from: number, to: number): T[] {
  if (from === to || to < 0 || to >= list.length) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}
