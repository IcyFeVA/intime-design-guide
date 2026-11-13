import type { TokenStatus } from './types'

/* ------------------------------------------------------------------ */
/* Event kinds                                                         */
/* ------------------------------------------------------------------ */

/** The fill of a calendar event. Activity, overtime and leave share the schedule fills. */
export type CalendarEventKind = 'activity' | 'overtime' | 'leave' | 'task'

export const calendarEventKinds: { key: CalendarEventKind; label: string; meaning: string; cssVar: string }[] = [
  { key: 'activity', label: 'Activity', meaning: 'A scheduled shift or assignment: patrol, court, training, office duty.', cssVar: '--schedule-regular' },
  { key: 'overtime', label: 'Overtime', meaning: 'Hours beyond the regular schedule, including meetings called on a day off.', cssVar: '--schedule-overtime' },
  { key: 'leave', label: 'Leave', meaning: 'Time off: vacation, sick, compensating time.', cssVar: '--schedule-leave' },
  { key: 'task', label: 'Task', meaning: 'A to-do with a start time and optional reminders. Set by you or a scheduler.', cssVar: '--calendar-task' },
]

/** Modifiers laid over any kind. Each one also changes the text, so color is never the only signal. */
export const calendarModifiers: { key: 'pending' | 'outOfUnit' | 'cancelled'; label: string; meaning: string }[] = [
  { key: 'pending', label: 'Pending', meaning: 'Requested but not approved yet. Dashed amber outline and stripes, and the title starts with “Pending:”.' },
  { key: 'outOfUnit', label: 'Out of branch/unit', meaning: 'Worked for another branch or unit. Stripes over the fill; the details say which unit.' },
  { key: 'cancelled', label: 'Cancelled', meaning: 'Struck through. Stays on the calendar so the change is visible.' },
]

/* ------------------------------------------------------------------ */
/* Views                                                               */
/* ------------------------------------------------------------------ */

export type CalendarView = 'month' | 'week' | 'day' | 'agenda'

export const calendarViews: { key: CalendarView; label: string; step: string; shows: string }[] = [
  { key: 'month', label: 'Month', step: 'A calendar month', shows: 'Weeks as rows, Monday first. Each day lists its events in start order, all-day items first.' },
  { key: 'week', label: 'Week', step: 'A week', shows: 'Seven columns on a 24-hour timeline, with an all-day row on top and a line at the current time.' },
  { key: 'day', label: 'Day', step: 'A day', shows: 'One column on the same timeline. Easiest for overlapping events.' },
  { key: 'agenda', label: 'Agenda', step: 'A week', shows: 'A list by day with start times and durations. Empty days say so.' },
]

/* ------------------------------------------------------------------ */
/* CSS variables                                                       */
/* ------------------------------------------------------------------ */

export interface CalendarToken {
  name: `--calendar-${string}`
  /** Dark value, or the value for both schemes when `light` is not set */
  value: string
  light?: string
  kind: 'size' | 'color'
  usage: string
  status: TokenStatus
}

const t = (name: CalendarToken['name'], value: string, kind: CalendarToken['kind'], usage: string, light?: string): CalendarToken =>
  ({ name, value, light, kind, usage, status: 'confirmed' })

const mix = (token: string, percent: number) => `color-mix(in srgb, var(${token}) ${percent}%, transparent)`

/**
 * Calendar variables. Activity, overtime, leave and the out-of-unit stripes reuse the `--schedule-*` fills.
 * Task fill is a per-scheme literal; everything else aliases theme tokens.
 */
export const calendarTokens: CalendarToken[] = [
  t('--calendar-hour-height', '48px', 'size', 'Height of one hour on the week and day timeline (40px on a phone).'),
  t('--calendar-task', '#3a4049', 'color', 'Fill for tasks.', '#dfe3e8'),
  t('--calendar-pending-bg', mix('--text-warning-default', 10), 'color', 'Fill under a pending event.'),
  t('--calendar-pending-stripe', mix('--text-warning-default', 28), 'color', 'Stripes on a pending event.'),
  t('--calendar-pending-border', 'var(--text-warning-default)', 'color', 'Dashed outline of a pending event.'),
  t('--calendar-signup-bg', mix('--background-primary-filled', 16), 'color', 'Fill of the sign-ups item.'),
  t('--calendar-signup-border', 'var(--border-primary-default)', 'color', 'Outline of the sign-ups item.'),
  t('--calendar-signup-text', 'var(--text-primary-default)', 'color', 'Text of the sign-ups item.'),
  t('--calendar-holiday-bg', mix('--background-info', 16), 'color', 'Fill of a holiday.'),
  t('--calendar-holiday-text', 'var(--text-info)', 'color', 'Text of a holiday.'),
  t('--calendar-hover-border', 'var(--border-primary-default)', 'color', 'Outline of the day or column under the pointer, where + adds a task.'),
  t('--calendar-now', 'var(--background-error-filled)', 'color', 'Current-time line and its time label.'),
]

export const calendarCssVariables: Record<string, string> = Object.fromEntries(
  calendarTokens.filter((token) => !token.light).map((token) => [token.name, token.value]),
)
export const calendarDarkVariables: Record<string, string> = Object.fromEntries(
  calendarTokens.filter((token) => token.light).map((token) => [token.name, token.value]),
)
export const calendarLightVariables: Record<string, string> = Object.fromEntries(
  calendarTokens.filter((token) => token.light).map((token) => [token.name, token.light!]),
)
