import { useState, type ReactNode } from 'react'
import { ActionIcon, Anchor, Menu, Select, Text, Tooltip, UnstyledButton } from '@mantine/core'
import { TimeInput } from '@mantine/dates'
import { Ban, ChevronRight, Ellipsis, Radio, RotateCcw, Trash2, UserSearch } from 'lucide-react'
import { shiftCodeMap } from '../../../tokens/schedule'
import { formatDuration, formatHour, segmentHours, segmentKind } from '../../schedule/data'
import type { WorkforceSegment } from '../data'
import { codeOptions } from './options'
import { codeFill, formatSpan, longSpanWarning, normalizeEnd, parseTime, timeValue } from './format'
import classes from '../WorkforcePanel.module.css'

export type PanelSegment = WorkforceSegment & { id: string }

type Preview = (action: string) => void

export interface SegmentHandlers {
  /** Save new times. Returns an error to show on the field, or null when saved. */
  onTimes: (id: string, start: number, end: number) => string | null
  /** Save other changes: code, cancelled, details */
  onPatch: (id: string, patch: Partial<WorkforceSegment>) => void
  onDelete?: (id: string) => void
  onPreview: Preview
}

const isLeave = (segment: WorkforceSegment) => segmentKind(segment) === 'leave'

/** "08:00–17:00 · 9h", or "08:00–16:00 · 5h worked · 3h leave" for a partial leave */
function blockSummary(segments: PanelSegment[]) {
  const hours = segments.map(segmentHours)
  const start = Math.min(...hours.map((item) => item.start))
  const end = Math.max(...hours.map((item) => item.end))
  const sum = (list: PanelSegment[]) => list.reduce((total, segment) => {
    const { start: from, end: to } = segmentHours(segment)
    return total + (to - from)
  }, 0)
  const working = segments.filter((segment) => !isLeave(segment) && !segment.cancelled)
  const leave = segments.filter(isLeave)
  if (!working.length || !leave.length) return { span: formatSpan(start, end), hours: formatDuration(sum(working.length ? working : leave)) }
  const leaveHours = Math.min(sum(leave), sum(working))
  return { span: formatSpan(start, end), hours: `${formatDuration(sum(working) - leaveHours)} worked · ${formatDuration(leaveHours)} leave` }
}

/**
 * One block: segments that touch, which the grid shows as one cell. The header sums it up and folds it away;
 * the expanded segment's row turns into inputs with its fields below.
 */
export function BlockCard({ segments, open, onToggle, expandedId, onExpand, note, menu, renderFields, handlers, readOnly = false }: {
  segments: PanelSegment[]
  open: boolean
  onToggle: () => void
  expandedId: string | null
  onExpand: (id: string) => void
  /** Shown under the header after a save moved a segment: what happened, and Undo */
  note?: { text: string; onUndo?: () => void } | null
  /** The block's ⋯ menu */
  menu?: ReactNode
  renderFields: (segment: PanelSegment) => ReactNode
  handlers: SegmentHandlers
  readOnly?: boolean
}) {
  const summary = blockSummary(segments)
  const hasWorking = segments.some((segment) => !isLeave(segment))
  return (
    <section className={classes.block} data-open={open || undefined} aria-label={`Block ${summary.span}`}>
      <div className={classes.blockHeader}>
        <UnstyledButton className={classes.blockToggle} onClick={onToggle} aria-expanded={open}>
          <ChevronRight size={16} className={classes.blockChevron} aria-hidden="true" />
          <span className={classes.blockSpan}>{summary.span}</span>
          <Text span size="sm" c="dimmed" truncate>
            · {summary.hours}{!open && ` · ${segments.map((segment) => segment.code).join(', ')}`}
          </Text>
        </UnstyledButton>
        {menu}
      </div>
      {note && (
        <div className={classes.note} role="status">
          <Text size="sm" span>{note.text}</Text>
          {note.onUndo && <>{' '}<Anchor component="button" type="button" size="sm" fw={600} onClick={note.onUndo}>Undo</Anchor></>}
        </div>
      )}
      {open && (
        <div className={classes.segments}>
          {segments.map((segment) => {
            const nested = hasWorking && isLeave(segment)
            return segment.id === expandedId
              ? (
                <ExpandedSegment
                  key={`${segment.id}:${segment.start}:${segment.end}`}
                  segment={segment}
                  nested={nested}
                  handlers={handlers}
                  fields={renderFields(segment)}
                  readOnly={readOnly}
                />
              )
              : <SegmentRow key={segment.id} segment={segment} nested={nested} onExpand={() => onExpand(segment.id)} handlers={handlers} readOnly={readOnly} />
          })}
        </div>
      )}
    </section>
  )
}

function Times({ segment }: { segment: PanelSegment }) {
  const { start, end } = segmentHours(segment)
  const actual = segment.details?.actual
  if (!actual) return <span className={classes.time}>{formatSpan(start, end)}</span>
  return (
    <span className={classes.time}>
      <s className={classes.scheduled}>{formatSpan(start, end)}</s> {formatSpan(actual.start, actual.end)}
    </span>
  )
}

