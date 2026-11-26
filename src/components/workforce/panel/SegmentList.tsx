import { Fragment, useState, type ReactNode } from 'react'
import { ActionIcon, Anchor, Menu, Popover, Text, Tooltip, UnstyledButton } from '@mantine/core'
import { DatePicker } from '@mantine/dates'
import { ArrowUpRight, Ban, CalendarArrowUp, CornerDownRight, Ellipsis, History, Radio, RotateCcw, Trash2, TriangleAlert, UserSearch } from 'lucide-react'
import { shiftCodeMap } from '../../../tokens/schedule'
import { formatDuration, segmentHours, segmentKind } from '../../schedule/data'
import type { WorkforceSegment } from '../data'
import { codeFill, formatSpan, fromIso, toIso } from './format'
import classes from '../WorkforcePanel.module.css'

export type PanelSegment = WorkforceSegment & { id: string }

export interface SegmentHandlers {
  /** Save other changes than times: code, cancelled, details */
  onPatch: (id: string, patch: Partial<WorkforceSegment>) => void
  onDelete?: (id: string) => void
  onPreview: (action: string) => void
}

/** What the list shows about an assignment besides its segments */
export interface BlockInfo {
  /** Where it's worked, under the root row's times: "Special Ops" (out of unit), "84th Precinct" */
  tag?: string
  /** Another branch's assignment: rows can be selected, but have no actions */
  readOnly?: boolean
  /** Warnings about the assignment, joined: its root row gets a ⚠ */
  warning?: string
}

/** Whole-block actions on a root row's menu */
export interface BlockActions {
  day: number
  onMove: (block: number, toDay: number) => void
  onDelete: (block: number) => void
}

const isLeave = (segment: WorkforceSegment) => segmentKind(segment) === 'leave'

/** The whole block, hours first so they survive truncation: "12h total · 07:00–19:00", or "5h worked · 3h leave · 08:00–16:00" */
function blockTotal(segments: WorkforceSegment[]) {
  const hours = segments.map(segmentHours)
  const span = formatSpan(Math.min(...hours.map((item) => item.start)), Math.max(...hours.map((item) => item.end)))
  const sum = (list: WorkforceSegment[]) => list.reduce((total, segment) => {
    const { start, end } = segmentHours(segment)
    return total + (end - start)
  }, 0)
  const working = segments.filter((segment) => !isLeave(segment) && !segment.cancelled)
  const leave = segments.filter(isLeave)
  if (!working.length || !leave.length) return `${formatDuration(sum(working.length ? working : leave))} total · ${span}`
  const leaveHours = Math.min(sum(leave), sum(working))
  return `${formatDuration(sum(working) - leaveHours)} worked · ${formatDuration(leaveHours)} leave · ${span}`
}

/**
 * A day's segments as a list. Each block (touching segments, one grid cell) starts with its first segment as the
 * root; the segments that touch it are indented below. A block that doesn't touch starts a new root. Click a row
 * to edit it in the form below the list.
 */
