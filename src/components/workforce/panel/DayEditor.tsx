import { useState } from 'react'
import { Button, Select, Stack, Text } from '@mantine/core'
import { Plus } from 'lucide-react'
import { formatHeader, segmentHours, segmentKind, type Chip, type Segment } from '../../schedule/data'
import { dayKey, shortName, type SegmentDetails, type WorkforceSegment } from '../data'
import { flattenDay, regroupDay, type AssignSource, type DaySegment, type PanelItem } from '../model'
import type { EditCommit } from '../useScheduleEdits'
import { SegmentList, type BlockInfo, type PanelSegment, type SegmentHandlers } from './SegmentList'
import { TimesCard } from './TimesCard'
import { EmployeeRow } from './EmployeeRow'
import { SegmentFields } from './SegmentFields'
import { AssignmentBanner, PanelFooter, PanelTabs } from './parts'
import { LeaveEntry, LeaveTypeField, type LeaveRequest } from './LeaveEntry'
import { ReadOnlyFields } from './ReadOnlyFields'
import { branches, segmentDetails } from './options'
import { formatSpan } from './format'
import classes from '../WorkforcePanel.module.css'

type DayItem = Extract<PanelItem, { kind: 'day' }>
type Preview = (action: string) => void

const newId = (prefix: string) => `${prefix}${Math.random().toString(36).slice(2, 8)}`
const isLeave = (segment: Segment) => segmentKind(segment) === 'leave'

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
 * A person's day in the panel: every segment of the day in one list (each assignment's first segment as the root,
 * the segments that touch it indented), and one form below for the selected segment. Every change saves at once
 * and the grid follows; times that stop touching move the segment to a line of its own.
 */
