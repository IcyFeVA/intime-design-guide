import { useState } from 'react'
import { ActionIcon, Button, Group, SimpleGrid, Text, TextInput, Tooltip } from '@mantine/core'
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
        <TextInput
          label="Hours"
          value={draft ? formatDuration(draft.end - draft.start) : '–'}
          readOnly
          tabIndex={-1}
          size="sm"
          classNames={{ input: classes.readOnly }}
          description={draft && draft.end > 24 ? 'Ends +1 day' : undefined}
          inputWrapperOrder={['label', 'input', 'description']}
        />
      </SimpleGrid>
      {error && <Text size="xs" mt={6} c="var(--text-error-default)" role="alert">{error}. Not saved.</Text>}
      {!error && warning && <Text size="xs" mt={6} c="var(--text-warning-default)">{warning}</Text>}
      {!onActual ? null : actual
        ? <ActualTimes key={`${actual.start}:${actual.end}`} actual={actual} onChange={onActual} readOnly={readOnly} />
        : !readOnly && (
          <Button variant="subtle" color="gray" size="xs" mt={6} leftSection={<Plus size={14} aria-hidden="true" />} className={classes.linkButton} onClick={() => onActual({ start: savedStart, end: savedEnd })}>
            Set actual
          </Button>
        )}
    </div>
  )
}

function ActualTimes({ actual, onChange, readOnly }: { actual: NonNullable<SegmentDetails['actual']>; onChange: (actual: SegmentDetails['actual']) => void; readOnly: boolean }) {
  const [start, setStart] = useState(timeValue(actual.start))
  const [end, setEnd] = useState(timeValue(actual.end))
  const commit = () => {
    const from = parseTime(start)
    const to = parseTime(end)
    if (from === null || to === null || from === to) return
    const next = { start: from, end: normalizeEnd(from, to) }
    if (next.start !== actual.start || next.end !== actual.end) onChange(next)
  }
  return (
    <Group
      gap={8}
      mt={8}
      align="flex-end"
      wrap="nowrap"
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) commit() }}
      onKeyDown={(event) => { if (event.key === 'Enter') commit() }}
    >
      <TimeField label="Actual start" value={start} onChange={setStart} className={classes.grow} readOnly={readOnly} />
      <TimeField label="Actual end" value={end} onChange={setEnd} className={classes.grow} readOnly={readOnly} />
      {!readOnly && (
        <Tooltip label="Remove actual times">
          <ActionIcon variant="subtle" color="gray" size={36} aria-label="Remove actual times" onClick={() => onChange(null)}><X size={16} /></ActionIcon>
        </Tooltip>
      )}
    </Group>
  )
}
