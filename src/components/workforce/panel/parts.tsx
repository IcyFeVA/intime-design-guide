import { ActionIcon, Alert, Anchor, Button, Menu, Tabs, Text, Tooltip } from '@mantine/core'
import { ArrowUpRight, Check, Ellipsis, History, Lock, PlaneTakeoff, Plus, StickyNote, Trash2 } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import type { Chip } from '../../schedule/data'
import { NoteText } from './AttachmentsTab'
import classes from '../WorkforcePanel.module.css'

type Preview = (action: string) => void

/**
 * The same footer in every state: Assign, Leave and more. Buttons that don't apply are disabled.
 * Assign starts assign mode (click cells to give them the shift); while it's on, the button ends it.
 */
export function PanelFooter({ onPreview, onAssign, canAssign = true, assigning = false, onLeave, onDelete, deleteLabel = 'Delete', canLeave = true, moreItems }: {
  onPreview: Preview
  /** Starts assign mode, or ends it while `assigning`. Missing: Assign is preview only. */
  onAssign?: () => void
  canAssign?: boolean
  assigning?: boolean
  /** Opens the leave entry. Missing: Leave is preview only. */
  onLeave?: () => void
  /** Missing: Delete is disabled */
  onDelete?: () => void
  deleteLabel?: string
  canLeave?: boolean
  /** Extra ⋯ items, above History (e.g. the bulk panel's Load from template and Paste) */
  moreItems?: ReactNode
}) {
  return (
    <div className={classes.footer}>
      {assigning ? (
        <Button variant="light" color="intime" className={classes.grow} leftSection={<Check size={16} aria-hidden="true" />} onClick={onAssign}>Done assigning</Button>
      ) : (
        <Button color="intime" className={classes.grow} leftSection={<Plus size={16} aria-hidden="true" />} onClick={onAssign ?? (() => onPreview('Assign'))} disabled={!canAssign}>
          Assign
        </Button>
      )}
      <Button variant="default" leftSection={<PlaneTakeoff size={16} aria-hidden="true" />} onClick={onLeave ?? (() => onPreview('Leave'))} disabled={!canLeave}>Leave</Button>
      <Menu position="top-end" offset={6}>
        <Menu.Target>
          <Tooltip label="More actions">
            <ActionIcon variant="default" size={36} aria-label="More actions"><Ellipsis size={18} /></ActionIcon>
          </Tooltip>
        </Menu.Target>
        <Menu.Dropdown>
          {moreItems}
          <Menu.Item leftSection={<History size={16} aria-hidden="true" />} onClick={() => onPreview('History')}>History</Menu.Item>
          <Menu.Divider />
          <Menu.Item color="red" leftSection={<Trash2 size={16} aria-hidden="true" />} onClick={onDelete} disabled={!onDelete}>{deleteLabel}</Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </div>
  )
}

/**
 * Details and Attachments (tags, assets, tasks and the note; `count` covers all four). The note also shows,
 * read-only, at the end of Details, with a link to edit it.
 */
export function PanelTabs({ details, attachments, count, note }: {
  details: ReactNode
  attachments: ReactNode
  count: number
  note?: string
}) {
  const [tab, setTab] = useState<string | null>('details')
  const root = useRef<HTMLDivElement>(null)
  /** Edit: open Attachments and put the cursor in the note */
  const editNote = () => {
    setTab('attachments')
    requestAnimationFrame(() => root.current?.querySelector<HTMLTextAreaElement>('textarea[data-note]')?.focus())
  }
  return (
    <Tabs ref={root} value={tab} onChange={setTab} classNames={{ root: classes.tabs, list: classes.tabList, panel: classes.tabPanel }}>
      <Tabs.List>
        <Tabs.Tab value="details">Details</Tabs.Tab>
        <Tabs.Tab value="attachments">Attachments <Text span c="dimmed" inherit className="tabular">({count})</Text></Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="details">
        {details}
        {note?.trim() && (
          <section className={classes.latestNote} aria-label="Note">
            <div className={classes.latestNoteHeading}>
              <h5 className={classes.attachHeading}><StickyNote size={14} aria-hidden="true" />Note</h5>
              <Anchor component="button" type="button" size="xs" aria-label="Edit note" onClick={editNote}>Edit</Anchor>
            </div>
            <NoteText text={note} />
          </section>
        )}
      </Tabs.Panel>
      <Tabs.Panel value="attachments">{attachments}</Tabs.Panel>
    </Tabs>
  )
}

/**
 * About the selected assignment. Locked (set outside scheduling, e.g. a court date): read-only. Out of branch (another
 * precinct) and out of unit (another unit here): where it's worked; both stay editable.
 */
export function AssignmentBanner({ chip }: { chip: Chip | null }) {
  if (chip?.locked) {
    return (
      <Alert variant="light" color="gray" icon={<Lock size={18} aria-hidden="true" />} classNames={{ root: classes.banner, message: classes.bannerMessage }}>
        Set by {chip.locked}. You can’t change it here.
      </Alert>
    )
  }
  if (chip?.branch) {
    return (
      <Alert variant="light" color="gray" icon={<ArrowUpRight size={18} aria-hidden="true" />} classNames={{ root: classes.banner, message: classes.bannerMessage }}>
        Working out of branch
      </Alert>
    )
  }
  if (chip?.outOfUnit) {
    return (
      <Alert variant="light" color="intime" icon={<ArrowUpRight size={18} aria-hidden="true" />} classNames={{ root: classes.banner, message: classes.bannerMessage }}>
        Working for {chip.unit ?? 'another unit'} (out of unit)
      </Alert>
    )
  }
  return null
}
