import { ActionIcon, Alert, Anchor, Button, Menu, Tabs, Text, Tooltip } from '@mantine/core'
import { ArrowUpRight, Check, Ellipsis, History, Lock, Paperclip, PlaneTakeoff, Plus, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import type { Chip } from '../../schedule/data'
import classes from '../WorkforcePanel.module.css'

type Preview = (action: string) => void

/**
 * The same footer in every state: Assign, Leave and more. Buttons that don't apply are disabled.
 * Assign starts assign mode (click cells to give them the shift); while it's on, the button ends it.
 */
export function PanelFooter({ onPreview, onAssign, canAssign = true, assigning = false, onLeave, onDelete, deleteLabel = 'Delete', canLeave = true }: {
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
          <Menu.Item leftSection={<History size={16} aria-hidden="true" />} onClick={() => onPreview('History')}>History</Menu.Item>
          <Menu.Divider />
          <Menu.Item color="red" leftSection={<Trash2 size={16} aria-hidden="true" />} onClick={onDelete} disabled={!onDelete}>{deleteLabel}</Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </div>
  )
}

/** Details and Attachments. Notes will live in Attachments, with tags, assets and tasks. */
export function PanelTabs({ details }: { details: ReactNode }) {
  return (
    <Tabs defaultValue="details" classNames={{ root: classes.tabs, list: classes.tabList, panel: classes.tabPanel }}>
      <Tabs.List>
        <Tabs.Tab value="details">Details</Tabs.Tab>
        <Tabs.Tab value="attachments">Attachments <Text span c="dimmed" inherit>(0)</Text></Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="details">{details}</Tabs.Panel>
      <Tabs.Panel value="attachments">
        <div className={classes.empty}>
          <Paperclip size={28} strokeWidth={1.5} aria-hidden="true" />
          <Text size="sm" fw={600} c="var(--text-default)">No attachments</Text>
          <Text size="sm">Tags, assets, tasks and notes for this activity are coming.</Text>
        </div>
      </Tabs.Panel>
    </Tabs>
  )
}

/** "84th Precinct - Brooklyn" → "84th Precinct" */
const branchName = (branch: string) => branch.split(' - ')[0]

/**
 * Where the selected assignment is worked, when it isn't this unit. Out of unit (same precinct) stays editable;
 * out of branch (another precinct) is read-only, with a way to open it there.
 */
export function AssignmentBanner({ chip, onPreview }: { chip: Chip | null; onPreview: Preview }) {
  if (chip?.branch) {
    const name = branchName(chip.branch)
    return (
      <Alert variant="light" color="gray" icon={<Lock size={18} aria-hidden="true" />} classNames={{ root: classes.banner, message: classes.bannerMessage }}>
        Working at {name}. Only {name} can change this.
        <Anchor component="button" type="button" size="sm" fw={600} className={classes.bannerLink} onClick={() => onPreview(`Open in ${name}`)}>
          Open in {name} <ArrowUpRight size={14} aria-hidden="true" />
        </Anchor>
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
