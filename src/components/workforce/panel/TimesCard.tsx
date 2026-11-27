import { useRef, useState } from 'react'
import { ActionIcon, Button, SimpleGrid, Text, Tooltip } from '@mantine/core'
import { DatePickerInput } from '@mantine/dates'
import { Plus, X } from 'lucide-react'
import { formatDuration, formatHour } from '../../schedule/data'
import type { SegmentDetails } from '../data'
import { endValue, fromIso, longSpanWarning, normalizeEnd, parseTime, timeValue, toIso } from './format'
import { TimeField } from './TimeField'
import classes from '../WorkforcePanel.module.css'

/**
 * The selected segment's times: the scheduled day (moves its whole assignment), start, end and hours, and the
 * actual times once set. Times save when focus leaves the start/end pair, so changing both saves once.
 */
export function TimesCard({ start: savedStart, end: savedEnd, day, onTimes, onMoveDay, actual, onActual, warnLong = true, readOnly = false }: {
  start: number
  end: number
  day: number
  /** Save new times. Returns an error to show, or null when saved. */
  onTimes: (start: number, end: number) => string | null
  /** Missing: the day can't change here */
  onMoveDay?: (day: number) => void
  actual: SegmentDetails['actual']
  /** Missing: no actual times (e.g. leave) */
  onActual?: (actual: SegmentDetails['actual']) => void
  /** Warn about spans over 16h. Off for leave, which can last all day. */
  warnLong?: boolean
  readOnly?: boolean
}) {
  const [start, setStart] = useState(timeValue(savedStart))
  const [end, setEnd] = useState(endValue(savedStart, savedEnd))
  const [error, setError] = useState<string | null>(null)

  const from = parseTime(start)
  const to = parseTime(end)
  const draft = from !== null && to !== null && from !== to ? { start: from, end: normalizeEnd(from, to) } : null
  const warning = warnLong && draft && longSpanWarning(draft.start, draft.end)

  const commit = () => {
    if (from === null || to === null) return setError('Type times like 0800, 830 or 17:30')
    if (from === to) return setError(`Starts and ends at ${formatHour(from)}`)
    if (!draft || (draft.start === savedStart && draft.end === savedEnd)) return setError(null)
    setError(onTimes(draft.start, draft.end))
  }

  return (
    <div className={classes.times}>
      <SimpleGrid
        cols={4}
        spacing={8}
        onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) commit() }}
        onKeyDown={(event) => { if (event.key === 'Enter' && (event.target as HTMLElement).tagName === 'INPUT') commit() }}
      >
        <DatePickerInput
          label="Scheduled"
          value={toIso(day)}
          onChange={(value) => value && onMoveDay?.(fromIso(value))}
          valueFormat="MMM D"
          size="sm"
          readOnly={readOnly || !onMoveDay}
        />
        <TimeField label="Start" value={start} onChange={setStart} error={!!error} readOnly={readOnly} />
        <TimeField label="End" value={end} onChange={setEnd} error={!!error} readOnly={readOnly} />
        <div className={classes.hoursValue}><Hours span={draft} /></div>
      </SimpleGrid>
      {error && <Text size="xs" mt={6} c="var(--text-error-default)" role="alert">{error}. Not saved.</Text>}
      {!error && warning && <Text size="xs" mt={6} c="var(--text-warning-default)">{warning}</Text>}
      {!onActual ? null : actual
        ? <ActualTimes key={`${actual.start}:${actual.end}:${actual.day}`} actual={actual} day={day} onChange={onActual} readOnly={readOnly} />
        : !readOnly && (
          <Button variant="subtle" size="xs" mt={6} leftSection={<Plus size={14} aria-hidden="true" />} className={classes.linkButton} onClick={() => onActual({ start: savedStart, end: savedEnd })}>
            Set actual
          </Button>
        )}
    </div>
  )
}

/** Actual times: the date (the scheduled day unless changed), start, end and the hours they add up to. */
function ActualTimes({ actual, day, onChange, readOnly }: { actual: NonNullable<SegmentDetails['actual']>; day: number; onChange: (actual: SegmentDetails['actual']) => void; readOnly: boolean }) {
  const [start, setStart] = useState(timeValue(actual.start))
  const [end, setEnd] = useState(endValue(actual.start, actual.end))
  const from = parseTime(start)
  const to = parseTime(end)
  const draft = from !== null && to !== null && from !== to ? { start: from, end: normalizeEnd(from, to) } : null
  // The date picker's calendar takes focus; saving then would remount this row and close it. Picking a date saves the times too.
  const pickingDate = useRef(false)
  const commit = () => {
    if (pickingDate.current) return
    if (draft && (draft.start !== actual.start || draft.end !== actual.end)) onChange({ ...draft, day: actual.day })
  }
  return (
    <SimpleGrid
      cols={4}
      spacing={8}
      mt={10}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) commit() }}
      onKeyDown={(event) => { if (event.key === 'Enter' && (event.target as HTMLElement).tagName === 'INPUT') commit() }}
    >
      <DatePickerInput
        label="Actual"
        aria-label="Actual date"
        value={toIso(actual.day ?? day)}
        onChange={(value) => {
          if (!value) return
          const next = fromIso(value)
          // Kept only when it differs, so the actual date follows the scheduled one until it's changed
          const times = draft ?? actual
          onChange({ start: times.start, end: times.end, ...(next === day ? {} : { day: next }) })
        }}
        valueFormat="MMM D"
        size="sm"
        readOnly={readOnly}
        popoverProps={{ onOpen: () => { pickingDate.current = true }, onClose: () => { pickingDate.current = false } }}
      />
      <TimeField label="Start" aria-label="Actual start" value={start} onChange={setStart} readOnly={readOnly} />
      <TimeField label="End" aria-label="Actual end" value={end} onChange={setEnd} readOnly={readOnly} />
      <div className={classes.hoursValue}>
        <Hours span={draft} />
        {!readOnly && (
          <Tooltip label="Remove actual times">
            <ActionIcon variant="subtle" color="gray" size={28} aria-label="Remove actual times" onClick={() => onChange(null)}><X size={16} /></ActionIcon>
          </Tooltip>
        )}
      </div>
    </SimpleGrid>
  )
}

/** Hours a start/end pair adds up to: a value, not a field. "+1" when it ends the next day. */
export function Hours({ span }: { span: { start: number; end: number } | null }) {
  return (
    <Text size="sm" c="var(--text-info)" className="tabular">
      {span ? formatDuration(span.end - span.start) : '–'}
      {span && span.end > 24 && <Text span size="xs" c="dimmed"> +1</Text>}
    </Text>
  )
}
