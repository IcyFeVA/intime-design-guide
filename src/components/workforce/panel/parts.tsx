import { ActionIcon, Button, Menu, Tabs, Text, Tooltip } from '@mantine/core'
import { Ellipsis, History, Paperclip, PlaneTakeoff, Plus, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import classes from '../WorkforcePanel.module.css'

type Preview = (action: string) => void

/** The same footer in every state: Assign, Leave and more. Buttons that don't apply are disabled. */
export function PanelFooter({ onPreview, onDelete, deleteLabel = 'Delete', canLeave = true }: {
  onPreview: Preview
  /** Missing: Delete is disabled */
  onDelete?: () => void
  deleteLabel?: string
  canLeave?: boolean
}) {
  return (
    <div className={classes.footer}>
      <Button color="intime" className={classes.grow} leftSection={<Plus size={16} aria-hidden="true" />} onClick={() => onPreview('Assign')}>Assign</Button>
      <Button variant="default" leftSection={<PlaneTakeoff size={16} aria-hidden="true" />} onClick={() => onPreview('Leave')} disabled={!canLeave}>Leave</Button>
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
