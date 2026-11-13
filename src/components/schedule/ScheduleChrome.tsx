import { useState, type Dispatch, type ReactNode, type SetStateAction } from 'react'
import { useNavigate } from 'react-router'
import {
  ActionIcon, Button, Group, Indicator, Menu, Modal, SegmentedControl, Stack, Text, TextInput, Tooltip, UnstyledButton,
} from '@mantine/core'
import {
  BatteryFull, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, List, Logs, Maximize2, Menu as MenuIcon, RotateCcw, Signal,
  Search, SlidersHorizontal, UserRound, Wifi,
} from 'lucide-react'
import AppNav, { type AppNavProps } from '../app-nav/AppNav'
import type { ScheduleRange } from '../../tokens/schedule'
import { MOCK_TODAY, formatRange, shiftRange } from './data'
import classes from './ScheduleChrome.module.css'

export type ScheduleView = 'unit' | 'location'
const viewPaths: Record<ScheduleView, string> = { unit: '/patterns/team-view', location: '/patterns/location-view' }

/** Menu whose trigger looks like a select: label plus chevron, checkmark on the current option. */
export function PickerMenu<T extends string>({ value, options, onChange, label, leftSection }: {
  value: T
  options: { key: T; label: string }[]
  onChange: (value: T) => void
  label: string
  /** With an icon, the trigger shows `label` (e.g. Sort) instead of the current option */
  leftSection?: ReactNode
}) {
  const current = options.find((option) => option.key === value)
  return (
    <Menu position="bottom-start" offset={4}>
      <Menu.Target>
        <Button variant="default" size="sm" leftSection={leftSection} rightSection={<ChevronDown size={16} aria-hidden="true" />} aria-label={`${label}: ${current?.label}`} fw={400}>
          {leftSection ? label : current?.label}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>{label}</Menu.Label>
        {options.map((option) => (
          <Menu.Item key={option.key} onClick={() => onChange(option.key)} rightSection={option.key === value ? <Check size={14} aria-hidden="true" /> : null}>
            {option.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  )
}

/** Unit / Location tabs. In the guide each view has its own page, so the other tab opens that page. */
export function ViewTabs({ active }: { active: ScheduleView }) {
  const navigate = useNavigate()
  return (
    <div className={classes.viewTabs}>
      {(['unit', 'location'] as const).map((view) => (
        <UnstyledButton
          key={view}
          className={classes.viewTab}
          data-active={view === active || undefined}
          aria-pressed={view === active}
          onClick={() => view !== active && navigate(viewPaths[view])}
        >
          {view === 'unit' ? 'Unit' : 'Location'}
        </UnstyledButton>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Desktop                                                             */
/* ------------------------------------------------------------------ */

/**
 * App-shell mock for the desktop demos: collapsed nav, top bar, title with view tabs, a toolbar and the grid.
 * Includes the demo bar (status, Full screen, Reset demo).
 */
export function DesktopDemoFrame({ view, title = 'Team View', actions, nav, status, onReset, toolbar, children }: {
  /** Shows the Unit / Location tabs with this one active. Leave out for pages without tabs. */
  view?: ScheduleView
  title?: string
  /** Right side of the title row, e.g. an Add button */
  actions?: ReactNode
  /** Navigation setup. Defaults to a scheduler on Team View. */
  nav?: Pick<AppNavProps, 'roles' | 'defaultRole' | 'defaultActive'>
  status: ReactNode
  onReset: () => void
  toolbar: ReactNode
  children: ReactNode
}) {
  const [fullScreen, setFullScreen] = useState(false)
  const shell = (
    <div className={classes.shell} data-full-screen={fullScreen || undefined}>
      <AppNav roles={['employee', 'scheduler']} defaultRole="scheduler" defaultActive="team-view" {...nav} defaultExpanded={false} defaultPinned={false} />
      <div className={classes.main}>
        <div className={classes.topBar}>
          <Text size="md">Field Operations Division - ITME</Text>
          <Group gap={8} wrap="nowrap">
            <Indicator size={7} offset={3} color="var(--background-info)"><UserRound size={20} strokeWidth={1.75} aria-hidden="true" /></Indicator>
            <Text size="sm" fw={600}>John B. McLane</Text>
            <ChevronDown size={16} aria-hidden="true" />
          </Group>
        </div>
        <div className={classes.titleRow}>
          <h3 className={classes.title}>{title}</h3>
          {view && <ViewTabs active={view} />}
          {actions && <div className={classes.titleActions}>{actions}</div>}
        </div>
        <div className={classes.toolbar}>{toolbar}</div>
        {children}
      </div>
    </div>
  )
  return (
    <>
      <Group justify="space-between" px="md" py="xs" className={classes.demoBar} wrap="nowrap">
        <Text size="xs" c="dimmed" role="status">{status}</Text>
        <Group gap={4} wrap="nowrap">
          <Button variant="subtle" color="gray" size="compact-xs" leftSection={<Maximize2 size={14} />} onClick={() => setFullScreen(true)}>Full screen</Button>
          <Button variant="subtle" color="gray" size="compact-xs" leftSection={<RotateCcw size={14} />} onClick={onReset}>Reset demo</Button>
        </Group>
      </Group>
      {!fullScreen && shell}
      <Modal opened={fullScreen} onClose={() => setFullScreen(false)} fullScreen title={`${view === 'location' ? 'Location View' : title}, desktop`} padding={0} classNames={{ body: classes.modalBody, header: classes.modalHeader }}>
        {fullScreen && shell}
      </Modal>
    </>
  )
}

export function ToolbarDivider() {
  return <span className={classes.toolbarDivider} aria-hidden="true" />
}

/** Previous, date range, next and Today. Arrows move by the selected range. */
export function RangeStepper({ range, days, onAnchorChange, onPicker }: {
  range: ScheduleRange
  days: number[]
  onAnchorChange: Dispatch<SetStateAction<number>>
  onPicker: () => void
}) {
  const unit = range === 'month' ? 'month' : 'range'
  return (
    <>
      <Tooltip label={`Previous ${unit}`}>
        <ActionIcon variant="default" size={36} aria-label={`Previous ${unit}`} onClick={() => onAnchorChange((value) => shiftRange(range, value, -1))}><ChevronLeft size={18} /></ActionIcon>
      </Tooltip>
      <Button variant="default" size="sm" fw={400} leftSection={<CalendarDays size={18} aria-hidden="true" />} onClick={onPicker}>
        <span className="tabular">{formatRange(days)}</span>
      </Button>
      <Tooltip label={`Next ${unit}`}>
        <ActionIcon variant="default" size={36} aria-label={`Next ${unit}`} onClick={() => onAnchorChange((value) => shiftRange(range, value, 1))}><ChevronRight size={18} /></ActionIcon>
      </Tooltip>
      <Button variant="default" size="sm" fw={400} onClick={() => onAnchorChange(MOCK_TODAY)}>Today</Button>
    </>
  )
}

/** Search field for the grid's top-left corner. */
export function CoWorkerSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <TextInput
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      placeholder="Search co-workers"
      aria-label="Search co-workers"
      leftSection={<Search size={16} aria-hidden="true" />}
      w="100%"
    />
  )
}

/* ------------------------------------------------------------------ */
/* Mobile                                                              */
/* ------------------------------------------------------------------ */

/**
 * Phone mock for the mobile demos: status bar, header, title with view tabs, Week/Day switch and a filter menu.
 * Includes the demo bar (swipe buttons, status, Reset demo) and notes beside the phone.
 */
export function MobileDemoFrame({ view, status, onReset, onStep, mode, onModeChange, filters, overlay, notes, children }: {
  view: ScheduleView
  status: ReactNode
  onReset: () => void
  onStep: (direction: 1 | -1) => void
  mode: 'week' | 'day'
  onModeChange: (mode: 'week' | 'day') => void
  /** Content of the filter menu (Menu.Label / Menu.Item) */
  filters: ReactNode
  /** Pinned to the bottom of the screen, e.g. a coverage alert */
  overlay?: ReactNode
  notes: ReactNode
  children: ReactNode
}) {
  return (
    <>
      <MobileDemoBar status={status} onStep={onStep} onReset={onReset} />
      <MobileStage notes={notes}>
        <PhoneFrame overlay={overlay}>
          <div className={classes.phoneTitle}>
            <h3 className={classes.title}>Team View</h3>
            <Group justify="space-between" wrap="nowrap" mt="lg">
              <ViewTabs active={view} />
              <Group gap={8} wrap="nowrap">
                <SegmentedControl
                  value={mode}
                  onChange={(value) => onModeChange(value as 'week' | 'day')}
                  aria-label="View"
                  data={[
                    { value: 'week', label: <Tooltip label="Week"><span className={classes.segmentIcon}><List size={18} aria-label="Week" /></span></Tooltip> },
                    { value: 'day', label: <Tooltip label="Day"><span className={classes.segmentIcon}><Logs size={18} aria-label="Day" /></span></Tooltip> },
                  ]}
                />
                <Menu position="bottom-end" offset={4} withinPortal={false}>
                  <Menu.Target>
                    <Tooltip label="Filters"><ActionIcon variant="default" size={38} aria-label="Filters"><SlidersHorizontal size={18} /></ActionIcon></Tooltip>
                  </Menu.Target>
                  <Menu.Dropdown>{filters}</Menu.Dropdown>
                </Menu>
              </Group>
            </Group>
          </div>
          {children}
        </PhoneFrame>
      </MobileStage>
    </>
  )
}

/**
 * Phone mock: status bar and app header, then `header` (fixed) and `children` (scrolls).
 * `overlay` is pinned to the bottom of the screen.
 */
export function PhoneFrame({ header, overlay, children }: { header?: ReactNode; overlay?: ReactNode; children: ReactNode }) {
  return (
    <div className={classes.phone}>
      <div className={classes.statusBar} aria-hidden="true">
        <span className="tabular">9:41</span>
        <Group gap={6}><Signal size={16} /><Wifi size={16} /><BatteryFull size={20} /></Group>
      </div>
      <div className={classes.phoneHeader}>
        <Group gap={20} wrap="nowrap">
          <Indicator size={8} offset={2} position="bottom-end" color="var(--background-info)">
            <MenuIcon size={24} strokeWidth={1.75} aria-label="Open navigation" />
          </Indicator>
          <UserRound size={24} strokeWidth={1.75} aria-label="Profile" />
        </Group>
        <Text size="sm" c="dimmed" truncate>Field Operations Division - ITME</Text>
      </div>
      {header}
      <div className={classes.phoneScroll}>{children}</div>
      {overlay && <div className={classes.phoneOverlay}>{overlay}</div>}
    </div>
  )
}

/** Demo bar above a phone: swipe buttons, a status line and Reset demo. */
export function MobileDemoBar({ status, onStep, onReset }: { status: ReactNode; onStep: (direction: 1 | -1) => void; onReset: () => void }) {
  return (
    <Group justify="space-between" px="md" py="xs" className={classes.demoBar}>
      <Group gap={6}>
        <Button variant="default" size="compact-xs" leftSection={<ChevronLeft size={14} />} onClick={() => onStep(-1)}>Swipe right</Button>
        <Button variant="default" size="compact-xs" rightSection={<ChevronRight size={14} />} onClick={() => onStep(1)}>Swipe left</Button>
        <Text size="xs" c="dimmed" role="status">{status}</Text>
      </Group>
      <Button variant="subtle" color="gray" size="compact-xs" leftSection={<RotateCcw size={14} />} onClick={onReset}>Reset demo</Button>
    </Group>
  )
}

/** Dotted stage that holds a phone and its notes. */
export function MobileStage({ notes, children }: { notes: ReactNode; children: ReactNode }) {
  return (
    <div className={classes.mobileStage}>
      {children}
      <Stack gap="sm" maw={340} className={classes.mobileNotes}>{notes}</Stack>
    </div>
  )
}
