import { useEffect, useId, useRef, useState } from 'react'
import { Button, Collapse, Group, Menu, Select, Text, UnstyledButton } from '@mantine/core'
import { ChevronRight, ClipboardPaste, LayoutTemplate } from 'lucide-react'
import { formatHeader, formatHour, segmentHours, segmentKind, type Chip } from '../../schedule/data'
import { shiftCodeMap } from '../../../tokens/schedule'
import type { AssignSource, PanelItem } from '../model'
import type { EditCommit } from '../useScheduleEdits'
import { PanelFooter } from './parts'
import { LeaveEntry, type LeaveRequest } from './LeaveEntry'
import { workingCodeOptions } from './options'
import { BulkFields } from './BulkFields'
import {
  addLeave, assignCode, assignableDays, bulkSegments, bulkSelection, changeSegments, changeTimes, moveCells, commonValue, deletableCount, deleteAll, lockedCount, ownChips, plural, type BulkResult, type SegmentChange,
} from './bulk'
import { chipSpanLabel } from './format'
import classes from '../WorkforcePanel.module.css'

type Preview = (action: string) => void

/** " Locked cells and open shifts are skipped." for what Assign to N leaves alone */
const skippedNote = (locked: number, open: number) => {
  const what = [locked && (locked === 1 ? 'the locked cell' : 'locked cells'), open && (open === 1 ? 'the open shift' : 'open shifts')].filter(Boolean)
  if (!what.length) return ''
  const text = what.join(' and ')
  return ` ${text[0].toUpperCase()}${text.slice(1)} ${what.length === 1 && (locked === 1 || open === 1) ? 'is' : 'are'} skipped.`
}

const shiftChip = (code: string): Chip => ({ segments: [{ code, start: shiftCodeMap[code].start, end: shiftCodeMap[code].end }] })

/**
 * Several cells selected: give them all one shift ("Assign to N"), change a field on all of them, add leave to all
 * the days, or delete them. Each action is one save, so one Undo reverts it. The grid shows which cells are selected,
 * so the panel doesn't list them.
 */