function SegmentMenu({ segment, handlers, readOnly }: { segment: PanelSegment; handlers: SegmentHandlers; readOnly: boolean }) {
  return (
    <Menu position="bottom-end" disabled={readOnly}>
      <Menu.Target>
        <Tooltip label="More segment actions">
          <ActionIcon variant="subtle" color="gray" size={28} aria-label={`More actions for ${segment.code}`} disabled={readOnly}><Ellipsis size={16} /></ActionIcon>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Item onClick={() => handlers.onPreview('Segment history')}>History</Menu.Item>
        {handlers.onDelete && (
          <Menu.Item color="red" leftSection={<Trash2 size={16} aria-hidden="true" />} onClick={() => handlers.onDelete?.(segment.id)}>Delete segment</Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  )
}

/** A folded segment: code, times and hours. Click to edit it. */
function SegmentRow({ segment, nested, onExpand, handlers, readOnly }: { segment: PanelSegment; nested: boolean; onExpand: () => void; handlers: SegmentHandlers; readOnly: boolean }) {
  const { start, end } = segmentHours(segment)
  return (
    <div className={classes.row} data-nested={nested || undefined} data-cancelled={segment.cancelled || undefined}>
      <UnstyledButton
        className={classes.rowMain}
        onClick={onExpand}
        aria-expanded={false}
        aria-label={`${shiftCodeMap[segment.code]?.label ?? segment.code}, ${formatSpan(start, end)}${segment.cancelled ? ', cancelled' : ''}. Edit`}
      >
        <span className={classes.code} style={codeFill(segment.code)}>{segment.code}</span>
        <Times segment={segment} />
        <span className={classes.duration}>{formatDuration(end - start)}</span>
      </UnstyledButton>
      <SegmentMenu segment={segment} handlers={handlers} readOnly={readOnly} />
    </div>
  )
}

/** The segment being edited: code and times as inputs, its actions, then its fields. Times save when focus leaves them. */
function ExpandedSegment({ segment, nested, handlers, fields, readOnly }: { segment: PanelSegment; nested: boolean; handlers: SegmentHandlers; fields: ReactNode; readOnly: boolean }) {
  const hours = segmentHours(segment)
  const [start, setStart] = useState(timeValue(hours.start))
  const [end, setEnd] = useState(timeValue(hours.end))
  const [error, setError] = useState<string | null>(null)

  const from = parseTime(start)
  const to = parseTime(end)
  const draft = from !== null && to !== null && from !== to ? { start: from, end: normalizeEnd(from, to) } : null
  const warning = draft && longSpanWarning(draft.start, draft.end)

  const commit = () => {
    if (from === null || to === null) return setError('Enter times like 08:00')
    if (from === to) return setError(`Starts and ends at ${formatHour(from)}`)
    if (!draft || (draft.start === hours.start && draft.end === hours.end)) return setError(null)
    setError(handlers.onTimes(segment.id, draft.start, draft.end))
  }

  const action = (label: string, icon: ReactNode, onClick = () => handlers.onPreview(label)) => (
    <Tooltip label={label}>
      <ActionIcon variant="subtle" color="gray" size={28} aria-label={label} onClick={onClick} disabled={readOnly}>{icon}</ActionIcon>
    </Tooltip>
  )

  return (
    <div className={classes.row} data-expanded data-nested={nested || undefined} data-cancelled={segment.cancelled || undefined}>
      <div
        className={classes.editLine}
        onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) commit() }}
        onKeyDown={(event) => { if (event.key === 'Enter' && (event.target as HTMLElement).tagName === 'INPUT') commit() }}
      >
        <Select
          aria-label="Shift code"
          data={codeOptions}
          value={segment.code}
          onChange={(code) => code && code !== segment.code && handlers.onPatch(segment.id, { code })}
          searchable
          allowDeselect={false}
          comboboxProps={{ width: 240, position: 'bottom-start' }}
          renderOption={({ option }) => `${option.value} · ${shiftCodeMap[option.value]?.label ?? ''}`}
          className={classes.codeSelect}
          classNames={{ input: classes.codeInput }}
          readOnly={readOnly}
          style={codeFill(segment.code)}
        />
        <TimeInput aria-label="Start" value={start} onChange={(event) => setStart(event.currentTarget.value)} error={!!error} className={classes.timeInput} readOnly={readOnly} />
        <span aria-hidden="true" className={classes.dash}>–</span>
        <TimeInput aria-label="End" value={end} onChange={(event) => setEnd(event.currentTarget.value)} error={!!error} className={classes.timeInput} readOnly={readOnly} />
      </div>
      <div className={classes.metaLine}>
        <Text size="sm" c="dimmed" className="tabular">
          {draft ? formatDuration(draft.end - draft.start) : '–'}
          {draft && draft.end > 24 && ' · ends the next day'}
          {segment.cancelled && ' · cancelled'}
        </Text>
        <div className={classes.actions}>
          {action('Post as live', <Radio size={16} />)}
          {action('Find an employee', <UserSearch size={16} />)}
          {segment.cancelled
            ? action('Restore segment', <RotateCcw size={16} />, () => handlers.onPatch(segment.id, { cancelled: false }))
            : action('Cancel segment', <Ban size={16} />, () => handlers.onPatch(segment.id, { cancelled: true }))}
          <SegmentMenu segment={segment} handlers={handlers} readOnly={readOnly} />
        </div>
      </div>
      {error && <Text size="xs" c="var(--text-error-default)" role="alert">{error}. Not saved.</Text>}
      {!error && warning && <Text size="xs" c="var(--text-warning-default)">{warning}</Text>}
      {fields}
    </div>
  )
}