export function DayEditor({ item, onEdit, onUndo, onPreview, assigning, onAssign }: {
  item: DayItem
  onEdit: (commit: EditCommit) => void
  onUndo: () => void
  onPreview: Preview
  assigning: boolean
  onAssign: (source: AssignSource | null) => void
}) {
  const { member, watch, day } = item
  const items = flattenDay(item.blocks)
  const blocks = item.blocks.map((_, index) => items.filter((entry) => entry.from === index).map((entry) => entry.segment))
  const key = dayKey(member.id, day)

  const [selectedId, setSelectedId] = useState<string | null>((blocks[item.line] ?? blocks[0])?.[0]?.id ?? null)
  const [note, setNote] = useState<{ id: string; text: string; undo: boolean } | null>(null)
  const [branch, setBranch] = useState<string | null>(branches[0])
  const [leaveOpen, setLeaveOpen] = useState(false)

  const selected = items.find((entry) => entry.segment.id === selectedId)?.segment ?? items[0]?.segment ?? null

  /** Regroup and save. Returns an error and saves nothing when segments clash. */
  const save = (next: DaySegment[], focusId?: string): string | null => {
    const result = regroupDay(item.blocks, next, focusId)
    if (result.error) return result.error
    const text = focusId ? moveNote(items, result.chips, next, focusId) : null
    setNote(text && focusId ? { id: focusId, text, undo: true } : null)
    onEdit({ days: [[key, result.chips]] })
    return null
  }

  const patch = (id: string, change: Partial<WorkforceSegment>) => {
    const error = save(items.map((entry) => (entry.segment.id === id ? { ...entry, segment: { ...entry.segment, ...change } } : entry)))
    if (error) setNote({ id, text: `${error}. Not saved.`, undo: false })
  }

  const handlers: SegmentHandlers = {
    onPatch: patch,
    onDelete: (id) => {
      save(items.filter((entry) => entry.segment.id !== id))
      if (selectedId === id) setSelectedId(null)
    },
    onPreview,
  }

  /** The working segment that ends last, among `entries` */
  const latest = (entries: DaySegment[]) => entries
    .filter((entry) => !isLeave(entry.segment))
    .reduce<DaySegment | null>((last, entry) => (!last || segmentHours(entry.segment).end > segmentHours(last.segment).end ? entry : last), null)

  /** A new segment touches the day's last one, unless that belongs to another branch: then it starts an hour later. */
  const addSegment = () => {
    const id = newId('n')
    const last = latest(items.filter((entry) => !item.blocks[entry.from].branch))
    const other = last ? null : latest(items)
    const segment: PanelSegment = last
      ? { id, code: last.segment.code, start: segmentHours(last.segment).end, end: segmentHours(last.segment).end + 1 }
      : other
        ? { id, code: watch.code, start: segmentHours(other.segment).end + 1, end: segmentHours(other.segment).end + 2 }
        : { id, code: watch.code, start: watch.start, end: watch.end }
    const error = save([...items, { segment, from: last ? last.from : item.blocks.length }], id)
    if (error) onPreview(`Add segment (${error})`)
    else setSelectedId(id)
  }

  const deleteBlock = (index: number) => {
    setNote(null)
    onEdit({ days: [[key, item.blocks.filter((_, b) => b !== index)]] })
  }

  const moveBlock = (index: number, to: number) => {
    if (to === day) return
    const target = member.chips(to)
    const moved = item.blocks[index].segments.map((segment) => ({ segment: { ...segment, id: newId('m') }, from: target.length }))
    const result = regroupDay([...target, item.blocks[index]], [...flattenDay(target), ...moved])
    if (result.error) {
      setNote({ id: blocks[index][0].id, text: `Can’t move: on that day it ${result.error.toLowerCase()}.`, undo: false })
      return
    }
    setNote(null)
    onEdit({ days: [[key, item.blocks.filter((_, b) => b !== index)], [dayKey(member.id, to), result.chips]] })
  }

  const blockOf = (id: string | undefined) => blocks.findIndex((segments) => segments.some((segment) => segment.id === id))
  const selectedBlock = blockOf(selected?.id)
  const selectedChip = item.blocks[selectedBlock] ?? null
  /** Another branch's assignment: shown, not edited */
  const readOnly = !!selectedChip?.branch
  const noteBlock = note ? blockOf(note.id) : -1
  const blockInfo: BlockInfo[] = item.blocks.map((chip) => ({
    tag: chip.branch ? chip.branch.split(' - ')[0] : chip.outOfUnit ? chip.unit ?? 'Another unit' : undefined,
    readOnly: !!chip.branch,
  }))

  /* Leave: part of the day starts on the selected assignment (or the day's first one this branch can change) */
  const ownBlocks = item.blocks.map((_, index) => index).filter((index) => !item.blocks[index].branch)
  const leaveBlock = !readOnly && selectedBlock >= 0 ? selectedBlock : ownBlocks[0] ?? -1
  const leaveSpan = leaveBlock >= 0
    ? (() => {
      const hours = blocks[leaveBlock].map(segmentHours)
      return { start: Math.min(...hours.map((h) => h.start)), end: Math.max(...hours.map((h) => h.end)) }
    })()
    : { start: watch.start, end: watch.end }
  const replaces = ownBlocks.length ? ownBlocks.map((index) => `${blocks[index][0].code} ${spanOf(blocks[index])}`).join(' and ') : null

  const addLeave = (leave: LeaveRequest): string | null => {
    const id = newId('l')
    if (leave.allDay) {
      const segment: PanelSegment = { id, code: leave.code, start: 0, end: 24 }
      setNote(null)
      onEdit({ days: [[key, [{ segments: [segment] }, ...item.blocks.filter((chip) => chip.branch)]]] })
    } else {
      const error = save([...items, { segment: { id, code: leave.code, start: leave.start, end: leave.end }, from: item.blocks.length }])
      if (error) return error
    }
    setSelectedId(id)
    setLeaveOpen(false)
    return null
  }

  /** Assign: copy the selected assignment into assign mode. An empty day first gets the watch's regular shift. */
  const startAssign = () => {
    const from = `${shortName(member)}, ${formatHeader(day)}`
    if (selectedChip) return onAssign({ chip: selectedChip, from })
    const chip: Chip = { segments: [{ code: watch.code, start: watch.start, end: watch.end }] }
    onEdit({ days: [[key, [chip]]] })
    onAssign({ chip, from })
  }

  const form = selected && (() => {
    const unit = selectedChip?.outOfUnit ? selectedChip.unit ?? watch.unit : watch.unit
    const details = segmentDetails(selected, unit, `${key}:${selected.id}`)
    if (readOnly) return <ReadOnlyFields segment={selected} details={details} day={day} />
    const hours = segmentHours(selected)
    const setDetails = (change: Partial<SegmentDetails>) => patch(selected.id, { details: { ...details, ...change } })
    const leave = isLeave(selected)
    return (
      <>
        <TimesCard
          key={`${selected.id}:${hours.start}:${hours.end}`}
          start={hours.start}
          end={hours.end}
          day={day}
          onTimes={(start, end) => save(items.map((entry) => (entry.segment.id === selected.id ? { ...entry, segment: { ...entry.segment, start, end } } : entry)), selected.id)}
          onMoveDay={(to) => moveBlock(selectedBlock, to)}
          actual={leave ? null : details.actual}
          warnLong={!leave}
          onActual={leave ? undefined : (actual) => setDetails({ actual })}
        />
        {leave
          ? <LeaveTypeField code={selected.code} onCode={(code) => patch(selected.id, { code })} />
          : <SegmentFields code={selected.code} onCode={(code) => patch(selected.id, { code })} details={details} scheduled={hours} onChange={setDetails} />}
      </>
    )
  })()

  const details = (
    <div className={classes.body}>
      <AssignmentBanner chip={selectedChip} onPreview={onPreview} />
      <EmployeeRow value={member.id} onChange={() => onPreview('Reassign to another employee')} onPreview={onPreview} />
      <Select label="Branch" data={branches} value={selectedChip?.branch ?? branch} onChange={setBranch} allowDeselect={false} readOnly={readOnly} />
      <Stack gap={4}>
        {blocks.length
          ? (
            <SegmentList
              blocks={blocks}
              selectedId={selected?.id ?? null}
              onSelect={setSelectedId}
              handlers={handlers}
              note={note && noteBlock >= 0 ? { block: noteBlock, text: note.text, onUndo: note.undo ? () => { setNote(null); onUndo() } : undefined } : null}
              blockActions={{ day, onMove: moveBlock, onDelete: deleteBlock }}
              blockInfo={blockInfo}
            />
          )
          : <Text size="sm" c="dimmed">No assignment on this day yet.</Text>}
        <Button variant="subtle" color="gray" size="xs" leftSection={<Plus size={14} aria-hidden="true" />} className={classes.linkButton} onClick={addSegment}>
          Add segment
        </Button>
      </Stack>
      {leaveOpen
        ? <LeaveEntry span={leaveSpan} replaces={replaces} onAdd={addLeave} onCancel={() => setLeaveOpen(false)} />
        : form}
    </div>
  )

  return (
    <>
      <PanelTabs details={details} />
      <PanelFooter
        onPreview={onPreview}
        onAssign={assigning ? () => onAssign(null) : startAssign}
        canAssign={!readOnly}
        assigning={assigning}
        onLeave={() => setLeaveOpen(true)}
        canLeave={!leaveOpen}
        deleteLabel={selectedChip?.segments.every(isLeave) ? 'Delete leave' : 'Delete assignment'}
        onDelete={selectedBlock >= 0 && !readOnly ? () => deleteBlock(selectedBlock) : undefined}
      />
    </>
  )
}
