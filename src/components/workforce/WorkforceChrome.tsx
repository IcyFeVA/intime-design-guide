import type { Dispatch, ReactNode, SetStateAction } from 'react'
import { ActionIcon, Badge, Button, Group, Menu, Text, Tooltip } from '@mantine/core'
import {
  ArrowUpDown, Check, ChevronDown, ChevronsDownUp, ChevronsUpDown, Filter, Inbox, Megaphone, PanelRightClose, PanelRightOpen, Rows3, Search, TriangleAlert, Undo2, UserRoundPlus,
} from 'lucide-react'
import { PickerMenu, RangeStepper, ToolbarDivider } from '../schedule/ScheduleChrome'
import { viewDensities, workforceRanges, type ViewDensity, type WorkforceRange } from '../../tokens/workforce'
import { savedFilters, workforceTeams } from './data'
import classes from './Workforce.module.css'

/** View density: Compact (the default), Detailed and Stacked. */
export function DensityMenu({ value, onChange }: { value: ViewDensity; onChange: (value: ViewDensity) => void }) {
  const current = viewDensities.find((item) => item.key === value)!
  return (
    <Menu position="bottom-end" offset={6} width={280}>
      <Menu.Target>
        <ActionIcon variant="default" size={36} aria-label={`View density: ${current.label}`}><Rows3 size={18} /></ActionIcon>
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

/** Saved employee filters. Visual only for now: All employees stays selected and the others show a preview hint. */
function SavedFiltersMenu({ onPreview }: { onPreview: (action: string) => void }) {
  const [all, ...saved] = savedFilters
  const item = (filter: (typeof savedFilters)[number]) => {
    const checked = filter.key === all.key
    return (
      <Menu.Item
        key={filter.key}
        onClick={() => !checked && onPreview(`Saved filter: ${filter.label}`)}
        leftSection={<span className={classes.savedDot} data-checked={checked || undefined} aria-hidden="true" />}
        rightSection={<Text size="sm" c="dimmed" className="tabular">{filter.count}</Text>}
        classNames={{ item: classes.savedItem }}
      >
        <Text size="sm">{filter.label}</Text>
        {filter.description && <Text size="xs" c="dimmed">{filter.description}</Text>}
      </Menu.Item>
    )
  }
  return (
    <Menu position="bottom-start" offset={4} width={300}>
      <Menu.Target>
        <Button
          variant="default"
          size="sm"
          fw={400}
          leftSection={<Filter size={16} aria-hidden="true" />}
          rightSection={<ChevronDown size={16} aria-hidden="true" />}
          aria-label={`Employees: ${all.label}`}
        >
          {all.label}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>Saved filters</Menu.Label>
        {item(all)}
        <Menu.Divider />
        {saved.map(item)}
        <Menu.Divider />
        <Text size="xs" c="dimmed" px="sm" py={6}>Filters are managed in Employee Settings. Coverage counts always include the full unit.</Text>
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
  range, onRange, days, anchor, onAnchorChange, team, onTeam, underCount, onPreview,
}: {
  range: WorkforceRange
  onRange: (range: WorkforceRange) => void
  days: number[]
  anchor: number
  onAnchorChange: Dispatch<SetStateAction<number>>
  team: string
  onTeam: (team: string) => void
  /** Watch-days below target in the range */
  underCount: number
  /** A control that is not built yet was used */
  onPreview: (action: string) => void
}) {
  const labelled = (label: string, Icon: typeof Search, count?: ReactNode) => (
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
  )
  return (
    <div className={classes.toolbar}>
      <RangeStepper range={range} days={days} anchor={anchor} onAnchorChange={onAnchorChange} />
      <PickerMenu label="Range" value={range} options={workforceRanges.map(({ key, label }) => ({ key, label }))} onChange={onRange} />
      <ToolbarDivider />
      <PickerMenu label="Team" value={team} options={workforceTeams} onChange={onTeam} />
      <SavedFiltersMenu onPreview={onPreview} />
      <div className={classes.spacer} />
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
      {labelled('Approvals', Inbox, <Count value={3} color="red" />)}
      {labelled('Posts', Megaphone, <Count value={2} />)}
      {labelled('Mandate', UserRoundPlus)}
    </div>
  )
}

/** Sort, collapse/expand all, density, undo and the panel toggle: the right side of the title row. */
export function WorkforceViewActions({ density, onDensity, panelOpen, onTogglePanel, onSort, allCollapsed, onCollapseAll, onPreview }: {
  density: ViewDensity
  onDensity: (density: ViewDensity) => void
  panelOpen: boolean
  onTogglePanel: () => void
  onSort: () => void
  /** Every watch is collapsed: the toggle offers Expand all */
  allCollapsed: boolean
  /** true collapses every watch and its staffing rows, false expands them all */
  onCollapseAll: (collapse: boolean) => void
  onPreview: (action: string) => void
}) {
  const icon = (label: string, Icon: typeof Search, onClick: () => void) => (
    <Tooltip label={label}>
      <ActionIcon variant="default" size={36} aria-label={label} onClick={onClick}><Icon size={18} /></ActionIcon>
    </Tooltip>
  )
  return (
    <Group gap={8} wrap="nowrap">
      {icon('Sort', ArrowUpDown, onSort)}
      {allCollapsed
        ? icon('Expand all', ChevronsUpDown, () => onCollapseAll(false))
        : icon('Collapse all', ChevronsDownUp, () => onCollapseAll(true))}
      <DensityMenu value={density} onChange={onDensity} />
      {icon('Undo', Undo2, () => onPreview('Undo'))}
      <ActionIcon variant={panelOpen ? 'light' : 'default'} color={panelOpen ? 'intime' : undefined} size={36} aria-label="Details panel" aria-pressed={panelOpen} onClick={onTogglePanel}>
        {panelOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
      </ActionIcon>
    </Group>
  )
}