export function SegmentList({ blocks, selectedId, onSelect, handlers, note, blockActions, blockInfo = [] }: {
  blocks: PanelSegment[][]
  selectedId: string | null
  onSelect: (id: string) => void
  handlers: SegmentHandlers
  /** Shown under a block after a save moved a segment: what happened, and Undo */
  note?: { block: number; text: string; onUndo?: () => void } | null
  blockActions?: BlockActions
  /** Per block, in the same order */
  blockInfo?: BlockInfo[]
}) {
  return (
    <div className={classes.segmentList} role="list" aria-label="Segments">
      {blocks.map((segments, block) => (
        <Fragment key={segments[0].id}>
          <div className={classes.blockGroup} role="listitem" aria-label={`Assignment ${blockTotal(segments)}`}>
            {segments.map((segment, index) => (
              <SegmentRow
                key={segment.id}
                segment={segment}
                root={index === 0}
                total={index === 0 && segments.length > 1 ? blockTotal(segments) : null}
                selected={segment.id === selectedId}
                onSelect={() => onSelect(segment.id)}
                handlers={handlers}
                blockMenu={index === 0 && blockActions ? { ...blockActions, block, label: blockTotal(segments) } : undefined}
                tag={index === 0 ? blockInfo[block]?.tag : undefined}
                warning={index === 0 ? blockInfo[block]?.warning : undefined}
                readOnly={!!blockInfo[block]?.readOnly}
              />
            ))}
          </div>
          {note?.block === block && (
            <div className={classes.note} role="status">
              <Text size="sm" span>{note.text}</Text>
              {note.onUndo && <>{' '}<Anchor component="button" type="button" size="sm" fw={600} onClick={note.onUndo}>Undo</Anchor></>}
            </div>
          )}
        </Fragment>
      ))}
    </div>
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

function SegmentRow({ segment, root, total, selected, onSelect, handlers, blockMenu, tag, warning, readOnly }: {
  segment: PanelSegment
  root: boolean
  /** The block's total, on a root row with indented segments */
  total: string | null
  selected: boolean
  onSelect: () => void
  handlers: SegmentHandlers
  blockMenu?: BlockActions & { block: number; label: string }
  tag?: string
  warning?: string
  readOnly: boolean
}) {
  const [moving, setMoving] = useState(false)
  const { start, end } = segmentHours(segment)
  const name = shiftCodeMap[segment.code]?.label ?? segment.code

  const action = (label: string, icon: ReactNode, onClick = () => handlers.onPreview(label)) => (
    <Tooltip label={label}>
      <ActionIcon variant="subtle" color="gray" size={28} aria-label={label} onClick={onClick}>{icon}</ActionIcon>
    </Tooltip>
  )

  const menu = (
    <Menu position="bottom-end">
      <Menu.Target>
        <Tooltip label="More actions">
          <ActionIcon variant="subtle" color="gray" size={28} aria-label={`More actions for ${segment.code} ${formatSpan(start, end)}`}><Ellipsis size={16} /></ActionIcon>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown>
        {blockMenu && (
          <>
            <Menu.Label>Assignment {blockMenu.label}</Menu.Label>
            <Menu.Item leftSection={<CalendarArrowUp size={16} aria-hidden="true" />} onClick={() => setMoving(true)}>Move to another day…</Menu.Item>
            <Menu.Item color="red" leftSection={<Trash2 size={16} aria-hidden="true" />} onClick={() => blockMenu.onDelete(blockMenu.block)}>Delete assignment</Menu.Item>
            <Menu.Divider />
            <Menu.Label>This segment</Menu.Label>
          </>
        )}
        <Menu.Item leftSection={<History size={16} aria-hidden="true" />} onClick={() => handlers.onPreview('Segment history')}>History</Menu.Item>
        {handlers.onDelete && (
          <Menu.Item color="red" leftSection={<Trash2 size={16} aria-hidden="true" />} onClick={() => handlers.onDelete?.(segment.id)}>Delete segment</Menu.Item>
        )}
      </Menu.Dropdown>
    </Menu>
  )

  return (
    <div className={classes.row} data-root={root || undefined} data-selected={selected || undefined} data-cancelled={segment.cancelled || undefined}>
      <UnstyledButton
        className={classes.rowMain}
        onClick={onSelect}
        aria-pressed={selected}
        aria-label={`${name}, ${formatSpan(start, end)}${segment.cancelled ? ', cancelled' : ''}${total ? `. Assignment ${total}` : ''}${tag ? `. ${tag}` : ''}${warning ? `. Warning: ${warning}` : ''}`}
      >
        {!root && <CornerDownRight size={14} className={classes.indentMark} aria-hidden="true" />}
        <span className={classes.code} style={codeFill(segment.code)}>{segment.code}</span>
        <span className={classes.rowText}>
          <Times segment={segment} />
          {total && <span className={classes.total}>{total}</span>}
          {tag && <span className={classes.rowTag}><ArrowUpRight size={12} strokeWidth={2} aria-hidden="true" />{tag}</span>}
        </span>
        {warning && <TriangleAlert size={14} strokeWidth={2} className={classes.rowWarn} aria-hidden="true" />}
        <span className={classes.duration}>{formatDuration(end - start)}</span>
      </UnstyledButton>
      {selected && !readOnly && !isLeave(segment) && (
        <>
          {action('Post as live', <Radio size={16} />)}
          {action('Find an employee', <UserSearch size={16} />)}
          {segment.cancelled
            ? action('Restore segment', <RotateCcw size={16} />, () => handlers.onPatch(segment.id, { cancelled: false }))
            : action('Cancel segment', <Ban size={16} />, () => handlers.onPatch(segment.id, { cancelled: true }))}
        </>
      )}
      {readOnly ? null : blockMenu ? (
        <Popover opened={moving} onChange={setMoving} position="bottom-end" trapFocus>
          <Popover.Target><div>{menu}</div></Popover.Target>
          <Popover.Dropdown>
            <Text size="sm" fw={600} mb={6}>Move this assignment to</Text>
            <DatePicker
              defaultDate={toIso(blockMenu.day)}
              value={toIso(blockMenu.day)}
              onChange={(value) => { setMoving(false); if (value) blockMenu.onMove(blockMenu.block, fromIso(value)) }}
            />
          </Popover.Dropdown>
        </Popover>
      ) : menu}
    </div>
  )
}
