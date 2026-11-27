import { PERIOD_DAYS, chipParts, periodStartOf, segmentHours, segmentKind, startOfWeek } from '../schedule/data'
import { allMembers, findWatch, type TimeBank, type WorkforceMember } from './data'
import { WEEKLY_HOURS_CAP, workedHours } from './warnings'
import { bankAvailable, timeBanks } from './panel/options'

/* ------------------------------------------------------------------ */
/* A person's hours: the employee row's Hours popover.                 */
/* ------------------------------------------------------------------ */

export interface HoursTotals {
  /** First and last day */
  from: number
  to: number
  /** Working hours, minus any leave over them (as the weekly hours cap counts them) */
  scheduled: number
  /** The overtime part of those hours: whole overtime assignments and the end of partly-overtime ones */
  overtime: number
  /** Leave hours. A whole day of leave counts as the person's watch length (e.g. 10h). */
  leave: number
}

export interface BankBalance {
  bank: TimeBank
  /** Hours in the bank now (mock) */
  balance: number
  /** Hours the bank can still take this period: the "16 avail." beside Bank this time */
  available: number
}

export interface HoursSummary {
  week: HoursTotals
  period: HoursTotals
  cap: number
  banks: BankBalance[]
}

function totals(member: WorkforceMember, from: number, days: number): HoursTotals {
  const watch = findWatch(member.watch)
  const leaveDay = watch.end - watch.start
  const result: HoursTotals = { from, to: from + days - 1, scheduled: 0, overtime: 0, leave: 0 }
  for (let day = from; day < from + days; day += 1) {
    const chips = member.chips(day)
    result.scheduled += workedHours(chips)
    for (const part of chips.flatMap(chipParts)) {
      if (part.overtime && !part.cancelled) result.overtime += part.end - part.start
    }
    for (const segment of chips.flatMap((chip) => chip.segments)) {
      if (segmentKind(segment) !== 'leave') continue
      const { start, end } = segmentHours(segment)
      result.leave += end - start >= 24 ? leaveDay : end - start
    }
  }
  return result
}

/** Mock balances, different for each person but the same every time */
function balances(member: WorkforceMember): BankBalance[] {
  const index = Math.max(0, allMembers.findIndex((item) => item.id === member.id))
  const balance: Record<TimeBank, number> = {
    Overtime: 4 + ((index * 7) % 37) + (index % 3 === 0 ? 0.5 : 0),
    'Comp Time': 8 + ((index * 11) % 53),
    Holiday: [0, 8, 16, 24][index % 4],
  }
  return timeBanks.map((bank) => ({ bank, balance: balance[bank], available: bankAvailable[bank] }))
}

/** Hours in the week (Monday to Sunday) and the schedule period that hold `day`, and the time banks */
export function hoursSummary(member: WorkforceMember, day: number): HoursSummary {
  return {
    week: totals(member, startOfWeek(day), 7),
    period: totals(member, periodStartOf(day), PERIOD_DAYS),
    cap: WEEKLY_HOURS_CAP,
    banks: balances(member),
  }
}
