import { MOCK_TODAY, dayNumber, dayOf, formatMonthDay, startOfWeek } from '../schedule/data'
import type { BidMode, BidState, LeaveTypeKey } from '../../tokens/bidding'

/* A "day" is the number of days since 1970-01-01 (UTC), as in schedule/data.ts. */

export interface BidRequest {
  id: string
  type: LeaveTypeKey
  start: number
  /** Same as start for a single day */
  end: number
  note?: string
}

export interface Bid {
  id: string
  title: string
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

const year = (day: number) => new Date(day * 86_400_000).getUTCFullYear()

/** “Jun 15, 2027”, or “Jun 15 – Jun 24, 2027”, with both years when they differ. */
export function formatSpan(start: number, end: number) {
  if (start === end) return `${formatMonthDay(start)}, ${year(start)}`
  if (year(start) === year(end)) return `${formatMonthDay(start)} – ${formatMonthDay(end)}, ${year(end)}`
  return `${formatMonthDay(start)}, ${year(start)} – ${formatMonthDay(end)}, ${year(end)}`
}

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

/** Requests used for the “ranked” examples, as in the Figma frames. */
export const sampleRequests = (): BidRequest[] => [
  { id: 'r1', type: 'vacation', start: dayOf(2027, 6, 15), end: dayOf(2027, 6, 24), note: 'Family trip to the lake. Back for the Jun 25 day watch.' },
  { id: 'r2', type: 'banked-ot', start: dayOf(2027, 7, 1), end: dayOf(2027, 7, 3) },
  { id: 'r3', type: 'comp-time', start: dayOf(2027, 6, 12), end: dayOf(2027, 6, 12) },
]

export const initialBids = (): Bid[] => [
  {
    id: 'summer', title: 'Summer Vacation Bid', mode: 'turn-based', period: [dayOf(2027, 6, 1), dayOf(2027, 8, 30)],
    remaining: '11h 45m', state: 'your-turn', requests: [], ahead: 0,
  },
  {
    id: 'winter', title: 'Winter Vacation Bid', mode: 'turn-based', period: [dayOf(2026, 10, 1), dayOf(2027, 1, 30)],
    remaining: '2 days 6h', state: 'your-turn', requests: [], ahead: 0,
  },
  {
    id: 'spring', title: 'Spring Vacation Bid', mode: 'turn-based', period: [dayOf(2027, 3, 1), dayOf(2027, 5, 31)],
    remaining: '4 days 2h', state: 'queued', requests: [], ahead: 3,
  },
]

/** Moves the item at `from` to `to`, shifting the ones in between. */
export function move<T>(list: T[], from: number, to: number): T[] {
  if (from === to || to < 0 || to >= list.length) return list
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}
