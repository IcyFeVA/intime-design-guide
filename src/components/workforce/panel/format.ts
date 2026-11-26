import type { CSSProperties } from 'react'
import { formatHour, segmentKind } from '../../schedule/data'

/** "16:30" → 16.5, or null when it isn't a time */
export function parseTime(value: string): number | null {
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours + minutes / 60
}

/** Hours → the "HH:mm" value of a time input (past midnight wraps) */
export const timeValue = (hours: number) => formatHour(hours)

/** An end at or before the start means the next day: 20:00–04:00 is stored as 20–28. */
export const normalizeEnd = (start: number, end: number) => (end <= start ? end + 24 : end)

/** "04:00 +1" for an end past midnight */
export const formatEnd = (end: number) => (end > 24 ? `${formatHour(end)} +1` : formatHour(end))

/** "08:00–17:00" or "20:00–04:00 +1" */
export const formatSpan = (start: number, end: number) => `${formatHour(start)}–${formatEnd(end)}`

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
