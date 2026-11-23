import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { ActionIcon, Badge, Button, Group, Menu, Text, Tooltip } from '@mantine/core'
import {
  ArrowUpDown, Check, Inbox, Megaphone, PanelRightClose, PanelRightOpen, Rows3, Search, TriangleAlert, Undo2, UserRoundPlus,
} from 'lucide-react'
import { PickerMenu, RangeStepper, ToolbarDivider } from '../schedule/ScheduleChrome'
import { viewDensities, workforceRanges, type ViewDensity, type WorkforceRange } from '../../tokens/workforce'
import { employeeFilters, type EmployeeFilter } from './model'
import { workforceTeams } from './data'
import classes from './Workforce.module.css'

/** View density: Detailed now; Compact and Stacked are listed but not built yet. */
export function DensityMenu({ value, onChange }: { value: ViewDensity; onChange: (value: ViewDensity) => void }) {
  const current = viewDensities.find((item) => item.key === value)!
  return (
    <Menu position="bottom-end" offset={6} width={280}>
      <Menu.Target>
        <Tooltip label="View density">
          <ActionIcon variant="default" size={36} aria-label={`View density: ${current.label}`}><Rows3 size={18} /></ActionIcon>
        </Tooltip>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>View density</Menu.Label>
        {viewDensities.map((item) => (
          <Menu.Item
            key={item.key}
            disabled={!item.available}
            onClick={() => onChange(item.key)}
            rightSection={item.key === value
              ? <Check size={14} aria-hidden="true" />
              : !item.available && <Badge size="xs" variant="light" color="gray">Coming soon</Badge>}
          >
            <Text size="sm">{item.label}</Text>
            <Text size="xs" c="dimmed">{item.description}</Text>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  )
}

/** Count badge inside a toolbar button */
const Count = ({ value, color = 'gray' }: { value: number; color?: string }) => (
  <Badge size="sm" circle variant={color === 'red' ? 'filled' : 'light'} color={color} className="tabular">{value}</Badge>
)

/** Filters and status buttons: the frame's toolbar row. */
export function WorkforceToolbar({
  range, onRange, days, anchor, onAnchorChange, team, onTeam, filter, onFilter, underCount, onPreview,
}: {
  range: WorkforceRange
  onRange: (range: WorkforceRange) => void
  days: number[]
  anchor: number
  onAnchorChange: Dispatch<SetStateAction<number>>
  team: string
  onTeam: (team: string) => void
  filter: EmployeeFilter
  onFilter: (filter: EmployeeFilter) => void
  /** Watch-days below target in the range */
  underCount: number
  /** A control that is not built yet was used */
  onPreview: (action: string) => void
}) {
  const labelled = (label: string, Icon: typeof Search, count?: ReactNode) => (
    <Tooltip label={label}>
      <Button
        variant="default"
        size="sm"
        fw={400}
        aria-label={label}
        leftSection={<Icon size={16} aria-hidden="true" />}
        rightSection={count}
        onClick={() => onPreview(label)}
        classNames={{ label: classes.collapsibleLabel, section: classes.collapsibleSection }}
      >
        {label}
      </Button>
    </Tooltip>
  )
  return (
    <div className={classes.toolbar}>
      <RangeStepper range={range} days={days} anchor={anchor} onAnchorChange={onAnchorChange} />
      <PickerMenu label="Range" value={range} options={workforceRanges.map(({ key, label }) => ({ key, label }))} onChange={onRange} />
      <ToolbarDivider />
      <PickerMenu label="Team" value={team} options={workforceTeams} onChange={onTeam} />
      <PickerMenu label="Employees" value={filter} options={employeeFilters} onChange={onFilter} />
      <div className={classes.spacer} />
      <Tooltip label={`${underCount} understaffed: watch-days below the staff target in this range`}>
        <Button
          aria-label={`${underCount} understaffed`}
          variant="light"
          color={underCount ? 'red' : 'gray'}
          size="sm"
          fw={500}
          leftSection={<TriangleAlert size={16} aria-hidden="true" />}
          onClick={() => onPreview('Understaffed')}
        >
          <span className="tabular">{underCount}</span><span className={classes.collapsibleText}>&nbsp;understaffed</span>
        </Button>
      </Tooltip>
      {labelled('Approvals', Inbox, <Count value={3} color="red" />)}
      {labelled('Posts', Megaphone, <Count value={2} />)}
      {labelled('Mandate', UserRoundPlus)}
    </div>
  )
}

/** Search, sort, density, undo and the panel toggle: the right side of the title row. */
export function WorkforceViewActions({ density, onDensity, panelOpen, onTogglePanel, onSort, onPreview }: {
  density: ViewDensity
  onDensity: (density: ViewDensity) => void
  panelOpen: boolean
  onTogglePanel: () => void
  onSort: () => void
  onPreview: (action: string) => void
}) {
  const icon = (label: string, Icon: typeof Search, onClick: () => void) => (
    <Tooltip label={label}>
      <ActionIcon variant="default" size={36} aria-label={label} onClick={onClick}><Icon size={18} /></ActionIcon>
    </Tooltip>
  )
  return (
    <Group gap={8} wrap="nowrap">
      {icon('Search employees', Search, () => onPreview('Search'))}
      {icon('Sort', ArrowUpDown, onSort)}
      <DensityMenu value={density} onChange={onDensity} />
      {icon('Undo', Undo2, () => onPreview('Undo'))}
      <Tooltip label={panelOpen ? 'Hide details panel' : 'Show details panel'}>
        <ActionIcon variant={panelOpen ? 'light' : 'default'} color={panelOpen ? 'intime' : undefined} size={36} aria-label="Details panel" aria-pressed={panelOpen} onClick={onTogglePanel}>
          {panelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
        </ActionIcon>
      </Tooltip>
    </Group>
  )
}
