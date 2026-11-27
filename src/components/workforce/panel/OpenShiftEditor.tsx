import { Menu } from '@mantine/core'
import { UserPlus } from 'lucide-react'
import { findWatch, HOME_BRANCH, type OpenShiftEdit, type SegmentDetails } from '../data'
import { formatHeader } from '../../schedule/data'
import type { AssignSource, PanelItem } from '../model'
import type { EditCommit } from '../useScheduleEdits'
import { SegmentList, type PanelSegment, type SegmentHandlers } from './SegmentList'
import { TimesCard } from './TimesCard'
import { EmployeeRow } from './EmployeeRow'
import { SegmentFields } from './SegmentFields'
import { PanelFooter, PanelTabs } from './parts'
import { segmentDetails } from './options'
import { usePanelPeople } from './people'
import { BranchSelect } from './BranchSelect'
import { AttachmentsTab } from './AttachmentsTab'
import { attachmentCount, noAttachments } from '../attachments'
import classes from '../WorkforcePanel.module.css'

type OpenItem = Extract<PanelItem, { kind: 'open-shift' }>

/** An open or live shift: one segment, no employee yet. Changes save at once; Assign gives it to someone. */
export function OpenShiftEditor({ item, onEdit, onPreview, assigning, onAssign }: {
  item: OpenItem
  onEdit: (commit: EditCommit) => void
  onPreview: (action: string) => void
  assigning: boolean
  onAssign: (source: AssignSource | null) => void
}) {
  const { shift } = item
  const people = usePanelPeople()
  const segment: PanelSegment = { id: 'open', code: shift.code, start: shift.start, end: shift.end, details: shift.details }
  const details = segmentDetails(segment, findWatch(shift.watch).unit, shift.id, shift.location)
  const save = (edit: OpenShiftEdit) => onEdit({ open: [[shift.id, edit]] })
  const setDetails = (change: Partial<SegmentDetails>) => save({ details: { ...details, ...change } })
  const attachments = shift.attachments ?? noAttachments

  /** Picking someone gives them the shift (one place). Find an employee opens the Fill dialog. */
  const fill = (id: string | null) => {
    if (!id) return
    if (people.onFill) people.onFill(shift, [id])
    else onPreview('Fill the open shift')
  }
  const findFill = () => (people.onFindFill ? people.onFindFill(shift) : onPreview('Fill'))

  const handlers: SegmentHandlers = {
    onPatch: (_, patch) => {
      if (patch.cancelled !== undefined) return onPreview('Cancel open shift')
      if (patch.code) save({ code: patch.code })
    },
    onPreview,
    onFind: findFill,
  }

  const body = (
    <div className={classes.body}>
      {/* Empty until someone is picked: each pick fills one place, and the shift leaves the grid once it's filled */}
      <EmployeeRow value={null} day={shift.day} onChange={fill} hint="Pick someone to give them this shift" onPreview={onPreview} />
      <BranchSelect value={shift.branch ?? HOME_BRANCH} onChange={(value) => value && save({ branch: value === HOME_BRANCH ? undefined : value })} />
      <SegmentList blocks={[[segment]]} selectedId="open" onSelect={() => {}} handlers={handlers} />
      <TimesCard
        key={`${shift.start}:${shift.end}`}
        start={shift.start}
        end={shift.end}
        day={shift.day}
        onTimes={(start, end) => { save({ start, end }); return null }}
        actual={details.actual}
        onActual={(actual) => setDetails({ actual })}
      />
      <SegmentFields code={shift.code} onCode={(code) => save({ code })} details={details} scheduled={{ start: shift.start, end: shift.end }} onChange={setDetails} />
    </div>
  )

  return (
    <>
      <PanelTabs
        details={body}
        attachments={<AttachmentsTab value={attachments} onChange={(next) => save({ attachments: next })} day={shift.day} />}
        count={attachmentCount(attachments)}
        note={attachments.note}
      />
      <PanelFooter
        onPreview={onPreview}
        assigning={assigning}
        onAssign={assigning ? () => onAssign(null) : () => onAssign({
          chip: { segments: [{ code: shift.code, start: shift.start, end: shift.end, details } as PanelSegment] },
          from: `${shift.status === 'live' ? 'Live post' : 'Open shift'}, ${formatHeader(shift.day)}`,
          openShift: { id: shift.id, day: shift.day },
        })}
        canLeave={false}
        deleteLabel="Delete open shift"
        onDelete={() => save({ deleted: true })}
        moreItems={<Menu.Item leftSection={<UserPlus size={16} aria-hidden="true" />} onClick={findFill}>Fill…</Menu.Item>}
      />
    </>
  )
}
