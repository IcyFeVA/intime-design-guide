import { cloneElement, useState, type ReactElement } from 'react'
import { Popover } from '@mantine/core'
import { DatePicker, MonthPicker, type DatePickerPreset, type DateStringValue } from '@mantine/dates'
import { MOCK_TODAY, startOfWeek } from '../schedule/data'
import classes from './DatePickers.module.css'

/* A "day" is the number of days since 1970-01-01 (UTC), as in schedule/data.ts. */
const DAY_MS = 86_400_000
const dayToDate = (day: number): DateStringValue => new Date(day * DAY_MS).toISOString().slice(0, 10)
const dateToDay = (value: string) => Date.parse(`${value.slice(0, 10)}T00:00:00Z`) / DAY_MS

/**
 * What the picker selects:
 * - `month`: a whole month (MonthPicker).
 * - `day`: a single day.
 * - `block`: a fixed run of `length` days. `align: 'week'` snaps to the Monday of the picked day.
 */
export type PeriodMode = { kind: 'month' } | { kind: 'day' } | { kind: 'block'; length: number; align: 'week' | 'day' }

/** Marks the demo's "today" (Jun 5, 2026) instead of the real date. */
const todayProps = (day: number) => (day === MOCK_TODAY ? { 'data-mock-today': true } : {})
const dayClassNames = { day: classes.day }

function PickerPopover({ opened, onChange, target, children }: {
  opened: boolean
  onChange: (opened: boolean) => void
  target: ReactElement<{ onClick?: () => void }>
  children: ReactElement
}) {
  // A controlled Popover doesn't toggle on its own: the target's click does it
  return (
    <Popover opened={opened} onChange={onChange} position="bottom-start" shadow="md" trapFocus returnFocus>
      <Popover.Target>{cloneElement(target, { onClick: () => onChange(!opened) })}</Popover.Target>
      <Popover.Dropdown p="sm">{children}</Popover.Dropdown>
    </Popover>
  )
}

/**
 * Opens a date picker from `target` (the date button). Picking a date moves `anchor` and closes the popover.
 * The calendar opens on the month of the current anchor.
 */
export function PeriodPicker({ mode, anchor, onChange, target }: {
  mode: PeriodMode
  anchor: number
  onChange: (anchor: number) => void
  target: ReactElement<{ onClick?: () => void }>
}) {
  const [opened, setOpened] = useState(false)
  const [hovered, setHovered] = useState<number | null>(null)
  const pick = (value: string | null) => {
    if (!value) return
    onChange(dateToDay(value))
    setOpened(false)
  }

  let picker: ReactElement
  if (mode.kind === 'month') {
    picker = <MonthPicker value={dayToDate(anchor)} defaultDate={dayToDate(anchor)} onChange={pick} aria-label="Pick a month" />
  } else if (mode.kind === 'day') {
    picker = (
      <DatePicker
        value={dayToDate(anchor)}
        defaultDate={dayToDate(anchor)}
        onChange={pick}
        highlightToday={false}
        getDayProps={(date) => todayProps(dateToDay(date))}
        classNames={dayClassNames}
        aria-label="Pick a day"
      />
    )
  } else {
    const { length, align } = mode
    const blockStart = (day: number) => (align === 'week' ? startOfWeek(day) : day)
    const selected = blockStart(anchor)
    const preview = hovered === null ? null : blockStart(hovered)
    const within = (start: number | null, day: number) => start !== null && day >= start && day < start + length
    picker = (
      <DatePicker
        defaultDate={dayToDate(anchor)}
        onChange={pick}
        highlightToday={false}
        onMouseLeave={() => setHovered(null)}
        getDayProps={(date) => {
          const day = dateToDay(date)
          const start = within(preview, day) ? preview! : within(selected, day) ? selected : null
          return {
            ...todayProps(day),
            onMouseEnter: () => setHovered(day),
            selected: within(selected, day),
            inRange: start !== null,
            firstInRange: start !== null && day === start,
            lastInRange: start !== null && day === start + length - 1,
          }
        }}
        classNames={dayClassNames}
        aria-label={align === 'week' ? 'Pick a week' : 'Pick a start day'}
      />
    )
  }

  return <PickerPopover opened={opened} onChange={(value) => { setOpened(value); setHovered(null) }} target={target}>{picker}</PickerPopover>
}

const rangePresets = (): DatePickerPreset<'range'>[] => {
  const week = startOfWeek(MOCK_TODAY)
  return [
    { label: 'This week', value: [dayToDate(week), dayToDate(week + 6)] },
    { label: 'Next two weeks', value: [dayToDate(MOCK_TODAY), dayToDate(MOCK_TODAY + 13)] },
    { label: 'Last 30 days', value: [dayToDate(MOCK_TODAY - 29), dayToDate(MOCK_TODAY)] },
    { label: 'This month', value: ['2026-06-01', '2026-06-30'] },
  ]
}

/**
 * Start and end day, picked as two clicks on a two-month calendar. Closes once both ends are set;
 * Escape or a click outside keeps the previous range.
 */
export function RangePicker({ value, onChange, target }: {
  value: [number, number]
  onChange: (value: [number, number]) => void
  target: ReactElement<{ onClick?: () => void }>
}) {
  const [opened, setOpened] = useState(false)
  const [draft, setDraft] = useState<[string | null, string | null]>([dayToDate(value[0]), dayToDate(value[1])])
  const open = (next: boolean) => {
    if (next) setDraft([dayToDate(value[0]), dayToDate(value[1])])
    setOpened(next)
  }
  return (
    <PickerPopover opened={opened} onChange={open} target={target}>
      <DatePicker
        type="range"
        value={draft}
        defaultDate={dayToDate(value[0])}
        numberOfColumns={2}
        allowSingleDateInRange
        highlightToday={false}
        presets={rangePresets()}
        getDayProps={(date) => todayProps(dateToDay(date))}
        classNames={dayClassNames}
        aria-label="Pick a start and end day"
        onChange={(next) => {
          setDraft(next)
          if (next[0] && next[1]) {
            onChange([dateToDay(next[0]), dateToDay(next[1])])
            setOpened(false)
          }
        }}
      />
    </PickerPopover>
  )
}
