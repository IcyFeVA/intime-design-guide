import { useState } from 'react'
import { Select } from '@mantine/core'
import { findWatch, type OpenShiftEdit } from '../data'
import type { PanelItem } from '../model'
import type { EditCommit } from '../useScheduleEdits'
import { BlockCard, type PanelSegment, type SegmentHandlers } from './BlockCard'
import { EmployeeRow } from './EmployeeRow'
import { SegmentFields } from './SegmentFields'
import { PanelFooter, PanelTabs } from './parts'
import { branches, segmentDetails } from './options'
import classes from '../WorkforcePanel.module.css'

type OpenItem = Extract<PanelItem, { kind: 'open-shift' }>

/** An open or live shift: one segment, no employee yet. Changes save at once; Assign gives it to someone. */
export function OpenShiftEditor({ item, onEdit, onPreview }: { item: OpenItem; onEdit: (commit: EditCommit) => void; onPreview: (action: string) => void }) {
  const { shift } = item
  const [employee, setEmployee] = useState<string | null>(null)
  const [branch, setBranch] = useState<string | null>(branches[0])
  const [expanded, setExpanded] = useState<string | null>('open')
  const segment: PanelSegment = { id: 'open', code: shift.code, start: shift.start, end: shift.end, details: shift.details }
  const save = (edit: OpenShiftEdit) => onEdit({ open: [[shift.id, edit]] })

  const handlers: SegmentHandlers = {
    onTimes: (_, start, end) => { save({ start, end }); return null },
    onPatch: (_, patch) => {
      if (patch.cancelled !== undefined) return onPreview('Cancel open shift')
      const edit: OpenShiftEdit = {}
      if (patch.code) edit.code = patch.code
      if (patch.details) edit.details = patch.details
      save(edit)
    },
    onPreview,
  }

  const details = (
    <div className={classes.body}>
      <EmployeeRow value={employee} onChange={setEmployee} onPreview={onPreview} />
      <Select label="Branch" data={branches} value={branch} onChange={setBranch} allowDeselect={false} />
      <BlockCard
        segments={[segment]}
        open={expanded !== null}
        onToggle={() => setExpanded(expanded ? null : 'open')}
        expandedId={expanded}
        onExpand={setExpanded}
        handlers={handlers}
        renderFields={() => {
          const value = segmentDetails(segment, findWatch(shift.watch).unit, shift.id, shift.location)
          return <SegmentFields details={value} scheduled={{ start: shift.start, end: shift.end }} onChange={(patch) => save({ details: { ...value, ...patch } })} />
        }}
      />
    </div>
  )

  return (
    <>
      <PanelTabs details={details} />
      <PanelFooter onPreview={onPreview} canLeave={false} deleteLabel="Delete open shift" onDelete={() => save({ deleted: true })} />
    </>
  )
}
