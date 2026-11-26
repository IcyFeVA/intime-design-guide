import { useState } from 'react'
import { ActionIcon, Button, Menu, Popover, Select, Stack, Text, Tooltip } from '@mantine/core'
import { DatePicker } from '@mantine/dates'
import { CalendarArrowUp, Ellipsis, Plus, Trash2 } from 'lucide-react'
import { segmentHours, segmentKind, type Chip } from '../../schedule/data'
import { dayKey, type WorkforceSegment } from '../data'
import { flattenDay, regroupDay, type DaySegment, type PanelItem } from '../model'
import type { EditCommit } from '../useScheduleEdits'
import { BlockCard, type PanelSegment, type SegmentHandlers } from './BlockCard'
import { EmployeeRow } from './EmployeeRow'
import { SegmentFields } from './SegmentFields'
import { PanelFooter, PanelTabs } from './parts'
import { branches, segmentDetails } from './options'
import { formatSpan } from './format'
import classes from '../WorkforcePanel.module.css'

type DayItem = Extract<PanelItem, { kind: 'day' }>
type Preview = (action: string) => void

const DAY_MS = 86_400_000
const toIso = (day: number) => new Date(day * DAY_MS).toISOString().slice(0, 10)
const fromIso = (value: string) => Math.round(Date.parse(`${value}T00:00:00Z`) / DAY_MS)
const newId = (prefix: string) => `${prefix}${Math.random().toString(36).slice(2, 8)}`

/** "08:00–17:00" for a set of segments */
const spanOf = (segments: WorkforceSegment[]) => {
  const hours = segments.map(segmentHours)
  return formatSpan(Math.min(...hours.map((item) => item.start)), Math.max(...hours.map((item) => item.end)))
}

/** After a save: did the edited segment leave its block, or join another one? */
function moveNote(before: DaySegment[], after: Chip[], next: DaySegment[], id: string): string | null {
  const old = before.find((item) => item.segment.id === id)
  if (!old) return null
  const oldMates = before.filter((item) => item.from === old.from && item.segment.id !== id).map((item) => item.segment.id)
  const block = after.find((chip) => chip.segments.some((segment: WorkforceSegment) => segment.id === id))
  const mates = (block?.segments ?? []).map((segment: WorkforceSegment) => segment.id!).filter((mate) => mate !== id)
  const segmentsOf = (ids: string[]) => next.filter((item) => ids.includes(item.segment.id)).map((item) => item.segment)
  if (oldMates.length && !oldMates.some((mate) => mates.includes(mate))) return `Doesn’t touch ${spanOf(segmentsOf(oldMates))}. It shows on its own line.`
  const joined = mates.filter((mate) => !oldMates.includes(mate))
  if (joined.length) return `Touches ${spanOf(segmentsOf(joined))}, so it joins that line.`
  return null
}

/**
 * A person's day in the panel: every block (cell) of the day as a card, the clicked one open. Every change saves
 * at once and the grid follows; times that stop touching move the segment to a line of its own.
 */