export function BulkEditor({ items, onEdit, onPreview, onStatus, assigning, onAssign, onPaste }: {
  items: PanelItem[]
  onEdit: (commit: EditCommit) => void
  onPreview: Preview
  /** Says what an action did, in the demo's status line */
  onStatus: (text: string) => void
  assigning: boolean
  onAssign: (source: AssignSource | null) => void
  /** Pastes what was copied into the selected cells. Missing: Paste is disabled (nothing copied). */
  onPaste?: () => void
}) {
  const selection = bulkSelection(items)
  const people = selection.days.length
  const assignable = assignableDays(selection).length
  const locked = lockedCount(selection)
  const own = ownChips(selection)
  const working = own.map((chip) => chip.segments[0]).filter((segment) => segmentKind(segment) !== 'leave')
  const [code, setCode] = useState<string | null>(() => commonValue(working.map((segment) => segment.code)) ?? selection.days[0]?.watch.code ?? 'PatD')
  const [fieldsOpen, setFieldsOpen] = useState(true)
  const [mode, setMode] = useState<'leave' | 'delete' | null>(null)
  const [leaveOpen, setLeaveOpen] = useState(true)
  const fieldsId = useId()
  const leaveId = useId()
  const deletable = deletableCount(selection)

  /** Save one action and say what it did */
  const run = (result: BulkResult, done: (count: string) => string): boolean => {
    const parts: string[] = []
    if (result.changed) {
      onEdit(result.commit)
      parts.push(`${done(plural(result.changed, 'cell'))} Undo reverts it.`)
    } else parts.push('Nothing changed.')
    if (result.skipped.length) parts.push(`Skipped ${result.skipped.join('; ')}.`)
    onStatus(parts.join(' '))
    return result.changed > 0
  }

  const assignAll = () => {
    if (!code) return
    run(assignCode(selection, code), (count) => `Assigned ${code} ${chipSpanLabel(shiftChip(code))} to ${count}.`)
  }

  const change = (segmentChange: SegmentChange, what: string) => {
    run(changeSegments(selection, segmentChange), (count) => `${what} ${count}.`)
  }

  const setTimes = (times: { start?: number; end?: number }) => {
    const what = [times.start !== undefined && `start ${formatHour(times.start)}`, times.end !== undefined && `end ${formatHour(times.end)}`].filter(Boolean).join(', ')
    run(changeTimes(selection, times), (count) => `Set ${what} on ${count}.`)
  }

  const moveDay = (to: number) => {
    run(moveCells(selection, to), (count) => `Moved ${count} to ${formatHeader(to)}.`)
  }

  /** Leave gets its own section and Change fields folds away, so the leave form is in view */
  const openLeave = () => {
    setMode('leave')
    setLeaveOpen(true)
    setFieldsOpen(false)
  }
  const closeLeave = () => {
    setMode(null)
    setFieldsOpen(true)
  }

  const leave = (request: LeaveRequest): string | null => {
    const result = addLeave(selection, request)
    if (!result.changed) return result.skipped.length ? `None of the days can take it: ${result.skipped.join('; ')}` : 'Nothing to add'
    run(result, (count) => `Added ${request.code} to ${count.replace('cell', 'day')}.`)
    closeLeave()
    return null
  }

  /** Footer Assign: assign mode with the picked shift, to give it to more cells by clicking them */
  const startAssign = () => code && onAssign({ chip: shiftChip(code), from: 'the shift picker' })

  /** Where part-of-day leave starts: the first selected assignment, or the first person's watch */
  const firstChip = own[0]
  const leaveSpan = firstChip
    ? { start: Math.min(...firstChip.segments.map((segment) => segmentHours(segment).start)), end: Math.max(...firstChip.segments.map((segment) => segmentHours(segment).end)) }
    : { start: selection.days[0]?.watch.start ?? 7, end: selection.days[0]?.watch.end ?? 17 }

  return (
    <>
      <div className={classes.scroll}>
        <div className={classes.body}>
          <div>
            <Group gap={8} align="flex-end" wrap="nowrap">
              <Select
                label="Shift"
                data={workingCodeOptions}
                value={code}
                onChange={setCode}
                searchable
                allowDeselect={false}
                className={classes.grow}
                comboboxProps={{ width: 260, position: 'bottom-start' }}
                renderOption={({ option }) => `${option.value} · ${shiftCodeMap[option.value]?.label ?? ''}`}
              />
              <Button color="intime" onClick={assignAll} disabled={!code || !assignable}>
                Assign to {assignable}
              </Button>
            </Group>
            <Text size="xs" c="dimmed" mt={6}>
              {code && `${shiftCodeMap[code].label} · ${chipSpanLabel(shiftChip(code))}. `}
              {people
                ? `Replaces what the selected cells hold.${skippedNote(locked, selection.open.length)}`
                : 'Only open shifts are selected. Assign those from the shift itself.'}
            </Text>
          </div>

          <div className={classes.bulkSection}>
            <UnstyledButton className={classes.bulkToggle} onClick={() => setFieldsOpen((open) => !open)} aria-expanded={fieldsOpen} aria-controls={fieldsId}>
              <Text size="sm" fw={600} c="var(--text-default)" className={classes.grow}>Change fields</Text>
              <ChevronRight size={16} className={classes.warningsChevron} data-open={fieldsOpen || undefined} aria-hidden="true" />
            </UnstyledButton>
            <Collapse expanded={fieldsOpen} id={fieldsId}>
              <div className={classes.bulkFields}>
                <BulkFields segments={bulkSegments(selection)} onTimes={setTimes} onMoveDay={moveDay} onChange={change} />
              </div>
            </Collapse>
          </div>

          {mode === 'leave' && (
            <div className={classes.bulkSection}>
              <UnstyledButton className={classes.bulkToggle} onClick={() => setLeaveOpen((open) => !open)} aria-expanded={leaveOpen} aria-controls={leaveId}>
                <Text size="sm" fw={600} c="var(--text-default)" className={classes.grow}>Add leave to {plural(people, 'day')}</Text>
                <ChevronRight size={16} className={classes.warningsChevron} data-open={leaveOpen || undefined} aria-hidden="true" />
              </UnstyledButton>
              <Collapse expanded={leaveOpen} id={leaveId}>
                <div className={classes.bulkFields}>
                  <LeaveEntry
                    title={`Add leave to ${plural(people, 'day')}`}
                    framed={false}
                    span={leaveSpan}
                    replaces={selection.days.some((day) => day.blocks.some((chip) => !chip.locked)) ? 'their assignments on those days' : null}
                    defaultCode="Vac"
                    defaultAllDay
                    onAdd={leave}
                    onCancel={closeLeave}
                  />
                </div>
              </Collapse>
            </div>
          )}
          {mode === 'delete' && (
            <DeleteConfirm
              count={deletable}
              onCancel={() => setMode(null)}
              onConfirm={() => {
                run(deleteAll(selection), (count) => `Deleted ${count}.`)
                setMode(null)
              }}
            />
          )}
        </div>
      </div>
      <PanelFooter
        onPreview={onPreview}
        assigning={assigning}
        onAssign={assigning ? () => onAssign(null) : startAssign}
        canAssign={!!code}
        onLeave={openLeave}
        canLeave={people > 0 && mode !== 'leave'}
        deleteLabel="Delete all…"
        onDelete={deletable ? () => setMode('delete') : undefined}
        moreItems={(
          <>
            <Menu.Item leftSection={<LayoutTemplate size={16} aria-hidden="true" />} onClick={() => onPreview('Load from template')}>Load from template</Menu.Item>
            <Menu.Item leftSection={<ClipboardPaste size={16} aria-hidden="true" />} onClick={onPaste} disabled={!onPaste}>Paste</Menu.Item>
          </>
        )}
      />
    </>
  )
}

/** Delete all asks first: it can remove a lot at once (Undo still brings it back) */
function DeleteConfirm({ count, onCancel, onConfirm }: { count: number; onCancel: () => void; onConfirm: () => void }) {
  const titleId = useId()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.scrollIntoView({ block: 'nearest' })
    ref.current?.querySelector<HTMLButtonElement>('button')?.focus()
  }, [])
  return (
    <div
      className={classes.times}
      ref={ref}
      role="group"
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key !== 'Escape') return
        event.stopPropagation()
        onCancel()
      }}
    >
      <Text id={titleId} size="sm" fw={600}>Delete {plural(count, 'cell')}?</Text>
      <Text size="sm" c="dimmed" mt={4}>Removes every selected assignment, leave and open shift. Locked cells stay. Undo brings them back.</Text>
      <Group gap={8} mt={12} justify="flex-end">
        <Button variant="default" size="xs" onClick={onCancel}>Cancel</Button>
        <Button color="red" size="xs" onClick={onConfirm}>Delete all</Button>
      </Group>
    </div>
  )
}
