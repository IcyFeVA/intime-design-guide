import { useEffect, useId, useRef, useState } from 'react'
import { Button, Group, SegmentedControl, Select, SimpleGrid, Text } from '@mantine/core'
import { formatDuration, formatHour } from '../../schedule/data'
import { leaveOptions } from './options'
import { normalizeEnd, parseTime, timeValue } from './format'
import { TimeField } from './TimeField'
import classes from '../WorkforcePanel.module.css'

export type LeaveRequest = { code: string; allDay: true } | { code: string; allDay: false; start: number; end: number }

/** The leave type of a selected leave segment: the leave codes by name */
export function LeaveTypeField({ code, onCode, label = 'Leave type' }: { code: string; onCode: (code: string) => void; label?: string }) {
  return (
    <Select
      label={label}
      data={leaveOptions}
      value={code}
      onChange={(value) => value && value !== code && onCode(value)}
      allowDeselect={false}
    />
  )
}

/**
 * Inline leave entry, opened by the footer's Leave button. Part of the day starts on the selected assignment's
 * times and goes inside it (a partial leave); All day replaces the day's assignments, which Undo brings back.
 */
export function LeaveEntry({ span, replaces, onAdd, onCancel, defaultCode = 'Sick', defaultAllDay = !replaces, title = 'Add leave', framed = true }: {
  /** Where part-of-the-day leave starts: the selected assignment, or the watch's hours on an empty day */
  span: { start: number; end: number }
  /** What All day replaces ("PatD 08:00–16:00"), or null when the day has nothing to replace */
  replaces: string | null
  /** Save the leave. Returns an error to show, or null when saved. */
  onAdd: (leave: LeaveRequest) => string | null
  onCancel: () => void
  defaultCode?: string
  /** Starts on All day. Default: when the day has nothing to replace. */
  defaultAllDay?: boolean
  title?: string
  /** Off: no card or title, for a section that has its own (the bulk panel) */
  framed?: boolean
}) {
  const titleId = useId()
  const ref = useRef<HTMLDivElement>(null)
  const [code, setCode] = useState(defaultCode)
  const [allDay, setAllDay] = useState(defaultAllDay)
  const [start, setStart] = useState(timeValue(span.start))
  const [end, setEnd] = useState(timeValue(span.end))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ref.current?.scrollIntoView({ block: 'nearest' })
    ref.current?.querySelector('input')?.focus()
  }, [])

  const from = parseTime(start)
  const to = parseTime(end)
  const hours = from !== null && to !== null && from !== to ? normalizeEnd(from, to) - from : null

  const add = () => {
    if (allDay) return setError(onAdd({ code, allDay: true }))
    if (from === null || to === null) return setError('Type times like 0800, 830 or 17:30')
    if (from === to) return setError(`Starts and ends at ${formatHour(from)}`)
    setError(onAdd({ code, allDay: false, start: from, end: normalizeEnd(from, to) }))
  }

  return (
    <div
      className={framed ? classes.times : undefined}
      ref={ref}
      role="group"
      aria-labelledby={framed ? titleId : undefined}
      aria-label={framed ? undefined : title}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !(event.target as HTMLElement).closest('[aria-expanded="true"]')) {
          event.stopPropagation()
          onCancel()
        }
        if (event.key === 'Enter' && (event.target as HTMLElement).tagName === 'INPUT' && !(event.target as HTMLElement).closest('[aria-expanded="true"]')) add()
      }}
    >
      {framed && <Text id={titleId} size="sm" fw={600} mb={10}>{title}</Text>}
      <SimpleGrid cols={2} spacing={8} verticalSpacing={10}>
        <LeaveTypeField code={code} onCode={setCode} />
        <div>
          <Text size="sm" fw={500} mb={4} component="span" display="block">For</Text>
          <SegmentedControl
            fullWidth
            size="sm"
            value={allDay ? 'all' : 'part'}
            onChange={(value) => { setAllDay(value === 'all'); setError(null) }}
            data={[{ value: 'part', label: 'Part of day' }, { value: 'all', label: 'All day' }]}
            aria-label="All day or part of the day"
          />
        </div>
        {!allDay && (
          <>
            <TimeField label="From" value={start} onChange={setStart} error={!!error} />
            <TimeField label="To" value={end} onChange={setEnd} error={!!error} description={hours !== null ? formatDuration(hours) : undefined} inputWrapperOrder={['label', 'input', 'description']} />
          </>
        )}
      </SimpleGrid>
      {allDay && replaces && <Text size="xs" c="dimmed" mt={8}>Replaces {replaces}. Undo brings it back.</Text>}
      {error && <Text size="xs" mt={6} c="var(--text-error-default)" role="alert">{error}. Not saved.</Text>}
      <Group gap={8} mt={12} justify="flex-end">
        <Button variant="default" size="xs" onClick={onCancel}>Cancel</Button>
        <Button color="intime" size="xs" onClick={add}>Add leave</Button>
      </Group>
    </div>
  )
}