export function DayEditor({ item, onEdit, onUndo, onPreview }: { item: DayItem; onEdit: (commit: EditCommit) => void; onUndo: () => void; onPreview: Preview }) {
  const { member, watch, day } = item
  const items = flattenDay(item.blocks)
  const blocks = item.blocks.map((_, index) => items.filter((entry) => entry.from === index).map((entry) => entry.segment))
  const clicked = blocks[item.line] ?? []

  const [expandedId, setExpandedId] = useState<string | null>(clicked[0]?.id ?? null)
  const [openBlocks, setOpenBlocks] = useState<ReadonlySet<string>>(() => new Set(clicked[0] ? [clicked[0].id] : []))
  const [note, setNote] = useState<{ id: string; text: string; undo: boolean } | null>(null)
  const [branch, setBranch] = useState<string | null>(branches[0])
  const [moving, setMoving] = useState<number | null>(null)

  const key = dayKey(member.id, day)

  /** Regroup and save. Returns an error and saves nothing when segments clash. */
  const save = (next: DaySegment[], focusId?: string): string | null => {
    const result = regroupDay(item.blocks, next, focusId)
    if (result.error) return result.error
    const text = focusId ? moveNote(items, result.chips, next, focusId) : null
    setNote(text && focusId ? { id: focusId, text, undo: true } : null)
    onEdit({ days: [[key, result.chips]] })
    return null
  }

  const handlers: SegmentHandlers = {
    onTimes: (id, start, end) => save(items.map((entry) => (entry.segment.id === id ? { ...entry, segment: { ...entry.segment, start, end } } : entry)), id),
    onPatch: (id, patch) => {
      const error = save(items.map((entry) => (entry.segment.id === id ? { ...entry, segment: { ...entry.segment, ...patch } } : entry)))
      if (error) setNote({ id, text: `${error}. Not saved.`, undo: false })
    },
    onDelete: (id) => {
      save(items.filter((entry) => entry.segment.id !== id))
      if (expandedId === id) setExpandedId(null)
    },
    onPreview,
  }

  const addSegment = () => {
    const id = newId('n')
    const last = items
      .filter((entry) => segmentKind(entry.segment) !== 'leave')
      .reduce<DaySegment | null>((latest, entry) => (!latest || segmentHours(entry.segment).end > segmentHours(latest.segment).end ? entry : latest), null)
    const segment: PanelSegment = last
      ? { id, code: last.segment.code, start: segmentHours(last.segment).end, end: segmentHours(last.segment).end + 1 }
      : { id, code: watch.code, start: watch.start, end: watch.end }
    const error = save([...items, { segment, from: last ? last.from : item.blocks.length }], id)
    if (error) onPreview(`Add segment (${error})`)
    else setExpandedId(id)
  }

  const deleteBlock = (index: number) => {
    setNote(null)
    onEdit({ days: [[key, item.blocks.filter((_, b) => b !== index)]] })
  }

  const moveBlock = (index: number, to: number) => {
    setMoving(null)
    if (to === day) return
    const target = member.chips(to)
    const moved = item.blocks[index].segments.map((segment) => ({ segment: { ...segment, id: newId('m') }, from: target.length }))
    const result = regroupDay([...target, item.blocks[index]], [...flattenDay(target), ...moved])
    const first = blocks[index][0]
    if (result.error) {
      setNote({ id: first.id, text: `Can’t move: on that day it ${result.error.toLowerCase()}.`, undo: false })
      return
    }
    setNote(null)
    onEdit({ days: [[key, item.blocks.filter((_, b) => b !== index)], [dayKey(member.id, to), result.chips]] })
  }

  const isOpen = (segments: PanelSegment[]) => segments.some((segment) => segment.id === expandedId) || openBlocks.has(segments[0].id)
  const toggle = (segments: PanelSegment[]) => {
    const open = isOpen(segments)
    setOpenBlocks((set) => {
      const next = new Set(set)
      if (open) next.delete(segments[0].id)
      else next.add(segments[0].id)
      return next
    })
    if (open && segments.some((segment) => segment.id === expandedId)) setExpandedId(null)
  }

  const current = blocks.findIndex((segments) => segments.some((segment) => segment.id === expandedId))
  const footerBlock = current >= 0 ? current : blocks[item.line] ? item.line : -1

  const details = (
    <div className={classes.body}>
      <EmployeeRow value={member.id} onChange={() => onPreview('Reassign to another employee')} onPreview={onPreview} />
      <Select label="Branch" data={branches} value={branch} onChange={setBranch} allowDeselect={false} />
      <Stack gap={8}>
        {blocks.map((segments, index) => (
          <BlockCard
            key={segments[0].id}
            segments={segments}
            open={isOpen(segments)}
            onToggle={() => toggle(segments)}
            expandedId={expandedId}
            onExpand={setExpandedId}
            note={note && segments.some((segment) => segment.id === note.id)
              ? { text: note.text, onUndo: note.undo ? () => { setNote(null); onUndo() } : undefined }
              : null}
            handlers={handlers}
            menu={(
              <Popover opened={moving === index} onChange={(opened) => !opened && setMoving(null)} position="bottom-end" trapFocus>
                <Popover.Target>
                  <div>
                    <Menu position="bottom-end">
                      <Menu.Target>
                        <Tooltip label="Block actions">
                          <ActionIcon variant="subtle" color="gray" size={28} aria-label={`Actions for ${spanOf(segments)}`}><Ellipsis size={16} /></ActionIcon>
                        </Tooltip>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item leftSection={<CalendarArrowUp size={16} aria-hidden="true" />} onClick={() => setMoving(index)}>Move to another day…</Menu.Item>
                        <Menu.Item color="red" leftSection={<Trash2 size={16} aria-hidden="true" />} onClick={() => deleteBlock(index)}>Delete block</Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </div>
                </Popover.Target>
                <Popover.Dropdown>
                  <Text size="sm" fw={600} mb={6}>Move {spanOf(segments)} to</Text>
                  <DatePicker defaultDate={toIso(day)} value={toIso(day)} onChange={(value) => value && moveBlock(index, fromIso(value))} />
                </Popover.Dropdown>
              </Popover>
            )}
            renderFields={(segment) => {
              const value = segmentDetails(segment, watch.unit, `${key}:${segment.id}`)
              return (
                <SegmentFields
                  details={value}
                  scheduled={segmentHours(segment)}
                  onChange={(patch) => handlers.onPatch(segment.id, { details: { ...value, ...patch } })}
                />
              )
            }}
          />
        ))}
      </Stack>
      {!blocks.length && <Text size="sm" c="dimmed">No assignment on this day yet.</Text>}
      <Button variant="subtle" color="gray" size="xs" leftSection={<Plus size={14} aria-hidden="true" />} className={classes.linkButton} onClick={addSegment}>
        Add segment
      </Button>
    </div>
  )

  return (
    <>
      <PanelTabs details={details} />
      <PanelFooter
        onPreview={onPreview}
        canLeave={blocks.length > 0}
        deleteLabel="Delete block"
        onDelete={footerBlock >= 0 ? () => deleteBlock(footerBlock) : undefined}
      />
    </>
  )
}
