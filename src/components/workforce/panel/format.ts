import type { CSSProperties } from 'react'
import { formatHour, segmentHours, segmentKind, type Chip } from '../../schedule/data'

/**
 * A typed time → hours, or null when it isn't one. Schedulers type fast, so all of these work:
 * "8" and "08" (08:00), "17", "830" and "0830" (08:30), "1730", "8:30", "8.30", "8h30". Up to 24:00 (end of day).
 */
export function parseTime(value: string): number | null {
  const text = value.trim()
  let hours: number
  let minutes: number
  const separated = /^(\d{1,2})\s*[:.h]\s*(\d{2})$/.exec(text)
  if (separated) {
    hours = Number(separated[1])
    minutes = Number(separated[2])
  } else if (/^\d{1,4}$/.test(text)) {
    hours = Number(text.length <= 2 ? text : text.slice(0, -2))
    minutes = text.length <= 2 ? 0 : Number(text.slice(-2))
  } else return null
  if (minutes > 59 || hours > 24 || (hours === 24 && minutes > 0)) return null
  return hours + minutes / 60
}

/** Hours → the "HH:mm" value of a time input (past midnight wraps) */
export const timeValue = (hours: number) => formatHour(hours)

/** An end at or before the start means the next day: 20:00–04:00 is stored as 20–28. */
export const normalizeEnd = (start: number, end: number) => (end <= start ? end + 24 : end)

/** "04:00 +1" for an end past midnight */
export const formatEnd = (end: number) => (end > 24 ? `${formatHour(end)} +1` : formatHour(end))

/** "08:00–17:00", "20:00–04:00 +1", or "All day" for 00:00–24:00 */
export const formatSpan = (start: number, end: number) => (start === 0 && end === 24 ? 'All day' : `${formatHour(start)}–${formatEnd(end)}`)

/** An end time's input value: 24:00 for a whole day, so it doesn't read as 00:00–00:00 */
export const endValue = (start: number, end: number) => (start === 0 && end === 24 ? '24:00' : timeValue(end))

/** Spans longer than this get a "Is that right?" warning */
export const LONG_SPAN_HOURS = 16

/** A warning for an unusually long segment, or null */
export const longSpanWarning = (start: number, end: number): string | null =>
  (end - start > LONG_SPAN_HOURS ? `Longer than ${LONG_SPAN_HOURS}h. Is that right?` : null)

/** The code badge's fill: the shift kind's schedule color */
export const codeFill = (code: string) => ({ '--code-fill': `var(--schedule-${segmentKind({ code })})` }) as CSSProperties

const DAY_MS = 86_400_000
/** Day number → "2026-06-03" (Mantine Dates value) */
export const toIso = (day: number) => new Date(day * DAY_MS).toISOString().slice(0, 10)
/** "2026-06-03" → day number */
export const fromIso = (value: string) => Math.round(Date.parse(`${value.slice(0, 10)}T00:00:00Z`) / DAY_MS)

/** "08:00–17:00": a cell from its first start to its last end */
export const chipSpanLabel = (chip: Chip) => {
  const hours = chip.segments.map(segmentHours)
  return formatSpan(Math.min(...hours.map((h) => h.start)), Math.max(...hours.map((h) => h.end)))
}
